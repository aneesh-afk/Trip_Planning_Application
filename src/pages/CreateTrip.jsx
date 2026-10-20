import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../hooks/useAuth";
import { ChevronDown } from "lucide-react";

const CreateTrip = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [cities, setCities] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    is_public: false,
  });

  useEffect(() => {
    const fetchCities = async () => {
      const { data } = await supabase.from("cities").select("region");
      if (data) setCities(data);
    };
    fetchCities();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: insertError } = await supabase
        .from("trips")
        .insert([
          {
            user_id: user.id,
            name:
              formData.name ||
              (selectedRegion ? `Trip to ${selectedRegion}` : "My Trip"),
            description: formData.description || null,
            start_date: formData.start_date,
            end_date: formData.end_date,
            is_public: formData.is_public,
            region: selectedRegion || null,
          },
        ])
        .select()
        .single();
      if (insertError) throw insertError;
      navigate(`/trips/${data.id}/build`);
    } catch (err) {
      setError(err.message || "Failed to create trip.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF7F0] flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-[560px]">
        {/* Header */}
        <div className="mb-8">
          <h1
            style={{ fontFamily: "'Fraunces', serif" }}
            className="text-4xl font-semibold text-[#1F2A24] mb-2"
          >
            Plan a New Trip
          </h1>
          <p className="text-[#6B7268] text-base">
            Where are you headed? Give your journey a name and some dates.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-[#B3452E] text-[#B3452E] text-sm p-3 rounded-md mb-6">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl border border-[#E4DDD0] shadow-[0_1px_3px_rgba(31,42,36,0.08)] p-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ── Region Filter ── */}
            <div>
              <label
                htmlFor="region"
                className="block text-xs font-medium uppercase tracking-widest text-[#1F2A24] mb-2"
              >
                Region
              </label>
              <div className="relative">
                <select
                  id="region"
                  required
                  value={selectedRegion}
                  onChange={(e) => {
                    const r = e.target.value;
                    setSelectedRegion(r);
                    if (
                      !formData.name ||
                      formData.name.startsWith("Trip to ")
                    ) {
                      setFormData((prev) => ({
                        ...prev,
                        name: `Trip to ${r}`,
                      }));
                    }
                  }}
                  className="w-full bg-white border border-[#E4DDD0] rounded-lg px-4 py-3 text-sm text-[#1F2A24] focus:outline-none focus:border-[#2B5D6B] focus:ring-2 focus:ring-[#2B5D6B]/10 transition-all appearance-none cursor-pointer"
                >
                  <option value="" disabled>
                    Select a Region...
                  </option>
                  {[...new Set(cities.map((c) => c.region).filter(Boolean))]
                    .sort()
                    .map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7268] pointer-events-none"
                />
              </div>
            </div>

            {/* ── Trip Name ── */}
            <div>
              <label
                htmlFor="name"
                className="block text-xs font-medium uppercase tracking-widest text-[#1F2A24] mb-2"
              >
                Trip Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="e.g. Japan Spring 2026"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-white border border-[#E4DDD0] rounded-lg px-4 py-3 text-sm text-[#1F2A24] focus:outline-none focus:border-[#2B5D6B] focus:ring-2 focus:ring-[#2B5D6B]/10 transition-all placeholder-[#6B7268]"
              />
            </div>

            {/* ── Description ── */}
            <div>
              <label
                htmlFor="description"
                className="block text-xs font-medium uppercase tracking-widest text-[#1F2A24] mb-2"
              >
                Description{" "}
                <span className="normal-case font-normal text-[#6B7268]">
                  (optional)
                </span>
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                placeholder="What's the vibe?"
                value={formData.description}
                onChange={handleChange}
                className="w-full bg-white border border-[#E4DDD0] rounded-lg px-4 py-3 text-sm text-[#1F2A24] focus:outline-none focus:border-[#2B5D6B] focus:ring-2 focus:ring-[#2B5D6B]/10 transition-all placeholder-[#6B7268] resize-none"
              />
            </div>

            {/* ── Dates ── */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="start_date"
                  className="block text-xs font-medium uppercase tracking-widest text-[#1F2A24] mb-2"
                >
                  Start Date
                </label>
                <input
                  id="start_date"
                  name="start_date"
                  type="date"
                  required
                  min={new Date().toISOString().split("T")[0]}
                  value={formData.start_date}
                  onChange={handleChange}
                  className="w-full bg-white border border-[#E4DDD0] rounded-lg px-4 py-3 font-mono text-sm text-[#1F2A24] focus:outline-none focus:border-[#2B5D6B] focus:ring-2 focus:ring-[#2B5D6B]/10 transition-all"
                />
              </div>
              <div>
                <label
                  htmlFor="end_date"
                  className="block text-xs font-medium uppercase tracking-widest text-[#1F2A24] mb-2"
                >
                  End Date
                </label>
                <input
                  id="end_date"
                  name="end_date"
                  type="date"
                  required
                  min={formData.start_date}
                  value={formData.end_date}
                  onChange={handleChange}
                  className="w-full bg-white border border-[#E4DDD0] rounded-lg px-4 py-3 font-mono text-sm text-[#1F2A24] focus:outline-none focus:border-[#2B5D6B] focus:ring-2 focus:ring-[#2B5D6B]/10 transition-all"
                />
              </div>
            </div>

            {/* ── Public toggle ── */}
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input
                  id="is_public"
                  name="is_public"
                  type="checkbox"
                  checked={formData.is_public}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-[#E4DDD0] rounded-full peer-checked:bg-[#C4622D] transition-colors" />
                <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
              </div>
              <span className="text-sm text-[#1F2A24]">
                Make this trip public
              </span>
            </label>

            {/* ── Actions ── */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 bg-white border border-[#E4DDD0] text-[#1F2A24] py-3 rounded-lg text-sm font-medium hover:bg-[#FBF7F0] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-[#C4622D] text-white py-3 rounded-lg text-sm font-medium hover:bg-[#a35225] transition-colors disabled:opacity-60"
              >
                {loading ? "Creating…" : "Save Trip →"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateTrip;
