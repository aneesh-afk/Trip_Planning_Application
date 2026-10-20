import React, { useState } from "react";
import { getCategoryStyles } from "../../utils/categoryColors";

function DropZone({ onDrop }) {
  const [isOver, setIsOver] = useState(false);
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsOver(false);
        onDrop(e);
      }}
      className={`transition-all duration-200 w-full ${
        isOver
          ? "h-[64px] border-2 border-dashed border-route bg-route/5 rounded-[12px] my-[8px] ml-[60px]"
          : "h-[16px] my-0"
      }`}
    ></div>
  );
}

export default function ItineraryTimelineView({
  dayActivities,
  dayDateStr,
  dayNumber,
  draggedAct,
  handleDragStart,
  handleDragEnd,
  handleDragOver,
  handleDrop,
  setEditingActivity,
  onAddClick,
  idleGapThresholdMinutes = 45,
  isCompleted = false
}) {
  if (dayActivities.length === 0) {
    if (isCompleted) {
      return <div className="text-center py-[24px] text-muted text-[14px]">No activities were planned for this day.</div>;
    }
    return (
      <div
        onClick={() => onAddClick(dayDateStr)}
        onDragOver={handleDragOver}
        onDrop={(e) => {
          e.stopPropagation();
          handleDrop(e, 0, dayDateStr);
        }}
        className="text-center py-[24px] text-muted bg-surface/50 rounded-[12px] border border-border border-dashed cursor-pointer hover:border-route transition-colors"
      >
        {draggedAct
          ? "Drop Activity Here"
          : `+ Add Activity to Day ${dayNumber}`}
      </div>
    );
  }

  // Format duration helper
  const formatDuration = (mins, isEstimated) => {
    if (!mins) return isEstimated ? "~1 hr" : "1 hr";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    let str = "";
    if (h > 0) str += `${h} hr${h > 1 ? "s" : ""} `;
    if (m > 0) str += `${m} min`;
    return (isEstimated ? "~" : "") + str.trim();
  };

  // Format gap helper
  const formatGap = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    let str = "";
    if (h > 0) str += `${h}h `;
    if (m > 0) str += `${m}m`;
    return str.trim() + " free";
  };

  return (
    <div className="flex flex-col relative pt-[8px]">
      {/* Initial Drop Zone */}
      {draggedAct && !isCompleted && (
        <DropZone onDrop={(e) => handleDrop(e, 0, dayDateStr)} />
      )}

      {dayActivities.map((act, actIdx) => {
        const catStyle = getCategoryStyles(act.category);
        const isLast = actIdx === dayActivities.length - 1;
        const gap = act.gapAfterMinutes;

        let hasLargeGap =
          !isLast && gap !== null && gap >= idleGapThresholdMinutes;
        let hasConflict = !isLast && gap !== null && gap < 0;

        return (
          <React.Fragment key={act.id}>
            <div
              className={`flex items-stretch group/row relative ${
                draggedAct?.id === act.id ? "opacity-30" : ""
              }`}
            >
              {/* Timeline Rail */}
              <div className="w-[60px] shrink-0 relative flex flex-col items-center z-0">
                {/* Time text */}
                <div className="absolute top-[18px] right-[calc(50%+12px)] text-[12px] font-['IBM_Plex_Mono'] text-muted whitespace-nowrap">
                  {act.time || "--:--"}
                </div>

                {/* Node */}
                <div className="mt-[22px] w-[10px] h-[10px] rounded-full bg-route z-10 border-2 border-bg"></div>

                {/* Connector Line to next activity */}
                {!isLast && !draggedAct && (
                  <div className="absolute top-[32px] bottom-[-16px] w-[2px] flex flex-col items-center">
                    {hasConflict ? (
                      <div className="w-full h-full bg-red-500/80"></div>
                    ) : hasLargeGap ? (
                      <div className="w-full h-full border-l-2 border-dashed border-border flex items-center justify-center">
                        <div className="absolute bg-surface-hi px-[6px] py-[2px] rounded-[4px] border border-border text-[10px] text-muted whitespace-nowrap z-20 font-['IBM_Plex_Mono']">
                          {formatGap(gap)}
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full bg-border"></div>
                    )}
                  </div>
                )}
              </div>

              {/* Cards Wrapper */}
              <div 
                className={`flex-1 flex gap-[12px] md:gap-[16px] pb-[16px] relative pl-[24px] -ml-[24px] ${isCompleted ? '' : ''}`}
                draggable={!isCompleted}
                onDragStart={(e) => !isCompleted && handleDragStart(e, act)}
                onDragEnd={!isCompleted ? handleDragEnd : undefined}
              >
                {/* Drag Handle (Hover) */}
                {!isCompleted && (
                  <div className="absolute left-[8px] top-[32px] opacity-0 group-hover/row:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-muted hover:text-ink z-20">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-[16px] h-[16px]"><path d="M8 6h.01M16 6h.01M8 12h.01M16 12h.01M8 18h.01M16 18h.01"/></svg>
                  </div>
                )}

                {/* Activity Card */}
                <div 
                  onClick={() => !isCompleted && setEditingActivity(act)}
                  className={`flex-1 bg-surface border border-border rounded-[12px] p-[16px] shadow-sm flex flex-col md:flex-row md:items-center gap-[12px] ${isCompleted ? 'cursor-default opacity-80' : 'cursor-pointer hover:border-route transition-colors'}`}
                >
                  <div className="w-[48px] h-[48px] rounded-[8px] bg-bg flex items-center justify-center border border-border shrink-0 overflow-hidden">
                    {act.image_url ? (
                      <img
                        src={act.image_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[20px]">
                        {act.category === "food"
                          ? "🍔"
                          : act.category === "sightseeing"
                          ? "📸"
                          : "📍"}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 pointer-events-none">
                    <div className="flex items-center gap-[8px] mb-[4px]">
                      <h4 className="font-semibold text-ink text-[16px] leading-tight">
                        {act.title}
                      </h4>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-[6px] py-[2px] rounded-[4px] ${catStyle.bg} ${catStyle.text}`}
                      >
                        {act.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-[8px] text-[12.5px] text-muted">
                      <span>{act.city_name}</span>
                      <span className="w-[4px] h-[4px] rounded-full bg-border"></span>
                      <span>
                        {formatDuration(
                          act.duration_minutes,
                          act.durationEstimated
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expense Card */}
                <div 
                  onClick={() => !isCompleted && setEditingActivity(act)}
                  className={`w-[100px] md:w-[140px] shrink-0 bg-surface border border-border rounded-[12px] p-[16px] shadow-sm flex flex-col items-end justify-center pointer-events-none ${isCompleted ? 'opacity-80' : 'cursor-pointer hover:border-horizon transition-colors'}`}
                >
                  <span className="text-[11px] text-muted font-medium uppercase tracking-[0.5px] mb-[2px]">
                    Cost
                  </span>
                  <span className="font-['IBM_Plex_Mono'] text-[16px] font-bold text-ink">
                    ₹{act.cost.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Drop Zone after this item */}
            {draggedAct && !isCompleted && (
              <DropZone onDrop={(e) => handleDrop(e, act.order_index + 1, dayDateStr)} />
            )}

            {/* Conflict Warning Box (if overlap) */}
            {hasConflict && !draggedAct && (
              <div className="pl-[60px] pb-[16px]">
                <div className="bg-red-500/10 border border-red-500/20 rounded-[8px] px-[12px] py-[8px] text-red-600 text-[12px] font-medium flex items-center gap-[6px]">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className="w-[14px] h-[14px]"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4m0 4h.01" />
                  </svg>
                  Overlaps with next activity by {Math.abs(gap)} minutes
                </div>
              </div>
            )}
          </React.Fragment>
        );
      })}

      {!isCompleted && (
        <button 
          onClick={() => onAddClick(dayDateStr)}
          className="ml-[60px] mt-[8px] py-[16px] px-[16px] rounded-[12px] border border-dashed border-border text-[14px] font-medium text-muted hover:border-route hover:text-route transition-colors text-center cursor-pointer w-[calc(100%-60px)]"
        >
          + Add Activity
        </button>
      )}
    </div>
  );
}
