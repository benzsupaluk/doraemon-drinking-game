'use client'

import { useEffect, useState } from 'react'
import { PlayerStrip } from './player-strip'
import { RoomHeader } from './room-header'
import type { ViewProps } from './types'
import { DeckStack, PlayingCard } from '@/components/playing-card'
import { Button } from '@/components/ui'
import { CARD_RULES, SUIT_SYMBOL } from '@/lib/rules'
import { unlockAudio } from '@/lib/feedback'

export function GameView({ state, me, connection, error, setError, act, isMyTurn }: ViewProps) {
    const [busy, setBusy] = useState(false)

    const currentPlayer = state.players[state.turnIndex]
    const revealed = state.phase === 'revealed'

    /**
     * The card face is derived entirely from server state; no local state needed.
     *
     * When a turn ends the server clears `currentCard`, but `log[0]` still holds
     * the last card drawn, so we show that while the card flips back. Otherwise
     * the whole card would vanish instantly.
     *
     * The animation comes from `is-flipped` being added to or removed from an
     * element that is already mounted; the CSS transition does the rest, with no
     * timers or refs needed to sequence it.
     */
    const faceCard = state.currentCard ?? state.log[0]?.card ?? null
    const flipped = revealed && !!state.currentCard

    useEffect(() => {
        if (!error) return
        const timer = setTimeout(() => setError(null), 3000)
        return () => clearTimeout(timer)
    }, [error, setError])

    const run = async (action: Parameters<typeof act>[1]) => {
        setBusy(true)
        await act(me.id, action)
        setBusy(false)
    }

    const handleDraw = () => {
        if (!isMyTurn || revealed || busy) return
        unlockAudio()
        void run({ type: 'draw' })
    }

    const rule = faceCard ? CARD_RULES[faceCard.rank] : null
    const needsBuddy = isMyTurn && state.awaitingBuddy

    return (
        <main className="app-shell flex h-dvh flex-col overflow-hidden">
            <RoomHeader
                code={state.code}
                connection={connection}
                right={
                    <span className="mr-1 text-[0.875rem] text-muted">
                        เหลือ {state.deckCount}
                    </span>
                }
            />

            <PlayerStrip players={state.players} turnIndex={state.turnIndex} meId={me.id} />

            <p
                key={currentPlayer?.id ?? 'none'}
                className="animate-pop py-2.5 text-center text-[1rem]"
            >
                {isMyTurn ? (
                    <span className="font-semibold text-gold">ตาของคุณ</span>
                ) : (
                    <span className="text-muted">
                        ตาของ <span className="font-medium text-text">{currentPlayer?.name ?? '—'}</span>
                    </span>
                )}
            </p>

            {/* Card area. min-h-0 lets it shrink on short screens instead of pushing the button off. */}
            <div className="flex min-h-0 flex-1 items-center justify-center py-1">
                <div className="relative aspect-5/7 h-full max-h-[24rem] max-w-full">
                    {!flipped && (
                        <DeckStack
                            count={state.deckCount}
                            className="pointer-events-none absolute inset-0"
                        />
                    )}
                    <button
                        onClick={handleDraw}
                        disabled={!isMyTurn || revealed || busy}
                        aria-label={isMyTurn && !revealed ? 'เปิดไพ่' : 'ไพ่กลางวง'}
                        className="relative z-10 block h-full w-full transition-transform duration-150 enabled:active:scale-[0.98] disabled:cursor-default"
                    >
                        <PlayingCard
                            card={faceCard}
                            flipped={flipped}
                            kingCount={state.kingCount}
                            className="size-full"
                            ringing={isMyTurn && !revealed}
                            backHint={
                                isMyTurn ? 'แตะเพื่อเปิดไพ่' : `รอ ${currentPlayer?.name ?? ''}`
                            }
                        />
                    </button>
                </div>
            </div>

            {/* Outcome line: one row, so the layout height never jumps. */}
            <div className="flex min-h-11 items-center justify-center px-1 text-center">
                {revealed && faceCard && rule ? (
                    <p key={faceCard.id} className="animate-pop text-[0.9375rem] leading-snug">
                        <span className="font-medium">
                            {currentPlayer?.name} · {faceCard.rank}
                            {SUIT_SYMBOL[faceCard.suit]}
                        </span>
                        <span className="text-muted">
                            {' — '}
                            {rule.sips > 0
                                ? `ดื่ม ${rule.sips} อึก`
                                : targetHint(rule.rank, state.players, state.turnIndex)}
                        </span>
                        {buddyHint(state, currentPlayer?.id) && (
                            <span className="block text-[0.875rem] text-accent">
                                {buddyHint(state, currentPlayer?.id)}
                            </span>
                        )}
                    </p>
                ) : (
                    me.heldCards.length > 0 && (
                        <button
                            onClick={() => void run({ type: 'use-card', cardId: me.heldCards[0].id })}
                            disabled={busy}
                            className="text-[0.875rem] text-gold"
                        >
                            ใช้ไพ่ติดตัว ({me.heldCards.length})
                        </button>
                    )
                )}
            </div>

            {error && (
                <p className="pb-1 text-center text-[0.875rem] text-drink">{error}</p>
            )}

            <div className="pb-[max(0.5rem,env(safe-area-inset-bottom))]">
                {needsBuddy ? (
                    <BuddyPicker
                        state={state}
                        meId={me.id}
                        busy={busy}
                        onPick={(buddyId) => void run({ type: 'buddy', buddyId })}
                    />
                ) : isMyTurn ? (
                    revealed ? (
                        <Button
                            variant="primary"
                            onClick={() => void run({ type: 'end-turn' })}
                            loading={busy}
                            className="w-full"
                        >
                            จบตา ส่งต่อคนถัดไป
                        </Button>
                    ) : (
                        <Button
                            variant="gold"
                            onClick={handleDraw}
                            loading={busy}
                            silent
                            className="w-full"
                        >
                            เปิดไพ่
                        </Button>
                    )
                ) : (
                    <p className="py-3.5 text-center text-[0.9375rem] text-muted">
                        รอ {currentPlayer?.name ?? '—'} เล่นให้จบ
                    </p>
                )}
            </div>
        </main>
    )
}

