import React, { useState, useMemo, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useItinerary, calculateGaps } from "../hooks/useItinerary";
import ItineraryTimelineView from "../components/itinerary/ItineraryTimelineView";
import { supabase } from "../lib/supabaseClient";

function ActivityDetailModal({ activity, onClose, onSave }) {
  const [cost, setCost] = useState(activity.cost || 0);
  const [time, setTime] = useState(activity.time || "");

  const handleSave = () => {
    onSave(activity.id, {
      custom_cost_override: cost !== "" ? Number(cost) : null,
      scheduled_time: time !== "" ? `${time}:00` : null,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-bg/80 backdrop-blur-sm z-50 flex items-center justify-center animate-[fadeIn_0.2s_ease-out_forwards] p-[16px]">
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }`}</style>
      <div className="bg-surface border border-border rounded-[16px] w-full max-w-[500px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header Image Area */}
        <div className="h-[180px] bg-bg relative shrink-0">
          {activity.image_url ? (
            <img
              src={activity.image_url}
              alt={activity.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[48px]">
              {activity.category === "food"
                ? "🍔"
                : activity.category === "sightseeing"
                ? "📸"
                : "📍"}
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-[16px] right-[16px] w-[32px] h-[32px] bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center transition-colors"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-[16px] h-[16px] stroke-white"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-[24px] overflow-y-auto flex-1">
          <div className="mb-[24px]">
            <h3 className="font-['Fraunces'] text-[24px] font-semibold text-ink leading-tight mb-[4px]">
              {activity.title}
            </h3>
            <div className="flex items-center gap-[8px] text-[13px] text-muted">
              <span className="capitalize">{activity.category}</span>
              <span className="w-[4px] h-[4px] rounded-full bg-border"></span>
              <span>{activity.city_name}</span>
            </div>
          </div>

          {activity.description && (
            <p className="text-[14px] text-muted leading-relaxed mb-[24px]">
              {activity.description}
            </p>
          )}

          <div className="flex flex-col gap-[16px] mb-[32px]">
            <div>
              <label className="block text-[12px] font-medium text-muted mb-[6px] uppercase tracking-wide">
                Scheduled Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-bg border border-border rounded-[8px] px-[12px] py-[10px] text-[14px] text-ink focus:border-route outline-none"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-muted mb-[6px] uppercase tracking-wide">
                Expense (₹)
              </label>
              <input
                type="number"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full bg-bg border border-border rounded-[8px] px-[12px] py-[10px] text-[14px] text-ink focus:border-route outline-none"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="flex justify-end gap-[12px]">
            <button
              onClick={onClose}
              className="px-[16px] py-[8px] rounded-[8px] font-medium text-[13.5px] text-muted hover:text-ink"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-[16px] py-[8px] rounded-[8px] font-medium text-[13.5px] bg-route text-white hover:opacity-90 shadow-sm"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddActivityModal({ stop, dayDateStr, onClose, onAdd, onAddCustom }) {
  const [activeTab, setActiveTab] = useState("catalog"); // "catalog" | "custom"
  const [availableActivities, setAvailableActivities] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Custom activity form state
  const [customName, setCustomName] = useState("");
  const [customCategory, setCustomCategory] = useState("sightseeing");
  const [customCost, setCustomCost] = useState("");
  const [customTime, setCustomTime] = useState("");
  const [customDuration, setCustomDuration] = useState("60");
  const [customDesc, setCustomDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchActivities() {
      const { data } = await supabase
        .from("activities")
        .select("*")
        .eq("city_id", stop.city_id);
      setAvailableActivities(data || []);
      setLoading(false);
    }
    fetchActivities();
  }, [stop.city_id]);

  const filtered = useMemo(() => {
    if (!search.trim()) return availableActivities;
    const q = search.toLowerCase();
    return availableActivities.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
    );
  }, [availableActivities, search]);

  const handleCustomSubmit = async (e) => {
    e.preventDefault();
    if (!customName.trim()) return;
    setSubmitting(true);
    await onAddCustom({
      name: customName.trim(),
      category: customCategory,
      cost: customCost ? Number(customCost) : 0,
      time: customTime || null,
      duration: customDuration ? Number(customDuration) : 60,
      description: customDesc.trim() || null,
    });
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-bg/80 backdrop-blur-sm z-50 flex items-center justify-center animate-[fadeIn_0.2s_ease-out_forwards] p-[16px]">
      <div className="bg-surface border border-border rounded-[16px] w-full max-w-[540px] flex flex-col max-h-[85vh] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-[20px] border-b border-border flex justify-between items-center bg-bg shrink-0">
          <div>
            <h3 className="font-['Fraunces'] font-semibold text-[20px] text-ink">
              Add Activity to {stop.city?.name || "Trip"}
            </h3>
            <p className="text-[12px] text-muted font-['IBM_Plex_Mono']">
              {dayDateStr}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-[32px] h-[32px] rounded-full hover:bg-black/10 flex items-center justify-center"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="2"
              strokeLinecap="round"
              className="w-[16px] h-[16px] stroke-ink"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-border bg-bg/50 px-4 pt-2 shrink-0">
          <button
            onClick={() => setActiveTab("catalog")}
            className={`pb-2.5 px-4 text-[13px] font-semibold transition-colors border-b-2 ${
              activeTab === "catalog"
                ? "border-route text-route"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            Browse City Activities ({availableActivities.length})
          </button>
          <button
            onClick={() => setActiveTab("custom")}
            className={`pb-2.5 px-4 text-[13px] font-semibold transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === "custom"
                ? "border-route text-route"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            <span>✨</span>
            <span>+ Add Custom Activity</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-[20px]">
          {activeTab === "catalog" ? (
            <div>
              {/* Search */}
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="Search city activities or type custom name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-bg border border-border rounded-[10px] px-3.5 py-2.5 text-[13.5px] text-ink placeholder:text-muted focus:outline-none focus:border-route"
                />
              </div>

              {loading ? (
                <div className="text-center text-muted py-[20px]">
                  Loading activities...
                </div>
              ) : (
                <div className="flex flex-col gap-[10px]">
                  {/* Create custom prompt if user typed something */}
                  {search.trim() && (
                    <button
                      onClick={() => {
                        setCustomName(search.trim());
                        setActiveTab("custom");
                      }}
                      className="p-3 border border-dashed border-route bg-route/5 rounded-[12px] text-left hover:bg-route/10 transition-colors flex items-center justify-between"
                    >
                      <div className="text-[13px] text-ink">
                        <span className="font-semibold text-route">+ Create custom activity:</span>{" "}
                        <span className="font-medium">"{search.trim()}"</span>
                      </div>
                      <span className="text-[12px] bg-route text-white px-2 py-0.5 rounded font-medium">Create</span>
                    </button>
                  )}

                  {filtered.length === 0 && !search.trim() && (
                    <div className="text-center text-muted py-[24px]">
                      <p className="mb-3">No preset catalog activities found for this city.</p>
                      <button
                        onClick={() => setActiveTab("custom")}
                        className="px-4 py-2 bg-route text-white rounded-xl text-[13px] font-semibold hover:bg-route/90"
                      >
                        + Create Your Own Activity
                      </button>
                    </div>
                  )}

                  {filtered.map((act) => (
                    <div
                      key={act.id}
                      onClick={() => onAdd(act.id)}
                      className="flex items-center gap-[12px] p-[12px] border border-border rounded-[12px] cursor-pointer hover:border-route transition-colors bg-bg group"
                    >
                      <div className="w-[48px] h-[48px] bg-surface rounded-[8px] overflow-hidden flex items-center justify-center border border-border shrink-0">
                        {act.image_url ? (
                          <img
                            src={act.image_url}
                            alt={act.name}
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
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-[14.5px] text-ink mb-[2px] truncate group-hover:text-route">
                          {act.name}
                        </div>
                        <div className="text-[12px] text-muted capitalize flex items-center gap-2">
                          <span>{act.category}</span>
                          {act.duration_minutes && (
                            <>
                              <span>•</span>
                              <span>{act.duration_minutes}m</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-['IBM_Plex_Mono'] font-bold text-[14px] text-route">
                          ₹{Number(act.estimated_cost).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Custom Activity Form */
            <form onSubmit={handleCustomSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-[12px] font-semibold uppercase tracking-wider text-muted font-['IBM_Plex_Mono'] mb-1.5">
                  Activity Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sunset Boat Cruise, Street Food Crawl, Mountain Trek"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-bg border border-border rounded-xl text-[14px] text-ink placeholder:text-muted focus:outline-none focus:border-route"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold uppercase tracking-wider text-muted font-['IBM_Plex_Mono'] mb-1.5">
                    Category
                  </label>
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-bg border border-border rounded-xl text-[13px] text-ink focus:outline-none focus:border-route"
                  >
                    <option value="sightseeing">📸 Sightseeing</option>
                    <option value="food">🍽️ Food & Dining</option>
                    <option value="adventure">🧗 Adventure & Sports</option>
                    <option value="culture">🛕 Culture & Heritage</option>
                    <option value="shopping">🛍️ Shopping</option>
                    <option value="nature">🌿 Nature & Wildlife</option>
                    <option value="wellness">🧘 Wellness & Yoga</option>
                    <option value="other">📍 Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold uppercase tracking-wider text-muted font-['IBM_Plex_Mono'] mb-1.5">
                    Estimated Cost (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={customCost}
                    onChange={(e) => setCostOrEmpty(e.target.value, setCustomCost)}
                    className="w-full px-3 py-2 bg-bg border border-border rounded-xl text-[13px] text-ink font-['IBM_Plex_Mono'] focus:outline-none focus:border-route"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold uppercase tracking-wider text-muted font-['IBM_Plex_Mono'] mb-1.5">
                    Scheduled Time (Optional)
                  </label>
                  <input
                    type="time"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    className="w-full px-3 py-2 bg-bg border border-border rounded-xl text-[13px] text-ink font-['IBM_Plex_Mono'] focus:outline-none focus:border-route"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold uppercase tracking-wider text-muted font-['IBM_Plex_Mono'] mb-1.5">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="15"
                    step="15"
                    placeholder="60"
                    value={customDuration}
                    onChange={(e) => setCustomDuration(e.target.value)}
                    className="w-full px-3 py-2 bg-bg border border-border rounded-xl text-[13px] text-ink font-['IBM_Plex_Mono'] focus:outline-none focus:border-route"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold uppercase tracking-wider text-muted font-['IBM_Plex_Mono'] mb-1.5">
                  Notes / Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Reach 15 mins early for tickets, dress appropriately..."
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  className="w-full px-3.5 py-2 bg-bg border border-border rounded-xl text-[13px] text-ink placeholder:text-muted focus:outline-none focus:border-route resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-border mt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("catalog")}
                  className="px-4 py-2 text-[13px] font-medium text-muted hover:text-ink transition-colors"
                >
                  Back to Catalog
                </button>
                <button
                  type="submit"
                  disabled={submitting || !customName.trim()}
                  className="px-5 py-2.5 bg-route text-white rounded-xl text-[13px] font-semibold hover:bg-route/90 transition-colors shadow-sm disabled:opacity-50"
                >
                  {submitting ? "Adding..." : "+ Add Custom Activity"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function setCostOrEmpty(val, setter) {
  setter(val);
}

export default function ItineraryView() {
  const { tripId } = useParams();
  const {
    trip,
    tripStops,
    activities,
    loading,
    error,
    updateActivityDetails,
    reorderActivity,
    addActivityToStop,
    addCustomActivityToStop,
  } = useItinerary(tripId);

  const [searchQuery, setSearchQuery] = useState("");
  const [groupBy, setGroupBy] = useState("day");
  const [sortBy, setSortBy] = useState("time_asc");
  const [filterType, setFilterType] = useState("all");

  const [showGroup, setShowGroup] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [showFilter, setShowFilter] = useState(false);

  const [editingActivity, setEditingActivity] = useState(null);
  const [collapsedDays, setCollapsedDays] = useState(new Set());
  const [draggedAct, setDraggedAct] = useState(null);

  // { stop, dayDateStr }
  const [addingToDay, setAddingToDay] = useState(null);

  const handleAddActivity = async (activityId) => {
    if (addingToDay) {
      await addActivityToStop(
        addingToDay.stop.id,
        activityId,
        addingToDay.dayDateStr
      );
      setAddingToDay(null);
    }
  };

  const handleAddCustomActivity = async (customData) => {
    if (addingToDay) {
      await addCustomActivityToStop(
        addingToDay.stop.id,
        addingToDay.stop.city_id,
        addingToDay.dayDateStr,
        customData
      );
      setAddingToDay(null);
    }
  };

  const handleSaveActivity = async (id, updates) => {
    await updateActivityDetails(id, updates);
  };

  const toggleDayCollapse = (dayNumber) => {
    setCollapsedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dayNumber)) next.delete(dayNumber);
      else next.add(dayNumber);
      return next;
    });
  };

  const getDaysInStop = (stop) => {
    if (!trip) return [];
    const days = [];
    const start = new Date(stop.start_date + 'T00:00:00');
    const end = new Date(stop.end_date + 'T00:00:00');
    const tripStart = new Date(trip.start_date + 'T00:00:00');

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayNum = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${dayNum}`;

      const dayNumber = Math.max(1, Math.round((d - tripStart) / (1000 * 60 * 60 * 24)) + 1);
      days.push({ dateStr, dayNumber });
    }
    return days;
  };

  // Process activities for non-day grouping (category/cost)
  const nonDayProcessedData = useMemo(() => {
    if (groupBy === "day") return [];
    let filtered = [...activities];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.city_name.toLowerCase().includes(q)
      );
    }
    if (filterType !== "all") {
      filtered = filtered.filter(
        (a) => a.category.toLowerCase() === filterType.toLowerCase()
      );
    }

    filtered.sort((a, b) => {
      if (sortBy === "time_asc") {
        if (a.time && b.time) return a.time.localeCompare(b.time);
        return a.order_index - b.order_index;
      }
      if (sortBy === "cost_desc") return b.cost - a.cost;
      if (sortBy === "cost_asc") return a.cost - b.cost;
      return 0;
    });

    const groups = {};
    filtered.forEach((act) => {
      let key = "Other";
      if (groupBy === "category") key = act.category || "Other";
      if (groupBy === "cost")
        key =
          act.cost > 100
            ? "High Cost (₹100+)"
            : act.cost > 0
            ? "Low Cost"
            : "Free";

      if (!groups[key]) groups[key] = { items: [], totalCost: 0 };
      groups[key].items.push(act);
      groups[key].totalCost += act.cost;
    });
    return Object.entries(groups);
  }, [activities, searchQuery, filterType, sortBy, groupBy]);

  const grandTotal = activities.reduce((sum, act) => sum + act.cost, 0);

  const handleDragStart = (e, act) => {
    setDraggedAct(act);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetAct, targetDateStr) => {
    e.preventDefault();
    if (!draggedAct) return;

    // Move to a new index or date
    const newOrderIndex = targetAct
      ? targetAct.order_index > 0
        ? targetAct.order_index - 1
        : 0
      : 0;
    await reorderActivity(draggedAct.id, newOrderIndex, targetDateStr);
    setDraggedAct(null);
  };

  if (loading)
    return (
      <div className="min-h-screen bg-bg p-8 text-muted">
        Loading itinerary...
      </div>
    );
  if (error)
    return <div className="min-h-screen bg-bg p-8 text-danger">{error}</div>;

  return (
    <div
      className="flex flex-col lg:flex-row min-h-screen bg-bg relative"
      onClick={() => {
        setShowGroup(false);
        setShowSort(false);
        setShowFilter(false);
      }}
    >
      <main className="flex-1 flex flex-col min-h-screen pb-[100px]">
        {/* Top App Bar */}
        <div className="p-[18px] lg:p-[24px] border-b border-border bg-bg/80 backdrop-blur-sm z-10 sticky top-0 flex flex-col gap-[16px]">
          <div className="flex items-center justify-between">
            <h2 className="font-['Fraunces'] text-[18px] font-semibold text-ink">
              Trip Planner
            </h2>
            <div className="flex gap-[10px] flex-wrap sm:flex-nowrap">
              <Link
                to={`/trips/${tripId}/budget`}
                className="text-[13px] font-medium px-[12px] py-[8px] border border-border rounded-[8px] hover:border-horizon transition-colors"
              >
                💰 Budget
              </Link>
              <Link
                to={`/trips/${tripId}/budget?tab=Bookings`}
                className="text-[13px] font-medium px-[12px] py-[8px] border border-border rounded-[8px] hover:border-horizon transition-colors flex items-center gap-1.5"
              >
                🏨 Bookings
              </Link>
              <Link
                to={`/trips/${tripId}/group`}
                className="text-[13px] font-medium px-[12px] py-[8px] border border-border rounded-[8px] hover:border-route transition-colors flex items-center gap-1.5"
              >
                👥 Group & Split
              </Link>
              <Link
                to={`/trips/public/${trip.public_slug || trip.id}`}
                className="text-[13px] font-medium px-[12px] py-[8px] bg-route text-white rounded-[8px] hover:opacity-90 transition-opacity"
              >
                Share
              </Link>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-[16px]">
            {/* Search */}
            <div className="flex-1 max-w-[480px] relative flex items-center bg-surface border border-border rounded-[12px] px-[12px] focus-within:border-horizon transition-all">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                strokeWidth="2"
                strokeLinecap="round"
                className="w-[15px] h-[15px] stroke-muted shrink-0"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.3-4.3" />
              </svg>
              <input
                type="text"
                placeholder="Search activities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-ink font-['Inter'] text-[14px] py-[10px] px-[8px] w-full placeholder:text-muted"
              />
            </div>

            {/* Controls */}
            <div className="flex items-center gap-[12px] flex-wrap lg:flex-nowrap pb-1 lg:pb-0">
              {/* Controls placeholder if needed */}
              <div></div>

              {/* Group By */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowGroup(!showGroup);
                    setShowSort(false);
                    setShowFilter(false);
                  }}
                  className={`flex items-center gap-[6px] h-[36px] px-[12px] rounded-[10px] bg-surface border transition-all shrink-0 ${
                    showGroup
                      ? "border-route shadow-sm"
                      : "border-border hover:border-muted"
                  }`}
                >
                  <span className="text-[13px] font-medium text-ink">
                    Group: {groupBy}
                  </span>
                </button>
                {showGroup && (
                  <div className="absolute right-0 mt-2 w-32 bg-surface border border-border rounded-[8px] shadow-lg py-1 z-20">
                    <button
                      onClick={() => setGroupBy("day")}
                      className="w-full text-left px-4 py-2 text-[13px] text-ink hover:bg-bg"
                    >
                      By Day
                    </button>
                    <button
                      onClick={() => setGroupBy("category")}
                      className="w-full text-left px-4 py-2 text-[13px] text-ink hover:bg-bg"
                    >
                      By Category
                    </button>
                    <button
                      onClick={() => setGroupBy("cost")}
                      className="w-full text-left px-4 py-2 text-[13px] text-ink hover:bg-bg"
                    >
                      By Cost
                    </button>
                  </div>
                )}
              </div>

              {/* Filter */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowFilter(!showFilter);
                    setShowGroup(false);
                    setShowSort(false);
                  }}
                  className={`flex items-center gap-[6px] h-[36px] px-[12px] rounded-[10px] bg-surface border transition-all shrink-0 ${
                    showFilter
                      ? "border-route shadow-sm"
                      : "border-border hover:border-muted"
                  }`}
                >
                  <span className="text-[13px] font-medium text-ink">
                    Filter
                  </span>
                </button>
                {showFilter && (
                  <div className="absolute right-0 mt-2 w-36 bg-surface border border-border rounded-[8px] shadow-lg py-1 z-20">
                    <button
                      onClick={() => setFilterType("all")}
                      className="w-full text-left px-4 py-2 text-[13px] text-ink hover:bg-bg"
                    >
                      All
                    </button>
                    <button
                      onClick={() => setFilterType("food")}
                      className="w-full text-left px-4 py-2 text-[13px] text-ink hover:bg-bg"
                    >
                      Food
                    </button>
                    <button
                      onClick={() => setFilterType("sightseeing")}
                      className="w-full text-left px-4 py-2 text-[13px] text-ink hover:bg-bg"
                    >
                      Sightseeing
                    </button>
                  </div>
                )}
              </div>

              {/* Sort By */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSort(!showSort);
                    setShowGroup(false);
                    setShowFilter(false);
                  }}
                  className={`flex items-center gap-[6px] h-[36px] px-[12px] rounded-[10px] bg-surface border transition-all shrink-0 ${
                    showSort
                      ? "border-route shadow-sm"
                      : "border-border hover:border-muted"
                  }`}
                >
                  <span className="text-[13px] font-medium text-ink">Sort</span>
                </button>
                {showSort && (
                  <div className="absolute right-0 mt-2 w-36 bg-surface border border-border rounded-[8px] shadow-lg py-1 z-20">
                    <button
                      onClick={() => setSortBy("time_asc")}
                      className="w-full text-left px-4 py-2 text-[13px] text-ink hover:bg-bg"
                    >
                      Time
                    </button>
                    <button
                      onClick={() => setSortBy("cost_desc")}
                      className="w-full text-left px-4 py-2 text-[13px] text-ink hover:bg-bg"
                    >
                      Highest Cost
                    </button>
                    <button
                      onClick={() => setSortBy("cost_asc")}
                      className="w-full text-left px-4 py-2 text-[13px] text-ink hover:bg-bg"
                    >
                      Lowest Cost
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Page Title */}
        <div className="px-[24px] py-[32px] max-w-[800px] mx-auto w-full">
          <h1 className="font-['Fraunces'] text-[28px] font-bold text-ink text-center mb-[8px]">
            Itinerary for {trip?.name || "Selected Place"}
          </h1>
          <p className="text-center text-muted text-[14px]">
            {activities.length} activities planned
          </p>
        </div>

        {/* Itinerary Body */}
        <div className="px-[16px] md:px-[24px] max-w-[800px] mx-auto w-full">
          {activities.length === 0 &&
            groupBy === "day" &&
            tripStops.length === 0 && (
              <div className="text-center py-12 text-muted bg-surface rounded-[16px] border border-border border-dashed">
                Your itinerary is empty. Build out your trip stops first!
              </div>
            )}

          {/* Render Grouping by Day (City -> Day hierarchy) */}
          {groupBy === "day" &&
            tripStops.map((stop) => {
              const days = getDaysInStop(stop);
              return (
                <div key={stop.id} className="mb-[48px]">
                  {/* City Header */}
                  <div className="flex items-center gap-[16px] mb-[32px]">
                    <h3 className="font-['Fraunces'] text-[24px] font-semibold text-ink shrink-0">
                      {stop.city?.name || "Unknown City"}
                    </h3>
                    <div className="flex-1 h-[1px] bg-border mt-1"></div>
                  </div>

                  {days.map((day) => {
                    const isCollapsed = collapsedDays.has(day.dayNumber);
                    // Filter and search activities for this specific day
                    let dayActivities = activities.filter(
                      (a) =>
                        a.stop_id === stop.id &&
                        a.scheduled_date === day.dateStr
                    );
                    if (searchQuery.trim()) {
                      dayActivities = dayActivities.filter((a) =>
                        a.title
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase())
                      );
                    }
                    if (filterType !== "all") {
                      dayActivities = dayActivities.filter(
                        (a) =>
                          a.category.toLowerCase() === filterType.toLowerCase()
                      );
                    }

                    const dayTotal = dayActivities.reduce(
                      (sum, a) => sum + a.cost,
                      0
                    );

                    return (
                      <div key={day.dateStr} className="mb-[40px]">
                        {/* Collapsible Day Badge */}
                        <div
                          className="mb-[20px] flex items-center gap-[12px] cursor-pointer group"
                          onClick={() => toggleDayCollapse(day.dayNumber)}
                        >
                          <div className="bg-surface-hi border border-border px-[14px] py-[6px] rounded-full flex items-center gap-[8px] group-hover:border-muted transition-colors">
                            <span className="font-['Fraunces'] font-semibold text-[15px] text-ink tracking-[0.2px]">
                              Day {day.dayNumber}
                            </span>
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              strokeWidth="2"
                              strokeLinecap="round"
                              className={`w-[14px] h-[14px] stroke-muted transition-transform ${
                                isCollapsed ? "rotate-180" : ""
                              }`}
                            >
                              <path d="M6 9l6 6 6-6" />
                            </svg>
                          </div>
                          <div className="text-[12px] text-muted font-['IBM_Plex_Mono']">
                            {new Date(day.dateStr).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                          <div className="flex-1 h-[1px] bg-border"></div>
                        </div>

                        {!isCollapsed && (
                          <div className="flex flex-col min-h-[60px] relative">
                            <ItineraryTimelineView
                              dayActivities={calculateGaps(dayActivities)}
                              dayDateStr={day.dateStr}
                              dayNumber={day.dayNumber}
                              draggedAct={draggedAct}
                              handleDragStart={handleDragStart}
                              handleDragEnd={() => setDraggedAct(null)}
                              handleDragOver={handleDragOver}
                              handleDrop={handleDrop}
                              setEditingActivity={setEditingActivity}
                              onAddClick={(dateStr) =>
                                setAddingToDay({ stop, dayDateStr: dateStr })
                              }
                              idleGapThresholdMinutes={45}
                              isCompleted={(() => {
                                if (!trip?.end_date) return false;
                                const end = new Date(trip.end_date + 'T00:00:00');
                                const today = new Date(new Date().toISOString().split('T')[0] + 'T00:00:00');
                                return end < today;
                              })()}
                            />
                          </div>
                        )}

                        {/* Daily Summary */}
                        {!isCollapsed && dayActivities.length > 0 && (
                          <div className="mt-[20px] flex justify-end px-[16px]">
                            <div className="text-[13px] text-muted">
                              Total for Day {day.dayNumber}:
                              <b className="font-['IBM_Plex_Mono'] text-ink ml-[8px] text-[15px]">
                                ₹{dayTotal.toFixed(2)}
                              </b>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}

          {/* Render Grouping by Category or Cost */}
          {groupBy !== "day" &&
            nonDayProcessedData.map(([groupName, groupData]) => (
              <div key={groupName} className="mb-[40px]">
                <div className="mb-[20px] flex items-center gap-[12px]">
                  <div className="bg-surface-hi border border-border px-[14px] py-[6px] rounded-full">
                    <span className="font-['Fraunces'] font-semibold text-[15px] text-ink tracking-[0.2px] capitalize">
                      {groupName}
                    </span>
                  </div>
                  <div className="flex-1 h-[1px] bg-border"></div>
                </div>

                <div className="flex flex-col">
                  {groupData.items.map((act, actIdx) => (
                    <React.Fragment key={act.id}>
                      <div className="flex gap-[12px] md:gap-[16px] items-stretch group/row relative">
                        <div className="flex-1 bg-surface border border-border rounded-[12px] p-[16px] flex flex-col md:flex-row md:items-center gap-[12px]">
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
                          <div className="flex-1">
                            <h4 className="font-semibold text-ink text-[16px] mb-[4px] leading-tight">
                              {act.title}
                            </h4>
                            <div className="flex items-center gap-[8px] text-[12.5px] text-muted">
                              <span className="font-['IBM_Plex_Mono']">
                                Day {act.day}
                              </span>
                              <span className="w-[4px] h-[4px] rounded-full bg-border"></span>
                              <span>{act.city_name}</span>
                            </div>
                          </div>
                        </div>

                        <div className="w-[100px] md:w-[140px] shrink-0 bg-surface border border-border rounded-[12px] p-[16px] flex flex-col items-end justify-center">
                          <span className="text-[11px] text-muted font-medium uppercase tracking-[0.5px] mb-[2px]">
                            Cost
                          </span>
                          <span className="font-['IBM_Plex_Mono'] text-[16px] font-bold text-ink">
                            ₹{act.cost.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      {actIdx < groupData.items.length - 1 && (
                        <div className="h-[12px]"></div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </main>

      {/* Grand Total Sticky Footer */}
      <div className="fixed bottom-0 left-0 lg:left-[220px] right-0 bg-surface/95 backdrop-blur-md border-t border-border p-[20px] px-[24px] flex justify-between items-center z-30 shadow-[0_-4px_24px_rgba(0,0,0,0.1)]">
        <div>
          <div className="text-[12px] font-medium text-muted uppercase tracking-[1px] mb-[2px]">
            Trip Grand Total
          </div>
          <div className="text-[13px] text-muted">
            Based on all selected activities
          </div>
        </div>
        <div className="font-['IBM_Plex_Mono'] text-[24px] font-bold text-route">
          ₹{grandTotal.toFixed(2)}
        </div>
      </div>

      {/* Modals */}
      {editingActivity && (
        <ActivityDetailModal
          activity={editingActivity}
          onClose={() => setEditingActivity(null)}
          onSave={handleSaveActivity}
        />
      )}
      {addingToDay && (
        <AddActivityModal
          stop={addingToDay.stop}
          dayDateStr={addingToDay.dayDateStr}
          onClose={() => setAddingToDay(null)}
          onAdd={handleAddActivity}
          onAddCustom={handleAddCustomActivity}
        />
      )}
    </div>
  );
}
