# GlobeTrotter — Database Schema (v1, Hackathon Scope)

Owner: Person A
Status: Draft for team kickoff — lock this within Hour 1, then don't change table names/types without telling everyone in the group chat.

## How to read this doc

Each table has: purpose, columns (name / type / notes), and relationships. Foreign keys point up the hierarchy: `Activity → Stop → Trip → User`, and `Stop → City`, `Activity → City` (for the catalog side).

If you're Person B/C/D: you don't need to memorize all of this. Just know which tables your screen reads/writes (marked at the bottom of each table section as **"Used by"**).

---

## Entity Relationship Overview

```
users
  └── trips (1:many)
        └── trip_stops (1:many)
              ├── cities (many:1 — each stop references one city)
              └── stop_activities (1:many)
                    └── activities (many:1 — each stop_activity references one catalog activity)

cities        (master catalog — seeded, shared across all users)
activities    (master catalog — seeded, belongs to a city, shared across all users)
```

Budget is **not** a stored table. It's calculated on the fly from `stop_activities` (activity costs) + `trip_stops` (a flat per-day stay/transport estimate). Storing it separately risks going stale the moment someone edits an activity. See "Budget calculation" section at the bottom.

---

## Table: `users`

Purpose: Auth + profile. If using Supabase Auth, this table is a *profile extension* — Supabase's built-in `auth.users` handles email/password, and this table stores app-specific fields keyed to that user's id.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | Matches `auth.users.id` if using Supabase Auth |
| `email` | text, unique, not null | |
| `display_name` | text | |
| `avatar_url` | text, nullable | |
| `created_at` | timestamptz, default now() | |

**Used by:** Screen 1 (Login/Signup), Screen 12 (Profile/Settings)

---

## Table: `cities`

Purpose: Master catalog of cities available to add to a trip. Seed this with ~15–20 real cities before demo day — this is what makes City Search (Screen 7) look real instead of empty.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `name` | text, not null | e.g. "Kyoto" |
| `country` | text, not null | e.g. "Japan" |
| `region` | text, nullable | e.g. "East Asia" — used for filter-by-region |
| `cost_index` | integer | 1 (cheap) – 5 (expensive). Fake/estimate is fine. |
| `popularity_score` | integer | 1–100, used to sort "recommended destinations" on Dashboard |
| `image_url` | text, nullable | For city cards |

**Used by:** Screen 7 (City Search), Screen 2 (Dashboard recommendations), Screen 5 (Itinerary Builder — picking a city for a stop)

---

## Table: `activities`

Purpose: Master catalog of things to do, scoped to a city.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `city_id` | uuid, FK → `cities.id`, not null | |
| `name` | text, not null | e.g. "Fushimi Inari Hike" |
| `category` | text, not null | e.g. "sightseeing", "food", "adventure", "culture" — used for filter |
| `description` | text, nullable | |
| `image_url` | text, nullable | |
| `estimated_cost` | numeric(10,2), not null, default 0 | In a single fixed currency (see note below) |
| `duration_minutes` | integer, nullable | For scheduling/display |

**Used by:** Screen 8 (Activity Search), Screen 5 (Itinerary Builder), Screen 9 (Budget Breakdown — cost source)

> **Currency note:** Pick ONE currency for the whole hackathon (e.g. USD or INR) and hardcode it in the UI. Do not build multi-currency conversion — it's a time sink with zero demo value.

---

## Table: `trips`

Purpose: A single trip container created by a user.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `user_id` | uuid, FK → `users.id`, not null | Owner |
| `name` | text, not null | e.g. "Japan Spring 2026" |
| `description` | text, nullable | |
| `start_date` | date, not null | |
| `end_date` | date, not null | |
| `cover_photo_url` | text, nullable | |
| `is_public` | boolean, default false | Powers the share toggle |
| `public_slug` | text, unique, nullable | Random short string, generated when `is_public` is set true. Used in the shareable URL. |
| `created_at` | timestamptz, default now() | |
| `updated_at` | timestamptz, default now() | |

**Used by:** Screen 2 (Dashboard), Screen 3 (Create Trip), Screen 4 (My Trips list), Screen 11 (Shared/Public View — looked up by `public_slug`)

---

## Table: `trip_stops`

Purpose: One city-leg of a trip. This is what makes a trip "multi-city" — a trip with 3 cities has 3 rows here, ordered.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `trip_id` | uuid, FK → `trips.id`, not null | |
| `city_id` | uuid, FK → `cities.id`, not null | |
| `order_index` | integer, not null | 0, 1, 2... controls display/travel order |
| `start_date` | date, not null | Must fall within parent trip's date range |
| `end_date` | date, not null | |
| `stay_cost_per_night` | numeric(10,2), default 0 | Flat estimate for accommodation — keeps budget calc simple |
| `transport_cost_to_here` | numeric(10,2), default 0 | Flat estimate for getting from previous stop to this one (0 for first stop) |

