# AI Context — visionary-web-solutions

## Identity

- Brand: Shankara (chatbot name)
- Primary color: #3E6E9E | Dark: #2D5580 | Light: #E8F0F8 | Ink: #1A1A1A
- Fonts: Raleway (headings), Lato (body/numbers)

## Sections (in order)

1. Nav — logo left, links right; CTA "Ask Shankara" opens floating chat
2. Hero — centered, video bg with alpha transparency
3. Process — unchanged
4. Pricing Cards — 3 sections x 3 cards, staircase layout
5. Contact — unchanged
6. Footer — unchanged

## Floating Chat Button (bottom-right)

- Transparent bg, 64x64px circle
- Logo fills entire button (100% w/h)
- Spins continuously (6s infinite rotation), speeds to 2s on hover
- Callout on left: #1a1a1a bg, white text, Lato, "Ask Shankara for a free demo ✨"
- Opens dark-modal chat overlay

## Pricing Data (index.tsx PACKAGES)

- Keys: dp (Online Presence), fc (Fully Online), dm (Online Marketing)
- Each: 3 levels, `featuredLevel` (dp:3, fc:1, dm:2)
- `getEffectiveIncludes()` accumulates inherited features, filters "Everything in Level X"
- Staircase: CSS vars `--sc-pad-top/bottom` (30/60/90px), `--sc-margin-x` (60/30/0)
- align-items: center for centered vertical alignment
- Mobile: single column, cards centered via horizontal margins

## Detail Page

- Selected level → first column in comparison table
- Shows all 3 levels side-by-side
- "First month: ₹X" add-on cost for extra services
- Sticky "← Back to all services" header
- CTA: "Set up free demo" / "Set up free demo (2 services)"

## Pages/Routes

- `src/routes/index.tsx` — single page SPA with all views
- `src/routes/__root.tsx` — root layout with meta
- `src/components/Nav.tsx` — nav bar
- `src/styles.css` — all styles
- `src/assets/chat-logo.png` — chat button icon
