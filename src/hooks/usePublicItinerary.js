import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

export function usePublicItinerary(slug) {
  const [trip, setTrip] = useState(null);
  const [tripStops, setTripStops] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchItinerary = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      // First try fetching by public_slug, fallback to id if not found (in case slug is the id)
      let { data, error: fetchErr } = await supabase
        .from('trips')
        .select(`
          *,
          trip_stops (
            *,
            city:cities(*),
            stop_activities (
              *,
              activity:activities(*)
            )
          )
        `)
        .eq('is_public', true)
        .eq('public_slug', slug)
        .single();

      if (fetchErr && fetchErr.code === 'PGRST116') { // No rows found
        const { data: idData, error: idErr } = await supabase
          .from('trips')
          .select(`
            *,
            trip_stops (
              *,
              city:cities(*),
              stop_activities (
                *,
                activity:activities(*)
              )
            )
          `)
          .eq('is_public', true)
          .eq('id', slug)
          .single();
          
        if (idErr) throw idErr;
        data = idData;
      } else if (fetchErr) {
        throw fetchErr;
      }

      setTrip(data);
      
      const sortedStops = (data.trip_stops || []).sort((a,b) => a.order_index - b.order_index);
      setTripStops(sortedStops);

      const flatActivities = [];
      const startDate = new Date(data.start_date);
      startDate.setHours(0, 0, 0, 0);

      sortedStops.forEach(stop => {
        (stop.stop_activities || []).forEach(sa => {
          const act = sa.activity || {};
          const scheduledDate = new Date(sa.scheduled_date);
          scheduledDate.setHours(0, 0, 0, 0);
          
          const dayNumber = Math.max(1, Math.round((scheduledDate - startDate) / (1000 * 60 * 60 * 24)) + 1);
          
          const cost = sa.custom_cost_override !== null && sa.custom_cost_override !== undefined 
            ? Number(sa.custom_cost_override) 
            : Number(act.estimated_cost) || 0;

          const duration = act.duration_minutes || 60;
          const durationEstimated = !act.duration_minutes;

          flatActivities.push({
            id: sa.id,
            stop_id: stop.id,
            city_name: stop.city?.name || 'Unknown',
            day: dayNumber,
            scheduled_date: sa.scheduled_date,
            time: sa.scheduled_time ? sa.scheduled_time.substring(0, 5) : null,
            order_index: sa.order_index || 0,
            title: act.name || 'Custom Activity',
            category: act.category || 'other',
            description: act.description,
            image_url: act.image_url,
            duration_minutes: duration,
            durationEstimated: durationEstimated,
            cost: cost,
            is_custom_cost: sa.custom_cost_override !== null && sa.custom_cost_override !== undefined,
          });
        });
      });

      // Default sort by day, then time/order
      flatActivities.sort((a, b) => {
        if (a.day !== b.day) return a.day - b.day;
        if (a.time && b.time) return a.time.localeCompare(b.time);
        return a.order_index - b.order_index;
      });

      setActivities(flatActivities);
    } catch (err) {
      console.error('Error fetching public itinerary:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchItinerary();
  }, [fetchItinerary]);

  return { trip, tripStops, activities, loading, error };
}
