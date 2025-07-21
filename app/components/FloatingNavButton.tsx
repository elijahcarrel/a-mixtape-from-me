import React from 'react';

interface FloatingNavButtonProps {
  label: string;
  icon: React.ReactNode;
  position: 'left' | 'right';
  onClick: () => void;
  'data-testid'?: string;
}

export default function FloatingNavButton({ label, icon, position, onClick, 'data-testid': dataTestId }: FloatingNavButtonProps) {
  const sideClass = position === 'left' ? 'left-8' : 'right-8';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`fixed bottom-8 ${sideClass} z-30 border-2 border-amber-700 text-amber-700 bg-white/80 dark:bg-amber-950/80 hover:bg-amber-100 dark:hover:bg-amber-900/80 rounded-lg px-8 py-4 flex items-center gap-2 text-lg font-semibold shadow-lg transition-all duration-200 active:scale-95`}
      style={{boxShadow: '0 4px 24px #bfa76a33'}}
      data-testid={dataTestId}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
} 