import React, { useState } from 'react';
import { X, Users, DollarSign, Split, Calendar, Check } from 'lucide-react';

const CATEGORIES = [
  { id: 'food', label: 'Food & Meals', icon: '🍽️' },
  { id: 'stay', label: 'Stay / Villa', icon: '🏨' },
  { id: 'transport', label: 'Cabs / Rental', icon: '🚗' },
  { id: 'activities', label: 'Tickets / Tours', icon: '🎟️' },
  { id: 'other', label: 'Miscellaneous', icon: '📦' },
];

export default function AddSharedExpenseModal({
  isOpen,
  onClose,
  onSave,
  members = [],
  currentUserId,
}) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [payerId, setPayerId] = useState(() => {
    return currentUserId || members[0]?.user_id || '';
  });
  const [splitMethod, setSplitMethod] = useState('equal'); // 'equal' | 'custom'
  const [customSplits, setCustomSplits] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const numAmount = parseFloat(amount) || 0;
  const equalPerPerson = members.length > 0 ? (numAmount / members.length).toFixed(2) : '0.00';

  // Custom split sum
  const customSum = Object.values(customSplits).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
  const customDifference = (numAmount - customSum).toFixed(2);

  const handleCustomChange = (uId, val) => {
    setCustomSplits((prev) => ({
      ...prev,
      [uId]: val,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Please enter a description for this expense.');
      return;
    }
    if (!amount || numAmount <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }
    if (!payerId) {
      setError('Please select who paid for this expense.');
      return;
    }

    if (splitMethod === 'custom') {
      if (Math.abs(numAmount - customSum) > 0.05) {
        setError(`Custom splits total (₹${customSum}) must equal the expense total (₹${numAmount}). Difference: ₹${customDifference}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      await onSave({
        title: title.trim(),
        amount: numAmount,
        payer_id: payerId,
        category,
        date,
        split_method: splitMethod,
        customSplits: splitMethod === 'custom' ? customSplits : undefined,
      });
      setTitle('');
      setAmount('');
      setCustomSplits({});
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add shared expense.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-[540px] bg-surface border border-border rounded-[24px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-surface/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-route/10 text-route flex items-center justify-center">
              <Split size={20} />
            </div>
            <div>
              <h2 className="font-['Fraunces'] font-semibold text-[19px] text-ink leading-tight">
                Add Shared Expense
              </h2>
              <p className="text-[12px] text-muted">
                Split costs with your group members
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5 overflow-y-auto">
          {error && (
            <div className="p-3 text-[13px] text-danger bg-danger/10 border border-danger/20 rounded-xl">
              {error}
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-[12px] font-semibold text-muted font-['IBM_Plex_Mono'] uppercase tracking-wider mb-2">
              Expense Description *
            </label>
            <input
              type="text"
              placeholder="e.g. Seafood Dinner at Anjuna, Rental Car, Villa stay"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-[15px] font-medium text-ink focus:outline-none focus:border-route transition-colors"
            />
          </div>

          {/* Amount & Date in 2 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-semibold text-muted font-['IBM_Plex_Mono'] uppercase tracking-wider mb-2">
                Total Amount (₹) *
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-lg font-bold text-muted">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-bg border border-border rounded-xl text-[18px] font-bold text-ink font-['Fraunces'] focus:outline-none focus:border-route"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-muted font-['IBM_Plex_Mono'] uppercase tracking-wider mb-2">
                Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-bg border border-border rounded-xl text-[14px] text-ink font-['IBM_Plex_Mono'] focus:outline-none focus:border-route"
              />
            </div>
          </div>

          {/* Paid By Selection */}
          <div>
            <label className="block text-[12px] font-semibold text-muted font-['IBM_Plex_Mono'] uppercase tracking-wider mb-2">
              Paid By *
            </label>
            <select
              value={payerId}
              onChange={(e) => setPayerId(e.target.value)}
              className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-[14px] font-medium text-ink focus:outline-none focus:border-route"
            >
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.user?.display_name || m.user?.email || 'Member'} {m.user_id === currentUserId ? '(You)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Split Method Toggle */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[12px] font-semibold text-muted font-['IBM_Plex_Mono'] uppercase tracking-wider">
                Split Method (FR-23)
              </label>
              <span className="text-[12px] text-muted">
                {members.length} participant{members.length > 1 ? 's' : ''}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 p-1 bg-bg border border-border rounded-xl">
              <button
                type="button"
                onClick={() => setSplitMethod('equal')}
                className={`py-2 text-[13px] font-semibold rounded-lg transition-all ${
                  splitMethod === 'equal'
                    ? 'bg-surface text-route shadow-sm border border-border'
                    : 'text-muted hover:text-ink'
                }`}
              >
                Split Equally (₹{equalPerPerson} / person)
              </button>
              <button
                type="button"
                onClick={() => {
                  setSplitMethod('custom');
                  // Pre-fill with equal values if empty
                  if (Object.keys(customSplits).length === 0 && numAmount > 0) {
                    const initial = {};
                    members.forEach((m) => {
                      initial[m.user_id] = equalPerPerson;
                    });
                    setCustomSplits(initial);
                  }
                }}
                className={`py-2 text-[13px] font-semibold rounded-lg transition-all ${
                  splitMethod === 'custom'
                    ? 'bg-surface text-route shadow-sm border border-border'
                    : 'text-muted hover:text-ink'
                }`}
              >
                Custom Split
              </button>
            </div>
          </div>

          {/* Custom Split Inputs */}
          {splitMethod === 'custom' && (
            <div className="bg-bg/50 border border-border p-4 rounded-xl flex flex-col gap-3">
              <div className="flex items-center justify-between text-[12px] font-['IBM_Plex_Mono']">
                <span>Enter each person’s share:</span>
                <span className={Math.abs(customDifference) > 0.01 ? 'text-danger font-semibold' : 'text-success font-semibold'}>
                  {Math.abs(customDifference) <= 0.01 ? '✓ Balanced' : `Remaining: ₹${customDifference}`}
                </span>
              </div>

              <div className="divide-y divide-border/60">
                {members.map((m) => (
                  <div key={m.user_id} className="py-2 flex items-center justify-between gap-3">
                    <span className="text-[13px] font-medium text-ink truncate">
                      {m.user?.display_name || m.user?.email || 'Member'}
                    </span>
                    <div className="relative flex items-center w-32 shrink-0">
                      <span className="absolute left-2.5 text-xs text-muted">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={customSplits[m.user_id] ?? ''}
                        onChange={(e) => handleCustomChange(m.user_id, e.target.value)}
                        className="w-full pl-6 pr-2 py-1 bg-surface border border-border rounded-lg text-[13px] font-semibold text-right focus:outline-none focus:border-route"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Category Pills */}
          <div>
            <label className="block text-[12px] font-semibold text-muted font-['IBM_Plex_Mono'] uppercase tracking-wider mb-2">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl border text-[12px] font-medium transition-all ${
                    category === cat.id
                      ? 'border-route bg-route/10 text-route font-semibold'
                      : 'border-border bg-bg text-muted hover:text-ink'
                  }`}
                >
                  <span className="mr-1.5">{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-border text-[14px] font-medium text-muted hover:text-ink transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-route text-white text-[14px] font-semibold shadow-sm hover:bg-route/90 transition-all disabled:opacity-50"
            >
              {submitting ? 'Splitting...' : 'Add & Split Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
