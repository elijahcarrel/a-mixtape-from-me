import React, { ReactNode } from 'react';
import Link from 'next/link';
import Tooltip from './Tooltip';

export const toolbarBtnBase =
  'p-2 rounded-md transition-colors duration-150 hover:bg-amber-100 dark:hover:bg-amber-800/40 focus:outline-none';

interface ToolbarButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  tooltip?: string;
  label?: string;
  withTooltip?: boolean;
}

export function ToolbarButton({ icon, tooltip, label, className = '', withTooltip = true, ...rest }: ToolbarButtonProps) {
  const btn = (
    <button
      type="button"
      className={`${toolbarBtnBase} ${className}`}
      {...rest}
    >
      {icon}
      {label && <span className="text-sm ml-1">{label}</span>}
    </button>
  );

  return withTooltip && tooltip ? <Tooltip content={tooltip}>{btn}</Tooltip> : btn;
}

interface ToolbarButtonLinkProps {
  href: string;
  tooltip?: string;
  icon: ReactNode;
  label?: string;
  prefetch?: boolean;
  className?: string;
  withTooltip?: boolean;
  'data-testid'?: string;
}

export function ToolbarButtonLink({ href, tooltip, icon, label, prefetch = true, className = '', withTooltip = true, ...rest }: ToolbarButtonLinkProps) {
  const link = (
    <Link
      href={href}
      prefetch={prefetch}
      className={`${toolbarBtnBase} flex items-center space-x-1 ${className}`}
      {...rest}
    >
      {icon}
      {label && <span className="text-sm">{label}</span>}
    </Link>
  );

  return withTooltip && tooltip ? <Tooltip content={tooltip}>{link}</Tooltip> : link;
}
