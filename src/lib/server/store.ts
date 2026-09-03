import { Redis } from '@upstash/redis'
import type { Card, RoomState } from '../types'

/** ทุกอย่างของหนึ่งวง — สำรับไพ่เก็บไว้ฝั่ง server เท่านั้น ไม่เคยส่งออกไป client */
export interface RoomRecord {
    state: RoomState
    deck: Card[]
}

/** ห้องที่ไม่มีใครแตะเกิน 6 ชั่วโมงจะหายไปเอง */
const ROOM_TTL_SECONDS = 6 * 60 * 60

const LOCK_TTL_MS = 4_000
const LOCK_RETRY_MS = 50
const LOCK_MAX_WAIT_MS = 3_000

/**
 * ที่เก็บสถานะวง
 *
 * มี 2 แบบ เลือกจาก environment variable ตอน runtime:
 * - `redis`  ใช้ Upstash Redis ผ่าน REST — จำเป็นบน Vercel เพราะแต่ละ request
 *            อาจตกไปคนละ instance ที่ไม่แชร์ memory กัน
 * - `memory` เก็บใน process — ใช้ตอน `pnpm dev` และตอนรัน container เดียว
 *            ไม่ต้องตั้งค่าอะไรเลย
 *
 * ทั้งสองแบบมี `withLock` เพราะการเล่นหนึ่ง action คือ read-modify-write
 * ถ้าสองคนกดพร้อมกันโดยไม่มี lock จะมี update หายไป (เช่นเข้าวงพร้อมกันแล้วเห็นแค่คนเดียว)
 */
export interface RoomStore {
    readonly kind: 'redis' | 'memory'
    /** จองรหัสห้อง — คืน false ถ้ารหัสนั้นถูกใช้อยู่แล้ว */
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

/* ------------------------------- Redis ------------------------------- */

/** ปล่อย lock เฉพาะตอนที่ยังเป็นของเรา — ต้องทำเป็น atomic ไม่งั้นอาจปลด lock ของคนอื่น */
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
        const result = await this.redis.set(key(code), record, { nx: true, ex: ROOM_TTL_SECONDS })
        return result === 'OK'
    }

    async get(code: string) {
        return (await this.redis.get<RoomRecord>(key(code))) ?? null
    }

    async put(code: string, record: RoomRecord) {
        // ต่ออายุ TTL ทุกครั้งที่เขียน วงที่ยังเล่นอยู่จะไม่หายไปกลางเกม
        await this.redis.set(key(code), record, { ex: ROOM_TTL_SECONDS })
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

        // รอไม่ไหวแล้ว — ยอมทำต่อโดยไม่มี lock ดีกว่าเด้ง error ใส่หน้าคนเล่น
        // (lock มี TTL 4 วิ ถ้าถึงจุดนี้แปลว่ามีอะไรค้างอยู่จริง)
        if (!acquired) return fn()

        try {
            return await fn()
        } finally {
            try {
                await this.redis.eval(RELEASE_SCRIPT, [lockKey(code)], [token])
            } catch {
                // ปล่อยให้ TTL หมดอายุเอง
            }
        }
    }
}

/* ------------------------------- Memory ------------------------------ */

interface MemoryEntry {
    record: RoomRecord
    expiresAt: number
}

const globalStore = globalThis as unknown as {
    __doraemonRooms?: Map<string, MemoryEntry>
    __doraemonLocks?: Map<string, Promise<unknown>>
}

class MemoryRoomStore implements RoomStore {
    readonly kind = 'memory' as const

    // เก็บบน globalThis เพื่อให้รอด HMR ตอน dev
    private rooms = (globalStore.__doraemonRooms ??= new Map())
    private locks = (globalStore.__doraemonLocks ??= new Map())

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

    /** ต่อคิว action ของห้องเดียวกันให้ทำทีละอัน */
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

const URL_VARS = ['UPSTASH_REDIS_REST_URL', 'KV_REST_API_URL'] as const
const TOKEN_VARS = ['UPSTASH_REDIS_REST_TOKEN', 'KV_REST_API_TOKEN'] as const

/**
 * หาชื่อ env ตัวแรกที่ "มีค่าจริง"
 *
 * ต้องเช็คว่าไม่ใช่ค่าว่างด้วย ไม่ใช่แค่ `??` เพราะ Vercel สร้าง env
 * ที่มีค่าเป็นสตริงว่างได้ ถ้าใช้ `??` ตัวว่างจะบังตัวที่มีค่าจริงที่อยู่ถัดไป
 * แล้วแอปจะเงียบๆ ตกไปใช้ in-memory store แทน
 */
function firstSet(names: readonly string[]) {
    for (const name of names) {
        const value = process.env[name]?.trim()
        if (value) return { name, value }
    }
    return null
}

/**
 * ชื่อ env ต่างกันตาม integration ที่กดบน Vercel
 * - Upstash marketplace  -> UPSTASH_REDIS_REST_URL / _TOKEN
 * - Vercel KV            -> KV_REST_API_URL / KV_REST_API_TOKEN
 *
 * สองชุดนี้ชี้ไปที่ REST endpoint เดียวกัน เลยรับได้ทั้งคู่
 *
 * ส่วน KV_URL / REDIS_URL เป็น connection string แบบ TCP (rediss://) ใช้กับ
 * @upstash/redis ไม่ได้ และ TCP pool ก็ไม่เหมาะกับ serverless — ไม่ต้องใส่
 */
export function inspectRedisEnv() {
    const url = firstSet(URL_VARS)
    const token = firstSet(TOKEN_VARS)
    return {
        url,
        token,
        /** เอาไปโชว์ได้ — เป็นแค่ชื่อ env ไม่ใช่ค่า */
        urlVar: url?.name ?? null,
        tokenVar: token?.name ?? null,
    }
}

function readRedisEnv() {
    const { url, token } = inspectRedisEnv()
    return url && token ? { url: url.value, token: token.value } : null
}

export function getStore(): RoomStore {
    if (store) return store

    const env = readRedisEnv()
    if (env) {
        store = new RedisRoomStore(new Redis({ url: env.url, token: env.token }))
    } else {
        if (process.env.VERCEL) {
            // บน Vercel ห้องจะกระจายไปคนละ instance แล้วเพื่อนจะหาห้องไม่เจอ
            console.warn(
                '[doraemon] ไม่พบ UPSTASH_REDIS_REST_URL / _TOKEN — กำลังใช้ in-memory store ' +
                    'ซึ่งใช้กับ Vercel ไม่ได้ ผู้เล่นจะเห็นห้องไม่ตรงกัน ดูวิธีตั้งค่าใน README'
            )
        }
        store = new MemoryRoomStore()
    }
    return store
}
