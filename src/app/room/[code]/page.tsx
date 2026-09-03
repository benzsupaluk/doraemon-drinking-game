import type { Metadata } from 'next'
import { RoomClient } from '@/components/room/room-client'

type Props = { params: Promise<{ code: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { code } = await params
    return {
        title: `วง ${code.toUpperCase()} | เกมส์โดรามอน 🔔`,
        description: `เข้าร่วมวงเกมส์โดรามอน รหัส ${code.toUpperCase()}`,
    }
}

export default async function RoomPage({ params }: Props) {
    const { code } = await params
    return <RoomClient code={code.toUpperCase()} />
}
