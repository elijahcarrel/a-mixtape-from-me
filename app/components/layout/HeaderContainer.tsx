import React from 'react';

export default function HeaderContainer({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex justify-between items-center mb-8 flex-wrap gap-4 sm:flex-col sm:items-center sm:text-center"
    >
      {children}
    </div>
  );
} 