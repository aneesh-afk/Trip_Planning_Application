import React, { useState, useMemo } from 'react';
import { X, Calendar, AlertTriangle, Building, Plane, FileText, DollarSign } from 'lucide-react';

export default function AddBookingModal({
  isOpen,
  onClose,
  onSave,
  tripDates,
}) {
  const [type, setType] = useState('accommodation');
  const [providerName, setProviderName] = useState('');
  const [reference, setReference] = useState('');
  const [startDate, setStartDate] = useState(tripDates?.start || '');
  const [endDate, setEndDate] = useState(tripDates?.end || '');
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState(null);

  // FR-18: Real-time date validation warning
  const dateWarnings = useMemo(() => {
    const list = [];
    if (!startDate || !endDate) return list;

    if (endDate < startDate) {
      list.push('Check-out / Arrival date cannot be earlier than start date.');
    }
    if (tripDates?.start && startDate < tripDates.start) {
      list.push(`Warning: Starts on ${startDate}, before trip start date (${tripDates.start}).`);
    }
    if (tripDates?.end && endDate > tripDates.end) {
      list.push(`Warning: Ends on ${endDate}, after trip end date (${tripDates.end}).`);
    }
    return list;
  }, [startDate, endDate, tripDates]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!providerName.trim()) {
      setError('Please provide a booking provider name (e.g. Hyatt, Emirates, Airbnb).');
      return;
    }
    if (!startDate || !endDate) {
      setError('Please specify both start and end dates.');
      return;
    }
    if (endDate < startDate) {
      setError('End date cannot precede start date.');
      return;
    }

    onSave({
      type,
      provider_name: providerName.trim(),
      booking_reference: reference.trim() || null,
      start_date: startDate,
      end_date: endDate,
      cost: Number(cost) || 0,
      notes: notes.trim() || null,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-[500px] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-bg/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-route/10 text-route flex items-center justify-center">
              {type === 'accommodation' ? <Building size={18} /> : <Plane size={18} />}
            </div>
            <div>
              <h3 className="font-['Fraunces'] font-semibold text-[17px] text-ink">
                Record New Booking
              </h3>
              <p className="text-[12px] text-muted">Module 4.5 • Bookings Management</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-ink hover:bg-bg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {error && (
            <div className="p-3 bg-danger/10 border border-danger/30 rounded-xl text-danger text-[13px]">
              {error}
            </div>
          )}

          {/* Type Toggle */}
          <div>
            <label className="block text-[12px] font-semibold uppercase tracking-wider text-muted font-['IBM_Plex_Mono'] mb-2">
              Booking Category
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('accommodation')}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-[13px] font-medium border transition-all ${
                  type === 'accommodation'
                    ? 'border-purple-500 bg-purple-500/10 text-purple-600 font-semibold shadow-sm'
                    : 'border-border bg-bg text-muted hover:text-ink'
                }`}
              >
                <Building size={16} />
                Accommodation
              </button>
              <button
                type="button"
                onClick={() => setType('transportation')}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-[13px] font-medium border transition-all ${
                  type === 'transportation'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-600 font-semibold shadow-sm'
                    : 'border-border bg-bg text-muted hover:text-ink'
                }`}
              >
                <Plane size={16} />
                Transportation
              </button>
            </div>
          </div>

          {/* Provider Name */}
          <div>
            <label className="block text-[12px] font-semibold uppercase tracking-wider text-muted font-['IBM_Plex_Mono'] mb-1.5">
              Provider / Service Name *
            </label>
            <input
              type="text"
              required
              placeholder={type === 'accommodation' ? 'e.g. Taj Lake Palace, Zostel, Marriott, Airbnb' : 'e.g. Vande Bharat Express, IndiGo, Air India, Uber'}
              value={providerName}
              onChange={(e) => setProviderName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-bg border border-border rounded-xl text-[14px] text-ink placeholder:text-muted focus:outline-none focus:border-route"
            />
          </div>

          {/* Booking Reference */}
          <div>
            <label className="block text-[12px] font-semibold uppercase tracking-wider text-muted font-['IBM_Plex_Mono'] mb-1.5">
              Booking Reference / PNR (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. CONF-987214, PNR-AI892"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-bg border border-border rounded-xl text-[14px] text-ink font-['IBM_Plex_Mono'] placeholder:text-muted focus:outline-none focus:border-route"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold uppercase tracking-wider text-muted font-['IBM_Plex_Mono'] mb-1.5">
                {type === 'accommodation' ? 'Check-in Date *' : 'Departure Date *'}
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-bg border border-border rounded-xl text-[13px] text-ink font-['IBM_Plex_Mono'] focus:outline-none focus:border-route"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold uppercase tracking-wider text-muted font-['IBM_Plex_Mono'] mb-1.5">
                {type === 'accommodation' ? 'Check-out Date *' : 'Arrival Date *'}
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-bg border border-border rounded-xl text-[13px] text-ink font-['IBM_Plex_Mono'] focus:outline-none focus:border-route"
              />
            </div>
          </div>

          {/* FR-18: Date Validation Alert */}
          {dateWarnings.length > 0 && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2.5 text-amber-700 dark:text-amber-400 text-[12px]">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Trip Date Advisory (FR-18):</p>
                {dateWarnings.map((w, i) => (
                  <p key={i} className="mt-0.5">• {w}</p>
                ))}
              </div>
            </div>
          )}

          {/* Cost */}
          <div>
            <label className="block text-[12px] font-semibold uppercase tracking-wider text-muted font-['IBM_Plex_Mono'] mb-1.5">
              Cost (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted font-bold font-['IBM_Plex_Mono']">₹</span>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                placeholder="0.00"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full pl-8 pr-3.5 py-2.5 bg-bg border border-border rounded-xl text-[14px] text-ink font-['IBM_Plex_Mono'] placeholder:text-muted focus:outline-none focus:border-route font-semibold"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[12px] font-semibold uppercase tracking-wider text-muted font-['IBM_Plex_Mono'] mb-1.5">
              Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Free cancellation before Oct 10, Terminal 2 gate 4"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 bg-bg border border-border rounded-xl text-[13px] text-ink placeholder:text-muted focus:outline-none focus:border-route"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[13px] font-medium text-muted hover:text-ink transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-route text-white rounded-xl text-[13px] font-semibold hover:bg-route/90 transition-colors shadow-sm"
            >
              Save Booking
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
