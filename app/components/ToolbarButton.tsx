import React, { ReactNode } from 'react';
import Link from 'next/link';
import Tooltip from './Tooltip';
import { useTheme } from './ThemeProvider';

const base = 'p-2 rounded-md transition-colors duration-150 focus:outline-none';

interface ToolbarButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  tooltip?: string;
  label?: string;
  withTooltip?: boolean;
}

export function ToolbarButton({ icon, tooltip, label, className = '', withTooltip = true, ...rest }: ToolbarButtonProps) {
  const { theme } = useTheme();
  const hoverClass = theme === 'dark' ? 'hover:bg-amber-700/30' : 'hover:bg-amber-100';
  const combined = `${base} ${hoverClass} ${className}`;
  const btn = (
    <button
      type="button"
      className={combined}
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
  const { theme } = useTheme();
  const hoverClass = theme === 'dark' ? 'hover:bg-amber-700/30' : 'hover:bg-amber-100';
  const combined = `${base} flex items-center space-x-1 ${hoverClass} ${className}`;
  const link = (
    <Link
      href={href}
      prefetch={prefetch}
      className={combined}
      {...rest}
    >
      {icon}
      {label && <span className="text-sm">{label}</span>}
    </Link>
  );

  return withTooltip && tooltip ? <Tooltip content={tooltip}>{link}</Tooltip> : link;
}
