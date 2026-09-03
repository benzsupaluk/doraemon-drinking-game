const NAME_KEY = 'doraemon:last-name'
const SOUND_KEY = 'doraemon:sound'

/** Cookie holding a map of room code -> playerId. */
export const PLAYER_COOKIE = 'dora_p'
/** Remember at most this many rooms, newest first. */
const MAX_ROOMS = 8
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60

/**
 * localStorage and cookies are external stores as far as React is concerned, so
 * they need subscribe/emit to be readable through `useSyncExternalStore`.
 * Reading them in a useEffect and calling setState causes cascading renders.
 */
const listeners = new Set<() => void>()

export function subscribeSession(listener: () => void) {
    listeners.add(listener)
    return () => {
        listeners.delete(listener)
    }
}

function emit() {
    for (const listener of listeners) listener()
}

/* ------------------------------ playerId ------------------------------ */

/**
 * The playerId lives in a cookie rather than localStorage so the server can
 * read it too. That lets the room page render the right screen in its first
 * response: with the id only on the client, the server has to guess, and every
 * returning player gets a flash of the join form before hydration corrects it.
 */
export function parsePlayerCookie(raw: string | undefined): Record<string, string> {
    if (!raw) return {}
    try {
        const parsed: unknown = JSON.parse(decodeURIComponent(raw))
        if (typeof parsed !== 'object' || parsed === null) return {}
        const out: Record<string, string> = {}
        for (const [code, id] of Object.entries(parsed)) {
            if (typeof id === 'string') out[code.toUpperCase()] = id
        }
        return out
    } catch {
        return {}
    }
}

function readCookieRaw(): string | undefined {
    if (typeof document === 'undefined') return undefined
    const match = document.cookie.match(new RegExp(`(?:^|; )${PLAYER_COOKIE}=([^;]*)`))
    return match?.[1]
}

function readAll(): Record<string, string> {
    return parsePlayerCookie(readCookieRaw())
}

function writeAll(map: Record<string, string>) {
    if (typeof document === 'undefined') return
    // Keep the cookie small: only the most recent rooms are worth remembering.
    const trimmed = Object.fromEntries(Object.entries(map).slice(-MAX_ROOMS))
    const value = encodeURIComponent(JSON.stringify(trimmed))
    document.cookie = `${PLAYER_COOKIE}=${value}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`
    emit()
}

export function savePlayerId(code: string, playerId: string) {
    const map = readAll()
    const key = code.toUpperCase()
    // Re-insert at the end so this room counts as the most recent.
    delete map[key]
    map[key] = playerId
    writeAll(map)
}

export function loadPlayerId(code: string): string | null {
    return readAll()[code.toUpperCase()] ?? null
}

export function clearPlayerId(code: string) {
    const map = readAll()
    delete map[code.toUpperCase()]
    writeAll(map)
}

/* ---------------------- name and sound (client only) ---------------------- */

function readLocal(key: string): string | null {
    try {
        return localStorage.getItem(key)
    } catch {
        // Safari private mode cannot read it; treat that as nothing stored.
        return null
    }
}

function writeLocal(key: string, value: string) {
    try {
        localStorage.setItem(key, value)
    } catch {
        // If it cannot be written, fine: we just will not remember it next time.
    }
    emit()
}

export const saveLastName = (name: string) => writeLocal(NAME_KEY, name)

export const loadLastName = () => readLocal(NAME_KEY) ?? ''

export const isSoundEnabled = () => readLocal(SOUND_KEY) !== 'off'

export const setSoundEnabled = (enabled: boolean) => writeLocal(SOUND_KEY, enabled ? 'on' : 'off')
