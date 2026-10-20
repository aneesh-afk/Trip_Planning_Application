# GlobeTrotter

> A personalized, intelligent, and collaborative platform for planning multi-city trips.

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Status](https://img.shields.io/badge/Status-Hackathon_Ready-success?style=for-the-badge)

## Overview

GlobeTrotter was built to solve a glaring problem in the modern travel landscape: multi-city travel planning is fragmented across chaotic notes apps, messy spreadsheets, and disconnected travel forums. Planning a complex journey should feel as exciting as the trip itself, not like a chore. GlobeTrotter unifies itinerary building, cost tracking, and destination discovery into a single, cohesive, premium experience.

Designed for both the meticulously organized planner and the spontaneous traveler, GlobeTrotter stands apart from generic trip-planning apps by rooting its experience in real data. Our itineraries are fully cost-aware, our activities catalog helps you discover what to do, and our community tab lets you browse, share, and draw inspiration from public trips planned by fellow travelers.

Backed by a powerful admin analytics engine and row-level secured database architecture, GlobeTrotter is a complete ecosystem for the modern explorer.

## Features

- **Trip Planning**
  - Intuitive multi-city itinerary builder
  - Dual List & Timeline views for day-to-day planning
  - Drag-and-drop to reorder activities effortlessly
  - Smart idle-gap detection and scheduling conflict warnings
- **Budget Tracking**
  - Granular per-day and per-category cost breakdowns
  - Synthetic estimates for stays and inter-city transportation
  - Trip-level budget targets and overbudget alerts powered by real-time visualizations
- **Discovery**
  - Unified search hub to explore destinations and activities
  - Editorially-curated "Recommended Destinations"
- **Community**
  - Browse public trips shared by other travelers
  - Draw inspiration from real community-sourced itineraries
- **Admin**
  - Platform-wide analytics dashboards
  - Comprehensive user, city, and activity management capabilities

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React (Vite) + React Router |
| **Backend & Auth** | Supabase (PostgreSQL, Supabase Auth) |
| **Data Security** | Supabase Row-Level Security (RLS) |
| **Charts & Viz** | Recharts |
| **Styling** | Vanilla CSS / Custom Utility System (Tailwind-inspired) |
| **Icons & Assets** | SVG Icons, Custom Brand Tokens |


## Project Structure

```
e:\Odoo_Hack\
├── public/                # Static assets, fonts, favicons
├── src/
│   ├── components/        # UI components organized by feature domain
│   │   ├── admin/         # Admin dashboard components
│   │   ├── budget/        # Financial breakdown components
│   │   ├── community/     # Social feed and shared trip components
│   │   ├── itinerary/     # Core trip builder, timeline, and list views
│   │   └── profile/       # User profile and trip management components
│   ├── hooks/             # Custom React hooks (e.g., useItinerary, useTrips)
│   ├── lib/               # Utility libraries (Supabase client setup)
│   ├── pages/             # Top-level route components
│   ├── utils/             # Helper functions (e.g., category colors)
│   ├── App.jsx            # Core routing and authentication guards
│   ├── index.css          # Global styles, variables, and CSS utilities
│   └── main.jsx           # React DOM entry point
├── DATABASE_SCHEMA.md     # Core database architecture documentation
├── COMPONENT_CONTRACTS.md # Component API specifications
├── package.json           # Dependencies and scripts
└── vite.config.js         # Vite configuration
```

## Getting Started

### Prerequisites

Ensure you have the following installed before proceeding:
- Node.js (v18 or newer)
- npm or yarn
- A Supabase account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/dipesh-23/GlobeTrotter-ForOdooHack.git
   cd GlobeTrotter-ForOdooHack
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Copy the example environment file and fill in your Supabase details:
   ```bash
   cp .env.example .env
   ```

4. **Set up the Database**
   - Run the SQL migration scripts located in your Supabase SQL Editor to set up the `users`, `trips`, `trip_stops`, `cities`, `activities`, and `stop_activities` tables.
   - Seed the database with initial catalog data for cities and activities.

5. **Start the development server**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`.

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL | `https://xyz.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase public anonymous key | `eyJhbGci...` |

*(Note: Never commit your actual `.env` file to version control. An `.env.example` file is provided for reference.)*

## Database Schema Highlights

GlobeTrotter relies on a robust relational Postgres schema:
- **`users`**: Profiles extending Supabase Auth, storing display names and avatars.
- **`trips`**: The core trip container created by users, tracking dates and public/private status.
- **`trip_stops`**: Ordered legs of a trip linking to the `cities` catalog.
- **`activities` & `cities`**: The master catalogs shared across all users.
- **`stop_activities`**: Join table binding catalog activities to a specific trip stop, handling custom scheduling and cost overrides.

**Security:** Strict Row-Level Security (RLS) policies are enforced across all tables ensuring users can only read/write their own trips, while still allowing the Community tab to query `is_public` trips safely. The Admin Dashboard relies on an enforced backend policy to gate analytics access.

## Roadmap / Future Work

- [ ] **"Duplicate Trip" Feature**: Allow users to clone public community trips into their own workspace with one click.
- [ ] **Cross-Day Drag-and-Drop**: Refine the itinerary builder to allow dragging activities seamlessly across different days.
- [ ] **Personalized Preferences**: User-configurable idle-gap thresholds persisted to their profile.
- [ ] **By-City Budgeting**: Add a "By City" budget breakdown slice for complex multi-city trips.

## Team / Contributors

This project was built for Odoo x LDCE Ahmedabad Hackathon 26
