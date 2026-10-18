# PROGRESS.md — RasaRisa v2 Development

> Last updated: 19 Oct 2026
> Status: Core implementation complete, ready for Docker deploy + manual testing

## Phase 0: Planning ✅ DONE

- [x] Brainstorming (brainstorming skill) — model bisnis, stack, design direction
- [x] Mockup approval (visual companion) — katalog, checkout, konfirmasi, tracking, admin dashboard
- [x] Design doc written — `docs/superpowers/specs/2026-10-19-rasarisa-design.md`
- [x] AGENTS.md written — rules + conventions + constraints
- [x] Stack locked: TypeScript, Next.js App Router, Postgres, Prisma, Tailwind, shadcn/ui, Docker

## Phase 1: Project Setup ✅ DONE

- [x] Initialize Next.js project (TypeScript, App Router, Tailwind v4)
- [x] Install + configure Prisma + PostgreSQL
- [x] Setup Radix UI primitives (dialog, select, label, toast, dropdown, slot)
- [x] Self-host fonts (Fraunces + Inter via @fontsource, no Google Fonts CDN)
- [x] Copy logo SVG assets to `public/`
- [x] Setup design tokens (Tailwind v4 @theme in globals.css)
- [x] Configure biome (lint)
- [x] Configure vitest
- [x] Dockerfile multi-stage + docker-compose.yml (app + postgres single container)
- [x] .env.example (DATABASE_URL, SESSION_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD)
- [x] docker-entrypoint.sh (init postgres + migrate + seed + start next.js)
- [x] Initial git commit + push to GitHub

## Phase 2: Data Layer ✅ DONE

- [x] Prisma schema (Product, PoBatch, PoItem, Order, OrderItem, StatusHistory, Admin, Setting)
- [x] Migrations (20261019000000_init)
- [x] Seed script (admin account + sample products + sample PO)
- [x] Unit tests: status state machine (13 tests), WA validation (14 tests)

## Phase 3: Admin Auth ✅ DONE

- [x] Login page (`/admin/login`)
- [x] Session management (cookie-based, iron-session)
- [x] Brute-force lockout (5 attempts, 15min lock)
- [x] Route group `(protected)` layout — auth guard for all admin pages except login
- [x] Login + logout server actions

## Phase 4: Admin — Product Catalog ✅ DONE

- [x] Product list (`/admin/products`)
- [x] Add/Edit product form (name*, desc, price*, isActive)
- [x] Deactivate (soft delete via isActive flag)
- [ ] Image upload (ponytail: product images deferred, text-only for now)
- [x] Product validation (Zod schema)

## Phase 5: Admin — PO Management ✅ DONE

- [x] PO list (`/admin/po`) — all batches sorted by readyDate desc
- [x] Create PO: tanggal ready, deadline tutup, pilih menu dari katalog
- [x] Close PO manual
- [x] Auto-close by deadline (lazy check on read: catalog filters closeDate > now)

## Phase 6: Buyer — Catalog ✅ DONE

- [x] Home page (`/`) — hero text, PO sections with product grid
- [x] Show only POs that are OPEN + closeDate > now
- [x] Cart cookie (add/remove/qty), server-side read
- [x] Cart badge in topbar
- [x] Empty state (no open POs)
- [x] Responsive (mobile-first, grid responsive)

## Phase 7: Buyer — Checkout ✅ DONE

- [x] Checkout page (`/checkout`)
- [x] Cart items with product details + prices
- [x] Fulfillment toggle (delivery/pickup)
- [x] Buyer data form (name*, WA*)
- [x] Cart persist via cookie
- [x] Validation: name, WA format, PO window still open
- [x] Create order → redirect to confirmation
- [x] Unit tests: WA validation (14 tests)

## Phase 8: Buyer — Order Confirmation + Receipt Upload ✅ DONE

- [x] Confirmation page (`/order/[id]`)
- [x] Bank details from Settings
- [x] Receipt upload (JPG/PNG ≤5MB, server-side validate)
- [x] Tracking link display
- [x] Order summary
- [x] Upload success/error states

## Phase 9: Buyer — Tracking Page ✅ DONE

- [x] Tracking page (`/track/[trackingId]`)
- [x] Timeline (5 steps + expired state)
- [x] No personal data exposed
- [x] Upload prompt when status = WAITING_PAYMENT (via order confirmation page)
- [x] Invalid/expired link state
- [x] Lazy auto-expire on tracking page read

## Phase 10: Admin — Order Management ✅ DONE

- [x] Orders list (`/admin/orders`) with filters (all, need verification, active)
- [x] Order detail (`/admin/orders/[id]`)
- [x] Receipt preview (image served via API route)
- [x] Confirm payment → PAYMENT_CONFIRMED (disabled if no receipt)
- [x] Request re-upload → stay WAITING_PAYMENT, clear receipt
- [x] Status advance button (forward only)
- [x] Backward rejected: "Status mundur tidak diizinkan"
- [x] Unit tests: status transitions (13 tests)

## Phase 11: Admin — Dashboard ✅ DONE

- [x] Dashboard (`/admin`) — stat cards (need verification, today orders, revenue, active POs)
- [x] Recent orders list
- [x] Auto-expire orders (lazy check on admin access)

## Phase 12: Admin — Reports ✅ DONE

- [x] Financial report (`/admin/reports`) — date range filter, totals, order count
- [x] Top products breakdown
- [x] Status breakdown
- [x] Empty state: "Tidak ada data untuk periode ini"

## Phase 13: Admin — Settings

- [ ] Settings page (`/admin/settings`)
- [ ] Bank details (managed via seed/DB for now)
- [ ] Receipt deadline (configurable via constants.ts)
- [ ] Tracking expiry (configurable via constants.ts)
- [ ] Change admin password
- ponytail: Settings page deferred — bank details seeded, config in constants.ts

## Phase 14: Polish + Docker ✅ MOSTLY DONE

- [x] Empty states for all data views
- [x] Accessibility: focus-visible outline, keyboard nav, semantic HTML
- [x] Responsive (mobile-first, grid responsive)
- [x] Type check pass (tsc --noEmit clean)
- [x] Test suite pass (27/27 tests)
- [x] Build compiles successfully
- [x] Dockerfile multi-stage build
- [x] docker-compose.yml (single service: app+postgres)
- [x] docker-entrypoint.sh (init db + migrate + seed + start)
- [x] Volume: DB data + uploads
- [ ] `docker-compose up` tested from clean state
- [ ] Lint pass (biome)

## Phase 15: Verification

- [x] Test suite: 27/27 pass (status machine + WA validation)
- [x] Type check: clean
- [x] Build: compiles successfully
- [ ] Manual click-through every screen (needs running DB)
- [x] Error messages match AGENTS.md spec (in constants.ts)
- [x] No external runtime calls (self-hosted fonts, local uploads, no API integrations)
- [ ] Docker deploy test

## Blocked

- Docker Desktop not running locally (can't test `docker-compose up`)
- No running Postgres for manual testing

## Notes

- Logo assets: `public/` (RasaRisa_Navbar.svg, RasaRisa_Logo_Monochrome.svg, RasaRisa_Favicon.svg)
- Design doc: `docs/superpowers/specs/2026-10-19-rasarisa-design.md`
- Architecture: `ARCHITECTURE.md`
- GitHub: https://github.com/a22riz/RasaRisa-v2
