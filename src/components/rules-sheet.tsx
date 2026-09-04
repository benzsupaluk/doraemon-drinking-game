'use client'

import { useEffect } from 'react'
import { CARD_RULES, GLOBAL_RULES } from '@/lib/rules'
import type { Rank } from '@/lib/types'

const ORDER: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

export function RulesSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
    useEffect(() => {
        if (!open) return
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose()
        }
        document.addEventListener('keydown', onKey)
        // Lock scrolling behind the sheet while it is open.
        const previous = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.removeEventListener('keydown', onKey)
            document.body.style.overflow = previous
        }
    }, [open, onClose])

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
            <button aria-label="ปิดกฎ" onClick={onClose} className="absolute inset-0 bg-black/60" />
            <div className="animate-fade-up relative flex max-h-[88dvh] w-full max-w-[26rem] flex-col rounded-t-panel border-t border-line bg-ink pb-[env(safe-area-inset-bottom)]">
                <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
                    <h2 className="font-semibold">กฎการเล่น</h2>
                    <button
                        onClick={onClose}
                        aria-label="ปิด"
                        className="flex size-8 items-center justify-center rounded-full border border-line text-muted"
                    >
                        ✕
                    </button>
                </div>

                <div className="no-scrollbar flex-1 overflow-y-auto px-5 py-4">
                    <p className="label mb-2">ตลอดเกม</p>
                    <ul className="mb-5 space-y-2">
                        {GLOBAL_RULES.map((rule) => (
                            <li key={rule.title} className="flex gap-3">
                                <span className="text-base">{rule.emoji}</span>
                                <div className="min-w-0">
                                    <p className="text-[1rem] font-semibold text-gold">
                                        {rule.title}
                                    </p>
                                    <p className="text-[0.9375rem] leading-relaxed text-muted">
                                        {rule.detail}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>

                    <p className="label mb-2">ไพ่แต่ละใบ</p>
                    <ul className="divide-y divide-line">
                        {ORDER.map((rank) => {
                            const rule = CARD_RULES[rank]
                            return (
                                <li key={rank} className="flex gap-3 py-2.5">
                                    <span className="w-7 shrink-0 text-center text-[1.0625rem] font-semibold text-accent">
                                        {rank}
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-[1rem] font-medium">{rule.title}</p>
                                        <p className="text-[0.9375rem] leading-relaxed text-muted">
                                            {rule.detail}
                                        </p>
                                    </div>
                                </li>
                            )
                        })}
                    </ul>
                </div>
            </div>
        </div>
    )
}
