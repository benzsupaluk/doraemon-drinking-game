import { errorResponse } from '@/lib/server/http'
import { getRoom, subscribe } from '@/lib/server/rooms'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ code: string }> }

const HEARTBEAT_MS = 20_000

/**
 * GET /api/rooms/:code/stream — Server-Sent Events
 * ดัน state ทั้งก้อนทุกครั้งที่มีอะไรเปลี่ยน ทำให้ทุกเครื่องเห็นตรงกันทันที
 */
export async function GET(request: Request, { params }: Params) {
    try {
        const { code } = await params
        const room = getRoom(code)
        const encoder = new TextEncoder()

        const stream = new ReadableStream({
            start(controller) {
                let closed = false
                const send = (data: unknown) => {
                    if (closed) return
                    try {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
                    } catch {
                        closed = true
                    }
                }

                send(room.state)
                const unsubscribe = subscribe(code, send)
                const heartbeat = setInterval(() => {
                    if (closed) return
                    try {
                        controller.enqueue(encoder.encode(': ping\n\n'))
                    } catch {
                        closed = true
                    }
                }, HEARTBEAT_MS)

                const cleanup = () => {
                    if (closed) return
                    closed = true
                    clearInterval(heartbeat)
                    unsubscribe()
                    try {
                        controller.close()
                    } catch {
                        // already closed
                    }
                }
                request.signal.addEventListener('abort', cleanup)
            },
        })

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream; charset=utf-8',
                'Cache-Control': 'no-cache, no-transform',
                Connection: 'keep-alive',
                'X-Accel-Buffering': 'no',
            },
        })
    } catch (error) {
        return errorResponse(error)
    }
}
