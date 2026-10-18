# RasaRisa v2

Makan enak, tanpa ribet. Web app untuk automatisasi pre-order FnB berbasis WhatsApp.

## Quick Start (Docker)

```bash
# 1. Copy env
cp .env.example .env
# Edit SESSION_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD

# 2. Build + run (app + Postgres in single container)
docker compose up -d --build

# 3. Open
open http://localhost:3000
```

## Dev Setup (local)

```bash
# 1. Install deps
npm install

# 2. Start Postgres (separate dev container)
docker compose -f docker-compose.dev.yml up -d

# 3. Run migrations + seed
npm run db:migrate
npm run db:seed

# 4. Start dev server
npm run dev
```

## Stack

- TypeScript, Next.js App Router, PostgreSQL, Prisma
- Tailwind CSS v4, Radix UI primitives
- Fraunces (serif) + Inter (sans), self-hosted via @fontsource
- Vitest for tests, Biome for lint
- Docker single-container deploy

## Features

**Buyer (no login):**
- Browse open pre-orders
- Add to cart (cookie-based)
- Checkout with name + WA + pickup/delivery
- Upload transfer receipt (JPG/PNG, max 5MB)
- Track order via unguessable link

**Admin (password auth + lockout):**
- Dashboard: stats, recent orders, auto-expire
- Orders: filter, verify payment, advance status (forward only)
- Products: add/edit/deactivate
- Pre-Order: create batches, close manually
- Reports: date range, revenue, top products, status breakdown

## Order Status State Machine

```
WAITING_PAYMENT -> PAYMENT_CONFIRMED -> PROCESSING -> READY_FOR_DELIVERY -> COMPLETED
WAITING_PAYMENT -> EXPIRED (auto, no receipt by deadline)
```

Forward only. Backward rejected. EXPIRED is terminal.

## Tests

```bash
npm test              # watch mode
npm run test:run      # CI mode
```

27 tests covering status machine + WA validation.

## Project Structure

See `ARCHITECTURE.md` for full structure, data flow, and decisions.

## Design Doc

`docs/superpowers/specs/2026-10-19-rasarisa-design.md`
