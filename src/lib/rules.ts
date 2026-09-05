import type { Rank, RoomState } from './types'

export interface CardRule {
    rank: Rank
    /** Short rule name, used as the card's headline. */
    title: string
    /** The full rule text, shown in the rules sheet. */
    detail: string
    /**
     * A one-or-two-line version for the card face.
     *
     * The card has room for the pip field and a couple of lines, so `detail`
     * gets clipped there — and what gets clipped is usually the penalty, which
     * is the part players actually need mid-game.
     */
    short: string
    emoji: string
    /** Gulps the drawer owes immediately (0 = they do not drink themselves). */
    sips: number
    /** Requires a follow-up interaction after the flip. */
    action?: 'buddy' | 'hold' | 'king'
    /** The card's colour theme. */
    tone: 'drink' | 'game' | 'target' | 'special'
}

export const CARD_RULES: Record<Rank, CardRule> = {
    A: {
        rank: 'A',
        title: 'ดื่ม 1 อึก',
        detail: 'ยกเลย ไม่ต้องคิดมาก',
        short: 'ยกเลย ไม่ต้องคิดมาก',
        emoji: '🥃',
        sips: 1,
        tone: 'drink',
    },
    '2': {
        rank: '2',
        title: 'ดื่ม 2 อึก',
        detail: 'สองอึกกำลังดี',
        short: 'สองอึกกำลังดี',
        emoji: '🥃',
        sips: 2,
        tone: 'drink',
    },
    '3': {
        rank: '3',
        title: 'ดื่ม 3 อึก',
        detail: 'เริ่มหนักแล้วนะ',
        short: 'เริ่มหนักแล้วนะ',
        emoji: '🥃',
        sips: 3,
        tone: 'drink',
    },
    '4': {
        rank: '4',
        title: 'ดื่ม 4 อึก',
        detail: 'ซวยแล้ว จัดไป 4 อึก',
        short: 'ว้าย จัดไป 4 อึก',
        emoji: '🥃',
        sips: 4,
        tone: 'drink',
    },
    '5': {
        rank: '5',
        title: 'จับบัดดี้',
        detail: 'เลือกบัดดี้ 1 คน จากนี้ไปถ้าเราหรือบัดดี้โดนดื่มจากอะไรก็แล้วแต่ อีกคนต้องดื่มด้วย',
        short: 'ถ้าใครในคู่โดนดื่ม อีกคนดื่มด้วย',
        emoji: '🤝',
        sips: 0,
        action: 'buddy',
        tone: 'special',
    },
    '6': {
        rank: '6',
        title: 'เกมหมวดหมู่',
        detail: 'คนเปิดตั้งหัวข้อ เช่น "สัตว์" แล้วไล่กันไป หมู หมา กา ไก่ ใครตอบไม่ได้หรือตอบช้า ดื่ม 1 อึก',
        short: 'ตั้งหัวข้อแล้วไล่กันไป ตอบไม่ได้ 1 อึก',
        emoji: '🐷',
        sips: 0,
        tone: 'game',
    },
    '7': {
        rank: '7',
        title: 'เกมเลข 7',
        detail: 'พูดเรียงเลขไปเรื่อยๆ ข้ามเลขที่ลงท้ายด้วย 7 หรือหารด้วย 7 ลงตัว (7 14 17 21 27 28) ผิดที่ใครก็ 1 อึก',
        short: 'ข้ามเลขที่มี 7 หรือหารด้วย 7 ผิด\n1 อึก',
        emoji: '7️⃣',
        sips: 0,
        tone: 'game',
    },
    '8': {
        rank: '8',
        title: 'ไพ่ติดตัว',
        detail: 'เก็บไพ่นี้ไว้กับตัว ใช้เองหรือให้เพื่อน เพื่อไว้ทำข้อห้าม (เช่น ห้ามเข้าห้องน้ำ)',
        short: 'เก็บไว้ใช้ทำข้อห้าม ให้เพื่อนก็ได้นะ',
        emoji: '🎫',
        sips: 0,
        action: 'hold',
        tone: 'special',
    },
    '9': {
        rank: '9',
        title: 'คนทางซ้ายดื่ม',
        detail: 'คนที่นั่งทางซ้ายของคนเปิด ดื่ม 1 อึก',
        short: 'คนทางซ้ายของคนเปิด ดื่ม 1 อึก',
        emoji: '👈',
        sips: 0,
        tone: 'target',
    },
    '10': {
        rank: '10',
        title: 'คนทางขวาดื่ม',
        detail: 'คนที่นั่งทางขวาของคนเปิด ดื่ม 1 อึก',
        short: 'คนทางขวาของคนเปิด ดื่ม 1 อึก',
        emoji: '👉',
        sips: 0,
        tone: 'target',
    },
    J: {
        rank: 'J',
        title: 'เกมจับคาง',
        detail: 'คนเปิดเอามือจับคาง (หรือจะทำท่าอะไรก็ได้) ทุกคนต้องทำตาม คนสุดท้ายที่ทำตาม ดื่ม 1 อึก',
        short: 'ทุกคนทำตาม คนสุดท้ายดื่ม 1 อึก',
        emoji: '🤙',
        sips: 0,
        tone: 'game',
    },
    Q: {
        rank: 'Q',
        title: 'ห้ามพูดด้วย',
        detail: 'ห้ามพูดกับคนที่ได้ไพ่นี้ ถ้าใครพูดด้วยก็โดน 1 อึก (จนกว่าจะมีคนเปิด Q ใบต่อไป)',
        short: 'ใครพูดกับคนนี้ โดน 1 อึก',
        emoji: '🤫',
        sips: 0,
        tone: 'special',
    },
    K: {
        rank: 'K',
        title: 'ราชาสั่งได้',
        detail: 'ใบแรกกำหนดทำอะไร ใบสองกำหนดทำที่ไหน ใบสามกำหนดทำยังไง (หรือนานเท่าไหร่) ใบสี่โดนเอง',
        short: 'ใบที่ 4 ทำทุกอย่างที่กำหนดไว้',
        emoji: '👑',
        sips: 0,
        action: 'king',
        tone: 'special',
    },
}

