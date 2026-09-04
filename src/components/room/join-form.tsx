'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button, Field, Panel } from '@/components/ui'
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
        <main className="app-shell flex min-h-dvh flex-col justify-center gap-5 py-10">
            <header className="animate-fade-up space-y-1 text-center">
                <p className="label">เข้าร่วมวง</p>
                <h1 className="text-[1.625rem] font-semibold tracking-[0.16em]">{state.code}</h1>
                <p className="text-[0.9375rem] text-muted">
                    {state.players.length}/{state.maxPlayers} คนในวง
                </p>
            </header>

            <Panel className="animate-fade-up space-y-4">
                {state.players.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {state.players.map((player) => (
                            <span
                                key={player.id}
                                className="rounded-full border border-line px-2.5 py-1 text-[0.875rem] text-muted"
                            >
                                {player.isHost && '👑 '}
                                {player.name}
                            </span>
                        ))}
                    </div>
                )}

                {blocked ? (
                    <div className="space-y-3 text-center">
                        <p className="font-semibold text-drink">
                            {full ? 'วงนี้เต็มแล้ว' : 'วงนี้เริ่มเล่นไปแล้ว'}
                        </p>
                        <p className="text-[0.9375rem] text-muted">
                            บอกหัวตี้ให้เปิดวงใหม่ หรือสร้างวงของคุณเองก็ได้
                        </p>
                        <Button variant="ghost" onClick={() => router.push('/')} className="w-full">
                            สร้างวงใหม่
                        </Button>
                    </div>
                ) : (
                    <>
                        <Field
                            label="ชื่อของคุณ"
                            value={name}
                            onChange={(event) => setTyped(event.target.value)}
                            onKeyDown={(event) => event.key === 'Enter' && handleJoin()}
                            maxLength={16}
                            placeholder="เช่น ไจแอนท์"
                            autoComplete="off"
                        />
                        <Button
                            variant="primary"
                            loading={loading}
                            onClick={handleJoin}
                            className="w-full"
                        >
                            เข้าร่วมวง
                        </Button>
                        {error && <p className="text-center text-[0.9375rem] text-drink">{error}</p>}
                    </>
                )}
            </Panel>
        </main>
    )
}
