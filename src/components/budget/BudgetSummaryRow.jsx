import React from 'react';
import { AlertTriangle, Plus, Receipt } from 'lucide-react';

export default function BudgetSummaryRow({ 
  totalCost = 0, 
  actualExpensesTotal = 0,
  tripLength = 1, 
  budgetTarget, 
  onSetBudget,
  onLogExpense 
}) {
  const effectiveSpend = actualExpensesTotal > 0 ? actualExpensesTotal : totalCost;
  const avgCostPerDay = tripLength > 0 ? Math.round(effectiveSpend / tripLength) : effectiveSpend;
  const isOverBudget = budgetTarget && actualExpensesTotal > budgetTarget;
  const overAmount = isOverBudget ? actualExpensesTotal - budgetTarget : 0;
  const remaining = budgetTarget ? budgetTarget - actualExpensesTotal : null;
  const pctUsed = budgetTarget ? Math.min(100, Math.round((actualExpensesTotal / budgetTarget) * 100)) : 0;

  return (
    <div className="bg-bg border-b border-border py-[24px]">
      <div className="max-w-[1000px] mx-auto w-full px-[24px] flex flex-col gap-[20px]">
        
        {/* Main Stats Row */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-[24px]">
          
          {/* Spend Numbers */}
          <div className="flex items-center gap-[32px] flex-wrap">
            {/* Actual Recorded Spend */}
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted font-['IBM_Plex_Mono'] mb-[4px] flex items-center gap-1.5">
                <Receipt size={13} className="text-route" /> Actual Spent
              </span>
              <div className="flex items-baseline gap-[10px]">
                <span className={`font-['Fraunces'] font-bold text-[36px] leading-none ${isOverBudget ? 'text-danger' : 'text-ink'}`}>
                  ₹{actualExpensesTotal.toLocaleString()}
                </span>
                <span className="text-[13px] text-muted font-medium font-['IBM_Plex_Mono']">
                  ~₹{avgCostPerDay.toLocaleString()}/day
                </span>
              </div>
            </div>

            {/* Itinerary Planned Cost */}
            <div className="flex flex-col pl-[24px] border-l border-border">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted font-['IBM_Plex_Mono'] mb-[4px]">
                Estimated Plan
              </span>
              <span className="font-['Fraunces'] font-semibold text-[22px] text-muted leading-none">
                ₹{totalCost.toLocaleString()}
              </span>
            </div>

            {/* Remaining Balance if budget set */}
            {budgetTarget > 0 && (
              <div className="flex flex-col pl-[24px] border-l border-border">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted font-['IBM_Plex_Mono'] mb-[4px]">
                  Remaining
                </span>
                <span className={`font-['Fraunces'] font-semibold text-[22px] leading-none ${remaining < 0 ? 'text-danger' : 'text-success'}`}>
                  {remaining < 0 ? `-₹${Math.abs(remaining).toLocaleString()}` : `₹${remaining.toLocaleString()}`}
                </span>
              </div>
            )}
          </div>

          {/* Budget Progress & Actions */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex-1 md:w-[320px]">
              {budgetTarget ? (
                <div className="flex flex-col gap-[6px]">
                  <div className="flex items-center justify-between text-[12px] font-medium font-['IBM_Plex_Mono']">
                    <span className={isOverBudget ? 'text-danger font-semibold' : 'text-ink'}>
                      Target: ₹{budgetTarget.toLocaleString()}
                    </span>
                    <span className={isOverBudget ? 'text-danger font-semibold' : 'text-muted'}>
                      {pctUsed}% used
                    </span>
                  </div>
                  <div className="h-[8px] w-full bg-surface border border-border rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${isOverBudget ? 'bg-danger' : 'bg-route'} transition-all duration-500`} 
                      style={{ width: `${Math.min(100, pctUsed)}%` }}
                    ></div>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={onSetBudget}
                  className="w-full text-center text-[13px] font-medium text-horizon bg-horizon/10 px-[16px] py-[8px] rounded-xl hover:bg-horizon hover:text-white transition-colors"
                >
                  + Set Budget Target
                </button>
              )}
            </div>

            {/* Quick Log Expense button */}
            {onLogExpense && (
              <button
                onClick={onLogExpense}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-route text-white rounded-xl text-[13px] font-semibold hover:bg-route/90 transition-all shadow-sm shrink-0"
              >
                <Plus size={16} />
                Log Expense
              </button>
            )}
          </div>

        </div>

        {/* FR-16: Over-Budget Alert Banner */}
        {isOverBudget && (
          <div className="bg-danger/10 border border-danger/30 rounded-xl p-3.5 flex items-center justify-between gap-3 text-danger animate-in fade-in duration-300">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-danger/20 flex items-center justify-center shrink-0">
                <AlertTriangle size={18} />
              </div>
              <div>
                <h4 className="font-semibold text-[14px] leading-tight">
                  Budget Exceeded Alert!
                </h4>
                <p className="text-[12px] opacity-90 mt-0.5">
                  Your recorded actual expenses (₹{actualExpensesTotal.toLocaleString()}) have exceeded your target budget (₹{budgetTarget.toLocaleString()}) by <span className="font-bold underline">₹{overAmount.toLocaleString()}</span>.
                </p>
              </div>
            </div>
            <button
              onClick={onSetBudget}
              className="text-[12px] font-semibold px-3 py-1.5 bg-danger text-white rounded-lg hover:bg-danger/90 transition-colors shrink-0"
            >
              Adjust Budget
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
