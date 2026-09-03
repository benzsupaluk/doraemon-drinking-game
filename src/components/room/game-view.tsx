'use client'

import { useEffect, useRef, useState } from 'react'
import { PlayerStrip } from './player-strip'
import { RoomHeader } from './room-header'
import type { ViewProps } from './types'
import { BellMark } from '@/components/bell-mark'
import { DeckStack, PlayingCard } from '@/components/playing-card'
import { Button } from '@/components/ui'
import { CARD_RULES, SUIT_SYMBOL } from '@/lib/rules'
import { unlockAudio } from '@/lib/feedback'
import type { Card } from '@/lib/types'

export function GameView({ state, me, connection, error, setError, act, isMyTurn }: ViewProps) {
    const [displayCard, setDisplayCard] = useState<Card | null>(state.currentCard)
    const [flipped, setFlipped] = useState(!!state.currentCard)
    const [busy, setBusy] = useState(false)

    const currentPlayer = state.players[state.turnIndex]
    const revealed = state.phase === 'revealed'
    const cardId = state.currentCard?.id

    // state ทั้งก้อนมาใหม่ทุกครั้งที่มี event ทำให้ object ไพ่เปลี่ยน identity
    // เลยต้องอ่านผ่าน ref และผูก effect ไว้กับ id เท่านั้น ไม่งั้นไพ่จะพลิกใหม่ทุก event
    const cardRef = useRef(state.currentCard)
    cardRef.current = state.currentCard

    // คุมจังหวะพลิกไพ่: ต้อง mount ด้วยหลังไพ่ก่อน 1 เฟรม แล้วค่อยพลิก transition จะได้ทำงาน
    useEffect(() => {
        const card = cardRef.current
        if (card) {
            setDisplayCard(card)
            setFlipped(false)
            const timer = setTimeout(() => setFlipped(true), 60)
            return () => clearTimeout(timer)
        }
        // จบตา: พลิกกลับก่อน แล้วค่อยถอดไพ่ออกตอน animation จบ
        setFlipped(false)
        const timer = setTimeout(() => setDisplayCard(null), 500)
        return () => clearTimeout(timer)
    }, [cardId])

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

    const rule = displayCard ? CARD_RULES[displayCard.rank] : null
    const needsBuddy = isMyTurn && state.awaitingBuddy

    return (
        <main className="app-shell flex min-h-dvh flex-col gap-3 pb-4">
            <RoomHeader
                code={state.code}
                connection={connection}
                right={
                    <span className="glass flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-bold">
                        🃏 {state.deckCount}
                    </span>
                }
            />

            <PlayerStrip players={state.players} turnIndex={state.turnIndex} meId={me.id} />

            {/* ป้ายบอกตาใคร */}
            <div
                className={`rounded-2xl px-4 py-2.5 text-center transition-colors ${
                    isMyTurn ? 'bg-dora-yellow/20 ring-1 ring-dora-yellow/50' : 'glass'
                }`}
            >
                {isMyTurn ? (
                    <p className="text-lg font-bold text-dora-yellow" style={{ fontFamily: 'var(--font-display)' }}>
                        🔔 ตาของคุณแล้ว!
                    </p>
                ) : (
                    <p className="text-sm text-dora-cream/75">
                        ตาของ{' '}
                        <span className="font-bold text-white">{currentPlayer?.name ?? '—'}</span>
                        {revealed ? ' — อ่านกฎบนไพ่กันก่อน' : ' กำลังจะเปิดไพ่...'}
                    </p>
                )}
            </div>

            {/* พื้นที่ไพ่ */}
            <div className="relative flex flex-1 items-center justify-center py-2">
                <div className="relative w-full max-w-64">
                    {!displayCard && (
                        <DeckStack
                            count={state.deckCount}
                            className="pointer-events-none absolute inset-0"
                        />
                    )}
                    <button
                        onClick={handleDraw}
                        disabled={!isMyTurn || revealed || busy}
                        aria-label={isMyTurn && !revealed ? 'เปิดไพ่' : 'ไพ่กลางวง'}
                        className="relative z-10 block w-full transition-transform duration-200 enabled:active:scale-[0.97] disabled:cursor-default"
                    >
                        {displayCard ? (
                            <PlayingCard card={displayCard} flipped={flipped} kingCount={state.kingCount} />
                        ) : (
                            <div className="card-stage aspect-5/7 w-full">
                                <div className="card-back-art relative flex size-full flex-col items-center justify-center gap-3 rounded-[1.25rem] border-4 border-white/85 shadow-[0_24px_50px_-18px_rgba(0,0,0,0.75)]">
                                    <BellMark
                                        className={`size-16 drop-shadow-lg ${isMyTurn ? 'animate-nudge' : ''}`}
                                    />
                                    <p
                                        className="px-4 text-center text-base font-bold text-white/95"
                                        style={{ fontFamily: 'var(--font-display)' }}
                                    >
                                        {isMyTurn ? 'แตะที่ไพ่เพื่อเปิด' : `รอ ${currentPlayer?.name ?? ''} เปิดไพ่`}
                                    </p>
                                    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[1.25rem]">
                                        <div className="animate-shine absolute top-0 -left-1/2 h-[200%] w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </button>
                </div>
            </div>

            {/* ผลของไพ่ที่เปิด */}
            {revealed && displayCard && rule && (
                <div className="animate-rise glass rounded-2xl px-4 py-3 text-center text-sm">
                    <p className="font-bold text-dora-yellow" style={{ fontFamily: 'var(--font-display)' }}>
                        {currentPlayer?.name} เปิดได้ {displayCard.rank}
                        {SUIT_SYMBOL[displayCard.suit]}
                    </p>
                    <p className="mt-0.5 text-dora-cream/80">
                        {rule.sips > 0
                            ? `${currentPlayer?.name} ดื่ม ${rule.sips} อึก 🥃`
                            : targetHint(rule.rank, state.players, state.turnIndex)}
                    </p>
                    {buddyChainHint(state, currentPlayer?.id) && (
                        <p className="mt-1 text-xs font-semibold text-dora-sky">
                            🤝 {buddyChainHint(state, currentPlayer?.id)}
                        </p>
                    )}
                </div>
            )}

            {/* ไพ่ 8 ที่ถือไว้ */}
            {me.heldCards.length > 0 && (
                <div className="glass flex items-center gap-3 rounded-2xl px-4 py-3">
                    <span className="text-2xl">🎫</span>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold">ไพ่ติดตัวของคุณ ({me.heldCards.length})</p>
                        <p className="text-xs text-dora-cream/60">ใช้เพื่อไปห้องน้ำ หรือยกให้เพื่อนก็ได้</p>
                    </div>
                    <button
                        onClick={() => void run({ type: 'use-card', cardId: me.heldCards[0].id })}
                        disabled={busy}
                        className="shrink-0 rounded-xl bg-dora-yellow/20 px-3 py-2 text-sm font-bold text-dora-yellow active:scale-95"
                    >
                        ใช้ 1 ใบ
                    </button>
                </div>
            )}

            {error && (
                <p className="animate-pop-in rounded-2xl bg-dora-red/20 px-4 py-2.5 text-center text-sm font-semibold text-dora-red">
                    {error}
                </p>
            )}

            {/* แถบปุ่มล่าง */}
            <div className="sticky bottom-0 space-y-2 bg-gradient-to-t from-dora-night via-dora-night/92 to-transparent pt-4 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
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
                            จบตา — ส่งต่อคนถัดไป →
                        </Button>
                    ) : (
                        <Button variant="gold" onClick={handleDraw} loading={busy} silent className="w-full">
                            🔔 เปิดไพ่
                        </Button>
                    )
                ) : (
                    <div className="glass rounded-2xl px-5 py-3.5 text-center text-sm font-semibold text-dora-cream/70">
                        รอ {currentPlayer?.name ?? '—'} เล่นให้จบก่อน
                    </div>
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
        <div className="animate-rise glass space-y-2 rounded-2xl p-4">
            <p className="text-center text-sm font-bold text-dora-yellow">
                🤝 เลือกบัดดี้ของคุณ 1 คน
            </p>
            <p className="text-center text-xs text-dora-cream/60">
                จากนี้ไปถ้าใครในคู่โดนดื่ม อีกคนต้องดื่มด้วย
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
                {others.map((player) => (
                    <button
                        key={player.id}
                        disabled={busy}
                        onClick={() => onPick(player.id)}
                        className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2.5 text-left font-semibold transition active:scale-95 disabled:opacity-50"
                    >
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-dora-sky to-dora-blue text-sm font-bold text-dora-night">
                            {player.name.slice(0, 1)}
                        </span>
                        <span className="truncate text-sm">{player.name}</span>
                    </button>
                ))}
            </div>
        </div>
    )
}

/** ไพ่ 9/10 ชี้ไปที่คนซ้าย/ขวาของคนเปิด — คำนวณจากลำดับที่นั่งในวง */
function targetHint(rank: string, players: ViewProps['state']['players'], turnIndex: number) {
    const rule = CARD_RULES[rank as keyof typeof CARD_RULES]
    if (rank === '9') {
        const left = players[(turnIndex + 1) % players.length]
        return `${left?.name} (คนทางซ้าย) ดื่ม 1 อึก 🥃`
    }
    if (rank === '10') {
        const right = players[(turnIndex - 1 + players.length) % players.length]
        return `${right?.name} (คนทางขวา) ดื่ม 1 อึก 🥃`
    }
    return rule.detail
}

function buddyChainHint(state: ViewProps['state'], playerId?: string) {
    if (!playerId) return null
    const player = state.players.find((item) => item.id === playerId)
    if (!player?.buddyId) return null
    const rule = state.currentCard ? CARD_RULES[state.currentCard.rank] : null
    if (!rule || rule.sips === 0) return null
    const buddy = state.players.find((item) => item.id === player.buddyId)
    return buddy ? `${buddy.name} เป็นบัดดี้ ต้องดื่มด้วย!` : null
}
