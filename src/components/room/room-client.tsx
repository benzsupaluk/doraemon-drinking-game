'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { FinishedView } from './finished-view'
import { GameView } from './game-view'
import { JoinForm } from './join-form'
import { LobbyView } from './lobby-view'
import { useRoom } from '@/hooks/use-room'
import { CARD_RULES } from '@/lib/rules'
import { notifyMyTurn, playDrink, playFlip, playJoin, unlockAudio } from '@/lib/feedback'
import { clearPlayerId, loadPlayerId, savePlayerId } from '@/lib/session'

export function RoomClient({ code }: { code: string }) {
    const { state, connection, error, setError, act } = useRoom(code)
    const [playerId, setPlayerId] = useState<string | null>(null)
    const [ready, setReady] = useState(false)

    useEffect(() => {
        setPlayerId(loadPlayerId(code))
        setReady(true)
    }, [code])

    // เบราว์เซอร์บล็อกเสียงจนกว่าจะมี gesture ของผู้ใช้
    // คนที่กลับเข้าห้องเดิมจาก localStorage อาจยังไม่เคยกดปุ่มอะไรเลย เลยดักการแตะครั้งแรกไว้
    useEffect(() => {
        const unlock = () => unlockAudio()
        window.addEventListener('pointerdown', unlock, { once: true })
        return () => window.removeEventListener('pointerdown', unlock)
    }, [])

    const me = useMemo(
        () => state?.players.find((player) => player.id === playerId) ?? null,
        [state, playerId]
    )

    // playerId ที่เก็บไว้ใช้ไม่ได้แล้ว (ห้ามรีสตาร์ต / เราถูกเตะออก) → ให้ใส่ชื่อใหม่
    useEffect(() => {
        if (!state || !playerId || me) return
        clearPlayerId(code)
        setPlayerId(null)
    }, [state, playerId, me, code])

    const isMyTurn = !!state && !!me && state.players[state.turnIndex]?.id === me.id

    useTurnAlert({ active: isMyTurn && state?.status === 'playing' && state.phase === 'idle' })
    useCardSounds(state?.currentCard?.id ?? null, state?.currentCard?.rank ?? null)
    usePlayerJoinSound(state?.players.length ?? 0, state?.status === 'lobby')

    const handleJoined = (id: string) => {
        savePlayerId(code, id)
        setPlayerId(id)
    }

    if (!ready) return <LoadingScreen label="กำลังเตรียมวง..." />

    if (!state) {
        return connection === 'lost' ? (
            <ErrorScreen code={code} />
        ) : (
            <LoadingScreen label={`กำลังเข้าวง ${code}...`} />
        )
    }

    if (!me) {
        return <JoinForm code={code} state={state} onJoined={handleJoined} />
    }

    const shared = { state, me, connection, error, setError, act, isMyTurn }

    if (state.status === 'lobby') return <LobbyView {...shared} />
    if (state.status === 'finished') return <FinishedView {...shared} />
    return <GameView {...shared} />
}

/** สั่น + เสียงกระดิ่งทุกครั้งที่เปลี่ยนมาเป็นตาเรา และย้ำอีกครั้งถ้ายังไม่กด */
function useTurnAlert({ active }: { active: boolean }) {
    useEffect(() => {
        if (!active) return
        notifyMyTurn()
        // ถ้าวางมือถือไว้แล้วไม่กด เตือนซ้ำทุก 12 วิ
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

function ErrorScreen({ code }: { code: string }) {
    return (
        <main className="app-shell flex min-h-dvh flex-col items-center justify-center gap-4 text-center">
            <span className="text-6xl">🫠</span>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                เข้าวง {code} ไม่ได้
            </h1>
            <p className="text-sm text-dora-cream/70">
                วงนี้อาจปิดไปแล้ว หรือรหัสไม่ถูกต้อง ลองขอลิงก์จากหัวตี้อีกครั้ง
            </p>
            <a
                href="/"
                className="glass rounded-2xl px-6 py-3 font-bold text-dora-cream"
                style={{ fontFamily: 'var(--font-display)' }}
            >
                กลับหน้าแรก
            </a>
        </main>
    )
}
