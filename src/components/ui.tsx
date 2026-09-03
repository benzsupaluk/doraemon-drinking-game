'use client'

import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { playTap, unlockAudio } from '@/lib/feedback'

type Variant = 'primary' | 'ghost' | 'danger' | 'gold'

const VARIANTS: Record<Variant, string> = {
    primary:
        'bg-gradient-to-b from-dora-sky to-dora-blue text-dora-night shadow-[0_10px_0_-2px_#0b3c6d,0_18px_30px_-12px_rgba(41,171,226,0.8)]',
    gold: 'bg-gradient-to-b from-dora-yellow to-[#f0ab13] text-[#4a2d00] shadow-[0_10px_0_-2px_#8a5a08,0_18px_30px_-12px_rgba(255,217,61,0.7)]',
    danger:
        'bg-gradient-to-b from-[#ff6b60] to-dora-red text-white shadow-[0_10px_0_-2px_#8c1f18,0_18px_30px_-12px_rgba(232,69,60,0.7)]',
    ghost: 'glass text-dora-cream shadow-none',
}

/**
 * NOTE: the button base sets no width at all. A `w-full` in the base collides
 * with a `w-auto` passed through `className`, and Tailwind resolves that by CSS
 * order rather than by the order of the class string. Buttons that want to fill
 * their container pass `w-full` themselves.
 */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant
    loading?: boolean
    /** Suppress the click sound, for buttons that already play one of their own. */
    silent?: boolean
}

export function Button({
    variant = 'primary',
    loading = false,
    silent = false,
    className = '',
    children,
    onClick,
    disabled,
    ...rest
}: ButtonProps) {
    return (
        <button
            {...rest}
            disabled={disabled || loading}
            onClick={(event) => {
                unlockAudio()
                if (!silent) playTap()
                onClick?.(event)
            }}
            className={`relative inline-flex min-h-13 items-center justify-center gap-2 overflow-hidden rounded-2xl px-5 text-lg font-bold transition-[transform,filter] duration-150 active:translate-y-1 active:brightness-95 disabled:pointer-events-none disabled:opacity-45 disabled:shadow-none ${VARIANTS[variant]} ${className}`}
            style={{ fontFamily: 'var(--font-display)' }}
        >
            {loading ? <span className="size-5 animate-spin rounded-full border-2 border-current border-t-transparent" /> : children}
        </button>
    )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
    return <div className={`glass rounded-3xl p-5 ${className}`}>{children}</div>
}

export function Pill({ children, className = '' }: { children: ReactNode; className?: string }) {
    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}
        >
            {children}
        </span>
    )
}
