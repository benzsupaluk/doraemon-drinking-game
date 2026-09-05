import { RoomError } from './errors'
import type { RoomRecord } from './store'
import { CARD_RULES, KING_DECREE_MAX, pendingKingStep } from '../rules'
import type { Card, LogEntry, Player, Rank, RoomState, Suit } from '../types'

const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs']
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

const LOG_LIMIT = 30

export const MIN_PLAYERS = 2
export const MAX_PLAYERS = 12

/**
 * How many players a round needs to start. Outside production a single tester
 * can start on their own, so the game screen can be worked on without opening a
 * second browser. Everything else still uses MIN_PLAYERS.
 */
export const MIN_TO_START = process.env.NODE_ENV === 'production' ? MIN_PLAYERS : 1

/**
 * Every game rule lives in this file, and every function here is pure: it only
 * mutates the record it was handed. No I/O at all, which is what lets the store
 * move between memory and Redis without touching any game logic.
 */

export function randomId(len = 10) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    let out = ''
    for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)]
    return out
}

/** Excludes easily confused characters (I O 0 1): codes get read out loud. */
export function randomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)]
    return code
}

function shuffle<T>(items: T[]): T[] {
    const out = [...items]
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[out[i], out[j]] = [out[j], out[i]]
    }
    return out
}

export function buildDeck(): Card[] {
    const deck: Card[] = []
    for (const suit of SUITS) {
        for (const rank of RANKS) {
            deck.push({ id: `${suit}-${rank}`, suit, rank })
        }
    }
    return shuffle(deck)
}

function bump(record: RoomRecord) {
    record.state.version += 1
}

function makePlayer(name: string, isHost: boolean): Player {
    return {
        id: randomId(),
        name,
        isHost,
        joinedAt: Date.now(),
        heldCards: [],
        buddyId: null,
        silenced: false,
        cardsDrawn: 0,
    }
}

export function sanitizeName(raw: unknown): string {
    if (typeof raw !== 'string') throw new RoomError('ใส่ชื่อก่อนนะ')
    const name = raw.trim().replace(/\s+/g, ' ').slice(0, 16)
    if (name.length < 1) throw new RoomError('ใส่ชื่อก่อนนะ')
    return name
}

export function clampPlayers(raw: unknown): number {
    const value = Number(raw)
    if (!Number.isFinite(value)) throw new RoomError('จำนวนสมาชิกไม่ถูกต้อง')
    return Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, Math.round(value)))
}

export function newRoomRecord(code: string, hostName: string, maxPlayers: number) {
    const host = makePlayer(sanitizeName(hostName), true)
    const state: RoomState = {
        code,
        maxPlayers,
        status: 'lobby',
        phase: 'idle',
        players: [host],
        turnIndex: 0,
        deckCount: 52,
        currentCard: null,
        kingCount: 0,
        kingDecrees: [],
        awaitingBuddy: false,
        log: [],
        version: 1,
    }
    const record: RoomRecord = { state, deck: buildDeck() }
    return { record, playerId: host.id }
}

/* ------------------------------- actions ----------------------------- */

export function join(record: RoomRecord, rawName: string) {
    const name = sanitizeName(rawName)
    const { state } = record

    if (state.status !== 'lobby') throw new RoomError('วงนี้เริ่มเล่นไปแล้ว รอรอบหน้านะ')
    if (state.players.length >= state.maxPlayers) throw new RoomError('วงนี้เต็มแล้ว')
    if (state.players.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
        throw new RoomError('มีคนใช้ชื่อนี้ในวงแล้ว ลองเปลี่ยนชื่อดู')
    }

    const player = makePlayer(name, false)
    state.players.push(player)
    bump(record)
    return player.id
}

function requirePlayer(record: RoomRecord, playerId: string): Player {
    const player = record.state.players.find((p) => p.id === playerId)
    if (!player) throw new RoomError('ไม่พบผู้เล่นนี้ในวง', 403)
    return player
}

