# PROGRESS.md — RasaRisa v2 Development

> Last updated: 20 Oct 2026
> Status: Phase 13 (Settings) done. COD delivery option added. Core complete, ready for Docker deploy + manual testing

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

- [x] Prisma schema (Product, PoBatch, PoItem, Order, OrderItem, StatusHistory, Admin, Setting, FulfillmentGroup)
- [x] Migrations (20261019000000_init, 20261019151201_add_fulfillment_groups)
- [x] Seed script (admin account + sample products + 2 sample PO batches: Saturday + Sunday)
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
- [x] Timeline (5 steps + expired state) — overall order progress
- [x] Per-batch mini-timelines (Diproses → Siap → Selesai) once payment confirmed
- [x] No personal data exposed
- [x] Upload prompt when status = WAITING_PAYMENT (via order confirmation page)
- [x] Re-upload warning banner when admin requested re-upload
- [x] Invalid/expired link state
- [x] Lazy auto-expire on tracking page read

## Phase 10: Admin — Order Management ✅ DONE

- [x] Orders list (`/admin/orders`) with filters (all, need verification, active)
- [x] Order detail (`/admin/orders/[id]`)
- [x] Receipt preview (image served via API route)
- [x] Confirm payment → PAYMENT_CONFIRMED + create FulfillmentGroups (one per PoBatch) (disabled if no receipt)
- [x] Request re-upload → stay WAITING_PAYMENT, clear receipt
- [x] Per-batch status advance (forward only) via advanceFulfillmentGroup
- [x] Inline per-batch status pill on ready-group headers
- [x] Backward rejected: "Status mundur tidak diizinkan"
- [x] Unit tests: status transitions (13 tests) + group machine (13 tests)

## Phase 11: Admin — Dashboard ✅ DONE

- [x] Dashboard (`/admin`) — stat cards (need verification, today orders, revenue, active POs)
- [x] Recent orders list
- [x] Auto-expire orders (lazy check on admin access)

## Phase 12: Admin — Reports ✅ DONE

- [x] Financial report (`/admin/reports`) — date range filter, totals, order count
- [x] Top products breakdown
- [x] Status breakdown
- [x] Empty state: "Tidak ada data untuk periode ini"

## Phase 13: Admin — Settings ✅ DONE

- [x] Settings page (`/admin/settings`)
- [x] Bank details (editable, stored in Setting table)
- [x] Admin WhatsApp number (editable, stored in Setting table, used for COD delivery WA button)
- [x] Delivery note (editable)
- [x] Change admin password (verify current password, set new hash)
- [x] Admin nav: Pengaturan section with settings link
- ponytail: Receipt deadline + tracking expiry still in constants.ts (not user-editable)

## Phase 14: Polish + Docker ✅ MOSTLY DONE

- [x] Empty states for all data views
- [x] Accessibility: focus-visible outline, keyboard nav, semantic HTML
- [x] Responsive (mobile-first, grid responsive)
- [x] Type check pass (tsc --noEmit clean)
- [x] Test suite pass (40 unit + 5 DB integration)
- [x] Build compiles successfully (production build verified)
- [x] Dockerfile multi-stage build
- [x] docker-compose.yml (single service: app+postgres)
- [x] docker-entrypoint.sh (init db + migrate + seed + start)
- [x] Volume: DB data + uploads
- [ ] `docker-compose up` tested from clean state (blocked: Docker Desktop not running)
- [x] Lint pass (biome, 0 errors)

## Phase 15: Verification

- [x] Test suite: 45 tests (40 unit/always-run + 5 DB integration, skipped unless RUN_DB_TESTS=1)
- [x] Integration tests verify multi-PO flow end-to-end (createOrder → confirmPayment → advanceGroup × n → COMPLETED)
- [x] Type check: clean
- [x] Dev server compiles all routes (home, tracking, admin login) without errors
- [x] Build: production build passes (all 17 routes compiled)
- [ ] Manual click-through every screen (needs running DB)
- [x] Error messages match AGENTS.md spec (in constants.ts)
- [x] No external runtime calls (self-hosted fonts, local uploads, no API integrations)
- [ ] Docker deploy test (blocked: Docker Desktop not running)

## Phase 16: Multi-PO Fulfillment per Batch ✅ DONE

One order can mix items from different PO batches (different ready dates). Each
batch tracks its own fulfillment progress independently. Payment stays shared
(one receipt, one verify).

- [x] `FulfillmentGroup` model (`orderId`, `poBatchId`, `status` PROCESSING/READY_FOR_DELIVERY/COMPLETED)
- [x] Migration `20261019151201_add_fulfillment_groups`
- [x] Group state machine: `nextGroupStatus`, `validateGroupTransition`, `deriveOrderStatusFromGroups` (least-advanced wins)
- [x] `confirmPayment` server function: WAITING_PAYMENT → PAYMENT_CONFIRMED + create one group per PoBatch (all PROCESSING)
- [x] `advanceGroup` server function: advance one group, re-derive order status, log history
- [x] Order status = least-advanced group (COMPLETED only when ALL groups COMPLETED)
- [x] Admin order detail: per-batch advance buttons + inline per-batch status pill
- [x] Tracking page: per-batch mini-timelines (Diproses → Siap → Selesai) below global timeline
- [x] Payment shared: 1 receipt, 1 verify (does NOT split per group)
- [x] Unit tests: group machine (13 tests)
- [x] Integration tests: 5 tests vs live DB (multi-PO derivation, single-PO, terminal reject, no-receipt reject)

## Blocked

- Docker Desktop not running locally (can't test `docker-compose up`)

## Notes

- Logo assets: `public/` (RasaRisa_Navbar.svg, RasaRisa_Logo_Monochrome.svg, RasaRisa_Favicon.svg)
- Design doc: `docs/superpowers/specs/2026-10-19-rasarisa-design.md`
- Architecture: `ARCHITECTURE.md`
- GitHub: https://github.com/a22riz/RasaRisa-v2
- DB integration tests: `RUN_DB_TESTS=1 npx vitest run src/server/orders.test.ts` (need dev DB up)
