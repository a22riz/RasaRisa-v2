# ARCHITECTURE.md — RasaRisa v2 Code Structure

> Last updated: 21 Oct 2026
> Status: Core complete + UX polish (checkout flow, tracking hero, receipt serving)

## Overview

RasaRisa v2 is a Next.js App Router monolith. Single deployable unit: app server + PostgreSQL in one Docker container. Buyer-facing pages (no login) + admin dashboard (password auth). Offline payments: manual bank transfer + receipt upload verification.

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Language | TypeScript | Type safety for complex data model (multi-batch orders, state machine) |
| Framework | Next.js App Router | Monolith, one deploy, TS end-to-end, mainstream |
| DB | PostgreSQL | Relational + transactions, single container via Docker |
| ORM | Prisma | Typed client, schema-first, managed migrations |
| Styling | Tailwind CSS + shadcn/ui | Utility-first + accessible Radix components |
| Fonts | Fraunces (serif) + Inter (sans) | Homemade character, self-hosted |
| Deploy | Docker (single container) | `docker-compose up` starts app + DB |
| Test | Vitest | Fast, native TS, zero-config |
| Lint | Biome | Fast, single tool for lint+format |
| Node | 22 LTS | Long-term support |

## Directory Structure (planned)

```
RasaRisa/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (buyer)/            # Buyer route group (no auth)
│   │   │   ├── page.tsx        # Home / catalog
│   │   │   ├── checkout/
│   │   │   │   └── page.tsx
│   │   │   ├── order/
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx  # Order confirmation
│   │   │   └── track/
│   │   │       └── [trackingId]/
│   │   │           └── page.tsx  # Tracking page
│   │   ├── admin/              # Admin route group (auth required)
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── layout.tsx      # Auth guard + sidebar
│   │   │   ├── page.tsx        # Dashboard
│   │   │   ├── orders/
│   │   │   │   ├── page.tsx    # Orders list
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx  # Order detail
│   │   │   ├── products/
│   │   │   │   ├── page.tsx    # Product list
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx  # Product form (add/edit)
│   │   │   ├── po/
│   │   │   │   └── page.tsx    # PO management
│   │   │   ├── reports/
│   │   │   │   └── page.tsx
│   │   │   ├── analytics/
│   │   │   │   └── page.tsx
│   │   │   └── settings/
│   │   │       └── page.tsx
│   │   ├── api/                # API routes
│   │   │   ├── cart/           # Cart cookie CRUD
│   │   │   ├── orders/         # Order creation, receipt upload
│   │   │   ├── track/          # Public tracking lookup
│   │   │   └── admin/          # Admin-only API
│   │   │       ├── auth/       # Login, logout, session
│   │   │       ├── products/
│   │   │       ├── po/
│   │   │       ├── orders/
│   │   │       └── settings/
│   │   ├── layout.tsx          # Root layout, fonts, metadata
│   │   └── globals.css         # Tailwind + design tokens
│   ├── components/
│   │   ├── ui/                 # shadcn/ui base components
│   │   ├── buyer/              # Buyer-facing components
│   │   │   ├── menu-card.tsx
│   │   │   ├── po-chips.tsx
│   │   │   ├── cart-item.tsx
│   │   │   ├── fulfillment-toggle.tsx
│   │   │   ├── receipt-upload.tsx
│   │   │   └── tracking-timeline.tsx
│   │   └── admin/              # Admin components
│   │       ├── sidebar.tsx
│   │       ├── stat-card.tsx
│   │       ├── po-row.tsx
│   │       ├── order-table.tsx
│   │       └── status-badge.tsx
│   ├── lib/
│   │   ├── prisma.ts           # Prisma client singleton
│   │   ├── auth.ts             # Admin session (iron-session)
│   │   ├── cart.ts             # Cart cookie read/write
│   │   ├── validation.ts       # Zod schemas
│   │   ├── uploads.ts          # File upload handler
│   │   ├── format.ts           # Currency, date formatting
│   │   └── constants.ts       # Status enums, error messages
│   ├── server/                 # Server-only utilities
│   │   ├── orders.ts           # Order business logic
│   │   ├── products.ts         # Product CRUD logic
│   │   ├── po.ts               # PO management logic
│   │   ├── reports.ts          # Report calculations
│   │   └── auth-server.ts      # Password hash, lockout
│   └── middleware.ts           # Route protection
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── public/
│   ├── logo-navbar.svg         # From asset_logo/
│   ├── logo-monochrome.svg
│   └── favicon.svg
├── tests/                      # Or colocated *.test.ts
├── docker-compose.yml
├── Dockerfile
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── biome.json
├── vitest.config.ts
└── .env.example
```

