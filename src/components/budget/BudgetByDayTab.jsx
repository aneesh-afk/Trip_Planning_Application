import React, { useState } from 'react';
import { getCategoryStyles } from '../../utils/categoryColors';

function CostEditor({ expense, onUpdate, isCompleted }) {
  const [isEditing, setIsEditing] = useState(false);
  const [val, setVal] = useState(expense.cost || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If this expense is synthetic (stay/transport from trip_stops), 
  // it might not have an easy update path without a different endpoint, 
  // but let's assume we pass a function that knows how to handle it based on expense.type.
  const isSynthetic = expense.type === 'stay' || expense.type === 'transport';

  const handleSave = async () => {
    setIsSubmitting(true);
    await onUpdate(expense, val);
    setIsSubmitting(false);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-[8px]">
        <span className="text-muted text-[13px]">₹</span>
        <input 
          type="number" 
          value={val}
          onChange={(e) => setVal(e.target.value)}
          className="w-[60px] bg-surface border border-border rounded-[4px] px-[4px] py-[2px] text-[13px] font-['IBM_Plex_Mono'] text-ink focus:outline-none focus:border-horizon"
          autoFocus
          onBlur={handleSave}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />
      </div>
    );
  }

  return (
    <button 
      onClick={() => setIsEditing(true)}
      disabled={isSubmitting || isSynthetic || isCompleted} // Disable editing for stay/transport or if trip is completed
      className={`group flex items-center gap-[4px] px-[8px] py-[4px] rounded-[4px] transition-colors ${
        (isSynthetic || isCompleted) ? 'cursor-default' : 'cursor-pointer hover:bg-bg'
      }`}
    >
      <span className="text-[14px] font-['IBM_Plex_Mono'] font-medium text-ink group-hover:text-horizon transition-colors">
        {expense.isEstimated ? `~₹${expense.cost}` : `₹${expense.cost}`}
      </span>
      {!(isSynthetic || isCompleted) && (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-[12px] h-[12px] text-muted opacity-0 group-hover:opacity-100"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      )}
    </button>
  );
}

export default function BudgetByDayTab({ expenses, onUpdateExpense, isCompleted }) {
  // Group by day
  const daysMap = {};
  expenses.forEach(exp => {
    const d = exp.day || 1;
    if (!daysMap[d]) daysMap[d] = { expenses: [], total: 0 };
    daysMap[d].expenses.push(exp);
    daysMap[d].total += exp.cost;
  });

  const days = Object.keys(daysMap).map(Number).sort((a,b) => a - b);

  return (
    <div className="flex flex-col gap-[32px] max-w-[800px] mx-auto">
      {days.length === 0 ? (
        <div className="text-center py-[40px] text-muted text-[14px]">
          No expenses recorded yet.
        </div>
      ) : (
        days.map(day => {
          const { expenses: dayExps, total } = daysMap[day];
          
          return (
            <div key={day} className="flex gap-[24px]">
              {/* Day Badge */}
              <div className="flex flex-col items-center">
                <div className="w-[48px] h-[48px] bg-surface border border-border rounded-full flex flex-col items-center justify-center shrink-0 z-10">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted font-['IBM_Plex_Mono']">Day</span>
                  <span className="font-['Fraunces'] font-semibold text-[16px] text-ink leading-none">{day}</span>
                </div>
                <div className="w-[2px] h-full bg-border mt-[8px]"></div>
              </div>

              {/* Day Content */}
              <div className="flex-1 bg-surface border border-border rounded-[12px] overflow-hidden shadow-sm mb-[16px]">
                <div className="p-[16px] flex flex-col">
                  {dayExps.map((exp, idx) => {
                    const catStyle = getCategoryStyles(exp.category);
                    
                    return (
                      <div key={exp.id || idx} className="flex items-center justify-between py-[12px] border-b border-border/50 last:border-0">
                        <div className="flex items-center gap-[12px]">
                          <span className={`px-[8px] py-[2px] rounded-full text-[11px] font-medium capitalize tracking-wide ${catStyle.bg} ${catStyle.text}`}>
                            {exp.category}
                          </span>
                          <span className="text-[15px] font-medium text-ink">{exp.title}</span>
                          {exp.city_name && (
                            <span className="text-[12px] text-muted hidden sm:inline">in {exp.city_name}</span>
                          )}
                        </div>
                        
                        <CostEditor expense={exp} onUpdate={onUpdateExpense} isCompleted={isCompleted} />
                      </div>
                    );
                  })}
                </div>
                
                {/* Day Subtotal */}
                <div className="bg-bg p-[16px] border-t border-border flex items-center justify-between">
                  <span className="text-[13px] font-bold uppercase tracking-wider text-muted font-['IBM_Plex_Mono']">
                    Total for Day {day}
                  </span>
                  <span className="font-['Fraunces'] font-semibold text-[20px] text-ink">
                    ₹{total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
