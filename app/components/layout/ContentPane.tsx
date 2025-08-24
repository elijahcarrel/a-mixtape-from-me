import React from 'react';

export default function ContentPane({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="content-pane rounded-xl p-4 sm:p-6 md:p-8 flex-1 shadow-md text-inherit">
      {children}
    </div>
  );
}
