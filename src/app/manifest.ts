import type { MetadataRoute } from 'next'
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE } from '@/lib/site'

/**
 * Makes the game installable to a phone's home screen. Google also reads the
 * manifest when deciding whether a page is a real app rather than a thin page.
 */
export default function manifest(): MetadataRoute.Manifest {
    return {
        name: SITE_TITLE,
        short_name: SITE_NAME,
        description: SITE_DESCRIPTION,
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0e1116',
        theme_color: '#0e1116',
        lang: 'th',
        categories: ['games', 'entertainment', 'social'],
        icons: [
            {
                src: '/icon.svg',
                type: 'image/svg+xml',
                sizes: 'any',
                purpose: 'any',
            },
        ],
    }
}