function BuddyPicker({
    state,
    meId,
    busy,
    onPick,
}: {
    state: ViewProps['state']
    meId: string
    busy: boolean
    onPick: (buddyId: string) => void
}) {
    const others = state.players.filter((player) => player.id !== meId)
    return (
        <div className="animate-fade-up space-y-2">
            <p className="text-center text-[0.9375rem] font-medium text-gold">เลือกบัดดี้ 1 คน</p>
            <div className="grid grid-cols-2 gap-2">
                {others.map((player) => (
                    <button
                        key={player.id}
                        disabled={busy}
                        onClick={() => onPick(player.id)}
                        className="truncate rounded-field border border-line bg-surface px-3 py-3 text-[0.9375rem] font-medium transition-opacity active:opacity-60 disabled:opacity-40"
                    >
                        {player.name}
                    </button>
                ))}
            </div>
        </div>
    )
}

/** Cards 9 and 10 target the player to the drawer's left/right, by seating order. */
function targetHint(rank: string, players: ViewProps['state']['players'], turnIndex: number) {
    const rule = CARD_RULES[rank as keyof typeof CARD_RULES]
    if (rank === '9') {
        const left = players[(turnIndex + 1) % players.length]
        return `${left?.name} (ทางซ้าย) ดื่ม 1 อึก`
    }
    if (rank === '10') {
        const right = players[(turnIndex - 1 + players.length) % players.length]
        return `${right?.name} (ทางขวา) ดื่ม 1 อึก`
    }
    return rule.title
}

function buddyHint(state: ViewProps['state'], playerId?: string) {
    if (!playerId) return null
    const player = state.players.find((item) => item.id === playerId)
    if (!player?.buddyId) return null
    const rule = state.currentCard ? CARD_RULES[state.currentCard.rank] : null
    if (!rule || rule.sips === 0) return null
    const buddy = state.players.find((item) => item.id === player.buddyId)
    return buddy ? `${buddy.name} เป็นบัดดี้ ต้องดื่มด้วย` : null
}
