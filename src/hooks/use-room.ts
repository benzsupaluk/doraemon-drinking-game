'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { type GameAction, sendAction } from '@/lib/api'
import type { RoomState } from '@/lib/types'

type Connection = 'connecting' | 'live' | 'lost'

/** A turn takes seconds, not milliseconds, so ~1s is plenty. */
const POLL_VISIBLE_MS = 1_100
/** A hidden tab cannot ring or vibrate anyway, so back off to save battery and invocations. */
const POLL_HIDDEN_MS = 5_000
/** Consecutive failures before we tell the player the connection dropped. */
const FAILURES_BEFORE_LOST = 3
/**
 * Consecutive failures before we stop retrying altogether.
 * With the back-off below this surfaces a real problem in roughly 25s, which is
 * long enough to ride out a blip and short enough that nobody stares at a
 * spinner wondering whether the game is broken.
 */
const FAILURES_BEFORE_FATAL = 5
/** Back-off ceiling, so a broken room cannot be polled at full speed forever. */
const MAX_BACKOFF_MS = 8_000

export interface UseRoomOptions {
    /** Room state rendered on the server, so the first paint is already correct. */
    initialState?: RoomState | null
    /** The server already established that this room does not exist. */
    initialMissing?: boolean
}

interface PollResponse {
    state?: RoomState
    unchanged?: boolean
    error?: string
    detail?: string
}

/**
 * Track room state by polling with a version cursor.
 *
 * Polling rather than SSE/WebSocket because this deploys to Vercel: a
 * long-lived connection is cut at the function's `maxDuration` and billed for
 * the whole time it stays open, while a poll is a short request that works
 * anywhere. When the version has not moved the server answers
 * `{ unchanged: true }`, which is a few dozen bytes.
 *
 * Failures back off exponentially and eventually give up. Without that, a room
 * that can never load (deleted, or a server-side bug) is requested forever, a
 * few times a second, from every player's phone.
 */
export function useRoom(code: string, options: UseRoomOptions = {}) {
    const { initialState = null, initialMissing = false } = options

    const [state, setState] = useState<RoomState | null>(initialState)
    const [connection, setConnection] = useState<Connection>(initialState ? 'live' : 'connecting')
    const [error, setError] = useState<string | null>(null)
    /** Set when we have stopped polling for good; holds the reason to show. */
    const [fatal, setFatal] = useState<string | null>(
        initialMissing ? 'ไม่พบห้องนี้ อาจปิดไปแล้วหรือรหัสผิด' : null
    )

    const versionRef = useRef(initialState?.version ?? 0)
    const failuresRef = useRef(0)
    /** Lets effects trigger the newest poll without depending on it. */
    const pollRef = useRef<() => void>(() => {})

    /**
     * Adopt a room state. Exposed as `adoptState` so a caller that already has a
     * fresh state (the join response, say) can install it right away instead of
     * waiting for the next poll to catch up.
     */
    const applyState = useCallback((next: RoomState) => {
        // Drop responses that are older than what we already have, otherwise
        // the screen flickers backwards.
        if (next.version < versionRef.current) return
        versionRef.current = next.version
        setState(next)
    }, [])

    useEffect(() => {
        if (!code || initialMissing) return
        let disposed = false
        let stopped = false
        let timer: ReturnType<typeof setTimeout> | null = null
        let inFlight = false

        const giveUp = (reason: string) => {
            stopped = true
            if (timer) clearTimeout(timer)
            setConnection('lost')
            setFatal(reason)
        }

        const schedule = () => {
            if (disposed || stopped) return
            if (timer) clearTimeout(timer)
            const base =
                document.visibilityState === 'visible' ? POLL_VISIBLE_MS : POLL_HIDDEN_MS
            // Healthy: poll at the normal rate. Failing: back off exponentially.
            const delay =
                failuresRef.current === 0
                    ? base
                    : Math.min(base * 2 ** failuresRef.current, MAX_BACKOFF_MS)
            timer = setTimeout(poll, delay)
        }

        const poll = async () => {
            // One request at a time, so a slow network cannot stack them up.
            if (disposed || stopped || inFlight) return
            inFlight = true
            try {
                const response = await fetch(`/api/rooms/${code}?since=${versionRef.current}`, {
                    cache: 'no-store',
                })
                const data = (await response.json().catch(() => ({}))) as PollResponse

                if (disposed) return

                if (response.ok) {
                    failuresRef.current = 0
                    if (data.state) applyState(data.state)
                    setConnection('live')
                    return
                }

                // The room is genuinely gone. Retrying cannot help, so stop now.
                if (response.status === 404) {
                    giveUp(data.error ?? 'ไม่พบห้องนี้ อาจปิดไปแล้วหรือรหัสผิด')
                    return
                }

                failuresRef.current += 1
                if (data.detail) {
                    console.error(`[room ${code}] server error ${response.status}:`, data.detail)
                }
                if (failuresRef.current >= FAILURES_BEFORE_FATAL) {
                    giveUp(data.error ?? 'เชื่อมต่อกับเซิร์ฟเวอร์ไม่ได้')
                    return
                }
                if (failuresRef.current >= FAILURES_BEFORE_LOST) setConnection('lost')
            } catch {
                if (disposed) return
                failuresRef.current += 1
                if (failuresRef.current >= FAILURES_BEFORE_FATAL) {
                    giveUp('เชื่อมต่อกับเซิร์ฟเวอร์ไม่ได้')
                    return
                }
                if (failuresRef.current >= FAILURES_BEFORE_LOST) setConnection('lost')
            } finally {
                inFlight = false
                schedule()
            }
        }

        pollRef.current = () => void poll()
        void poll()

        // Coming back from another app or unlocking the phone: refresh at once
        // instead of waiting out the current delay.
        const onWake = () => {
            if (stopped) return
            if (document.visibilityState !== 'visible') {
                schedule()
                return
            }
            if (timer) clearTimeout(timer)
            void poll()
        }
        document.addEventListener('visibilitychange', onWake)
        window.addEventListener('online', onWake)

        return () => {
            disposed = true
            document.removeEventListener('visibilitychange', onWake)
            window.removeEventListener('online', onWake)
            if (timer) clearTimeout(timer)
        }
    }, [code, applyState, initialMissing])

    const act = useCallback(
        async (playerId: string, action: GameAction) => {
            try {
                // The action response carries the new state, so whoever tapped
                // sees the result immediately rather than on the next poll.
                const { state: next } = await sendAction(code, playerId, action)
                applyState(next)
                setError(null)
                return true
            } catch (err) {
                setError(err instanceof Error ? err.message : 'ทำรายการไม่สำเร็จ')
                // Refresh, in case the action failed because our view was stale.
                pollRef.current()
                return false
            }
        },
        [code, applyState]
    )

    return { state, connection, error, setError, act, fatal, adoptState: applyState }
}
