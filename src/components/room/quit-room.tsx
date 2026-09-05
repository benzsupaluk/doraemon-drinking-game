'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Drawer } from 'vaul'
import { Button } from '@/components/ui'
import type { GameAction } from '@/lib/api'
import { clearPlayerId } from '@/lib/session'

/** The host closes the whole group; anyone else only gives up their own seat. */
export const quitLabel = (isHost: boolean) => (isHost ? 'ยกเลิกวง' : 'ออกจากวง')

export function quitPrompt(isHost: boolean, playing: boolean) {
    if (isHost) {
        return playing
            ? 'ยกเลิกวงนี้เลยไหม? เกมจะจบทันทีและเพื่อนทุกคนจะหลุดออกจากวง'
            : 'ยกเลิกวงนี้เลยไหม? เพื่อนทุกคนจะหลุดออกจากวง'
    }
    return playing
        ? 'ออกจากวงนี้เลยไหม? เพื่อนจะเล่นต่อกันไปโดยไม่มีคุณ'
        : 'ออกจากวงนี้เลยไหม? กลับเข้ามาใหม่ได้ด้วยรหัสเดิม'
}

interface QuitOptions {
    code: string
    meId: string
    isHost: boolean
    act: (playerId: string, action: GameAction) => Promise<boolean>
}

/**
 * Leaving is the same everywhere: tell the server, drop the stored seat, and go
 * home. The lobby and the game screen only differ in how they ask.
 */
export function useQuitRoom({ code, meId, isHost, act }: QuitOptions) {
    const router = useRouter()
    const [quitting, setQuitting] = useState(false)

    const quit = () => {
        setQuitting(true)
        // The request is already on its way, so head home right now. Waiting for
        // it would leave us on a room we no longer belong to, which flashes the
        // join form before the homepage arrives.
        const pending = act(meId, { type: isHost ? 'cancel' : 'leave' })
        router.push('/')
        void pending.then((ok) => {
            if (ok) clearPlayerId(code)
        })
    }

    return { quitting, quit }
}

/**
 * The game screen has no room for a confirm row, so it asks in a drawer — the
 * same shape as the rules and King sheets.
 */
export function QuitSheet({
    open,
    onOpenChange,
    isHost,
    playing,
    quitting,
    onQuit,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    isHost: boolean
    playing: boolean
    quitting: boolean
    onQuit: () => void
}) {
    return (
        <Drawer.Root open={open} onOpenChange={onOpenChange}>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 z-40 bg-black/60" />
                <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto flex flex-col rounded-t-panel border-t border-line bg-ink outline-none sm:max-w-105">
                    <Drawer.Handle className="my-2.5 !bg-line" />

                    <div className="space-y-3 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                        <Drawer.Title className="text-[1.0625rem] font-semibold">
                            {quitLabel(isHost)}
                        </Drawer.Title>
                        <Drawer.Description className="text-[0.9375rem] leading-relaxed text-muted">
                            {quitPrompt(isHost, playing)}
                        </Drawer.Description>
                        <div className="flex gap-2 pt-1">
                            <Button
                                variant="ghost"
                                onClick={() => onOpenChange(false)}
                                className="min-w-0 flex-1"
                            >
                                เล่นต่อ
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={onQuit}
                                loading={quitting}
                                className="min-w-0 flex-1 text-drink"
                            >
                                {quitLabel(isHost)}
                            </Button>
                        </div>
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    )
}
