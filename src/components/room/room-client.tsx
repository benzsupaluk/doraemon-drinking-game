'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef } from 'react'
import { FinishedView } from './finished-view'
import { GameView } from './game-view'
import { JoinForm } from './join-form'
import { LobbyView } from './lobby-view'
import { useRoom } from '@/hooks/use-room'
import { CARD_RULES } from '@/lib/rules'
import { notifyMyTurn, playDrink, playFlip, playJoin, unlockAudio } from '@/lib/feedback'
import { usePlayerId } from '@/hooks/use-session'
import type { RoomState } from '@/lib/types'
import { clearPlayerId, savePlayerId } from '@/lib/session'

interface RoomClientProps {
    code: string
    origin: string
    /** Room state read on the server, so the first paint needs no round trip. */
    initialState: RoomState | null
    initialMissing: boolean
    /** Player id resolved from the cookie on the server, so SSR picks the right screen. */
    initialPlayerId: string | null
}

export function RoomClient({
    code,
    origin,
    initialState,
    initialMissing,
    initialPlayerId,
}: RoomClientProps) {
    const { state, connection, error, setError, act, fatal, adoptState } = useRoom(code, {
        initialState,
        initialMissing,
    })
    // Read straight from the cookie via an external store, so no setState in an
    // effect, and the server snapshot matches what SSR already rendered.
    const playerId = usePlayerId(code, initialPlayerId)

    // Browsers block audio until the user gestures. Someone rejoining a room
    // from localStorage may not have pressed anything yet, so catch the first tap.
    useEffect(() => {
        const unlock = () => unlockAudio()
        window.addEventListener('pointerdown', unlock, { once: true })
        return () => window.removeEventListener('pointerdown', unlock)
    }, [])

    const me = useMemo(
        () => state?.players.find((player) => player.id === playerId) ?? null,
        [state, playerId]
    )

    /**
     * Forget a stored playerId once our seat is really gone (the room was
     * restarted, or we were removed), so the name screen comes back. Dropping it
     * from the store makes usePlayerId read null on its own.
     *
     * The condition has to persist across two different state versions. Right
     * after joining we hold a freshly saved playerId while `state` is still the
     * pre-join snapshot that cannot contain us yet, and clearing on that single
     * frame would delete the id we just obtained and bounce us back to the join
     * form. A seat that is genuinely gone stays gone, so requiring two versions
     * costs nothing and rules the race out.
     *
     * In a completely idle room the version never moves, so a stale id can
     * linger in storage. That is only untidiness: the join form is shown
     * whenever `me` is missing regardless, and a successful join overwrites it.
     */
    const absenceRef = useRef({ version: -1, count: 0 })
    useEffect(() => {
        if (!state || !playerId || me) {
            absenceRef.current = { version: -1, count: 0 }
            return
        }
        if (state.version === absenceRef.current.version) return
        const count = absenceRef.current.count + 1
        absenceRef.current = { version: state.version, count }
        if (count >= 2) clearPlayerId(code)
    }, [state, playerId, me, code])

    const isMyTurn = !!state && !!me && state.players[state.turnIndex]?.id === me.id

    useTurnAlert({ active: isMyTurn && state?.status === 'playing' && state.phase === 'idle' })
    useCardSounds(state?.currentCard?.id ?? null, state?.currentCard?.rank ?? null)
    usePlayerJoinSound(state?.players.length ?? 0, state?.status === 'lobby')

    // Install the state that came back with the join, so `me` resolves on this
    // render instead of a poll later.
    const handleJoined = (id: string, joined: RoomState) => {
        adoptState(joined)
        savePlayerId(code, id)
    }

    // Polling has given up: show why and stop, instead of spinning forever.
    // This also covers a host cancelling the group mid-game — the room 404s, and
    // leaving the frozen game on screen would look like the app had hung.
    if (fatal) return <ErrorScreen code={code} reason={fatal} />

    if (!state) {
        return (
            <LoadingScreen
                label={
                    connection === 'lost'
                        ? `เชื่อมต่อไม่ได้ กำลังลองใหม่...`
                        : `กำลังเข้าวง ${code}...`
                }
            />
        )
    }

    if (!me) {
        return <JoinForm code={code} state={state} onJoined={handleJoined} />
    }

    const shared = { state, me, connection, error, setError, act, isMyTurn, origin }

    if (state.status === 'lobby') return <LobbyView {...shared} />
    if (state.status === 'finished') return <FinishedView {...shared} />
    return <GameView {...shared} />
}

/** Vibrate and chime whenever it becomes our turn, repeating until we act. */
function useTurnAlert({ active }: { active: boolean }) {
    useEffect(() => {
        if (!active) return
        notifyMyTurn()
        // If the phone is face down and nobody acts, remind them every 12s.
        const timer = setInterval(notifyMyTurn, 12_000)
        return () => clearInterval(timer)
    }, [active])
}

function useCardSounds(cardId: string | null, rank: string | null) {
    const previous = useRef<string | null>(null)
    useEffect(() => {
        if (!cardId || cardId === previous.current) {
            previous.current = cardId
            return
        }
        previous.current = cardId
        playFlip()
        const rule = rank ? CARD_RULES[rank as keyof typeof CARD_RULES] : null
        if (rule && rule.sips > 0) setTimeout(playDrink, 420)
    }, [cardId, rank])
}

function usePlayerJoinSound(count: number, inLobby: boolean) {
    const previous = useRef(count)
    useEffect(() => {
        if (inLobby && count > previous.current) playJoin()
        previous.current = count
    }, [count, inLobby])
}

function LoadingScreen({ label }: { label: string }) {
    return (
        <main className="app-shell flex min-h-dvh flex-col items-center justify-center gap-3">
            <div className="size-7 animate-spin rounded-full border-2 border-line border-t-accent" />
            <p className="text-[0.9375rem] text-muted">{label}</p>
        </main>
    )
}

function ErrorScreen({ code, reason }: { code: string; reason: string }) {
    return (
        <main className="app-shell flex min-h-dvh flex-col items-center justify-center gap-3 text-center">
            <h1 className="text-[1.1875rem] font-semibold">เข้าวง {code} ไม่ได้</h1>
            <p className="text-[0.9375rem] text-muted">{reason}</p>
            <div className="flex w-full max-w-[16rem] flex-col gap-2 pt-2">
                <button
                    onClick={() => window.location.reload()}
                    className="panel min-h-12 rounded-field px-5 text-[1.0625rem] font-semibold"
                >
                    ลองใหม่อีกครั้ง
                </button>
                <Link href="/" className="py-2 text-[0.9375rem] font-medium text-accent">
                    กลับหน้าแรก
                </Link>
            </div>
        </main>
    )
}
