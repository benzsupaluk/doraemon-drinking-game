'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { type GameAction, sendAction } from '@/lib/api'
import type { RoomState } from '@/lib/types'

type Connection = 'connecting' | 'live' | 'lost'

/**
 * ต่อ SSE ไปที่ห้อง แล้วเก็บ state ล่าสุดไว้
 * ถ้าหลุดจะ reconnect เองแบบ backoff (สลับแอปบนมือถือแล้วหลุดบ่อย)
 */
export function useRoom(code: string) {
    const [state, setState] = useState<RoomState | null>(null)
    const [connection, setConnection] = useState<Connection>('connecting')
    const [error, setError] = useState<string | null>(null)
    const versionRef = useRef(0)

    useEffect(() => {
        if (!code) return
        let source: EventSource | null = null
        let retryTimer: ReturnType<typeof setTimeout> | null = null
        let attempts = 0
        let disposed = false

        const connect = () => {
            if (disposed) return
            source = new EventSource(`/api/rooms/${code}/stream`)

            source.onopen = () => {
                attempts = 0
                setConnection('live')
                setError(null)
            }

            source.onmessage = (event) => {
                try {
                    const next = JSON.parse(event.data) as RoomState
                    // ข้าม payload ที่มาช้ากว่าที่เรามีอยู่
                    if (next.version < versionRef.current) return
                    versionRef.current = next.version
                    setState(next)
                    setConnection('live')
                } catch {
                    // payload เสีย — ข้ามไป รอ event ถัดไป
                }
            }

            source.onerror = () => {
                source?.close()
                if (disposed) return
                setConnection('lost')
                attempts += 1
                const delay = Math.min(1000 * 2 ** (attempts - 1), 8000)
                retryTimer = setTimeout(connect, delay)
            }
        }

        connect()

        // กลับมาจากหน้าอื่น/ล็อกจอ ให้เชื่อมใหม่ทันทีไม่ต้องรอ backoff
        const onVisible = () => {
            if (document.visibilityState !== 'visible') return
            if (source && source.readyState === EventSource.OPEN) return
            source?.close()
            if (retryTimer) clearTimeout(retryTimer)
            attempts = 0
            connect()
        }
        document.addEventListener('visibilitychange', onVisible)

        return () => {
            disposed = true
            document.removeEventListener('visibilitychange', onVisible)
            if (retryTimer) clearTimeout(retryTimer)
            source?.close()
        }
    }, [code])

    const act = useCallback(
        async (playerId: string, action: GameAction) => {
            try {
                const { state: next } = await sendAction(code, playerId, action)
                if (next.version >= versionRef.current) {
                    versionRef.current = next.version
                    setState(next)
                }
                setError(null)
                return true
            } catch (err) {
                setError(err instanceof Error ? err.message : 'ทำรายการไม่สำเร็จ')
                return false
            }
        },
        [code]
    )

    return { state, connection, error, setError, act }
}
