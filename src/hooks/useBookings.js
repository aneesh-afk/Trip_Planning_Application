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
