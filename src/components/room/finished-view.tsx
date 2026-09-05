'use client'

import { useState } from 'react'
import { quitLabel, useQuitRoom } from './quit-room'
import { RoomHeader } from './room-header'
import type { ViewProps } from './types'
import { Button, Panel } from '@/components/ui'
import { SUIT_SYMBOL } from '@/lib/rules'

export function FinishedView({ state, me, connection, error, act }: ViewProps) {
    const [busy, setBusy] = useState(false)
    const { quitting, quit } = useQuitRoom({
        code: state.code,
        meId: me.id,
        isHost: me.isHost,
        act,
    })

    const ranking = [...state.players].sort((a, b) => b.cardsDrawn - a.cardsDrawn)
    const tooFewPlayers = state.players.length < 2

    const handleRestart = async () => {
        setBusy(true)
        const ok = await act(me.id, { type: 'restart' })
        if (!ok) setBusy(false)
    }

    return (
        <main className="app-shell flex min-h-dvh flex-col pb-4">
            <RoomHeader code={state.code} connection={connection} />

            <div className="stagger flex-1 space-y-4 pt-2">
                <header className="space-y-1">
                    <h1 className="text-[1.375rem] font-semibold">จบรอบแล้ว</h1>
                    <p className="text-[0.9375rem] text-muted">
                        {tooFewPlayers
                            ? 'คนในวงเหลือน้อยเกินไป รอเพื่อนกลับมาแล้วเริ่มรอบใหม่ได้'
                            : 'ไพ่หมดสำรับพอดี ดื่มน้ำเปล่าซักแก้วก่อนนะ'}
                    </p>
                </header>

                <Panel className="space-y-2.5">
                    <p className="label">เปิดไพ่มากที่สุด</p>
                    <ul className="divide-y divide-line">
                        {ranking.map((player, index) => (
                            <li key={player.id} className="flex items-center gap-3 py-2">
                                <span className="w-4 text-center text-[0.875rem] text-muted">
                                    {index + 1}
                                </span>
                                <span className="flex-1 truncate text-[1.0625rem] font-medium">
                                    {player.name}
                                    {player.id === me.id && (
                                        <span className="ml-1.5 text-[0.8125rem] text-muted">คุณ</span>
                                    )}
                                </span>
                                <span className="text-[0.9375rem] font-semibold text-gold">
                                    {player.cardsDrawn} ใบ
                                </span>
                            </li>
                        ))}
                    </ul>
                </Panel>

                {state.log.length > 0 && (
                    <section className="space-y-2">
                        <p className="label">ไพ่ท้ายๆ ของรอบนี้</p>
                        <ul className="no-scrollbar max-h-48 divide-y divide-line overflow-y-auto">
                            {state.log.map((entry) => (
                                <li
                                    key={entry.id}
                                    className="flex items-center gap-3 py-2 text-[0.9375rem]"
                                >
                                    <span
                                        className={`w-7 shrink-0 text-center font-semibold ${
                                            entry.card.suit === 'hearts' ||
                                            entry.card.suit === 'diamonds'
                                                ? 'text-drink'
                                                : 'text-accent'
                                        }`}
                                    >
                                        {entry.card.rank}
                                        {SUIT_SYMBOL[entry.card.suit]}
                                    </span>
                                    <span className="flex-1 truncate">{entry.playerName}</span>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {error && <p className="text-center text-[0.9375rem] text-drink">{error}</p>}
            </div>

            <div className="mt-4 space-y-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
                {me.isHost ? (
                    <Button variant="gold" onClick={handleRestart} loading={busy} silent className="w-full">
                        เริ่มรอบใหม่
                    </Button>
                ) : (
                    <p className="py-3 text-center text-[0.9375rem] text-muted">
                        รอหัวตี้เริ่มรอบใหม่
                    </p>
                )}
                <Button variant="ghost" onClick={quit} loading={quitting} className="w-full">
                    {quitLabel(me.isHost)}
                </Button>
            </div>
        </main>
    )
}
