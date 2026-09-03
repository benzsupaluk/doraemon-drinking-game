'use client'

import { BellMark } from './bell-mark'
import { CARD_RULES, KING_STEPS, SUIT_SYMBOL } from '@/lib/rules'
import type { Card } from '@/lib/types'

const TONE_STYLE = {
    drink: { ring: '#e8453c', label: 'ดื่มเลย', chip: 'bg-dora-red/15 text-dora-red' },
    game: { ring: '#1f9d55', label: 'เล่นเกม', chip: 'bg-emerald-500/15 text-emerald-700' },
    target: { ring: '#2b6cb0', label: 'เล็งคนอื่น', chip: 'bg-dora-blue/15 text-dora-deep' },
    special: { ring: '#b7791f', label: 'พิเศษ', chip: 'bg-dora-yellow/25 text-[#7a5200]' },
} as const

function isRed(card: Card) {
    return card.suit === 'hearts' || card.suit === 'diamonds'
}

interface Props {
    card: Card | null
    flipped: boolean
    /** ลำดับไพ่ K ที่เปิด (1-4) ใช้เปลี่ยนข้อความบนไพ่ K */
    kingCount?: number
    className?: string
}

export function PlayingCard({ card, flipped, kingCount = 0, className = '' }: Props) {
    const rule = card ? CARD_RULES[card.rank] : null
    const tone = rule ? TONE_STYLE[rule.tone] : TONE_STYLE.special
    const kingStep = card?.rank === 'K' ? KING_STEPS[Math.min(Math.max(kingCount, 1), 4) - 1] : null

    return (
        <div className={`card-stage ${className}`}>
            <div className={`card-3d aspect-5/7 w-full ${flipped ? 'is-flipped' : ''}`}>
                {/* หลังไพ่ */}
                <div className="card-face card-back-art flex items-center justify-center border-4 border-white/85 shadow-[0_24px_50px_-18px_rgba(0,0,0,0.75)]">
                    <div className="relative flex flex-col items-center gap-3">
                        <BellMark className="size-20 drop-shadow-lg" animated />
                        <p
                            className="text-xl font-bold tracking-wide text-white drop-shadow"
                            style={{ fontFamily: 'var(--font-display)' }}
                        >
                            โดรามอน
                        </p>
                    </div>
                    {/* แสงวิ่งผ่านให้ดูมีชีวิต */}
                    <div className="pointer-events-none absolute inset-0 overflow-hidden">
                        <div className="animate-shine absolute top-0 -left-1/2 h-[200%] w-1/3 bg-gradient-to-r from-transparent via-white/35 to-transparent" />
                    </div>
                </div>

                {/* หน้าไพ่ */}
                <div
                    className="card-face card-face-back flex flex-col bg-dora-cream text-dora-night shadow-[0_24px_50px_-18px_rgba(0,0,0,0.75)]"
                    style={{ borderTop: `10px solid ${tone.ring}` }}
                >
                    {card && rule && (
                        <>
                            <div className="flex items-start justify-between px-4 pt-3">
                                <CornerRank card={card} />
                                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${tone.chip}`}>
                                    {tone.label}
                                </span>
                            </div>

                            <div className="flex flex-1 flex-col items-center justify-center gap-2 px-5 text-center">
                                <span className="animate-pop-in text-6xl leading-none drop-shadow-sm">
                                    {rule.emoji}
                                </span>
                                <h2
                                    className="text-3xl leading-tight font-bold text-dora-deep"
                                    style={{ fontFamily: 'var(--font-display)' }}
                                >
                                    {kingStep ? 'ราชาสั่งได้' : rule.title}
                                </h2>
                                {kingStep && (
                                    <p className="text-sm font-bold text-dora-red">{kingStep.title}</p>
                                )}
                                <p className="text-[13px] leading-relaxed text-dora-night/70">
                                    {kingStep ? kingStep.detail : rule.detail}
                                </p>
                            </div>

                            <div className="flex items-end justify-between px-4 pb-3">
                                <span className="text-[11px] font-semibold text-dora-night/30">
                                    เกมส์โดรามอน 🔔
                                </span>
                                <CornerRank card={card} flipped />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

function CornerRank({ card, flipped = false }: { card: Card; flipped?: boolean }) {
    return (
        <div
            className={`flex flex-col items-center leading-none ${flipped ? 'rotate-180' : ''}`}
            style={{ color: isRed(card) ? '#e8453c' : '#0b3c6d' }}
        >
            <span className="text-2xl font-black">{card.rank}</span>
            <span className="text-xl">{SUIT_SYMBOL[card.suit]}</span>
        </div>
    )
}

/**
 * กองไพ่ที่ยังไม่เปิด — ซ้อนกันให้เห็นความหนา
 * root ไม่ใส่ position เอง เพราะที่เรียกใช้ส่ง `absolute inset-0` มาวางทับไพ่ใบบนอยู่แล้ว
 * (ถ้าใส่ relative ไว้ที่นี่ด้วยจะชนกันแล้วกองไพ่จะไปโผล่เหนือไพ่ใบบนแทน)
 */
export function DeckStack({ count, className = '' }: { count: number; className?: string }) {
    const layers = Math.min(3, Math.max(0, Math.ceil(count / 6)))
    return (
        <div className={`card-stage ${className}`}>
            {Array.from({ length: layers }).map((_, index) => (
                <div
                    key={index}
                    className="card-back-art absolute inset-0 rounded-[1.25rem] border-4 border-white/70 opacity-70"
                    style={{
                        transform: `translate(${(layers - index) * 4}px, ${(layers - index) * 5}px) rotate(${(layers - index) * 1.6}deg)`,
                    }}
                />
            ))}
        </div>
    )
}
