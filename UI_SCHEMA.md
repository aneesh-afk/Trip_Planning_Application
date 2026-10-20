# GlobeTrotter — UI Schema (Design System, v1)

Owner: whoever's least busy in Hour 1 — read this before writing any JSX.
Goal: 4 people build 8 different screens and it still looks like 1 app.

**Rule of thumb:** if you're about to pick a color, spacing value, or font size that isn't in this doc, stop and use the closest thing that already exists here instead of introducing a new one.

---

## Design direction (why these choices)

GlobeTrotter is about *journeys* — movement between places, a route unfolding over time. The visual language leans into that: a route-line motif, a horizon-inspired palette (sky, dusk, terrain), and a layout built around timelines rather than generic dashboard cards. Avoid the default "SaaS dashboard" look (white cards, blue accent, rounded-xl everything) — it's what every hackathon travel app looks like.

---

## 1. Color Palette

| Token | Hex | Use for |
|---|---|---|
| `--color-bg` | `#FBF7F0` | Page background — warm off-white, like old paper/maps |
| `--color-surface` | `#FFFFFF` | Cards, modals, inputs |
| `--color-ink` | `#1F2A24` | Primary text — deep green-black, not pure black |
| `--color-muted` | `#6B7268` | Secondary text, captions, placeholders |
| `--color-route` | `#C4622D` | Primary accent — terracotta/clay, used for CTAs, active states, the "route line" motif |
| `--color-horizon` | `#2B5D6B` | Secondary accent — deep teal, used for links, info states, headers on data viz |
| `--color-border` | `#E4DDD0` | Dividers, input borders, card borders |
| `--color-success` | `#4A7A4E` | Budget "within range," confirmations |
| `--color-danger` | `#B3452E` | Over-budget alerts, delete actions, form errors |

Do not introduce a blue/purple SaaS-gradient accent. Do not use pure `#000000` or pure `#FFFFFF` for text/bg.

---

## 2. Typography

| Role | Font | Notes |
|---|---|---|
| Display (page titles, trip names) | `"Fraunces", serif` | Characterful serif — gives trip names weight, like a travel journal headline. Google Fonts. |
| Body (everything else) | `"Inter", sans-serif` | Clean, legible at small sizes, works in tables/forms |
| Data/Mono (costs, dates, timestamps) | `"IBM Plex Mono", monospace` | Used specifically for numbers — prices, dates in the calendar — so they align visually |

**Type scale:**

| Token | Size | Weight | Use for |
|---|---|---|---|
| `--text-display` | 2.5rem (40px) | 600 | Trip name on Itinerary View, page hero titles |
| `--text-h1` | 1.75rem (28px) | 600 | Screen titles ("My Trips", "Dashboard") |
| `--text-h2` | 1.25rem (20px) | 600 | Section headers (city name within itinerary, "Budget Breakdown") |
| `--text-body` | 1rem (16px) | 400 | Default body text |
| `--text-small` | 0.875rem (14px) | 400 | Captions, metadata, form hints |
| `--text-label` | 0.75rem (12px) | 500, uppercase, letter-spacing 0.05em | Form labels, table headers, badges |

Import both fonts via Google Fonts in `index.html`:
```html
<link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
```

---

## 3. Spacing scale

Use these values only — don't hand-write arbitrary padding/margin numbers.

| Token | Value |
|---|---|
| `--space-xs` | 4px |
| `--space-sm` | 8px |
| `--space-md` | 16px |
| `--space-lg` | 24px |
| `--space-xl` | 40px |
| `--space-2xl` | 64px |

In Tailwind terms, this maps roughly to `1, 2, 4, 6, 10, 16` — stick to that set of Tailwind spacing numbers across the app.

---

## 4. Border radius & elevation

| Token | Value | Use for |
|---|---|---|
| `--radius-sm` | 6px | Inputs, small buttons, badges |
| `--radius-md` | 12px | Cards, modals |
| `--radius-full` | 9999px | Pills (category tags, status badges) |

Shadows — use sparingly, only to lift interactive cards off the warm background:

```css
--shadow-card: 0 1px 3px rgba(31, 42, 36, 0.08), 0 1px 2px rgba(31, 42, 36, 0.04);
--shadow-hover: 0 4px 12px rgba(31, 42, 36, 0.12);
```

---

## 5. Core components (build once, reuse everywhere)

