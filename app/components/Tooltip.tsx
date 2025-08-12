import React, { ReactNode } from 'react';
import { useTheme } from './ThemeProvider';

interface TooltipProps {
  content: string;
  children: ReactNode;
}

export default function Tooltip({ content, children }: TooltipProps) {
  const { theme } = useTheme();
  return (
    <div className="relative inline-block group">
      {children}
      <div
        className={`pointer-events-none absolute left-1/2 top-full z-20 -translate-x-1/2 translate-y-1 mt-1 whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium opacity-0 transition-opacity duration-100 group-hover:opacity-100 shadow-md ${
          theme === 'dark' ? 'bg-neutral-800 text-neutral-100' : 'bg-neutral-900 text-white'
        }`}
        role="tooltip"
      >
        {content}
      </div>
    </div>
  );
}
