import { NextResponse } from 'next/server'
import { errorResponse, readJson } from '@/lib/server/http'
import {
    RoomError,
    drawCard,
    endTurn,
    leaveRoom,
    pickBuddy,
    restartGame,
    startGame,
    useHeldCard,
} from '@/lib/server/rooms'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ code: string }> }

/** POST /api/rooms/:code/action — ทุก action ในเกมรวมอยู่ที่นี่ */
export async function POST(request: Request, { params }: Params) {
    try {
        const { code } = await params
        const body = await readJson(request)
        const playerId = String(body.playerId ?? '')
        if (!playerId) throw new RoomError('ไม่พบผู้เล่น กรุณาเข้าร่วมวงใหม่', 403)

        switch (body.type) {
            case 'start':
                return NextResponse.json({ state: startGame(code, playerId).state })
            case 'draw':
                return NextResponse.json({ state: drawCard(code, playerId).state })
            case 'buddy':
                return NextResponse.json({
                    state: pickBuddy(code, playerId, String(body.buddyId ?? '')).state,
                })
            case 'use-card':
                return NextResponse.json({
                    state: useHeldCard(code, playerId, String(body.cardId ?? '')).state,
                })
            case 'end-turn':
                return NextResponse.json({ state: endTurn(code, playerId).state })
            case 'restart':
                return NextResponse.json({ state: restartGame(code, playerId).state })
            case 'leave':
                return NextResponse.json({ state: leaveRoom(code, playerId).state })
            default:
                throw new RoomError('ไม่รู้จัก action นี้')
        }
    } catch (error) {
        return errorResponse(error)
    }
}
