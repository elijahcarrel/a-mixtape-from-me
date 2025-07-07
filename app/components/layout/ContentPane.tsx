import React from 'react';

export default function ContentPane({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl p-8 flex-1 shadow-md"
      style={{ backgroundColor: 'var(--sepia-light)' }}
    >
      {children}
    </div>
  );
} 