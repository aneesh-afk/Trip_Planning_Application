import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Calendar, Building, Plane, FileText, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function BookingsTab({
  bookings = [],
  onDeleteBooking,
  onOpenAddModal,
  tripDates,
  isRealtimeConnected = false,
}) {
  const [filterType, setFilterType] = useState('all');

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      if (filterType !== 'all' && b.type !== filterType) return false;
      return true;
    });
  }, [bookings, filterType]);

  const totalAccommodation = useMemo(() => {
    return bookings
      .filter((b) => b.type === 'accommodation')
      .reduce((sum, b) => sum + (Number(b.cost) || 0), 0);
  }, [bookings]);

  const totalTransportation = useMemo(() => {
    return bookings
      .filter((b) => b.type === 'transportation')
      .reduce((sum, b) => sum + (Number(b.cost) || 0), 0);
  }, [bookings]);

  const totalCost = totalAccommodation + totalTransportation;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Overview Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Bookings Card */}
        <div className="bg-surface border border-border rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted font-['IBM_Plex_Mono']">
              Total Bookings Cost
            </span>
            <div className="font-['Fraunces'] font-bold text-[24px] text-ink mt-0.5">
              ₹{totalCost.toLocaleString()}
            </div>
            <span className="text-[12px] text-muted font-['IBM_Plex_Mono']">
              {bookings.length} reservation{bookings.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-route/10 text-route flex items-center justify-center text-lg">
            📑
          </div>
        </div>

        {/* Accommodation Card */}
        <div className="bg-surface border border-border rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted font-['IBM_Plex_Mono']">
              Stays & Hotels
            </span>
            <div className="font-['Fraunces'] font-bold text-[24px] text-purple-600 mt-0.5">
              ₹{totalAccommodation.toLocaleString()}
            </div>
            <span className="text-[12px] text-muted font-['IBM_Plex_Mono']">
              {bookings.filter((b) => b.type === 'accommodation').length} stays
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
            <Building size={20} />
          </div>
        </div>

        {/* Transportation Card */}
        <div className="bg-surface border border-border rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted font-['IBM_Plex_Mono']">
              Flights & Trains
            </span>
            <div className="font-['Fraunces'] font-bold text-[24px] text-blue-600 mt-0.5">
              ₹{totalTransportation.toLocaleString()}
            </div>
            <span className="text-[12px] text-muted font-['IBM_Plex_Mono']">
              {bookings.filter((b) => b.type === 'transportation').length} transports
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
            <Plane size={20} />
          </div>
        </div>
      </div>

      {/* Action and Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-surface p-4 rounded-2xl border border-border">
        {/* Category Pills */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
              filterType === 'all'
                ? 'bg-ink text-surface'
                : 'bg-bg text-muted hover:text-ink border border-border'
            }`}
          >
            All Bookings ({bookings.length})
          </button>
          <button
            onClick={() => setFilterType('accommodation')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
              filterType === 'accommodation'
                ? 'bg-purple-600 text-white'
                : 'bg-bg text-muted hover:text-ink border border-border'
            }`}
          >
            <Building size={14} />
            Stays ({bookings.filter((b) => b.type === 'accommodation').length})
          </button>
          <button
            onClick={() => setFilterType('transportation')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
              filterType === 'transportation'
                ? 'bg-blue-600 text-white'
                : 'bg-bg text-muted hover:text-ink border border-border'
            }`}
          >
            <Plane size={14} />
            Transport ({bookings.filter((b) => b.type === 'transportation').length})
          </button>
        </div>

        {/* Realtime Status Badge & Add Button */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-['IBM_Plex_Mono'] text-muted bg-bg px-2.5 py-1 rounded-lg border border-border">
            <span className={`w-2 h-2 rounded-full ${isRealtimeConnected ? 'bg-success animate-pulse' : 'bg-route'}`}></span>
            <span>{isRealtimeConnected ? 'Live Realtime' : 'Supabase Synced'}</span>
          </div>

          <button
            onClick={onOpenAddModal}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-route text-white rounded-xl text-[13px] font-semibold hover:bg-route/90 transition-colors shadow-sm"
          >
            <Plus size={16} />
            Add Booking
          </button>
        </div>
      </div>

      {/* Bookings List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-surface border border-border rounded-2xl p-8">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-route/10 text-route flex items-center justify-center text-2xl mb-4">
            🏨
          </div>
          <h3 className="font-['Fraunces'] font-semibold text-[18px] text-ink mb-1">
            {bookings.length === 0 ? 'No bookings logged yet' : 'No matching bookings'}
          </h3>
          <p className="text-[13px] text-muted max-w-sm mx-auto mb-6">
            Record flight tickets, hotel reservations, or train tickets. All costs will be automatically tracked in your trip budget.
          </p>
          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-route text-white rounded-xl text-[13px] font-semibold hover:bg-route/90 transition-colors shadow-sm"
          >
            <Plus size={16} />
            Add Your First Booking
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((b) => {
            const isAccom = b.type === 'accommodation';
            const isDateOutOfTrip =
              (tripDates?.start && b.start_date < tripDates.start) ||
              (tripDates?.end && b.end_date > tripDates.end);

            return (
              <div
                key={b.id}
                className="bg-surface border border-border rounded-2xl p-5 flex flex-col justify-between gap-4 hover:border-route/50 transition-all shadow-sm"
              >
                <div>
                  {/* Top line: Type badge + reference */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                        isAccom
                          ? 'bg-purple-500/10 text-purple-600 border-purple-500/20'
                          : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                      }`}
                    >
                      {isAccom ? <Building size={12} /> : <Plane size={12} />}
                      {isAccom ? 'Accommodation' : 'Transportation'}
                    </span>

                    {b.booking_reference && (
                      <span className="text-[11px] font-['IBM_Plex_Mono'] font-medium bg-bg border border-border px-2 py-0.5 rounded-lg text-ink">
                        Ref: {b.booking_reference}
                      </span>
                    )}
                  </div>

                  {/* Provider Name */}
                  <h4 className="font-['Fraunces'] font-semibold text-[18px] text-ink mb-1">
                    {b.provider_name}
                  </h4>

                  {/* Dates */}
                  <div className="flex items-center gap-2 text-[12px] text-muted font-['IBM_Plex_Mono'] mt-1">
                    <Calendar size={13} className="text-route" />
                    <span>
                      {b.start_date} {b.start_date !== b.end_date ? `→ ${b.end_date}` : ''}
                    </span>
                  </div>

                  {/* FR-18 Warning if dates outside trip */}
                  {isDateOutOfTrip && (
                    <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 mt-2 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                      <AlertTriangle size={13} className="shrink-0" />
                      <span>Dates fall outside scheduled trip range ({tripDates?.start} to {tripDates?.end})</span>
                    </div>
                  )}

                  {/* Notes */}
                  {b.notes && (
                    <p className="text-[12.5px] text-muted mt-2.5 bg-bg/60 p-2.5 rounded-xl border border-border">
                      {b.notes}
                    </p>
                  )}
                </div>

                {/* Bottom line: Cost + Delete action */}
                <div className="flex items-center justify-between pt-3 border-t border-border mt-1">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-muted font-['IBM_Plex_Mono']">
                      Booking Cost
                    </span>
                    <div className="font-['Fraunces'] font-bold text-[20px] text-ink">
                      ₹{Number(b.cost).toLocaleString()}
                    </div>
                  </div>

                  {onDeleteBooking && (
                    <button
                      onClick={() => onDeleteBooking(b.id)}
                      title="Delete booking"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
