# RasaRisa v2 — Design Document

> Status: Draft untuk review
> Tanggal: 19 Okt 2026
> Author: Ariz (business owner) + AI pair

## Intent — Why

RasaRisa adalah bisnis FnB ready-to-eat dengan sistem pre-order (PO). Saat ini seluruh proses jalan manual lewat WhatsApp: owner broadcast "PO open", customer chat pilih item + jadwal, transfer manual, owner cek mutasi rekening, konfirmasi balik via chat. Volume 40+ pesanan seminggu, 160+ sebulan, semua tercatat di chat dan kepala owner.

**Kenapa sekarang**: dua langkah paling nyakit — customer pilih item+jadwal (owner jadi perantara menu), dan cek mutasi (owner nebak-nebak transfer masuk). Keduanya berakar di hal yang sama: gak ada satu tempat yang nunjukkin menu available + status pembayaran tanpa owner sebagai penghubung.

**Sukses kalau**: owner waktu per order lifecycle action turun 50%+ (target ≤30 detik). 90%+ buyer cek tracking link sendiri. Zero error konfirmasi pembayaran. Hosting ≤ IDR 150.000/bulan.

## Goals

- Gantikan manual order recording + payment tracking dengan web app sederhana
- Customer self-service: lihat menu PO yang open, pilih item + tanggal ready, isi data, upload bukti transfer, lacak status via link
- Owner kelola menu per putaran PO, verifikasi bukti pembayaran, update status, lihat laporan — dari satu dashboard
- Minimasi error + waktu operasional via automasi status update + record-keeping
- Tool ringan, mudah diadopsi, tanpa training

## Non-Goals

- Bukan e-commerce penuh: no shopping cart real-time stock sync, no multi-vendor, no marketplace
- Tidak ubah flow offline payment: tetap manual transfer + verifikasi bukti, no payment gateway
- Tidak integrasi kurir pihak ketiga: delivery internal, owner antar sendiri
- Tidak ada akun customer: buyer gak login, gak daftar, data disimpan per-order
- Tidak ada real-time communication (WebSocket/SSE/polling): strictly request-response
- Tidak ada AI/ML, tidak ada analytics/tracker eksternal

## Anti-Goals (failure even if technically works)

- App yang terasa lebih berat dari proses manual — kalau owner mending balik ke WhatsApp, gagal
- UI yang terasa korporat/clinical — RasaRisa adalah dapur rumah, bukan startup
- Cart yang ribet — kalau customer harus login/daftar untuk pesan, gagal
- Admin dashboard yang overloaded — owner bukan developer, harus bisa pakai tanpa manual

## Constraints

### Product-defining (tidak berubah)

- **Offline payments only**: manual bank transfer + upload bukti → admin verifikasi. No payment gateway.
- **Pre-order model**: PO dibuka per putaran, ada tanggal ready. Customer pesan ahead, bukan instant.
- **Multi-batch per transaction**: satu pesanan bisa campur item dari beberapa batch PO (tanggal ready beda).
- **Delivery internal**: owner antar sendiri, ongkir gratis, no kurir API.
- **No customer accounts**: buyer gak login, data per-order + cookie untuk cart + returning buyer suggestion.

### Technology (bebas, rekomendasi)

- **Bahasa**: TypeScript. Alasan: data model kompleks (multi-batch, state machine status), type safety tangkap bug compile-time, match ekosistem.
- **Framework**: Next.js App Router (monolith, satu deploy unit, TypeScript end-to-end, mainstream).
- **DB**: PostgreSQL (relasional + transaksi, cocok buat order multi-item multi-batch). Single container via Docker.
- **ORM**: Prisma (typed client, migrasi terkelola, schema-first).
- **Styling**: Tailwind CSS + shadcn/ui (Radix-based, accessible, match design tokens).
- **Deploy**: Docker single container (Next.js + Postgres), `docker-compose up`.
- **Font**: Fraunces (serif, judul — karakter "buku resep/homemade"), Inter (sans, body — readability). Self-hosted.

### Dilarang

- Runtime calls ke API eksternal (payment, kurir, SMS, OAuth, analytics, CDN, image hosting)
- WebSocket / SSE / long polling
- AI/ML models
- Dependency berbayar / proprietary license

## Design Direction

**Vibe**: Warm Editorial "Dapur Rumah". Hangat, personal, "from home to home". Bukan korporat, bukan warung modern.

