'use client'

import { Drawer } from 'vaul'
import { CARD_RULES, GLOBAL_RULES } from '@/lib/rules'
import type { Rank } from '@/lib/types'

const ORDER: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

/*
 * A bottom drawer: swipe it down, tap the dimmed area, or press Escape to
 * close. On wider screens it keeps the same shape, just centred and capped.
 */
export function RulesSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
    return (
        <Drawer.Root open={open} onOpenChange={(next) => !next && onClose()}>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 z-40 bg-black/60" />
                <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[85dvh] flex-col rounded-t-panel border-t border-line bg-ink outline-none sm:max-w-105">
                    <Drawer.Handle className="my-2.5 !bg-line" />

                    <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
                        <Drawer.Title className="font-semibold">กฎการเล่น</Drawer.Title>
                        <Drawer.Description className="sr-only">
                            กฎทั้งหมดของเกมไพ่วงเหล้า
                        </Drawer.Description>
                        <Drawer.Close
                            aria-label="ปิด"
                            className="flex size-8 items-center justify-center rounded-full border border-line text-muted"
                        >
                            ✕
                        </Drawer.Close>
                    </div>

                    <div className="no-scrollbar flex-1 overflow-y-auto px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
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
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    )
}
