import React, { useState, useMemo } from 'react';
import { Trash2, Plus, Calendar, Tag, Search, AlertTriangle, ArrowUpDown } from 'lucide-react';

const CATEGORY_MAP = {
  food: { label: 'Food & Dining', icon: '🍽️', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  transport: { label: 'Transport', icon: '🚆', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  stay: { label: 'Stay / Hotel', icon: '🏨', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
  sightseeing: { label: 'Activities', icon: '📸', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  shopping: { label: 'Shopping', icon: '🛍️', color: 'bg-pink-500/10 text-pink-600 border-pink-500/20' },
  other: { label: 'Other', icon: '💳', color: 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20' },
};

export default function ActualExpensesTab({ 
  expenses = [], 
  onDeleteExpense, 
  onOpenLogModal, 
  tripBudget = 0 
}) {
  const [filterCategory, setFilterCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');

  // Filter & sort
  const filtered = useMemo(() => {
    return expenses
      .filter((exp) => {
        if (filterCategory !== 'all' && exp.category !== filterCategory) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchDesc = exp.description?.toLowerCase().includes(q);
          const matchCat = exp.category?.toLowerCase().includes(q);
          if (!matchDesc && !matchCat) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date-desc') return new Date(b.date) - new Date(a.date);
        if (sortBy === 'date-asc') return new Date(a.date) - new Date(b.date);
        if (sortBy === 'amount-desc') return b.amount - a.amount;
        if (sortBy === 'amount-asc') return a.amount - b.amount;
        return 0;
      });
  }, [expenses, filterCategory, search, sortBy]);

  const totalFiltered = filtered.reduce((sum, item) => sum + Number(item.amount), 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Top Filter and Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-surface p-4 rounded-2xl border border-border">
        {/* Search */}
        <div className="relative flex-1 max-w-[340px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search expenses by note..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-bg border border-border rounded-xl text-[13px] text-ink placeholder:text-muted focus:outline-none focus:border-route"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors shrink-0 ${
              filterCategory === 'all'
                ? 'bg-ink text-surface'
                : 'bg-bg text-muted hover:text-ink border border-border'
            }`}
          >
            All ({expenses.length})
          </button>
          {Object.entries(CATEGORY_MAP).map(([key, meta]) => {
            const count = expenses.filter((e) => e.category === key).length;
            if (count === 0 && filterCategory !== key) return null;
            return (
              <button
                key={key}
                onClick={() => setFilterCategory(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors shrink-0 ${
                  filterCategory === key
                    ? 'bg-route text-white'
                    : 'bg-bg text-muted hover:text-ink border border-border'
                }`}
              >
                <span>{meta.icon}</span>
                <span>{meta.label}</span>
                <span className="opacity-70 text-[11px]">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Log Expense Button */}
        <button
          onClick={onOpenLogModal}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-route text-white rounded-xl text-[13px] font-semibold hover:bg-route/90 transition-colors shrink-0 shadow-sm"
        >
          <Plus size={16} />
          Log Expense
        </button>
      </div>

      {/* Expenses Table / Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-surface border border-border rounded-2xl p-8">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-route/10 text-route flex items-center justify-center text-2xl mb-4">
            🧾
          </div>
          <h3 className="font-['Fraunces'] font-semibold text-[18px] text-ink mb-1">
            {expenses.length === 0 ? 'No expenses recorded yet' : 'No matching expenses'}
          </h3>
          <p className="text-[13px] text-muted max-w-sm mx-auto mb-6">
            {expenses.length === 0
              ? 'Keep track of real money spent on food, rides, stays, or souvenirs during your trip.'
              : 'Try clearing your search or category filter.'}
          </p>
          <button
            onClick={onOpenLogModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-route text-white rounded-xl text-[13px] font-semibold hover:bg-route/90 transition-colors shadow-sm"
          >
            <Plus size={16} />
            Record Your First Expense
          </button>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
          {/* Header */}
          <div className="px-6 py-4 border-b border-border bg-bg/50 flex items-center justify-between">
            <span className="text-[12px] font-semibold text-muted font-['IBM_Plex_Mono'] uppercase tracking-wider">
              {filtered.length} Expense Entry{filtered.length > 1 ? 's' : ''} • Total: ₹{totalFiltered.toLocaleString()}
            </span>

            {/* Sort Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-muted font-['IBM_Plex_Mono']">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-surface border border-border text-[12px] rounded-lg px-2 py-1 text-ink focus:outline-none"
              >
                <option value="date-desc">Newest Date</option>
                <option value="date-asc">Oldest Date</option>
                <option value="amount-desc">Highest Amount</option>
                <option value="amount-asc">Lowest Amount</option>
              </select>
            </div>
          </div>

          {/* List */}
          <div className="divide-y divide-border">
            {filtered.map((item) => {
              const catMeta = CATEGORY_MAP[item.category] || CATEGORY_MAP.other;
              return (
                <div
                  key={item.id}
                  className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-bg/40 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-bg border border-border shrink-0">
                      {catMeta.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-[14px] text-ink truncate">
                          {item.description || catMeta.label}
                        </span>
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-full font-medium border ${catMeta.color}`}
                        >
                          {catMeta.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[12px] text-muted font-['IBM_Plex_Mono']">
                        <Calendar size={12} />
                        <span>{item.date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <span className="font-['Fraunces'] font-bold text-[18px] text-ink">
                      ₹{Number(item.amount).toLocaleString()}
                    </span>
                    {onDeleteExpense && (
                      <button
                        onClick={() => onDeleteExpense(item.id)}
                        title="Delete expense"
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
