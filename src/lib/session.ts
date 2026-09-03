const KEY_PREFIX = 'doraemon:player:'
const NAME_KEY = 'doraemon:last-name'
const SOUND_KEY = 'doraemon:sound'

/**
 * localStorage is an external store as far as React is concerned, so it needs
 * subscribe/emit to be readable through `useSyncExternalStore`. Reading it in a
 * useEffect and calling setState causes needless cascading renders.
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

function read(key: string): string | null {
    try {
        return localStorage.getItem(key)
    } catch {
        // Safari private mode cannot read it; treat that as nothing stored.
        return null
    }
}

function write(key: string, value: string) {
    try {
        localStorage.setItem(key, value)
    } catch {
        // If it cannot be written, fine: we just will not remember it next time.
    }
    emit()
}

function drop(key: string) {
    try {
        localStorage.removeItem(key)
    } catch {
        // Nothing to do.
    }
    emit()
}

/* --------------------------- per-room playerId --------------------------- */

export const savePlayerId = (code: string, playerId: string) =>
    write(KEY_PREFIX + code.toUpperCase(), playerId)

export const loadPlayerId = (code: string) => read(KEY_PREFIX + code.toUpperCase())

export const clearPlayerId = (code: string) => drop(KEY_PREFIX + code.toUpperCase())

/* ------------------------------ last used name ------------------------------ */

export const saveLastName = (name: string) => write(NAME_KEY, name)

export const loadLastName = () => read(NAME_KEY) ?? ''

/* -------------------------------- sound -------------------------------- */

export const isSoundEnabled = () => read(SOUND_KEY) !== 'off'

export const setSoundEnabled = (enabled: boolean) => write(SOUND_KEY, enabled ? 'on' : 'off')
