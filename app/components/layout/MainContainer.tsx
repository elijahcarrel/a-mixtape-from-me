import React from 'react';

export default function MainContainer({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="max-w-[800px] mx-auto p-8 pt-8 pb-8 min-h-screen flex flex-col"
      style={{ minHeight: '100vh' }}
    >
      {children}
    </div>
  );
} 