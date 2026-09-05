'use client'

import { BellMark } from './bell-mark'
import { CardPips } from './card-pips'
import { CARD_RULES, KING_STEPS, SUIT_SYMBOL } from '@/lib/rules'
import type { Card } from '@/lib/types'

/** One accent per rule kind, used for the rule heading only. */
const TONE = {
    drink: '#c0392b',
    game: '#2f7d5b',
    target: '#2f66a8',
    special: '#a3761d',
} as const

const RED = '#c0392b'
const BLACK = '#16191f'

function inkFor(card: Card) {
    return card.suit === 'hearts' || card.suit === 'diamonds' ? RED : BLACK
}

interface Props {
    card: Card | null
    flipped: boolean
    /** Which King this is (1-4); changes the text shown on a King. */
    kingCount?: number
    /** Text shown on the card back, e.g. "tap the card to flip it". */
    backHint?: string
    /** Ring the bell on the card back — used when it is your turn. */
    ringing?: boolean
    className?: string
}

export function PlayingCard({
    card,
    flipped,
    kingCount = 0,
    backHint,
    ringing = false,
    className = '',
}: Props) {
    const rule = card ? CARD_RULES[card.rank] : null
    const kingIndex = Math.min(Math.max(kingCount, 1), 4)
    const kingStep = card?.rank === 'K' ? KING_STEPS[kingIndex - 1] : null
    const ink = card ? inkFor(card) : BLACK

    return (
        <div className={`card-stage ${className}`}>
            <div className={`card-3d size-full ${flipped ? 'is-flipped' : ''}`}>
                {/* Back — a bordered panel, like the back of a real deck. */}
                <div className="card-face card-back-art flex items-center justify-center p-2.5">
                    <div className="flex size-full flex-col items-center justify-center gap-3 rounded-[0.6rem] border border-white/12 px-5">
                        <BellMark
                            className="size-10 text-accent/80"
                            swing={!ringing}
                            ring={ringing}
                        />
                        {backHint && (
                            <p className="text-center text-[0.9375rem] font-medium text-text/75">
                                {backHint}
                            </p>
                        )}
                    </div>
                </div>

                {/* Face */}
                <div className="card-face card-face-back bg-card text-card-ink">
                    {card && rule && (
                        <div className="relative flex size-full flex-col">
                            <CornerIndex card={card} ink={ink} className="top-2 left-2.5" />
                            <CornerIndex
                                card={card}
                                ink={ink}
                                className="right-2.5 bottom-2 rotate-180"
                            />

                            {/*
                             * Fixed proportions rather than flex, so the pip
                             * field is the same size on every card the way a
                             * real deck is. Letting it flex meant a long rule
                             * squashed the pips into each other.
                             */}
                            <div className="h-[57%] shrink-0 px-8 pt-7 pb-2">
                                <CardPips rank={card.rank} suit={card.suit} color={ink} />
                            </div>

                            {/* What the card means in this game. */}
                            <div className="flex flex-1 flex-col justify-center border-t border-card-ink/12 px-8 py-2 text-center">
                                <h2
                                    className="text-[1.1875rem] leading-tight font-semibold"
                                    style={{ color: TONE[rule.tone] }}
                                >
                                    {kingStep
                                        ? kingStep.title.replace(/^ใบที่ \d+ — /, '')
                                        : rule.title}
                                </h2>
                                <p className="mt-1 line-clamp-2 text-[0.875rem] leading-snug text-card-ink/65 whitespace-pre-line">
                                    {kingStep
                                        ? `ใบที่ ${kingIndex} · ${kingStep.detail}`
                                        : rule.short}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

/** Rank over suit, tucked into the corner — the classic index block. */
function CornerIndex({ card, ink, className }: { card: Card; ink: string; className: string }) {
    return (
        <div
            className={`absolute flex flex-col items-center leading-none ${className}`}
            style={{ color: ink }}
        >
            <span className="text-[1.1875rem] font-semibold">{card.rank}</span>
            <span className="text-[2rem]">{SUIT_SYMBOL[card.suit]}</span>
        </div>
    )
}

/**
 * The undealt deck, layered so you can see how thick it still is.
 *
 * The root sets no position of its own: the caller passes `absolute inset-0` to
 * sit behind the top card. Adding `relative` here as well would conflict, and
 * the stack would end up rendering *above* the top card instead.
 */
export function DeckStack({ count, className = '' }: { count: number; className?: string }) {
    const layers = Math.min(2, Math.max(0, Math.ceil(count / 12)))
    return (
        <div className={className}>
            {Array.from({ length: layers }).map((_, index) => (
                <div
                    key={index}
                    className="card-back-art absolute inset-0 rounded-card opacity-70 transition-transform duration-300"
                    style={{
                        transform: `translate(${(layers - index) * 3}px, ${(layers - index) * 4}px)`,
                    }}
                />
            ))}
        </div>
    )
}
