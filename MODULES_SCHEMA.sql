-- ========================================================
-- GLOBETROTTER SRS MODULES SCHEMA
-- Modules:
--   4.4: Budget Estimation & Actual Expense Tracking (FR-13 to FR-16)
--   4.5: Accommodation & Transportation Bookings (FR-17 to FR-20)
--   4.6: Group Trip Planning & Expense Sharing (FR-21 to FR-24)
--
-- Instructions: Run this in Supabase SQL Editor -> New Query -> Run
-- ========================================================

-- Ensure budget column exists on trips table (FR-13)
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS budget NUMERIC(10,2) DEFAULT 0;

-- --------------------------------------------------------
-- MODULE 4.4: ACTUAL TRIP EXPENSES (FR-14 to FR-16)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trip_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------
-- MODULE 4.5: ACCOMMODATION & TRANSPORTATION BOOKINGS (FR-17 to FR-20)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('accommodation', 'transportation')),
  provider_name TEXT NOT NULL,
  booking_reference TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------
-- MODULE 4.6: GROUP TRIP MEMBERS & PARTICIPANTS (FR-21, FR-22)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trip_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  status TEXT DEFAULT 'accepted',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trip_id, user_id)
);

-- --------------------------------------------------------
-- MODULE 4.6: SHARED EXPENSES (FR-23)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shared_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  payer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  category TEXT DEFAULT 'food',
  split_method TEXT NOT NULL DEFAULT 'equal',
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------
-- MODULE 4.6: SHARED EXPENSE SPLITS (FR-23, FR-24)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shared_expense_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES public.shared_expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL
);

-- --------------------------------------------------------
-- PERMISSIONS & REALTIME/RLS ACCESS
-- --------------------------------------------------------
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

ALTER TABLE public.trip_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_expense_splits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_trip_expenses" ON public.trip_expenses;
CREATE POLICY "allow_all_trip_expenses" ON public.trip_expenses FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_bookings" ON public.bookings;
CREATE POLICY "allow_all_bookings" ON public.bookings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_trip_members" ON public.trip_members;
CREATE POLICY "allow_all_trip_members" ON public.trip_members FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_shared_expenses" ON public.shared_expenses;
CREATE POLICY "allow_all_shared_expenses" ON public.shared_expenses FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_shared_expense_splits" ON public.shared_expense_splits;
CREATE POLICY "allow_all_shared_expense_splits" ON public.shared_expense_splits FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------------
-- ENABLE SUPABASE REALTIME REPLICATION (CRITICAL FOR LIVE WS UPDATES)
-- --------------------------------------------------------
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_expenses;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_members;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.shared_expenses;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.shared_expense_splits;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- RELOAD POSTGREST SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
