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
        activeRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center',
        })
    }, [turnIndex])

    const nameOf = (id: string | null) => players.find((player) => player.id === id)?.name

    return (
        <ul className="no-scrollbar -mx-4.5 flex gap-1.5 overflow-x-auto px-4.5 py-2">
            {players.map((player, index) => {
                const isTurn = index === turnIndex
                const buddyName = nameOf(player.buddyId)
                return (
                    <li
                        key={player.id}
                        ref={isTurn ? activeRef : null}
                        className={`flex w-[4.5rem] shrink-0 flex-col items-center gap-1 rounded-field border px-1.5 py-2 transition-all duration-300 ${
                            isTurn
                                ? 'animate-turn scale-[1.03] border-gold bg-gold/10'
                                : 'border-line text-muted'
                        }`}
                    >
                        <span
                            className={`relative flex size-8 items-center justify-center rounded-full text-[0.9375rem] font-semibold transition-colors duration-300 ${
                                isTurn ? 'bg-gold text-[#241a02]' : 'border border-line text-accent'
                            }`}
                        >
                            {player.name.slice(0, 1)}
                            {player.heldCards.length > 0 && (
                                <span className="absolute -right-1.5 -bottom-1 flex size-4 items-center justify-center rounded-full bg-ink text-[0.625rem] font-semibold text-gold ring-1 ring-gold/50">
                                    {player.heldCards.length}
                                </span>
                            )}
                        </span>

                        <span className="w-full truncate text-center text-[0.8125rem] font-medium">
                            {player.name}
                        </span>

                        <div className="flex h-3 items-center gap-0.5 text-[0.625rem] leading-none">
                            {player.id === meId && <span className="text-accent">●</span>}
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
