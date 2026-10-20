import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './useAuth';

export function useTrips() {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTrips = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);

      const tripFields = `
        id,
        user_id,
        name,
        description,
        start_date,
        end_date,
        cover_photo_url,
        is_public,
        public_slug,
        created_at,
        trip_stops (
          id,
          city_id,
          order_index,
          start_date,
          end_date,
          stay_cost_per_night,
          transport_cost_to_here,
          city:cities (
            id,
            name,
            country,
            image_url
          ),
          stop_activities (
            id,
            scheduled_date,
            custom_cost_override,
            activity:activities (
              id,
              name,
              estimated_cost,
              category
            )
          )
        )
      `;

      // 1. Fetch trips owned by the user
      const { data: ownedData, error: fetchErr } = await supabase
        .from('trips')
        .select(tripFields)
        .eq('user_id', user.id)
        .order('start_date', { ascending: false });

      // 2. Fetch trips where user is an invited member (FR-22)
      let sharedData = [];
      try {
        const { data: memberRows } = await supabase
          .from('trip_members')
          .select('trip_id')
          .eq('user_id', user.id);

        if (memberRows && memberRows.length > 0) {
          const memberTripIds = memberRows
            .map((m) => m.trip_id)
            .filter((id) => !ownedData?.some((t) => t.id === id));

          if (memberTripIds.length > 0) {
            const { data: memberTrips } = await supabase
              .from('trips')
              .select(tripFields)
              .in('id', memberTripIds);

            if (memberTrips) {
              sharedData = memberTrips.map((t) => ({ ...t, isSharedWithMe: true }));
            }
          }
        }
      } catch (err) {
        // Fallback gracefully if trip_members table not yet created
      }

      const allTrips = [...(ownedData || []), ...sharedData];

      if (fetchErr && !allTrips.length) {
        console.warn('Supabase trips fetch error:', fetchErr.message);
        setError(fetchErr.message);
        setTrips([]);
      } else {
        const enriched = (allTrips || []).map((trip) => {
          const today = new Date().toISOString().split('T')[0];
          const start = trip.start_date || today;
          const end = trip.end_date || start;

          let status = 'upcoming';
          if (end < today) {
            status = 'completed';
          } else if (start <= today && end >= today) {
            status = 'ongoing';
          } else {
            status = 'upcoming';
          }

          // Calculate Route
          const sortedStops = (trip.trip_stops || []).sort(
            (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)
          );
          const cityNames = sortedStops
            .map((s) => s.city?.name)
            .filter(Boolean);
          const routeString =
            cityNames.length > 1
              ? cityNames.join(' → ')
              : cityNames.length === 1
              ? cityNames[0]
              : trip.name;

          // Calculate Cost
          let totalCost = 0;
          sortedStops.forEach((stop) => {
            const stayNights = Math.max(
              1,
              Math.round(
                (new Date(stop.end_date) - new Date(stop.start_date)) /
                  (1000 * 60 * 60 * 24)
              ) || 1
            );
            totalCost += (Number(stop.stay_cost_per_night) || 0) * stayNights;
            totalCost += Number(stop.transport_cost_to_here) || 0;

            (stop.stop_activities || []).forEach((sa) => {
              const actCost =
                sa.custom_cost_override !== null &&
                sa.custom_cost_override !== undefined
                  ? Number(sa.custom_cost_override)
                  : Number(sa.activity?.estimated_cost) || 0;
              totalCost += actCost;
            });
          });

          // Calculate Duration & Progress
          const startDateObj = new Date(start);
          const endDateObj = new Date(end);
          const todayObj = new Date(today);
          const totalDurationDays = Math.max(
            1,
            Math.round((endDateObj - startDateObj) / (1000 * 60 * 60 * 24)) + 1
          );

          let progressPercent = 0;
          let currentDayNumber = 1;

          if (status === 'completed') {
            progressPercent = 100;
          } else if (status === 'ongoing') {
            const daysPassed = Math.max(
              1,
              Math.round((todayObj - startDateObj) / (1000 * 60 * 60 * 24)) + 1
            );
            currentDayNumber = Math.min(daysPassed, totalDurationDays);
            progressPercent = Math.min(
              100,
              Math.max(5, Math.round((daysPassed / totalDurationDays) * 100))
            );
          } else {
            progressPercent = 5;
          }

          let coverImageUrl = trip.cover_photo_url;
          if (!coverImageUrl && sortedStops.length > 0 && sortedStops[0].city?.image_url) {
            coverImageUrl = sortedStops[0].city.image_url;
          }

          return {
            ...trip,
            cover_photo_url: coverImageUrl,
            computedStatus: status,
            routeString,
            totalCost,
            stopsCount: sortedStops.length,
            totalDurationDays,
            currentDayNumber,
            progressPercent,
          };
        });

        setTrips(enriched);
      }
    } catch (err) {
      console.error('Failed to load trips:', err);
      setError(err.message);
      setTrips([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const deleteTrip = useCallback(async (tripId) => {
    try {
      const { error: delErr } = await supabase.from('trips').delete().eq('id', tripId);
      if (delErr) throw delErr;
      await fetchTrips();
      return { success: true };
    } catch (err) {
      console.error('Failed to delete trip:', err);
      return { success: false, error: err.message };
    }
  }, [fetchTrips]);
  const optimisticComplete = useCallback((tripId) => {
    setTrips(prev => prev.map(t => t.id === tripId ? { ...t, computedStatus: 'completed' } : t));
  }, []);

  const completeTrip = useCallback(async (tripId) => {
    try {
      // Set end_date to yesterday so it evaluates as completed
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const { error: updErr } = await supabase.from('trips').update({ end_date: yesterday.toISOString().split('T')[0] }).eq('id', tripId);
      if (updErr) throw updErr;
      await fetchTrips();
      return { success: true };
    } catch (err) {
      console.error('Failed to complete trip:', err);
      return { success: false, error: err.message };
    }
  }, [fetchTrips]);

  useEffect(() => {
    fetchTrips();

    if (!user?.id) return;

    const channel = supabase
      .channel(`rt:user_trips:${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, () => {
        fetchTrips();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trip_members', filter: `user_id=eq.${user.id}` }, () => {
        fetchTrips();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchTrips]);

  return { trips, loading, error, refetch: fetchTrips, deleteTrip, completeTrip, optimisticComplete };
}
