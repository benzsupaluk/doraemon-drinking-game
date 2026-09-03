import type { RoomState } from './types'

async function post<T>(url: string, body: unknown): Promise<T> {
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data?.error ?? 'เชื่อมต่อไม่สำเร็จ ลองอีกครั้ง')
    return data as T
}

export function createRoom(name: string, maxPlayers: number) {
    return post<{ state: RoomState; playerId: string }>('/api/rooms', { name, maxPlayers })
}

export function joinRoom(code: string, name: string) {
    return post<{ state: RoomState; playerId: string }>(`/api/rooms/${code}`, { name })
}

export type GameAction =
    | { type: 'start' }
    | { type: 'draw' }
    | { type: 'buddy'; buddyId: string }
    | { type: 'use-card'; cardId: string }
    | { type: 'end-turn' }
    | { type: 'restart' }
    | { type: 'leave' }

export function sendAction(code: string, playerId: string, action: GameAction) {
    return post<{ state: RoomState }>(`/api/rooms/${code}/action`, { ...action, playerId })
}

export async function fetchRoom(code: string): Promise<RoomState> {
    const response = await fetch(`/api/rooms/${code}`, { cache: 'no-store' })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data?.error ?? 'ไม่พบห้องนี้')
    return data.state as RoomState
}
