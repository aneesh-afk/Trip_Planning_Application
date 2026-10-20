import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useTrip(tripId) {
  const [trip, setTrip] = useState(null);
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTripData = useCallback(async () => {
    if (!tripId) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch trip details
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .single();
        
      if (tripError) throw tripError;
      setTrip(tripData);

      // 2. Fetch stops with city details
      const { data: stopsData, error: stopsError } = await supabase
        .from('trip_stops')
        .select('*, city:cities(*)')
        .eq('trip_id', tripId)
        .order('order_index', { ascending: true });

      if (stopsError) throw stopsError;

      // 3. Fetch activities for each stop
      if (stopsData && stopsData.length > 0) {
        const stopIds = stopsData.map(s => s.id);
        const { data: actData, error: actError } = await supabase
          .from('stop_activities')
          .select('*, activity:activities(*)')
          .in('trip_stop_id', stopIds)
          .order('order_index', { ascending: true });
          
        if (actError) throw actError;

        // Group activities by stop
        const activitiesByStop = {};
        actData.forEach(item => {
          if (!activitiesByStop[item.trip_stop_id]) {
            activitiesByStop[item.trip_stop_id] = [];
          }
          // Flatten activity details and compute effective cost
          const flatAct = {
            ...item,
            ...item.activity,
            id: item.id, // keep stop_activity id for deletions
            activity_id: item.activity.id,
            effective_cost: item.custom_cost_override ?? item.activity.estimated_cost
          };
          activitiesByStop[item.trip_stop_id].push(flatAct);
        });

        // Attach activities to stops
        stopsData.forEach(s => {
          s.activities = activitiesByStop[s.id] || [];
        });
      }

      setStops(stopsData || []);
    } catch (err) {
      console.error('Error loading trip:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    fetchTripData();
  }, [fetchTripData]);

  return { trip, stops, loading, error, refetch: fetchTripData };
}