Whoever builds their screen first and needs one of these should put it in `src/components/` so nobody duplicates it.

### Button
- **Primary** — `--color-route` background, white text, `--radius-sm`, used for the one main action per screen ("Save Trip," "Add Stop")
- **Secondary** — transparent bg, `--color-border` border, `--color-ink` text — used for "Cancel," secondary actions
- **Danger** — `--color-danger` text, transparent bg, used for delete actions only
- One size: `padding: 10px 20px`, `--text-body` weight 500. Don't invent small/large variants unless a screen truly needs it.

### Card
- `--color-surface` bg, `--radius-md`, `--shadow-card`, `padding: --space-lg`
- Used for: trip cards (My Trips), city cards (search results), activity cards

### Input / Form field
- `--color-surface` bg, `1px solid --color-border`, `--radius-sm`, `padding: 10px 12px`
- Label above field, `--text-label` style, `--space-xs` gap
- Error state: border becomes `--color-danger`, error message below in `--text-small` + `--color-danger`

### Badge / Pill
- `--radius-full`, `padding: 4px 12px`, `--text-label` sizing
- Used for: activity category tags, city cost-index indicator, trip status (Draft/Public)

### Route-line divider (signature element)
This is the one distinctive visual motif — a thin dashed or dotted horizontal line with small circular "stop" markers, used specifically in the Itinerary View and Itinerary Builder to visually represent the trip as a path between cities. Not used elsewhere (don't overuse the signature element — see restraint principle).

```
●╌╌╌╌╌╌╌╌╌╌╌╌●╌╌╌╌╌╌╌╌╌╌╌╌●
Tokyo         Kyoto        Osaka
```

Render this as an SVG or simple flex row with `border-top: 2px dashed var(--color-border)` between circular city markers colored `--color-route`.

---

## 6. Layout conventions

- **Max content width:** 1120px, centered, with `--space-lg` side padding on mobile
- **Page structure:** every protected screen shares a top nav bar (logo + Dashboard/My Trips/Profile links) — build this once as `<AppShell>` wrapping all protected routes
- **Nav bar:** `--color-surface` bg, `--color-border` bottom border, height 64px, logo uses `--text-h2` in Fraunces
- **Grid for cards** (trip lists, city search results): responsive grid, 3 columns desktop / 1 column mobile, `--space-md` gap

---

## 7. Screen-specific notes

| Screen | Key UI decision |
|---|---|
| Login/Signup | Centered single card, max-width 400px, no nav bar (unauthenticated) |
| Dashboard | Hero section with "Plan New Trip" primary button top-right; trip cards below in grid |
| My Trips | Card grid, each card shows cover photo (or a placeholder using `--color-horizon` gradient if none uploaded), date range in mono font |
| Create Trip | Simple vertical form, single column, max-width 560px |
| Itinerary Builder | Two-panel layout: left = route-line list of stops (add/reorder), right = selected stop's activity list |
| Itinerary View | Day-wise vertical timeline using the route-line motif; activity blocks as small cards with time (mono font) + cost |
| Budget Breakdown | Pie chart (Recharts) using `--color-route`, `--color-horizon`, `--color-success`, `--color-muted` as the 4 category colors — don't let Recharts pick default colors |
| Public/Shared View | Same as Itinerary View but read-only — remove all edit affordances, add a "Copy This Trip" primary button at top |

---

## 8. What NOT to do

- No default blue (`#3B82F6`-style) anywhere — that's the generic-SaaS tell
- No `rounded-xl` + drop-shadow-lg on every single element — reserve elevation for cards only
- No emoji as icons — use a proper icon set (`lucide-react` is already available if you're using the React artifact environment; for the real app, install `lucide-react` via npm)
- Don't mix serif into body text or sans into trip name headers — keep the Fraunces/Inter split consistent

---

## 9. Tailwind config snippet (paste into `tailwind.config.js`)

```js
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: '#FBF7F0',
        surface: '#FFFFFF',
        ink: '#1F2A24',
        muted: '#6B7268',
        route: '#C4622D',
        horizon: '#2B5D6B',
        border: '#E4DDD0',
        success: '#4A7A4E',
        danger: '#B3452E',
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      borderRadius: {
        sm: '6px',
        md: '12px',
      },
    },
  },
  plugins: [],
}
```

With this in place, use `font-display`, `text-route`, `bg-surface`, etc. directly as Tailwind classes — nobody needs to hand-write hex values in their components.
