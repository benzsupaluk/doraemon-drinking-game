import { GameGuide } from '@/components/game-guide'
import { HomeClient } from '@/components/home-client'
import { CARD_RULES } from '@/lib/rules'
import {
    AUTHOR,
    FAQ,
    HOW_TO_STEPS,
    SITE_DESCRIPTION,
    SITE_NAME,
    SITE_TITLE,
    SITE_URL,
} from '@/lib/site'

/**
 * The home page is a server component so the guide below the game ships as
 * plain HTML — a crawler (and a phone on a bad connection) sees the rules
 * without running any JavaScript. Only the room controls are a client island.
 */
export default function HomePage() {
    return (
        <>
            <HomeClient />

            <StructuredData />
        </>
    )
}

/**
 * Structured data, so the result can carry a rating-style app panel and the FAQ
 * accordion rather than a bare blue link. It is generated from the same
 * constants the page renders, because Google penalises structured data that
 * describes content the page does not actually show.
 */
function StructuredData() {
    const graph = [
        {
            '@type': 'WebSite',
            '@id': `${SITE_URL}/#website`,
            url: `${SITE_URL}/`,
            name: SITE_NAME,
            description: SITE_DESCRIPTION,
            inLanguage: 'th-TH',
            publisher: { '@id': `${SITE_URL}/#author` },
        },
        {
            '@type': 'Person',
            '@id': `${SITE_URL}/#author`,
            name: AUTHOR.name,
            url: AUTHOR.website,
            sameAs: [AUTHOR.website, AUTHOR.instagram],
        },
        {
            '@type': ['WebApplication', 'Game'],
            '@id': `${SITE_URL}/#app`,
            name: SITE_TITLE,
            url: `${SITE_URL}/`,
            description: SITE_DESCRIPTION,
            applicationCategory: 'GameApplication',
            operatingSystem: 'Web browser (iOS, Android, desktop)',
            browserRequirements: 'ต้องใช้เบราว์เซอร์ที่เปิด JavaScript',
            inLanguage: 'th-TH',
            numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 2, maxValue: 12 },
            gameItem: { '@type': 'Thing', name: 'ไพ่ 1 สำรับ 52 ใบ' },
            author: { '@id': `${SITE_URL}/#author` },
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'THB' },
        },
        {
            '@type': 'HowTo',
            '@id': `${SITE_URL}/#howto`,
            name: 'วิธีเล่นเกมส์โดรามอน',
            description: 'สร้างวง แชร์ลิงก์ให้เพื่อน แล้วผลัดกันเปิดไพ่ตามกติกาของแต่ละใบ',
            inLanguage: 'th-TH',
            totalTime: 'PT2M',
            step: HOW_TO_STEPS.map((step, index) => ({
                '@type': 'HowToStep',
                position: index + 1,
                name: step.title,
                text: step.detail,
                url: `${SITE_URL}/#howto`,
            })),
        },
        {
            '@type': 'FAQPage',
            '@id': `${SITE_URL}/#faq`,
            inLanguage: 'th-TH',
            mainEntity: FAQ.map((item) => ({
                '@type': 'Question',
                name: item.question,
                acceptedAnswer: { '@type': 'Answer', text: item.answer },
            })),
        },
        {
            '@type': 'ItemList',
            '@id': `${SITE_URL}/#cards`,
            name: 'กติกาไพ่ทั้ง 13 ใบ',
            itemListElement: Object.values(CARD_RULES).map((rule, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                name: `ไพ่ ${rule.rank} — ${rule.title}`,
                description: rule.detail,
            })),
        },
    ]

    return (
        <script
            type="application/ld+json"
            // The content is our own constants, never user input, so there is
            // nothing here for a page visitor to inject into.
            dangerouslySetInnerHTML={{
                __html: JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }),
            }}
        />
    )
}
