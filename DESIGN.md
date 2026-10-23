# DESIGN.md — RasaRisa

> Dapur rumahan untuk tetangga sekitar. Makan Praktis, Enak, Tanpa Ribet!

## 1. Visual Theme & Atmosphere

**Mood:** Warm, neighborly, home-cooked. Like walking into a friend's kitchen.

**Density:** Comfortable. White space is generous on buyer pages; admin pages are data-dense but never cramped. Cards breathe. Text is large enough to read on a phone in sunlight.

**Design philosophy:** Warmth over polish. This is not a SaaS dashboard. It's a food pre-order app run by a home cook. Every surface should feel approachable, not corporate. Colors are food-inspired (tomato, turmeric, cream). Shapes are soft (rounded corners, pill buttons). Motion is gentle (small lifts, slow pulses) and always has a purpose.

**Atmosphere:** Warm cream canvas with subtle radial gradients (turmeric and tomato tints) creating depth without noise. Cards float on this surface with soft borders, not heavy shadows.

## 2. Color Palette & Roles

### Core Palette

| Token | Hex | Role |
|-------|-----|------|
| `--color-tomato` | `#E63946` | Primary action: buttons, active states, focus rings, cart badge |
| `--color-tomato-dark` | `#C92F3C` | Pressed/hover state for primary buttons |
| `--color-turmeric` | `#F4A261` | Accent: step numbers, status (waiting), ready indicators, highlights |
| `--color-cream` | `#FFF3E0` | App background canvas |
| `--color-card` | `#FFFFFF` | Card and input backgrounds |
| `--color-ink` | `#1D1D1D` | Primary text, cart button background |
| `--color-ink-muted` | `#555555` | Secondary text, hints, descriptions |
| `--color-soft-grey` | `#E8E2D5` | Borders, dividers, step separators |
| `--color-leaf` | `#388E3C` | Success: PO open, payment confirmed, status done |
| `--color-danger` | `#D32F2F` | Errors, expired status, destructive actions |

### Admin Sidebar (Dark Surface)

| Token | Hex | Role |
|-------|-----|------|
| `--color-sidebar-bg` | `#2A1F15` | Admin sidebar and login brand panel background |
| `--color-sidebar-text` | `#E8D5C0` | Sidebar text, login tagline |

### Status Colors

| Status | Tint base | Text color | Meaning |
|--------|-----------|------------|---------|
| WAITING_PAYMENT | `rgba(244,162,97,0.15)` | `#F4A261` turmeric | Awaiting buyer action |
| PAYMENT_CONFIRMED | `rgba(56,142,60,0.12)` | `#388E3C` leaf | Admin confirmed, processing |
| PROCESSING | `rgba(33,150,243,0.12)` | `#1976D2` blue | Food being prepared |
| READY_FOR_DELIVERY | `rgba(156,39,176,0.12)` | `#8E24AA` purple | Ready for pickup/delivery |
| COMPLETED | `rgba(85,85,85,0.1)` | `#555555` ink-muted | Done |
| EXPIRED | `rgba(211,47,47,0.1)` | `#D32F2F` danger | Terminal, no action |

### Contrast Rules

- Body text on cream: Ink `#1D1D1D` on Cream `#FFF3E0` = 14.8:1 (AAA)
- Muted text on cream: Ink Muted `#555555` on Cream `#FFF3E0` = 7.4:1 (AAA)
- Muted text on card: Ink Muted `#555555` on White `#FFFFFF` = 7.5:1 (AAA)
- Sidebar text on sidebar bg: `#E8D5C0` on `#2A1F15` = 10.9:1 (AAA)
- White text on tomato: `#FFFFFF` on `#E63946` = 4.7:1 (AA)
- **Minimum: 4.5:1 for all text. Never lighten Ink Muted above #555555.**

## 3. Typography

### Font Families

| Role | Family | Source |
|------|--------|--------|
| Headings (h1-h6) | Fraunces | `@fontsource/fraunces`, self-hosted |
| Body, UI, inputs | Inter | `@fontsource/inter`, self-hosted |
| Fallback | Georgia, serif / system-ui, sans-serif | CSS stack |

