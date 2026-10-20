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
