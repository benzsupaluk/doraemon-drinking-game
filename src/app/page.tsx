'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { BellMark } from '@/components/bell-mark'
import { RulesSheet } from '@/components/rules-sheet'
import { Button, Field, Panel } from '@/components/ui'
import { createRoom } from '@/lib/api'
import { playStart, unlockAudio } from '@/lib/feedback'
import { useRememberedName } from '@/hooks/use-session'
import { savePlayerId, saveLastName } from '@/lib/session'

const MIN_PLAYERS = 2
const MAX_PLAYERS = 12

export default function HomePage() {
    const router = useRouter()
    // `remembered` comes from localStorage, `typed` is what the user has
    // overridden. Keeping them apart lets us prefill without a setState in an effect.
    const remembered = useRememberedName()
    const [typed, setTyped] = useState<string | null>(null)
    const name = typed ?? remembered
    const [maxPlayers, setMaxPlayers] = useState(4)
    const [joinCode, setJoinCode] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [rulesOpen, setRulesOpen] = useState(false)

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
        <main className="app-shell stagger flex min-h-dvh flex-col justify-center gap-5 py-8">
            <header className="animate-fade-up flex flex-col items-center gap-2.5 text-center">
                <BellMark className="size-12 text-accent" swing />
                <h1 className="text-[2rem] leading-tight font-semibold xs:text-[2.25rem]">
                    เกมส์โดรามอน
                </h1>
                <p className="max-w-[19rem] text-[0.9375rem] leading-relaxed text-muted">
                    เกมไพ่วงเหล้า เปิดไพ่ไปเรื่อยๆ ใครได้ไพ่อะไรก็ทำตามนั้น
                    เล่นพร้อมกันทั้งวงจากมือถือของแต่ละคน
                </p>
            </header>

            <Panel className="animate-fade-up space-y-4">
                <Field
                    label="ชื่อหัวตี้"
                    value={name}
                    onChange={(event) => setTyped(event.target.value)}
                    maxLength={16}
                    placeholder="เช่น โนบิตะ"
                    autoComplete="off"
                />

                <div className="space-y-1.5">
                    <span className="label block">จำนวนสมาชิกในวง</span>
                    <div className="flex items-center gap-2">
                        <Stepper
                            label="ลด"
                            symbol="−"
                            onClick={() => setMaxPlayers((v) => Math.max(MIN_PLAYERS, v - 1))}
                            disabled={maxPlayers <= MIN_PLAYERS}
                        />
                        <div className="flex-1 rounded-field border border-line bg-ink py-2.5 text-center">
                            <span className="text-[1.375rem] font-semibold">{maxPlayers}</span>
                            <span className="ml-1 text-[0.9375rem] text-muted">คน</span>
                        </div>
                        <Stepper
                            label="เพิ่ม"
                            symbol="+"
                            onClick={() => setMaxPlayers((v) => Math.min(MAX_PLAYERS, v + 1))}
                            disabled={maxPlayers >= MAX_PLAYERS}
                        />
                    </div>
                </div>

                <Button variant="primary" loading={loading} onClick={handleCreate} silent className="w-full">
                    สร้างวงใหม่
                </Button>
                {error && <p className="text-center text-[0.9375rem] text-drink">{error}</p>}
            </Panel>

            <section className="animate-fade-up space-y-2.5">
                <div className="flex items-center gap-3">
                    <span className="h-px flex-1 bg-line" />
                    <span className="label">หรือมีรหัสวงอยู่แล้ว</span>
                    <span className="h-px flex-1 bg-line" />
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
                        aria-label="รหัสวง"
                        className="min-w-0 flex-1 rounded-field border border-line bg-ink px-3.5 py-3 text-center text-[1.1875rem] font-semibold tracking-[0.3em] uppercase placeholder:text-muted/40 focus:border-accent focus:outline-none"
                    />
                    <Button variant="ghost" onClick={handleJoin} className="shrink-0">
                        เข้าวง
                    </Button>
                </div>
            </section>

            <button
                onClick={() => setRulesOpen(true)}
                className="animate-fade-up mx-auto text-[0.9375rem] font-medium text-accent"
            >
                อ่านกฎทั้งหมด
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
            className="flex size-12 shrink-0 items-center justify-center rounded-field border border-line bg-ink text-[1.375rem] font-medium transition-opacity active:opacity-60 disabled:opacity-30"
        >
            {symbol}
        </button>
    )
}
