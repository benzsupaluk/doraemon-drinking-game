import { NextResponse } from 'next/server'
import { RoomError } from './errors'

const noStore = { 'Cache-Control': 'no-store' }

/**
 * Turn a thrown error into a response.
 *
 * `error` is the Thai text shown to the player. `detail` carries the raw
 * message for whoever is debugging a deployment; it is the message only, never
 * a stack trace, and unexpected errors are logged in full server-side so they
 * show up in the platform's function logs.
 */
export function errorResponse(error: unknown) {
    if (error instanceof RoomError) {
        // 5xx RoomErrors are still our bug, so make sure they reach the logs.
        if (error.status >= 500) console.error('[api]', error.message)
        return NextResponse.json({ error: error.message }, { status: error.status, headers: noStore })
    }

    const detail = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
    console.error('[api] unexpected error', error)
    return NextResponse.json(
        { error: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์', detail },
        { status: 500, headers: noStore }
    )
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
    try {
        const body = await request.json()
        return typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {}
    } catch {
        return {}
    }
}
