'use client'

import { Drawer } from 'vaul'
import { SideBadge } from './side-badge'
import type { RoomState } from '@/lib/types'
import { kingDecreeSlots } from '@/lib/rules'

/**
 * The King's standing order: what the group has decided so far, and who is
 * about to be on the hook for it.
 *
 * It lives behind a floating button because it matters for the whole round, not
 * just the turn that set it — the card on the table has moved on long before
 * the fourth King arrives.
 */
export function KingStatus({
    state,
    open,
    onOpenChange,
}: {
    state: RoomState
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    const slots = kingDecreeSlots(state)
    const settled = slots.filter((slot) => slot.decree).length
    // The log is newest first, so the latest King is the one at the front.
    const lastKing = state.log.find((entry) => entry.card.rank === 'K')

    return (
        <>
            <SideBadge
                label={`คำสั่งของราชา เปิด K แล้ว ${state.kingCount} จาก 4 ใบ`}
                caption={`${state.kingCount}/4`}
                highlight={state.kingCount >= 4}
                onClick={() => onOpenChange(true)}
            >
                👑
            </SideBadge>

            <Drawer.Root open={open} onOpenChange={onOpenChange}>
                <Drawer.Portal>
                    <Drawer.Overlay className="fixed inset-0 z-40 bg-black/60" />
                    <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[85dvh] flex-col rounded-t-panel border-t border-line bg-ink outline-none sm:max-w-105">
                        <Drawer.Handle className="my-2.5 !bg-line" />

                        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
                            <Drawer.Title className="font-semibold">👑 ราชาสั่งได้</Drawer.Title>
                            <Drawer.Description className="sr-only">
                                คำสั่งที่ราชาแต่ละใบกำหนดไว้ในรอบนี้
                            </Drawer.Description>
                            <Drawer.Close
                                aria-label="ปิด"
                                className="flex size-8 items-center justify-center rounded-full border border-line text-muted"
                            >
                                ✕
                            </Drawer.Close>
                        </div>

                        <div className="no-scrollbar flex-1 overflow-y-auto px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                            <p className="text-[0.9375rem] text-muted">
                                เปิด K ไปแล้ว{' '}
                                <span className="font-semibold text-gold">{state.kingCount}/4</span>{' '}
                                ใบ · กำหนดคำสั่งแล้ว {settled}/3 ข้อ
                            </p>

                            <ul className="mt-3 space-y-2">
                                {slots.map((slot) => (
                                    <li
                                        key={slot.step}
                                        className={`rounded-panel border px-3.5 py-3 ${
                                            slot.decree
                                                ? 'border-line bg-surface'
                                                : 'border-dashed border-line'
                                        }`}
                                    >
                                        <p className="label">
                                            ใบที่ {slot.step} · {slot.label}
                                        </p>
                                        {slot.decree ? (
                                            <>
                                                <p className="mt-1 text-[1.0625rem] font-medium break-words">
                                                    {slot.decree.text}
                                                </p>
                                                <p className="mt-0.5 text-[0.8125rem] text-muted">
                                                    โดย {slot.decree.playerName}
                                                </p>
                                            </>
                                        ) : (
                                            <p className="mt-1 text-[0.9375rem] text-muted/70">
                                                ยังไม่มีใครกำหนด
                                            </p>
                                        )}
                                    </li>
                                ))}
                            </ul>

                            <p className="mt-4 rounded-panel border border-line px-3.5 py-3 text-[0.9375rem] leading-relaxed">
                                {state.kingCount >= 4 ? (
                                    <span className="text-gold">
                                        ใบที่ 4 ออกแล้ว! {lastKing?.playerName ?? 'คนที่เปิด'}{' '}
                                        ต้องทำทุกอย่างที่กำหนดไว้ข้างบน 💀
                                    </span>
                                ) : (
                                    <span className="text-muted">
                                        เหลืออีก {4 - state.kingCount} ใบ ใครเปิด K ใบที่ 4
                                        ต้องทำทุกอย่างที่กำหนดไว้ข้างบน
                                    </span>
                                )}
                            </p>
                        </div>
                    </Drawer.Content>
                </Drawer.Portal>
            </Drawer.Root>
        </>
    )
}
