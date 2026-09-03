'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { RoomHeader } from './room-header'
import type { ViewProps } from './types'
import { BellMark } from '@/components/bell-mark'
import { Button } from '@/components/ui'
import { SUIT_SYMBOL } from '@/lib/rules'

export function FinishedView({ state, me, connection, error, act }: ViewProps) {
    const router = useRouter()
    const [busy, setBusy] = useState(false)

    const ranking = [...state.players].sort((a, b) => b.cardsDrawn - a.cardsDrawn)
    const tooFewPlayers = state.players.length < 2

    const handleRestart = async () => {
        setBusy(true)
        const ok = await act(me.id, { type: 'restart' })
        if (!ok) setBusy(false)
    }

    return (
        <main className="app-shell flex min-h-dvh flex-col gap-5 pb-8">
            <RoomHeader code={state.code} connection={connection} />

            <section className="animate-rise flex flex-col items-center gap-2 pt-4 text-center">
                <BellMark className="size-20" animated />
                <h1 className="text-4xl font-bold text-dora-yellow" style={{ fontFamily: 'var(--font-display)' }}>
                    จบรอบแล้ว!
                </h1>
                <p className="text-sm text-dora-cream/70">
                    {tooFewPlayers
                        ? 'คนในวงเหลือน้อยเกินไป รอเพื่อนกลับมาแล้วเริ่มรอบใหม่ได้เลย'
                        : 'ไพ่หมดสำรับพอดี ดื่มน้ำเปล่าซักแก้วก่อนนะ 💧'}
                </p>
            </section>

            <section className="glass animate-rise space-y-2 rounded-3xl p-5" style={{ animationDelay: '60ms' }}>
                <p className="font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                    🏆 เปิดไพ่มากที่สุด
                </p>
                <ul className="space-y-1.5">
                    {ranking.map((player, index) => (
                        <li key={player.id} className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2">
                            <span className="w-5 text-center text-sm font-bold text-dora-cream/50">
                                {index + 1}
                            </span>
                            <span className="flex-1 truncate font-semibold">
                                {player.name}
                                {player.id === me.id && (
                                    <span className="ml-1.5 text-xs text-dora-sky">(คุณ)</span>
                                )}
                            </span>
                            <span className="text-sm font-bold text-dora-yellow">{player.cardsDrawn} ใบ</span>
                        </li>
                    ))}
                </ul>
            </section>

            {state.log.length > 0 && (
                <section className="animate-rise space-y-2" style={{ animationDelay: '120ms' }}>
                    <p className="px-1 font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                        ไพ่ท้ายๆ ของรอบนี้
                    </p>
                    <ul className="no-scrollbar max-h-56 space-y-1.5 overflow-y-auto">
                        {state.log.map((entry) => (
                            <li
                                key={entry.id}
                                className="glass flex items-center gap-3 rounded-xl px-3 py-2 text-sm"
                            >
                                <span
                                    className={`flex size-8 shrink-0 items-center justify-center rounded-lg bg-dora-cream font-black ${
                                        entry.card.suit === 'hearts' || entry.card.suit === 'diamonds'
                                            ? 'text-dora-red'
                                            : 'text-dora-deep'
                                    }`}
                                >
                                    {entry.card.rank}
                                </span>
                                <span className="flex-1 truncate">
                                    <span className="font-semibold">{entry.playerName}</span> เปิดได้{' '}
                                    {entry.card.rank}
                                    {SUIT_SYMBOL[entry.card.suit]}
                                </span>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {error && <p className="text-center text-sm font-semibold text-dora-red">{error}</p>}

            <div className="mt-auto space-y-2 pt-4 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
                {me.isHost ? (
                    <Button variant="gold" onClick={handleRestart} loading={busy} silent className="w-full">
                        🔁 เริ่มรอบใหม่
                    </Button>
                ) : (
                    <div className="glass animate-nudge rounded-2xl px-5 py-4 text-center font-bold">
                        รอหัวตี้เริ่มรอบใหม่...
                    </div>
                )}
                <Button variant="ghost" onClick={() => router.push('/')} className="w-full">
                    ออกจากวง
                </Button>
            </div>
        </main>
    )
}
