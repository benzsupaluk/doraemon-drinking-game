'use client'

import { useSyncExternalStore } from 'react'
import {
    isSoundEnabled,
    loadLastName,
    loadPlayerId,
    subscribeSession,
} from '@/lib/session'

/**
 * Read localStorage the way React supports.
 *
 * The server snapshot has to be a fixed default, since there is no localStorage
 * during SSR. React then swaps in the real value after hydration on its own,
 * with no setState inside an effect.
 */
export function usePlayerId(code: string, serverValue: string | null) {
    return useSyncExternalStore(
        subscribeSession,
        () => loadPlayerId(code),
        () => serverValue
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
