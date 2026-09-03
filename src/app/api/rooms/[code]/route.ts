import { NextResponse } from 'next/server'
import { errorResponse, readJson } from '@/lib/server/http'
import { getRoom, joinRoom } from '@/lib/server/rooms'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ code: string }> }

/** GET /api/rooms/:code — snapshot ของห้อง */
export async function GET(_request: Request, { params }: Params) {
    try {
        const { code } = await params
        return NextResponse.json({ state: getRoom(code).state })
    } catch (error) {
        return errorResponse(error)
    }
}

/** POST /api/rooms/:code — เข้าร่วมวงด้วยชื่อของตัวเอง */
export async function POST(request: Request, { params }: Params) {
    try {
        const { code } = await params
        const body = await readJson(request)
        const { room, playerId } = joinRoom(code, String(body.name ?? ''))
        return NextResponse.json({ state: room.state, playerId })
    } catch (error) {
        return errorResponse(error)
    }
}
