export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs'

export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K'

export interface Card {
    id: string
    suit: Suit
    rank: Rank
}

export interface Player {
    id: string
    name: string
    isHost: boolean
    joinedAt: number
    /** Held 8s, kept in hand. */
    heldCards: Card[]
    /** Id of the paired buddy (from card 5). */
    buddyId: string | null
    /** Currently under the Q: nobody may speak to them. */
    silenced: boolean
    /** How many cards they have flipped, just for the end-of-round summary. */
    cardsDrawn: number
}

export type RoomStatus = 'lobby' | 'playing' | 'finished'

/** idle = waiting for the current player to flip; revealed = flipped, reading the rule. */
export type TurnPhase = 'idle' | 'revealed'

/** One line of the King's order, set by whoever drew King 1, 2 or 3. */
export interface KingDecree {
    /** Which King set it: 1 = what, 2 = where, 3 = how/how long. */
    step: number
    text: string
    playerId: string
    playerName: string
}

export interface LogEntry {
    id: string
    playerId: string
    playerName: string
    card: Card
    at: number
}

/** The state sent to every client. The real deck is deliberately not in here. */
export interface RoomState {
    code: string
    maxPlayers: number
    status: RoomStatus
    phase: TurnPhase
    players: Player[]
    /** Index into `players` of whoever's turn it is. */
    turnIndex: number
    deckCount: number
    currentCard: Card | null
    /** Kings drawn so far, 0-4. */
    kingCount: number
    /** What the first three Kings ordered, in the order they were set. */
    kingDecrees: KingDecree[]
    /** True when a 5 was just drawn and the current player has not picked a buddy yet. */
    awaitingBuddy: boolean
    log: LogEntry[]
    version: number
}