**Palette**:
| Role | Name | Hex | Usage |
|------|------|-----|-------|
| Primer | Tomato Red | #E63946 | Buttons, links, key accents, urgency |
| Sekunder | Turmeric Orange | #F4A261 | Highlights, secondary UI, status pending |
| Background | Warm Cream | #FFF3E0 | Page background |
| Surface | Card White | #FFFFFF | Cards, dialogs, surfaces |
| Text Primer | Ink Dark | #1D1D1D | Headings, body |
| Text Muted | Ink Muted | #555555 | Captions (≥4.5:1 contrast on cream) |
| Border | Soft Grey | #E8E2D5 | Dividers, input borders |
| Success | Leaf Green | #388E3C | Success messages, done states |
| Danger | Red Dark | #D32F2F | Error, deadline urgent |

Alasan palette: merah + oranye = gugah selera + urgency lapar. Krem = natural, gak clinical. Hijau = segar/sukses. Hindar biru/ungu/neon = bikin makanan keliatan dingin.

**Liveliness dials**: ENERGY 2 (balanced — hangat tapi gak berlebihan), RHYTHM 2 (consistent dengan break — hero asimetris, grid menu seragam), MOTION 2 (transisi mendukung UX — hover, pulse status, pop-in success).

**Tipografi**: Fraunces (serif, 700/600 — judul hero/section/card name, karakter "homemade/buku resep"). Inter (sans, 400/500/600 — body, UI, label). Alasan R-06: Fraunces dipilih karena karakter handmade, bukan AI default (Inter/Geist).

