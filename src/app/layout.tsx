import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Sans_Thai } from 'next/font/google'
import './globals.css'
import {
    AUTHOR,
    SITE_DESCRIPTION,
    SITE_KEYWORDS,
    SITE_NAME,
    SITE_TITLE,
    SITE_URL,
} from '@/lib/site'

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
    // Every relative URL below (canonical, OG image) resolves against this, so
    // it has to be the domain that should actually be indexed.
    metadataBase: new URL(SITE_URL),
    title: {
        default: SITE_TITLE,
        // Room pages and anything else added later keep the brand in the tab.
        template: `%s | ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
    keywords: SITE_KEYWORDS,
    applicationName: SITE_NAME,
    category: 'games',
    authors: [{ name: AUTHOR.name, url: AUTHOR.website }],
    creator: AUTHOR.name,
    publisher: AUTHOR.name,
    alternates: { canonical: '/' },
    manifest: '/manifest.webmanifest',
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
            'max-video-preview': -1,
        },
    },
    openGraph: {
        type: 'website',
        siteName: SITE_NAME,
        title: SITE_TITLE,
        description: SITE_DESCRIPTION,
        url: '/',
        locale: 'th_TH',
    },
    twitter: {
        card: 'summary_large_image',
        title: SITE_TITLE,
        description: SITE_DESCRIPTION,
    },
    appleWebApp: {
        capable: true,
        title: SITE_NAME,
        statusBarStyle: 'black-translucent',
    },
    // Thai phone numbers in rule text would otherwise be turned into call links.
    formatDetection: { telephone: false },
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
