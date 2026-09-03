import { NextResponse } from 'next/server'
import { storeKind } from '@/lib/server/rooms'

export const dynamic = 'force-dynamic'

/**
 * GET /api/health
 *
 * ใช้เช็คหลัง deploy ว่าต่อ Redis ติดจริงไหม
 * ถ้าตอบ `"store":"memory"` บน Vercel แปลว่ายังไม่ได้ตั้ง env — เพื่อนจะหาห้องไม่เจอ
 */
export async function GET() {
    return NextResponse.json(
        {
            ok: true,
            store: storeKind(),
            onVercel: !!process.env.VERCEL,
        },
        { headers: { 'Cache-Control': 'no-store' } }
    )
}
