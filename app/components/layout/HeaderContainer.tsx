import React from 'react';

export default function HeaderContainer({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-4 sm:mb-6 md:mb-8"
    >
      {children}
    </div>
  );
} 