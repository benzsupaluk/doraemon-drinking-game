import type { Metadata } from 'next'
import { cookies, headers } from 'next/headers'
import { RoomClient } from '@/components/room/room-client'
import { RoomError } from '@/lib/server/errors'
import { getRoomState } from '@/lib/server/rooms'
import { PLAYER_COOKIE, parsePlayerCookie } from '@/lib/session'
import type { RoomState } from '@/lib/types'

type Props = { params: Promise<{ code: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { code } = await params
    return {
        title: `วง ${code.toUpperCase()} | เกมส์โดรามอน 🔔`,
        description: `เข้าร่วมวงเกมส์โดรามอน รหัส ${code.toUpperCase()}`,
    }
}

/**
 * Resolve the origin from request headers on the server.
 *
 * That makes the invite link correct in the very first HTML, so it can be
 * copied before JS loads, and means no `window` access on the client.
 */
async function resolveOrigin() {
    const headerList = await headers()
    const host = headerList.get('x-forwarded-host') ?? headerList.get('host') ?? 'localhost:3000'
    const proto = headerList.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
    return `${proto}://${host}`
}

/**
 * Read the room on the server so the first HTML already shows the lobby or the
 * game.
 *
 * Without this the client renders a spinner, waits for hydration, and only then
 * makes its first poll: on a phone that is several seconds of nothing. Reading
 * here costs the same single Redis GET the poll would have made, but it happens
 * during a request that is already in flight.
 */
async function readRoom(code: string): Promise<{ state: RoomState | null; missing: boolean }> {
    try {
        return { state: await getRoomState(code), missing: false }
    } catch (error) {
        // Only a genuine 404 is reported as missing. Anything else (a Redis
        // blip, say) leaves the client to retry rather than showing a dead end.
        const missing = error instanceof RoomError && error.status === 404
        if (!missing) console.error('[room page] could not preload the room', error)
        return { state: null, missing }
    }
}

/** Which player this browser is in this room, from the cookie the client sets. */
async function readPlayerId(code: string) {
    const raw = (await cookies()).get(PLAYER_COOKIE)?.value
    return parsePlayerCookie(raw)[code] ?? null
}

export default async function RoomPage({ params }: Props) {
    const { code } = await params
    const upper = code.toUpperCase()
    const [origin, room, playerId] = await Promise.all([
        resolveOrigin(),
        readRoom(upper),
        readPlayerId(upper),
    ])

    return (
        <RoomClient
            code={upper}
            origin={origin}
            initialState={room.state}
            initialMissing={room.missing}
            initialPlayerId={playerId}
        />
    )
}
