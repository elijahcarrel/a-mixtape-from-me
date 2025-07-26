import React from 'react';

export default function MainContainer({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="main-container max-w-[800px] mx-auto px-4 sm:px-6 md:px-8 pt-4 sm:pt-6 md:pt-8 pb-4 sm:pb-6 md:pb-8 min-h-screen flex flex-col text-inherit"
      style={{ minHeight: '100vh' }}
    >
      {children}
    </div>
  );
} 