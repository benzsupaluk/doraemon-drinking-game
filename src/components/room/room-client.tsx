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
import { clearPlayerId, savePlayerId } from '@/lib/session'

export function RoomClient({ code, origin }: { code: string; origin: string }) {
    const { state, connection, error, setError, act, fatal } = useRoom(code)
    // Read straight from localStorage via an external store, so no setState in an effect.
    const playerId = usePlayerId(code)

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

    // The stored playerId is no longer usable (room gone, or we were removed):
    // clear it so the name screen comes back. Dropping it from the store makes
    // usePlayerId read null on its own.
    useEffect(() => {
        if (!state || !playerId || me) return
        clearPlayerId(code)
    }, [state, playerId, me, code])

    const isMyTurn = !!state && !!me && state.players[state.turnIndex]?.id === me.id

    useTurnAlert({ active: isMyTurn && state?.status === 'playing' && state.phase === 'idle' })
    useCardSounds(state?.currentCard?.id ?? null, state?.currentCard?.rank ?? null)
    usePlayerJoinSound(state?.players.length ?? 0, state?.status === 'lobby')

    const handleJoined = (id: string) => savePlayerId(code, id)

    // Polling has given up: show why and stop, instead of spinning forever.
    if (fatal && !state) return <ErrorScreen code={code} reason={fatal} />

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
        <main className="app-shell flex min-h-dvh flex-col items-center justify-center gap-4">
            <div className="size-12 animate-spin rounded-full border-4 border-dora-sky/30 border-t-dora-sky" />
            <p className="text-dora-cream/70">{label}</p>
        </main>
    )
}

function ErrorScreen({ code, reason }: { code: string; reason: string }) {
    return (
        <main className="app-shell flex min-h-dvh flex-col items-center justify-center gap-4 text-center">
            <span className="text-6xl">🫠</span>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                เข้าวง {code} ไม่ได้
            </h1>
            <p className="text-sm text-dora-cream/80">{reason}</p>
            <p className="text-xs text-dora-cream/50">ลองขอลิงก์ใหม่จากหัวตี้ หรือสร้างวงเองก็ได้</p>
            <div className="flex w-full max-w-xs flex-col gap-2 pt-2">
                <button
                    onClick={() => window.location.reload()}
                    className="glass rounded-2xl px-6 py-3 font-bold text-dora-cream"
                    style={{ fontFamily: 'var(--font-display)' }}
                >
                    ลองใหม่อีกครั้ง
                </button>
                <Link
                    href="/"
                    className="rounded-2xl px-6 py-3 text-sm font-semibold text-dora-sky"
                    style={{ fontFamily: 'var(--font-display)' }}
                >
                    กลับหน้าแรก
                </Link>
            </div>
        </main>
    )
}