/** King text, by which King it is (1-4). */
export const KING_STEPS = [
    { title: 'ใบที่ 1 — กำหนด "ทำอะไร"', detail: 'คนเปิดตั้งท่าหรือกิจกรรมที่ต้องทำ' },
    { title: 'ใบที่ 2 — กำหนด "ทำที่ไหน"', detail: 'คนเปิดกำหนดสถานที่หรือตำแหน่ง' },
    { title: 'ใบที่ 3 — กำหนด "ทำยังไง / นานเท่าไหร่"', detail: 'คนเปิดกำหนดวิธีหรือระยะเวลา' },
    { title: 'ใบที่ 4 — โดนเอง! 💀', detail: 'คนเปิดใบนี้ต้องทำทุกอย่างที่ 3 ใบก่อนหน้ากำหนดไว้' },
] as const

/** What each of the first three Kings asks its drawer to type in. */
export const KING_INPUTS = [
    { label: 'ทำอะไร', placeholder: 'เช่น เต้นท่าไก่ย่าง' },
    { label: 'ทำที่ไหน', placeholder: 'เช่น บนเก้าอี้กลางวง' },
    { label: 'ทำยังไง / นานเท่าไหร่', placeholder: 'เช่น ช้าๆ 30 วินาที' },
] as const

/** Longest a King's order may be, so it still fits on one line everywhere. */
export const KING_DECREE_MAX = 60

/**
 * The King that is waiting for its order (1, 2 or 3), or null when nothing is
 * pending. Derived from state rather than stored, so the server check and the
 * screen can never disagree about whose turn it is to decide.
 */
export function pendingKingStep(state: RoomState): number | null {
    if (state.phase !== 'revealed' || state.currentCard?.rank !== 'K') return null
    if (state.kingCount < 1 || state.kingCount > 3) return null
    if (state.kingDecrees.some((decree) => decree.step === state.kingCount)) return null
    return state.kingCount
}

/** The three orders in step order, with a hole where one is not set yet. */
export function kingDecreeSlots(state: RoomState) {
    return [1, 2, 3].map((step) => ({
        step,
        label: KING_INPUTS[step - 1].label,
        decree: state.kingDecrees.find((item) => item.step === step) ?? null,
    }))
}

/** Rules that apply for the whole game. */
export const GLOBAL_RULES = [
    {
        emoji: '🙅',
        title: 'ห้ามชี้นิ้ว',
        detail: 'พวกเราเป็นโดรามอน (หลบลิขสิทธิ์) ห้ามใช้นิ้วชี้ชี้เพื่อน ถ้าชี้ก็โดน 1 อึก',
    },
    {
        emoji: '🚻',
        title: 'ห้ามลุกเข้าห้องน้ำ',
        detail: 'ต้องมีไพ่ 8 ติดตัวก่อนถึงจะไปได้ (หรือตกลงกันใหม่ในวงก็ได้)',
    },
] as const

export const SUIT_SYMBOL: Record<string, string> = {
    spades: '♠',
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
}