**Used by:** Screen 5 (Itinerary Builder — the core CRUD), Screen 6 (Itinerary View), Screen 9 (Budget), Screen 10 (Calendar/Timeline)

---

## Table: `stop_activities`

Purpose: Join table — which activities are attached to which stop, plus scheduling info specific to that trip (not the catalog).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `trip_stop_id` | uuid, FK → `trip_stops.id`, not null | |
| `activity_id` | uuid, FK → `activities.id`, not null | |
| `scheduled_date` | date, not null | Which day within the stop this happens |
| `scheduled_time` | time, nullable | Optional — for day-wise ordering in Itinerary View |
| `order_index` | integer, default 0 | Order within the day |
| `custom_cost_override` | numeric(10,2), nullable | If set, use this instead of `activities.estimated_cost` (lets user edit cost per-trip without touching the catalog) |

**Used by:** Screen 5 (Itinerary Builder), Screen 6 (Itinerary View — day-wise layout), Screen 9 (Budget Breakdown), Screen 10 (Calendar/Timeline)

---

## Budget calculation (computed, not stored)

For a given trip, at query/render time:

```
total_activity_cost = SUM(
  COALESCE(stop_activities.custom_cost_override, activities.estimated_cost)
) across all stop_activities joined to this trip's stops

total_stay_cost = SUM(trip_stops.stay_cost_per_night * nights_in_that_stop)

total_transport_cost = SUM(trip_stops.transport_cost_to_here)

grand_total = total_activity_cost + total_stay_cost + total_transport_cost
```

Breakdown by category (for the pie chart in Screen 9) groups `total_activity_cost` by `activities.category`, plus separate slices for "Stay" and "Transport."

This means Screen 9 (Budget) is really just a smart SQL query / view, not new tables. If you have time later, wrap it in a Postgres VIEW called `trip_budget_summary` — but a plain join query is fine for 8 hours.

---

## Minimal seed data checklist (do this in Hour 1, in parallel with schema setup)

- [ ] 15–20 cities across 3–4 regions (mix cost_index values so filters look meaningful)
- [ ] 5–8 activities per city, spread across at least 3 categories
- [ ] 1 fully fleshed-out demo trip with 2–3 stops and activities scheduled across multiple days — **this is what you'll actually demo**, build it by hand, don't rely on judges clicking through an empty state

---

---

## Module Additions (SRS Version 1.0)

### Table: `trip_expenses` (Module 4.4: Actual Expense Tracking)
| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | `gen_random_uuid()` |
| `trip_id` | uuid, FK → `trips.id` | Cascading delete |
| `user_id` | uuid, FK → `users.id` | Set null on delete |
| `amount` | numeric(10,2), not null | Actual expense logged |
| `category` | text, default 'other' | 'food', 'transport', 'stay', 'sightseeing', 'shopping', 'other' |
| `date` | date, not null | Expense date |
| `description` | text, nullable | Optional notes/memo |
| `created_at` | timestamptz, default now() | |

### Table: `bookings` (Module 4.5: Accommodation & Transportation Booking)
| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | `gen_random_uuid()` |
| `trip_id` | uuid, FK → `trips.id` | Cascading delete |
| `user_id` | uuid, FK → `users.id` | Optional purchaser |
| `type` | text, not null | 'accommodation' or 'transportation' |
| `provider_name` | text, not null | e.g. "Hyatt", "Emirates" |
| `booking_reference` | text, nullable | Confirmation code / PNR |
| `start_date` | date, not null | Check-in or departure date |
| `end_date` | date, not null | Check-out or arrival date |
| `cost` | numeric(10,2), default 0 | Total booking price |
| `notes` | text, nullable | Reservation notes |
| `created_at` | timestamptz, default now() | |

### Tables: `trip_members`, `shared_expenses`, `shared_expense_splits` (Module 4.6: Group Trips)
- `trip_members`: Links invited registered users to a trip with roles ('organizer', 'member') and statuses.
- `shared_expenses`: Tracks group payments, the payer (`payer_id`), and split methodology ('equal' or 'custom').
- `shared_expense_splits`: Granular per-member share allocations used by the debt settlement algorithm to compute `who owes whom`.

### Supabase Realtime Setup
All module tables are added to `supabase_realtime` publication in `MODULES_SCHEMA.sql` to emit WebSocket events on INSERT, UPDATE, and DELETE.

---

## Quick reference: who touches what

| Table | A (Auth) | B (Trip Core) | C (Itinerary Builder) | D (Viz/Sharing) |
|---|---|---|---|---|
| `users` | ✅ write | read | | |
| `cities` | seed | read | read/write (via stop) | read |
| `activities` | seed | | read/write (via stop_activity) | read |
| `trips` | | ✅ write | read | read (public slug) |
| `trip_stops` | | | ✅ write | read |
| `stop_activities` | | | ✅ write | read |
