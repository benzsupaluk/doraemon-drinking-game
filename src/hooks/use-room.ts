'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { type GameAction, sendAction } from '@/lib/api'
import type { RoomState } from '@/lib/types'

type Connection = 'connecting' | 'live' | 'lost'

/** ตาเดินของเกมนี้เป็นวินาที ไม่ใช่มิลลิวินาที 1.1 วิเลยเร็วพอแล้ว */
const POLL_VISIBLE_MS = 1_100
/** แท็บที่ถูกซ่อนอยู่ยิงเสียง/สั่นไม่ได้อยู่แล้ว เลยลดความถี่ลงเพื่อประหยัดแบตกับ invocation */
const POLL_HIDDEN_MS = 5_000
/** พลาดกี่ครั้งติดถึงจะบอกผู้ใช้ว่าหลุด — กันไม่ให้ขึ้นเตือนตอนเน็ตกระตุกครั้งเดียว */
const FAILURES_BEFORE_LOST = 3

interface PollResponse {
    state?: RoomState
    unchanged?: boolean
    error?: string
}

/**
 * ดึง state ของห้องด้วยการ poll พร้อม version cursor
 *
 * เลือก poll แทน SSE/WebSocket เพราะเป้าหมายคือ deploy บน Vercel:
 * connection ที่เปิดค้างไว้จะถูกตัดตาม maxDuration ของฟังก์ชัน และคิดเงินตามเวลาที่เปิดค้าง
 * ส่วน poll เป็น request สั้นๆ ที่ทำงานได้ทุกที่ ถ้า version ไม่ขยับ server ก็ตอบ
 * `{ unchanged: true }` กลับมาไม่กี่ไบต์
 */
export function useRoom(code: string) {
    const [state, setState] = useState<RoomState | null>(null)
    const [connection, setConnection] = useState<Connection>('connecting')
    const [error, setError] = useState<string | null>(null)

    const versionRef = useRef(0)
    const failuresRef = useRef(0)
    /** ให้ effect เรียก poll ตัวล่าสุดได้โดยไม่ต้องใส่ไว้ใน dependency */
    const pollRef = useRef<() => void>(() => {})

    const applyState = useCallback((next: RoomState) => {
        // response ที่มาช้ากว่าที่เรามีอยู่แล้วต้องทิ้ง ไม่งั้นหน้าจอจะกระพริบย้อนกลับ
        if (next.version < versionRef.current) return
        versionRef.current = next.version
        setState(next)
    }, [])

    useEffect(() => {
        if (!code) return
        let disposed = false
        let timer: ReturnType<typeof setTimeout> | null = null
        let inFlight = false

        const schedule = () => {
            if (disposed) return
            if (timer) clearTimeout(timer)
            const delay = document.visibilityState === 'visible' ? POLL_VISIBLE_MS : POLL_HIDDEN_MS
            timer = setTimeout(poll, delay)
        }

        const poll = async () => {
            // กันการซ้อนกันตอนเน็ตช้า หนึ่งรอบต้องจบก่อนจะยิงรอบใหม่
            if (disposed || inFlight) return
            inFlight = true
            try {
                const response = await fetch(`/api/rooms/${code}?since=${versionRef.current}`, {
                    cache: 'no-store',
                })
                const data = (await response.json().catch(() => ({}))) as PollResponse

                if (disposed) return

                if (!response.ok) {
                    // 404 = ห้องหายไปจริง ไม่ใช่เน็ตมีปัญหา บอกทันทีไม่ต้องรอครบ 3 ครั้ง
                    failuresRef.current = response.status === 404 ? FAILURES_BEFORE_LOST : failuresRef.current + 1
                } else {
                    failuresRef.current = 0
                    if (data.state) applyState(data.state)
                }

                setConnection(failuresRef.current >= FAILURES_BEFORE_LOST ? 'lost' : 'live')
            } catch {
                if (disposed) return
                failuresRef.current += 1
                if (failuresRef.current >= FAILURES_BEFORE_LOST) setConnection('lost')
            } finally {
                inFlight = false
                schedule()
            }
        }

        pollRef.current = () => void poll()
        void poll()

        // กลับมาจากหน้าอื่นหรือปลดล็อกจอ — ดึงของใหม่ทันที ไม่ต้องรอรอบถัดไป
        const onVisible = () => {
            if (document.visibilityState !== 'visible') {
                schedule()
                return
            }
            if (timer) clearTimeout(timer)
            void poll()
        }
        document.addEventListener('visibilitychange', onVisible)
        window.addEventListener('online', onVisible)

        return () => {
            disposed = true
            document.removeEventListener('visibilitychange', onVisible)
            window.removeEventListener('online', onVisible)
            if (timer) clearTimeout(timer)
        }
    }, [code, applyState])

    const act = useCallback(
        async (playerId: string, action: GameAction) => {
            try {
                // action ตอบ state ใหม่กลับมาเลย คนที่กดจึงเห็นผลทันทีไม่ต้องรอรอบ poll
                const { state: next } = await sendAction(code, playerId, action)
                applyState(next)
                setError(null)
                return true
            } catch (err) {
                setError(err instanceof Error ? err.message : 'ทำรายการไม่สำเร็จ')
                // ดึง state จริงมาดูเลย เผื่อที่พลาดเพราะหน้าจอเราตามไม่ทันคนอื่น
                pollRef.current()
                return false
            }
        },
        [code, applyState]
    )

    return { state, connection, error, setError, act }
}
