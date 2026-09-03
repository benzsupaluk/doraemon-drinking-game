import { NextResponse } from 'next/server'
import { RoomError } from './rooms'

export function errorResponse(error: unknown) {
    if (error instanceof RoomError) {
        return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[api] unexpected error', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' }, { status: 500 })
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
    try {
        const body = await request.json()
        return typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {}
    } catch {
        return {}
    }
}
