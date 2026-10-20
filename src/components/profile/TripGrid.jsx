import React, { useRef } from 'react';
import { TripCard, NewTripCard } from './TripCard';

export default function TripGrid({ title, trips, variant, onDelete, onShare, showNewCard }) {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 340; // width of card + gap
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="mb-[48px]">
      <div className="flex items-center justify-between mb-[20px]">
        <h2 className="font-['Fraunces'] text-[24px] font-semibold text-ink flex items-center gap-[12px]">
          {title}
          <span className="font-['IBM_Plex_Mono'] text-[12px] bg-border/50 text-muted px-[8px] py-[2px] rounded-full mt-[4px]">
            {trips.length}
          </span>
        </h2>
        
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

      {trips.length === 0 && !showNewCard ? (
        <div className="w-full h-[200px] border border-dashed border-border rounded-[16px] flex items-center justify-center text-muted font-['IBM_Plex_Mono'] text-[13px]">
          No trips in this section.
        </div>
      ) : (
        <div className="relative">
          {/* Edge fade gradient (right) */}
          <div className="absolute right-0 top-0 bottom-0 w-[40px] bg-gradient-to-l from-bg to-transparent pointer-events-none z-10 hidden md:block"></div>
          
          {/* Scrollable Container */}
          <div 
            ref={scrollRef}
            className="flex flex-nowrap overflow-x-auto gap-[20px] pb-[24px] -mx-[24px] px-[24px] md:mx-0 md:px-0 custom-scrollbar snap-x snap-mandatory"
          >
            {trips.map(trip => (
              <div key={trip.id} className="snap-start shrink-0">
                <TripCard 
                  trip={trip} 
                  variant={variant} 
                  onDelete={onDelete}
                  onShare={onShare}
                />
              </div>
            ))}
            
            {showNewCard && (
              <div className="snap-start shrink-0">
                <NewTripCard />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
