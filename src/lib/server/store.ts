import { Redis } from '@upstash/redis'
import { RoomError } from './errors'
import type { Card, RoomState } from '../types'

/** Everything about one room. `deck` is server-only and never sent to clients. */
export interface RoomRecord {
    state: RoomState
    deck: Card[]
}

/** Rooms nobody touches for 6 hours disappear on their own. */
const ROOM_TTL_SECONDS = 6 * 60 * 60

const LOCK_TTL_MS = 4_000
const LOCK_RETRY_MS = 50
const LOCK_MAX_WAIT_MS = 3_000

/**
 * Where room state lives.
 *
 * Two implementations, chosen from the environment at runtime:
 * - `redis`  Upstash Redis over REST. Required on Vercel, where consecutive
 *            requests can land on different instances that share no memory.
 * - `memory` In-process. Used by `pnpm dev` and single-container deployments,
 *            and needs no configuration at all.
 *
 * Both provide `withLock`, because applying an action is a read-modify-write:
 * without a lock two simultaneous actions lose one of the updates (for example
 * two players joining at once and only one of them showing up).
 */
export interface RoomStore {
    readonly kind: 'redis' | 'memory'
    /** Reserve a room code. Returns false if that code is already taken. */
    claim(code: string, record: RoomRecord): Promise<boolean>
    get(code: string): Promise<RoomRecord | null>
    put(code: string, record: RoomRecord): Promise<void>
    remove(code: string): Promise<void>
    withLock<T>(code: string, fn: () => Promise<T>): Promise<T>
}

const key = (code: string) => `doraemon:room:${code}`
const lockKey = (code: string) => `doraemon:lock:${code}`

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function randomToken() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

/* --------------------------- record (de)serialization --------------------------- */

function looksLikeRoomRecord(value: unknown): value is RoomRecord {
    if (typeof value !== 'object' || value === null) return false
    const record = value as Partial<RoomRecord>
    if (!Array.isArray(record.deck)) return false
    const state = record.state
    return (
        typeof state === 'object' &&
        state !== null &&
        typeof state.code === 'string' &&
        typeof state.version === 'number' &&
        Array.isArray(state.players)
    )
}

/**
 * Turn whatever came back from Redis into a RoomRecord, or fail loudly.
 *
 * This has to be defensive. `@upstash/redis` degrades silently in two places:
 * its base64 decoder returns its raw input if `atob` throws, and its JSON
 * parser returns its raw input if `JSON.parse` throws. So a `get` typed as
 * `RoomRecord` can hand back a plain string at runtime, which is truthy and
 * therefore sails past a `if (!record)` check. The next property access then
 * blows up somewhere far away with "Cannot read properties of undefined",
 * surfacing as an opaque 500 on an endpoint that has nothing to do with the
 * real problem.
 *
 * We serialize and parse ourselves (see `automaticDeserialization: false`) so
 * that layer is out of the picture, and we still validate the shape here so a
 * corrupted value can never propagate as `undefined`.
 */
function decodeRecord(code: string, raw: unknown): RoomRecord | null {
    if (raw === null || raw === undefined) return null

    let value: unknown = raw
    if (typeof raw === 'string') {
        try {
            value = JSON.parse(raw)
        } catch {
            console.error(
                `[doraemon] room ${code}: stored value is not valid JSON ` +
                    `(length ${raw.length}, starts with ${JSON.stringify(raw.slice(0, 32))})`
            )
            throw new RoomError('ข้อมูลวงเสียหาย ลองสร้างวงใหม่นะ', 500)
        }
    }

    if (!looksLikeRoomRecord(value)) {
        console.error(`[doraemon] room ${code}: stored value has unexpected shape (${typeof value})`)
        throw new RoomError('ข้อมูลวงเสียหาย ลองสร้างวงใหม่นะ', 500)
    }

    return value
}

/* ------------------------------- Redis ------------------------------- */

/**
 * Release the lock only while we still hold it. Has to be atomic, otherwise we
 * could delete a lock that another request acquired after ours expired.
 */
const RELEASE_SCRIPT = `
if redis.call('get', KEYS[1]) == ARGV[1] then
  return redis.call('del', KEYS[1])
end
return 0
`

class RedisRoomStore implements RoomStore {
    readonly kind = 'redis' as const

