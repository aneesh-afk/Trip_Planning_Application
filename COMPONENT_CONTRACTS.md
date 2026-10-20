# GlobeTrotter — Component Contracts (v1)

Purpose: `UI_SCHEMA.md` defines the *look* (colors, type, spacing). This file defines the *interface* — exact props, file paths, and export style for every shared component, so that whether a screen is built by Person B, Person C, or an AI agent working solo, they all call the same component the same way.

**Rule:** if a component you need isn't listed here, add it to this file first (with its contract), then build it. Don't invent a one-off local version of something that should be shared — check this file before writing a new `<button>`.

---

## File path map (fixed — do not deviate)

```
src/
  components/
    Button.jsx
    Card.jsx
    Input.jsx
    Badge.jsx
    RouteLine.jsx
    AppShell.jsx
    Modal.jsx
  pages/
    Login.jsx
    Signup.jsx
    Dashboard.jsx
    MyTrips.jsx
    CreateTrip.jsx
    ItineraryBuilder.jsx
    ItineraryView.jsx
    BudgetView.jsx
    PublicTrip.jsx
  lib/
    supabaseClient.js
  hooks/
    useAuth.js
    useTrip.js
    useBudget.js
```

All components: **named export**, not default. `export function Button(...)`, imported as `import { Button } from '../components/Button'`. This avoids the common multi-agent bug where one file does `export default` and another imports it as `{ Button }`.

---

## `<Button>`

```jsx
<Button
  variant="primary"       // "primary" | "secondary" | "danger" — default "primary"
  size="md"                // "md" only for v1 — do not add sm/lg unless a real screen needs it
  disabled={false}
  onClick={() => {}}
  type="button"            // "button" | "submit" — default "button"
>
  Save Trip
</Button>
```

Contract:
- Renders `--color-route` bg for `primary`, transparent + border for `secondary`, `--color-danger` text for `danger`
- `disabled` sets 50% opacity + `cursor-not-allowed`, no other visual variants
- Always `padding: 10px 20px`, `--radius-sm`, `--text-body` weight 500
- No icon-only mode in v1 — every button has visible text

---

## `<Card>`

```jsx
<Card padding="lg" hoverable={false}>
  {children}
</Card>
```

