'use client'

/**
 * One button on the floating rail down the right edge of the game screen.
 *
 * These open things that matter for the whole round rather than the current
 * turn (the King's order, the cards in your hand), so they stay reachable while
 * the table plays on instead of living in a row that comes and goes.
 */
export function SideBadge({
    label,
    caption,
    highlight = false,
    onClick,
    children,
}: {
    label: string
    /** Small line under the icon, e.g. a count. */
    caption: string
    /** Draw attention to it — the moment it starts to matter. */
    highlight?: boolean
    onClick: () => void
    children: React.ReactNode
}) {
    return (
        <button
            type="button"
            aria-label={label}
            onClick={onClick}
            className={`flex size-10 flex-col items-center justify-center gap-0.5 rounded-full border bg-surface/95 shadow-lg backdrop-blur transition-transform active:scale-95 ${
                highlight ? 'animate-pop border-gold' : 'border-line'
            }`}
        >
            <span className="text-[1.125rem] leading-none">{children}</span>
            <span className="text-[0.6875rem] leading-none font-semibold text-gold">{caption}</span>
        </button>
    )
}
