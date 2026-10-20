import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePublicItinerary } from '../hooks/usePublicItinerary';
import { calculateGaps } from '../hooks/useItinerary';

export default function PublicTrip() {
  const { slug } = useParams();
  const { trip, tripStops, activities, loading, error } = usePublicItinerary(slug);

  const [searchQuery, setSearchQuery] = useState('');
  const [groupBy, setGroupBy] = useState('day');
  const [sortBy, setSortBy] = useState('time_asc');
  const [filterType, setFilterType] = useState('all');
  
  const [showGroup, setShowGroup] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [showFilter, setShowFilter] = useState(false);

  const [collapsedDays, setCollapsedDays] = useState(new Set());

  const toggleDayCollapse = (dayNumber) => {
    setCollapsedDays(prev => {
      const next = new Set(prev);
      if (next.has(dayNumber)) next.delete(dayNumber);
      else next.add(dayNumber);
      return next;
    });
  };

  const getDaysInStop = (stop) => {
    if (!trip) return [];
    const days = [];
    const start = new Date(stop.start_date); start.setHours(0,0,0,0);
    const end = new Date(stop.end_date); end.setHours(0,0,0,0);
    const tripStart = new Date(trip.start_date); tripStart.setHours(0,0,0,0);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateObj = new Date(d);
      const dateStr = dateObj.toISOString().split('T')[0];
      const dayNumber = Math.max(1, Math.round((dateObj - tripStart) / (1000 * 60 * 60 * 24)) + 1);
      days.push({ dateStr, dayNumber });
    }
    return days;
  };

  const nonDayProcessedData = useMemo(() => {
    if (groupBy === 'day') return [];
    let filtered = [...activities];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(a => a.title.toLowerCase().includes(q) || a.city_name.toLowerCase().includes(q));
    }
    if (filterType !== 'all') {
      filtered = filtered.filter(a => a.category.toLowerCase() === filterType.toLowerCase());
    }

    filtered.sort((a, b) => {
      if (sortBy === 'time_asc') {
        if (a.time && b.time) return a.time.localeCompare(b.time);
        return a.order_index - b.order_index;
      }
      if (sortBy === 'cost_desc') return b.cost - a.cost;
      if (sortBy === 'cost_asc') return a.cost - b.cost;
      return 0;
    });

    const groups = {};
    filtered.forEach(act => {
      let key = 'Other';
      if (groupBy === 'category') key = act.category || 'Other';
      if (groupBy === 'cost') key = act.cost > 100 ? 'High Cost ($100+)' : (act.cost > 0 ? 'Low Cost' : 'Free');

      if (!groups[key]) groups[key] = { items: [], totalCost: 0 };
      groups[key].items.push(act);
      groups[key].totalCost += act.cost;
    });
    return Object.entries(groups);
  }, [activities, searchQuery, filterType, sortBy, groupBy]);

  const grandTotal = activities.reduce((sum, act) => sum + act.cost, 0);

  if (loading) return <div className="min-h-screen bg-bg p-8 text-muted flex justify-center items-center font-['IBM_Plex_Mono']">Loading itinerary...</div>;
  if (error || !trip) return <div className="min-h-screen bg-bg p-8 text-danger flex justify-center items-center font-['IBM_Plex_Mono']">{error || 'Trip not found.'}</div>;

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-bg relative" onClick={() => { setShowGroup(false); setShowSort(false); setShowFilter(false); }}>
      
      <main className="flex-1 flex flex-col min-h-screen pb-[100px]">
        {/* Top App Bar */}
        <div className="p-[18px] lg:p-[24px] border-b border-border bg-bg/80 backdrop-blur-sm z-10 sticky top-0 flex flex-col gap-[16px]">
          <div className="flex items-center justify-between">
            <h2 className="font-['Fraunces'] text-[18px] font-semibold text-ink">Public Itinerary</h2>
            <div className="flex gap-[12px]">
              <Link to="/community" className="text-[13px] font-medium px-[16px] py-[8px] border border-border bg-surface text-ink rounded-[8px] hover:border-horizon transition-colors">Back to Community</Link>
            </div>
          </div>
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-[16px]">
            {/* Search */}
            <div className="flex-1 max-w-[480px] relative flex items-center bg-surface border border-border rounded-[12px] px-[12px] focus-within:border-horizon transition-all">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" className="w-[15px] h-[15px] stroke-muted shrink-0"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
              <input 
                type="text" 
                placeholder="Search activities..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-ink font-['Inter'] text-[14px] py-[10px] px-[8px] w-full placeholder:text-muted" 
              />
            </div>

            {/* Controls */}
            <div className="flex items-center gap-[12px] flex-wrap lg:flex-nowrap pb-1 lg:pb-0">
              
              {/* Group By */}
              <div className="relative">
                <button onClick={(e) => { e.stopPropagation(); setShowGroup(!showGroup); setShowSort(false); setShowFilter(false); }} className={`flex items-center gap-[6px] h-[36px] px-[12px] rounded-[10px] bg-surface border transition-all shrink-0 ${showGroup ? 'border-route shadow-sm' : 'border-border hover:border-muted'}`}>
                  <span className="text-[13px] font-medium text-ink">Group: {groupBy}</span>
                </button>
                {showGroup && (
                  <div className="absolute right-0 mt-2 w-32 bg-surface border border-border rounded-[8px] shadow-lg py-1 z-20">
                    <button onClick={() => setGroupBy('day')} className="w-full text-left px-4 py-2 text-[13px] text-ink hover:bg-bg">By Day</button>
                    <button onClick={() => setGroupBy('category')} className="w-full text-left px-4 py-2 text-[13px] text-ink hover:bg-bg">By Category</button>
                    <button onClick={() => setGroupBy('cost')} className="w-full text-left px-4 py-2 text-[13px] text-ink hover:bg-bg">By Cost</button>
                  </div>
                )}
              </div>

              {/* Filter */}
              <div className="relative">
                <button onClick={(e) => { e.stopPropagation(); setShowFilter(!showFilter); setShowGroup(false); setShowSort(false); }} className={`flex items-center gap-[6px] h-[36px] px-[12px] rounded-[10px] bg-surface border transition-all shrink-0 ${showFilter ? 'border-route shadow-sm' : 'border-border hover:border-muted'}`}>
                  <span className="text-[13px] font-medium text-ink">Filter</span>
                </button>
                {showFilter && (
                  <div className="absolute right-0 mt-2 w-36 bg-surface border border-border rounded-[8px] shadow-lg py-1 z-20">
                    <button onClick={() => setFilterType('all')} className="w-full text-left px-4 py-2 text-[13px] text-ink hover:bg-bg">All</button>
                    <button onClick={() => setFilterType('food')} className="w-full text-left px-4 py-2 text-[13px] text-ink hover:bg-bg">Food</button>
                    <button onClick={() => setFilterType('sightseeing')} className="w-full text-left px-4 py-2 text-[13px] text-ink hover:bg-bg">Sightseeing</button>
                  </div>
                )}
              </div>

              {/* Sort By */}
              <div className="relative">
                <button onClick={(e) => { e.stopPropagation(); setShowSort(!showSort); setShowGroup(false); setShowFilter(false); }} className={`flex items-center gap-[6px] h-[36px] px-[12px] rounded-[10px] bg-surface border transition-all shrink-0 ${showSort ? 'border-route shadow-sm' : 'border-border hover:border-muted'}`}>
                  <span className="text-[13px] font-medium text-ink">Sort</span>
                </button>
                {showSort && (
                  <div className="absolute right-0 mt-2 w-36 bg-surface border border-border rounded-[8px] shadow-lg py-1 z-20">
                    <button onClick={() => setSortBy('time_asc')} className="w-full text-left px-4 py-2 text-[13px] text-ink hover:bg-bg">Time</button>
                    <button onClick={() => setSortBy('cost_desc')} className="w-full text-left px-4 py-2 text-[13px] text-ink hover:bg-bg">Highest Cost</button>
                    <button onClick={() => setSortBy('cost_asc')} className="w-full text-left px-4 py-2 text-[13px] text-ink hover:bg-bg">Lowest Cost</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Page Title */}
        <div className="px-[24px] py-[32px] max-w-[800px] mx-auto w-full">
          <h1 className="font-['Fraunces'] text-[28px] font-bold text-ink text-center mb-[8px]">
            {trip?.name || 'Selected Place'}
          </h1>
          <p className="text-center text-muted text-[14px]">
            {activities.length} activities planned
          </p>
        </div>

        {/* Itinerary Body */}
        <div className="px-[16px] md:px-[24px] max-w-[800px] mx-auto w-full">

          {activities.length === 0 && groupBy === 'day' && tripStops.length === 0 && (
             <div className="text-center py-12 text-muted bg-surface rounded-[16px] border border-border border-dashed">
               This itinerary is currently empty.
             </div>
          )}

          {/* Render Grouping by Day (City -> Day hierarchy) */}
          {groupBy === 'day' && tripStops.map((stop) => {
             const days = getDaysInStop(stop);
             return (
               <div key={stop.id} className="mb-[48px]">
                 {/* City Header */}
                 <div className="flex items-center gap-[16px] mb-[32px]">
                   <h3 className="font-['Fraunces'] text-[24px] font-semibold text-ink shrink-0">{stop.city?.name || 'Unknown City'}</h3>
                   <div className="flex-1 h-[1px] bg-border mt-1"></div>
                 </div>

                 {days.map((day) => {
                    const isCollapsed = collapsedDays.has(day.dayNumber);
                    let dayActivities = activities.filter(a => a.stop_id === stop.id && a.scheduled_date === day.dateStr);
                    if (searchQuery.trim()) {
                      dayActivities = dayActivities.filter(a => a.title.toLowerCase().includes(searchQuery.toLowerCase()));
                    }
                    if (filterType !== 'all') {
                      dayActivities = dayActivities.filter(a => a.category.toLowerCase() === filterType.toLowerCase());
                    }

                    const dayTotal = dayActivities.reduce((sum, a) => sum + a.cost, 0);
                    const processedActivities = calculateGaps(dayActivities);

                    return (
                      <div key={day.dateStr} className="mb-[40px]">
                        {/* Collapsible Day Badge */}
                        <div className="mb-[20px] flex items-center gap-[12px] cursor-pointer group" onClick={() => toggleDayCollapse(day.dayNumber)}>
                          <div className="bg-surface-hi border border-border px-[14px] py-[6px] rounded-full flex items-center gap-[8px] group-hover:border-muted transition-colors">
                            <span className="font-['Fraunces'] font-semibold text-[15px] text-ink tracking-[0.2px]">Day {day.dayNumber}</span>
                            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" className={`w-[14px] h-[14px] stroke-muted transition-transform ${isCollapsed ? 'rotate-180' : ''}`}><path d="M6 9l6 6 6-6"/></svg>
                          </div>
                          <div className="text-[12px] text-muted font-['IBM_Plex_Mono']">
                            {new Date(day.dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric'})}
                          </div>
                          <div className="flex-1 h-[1px] bg-border"></div>
                        </div>

                        {!isCollapsed && (
                          <div className="flex flex-col min-h-[60px] relative">
                            {processedActivities.length === 0 ? (
                                <div className="py-[20px] text-center text-muted font-['IBM_Plex_Mono'] text-[13px] border border-dashed border-border rounded-[12px]">
                                    No activities scheduled.
                                </div>
                            ) : (
                                <div className="flex flex-col">
                                    {processedActivities.map((act, idx) => (
                                        <div key={act.id} className="relative pl-[40px] pb-[24px]">
                                            {/* Timeline Line */}
                                            {idx < processedActivities.length - 1 && (
                                                <div className="absolute top-[32px] bottom-[-8px] left-[15px] w-[2px] bg-border z-0"></div>
                                            )}

                                            {/* Timeline Node */}
                                            <div className="absolute top-[8px] left-[7px] w-[18px] h-[18px] rounded-full bg-surface border-4 border-bg z-10 flex items-center justify-center shadow-sm">
                                                <div className="w-[8px] h-[8px] rounded-full bg-route"></div>
                                            </div>
                                            
                                            {/* Read Only Activity Card */}
                                            <div className="bg-surface border border-border rounded-[16px] overflow-hidden flex flex-col md:flex-row shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex flex-col md:flex-row flex-1">
                                                    <div className="w-full md:w-[120px] h-[100px] md:h-auto bg-bg shrink-0 border-b md:border-b-0 md:border-r border-border flex items-center justify-center overflow-hidden">
                                                        {act.image_url ? (
                                                            <img src={act.image_url} alt={act.title} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="text-[28px]">{act.category === 'food' ? '🍔' : act.category === 'sightseeing' ? '📸' : '📍'}</span>
                                                        )}
                                                    </div>
                                                    <div className="p-[16px] flex-1 flex flex-col justify-center">
                                                        <h4 className="font-semibold text-ink text-[16px] mb-[4px] leading-tight">{act.title}</h4>
                                                        <div className="text-[13px] text-muted line-clamp-1">{act.description || 'No description provided.'}</div>
                                                        <div className="flex items-center gap-[12px] mt-[8px]">
                                                            <span className="text-[12px] font-medium text-ink bg-bg px-[8px] py-[2px] rounded-full capitalize">{act.category}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="w-full md:w-[160px] bg-surface-hi border-t md:border-t-0 md:border-l border-border p-[16px] flex md:flex-col justify-between md:justify-center items-center md:items-end shrink-0">
                                                    <div className="flex flex-col items-start md:items-end">
                                                        <span className="text-[11px] text-muted font-medium uppercase tracking-[0.5px] mb-[2px]">Time</span>
                                                        <span className="font-['IBM_Plex_Mono'] text-[15px] font-bold text-ink">
                                                            {act.time ? act.time : 'Flexible'}
                                                        </span>
                                                        {act.endTime && (
                                                            <span className="text-[12px] text-muted font-['IBM_Plex_Mono']">
                                                                until {act.endTime}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[11px] text-muted font-medium uppercase tracking-[0.5px] mb-[2px]">Est. Cost</span>
                                                        <span className="font-['IBM_Plex_Mono'] text-[15px] font-bold text-ink">
                                                            ${act.cost.toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                          </div>
                        )}
                        
                        {/* Daily Summary */}
                        {!isCollapsed && dayActivities.length > 0 && (
                          <div className="mt-[20px] flex justify-end px-[16px]">
                            <div className="text-[13px] text-muted">
                              Total for Day {day.dayNumber}: 
                              <b className="font-['IBM_Plex_Mono'] text-ink ml-[8px] text-[15px]">${dayTotal.toFixed(2)}</b>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                 })}
               </div>
             );
          })}
          
          {/* Render Grouping by Category or Cost */}
          {groupBy !== 'day' && nonDayProcessedData.map(([groupName, groupData]) => (
            <div key={groupName} className="mb-[40px]">
              <div className="mb-[20px] flex items-center gap-[12px]">
                <div className="bg-surface-hi border border-border px-[14px] py-[6px] rounded-full">
                  <span className="font-['Fraunces'] font-semibold text-[15px] text-ink tracking-[0.2px] capitalize">{groupName}</span>
                </div>
                <div className="flex-1 h-[1px] bg-border"></div>
              </div>

              <div className="flex flex-col">
                {groupData.items.map((act, actIdx) => (
                  <React.Fragment key={act.id}>
                    <div className="flex gap-[12px] md:gap-[16px] items-stretch group/row relative">
                      <div className="flex-1 bg-surface border border-border rounded-[12px] p-[16px] flex flex-col md:flex-row md:items-center gap-[12px]">
                        <div className="w-[48px] h-[48px] rounded-[8px] bg-bg flex items-center justify-center border border-border shrink-0 overflow-hidden">
                          {act.image_url ? (
                            <img src={act.image_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[20px]">{act.category === 'food' ? '🍔' : act.category === 'sightseeing' ? '📸' : '📍'}</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-ink text-[16px] mb-[4px] leading-tight">{act.title}</h4>
                          <div className="flex items-center gap-[8px] text-[12.5px] text-muted">
                            <span className="font-['IBM_Plex_Mono']">Day {act.day}</span>
                            <span className="w-[4px] h-[4px] rounded-full bg-border"></span>
                            <span>{act.city_name}</span>
                          </div>
                        </div>
                      </div>

                      <div className="w-[100px] md:w-[140px] shrink-0 bg-surface border border-border rounded-[12px] p-[16px] flex flex-col items-end justify-center">
                        <span className="text-[11px] text-muted font-medium uppercase tracking-[0.5px] mb-[2px]">Cost</span>
                        <span className="font-['IBM_Plex_Mono'] text-[16px] font-bold text-ink">
                          ${act.cost.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    {actIdx < groupData.items.length - 1 && <div className="h-[12px]"></div>}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}

        </div>
      </main>

      {/* Grand Total Sticky Footer */}
      <div className="fixed bottom-0 left-0 lg:left-[220px] right-0 bg-surface/95 backdrop-blur-md border-t border-border p-[20px] px-[24px] flex justify-between items-center z-30 shadow-[0_-4px_24px_rgba(0,0,0,0.1)]">
        <div>
          <div className="text-[12px] font-medium text-muted uppercase tracking-[1px] mb-[2px]">Trip Grand Total</div>
          <div className="text-[13px] text-muted">Based on all selected activities</div>
        </div>
        <div className="font-['IBM_Plex_Mono'] text-[24px] font-bold text-route">
          ${grandTotal.toFixed(2)}
        </div>
      </div>
    </div>
  );
}
