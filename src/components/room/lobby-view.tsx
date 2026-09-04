'use client'

import { useState } from 'react'
import { RoomHeader } from './room-header'
import type { ViewProps } from './types'
import { BellMark } from '@/components/bell-mark'
import { Button, Panel } from '@/components/ui'
import { playTap } from '@/lib/feedback'

export function LobbyView({ state, me, connection, error, setError, act, origin }: ViewProps) {
    const [copied, setCopied] = useState(false)
    const [starting, setStarting] = useState(false)

    // `origin` comes from request headers server-side, so the link is correct in the first HTML.
    const inviteUrl = `${origin}/room/${state.code}`
    const emptySeats = Math.max(0, state.maxPlayers - state.players.length)
    const canStart = state.players.length >= 2

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(inviteUrl)
            setCopied(true)
            setTimeout(() => setCopied(false), 1800)
        } catch {
            setError('คัดลอกไม่ได้ ลองกดค้างที่ลิงก์เพื่อคัดลอกเองนะ')
        }
    }

    const handleShare = async () => {
        playTap()
        // Most phones get the native share sheet; without it, fall back to copying.
        if (typeof navigator.share === 'function') {
            try {
                await navigator.share({
                    title: 'เกมส์โดรามอน',
                    text: `มาเล่นเกมส์โดรามอนกัน! รหัสวง ${state.code}`,
                    url: inviteUrl,
                })
                return
            } catch {
                // The user dismissed the share sheet: fall through to copying.
            }
        }
        await handleCopy()
    }

    const handleStart = async () => {
        setStarting(true)
        const ok = await act(me.id, { type: 'start' })
        if (!ok) setStarting(false)
    }

    return (
        <main className="app-shell flex min-h-dvh flex-col pb-4">
            <RoomHeader code={state.code} connection={connection} />

            <div className="stagger flex-1 space-y-4 pt-2">
                <header className="space-y-1">
                    <h1 className="flex items-center gap-2 text-[1.375rem] font-semibold">
                        <BellMark className="size-6 text-accent" swing />
                        รอเพื่อนเข้าวง
                    </h1>
                    <p className="text-[0.9375rem] text-muted">
                        หัวตี้กดเริ่มได้เมื่อมีอย่างน้อย 2 คน เกมจะสุ่มคนเริ่มให้เอง
                    </p>
                </header>

                <Panel className="space-y-3">
                    <p className="label">ลิงก์เชิญเพื่อน</p>
                    <p className="no-scrollbar overflow-x-auto rounded-field border border-line bg-ink px-3 py-2.5 font-mono text-[0.8125rem] whitespace-nowrap text-accent select-all">
                        {inviteUrl}
                    </p>
                    <div className="flex gap-2">
                        <Button variant="primary" onClick={handleShare} silent className="min-w-0 flex-1">
                            แชร์ลิงก์
                        </Button>
                        <Button variant="ghost" onClick={handleCopy} className="shrink-0">
                            {copied ? 'คัดลอกแล้ว' : 'คัดลอก'}
                        </Button>
                    </div>
                    <p className="text-center text-[0.875rem] text-muted">
                        หรือให้เพื่อนกรอกรหัส{' '}
                        <span className="font-semibold tracking-[0.16em] text-text">{state.code}</span>
                    </p>
                </Panel>

                <section className="space-y-2">
                    <div className="flex items-baseline justify-between">
                        <p className="label">สมาชิกในวง</p>
                        <span className="text-[0.875rem] text-muted">
                            {state.players.length}/{state.maxPlayers} คน
                        </span>
                    </div>

                    <ul className="panel divide-y divide-line rounded-panel">
                        {state.players.map((player) => (
                            <li
                                key={player.id}
                                className="animate-fade-up flex items-center gap-3 px-3.5 py-3"
                            >
                                <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-line text-[0.9375rem] font-semibold text-accent">
                                    {player.name.slice(0, 1)}
                                </span>
                                <span className="flex-1 truncate text-[1.0625rem] font-medium">
                                    {player.name}
                                </span>
                                {player.isHost && (
                                    <span className="text-[0.8125rem] text-gold">หัวตี้</span>
                                )}
                                {player.id === me.id && (
                                    <span className="text-[0.8125rem] text-muted">คุณ</span>
                                )}
                            </li>
                        ))}
                        {Array.from({ length: emptySeats }).map((_, index) => (
                            <li
                                key={`empty-${index}`}
                                className="flex items-center gap-3 px-3.5 py-3 text-muted/50"
                            >
                                <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-dashed border-line text-[0.9375rem]">
                                    ·
                                </span>
                                <span className="text-[0.9375rem]">รอเพื่อน...</span>
                            </li>
                        ))}
                    </ul>
                </section>

                {error && <p className="text-center text-[0.9375rem] text-drink">{error}</p>}
            </div>

            <div className="sticky bottom-0 mt-4 bg-ink pt-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
                {me.isHost ? (
                    <Button
                        variant="gold"
                        onClick={handleStart}
                        loading={starting}
                        disabled={!canStart}
                        silent
                        className="w-full"
                    >
                        {canStart ? 'เริ่มเกม' : 'ต้องมีอย่างน้อย 2 คน'}
                    </Button>
                ) : (
                    <p className="py-3 text-center text-[0.9375rem] text-muted">
                        รอหัวตี้กดเริ่มเกม ไม่ต้องรีเฟรช
                    </p>
                )}
            </div>
        </main>
    )
}
