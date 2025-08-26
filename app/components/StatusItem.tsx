import React from 'react';
import { LucideIcon } from 'lucide-react';
import Tooltip from './Tooltip';

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
      <Tooltip content={text}>
        <div>
          <Icon size={20} className={`opacity-50 ${iconClassName}`} />
        </div>
      </Tooltip>
      <span className={`opacity-50 hidden sm:inline ${textClassName}`}>
        {text}
      </span>
    </div>
  );
}