function requireCurrentPlayer(record: RoomRecord, playerId: string): Player {
    const player = requirePlayer(record, playerId)
    if (record.state.players[record.state.turnIndex]?.id !== playerId) {
        throw new RoomError('ยังไม่ถึงตาของคุณ', 403)
    }
    return player
}

function resetPlayers(record: RoomRecord) {
    for (const p of record.state.players) {
        p.heldCards = []
        p.buddyId = null
        p.silenced = false
        p.cardsDrawn = 0
    }
}

export function start(record: RoomRecord, playerId: string) {
    const player = requirePlayer(record, playerId)
    if (!player.isHost) throw new RoomError('มีแค่หัวตี้ที่กดเริ่มเกมได้', 403)
    if (record.state.players.length < MIN_TO_START) {
        throw new RoomError('ต้องมีอย่างน้อย 2 คนถึงจะเริ่มได้')
    }

    const { state } = record
    record.deck = buildDeck()
    state.status = 'playing'
    state.phase = 'idle'
    state.deckCount = record.deck.length
    state.currentCard = null
    state.kingCount = 0
    state.kingDecrees = []
    state.awaitingBuddy = false
    state.log = []
    resetPlayers(record)
    // Pick the starting player at random.
    state.turnIndex = Math.floor(Math.random() * state.players.length)
    bump(record)
}

export function draw(record: RoomRecord, playerId: string) {
    const { state } = record
    if (state.status !== 'playing') throw new RoomError('เกมยังไม่เริ่ม')
    if (state.phase !== 'idle') throw new RoomError('เปิดไพ่ไปแล้ว')
    const player = requireCurrentPlayer(record, playerId)

    const card = record.deck.pop()
    if (!card) {
        state.status = 'finished'
        bump(record)
        return
    }

    const rule = CARD_RULES[card.rank]
    state.currentCard = card
    state.phase = 'revealed'
    state.deckCount = record.deck.length
    player.cardsDrawn += 1

    if (rule.action === 'hold') player.heldCards.push(card)
    // With nobody else in the room there is no buddy to pick, and waiting for
    // one would leave the turn stuck (only reachable while testing solo).
    if (rule.action === 'buddy' && state.players.length > 1) state.awaitingBuddy = true
    if (rule.action === 'king') state.kingCount = Math.min(state.kingCount + 1, 4)
    // A new Q moves the "do not speak to them" status onto whoever just drew it.
    if (card.rank === 'Q') {
        for (const p of state.players) p.silenced = p.id === player.id
    }

    const entry: LogEntry = {
        id: randomId(6),
        playerId: player.id,
        playerName: player.name,
        card,
        at: Date.now(),
    }
    state.log = [entry, ...state.log].slice(0, LOG_LIMIT)
    bump(record)
}

export function pickBuddy(record: RoomRecord, playerId: string, buddyId: string) {
    const { state } = record
    if (!state.awaitingBuddy) throw new RoomError('ยังไม่ถึงจังหวะเลือกบัดดี้')
    const player = requireCurrentPlayer(record, playerId)
    if (buddyId === playerId) throw new RoomError('เลือกตัวเองไม่ได้นะ')
    const buddy = requirePlayer(record, buddyId)

    // Clear both players' previous pairings first, so no stale pair is left
    // pointing at someone who now has a different buddy.
    for (const p of state.players) {
        if (p.buddyId === player.id || p.buddyId === buddy.id) p.buddyId = null
    }
    player.buddyId = buddy.id
    buddy.buddyId = player.id
    state.awaitingBuddy = false
    bump(record)
}

function sanitizeDecree(raw: unknown): string {
    if (typeof raw !== 'string') throw new RoomError('พิมพ์คำสั่งก่อนนะ')
    const text = raw.trim().replace(/\s+/g, ' ').slice(0, KING_DECREE_MAX)
    if (text.length < 1) throw new RoomError('พิมพ์คำสั่งก่อนนะ')
    return text
}

