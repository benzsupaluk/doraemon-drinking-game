import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

/**
 * Rooms are deliberately kept out of the index: their codes are recycled, they
 * live for six hours, and a few thousand dead 4-letter URLs would dilute the
 * one page that should rank. The API answers JSON, so there is nothing there
 * for a crawler either.
 */
export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/api/', '/room/'],
        },
        sitemap: `${SITE_URL}/sitemap.xml`,
        host: SITE_URL,
    }
}
