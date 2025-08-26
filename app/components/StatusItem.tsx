import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatusItemProps {
  icon: LucideIcon;
  text: string;
  iconClassName?: string;
  textClassName?: string;
}

export default function StatusItem({
  icon: Icon,
  text,
  iconClassName = '',
  textClassName = '',
}: StatusItemProps) {
  return (
    <div className="flex items-center space-x-1 group relative">
      <div
        title={text}
      >
        <Icon size={20} className={iconClassName} />
      </div>
      <span className={`${textClassName} hidden sm:inline`}>
        {text}
      </span>
    </div>
  );
}
