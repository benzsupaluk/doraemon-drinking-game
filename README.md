# เกมส์โดรามอน 🔔

A Thai drinking card game for a whole table, played from everyone's own phone.
The host opens a room, shares an invite link, and the group flips cards one at a
time — whatever card you draw, you do what it says.

When it's your turn, **your phone vibrates and rings a bell** so nobody has to
stare at the screen waiting.

> Please drink responsibly 🍻 This is built for fun among consenting adults.
> Every rule works just as well with water or a silly dare instead of alcohol.

---

## Contents

- [How to play](#how-to-play)
- [Card rules](#card-rules)
- [Features](#features)
- [Running locally](#running-locally)
- [Deploying to Vercel](#deploying-to-vercel)
- [Architecture](#architecture)
- [API](#api)
- [Project layout](#project-layout)
- [Troubleshooting](#troubleshooting)

---

## How to play

1. The **host** opens the home page, enters a name, picks the table size (2–12
   players) and taps **สร้างวงใหม่** (create room).
2. They get a **4-character room code** and an **invite link**. Tapping "share"
   opens the device share sheet (straight into LINE, for example); if the browser
   doesn't support it, the link is copied to the clipboard instead.
3. **Friends** open the link, type their own name, and join — or type the
   4-character code on the home page.
4. Every phone sees the roster fill up live. No refreshing.
5. The host taps **เริ่มเกม** (start) and the app **picks the starting player at
   random**.
6. When it's your turn your phone **vibrates and plays a bell chime**, repeating
   every 12 seconds until you act. Tap the card to flip it.
7. The card flips face-up on every phone at once. Read the rule, do it, then tap
   **จบตา** to pass to the next player.
8. When the 52-card deck runs out the round ends with a summary of who flipped
   the most cards. The host can start a fresh round.

Room codes deliberately exclude `I`, `O`, `0` and `1` — you often have to read
the code out loud for someone else to type.

---

## Card rules

The rules are kept in Thai because that's the language the game is played in.

| ไพ่         | กฎ                                                                            |
| ----------- | ----------------------------------------------------------------------------- |
| **A–4**     | ดื่ม 1–4 อึกตามหน้าไพ่                                                        |
| **5**       | จับบัดดี้ 1 คน — จากนี้ถ้าใครในคู่โดนดื่ม อีกคนต้องดื่มด้วย                   |
| **6**       | เกมหมวดหมู่ — ตั้งหัวข้อแล้วไล่กันไป ใครตอบไม่ได้/ช้า ดื่ม 1 อึก              |
| **7**       | เกมเลข 7 — ข้ามเลขที่ลงท้ายด้วย 7 หรือหารด้วย 7 ลงตัว ผิดดื่ม 1 อึก           |
| **8**       | ไพ่ติดตัว — เก็บไว้ใช้เอง (หรือให้เพื่อน) เพื่อไปห้องน้ำ                      |
| **9**       | คนทางซ้ายของคนเปิด ดื่ม 1 อึก                                                 |
| **10**      | คนทางขวาของคนเปิด ดื่ม 1 อึก                                                  |
| **J**       | เกมจับคาง — คนสุดท้ายที่ทำตาม ดื่ม 1 อึก                                      |
| **Q**       | ห้ามพูดกับคนที่ได้ไพ่นี้ ถ้าพูดด้วยโดน 1 อึก                                  |
| **K**       | ใบ 1 กำหนด "ทำอะไร" ใบ 2 "ที่ไหน" ใบ 3 "ยังไง/นานเท่าไหร่" **ใบ 4 โดนเอง** 💀 |
| **ตลอดเกม** | **ห้ามชี้นิ้ว** (เพราะเราเป็นโดเรมอน) ถ้าชี้ก็โดน 1 อึก                       |

All rule text lives in one file, [`src/lib/rules.ts`](src/lib/rules.ts). Edit it
there and the card faces, the summary line and the rules sheet all update
together.

### The app tracks the fiddly state for you

Nobody has to remember who is paired with whom:

- **Buddy pairs** (card 5) — both players get a 🤝 badge, and when one of them has
  to drink the app reminds you the other one drinks too. Picking a new buddy
  clears both players' old pairings, so no stale pairs are left behind.
- **Who is holding a card 8** — shown as a counter on their avatar; the owner can
  spend it themselves.
- **Who is under the Q** — marked with 🤫, and it moves automatically when the next
  Q is drawn.
- **How many Kings have appeared** — the card face shows the right instruction for
  the 1st, 2nd, 3rd or 4th King.
- **Cards 9 and 10** — the app names the player who actually has to drink instead
  of making you work out "left" and "right".

---

## Features

**Real multiplayer** — every phone stays in sync. Players joining, cards being
flipped, turns changing: all of it shows up everywhere without a refresh.

**Turn alerts** — `navigator.vibrate` plus a three-note bell chime **synthesised
with the Web Audio API**, so there are no audio files to load at all. It repeats
every 12 seconds until you act, and there's a 🔊 toggle in the header. iOS doesn't
support `navigator.vibrate` at all, which is why sound is the primary channel.

**Built for phones** — content is capped at 32rem and centred on larger screens,
`env(safe-area-inset-bottom)` keeps buttons clear of the iPhone home bar, tap
targets are at least 52px, and double-tap zoom, tap highlights and bounce
scrolling are all disabled.

**Smooth graphics** — a real 3D card flip (`transform-style: preserve-3d` with
`backface-visibility`), a layered deck stack that shows how thick the deck still
is, a light sweep across the card back, and drifting background glows. All of it
is disabled under `prefers-reduced-motion`.

**Rejoin support** — the player id is kept in `localStorage`, so closing the tab
and coming back keeps your seat. If the id is no longer valid (room expired, or
you were removed) the app sends you back to the name screen by itself.

**Backs off when hidden** — a hidden tab drops to polling every 5 seconds and
refreshes immediately when you come back, which saves both battery and serverless
invocations.

---

## Running locally

```bash
pnpm install
pnpm dev
```

Open <http://localhost:3000>. **No configuration needed** — no Redis, no `.env`.
In development the app keeps room state in the process's memory.

### Testing on a real phone

`pnpm dev` prints a LAN URL such as `http://192.168.1.5:3000`. Open that on a
phone on the same Wi-Fi to try the sound and vibration for real.

### Other scripts

```bash
pnpm build        # production build
pnpm start        # serve the production build
pnpm typecheck    # tsc --noEmit
pnpm lint         # ESLint
```

---

## Deploying to Vercel

> **Important:** on Vercel you **must** connect Redis. Without it the app still
> builds and loads, but **friends won't be able to find the room**, because
> consecutive requests can land on different instances that don't share memory.
> See [Why Redis is required](#why-redis-is-required) for the details.

### 1. Import the repo

Go to [vercel.com/new](https://vercel.com/new) and pick the
`doraemon-drinking-game` repo. Vercel detects Next.js on its own — **no build
settings to change**.

You can deploy now or later; either way you'll redeploy once Redis is attached.

### 2. Attach Redis

In the Vercel project: **Storage** → **Create Database** → **Upstash for Redis** →
name it → choose a region close to your players (`ap-southeast-1` in Singapore is
a good pick for Thailand) → **Connect** it to the project.

Vercel injects the environment variables for you — **there is nothing to type in
by hand.** You'll see several of them; the app only needs two:

| Variable                      | What it is                                        | Used |
| ----------------------------- | ------------------------------------------------- | ---- |
| `KV_REST_API_URL`             | HTTPS endpoint for the Upstash **REST** API       | ✅   |
| `KV_REST_API_TOKEN`           | Bearer token with **read + write**                | ✅   |
| `KV_REST_API_READ_ONLY_TOKEN` | Same, read-only                                   | ❌   |
| `KV_URL`                      | Redis **TCP** connection string (`rediss://…`)    | ❌   |
| `REDIS_URL`                   | Alias of `KV_URL`                                 | ❌   |

Depending on which integration you pick, the same REST endpoint may instead be
exposed under Upstash's own names — `UPSTASH_REDIS_REST_URL` and
`UPSTASH_REDIS_REST_TOKEN`. Those are **the same two values**, and the app accepts
either pair, so whichever set you get, it just works.

`KV_URL` / `REDIS_URL` are deliberately unused: `@upstash/redis` speaks HTTP, and
raw TCP connection pools behave badly in serverless (each cold start opens a new
socket). **Don't add any variable by hand** — in particular, creating a blank
`UPSTASH_REDIS_REST_URL` is pointless; the app skips empty values, but it's still
just noise.

Upstash's free tier (10,000 commands/day) is plenty for playing with friends.

### 3. Redeploy and verify

Attaching the database doesn't rebuild the app, so **redeploy once** afterwards
(Deployments → latest → Redeploy). Then check:

```bash
curl https://<your-project>.vercel.app/api/health
```

You want:

```json
{
  "ok": true,
  "store": "redis",
  "misconfigured": false,
  "ignoredUrlVars": [],
  "initError": null,
  "env": { "url": "KV_REST_API_URL", "token": "KV_REST_API_TOKEN" }
}
```

This endpoint always answers `200`, even when every other route is failing,
because it is the only thing you have to debug with. Nothing in its response
ever contains a credential *value* — only variable names.

| Field            | Meaning                                                               |
| ---------------- | --------------------------------------------------------------------- |
| `store`          | `redis` is what you want; `memory` cannot work on Vercel              |
| `misconfigured`  | `true` means this deployment cannot support multiplayer as configured |
| `env`            | Which variable **names** were used, never their values                |
| `ignoredUrlVars` | Variables that are set but unusable                                   |
| `initError`      | Set if the Redis client could not be built at all                     |

Common results:

- `"env": { "url": null, "token": null }` — the credentials aren't reaching the
  app. Confirm the database is connected to *this* project, then **redeploy**:
  a deployment keeps the environment it was created with, so one made before you
  attached the database has no credentials.
- `ignoredUrlVars: ["UPSTASH_REDIS_REST_URL"]` — that variable holds something
  that isn't an https REST endpoint, almost always because the `rediss://` string
  from `KV_URL` / `REDIS_URL` was pasted into it. The app skips it and falls
  through to the next candidate, so the game still works, but delete the variable
  to clear the warning. **Never paste `KV_URL` or `REDIS_URL` into a `*_REST_URL`
  variable** — they are different endpoints, and those strings contain the
  database password.
- `initError` set — credentials are present but the client could not be built.
  The full error is in the function logs; this endpoint deliberately does not
  echo it, because the client's message repeats the URL it was handed and that
  can carry the password.

### Cost and limits

The app **polls** rather than holding a WebSocket or SSE connection open, so:

- each player sends one request every **1.1 seconds** while the tab is open
  (every 5 seconds when backgrounded)
- if nothing changed, the response is about **30 bytes**
  (`{"unchanged":true,...}`) versus ~650 bytes for a full state payload
- six players for one hour is roughly **20,000 invocations**; the Hobby plan
  includes 1,000,000/month, so about 50 hours of play per month

To trade latency for fewer requests, raise `POLL_VISIBLE_MS` in
[`src/hooks/use-room.ts`](src/hooks/use-room.ts).

Rooms that nobody touches for **6 hours** are removed automatically by the Redis
TTL — no cron job required.

### Deploying anywhere else (VPS, Docker, Railway, …)

If you run this as a **single long-lived process**, you don't need Redis and
don't need to set anything: the app keeps state in memory.
`/api/health` reporting `"store":"memory"` is correct in that case.

You need Redis when you deploy serverless, scale to more than one instance, or
restart the process frequently.

---

## Architecture

### Why Redis is required

Vercel runs route handlers as serverless functions, which means:

- **two consecutive requests may hit different instances** that share no memory
- instances are recycled at any time

With rooms held in an in-process `Map`, the host could create a room on instance
A while a friend asks instance B, which has never heard of it — "room not found"
for a room created two seconds ago. State shared across requests has to live
outside the process.

### Why polling instead of WebSocket / SSE

- a long-lived connection gets cut at the function's `maxDuration` (60s on
  Hobby), so it reconnects constantly
- Vercel bills for the time a function stays open, so idle connections cost money
- SSE still ties clients to the one process holding the listener, which
  contradicts the point above

This game moves in turns, not milliseconds, so ~1 second of latency is invisible.
And **the player who acts sees the result instantly**, because the action response
carries the new state; only the observers wait for the next poll.

Polling uses a **version cursor**: the client sends `?since=<version>` and the
server replies `{"unchanged":true}` — about 30 bytes — when nothing has moved.

### The deck never leaves the server

A `RoomRecord` has two halves: `state`, which is sent to clients, and `deck`,
which never is. Clients only learn `deckCount`, **never what's coming next**, so
there's nothing to cheat with in devtools. Shuffling (Fisher–Yates) and drawing
both happen on the server.

### Room locking

Every action is a read-modify-write. Without a lock, two simultaneous actions
mean the second one overwrites the first — for example two people joining at once
and only one of them appearing.

- **Redis** — `SET NX PX 4000` to take the lock, released with a Lua script that
  compares a token before deleting, so an expired lock can't be released by
  someone else. It waits up to 3 seconds, and proceeds without the lock rather
  than throwing an error at a player.
- **Memory** — a per-room promise queue that serialises actions on the same room.

Verified by firing six simultaneous joins at a four-seat room: exactly four
players got in, five were rejected, no lost updates.

### Layers

```
route handler          parse the request, validate input, map errors to status codes
      │
      ▼
lib/server/rooms.ts    async: load room → lock → call game → save
      │
      ▼
lib/server/game.ts     all the game rules — pure, no I/O whatsoever
      │
      ▼
lib/server/store.ts    Redis or memory, same interface, chosen by env
```

Because `game.ts` does no I/O, swapping the store doesn't touch a single line of
game logic, and the rules can be exercised without a Redis instance.

---

## API

Every endpoint is `force-dynamic` and responds with `Cache-Control: no-store`.

| Method | Path                         | Purpose                                                       |
| ------ | ---------------------------- | ------------------------------------------------------------- |
| `POST` | `/api/rooms`                 | Create a room — `{ name, maxPlayers }` → `{ state, playerId }` |
| `GET`  | `/api/rooms/:code?since=<v>` | Read state; returns `{ unchanged: true }` if the version held  |
| `POST` | `/api/rooms/:code`           | Join a room — `{ name }` → `{ state, playerId }`               |
| `POST` | `/api/rooms/:code/action`    | Every in-game action (below)                                   |
| `GET`  | `/api/health`                | Which store is active                                          |

### Actions

`POST /api/rooms/:code/action` with `{ type, playerId, ...args }`

| `type`     | args      | Who may call it                       |
| ---------- | --------- | ------------------------------------- |
| `start`    | —         | host                                  |
| `draw`     | —         | the player whose turn it is           |
| `buddy`    | `buddyId` | current player, after drawing a 5     |
| `use-card` | `cardId`  | the holder of that card 8             |
| `end-turn` | —         | the player whose turn it is           |
| `restart`  | —         | host                                  |
| `leave`    | —         | yourself                              |

Every permission check happens on the server: not your turn → `403`, not the host
→ `403`, room full / duplicate name / buddy not yet chosen → `400`, unknown room →
`404`. Error messages are written in Thai and are safe to show to players
verbatim.

---

## Project layout

```
src/
├── app/
│   ├── layout.tsx                fonts (IBM Plex Sans Thai + Mali), metadata, background
│   ├── globals.css               Tailwind 4 theme, keyframes, 3D-card utilities
│   ├── page.tsx                  home: create a room / join by code
│   ├── room/[code]/page.tsx      room page; resolves the invite origin from headers
│   └── api/
│       ├── health/route.ts       which store is active
│       └── rooms/
│           ├── route.ts          POST create room
│           └── [code]/
│               ├── route.ts      GET state (version cursor) / POST join
│               └── action/route.ts  every in-game action
├── components/
│   ├── playing-card.tsx          the 3D flipping card + the deck stack
│   ├── rules-sheet.tsx           bottom sheet with the full rules
│   ├── bell-mark.tsx             bell logo and whisker motif (hand-written SVG)
│   ├── ui.tsx                    Button / Card / Pill
│   └── room/
│       ├── room-client.tsx       picks the screen for the room status; turn alerts
│       ├── join-form.tsx         enter your name to join
│       ├── lobby-view.tsx        invite link, roster, start button
│       ├── game-view.tsx         the main play screen
│       ├── finished-view.tsx     round summary and restart
│       ├── player-strip.tsx      player rail; scrolls the active player into view
│       └── room-header.tsx       room code, connection dot, sound, rules
├── hooks/
│   ├── use-room.ts               polling with a version cursor, plus action dispatch
│   └── use-session.ts            reads localStorage via useSyncExternalStore
└── lib/
    ├── rules.ts                  all 13 card rules (single source of truth)
    ├── types.ts                  types shared between client and server
    ├── api.ts                    fetch wrappers
    ├── feedback.ts               Web Audio chimes + vibration
    ├── session.ts                localStorage as a subscribable external store
    └── server/
        ├── rooms.ts              orchestration (load → lock → mutate → save)
        ├── game.ts               all game rules, pure
        ├── store.ts              Redis / memory store and locking
        └── http.ts               error → response mapping
```

### Stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript** (strict)
- **Tailwind CSS 4** — the whole theme is declared in `@theme` inside
  `globals.css`; there is no config file
- **@upstash/redis** — a REST client, so it works in serverless without a TCP
  connection pool
- **Web Audio API** + `navigator.vibrate` — zero audio assets

---

## Troubleshooting

| Symptom                                       | Cause / fix                                                                                          |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Friends get "room not found" on Vercel        | Redis isn't attached. Check `/api/health`; if it says `"store":"memory"`, attach Upstash and redeploy |
| **Every** `/api/*` route returns 500          | Check `/api/health` first — it never fails. `initError` names the cause                               |
| `/api/health` shows `"store":"memory"` after attaching a database | A deployment keeps the environment it was created with — **redeploy** once after connecting it |
| `ignoredUrlVars` is not empty                 | A `*_REST_URL` variable holds a `rediss://` TCP string. Delete it; the app already falls back         |
| No alert sound                                | Browsers block audio until a user gesture — one tap anywhere unlocks it. Also check the 🔊 toggle     |
| iPhone doesn't vibrate                        | iOS doesn't support `navigator.vibrate` at all; the chime covers it. Android vibrates normally        |
| Asked for a name again after reopening        | `localStorage` was unwritable (Safari private mode), or the room expired                             |
| Red dot / "หลุดการเชื่อมต่อ"                  | Three polls failed in a row. It reconnects on its own, and refocusing the tab refreshes immediately   |
| "เข้าวง … ไม่ได้" with a retry button         | Polling gave up after ~25s. The message shown is the server's own; check the function logs for detail |
| A 500 from `/api/rooms/:code`                 | The response includes a `detail` field with the underlying error, and the server logs the room code   |
| Want to change a card rule                    | Edit [`src/lib/rules.ts`](src/lib/rules.ts) only; every screen follows it                            |

---

## A note on copyright

All artwork is original SVG drawn for this project (a bell and a whisker motif).
**No copyrighted characters or assets are used.** The name "เกมส์โดรามอน" is simply
what Thai drinking circles call this game.
