import React, { useState } from 'react';

export default function SetBudgetTargetModal({ isOpen, onClose, currentBudget, onSave }) {
  const [val, setVal] = useState(currentBudget || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const num = parseInt(val, 10);
    if (isNaN(num) || num <= 0) return;
    
    setIsSubmitting(true);
    await onSave(num);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-[24px]">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-surface rounded-[12px] shadow-lg w-full max-w-[400px] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <div className="p-[24px] border-b border-border">
          <h2 className="font-['Fraunces'] font-semibold text-[20px] text-ink">Set Trip Budget</h2>
          <p className="text-[14px] text-muted mt-[4px]">
            Set a target budget to track your expenses against.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-[24px] flex flex-col gap-[20px]">
          <div>
            <label className="block text-[12px] font-medium uppercase tracking-wider text-muted font-['IBM_Plex_Mono'] mb-[8px]">
              Total Budget Target (₹)
            </label>
            <div className="relative">
              <span className="absolute left-[12px] top-1/2 -translate-y-1/2 text-muted font-['IBM_Plex_Mono'] font-medium">
                ₹
              </span>
              <input 
                type="number" 
                value={val}
                onChange={(e) => setVal(e.target.value)}
                placeholder="1500"
                className="w-full bg-bg border border-border rounded-[8px] pl-[28px] pr-[12px] py-[10px] text-[15px] font-['IBM_Plex_Mono'] text-ink focus:outline-none focus:border-horizon"
                autoFocus
                required
                min="1"
              />
            </div>
          </div>

          <div className="flex gap-[12px] pt-[8px]">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-[10px] bg-transparent border border-border text-ink rounded-[8px] text-[14px] font-medium hover:bg-bg transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSubmitting || !val}
              className="flex-1 py-[10px] bg-route text-white rounded-[8px] text-[14px] font-medium hover:bg-route/90 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Budget'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
