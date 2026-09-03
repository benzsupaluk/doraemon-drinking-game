import { RoomError } from './errors'
import * as game from './game'
import { getStore } from './store'
import type { RoomState } from '../types'

export { RoomError }

const CODE_ATTEMPTS = 12

/** Load a room, throwing a 404 if it is missing, so every route behaves alike. */
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
    // Validate the name before reserving a code, or a blank name burns one for nothing.
    game.sanitizeName(hostName)

    for (let attempt = 0; attempt < CODE_ATTEMPTS; attempt++) {
        const code = game.randomCode()
        const { record, playerId } = game.newRoomRecord(code, hostName, max)
        // `claim` uses SET NX, so codes cannot collide even across instances.
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
 * Applying an action is a read-modify-write, so it has to hold that room's
 * lock. Without one, two simultaneous actions mean the second overwrites the
 * first.
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
