const KEY_PREFIX = 'doraemon:player:'
const NAME_KEY = 'doraemon:last-name'
const SOUND_KEY = 'doraemon:sound'

/**
 * localStorage เป็น external store ของ React
 * เลยต้องมี subscribe/emit เพื่อให้อ่านผ่าน `useSyncExternalStore` ได้
 * (อ่านใน useEffect แล้ว setState จะทำให้ render ซ้อนกันโดยไม่จำเป็น)
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
        // โหมดส่วนตัวของ Safari อ่านไม่ได้ — ถือว่าไม่มีค่าเก็บไว้
        return null
    }
}

function write(key: string, value: string) {
    try {
        localStorage.setItem(key, value)
    } catch {
        // เขียนไม่ได้ก็ไม่เป็นไร แค่จำข้ามรอบไม่ได้
    }
    emit()
}

function drop(key: string) {
    try {
        localStorage.removeItem(key)
    } catch {
        // ไม่เป็นไร
    }
    emit()
}

/* --------------------------- playerId ต่อห้อง --------------------------- */

export const savePlayerId = (code: string, playerId: string) =>
    write(KEY_PREFIX + code.toUpperCase(), playerId)

export const loadPlayerId = (code: string) => read(KEY_PREFIX + code.toUpperCase())

export const clearPlayerId = (code: string) => drop(KEY_PREFIX + code.toUpperCase())

/* ------------------------------ ชื่อล่าสุด ------------------------------ */

export const saveLastName = (name: string) => write(NAME_KEY, name)

export const loadLastName = () => read(NAME_KEY) ?? ''

/* -------------------------------- เสียง -------------------------------- */

export const isSoundEnabled = () => read(SOUND_KEY) !== 'off'

export const setSoundEnabled = (enabled: boolean) => write(SOUND_KEY, enabled ? 'on' : 'off')
