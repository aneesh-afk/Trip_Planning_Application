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
          ? "h-[64px] border-2 border-dashed border-route bg-route/5 rounded-[12px] my-[8px]"
          : "h-[16px] my-0"
      }`}
    ></div>
  );
}

export default function ItineraryListView({
  dayActivities,
  dayDateStr,
  dayNumber,
  draggedAct,
  handleDragStart,
  handleDragEnd,
  handleDragOver,
  handleDrop,
  setEditingActivity,
}) {
  if (dayActivities.length === 0) {
    return (
      <div
        onDragOver={handleDragOver}
        onDrop={(e) => {
          e.stopPropagation();
          handleDrop(e, 0, dayDateStr);
        }}
        className="text-center py-[24px] text-muted bg-surface/50 rounded-[12px] border border-border border-dashed transition-colors"
      >
        {draggedAct
          ? "Drop Activity Here"
          : `No activities planned for Day ${dayNumber}`}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Initial Drop Zone */}
      {draggedAct && <DropZone onDrop={(e) => handleDrop(e, 0, dayDateStr)} />}

      {dayActivities.map((act, actIdx) => {
        const catStyle = getCategoryStyles(act.category);

        return (
          <React.Fragment key={act.id}>
            <div
              className={`flex gap-[12px] md:gap-[16px] items-stretch group/row relative ${
                draggedAct?.id === act.id ? "opacity-30" : ""
              }`}
              draggable
              onDragStart={(e) => handleDragStart(e, act)}
              onDragEnd={handleDragEnd}
            >
              {/* Activity Card */}
              <div
                onClick={() => setEditingActivity(act)}
                className="flex-1 bg-surface border border-border rounded-[12px] p-[16px] cursor-pointer hover:border-route transition-colors shadow-sm flex flex-col md:flex-row md:items-center gap-[12px]"
              >
                <div className="w-[48px] h-[48px] rounded-[8px] bg-bg flex items-center justify-center border border-border shrink-0 cursor-grab active:cursor-grabbing overflow-hidden">
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
                    {act.time && (
                      <span className="font-['IBM_Plex_Mono']">{act.time}</span>
                    )}
                    {act.time && (
                      <span className="w-[4px] h-[4px] rounded-full bg-border"></span>
                    )}
                    <span>{act.city_name}</span>
                  </div>
                </div>
              </div>

              {/* Expense Card */}
              <div
                onClick={() => setEditingActivity(act)}
                className="w-[100px] md:w-[140px] shrink-0 bg-surface border border-border rounded-[12px] p-[16px] cursor-pointer hover:border-horizon transition-colors shadow-sm flex flex-col items-end justify-center pointer-events-none"
              >
                <span className="text-[11px] text-muted font-medium uppercase tracking-[0.5px] mb-[2px]">
                  Cost
                </span>
                <span className="font-['IBM_Plex_Mono'] text-[16px] font-bold text-ink">
                  ₹{act.cost.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Drop Zone after this item */}
            {draggedAct ? (
              <DropZone
                onDrop={(e) => handleDrop(e, act.order_index + 1, dayDateStr)}
              />
            ) : (
              actIdx < dayActivities.length - 1 && (
                <div className="h-[12px]"></div>
              )
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
