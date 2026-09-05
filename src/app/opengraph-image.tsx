import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import { SITE_NAME } from '@/lib/site'

export const alt = 'เกมส์โดรามอน — เกมไพ่วงเหล้า เล่นพร้อมกันทั้งวงจากมือถือ'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/*
 * The preview card people see when the invite link is pasted into LINE, and the
 * image Google shows next to the result.
 *
 * The Thai font has to be supplied by hand: the renderer's built-in font has no
 * Thai glyphs, so without this every character comes out as an empty box. The
 * file is committed rather than fetched so a build can never depend on Google
 * Fonts being reachable.
 */
const thaiFont = readFile(join(process.cwd(), 'assets/IBMPlexSansThai-SemiBold.ttf'))

export default async function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 24,
                    background: 'linear-gradient(150deg, #0e1116 0%, #171c23 55%, #1b2331 100%)',
                    color: '#e8ebef',
                    padding: 72,
                    textAlign: 'center',
                }}
            >
                {/* The bell mark, inline so no second asset has to load. */}
                <svg width="132" height="132" viewBox="0 0 32 32" fill="none">
                    <g stroke="#4c9aff" strokeWidth="1.6" strokeLinecap="round">
                        <path d="M16 3v3" />
                        <circle cx="16" cy="18" r="11" />
                        <path d="M5.4 16.5h21.2" />
                        <path d="M16 19.5v3" />
                        <circle cx="16" cy="24.6" r="2.2" />
                    </g>
                </svg>

                <div style={{ display: 'flex', fontSize: 86, letterSpacing: -1 }}>{SITE_NAME}</div>

                <div style={{ display: 'flex', fontSize: 40, color: '#97a1b0' }}>
                    เกมไพ่วงเหล้า เล่นพร้อมกันทั้งวงจากมือถือ
                </div>

                <div style={{ display: 'flex', fontSize: 30, color: '#e3b341' }}>
                    เล่นฟรี ไม่ต้องโหลดแอป · 2–12 คน
                </div>
            </div>
        ),
        {
            ...size,
            fonts: [
                {
                    name: 'IBM Plex Sans Thai',
                    data: await thaiFont,
                    weight: 600,
                    style: 'normal',
                },
            ],
        }
    )
}
