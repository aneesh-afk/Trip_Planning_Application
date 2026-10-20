import React from 'react';

export function Card({
  padding = 'lg',
  hoverable = false,
  children,
  className = '',
  ...props
}) {
  const padClass = padding === 'md' ? 'p-[16px]' : 'p-[24px]';
  const hoverClass = hoverable
    ? 'transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_4px_12px_rgba(31,42,36,0.12)] cursor-pointer'
    : '';

  return (
    <div
      className={`bg-surface rounded-[12px] shadow-[0_1px_3px_rgba(31,42,36,0.08),_0_1px_2px_rgba(31,42,36,0.04)] border border-border ${padClass} ${hoverClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
