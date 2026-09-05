'use client'

import { useEffect } from 'react'
import { Drawer } from 'vaul'
import { SideBadge } from './side-badge'
import { CARD_RULES, SUIT_SYMBOL } from '@/lib/rules'
import type { Card } from '@/lib/types'

/**
 * The 8s you are holding.
 *
 * A held card is not tied to a turn — the whole point is to play it when
 * someone tries to make you drink — so it sits on the side rail and can be used
 * at any moment, on anyone's turn.
 */
export function HeldCards({
    cards,
    busy,
    open,
    onOpenChange,
    onUse,
}: {
    cards: Card[]
    busy: boolean
    open: boolean
    onOpenChange: (open: boolean) => void
    onUse: (cardId: string) => void
}) {
    // Nothing left to show once the last one is played.
    useEffect(() => {
        if (cards.length === 0) onOpenChange(false)
    }, [cards.length, onOpenChange])

    if (cards.length === 0) return null

    return (
        <>
            <SideBadge
                label={`ไพ่ติดตัว ${cards.length} ใบ`}
                caption={`${cards.length}`}
                onClick={() => onOpenChange(true)}
            >
                🎫
            </SideBadge>

            <Drawer.Root open={open} onOpenChange={onOpenChange}>
                <Drawer.Portal>
                    <Drawer.Overlay className="fixed inset-0 z-40 bg-black/60" />
                    <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[85dvh] flex-col rounded-t-panel border-t border-line bg-ink outline-none sm:max-w-105">
                        <Drawer.Handle className="my-2.5 !bg-line" />

                        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
                            <Drawer.Title className="font-semibold">🎫 ไพ่ติดตัว</Drawer.Title>
                            <Drawer.Description className="sr-only">
                                ไพ่ 8 ที่ถืออยู่ ใช้ได้ทุกเมื่อ
                            </Drawer.Description>
                            <Drawer.Close
                                aria-label="ปิด"
                                className="flex size-8 items-center justify-center rounded-full border border-line text-muted"
                            >
                                ✕
                            </Drawer.Close>
                        </div>

                        <div className="no-scrollbar flex-1 overflow-y-auto px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                            <p className="text-[0.9375rem] leading-relaxed text-muted">
                                {CARD_RULES['8'].detail}
                            </p>

                            <ul className="mt-3 space-y-2">
                                {cards.map((card) => (
                                    <li
                                        key={card.id}
                                        className="flex items-center gap-3 rounded-panel border border-line bg-surface px-3.5 py-2.5"
                                    >
                                        <span
                                            className={`text-[1.25rem] font-semibold ${
                                                card.suit === 'hearts' || card.suit === 'diamonds'
                                                    ? 'text-drink'
                                                    : 'text-accent'
                                            }`}
                                        >
                                            {card.rank}
                                            {SUIT_SYMBOL[card.suit]}
                                        </span>
                                        <span className="flex-1 text-[0.9375rem] text-muted">
                                            ใช้ได้ทุกเมื่อ ไม่ต้องรอตาตัวเอง
                                        </span>
                                        <button
                                            type="button"
                                            disabled={busy}
                                            onClick={() => onUse(card.id)}
                                            className="shrink-0 rounded-field border border-gold px-3.5 py-2 text-[0.9375rem] font-semibold text-gold transition-opacity active:opacity-60 disabled:opacity-40"
                                        >
                                            ใช้ใบนี้
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </Drawer.Content>
                </Drawer.Portal>
            </Drawer.Root>
        </>
    )
}
