/**
 * TripCalendar.jsx — Screen 10: Trip Calendar / Timeline View
 * Visual redesign: Tailwind classes, dot cells, popovers, chip filters, smooth transitions.
 * Data-fetching logic, table names, and props contracts are NOT changed.
 */

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../hooks/useAuth";
import CalendarTour from "../components/CalendarTour";

/* ─── Design-system colour palette for trips (mirrors CSS tokens) ───────────── */
const TRIP_COLORS = [
  {
    dot: "#C4622D",
    chipBorder: "#C4622D",
    chipBg: "rgba(196,98,45,0.10)",
    chipText: "#C4622D",
    divider: "#C4622D",
  }, // route
  {
    dot: "#2B5D6B",
    chipBorder: "#2B5D6B",
    chipBg: "rgba(43,93,107,0.10)",
    chipText: "#2B5D6B",
    divider: "#2B5D6B",
  }, // horizon
  {
    dot: "#4A7A4E",
    chipBorder: "#4A7A4E",
    chipBg: "rgba(74,122,78,0.10)",
    chipText: "#4A7A4E",
    divider: "#4A7A4E",
  }, // success
  {
    dot: "#6B7268",
    chipBorder: "#6B7268",
    chipBg: "rgba(107,114,104,0.10)",
    chipText: "#6B7268",
    divider: "#6B7268",
  }, // muted
];

const CATEGORY_COLORS = {
  sightseeing: { bg: "rgba(43,93,107,0.12)", text: "#2B5D6B" },
  food: { bg: "rgba(196,98,45,0.12)", text: "#C4622D" },
  adventure: { bg: "rgba(74,122,78,0.12)", text: "#4A7A4E" },
  culture: { bg: "rgba(107,114,104,0.12)", text: "#6B7268" },
};
const catStyle = (cat) =>
  CATEGORY_COLORS[cat?.toLowerCase()] ?? {
    bg: "rgba(107,114,104,0.12)",
    text: "#6B7268",
  };

/* ─── date helpers (unchanged) ──────────────────────────────────────────────── */
const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
const firstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();
const toDateStr = (d) => d.toISOString().slice(0, 10);
const parseLocal = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const fmtMonthYear = (y, m) =>
  new Date(y, m, 1).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });
