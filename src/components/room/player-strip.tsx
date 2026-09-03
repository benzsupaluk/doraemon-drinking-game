'use client'

import { useEffect, useRef } from 'react'
import type { Player } from '@/lib/types'

interface Props {
    players: Player[]
    turnIndex: number
    meId: string
}

export function PlayerStrip({ players, turnIndex, meId }: Props) {
    const activeRef = useRef<HTMLLIElement | null>(null)

    // Keep the active player centred, so nobody has to scroll to find them in a big group.
    useEffect(() => {
        activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }, [turnIndex])

    const nameOf = (id: string | null) => players.find((player) => player.id === id)?.name

    return (
        <ul className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
            {players.map((player, index) => {
                const isTurn = index === turnIndex
                const buddyName = nameOf(player.buddyId)
                return (
                    <li
                        key={player.id}
                        ref={isTurn ? activeRef : null}
                        className={`flex w-20 shrink-0 flex-col items-center gap-1 rounded-2xl px-2 py-2.5 transition-all duration-300 ${
                            isTurn
                                ? 'animate-turn-glow scale-105 bg-dora-yellow/20 ring-2 ring-dora-yellow'
                                : 'glass opacity-70'
                        }`}
                    >
                        <span
                            className={`relative flex size-11 items-center justify-center rounded-full text-lg font-bold ${
                                isTurn
                                    ? 'bg-gradient-to-b from-dora-yellow to-[#f0ab13] text-[#4a2d00]'
                                    : 'bg-gradient-to-b from-dora-sky to-dora-blue text-dora-night'
                            }`}
                        >
                            {player.name.slice(0, 1)}
                            {player.heldCards.length > 0 && (
                                <span className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full bg-dora-night text-[10px] font-bold text-dora-yellow ring-1 ring-dora-yellow/60">
                                    {player.heldCards.length}
                                </span>
                            )}
                        </span>

                        <span className="w-full truncate text-center text-[11px] font-bold">
                            {player.name}
                        </span>

                        <div className="flex h-4 items-center gap-0.5 text-[10px] leading-none">
                            {player.id === meId && <span className="text-dora-sky">●</span>}
                            {player.isHost && <span title="หัวตี้">👑</span>}
                            {player.silenced && <span title="ห้ามพูดด้วย">🤫</span>}
                            {buddyName && <span title={`บัดดี้กับ ${buddyName}`}>🤝</span>}
                        </div>
                    </li>
                )
            })}
        </ul>
    )
}
