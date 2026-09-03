'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { BellMark } from '@/components/bell-mark'
import { Button } from '@/components/ui'
import { joinRoom } from '@/lib/api'
import { unlockAudio } from '@/lib/feedback'
import { useRememberedName } from '@/hooks/use-session'
import { saveLastName } from '@/lib/session'
import type { RoomState } from '@/lib/types'

interface Props {
    code: string
    state: RoomState
    /** Passes the state from the join response so the caller need not wait for a poll. */
    onJoined: (playerId: string, joined: RoomState) => void
}

export function JoinForm({ code, state, onJoined }: Props) {
    const router = useRouter()
    const remembered = useRememberedName()
    const [typed, setTyped] = useState<string | null>(null)
    const name = typed ?? remembered
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const full = state.players.length >= state.maxPlayers
    const started = state.status !== 'lobby'
    const blocked = full || started

    const handleJoin = async () => {
        if (!name.trim()) {
            setError('ใส่ชื่อของคุณก่อนนะ')
            return
        }
        setLoading(true)
        setError(null)
        try {
            unlockAudio()
            const { playerId, state: joined } = await joinRoom(code, name)
            saveLastName(name.trim())
            onJoined(playerId, joined)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'เข้าวงไม่สำเร็จ')
            setLoading(false)
        }
    }

    return (
        <main className="app-shell flex min-h-dvh flex-col justify-center gap-6 py-10">
            <header className="animate-rise flex flex-col items-center gap-2 text-center">
                <BellMark className="size-20" animated />
                <p className="text-sm font-semibold tracking-widest text-dora-sky">เข้าร่วมวง</p>
                <h1
                    className="text-5xl font-bold tracking-[0.2em] text-dora-yellow"
                    style={{ fontFamily: 'var(--font-display)' }}
                >
                    {state.code}
                </h1>
                <p className="text-sm text-dora-cream/70">
                    {state.players.length}/{state.maxPlayers} คนในวงแล้ว
                </p>
            </header>

            <div className="glass animate-rise space-y-4 rounded-3xl p-5" style={{ animationDelay: '80ms' }}>
                {state.players.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {state.players.map((player) => (
                            <span
                                key={player.id}
                                className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold"
                            >
                                {player.isHost ? '👑 ' : ''}
                                {player.name}
                            </span>
                        ))}
                    </div>
                )}

                {blocked ? (
                    <div className="space-y-3 text-center">
                        <p className="text-lg font-bold text-dora-red">
                            {full ? 'วงนี้เต็มแล้ว 😭' : 'วงนี้เริ่มเล่นไปแล้ว 🍻'}
                        </p>
                        <p className="text-sm text-dora-cream/70">
                            บอกหัวตี้ให้เปิดวงใหม่ หรือสร้างวงของคุณเองก็ได้
                        </p>
                        <Button variant="ghost" onClick={() => router.push('/')} className="w-full">
                            สร้างวงใหม่
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="space-y-2">
                            <label htmlFor="player-name" className="text-sm font-semibold text-dora-cream/80">
                                ชื่อของคุณ
                            </label>
                            <input
                                id="player-name"
                                value={name}
                                onChange={(event) => setTyped(event.target.value)}
                                onKeyDown={(event) => event.key === 'Enter' && handleJoin()}
                                maxLength={16}
                                placeholder="เช่น ไจแอนท์"
                                autoComplete="off"
                                className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3.5 text-lg font-semibold text-white placeholder:text-white/35 focus:border-dora-sky focus:outline-none"
                            />
                        </div>
                        <Button variant="primary" loading={loading} onClick={handleJoin} className="w-full">
                            เข้าร่วมวง
                        </Button>
                        {error && <p className="text-center text-sm font-semibold text-dora-red">{error}</p>}
                    </>
                )}
            </div>
        </main>
    )
}
