import React, { useRef } from 'react';
import PublicTripCard from './PublicTripCard';

export default function RelevantRail({ relevantTrips, userUpcomingDestinations }) {
  const scrollRef = useRef(null);

  if (!relevantTrips || relevantTrips.length === 0) {
    return null;
  }

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 340; // card width + gap
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Convert Set to Array for display
  const destinationsArray = Array.from(userUpcomingDestinations).map(d => d.charAt(0).toUpperCase() + d.slice(1));
  const destLabel = destinationsArray.length > 0 ? destinationsArray.join(', ') : 'your destinations';

  return (
    <div className="mb-[48px] pt-[24px] border-t border-border animate-in fade-in slide-in-from-top-4 duration-500 delay-150 fill-mode-both">
      <div className="flex items-center justify-between mb-[20px]">
        <div>
          <h2 className="font-['Fraunces'] text-[22px] font-semibold text-ink flex items-center gap-[8px]">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[20px] h-[20px] stroke-route"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Relevant to your upcoming trips
          </h2>
          <p className="text-[14px] text-muted mt-[4px]">
            People who traveled to <span className="font-medium text-ink">{destLabel}</span> also planned these trips.
          </p>
        </div>
        
        {/* Scroll Controls */}
        <div className="hidden md:flex items-center gap-[8px]">
          <button onClick={() => scroll('left')} className="w-[36px] h-[36px] rounded-full border border-border bg-surface flex items-center justify-center hover:border-horizon text-muted hover:text-ink transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-[18px] h-[18px]"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <button onClick={() => scroll('right')} className="w-[36px] h-[36px] rounded-full border border-border bg-surface flex items-center justify-center hover:border-horizon text-muted hover:text-ink transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-[18px] h-[18px]"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>
      </div>

      <div className="relative">
        {/* Edge fade gradient (right) */}
        <div className="absolute right-0 top-0 bottom-0 w-[40px] bg-gradient-to-l from-bg to-transparent pointer-events-none z-10 hidden md:block"></div>
        
        {/* Scrollable Container */}
        <div 
          ref={scrollRef}
          className="flex flex-nowrap overflow-x-auto gap-[20px] pb-[24px] -mx-[24px] px-[24px] md:mx-0 md:px-0 custom-scrollbar snap-x snap-mandatory"
        >
          {relevantTrips.map((trip) => (
            <div key={trip.id} className="snap-start shrink-0 w-[280px] md:w-[320px]">
              <PublicTripCard trip={trip} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
