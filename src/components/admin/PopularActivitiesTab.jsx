import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function PopularActivitiesTab({ data }) {
  const { rawTrips = [] } = data;

  const [timeRange, setTimeRange] = useState('30');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterCity, setFilterCity] = useState('all');

  const { categoryData, topActivities, availableCategories, availableCities } = useMemo(() => {
    const now = new Date().getTime();
    const rangeMs = timeRange === 'all' ? Infinity : parseInt(timeRange) * 24 * 60 * 60 * 1000;
    const currentStart = now - rangeMs;
    
    const currentTrips = rawTrips.filter(t => timeRange === 'all' || new Date(t.created_at).getTime() >= currentStart);

    const categoryCounts = {};
    const activityCounts = {};
    const cats = new Set();
    const cities = new Set();

    currentTrips.forEach(t => {
      (t.trip_stops || []).forEach(stop => {
        if (stop.city?.name) cities.add(stop.city.name);

        (stop.stop_activities || []).forEach(sa => {
          if (sa.activity) {
            const cat = sa.activity.category || 'Other';
            cats.add(cat);
            const cityName = stop.city?.name || 'Unknown';
            const actName = sa.activity.name;
            
            // Check filters BEFORE accumulating for the bar chart / table
            const matchCat = filterCategory === 'all' || cat === filterCategory;
            const matchCity = filterCity === 'all' || cityName === filterCity;
            
            // We always calculate overall category breakdown regardless of category filter
            // But if city filter is on, we restrict the pie chart to that city.
            if (filterCity === 'all' || cityName === filterCity) {
              categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
            }

            if (matchCat && matchCity) {
              if (!activityCounts[actName]) {
                activityCounts[actName] = { name: actName, category: cat, count: 0, costAcc: 0 };
              }
              activityCounts[actName].count += 1;
              activityCounts[actName].costAcc += (sa.custom_cost_override ?? sa.activity.estimated_cost ?? 0);
            }
          }
        });
      });
    });

    const catData = Object.entries(categoryCounts).map(([name, value]) => ({ name, value }));
    const topActs = Object.values(activityCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(a => ({ ...a, avgCost: Math.round(a.costAcc / a.count) }));

    return {
      categoryData: catData,
      topActivities: topActs,
      availableCategories: Array.from(cats).sort(),
      availableCities: Array.from(cities).sort()
    };
  }, [rawTrips, timeRange, filterCategory, filterCity]);

  const COLORS = ['#C4622D', '#2B5D6B', '#4A7A4E', '#B3452E', '#6B7268', '#D9A05B'];

  const exportCSV = () => {
    if (topActivities.length === 0) return;
    const headers = ['Rank', 'Activity', 'Category', 'Times Added', 'Avg Cost'];
    const rows = topActivities.map((act, i) => [
      i + 1, 
      act.name, 
      act.category, 
      act.count, 
      act.avgCost
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "popular_activities_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-[32px]">
      
      {/* Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-[16px]">
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

        <div className="flex items-center gap-[12px] w-full md:w-auto">
          <select 
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full md:w-[160px] bg-surface border border-border rounded-[8px] px-[12px] py-[8px] text-[13px] text-ink focus:outline-none focus:border-horizon"
          >
            <option value="all">All Categories</option>
            {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select 
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
            className="w-full md:w-[160px] bg-surface border border-border rounded-[8px] px-[12px] py-[8px] text-[13px] text-ink focus:outline-none focus:border-horizon"
          >
            <option value="all">All Cities</option>
            {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[24px]">
        {/* Category Breakdown (Pie Chart) */}
        <div className="bg-surface border border-border rounded-[12px] p-[24px] shadow-sm lg:col-span-1">
          <div className="mb-[20px]">
            <h3 className="font-['Fraunces'] text-[18px] font-semibold text-ink">Category Breakdown</h3>
            <p className="text-[13px] text-muted">% of activities</p>
          </div>
          <div className="h-[260px]">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E4DDD0' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted text-[14px]">No category data</div>
            )}
          </div>
        </div>

        {/* Top Individual Activities (Bar Chart) */}
        <div className="bg-surface border border-border rounded-[12px] p-[24px] shadow-sm lg:col-span-2">
          <div className="mb-[20px]">
            <h3 className="font-['Fraunces'] text-[18px] font-semibold text-ink">Most Popular Activities</h3>
            <p className="text-[13px] text-muted">Top individual activities added to trips</p>
          </div>
          <div className="h-[260px]">
            {topActivities.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topActivities} margin={{ top: 10, right: 20, bottom: 30, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4DDD0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7268' }} axisLine={false} tickLine={false} interval={0} angle={-15} textAnchor="end" />
                  <YAxis tick={{ fontSize: 12, fill: '#6B7268' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: '#FBF7F0' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E4DDD0' }}
                  />
                  <Bar dataKey="count" name="Times Added" fill="#4A7A4E" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted text-[14px]">No activity data matching filters</div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-[12px] shadow-sm overflow-hidden">
        <div className="p-[20px] border-b border-border flex items-center justify-between">
          <h3 className="font-['Fraunces'] text-[18px] font-semibold text-ink">Top Activities List</h3>
          <button 
            onClick={exportCSV}
            disabled={topActivities.length === 0}
            className="flex items-center gap-[6px] px-[12px] py-[8px] bg-bg border border-border rounded-[6px] text-[13px] font-medium text-ink hover:border-horizon transition-colors disabled:opacity-50"
          >
            Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg border-b border-border text-[12px] font-medium uppercase tracking-wider text-muted font-['IBM_Plex_Mono']">
                <th className="p-[16px]">Rank</th>
                <th className="p-[16px]">Activity</th>
                <th className="p-[16px]">Category</th>
                <th className="p-[16px] text-right">Times Added</th>
                <th className="p-[16px] text-right">Avg Cost</th>
              </tr>
            </thead>
            <tbody>
              {topActivities.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-[32px] text-center text-[14px] text-muted">No data matching filters</td>
                </tr>
              ) : (
                topActivities.map((act, index) => (
                  <tr key={act.name} className="border-b border-border/50 hover:bg-bg/50 transition-colors">
                    <td className="p-[16px] text-[14px] text-muted font-['IBM_Plex_Mono']">#{index + 1}</td>
                    <td className="p-[16px] text-[15px] font-medium text-ink">{act.name}</td>
                    <td className="p-[16px]">
                      <span className="px-[8px] py-[2px] rounded-full bg-surface border border-border text-ink text-[11px] font-medium">
                        {act.category}
                      </span>
                    </td>
                    <td className="p-[16px] text-[14px] font-medium text-ink text-right">{act.count}</td>
                    <td className="p-[16px] text-[14px] text-muted font-['IBM_Plex_Mono'] text-right">₹{act.avgCost}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
