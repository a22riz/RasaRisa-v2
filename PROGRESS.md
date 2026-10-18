# PROGRESS.md — RasaRisa v2 Development

> Last updated: 19 Oct 2026
> Status: Planning complete, starting implementation

## Phase 0: Planning ✅ DONE

- [x] Brainstorming (brainstorming skill) — model bisnis, stack, design direction
- [x] Mockup approval (visual companion) — katalog, checkout, konfirmasi, tracking, admin dashboard
- [x] Design doc written — `docs/superpowers/specs/2026-10-19-rasarisa-design.md`
- [x] AGENTS.md written — rules + conventions + constraints
- [x] Stack locked: TypeScript, Next.js App Router, Postgres, Prisma, Tailwind, shadcn/ui, Docker

## Phase 1: Project Setup ⏳ IN PROGRESS

- [ ] Initialize Next.js project (TypeScript, App Router, Tailwind)
- [ ] Install + configure Prisma + PostgreSQL
- [ ] Setup shadcn/ui + Radix
- [ ] Self-host fonts (Fraunces + Inter, no Google Fonts CDN)
- [ ] Copy logo SVG assets to `public/`
- [ ] Setup design tokens (Tailwind config + CSS variables)
- [ ] Configure biome (lint)
- [ ] Configure vitest
- [ ] Dockerfile + docker-compose.yml (app + postgres single container)
- [ ] .env.example (DATABASE_URL, SESSION_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD)
- [ ] Initial git commit

## Phase 2: Data Layer

- [ ] Prisma schema (Product, PoBatch, PoItem, Order, OrderItem, StatusHistory, Admin, Setting)
- [ ] Migrations
- [ ] Seed script (admin account + sample products + sample PO)
- [ ] Unit tests: status state machine, deadline logic

## Phase 3: Admin Auth

- [ ] Login page (`/admin/login`)
- [ ] Session management (cookie-based, iron-session)
- [ ] Brute-force lockout (5 attempts, 15min lock)
- [ ] Middleware: protect `/admin/*` routes
- [ ] Unit tests: lockout logic, password hash

## Phase 4: Admin — Product Catalog

- [ ] Product list (`/admin/products`)
- [ ] Add/Edit product form (name*, desc, price*, image, isActive)
- [ ] Deactivate (soft delete)
- [ ] Image upload (server-side validate, store local volume)
- [ ] Unit tests: product validation

## Phase 5: Admin — PO Management

- [ ] PO list (`/admin/po`) — past + active + scheduled
- [ ] Create PO: tanggal ready, deadline tutup, pilih menu dari katalog
- [ ] Edit PO (deadline, add/remove menu)
- [ ] Close PO manual + auto-close by deadline (lazy check on read)
- [ ] Unit tests: PO window validation, auto-close logic

## Phase 6: Buyer — Catalog

- [ ] Home page (`/`) — hero, PO pill, PO chips, menu grid
- [ ] Show only POs that are OPEN
- [ ] Cart cookie (add/remove/qty), server-side read
- [ ] Cart badge in topbar
- [ ] Empty state, loading state, error state
- [ ] Responsive (320px–1440px)

## Phase 7: Buyer — Checkout

- [ ] Checkout page (`/checkout`)
- [ ] Cart items grouped per tanggal ready
- [ ] Fulfillment toggle (delivery/pickup)
- [ ] Buyer data form (name*, WA*)
- [ ] Cart persist via cookie
- [ ] Validation: name, WA format, PO window still open
- [ ] Create order → redirect to confirmation
- [ ] Unit tests: WA validation, order creation, multi-batch

## Phase 8: Buyer — Order Confirmation + Receipt Upload

- [ ] Confirmation page (`/order/[id]`)
- [ ] Bank details from Settings
- [ ] Receipt upload (JPG/PNG ≤5MB, server-side validate)
- [ ] Tracking link display
- [ ] Order summary
- [ ] Unit tests: file validation, upload flow

## Phase 9: Buyer — Tracking Page

- [ ] Tracking page (`/track/[trackingId]`)
- [ ] Timeline (6 steps, done/current/upcoming)
- [ ] No personal data exposed
- [ ] Upload CTA when status = WAITING_PAYMENT
- [ ] Invalid/expired link state
- [ ] Unit tests: tracking lookup, expiry check

## Phase 10: Admin — Order Management

- [ ] Orders list (`/admin/orders`) with filters
- [ ] Order detail (`/admin/orders/[id]`)
- [ ] Receipt preview
- [ ] Confirm payment → PAYMENT_CONFIRMED
- [ ] Request re-upload → stay WAITING_PAYMENT
- [ ] Status advance dropdown (forward only)
- [ ] Backward rejected: "Status mundur tidak diizinkan"
- [ ] Unit tests: status transitions, payment confirmation

## Phase 11: Admin — Dashboard

- [ ] Dashboard (`/admin`) — stats cards, PO running, orders table
- [ ] Auto-expire orders (lazy check: if past deadline + no receipt → EXPIRED)
- [ ] Unit tests: expiry logic

## Phase 12: Admin — Reports + Analytics

- [ ] Financial report (`/admin/reports`) — date range, totals, order list
- [ ] Analytics (`/admin/analytics`) — top-3 items, avg order value
- [ ] Empty state: "Tidak ada data untuk periode ini"
- [ ] Unit tests: report calc, analytics calc

## Phase 13: Admin — Settings

- [ ] Settings page (`/admin/settings`)
- [ ] Bank details (name, account number, holder)
- [ ] Receipt deadline (hours)
- [ ] Tracking expiry (days)
- [ ] Change admin password
- [ ] Unit tests: settings update

## Phase 14: Polish + Docker

- [ ] All empty/loading/error states per screen
- [ ] Accessibility pass (keyboard nav, focus, contrast, ARIA)
- [ ] Responsive test (320, 375, 768, 1024, 1440)
- [ ] Lint pass (biome, no warnings)
- [ ] Type check pass (tsc --noEmit)
- [ ] Dockerfile multi-stage build
- [ ] docker-compose.yml (single service: app+postgres)
- [ ] `docker-compose up` works from clean state
- [ ] Volume: DB data + uploads

## Phase 15: Verification

- [ ] Run full test suite
- [ ] Manual click-through every screen
- [ ] Verify exact error messages match
- [ ] Verify no external runtime calls
- [ ] Verify JS bundle <500KB
- [ ] Verification-before-completion skill checklist
- [ ] Update PROGRESS.md + ARCHITECTURE.md final

## Blocked

(none currently)

## Notes

- Mockups approved at: `C:\Users\Ariz\AppData\Local\Temp\opencode\rasarisa-mockups\.superpowers\brainstorm\1812-1792342385\content\` (throwaway, reference only)
- Logo assets: `asset_logo/` (RasaRisa_Navbar.svg, RasaRisa_Logo_Monochrome.svg, RasaRisa_Favicon.svg)
- Design doc: `docs/superpowers/specs/2026-10-19-rasarisa-design.md`
