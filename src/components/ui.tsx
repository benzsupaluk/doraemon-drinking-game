'use client'

import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { playTap, unlockAudio } from '@/lib/feedback'

type Variant = 'primary' | 'ghost' | 'gold'

const VARIANTS: Record<Variant, string> = {
    primary: 'bg-accent text-accent-ink',
    gold: 'bg-gold text-[#241a02]',
    ghost: 'panel text-text',
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
            className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-field px-5 text-[0.9375rem] font-semibold transition-opacity active:opacity-70 disabled:pointer-events-none disabled:opacity-40 ${VARIANTS[variant]} ${className}`}
        >
            {loading ? (
                <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
                children
            )}
        </button>
    )
}

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
    return <div className={`panel rounded-panel p-4 ${className}`}>{children}</div>
}

export function Field({
    label,
    className = '',
    ...rest
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <label className="block space-y-1.5">
            <span className="label block">{label}</span>
            <input
                {...rest}
                className={`w-full rounded-field border border-line bg-ink px-3.5 py-3 font-medium text-text placeholder:text-muted/60 focus:border-accent focus:outline-none ${className}`}
            />
        </label>
    )
}
