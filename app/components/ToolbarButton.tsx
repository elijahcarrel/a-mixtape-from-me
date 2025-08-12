import React, { ReactNode } from 'react';
import Link from 'next/link';
import Tooltip from './Tooltip';

export const toolbarBtnBase =
  'p-2 rounded-md transition-colors duration-150 hover:bg-amber-100 dark:hover:bg-amber-900/30 focus:outline-none';

interface ToolbarButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  tooltip: string;
  label?: string;
}

export function ToolbarButton({ icon, tooltip, label, className = '', ...rest }: ToolbarButtonProps) {
  return (
    <Tooltip content={tooltip}>
      <button
        type="button"
        className={`${toolbarBtnBase} ${className}`}
        {...rest}
      >
        {icon}
        {label && <span className="text-sm ml-1">{label}</span>}
      </button>
    </Tooltip>
  );
}

interface ToolbarButtonLinkProps {
  href: string;
  tooltip: string;
  icon: ReactNode;
  label?: string;
  prefetch?: boolean;
  className?: string;
  'data-testid'?: string;
}

export function ToolbarButtonLink({ href, tooltip, icon, label, prefetch = true, className = '', ...rest }: ToolbarButtonLinkProps) {
  return (
    <Tooltip content={tooltip}>
      <Link
        href={href}
        prefetch={prefetch}
        className={`${toolbarBtnBase} flex items-center space-x-1 ${className}`}
        {...rest}
      >
        {icon}
        {label && <span className="text-sm">{label}</span>}
      </Link>
    </Tooltip>
  );
}
