import { NextResponse } from 'next/server'
import { errorResponse, readJson } from '@/lib/server/http'
import { RoomError, applyAction, type GameActionInput } from '@/lib/server/rooms'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ code: string }> }

const ACTION_TYPES = [
    'start',
    'draw',
    'buddy',
    'use-card',
    'king-decree',
    'end-turn',
    'restart',
    'leave',
    'cancel',
] as const

function parseAction(body: Record<string, unknown>): GameActionInput {
    const type = String(body.type ?? '')
    if (!(ACTION_TYPES as readonly string[]).includes(type)) {
        throw new RoomError('ไม่รู้จัก action นี้')
    }
    if (type === 'buddy') return { type, buddyId: String(body.buddyId ?? '') }
    if (type === 'use-card') return { type, cardId: String(body.cardId ?? '') }
    if (type === 'king-decree') return { type, text: String(body.text ?? '') }
    return { type } as GameActionInput
}

/** POST /api/rooms/:code/action - every in-game action goes through here. */
export async function POST(request: Request, { params }: Params) {
    try {
        const { code } = await params
        const body = await readJson(request)
        const playerId = String(body.playerId ?? '')
        if (!playerId) throw new RoomError('ไม่พบผู้เล่น กรุณาเข้าร่วมวงใหม่', 403)

        const state = await applyAction(code, playerId, parseAction(body))
        return NextResponse.json({ state }, { headers: { 'Cache-Control': 'no-store' } })
    } catch (error) {
        return errorResponse(error)
    }
}
