/**
 * The game's bell, drawn as original line art. No copyrighted character is used.
 *
 * It swings from the hanger at the top, so `transform-origin` sits there rather
 * than at the centre of the box.
 */
export function BellMark({
    className = 'size-8',
    swing = false,
    ring = false,
}: {
    className?: string
    /** Gentle idle sway with an occasional ring. */
    swing?: boolean
    /** Faster, insistent ring — used when it is your turn. */
    ring?: boolean
}) {
    const motion = ring ? 'animate-bell-ring' : swing ? 'animate-bell' : ''
    return (
        <svg
            viewBox="0 0 32 32"
            className={`${className} ${motion}`}
            style={{ transformOrigin: '50% 9%' }}
            aria-hidden
            fill="none"
        >
            <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <path d="M16 3v3" />
                <circle cx="16" cy="18" r="11" />
                <path d="M5.4 16.5h21.2" />
                <path d="M16 19.5v3" />
                <circle cx="16" cy="24.6" r="2.2" />
            </g>
        </svg>
    )
}
