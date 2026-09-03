import type { GameAction } from '@/lib/api'
import type { Player, RoomState } from '@/lib/types'

export interface ViewProps {
    state: RoomState
    me: Player
    connection: 'connecting' | 'live' | 'lost'
    error: string | null
    setError: (value: string | null) => void
    act: (playerId: string, action: GameAction) => Promise<boolean>
    isMyTurn: boolean
    /** origin ที่ได้จาก request header ใช้ประกอบลิงก์เชิญ */
    origin: string
}
