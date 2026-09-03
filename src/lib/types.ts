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
    /** ไพ่ 8 ที่เก็บติดตัวไว้ */
    heldCards: Card[]
    /** id ของบัดดี้ที่จับคู่กันไว้ (ไพ่ 5) */
    buddyId: string | null
    /** โดนไพ่ Q อยู่ — ห้ามพูดกับคนนี้ */
    silenced: boolean
    /** จำนวนไพ่ที่เปิดไปแล้ว (สถิติสนุกๆ) */
    cardsDrawn: number
}

export type RoomStatus = 'lobby' | 'playing' | 'finished'

/** idle = รอคนปัจจุบันเปิดไพ่, revealed = ไพ่เปิดแล้วรออ่านกฎ */
export type TurnPhase = 'idle' | 'revealed'

export interface LogEntry {
    id: string
    playerId: string
    playerName: string
    card: Card
    at: number
}

/** state ที่ส่งให้ client ทุกคน (ไม่มีสำรับจริงอยู่ในนี้) */
export interface RoomState {
    code: string
    maxPlayers: number
    status: RoomStatus
    phase: TurnPhase
    players: Player[]
    /** index ใน players ของคนที่ถึงตา */
    turnIndex: number
    deckCount: number
    currentCard: Card | null
    /** ไพ่ K ที่เปิดไปแล้ว 0-4 */
    kingCount: number
    /** true = ไพ่ 5 เพิ่งเปิด และเจ้าของตายังไม่เลือกบัดดี้ */
    awaitingBuddy: boolean
    log: LogEntry[]
    version: number
}