No Google Fonts CDN. All fonts bundled via `@fontsource` and served locally.

### Type Scale

| Element | Font family | Size | Weight | Line height | Notes |
|---------|------------|------|--------|-------------|-------|
| Hero h1 (buyer) | Fraunces | 2rem / 2.75rem (md) | 700 | 1.1 | Tomato accent on key phrase (italic span) |
| Card h2 | Fraunces | 1.25rem | 600 | 1.3 | Flex, gap 10px |
| Section h2 | Fraunces | 1.5rem - 1.65rem | 600-700 | 1.2 | |
| Card subtitle | Inter | 13px | 400 | 1.5 | Ink muted |
| Body | Inter | 15-16px | 400 | 1.55 | Default body |
| Small body / hint | Inter | 13px | 400 | 1.45 | Ink muted |
| Button text | Inter | 14-15px | 500-600 | | Inherit from parent |
| Label | Inter | 13px | 600 | | Ink, `.req` asterisk in tomato |
| Badge / pill | Inter | 11-13px | 600-700 | | Uppercase for nav sections |
| Tagline (login) | Fraunces | 1.5rem / 1.75rem (md) | 600 | 1.25 | Turmeric accent span |

### Typographic Rules

- Headings always Fraunces. Body always Inter. No exceptions.
- No em dash (—) in UI text. Use comma, period, colon, parentheses.
- Indonesian language default. All UI copy in Bahasa Indonesia.
- Product names and descriptions may contain Indonesian food terms (rendang, cendol, etc). These are not translated.
- `word-break: break-word` on product names (`.rr-break-words`) to prevent layout overflow from long names.

## 4. Component Stylings

### Buttons

**Primary (`.rr-btn-primary`)**
- Background: tomato `#E63946`
- Text: white, 15px, weight 600
- Border radius: 10px
- Padding: 13px 28px
- Hover: bg tomato-dark, translateY(-2px), shadow `0 8px 20px rgba(230,57,70,0.28)`
- Transition: 0.15s on background, transform, box-shadow
- Icon gap: 8px

**Ghost (`.rr-btn-ghost`)**
- Background: card white
- Border: 1px solid soft-grey
- Text: ink, 14px, weight 600
- Border radius: 10px
- Padding: 10px 16px
- Hover: border-color tomato, translateY(-1px)

**Icon button (`.rr-icon-btn`)**
- Background: card white
- Border: 1px solid soft-grey
- Border radius: 999px (pill)
- Padding: 8px 16px
- Hover: border-color tomato, translateY(-1px)

**Cart button (`.rr-cart-btn`)**
- Variant of icon button: bg ink, text white, border ink
- Hover: border-color tomato
- Badge: bg tomato, text white, 11px, weight 700, pill

**Action button (`.rr-action-btn`, admin tables)**
- Background: card white
- Border: 1px solid soft-grey
- Border radius: 8px
- Padding: 6px 12px
- Font: 13px, weight 600
- Hover: border tomato, text tomato
- `.primary` variant: bg tomato, text white, border tomato; hover bg tomato-dark

### Cards (`.rr-card`)

- Background: card white
- Border: 1px solid soft-grey
- Border radius: 14px
- Padding: 24px (18px on mobile)
- Margin bottom: 20px

### Form Fields (`.rr-field`)

- Label: 13px, weight 600, ink. Required asterisk `.req` in tomato.
- Input/textarea/select: width 100%, padding 11px 14px, border 1px soft-grey, border-radius 8px, font 14px, bg card, text ink.
- Focus: border tomato, box-shadow `0 0 0 3px rgba(230,57,70,0.12)`. `outline: none` (replaced by box-shadow).
- Hint: 12px, ink-muted, margin-top 4px.

### Status Badges (`.rr-status-badge`)

- Pill: border-radius 999px, padding 6px 14px, 13px weight 600.
- Pulsing dot: 8px circle, `animation: pulse 2s infinite`.
- Color variants per status (see Color Palette).

### PO Pill (`.rr-po-pill`)

- Green tint background, leaf text, pill shape.
- Pulsing green dot.

### Product Card

