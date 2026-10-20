import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAnalytics } from '../../hooks/useAdminAnalytics';
import { supabase } from '../../lib/supabaseClient';

import UserTrendsTab from '../../components/admin/UserTrendsTab';
import ManageUsersTab from '../../components/admin/ManageUsersTab';
import PopularCitiesTab from '../../components/admin/PopularCitiesTab';
import PopularActivitiesTab from '../../components/admin/PopularActivitiesTab';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { loading, error, aggregatedData, dateRange, setDateRange } = useAdminAnalytics();
  
  const [activeTab, setActiveTab] = useState('trends'); // 'trends', 'users', 'cities', 'activities'
  const [globalSearch, setGlobalSearch] = useState('');

  const handleLogout = async () => {
    const { error: signOutError } = await supabase.auth.signOut();
    if (!signOutError) navigate('/login', { replace: true });
  };

  const tabs = [
    { id: 'trends', label: 'User Trends & Analytics' },
    { id: 'users', label: 'Manage Users' },
    { id: 'cities', label: 'Popular Cities' },
    { id: 'activities', label: 'Popular Activities' },
  ];

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Top App Bar */}
      <header className="h-[64px] bg-surface border-b border-border px-[24px] flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-[12px] cursor-pointer" onClick={() => navigate('/dashboard')}>
          <div className="w-[32px] h-[32px] rounded-full bg-route/10 flex items-center justify-center">
            <span className="font-['Fraunces'] font-bold text-route text-[16px]">G</span>
          </div>
          <div className="font-['Fraunces'] font-semibold text-[20px] text-ink">
            Admin Panel
          </div>
        </div>
        
        <div className="flex items-center gap-[16px]">
          <div className="flex items-center gap-[8px] bg-surface border border-border rounded-full px-[12px] py-[6px]">
            <div className="w-[24px] h-[24px] rounded-full bg-horizon/20 text-horizon flex items-center justify-center text-[12px] font-bold">
              A
            </div>
            <span className="text-[13px] font-medium text-ink">Admin User</span>
          </div>
          <button 
            onClick={handleLogout}
            className="text-[13px] font-medium text-muted hover:text-danger transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-[24px] max-w-[1400px] mx-auto w-full">
        {/* Controls Bar */}
        <div className="flex flex-col xl:flex-row items-center justify-between gap-[16px] mb-[32px]">
          <div className="flex items-center gap-[12px] w-full xl:w-auto overflow-x-auto custom-scrollbar pb-[4px] xl:pb-0">
            <div className="relative shrink-0 w-[240px]">
              <div className="absolute left-[12px] top-1/2 -translate-y-1/2 text-muted">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-[16px] h-[16px]"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              </div>
              <input 
                type="text" 
                placeholder="Search across tables..." 
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="w-full bg-surface border border-border rounded-[8px] pl-[36px] pr-[12px] py-[8px] text-[14px] text-ink focus:outline-none focus:border-horizon"
              />
            </div>
            
            <div className="flex items-center gap-[8px] shrink-0">
              <select className="bg-surface border border-border rounded-[8px] px-[12px] py-[8px] text-[13px] text-ink focus:outline-none focus:border-horizon">
                <option value="">Group by...</option>
                <option value="city">City</option>
                <option value="category">Category</option>
                <option value="cohort">User Cohort</option>
              </select>
              <select className="bg-surface border border-border rounded-[8px] px-[12px] py-[8px] text-[13px] text-ink focus:outline-none focus:border-horizon">
                <option value="">Sort by...</option>
                <option value="recent">Recency</option>
                <option value="volume">Volume</option>
                <option value="growth">Growth Rate</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-[12px] w-full xl:w-auto shrink-0 bg-surface border border-border px-[16px] py-[8px] rounded-[8px]">
            <span className="text-[12px] font-medium uppercase tracking-wider text-muted font-['IBM_Plex_Mono']">Date Filter</span>
            <div className="h-[16px] w-[1px] bg-border mx-[4px]"></div>
            <input 
              type="date"
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="bg-transparent text-[13px] text-ink font-['IBM_Plex_Mono'] focus:outline-none"
            />
            <span className="text-muted text-[12px]">to</span>
            <input 
              type="date"
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="bg-transparent text-[13px] text-ink font-['IBM_Plex_Mono'] focus:outline-none"
            />
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-[8px] mb-[24px] border-b border-border overflow-x-auto custom-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-[16px] py-[12px] text-[14px] font-medium whitespace-nowrap border-b-[2px] transition-colors ${
                activeTab === tab.id 
                  ? 'border-route text-route' 
                  : 'border-transparent text-muted hover:text-ink hover:border-border'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading / Error States */}
        {loading && !aggregatedData ? (
          <div className="flex items-center justify-center h-[300px] text-muted font-['IBM_Plex_Mono']">
            Loading analytics...
          </div>
        ) : error ? (
          <div className="p-[16px] bg-danger/10 text-danger border border-danger/20 rounded-[12px]">
            Error loading data: {error}
          </div>
        ) : !aggregatedData ? (
          <div className="flex flex-col items-center justify-center p-[48px] bg-surface border border-border rounded-[16px]">
            <h3 className="font-['Fraunces'] text-[20px] font-semibold text-ink mb-[8px]">Not enough data yet</h3>
            <p className="text-[14px] text-muted text-center max-w-[400px]">
              The platform needs more users and trips before analytics can be generated.
            </p>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            {/* Tab Content */}
            {activeTab === 'trends' && <UserTrendsTab data={aggregatedData} />}
            {activeTab === 'users' && <ManageUsersTab data={aggregatedData} globalSearch={globalSearch} />}
            {activeTab === 'cities' && <PopularCitiesTab data={aggregatedData} />}
            {activeTab === 'activities' && <PopularActivitiesTab data={aggregatedData} />}
          </div>
        )}
      </main>
    </div>
  );
}
