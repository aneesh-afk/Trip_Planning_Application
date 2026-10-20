import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './useAuth';
import { useTrips } from './useTrips';

export function useCommunityTrips() {
  const [publicTrips, setPublicTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 12;

  // Fetch the current user's trips to find "upcoming" destinations for the "Relevant to your trip" rail
  const { trips: userTrips } = useTrips();

  const userUpcomingDestinations = useMemo(() => {
    const dests = new Set();
    if (!userTrips) return dests;
    userTrips.forEach(trip => {
      if (trip.computedStatus === 'upcoming' || trip.computedStatus === 'ongoing') {
        (trip.trip_stops || []).forEach(stop => {
          if (stop.city?.name) {
            dests.add(stop.city.name.toLowerCase());
          }
        });
      }
    });
    return dests;
  }, [userTrips]);

  const fetchPublicTrips = useCallback(async (isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setPage(0); // Reset page on fresh fetch
      }
      setError(null);

      const currentPage = isLoadMore ? page + 1 : 0;
      const from = currentPage * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      // Join trips with users and trip_stops (and cities/activities)
      const { data, error: fetchErr, count } = await supabase
        .from('trips')
        .select(`
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
          users (
            display_name,
            avatar_url,
            email
          ),
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
        `, { count: 'exact' })
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (fetchErr) {
        console.warn('Supabase community trips fetch error:', fetchErr.message);
        setError(fetchErr.message);
        if (!isLoadMore) setPublicTrips([]);
      } else {
        // Exclude trips that have no trip_stops (incomplete trips)
        const validData = (data || []).filter(trip => trip.trip_stops && trip.trip_stops.length > 0);

        const enriched = validData.map((trip) => {
          const start = trip.start_date || '';
          const end = trip.end_date || start;

          // Extract unique destinations in order
          const sortedStops = (trip.trip_stops || []).sort(
            (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)
          );
          
          const destinations = [];
          sortedStops.forEach(s => {
            if (s.city?.name && !destinations.includes(s.city.name)) {
              destinations.push(s.city.name);
            }
          });

          // Calculate Route String
          const routeString = destinations.length > 1
              ? destinations.join(' → ')
              : destinations.length === 1
              ? destinations[0]
              : trip.name;

          // Calculate Cost (same logic as useTrips)
          let totalCost = 0;
          sortedStops.forEach((stop) => {
            const stayNights = Math.max(
              1,
              Math.round(
                (new Date(stop.end_date) - new Date(stop.start_date)) / (1000 * 60 * 60 * 24)
              ) || 1
            );
            totalCost += (Number(stop.stay_cost_per_night) || 0) * stayNights;
            totalCost += Number(stop.transport_cost_to_here) || 0;

            (stop.stop_activities || []).forEach((sa) => {
              const actCost =
                sa.custom_cost_override !== null && sa.custom_cost_override !== undefined
                  ? Number(sa.custom_cost_override)
                  : Number(sa.activity?.estimated_cost) || 0;
              totalCost += actCost;
            });
          });

          // Calculate Duration
          let durationDays = 1;
          if (start && end) {
            durationDays = Math.max(1, Math.round((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)) + 1);
          }
          
          // Month/Season for filtering
          const startDateObj = start ? new Date(start) : new Date();
          const monthIndex = startDateObj.getMonth();
          let season = 'Winter';
          if (monthIndex >= 2 && monthIndex <= 4) season = 'Spring';
          if (monthIndex >= 5 && monthIndex <= 7) season = 'Summer';
          if (monthIndex >= 8 && monthIndex <= 10) season = 'Autumn';

          // Format Author
          const authorName = trip.users?.display_name || trip.users?.email?.split('@')[0] || 'GlobeTrotter User';
          const authorAvatar = trip.users?.avatar_url || null;

          // Check if relevant to viewer
          const isRelevant = destinations.some(d => userUpcomingDestinations.has(d.toLowerCase()));
          
          let coverImageUrl = trip.cover_photo_url;
          if (!coverImageUrl && sortedStops.length > 0 && sortedStops[0].city?.image_url) {
            coverImageUrl = sortedStops[0].city.image_url;
          }

          return {
            id: trip.id,
            slug: trip.public_slug || trip.id,
            title: trip.name,
            description: trip.description,
            coverImageUrl: coverImageUrl,
            destinations,
            routeString,
            startDate: start,
            endDate: end,
            season,
            month: startDateObj.toLocaleString('en-US', { month: 'long' }),
            durationDays,
            totalCost,
            currency: 'USD',
            author: { name: authorName, avatarUrl: authorAvatar },
            createdAt: trip.created_at,
            isRelevant,
            rawTrip: trip
          };
        });

        if (isLoadMore) {
          setPublicTrips(prev => [...prev, ...enriched]);
          setPage(currentPage);
        } else {
          setPublicTrips(enriched);
        }
        
        // If we received fewer items than requested, we're at the end
        setHasMore(data.length === PAGE_SIZE);
      }
    } catch (err) {
      console.error('Failed to load community trips:', err);
      setError(err.message);
      if (!isLoadMore) setPublicTrips([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [userUpcomingDestinations, page]);

  useEffect(() => {
    fetchPublicTrips();
  }, [userUpcomingDestinations]); // Only re-run when relevant destinations change (or mount)

  const loadMore = () => {
    if (!loading && !loadingMore && hasMore) {
      fetchPublicTrips(true);
    }
  };

  return { publicTrips, loading, loadingMore, hasMore, loadMore, error, refetch: fetchPublicTrips, userUpcomingDestinations };
}
