import { NextResponse } from 'next/server'
import { storeStatus } from '@/lib/server/store'

export const dynamic = 'force-dynamic'

/**
 * GET /api/health
 *
 * Use this after deploying to confirm Redis is really connected.
 *
 * This endpoint must never fail, because it is the one thing you have to work
 * with when everything else is returning 500. So it catches everything and
 * always answers 200, reporting what it found:
 *
 * - `store`        "redis" (good) or "memory"
 * - `misconfigured` true when running on Vercel without Redis, which cannot
 *                   support multiplayer: players will not find each other
 * - `env`          which variable NAMES were found, never their values
 * - `ignoredUrlVars` variables that were set but unusable, by name
 * - `initError`    why building the Redis client failed, if it did
 *
 * Nothing here ever includes a credential value. This route is public, and a
 * `rediss://` connection string carries the database password.
 */
export async function GET() {
    try {
        const status = storeStatus()
        return NextResponse.json(
            {
                ok: !status.misconfigured && !status.initError,
                onVercel: !!process.env.VERCEL,
                ...status,
                hint: status.ignoredUrlVars.length
                    ? `${status.ignoredUrlVars.join(', ')} is set but is not an https REST endpoint ` +
                      '(a rediss:// string is the TCP one). Delete it, or set it to the REST URL, then redeploy.'
                    : status.misconfigured
                      ? 'Connect Upstash for Redis in Vercel > Storage, then redeploy. See the README.'
                      : undefined,
            },
            { headers: { 'Cache-Control': 'no-store' } }
        )
    } catch (error) {
        return NextResponse.json(
            {
                ok: false,
                error: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
            },
            { status: 200, headers: { 'Cache-Control': 'no-store' } }
        )
    }
}
