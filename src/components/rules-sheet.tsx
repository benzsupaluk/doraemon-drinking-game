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
            <button
                aria-label="ปิดกฎ"
                onClick={onClose}
                className="absolute inset-0 bg-black/65 backdrop-blur-sm"
            />
            <div className="animate-rise relative flex max-h-[86dvh] w-full max-w-lg flex-col rounded-t-4xl border-t border-white/20 bg-dora-night/95 pb-[env(safe-area-inset-bottom)] shadow-2xl">
                <div className="flex items-center justify-between px-6 pt-5 pb-3">
                    <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                        กฎเกมส์โดรามอน
                    </h2>
                    <button
                        onClick={onClose}
                        className="glass flex size-9 items-center justify-center rounded-full text-lg"
                    >
                        ✕
                    </button>
                </div>

                <div className="no-scrollbar flex-1 space-y-2 overflow-y-auto px-5 pb-6">
                    {GLOBAL_RULES.map((rule) => (
                        <div
                            key={rule.title}
                            className="flex gap-3 rounded-2xl border border-dora-red/30 bg-dora-red/10 p-3"
                        >
                            <span className="text-2xl">{rule.emoji}</span>
                            <div>
                                <p className="font-bold text-dora-yellow">{rule.title}</p>
                                <p className="text-[13px] leading-relaxed text-dora-cream/75">{rule.detail}</p>
                            </div>
                        </div>
                    ))}

                    {ORDER.map((rank) => {
                        const rule = CARD_RULES[rank]
                        return (
                            <div key={rank} className="glass flex gap-3 rounded-2xl p-3">
                                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-dora-cream text-xl font-black text-dora-deep">
                                    {rank}
                                </span>
                                <div className="min-w-0">
                                    <p className="font-bold">
                                        {rule.emoji} {rule.title}
                                    </p>
                                    <p className="text-[13px] leading-relaxed text-dora-cream/70">
                                        {rule.detail}
                                    </p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