    constructor(private readonly redis: Redis) {}

    async claim(code: string, record: RoomRecord) {
        const result = await this.redis.set(key(code), JSON.stringify(record), {
            nx: true,
            ex: ROOM_TTL_SECONDS,
        })
        return result === 'OK'
    }

    async get(code: string) {
        return decodeRecord(code, await this.redis.get<unknown>(key(code)))
    }

    async put(code: string, record: RoomRecord) {
        // Refresh the TTL on every write so a room in play never expires mid-game.
        await this.redis.set(key(code), JSON.stringify(record), { ex: ROOM_TTL_SECONDS })
    }

    async remove(code: string) {
        await this.redis.del(key(code))
    }

    async withLock<T>(code: string, fn: () => Promise<T>): Promise<T> {
        const token = randomToken()
        const deadline = Date.now() + LOCK_MAX_WAIT_MS
        let acquired = false

        while (Date.now() < deadline) {
            const result = await this.redis.set(lockKey(code), token, {
                nx: true,
                px: LOCK_TTL_MS,
            })
            if (result === 'OK') {
                acquired = true
                break
            }
            await sleep(LOCK_RETRY_MS)
        }

        // Waited long enough. Proceeding without the lock beats throwing an
        // error at a player mid-game; the lock's own 4s TTL bounds the damage.
        if (!acquired) return fn()

        try {
            return await fn()
        } finally {
            try {
                await this.redis.eval(RELEASE_SCRIPT, [lockKey(code)], [token])
            } catch {
                // Leave it to expire on its own.
            }
        }
    }
}

/* ------------------------------- Memory ------------------------------ */

interface MemoryEntry {
    record: RoomRecord
    expiresAt: number
}

interface MemoryGlobals {
    __doraemonRooms?: Map<string, MemoryEntry>
    __doraemonLocks?: Map<string, Promise<unknown>>
}

/**
 * Reuse a Map cached on globalThis when we can, so state survives HMR in
 * development. Best effort only: some runtimes seal globalThis, and an
 * unhandled TypeError here would take down every endpoint at once.
 */
function sharedMap<T>(name: keyof MemoryGlobals): Map<string, T> {
    try {
        const globals = globalThis as unknown as MemoryGlobals
        const existing = globals[name]
        if (existing) return existing as Map<string, T>
        const created = new Map<string, T>()
        globals[name] = created as never
        return created
    } catch {
        return new Map<string, T>()
    }
}

class MemoryRoomStore implements RoomStore {
    readonly kind = 'memory' as const

    private rooms = sharedMap<MemoryEntry>('__doraemonRooms')
    private locks = sharedMap<Promise<unknown>>('__doraemonLocks')

    private sweep() {
        const now = Date.now()
        for (const [code, entry] of this.rooms) {
            if (entry.expiresAt <= now) this.rooms.delete(code)
        }
    }

    async claim(code: string, record: RoomRecord) {
        this.sweep()
        if (this.rooms.has(code)) return false
        await this.put(code, record)
        return true
    }

    async get(code: string) {
        this.sweep()
        return this.rooms.get(code)?.record ?? null
    }

    async put(code: string, record: RoomRecord) {
        this.rooms.set(code, { record, expiresAt: Date.now() + ROOM_TTL_SECONDS * 1000 })
    }

    async remove(code: string) {
        this.rooms.delete(code)
    }

    /** Queue actions on the same room so they run one at a time. */
    async withLock<T>(code: string, fn: () => Promise<T>): Promise<T> {
        const previous = this.locks.get(code) ?? Promise.resolve()
        const current = previous.then(fn, fn)
        this.locks.set(
            code,
            current.catch(() => undefined)
        )
        try {
            return await current
        } finally {
            if (this.locks.get(code) === current) this.locks.delete(code)
        }
    }
}

/* ------------------------------ selection ---------------------------- */

let store: RoomStore | null = null
/** Set when building the Redis store failed, so /api/health can report it. */
let storeInitError: string | null = null

const URL_VARS = ['UPSTASH_REDIS_REST_URL', 'KV_REST_API_URL'] as const
const TOKEN_VARS = ['UPSTASH_REDIS_REST_TOKEN', 'KV_REST_API_TOKEN'] as const

