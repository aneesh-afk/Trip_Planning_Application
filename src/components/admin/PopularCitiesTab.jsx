import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function PopularCitiesTab({ data }) {
  const { rawTrips = [] } = data;
  
  const [timeRange, setTimeRange] = useState('30'); // '30', '90', '365', 'all'
  const [searchCity, setSearchCity] = useState('');
  
  const [drilldownModal, setDrilldownModal] = useState({ open: false, city: null, activities: [] });

  const { topCities, previousTopCities } = useMemo(() => {
    const now = new Date().getTime();
    const rangeMs = timeRange === 'all' ? Infinity : parseInt(timeRange) * 24 * 60 * 60 * 1000;
    const currentStart = now - rangeMs;
    const previousStart = currentStart - rangeMs;

    const processTrips = (trips) => {
      const cityCounts = {};
      trips.forEach(t => {
        (t.trip_stops || []).forEach(stop => {
          if (stop.city?.name) {
            const name = stop.city.name;
            if (!cityCounts[name]) {
              cityCounts[name] = { name, country: stop.city.country, count: 0, costAcc: 0, visits: 0, rawActivities: [] };
            }
            cityCounts[name].count += 1;
            cityCounts[name].costAcc += (stop.stay_cost_per_night || 0);
            cityCounts[name].visits += 1;
            
            if (stop.stop_activities) {
              cityCounts[name].rawActivities.push(...stop.stop_activities);
            }
          }
        });
      });
      return cityCounts;
    };

    // Filter current period
    const currentTrips = rawTrips.filter(t => timeRange === 'all' || new Date(t.created_at).getTime() >= currentStart);
    const previousTrips = rawTrips.filter(t => timeRange !== 'all' && new Date(t.created_at).getTime() >= previousStart && new Date(t.created_at).getTime() < currentStart);

    const currentCounts = processTrips(currentTrips);
    const previousCounts = processTrips(previousTrips);

    // Filter by search
    const filteredCities = Object.values(currentCounts).filter(c => {
      if (!searchCity) return true;
      const q = searchCity.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.country?.toLowerCase().includes(q);
    });

    const top = filteredCities
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(c => {
        const prevVisits = previousCounts[c.name]?.visits || 0;
        const trend = c.visits - prevVisits;
        
        // Compute popular activities for drilldown
        const actCounts = {};
        c.rawActivities.forEach(sa => {
          if (sa.activity?.name) {
            actCounts[sa.activity.name] = (actCounts[sa.activity.name] || 0) + 1;
          }
        });
        const topActs = Object.entries(actCounts).map(([n, v]) => ({ name: n, count: v })).sort((a,b) => b.count - a.count).slice(0, 5);

        return {
          name: c.name,
          country: c.country,
          visits: c.visits,
          avgCost: c.visits > 0 ? Math.round(c.costAcc / c.visits) : 0,
          trend, // positive = up, negative = down
          trendPct: prevVisits === 0 ? 100 : Math.round((trend / prevVisits) * 100),
          topActs
        };
      });

    return { topCities: top };
  }, [rawTrips, timeRange, searchCity]);

  const COLORS = { route: '#C4622D', horizon: '#2B5D6B' };

  const exportCSV = () => {
    if (topCities.length === 0) return;
    const headers = ['Rank', 'City', 'Country', 'Total Visits', 'Avg Stay Cost', 'Trend'];
    const rows = topCities.map((c, i) => [
      i + 1, 
      c.name, 
      c.country, 
      c.visits, 
      c.avgCost,
      `${c.trend > 0 ? '+' : ''}${c.trendPct}%`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "popular_cities_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="flex flex-col gap-[32px]">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-[16px]">
          <div className="flex items-center gap-[8px] bg-surface p-[4px] border border-border rounded-[8px]">
            {['30', '90', '365', 'all'].map(t => (
              <button 
                key={t}
                onClick={() => setTimeRange(t)}
                className={`px-[12px] py-[6px] rounded-[4px] text-[13px] font-medium transition-colors ${
                  timeRange === t ? 'bg-bg text-ink shadow-sm' : 'text-muted hover:text-ink'
                }`}
              >
                {t === 'all' ? 'All Time' : `Last ${t} Days`}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-[240px]">
            <input 
              type="text" 
              placeholder="Filter by city or country..." 
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              className="w-full bg-surface border border-border rounded-[8px] px-[12px] py-[8px] text-[14px] text-ink focus:outline-none focus:border-horizon"
            />
          </div>
        </div>

        {/* Chart */}
        <div className="bg-surface border border-border rounded-[12px] p-[24px] shadow-sm">
          <div className="mb-[20px] flex items-center justify-between">
            <div>
              <h3 className="font-['Fraunces'] text-[18px] font-semibold text-ink">Most Visited Cities</h3>
              <p className="text-[13px] text-muted">Top 10 cities based on trip itineraries</p>
            </div>
            <button 
              onClick={exportCSV}
              disabled={topCities.length === 0}
              className="flex items-center gap-[6px] px-[12px] py-[8px] bg-bg border border-border rounded-[6px] text-[13px] font-medium text-ink hover:border-horizon transition-colors disabled:opacity-50"
            >
              Export CSV
            </button>
          </div>
          <div className="h-[340px]">
            {topCities.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCities} margin={{ top: 10, right: 20, bottom: 30, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4DDD0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7268' }} axisLine={false} tickLine={false} interval={0} angle={-45} textAnchor="end" />
                  <YAxis tick={{ fontSize: 12, fill: '#6B7268' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: '#FBF7F0' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E4DDD0' }}
                  />
                  <Bar dataKey="visits" name="Visits" fill={COLORS.horizon} radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted text-[14px]">No city data available</div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-surface border border-border rounded-[12px] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-bg border-b border-border text-[12px] font-medium uppercase tracking-wider text-muted font-['IBM_Plex_Mono']">
                  <th className="p-[16px]">Rank</th>
                  <th className="p-[16px]">City</th>
                  <th className="p-[16px]">Country</th>
                  <th className="p-[16px] text-right">Visits</th>
                  <th className="p-[16px] text-right">Trend</th>
                  <th className="p-[16px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {topCities.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-[32px] text-center text-[14px] text-muted">No data</td>
                  </tr>
                ) : (
                  topCities.map((city, index) => (
                    <tr key={city.name} className="border-b border-border/50 hover:bg-bg/50 transition-colors group">
                      <td className="p-[16px] text-[14px] text-muted font-['IBM_Plex_Mono']">#{index + 1}</td>
                      <td className="p-[16px] text-[15px] font-medium text-ink">{city.name}</td>
                      <td className="p-[16px] text-[14px] text-muted">{city.country}</td>
                      <td className="p-[16px] text-[14px] font-medium text-ink text-right">{city.visits}</td>
                      <td className="p-[16px] text-right">
                        {city.trend === 0 || timeRange === 'all' ? (
                          <span className="text-[13px] text-muted">-</span>
                        ) : (
                          <span className={`text-[12px] font-bold flex items-center justify-end gap-[4px] ${city.trend > 0 ? 'text-success' : 'text-danger'}`}>
                            {city.trend > 0 ? '↑' : '↓'} {Math.abs(city.trendPct)}%
                          </span>
                        )}
                      </td>
                      <td className="p-[16px] text-right">
                        <button 
                          onClick={() => setDrilldownModal({ open: true, city })}
                          className="text-[13px] font-medium text-horizon hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          View Activities
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Drilldown Modal */}
      {drilldownModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-[24px] bg-ink/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface w-full max-w-[500px] rounded-[16px] shadow-xl overflow-hidden border border-border flex flex-col max-h-[80vh]">
            <div className="p-[20px] border-b border-border flex items-center justify-between bg-bg">
              <h2 className="font-['Fraunces'] text-[20px] font-semibold text-ink">
                Popular Activities in {drilldownModal.city.name}
              </h2>
              <button onClick={() => setDrilldownModal({ open: false, city: null })} className="text-muted hover:text-ink">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-[20px] h-[20px]"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="p-[20px] overflow-y-auto">
              {drilldownModal.city.topActs.length === 0 ? (
                <div className="text-center text-muted py-[40px] text-[14px]">No activities recorded in this city.</div>
              ) : (
                <div className="flex flex-col gap-[12px]">
                  {drilldownModal.city.topActs.map((act, i) => (
                    <div key={i} className="flex items-center justify-between border-b border-border/50 pb-[12px] last:border-0 last:pb-0">
                      <span className="text-[14px] font-medium text-ink">{act.name}</span>
                      <span className="text-[12px] font-['IBM_Plex_Mono'] text-muted bg-bg px-[8px] py-[2px] rounded-full border border-border">
                        Added {act.count} times
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
