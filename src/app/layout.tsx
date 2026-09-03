import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Sans_Thai } from 'next/font/google'
import './globals.css'

/**
 * One typeface, three weights. Thai webfonts are heavy, and this page is opened
 * on a phone from a chat app, so every weight dropped is real load time saved.
 */
const thai = IBM_Plex_Sans_Thai({
    subsets: ['thai', 'latin'],
    weight: ['400', '500', '600'],
    variable: '--font-thai',
    display: 'swap',
})

export const metadata: Metadata = {
    title: 'เกมส์โดรามอน 🔔 | เกมไพ่วงเหล้า',
    description:
        'เกมไพ่วงเหล้าสุดฮา เล่นพร้อมกันได้ทั้งวงจากมือถือ สร้างวง แชร์ลิงก์ให้เพื่อน แล้วเปิดไพ่ไปเรื่อยๆ',
    applicationName: 'เกมส์โดรามอน',
    openGraph: {
        title: 'เกมส์โดรามอน 🔔',
        description: 'เกมไพ่วงเหล้าสุดฮา สร้างวงแล้วแชร์ลิงก์ให้เพื่อนเข้ามาเล่นพร้อมกันเลย',
        type: 'website',
    },
}

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: '#0e1116',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="th" className={thai.variable}>
            <body>{children}</body>
        </html>
    )
}
