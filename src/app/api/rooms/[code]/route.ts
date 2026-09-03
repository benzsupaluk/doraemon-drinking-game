import { NextResponse } from 'next/server'
import { errorResponse, readJson } from '@/lib/server/http'
import { getRoomState, joinRoom } from '@/lib/server/rooms'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ code: string }> }

const noStore = { headers: { 'Cache-Control': 'no-store' } }

/**
 * GET /api/rooms/:code?since=<version>
 *
 * client poll เข้ามาที่นี่เรื่อยๆ ถ้า version ยังไม่ขยับก็ตอบ `{ unchanged: true }`
 * ซึ่งเป็น payload ไม่กี่ไบต์ แทนที่จะส่ง state ทั้งก้อนทุกวินาที
 */
export async function GET(request: Request, { params }: Params) {
    try {
        const { code } = await params
        const state = await getRoomState(code)

        const sinceRaw = new URL(request.url).searchParams.get('since')
        const since = sinceRaw === null ? null : Number(sinceRaw)
        if (since !== null && Number.isFinite(since) && state.version <= since) {
            return NextResponse.json({ unchanged: true, version: state.version }, noStore)
        }

        return NextResponse.json({ state }, noStore)
    } catch (error) {
        return errorResponse(error)
    }
}

/** POST /api/rooms/:code — เข้าร่วมวงด้วยชื่อของตัวเอง */
export async function POST(request: Request, { params }: Params) {
    try {
        const { code } = await params
        const body = await readJson(request)
        const { state, playerId } = await joinRoom(code, String(body.name ?? ''))
        return NextResponse.json({ state, playerId }, noStore)
    } catch (error) {
        return errorResponse(error)
    }
}
