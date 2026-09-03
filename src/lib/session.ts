const KEY_PREFIX = 'doraemon:player:'
const NAME_KEY = 'doraemon:last-name'

/** จำ playerId ต่อห้อง เพื่อให้ refresh แล้วยังอยู่ในวงเดิม */
export function savePlayerId(code: string, playerId: string) {
    try {
        localStorage.setItem(KEY_PREFIX + code.toUpperCase(), playerId)
    } catch {
        // โหมดส่วนตัวของ Safari อาจเขียนไม่ได้ — ไม่เป็นไร แค่ต้องใส่ชื่อใหม่
    }
}

export function loadPlayerId(code: string): string | null {
    try {
        return localStorage.getItem(KEY_PREFIX + code.toUpperCase())
    } catch {
        return null
    }
}

export function clearPlayerId(code: string) {
    try {
        localStorage.removeItem(KEY_PREFIX + code.toUpperCase())
    } catch {
        // ไม่เป็นไร
    }
}

export function saveLastName(name: string) {
    try {
        localStorage.setItem(NAME_KEY, name)
    } catch {
        // ไม่เป็นไร
    }
}

export function loadLastName(): string {
    try {
        return localStorage.getItem(NAME_KEY) ?? ''
    } catch {
        return ''
    }
}
