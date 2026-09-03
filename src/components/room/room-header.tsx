'use client'

import { useEffect, useState } from 'react'
import { RulesSheet } from '@/components/rules-sheet'
import { isSoundEnabled, setSoundEnabled, unlockAudio } from '@/lib/feedback'

interface Props {
    code: string
    connection: 'connecting' | 'live' | 'lost'
    right?: React.ReactNode
}

export function RoomHeader({ code, connection, right }: Props) {
    const [rulesOpen, setRulesOpen] = useState(false)
    const [sound, setSound] = useState(true)

    useEffect(() => {
        setSound(isSoundEnabled())
    }, [])

    const toggleSound = () => {
        unlockAudio()
        const next = !sound
        setSound(next)
        setSoundEnabled(next)
    }

    return (
        <>
            <header className="flex items-center justify-between gap-2 pt-3">
                <div className="flex items-center gap-2">
                    <span
                        className="rounded-xl bg-white/10 px-3 py-1.5 text-lg font-bold tracking-[0.2em] text-dora-yellow"
                        style={{ fontFamily: 'var(--font-display)' }}
                    >
                        {code}
                    </span>
                    <ConnectionDot connection={connection} />
                </div>
                <div className="flex items-center gap-2">
                    {right}
                    <IconButton label={sound ? 'ปิดเสียง' : 'เปิดเสียง'} onClick={toggleSound}>
                        {sound ? '🔊' : '🔇'}
                    </IconButton>
                    <IconButton label="กฎการเล่น" onClick={() => setRulesOpen(true)}>
                        ❓
                    </IconButton>
                </div>
            </header>
            <RulesSheet open={rulesOpen} onClose={() => setRulesOpen(false)} />
        </>
    )
}

function IconButton({
    label,
    onClick,
    children,
}: {
    label: string
    onClick: () => void
    children: React.ReactNode
}) {
    return (
        <button
            aria-label={label}
            onClick={onClick}
            className="glass flex size-10 items-center justify-center rounded-xl text-lg transition active:scale-90"
        >
            {children}
        </button>
    )
}

function ConnectionDot({ connection }: { connection: Props['connection'] }) {
    const map = {
        live: { color: 'bg-emerald-400', label: 'เชื่อมต่อแล้ว' },
        connecting: { color: 'bg-dora-yellow animate-pulse', label: 'กำลังเชื่อมต่อ' },
        lost: { color: 'bg-dora-red animate-pulse', label: 'หลุดการเชื่อมต่อ' },
    }[connection]

    return (
        <span title={map.label} className="flex items-center gap-1.5">
            <span className={`size-2 rounded-full ${map.color}`} />
            <span className="sr-only">{map.label}</span>
        </span>
    )
}
