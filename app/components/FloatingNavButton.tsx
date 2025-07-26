import React from 'react';

interface FloatingNavButtonProps {
  label: string;
  icon: React.ReactNode;
  position: 'left' | 'right';
  onClick: () => void;
  'data-testid'?: string;
}

export default function FloatingNavButton({ label, icon, position, onClick, 'data-testid': dataTestId }: FloatingNavButtonProps) {
  const sideClass = position === 'left' ? 'left-4 sm:left-8' : 'right-4 sm:right-8';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`fixed bottom-4 sm:bottom-8 ${sideClass} z-30 border-2 border-amber-700 text-amber-700 bg-white/80 dark:bg-amber-950/80 hover:bg-amber-100 dark:hover:bg-amber-900/80 rounded-lg px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 flex items-center gap-1 sm:gap-2 text-sm sm:text-base md:text-lg font-semibold shadow-lg transition-all duration-200 active:scale-95`}
      style={{boxShadow: '0 4px 24px #bfa76a33'}}
      data-testid={dataTestId}
    >
      <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 flex items-center justify-center">
        {icon}
      </div>
      <span>{label}</span>
    </button>
  );
} 