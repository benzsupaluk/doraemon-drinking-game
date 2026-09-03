'use client'

import { BellMark } from './bell-mark'
import { CARD_RULES, KING_STEPS, SUIT_SYMBOL } from '@/lib/rules'
import type { Card } from '@/lib/types'

/** One accent line per rule kind. Kept faint: the rule text does the work. */
const TONE = {
    drink: { rule: '#e05252', label: 'ดื่ม' },
    game: { rule: '#3f8f6b', label: 'เล่นเกม' },
    target: { rule: '#3a72b8', label: 'สั่งคนอื่น' },
    special: { rule: '#b8862f', label: 'พิเศษ' },
} as const

function isRed(card: Card) {
    return card.suit === 'hearts' || card.suit === 'diamonds'
}

interface Props {
    card: Card | null
    flipped: boolean
    /** Which King this is (1-4); changes the text shown on a King. */
    kingCount?: number
    /** Text shown on the card back, e.g. "tap the card to flip it". */
    backHint?: string
    className?: string
}

export function PlayingCard({ card, flipped, kingCount = 0, backHint, className = '' }: Props) {
    const rule = card ? CARD_RULES[card.rank] : null
    const tone = rule ? TONE[rule.tone] : TONE.special
    const kingStep = card?.rank === 'K' ? KING_STEPS[Math.min(Math.max(kingCount, 1), 4) - 1] : null

    return (
        <div className={`card-stage ${className}`}>
            <div className={`card-3d size-full ${flipped ? 'is-flipped' : ''}`}>
                {/* Back */}
                <div className="card-face card-back-art flex flex-col items-center justify-center gap-3 px-6">
                    <BellMark className="size-9 text-accent/70" />
                    {backHint && (
                        <p className="text-center text-[0.8125rem] font-medium text-text/70">
                            {backHint}
                        </p>
                    )}
                </div>

                {/* Face */}
                <div className="card-face card-face-back flex flex-col bg-card text-card-ink">
                    {card && rule && (
                        <>
                            <div className="flex items-start justify-between px-4 pt-3.5">
                                <span
                                    className="text-lg leading-none font-semibold"
                                    style={{ color: isRed(card) ? '#c0392b' : '#1a1f26' }}
                                >
                                    {card.rank}
                                    <span className="ml-0.5 text-[0.9em]">
                                        {SUIT_SYMBOL[card.suit]}
                                    </span>
                                </span>
                                <span
                                    className="text-[0.625rem] font-semibold tracking-[0.08em]"
                                    style={{ color: tone.rule }}
                                >
                                    {tone.label}
                                </span>
                            </div>

                            <div className="flex flex-1 flex-col items-center justify-center gap-2.5 px-5 pb-2 text-center">
                                <span className="text-[2.25rem] leading-none">{rule.emoji}</span>
                                <h2 className="text-xl leading-snug font-semibold">
                                    {kingStep ? 'ราชาสั่งได้' : rule.title}
                                </h2>
                                {kingStep && (
                                    <p
                                        className="text-[0.75rem] font-semibold"
                                        style={{ color: tone.rule }}
                                    >
                                        {kingStep.title}
                                    </p>
                                )}
                                <p className="text-[0.8125rem] leading-relaxed text-card-ink/60">
                                    {kingStep ? kingStep.detail : rule.detail}
                                </p>
                            </div>

                            <div
                                className="h-1 w-full shrink-0"
                                style={{ backgroundColor: tone.rule }}
                            />
                        </>
                    )}
                </div>
            </div>
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
                    className="card-back-art absolute inset-0 rounded-card opacity-60"
                    style={{
                        transform: `translate(${(layers - index) * 3}px, ${(layers - index) * 4}px)`,
                    }}
                />
            ))}
        </div>
    )
}
