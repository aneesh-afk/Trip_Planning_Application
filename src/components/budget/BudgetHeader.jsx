import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function BudgetHeader({ trip, currentTab, setCurrentTab }) {
  const navigate = useNavigate();

  if (!trip) return null;

  const formatDateRange = (start, end) => {
    if (!start && !end) return 'TBD';
    const opt = { month: 'short', day: 'numeric', year: 'numeric' };
    const s = start ? new Date(start).toLocaleDateString('en-US', opt) : '';
    const e = end ? new Date(end).toLocaleDateString('en-US', opt) : '';
    if (s && e && s !== e) return `${s} – ${e}`;
    return s || e || 'TBD';
  };

  return (
    <div className="bg-surface border-b border-border sticky top-0 z-10">
      <div className="max-w-[1000px] mx-auto w-full px-[24px]">
        {/* Top Nav */}
        <div className="h-[64px] flex items-center justify-between">
          <button 
            onClick={() => navigate(`/trips/${trip.id}/view`)}
            className="flex items-center gap-[8px] text-[14px] font-medium text-muted hover:text-ink transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-[16px] h-[16px]"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            Back to Itinerary
          </button>
          
          <div className="text-center">
            <h1 className="font-['Fraunces'] font-bold text-[20px] text-ink">{trip.name}</h1>
            <p className="font-['IBM_Plex_Mono'] text-[12px] text-muted">{formatDateRange(trip.start_date, trip.end_date)}</p>
          </div>
          
          <div className="flex items-center gap-[10px]">
            <button
              onClick={() => navigate(`/trips/${trip.id}/group`)}
              className="text-[13px] font-medium px-[12px] py-[6px] border border-border rounded-[8px] text-muted hover:text-ink hover:border-route transition-colors"
            >
              👥 Group & Split
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-center gap-[24px] sm:gap-[32px] pt-[12px] overflow-x-auto">
          {['Overview', 'Actual Expenses', 'By Day', 'By Category'].map(tab => (
            <button
              key={tab}
              onClick={() => setCurrentTab(tab)}
              className={`pb-[12px] text-[14px] font-medium transition-colors border-b-[2px] whitespace-nowrap ${
                currentTab === tab 
                  ? 'border-route text-route' 
                  : 'border-transparent text-muted hover:text-ink hover:border-border'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