/**
 * Kings 1-3 each set one line of the order (what / where / how long). Only the
 * player who drew the King may set it, and only for the King now on the table:
 * `pendingKingStep` decides which, so a double tap cannot overwrite a line that
 * is already in.
 */
export function setKingDecree(record: RoomRecord, playerId: string, rawText: unknown) {
    const { state } = record
    const step = pendingKingStep(state)
    if (!step) throw new RoomError('ยังไม่ถึงจังหวะสั่งของราชา')
    const player = requireCurrentPlayer(record, playerId)

    state.kingDecrees = [
        ...state.kingDecrees,
        { step, text: sanitizeDecree(rawText), playerId: player.id, playerName: player.name },
    ]
    bump(record)
}

export function useHeldCard(record: RoomRecord, playerId: string, cardId: string) {
    const player = requirePlayer(record, playerId)
    const index = player.heldCards.findIndex((c) => c.id === cardId)
    if (index === -1) throw new RoomError('ไม่มีไพ่ใบนี้ติดตัว')
    player.heldCards.splice(index, 1)
    bump(record)
}

export function endTurn(record: RoomRecord, playerId: string) {
    const { state } = record
    if (state.phase !== 'revealed') throw new RoomError('ยังไม่ได้เปิดไพ่')
    if (state.awaitingBuddy) throw new RoomError('เลือกบัดดี้ก่อนถึงจะจบตาได้')
    if (pendingKingStep(state)) throw new RoomError('สั่งในฐานะราชาก่อนถึงจะจบตาได้')
    requireCurrentPlayer(record, playerId)

    state.currentCard = null
    state.phase = 'idle'

    if (record.deck.length === 0) {
        state.status = 'finished'
        bump(record)
        return
    }

    state.turnIndex = (state.turnIndex + 1) % state.players.length
    bump(record)
}

/** Returns true when nobody is left, so the caller can delete the room. */
export function leave(record: RoomRecord, playerId: string): boolean {
    const { state } = record
    const index = state.players.findIndex((p) => p.id === playerId)
    if (index === -1) return false

    const leaving = state.players[index]
    const wasTheirTurn = index === state.turnIndex

    for (const p of state.players) {
        if (p.buddyId === leaving.id) p.buddyId = null
    }
    state.players.splice(index, 1)

    if (state.players.length === 0) return true

    // Hand the host role to whoever joined earliest, otherwise the group could
    // never start another round.
    if (leaving.isHost) state.players[0].isHost = true

    if (index < state.turnIndex) state.turnIndex -= 1
    if (state.turnIndex >= state.players.length) state.turnIndex = 0

    // The player who left was the one on turn: clear the pending card, or the
    // group would be stuck on it forever.
    if (wasTheirTurn) {
        state.currentCard = null
        state.phase = 'idle'
        state.awaitingBuddy = false
    }
    if (state.status === 'playing' && state.players.length < MIN_PLAYERS) {
        state.status = 'finished'
    }
    bump(record)
    return false
}

/**
 * The host closes the whole group. Nothing to mutate: the caller deletes the
 * room, and everyone else's next poll 404s and lands on the "room is gone"
 * screen. Kept here so the permission check sits with the other rules.
 */
export function cancel(record: RoomRecord, playerId: string) {
    const player = requirePlayer(record, playerId)
    if (!player.isHost) throw new RoomError('มีแค่หัวตี้ที่ยกเลิกวงได้', 403)
}

export function restart(record: RoomRecord, playerId: string) {
    const player = requirePlayer(record, playerId)
    if (!player.isHost) throw new RoomError('มีแค่หัวตี้ที่เริ่มรอบใหม่ได้', 403)

    const { state } = record
    state.status = 'lobby'
    state.phase = 'idle'
    state.currentCard = null
    state.awaitingBuddy = false
    state.kingCount = 0
    state.kingDecrees = []
    state.log = []
    record.deck = buildDeck()
    state.deckCount = record.deck.length
    resetPlayers(record)
    bump(record)
}
