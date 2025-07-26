import React from 'react';

export default function HeaderContainer({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex flex-row justify-between items-center gap-4 mb-4 sm:mb-6 md:mb-8"
    >
      {children}
    </div>
  );
} 