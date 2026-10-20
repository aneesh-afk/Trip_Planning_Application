import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useItinerary(tripId) {
  const [trip, setTrip] = useState(null);
  const [tripStops, setTripStops] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchItinerary = useCallback(async () => {
    if (!tripId) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
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
        .eq('id', tripId)
        .single();

      if (fetchErr) throw fetchErr;

      setTrip(data);
      
      const sortedStops = (data.trip_stops || []).sort((a,b) => a.order_index - b.order_index);
      setTripStops(sortedStops);

      const flatActivities = [];
      const startDate = new Date(data.start_date + 'T00:00:00');

      sortedStops.forEach(stop => {
        (stop.stop_activities || []).forEach(sa => {
          const act = sa.activity || {};
          const scheduledDate = new Date(sa.scheduled_date + 'T00:00:00');
          
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
      console.error('Error fetching itinerary:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    fetchItinerary();
  }, [fetchItinerary]);

  const updateActivityDetails = async (stopActivityId, updates) => {
    try {
      const { error } = await supabase
        .from('stop_activities')
        .update(updates)
        .eq('id', stopActivityId);
      if (error) throw error;
      await fetchItinerary(); // Refetch to recalculate
      return { success: true };
    } catch (err) {
      console.error('Error updating activity details:', err);
      return { success: false, error: err.message };
    }
  };

  const reorderActivity = async (activityId, newOrderIndex, newScheduledDate = null) => {
    try {
      const updates = { order_index: newOrderIndex };
      if (newScheduledDate) updates.scheduled_date = newScheduledDate;
      const { error } = await supabase.from('stop_activities').update(updates).eq('id', activityId);
      if (error) throw error;
      await fetchItinerary();
      return { success: true };
    } catch (err) {
      console.error('Error reordering activity:', err);
      return { success: false, error: err.message };
    }
  };

  const addActivityToStop = async (tripStopId, activityId, scheduledDate) => {
    try {
      const { error } = await supabase
        .from('stop_activities')
        .insert({
          trip_stop_id: tripStopId,
          activity_id: activityId,
          scheduled_date: scheduledDate,
          order_index: 0
        });
      if (error) throw error;
      await fetchItinerary();
      return { success: true };
    } catch (err) {
      console.error('Error adding activity:', err);
      return { success: false, error: err.message };
    }
  };

  return { trip, tripStops, activities, loading, error, refetch: fetchItinerary, updateActivityDetails, reorderActivity, addActivityToStop };
}

export function calculateGaps(dayActivities) {
  const sorted = [...dayActivities].sort((a, b) => {
    if (a.time && b.time) return a.time.localeCompare(b.time);
    return a.order_index - b.order_index;
  });

  return sorted.map((act, index) => {
    let endTime = null;
    let gapAfterMinutes = null;

    if (act.time) {
      const [hours, minutes] = act.time.split(':').map(Number);
      const startDate = new Date(0, 0, 0, hours, minutes);
      const endDate = new Date(startDate.getTime() + act.duration_minutes * 60000);
      
      const endHours = String(endDate.getHours()).padStart(2, '0');
      const endMinutes = String(endDate.getMinutes()).padStart(2, '0');
      endTime = `${endHours}:${endMinutes}`;

      if (index < sorted.length - 1) {
        const nextAct = sorted[index + 1];
        if (nextAct.time) {
          const [nextHours, nextMinutes] = nextAct.time.split(':').map(Number);
          const nextStartDate = new Date(0, 0, 0, nextHours, nextMinutes);
          
          if (nextStartDate < startDate) {
            nextStartDate.setDate(nextStartDate.getDate() + 1);
          }
          
          gapAfterMinutes = Math.round((nextStartDate - endDate) / 60000);
        }
      }
    }

    return {
      ...act,
      endTime,
      gapAfterMinutes
    };
  });
}
