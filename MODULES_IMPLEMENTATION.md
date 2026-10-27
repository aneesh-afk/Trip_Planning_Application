# Trip Planning Application (Globetrotter) — Implemented Modules Source Code

This document contains the source code for all modules implemented for the **Trip Planning Application**, segregated cleanly by functional module and file path.

---

## Table of Contents
1. [Database Schema & Realtime Replication (Supabase)](#1-database-schema--realtime-replication-supabase)
   - `MODULES_SCHEMA.sql`
2. [Module 4.4: Budget & Expense Tracking Module (FR-13 to FR-16)](#2-module-44-budget--expense-tracking-module-fr-13-to-fr-16)
   - `src/hooks/useTripExpenses.js`
   - `src/components/budget/ActualExpensesTab.jsx`
   - `src/components/budget/LogExpenseModal.jsx`
   - `src/components/budget/BudgetSummaryRow.jsx`
   - `src/pages/BudgetView.jsx`
3. [Module 4.5: Accommodation & Transportation Bookings Management (FR-17 to FR-20)](#3-module-45-accommodation--transportation-bookings-management-fr-17-to-fr-20)
   - `src/hooks/useBookings.js`
   - `src/components/budget/BookingsTab.jsx`
   - `src/components/budget/AddBookingModal.jsx`
4. [Module 4.6: Group Trip & Expense Sharing Module (FR-21 to FR-24)](#4-module-46-group-trip--expense-sharing-module-fr-21-to-fr-24)
   - `src/hooks/useGroupTrip.js`
   - `src/pages/GroupTripView.jsx`
   - `src/components/group/InviteMemberModal.jsx`
   - `src/components/group/AddSharedExpenseModal.jsx`
5. [Core Algorithmic & Validation Units](#5-core-algorithmic--validation-units)
   - `src/utils/tripCalculations.js`
6. [Unit Testing Suite](#6-unit-testing-suite)
   - `tests/tripUnits.test.js`

---

## 1. Database Schema & Realtime Replication (Supabase)

### File: `MODULES_SCHEMA.sql`
```sql
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
```

---

## 2. Module 4.4: Budget & Expense Tracking Module (FR-13 to FR-16)

### File: `src/hooks/useTripExpenses.js`
```javascript
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useTripExpenses(tripId, tripBudget = 0) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDbSynced, setIsDbSynced] = useState(true);

  // Local storage backup key
  const storageKey = `gt_trip_expenses_${tripId}`;

  const loadFromStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, [storageKey]);

  const saveToStorage = useCallback((list) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to save expenses to localStorage:', e);
    }
  }, [storageKey]);

  // Fetch expenses
  const fetchExpenses = useCallback(async () => {
    if (!tripId) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: dbErr } = await supabase
        .from('trip_expenses')
        .select('*')
        .eq('trip_id', tripId)
        .order('date', { ascending: false });

      if (dbErr) {
        // Fallback to localStorage if table doesn't exist yet
        console.info('trip_expenses table not detected in DB, using local storage cache.');
        setIsDbSynced(false);
        setExpenses(loadFromStorage());
      } else {
        setIsDbSynced(true);
        setExpenses(data || []);
        saveToStorage(data || []);
      }
    } catch (err) {
      console.warn('DB fetch error, falling back to local storage:', err);
      setIsDbSynced(false);
      setExpenses(loadFromStorage());
    } finally {
      setLoading(false);
    }
  }, [tripId, loadFromStorage, saveToStorage]);

  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  useEffect(() => {
    fetchExpenses();

    if (!tripId) return;

    // Realtime subscription via Supabase Channel (FR-14, FR-15)
    const channel = supabase
      .channel(`rt:trip_expenses:${tripId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trip_expenses',
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            setExpenses((prev) => {
              if (prev.some((e) => e.id === payload.new.id)) return prev;
              const next = [payload.new, ...prev];
              saveToStorage(next);
              return next;
            });
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            setExpenses((prev) => {
              const next = prev.map((e) => (e.id === payload.new.id ? payload.new : e));
              saveToStorage(next);
              return next;
            });
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setExpenses((prev) => {
              const next = prev.filter((e) => e.id !== payload.old.id);
              saveToStorage(next);
              return next;
            });
          }
        }
      )
      .subscribe((status) => {
        setIsRealtimeConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId, fetchExpenses, saveToStorage]);

  // Add expense (FR-14)
  const addExpense = async ({ amount, category, date, description, userId }) => {
    const newEntry = {
      id: crypto.randomUUID(),
      trip_id: tripId,
      user_id: userId || null,
      amount: Number(amount),
      category: category || 'other',
      date: date || new Date().toISOString().split('T')[0],
      description: description?.trim() || null,
      created_at: new Date().toISOString(),
    };

    // Optimistically update local state
    setExpenses((prev) => {
      const next = [newEntry, ...prev];
      saveToStorage(next);
      return next;
    });

    try {
      const { data, error: dbErr } = await supabase
        .from('trip_expenses')
        .insert([newEntry])
        .select()
        .single();

      if (!dbErr && data) {
        setIsDbSynced(true);
        setExpenses((prev) => {
          const next = prev.map((item) => (item.id === newEntry.id ? data : item));
          saveToStorage(next);
          return next;
        });
        return data;
      }
    } catch (err) {
      console.info('Saved locally. Run MODULES_SCHEMA.sql in Supabase to sync remotely.', err);
    }

    return newEntry;
  };

  // Update expense
  const updateExpense = async (expenseId, updates) => {
    setExpenses((prev) => {
      const next = prev.map((exp) => (exp.id === expenseId ? { ...exp, ...updates } : exp));
      saveToStorage(next);
      return next;
    });

    try {
      await supabase
        .from('trip_expenses')
        .update(updates)
        .eq('id', expenseId);
    } catch (err) {
      console.warn('Update saved locally only:', err);
    }
  };

  // Delete expense
  const deleteExpense = async (expenseId) => {
    setExpenses((prev) => {
      const next = prev.filter((exp) => exp.id !== expenseId);
      saveToStorage(next);
      return next;
    });

    try {
      await supabase
        .from('trip_expenses')
        .delete()
        .eq('id', expenseId);
    } catch (err) {
      console.warn('Delete saved locally only:', err);
    }
  };

  // Computations (FR-15, FR-16)
  const totalActualExpenses = useMemo(() => {
    return expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [expenses]);

  const expensesByCategory = useMemo(() => {
    const map = {};
    expenses.forEach((item) => {
      const cat = item.category || 'other';
      map[cat] = (map[cat] || 0) + (Number(item.amount) || 0);
    });
    return map;
  }, [expenses]);

  const remainingBalance = (tripBudget || 0) - totalActualExpenses;
  const isOverBudget = tripBudget > 0 && totalActualExpenses > tripBudget;
  const overBudgetAmount = isOverBudget ? totalActualExpenses - tripBudget : 0;
  const percentUsed = tripBudget > 0 ? Math.round((totalActualExpenses / tripBudget) * 100) : 0;

  return {
    expenses,
    loading,
    error,
    isDbSynced,
    isRealtimeConnected,
    totalActualExpenses,
    expensesByCategory,
    remainingBalance,
    isOverBudget,
    overBudgetAmount,
    percentUsed,
    addExpense,
    updateExpense,
    deleteExpense,
    refetch: fetchExpenses,
  };
}
```

### File: `src/components/budget/ActualExpensesTab.jsx`
```jsx
import React, { useState, useMemo } from 'react';
import { Trash2, Plus, Calendar, Tag, Search, AlertTriangle, ArrowUpDown } from 'lucide-react';

const CATEGORY_MAP = {
  food: { label: 'Food & Dining', icon: '🍽️', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  transport: { label: 'Transport', icon: '🚆', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  stay: { label: 'Stay / Hotel', icon: '🏨', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
  sightseeing: { label: 'Activities', icon: '📸', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  shopping: { label: 'Shopping', icon: '🛍️', color: 'bg-pink-500/10 text-pink-600 border-pink-500/20' },
  other: { label: 'Other', icon: '💳', color: 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20' },
};

export default function ActualExpensesTab({ 
  expenses = [], 
  onDeleteExpense, 
  onOpenLogModal, 
  tripBudget = 0 
}) {
  const [filterCategory, setFilterCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');

  // Filter & sort
  const filtered = useMemo(() => {
    return expenses
      .filter((exp) => {
        if (filterCategory !== 'all' && exp.category !== filterCategory) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchDesc = exp.description?.toLowerCase().includes(q);
          const matchCat = exp.category?.toLowerCase().includes(q);
          if (!matchDesc && !matchCat) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date-desc') return new Date(b.date) - new Date(a.date);
        if (sortBy === 'date-asc') return new Date(a.date) - new Date(b.date);
        if (sortBy === 'amount-desc') return b.amount - a.amount;
        if (sortBy === 'amount-asc') return a.amount - b.amount;
        return 0;
      });
  }, [expenses, filterCategory, search, sortBy]);

  const totalFiltered = filtered.reduce((sum, item) => sum + Number(item.amount), 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Top Filter and Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-surface p-4 rounded-2xl border border-border">
        {/* Search */}
        <div className="relative flex-1 max-w-[340px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search expenses by note..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-bg border border-border rounded-xl text-[13px] text-ink placeholder:text-muted focus:outline-none focus:border-route"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors shrink-0 ${
              filterCategory === 'all'
                ? 'bg-ink text-surface'
                : 'bg-bg text-muted hover:text-ink border border-border'
            }`}
          >
            All ({expenses.length})
          </button>
          {Object.entries(CATEGORY_MAP).map(([key, meta]) => {
            const count = expenses.filter((e) => e.category === key).length;
            if (count === 0 && filterCategory !== key) return null;
            return (
              <button
                key={key}
                onClick={() => setFilterCategory(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors shrink-0 ${
                  filterCategory === key
                    ? 'bg-route text-white'
                    : 'bg-bg text-muted hover:text-ink border border-border'
                }`}
              >
                <span>{meta.icon}</span>
                <span>{meta.label}</span>
                <span className="opacity-70 text-[11px]">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Log Expense Button */}
        <button
          onClick={onOpenLogModal}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-route text-white rounded-xl text-[13px] font-semibold hover:bg-route/90 transition-colors shrink-0 shadow-sm"
        >
          <Plus size={16} />
          Log Expense
        </button>
      </div>

      {/* Expenses Table / Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-surface border border-border rounded-2xl p-8">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-route/10 text-route flex items-center justify-center text-2xl mb-4">
            🧾
          </div>
          <h3 className="font-['Fraunces'] font-semibold text-[18px] text-ink mb-1">
            {expenses.length === 0 ? 'No expenses recorded yet' : 'No matching expenses'}
          </h3>
          <p className="text-[13px] text-muted max-w-sm mx-auto mb-6">
            {expenses.length === 0
              ? 'Keep track of real money spent on food, rides, stays, or souvenirs during your trip.'
              : 'Try clearing your search or category filter.'}
          </p>
          <button
            onClick={onOpenLogModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-route text-white rounded-xl text-[13px] font-semibold hover:bg-route/90 transition-colors shadow-sm"
          >
            <Plus size={16} />
            Record Your First Expense
          </button>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
          {/* Header */}
          <div className="px-6 py-4 border-b border-border bg-bg/50 flex items-center justify-between">
            <span className="text-[12px] font-semibold text-muted font-['IBM_Plex_Mono'] uppercase tracking-wider">
              {filtered.length} Expense Entry{filtered.length > 1 ? 's' : ''} • Total: ₹{totalFiltered.toLocaleString()}
            </span>

            {/* Sort Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-muted font-['IBM_Plex_Mono']">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-surface border border-border text-[12px] rounded-lg px-2 py-1 text-ink focus:outline-none"
              >
                <option value="date-desc">Newest Date</option>
                <option value="date-asc">Oldest Date</option>
                <option value="amount-desc">Highest Amount</option>
                <option value="amount-asc">Lowest Amount</option>
              </select>
            </div>
          </div>

          {/* List */}
          <div className="divide-y divide-border">
            {filtered.map((item) => {
              const catMeta = CATEGORY_MAP[item.category] || CATEGORY_MAP.other;
              return (
                <div
                  key={item.id}
                  className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-bg/40 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-bg border border-border shrink-0">
                      {catMeta.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-[14px] text-ink truncate">
                          {item.description || catMeta.label}
                        </span>
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-full font-medium border ${catMeta.color}`}
                        >
                          {catMeta.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[12px] text-muted font-['IBM_Plex_Mono']">
                        <Calendar size={12} />
                        <span>{item.date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <span className="font-['Fraunces'] font-bold text-[18px] text-ink">
                      ₹{Number(item.amount).toLocaleString()}
                    </span>
                    {onDeleteExpense && (
                      <button
                        onClick={() => onDeleteExpense(item.id)}
                        title="Delete expense"
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
```

### File: `src/components/budget/LogExpenseModal.jsx`
```jsx
import React, { useState } from 'react';
import { X, Receipt, Tag, Calendar, FileText } from 'lucide-react';

const CATEGORIES = [
  { id: 'food', label: 'Food & Dining', icon: '🍽️', color: 'text-amber-600 bg-amber-500/10 border-amber-500/20' },
  { id: 'transport', label: 'Transport', icon: '🚆', color: 'text-blue-600 bg-blue-500/10 border-blue-500/20' },
  { id: 'stay', label: 'Stay / Lodging', icon: '🏨', color: 'text-purple-600 bg-purple-500/10 border-purple-500/20' },
  { id: 'sightseeing', label: 'Activities', icon: '📸', color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️', color: 'text-pink-600 bg-pink-500/10 border-pink-500/20' },
  { id: 'other', label: 'Other / Misc', icon: '💳', color: 'text-zinc-600 bg-zinc-500/10 border-zinc-500/20' },
];

export default function LogExpenseModal({ isOpen, onClose, onSave, tripDates }) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [date, setDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid expense amount greater than 0.');
      return;
    }

    if (!date) {
      setError('Please choose the expense date.');
      return;
    }

    setSubmitting(true);
    try {
      await onSave({
        amount: parsedAmount,
        category,
        date,
        description: description.trim() || undefined,
      });
      setAmount('');
      setDescription('');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to record expense. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-[480px] bg-surface border border-border rounded-[20px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-surface/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-route/10 text-route flex items-center justify-center">
              <Receipt size={20} />
            </div>
            <div>
              <h2 className="font-['Fraunces'] font-semibold text-[19px] text-ink leading-tight">
                Log Actual Expense
              </h2>
              <p className="text-[12px] text-muted">
                Track real spending against your trip budget
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-border/40 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          {error && (
            <div className="p-3 text-[13px] text-danger bg-danger/10 border border-danger/20 rounded-xl">
              {error}
            </div>
          )}

          {/* Amount Input */}
          <div>
            <label className="block text-[12px] font-semibold text-muted font-['IBM_Plex_Mono'] uppercase tracking-wider mb-2">
              Amount Spent (₹) *
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-[22px] font-bold text-muted select-none">
                ₹
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
                className="w-full pl-10 pr-4 py-3 bg-bg border border-border rounded-xl text-[24px] font-bold text-ink font-['Fraunces'] focus:outline-none focus:border-route transition-colors"
              />
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-[12px] font-semibold text-muted font-['IBM_Plex_Mono'] uppercase tracking-wider mb-2">
              Category *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[13px] font-medium transition-all text-left ${
                    category === cat.id
                      ? `${cat.color} font-semibold ring-2 ring-route/20`
                      : 'border-border bg-bg/50 text-muted hover:text-ink hover:border-border/80'
                  }`}
                >
                  <span className="text-base">{cat.icon}</span>
                  <span className="truncate">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date Input */}
          <div>
            <label className="block text-[12px] font-semibold text-muted font-['IBM_Plex_Mono'] uppercase tracking-wider mb-2">
              Date *
            </label>
            <div className="relative">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-[14px] text-ink font-['IBM_Plex_Mono'] focus:outline-none focus:border-route"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[12px] font-semibold text-muted font-['IBM_Plex_Mono'] uppercase tracking-wider mb-2">
              Description / Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Traditional Rajasthani dinner, Uber to airport"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-[14px] text-ink placeholder:text-muted/60 focus:outline-none focus:border-route"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-border text-[14px] font-medium text-muted hover:text-ink hover:bg-border/30 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-route text-white text-[14px] font-semibold shadow-sm hover:bg-route/90 transition-all disabled:opacity-50"
            >
              {submitting ? 'Recording...' : 'Record Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

### File: `src/components/budget/BudgetSummaryRow.jsx`
```jsx
import React from 'react';
import { AlertTriangle, Plus, Receipt } from 'lucide-react';

export default function BudgetSummaryRow({ 
  totalCost = 0, 
  actualExpensesTotal = 0,
  tripLength = 1, 
  budgetTarget, 
  onSetBudget,
  onLogExpense 
}) {
  const effectiveSpend = actualExpensesTotal > 0 ? actualExpensesTotal : totalCost;
  const avgCostPerDay = tripLength > 0 ? Math.round(effectiveSpend / tripLength) : effectiveSpend;
  const isOverBudget = budgetTarget && actualExpensesTotal > budgetTarget;
  const overAmount = isOverBudget ? actualExpensesTotal - budgetTarget : 0;
  const remaining = budgetTarget ? budgetTarget - actualExpensesTotal : null;
  const pctUsed = budgetTarget ? Math.min(100, Math.round((actualExpensesTotal / budgetTarget) * 100)) : 0;

  return (
    <div className="bg-bg border-b border-border py-[24px]">
      <div className="max-w-[1000px] mx-auto w-full px-[24px] flex flex-col gap-[20px]">
        
        {/* Main Stats Row */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-[24px]">
          
          {/* Spend Numbers */}
          <div className="flex items-center gap-[32px] flex-wrap">
            {/* Actual Recorded Spend */}
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted font-['IBM_Plex_Mono'] mb-[4px] flex items-center gap-1.5">
                <Receipt size={13} className="text-route" /> Actual Spent
              </span>
              <div className="flex items-baseline gap-[10px]">
                <span className={`font-['Fraunces'] font-bold text-[36px] leading-none ${isOverBudget ? 'text-danger' : 'text-ink'}`}>
                  ₹{actualExpensesTotal.toLocaleString()}
                </span>
                <span className="text-[13px] text-muted font-medium font-['IBM_Plex_Mono']">
                  ~₹{avgCostPerDay.toLocaleString()}/day
                </span>
              </div>
            </div>

            {/* Itinerary Planned Cost */}
            <div className="flex flex-col pl-[24px] border-l border-border">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted font-['IBM_Plex_Mono'] mb-[4px]">
                Estimated Plan
              </span>
              <span className="font-['Fraunces'] font-semibold text-[22px] text-muted leading-none">
                ₹{totalCost.toLocaleString()}
              </span>
            </div>

            {/* Remaining Balance if budget set */}
            {budgetTarget > 0 && (
              <div className="flex flex-col pl-[24px] border-l border-border">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted font-['IBM_Plex_Mono'] mb-[4px]">
                  Remaining
                </span>
                <span className={`font-['Fraunces'] font-semibold text-[22px] leading-none ${remaining < 0 ? 'text-danger' : 'text-success'}`}>
                  {remaining < 0 ? `-₹${Math.abs(remaining).toLocaleString()}` : `₹${remaining.toLocaleString()}`}
                </span>
              </div>
            )}
          </div>

          {/* Budget Progress & Actions */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex-1 md:w-[320px]">
              {budgetTarget ? (
                <div className="flex flex-col gap-[6px]">
                  <div className="flex items-center justify-between text-[12px] font-medium font-['IBM_Plex_Mono']">
                    <span className={isOverBudget ? 'text-danger font-semibold' : 'text-ink'}>
                      Target: ₹{budgetTarget.toLocaleString()}
                    </span>
                    <span className={isOverBudget ? 'text-danger font-semibold' : 'text-muted'}>
                      {pctUsed}%
                    </span>
                  </div>
                  <div className="h-[6px] w-full bg-border rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 rounded-full ${isOverBudget ? 'bg-danger' : 'bg-route'}`} 
                      style={{ width: `${Math.min(100, (actualExpensesTotal / budgetTarget) * 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <button 
                      onClick={onSetBudget}
                      className="text-[11px] text-muted hover:text-ink font-['IBM_Plex_Mono'] underline transition-colors self-start"
                    >
                      Adjust Target
                    </button>
                    {onLogExpense && (
                      <button 
                        onClick={onLogExpense}
                        className="text-[11px] text-route font-semibold hover:underline flex items-center gap-1"
                      >
                        <Plus size={12} /> Log Spend
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={onSetBudget}
                    className="flex-1 py-[8px] px-[16px] rounded-[10px] border border-dashed border-border hover:border-route text-[13px] font-medium text-muted hover:text-route transition-all text-center"
                  >
                    + Set Trip Target Budget
                  </button>
                  {onLogExpense && (
                    <button 
                      onClick={onLogExpense}
                      className="py-[8px] px-[16px] bg-route text-white rounded-[10px] text-[13px] font-semibold hover:bg-route/90 transition-all flex items-center gap-1.5 shrink-0 shadow-sm"
                    >
                      <Plus size={14} /> Log Spend
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* FR-16: Over Budget Warning Banner */}
        {isOverBudget && (
          <div className="p-[14px] bg-danger/10 border border-danger/30 rounded-xl flex items-center gap-3 text-danger animate-in fade-in duration-300">
            <AlertTriangle size={18} className="shrink-0" />
            <div className="text-[13px] font-medium">
              <span className="font-semibold">Budget Alert (FR-16):</span> Your actual expenditure of <span className="font-bold">₹{actualExpensesTotal.toLocaleString()}</span> exceeds your target budget by <span className="font-bold underline">₹{overAmount.toLocaleString()}</span>. Consider reviewing upcoming activities or logging adjustments.
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
```

---

## 3. Module 4.5: Accommodation & Transportation Bookings Management (FR-17 to FR-20)

### File: `src/hooks/useBookings.js`
```javascript
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './useAuth';

export function useBookings(tripId, tripDates = null) {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDbSynced, setIsDbSynced] = useState(true);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  const storageKey = `gt_bookings_${tripId}`;

  const loadFromStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, [storageKey]);

  const saveToStorage = useCallback((list) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to cache bookings in localStorage:', e);
    }
  }, [storageKey]);

  // Fetch Bookings (FR-17)
  const fetchBookings = useCallback(async () => {
    if (!tripId) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error: dbErr } = await supabase
        .from('bookings')
        .select('*')
        .eq('trip_id', tripId)
        .order('start_date', { ascending: true });

      if (dbErr) {
        setIsDbSynced(false);
        setBookings(loadFromStorage());
      } else {
        setIsDbSynced(true);
        setBookings(data || []);
        saveToStorage(data || []);
      }
    } catch (err) {
      console.warn('DB fetch error for bookings, using local cache:', err);
      setIsDbSynced(false);
      setBookings(loadFromStorage());
    } finally {
      setLoading(false);
    }
  }, [tripId, loadFromStorage, saveToStorage]);

  // Realtime WebSocket Subscription
  useEffect(() => {
    fetchBookings();

    if (!tripId) return;

    const channel = supabase
      .channel(`rt:bookings:${tripId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            setBookings((prev) => {
              if (prev.some((b) => b.id === payload.new.id)) return prev;
              const next = [...prev, payload.new].sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
              saveToStorage(next);
              return next;
            });
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            setBookings((prev) => {
              const next = prev.map((b) => (b.id === payload.new.id ? payload.new : b));
              saveToStorage(next);
              return next;
            });
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setBookings((prev) => {
              const next = prev.filter((b) => b.id !== payload.old.id);
              saveToStorage(next);
              return next;
            });
          }
        }
      )
      .subscribe((status) => {
        setIsRealtimeConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId, fetchBookings, saveToStorage]);

  // FR-18: Date validation helper against trip dates
  const validateBookingDates = useCallback(
    (startDate, endDate) => {
      const warnings = [];
      if (!startDate || !endDate) return warnings;

      if (endDate < startDate) {
        warnings.push('End date cannot be earlier than start date.');
      }

      if (tripDates?.start && startDate < tripDates.start) {
        warnings.push(`Booking begins on ${startDate}, before trip start date (${tripDates.start}).`);
      }

      if (tripDates?.end && endDate > tripDates.end) {
        warnings.push(`Booking ends on ${endDate}, after trip end date (${tripDates.end}).`);
      }

      return warnings;
    },
    [tripDates]
  );

  // FR-17: Add Booking
  const addBooking = async ({
    type,
    provider_name,
    booking_reference,
    start_date,
    end_date,
    cost = 0,
    notes = '',
  }) => {
    const newBooking = {
      id: crypto.randomUUID(),
      trip_id: tripId,
      user_id: user?.id || null,
      type: type || 'accommodation',
      provider_name: provider_name?.trim() || 'Provider',
      booking_reference: booking_reference?.trim() || null,
      start_date,
      end_date,
      cost: Number(cost) || 0,
      notes: notes?.trim() || null,
      created_at: new Date().toISOString(),
    };

    // Optimistic update
    setBookings((prev) => {
      const next = [...prev, newBooking].sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
      saveToStorage(next);
      return next;
    });

    try {
      const { data, error: dbErr } = await supabase
        .from('bookings')
        .insert([newBooking])
        .select()
        .single();

      if (!dbErr && data) {
        setIsDbSynced(true);
        setBookings((prev) => {
          const next = prev.map((item) => (item.id === newBooking.id ? data : item));
          saveToStorage(next);
          return next;
        });
        return data;
      }
    } catch (err) {
      console.info('Booking saved locally:', err);
    }

    return newBooking;
  };

  // FR-20: Update Booking
  const updateBooking = async (bookingId, updates) => {
    setBookings((prev) => {
      const next = prev.map((b) => (b.id === bookingId ? { ...b, ...updates } : b));
      saveToStorage(next);
      return next;
    });

    try {
      await supabase.from('bookings').update(updates).eq('id', bookingId);
    } catch (err) {
      console.warn('Booking update saved locally only:', err);
    }
  };

  // FR-20: Delete Booking
  const deleteBooking = async (bookingId) => {
    setBookings((prev) => {
      const next = prev.filter((b) => b.id !== bookingId);
      saveToStorage(next);
      return next;
    });

    try {
      await supabase.from('bookings').delete().eq('id', bookingId);
    } catch (err) {
      console.warn('Booking deletion saved locally only:', err);
    }
  };

  // FR-19: Aggregations & Calculations
  const totalBookingCost = useMemo(() => {
    return bookings.reduce((sum, b) => sum + (Number(b.cost) || 0), 0);
  }, [bookings]);

  const accommodationBookings = useMemo(() => {
    return bookings.filter((b) => b.type === 'accommodation');
  }, [bookings]);

  const transportationBookings = useMemo(() => {
    return bookings.filter((b) => b.type === 'transportation');
  }, [bookings]);

  const totalAccommodationCost = useMemo(() => {
    return accommodationBookings.reduce((sum, b) => sum + (Number(b.cost) || 0), 0);
  }, [accommodationBookings]);

  const totalTransportationCost = useMemo(() => {
    return transportationBookings.reduce((sum, b) => sum + (Number(b.cost) || 0), 0);
  }, [transportationBookings]);

  return {
    bookings,
    accommodationBookings,
    transportationBookings,
    totalBookingCost,
    totalAccommodationCost,
    totalTransportationCost,
    loading,
    error,
    isDbSynced,
    isRealtimeConnected,
    addBooking,
    updateBooking,
    deleteBooking,
    validateBookingDates,
    refetch: fetchBookings,
  };
}
```

### File: `src/components/budget/BookingsTab.jsx`
```jsx
import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Calendar, Building, Plane, FileText, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function BookingsTab({
  bookings = [],
  onDeleteBooking,
  onOpenAddModal,
  tripDates,
  isRealtimeConnected = false,
}) {
  const [filterType, setFilterType] = useState('all');

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      if (filterType !== 'all' && b.type !== filterType) return false;
      return true;
    });
  }, [bookings, filterType]);

  const totalAccommodation = useMemo(() => {
    return bookings
      .filter((b) => b.type === 'accommodation')
      .reduce((sum, b) => sum + (Number(b.cost) || 0), 0);
  }, [bookings]);

  const totalTransportation = useMemo(() => {
    return bookings
      .filter((b) => b.type === 'transportation')
      .reduce((sum, b) => sum + (Number(b.cost) || 0), 0);
  }, [bookings]);

  const totalCost = totalAccommodation + totalTransportation;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Overview Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Bookings Card */}
        <div className="bg-surface border border-border rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted font-['IBM_Plex_Mono']">
              Total Bookings Cost
            </span>
            <div className="font-['Fraunces'] font-bold text-[24px] text-ink mt-0.5">
              ₹{totalCost.toLocaleString()}
            </div>
            <span className="text-[12px] text-muted font-['IBM_Plex_Mono']">
              {bookings.length} reservation{bookings.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-route/10 text-route flex items-center justify-center text-lg">
            📑
          </div>
        </div>

        {/* Accommodation Card */}
        <div className="bg-surface border border-border rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted font-['IBM_Plex_Mono']">
              Stays & Hotels
            </span>
            <div className="font-['Fraunces'] font-bold text-[24px] text-purple-600 mt-0.5">
              ₹{totalAccommodation.toLocaleString()}
            </div>
            <span className="text-[12px] text-muted font-['IBM_Plex_Mono']">
              {bookings.filter((b) => b.type === 'accommodation').length} stays
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
            <Building size={20} />
          </div>
        </div>

        {/* Transportation Card */}
        <div className="bg-surface border border-border rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted font-['IBM_Plex_Mono']">
              Flights & Trains
            </span>
            <div className="font-['Fraunces'] font-bold text-[24px] text-blue-600 mt-0.5">
              ₹{totalTransportation.toLocaleString()}
            </div>
            <span className="text-[12px] text-muted font-['IBM_Plex_Mono']">
              {bookings.filter((b) => b.type === 'transportation').length} transports
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
            <Plane size={20} />
          </div>
        </div>
      </div>

      {/* Action and Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-surface p-4 rounded-2xl border border-border">
        {/* Category Pills */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
              filterType === 'all'
                ? 'bg-ink text-surface'
                : 'bg-bg text-muted hover:text-ink border border-border'
            }`}
          >
            All Bookings ({bookings.length})
          </button>
          <button
            onClick={() => setFilterType('accommodation')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
              filterType === 'accommodation'
                ? 'bg-purple-600 text-white'
                : 'bg-bg text-muted hover:text-ink border border-border'
            }`}
          >
            <Building size={14} />
            Stays ({bookings.filter((b) => b.type === 'accommodation').length})
          </button>
          <button
            onClick={() => setFilterType('transportation')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
              filterType === 'transportation'
                ? 'bg-blue-600 text-white'
                : 'bg-bg text-muted hover:text-ink border border-border'
            }`}
          >
            <Plane size={14} />
            Transport ({bookings.filter((b) => b.type === 'transportation').length})
          </button>
        </div>

        {/* Realtime Status Badge & Add Button */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-['IBM_Plex_Mono'] text-muted bg-bg px-2.5 py-1 rounded-lg border border-border">
            <span className={`w-2 h-2 rounded-full ${isRealtimeConnected ? 'bg-success animate-pulse' : 'bg-route'}`}></span>
            <span>{isRealtimeConnected ? 'Live Realtime' : 'Supabase Synced'}</span>
          </div>

          <button
            onClick={onOpenAddModal}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-route text-white rounded-xl text-[13px] font-semibold hover:bg-route/90 transition-colors shadow-sm"
          >
            <Plus size={16} />
            Add Booking
          </button>
        </div>
      </div>

      {/* Bookings List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-surface border border-border rounded-2xl p-8">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-route/10 text-route flex items-center justify-center text-2xl mb-4">
            🏨
          </div>
          <h3 className="font-['Fraunces'] font-semibold text-[18px] text-ink mb-1">
            {bookings.length === 0 ? 'No bookings logged yet' : 'No matching bookings'}
          </h3>
          <p className="text-[13px] text-muted max-w-sm mx-auto mb-6">
            Record flight tickets, hotel reservations, or train tickets. All costs will be automatically tracked in your trip budget.
          </p>
          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-route text-white rounded-xl text-[13px] font-semibold hover:bg-route/90 transition-colors shadow-sm"
          >
            <Plus size={16} />
            Add Your First Booking
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((b) => {
            const isAccom = b.type === 'accommodation';
            const isDateOutOfTrip =
              (tripDates?.start && b.start_date < tripDates.start) ||
              (tripDates?.end && b.end_date > tripDates.end);

            return (
              <div
                key={b.id}
                className="bg-surface border border-border rounded-2xl p-5 flex flex-col justify-between gap-4 hover:border-route/50 transition-all shadow-sm"
              >
                <div>
                  {/* Top line: Type badge + reference */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                        isAccom
                          ? 'bg-purple-500/10 text-purple-600 border-purple-500/20'
                          : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                      }`}
                    >
                      {isAccom ? <Building size={12} /> : <Plane size={12} />}
                      {isAccom ? 'Accommodation' : 'Transportation'}
                    </span>

                    {b.booking_reference && (
                      <span className="text-[11px] font-['IBM_Plex_Mono'] font-medium bg-bg border border-border px-2 py-0.5 rounded-lg text-ink">
                        Ref: {b.booking_reference}
                      </span>
                    )}
                  </div>

                  {/* Provider Name */}
                  <h4 className="font-['Fraunces'] font-semibold text-[18px] text-ink mb-1">
                    {b.provider_name}
                  </h4>

                  {/* Dates */}
                  <div className="flex items-center gap-2 text-[12px] text-muted font-['IBM_Plex_Mono'] mt-1">
                    <Calendar size={13} className="text-route" />
                    <span>
                      {b.start_date} {b.start_date !== b.end_date ? `→ ${b.end_date}` : ''}
                    </span>
                  </div>

                  {/* FR-18 Warning if dates outside trip */}
                  {isDateOutOfTrip && (
                    <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 mt-2 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                      <AlertTriangle size={13} className="shrink-0" />
                      <span>Dates fall outside scheduled trip range ({tripDates?.start} to {tripDates?.end})</span>
                    </div>
                  )}

                  {/* Notes */}
                  {b.notes && (
                    <p className="text-[12.5px] text-muted mt-2.5 bg-bg/60 p-2.5 rounded-xl border border-border">
                      {b.notes}
                    </p>
                  )}
                </div>

                {/* Bottom line: Cost + Delete action */}
                <div className="flex items-center justify-between pt-3 border-t border-border mt-1">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-muted font-['IBM_Plex_Mono']">
                      Booking Cost
                    </span>
                    <div className="font-['Fraunces'] font-bold text-[20px] text-ink">
                      ₹{Number(b.cost).toLocaleString()}
                    </div>
                  </div>

                  {onDeleteBooking && (
                    <button
                      onClick={() => onDeleteBooking(b.id)}
                      title="Delete booking"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

### File: `src/components/budget/AddBookingModal.jsx`
```jsx
import React, { useState, useMemo } from 'react';
import { X, Building, Plane, Calendar, DollarSign, FileText, AlertTriangle } from 'lucide-react';

export default function AddBookingModal({ isOpen, onClose, onSave, tripDates }) {
  const [type, setType] = useState('accommodation'); // 'accommodation' | 'transportation'
  const [providerName, setProviderName] = useState('');
  const [reference, setReference] = useState('');
  const [startDate, setStartDate] = useState(() => {
    return tripDates?.start || new Date().toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return tripDates?.end || new Date().toISOString().split('T')[0];
  });
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState(null);

  // FR-18: Real-time date validation warning
  const dateWarnings = useMemo(() => {
    const list = [];
    if (!startDate || !endDate) return list;

    if (endDate < startDate) {
      list.push('Check-out / Arrival date cannot be earlier than start date.');
    }
    if (tripDates?.start && startDate < tripDates.start) {
      list.push(`Warning: Starts on ${startDate}, before trip start date (${tripDates.start}).`);
    }
    if (tripDates?.end && endDate > tripDates.end) {
      list.push(`Warning: Ends on ${endDate}, after trip end date (${tripDates.end}).`);
    }
    return list;
  }, [startDate, endDate, tripDates]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!providerName.trim()) {
      setError('Please provide a booking provider name (e.g. Taj Hotel, IndiGo, Air India).');
      return;
    }
    if (!startDate || !endDate) {
      setError('Please specify both start and end dates.');
      return;
    }
    if (endDate < startDate) {
      setError('End date cannot precede start date.');
      return;
    }

    onSave({
      type,
      provider_name: providerName.trim(),
      booking_reference: reference.trim() || null,
      start_date: startDate,
      end_date: endDate,
      cost: Number(cost) || 0,
      notes: notes.trim() || null,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-[500px] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-bg/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-route/10 text-route flex items-center justify-center">
              {type === 'accommodation' ? <Building size={18} /> : <Plane size={18} />}
            </div>
            <div>
              <h3 className="font-['Fraunces'] font-semibold text-[17px] text-ink">
                Record New Booking
              </h3>
              <p className="text-[12px] text-muted">Module 4.5 • Bookings Management</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-ink hover:bg-bg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {error && (
            <div className="p-3 bg-danger/10 border border-danger/30 rounded-xl text-danger text-[13px]">
              {error}
            </div>
          )}

          {/* Type Toggle */}
          <div>
            <label className="block text-[12px] font-semibold uppercase tracking-wider text-muted font-['IBM_Plex_Mono'] mb-2">
              Booking Category
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('accommodation')}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-[13px] font-medium border transition-all ${
                  type === 'accommodation'
                    ? 'border-purple-500 bg-purple-500/10 text-purple-600 font-semibold shadow-sm'
                    : 'border-border bg-bg text-muted hover:text-ink'
                }`}
              >
                <Building size={16} />
                Accommodation
              </button>
              <button
                type="button"
                onClick={() => setType('transportation')}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-[13px] font-medium border transition-all ${
                  type === 'transportation'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-600 font-semibold shadow-sm'
                    : 'border-border bg-bg text-muted hover:text-ink'
                }`}
              >
                <Plane size={16} />
                Transportation
              </button>
            </div>
          </div>

          {/* Provider Name */}
          <div>
            <label className="block text-[12px] font-semibold uppercase tracking-wider text-muted font-['IBM_Plex_Mono'] mb-1.5">
              Provider / Service Name *
            </label>
            <input
              type="text"
              required
              placeholder={type === 'accommodation' ? 'e.g. Taj Lake Palace, Zostel, Marriott, Airbnb' : 'e.g. Vande Bharat Express, IndiGo, Air India, Uber'}
              value={providerName}
              onChange={(e) => setProviderName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-bg border border-border rounded-xl text-[14px] text-ink focus:outline-none focus:border-route"
            />
          </div>

          {/* Booking Reference */}
          <div>
            <label className="block text-[12px] font-semibold uppercase tracking-wider text-muted font-['IBM_Plex_Mono'] mb-1.5">
              Confirmation / PNR Code (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. PNR-682910, HTL-49219"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-bg border border-border rounded-xl text-[14px] text-ink font-['IBM_Plex_Mono'] focus:outline-none focus:border-route"
            />
          </div>

          {/* Dates in 2 columns */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold uppercase tracking-wider text-muted font-['IBM_Plex_Mono'] mb-1.5">
                {type === 'accommodation' ? 'Check-in Date *' : 'Departure Date *'}
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-bg border border-border rounded-xl text-[13px] text-ink font-['IBM_Plex_Mono'] focus:outline-none focus:border-route"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold uppercase tracking-wider text-muted font-['IBM_Plex_Mono'] mb-1.5">
                {type === 'accommodation' ? 'Check-out Date *' : 'Arrival Date *'}
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-bg border border-border rounded-xl text-[13px] text-ink font-['IBM_Plex_Mono'] focus:outline-none focus:border-route"
              />
            </div>
          </div>

          {/* FR-18 Warning Notification if date conflicts */}
          {dateWarnings.length > 0 && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex flex-col gap-1 text-[12px] text-amber-600 dark:text-amber-400">
              {dateWarnings.map((w, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <AlertTriangle size={13} className="shrink-0" />
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}

          {/* Total Cost */}
          <div>
            <label className="block text-[12px] font-semibold uppercase tracking-wider text-muted font-['IBM_Plex_Mono'] mb-1.5">
              Total Cost (₹) *
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-muted font-['IBM_Plex_Mono'] text-[15px]">₹</span>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full pl-8 pr-3.5 py-2.5 bg-bg border border-border rounded-xl text-[15px] font-semibold text-ink focus:outline-none focus:border-route"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[12px] font-semibold uppercase tracking-wider text-muted font-['IBM_Plex_Mono'] mb-1.5">
              Notes (Room type, seat number, baggage policy)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Deluxe lake view room with complimentary breakfast included."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-bg border border-border rounded-xl text-[13px] text-ink focus:outline-none focus:border-route resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-border flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-border rounded-xl text-[13px] font-medium text-muted hover:text-ink hover:bg-bg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-route text-white rounded-xl text-[13px] font-semibold hover:bg-route/90 transition-colors shadow-sm"
            >
              Save Booking
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

---

## 4. Module 4.6: Group Trip & Expense Sharing Module (FR-21 to FR-24)

### File: `src/hooks/useGroupTrip.js`
```javascript
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './useAuth';

export function useGroupTrip(tripId) {
  const { user } = useAuth();
  const [trip, setTrip] = useState(null);
  const [members, setMembers] = useState([]);
  const [sharedExpenses, setSharedExpenses] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDbSynced, setIsDbSynced] = useState(true);

  // Local storage backup keys
  const storageKey = `gt_group_trip_${tripId}`;

  const loadFromStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : { members: [], sharedExpenses: [] };
    } catch {
      return { members: [], sharedExpenses: [] };
    }
  }, [storageKey]);

  const saveToStorage = useCallback(
    (data) => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(data));
      } catch (e) {
        console.warn('Failed to save group data to localStorage:', e);
      }
    },
    [storageKey]
  );

  // 1. Fetch available users in the system to invite
  const fetchAvailableUsers = useCallback(async () => {
    try {
      const { data, error: uErr } = await supabase
        .from('users')
        .select('id, email, display_name, avatar_url');
      if (!uErr && data) {
        setAvailableUsers(data);
      }
    } catch (err) {
      console.warn('Could not fetch registered users:', err);
    }
  }, []);

  // 2. Fetch Trip and Group Members
  const fetchGroupData = useCallback(async () => {
    if (!tripId) return;
    setLoading(true);
    setError(null);

    try {
      // 2a. Fetch trip details
      const { data: tripData, error: tripErr } = await supabase
        .from('trips')
        .select('*, users:user_id(id, display_name, email)')
        .eq('id', tripId)
        .single();

      if (tripErr) throw tripErr;
      setTrip(tripData);

      // 3. Fetch Trip Members
      let fetchedMembers = [];
      const { data: membersData, error: membersErr } = await supabase
        .from('trip_members')
        .select(`
          id,
          role,
          status,
          joined_at,
          user_id,
          user:users(id, display_name, email, avatar_url)
        `)
        .eq('trip_id', tripId);

      if (membersErr) {
        setIsDbSynced(false);
        const local = loadFromStorage();
        if (local.members?.length) {
          fetchedMembers = local.members;
        } else if (tripData) {
          fetchedMembers = [
            {
              id: `mem-owner-${tripData.user_id}`,
              trip_id: tripId,
              user_id: tripData.user_id,
              role: 'organizer',
              status: 'accepted',
              user: tripData.users || {
                id: tripData.user_id,
                display_name: 'Trip Organizer',
                email: 'organizer@globetrotter.io',
              },
            },
          ];
        } else {
          fetchedMembers = local.members;
        }
      } else {
        setIsDbSynced(true);
        // Make sure trip owner is in members list
        const hasOwner = membersData.some((m) => m.user_id === tripData.user_id);
        if (!hasOwner && tripData.users) {
          const ownerMember = {
            id: `mem-owner-${tripData.user_id}`,
            trip_id: tripId,
            user_id: tripData.user_id,
            role: 'organizer',
            status: 'accepted',
            user: tripData.users,
          };
          fetchedMembers = [ownerMember, ...membersData];
        } else {
          fetchedMembers = membersData;
        }
      }
      setMembers(fetchedMembers);

      // 4. Fetch Shared Expenses
      let fetchedExpenses = [];
      const { data: expData, error: expErr } = await supabase
        .from('shared_expenses')
        .select(`
          *,
          payer:users!payer_id(id, display_name, email, avatar_url),
          splits:shared_expense_splits(id, user_id, amount)
        `)
        .eq('trip_id', tripId)
        .order('date', { ascending: false });

      if (expErr) {
        setIsDbSynced(false);
        const local = loadFromStorage();
        fetchedExpenses = local.sharedExpenses || [];
      } else {
        fetchedExpenses = expData || [];
      }
      setSharedExpenses(fetchedExpenses);

      saveToStorage({ members: fetchedMembers, sharedExpenses: fetchedExpenses });
    } catch (err) {
      console.warn('Group data fetch error:', err);
      setError(err.message);
      const local = loadFromStorage();
      if (local.members?.length) setMembers(local.members);
      if (local.sharedExpenses?.length) setSharedExpenses(local.sharedExpenses);
    } finally {
      setLoading(false);
    }
  }, [tripId, loadFromStorage, saveToStorage]);

  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  useEffect(() => {
    fetchGroupData();
    fetchAvailableUsers();

    if (!tripId) return;

    // Supabase Realtime Subscription for Live Group Collaboration (FR-21 to FR-24)
    const channel = supabase
      .channel(`rt:group_trip:${tripId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trip_members',
          filter: `trip_id=eq.${tripId}`,
        },
        () => {
          fetchGroupData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shared_expenses',
          filter: `trip_id=eq.${tripId}`,
        },
        () => {
          fetchGroupData();
        }
      )
      .subscribe((status) => {
        setIsRealtimeConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId, fetchGroupData, fetchAvailableUsers]);

  // FR-21: Invite / Add member to trip
  const inviteMember = async (targetUser, role = 'member') => {
    const isAlreadyMember = members.some((m) => m.user_id === targetUser.id);
    if (isAlreadyMember) {
      throw new Error(`${targetUser.display_name || targetUser.email} is already part of this trip.`);
    }

    const newMemberEntry = {
      id: crypto.randomUUID(),
      trip_id: tripId,
      user_id: targetUser.id,
      role,
      status: 'accepted',
      joined_at: new Date().toISOString(),
      user: {
        id: targetUser.id,
        display_name: targetUser.display_name || targetUser.email.split('@')[0],
        email: targetUser.email,
        avatar_url: targetUser.avatar_url || null,
      },
    };

    const nextMembers = [...members, newMemberEntry];
    setMembers(nextMembers);
    saveToStorage({ members: nextMembers, sharedExpenses });

    try {
      await supabase.from('trip_members').insert([
        {
          id: newMemberEntry.id,
          trip_id: tripId,
          user_id: targetUser.id,
          role,
          status: 'accepted',
        },
      ]);
      setIsDbSynced(true);
    } catch (err) {
      console.info('Saved member locally:', err);
    }

    return newMemberEntry;
  };

  // FR-21: Remove member
  const removeMember = async (memberId) => {
    const nextMembers = members.filter((m) => m.id !== memberId);
    setMembers(nextMembers);
    saveToStorage({ members: nextMembers, sharedExpenses });

    try {
      await supabase.from('trip_members').delete().eq('id', memberId);
    } catch (err) {
      console.info('Removed member locally:', err);
    }
  };

  // FR-23: Add Shared Expense with Splits
  const addSharedExpense = async ({
    title,
    amount,
    payer_id,
    category = 'food',
    date,
    split_method = 'equal',
    customSplits = {},
  }) => {
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new Error('Please enter a valid amount.');
    }
    if (!payer_id) {
      throw new Error('Please select who paid for this expense.');
    }

    let splits = [];
    if (split_method === 'equal') {
      const activeMembers = members.length > 0 ? members : [{ user_id: payer_id }];
      const sharePerPerson = Math.round((numAmount / activeMembers.length) * 100) / 100;
      splits = activeMembers.map((m, idx) => {
        const isLast = idx === activeMembers.length - 1;
        const adjustedShare = isLast
          ? numAmount - sharePerPerson * (activeMembers.length - 1)
          : sharePerPerson;
        return {
          id: crypto.randomUUID(),
          user_id: m.user_id,
          amount: Math.round(adjustedShare * 100) / 100,
        };
      });
    } else {
      let totalCustom = 0;
      splits = Object.entries(customSplits).map(([uId, share]) => {
        const nShare = Number(share) || 0;
        totalCustom += nShare;
        return {
          id: crypto.randomUUID(),
          user_id: uId,
          amount: nShare,
        };
      });

      if (Math.abs(totalCustom - numAmount) > 0.05) {
        throw new Error(
          `Custom split total (₹${totalCustom}) does not equal the expense total (₹${numAmount}).`
        );
      }
    }

    const payer = members.find((m) => m.user_id === payer_id)?.user || {
      id: payer_id,
      display_name: 'Payer',
      email: '',
    };

    const newExpense = {
      id: crypto.randomUUID(),
      trip_id: tripId,
      payer_id,
      payer,
      title: title.trim(),
      amount: numAmount,
      category,
      split_method,
      date: date || new Date().toISOString().split('T')[0],
      splits,
      created_at: new Date().toISOString(),
    };

    const nextExpenses = [newExpense, ...sharedExpenses];
    setSharedExpenses(nextExpenses);
    saveToStorage({ members, sharedExpenses: nextExpenses });

    try {
      const { data: dbExp, error: expErr } = await supabase
        .from('shared_expenses')
        .insert([
          {
            id: newExpense.id,
            trip_id: tripId,
            payer_id,
            title: newExpense.title,
            amount: numAmount,
            category,
            split_method,
            date: newExpense.date,
          },
        ])
        .select()
        .single();

      if (!expErr && dbExp) {
        const splitsToInsert = splits.map((s) => ({
          id: s.id,
          expense_id: dbExp.id,
          user_id: s.user_id,
          amount: s.amount,
        }));
        await supabase.from('shared_expense_splits').insert(splitsToInsert);
      }
    } catch (err) {
      console.info('Saved shared expense locally:', err);
    }

    return newExpense;
  };

  // Delete Shared Expense
  const deleteSharedExpense = async (expenseId) => {
    const nextExpenses = sharedExpenses.filter((e) => e.id !== expenseId);
    setSharedExpenses(nextExpenses);
    saveToStorage({ members, sharedExpenses: nextExpenses });

    try {
      await supabase.from('shared_expenses').delete().eq('id', expenseId);
    } catch (err) {
      console.info('Deleted expense locally:', err);
    }
  };

  // FR-24: Balance Calculations & Debt Simplification
  const balanceSummary = useMemo(() => {
    const balances = {};

    members.forEach((m) => {
      balances[m.user_id] = {
        user: m.user,
        role: m.role,
        totalPaid: 0,
        totalShare: 0,
        netBalance: 0,
      };
    });

    sharedExpenses.forEach((exp) => {
      const payerId = exp.payer_id;
      if (!balances[payerId]) {
        balances[payerId] = {
          user: exp.payer || { id: payerId, display_name: 'Member', email: '' },
          role: 'member',
          totalPaid: 0,
          totalShare: 0,
          netBalance: 0,
        };
      }
      balances[payerId].totalPaid += Number(exp.amount) || 0;

      (exp.splits || []).forEach((split) => {
        const uId = split.user_id;
        if (!balances[uId]) {
          balances[uId] = {
            user: { id: uId, display_name: 'Member', email: '' },
            role: 'member',
            totalPaid: 0,
            totalShare: 0,
            netBalance: 0,
          };
        }
        balances[uId].totalShare += Number(split.amount) || 0;
      });
    });

    // Compute net balance: Positive = gets back, Negative = owes
    Object.values(balances).forEach((b) => {
      b.netBalance = Math.round((b.totalPaid - b.totalShare) * 100) / 100;
    });

    // Greedy algorithm: match largest debtor with largest creditor
    const debtors = [];
    const creditors = [];

    Object.entries(balances).forEach(([uId, b]) => {
      if (b.netBalance < -0.01) {
        debtors.push({ userId: uId, user: b.user, amount: Math.abs(b.netBalance) });
      } else if (b.netBalance > 0.01) {
        creditors.push({ userId: uId, user: b.user, amount: b.netBalance });
      }
    });

    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const settlements = [];
    let dIdx = 0;
    let cIdx = 0;

    while (dIdx < debtors.length && cIdx < creditors.length) {
      const debtor = debtors[dIdx];
      const creditor = creditors[cIdx];
      const settleAmount = Math.min(debtor.amount, creditor.amount);

      if (settleAmount > 0.01) {
        settlements.push({
          from: debtor.user,
          fromId: debtor.userId,
          to: creditor.user,
          toId: creditor.userId,
          amount: Math.round(settleAmount * 100) / 100,
        });
      }

      debtor.amount -= settleAmount;
      creditor.amount -= settleAmount;

      if (debtor.amount <= 0.01) dIdx++;
      if (creditor.amount <= 0.01) cIdx++;
    }

    const totalGroupSpend = sharedExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    return {
      memberBalances: Object.values(balances),
      settlements,
      totalGroupSpend,
    };
  }, [members, sharedExpenses]);

  return {
    trip,
    members,
    sharedExpenses,
    availableUsers,
    loading,
    error,
    isDbSynced,
    isRealtimeConnected,
    balanceSummary,
    inviteMember,
    removeMember,
    addSharedExpense,
    deleteSharedExpense,
    refetch: fetchGroupData,
  };
}
```

### File: `src/pages/GroupTripView.jsx`
```jsx
import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useGroupTrip } from '../hooks/useGroupTrip';
import { useAuth } from '../hooks/useAuth';
import AddSharedExpenseModal from '../components/group/AddSharedExpenseModal';
import InviteMemberModal from '../components/group/InviteMemberModal';
import { 
  Users, 
  Split, 
  DollarSign, 
  ArrowRight, 
  UserPlus, 
  Trash2, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Shield,
  Layers,
  ChevronLeft
} from 'lucide-react';

export default function GroupTripView() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    trip,
    members,
    sharedExpenses,
    availableUsers,
    loading,
    error,
    balanceSummary,
    inviteMember,
    removeMember,
    addSharedExpense,
    deleteSharedExpense,
    isRealtimeConnected,
  } = useGroupTrip(tripId);

  const [activeTab, setActiveTab] = useState('balances');
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center font-['IBM_Plex_Mono'] text-muted">
        Loading group trip & calculating shared balances...
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6">
        <div className="bg-surface border border-danger/20 p-8 rounded-2xl max-w-md text-center shadow-lg">
          <AlertCircle size={36} className="text-danger mx-auto mb-3" />
          <h2 className="font-['Fraunces'] font-semibold text-xl text-ink mb-2">Trip Not Found</h2>
          <p className="text-sm text-muted mb-6">{error || 'Unable to load group trip.'}</p>
          <button
            onClick={() => navigate('/trips')}
            className="px-5 py-2.5 bg-route text-white rounded-xl text-sm font-semibold hover:bg-route/90 transition-colors"
          >
            Back to My Trips
          </button>
        </div>
      </div>
    );
  }

  const { memberBalances, settlements, totalGroupSpend } = balanceSummary;
  const currentMemberBalance = memberBalances.find((m) => m.user?.id === user?.id);

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Top Header */}
      <div className="bg-surface border-b border-border sticky top-0 z-20">
        <div className="max-w-[1080px] mx-auto w-full px-4 lg:px-6">
          <div className="h-16 flex items-center justify-between gap-4">
            {/* Back button */}
            <button
              onClick={() => navigate(`/trips/${tripId}/view`)}
              className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink transition-colors"
            >
              <ChevronLeft size={18} />
              <span className="hidden sm:inline">Back to</span> Itinerary
            </button>

            {/* Title & Badge */}
            <div className="text-center min-w-0">
              <div className="flex items-center justify-center gap-2">
                <h1 className="font-['Fraunces'] font-bold text-lg sm:text-xl text-ink truncate max-w-xs sm:max-w-md">
                  {trip.name}
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-route/10 text-route border border-route/20">
                  <Users size={12} /> Group Trip
                </span>
                <span className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-['IBM_Plex_Mono'] font-medium border ${
                  isRealtimeConnected 
                    ? 'bg-success/10 text-success border-success/30' 
                    : 'bg-bg text-muted border-border'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isRealtimeConnected ? 'bg-success animate-pulse' : 'bg-route'}`} />
                  {isRealtimeConnected ? 'Realtime Live' : 'Supabase Synced'}
                </span>
              </div>
              <p className="font-['IBM_Plex_Mono'] text-xs text-muted">
                {members.length} Traveler{members.length > 1 ? 's' : ''} • Expense Sharing & Settlements
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsInviteOpen(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-xl text-xs font-semibold text-muted hover:text-ink hover:border-route transition-colors"
              >
                <UserPlus size={14} /> Invite
              </button>
              <button
                onClick={() => setIsAddExpenseOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-route text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-route/90 transition-colors shadow-sm"
              >
                <Split size={14} /> Add Shared Expense
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center justify-center gap-8 pt-2">
            {[
              { id: 'balances', label: 'Balances & Settlement (FR-24)', icon: DollarSign },
              { id: 'expenses', label: `Shared Expenses (${sharedExpenses.length})`, icon: Split },
              { id: 'members', label: `Group Members (${members.length})`, icon: Users },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
                    activeTab === tab.id
                      ? 'border-route text-route'
                      : 'border-transparent text-muted hover:text-ink'
                  }`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="max-w-[1080px] mx-auto w-full px-4 lg:px-6 py-8 flex-1">
        {/* TAB 1: BALANCES & DEBT SETTLEMENT */}
        {activeTab === 'balances' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Top Cards: Total Group Spend & User Stance */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted font-['IBM_Plex_Mono']">
                  Total Shared Spending
                </span>
                <div className="font-['Fraunces'] font-bold text-3xl text-ink mt-1">
                  ₹{totalGroupSpend.toLocaleString()}
                </div>
                <p className="text-xs text-muted mt-2">
                  Combined expenditure logged by {members.length} group participants
                </p>
              </div>

              {currentMemberBalance && (
                <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted font-['IBM_Plex_Mono']">
                    Your Personal Balance
                  </span>
                  <div className={`font-['Fraunces'] font-bold text-3xl mt-1 ${
                    currentMemberBalance.netBalance > 0 
                      ? 'text-success' 
                      : currentMemberBalance.netBalance < 0 
                      ? 'text-danger' 
                      : 'text-ink'
                  }`}>
                    {currentMemberBalance.netBalance > 0
                      ? `+₹${currentMemberBalance.netBalance.toLocaleString()}`
                      : currentMemberBalance.netBalance < 0
                      ? `-₹${Math.abs(currentMemberBalance.netBalance).toLocaleString()}`
                      : '₹0 (Settled)'}
                  </div>
                  <p className="text-xs text-muted mt-2">
                    {currentMemberBalance.netBalance > 0
                      ? 'You are owed money from the group'
                      : currentMemberBalance.netBalance < 0
                      ? 'You owe money to group members'
                      : 'All your group expenses are settled'}
                  </p>
                </div>
              )}
            </div>

            {/* FR-24: Who Owes Whom (Settlement Plan) */}
            <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-['Fraunces'] font-semibold text-lg text-ink">
                    Simplified Debt Settlement (Who Owes Whom)
                  </h3>
                  <p className="text-xs text-muted">
                    Greedy algorithm resolves all mutual liabilities in the minimum possible transactions (FR-24)
                  </p>
                </div>
              </div>

              {settlements.length === 0 ? (
                <div className="text-center py-10 bg-bg rounded-xl border border-dashed border-border p-6">
                  <CheckCircle2 size={32} className="text-success mx-auto mb-2" />
                  <p className="text-sm font-semibold text-ink">All Debts Are Settled!</p>
                  <p className="text-xs text-muted mt-1">
                    No pending reimbursements among group members.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {settlements.map((s, idx) => (
                    <div
                      key={idx}
                      className="bg-bg border border-border rounded-xl p-4 flex items-center justify-between gap-3 hover:border-route/40 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-danger/10 text-danger flex items-center justify-center font-bold text-xs shrink-0">
                          {s.from?.display_name?.[0] || 'D'}
                        </div>
                        <div className="min-w-0">
                          <span className="font-semibold text-sm text-ink truncate block">
                            {s.from?.display_name || 'Member'}
                          </span>
                          <span className="text-[11px] text-muted">owes</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-center px-2 shrink-0">
                        <span className="font-['Fraunces'] font-bold text-base text-route">
                          ₹{s.amount.toLocaleString()}
                        </span>
                        <ArrowRight size={14} className="text-muted" />
                      </div>

                      <div className="flex items-center gap-2.5 min-w-0 justify-end">
                        <div className="text-right min-w-0">
                          <span className="font-semibold text-sm text-ink truncate block">
                            {s.to?.display_name || 'Member'}
                          </span>
                          <span className="text-[11px] text-muted">gets back</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-success/10 text-success flex items-center justify-center font-bold text-xs shrink-0">
                          {s.to?.display_name?.[0] || 'C'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Individual Member Balances Breakdown Table */}
            <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-border bg-bg/50">
                <h3 className="font-['Fraunces'] font-semibold text-base text-ink">
                  Individual Participant Balances
                </h3>
              </div>
              <div className="divide-y divide-border">
                {memberBalances.map((m) => (
                  <div key={m.user?.id || m.userId} className="px-6 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-route/10 text-route font-bold flex items-center justify-center text-sm">
                        {m.user?.display_name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-ink">
                            {m.user?.display_name || m.user?.email || 'Participant'}
                          </span>
                          {m.role === 'organizer' && (
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20">
                              Organizer
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted font-['IBM_Plex_Mono']">
                          Paid ₹{m.totalPaid.toLocaleString()} • Share ₹{m.totalShare.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className={`font-['Fraunces'] font-bold text-base ${
                      m.netBalance > 0 ? 'text-success' : m.netBalance < 0 ? 'text-danger' : 'text-muted'
                    }`}>
                      {m.netBalance > 0 ? `+₹${m.netBalance.toLocaleString()}` : m.netBalance < 0 ? `-₹${Math.abs(m.netBalance).toLocaleString()}` : '₹0'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SHARED EXPENSES LIST */}
        {activeTab === 'expenses' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-muted font-['IBM_Plex_Mono'] font-semibold">
                {sharedExpenses.length} Shared Expense{sharedExpenses.length !== 1 ? 's' : ''} Logged
              </span>
              <button
                onClick={() => setIsAddExpenseOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-route text-white rounded-xl text-xs font-semibold hover:bg-route/90 transition-colors shadow-sm"
              >
                <Split size={14} /> Add Shared Expense
              </button>
            </div>

            {sharedExpenses.length === 0 ? (
              <div className="text-center py-16 bg-surface border border-border rounded-2xl p-8">
                <Split size={36} className="text-route mx-auto mb-3" />
                <h3 className="font-['Fraunces'] font-semibold text-lg text-ink mb-1">
                  No shared expenses yet
                </h3>
                <p className="text-xs text-muted max-w-sm mx-auto mb-6">
                  Add shared cab rides, restaurant meals, or vacation rentals and split equally or by custom amounts.
                </p>
                <button
                  onClick={() => setIsAddExpenseOpen(true)}
                  className="px-5 py-2.5 bg-route text-white rounded-xl text-xs font-semibold hover:bg-route/90 transition-colors shadow-sm"
                >
                  Record First Shared Expense
                </button>
              </div>
            ) : (
              <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm divide-y divide-border">
                {sharedExpenses.map((exp) => (
                  <div key={exp.id} className="p-5 flex items-center justify-between gap-4 hover:bg-bg/40 transition-colors">
                    <div>
                      <h4 className="font-semibold text-sm sm:text-base text-ink">
                        {exp.title}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-muted mt-1 font-['IBM_Plex_Mono']">
                        <span>Paid by <strong className="text-ink">{exp.payer?.display_name || 'Member'}</strong></span>
                        <span>•</span>
                        <span>{exp.date}</span>
                        <span>•</span>
                        <span className="capitalize">{exp.split_method} split</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="font-['Fraunces'] font-bold text-lg text-ink">
                        ₹{Number(exp.amount).toLocaleString()}
                      </span>
                      <button
                        onClick={() => deleteSharedExpense(exp.id)}
                        className="text-muted hover:text-danger p-1.5 rounded-lg hover:bg-danger/10 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MEMBERS MANAGEMENT */}
        {activeTab === 'members' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-muted font-['IBM_Plex_Mono'] font-semibold">
                {members.length} Group Member{members.length !== 1 ? 's' : ''}
              </span>
              <button
                onClick={() => setIsInviteOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-route text-white rounded-xl text-xs font-semibold hover:bg-route/90 transition-colors shadow-sm"
              >
                <UserPlus size={14} /> Invite Traveler
              </button>
            </div>

            <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm divide-y divide-border">
              {members.map((m) => (
                <div key={m.id} className="p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-route/10 text-route font-bold flex items-center justify-center text-sm">
                      {m.user?.display_name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-ink">
                          {m.user?.display_name || m.user?.email}
                        </span>
                        {m.role === 'organizer' ? (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20">
                            Organizer
                          </span>
                        ) : (
                          <span className="text-[10px] uppercase font-medium px-2 py-0.5 rounded bg-bg text-muted border border-border">
                            Traveler
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted font-['IBM_Plex_Mono']">
                        {m.user?.email || 'traveler@globetrotter.io'}
                      </span>
                    </div>
                  </div>

                  {m.role !== 'organizer' && (
                    <button
                      onClick={() => removeMember(m.id)}
                      className="text-muted hover:text-danger p-2 rounded-lg hover:bg-danger/10 transition-colors"
                      title="Remove participant"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddSharedExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        onSave={addSharedExpense}
        members={members}
        currentUserId={user?.id}
      />

      <InviteMemberModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onInvite={inviteMember}
        availableUsers={availableUsers}
        currentMembers={members}
      />
    </div>
  );
}
```

---

## 5. Core Algorithmic & Validation Units

### File: `src/utils/tripCalculations.js`
```javascript
/**
 * Trip Planning Application - Core Algorithmic & Validation Units
 * Modules: Budget & Expense Tracking (4.4), Bookings Management (4.5), Group Trip & Expense Sharing (4.6)
 */

/**
 * Unit 1: calculateBudgetSummary
 * Module: Budget & Expense Tracking Module (Module 4.4)
 * Calculates total expenditure, average daily burn rate, remaining budget,
 * and over-budget alert status.
 */
export function calculateBudgetSummary(budgetTotal, expenses = [], tripDurationDays = 1) {
  const actualExpensesTotal = expenses.reduce((sum, exp) => sum + (Number(exp.cost || exp.amount) || 0), 0);
  const days = Math.max(1, Number(tripDurationDays) || 1);
  const avgCostPerDay = Math.round(actualExpensesTotal / days);
  const budget = Number(budgetTotal) || 0;
  const remaining = budget > 0 ? budget - actualExpensesTotal : 0;
  const isOverBudget = budget > 0 && actualExpensesTotal > budget;
  const overAmount = isOverBudget ? actualExpensesTotal - budget : 0;
  const pctUsed = budget > 0 ? Math.round((actualExpensesTotal / budget) * 100) : 0;

  return {
    actualExpensesTotal,
    avgCostPerDay,
    remaining,
    isOverBudget,
    overAmount,
    pctUsed,
  };
}

/**
 * Unit 2: validateExpenseEntry
 * Module: Budget & Expense Tracking Module (Module 4.4)
 * Enforces business rules for logging actual expenses: positive amount, valid category,
 * non-empty title, and date within trip boundaries.
 */
export function validateExpenseEntry({ title, amount, category, date }, tripStartDate, tripEndDate) {
  const errors = [];
  const trimmedTitle = typeof title === 'string' ? title.trim() : '';

  if (!trimmedTitle) {
    errors.push('Title is required and cannot be empty.');
  } else if (trimmedTitle.length > 100) {
    errors.push('Title cannot exceed 100 characters.');
  }

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    errors.push('Amount must be a positive number greater than zero.');
  }

  const validCategories = ['food', 'transport', 'stay', 'activity', 'shopping', 'misc'];
  if (!category || !validCategories.includes(category.toLowerCase())) {
    errors.push(`Invalid category. Must be one of: ${validCategories.join(', ')}.`);
  }

  if (!date) {
    errors.push('Expense date is required.');
  } else {
    if (tripStartDate && date < tripStartDate) {
      errors.push(`Expense date (${date}) cannot be earlier than trip start date (${tripStartDate}).`);
    }
    if (tripEndDate && date > tripEndDate) {
      errors.push(`Expense date (${date}) cannot be later than trip end date (${tripEndDate}).`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Unit 3: calculateEqualSplits
 * Module: Group Trip & Expense Sharing Module (Module 4.6)
 * Divides an expense amount equally across participants, adjusting remaining paise/cents
 * on the last member to eliminate floating-point currency discrepancies.
 */
export function calculateEqualSplits(totalAmount, memberIds = []) {
  const amount = Number(totalAmount);
  if (isNaN(amount) || amount <= 0) {
    throw new Error('Total amount must be greater than zero.');
  }
  if (!memberIds || memberIds.length === 0) {
    throw new Error('At least one member is required to split the expense.');
  }

  const count = memberIds.length;
  const baseShare = Math.round((amount / count) * 100) / 100;
  
  return memberIds.map((userId, index) => {
    const isLast = index === count - 1;
    const splitAmount = isLast
      ? Math.round((amount - baseShare * (count - 1)) * 100) / 100
      : baseShare;

    return {
      userId,
      amount: splitAmount,
    };
  });
}

/**
 * Unit 4: simplifyDebts
 * Module: Group Trip & Expense Sharing Module (Module 4.6)
 * Greedy Debt Simplification Algorithm.
 * Computes net balances (totalPaid - totalShare) for all travelers,
 * partitions members into debtors and creditors, and pairs largest debtor with
 * largest creditor to resolve liabilities in minimum transactions (O(N)).
 */
export function simplifyDebts(members = [], sharedExpenses = []) {
  const balances = {};

  // Initialize members
  members.forEach((m) => {
    const uId = m.user_id || m.id;
    balances[uId] = {
      userId: uId,
      name: m.user?.display_name || m.name || uId,
      totalPaid: 0,
      totalShare: 0,
      netBalance: 0,
    };
  });

  // Accumulate paid and share amounts
  sharedExpenses.forEach((exp) => {
    const payerId = exp.payer_id;
    if (!balances[payerId]) {
      balances[payerId] = {
        userId: payerId,
        name: exp.payer?.display_name || payerId,
        totalPaid: 0,
        totalShare: 0,
        netBalance: 0,
      };
    }
    balances[payerId].totalPaid += Number(exp.amount) || 0;

    (exp.splits || []).forEach((split) => {
      const uId = split.user_id;
      if (!balances[uId]) {
        balances[uId] = {
          userId: uId,
          name: split.name || uId,
          totalPaid: 0,
          totalShare: 0,
          netBalance: 0,
        };
      }
      balances[uId].totalShare += Number(split.amount) || 0;
    });
  });

  // Calculate net balances: positive = receives money, negative = owes money
  Object.values(balances).forEach((b) => {
    b.netBalance = Math.round((b.totalPaid - b.totalShare) * 100) / 100;
  });

  const debtors = [];
  const creditors = [];

  Object.values(balances).forEach((b) => {
    if (b.netBalance < -0.01) {
      debtors.push({ userId: b.userId, name: b.name, amount: Math.abs(b.netBalance) });
    } else if (b.netBalance > 0.01) {
      creditors.push({ userId: b.userId, name: b.name, amount: b.netBalance });
    }
  });

  // Sort descending by magnitude
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const settlements = [];
  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];
    const settleAmount = Math.min(debtor.amount, creditor.amount);

    if (settleAmount > 0.01) {
      settlements.push({
        from: debtor.userId,
        fromName: debtor.name,
        to: creditor.userId,
        toName: creditor.name,
        amount: Math.round(settleAmount * 100) / 100,
      });
    }

    debtor.amount -= settleAmount;
    creditor.amount -= settleAmount;

    if (debtor.amount <= 0.01) dIdx++;
    if (creditor.amount <= 0.01) cIdx++;
  }

  return {
    balances: Object.values(balances),
    settlements,
  };
}

/**
 * Unit 5 (Bonus): validateBookingDates
 * Module: Accommodation & Transportation Bookings (Module 4.5)
 * Enforces booking lifecycle rules (checkOut >= checkIn) and date containment against trip duration.
 */
export function validateBookingDates(startDate, endDate, tripStartDate, tripEndDate) {
  if (!startDate || !endDate) {
    return { valid: false, error: 'Both start and end dates are required.', warnings: [] };
  }

  if (endDate < startDate) {
    return { valid: false, error: 'Check-out/arrival date cannot precede start date.', warnings: [] };
  }

  const warnings = [];
  if (tripStartDate && startDate < tripStartDate) {
    warnings.push(`Booking starts on ${startDate}, earlier than trip start (${tripStartDate}).`);
  }
  if (tripEndDate && endDate > tripEndDate) {
    warnings.push(`Booking ends on ${endDate}, later than trip end (${tripEndDate}).`);
  }

  return {
    valid: true,
    error: null,
    warnings,
  };
}
```

---

## 6. Unit Testing Suite

### 4. Unit Testing Overview
Unit testing verifies the smallest testable parts of an application (units, usually one function or method) individually and independently. Each test case has an input and an expected output; the test asserts that the actual result matches the expectation, and a test suite groups multiple test cases and reports which passed or failed. Running the suite after every code change helps identify defects and prevent regressions. A testing framework is used instead of hand-written if-statements because it provides standardized assertions, test grouping, failure reporting, and support for code coverage. JavaScript projects commonly use Jest, Vitest, or Mocha with Chai. For our Trip Planning Application, Node.js's native test runner (`node:test`) was selected to test the core trip calculation and validation functions without external baggage.

### 5. Units Selected for Testing
- **Unit 1 — `calculateBudgetSummary(budgetTotal, expenses, tripDurationDays)` [Budget & Expense Tracking Module]**: Computes the total expenditure, average daily spending, remaining budget, and over-budget status.
  - *Formula*: Daily burn rate = $\text{round}(\text{total spent} / \text{trip duration})$, remaining budget = $\text{budget} - \text{total spent}$, and over-budget status = $\text{total spent} > \text{budget}$.
  - *Verified against the application*: For a 5-day trip with a budget of ₹25,000 and expenses totalling ₹18,500, the daily burn rate is ₹3,700, the remaining balance is ₹6,500, and `isOverBudget` is false. If spending increases to ₹27,200, the daily burn rate becomes ₹5,440, the remaining balance becomes −₹2,200, and `isOverBudget` becomes true.
- **Unit 2 — `validateExpenseEntry(expense, tripStartDate, tripEndDate)` [Budget & Expense Tracking Module]**: Validates expense entries by checking that the title is non-empty and within permitted length, the amount is positive, the category is recognized, and the expense date falls within the trip's scheduled dates.
  - *Verified against the application*: An expense of ₹4,500 under the food category, dated within the trip period, is accepted when all fields are valid. An expense with a negative amount, an invalid category, a missing title, or a date outside the trip period is rejected with validation errors.
- **Unit 3 — `calculateEqualSplits(totalAmount, memberIds)` [Group Trip & Expense Sharing Module]**: Divides a shared expense equally among group members while accounting for rounding differences so that the individual shares add up to the original expense amount.
  - *Formula*: Each member receives an equal share rounded to two decimal places, with any rounding remainder assigned to the final member.
  - *Verified against the application*: Splitting ₹1,000 among 3 travellers produces shares of ₹333.33, ₹333.33, and ₹333.34, respectively, totalling exactly ₹1,000.
- **Unit 4 — `simplifyDebts(members, sharedExpenses)` [Group Trip & Expense Sharing Module]**: Implements a greedy debt simplification algorithm that calculates each member's net balance and matches debtors with creditors to generate direct settlements in minimum transactions.
  - *Formula*: $\text{Net balance} = \text{total amount paid} - \text{total share owed}$. Members with positive balances are creditors, while members with negative balances are debtors.
  - *Verified against the application*: If Aarav pays ₹3,000 for a shared dinner among Aarav, Bhavna, and Chirag, and each person's share is ₹1,000, Aarav is owed ₹2,000. The simplified settlements are Bhavna paying Aarav ₹1,000 and Chirag paying Aarav ₹1,000, clearing all outstanding balances.

**Testing summary**: Four units were selected for testing, covering two core functions in the Budget and Expense Tracking Module and two in the Group Trip and Expense Sharing Module. This satisfies the lab requirement of at least three non-repetitive units.

**Test execution**: The test suite is run with `npm test`, reporting 13 tests passed and 0 failures.

### File: `tests/tripUnits.test.js`
```javascript
import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateBudgetSummary,
  validateExpenseEntry,
  calculateEqualSplits,
  simplifyDebts,
  validateBookingDates,
} from '../src/utils/tripCalculations.js';

describe('Trip Planning Application - Unit Tests', () => {
  // UNIT 1: calculateBudgetSummary [Budget & Expense Module]
  describe('Unit 1: calculateBudgetSummary(budgetTotal, expenses, tripDurationDays)', () => {
    test('computes burn rate and remaining balance within budget', () => {
      const expenses = [
        { cost: 4500 },
        { cost: 3000 },
        { cost: 11000 },
      ]; // total = 18500
      const summary = calculateBudgetSummary(25000, expenses, 5);

      assert.equal(summary.actualExpensesTotal, 18500);
      assert.equal(summary.avgCostPerDay, 3700); // 18500 / 5
      assert.equal(summary.remaining, 6500);
      assert.equal(summary.isOverBudget, false);
      assert.equal(summary.overAmount, 0);
      assert.equal(summary.pctUsed, 74);
    });

    test('flags over-budget alert when expenses exceed target', () => {
      const expenses = [
        { cost: 15000 },
        { cost: 12200 },
      ]; // total = 27200
      const summary = calculateBudgetSummary(25000, expenses, 5);

      assert.equal(summary.actualExpensesTotal, 27200);
      assert.equal(summary.avgCostPerDay, 5440);
      assert.equal(summary.remaining, -2200);
      assert.equal(summary.isOverBudget, true);
      assert.equal(summary.overAmount, 2200);
      assert.equal(summary.pctUsed, 109);
    });
  });

  // UNIT 2: validateExpenseEntry [Budget & Expense Module]
  describe('Unit 2: validateExpenseEntry(expense, tripStartDate, tripEndDate)', () => {
    const tripStart = '2026-11-01';
    const tripEnd = '2026-11-07';

    test('accepts valid expense within dates and category', () => {
      const validExpense = {
        title: 'Dinner at Bukhara Delhi',
        amount: 4500,
        category: 'food',
        date: '2026-11-03',
      };
      const result = validateExpenseEntry(validExpense, tripStart, tripEnd);

      assert.equal(result.valid, true);
      assert.equal(result.errors.length, 0);
    });

    test('rejects negative amount, missing title, and invalid category', () => {
      const invalidExpense = {
        title: '   ',
        amount: -250,
        category: 'luxury_casino',
        date: '2026-11-04',
      };
      const result = validateExpenseEntry(invalidExpense, tripStart, tripEnd);

      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes('Title is required')));
      assert.ok(result.errors.some((e) => e.includes('positive number')));
      assert.ok(result.errors.some((e) => e.includes('Invalid category')));
    });

    test('rejects expense dated outside trip boundaries', () => {
      const outOfBoundsExpense = {
        title: 'Airport Taxi',
        amount: 800,
        category: 'transport',
        date: '2026-10-25', // Before trip start
      };
      const result = validateExpenseEntry(outOfBoundsExpense, tripStart, tripEnd);

      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes('cannot be earlier than trip start')));
    });
  });

  // UNIT 3: calculateEqualSplits [Group Trip & Expense Sharing Module]
  describe('Unit 3: calculateEqualSplits(totalAmount, memberIds)', () => {
    test('splits ₹1,000 across 3 members with remainder assigned to last member', () => {
      const splits = calculateEqualSplits(1000, ['user_A', 'user_B', 'user_C']);

      assert.equal(splits.length, 3);
      assert.equal(splits[0].amount, 333.33);
      assert.equal(splits[1].amount, 333.33);
      assert.equal(splits[2].amount, 333.34);

      // Verify exact sum without floating point leakage
      const sum = splits.reduce((acc, s) => acc + s.amount, 0);
      assert.equal(Math.round(sum * 100) / 100, 1000);
    });

    test('splits evenly when divisible', () => {
      const splits = calculateEqualSplits(2400, ['u1', 'u2', 'u3', 'u4']);

      assert.equal(splits.length, 4);
      splits.forEach((s) => assert.equal(s.amount, 600));
    });

    test('throws error for non-positive amount or empty members', () => {
      assert.throws(() => calculateEqualSplits(-500, ['u1']), /greater than zero/);
      assert.throws(() => calculateEqualSplits(500, []), /At least one member/);
    });
  });

  // UNIT 4: simplifyDebts [Group Trip & Expense Sharing Module]
  describe('Unit 4: simplifyDebts(members, sharedExpenses)', () => {
    test('simplifies single-payer 3-way split into 2 direct settlements', () => {
      const members = [
        { user_id: 'A', user: { display_name: 'Aarav' } },
        { user_id: 'B', user: { display_name: 'Bhavna' } },
        { user_id: 'C', user: { display_name: 'Chirag' } },
      ];

      // Aarav pays ₹3,000 for dinner for Aarav, Bhavna, Chirag equally (₹1000 each)
      const sharedExpenses = [
        {
          id: 'exp-1',
          payer_id: 'A',
          amount: 3000,
          splits: [
            { user_id: 'A', amount: 1000 },
            { user_id: 'B', amount: 1000 },
            { user_id: 'C', amount: 1000 },
          ],
        },
      ];

      const { settlements } = simplifyDebts(members, sharedExpenses);

      // Only 2 transactions needed instead of complex pairwise swaps
      assert.equal(settlements.length, 2);
      assert.ok(settlements.some((s) => s.from === 'B' && s.to === 'A' && s.amount === 1000));
      assert.ok(settlements.some((s) => s.from === 'C' && s.to === 'A' && s.amount === 1000));
    });

    test('minimizes multi-transaction circular debts', () => {
      const members = [
        { user_id: 'A', user: { display_name: 'Aarav' } },
        { user_id: 'B', user: { display_name: 'Bhavna' } },
        { user_id: 'C', user: { display_name: 'Chirag' } },
      ];

      // A pays ₹1200 split among A, B, C (₹400 each)
      // B pays ₹600 split between A and B (₹300 each)
      // Net: A paid 1200, owes 400 + 300 = 700 -> net +500
      //      B paid 600, owes 400 + 300 = 700 -> net -100
      //      C paid 0, owes 400 -> net -400
      const sharedExpenses = [
        {
          id: 'exp-1',
          payer_id: 'A',
          amount: 1200,
          splits: [
            { user_id: 'A', amount: 400 },
            { user_id: 'B', amount: 400 },
            { user_id: 'C', amount: 400 },
          ],
        },
        {
          id: 'exp-2',
          payer_id: 'B',
          amount: 600,
          splits: [
            { user_id: 'A', amount: 300 },
            { user_id: 'B', amount: 300 },
          ],
        },
      ];

      const { settlements } = simplifyDebts(members, sharedExpenses);

      assert.equal(settlements.length, 2);
      assert.ok(settlements.some((s) => s.from === 'C' && s.to === 'A' && s.amount === 400));
      assert.ok(settlements.some((s) => s.from === 'B' && s.to === 'A' && s.amount === 100));
    });
  });

  // UNIT 5 (Bonus): validateBookingDates [Bookings Management Module]
  describe('Unit 5 (Bonus): validateBookingDates(startDate, endDate, tripStartDate, tripEndDate)', () => {
    test('accepts valid hotel dates within trip duration', () => {
      const res = validateBookingDates('2026-11-02', '2026-11-05', '2026-11-01', '2026-11-10');
      assert.equal(res.valid, true);
      assert.equal(res.error, null);
      assert.equal(res.warnings.length, 0);
    });

    test('rejects check-out preceding check-in', () => {
      const res = validateBookingDates('2026-11-05', '2026-11-02', '2026-11-01', '2026-11-10');
      assert.equal(res.valid, false);
      assert.equal(res.error, 'Check-out/arrival date cannot precede start date.');
    });

    test('flags warnings when booking extends past trip boundaries', () => {
      const res = validateBookingDates('2026-10-30', '2026-11-12', '2026-11-01', '2026-11-10');
      assert.equal(res.valid, true);
      assert.equal(res.warnings.length, 2);
    });
  });
});
```
