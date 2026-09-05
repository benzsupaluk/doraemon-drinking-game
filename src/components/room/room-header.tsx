'use client'

import { useState } from 'react'
import { RulesSheet } from '@/components/rules-sheet'
import { useSoundEnabled } from '@/hooks/use-session'
import { unlockAudio } from '@/lib/feedback'
import { setSoundEnabled } from '@/lib/session'

interface Props {
    code: string
    connection: 'connecting' | 'live' | 'lost'
    right?: React.ReactNode
    /** Shows the leave/cancel button. Screens without one leave this out. */
    onQuit?: () => void
    /** Label for that button, since the host cancels the group instead of leaving. */
    quitLabel?: string
}

export function RoomHeader({ code, connection, right, onQuit, quitLabel }: Props) {
    const [rulesOpen, setRulesOpen] = useState(false)
    const sound = useSoundEnabled()

    const toggleSound = () => {
        unlockAudio()
        setSoundEnabled(!sound)
    }

    const dot = {
        live: { color: 'bg-emerald-400', label: 'เชื่อมต่อแล้ว' },
        connecting: { color: 'bg-gold', label: 'กำลังเชื่อมต่อ' },
        lost: { color: 'bg-drink', label: 'หลุดการเชื่อมต่อ' },
    }[connection]

    return (
        <>
            <header className="flex items-center justify-between gap-2 py-1">
                <div className="flex items-center gap-2">
                    <span className="text-[1.0625rem] font-semibold tracking-[0.16em]">{code}</span>
                    <span title={dot.label} className={`size-1.5 rounded-full ${dot.color}`} />
                    <span className="sr-only">{dot.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    {right}
                    <IconButton label={sound ? 'ปิดเสียง' : 'เปิดเสียง'} onClick={toggleSound}>
                        {sound ? '🔊' : '🔇'}
                    </IconButton>
                    <IconButton label="กฎการเล่น" onClick={() => setRulesOpen(true)}>
                        ?
                    </IconButton>
                    {onQuit && (
                        <IconButton label={quitLabel ?? 'ออกจากวง'} onClick={onQuit}>
                            🔚
                        </IconButton>
                    )}
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
            className="flex size-9 items-center justify-center rounded-full border border-line text-[0.9375rem] text-muted transition-opacity active:opacity-60"
        >
            {children}
        </button>
    )
}
