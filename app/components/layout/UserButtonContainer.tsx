import React from 'react';

export default function UserButtonContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-shrink-0">
      {children}
    </div>
  );
} 