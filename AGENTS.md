# AGENTS.md — Building "RasaRisa v2"

You are implementing RasaRisa v2. Read these files IN THIS ORDER before writing any code:

1. `docs/superpowers/specs/2026-10-19-rasarisa-design.md` — full design doc (intent, goals, constraints, data model, screens)
2. `PROGRESS.md` — what's done, in-progress, blocked, next (update as you go)
3. `ARCHITECTURE.md` — code structure, key files, decisions (update as you go)

## Tech Stack (locked)

- **Language**: TypeScript
- **Framework**: Next.js App Router (monolith)
- **DB**: PostgreSQL (single Docker container)
- **ORM**: Prisma (schema-first, typed client)
- **Styling**: Tailwind CSS + shadcn/ui (Radix-based, accessible)
- **Font**: Fraunces (serif, headings) + Inter (sans, body), self-hosted
- **Deploy**: Docker single container (`docker-compose up`)
- **Node**: 22 LTS

## Commands

```bash
npm run dev          # dev server
npm run build        # production build
npm run start        # production server
npm run lint         # biome lint
npm run typecheck    # tsc --noEmit
npm test             # vitest
npm run test:run     # vitest run (CI)
npm run db:migrate   # prisma migrate deploy
npm run db:push      # prisma db push (dev)
npm run db:seed      # prisma db seed
npm run db:studio     # prisma studio
```

## Code Conventions

- Functional components with hooks (no class components)
- Named exports preferred; default export only for page components (Next.js requirement)
- Colocate tests next to source: `Button.tsx` → `Button.test.ts`
- File naming: `kebab-case.ts` for utilities, `PascalCase.tsx` for components
- API routes: App Router `route.ts` convention
- Prisma: single schema, migrations committed
- Error messages: match exact Indonesian strings from design doc
- No `any` type without explicit reason (use `unknown` + narrow)
- No commented-out code, no debug logs, no dead code

## Design Rules (from antislop)

- **Palette**: Tomato Red #E63946, Turmeric Orange #F4A261, Warm Cream #FFF3E0, Card White #FFFFFF, Ink Dark #1D1D1D, Ink Muted #555555, Soft Grey #E8E2D5, Leaf Green #388E3C, Danger Red #D32F2F
- **Fonts**: Fraunces (serif, headings — homemade character), Inter (sans, body — readability). Self-hosted, no Google Fonts CDN
- **Voice**: friendly home cook, warm, neighborly. Indonesian default. Pair negative news with next step.
- **No em dash** (—) in UI text. Use comma, period, colon, parentheses.
- **Every technique needs a purpose** (gradients, shadows, animations — write reason in comment)
- **Every interactive element must work** or be removed
- **Every data UI needs**: empty, loading, error states
- **Contrast**: 4.5:1 minimum (InkMuted must be #555555 or darker on cream)
- **Keyboard navigable**: Tab/Shift+Tab, Enter/Space activate, Esc closes modals
- **Focus visible**: 2-3px outline, never `outline:none` without replacement
- **Icons**: relevant to content, no generic AI sparkle/star/lightning. No emoji as functional icons (emoji OK as decorative food placeholder).
- **Mobile-first**: 320px–1440px, no horizontal scroll, 44px tap targets

## Product Constraints (hard limits)

- Single Docker container (app + Postgres), `docker-compose up` starts everything
- Zero runtime calls to external APIs (payment, kurir, SMS, OAuth, analytics, CDN, image hosting)
- Offline payments only: manual bank transfer + receipt upload → admin verifies
- No customer accounts (buyer gak login, data per-order + cookie cart)
- No WebSocket/SSE/long polling — strictly request-response
- No AI/ML
- No paid/proprietary dependencies
- DB on Docker volume (survive restarts)
- Buyer personal data stored on same server, no external storage

## Order Status State Machine

```
WAITING_PAYMENT → PAYMENT_CONFIRMED → PROCESSING → READY_FOR_DELIVERY → COMPLETED
WAITING_PAYMENT → EXPIRED (auto, no receipt by deadline)
```

- Forward only. Backward → "Status mundur tidak diizinkan"
- Confirm Payment disabled if no receipt → "Menunggu bukti transfer dari pembeli"
- Request Re-upload → stay WAITING_PAYMENT, buyer sees prompt on tracking page
- EXPIRED is terminal

## Exact Error Messages (must match verbatim)

- "Nama item dan harga wajib diisi" (product: missing name/price)
- "Tambahkan minimal satu tanggal pengambilan/pengiriman" (PO: no fulfillment date)
- "Nama pelanggan dan nomor WA wajib diisi" (checkout: missing name/WA)
- "Nomor WA tidak valid" (checkout: invalid WA format)
- "Pre-order sudah ditutup" (order after PO window closed)
- "Format file harus JPG atau PNG, maksimal 5MB" (upload: wrong format/size)
- "Bukti transfer berhasil diunggah" (upload success)
- "Menunggu bukti transfer dari pembeli" (admin: no receipt yet)
- "Status mundur tidak diizinkan" (status: backward attempt)
- "Link tidak valid atau sudah kedaluwarsa" (tracking: invalid/expired)
- "Tidak ada data untuk periode ini" (report: no data)

## Working Practices

- Test-first for non-trivial logic (status transitions, payment flow, date validation, report calc, deadline)
- Smallest vertical slice that delivers value. Build one slice, verify, move on.
- No speculative abstractions, no config for values that never change, no scaffolding "for later"
- Fewest files, shortest working diff. Deletion over addition.
- Mark deliberate simplifications with `ponytail:` comment naming ceiling + upgrade path
- Never simplify away: input validation, error handling, security, accessibility
- Update PROGRESS.md + ARCHITECTURE.md as you implement

## Review Gate (before declaring done)

1. Run Definition of Done checklist (see design doc)
2. Re-read acceptance scenarios, verify each manually
3. Self-review diff: anything added that design doc doesn't ask for? Remove or justify.
