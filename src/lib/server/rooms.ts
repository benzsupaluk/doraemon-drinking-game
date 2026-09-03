import { CARD_RULES } from '../rules'
import type { Card, LogEntry, Player, Rank, RoomState, Suit } from '../types'

const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs']
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

const LOG_LIMIT = 30
/** เก็บห้องไว้ 6 ชั่วโมงหลังแตะครั้งสุดท้าย */
const ROOM_TTL_MS = 6 * 60 * 60 * 1000

export interface Room {
    state: RoomState
    /** สำรับจริง — ไม่เคยส่งออกไปฝั่ง client */
    deck: Card[]
    listeners: Set<(state: RoomState) => void>
    touchedAt: number
}

/**
 * เก็บห้องไว้บน globalThis เพื่อให้รอด HMR ตอน dev
 * NOTE: เป็น in-memory ทำงานได้กับ server instance เดียว
 * ถ้า deploy หลาย instance / serverless ต้องเปลี่ยนไปใช้ Redis
 */
const globalStore = globalThis as unknown as { __doraemonRooms?: Map<string, Room> }
const rooms: Map<string, Room> = (globalStore.__doraemonRooms ??= new Map())

function randomId(len = 10) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    let out = ''
    for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)]
    return out
}

function randomCode() {
    // ตัดตัวอักษรที่อ่านสับสน (I, O, 0, 1) ออก เพราะต้องพิมพ์ตามเพื่อน
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    do {
        code = ''
        for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)]
    } while (rooms.has(code))
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

function buildDeck(): Card[] {
    const deck: Card[] = []
    for (const suit of SUITS) {
        for (const rank of RANKS) {
            deck.push({ id: `${suit}-${rank}`, suit, rank })
        }
    }
    return shuffle(deck)
}

function sweepExpired() {
    const now = Date.now()
    for (const [code, room] of rooms) {
        if (now - room.touchedAt > ROOM_TTL_MS) rooms.delete(code)
    }
}

function commit(room: Room) {
    room.state.version += 1
    room.touchedAt = Date.now()
    const snapshot = room.state
    for (const listener of room.listeners) {
        try {
            listener(snapshot)
        } catch {
            // ปล่อยผ่าน — stream ที่ตายแล้วจะถูกถอดออกตอน cancel
        }
    }
}

export class RoomError extends Error {
    status: number
    constructor(message: string, status = 400) {
        super(message)
        this.status = status
    }
}

export function getRoom(code: string): Room {
    sweepExpired()
    const room = rooms.get(code.toUpperCase())
    if (!room) throw new RoomError('ไม่พบห้องนี้ อาจปิดไปแล้วหรือรหัสผิด', 404)
    return room
}

