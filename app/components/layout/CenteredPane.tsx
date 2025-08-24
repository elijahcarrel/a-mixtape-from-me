import React from 'react';

export default function CenteredPane({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center mt-8 ${className}`}>
      {children}
    </div>
  );
}