const fmtDayFull = (s) =>
  parseLocal(s).toLocaleDateString("default", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

/* ═══════════════════════════════════════════════════════════════════════════════
   Main component — DATA LOGIC UNCHANGED
═══════════════════════════════════════════════════════════════════════════════ */
export default function TripCalendar() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  // slide direction for month animation
  const [slideDir, setSlideDir] = useState(null); // "left" | "right" | null
  const [animKey, setAnimKey] = useState(0);

  const [trips, setTrips] = useState([]);
  const [stops, setStops] = useState([]);
  const [activities, setActivities] = useState([]);

  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  // Set of trip IDs that are "hidden" by chip filter (empty = all visible)
  const [hiddenTripIds, setHiddenTripIds] = useState(new Set());
  const [filterTripId, setFilterTripId] = useState("all"); // kept for dropdowns
  const [sortMode, setSortMode] = useState("time");
  const [savingId, setSavingId] = useState(null);

  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  const [edits, setEdits] = useState({});
  const [editingId, setEditingId] = useState(null);

  // Guided tour overlay state
  const [isTourOpen, setIsTourOpen] = useState(false);

  // Auto-trigger tour on first visit once loading completes
  useEffect(() => {
    if (!loading) {
      try {
        const hasSeen = localStorage.getItem("hasSeenCalendarTour");
        if (!hasSeen) {
          const timer = setTimeout(() => setIsTourOpen(true), 450);
          return () => clearTimeout(timer);
        }
      } catch (err) {
        console.error(err);
      }
    }
  }, [loading]);

  /* ── fetch (unchanged) ─────────────────────────────────────────────────── */
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);

      const { data: tripsData, error: tripsErr } = await supabase
        .from("trips")
        .select("id, name, start_date, end_date, cover_photo_url")
        .eq("user_id", user.id)
        .order("start_date", { ascending: true });

      if (tripsErr) {
        console.error(tripsErr);
        setLoading(false);
        return;
      }

      const coloredTrips = (tripsData ?? []).map((t, i) => ({
        ...t,
        colorIdx: i % TRIP_COLORS.length,
      }));
      setTrips(coloredTrips);
      if (!coloredTrips.length) {
        setLoading(false);
        return;
      }

      const tripIds = coloredTrips.map((t) => t.id);
      const { data: stopsData, error: stopsErr } = await supabase
        .from("trip_stops")
        .select(
          "id, trip_id, city_id, start_date, end_date, order_index, stay_cost_per_night, transport_cost_to_here, cities(name, country)"
        )
        .in("trip_id", tripIds)
        .order("start_date", { ascending: true });

      if (stopsErr) {
        console.error(stopsErr);
        setLoading(false);
        return;
      }
      setStops(
        (stopsData ?? []).map((s) => ({
          ...s,
          city_name: s.cities?.name ?? "Unknown city",
          country: s.cities?.country ?? "",
        }))
      );

      const stopIds = (stopsData ?? []).map((s) => s.id);
      if (!stopIds.length) {
        setLoading(false);
        return;
      }

      const { data: actData, error: actErr } = await supabase
        .from("stop_activities")
        .select(
          `id, trip_stop_id, activity_id, scheduled_date, scheduled_time, order_index, custom_cost_override,
                 activities(id, name, category, estimated_cost, duration_minutes, description, image_url)`
        )
        .in("trip_stop_id", stopIds)
        .order("order_index", { ascending: true });

      if (actErr) console.error(actErr);
      setActivities(actData ?? []);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  /* ── derived maps (unchanged) ──────────────────────────────────────────── */
  const activitiesByDate = activities.reduce((acc, sa) => {
    if (!sa.scheduled_date) return acc;
    (acc[sa.scheduled_date] ??= []).push(sa);
    return acc;
  }, {});

  const tripColorMap = trips.reduce((acc, t) => {
    acc[t.id] = TRIP_COLORS[t.colorIdx];
    return acc;
  }, {});
  const stopTripMap = stops.reduce((acc, s) => {
    acc[s.id] = s.trip_id;
    return acc;
  }, {});

  /* ── calendar helpers ──────────────────────────────────────────────────── */
  function buildGrid() {
    const total = daysInMonth(viewYear, viewMonth);
    const cells = Array(firstDayOfMonth(viewYear, viewMonth)).fill(null);
    for (let d = 1; d <= total; d++)
      cells.push(
        `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(
          d
        ).padStart(2, "0")}`
      );
    return cells;
  }

  function tripsForDate(dateStr) {
    const dt = parseLocal(dateStr);
    return trips.filter(
      (t) => dt >= parseLocal(t.start_date) && dt <= parseLocal(t.end_date)
    );
  }

  function visibleTripsForDate(dateStr) {
    return tripsForDate(dateStr).filter((t) => !hiddenTripIds.has(t.id));
  }

  function prevMonth() {
    setSlideDir("right");
    setAnimKey((k) => k + 1);
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    setSlideDir("left");
    setAnimKey((k) => k + 1);
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else setViewMonth((m) => m + 1);
  }

  /* ── day-panel rows (unchanged logic) ─────────────────────────────────── */
  function dayActivities(dateStr) {
    let rows = (activitiesByDate[dateStr] ?? []).map((sa) => ({
      ...sa,
      activity: sa.activities,
      tripId: stopTripMap[sa.trip_stop_id],
      stopInfo: stops.find((s) => s.id === sa.trip_stop_id),
    }));
    if (filterTripId !== "all")
      rows = rows.filter((r) => r.tripId === filterTripId);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.activity?.name?.toLowerCase().includes(q) ||
          r.activity?.category?.toLowerCase().includes(q) ||
          r.stopInfo?.city_name?.toLowerCase().includes(q)
      );
    }
    if (sortMode === "time") {
      rows.sort((a, b) => {
        const ta = a.scheduled_time ?? "99:99",
          tb = b.scheduled_time ?? "99:99";
        return ta !== tb
          ? ta.localeCompare(tb)
          : (a.order_index ?? 0) - (b.order_index ?? 0);
      });
    } else if (sortMode === "category") {
      rows.sort((a, b) =>
        (a.activity?.category ?? "").localeCompare(b.activity?.category ?? "")
      );
    }
    return rows;
  }

  /* ── drag-to-reorder (unchanged) ───────────────────────────────────────── */
  const onDragStart = (idx) => {
    dragItem.current = idx;
  };
  const onDragEnter = (idx) => {
    dragOverItem.current = idx;
  };

  async function onDragEnd(dateStr) {
    const rows = dayActivities(dateStr);
    if (
      dragItem.current === null ||
      dragOverItem.current === null ||
      dragItem.current === dragOverItem.current
    )
      return;
    const reordered = [...rows];
    const [moved] = reordered.splice(dragItem.current, 1);
    reordered.splice(dragOverItem.current, 0, moved);
    setActivities((prev) => {
      const updated = [...prev];
      reordered.forEach((r, idx) => {
        const i = updated.findIndex((a) => a.id === r.id);
        if (i >= 0) updated[i] = { ...updated[i], order_index: idx };
      });
      return updated;
    });
    dragItem.current = null;
    dragOverItem.current = null;
    await Promise.all(
      reordered.map((r, idx) =>
        supabase
          .from("stop_activities")
          .update({ order_index: idx })
          .eq("id", r.id)
      )
    );
  }

  /* ── quick-edit (unchanged) ────────────────────────────────────────────── */
  function startEdit(sa) {
    setEditingId(sa.id);
    setEdits((prev) => ({
      ...prev,
      [sa.id]: {
        scheduled_time: sa.scheduled_time ?? "",
        custom_cost_override:
          sa.custom_cost_override != null
            ? String(sa.custom_cost_override)
            : "",
      },
    }));
  }
  const cancelEdit = () => setEditingId(null);

  async function saveEdit(saId) {
    const patch = edits[saId];
    if (!patch) return;
    setSavingId(saId);
    const payload = {
      scheduled_time: patch.scheduled_time || null,
      custom_cost_override:
        patch.custom_cost_override !== ""
          ? Number(patch.custom_cost_override)
          : null,
    };
    const { error } = await supabase
      .from("stop_activities")
      .update(payload)
      .eq("id", saId);
    setSavingId(null);
    if (!error) {
      setActivities((prev) =>
        prev.map((a) => (a.id === saId ? { ...a, ...payload } : a))
      );
      setEditingId(null);
    } else console.error("Save error:", error);
  }

  /* ── chip toggle ───────────────────────────────────────────────────────── */
  function toggleTripChip(tripId) {
    setHiddenTripIds((prev) => {
      const next = new Set(prev);
      next.has(tripId) ? next.delete(tripId) : next.add(tripId);
      return next;
    });
  }

  const todayStr = toDateStr(today);
  const calGrid = buildGrid();
  const DAY_HDR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  /* ── animation keyframe injection ─────────────────────────────────────── */
  const slideStyle = `
    @keyframes slideInLeft  { from { opacity:0; transform:translateX(32px);  } to { opacity:1; transform:translateX(0); } }
    @keyframes slideInRight { from { opacity:0; transform:translateX(-32px); } to { opacity:1; transform:translateX(0); } }
    @keyframes fadeScaleIn  { from { opacity:0; transform:scale(0.94); }       to { opacity:1; transform:scale(1);    } }
    @keyframes spin         { to   { transform:rotate(360deg); } }
    .cal-slide-left  { animation: slideInLeft  200ms ease-out both; }
    .cal-slide-right { animation: slideInRight 200ms ease-out both; }
    .popover-enter   { animation: fadeScaleIn  150ms ease-out both; }
  `;

  /* ══════════════════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-bg font-body">
      <style>{slideStyle}</style>

      {/* ── Sticky nav bar ───────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 bg-surface border-b border-border h-16 flex items-center gap-4 px-6">
        <span
          className="font-display text-h2 text-route font-semibold cursor-pointer shrink-0"
          onClick={() => navigate("/dashboard")}
        >
          GlobeTrotter
        </span>

        {/* search */}
        <div className="flex-1 max-w-md">
          <input
            id="calendar-search"
            type="text"
            placeholder="Search activities, cities…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-bg border border-border rounded-sm px-3 py-2 font-body text-small text-ink placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-route transition-shadow"
          />
        </div>

        {/* controls */}
        <div className="flex gap-2 ml-auto items-center">
          <select
            id="calendar-filter-trip"
            value={filterTripId}
            onChange={(e) => setFilterTripId(e.target.value)}
            className="bg-bg border border-border rounded-sm px-3 py-2 font-body text-small text-ink focus:outline-none focus:ring-1 focus:ring-route cursor-pointer"
          >
            <option value="all">All Trips</option>
            {trips.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          <select
            id="calendar-sort"
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value)}
            className="bg-bg border border-border rounded-sm px-3 py-2 font-body text-small text-ink focus:outline-none focus:ring-1 focus:ring-route cursor-pointer"
          >
            <option value="time">Sort: Time</option>
            <option value="category">Sort: Category</option>
          </select>

          <button
            id="calendar-today-btn"
            onClick={() => {
              setViewYear(today.getFullYear());
              setViewMonth(today.getMonth());
              setSelectedDate(todayStr);
            }}
            className="bg-route text-white font-body text-small font-medium rounded-sm px-4 py-2 hover:bg-route/90 transition-colors"
          >
            Today
          </button>

          {/* Replay tutorial button */}
          <button
            id="replay-tour-btn"
            onClick={() => setIsTourOpen(true)}
            title="Replay Calendar Tutorial"
            className="flex items-center gap-1.5 bg-bg border border-border text-ink hover:border-route hover:text-route font-body text-small font-medium rounded-sm px-3 py-2 transition-colors cursor-pointer"
          >
            <span className="text-route text-xs">✨</span>
            <span className="hidden sm:inline">Tutorial</span>
          </button>
        </div>
      </nav>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main className="max-w-[1120px] mx-auto px-6 py-10 flex flex-col gap-8">
        {/* Page heading */}
        <div>
          <h1 className="font-display text-h1 font-semibold text-ink">
            Calendar View
          </h1>
          <p className="text-small text-muted mt-1">
            Visualise your full journey — tap any day to explore.
          </p>
        </div>

        {/* ── States ───────────────────────────────────────────────────── */}
        {loading ? (
          <LoadingState />
        ) : trips.length === 0 ? (
          <EmptyState navigate={navigate} />
        ) : (
          <>
            {/* ── Calendar + side panel ─────────────────────────────── */}
            <div
              className={`grid gap-6 items-start transition-all duration-200 ${
                selectedDate ? "grid-cols-[1fr_380px]" : "grid-cols-1"
              }`}
            >
              {/* Calendar card */}
              <div
                id="tour-calendar-card"
                className="bg-surface rounded-md shadow-card overflow-hidden"
              >
                {/* Month nav */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4">
                  <button
                    id="cal-prev-month"
                    onClick={prevMonth}
                    aria-label="Previous month"
                    className="w-9 h-9 flex items-center justify-center rounded-sm border border-border text-ink hover:bg-border/30 transition-colors text-lg"
                  >
                    ←
                  </button>
                  <h2 className="font-display text-h2 font-semibold text-ink">
                    {fmtMonthYear(viewYear, viewMonth)}
                  </h2>
                  <button
                    id="cal-next-month"
                    onClick={nextMonth}
                    aria-label="Next month"
                    className="w-9 h-9 flex items-center justify-center rounded-sm border border-border text-ink hover:bg-border/30 transition-colors text-lg"
                  >
                    →
                  </button>
                </div>

                {/* Day-of-week headers */}
                <div className="grid grid-cols-7 px-4 pb-2">
                  {DAY_HDR.map((h) => (
                    <div
                      key={h}
                      className="text-center font-body text-label font-medium uppercase tracking-wide text-muted py-1"
                    >
                      {h}
                    </div>
                  ))}
                </div>

                {/* Cell grid — animated on month change */}
                <div
                  key={animKey}
                  className={`grid grid-cols-7 gap-1 px-4 pb-4 ${
                    slideDir === "left"
                      ? "cal-slide-left"
                      : slideDir === "right"
                      ? "cal-slide-right"
                      : ""
                  }`}
                >
                  {calGrid.map((dateStr, idx) =>
                    dateStr === null ? (
                      <div key={`e-${idx}`} className="min-h-[80px]" />
                    ) : (
                      <DayCell
                        key={dateStr}
                        dateStr={dateStr}
                        dayNum={parseInt(dateStr.split("-")[2], 10)}
                        visibleTrips={visibleTripsForDate(dateStr)}
                        tripColorMap={tripColorMap}
                        hasActivities={
                          (activitiesByDate[dateStr]?.length ?? 0) > 0
                        }
                        isToday={dateStr === todayStr}
                        isSelected={dateStr === selectedDate}
                        allDayTrips={tripsForDate(dateStr)}
                        stops={stops}
                        onClick={() =>
                          setSelectedDate((p) =>
                            p === dateStr ? null : dateStr
                          )
                        }
                      />
                    )
                  )}
                </div>

                {/* Trip chip row */}
                <div
                  id="tour-trip-chips"
                  className="border-t border-border px-4 py-3 flex flex-wrap gap-2"
                >
                  {trips.map((t) => {
                    const c = TRIP_COLORS[t.colorIdx];
                    const isOn = !hiddenTripIds.has(t.id);
                    return (
                      <button
                        key={t.id}
                        id={`chip-trip-${t.id}`}
                        onClick={() => toggleTripChip(t.id)}
                        style={
                          isOn
                            ? {
                                borderColor: c.chipBorder,
                                background: c.chipBg,
                                color: c.chipText,
                              }
                            : {}
                        }
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full border font-body text-label font-medium transition-all duration-150 cursor-pointer select-none
                          ${
                            isOn
                              ? ""
                              : "border-border text-muted bg-transparent"
                          }`}
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0 transition-colors duration-150"
                          style={{ background: isOn ? c.dot : "#9CA3AF" }}
                        />
                        {t.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Day detail side panel */}
              {selectedDate && (
                <DayPanel
                  dateStr={selectedDate}
                  rows={dayActivities(selectedDate)}
                  tripColorMap={tripColorMap}
                  trips={trips}
                  stops={stops}
                  onClose={() => setSelectedDate(null)}
                  onDragStart={onDragStart}
                  onDragEnter={onDragEnter}
                  onDragEnd={() => onDragEnd(selectedDate)}
                  editingId={editingId}
                  edits={edits}
                  setEdits={setEdits}
                  startEdit={startEdit}
                  cancelEdit={cancelEdit}
                  saveEdit={saveEdit}
                  savingId={savingId}
                  navigate={navigate}
                  stopTripMap={stopTripMap}
                />
              )}
            </div>

            {/* ── Full itinerary timeline ───────────────────────────── */}
            <TimelineSection
              trips={trips}
              stops={stops}
              activities={activities}
              tripColorMap={tripColorMap}
              filterTripId={filterTripId}
              navigate={navigate}
            />
          </>
        )}
      </main>

      {/* ── Guided Tutorial Overlay ── */}
      <CalendarTour isOpen={isTourOpen} onClose={() => setIsTourOpen(false)} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   DayCell — dots only, popover on hover/click
═══════════════════════════════════════════════════════════════════════════════ */
function DayCell({
  dateStr,
  dayNum,
  visibleTrips,
  tripColorMap,
  hasActivities,
  isToday,
  isSelected,
  allDayTrips,
  stops,
  onClick,
}) {
  const [hovered, setHovered] = useState(false);
  const MAX_DOTS = 3;
  const extraTrips =
    visibleTrips.length > MAX_DOTS ? visibleTrips.length - MAX_DOTS : 0;
  const dotsToShow = visibleTrips.slice(0, MAX_DOTS);

  // Popover content: trip names + city-stop names active that day
  function PopoverContent() {
    if (!allDayTrips.length) return null;
    return (
      <div
        className="absolute z-50 bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2 w-52 bg-surface border border-border rounded-md shadow-hover popover-enter"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-3 py-2 border-b border-border">
          <span className="font-body text-label uppercase tracking-wide text-muted font-medium">
            {dateStr.slice(5).replace("-", " / ")}
          </span>
        </div>
        {allDayTrips.map((t) => {
          const c = tripColorMap[t.id];
          // stops active that day
          const activeStops = stops.filter((s) => {
            if (s.trip_id !== t.id) return false;
            const dt = parseLocal(dateStr);
            return (
              dt >= parseLocal(s.start_date) && dt <= parseLocal(s.end_date)
            );
          });
          return (
            <div
              key={t.id}
              className="px-3 py-2 border-b border-border last:border-0"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: c.dot }}
                />
                <span className="font-body text-small font-semibold text-ink truncate">
                  {t.name}
                </span>
              </div>
              {activeStops.map((s) => (
                <div
                  key={s.id}
                  className="font-body text-label text-muted pl-3.5 truncate"
                >
                  {s.city_name}
                  {s.country ? `, ${s.country}` : ""}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div
      id={`cal-day-${dateStr}`}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative min-h-[80px] rounded-lg border p-2 flex flex-col gap-1.5 cursor-pointer select-none
        transition-all duration-150 ease-out
        ${
          isSelected
            ? "border-route border-2 bg-route/5 scale-[1.02] shadow-hover"
            : isToday
            ? "border-horizon border-2 bg-horizon/5"
            : "border-border bg-surface hover:shadow-hover hover:bg-border/10"
        }
      `}
    >
      {/* Day number */}
      <span
        className={`font-mono text-small leading-none font-medium
        ${isToday ? "text-horizon" : isSelected ? "text-route" : "text-ink"}`}
      >
        {dayNum}
      </span>

      {/* Trip dots */}
      <div className="flex flex-wrap gap-1 mt-auto">
        {dotsToShow.map((t) => (
          <span
            key={t.id}
            title={t.name}
            className="w-2 h-2 rounded-full shrink-0 transition-opacity duration-150"
            style={{ background: tripColorMap[t.id]?.dot ?? "#9CA3AF" }}
          />
        ))}
        {extraTrips > 0 && (
          <span
            className="font-body leading-none text-muted"
            style={{ fontSize: 9 }}
          >
            +{extraTrips}
          </span>
        )}
      </div>

      {/* Activity indicator dot (bottom-right) */}
      {hasActivities && (
        <span className="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-route" />
      )}

      {/* Popover on hover */}
      {hovered && allDayTrips.length > 0 && <PopoverContent />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   DayPanel — right-side activity timeline
═══════════════════════════════════════════════════════════════════════════════ */
function DayPanel({
  dateStr,
  rows,
  tripColorMap,
  trips,
  stops,
  onClose,
  onDragStart,
  onDragEnter,
  onDragEnd,
  editingId,
  edits,
  setEdits,
  startEdit,
  cancelEdit,
  saveEdit,
  savingId,
  navigate,
  stopTripMap,
}) {
  const tripForStop = (stopId) =>
    trips.find((t) => t.id === stopTripMap[stopId]);

  return (
    <div
      id="day-detail-panel"
      className="popover-enter bg-surface rounded-md shadow-card flex flex-col max-h-[80vh] overflow-hidden border border-border"
    >
      {/* Header */}
      <div className="flex items-start justify-between px-5 py-4 border-b border-border shrink-0">
        <div>
          <h3 className="font-display text-h2 font-semibold text-ink leading-tight">
            {fmtDayFull(dateStr)}
          </h3>
          <p className="text-small text-muted mt-0.5">
            {rows.length === 0
              ? "No activities scheduled"
              : `${rows.length} activit${rows.length === 1 ? "y" : "ies"}`}
          </p>
        </div>
        <button
          id="day-panel-close"
          onClick={onClose}
          aria-label="Close day panel"
          className="w-8 h-8 flex items-center justify-center rounded-sm border border-border text-muted hover:bg-border/30 transition-colors shrink-0 mt-0.5"
        >
          ✕
        </button>
      </div>

      {/* Scrollable activity list */}
      <div className="overflow-y-auto flex-1 px-5 py-4">
        {rows.length === 0 ? (
          <div className="text-center py-12 text-muted">
            <div className="text-4xl mb-3">📅</div>
            <p className="text-small italic">No activities on this day yet.</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline spine */}
            <div className="absolute left-[13px] top-0 bottom-0 w-0.5 bg-border z-0" />

            {rows.map((row, idx) => {
              const trip = tripForStop(row.trip_stop_id);
              const c = trip ? tripColorMap[trip.id] : TRIP_COLORS[0];
              const cat = row.activity?.category ?? "";
              const cs = catStyle(cat);
              const isEditing = editingId === row.id;
              const edit = edits[row.id] ?? {};
              const effectiveCost =
                row.custom_cost_override != null
                  ? row.custom_cost_override
                  : row.activity?.estimated_cost ?? 0;

              return (
                <div
                  key={row.id}
                  id={`activity-row-${row.id}`}
                  draggable
                  onDragStart={() => onDragStart(idx)}
                  onDragEnter={() => onDragEnter(idx)}
                  onDragEnd={onDragEnd}
                  className="relative z-10 flex gap-4 mb-3 cursor-grab active:cursor-grabbing"
                >
                  {/* Number bubble */}
                  <div
                    className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center font-mono text-[11px] font-semibold z-10 relative border-2"
                    style={{
                      background: c.chipBg,
                      borderColor: c.dot,
                      color: c.dot,
                    }}
                  >
                    {idx + 1}
                  </div>

                  {/* Activity card */}
                  <div className="flex-1 min-w-0 bg-bg border border-border rounded-sm px-3 py-2.5 hover:shadow-hover transition-shadow duration-150">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {/* Name + category badge */}
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <span className="font-body text-body font-medium text-ink">
                            {row.activity?.name ?? "Activity"}
                          </span>
                          {cat && (
                            <span
                              className="font-body text-label font-medium uppercase tracking-wide rounded-full px-2 py-0.5"
                              style={{ background: cs.bg, color: cs.text }}
                            >
                              {cat}
                            </span>
                          )}
                        </div>

                        {/* City + trip label */}
                        <div className="text-small text-muted mb-1.5 flex items-center flex-wrap gap-1">
                          {row.stopInfo?.city_name}
                          {row.stopInfo?.country
                            ? `, ${row.stopInfo.country}`
                            : ""}
                          {trip && (
                            <span
                              className="rounded-full px-1.5 py-px text-[0.65rem] font-medium border"
                              style={{
                                background: c.chipBg,
                                color: c.dot,
                                borderColor: c.dot,
                              }}
                            >
                              {trip.name}
                            </span>
                          )}
                        </div>

                        {!isEditing && (
                          <div className="flex flex-wrap gap-3">
                            {row.scheduled_time && (
                              <span className="font-mono text-small text-horizon">
                                🕐 {row.scheduled_time.slice(0, 5)}
                              </span>
                            )}
                            {row.activity?.duration_minutes && (
                              <span className="font-mono text-small text-muted">
                                ⏱ {row.activity.duration_minutes} min
                              </span>
                            )}
                            <span
                              className={`font-mono text-small ${
                                row.custom_cost_override != null
                                  ? "text-route"
                                  : "text-success"
                              }`}
                            >
                              ₹{Number(effectiveCost).toFixed(2)}
                              {row.custom_cost_override != null && (
                                <span className="text-[0.62rem] ml-0.5 opacity-70">
                                  (custom)
                                </span>
                              )}
                            </span>
                          </div>
                        )}

                        {/* Inline edit form */}
                        {isEditing && (
                          <div className="mt-3 flex flex-col gap-3">
                            <label className="font-body text-label uppercase tracking-wide text-muted font-medium">
                              Time
                              <input
                                id={`edit-time-${row.id}`}
                                type="time"
                                value={edit.scheduled_time ?? ""}
                                onChange={(e) =>
                                  setEdits((p) => ({
                                    ...p,
                                    [row.id]: {
                                      ...p[row.id],
                                      scheduled_time: e.target.value,
                                    },
                                  }))
                                }
                                className="block mt-1 w-full font-mono text-small bg-surface border border-border rounded-sm px-2.5 py-1.5 text-ink focus:outline-none focus:ring-1 focus:ring-route"
                              />
                            </label>
                            <label className="font-body text-label uppercase tracking-wide text-muted font-medium">
                              Custom Cost (₹)
                              <input
                                id={`edit-cost-${row.id}`}
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder={`Default: ₹${
                                  row.activity?.estimated_cost ?? 0
                                }`}
                                value={edit.custom_cost_override ?? ""}
                                onChange={(e) =>
                                  setEdits((p) => ({
                                    ...p,
                                    [row.id]: {
                                      ...p[row.id],
                                      custom_cost_override: e.target.value,
                                    },
                                  }))
                                }
                                className="block mt-1 w-full font-mono text-small bg-surface border border-border rounded-sm px-2.5 py-1.5 text-ink focus:outline-none focus:ring-1 focus:ring-route"
                              />
                            </label>
                            <div className="flex gap-2">
                              <button
                                id={`save-activity-${row.id}`}
                                onClick={() => saveEdit(row.id)}
                                disabled={savingId === row.id}
                                className="bg-route text-white font-body text-small font-medium rounded-sm px-3 py-1.5 disabled:opacity-60 hover:bg-route/90 transition-colors"
                              >
                                {savingId === row.id ? "Saving…" : "Save"}
                              </button>
                              <button
                                id={`cancel-edit-${row.id}`}
                                onClick={cancelEdit}
                                className="bg-transparent border border-border text-muted font-body text-small font-medium rounded-sm px-3 py-1.5 hover:bg-border/30 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {!isEditing && (
                        <button
                          id={`quick-edit-${row.id}`}
                          onClick={() => startEdit(row)}
                          title="Quick edit"
                          className="w-7 h-7 shrink-0 flex items-center justify-center rounded-sm border border-border text-muted text-xs hover:bg-border/30 transition-colors"
                        >
                          ✏️
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer — open builder links */}
      {rows.length > 0 && (
        <div className="px-5 py-3 border-t border-border shrink-0 flex flex-col gap-1.5">
          {[...new Set(rows.map((r) => r.tripId).filter(Boolean))].map(
            (tid) => {
              const trip = trips.find((t) => t.id === tid);
              if (!trip) return null;
              const c = tripColorMap[tid];
              return (
                <button
                  key={tid}
                  id={`go-to-builder-${tid}`}
                  onClick={() => navigate(`/trips/${tid}/build`)}
                  className="w-full text-left px-3.5 py-2 rounded-sm border font-body text-small font-medium transition-colors"
                  style={{
                    borderColor: c.dot,
                    background: c.chipBg,
                    color: c.dot,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = c.chipBg.replace(
                      "0.10",
                      "0.18"
                    );
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = c.chipBg;
                  }}
                >
                  Open Itinerary Builder → {trip.name}
                </button>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   TimelineSection — vertical connected stop list per trip
═══════════════════════════════════════════════════════════════════════════════ */
function TimelineSection({
  trips,
  stops,
  activities,
  tripColorMap,
  filterTripId,
  navigate,
}) {
  const visibleTrips =
    filterTripId === "all" ? trips : trips.filter((t) => t.id === filterTripId);

  return (
    <div id="tour-timeline-section">
      <h2 className="font-display text-h2 font-semibold text-ink mb-5">
        Full Itinerary Timeline
      </h2>

      <div className="flex flex-col gap-6">
        {visibleTrips.map((trip) => {
          const c = tripColorMap[trip.id];
          const tripStops = stops
            .filter((s) => s.trip_id === trip.id)
            .sort((a, b) => a.order_index - b.order_index);

          return (
            <div
              key={trip.id}
              id={`timeline-trip-${trip.id}`}
              className="bg-surface rounded-md shadow-card overflow-hidden"
            >
              {/* Trip header with 3px rounded divider */}
              <div
                className="flex items-center justify-between px-6 py-4"
                style={{ background: c.chipBg }}
              >
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    {/* 3px rounded colour bar */}
                    <span
                      className="block h-[3px] w-8 rounded-full shrink-0"
                      style={{ background: c.divider }}
                    />
                    <h3
                      className="font-display text-h2 font-semibold"
                      style={{ color: c.chipText }}
                    >
                      {trip.name}
                    </h3>
                  </div>
                  <span className="font-mono text-small text-muted">
                    {trip.start_date} → {trip.end_date}
                  </span>
                </div>
                <button
                  id={`timeline-open-${trip.id}`}
                  onClick={() => navigate(`/trips/${trip.id}/view`)}
                  className="font-body text-small font-medium rounded-sm px-4 py-1.5 border transition-colors"
                  style={{ borderColor: c.dot, color: c.dot }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = c.chipBg;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  View →
                </button>
              </div>

              {/* Vertical stop list */}
              <div className="px-6 py-5">
                {tripStops.length === 0 ? (
                  <p className="text-small text-muted italic">
                    No stops added yet.
                  </p>
                ) : (
                  <div className="flex flex-col gap-0">
                    {tripStops.map((stop, si) => {
                      const stopActs = activities
                        .filter((a) => a.trip_stop_id === stop.id)
                        .sort((a, b) => {
                          if (a.scheduled_date !== b.scheduled_date)
                            return a.scheduled_date.localeCompare(
                              b.scheduled_date
                            );
                          return (a.order_index ?? 0) - (b.order_index ?? 0);
                        });
                      const hasFilled = stopActs.length > 0;

                      return (
                        <TimelineStop
                          key={stop.id}
                          stop={stop}
                          stopActs={stopActs}
                          hasFilled={hasFilled}
                          isLast={si === tripStops.length - 1}
                          color={c}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   TimelineStop — single stop row
═══════════════════════════════════════════════════════════════════════════════ */
function TimelineStop({ stop, stopActs, hasFilled, isLast, color: c }) {
  return (
    <div id={`timeline-stop-${stop.id}`} className="flex gap-4">
      {/* Circle + connector line */}
      <div className="flex flex-col items-center">
        <div
          className={`w-4 h-4 rounded-full border-2 shrink-0 transition-colors`}
          style={
            hasFilled
              ? { background: c.dot, borderColor: c.dot }
              : { background: "var(--color-surface)", borderColor: c.dot }
          }
        />
        {!isLast && (
          <div
            className="w-0.5 flex-1 my-1"
            style={{
              background: c.chipBg,
              minHeight: 24,
              borderLeft: `2px solid ${c.dot}`,
              opacity: 0.4,
            }}
          />
        )}
      </div>

      {/* Stop details */}
      <div className={`pb-5 flex-1 min-w-0 ${isLast ? "pb-0" : ""}`}>
        <div className="font-body text-small font-semibold text-ink leading-tight">
          {stop.city_name}
        </div>
        <div
          className="font-mono text-muted mb-2"
          style={{ fontSize: "0.68rem" }}
        >
          {stop.start_date} – {stop.end_date}
        </div>

        {/* Activities sub-list */}
        <div className="flex flex-col gap-0.5 pl-1">
          {stopActs.slice(0, 4).map((sa) => {
            const cs = catStyle(sa.activities?.category);
            return (
              <div
                key={sa.id}
                className="flex items-center gap-1.5 font-body"
                style={{ fontSize: "0.72rem", color: "var(--color-ink)" }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: cs.text }}
                />
                <span className="truncate">
                  {sa.activities?.name ?? "Activity"}
                </span>
                {sa.scheduled_date && (
                  <span
                    className="font-mono text-muted shrink-0"
                    style={{ fontSize: "0.6rem" }}
                  >
                    {sa.scheduled_date.slice(5)}
                  </span>
                )}
              </div>
            );
          })}
          {stopActs.length > 4 && (
            <div
              className="font-body text-muted italic"
              style={{ fontSize: "0.7rem" }}
            >
              +{stopActs.length - 4} more
            </div>
          )}
          {stopActs.length === 0 && (
            <div
              className="font-body text-muted italic"
              style={{ fontSize: "0.7rem" }}
            >
              No activities yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   Loading / Empty states
═══════════════════════════════════════════════════════════════════════════════ */
function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted">
      <div
        className="w-10 h-10 border-[3px] border-border border-t-route rounded-full"
        style={{ animation: "spin 0.8s linear infinite" }}
      />
      <p className="font-body text-body">Loading your calendar…</p>
    </div>
  );
}

function EmptyState({ navigate }) {
  return (
    <div className="bg-surface rounded-md shadow-card p-16 text-center">
      <div className="text-5xl mb-4">🗺️</div>
      <h2 className="font-display text-h2 text-ink font-semibold mb-2">
        No trips yet
      </h2>
      <p className="text-body text-muted mb-6">
        Create your first trip to see it on the calendar.
      </p>
      <button
        id="empty-state-create-trip"
        onClick={() => navigate("/trips/new")}
        className="bg-route text-white font-body text-body font-medium rounded-sm px-6 py-2.5 hover:bg-route/90 transition-colors"
      >
        Plan a Trip
      </button>
    </div>
  );
}
