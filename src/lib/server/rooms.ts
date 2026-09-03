import * as game from './game'
import { RoomError } from './game'
import { getStore } from './store'
import type { RoomState } from '../types'

export { RoomError }

const CODE_ATTEMPTS = 12

/** อ่านห้อง — โยน 404 ถ้าไม่มี เพื่อให้ทุก route จัดการเหมือนกันหมด */
async function load(code: string) {
    const record = await getStore().get(code.toUpperCase())
    if (!record) throw new RoomError('ไม่พบห้องนี้ อาจปิดไปแล้วหรือรหัสผิด', 404)
    return record
}

export async function getRoomState(code: string): Promise<RoomState> {
    return (await load(code)).state
}

export async function createRoom(hostName: string, maxPlayers: unknown) {
    const store = getStore()
    const max = game.clampPlayers(maxPlayers)
    // validate ชื่อก่อนจองรหัส ไม่งั้นชื่อว่างจะกินรหัสไปเปล่าๆ
    game.sanitizeName(hostName)

    for (let attempt = 0; attempt < CODE_ATTEMPTS; attempt++) {
        const code = game.randomCode()
        const { record, playerId } = game.newRoomRecord(code, hostName, max)
        // claim ใช้ SET NX จึงกันรหัสชนกันได้จริงแม้จะมีหลาย instance
        if (await store.claim(code, record)) {
            return { state: record.state, playerId }
        }
    }
    throw new RoomError('สร้างวงไม่สำเร็จ รหัสวงชนกันหลายครั้ง ลองอีกครั้งนะ', 503)
}

export async function joinRoom(code: string, name: string) {
    const upper = code.toUpperCase()
    return getStore().withLock(upper, async () => {
        const record = await load(upper)
        const playerId = game.join(record, name)
        await getStore().put(upper, record)
        return { state: record.state, playerId }
    })
}

export type GameActionInput =
    | { type: 'start' }
    | { type: 'draw' }
    | { type: 'buddy'; buddyId: string }
    | { type: 'use-card'; cardId: string }
    | { type: 'end-turn' }
    | { type: 'restart' }
    | { type: 'leave' }

/**
 * ทุก action คือ read-modify-write เลยต้องอยู่ใน lock ของห้องนั้น
 * ถ้าไม่ล็อก สองคนกดพร้อมกันแล้วคนหลังจะเขียนทับผลของคนแรก
 */
export async function applyAction(
    code: string,
    playerId: string,
    action: GameActionInput
): Promise<RoomState> {
    const upper = code.toUpperCase()
    const store = getStore()

    return store.withLock(upper, async () => {
        const record = await load(upper)

        switch (action.type) {
            case 'start':
                game.start(record, playerId)
                break
            case 'draw':
                game.draw(record, playerId)
                break
            case 'buddy':
                game.pickBuddy(record, playerId, action.buddyId)
                break
            case 'use-card':
                game.useHeldCard(record, playerId, action.cardId)
                break
            case 'end-turn':
                game.endTurn(record, playerId)
                break
            case 'restart':
                game.restart(record, playerId)
                break
            case 'leave': {
                const empty = game.leave(record, playerId)
                if (empty) {
                    await store.remove(upper)
                    return record.state
                }
                break
            }
            default: {
                const never: never = action
                throw new RoomError(`ไม่รู้จัก action นี้: ${JSON.stringify(never)}`)
            }
        }

        await store.put(upper, record)
        return record.state
    })
}

export function storeKind() {
    return getStore().kind
}