Contract:
- `padding`: `"md" | "lg"` — default `"lg"`. Maps to `--space-md` / `--space-lg`.
- `hoverable`: if `true`, adds `--shadow-hover` + slight lift on hover (used for clickable trip/city cards). Default `false` (static cards like the Budget summary panel don't need hover).
- Always `--color-surface` bg, `--radius-md`, `--shadow-card` base shadow.
- Does NOT include its own onClick — wrap `<Card>` in a `<Link>` or add onClick to the parent if it needs to be clickable. Keeps Card a pure visual primitive.

---

## `<Input>`

```jsx
<Input
  label="Trip Name"
  name="tripName"
  type="text"              // "text" | "email" | "password" | "date" | "number" | "textarea"
  value={value}
  onChange={(e) => setValue(e.target.value)}
  error={null}              // string | null — shown below field in --color-danger if present
  placeholder="e.g. Japan Spring 2026"
  required={false}
/>
```

Contract:
- Always renders label above field (`--text-label` style) — never a bare input with placeholder-as-label
- `type="textarea"` renders a `<textarea>` instead of `<input>`, same styling, min-height 100px
- Error state: red border + message below, using `--color-danger` — component handles this internally, caller just passes `error` string
- Do not build a separate `<Textarea>` component — `type="textarea"` on `<Input>` covers it

---

## `<Badge>`

```jsx
<Badge tone="neutral">Sightseeing</Badge>
```

Contract:
- `tone`: `"neutral" | "route" | "horizon" | "success" | "danger"` — maps directly to the matching color token as text+background-tint (10% opacity bg, full-opacity text)
- Used for: activity categories (`tone="horizon"`), trip status like Draft/Public (`tone="neutral"`/`tone="success"`), over-budget flags (`tone="danger"`)
- Always `--radius-full`, `--text-label` sizing

---

## `<RouteLine>`

The signature multi-city path element. One component, reused by Itinerary Builder and Itinerary View — don't hand-roll this twice.

```jsx
<RouteLine
  stops={[
    { id: 'uuid-1', label: 'Tokyo', active: false },
    { id: 'uuid-2', label: 'Kyoto', active: true },
    { id: 'uuid-3', label: 'Osaka', active: false },
  ]}
  onStopClick={(stopId) => {}}   // optional — omit for read-only (Public View)
/>
```

Contract:
- Renders horizontal (desktop) or vertical (mobile, via Tailwind `md:` breakpoint) dashed line with circular markers per stop
- `active` stop gets a filled `--color-route` marker; inactive stops get a `--color-border` outline marker
- If `onStopClick` is not provided, markers are non-interactive (used in Public/Shared View)
- This component does NOT fetch data — caller passes the `stops` array already shaped as above

---

## `<AppShell>`

Wraps every protected route. Built once, referenced in `App.jsx` routing — individual pages never re-implement the nav bar.

```jsx
<AppShell>
  <Dashboard />
</AppShell>
```

Contract:
- Renders fixed top nav (logo left, "Dashboard / My Trips / Profile" links right) + `<main>` container with `max-width: 1120px`, centered
- Reads `useAuth()` internally to show the user's display name / avatar in the nav — pages don't need to pass user info down
- Includes a "Log out" action in the nav (calls `supabase.auth.signOut()` then redirects to `/login`)

---

## `<Modal>`

```jsx
<Modal open={isOpen} onClose={() => setIsOpen(false)} title="Add Activity">
  {children}
</Modal>
```

Contract:
- Used for: City Search picker, Activity Search picker (both launched from Itinerary Builder), delete-confirmation dialogs
- `open` controls mount/unmount — don't build screens as always-mounted-but-hidden
- Clicking the backdrop or pressing Escape calls `onClose`
- Title always rendered in `--text-h2` / Fraunces

---

## Data-fetching hooks (contracts, not just components)

These aren't visual, but agents/builders need the same shape so a screen built by C can call a hook built by D without renegotiating the return shape.

### `useAuth()`
```js
const { user, session, loading } = useAuth()
// user: Supabase user object | null
// loading: true until initial session check resolves
```

### `useTrip(tripId)`
```js
const { trip, stops, loading, error, refetch } = useTrip(tripId)
// trip: { id, name, start_date, end_date, is_public, public_slug, ... }
// stops: [{ id, city, order_index, start_date, end_date, activities: [...] }]
//   -- stops come pre-joined with city name and their stop_activities + activity details
//   -- this is the ONE hook every itinerary-related screen should use, don't re-query trip_stops separately
```

### `useBudget(tripId)`
```js
const { total, byCategory, overBudgetDays, loading } = useBudget(tripId)
// total: number
// byCategory: [{ category: 'sightseeing', amount: 120 }, { category: 'Stay', amount: 400 }, ...]
//   -- includes 'Stay' and 'Transport' as synthetic categories alongside real activity categories
// overBudgetDays: [date strings] — only populated if caller passes a budget cap (v1: can return [])
```

Whoever builds Budget View (Person D) owns writing this hook's implementation — but the shape above is fixed so Person C's Itinerary Builder can optionally show a running total using the same hook without waiting on D's screen to be done.

---

## Naming conventions (small but prevents merge pain)

- Props: `camelCase` always (`onStopClick`, not `on-stop-click` or `onstopclick`)
- Boolean props: prefix `is`/`has`/`disabled`/`hoverable`-style adjectives, not `flag` or `type`
- Event handler props: always `on` + PascalCase verb (`onClick`, `onClose`, `onStopClick`) — never `handleClick` as a prop name (that's the *implementation's* internal name, not the prop the caller uses)
- IDs from the database are always passed as `tripId`, `stopId`, `activityId` — not `id` alone, once inside a component that could receive multiple kinds of id

---

## What an AI agent should do if asked to build a new screen or component

1. Check this file for an existing component/hook contract before creating a new one
2. If extending an existing component (e.g. Button needs a new variant), update the contract in this file in the same change — don't let code and doc drift
3. Match the file path map exactly — don't create `src/Components/` or `src/shared/` as alternate locations
4. Use named exports only, per the convention above