**Logo**: Pot + steam + tagline "makan enak, tanpa ribet" (dari `asset_logo/`). Warna earthy (brown #4a2e15, olive #8a9a5b, tan #d49a5b). Inline SVG, self-hosted.

**Voice & tone** (BRAND_PACK): friendly home cook — hangat, genuine, neighborly. Gak pushy, gak korporat. Bahasa Indonesia default. Pair negative news dengan next step.

## Screen Inventory

### Buyer (no login)

1. **Katalog/Home** (`/`)
   - Hero: headline + foto + CTA "Lihat Menu"
   - PO pill: "Pre-order sedang dibuka" (hijau, pulse)
   - PO chips: pilih tanggal ready (Sabtu 18 Okt / Senin 20 Okt / Rabu 15 Okt closed)
   - Menu grid: kartu menu — foto, ready tag per tanggal, nama, deskripsi, harga, tombol "+ Tambah"
   - Item dari batch berbeda tampil bareng di grid, dibedakan via ready tag

2. **Checkout** (`/checkout`)
   - Step indicator: Pilih Menu ✓ → Checkout (active) → Bayar
   - Cart items grouped per tanggal ready: "Ready Sabtu, 18 Okt" (item list), "Ready Senin, 20 Okt" (item list)
   - Qty selector per item + remove
   - Fulfillment toggle: "Antar ke rumah" (gratis, show alamat field) / "Ambil sendiri" (pickup, hide alamat)
   - Data pemesan: Nama* + Nomor WA* (mandatory)
   - Summary sticky: subtotal per item, ongkir gratis, total. Tombol "Buat Pesanan"
   - Cart persist via cookie (survive refresh/close browser)

3. **Konfirmasi Pesanan** (`/order/[id]`)
   - Success banner: checkmark pop-in, "Pesanan #RSA-XXX berhasil dibuat!", status badge "Menunggu Pembayaran"
   - Rekening bank: nama bank, nomor besar, a.n., tombol salin. Jumlah yang harus ditransfer (merah). Deadline upload bukti (merah, urgent)
   - Upload bukti: drop zone dashed, "JPG/PNG max 5MB". State uploaded: preview hijau + tombol ganti
   - Tracking link box: "rasarisa.id/track/xxx", tombol "Buka tracking"
   - Ringkasan pesanan: grouped per tanggal ready, total
   - Tombol: "Kembali ke menu" + "Lihat pesanan saya"

4. **Tracking** (`/track/[trackingId]`)
   - Header: "Pesanan #RSA-XXX" + "Lacak Pesananmu" + current status badge (pulse)
   - Timeline vertikal 6 step: Pesanan Dibuat → Menunggu Pembayaran → Pembayaran Dikonfirmasi → Diproses → Siap Dikirim → Selesai
   - Step done: hijau ✓ + timestamp. Current: oranye + ring animation + note (deadline/receipt status). Upcoming: gray
   - Detail pesanan: grouped per tanggal ready, fulfillment info. **Gak ada data pribadi** (nama/WA/alamat)
   - Upload CTA: kalau status "Menunggu Pembayaran", box upload bukti langsung di tracking page
   - Invalid/expired link: "Link tidak valid atau sudah kedaluwarsa."

### Admin (login required)

5. **Login** (`/admin/login`)
   - Email/username + password
   - Lockout setelah 5 percobaan gagal
   - Error: "Email atau password salah." / "Akun terkunci. Silakan coba lagi nanti."

6. **Dashboard** (`/admin`)
   - Header: "Selamat datang, Risa 👋" + tombol "Kelola PO" + "Buka PO Baru"
   - Stats cards: pesanan hari ini, perlu verifikasi, pendapatan (PO buka), selesai bulan ini. Trend up/down
   - PO yang sedang berjalan: list per tanggal ready — date badge, judul + deadline, pesanan count, status (soon/open/closed), tombol Lihat
   - Orders table: filter chips (Perlu verifikasi / Menunggu bayar / Diproses / Siap kirim / Selesai / Semua). Kolom: Pesanan ID, Customer, PO Ready, Total, Status badge, Aksi

7. **Order Detail** (`/admin/orders/[id]`)
   - Buyer info: nama, WA, alamat, fulfillment type
   - Item list grouped per tanggal ready
   - Receipt preview (kalau uploaded) + tombol "Konfirmasi Pembayaran" / "Minta Upload Ulang"
   - Kalau no receipt: "Konfirmasi Pembayaran" disabled, message "Menunggu bukti transfer dari pembeli"
   - Status dropdown: advance ke next stage only. Backward ditolak: "Status mundur tidak diizinkan"
   - Timeline status history

8. **Kelola PO** (`/admin/po`)
   - List semua PO (past + active + scheduled)
   - Create PO: pilih tanggal ready, set deadline tutup, pilih menu dari katalog (aktifkan/sembunyikan per PO), set harga per PO (optional override)
   - Edit PO: ubah deadline, add/remove menu
   - Close PO manual (selain auto-close by deadline)

9. **Katalog Menu** (`/admin/products`)
   - List produk (pustaka hidangan): active/inactive badge
   - Add product: nama*, deskripsi, harga*, foto optional, kategori optional
   - Edit product
   - Deactivate (soft delete) — gak affect existing orders

10. **Laporan Keuangan** (`/admin/reports`)
    - Date range picker
    - Total orders placed, total paid orders, total revenue (sum confirmed-payment)
    - List orders "Payment Confirmed" dengan amount
    - Empty: "Tidak ada data untuk periode ini."

11. **Analytics** (`/admin/analytics`)
    - Top-3 best-selling items (current month) — bar chart
    - Average order value (last 30 days) — metric card

12. **Pengaturan** (`/admin/settings`)
    - Bank details: bank name, account number, account holder
    - Receipt upload deadline (default 24h)
    - Tracking link expiry (default 90 days)
    - Change admin password

## Data Model (Prisma schema — draft)

```prisma
model Product {
  id          String   @id @default(cuid())
  name        String
  description String?
  price       Int      // dalam rupiah, integer
  image       String?  // path ke file lokal
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  poItems     PoItem[]
}

model PoBatch {
  id            String   @id @default(cuid())
  readyDate     DateTime  // tanggal makanan ready
  closeDate     DateTime  // deadline tutup PO
  status        PoStatus @default(OPEN)
  poItems       PoItem[]
  orders        OrderItem[]
  createdAt     DateTime @default(now())

  enum PoStatus { OPEN CLOSED }
}

model PoItem {
  id        String   @id @default(cuid())
  product   Product  @relation(fields: [productId], references: [id])
  productId String
  poBatch   PoBatch @relation(fields: [poBatchId], references: [id])
  poBatchId String
  priceOverride Int?  // optional: harga beda per PO
  // unique: satu product per PO batch
  @@unique([productId, poBatchId])
}

model Order {
  id              String      @id @default(cuid())
  orderNumber     String      @unique // RSA-XXX format
  trackingId      String      @unique // unguessable token
  buyerName       String
  buyerWa         String
  fulfillment     Fulfillment
  address         String?
  status          OrderStatus @default(WAITING_PAYMENT)
  receiptImage    String?     // path ke file lokal
  receiptUploadedAt DateTime?
  paymentConfirmedAt DateTime?
  expiresAt       DateTime     // deadline upload bukti
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  items           OrderItem[]
  statusHistory   StatusHistory[]

  enum Fulfillment { PICKUP DELIVERY }
  enum OrderStatus {
    WAITING_PAYMENT   // menunggu bukti transfer
    PAYMENT_CONFIRMED // admin konfirmasi
    PROCESSING        // diproses (dimasak)
    READY_FOR_DELIVERY // siap dikirim/ambil
    COMPLETED         // selesai
    EXPIRED           // gak upload bukti dalam deadline
  }
}

model OrderItem {
  id        String   @id @default(cuid())
  order     Order    @relation(fields: [orderId], references: [id])
  orderId   String
  poBatch   PoBatch @relation(fields: [poBatchId], references: [id])
  poBatchId String
  product   Product  @relation(fields: [productId], references: [id])
  productId String
  quantity  Int
  price     Int      // snapshot harga saat order
}

model StatusHistory {
  id        String     @id @default(cuid())
  order     Order      @relation(fields: [orderId], references: [id])
  orderId   String
  status    OrderStatus
  note      String?
  createdAt DateTime   @default(now())
}

model Admin {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  failedAttempts Int    @default(0)
  lockedUntil  DateTime?
  createdAt    DateTime @default(now())
}

model Setting {
  id              String   @id @default(cuid())
  key             String   @unique
  value           String   // JSON-encoded value
  updatedAt       DateTime @updatedAt
}
// Settings keys: bank_name, account_number, account_holder,
// receipt_deadline_hours (default 24), tracking_expiry_days (default 90)
```

## Order Status State Machine

```
[Order created]
    ↓
WAITING_PAYMENT
    ↓ (admin confirm, receipt present)
PAYMENT_CONFIRMED
    ↓
PROCESSING
    ↓
READY_FOR_DELIVERY
    ↓
COMPLETED

WAITING_PAYMENT → EXPIRED (auto, if no receipt by deadline)
```

Rules:
- Forward only. Backward → error "Status mundur tidak diizinkan"
- "Confirm Payment" disabled if no receipt → "Menunggu bukti transfer dari pembeli"
- "Request Re-upload" → stay WAITING_PAYMENT, notify buyer via tracking page
- EXPIRED is terminal (no forward from there)

## Cart Persistence

Cart disimpan di **cookie** (HTTP-only, signed). Survive refresh + browser close. Cleared on order creation. Max age 7 hari.

Structure: `[{ productId, poBatchId, quantity }]`

## Security

- Admin auth: password-based, bcrypt hash. Lockout 5 percobaan gagal, locked 15 menit.
- CSRF: Next.js built-in + same-site cookie.
- Input validation: Zod schemas di API boundaries.
- File upload: validate MIME type (image/jpeg, image/png) + size (≤5MB) server-side. Filename sanitized. Store di volume lokal, gak serve executable.
- Tracking link: unguessable token (cuid/uuid). Gak expose buyer data (nama/WA/alamat).
- SQL injection: Prisma parameterized queries.
- XSS: React auto-escape + CSP header.

## File Storage

Bukti transfer + product images disimpan di **volume lokal Docker** (`/app/uploads`). Served via Next.js route dengan content-type validation. No external storage.

## Left to Builder

1. **Exact Prisma migration setup** — schema di atas draft, refine saat implementasi
2. **Admin auth session** — Next.js cookies + iron-session atau JWT. Pilih yang simplest.
3. **PO scheduling** — apakah PO auto-close by deadline (cron/background job) atau lazy-check on read. Lazy-check simpler, no cron needed.
4. **Returning buyer suggestion** — cookie dengan buyer data terakhir, show "Lanjutkan sebagai [Nama]?" di checkout
5. **Receipt notification ke admin** — polling di dashboard (request-response, no WebSocket) atau admin manually refresh
6. **Image upload flow** — product image saat admin add/edit product
7. **Mobile admin** — sidebar collapse jadi bottom tab / hamburger di mobile
8. **Empty/error/loading states** — per screen, follow DESIGN_PACK patterns
9. **Analytics chart** — simple bar chart (recharts atau hand-rolled SVG, keep <500KB JS)
10. **Localization** — Indonesia default, English fallback optional

## Deployment

- `docker-compose.yml`: satu service (app + db)
- Dockerfile: Node + Postgres, multi-stage build
- Volume: `./data:/var/lib/postgresql/data` (DB) + `./uploads:/app/uploads` (files)
- Env: `DATABASE_URL`, `SESSION_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` (initial)
- First run: auto-migrate + seed admin account
- `docker-compose up` → app ready

## Definition of Done (per feature)

- Acceptance scenarios pass (manual test, exact error messages match)
- Responsive 320px–1440px, no horizontal scroll
- WCAG AA contrast, keyboard navigable, focus visible
- Input validated + sanitized, CSRF protected, admin auth enforced
- Business rules enforced app-level (status transitions, PO window, mandatory fields)
- Unit tests: status transitions, payment confirmation, date validation, report calc, deadline logic
- Lint pass, no dead code, no debug logs
- `docker-compose up` works without error
- Zero external runtime calls
- Admin-facing config documented
