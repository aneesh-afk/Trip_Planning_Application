import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export function TripCard({ trip, variant, onDelete, onShare }) {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const isPast = variant === "past";
  const imageUrl =
    trip.cover_photo_url ||
    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&q=80";

  // Calculate days until trip
  let countdownText = null;
  if (!isPast && trip.start_date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(trip.start_date);
    const diffDays = Math.ceil((start - today) / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      countdownText = `In ${diffDays} day${diffDays > 1 ? "s" : ""}`;
    } else if (diffDays === 0) {
      countdownText = "Today!";
    }
  }

  const formatDateRange = (start, end) => {
    if (!start && !end) return "TBD";
    const opt = { month: "short", day: "numeric", year: "numeric" };
    const s = start ? new Date(start).toLocaleDateString("en-US", opt) : "";
    const e = end ? new Date(end).toLocaleDateString("en-US", opt) : "";
    if (s && e && s !== e) return `${s} – ${e}`;
    return s || e || "TBD";
  };

  const handleAction = (e, action) => {
    e.stopPropagation();
    setShowMenu(false);
    if (action === "delete" && onDelete) onDelete(trip.id);
    if (action === "share" && onShare) onShare(trip);
    if (action === "edit") navigate(`/trips/${trip.id}/edit`);
  };

  return (
    <div
      className="group relative flex-shrink-0 w-[280px] md:w-[320px] rounded-[16px] overflow-hidden bg-surface border border-border shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col h-[400px]"
      onClick={() => navigate(`/trips/${trip.id}/view`)}
      onMouseLeave={() => setShowMenu(false)}
    >
      {/* Image Section (Top 2/3) */}
      <div className="relative h-[240px] w-full overflow-hidden bg-bg">
        <img
          src={imageUrl}
          alt={trip.name}
          className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${
            isPast ? "saturate-50 contrast-125 opacity-90" : ""
          }`}
        />

        {/* Gradient Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

        {/* Badges / Chips */}
        <div className="absolute top-[12px] left-[12px] flex gap-[8px]">
          {isPast ? (
            <div className="bg-surface/90 backdrop-blur-sm text-ink text-[11px] font-bold uppercase tracking-wider px-[10px] py-[4px] rounded-full border border-border shadow-sm">
              Completed
            </div>
          ) : countdownText ? (
            <div className="bg-route text-white text-[11px] font-bold uppercase tracking-wider px-[10px] py-[4px] rounded-full shadow-sm">
              {countdownText}
            </div>
          ) : null}
        </div>

        {/* Quick Actions (...) Menu */}
        <div className="absolute top-[12px] right-[12px]">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="w-[32px] h-[32px] rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-sm flex items-center justify-center text-white transition-colors"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="w-[18px] h-[18px]"
            >
              <circle cx="12" cy="12" r="1" />
              <circle cx="12" cy="5" r="1" />
              <circle cx="12" cy="19" r="1" />
            </svg>
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-[8px] w-[140px] bg-surface border border-border rounded-[12px] shadow-xl py-[8px] z-20">
              <button
                onClick={(e) => handleAction(e, "edit")}
                className="w-full text-left px-[16px] py-[8px] text-[13px] text-ink hover:bg-bg transition-colors"
              >
                Edit Trip
              </button>
              <button
                onClick={(e) => handleAction(e, "share")}
                className="w-full text-left px-[16px] py-[8px] text-[13px] text-ink hover:bg-bg transition-colors"
              >
                Share
              </button>
              <div className="h-[1px] bg-border my-[4px]"></div>
              <button
                onClick={(e) => handleAction(e, "delete")}
                className="w-full text-left px-[16px] py-[8px] text-[13px] text-danger hover:bg-danger/10 transition-colors"
              >
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Title Overlay */}
        <div className="absolute bottom-[16px] left-[16px] right-[16px]">
          <h3 className="font-['Fraunces'] text-[20px] font-semibold text-white leading-tight line-clamp-2 drop-shadow-md">
            {trip.name}
          </h3>
        </div>
      </div>

      {/* Info Section (Bottom 1/3) */}
      <div className="flex-1 p-[16px] flex flex-col justify-between bg-surface">
        <div>
          <div className="text-[12.5px] text-muted font-medium mb-[4px]">
            {formatDateRange(trip.start_date, trip.end_date)}
          </div>

          {/* Hover Micro-interaction: Highlight stats */}
          <div className="text-[13px] text-ink h-[20px] overflow-hidden">
            <div className="transform translate-y-0 opacity-100 group-hover:-translate-y-full group-hover:opacity-0 transition-all duration-300 line-clamp-1">
              {trip.routeString || "A travel itinerary"}
            </div>
            <div className="transform translate-y-full opacity-0 group-hover:-translate-y-full group-hover:opacity-100 transition-all duration-300 font-['IBM_Plex_Mono'] text-[11.5px] font-semibold text-route">
              {trip.stopsCount || 1} stops · ₹{trip.totalCost?.toFixed(0) || 0}{" "}
              budget
            </div>
          </div>
        </div>

        <div className="mt-auto pt-[12px]">
          {isPast ? (
            <button className="w-full py-[10px] rounded-[10px] bg-bg border border-border text-[13.5px] font-medium text-ink hover:border-horizon hover:text-horizon transition-colors">
              Revisit Memories
            </button>
          ) : (
            <div className="w-full">
              <button className="w-full py-[10px] rounded-[10px] bg-route text-white text-[13.5px] font-medium hover:opacity-90 transition-opacity shadow-sm mb-[8px]">
                Continue Planning
              </button>
              {/* Progress Bar */}
              <div className="flex items-center gap-[8px]">
                <div className="flex-1 h-[4px] rounded-full bg-border overflow-hidden">
                  <div
                    className="h-full bg-route rounded-full"
                    style={{ width: `${trip.progressPercent || 5}%` }}
                  ></div>
                </div>
                <span className="font-['IBM_Plex_Mono'] text-[10px] text-muted font-semibold">
                  {trip.progressPercent || 5}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function NewTripCard() {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate("/trips/new")}
      className="flex-shrink-0 w-[280px] md:w-[320px] rounded-[16px] border-2 border-dashed border-border bg-surface/30 hover:bg-surface hover:border-route transition-all duration-300 cursor-pointer flex flex-col items-center justify-center h-[400px] text-muted hover:text-route group"
    >
      <div className="w-[48px] h-[48px] rounded-full bg-bg border border-border flex items-center justify-center mb-[16px] group-hover:scale-110 transition-transform">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          className="w-[20px] h-[20px] stroke-currentColor"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      </div>
      <span className="font-['Fraunces'] text-[18px] font-semibold">
        Plan a New Trip
      </span>
      <span className="text-[13px] mt-[4px] opacity-70">
        Start your next adventure
      </span>
    </div>
  );
}
