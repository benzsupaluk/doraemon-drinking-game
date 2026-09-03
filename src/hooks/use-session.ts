'use client'

import { useSyncExternalStore } from 'react'
import {
    isSoundEnabled,
    loadLastName,
    loadPlayerId,
    subscribeSession,
} from '@/lib/session'

/**
 * อ่านค่าจาก localStorage แบบที่ React รองรับ
 *
 * snapshot ฝั่ง server ต้องเป็นค่า default คงที่ เพราะตอน SSR ไม่มี localStorage
 * แล้ว React จะสลับมาใช้ค่าจริงให้เองหลัง hydrate โดยไม่ต้อง setState ใน effect
 */
export function usePlayerId(code: string) {
    return useSyncExternalStore(
        subscribeSession,
        () => loadPlayerId(code),
        () => null
    )
}

export function useRememberedName() {
    return useSyncExternalStore(
        subscribeSession,
        loadLastName,
        () => ''
    )
}

export function useSoundEnabled() {
    return useSyncExternalStore(
        subscribeSession,
        isSoundEnabled,
        () => true
    )
}
