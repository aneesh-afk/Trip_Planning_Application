import React, { useState } from 'react';
import { X, Receipt, Tag, Calendar, FileText } from 'lucide-react';

const CATEGORIES = [
  { id: 'food', label: 'Food & Dining', icon: '🍽️', color: 'text-amber-600 bg-amber-500/10 border-amber-500/20' },
  { id: 'transport', label: 'Transport', icon: '🚆', color: 'text-blue-600 bg-blue-500/10 border-blue-500/20' },
  { id: 'stay', label: 'Stay / Lodging', icon: '🏨', color: 'text-purple-600 bg-purple-500/10 border-purple-500/20' },
  { id: 'sightseeing', label: 'Activities', icon: '📸', color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️', color: 'text-pink-600 bg-pink-500/10 border-pink-500/20' },
  { id: 'other', label: 'Other / Misc', icon: '💳', color: 'text-zinc-600 bg-zinc-500/10 border-zinc-500/20' },
];

export default function LogExpenseModal({ isOpen, onClose, onSave, tripDates }) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [date, setDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid expense amount greater than 0.');
      return;
    }

    if (!date) {
      setError('Please choose the expense date.');
      return;
    }

    setSubmitting(true);
    try {
      await onSave({
        amount: parsedAmount,
        category,
        date,
        description: description.trim() || undefined,
      });
      setAmount('');
      setDescription('');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to record expense. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-[480px] bg-surface border border-border rounded-[20px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-surface/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-route/10 text-route flex items-center justify-center">
              <Receipt size={20} />
            </div>
            <div>
              <h2 className="font-['Fraunces'] font-semibold text-[19px] text-ink leading-tight">
                Log Actual Expense
              </h2>
              <p className="text-[12px] text-muted">
                Track real spending against your trip budget
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-border/40 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          {error && (
            <div className="p-3 text-[13px] text-danger bg-danger/10 border border-danger/20 rounded-xl">
              {error}
            </div>
          )}

          {/* Amount Input */}
          <div>
            <label className="block text-[12px] font-semibold text-muted font-['IBM_Plex_Mono'] uppercase tracking-wider mb-2">
              Amount Spent (₹) *
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-[22px] font-bold text-muted select-none">
                ₹
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
                className="w-full pl-10 pr-4 py-3 bg-bg border border-border rounded-xl text-[24px] font-bold text-ink font-['Fraunces'] focus:outline-none focus:border-route transition-colors"
              />
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-[12px] font-semibold text-muted font-['IBM_Plex_Mono'] uppercase tracking-wider mb-2">
              Category *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[13px] font-medium transition-all text-left ${
                    category === cat.id
                      ? `${cat.color} font-semibold ring-2 ring-route/20`
                      : 'border-border bg-bg/50 text-muted hover:text-ink hover:border-border/80'
                  }`}
                >
                  <span className="text-base">{cat.icon}</span>
                  <span className="truncate">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date Input */}
          <div>
            <label className="block text-[12px] font-semibold text-muted font-['IBM_Plex_Mono'] uppercase tracking-wider mb-2">
              Date *
            </label>
            <div className="relative">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-[14px] text-ink font-['IBM_Plex_Mono'] focus:outline-none focus:border-route"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[12px] font-semibold text-muted font-['IBM_Plex_Mono'] uppercase tracking-wider mb-2">
              Description / Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Traditional Rajasthani dinner, Uber to airport"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-[14px] text-ink placeholder:text-muted/60 focus:outline-none focus:border-route"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-border text-[14px] font-medium text-muted hover:text-ink hover:bg-border/30 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-route text-white text-[14px] font-semibold shadow-sm hover:bg-route/90 transition-all disabled:opacity-50"
            >
              {submitting ? 'Recording...' : 'Record Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