- Border: transparent, transitions to tomato/20% on hover.
- Border radius: 14px, overflow hidden.
- Image placeholder: gradient backgrounds (4 variants), food emoji centered, aspect-ratio 4/3.
- Hover: translateY(-3px), border tomato/20%.
- Shadow: `0 1px 3px rgba(0,0,0,0.06)`.

### Quantity Stepper (`.rr-qty`)

- Pill container: bg cream, border soft-grey, border-radius 999px, padding 4px.
- Buttons: 24px circle, bg card. Hover: bg tomato, text white.
- Value: min-width 16px, centered, 14px weight 600.

### Fulfillment Toggle (`.rr-fulfill-opt`)

- Full-width button, border 1.5px soft-grey, border-radius 12px, padding 16px.
- Selected: border tomato, bg `rgba(230,57,70,0.04)`.
- Icon: 1.4rem, block. Title: 14px weight 600. Desc: 12px ink-muted.

### Admin Sidebar (`.rr-sidebar`)

- Background: sidebar-bg `#2A1F15`.
- Nav items: 14px weight 500, padding 12px 24px, border-left 3px transparent.
- Active: bg `rgba(230,57,70,0.15)`, text white, border-left tomato.
- Hover: bg `rgba(255,255,255,0.1)`.
- Nav sections: 11px uppercase, letter-spacing 1px, sidebar-text at 50% opacity.
- Logout: same as nav item, left-aligned, border-left transparent.

### Topbar (`.rr-topbar`)

- Background: `rgba(255,243,224,0.92)` (translucent cream), backdrop-filter blur(8px).
- Border-bottom: 1px solid soft-grey.
- Padding: 12px 24px. Sticky, z-index 10.
- Logo height: 36px.

## 5. Layout Principles

### Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Tight gaps (logo), badge padding |
| sm | 8px | Icon gaps, small element spacing |
| md | 12-14px | Field margins, nav item gaps |
| lg | 16-20px | Card padding (mobile), section gaps |
| xl | 24-28px | Card padding (desktop), sidebar padding |
| 2xl | 32px | Admin main padding, large gaps |
| 3xl | 40px | Hero grid gap (desktop) |

### Grid System

- Max content width: 1120px (buyer pages), fluid (admin)
- Buyer hero: `grid-template-columns: 1.1fr 1fr` (desktop), `1fr` (mobile)
- Product grid: `repeat(auto-fill, minmax(260px, 1fr))`, gap 22px
- Checkout: `1.5fr 1fr` (desktop), `1fr` (mobile)
- Admin layout: `240px 1fr` (desktop), `1fr` (mobile, horizontal nav)

### Whitespace Philosophy

- Generous on buyer pages: hero pt-9 pb-7 (desktop pt-16 pb-10).
- Dense on admin: 28px padding, tight card gaps.
- Never cramped: minimum 16px between interactive elements.
- Mobile: reduce padding to 16-20px, keep readability.

## 6. Depth & Elevation

### Shadow System

| Level | Value | Usage |
|-------|-------|-------|
| None | none | Flat surfaces, cards at rest |
| Subtle | `0 1px 3px rgba(0,0,0,0.06)` | Product cards at rest |
| Hover lift | `0 8px 20px rgba(230,57,70,0.28)` | Primary button hover (tomato tinted) |
| Card hover | translateY(-2px to -3px) | Product cards, ghost buttons |
| Hero card | `0 14px 36px rgba(0,0,0,0.08)` | How-to card on landing page |

### Surface Hierarchy

1. **Cream canvas** (lowest): app background with radial gradient tints
2. **Card white** (mid): cards, inputs, buttons (ghost)
3. **Ink dark** (high): cart button, active PO chip, active filter chip
4. **Sidebar brown** (highest contrast): admin sidebar, login brand panel

### Rules

- No shadow on cards at rest. Depth comes from border (1px soft-grey).
- Shadows only on hover (lift) and one hero element (how-to card).
- Translucent topbar (cream at 92% + blur) creates layered depth without shadow.
- Every shadow has a purpose. No decorative shadows.

## 7. Do's and Don'ts

### Do

