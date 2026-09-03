import { NextResponse } from 'next/server'
import { errorResponse, readJson } from '@/lib/server/http'
import { createRoom } from '@/lib/server/rooms'

export const dynamic = 'force-dynamic'

/** POST /api/rooms — หัวตี้สร้างวงใหม่ */
export async function POST(request: Request) {
    try {
        const body = await readJson(request)
        const { room, playerId } = createRoom(String(body.name ?? ''), body.maxPlayers)
        return NextResponse.json({ state: room.state, playerId })
    } catch (error) {
        return errorResponse(error)
    }
}
