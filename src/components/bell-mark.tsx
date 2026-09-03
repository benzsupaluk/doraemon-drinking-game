/** The game's bell, drawn as original SVG. No copyrighted character is used. */
export function BellMark({ className = 'size-10', animated = false }: { className?: string; animated?: boolean }) {
    return (
        <svg
            viewBox="0 0 64 64"
            className={`${className} ${animated ? 'animate-bell origin-top' : ''}`}
            aria-hidden
        >
            <defs>
                <linearGradient id="bell-body" x1="0" y1="0" x2="0.4" y2="1">
                    <stop offset="0%" stopColor="#FFEFA8" />
                    <stop offset="45%" stopColor="#FFD93D" />
                    <stop offset="100%" stopColor="#E8A317" />
                </linearGradient>
            </defs>
            <path d="M30 3h4v10h-4z" fill="#0b3c6d" />
            <circle cx="32" cy="35" r="22" fill="url(#bell-body)" stroke="#8a5a08" strokeWidth="2.5" />
            <ellipse cx="23" cy="25" rx="6.5" ry="4.5" fill="#fffdf2" opacity="0.6" />
            <rect x="11" y="32.5" width="42" height="4" rx="2" fill="#8a5a08" />
            <path d="M32 36.5v6.5" stroke="#8a5a08" strokeWidth="3" strokeLinecap="round" />
            <circle cx="32" cy="47" r="4.5" fill="#8a5a08" />
        </svg>
    )
}

/** Three-line whisker motif, used to decorate headings. */
export function WhiskerLine({ className = '' }: { className?: string }) {
    return (
        <svg viewBox="0 0 120 24" className={className} aria-hidden>
            <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.55">
                <path d="M4 4h44" />
                <path d="M4 12h44" />
                <path d="M4 20h44" />
                <path d="M72 4h44" />
                <path d="M72 12h44" />
                <path d="M72 20h44" />
            </g>
        </svg>
    )
}