## Key Design Decisions

### 1. Cart in cookie, not DB
Cart is transient. Stored in signed HTTP-only cookie. No cart table in DB. Cleared on order creation. Max age 7 days.
Reason: no customer accounts, no login. Cookie is simplest persistence that survives refresh.

### 2. Order status as state machine (forward only)
Status enum: WAITING_PAYMENT → PAYMENT_CONFIRMED → PROCESSING → READY_FOR_DELIVERY → COMPLETED. Plus terminal EXPIRED.
Transitions validated server-side. Backward rejected with exact error message.
StatusHistory table records every transition with timestamp + note.

### 3. PO auto-close via lazy check (no cron)
PO has `closeDate`. On every read (catalog, checkout), check `now > closeDate` → treat as CLOSED.
No background job, no cron, no scheduler. Simplest approach for single-container request-response app.
ponytail: if volume grows, add cron job or DB scheduled trigger. Ceiling: thousands of POs.

### 4. Receipt + product images in local volume
Files stored at `/app/uploads/` (Docker volume). Served via Next.js API route
`/api/uploads/[filename]` with admin-only auth (getSession check). Content-type
from file extension. Path traversal protected via `path.basename`.
No S3, no CDN, no external storage. Server-side MIME + size validation on upload.

### 5. Tracking link: unguessable token, no personal data
`trackingId` = cuid/uuid. Tracking page shows status + timeline + items only. No name, WA, address.
Expiry: configurable (default 90 days). Expired → "Link tidak valid atau sudah kedaluwarsa."

### 6. Admin auth: iron-session + lockout
Password-based. iron-session for cookie-based session. Bcrypt hash. Lockout after 5 failed attempts (15 min lock).
No JWT, no OAuth, no 2FA. Simplest secure approach.

### 7. Self-hosted fonts (no Google Fonts CDN)
Fraunces + Inter font files in `public/fonts/`. `@font-face` in globals.css. No `<link>` to Google Fonts.
Reason: zero external runtime calls constraint.

### 8. Checkout 2-step flow (Opsi Pengiriman → Checkout)
Checkout page is split into two visually separated cards on one page:
- **Step 1 (Opsi Pengiriman)**: fulfillment toggle (Antar ke Rumah / Ambil Sendiri).
  For delivery: buyer fills name + WA + address, then clicks "Hubungi Admin via WA"
  which opens WhatsApp with a pre-filled message containing buyer info, address,
  cart items, and total. Admin checks delivery area + cost. Buyer then proceeds to step 2.
- **Step 2 (Checkout)**: for delivery, a checkbox "sudah konfirmasi ongkir dengan admin"
  enables the submit button. For pickup, buyer fills name + WA, then submits.
COD_DELIVERY enum kept in schema/validation for existing orders, removed from checkout UI.

Reason: delivery cost depends on distance, which admin must check manually. Having
buyer contact admin before placing order avoids post-order delivery disputes.

### 9. Multi-PO fulfillment per batch (FulfillmentGroup)
One order can mix items from several PO batches (different ready dates). After
payment is confirmed, one `FulfillmentGroup` is created per distinct PoBatch in
the order. Each group advances independently: PROCESSING → READY_FOR_DELIVERY →
COMPLETED. The order status is derived as the LEAST-advanced group status, so
the order only reaches READY when every batch is ready, and COMPLETED only when
all batches are done. Payment stays shared (one receipt, one verify).

