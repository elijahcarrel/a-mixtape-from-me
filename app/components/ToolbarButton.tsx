import React, { ReactNode } from 'react';
import Link from 'next/link';
import Tooltip from './Tooltip';

const base = 'p-2 rounded-md transition-colors duration-150 focus:outline-none';

interface ToolbarButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  tooltip?: string;
  label?: string;
  withTooltip?: boolean;
  disabled?: boolean;
}

export function ToolbarButton({
  icon,
  tooltip,
  label,
  className = '',
  withTooltip = true,
  disabled = false,
  ...rest
}: ToolbarButtonProps) {
  const disabledStyles = disabled 
    ? 'opacity-50 cursor-default' 
    : 'hover:bg-amber-100 dark:hover:bg-amber-700/30 cursor-pointer';
  
  const combined = `${base} ${disabledStyles} ${className}`;
  const btn = (
    <button type="button" className={combined} disabled={disabled} {...rest}>
      {icon}
      {label && <span className="text-sm ml-1">{label}</span>}
    </button>
  );

  // Don't show tooltip when disabled - it's confusing UX
  return withTooltip && tooltip && !disabled ? (
    <Tooltip content={tooltip}>{btn}</Tooltip>
  ) : (
    btn
  );
}

interface ToolbarButtonLinkProps {
  href: string;
  tooltip?: string;
  icon: ReactNode;
  label?: string;
  prefetch?: boolean;
  className?: string;
  withTooltip?: boolean;
  disabled?: boolean;
  'data-testid'?: string;
}

export function ToolbarButtonLink({
  href,
  tooltip,
  icon,
  label,
  prefetch = true,
  className = '',
  withTooltip = true,
  disabled = false,
  ...rest
}: ToolbarButtonLinkProps) {
  const disabledStyles = disabled 
    ? 'opacity-50 cursor-not-allowed pointer-events-none' 
    : 'hover:bg-amber-100 dark:hover:bg-amber-700/30 cursor-pointer';
  
  const combined = `${base} flex items-center space-x-1 ${disabledStyles} ${className}`;
  const link = (
    <Link href={href} prefetch={prefetch} className={combined} {...rest}>
      {icon}
      {label && <span className="text-sm">{label}</span>}
    </Link>
  );

  // Don't show tooltip when disabled - it's confusing UX
  return withTooltip && tooltip && !disabled ? (
    <Tooltip content={tooltip}>{link}</Tooltip>
  ) : (
    link
  );
}
