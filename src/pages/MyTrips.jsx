import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTrips } from '../hooks/useTrips';


export default function MyTrips() {


  const { trips, loading, error, deleteTrip, completeTrip, optimisticComplete } = useTrips();
  
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [groupBy, setGroupBy] = useState('status'); // 'status', 'visibility'
  const [filters] = useState({
    underBudget: false,
    soloTrips: false,
    international: false,
  });

  // Group Trips by Status
  const groupedTrips = useMemo(() => {
    let processedTrips = [...(trips || [])];

    // 1. Filter
    processedTrips = processedTrips.filter((trip) => {
      // Basic search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches = trip.name?.toLowerCase().includes(q) || trip.routeString?.toLowerCase().includes(q);
        if (!matches) return false;
      }
      
      // Quick Filters (Approximations based on available data)
      // If we had a party_size field: if (filters.soloTrips && trip.party_size > 1) return false;
      if (filters.underBudget && (trip.totalCost > 1500)) return false; // dummy threshold
      if (filters.international && trip.stopsCount < 2) return false; // dummy logic: assuming >1 stop is intl

      return true;
    });

    // 2. Group
    if (groupBy === 'visibility') {
      return {
        public: processedTrips.filter(t => t.is_public),
        private: processedTrips.filter(t => !t.is_public),
      };
    }

    // Default: groupBy === 'status'
    const ongoing = [];
    const upcoming = [];
    const completed = [];
    processedTrips.forEach((trip) => {
      if (trip.computedStatus === 'ongoing') ongoing.push(trip);
      else if (trip.computedStatus === 'completed') completed.push(trip);
      else upcoming.push(trip);
    });

    return { ongoing, upcoming, completed };
  }, [trips, searchQuery, filters, groupBy]);

  // Dropdown toggle states
  const [showGroup, setShowGroup] = useState(false);
  const [completingTrip, setCompletingTrip] = useState(null);
  const [tearingTripId, setTearingTripId] = useState(null);

  const confirmCompletion = async (trip) => {
    setCompletingTrip(null);
    setTearingTripId(trip.id);
    setTimeout(() => {
      optimisticComplete(trip.id);
      completeTrip(trip.id);
      setTearingTripId(null);
    }, 800);
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-bg relative">
      
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen">
        
        {/* Top Bar (Sticky) */}
        <div className="p-[18px] lg:p-[24px] border-b border-border bg-bg/80 backdrop-blur-sm z-10 shrink-0">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-[16px]">
            {/* Search */}
            <div className="flex-1 max-w-[480px] relative flex items-center bg-surface border border-border rounded-[12px] px-[12px] focus-within:border-horizon transition-all">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" className="w-[15px] h-[15px] stroke-muted shrink-0"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
              <input 
                type="text" 
                placeholder="Search your trips…" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-ink font-['Inter'] text-[14px] py-[10px] px-[8px] w-full placeholder:text-muted" 
              />
            </div>

            {/* Controls */}
            <div className="flex items-center gap-[12px] flex-wrap lg:flex-nowrap pb-1 lg:pb-0">
              
              {/* Group By */}
              <div className="relative">
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowGroup(!showGroup); }}
                  className={`flex items-center gap-[6px] h-[40px] px-[12px] rounded-[12px] bg-surface border transition-all shrink-0 ${showGroup ? 'border-route shadow-sm' : 'border-border hover:border-muted'}`}
                >
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[16px] h-[16px] stroke-muted"><rect x="3" y="4" width="7" height="7" rx="1.5"/><rect x="14" y="4" width="7" height="7" rx="1.5"/><rect x="3" y="15" width="7" height="7" rx="1.5"/><rect x="14" y="15" width="7" height="7" rx="1.5"/></svg>
                  <span className="hidden lg:inline text-[13.5px] font-medium text-ink">Group</span>
                </button>
                {showGroup && (
                  <div className="absolute right-0 mt-2 w-32 bg-surface border border-border rounded-[8px] shadow-lg py-1 z-20">
                    <button onClick={() => { setGroupBy('status'); setShowGroup(false); }} className={`w-full text-left px-4 py-2 text-[13px] ${groupBy === 'status' ? 'text-route font-medium' : 'text-ink hover:bg-bg'}`}>By Status</button>
                    <button onClick={() => { setGroupBy('visibility'); setShowGroup(false); }} className={`w-full text-left px-4 py-2 text-[13px] ${groupBy === 'visibility' ? 'text-route font-medium' : 'text-ink hover:bg-bg'}`}>By Visibility</button>
                  </div>
                )}
              </div>
              
              <Link 
                to="/trips/new" 
                className="hidden lg:flex items-center gap-[8px] h-[40px] px-[16px] ml-[8px] rounded-[12px] bg-route text-white hover:opacity-90 transition-opacity font-medium text-[14px]"
              >
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" className="w-[16px] h-[16px] stroke-white"><path d="M12 5v14M5 12h14"/></svg>
                Add Trip
              </Link>
            </div>
          </div>
        </div>

        {/* Board / Mobile Stack */}
        <div className="flex-1 p-[18px] lg:p-[24px]" onClick={() => { setShowGroup(false); }}>
          {loading && <p className="text-muted">Loading your journeys...</p>}
          {!loading && error && <div className="text-danger p-4 border border-danger/20 rounded-[12px] bg-danger/5"><p>{error}</p></div>}

          {!loading && !error && (
            <div className="flex flex-col gap-[40px] w-full pb-[80px] lg:pb-[40px]">
              {Object.entries(groupedTrips).map(([groupKey, groupTrips]) => (
                <TripRow 
                  key={groupKey} 
                  status={groupKey} 
                  trips={groupTrips} 
                  deleteTrip={deleteTrip} 
                  onMarkCompleted={setCompletingTrip}
                  tearingTripId={tearingTripId}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Mobile FAB (hidden on lg) */}
      <div className="lg:hidden fixed bottom-[26px] left-1/2 -translate-x-1/2 w-[calc(100%-36px)] pointer-events-none flex justify-end z-20">
        <Link 
          to="/trips/new" 
          aria-label="Add trip"
          className="pointer-events-auto w-[54px] h-[54px] rounded-full bg-route text-white shadow-lg cursor-pointer flex items-center justify-center active:scale-95 transition-transform"
        >
          <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" className="w-[22px] h-[22px] stroke-white stroke-[2.4px]"><path d="M12 5v14M5 12h14"/></svg>
        </Link>
      </div>

      {/* Completion Modal */}
      {completingTrip && (
        <div className="fixed inset-0 bg-bg/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <style>{`@keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }`}</style>
          <div className="bg-surface border border-border rounded-[16px] w-full max-w-[400px] p-[24px] shadow-2xl mx-[16px] animate-[fadeIn_0.2s_ease-out_forwards]">
            <h3 className="font-['Fraunces'] text-[22px] font-semibold text-ink mb-[8px]">Complete Trip?</h3>
            <p className="text-[14px] text-muted mb-[24px]">Are you sure you want to mark <b className="text-ink">{completingTrip.name}</b> as completed?</p>

            <div className="flex justify-end gap-[12px]">
              <button onClick={() => setCompletingTrip(null)} className="px-[16px] py-[8px] rounded-[8px] font-medium text-[13.5px] text-muted hover:text-ink">Cancel</button>
              <button onClick={() => confirmCompletion(completingTrip)} className="px-[16px] py-[8px] rounded-[8px] font-medium text-[13.5px] bg-route text-white hover:opacity-90 shadow-sm">Confirm & Complete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TripRow({ status, trips, deleteTrip, onMarkCompleted, tearingTripId }) {
  const [sortBy, setSortBy] = useState('date_desc');
  const [showSort, setShowSort] = useState(false);

  const sortedTrips = useMemo(() => {
    return [...trips].sort((a, b) => {
      if (sortBy === 'date_asc') return new Date(a.start_date || 0) - new Date(b.start_date || 0);
      if (sortBy === 'date_desc') return new Date(b.start_date || 0) - new Date(a.start_date || 0);
      if (sortBy === 'cost_desc') return (b.totalCost || 0) - (a.totalCost || 0);
      return 0;
    });
  }, [trips, sortBy]);

  const statusColors = {
    ongoing: 'bg-route shadow-[0_0_0_4px_rgba(196,98,45,0.18)]',
    upcoming: 'bg-horizon shadow-[0_0_0_4px_rgba(43,93,107,0.16)]',
    completed: 'bg-success shadow-[0_0_0_4px_rgba(74,122,78,0.12)]',
    public: 'bg-horizon shadow-[0_0_0_4px_rgba(43,93,107,0.16)]',
    private: 'bg-muted shadow-[0_0_0_4px_rgba(107,114,104,0.16)]',
  };
  const titleMap = { 
    ongoing: 'Ongoing', upcoming: 'Up-coming', completed: 'Completed',
    public: 'Public Trips', private: 'Private Trips'
  };

  return (
    <div className="w-full flex flex-col shrink-0" onClick={() => setShowSort(false)}>
      {/* Row Header */}
      <div className="flex items-baseline gap-[10px] py-[4px] px-[2px] pb-[16px] select-none shrink-0 border-b border-border mb-[16px]">
        <div className={`w-[8px] h-[8px] rounded-full shrink-0 ${statusColors[status] || statusColors.upcoming}`}></div>
        <div className="font-['Fraunces'] text-[18px] font-semibold tracking-[0.2px] text-ink">{titleMap[status] || status}</div>
        <div className="font-['IBM_Plex_Mono'] text-[11px] text-muted ml-[8px] bg-surface px-[6px] py-[2px] rounded-full border border-border">
          {trips.length}
        </div>
        
        {/* Row Sort Control */}
        {trips.length > 0 && (
          <div className="relative ml-auto">
            <button 
              onClick={(e) => { e.stopPropagation(); setShowSort(!showSort); }}
              className={`flex items-center gap-[4px] h-[28px] px-[8px] rounded-[8px] bg-bg border transition-all ${showSort ? 'border-route' : 'border-border hover:border-muted'}`}
            >
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[13px] h-[13px] stroke-muted"><path d="M7 4v16M7 4l-3 3M7 4l3 3M17 20V4M17 20l3-3M17 20l-3-3"/></svg>
              <span className="text-[12px] font-medium text-muted">Sort</span>
            </button>
            {showSort && (
              <div className="absolute right-0 mt-1 w-32 bg-surface border border-border rounded-[8px] shadow-lg py-1 z-10">
                <button onClick={() => setSortBy('date_desc')} className={`w-full text-left px-3 py-1.5 text-[12px] ${sortBy === 'date_desc' ? 'text-route font-medium' : 'text-ink hover:bg-bg'}`}>Newest</button>
                <button onClick={() => setSortBy('date_asc')} className={`w-full text-left px-3 py-1.5 text-[12px] ${sortBy === 'date_asc' ? 'text-route font-medium' : 'text-ink hover:bg-bg'}`}>Oldest</button>
                <button onClick={() => setSortBy('cost_desc')} className={`w-full text-left px-3 py-1.5 text-[12px] ${sortBy === 'cost_desc' ? 'text-route font-medium' : 'text-ink hover:bg-bg'}`}>Cost</button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Cards Horizontal Scroll Area */}
      <div className="flex flex-row gap-[16px] overflow-x-auto pb-[16px] custom-scrollbar w-full snap-x px-[2px]">
        {trips.length === 0 ? (
          <div className="w-full max-w-[400px] h-[120px] rounded-[14px] border-2 border-dashed border-border bg-surface/50 flex flex-col items-center justify-center text-muted">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-[24px] h-[24px] stroke-muted/50 mb-2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span className="font-['IBM_Plex_Mono'] text-[11px]">No {status} trips</span>
          </div>
        ) : (
          sortedTrips.map((trip, idx) => (
            <BoardingPassCard 
              key={trip.id} 
              trip={trip} 
              status={trip.computedStatus || status} 
              delay={idx * 0.08} 
              deleteTrip={deleteTrip} 
              onMarkCompleted={onMarkCompleted} 
              isTearing={tearingTripId === trip.id} 
            />
          ))
        )}
      </div>
    </div>
  );
}

export function BoardingPassCard({ trip, status, delay, deleteTrip, onMarkCompleted, isTearing }) {
  const navigate = useNavigate();
  const stampColor = {
    ongoing: 'text-route border-route',
    upcoming: 'text-horizon border-horizon',
    completed: 'text-success border-success opacity-75'
  };
  const stampText = { ongoing: 'BOARDING', upcoming: 'SCHEDULED', completed: 'LANDED' };
  const progressBg = { ongoing: 'bg-route', upcoming: 'bg-horizon', completed: 'bg-success' };
  
  const progress = status === 'completed' ? 100 : status === 'ongoing' ? 50 : 10;
  
  const formatDateRange = (start, end) => {
    if (!start && !end) return 'TBD';
    const opt = { month: 'short', day: 'numeric' };
    const s = start ? new Date(start).toLocaleDateString('en-US', opt) : '';
    const e = end ? new Date(end).toLocaleDateString('en-US', opt) : '';
    if (s && e && s !== e) return `${s}–${e}`;
    return s || e || 'TBD';
  };

  const flightCode = `${trip.name.substring(0,3).toUpperCase()}-${new Date(trip.start_date || new Date()).getFullYear().toString().substr(2)}`;

  const handleCardClick = () => {
    if (isTearing) return;
    navigate(`/trips/${trip.id}/view`);
  };

  return (
    <div 
      onClick={handleCardClick}
      className={`relative flex cursor-pointer group shrink-0 outline-none ${status === 'completed' ? 'w-[196px] md:w-[236px]' : 'w-[280px] md:w-[320px]'} snap-start h-full min-h-[120px] transition-transform duration-250 ${!isTearing ? 'hover:-translate-y-[2px] drop-shadow-sm hover:drop-shadow-md' : 'pointer-events-none'}`}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') handleCardClick(); }}
    >
      <style>{`
        @keyframes cardIn { to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDownFade { to { transform: translateY(150px) scale(0.9); opacity: 0; } }
        @keyframes tearUp { 0% { transform: rotate(0deg); } 20% { transform: rotate(-5deg) translateY(5px); } 100% { transform: rotate(15deg) translateY(-150px); opacity: 0; } }
        @keyframes growBar { to { transform: scaleX(1); } }
      `}</style>
      
      {/* Left Body */}
      <div 
        className={`relative flex-1 bg-surface border border-border border-r-0 rounded-l-[14px] p-[16px] pb-[14px] overflow-hidden ${isTearing ? 'animate-[slideDownFade_0.6s_ease-in_forwards]' : 'opacity-0 translate-y-[14px] animate-[cardIn_0.55s_cubic-bezier(0.2,0.8,0.2,1)_forwards]'}`}
        style={{ animationDelay: isTearing ? '0s' : `${0.1 + delay}s` }}
      >
         {/* Top Cutout Left Half */}
         <div className="absolute top-[-8px] right-0 w-[8px] h-[16px] bg-bg rounded-l-full border-b border-l border-border z-10 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.05)]"></div>
         {/* Bottom Cutout Left Half */}
         <div className="absolute bottom-[-8px] right-0 w-[8px] h-[16px] bg-bg rounded-l-full border-t border-l border-border z-10 shadow-[inset_2px_-2px_4px_rgba(0,0,0,0.05)]"></div>
         
         {/* Perforation line on the torn edge */}
         {status === 'completed' && (
           <div className="absolute top-[12px] bottom-[12px] right-[-1px] w-[2px]" style={{ backgroundImage: 'radial-gradient(circle, #2C3350 1px, transparent 1.5px)', backgroundSize: '2px 8px' }}></div>
         )}
         
         {/* Stamp */}
         <div className={`absolute top-[14px] right-[10px] font-['IBM_Plex_Mono'] text-[9px] font-bold tracking-[1.5px] px-[8px] py-[3px] rounded-[3px] border-[1.5px] border-dashed rotate-[6deg] bg-transparent opacity-80 mix-blend-plus-lighter z-10 ${stampColor[status] || stampColor.upcoming}`}>
            {stampText[status] || 'PLANNED'}
         </div>

         <div className="relative z-10">
            <div className="font-['Fraunces'] text-[18px] font-semibold mb-[4px] flex items-center gap-[6px] text-ink line-clamp-1">
              {trip.name}
            </div>
            <div className="text-[12.5px] text-muted mb-[12px] leading-[1.4] line-clamp-2 h-[35px]">
              {trip.description || trip.routeString || 'A travel itinerary'}
            </div>
            <div className="flex gap-[16px] font-['IBM_Plex_Mono'] text-[10.5px] text-muted">
               <span className="flex flex-col gap-[2px]">
                 DATES<b className="font-['IBM_Plex_Mono'] text-ink text-[11.5px] font-medium tracking-tight">{formatDateRange(trip.start_date, trip.end_date)}</b>
               </span>
               <span className="flex flex-col gap-[2px]">
                 STOPS<b className="font-['IBM_Plex_Mono'] text-ink text-[11.5px] font-medium tracking-tight">{trip.stopsCount || 1}</b>
               </span>
            </div>
         </div>

         {/* Action Hover Overlay */}
         <div className="absolute top-[8px] left-[8px] flex gap-[6px] opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity z-20">
            <button onClick={(e) => { e.stopPropagation(); navigate(`/trips/${trip.id}/edit`); }} className="bg-surface border border-border w-[28px] h-[28px] rounded-[6px] flex items-center justify-center hover:border-route transition-colors"><svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[14px] h-[14px] stroke-muted hover:stroke-route"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg></button>
            <button onClick={(e) => { e.stopPropagation(); deleteTrip(trip.id); }} className="bg-surface border border-border w-[28px] h-[28px] rounded-[6px] flex items-center justify-center hover:border-danger transition-colors"><svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[14px] h-[14px] stroke-muted hover:stroke-danger"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"/></svg></button>
            {status === 'ongoing' && (
              <button onClick={(e) => { e.stopPropagation(); onMarkCompleted(trip); }} className="bg-surface border border-border w-[28px] h-[28px] rounded-[6px] flex items-center justify-center hover:border-success transition-colors">
                 <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[14px] h-[14px] stroke-muted hover:stroke-success"><path d="M5 13l4 4L19 7"/></svg>
              </button>
            )}
         </div>

         {/* Progress Bar */}
         <div className="mt-[12px] h-[3px] rounded-[2px] bg-border overflow-hidden relative z-10 w-full">
            <div className={`h-full rounded-[2px] origin-left scale-x-0 animate-[growBar_1s_cubic-bezier(0.2,0.8,0.2,1)_forwards] ${progressBg[status] || progressBg.upcoming}`} style={{ width: `${progress}%`, animationDelay: isTearing ? '0s' : '0.4s' }}></div>
         </div>
      </div>

      {/* Right Stub */}
      {status !== 'completed' && (
        <div 
          className={`relative w-[84px] bg-surface border border-border border-l-0 rounded-r-[14px] flex items-center justify-center ${isTearing ? 'animate-[tearUp_0.8s_ease-in_forwards]' : 'opacity-0 translate-y-[14px] animate-[cardIn_0.55s_cubic-bezier(0.2,0.8,0.2,1)_forwards]'}`} 
          style={{ transformOrigin: 'top left', animationDelay: isTearing ? '0s' : `${0.1 + delay}s` }}
        >
          {/* Cutout Right Half */}
          <div className="absolute top-[-8px] left-0 w-[8px] h-[16px] bg-bg rounded-r-full border-b border-r border-border z-10 shadow-[inset_-2px_2px_4px_rgba(0,0,0,0.05)]"></div>
          {/* Bottom Cutout Right Half */}
          <div className="absolute bottom-[-8px] left-0 w-[8px] h-[16px] bg-bg rounded-r-full border-t border-r border-border z-10 shadow-[inset_-2px_-2px_4px_rgba(0,0,0,0.05)]"></div>
          
          {/* Perforation line */}
          <div className="absolute top-[12px] bottom-[12px] left-[-1px] w-[2px]" style={{ backgroundImage: 'radial-gradient(circle, #2C3350 1px, transparent 1.5px)', backgroundSize: '2px 8px' }}></div>

          <div className="rotate-90 font-['IBM_Plex_Mono'] text-[13px] font-bold tracking-[3px] text-muted whitespace-nowrap opacity-50">
              {flightCode}
          </div>
        </div>
      )}
    </div>
  );
}
