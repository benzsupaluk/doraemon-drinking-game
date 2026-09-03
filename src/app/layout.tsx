import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Sans_Thai, Mali } from 'next/font/google'
import './globals.css'

const thai = IBM_Plex_Sans_Thai({
    subsets: ['thai', 'latin'],
    weight: ['400', '500', '600', '700'],
    variable: '--font-thai',
    display: 'swap',
})

const mali = Mali({
    subsets: ['thai', 'latin'],
    weight: ['500', '600', '700'],
    variable: '--font-mali',
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
    themeColor: '#061c33',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="th" className={`${thai.variable} ${mali.variable}`}>
            <body className="relative overflow-x-hidden">
                {/* พื้นหลังเรืองแสงแบบกลางคืน */}
                <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
                    <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_-10%,#0f4e86_0%,#061c33_58%,#02101d_100%)]" />
                    <div className="animate-float absolute -top-24 -left-16 size-72 rounded-full bg-dora-blue/25 blur-3xl" />
                    <div
                        className="animate-float absolute top-1/3 -right-20 size-72 rounded-full bg-dora-red/15 blur-3xl"
                        style={{ animationDelay: '-3s' }}
                    />
                    <div
                        className="animate-float absolute bottom-0 left-1/4 size-80 rounded-full bg-dora-yellow/10 blur-3xl"
                        style={{ animationDelay: '-6s' }}
                    />
                </div>
                {children}
            </body>
        </html>
    )
}
