'use client'

import { useEffect, useState } from 'react'
import { RoomHeader } from './room-header'
import type { ViewProps } from './types'
import { BellMark } from '@/components/bell-mark'
import { Button } from '@/components/ui'
import { playTap } from '@/lib/feedback'

export function LobbyView({ state, me, connection, error, setError, act }: ViewProps) {
    const [inviteUrl, setInviteUrl] = useState('')
    const [copied, setCopied] = useState(false)
    const [starting, setStarting] = useState(false)

    useEffect(() => {
        setInviteUrl(`${window.location.origin}/room/${state.code}`)
    }, [state.code])

    const full = state.players.length >= state.maxPlayers
    const canStart = state.players.length >= 2

    const handleShare = async () => {
        playTap()
        const shareData = {
            title: 'เกมส์โดรามอน 🔔',
            text: `มาเล่นเกมส์โดรามอนกัน! รหัสวง ${state.code}`,
            url: inviteUrl,
        }
        // มือถือส่วนใหญ่จะได้ share sheet ของเครื่อง ถ้าไม่มีก็ copy ให้เลย
        if (typeof navigator.share === 'function') {
            try {
                await navigator.share(shareData)
                return
            } catch {
                // ผู้ใช้กดยกเลิก share sheet — ตกไปใช้ copy ต่อ
            }
        }
        await handleCopy()
    }

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(inviteUrl)
            setCopied(true)
            setTimeout(() => setCopied(false), 1800)
        } catch {
            setError('คัดลอกไม่ได้ ลองกดค้างที่ลิงก์เพื่อคัดลอกเองนะ')
        }
    }

    const handleStart = async () => {
        setStarting(true)
        const ok = await act(me.id, { type: 'start' })
        if (!ok) setStarting(false)
    }

    return (
        <main className="app-shell flex min-h-dvh flex-col gap-5 pb-8">
            <RoomHeader code={state.code} connection={connection} />

            <section className="animate-rise flex flex-col items-center gap-2 text-center">
                <BellMark className="size-16" animated />
                <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                    รอเพื่อนเข้าวง
                </h1>
                <p className="text-sm text-dora-cream/70">
                    หัวตี้กดเริ่มได้เมื่อมีอย่างน้อย 2 คน — เกมจะสุ่มคนเริ่มให้เอง
                </p>
            </section>

            {/* ลิงก์เชิญเพื่อน */}
            <section className="glass animate-rise space-y-3 rounded-3xl p-5" style={{ animationDelay: '60ms' }}>
                <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-dora-cream/80">ลิงก์เชิญเพื่อน</p>
                    <span className="text-xs text-dora-cream/50">แชร์ให้ทุกคนในวง</span>
                </div>
                <p className="no-scrollbar overflow-x-auto rounded-2xl bg-black/25 px-4 py-3 font-mono text-xs whitespace-nowrap text-dora-sky select-all">
                    {inviteUrl || '...'}
                </p>
                <div className="flex gap-2">
                    <Button variant="primary" onClick={handleShare} silent className="min-w-0 flex-1">
                        📤 แชร์ลิงก์
                    </Button>
                    <Button variant="ghost" onClick={handleCopy} className="shrink-0 px-5">
                        {copied ? '✓ คัดลอกแล้ว' : 'คัดลอก'}
                    </Button>
                </div>
                <p className="text-center text-xs text-dora-cream/50">
                    หรือให้เพื่อนกรอกรหัส{' '}
                    <span className="font-bold tracking-widest text-dora-yellow">{state.code}</span> ที่หน้าแรก
                </p>
            </section>

            {/* สมาชิก */}
            <section className="animate-rise space-y-3" style={{ animationDelay: '120ms' }}>
                <div className="flex items-center justify-between px-1">
                    <p className="font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                        สมาชิกในวง
                    </p>
                    <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${full ? 'bg-emerald-400/20 text-emerald-300' : 'bg-white/10 text-dora-cream/70'}`}
                    >
                        {state.players.length}/{state.maxPlayers} คน
                    </span>
                </div>

                <ul className="space-y-2">
                    {state.players.map((player, index) => (
                        <li
                            key={player.id}
                            className="glass animate-pop-in flex items-center gap-3 rounded-2xl px-4 py-3"
                            style={{ animationDelay: `${index * 40}ms` }}
                        >
                            <span className="flex size-10 items-center justify-center rounded-full bg-gradient-to-b from-dora-sky to-dora-blue text-lg font-bold text-dora-night">
                                {player.name.slice(0, 1)}
                            </span>
                            <span className="flex-1 truncate font-semibold">{player.name}</span>
                            {player.isHost && (
                                <span className="rounded-full bg-dora-yellow/20 px-2.5 py-1 text-xs font-bold text-dora-yellow">
                                    👑 หัวตี้
                                </span>
                            )}
                            {player.id === me.id && (
                                <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-bold">คุณ</span>
                            )}
                        </li>
                    ))}

                    {Array.from({ length: Math.max(0, state.maxPlayers - state.players.length) }).map(
                        (_, index) => (
                            <li
                                key={`empty-${index}`}
                                className="flex items-center gap-3 rounded-2xl border border-dashed border-white/15 px-4 py-3 text-dora-cream/35"
                            >
                                <span className="flex size-10 items-center justify-center rounded-full border border-dashed border-white/20">
                                    ?
                                </span>
                                <span className="text-sm">รอเพื่อน...</span>
                            </li>
                        )
                    )}
                </ul>
            </section>

            {error && <p className="text-center text-sm font-semibold text-dora-red">{error}</p>}

            <div className="sticky bottom-0 mt-auto space-y-2 bg-gradient-to-t from-dora-night via-dora-night/90 to-transparent pt-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
                {me.isHost ? (
                    <Button
                        variant="gold"
                        onClick={handleStart}
                        loading={starting}
                        disabled={!canStart}
                        silent
                        className="w-full"
                    >
                        {canStart ? '🎲 เริ่มเกม — สุ่มคนเริ่ม' : 'ต้องมีอย่างน้อย 2 คน'}
                    </Button>
                ) : (
                    <div className="glass animate-nudge rounded-2xl px-5 py-4 text-center">
                        <p className="font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                            รอหัวตี้กดเริ่มเกม...
                        </p>
                        <p className="text-xs text-dora-cream/60">ไม่ต้องรีเฟรช เดี๋ยวเด้งเข้าเกมเอง</p>
                    </div>
                )}
            </div>
        </main>
    )
}
