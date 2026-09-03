import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { RoomClient } from '@/components/room/room-client'

type Props = { params: Promise<{ code: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { code } = await params
    return {
        title: `วง ${code.toUpperCase()} | เกมส์โดรามอน 🔔`,
        description: `เข้าร่วมวงเกมส์โดรามอน รหัส ${code.toUpperCase()}`,
    }
}

/**
 * หา origin จาก request header ฝั่ง server
 * ทำให้ลิงก์เชิญถูกต้องตั้งแต่ HTML ชุดแรก (กดคัดลอกได้เลยไม่ต้องรอ JS)
 * และไม่ต้องแตะ `window` ในฝั่ง client
 */
async function resolveOrigin() {
    const headerList = await headers()
    const host = headerList.get('x-forwarded-host') ?? headerList.get('host') ?? 'localhost:3000'
    const proto = headerList.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
    return `${proto}://${host}`
}

export default async function RoomPage({ params }: Props) {
    const { code } = await params
    return <RoomClient code={code.toUpperCase()} origin={await resolveOrigin()} />
}
