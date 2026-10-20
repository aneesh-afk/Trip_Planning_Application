import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useAdminAnalytics() {
  const [data, setData] = useState({
    users: [],
    trips: [],
    tripStops: [],
    activities: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Global filters
  const [dateRange, setDateRange] = useState({ start: null, end: null });

  const fetchRawData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all users (Requires service_role key OR a view. Since we don't have that, 
      // we'll fetch from a custom 'profiles' table if it existed, but we have auth.users.
      // Wait, client side JS CANNOT fetch auth.users. It can only fetch its own user.
      // To work around this for the hackathon without backend access, we will query 
      // the public 'trips' table to get users who have created trips, OR we assume
      // a 'users' table exists. Let's check DATABASE_SCHEMA.md.
      // DATABASE_SCHEMA.md says `users` table exists and is public!
      
      const [usersRes, tripsRes, activitiesRes] = await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('trips').select(`
          *,
          users (display_name, email),
          trip_stops (
            id, start_date, end_date, stay_cost_per_night, transport_cost_to_here,
            city:cities (id, name, country),
            stop_activities (
              id, scheduled_date, custom_cost_override,
              activity:activities (id, name, category, estimated_cost)
            )
          )
        `),
        supabase.from('activities').select('*')
      ]);

      if (usersRes.error) throw usersRes.error;
      if (tripsRes.error) throw tripsRes.error;
      if (activitiesRes.error) throw activitiesRes.error;

      setData({
        users: usersRes.data || [],
        trips: tripsRes.data || [],
        activities: activitiesRes.data || []
      });
    } catch (err) {
      console.error('Admin Analytics Fetch Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRawData();
  }, [fetchRawData]);

  // Client-side Aggregation logic
  const aggregatedData = useMemo(() => {
    if (!data.trips.length && !data.users.length) return null;

    let filteredTrips = data.trips;
    let filteredUsers = data.users;

    // Apply global date filter if set
    if (dateRange.start && dateRange.end) {
      const s = new Date(dateRange.start).getTime();
      const e = new Date(dateRange.end).getTime();
      
      filteredTrips = data.trips.filter(t => {
        const tDate = new Date(t.created_at).getTime();
        return tDate >= s && tDate <= e;
      });
      filteredUsers = data.users.filter(u => {
        const uDate = new Date(u.created_at).getTime();
        return uDate >= s && uDate <= e;
      });
    }

    // 1. Stat Cards
    const totalUsers = filteredUsers.length;
    const totalTrips = filteredTrips.length;
    const publicTripsCount = filteredTrips.filter(t => t.is_public).length;
    
    let totalSpend = 0;
    filteredTrips.forEach(t => {
      (t.trip_stops || []).forEach(stop => {
        const nights = Math.max(1, Math.round((new Date(stop.end_date) - new Date(stop.start_date)) / 86400000));
        totalSpend += (stop.stay_cost_per_night || 0) * nights;
        totalSpend += (stop.transport_cost_to_here || 0);
        
        (stop.stop_activities || []).forEach(sa => {
          totalSpend += (sa.custom_cost_override ?? sa.activity?.estimated_cost ?? 0);
        });
      });
    });
    
    const avgBudget = totalTrips > 0 ? totalSpend / totalTrips : 0;

    // 2. Popular Cities
    const cityCounts = {};
    filteredTrips.forEach(t => {
      (t.trip_stops || []).forEach(stop => {
        if (stop.city?.name) {
          if (!cityCounts[stop.city.name]) {
            cityCounts[stop.city.name] = { name: stop.city.name, country: stop.city.country, count: 0, costAcc: 0, visits: 0 };
          }
          cityCounts[stop.city.name].count += 1;
          cityCounts[stop.city.name].costAcc += (stop.stay_cost_per_night || 0);
          cityCounts[stop.city.name].visits += 1;
        }
      });
    });
    const topCities = Object.values(cityCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(c => ({
        name: c.name,
        country: c.country,
        visits: c.visits,
        avgCost: c.visits > 0 ? Math.round(c.costAcc / c.visits) : 0
      }));

    // 3. Popular Activities & Categories
    const categoryCounts = {};
    const activityCounts = {};
    
    filteredTrips.forEach(t => {
      (t.trip_stops || []).forEach(stop => {
        (stop.stop_activities || []).forEach(sa => {
          if (sa.activity) {
            // Categories
            const cat = sa.activity.category || 'Other';
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
            
            // Specific activities
            const actName = sa.activity.name;
            if (!activityCounts[actName]) {
              activityCounts[actName] = { 
                name: actName, 
                category: cat, 
                count: 0, 
                costAcc: 0 
              };
            }
            activityCounts[actName].count += 1;
            activityCounts[actName].costAcc += (sa.custom_cost_override ?? sa.activity.estimated_cost ?? 0);
          }
        });
      });
    });

    const categoryData = Object.entries(categoryCounts).map(([name, value]) => ({ name, value }));
    const topActivities = Object.values(activityCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(a => ({
        name: a.name,
        category: a.category,
        count: a.count,
        avgCost: Math.round(a.costAcc / a.count)
      }));

    // 4. Budget Tiers
    let budgetTiers = { low: 0, med: 0, high: 0 };
    filteredTrips.forEach(t => {
      let tCost = 0;
      (t.trip_stops || []).forEach(stop => {
        const nights = Math.max(1, Math.round((new Date(stop.end_date) - new Date(stop.start_date)) / 86400000) || 1);
        tCost += (stop.stay_cost_per_night || 0) * nights + (stop.transport_cost_to_here || 0);
        (stop.stop_activities || []).forEach(sa => {
          tCost += (sa.custom_cost_override ?? sa.activity?.estimated_cost ?? 0);
        });
      });
      if (tCost < 500) budgetTiers.low += 1;
      else if (tCost < 1500) budgetTiers.med += 1;
      else budgetTiers.high += 1;
    });

    const budgetData = [
      { name: '₹ (<₹500)', count: budgetTiers.low },
      { name: '₹₹ (₹500-1500)', count: budgetTiers.med },
      { name: '₹₹₹ (>₹1500)', count: budgetTiers.high }
    ];

    // 5. Signups over time (simplified to monthly for demo)
    const signupsByMonth = {};
    filteredUsers.forEach(u => {
      const d = new Date(u.created_at);
      const m = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      signupsByMonth[m] = (signupsByMonth[m] || 0) + 1;
    });
    
    // Sort chronological
    const signupsData = Object.entries(signupsByMonth).map(([month, count]) => ({
      month,
      users: count
    })); // Very naive sort for hackathon scope.

    return {
      stats: { totalUsers, totalTrips, publicTripsCount, avgBudget },
      topCities,
      categoryData,
      topActivities,
      budgetData,
      signupsData,
      rawUsers: filteredUsers,
      rawTrips: filteredTrips
    };

  }, [data, dateRange]);

  return {
    loading,
    error,
    dateRange,
    setDateRange,
    aggregatedData,
    refetch: fetchRawData
  };
}
