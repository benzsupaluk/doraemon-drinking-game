/**
 * Everything search engines and social apps are told about this site.
 *
 * Kept in one file so the page metadata, the sitemap, the robots file and the
 * structured data can never drift apart — a canonical URL that disagrees with
 * the sitemap is one of the few SEO mistakes that actively costs you rankings.
 */

/**
 * The site's own origin, used for canonical URLs, OG tags and the sitemap.
 *
 * Vercel injects `VERCEL_PROJECT_PRODUCTION_URL` with the project's production
 * domain, so a deploy is correct with nothing to configure. Set
 * `NEXT_PUBLIC_SITE_URL` when a custom domain should win — canonical URLs must
 * point at the domain you actually want indexed, not a preview one.
 */
export const SITE_URL = (
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : 'http://localhost:3000')
).replace(/\/$/, '')

export const SITE_NAME = 'เกมส์โดรามอน'

export const SITE_TITLE = 'เกมส์โดรามอน 🔔 เกมไพ่วงเหล้า เล่นพร้อมกันทั้งวงจากมือถือ'

export const SITE_DESCRIPTION =
    'เกมส์โดรามอน เกมไพ่วงเหล้ายอดฮิต เล่นฟรีบนมือถือ ไม่ต้องโหลดแอป ไม่ต้องมีไพ่จริง ' +
    'สร้างวงแล้วแชร์ลิงก์ให้เพื่อน เปิดไพ่พร้อมกันทั้งวง พร้อมกติกาไพ่ครบทั้ง 13 ใบ'

/** Search terms Thai players actually type when they look for this game. */
export const SITE_KEYWORDS = [
    'เกมส์โดรามอน',
    'เกมโดราเอมอน',
    'เกมไพ่วงเหล้า',
    'เกมวงเหล้า',
    'เกมส์วงเหล้า',
    'ไพ่วงเหล้า',
    'กติกาเกมส์โดรามอน',
    'วิธีเล่นเกมส์โดรามอน',
    'เกมดื่ม',
    'เกมส์ปาร์ตี้',
    'เกมส์เล่นกับเพื่อน',
    'เกมส์ออนไลน์เล่นหลายคน',
    'เกมส์มือถือไม่ต้องโหลด',
    'thai drinking game',
    'drinking card game online',
]

export const AUTHOR = {
    name: 'Benz Supaluk',
    website: 'https://benzsupaluk.vercel.app/',
    instagram: 'https://instagram.com/benzsupalukk',
}

/** How to play, in the order the game actually happens. */
export const HOW_TO_STEPS = [
    {
        title: 'สร้างวง',
        detail: 'ใส่ชื่อ เลือกจำนวนคนในวง (2–12 คน) แล้วกดสร้างวงใหม่ ระบบจะให้รหัสวง 4 ตัวอักษร',
    },
    {
        title: 'ชวนเพื่อน',
        detail: 'แชร์ลิงก์เข้าไลน์หรือให้เพื่อนกรอกรหัสวงจากหน้าแรก ทุกคนเห็นรายชื่อในวงแบบเรียลไทม์',
    },
    {
        title: 'เริ่มเกม',
        detail: 'หัวตี้กดเริ่มเกม ระบบสุ่มคนเริ่มให้เอง ถึงตาใครมือถือจะสั่นและมีเสียงกระดิ่งเตือน',
    },
    {
        title: 'เปิดไพ่ทำตามกติกา',
        detail: 'แตะไพ่เพื่อเปิด ไพ่จะพลิกขึ้นพร้อมกันทุกเครื่อง อ่านกติกาบนไพ่แล้วทำตาม จากนั้นกดจบตา',
    },
    {
        title: 'จบรอบ',
        detail: 'ไพ่หมดสำรับ 52 ใบเมื่อไหร่ก็จบรอบ ดูสรุปว่าใครเปิดไพ่มากที่สุด แล้วเริ่มรอบใหม่ได้เลย',
    },
] as const

/** Questions people ask before they trust a link someone sent them. */
export const FAQ = [
    {
        question: 'เกมส์โดรามอนคือเกมอะไร',
        answer:
            'เกมส์โดรามอนคือเกมไพ่วงเหล้ายอดนิยมของไทย ใช้ไพ่ 1 สำรับ ผลัดกันเปิดไพ่ทีละใบ ' +
            'ไพ่แต่ละใบมีกติกาของตัวเอง เช่น ดื่มตามเลขหน้าไพ่ จับบัดดี้ เล่นเกมเลข 7 หรือห้ามพูดด้วย ' +
            'เว็บนี้ทำให้เล่นได้โดยไม่ต้องมีไพ่จริงและไม่ต้องจำกติกาเอง',
    },
    {
        question: 'เล่นกี่คน ต้องโหลดแอปไหม',
        answer:
            'เล่นได้ตั้งแต่ 2 ถึง 12 คน ไม่ต้องโหลดแอปและไม่ต้องสมัครสมาชิก ' +
            'เปิดผ่านเบราว์เซอร์บนมือถือได้เลยทั้ง iPhone และ Android แค่กดลิงก์ที่เพื่อนแชร์มา',
    },
    {
        question: 'ไม่ดื่มแอลกอฮอล์เล่นได้ไหม',
        answer:
            'ได้ ทุกกติกาใช้กับน้ำเปล่า น้ำอัดลม หรือเปลี่ยนเป็นการทำท่าตลกแทนการดื่มก็สนุกเหมือนกัน ' +
            'ตัวเกมไม่ได้บังคับว่าต้องดื่มอะไร',
    },
    {
        question: 'รหัสวงอยู่ได้นานแค่ไหน',
        answer:
            'วงที่ไม่มีใครแตะเลย 6 ชั่วโมงจะถูกลบอัตโนมัติ ระหว่างเล่นอยู่ไม่ต้องห่วง ' +
            'ปิดแท็บแล้วกลับเข้ามาใหม่ด้วยลิงก์เดิมก็ยังอยู่ที่นั่งเดิม',
    },
    {
        question: 'ไพ่ K (ราชา) เล่นยังไง',
        answer:
            'K ใบแรกกำหนดว่า "ทำอะไร" ใบที่สองกำหนด "ทำที่ไหน" ใบที่สามกำหนด "ทำยังไงหรือนานเท่าไหร่" ' +
            'ใครเปิด K ใบที่ 4 ต้องทำทุกอย่างที่กำหนดไว้ ระบบจดคำสั่งทั้งสามข้อไว้ให้ทั้งวงดูได้ตลอดรอบ',
    },
] as const