export function subscribe(code: string, listener: (state: RoomState) => void) {
    const room = getRoom(code)
    room.listeners.add(listener)
    return () => {
        room.listeners.delete(listener)
    }
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

export function createRoom(hostName: string, maxPlayers: unknown) {
    sweepExpired()
    const name = sanitizeName(hostName)
    const max = clampPlayers(maxPlayers)
    const code = randomCode()
    const host = makePlayer(name, true)

    const room: Room = {
        deck: buildDeck(),
        listeners: new Set(),
        touchedAt: Date.now(),
        state: {
            code,
            maxPlayers: max,
            status: 'lobby',
            phase: 'idle',
            players: [host],
            turnIndex: 0,
            deckCount: 52,
            currentCard: null,
            kingCount: 0,
            awaitingBuddy: false,
            log: [],
            version: 1,
        },
    }
    rooms.set(code, room)
    return { room, playerId: host.id }
}

export function joinRoom(code: string, rawName: string) {
    const room = getRoom(code)
    const name = sanitizeName(rawName)

    if (room.state.players.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
        throw new RoomError('มีคนใช้ชื่อนี้ในวงแล้ว ลองเปลี่ยนชื่อดู')
    }
    if (room.state.players.length >= room.state.maxPlayers) {
        throw new RoomError('วงนี้เต็มแล้ว')
    }
    if (room.state.status !== 'lobby') {
        throw new RoomError('วงนี้เริ่มเล่นไปแล้ว รอรอบหน้านะ')
    }

    const player = makePlayer(name, false)
    room.state.players.push(player)
    commit(room)
    return { room, playerId: player.id }
}

function requirePlayer(room: Room, playerId: string): Player {
    const player = room.state.players.find((p) => p.id === playerId)
    if (!player) throw new RoomError('ไม่พบผู้เล่นนี้ในวง', 403)
    return player
}

function requireCurrentPlayer(room: Room, playerId: string): Player {
    const player = requirePlayer(room, playerId)
    if (room.state.players[room.state.turnIndex]?.id !== playerId) {
        throw new RoomError('ยังไม่ถึงตาของคุณ', 403)
    }
    return player
}

export function startGame(code: string, playerId: string) {
    const room = getRoom(code)
    const player = requirePlayer(room, playerId)
    if (!player.isHost) throw new RoomError('มีแค่หัวตี้ที่กดเริ่มเกมได้', 403)
    if (room.state.players.length < 2) throw new RoomError('ต้องมีอย่างน้อย 2 คนถึงจะเริ่มได้')

    room.deck = buildDeck()
    room.state.status = 'playing'
    room.state.phase = 'idle'
    room.state.deckCount = room.deck.length
    room.state.currentCard = null
    room.state.kingCount = 0
    room.state.awaitingBuddy = false
    room.state.log = []
    // สุ่มคนเริ่ม
    room.state.turnIndex = Math.floor(Math.random() * room.state.players.length)
    for (const p of room.state.players) {
        p.heldCards = []
        p.buddyId = null
        p.silenced = false
        p.cardsDrawn = 0
    }
    commit(room)
    return room
}

export function drawCard(code: string, playerId: string) {
    const room = getRoom(code)
    const player = requireCurrentPlayer(room, playerId)
    if (room.state.status !== 'playing') throw new RoomError('เกมยังไม่เริ่ม')
    if (room.state.phase !== 'idle') throw new RoomError('เปิดไพ่ไปแล้ว')

    const card = room.deck.pop()
    if (!card) {
        room.state.status = 'finished'
        commit(room)
        return room
    }

    const rule = CARD_RULES[card.rank]
    room.state.currentCard = card
    room.state.phase = 'revealed'
    room.state.deckCount = room.deck.length
    player.cardsDrawn += 1

    if (rule.action === 'hold') {
        player.heldCards.push(card)
    }
    if (rule.action === 'buddy') {
        room.state.awaitingBuddy = true
    }
    if (rule.action === 'king') {
        room.state.kingCount = Math.min(room.state.kingCount + 1, 4)
    }
    if (card.rank === 'Q') {
        for (const p of room.state.players) p.silenced = p.id === player.id
    }

    pushLog(room, {
        id: randomId(6),
        playerId: player.id,
        playerName: player.name,
        card,
        at: Date.now(),
    })

    commit(room)
    return room
}

export function pickBuddy(code: string, playerId: string, buddyId: string) {
    const room = getRoom(code)
    const player = requireCurrentPlayer(room, playerId)
    if (!room.state.awaitingBuddy) throw new RoomError('ยังไม่ถึงจังหวะเลือกบัดดี้')
    if (buddyId === playerId) throw new RoomError('เลือกตัวเองไม่ได้นะ')
    const buddy = requirePlayer(room, buddyId)

    // ตัดคู่เก่าของทั้งสองฝ่ายออกก่อน
    for (const p of room.state.players) {
        if (p.buddyId === player.id || p.buddyId === buddy.id) p.buddyId = null
    }
    player.buddyId = buddy.id
    buddy.buddyId = player.id
    room.state.awaitingBuddy = false
    commit(room)
    return room
}

export function useHeldCard(code: string, playerId: string, cardId: string) {
    const room = getRoom(code)
    const player = requirePlayer(room, playerId)
    const index = player.heldCards.findIndex((c) => c.id === cardId)
    if (index === -1) throw new RoomError('ไม่มีไพ่ใบนี้ติดตัว')
    player.heldCards.splice(index, 1)
    commit(room)
    return room
}

export function endTurn(code: string, playerId: string) {
    const room = getRoom(code)
    requireCurrentPlayer(room, playerId)
    if (room.state.phase !== 'revealed') throw new RoomError('ยังไม่ได้เปิดไพ่')
    if (room.state.awaitingBuddy) throw new RoomError('เลือกบัดดี้ก่อนถึงจะจบตาได้')

    room.state.currentCard = null
    room.state.phase = 'idle'

    if (room.deck.length === 0) {
        room.state.status = 'finished'
        commit(room)
        return room
    }

    room.state.turnIndex = (room.state.turnIndex + 1) % room.state.players.length
    commit(room)
    return room
}

export function leaveRoom(code: string, playerId: string) {
    const room = getRoom(code)
    const index = room.state.players.findIndex((p) => p.id === playerId)
    if (index === -1) return room

    const leaving = room.state.players[index]
    const wasTheirTurn = index === room.state.turnIndex
    for (const p of room.state.players) {
        if (p.buddyId === leaving.id) p.buddyId = null
    }
    room.state.players.splice(index, 1)

    if (room.state.players.length === 0) {
        rooms.delete(room.state.code)
        return room
    }

    // ยกตำแหน่งหัวตี้ให้คนที่เข้ามาก่อนสุด
    if (leaving.isHost) room.state.players[0].isHost = true

    if (index < room.state.turnIndex) room.state.turnIndex -= 1
    if (room.state.turnIndex >= room.state.players.length) room.state.turnIndex = 0

    // ถ้าคนที่ออกคือคนที่ถึงตา ให้เคลียร์ไพ่ที่ค้างอยู่
    if (wasTheirTurn) {
        room.state.currentCard = null
        room.state.phase = 'idle'
        room.state.awaitingBuddy = false
    }
    if (room.state.status === 'playing' && room.state.players.length < 2) {
        room.state.status = 'finished'
    }
    commit(room)
    return room
}

export function restartGame(code: string, playerId: string) {
    const room = getRoom(code)
    const player = requirePlayer(room, playerId)
    if (!player.isHost) throw new RoomError('มีแค่หัวตี้ที่เริ่มรอบใหม่ได้', 403)
    room.state.status = 'lobby'
    room.state.phase = 'idle'
    room.state.currentCard = null
    room.state.awaitingBuddy = false
    room.state.kingCount = 0
    room.state.log = []
    room.deck = buildDeck()
    room.state.deckCount = room.deck.length
    for (const p of room.state.players) {
        p.heldCards = []
        p.buddyId = null
        p.silenced = false
        p.cardsDrawn = 0
    }
    commit(room)
    return room
}

function pushLog(room: Room, entry: LogEntry) {
    room.state.log = [entry, ...room.state.log].slice(0, LOG_LIMIT)
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
    return Math.min(12, Math.max(2, Math.round(value)))
}