Reason: a multi-batch order's batches finish on different days. A single
order-level status cannot represent "batch A ready, batch B still cooking".
Per-group status + derived order status gives an accurate overall picture plus
per-batch detail on the tracking page.

Admin advances per group (not per order). Order-level transitions are limited to
payment confirmation (creates groups) and auto-expire. `confirmPayment` and
`advanceGroup` live in `src/server/orders.ts` as pure functions (no auth/revalidate);
the server actions in `src/app/actions/admin/order.ts` are thin wrappers
(requireAdmin + revalidate). This keeps the logic unit/integration-testable.
ponytail: if batches ever need independent payment too, split payment per group.
Ceiling: business model change (today all batches share one transfer).

## Data Flow

### Buyer checkout flow
```
Catalog (read open POs) → Add to cart (cookie) → Checkout page
→ Step 1: Opsi Pengiriman (fulfillment toggle)
  → Delivery: fill name + WA + address → Hubungi Admin via WA (auto-filled msg with cart items + total)
  → Pickup: proceed to step 2
→ Step 2: Checkout (data pemesan + place order)
  → Delivery: checkbox "sudah konfirmasi ongkir" → place order
  → Pickup: fill name + WA → place order
→ Validate → Create Order + OrderItems (DB) → Clear cart cookie
→ Redirect to /order/[id] (confirmation)
→ Upload receipt (file → /app/uploads, path saved to Order)
→ Buyer gets tracking link (with copy button)
```

### Admin verify flow
```
Admin login → Dashboard (see "Perlu verifikasi" count) → Orders list (filter)
→ Order detail → View receipt image (served via /api/uploads/[filename], admin-only)
→ Click "Konfirmasi Pembayaran"
→ Status: WAITING_PAYMENT → PAYMENT_CONFIRMED + create FulfillmentGroup
  per PoBatch (all PROCESSING)
→ Admin advances each batch independently: PROCESSING → READY → COMPLETED
→ Order status auto-derives as least-advanced group (COMPLETED when all done)
→ Buyer tracking page updates on next refresh (status hero + per-batch mini-timelines)
```

### Order auto-expire
```
On any order read (tracking page, admin): if status=WAITING_PAYMENT
  AND now > expiresAt AND no receipt → set EXPIRED
```
Lazy check, no cron. (ponytail: add cron if scale demands)

## Testing Strategy

- **Unit tests** (Vitest): status transitions, WA validation, deadline logic, report calc, PO window, file validation, lockout
- **Integration**: API route tests (create order, upload receipt, confirm payment)
- **Manual**: click-through every screen per acceptance scenarios

Colocated tests: `Component.tsx` → `Component.test.ts`. Logic tests in `src/lib/*.test.ts`.

## Security

- Input validation: Zod at every API boundary
- SQL injection: Prisma parameterized (no raw queries)
- XSS: React auto-escape + CSP header
- CSRF: Next.js same-site cookies + built-in
- File upload: server-side MIME check + size limit + filename sanitize
- Admin auth: bcrypt + lockout + session cookie (httpOnly, secure, sameSite)
- Tracking: unguessable token, no personal data exposed
- Env secrets: DATABASE_URL, SESSION_SECRET in .env (never committed)

## Build + Deploy

```
Dockerfile (multi-stage):
  1. deps: install node_modules
  2. builder: prisma generate + next build
  3. runner: minimal image + built assets + postgres

docker-compose.yml:
  services:
    app:
      build: .
      ports: 3000:3000
      volumes:
        - ./data:/var/lib/postgresql/data  # DB persist
        - ./uploads:/app/uploads            # files persist
      env_file: .env
```

Single container runs both Next.js + Postgres via supervisor or entrypoint script.
ponytail: if scale demands, split to 2 containers (app + db). Ceiling: high traffic.
