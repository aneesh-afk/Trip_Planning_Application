import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Plus,
  Trash2,
  ArrowLeft,
  MapPin,
  Calendar,
  Wallet,
  ChevronDown,
  ChevronUp,
  Tag,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useTrip } from "../hooks/useTrip";

const getCityPhoto = (cityName) =>
  `https://picsum.photos/seed/${encodeURIComponent(
    cityName || "city"
  )}/600/400`;

const getActivityPhoto = (actName) =>
  `https://picsum.photos/seed/${encodeURIComponent(
    actName || "activity"
  )}/400/300`;

function SimpleModal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-lg text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors text-lg font-bold"
          >
            ×
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

export default function ItineraryBuilder() {
  const { tripId } = useParams();
  const { trip, stops, loading, refetch } = useTrip(tripId);

  const orderedStops = useMemo(
    () => [...stops].sort((a, b) => a.order_index - b.order_index),
    [stops]
  );
  const [expandedStops, setExpandedStops] = useState({});
  const [regionPhoto, setRegionPhoto] = useState(null);

  useEffect(() => {
    let active = true;

    async function fetchRegionPhoto() {
      if (!trip?.region) {
        setRegionPhoto(null);
        return;
      }

      const { data } = await supabase
        .from("cities")
        .select("image_url")
        .eq("region", trip.region)
        .not("image_url", "is", null)
        .limit(1)
        .maybeSingle();

      if (active) {
        setRegionPhoto(data?.image_url || getCityPhoto(trip.region));
      }
    }

    fetchRegionPhoto();

    return () => {
      active = false;
    };
  }, [trip?.region]);

  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const [cityResults, setCityResults] = useState([]);

  const [actModalOpen, setActModalOpen] = useState(false);
  const [activeStopIdForAct, setActiveStopIdForAct] = useState(null);
  const [actSearch, setActSearch] = useState("");
  const [actResults, setActResults] = useState([]);

  useEffect(() => {
    if (cityModalOpen) {
      let query = supabase
        .from("cities")
        .select("*")
        .ilike("name", `%${citySearch}%`)
        .limit(12);
      if (trip?.region) query = query.eq("region", trip.region);
      query.then(({ data }) => setCityResults(data || []));
    }
  }, [citySearch, cityModalOpen, trip?.region]);

  useEffect(() => {
    if (actModalOpen && activeStopIdForAct) {
      const stop = stops.find((s) => s.id === activeStopIdForAct);
      if (stop?.city?.id) {
        supabase
          .from("activities")
          .select("*")
          .eq("city_id", stop.city.id)
          .ilike("name", `%${actSearch}%`)
          .limit(15)
          .then(({ data }) => setActResults(data || []));
      }
    }
  }, [actSearch, actModalOpen, activeStopIdForAct, stops]);

  async function addStop(city) {
    const nextOrder = stops.length;
    const defaultStart =
      stops.at(-1)?.end_date ??
      trip?.start_date ??
      new Date().toISOString().slice(0, 10);
    await supabase.from("trip_stops").insert({
      trip_id: tripId,
      city_id: city.id,
      order_index: nextOrder,
      start_date: defaultStart,
      end_date: defaultStart,
    });
    setCityModalOpen(false);
    setCitySearch("");
    refetch();
  }

  async function addActivity(activity) {
    const stop = stops.find((s) => s.id === activeStopIdForAct);
    await supabase.from("stop_activities").insert({
      trip_stop_id: stop.id,
      activity_id: activity.id,
      scheduled_date: stop.start_date,
      order_index: stop.activities?.length ?? 0,
    });
    setActModalOpen(false);
    setActiveStopIdForAct(null);
    refetch();
  }

  async function deleteStop(stopId) {
    if (confirm("Remove this stop from the trip?")) {
      await supabase.from("trip_stops").delete().eq("id", stopId);
      refetch();
    }
  }

  async function deleteActivity(stopActId) {
    await supabase.from("stop_activities").delete().eq("id", stopActId);
    refetch();
  }

  async function updateStopField(stopId, field, value) {
    await supabase
      .from("trip_stops")
      .update({ [field]: value })
      .eq("id", stopId);
    refetch();
  }

  const toggleExpand = (stopId) => {
    setExpandedStops((prev) => ({ ...prev, [stopId]: !prev[stopId] }));
  };

  const categoryColors = {
    adventure: "bg-orange-100 text-orange-700",
    culture: "bg-purple-100 text-purple-700",
    food: "bg-green-100 text-green-700",
    sightseeing: "bg-blue-100 text-blue-700",
    nature: "bg-emerald-100 text-emerald-700",
    wellness: "bg-pink-100 text-pink-700",
  };

  if (loading && stops.length === 0) {
    return (
      <div className="min-h-screen bg-[#FBF7F0] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#C4622D] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#6B7268] text-sm">Loading your trip…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF7F0]">
      {/* ── Hero Banner ── */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <img
          src={regionPhoto || getCityPhoto(trip?.region)}
          alt={trip?.region || "Trip"}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = getCityPhoto(trip?.region);
          }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

        {/* Back button */}
        <div className="absolute top-5 left-5">
          <Link
            to="/trips"
            className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium transition-colors"
          >
            <ArrowLeft size={14} /> Back to My Trips
          </Link>
        </div>

        {/* Trip title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className="max-w-4xl mx-auto">
            {trip?.region && (
              <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full mb-2">
                <MapPin size={11} /> {trip.region}
              </span>
            )}
            <h1
              className="text-3xl md:text-4xl font-bold text-white leading-tight"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              {trip?.name ?? "Build Your Itinerary"}
            </h1>
            {trip?.start_date && (
              <p className="text-white/70 text-sm mt-1 flex items-center gap-1.5">
                <Calendar size={13} />
                {new Date(trip.start_date).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
                {trip.end_date &&
                  ` → ${new Date(trip.end_date).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}`}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-4xl mx-auto px-4 py-8 pb-24">
        {/* Empty state */}
        {orderedStops.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-[#E4DDD0] rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin size={32} className="text-[#6B7268]" />
            </div>
            <h2 className="text-xl font-bold text-[#1F2A24] mb-2">
              No stops yet
            </h2>
            <p className="text-[#6B7268] text-sm mb-6">
              Add your first city stop to start building your {trip?.region}{" "}
              itinerary.
            </p>
          </div>
        )}

        {/* ── Stop Cards ── */}
        <div className="flex flex-col gap-6">
          {orderedStops.map((stop, index) => (
            <div
              key={stop.id}
              className="bg-white rounded-2xl shadow-sm border border-[#E4DDD0] overflow-hidden"
            >
              {/* City Hero Image */}
              <div className="relative h-44 bg-[#1F2A24] overflow-hidden">
                <img
                  src={stop.city?.image_url || getCityPhoto(stop.city?.name)}
                  alt={stop.city?.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = getCityPhoto(stop.city?.name);
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                {/* Stop index badge */}
                <div className="absolute top-4 left-4">
                  <span className="bg-[#C4622D] text-white text-xs font-bold px-3 py-1.5 rounded-full">
                    Stop {index + 1}
                  </span>
                </div>

                {/* City name on image */}
                <div className="absolute bottom-4 left-4 right-12">
                  <h2
                    className="text-2xl font-bold text-white"
                    style={{ fontFamily: "'Fraunces', serif" }}
                  >
                    {stop.city?.name}
                  </h2>
                  <p className="text-white/70 text-sm">{stop.city?.country}</p>
                </div>

                {/* Controls top-right */}
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <button
                    onClick={() => toggleExpand(stop.id)}
                    className="w-8 h-8 flex items-center justify-center bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-white transition-colors"
                  >
                    {expandedStops[stop.id] ?? true ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </button>
                  <button
                    onClick={() => deleteStop(stop.id)}
                    className="w-8 h-8 flex items-center justify-center bg-red-500/80 hover:bg-red-600 backdrop-blur-sm rounded-full text-white transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Expandable body */}
              {(expandedStops[stop.id] ?? true) && (
                <div className="p-5 space-y-5">
                  {/* Date & Budget row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#FBF7F0] rounded-xl p-4 border border-[#E4DDD0]">
                      <h4 className="text-xs font-bold text-[#6B7268] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Calendar size={12} /> Date Range
                      </h4>
                      <div className="flex items-center gap-3">
                        <input
                          type="date"
                          value={stop.start_date || ""}
                          onChange={(e) =>
                            updateStopField(
                              stop.id,
                              "start_date",
                              e.target.value
                            )
                          }
                          className="flex-1 bg-white border border-[#E4DDD0] rounded-lg px-3 py-2 text-sm text-[#1F2A24] focus:outline-none focus:border-[#C4622D]"
                        />
                        <span className="text-[#6B7268] text-xs font-medium">
                          to
                        </span>
                        <input
                          type="date"
                          value={stop.end_date || ""}
                          min={stop.start_date || ""}
                          onChange={(e) =>
                            updateStopField(stop.id, "end_date", e.target.value)
                          }
                          className="flex-1 bg-white border border-[#E4DDD0] rounded-lg px-3 py-2 text-sm text-[#1F2A24] focus:outline-none focus:border-[#C4622D]"
                        />
                      </div>
                    </div>

                    <div className="bg-[#FBF7F0] rounded-xl p-4 border border-[#E4DDD0]">
                      <h4 className="text-xs font-bold text-[#6B7268] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Wallet size={12} /> Budget (₹)
                      </h4>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#6B7268] w-24 flex-shrink-0">
                            Stay / night
                          </span>
                          <input
                            type="number"
                            value={stop.stay_cost_per_night || 0}
                            onChange={(e) =>
                              updateStopField(
                                stop.id,
                                "stay_cost_per_night",
                                e.target.value
                              )
                            }
                            className="flex-1 bg-white border border-[#E4DDD0] rounded-lg px-3 py-2 text-sm text-[#1F2A24] focus:outline-none focus:border-[#C4622D]"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#6B7268] w-24 flex-shrink-0">
                            Transport
                          </span>
                          <input
                            type="number"
                            value={stop.transport_cost_to_here || 0}
                            onChange={(e) =>
                              updateStopField(
                                stop.id,
                                "transport_cost_to_here",
                                e.target.value
                              )
                            }
                            className="flex-1 bg-white border border-[#E4DDD0] rounded-lg px-3 py-2 text-sm text-[#1F2A24] focus:outline-none focus:border-[#C4622D]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Activities Section */}
                  <div>
                    <h4 className="text-xs font-bold text-[#6B7268] uppercase tracking-wider mb-3">
                      Activities
                    </h4>

                    {stop.activities?.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        {stop.activities.map((act) => (
                          <div
                            key={act.id}
                            className="group relative bg-white border border-[#E4DDD0] rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                          >
                            {/* Activity image */}
                            <div className="h-28 relative bg-[#1F2A24] overflow-hidden">
                              <img
                                src={
                                  act.image_url || getActivityPhoto(act.name)
                                }
                                alt={act.name}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = getActivityPhoto(act.name);
                                }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                              {/* Delete button */}
                              <button
                                onClick={() => deleteActivity(act.id)}
                                className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-red-500/80 hover:bg-red-600 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 size={12} />
                              </button>
                              {/* Cost badge on image */}
                              <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                ₹
                                {Number(act.effective_cost).toLocaleString(
                                  "en-IN"
                                )}
                              </span>
                            </div>
                            <div className="p-3">
                              <p className="font-semibold text-sm text-[#1F2A24] truncate">
                                {act.name}
                              </p>
                              {act.category && (
                                <span
                                  className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full mt-1 ${
                                    categoryColors[
                                      act.category?.toLowerCase()
                                    ] || "bg-gray-100 text-gray-600"
                                  }`}
                                >
                                  <Tag size={9} />
                                  {act.category}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-[#6B7268] italic mb-3">
                        No activities added yet.
                      </p>
                    )}

                    <button
                      onClick={() => {
                        setActiveStopIdForAct(stop.id);
                        setActModalOpen(true);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-[#E4DDD0] hover:border-[#C4622D] rounded-xl text-[#6B7268] hover:text-[#C4622D] transition-colors text-sm font-medium"
                    >
                      <Plus size={16} /> Add Activity
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── Add Stop Button ── */}
        <button
          onClick={() => {
            setCitySearch("");
            setCityModalOpen(true);
          }}
          className="w-full mt-6 flex items-center justify-center gap-3 py-5 bg-white border-2 border-dashed border-[#C4622D]/40 hover:border-[#C4622D] rounded-2xl text-[#C4622D] hover:bg-[#FEF5F0] transition-all text-base font-semibold shadow-sm"
        >
          <Plus size={20} /> Add a City Stop
        </button>

        {/* ── View Itinerary link ── */}
        {orderedStops.length > 0 && (
          <div className="mt-6 flex justify-end gap-3">
            <Link
              to={`/trips/${tripId}/budget`}
              className="px-5 py-2.5 bg-white border border-[#E4DDD0] text-[#1F2A24] rounded-xl text-sm font-medium hover:bg-[#FBF7F0] transition-colors"
            >
              View Budget
            </Link>
            <Link
              to={`/trips/${tripId}/view`}
              className="px-5 py-2.5 bg-[#C4622D] text-white rounded-xl text-sm font-medium hover:bg-[#a35225] transition-colors"
            >
              View Full Itinerary →
            </Link>
          </div>
        )}
      </div>

      {/* ── City Selection Modal ── */}
      <SimpleModal
        open={cityModalOpen}
        onClose={() => setCityModalOpen(false)}
        title={`Add a City Stop ${trip?.region ? `· ${trip.region}` : ""}`}
      >
        <input
          type="text"
          placeholder="Search cities…"
          value={citySearch}
          onChange={(e) => setCitySearch(e.target.value)}
          className="w-full border border-[#E4DDD0] rounded-xl px-4 py-3 text-sm text-[#1F2A24] focus:outline-none focus:border-[#C4622D] mb-4"
          autoFocus
        />
        <div className="grid grid-cols-2 gap-3">
          {cityResults.map((city) => (
            <button
              key={city.id}
              onClick={() => addStop(city)}
              className="group relative rounded-xl overflow-hidden border border-[#E4DDD0] hover:border-[#C4622D] hover:shadow-md transition-all text-left"
            >
              <div className="h-28 overflow-hidden bg-[#1F2A24]">
                <img
                  src={city.image_url || getCityPhoto(city.name)}
                  alt={city.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = getCityPhoto(city.name);
                  }}
                />
              </div>
              <div className="p-2 bg-white">
                <p className="font-bold text-[#1F2A24] text-sm truncate">
                  {city.name}
                </p>
                <p className="text-[#6B7268] text-[11px]">{city.country}</p>
              </div>
            </button>
          ))}
          {cityResults.length === 0 && (
            <p className="col-span-2 text-center text-sm text-[#6B7268] py-6">
              No cities found.
            </p>
          )}
        </div>
      </SimpleModal>

      {/* ── Activity Selection Modal ── */}
      <SimpleModal
        open={actModalOpen}
        onClose={() => {
          setActModalOpen(false);
          setActiveStopIdForAct(null);
          setActSearch("");
        }}
        title="Select an Activity"
      >
        <input
          type="text"
          placeholder="Search activities…"
          value={actSearch}
          onChange={(e) => setActSearch(e.target.value)}
          className="w-full border border-[#E4DDD0] rounded-xl px-4 py-3 text-sm text-[#1F2A24] focus:outline-none focus:border-[#C4622D] mb-4"
          autoFocus
        />
        <div className="flex flex-col gap-3">
          {actResults.map((act) => (
            <button
              key={act.id}
              onClick={() => addActivity(act)}
              className="group flex items-center gap-3 p-3 border border-[#E4DDD0] hover:border-[#C4622D] rounded-xl text-left bg-white hover:bg-[#FEF5F0] transition-all"
            >
              {/* Activity thumbnail */}
              <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-[#1F2A24]">
                <img
                  src={act.image_url || getActivityPhoto(act.name)}
                  alt={act.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = getActivityPhoto(act.name);
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-[#1F2A24] truncate">
                  {act.name}
                </p>
                {act.category && (
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full mt-1 ${
                      categoryColors[act.category?.toLowerCase()] ||
                      "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <Tag size={9} />
                    {act.category}
                  </span>
                )}
              </div>
              <span className="text-[#C4622D] font-bold text-sm flex-shrink-0">
                ₹{Number(act.estimated_cost).toLocaleString("en-IN")}
              </span>
            </button>
          ))}
          {actResults.length === 0 && (
            <p className="text-center text-sm text-[#6B7268] py-6">
              No activities found for this city.
            </p>
          )}
        </div>
      </SimpleModal>
    </div>
  );
}
