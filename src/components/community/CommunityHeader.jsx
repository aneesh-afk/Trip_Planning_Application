import React from 'react';

export default function CommunityHeader({ 
  searchQuery, 
  setSearchQuery, 
  postTypeFilter, 
  setPostTypeFilter, 
  sortBy, 
  setSortBy 
}) {
  return (
    <div className="bg-surface border-b border-border sticky top-0 z-10 p-[24px]">
      <div className="max-w-[1000px] mx-auto w-full">
        {/* Search Input */}
        <div className="relative w-full mb-[16px]">
          <div className="absolute left-[16px] top-1/2 -translate-y-1/2 text-muted">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-[20px] h-[20px]"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          </div>
          <input 
            type="text" 
            placeholder="Search community by destination, activity, or keywords..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-bg border border-border rounded-[12px] pl-[44px] pr-[16px] py-[14px] text-[15px] font-medium text-ink focus:outline-none focus:border-horizon shadow-sm"
          />
        </div>

        {/* Controls Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-[16px]">
          
          <div className="flex flex-wrap items-center gap-[12px] w-full sm:w-auto">
            {/* Filter: Post Type */}
            <div className="flex items-center gap-[8px] bg-bg border border-border rounded-[8px] p-[4px]">
              <button 
                onClick={() => setPostTypeFilter('')}
                className={`px-[12px] py-[6px] rounded-[4px] text-[12px] font-bold uppercase tracking-wider transition-colors ${!postTypeFilter ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink'}`}
              >
                All Posts
              </button>
              <button 
                onClick={() => setPostTypeFilter('question')}
                className={`px-[12px] py-[6px] rounded-[4px] text-[12px] font-bold uppercase tracking-wider transition-colors ${postTypeFilter === 'question' ? 'bg-horizon/10 text-horizon shadow-sm' : 'text-muted hover:text-ink'}`}
              >
                Questions
              </button>
              <button 
                onClick={() => setPostTypeFilter('recap')}
                className={`px-[12px] py-[6px] rounded-[4px] text-[12px] font-bold uppercase tracking-wider transition-colors ${postTypeFilter === 'recap' ? 'bg-route/10 text-route shadow-sm' : 'text-muted hover:text-ink'}`}
              >
                Recaps
              </button>
              <button 
                onClick={() => setPostTypeFilter('tip')}
                className={`px-[12px] py-[6px] rounded-[4px] text-[12px] font-bold uppercase tracking-wider transition-colors ${postTypeFilter === 'tip' ? 'bg-success/10 text-success shadow-sm' : 'text-muted hover:text-ink'}`}
              >
                Tips
              </button>
            </div>

            {/* Filter: Category (Placeholder) */}
            <select className="bg-bg border border-border rounded-[8px] px-[12px] py-[8px] text-[13px] font-medium text-ink focus:outline-none focus:border-horizon">
              <option value="">Any Category</option>
              <option value="sightseeing">Sightseeing</option>
              <option value="food">Food & Dining</option>
              <option value="adventure">Adventure</option>
            </select>
          </div>

          <div className="flex items-center gap-[12px] w-full sm:w-auto">
            <span className="text-[12px] font-medium uppercase tracking-wider text-muted font-['IBM_Plex_Mono'] hidden md:block">
              Sort By
            </span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full sm:w-auto bg-bg border border-border rounded-[8px] px-[12px] py-[8px] text-[13px] font-medium text-ink focus:outline-none focus:border-horizon"
            >
              <option value="recent">Most Recent</option>
              <option value="helpful">Most Helpful</option>
            </select>
          </div>

        </div>
      </div>
    </div>
  );
}
