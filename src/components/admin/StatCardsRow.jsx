import React from 'react';

export default function StatCardsRow({ stats }) {
  const { totalUsers, totalTrips, publicTripsCount, avgBudget } = stats || {};

  const cards = [
    {
      id: 'users',
      label: 'Total Users',
      value: totalUsers?.toLocaleString() || 0,
      trend: '+12% MoM',
      positive: true,
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-[18px] h-[18px]"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
    },
    {
      id: 'trips',
      label: 'Total Trips',
      value: totalTrips?.toLocaleString() || 0,
      trend: '+24% MoM',
      positive: true,
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-[18px] h-[18px]"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
    },
    {
      id: 'public',
      label: 'Public Trips',
      value: publicTripsCount?.toLocaleString() || 0,
      trend: '+5% MoM',
      positive: true,
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-[18px] h-[18px]"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
    },
    {
      id: 'budget',
      label: 'Avg. Budget/Trip',
      value: `₹${avgBudget?.toFixed(0) || 0}`,
      trend: '-2% MoM',
      positive: false,
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-[18px] h-[18px]"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[20px] mb-[32px]">
      {cards.map(c => (
        <div key={c.id} className="bg-surface border border-border rounded-[12px] p-[20px] shadow-sm flex flex-col hover:border-horizon transition-colors">
          <div className="flex items-center justify-between mb-[16px]">
            <span className="text-[13px] font-medium text-muted uppercase tracking-wider font-['IBM_Plex_Mono']">
              {c.label}
            </span>
            <div className="w-[32px] h-[32px] rounded-full bg-bg flex items-center justify-center text-ink border border-border">
              {c.icon}
            </div>
          </div>
          <div className="flex items-end justify-between">
            <span className="font-['Fraunces'] text-[32px] font-semibold text-ink leading-none">
              {c.value}
            </span>
            <span className={`text-[12px] font-medium flex items-center gap-[4px] ${c.positive ? 'text-success' : 'text-danger'}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={`w-[12px] h-[12px] ${!c.positive && 'rotate-180'}`}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
              {c.trend}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
