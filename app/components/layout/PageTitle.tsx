import React from 'react';

export default function PageTitle({ children }: { children: React.ReactNode }) {
  return (
    <h1
      className="text-2xl font-bold m-0 no-underline hover:no-underline"
      style={{ color: 'var(--text-color)' }}
    >
      {children}
    </h1>
  );
} 