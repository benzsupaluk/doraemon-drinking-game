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
    /** True when a 5 was just drawn and the current player has not picked a buddy yet. */
    awaitingBuddy: boolean
    log: LogEntry[]
    version: number
}
