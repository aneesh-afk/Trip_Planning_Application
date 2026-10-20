import React from 'react';
import { getCategoryStyles } from '../../utils/categoryColors';

export default function BudgetByCategoryTab({ expenses, totalCost }) {
  // Group by category
  const categoryMap = {};
  expenses.forEach(exp => {
    const cat = exp.category || 'other';
    if (!categoryMap[cat]) categoryMap[cat] = { expenses: [], total: 0 };
    categoryMap[cat].expenses.push(exp);
    categoryMap[cat].total += exp.cost;
  });

  const categories = Object.keys(categoryMap).sort((a,b) => categoryMap[b].total - categoryMap[a].total);

  return (
    <div className="flex flex-col gap-[32px] max-w-[800px] mx-auto">
      {categories.length === 0 ? (
        <div className="text-center py-[40px] text-muted text-[14px]">
          No expenses recorded yet.
        </div>
      ) : (
        categories.map(cat => {
          const { expenses: catExps, total } = categoryMap[cat];
          const pct = totalCost > 0 ? Math.round((total / totalCost) * 100) : 0;
          const catStyle = getCategoryStyles(cat);

          // Sort expenses within category by highest cost first
          const sortedExps = [...catExps].sort((a,b) => b.cost - a.cost);

          return (
            <div key={cat} className="bg-surface border border-border rounded-[12px] shadow-sm overflow-hidden">
              
              {/* Category Header */}
              <div className={`p-[16px] border-b border-border flex items-center justify-between ${catStyle.bg}`}>
                <div className="flex items-center gap-[12px]">
                  <span className={`px-[12px] py-[4px] rounded-full text-[13px] font-bold uppercase tracking-wide bg-surface ${catStyle.text}`}>
                    {cat}
                  </span>
                  <span className={`text-[14px] font-medium ${catStyle.text} opacity-80`}>
                    {pct}% of trip budget
                  </span>
                </div>
                <span className={`font-['Fraunces'] font-semibold text-[24px] ${catStyle.text}`}>
                  ₹{total.toLocaleString()}
                </span>
              </div>

              {/* Items List */}
              <div className="p-[16px] flex flex-col">
                {sortedExps.map((exp, idx) => (
                  <div key={exp.id || idx} className="flex items-center justify-between py-[12px] border-b border-border/50 last:border-0 hover:bg-bg/50 transition-colors -mx-[16px] px-[16px]">
                    <div className="flex flex-col">
                      <span className="text-[15px] font-medium text-ink">{exp.title}</span>
                      <span className="text-[12px] text-muted flex items-center gap-[6px]">
                        Day {exp.day || '?'} 
                        {exp.city_name && <span>· {exp.city_name}</span>}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[15px] font-['IBM_Plex_Mono'] font-medium text-ink">
                        {exp.isEstimated ? `~₹${exp.cost}` : `₹${exp.cost}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
