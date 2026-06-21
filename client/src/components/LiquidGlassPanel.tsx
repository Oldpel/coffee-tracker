import React from 'react';

interface LiquidGlassPanelProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  roundedClass?: string; // e.g. "rounded-2xl", "rounded-[35px]"
  paddingClass?: string;
}

export default function LiquidGlassPanel({
  children,
  className = '',
  onClick,
  roundedClass = 'rounded-2xl',
  paddingClass = 'p-6'
}: LiquidGlassPanelProps) {
  return (
    <div className={`liquid-glass-container ${className}`} onClick={onClick}>
      <div className={`liquidGlass-wrapper ${roundedClass} w-full h-full`}>
        <div className={`liquidGlass-effect ${roundedClass}`}></div>
        <div className={`liquidGlass-tint ${roundedClass}`}></div>
        <div className={`liquidGlass-shine ${roundedClass}`}></div>
        <div className={`liquidGlass-text ${roundedClass} ${paddingClass} w-full h-full`}>
          {children}
        </div>
      </div>
    </div>
  );
}