- Use Fraunces for headings, Inter for everything else.
- Pair negative news with a next step ("Status mundur tidak diizinkan" + what to do instead).
- Include empty, loading, and error states for every data UI.
- Use food emoji as decorative image placeholders (🍲🍗🐟🥤🍛🥘🍜🧁).
- Make every interactive element work or remove it.
- Provide 44px minimum tap targets on touch devices.
- Show focus visibly: 2px tomato outline, offset 2px.

### Don't

- No em dash (—) in UI text. Use comma, period, colon, parentheses.
- No gradients without a reason (comment the purpose). Image placeholders are the exception.
- No generic AI icons (sparkle, star, lightning). No emoji as functional icons.
- No `outline: none` without a replacement (box-shadow or border).
- No horizontal scroll on any viewport (320px to 1440px).
- No Google Fonts CDN. Fonts are self-hosted.
- No external API calls at runtime (no payment, kurir, SMS, OAuth, analytics, CDN, image hosting).
- No abstraction, wrapper, or "for later" code that nobody asked for.
- No commented-out code, debug logs, or dead code.
- No `any` type without explicit reason (use `unknown` + narrow).

## 8. Responsive Behavior

### Breakpoints

| Breakpoint | Width | Behavior |
|-----------|-------|----------|
| Mobile | 320-767px | Single column, horizontal scroll nav, reduced padding |
| Tablet/Desktop | 768px+ | Multi-column grids, sidebar visible, full padding |

Tailwind `md:` prefix = 768px. No intermediate breakpoints needed.

### Mobile Adaptations

- Hero grid: collapses to single column, how-to card below text.
- Admin sidebar: becomes horizontal scroll bar at top. Logo and nav sections hidden. Active item marked by bottom border instead of left.
- Checkout grid: single column. Cart summary below form.
- Product grid: reflows via `auto-fill minmax(260px, 1fr)`.
- Topbar: padding 10px 16px, logo 30px, smaller icon buttons.
- Card padding: 18px (was 24px).
- Tap targets: `@media (pointer: coarse)` enforces 44px min on buttons, links, checkboxes, radios.

### Touch

- All interactive elements minimum 44x44px on touch devices.
- No hover-dependent interactions. Hover states are enhancement, not requirement.
- Horizontal scroll for timelines and nav with `-webkit-overflow-scrolling: touch`.

## 9. Agent Prompt Guide

### Quick Color Reference

```
Primary action:  bg #E63946, text #FFFFFF
Hover (primary): bg #C92F3C
Accent:          #F4A261 (turmeric)
Background:      #FFF3E0 (cream)
Card surface:    #FFFFFF
Text primary:    #1D1D1D
Text muted:      #555555
Border:          #E8E2D5
Success:         #388E3C
Danger:          #D32F2F
Sidebar bg:      #2A1F15
Sidebar text:    #E8D5C0
```

### Ready-to-Use Prompts

**Build a buyer page:**
> Create a page with the warm cream background (#FFF3E0). Use a 14px border-radius white card with 1px #E8E2D5 border. Heading in Fraunces, body in Inter. Primary CTA is a tomato (#E63946) button, 10px radius, 13px 28px padding, white text. On hover it lifts 2px with a tomato-tinted shadow.

**Build an admin table row:**
> Use the admin layout (240px sidebar #2A1F15 + fluid main). Table rows on white card surface. Action buttons are 8px radius, 6px 12px padding, 13px font, soft-grey border. Hover turns border and text tomato. Primary action variant fills tomato with white text.

**Add a status badge:**
> Pill shape (999px radius), 6px 14px padding, 13px weight 600. Pulsing 8px dot (animation: pulse 2s infinite). Color by status: waiting = turmeric tint, confirmed = leaf tint, processing = blue tint, ready = purple tint, done = grey tint, expired = danger tint.

**Build a form:**
> Labels 13px weight 600, ink color. Required asterisk in tomato. Inputs: 100% width, 11px 14px padding, 1px soft-grey border, 8px radius, 14px Inter. Focus: border tomato, 3px tomato-tinted box-shadow, no outline. Hints: 12px ink-muted.
