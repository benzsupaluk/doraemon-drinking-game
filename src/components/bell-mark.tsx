/**
 * The game's bell, drawn as original line art. No copyrighted character is used.
 * Stroked rather than filled to sit quietly in a minimal layout.
 */
export function BellMark({ className = 'size-8' }: { className?: string }) {
    return (
        <svg viewBox="0 0 32 32" className={className} aria-hidden fill="none">
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
