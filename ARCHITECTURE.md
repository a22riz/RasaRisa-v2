# ARCHITECTURE.md — RasaRisa v2 Code Structure

> Last updated: 19 Oct 2026
> Status: Pre-implementation (structure planned)

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
Files stored at `/app/uploads/` (Docker volume). Served via Next.js route with content-type validation.
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

## Data Flow

### Buyer checkout flow
```
Catalog (read open POs) → Add to cart (cookie) → Checkout (read cart cookie)
→ Submit form → Validate → Create Order + OrderItems (DB) → Clear cart cookie
→ Redirect to /order/[id] (confirmation)
→ Upload receipt (file → /app/uploads, path saved to Order)
→ Buyer gets tracking link
```

### Admin verify flow
```
Admin login → Dashboard (see "Perlu verifikasi" count) → Orders list (filter)
→ Order detail → View receipt image → Click "Konfirmasi Pembayaran"
→ Status: WAITING_PAYMENT → PAYMENT_CONFIRMED (validated forward-only)
→ Buyer tracking page updates on next refresh
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
