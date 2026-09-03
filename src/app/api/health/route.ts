import { NextResponse } from 'next/server'
import { storeKind } from '@/lib/server/rooms'
import { inspectRedisEnv } from '@/lib/server/store'

export const dynamic = 'force-dynamic'

/**
 * GET /api/health
 *
 * ใช้เช็คหลัง deploy ว่าต่อ Redis ติดจริงไหม
 * ถ้าตอบ `"store":"memory"` บน Vercel แปลว่ายังไม่ได้ตั้ง env — เพื่อนจะหาห้องไม่เจอ
 *
 * `env` บอกแค่ "ชื่อ" ของ environment variable ที่หาเจอ ไม่ได้ส่งค่าออกไป
 */
export async function GET() {
    const { urlVar, tokenVar } = inspectRedisEnv()

    return NextResponse.json(
        {
            ok: true,
            store: storeKind(),
            onVercel: !!process.env.VERCEL,
            env: { url: urlVar, token: tokenVar },
        },
        { headers: { 'Cache-Control': 'no-store' } }
    )
}
