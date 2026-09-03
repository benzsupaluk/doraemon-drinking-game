'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { BellMark, WhiskerLine } from '@/components/bell-mark'
import { RulesSheet } from '@/components/rules-sheet'
import { Button } from '@/components/ui'
import { createRoom } from '@/lib/api'
import { playStart, unlockAudio } from '@/lib/feedback'
import { loadLastName, savePlayerId, saveLastName } from '@/lib/session'

const MIN_PLAYERS = 2
const MAX_PLAYERS = 12

export default function HomePage() {
    const router = useRouter()
    const [name, setName] = useState('')
    const [maxPlayers, setMaxPlayers] = useState(4)
    const [joinCode, setJoinCode] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [rulesOpen, setRulesOpen] = useState(false)

    useEffect(() => {
        setName(loadLastName())
    }, [])

    const handleCreate = async () => {
        if (!name.trim()) {
            setError('ใส่ชื่อของหัวตี้ก่อนนะ')
            return
        }
        setLoading(true)
        setError(null)
        try {
            unlockAudio()
            const { state, playerId } = await createRoom(name, maxPlayers)
            savePlayerId(state.code, playerId)
            saveLastName(name.trim())
            playStart()
            router.push(`/room/${state.code}`)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'สร้างวงไม่สำเร็จ')
            setLoading(false)
        }
    }

    const handleJoin = () => {
        const code = joinCode.trim().toUpperCase()
        if (code.length !== 4) {
            setError('รหัสวงมี 4 ตัวอักษร')
            return
        }
        unlockAudio()
        router.push(`/room/${code}`)
    }

    return (
        <main className="app-shell flex min-h-dvh flex-col justify-center gap-6 py-10">
            <header className="animate-rise flex flex-col items-center gap-3 text-center">
                <BellMark className="size-24 drop-shadow-[0_10px_24px_rgba(255,217,61,0.35)]" animated />
                <h1
                    className="text-4xl leading-tight font-bold text-white drop-shadow-lg xs:text-5xl"
                    style={{ fontFamily: 'var(--font-display)' }}
                >
                    เกมส์โดรามอน
                </h1>
                <WhiskerLine className="h-4 w-40 text-dora-sky" />
                <p className="max-w-xs text-sm leading-relaxed text-dora-cream/75">
                    เกมไพ่วงเหล้าสุดฮา เปิดไพ่ไปเรื่อยๆ ใครได้ไพ่อะไรก็ทำตามนั้น
                    เล่นพร้อมกันได้ทั้งวงจากมือถือของแต่ละคน
                </p>
            </header>

            <section
                className="glass animate-rise space-y-4 rounded-3xl p-5"
                style={{ animationDelay: '80ms' }}
            >
                <div className="space-y-2">
                    <label htmlFor="host-name" className="text-sm font-semibold text-dora-cream/80">
                        ชื่อหัวตี้
                    </label>
                    <input
                        id="host-name"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        maxLength={16}
                        placeholder="เช่น โนบิตะ"
                        autoComplete="off"
                        className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3.5 text-lg font-semibold text-white placeholder:text-white/35 focus:border-dora-sky focus:outline-none"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-dora-cream/80">จำนวนสมาชิกในวง</label>
                    <div className="flex items-center gap-3">
                        <Stepper
                            label="ลด"
                            symbol="−"
                            onClick={() => setMaxPlayers((value) => Math.max(MIN_PLAYERS, value - 1))}
                            disabled={maxPlayers <= MIN_PLAYERS}
                        />
                        <div className="flex-1 rounded-2xl border border-white/20 bg-white/10 py-2.5 text-center">
                            <p
                                className="text-4xl leading-none font-bold text-dora-yellow"
                                style={{ fontFamily: 'var(--font-display)' }}
                            >
                                {maxPlayers}
                            </p>
                            <p className="text-xs text-dora-cream/55">คน</p>
                        </div>
                        <Stepper
                            label="เพิ่ม"
                            symbol="+"
                            onClick={() => setMaxPlayers((value) => Math.min(MAX_PLAYERS, value + 1))}
                            disabled={maxPlayers >= MAX_PLAYERS}
                        />
                    </div>
                    <p className="text-xs text-dora-cream/50">
                        สร้างวงแล้วจะได้ลิงก์ไปแชร์ให้เพื่อนกดเข้ามาได้เลย
                    </p>
                </div>

                <Button variant="gold" loading={loading} onClick={handleCreate} silent className="w-full">
                    🔔 สร้างวงใหม่
                </Button>
                {error && <p className="text-center text-sm font-semibold text-dora-red">{error}</p>}
            </section>

            <section
                className="animate-rise space-y-3"
                style={{ animationDelay: '160ms' }}
            >
                <div className="flex items-center gap-3 text-xs text-dora-cream/40">
                    <span className="h-px flex-1 bg-white/15" />
                    หรือมีรหัสวงอยู่แล้ว
                    <span className="h-px flex-1 bg-white/15" />
                </div>
                <div className="flex gap-2">
                    <input
                        value={joinCode}
                        onChange={(event) => setJoinCode(event.target.value.toUpperCase().slice(0, 4))}
                        onKeyDown={(event) => event.key === 'Enter' && handleJoin()}
                        placeholder="ABCD"
                        inputMode="text"
                        autoCapitalize="characters"
                        autoComplete="off"
                        className="min-w-0 flex-1 rounded-2xl border border-white/20 bg-white/10 px-4 py-3.5 text-center text-2xl font-black tracking-[0.4em] text-white uppercase placeholder:tracking-[0.4em] placeholder:text-white/25 focus:border-dora-sky focus:outline-none"
                    />
                    <Button variant="ghost" onClick={handleJoin} className="shrink-0 px-6">
                        เข้าวง
                    </Button>
                </div>
            </section>

            <button
                onClick={() => setRulesOpen(true)}
                className="animate-rise mx-auto text-sm font-semibold text-dora-sky underline decoration-dotted underline-offset-4"
                style={{ animationDelay: '220ms' }}
            >
                อ่านกฎทั้งหมดก่อนเล่น →
            </button>

            <RulesSheet open={rulesOpen} onClose={() => setRulesOpen(false)} />
        </main>
    )
}

function Stepper({
    label,
    symbol,
    onClick,
    disabled,
}: {
    label: string
    symbol: string
    onClick: () => void
    disabled: boolean
}) {
    return (
        <button
            aria-label={label}
            onClick={onClick}
            disabled={disabled}
            className="glass flex size-14 shrink-0 items-center justify-center rounded-2xl text-3xl font-bold text-white transition active:scale-90 disabled:opacity-30"
        >
            {symbol}
        </button>
    )
}