/**
 * Clean up a value pasted into a dashboard.
 *
 * Surrounding quotes are the common one: `.env` files quote their values, so
 * copying a line out of one and pasting it into Vercel stores the quotes as
 * part of the value.
 */
function cleanEnvValue(raw: string | undefined) {
    if (!raw) return undefined
    return raw
        .trim()
        .replace(/^['"]|['"]$/g, '')
        .trim()
}

/** The REST endpoint is an https URL. A `rediss://` string is the TCP one. */
function isRestUrl(value: string) {
    return /^https:\/\//i.test(value)
}

/**
 * Find the first variable in `names` that holds a usable value.
 *
 * `accept` matters as much as emptiness. Upstash hands out two different
 * things: an https REST endpoint and a `rediss://` TCP connection string, and
 * only the first works here. Pasting the TCP one into UPSTASH_REDIS_REST_URL is
 * an easy mistake, and because that name is checked first it would otherwise
 * shadow a perfectly good KV_REST_API_URL and take the whole app down. So a
 * candidate that fails `accept` is skipped rather than accepted and later
 * thrown on, and we remember it so /api/health can point at it.
 */
function firstSet(names: readonly string[], accept?: (value: string) => boolean) {
    const rejected: string[] = []
    for (const name of names) {
        const value = cleanEnvValue(process.env[name])
        if (!value) continue
        if (accept && !accept(value)) {
            rejected.push(name)
            continue
        }
        return { name, value, rejected }
    }
    return { name: null, value: null, rejected }
}

export function inspectRedisEnv() {
    const url = firstSet(URL_VARS, isRestUrl)
    const token = firstSet(TOKEN_VARS)
    return {
        urlValue: url.value,
        tokenValue: token.value,
        /** Safe to expose: variable names only, never their values. */
        urlVar: url.name,
        tokenVar: token.name,
        /**
         * Variables that were set but unusable. Only the NAME is kept: the
         * value can be a `rediss://` string carrying the database password, and
         * /api/health is public.
         */
        ignoredUrlVars: url.rejected,
    }
}

function readRedisEnv() {
    const { urlValue, tokenValue } = inspectRedisEnv()
    return urlValue && tokenValue ? { url: urlValue, token: tokenValue } : null
}

/**
 * Never throws. A store that cannot be built falls back to the in-memory one and
 * records why, which `/api/health` reports. Throwing from here would surface as
 * an empty 500 on every endpoint at once, with nothing to debug from.
 */
export function getStore(): RoomStore {
    if (store) return store

    const env = readRedisEnv()
    if (env) {
        try {
            store = new RedisRoomStore(
                new Redis({
                    url: env.url,
                    token: env.token,
                    // We do our own JSON.stringify/parse. The client's automatic
                    // deserialization returns its raw input when parsing fails
                    // instead of raising, which turns a decode problem into a
                    // confusing crash much later. See `decodeRecord`.
                    automaticDeserialization: false,
                })
            )
            return store
        } catch (error) {
            // Deliberately not including the error's own message: the client
            // echoes the URL it was given, which can be a `rediss://` string
            // containing the database password, and /api/health is public.
            storeInitError = 'Could not create the Redis client from the configured credentials.'
            console.error('[doraemon] could not create the Redis client:', error)
        }
    }

    if (!env && process.env.VERCEL) {
        storeInitError =
            'Redis credentials not found in this deployment. Connect Upstash for Redis and redeploy.'
        console.warn(`[doraemon] ${storeInitError}`)
    }

    store = new MemoryRoomStore()
    return store
}

/** Diagnostics for /api/health. Safe to call at any time; never throws. */
export function storeStatus() {
    const { urlVar, tokenVar, ignoredUrlVars } = inspectRedisEnv()
    const kind = getStore().kind
    return {
        store: kind,
        // Names only. Never expose the values: they are credentials.
        env: { url: urlVar, token: tokenVar },
        /**
         * Set but unusable, e.g. a `rediss://` TCP string pasted into a REST
         * URL variable. Delete these, or set them to the https endpoint.
         */
        ignoredUrlVars,
        initError: storeInitError,
        /** True when this deployment cannot support multiplayer as configured. */
        misconfigured: kind === 'memory' && !!process.env.VERCEL,
    }
}
