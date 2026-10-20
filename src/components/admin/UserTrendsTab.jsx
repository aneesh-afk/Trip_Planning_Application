import React, { useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import StatCardsRow from './StatCardsRow';

export default function UserTrendsTab({ data }) {
  const { stats, signupsData, budgetData } = data;

  // Colors based on UI_SCHEMA
  const COLORS = {
    route: '#C4622D',
    horizon: '#2B5D6B',
    success: '#4A7A4E',
    danger: '#B3452E',
    muted: '#6B7268'
  };

  const PIE_COLORS = [COLORS.route, COLORS.horizon, COLORS.success];

  // Actionable Insights Logic (Mocked logic for demo based on current data)
  const insights = useMemo(() => {
    const list = [];
    if (signupsData && signupsData.length >= 2) {
      const current = signupsData[signupsData.length - 1].users;
      const previous = signupsData[signupsData.length - 2].users;
      if (current > previous) {
        list.push(`🔥 Signups are up ${Math.round((current - previous) / previous * 100)}% this month compared to last month.`);
      } else {
        list.push(`📉 Signups are down compared to last month. Consider running a promotional campaign.`);
      }
    } else {
      list.push("🚀 Platform launched! Not enough historical data for trend comparison yet.");
    }

    if (stats.avgBudget > 1500) {
      list.push("💰 Average trip budget is skewing high. Users are planning luxury trips.");
    } else {
      list.push("🎒 Average trip budget is moderate. Most users are planning cost-effective trips.");
    }

    if (stats.publicTripsCount > (stats.totalTrips / 2)) {
      list.push("🌍 High community engagement: Over 50% of trips are set to public.");
    } else {
      list.push("🔒 Low community engagement: Most trips are private. Nudge users to share their itineraries.");
    }
    return list;
  }, [signupsData, stats]);

  return (
    <div className="flex flex-col gap-[32px]">
      <StatCardsRow stats={stats} />
      
      {/* Actionable Insights Banners */}
      <div className="bg-horizon/10 border border-horizon/20 rounded-[12px] p-[20px] flex flex-col gap-[12px]">
        <div className="flex items-center gap-[8px] mb-[4px]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-[18px] h-[18px] text-horizon"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          <h4 className="font-['Fraunces'] text-[16px] font-semibold text-horizon">Actionable Insights</h4>
        </div>
        <ul className="flex flex-col gap-[8px] text-[14px] text-ink">
          {insights.map((insight, idx) => (
            <li key={idx} className="flex items-start gap-[8px]">
              <span className="mt-[6px] w-[4px] h-[4px] bg-horizon rounded-full shrink-0"></span>
              {insight}
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[24px]">
        {/* Signups Over Time (Line Chart) */}
        <div className="bg-surface border border-border rounded-[12px] p-[24px] shadow-sm">
          <div className="mb-[20px]">
            <h3 className="font-['Fraunces'] text-[18px] font-semibold text-ink">User Signups Over Time</h3>
            <p className="text-[13px] text-muted">Monthly user growth</p>
          </div>
          <div className="h-[300px]">
            {signupsData?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={signupsData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4DDD0" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7268' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#6B7268' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E4DDD0', boxShadow: '0 4px 12px rgba(31, 42, 36, 0.12)' }}
                  />
                  <Line type="monotone" dataKey="users" stroke={COLORS.horizon} strokeWidth={3} dot={{ r: 4, fill: COLORS.horizon }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted text-[14px]">No signups data</div>
            )}
          </div>
        </div>

        {/* Budget Tiers Distribution (Bar Chart) */}
        <div className="bg-surface border border-border rounded-[12px] p-[24px] shadow-sm">
          <div className="mb-[20px]">
            <h3 className="font-['Fraunces'] text-[18px] font-semibold text-ink">Trip Budget Distribution</h3>
            <p className="text-[13px] text-muted">Total trips categorized by estimated cost</p>
          </div>
          <div className="h-[300px]">
            {budgetData?.some(d => d.count > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budgetData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4DDD0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#6B7268' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: '#6B7268' }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip 
                    cursor={{ fill: '#FBF7F0' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E4DDD0' }}
                  />
                  <Bar dataKey="count" fill={COLORS.route} radius={[0, 4, 4, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted text-[14px]">No budget data available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
