import { CARD_RULES, GLOBAL_RULES } from '@/lib/rules'
import { FAQ, HOW_TO_STEPS, SITE_FEATURES } from '@/lib/site'
import type { Rank } from '@/lib/types'

const ORDER: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

/**
 * The written guide under the game.
 *
 * This is the only real text on the site, and it is what a search engine has to
 * work with: the in-game rules sheet is a drawer, and a drawer renders nothing
 * until it is opened, so none of it exists in the HTML a crawler reads. It is a
 * server component, so none of this costs the players a byte of JavaScript.
 */
export function GameGuide() {
    return (
        <section className="app-shell space-y-8 border-t border-line py-10 text-[0.9375rem] leading-relaxed">
            <div className="space-y-2">
                <h2 className="text-[1.25rem] font-semibold">
                    เกมส์โดรามอน เกมไพ่วงเหล้ายอดฮิต คืออะไร
                </h2>
                <p className="text-muted">
                    เกมส์โดรามอนคือเกมไพ่วงเหล้ายอดฮิตของไทย บางวงเรียกเกมไพ่โดราเอมอน
                    บางวงเรียกเกมไพ่โดเรมอน แต่กติกาเหมือนกันหมด ใช้ไพ่หนึ่งสำรับวางกลางวง
                    แล้วผลัดกันเปิดทีละใบ ไพ่แต่ละใบมีกติกาของตัวเอง ตั้งแต่ดื่มตามเลขหน้าไพ่
                    จับบัดดี้ เล่นเกมเลข 7 ไปจนถึงไพ่ราชาที่สั่งให้ทำอะไรก็ได้
                    เว็บนี้ย้ายทั้งวงมาไว้บนมือถือ ไม่ต้องพกไพ่จริง ไม่ต้องจำกติกา
                    และไม่ต้องเถียงกันว่าใครจับบัดดี้กับใคร
                </p>
            </div>

            <div className="space-y-3">
                <h2 className="text-[1.25rem] font-semibold">
                    เล่นเกมไพ่วงเหล้า ฟรี ออนไลน์ ไม่ต้องโหลดแอป
                </h2>
                <p className="text-muted">
                    เกมวงเหล้าส่วนใหญ่ต้องโหลดแอปหรือต้องมีไพ่จริงติดตัวไปด้วย เกมไพ่โดราเอมอน
                    ออนไลน์บนเว็บนี้ไม่ต้องทั้งสองอย่าง
                    หัวตี้กดสร้างวงแล้วส่งลิงก์เดียวเข้ากลุ่มไลน์ ใครกดก็เข้าวงได้ทันที
                </p>
                <ul className="space-y-2">
                    {SITE_FEATURES.map((feature) => (
                        <li key={feature} className="flex gap-3">
                            <span className="shrink-0 text-accent" aria-hidden>
                                ✓
                            </span>
                            <p className="min-w-0 text-muted">{feature}</p>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="space-y-3">
                <h2 className="text-[1.25rem] font-semibold">
                    วิธีเล่นเกมส์โดรามอน ออนไลน์ ทีละขั้น
                </h2>
                <ol className="space-y-2.5">
                    {HOW_TO_STEPS.map((step, index) => (
                        <li key={step.title} className="flex gap-3">
                            <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-line text-[0.8125rem] font-semibold text-accent">
                                {index + 1}
                            </span>
                            <p className="min-w-0">
                                <strong className="font-semibold">{step.title}</strong>{' '}
                                <span className="text-muted">— {step.detail}</span>
                            </p>
                        </li>
                    ))}
                </ol>
            </div>

            <div className="space-y-3">
                <h2 className="text-[1.25rem] font-semibold">กติกาเกมส์โดรามอน ครบทั้ง 13 ใบ</h2>
                <p className="text-muted">
                    ไพ่ทุกใบในสำรับมีกติกาของตัวเอง เปิดใบไหนก็ทำตามใบนั้น
                    ระบบขึ้นกติกาให้อ่านบนไพ่ตอนเปิดอยู่แล้ว
                    ตารางนี้ไว้ดูรวมก่อนเริ่มเล่นหรือตอนเถียงกันกลางวง
                </p>
                <ul className="divide-y divide-line">
                    {ORDER.map((rank) => {
                        const rule = CARD_RULES[rank]
                        return (
                            <li key={rank} className="flex gap-3 py-2.5">
                                <span className="w-7 shrink-0 text-center font-semibold text-accent">
                                    {rank}
                                </span>
                                <div className="min-w-0">
                                    <h3 className="font-medium">{rule.title}</h3>
                                    <p className="text-muted">{rule.detail}</p>
                                </div>
                            </li>
                        )
                    })}
                </ul>

                <h3 className="pt-2 font-semibold">กฎที่ใช้ตลอดทั้งเกม</h3>
                <ul className="space-y-2">
                    {GLOBAL_RULES.map((rule) => (
                        <li key={rule.title} className="flex gap-3">
                            <span aria-hidden>{rule.emoji}</span>
                            <p className="min-w-0">
                                <strong className="font-medium">{rule.title}</strong>{' '}
                                <span className="text-muted">— {rule.detail}</span>
                            </p>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="space-y-2">
                <h2 className="text-[1.25rem] font-semibold">
                    คำถามที่พบบ่อยเกี่ยวกับเกมไพ่วงเหล้า
                </h2>
                <div className="divide-y divide-line">
                    {FAQ.map((item) => (
                        <details key={item.question} className="group py-2.5">
                            <summary className="cursor-pointer list-none font-medium marker:content-none">
                                <span className="text-accent group-open:hidden">＋ </span>
                                <span className="hidden text-accent group-open:inline">－ </span>
                                {item.question}
                            </summary>
                            <p className="pt-1.5 pl-5 text-muted">{item.answer}</p>
                        </details>
                    ))}
                </div>
            </div>
        </section>
    )
}
