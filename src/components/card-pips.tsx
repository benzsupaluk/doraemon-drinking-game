import type { Rank, Suit } from '@/lib/types'
import { SUIT_SYMBOL } from '@/lib/rules'

/**
 * Pip positions for a standard deck, as fractions of the pip field.
 *
 * x: 0 = left column, 0.5 = centre, 1 = right column
 * y: 0 = top row, 1 = bottom row
 *
 * These are the arrangements printed on real cards — the 7 and 8 get their
 * extra pips between the rows rather than in them, and the 9 and 10 switch to a
 * four-row grid. Anything in the lower half is printed upside down, same as the
 * real thing.
 */
const PIPS: Partial<Record<Rank, [number, number][]>> = {
    A: [[0.5, 0.5]],
    '2': [
        [0.5, 0],
        [0.5, 1],
    ],
    '3': [
        [0.5, 0],
        [0.5, 0.5],
        [0.5, 1],
    ],
    '4': [
        [0, 0],
        [1, 0],
        [0, 1],
        [1, 1],
    ],
    '5': [
        [0, 0],
        [1, 0],
        [0.5, 0.5],
        [0, 1],
        [1, 1],
    ],
    '6': [
        [0, 0],
        [1, 0],
        [0, 0.5],
        [1, 0.5],
        [0, 1],
        [1, 1],
    ],
    '7': [
        [0, 0],
        [1, 0],
        [0.5, 0.25],
        [0, 0.5],
        [1, 0.5],
        [0, 1],
        [1, 1],
    ],
    '8': [
        [0, 0],
        [1, 0],
        [0.5, 0.25],
        [0, 0.5],
        [1, 0.5],
        [0.5, 0.75],
        [0, 1],
        [1, 1],
    ],
    '9': [
        [0, 0],
        [1, 0],
        [0, 1 / 3],
        [1, 1 / 3],
        [0.5, 0.5],
        [0, 2 / 3],
        [1, 2 / 3],
        [0, 1],
        [1, 1],
    ],
    '10': [
        [0, 0],
        [1, 0],
        [0.5, 1 / 6],
        [0, 1 / 3],
        [1, 1 / 3],
        [0, 2 / 3],
        [1, 2 / 3],
        [0.5, 5 / 6],
        [0, 1],
        [1, 1],
    ],
}

const COURT: Partial<Record<Rank, string>> = { J: 'J', Q: 'Q', K: 'K' }

export function CardPips({ rank, suit, color }: { rank: Rank; suit: Suit; color: string }) {
    const symbol = SUIT_SYMBOL[suit]
    const court = COURT[rank]

    if (court) {
        return (
            <div className="flex size-full items-center justify-center">
                <div
                    className="flex size-full flex-col items-center justify-center gap-0.5 rounded-[3px] border-2"
                    style={{ borderColor: color, color }}
                >
                    <span className="text-[2.5rem] leading-none font-semibold">{court}</span>
                    <span className="text-xl leading-none">{symbol}</span>
                </div>
            </div>
        )
    }

    const pips = PIPS[rank]
    if (!pips) return null

    // The ace gets one large pip, the way a real deck prints it.
    const pipSize = rank === 'A' ? '3.25rem' : '1.5rem'

    return (
        // font-size is set on the field so the inset below can be expressed in
        // em: pips sit at the edges of that inset box, which keeps the outermost
        // ones fully inside the field instead of half-cropped by it.
        <div className="relative size-full" style={{ color, fontSize: pipSize }}>
            <div className="absolute inset-[0.5em]">
                {pips.map(([x, y], index) => (
                    <span
                        key={index}
                        className="absolute text-[2em] leading-none"
                        style={{
                            left: `${x * 100}%`,
                            top: `${y * 100}%`,
                            transform: `translate(-50%, -50%)${y > 0.5 ? ' rotate(180deg)' : ''}`,
                        }}
                    >
                        {symbol}
                    </span>
                ))}
            </div>
        </div>
    )
}
