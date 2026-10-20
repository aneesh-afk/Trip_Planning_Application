import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function PublicTripCard({ trip }) {
  const navigate = useNavigate();

  const handleView = () => {
    navigate(`/trip/public/${trip.slug}`);
  };

  const budgetTier = trip.totalCost < 500 ? '$' : trip.totalCost < 1500 ? '$$' : '$$$';
  const imageUrl = trip.coverImageUrl || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&q=80";

  return (
    <div 
      className="flex flex-col bg-surface border border-border rounded-[16px] overflow-hidden hover:shadow-md transition-all duration-300 group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-route" 
      onClick={handleView}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleView();
        }
      }}
      aria-label={`View itinerary for ${trip.title}`}
    >
      {/* Image Header */}
      <div className="relative h-[200px] bg-bg overflow-hidden">
        <img 
          src={imageUrl} 
          alt={trip.title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          onError={(e) => {
            e.target.onerror = null; 
            e.target.src = "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&q=80";
          }}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>
        
        {/* Chips */}
        <div className="absolute top-[12px] left-[12px] flex gap-[8px]">
          {trip.isRelevant && (
            <div className="bg-route/90 backdrop-blur-sm text-white text-[11px] font-bold uppercase tracking-wider px-[10px] py-[4px] rounded-full shadow-sm">
              Relevant
            </div>
          )}
          <div className="bg-surface/90 backdrop-blur-sm text-ink text-[11px] font-bold tracking-wider px-[10px] py-[4px] rounded-full shadow-sm">
            {budgetTier}
          </div>
        </div>

        {/* Title & Route */}
        <div className="absolute bottom-[16px] left-[16px] right-[16px]">
          <h3 className="font-['Fraunces'] text-[20px] font-semibold text-white leading-tight line-clamp-1 drop-shadow-md">
            {trip.title}
          </h3>
          <div className="text-[13px] text-white/90 font-medium flex items-center gap-[6px] mt-[4px]">
            {trip.routeString}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-[16px] flex flex-col flex-1">
        {/* Stats Row */}
        <div className="flex items-center gap-[16px] mb-[16px] font-['IBM_Plex_Mono'] text-[12px] text-muted">
          <div className="flex items-center gap-[4px]">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[14px] h-[14px]"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            {trip.durationDays} day{trip.durationDays !== 1 ? 's' : ''}
          </div>
          <div className="flex items-center gap-[4px]">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[14px] h-[14px]"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
            ${trip.totalCost?.toFixed(0)}
          </div>
        </div>

        {/* Author Row */}
        <div className="flex items-center gap-[10px] mt-auto">
          {trip.author.avatarUrl ? (
            <img src={trip.author.avatarUrl} alt={trip.author.name} className="w-[28px] h-[28px] rounded-full object-cover border border-border" />
          ) : (
            <div className="w-[28px] h-[28px] rounded-full bg-muted/20 flex items-center justify-center border border-border shrink-0">
              <span className="font-['Fraunces'] font-semibold text-muted text-[12px]">
                {trip.author.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1 overflow-hidden">
            <div className="text-[13px] font-medium text-ink truncate">{trip.author.name}</div>
            <div className="text-[11px] text-muted font-['IBM_Plex_Mono']">
              {new Date(trip.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-[16px] flex gap-[8px]">
          <button 
            onClick={(e) => { e.stopPropagation(); handleView(); }}
            className="flex-1 py-[10px] rounded-[10px] bg-bg border border-border text-[13px] font-medium text-ink hover:border-horizon hover:text-horizon transition-colors"
          >
            View Itinerary
          </button>
          
          {/* Duplicate Ghost Button (Reserved slot) */}
          <button 
            disabled
            className="px-[12px] rounded-[10px] bg-surface border border-border/50 text-muted opacity-50 cursor-not-allowed flex items-center justify-center"
            title="Duplicate Trip (Coming Soon)"
            onClick={(e) => e.stopPropagation()}
          >
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[16px] h-[16px]"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
