import React from 'react';

export function Badge({ tone = 'neutral', children, className = '' }) {
  const tones = {
    neutral: 'bg-muted/10 text-muted border border-muted/20',
    route: 'bg-route/10 text-route border border-route/20',
    horizon: 'bg-horizon/10 text-horizon border border-horizon/20',
    success: 'bg-success/10 text-success border border-success/20',
    danger: 'bg-danger/10 text-danger border border-danger/20',
  };

  return (
    <span
      className={`inline-flex items-center px-[12px] py-[4px] rounded-full text-[12px] font-medium tracking-[0.05em] uppercase ${
        tones[tone] || tones.neutral
      } ${className}`}
    >
      {children}
    </span>
  );
}
