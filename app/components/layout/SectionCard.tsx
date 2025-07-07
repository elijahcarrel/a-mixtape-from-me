import React from 'react';

export default function SectionCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white/50 p-6 rounded-lg shadow-sm ${className}`}>
      {children}
    </div>
  );
} 