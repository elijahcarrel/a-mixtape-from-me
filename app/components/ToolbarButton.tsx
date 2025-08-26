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

  // If we have a label, implement responsive behavior
  if (label) {
    // On small screens: show tooltip, hide label
    const smallScreenLink = (
      <Link href={href} prefetch={prefetch} className={combined} {...rest}>
        {icon}
      </Link>
    );

    // On large screens: show label, no tooltip
    const largeScreenLink = (
      <Link href={href} prefetch={prefetch} className={combined} {...rest}>
        {icon}
        <span className="text-sm">{label}</span>
      </Link>
    );

    return (
      <>
        {/* Small screens: tooltip + icon only */}
        <div className="sm:hidden">
          {withTooltip && tooltip && !disabled ? (
            <Tooltip content={tooltip}>{smallScreenLink}</Tooltip>
          ) : (
            smallScreenLink
          )}
        </div>

        {/* Large screens: icon + label, no tooltip */}
        <div className="hidden sm:block">{largeScreenLink}</div>
      </>
    );
  }

  // No label case - use original behavior
  const link = (
    <Link href={href} prefetch={prefetch} className={combined} {...rest}>
      {icon}
    </Link>
  );

  // Don't show tooltip when disabled - it's confusing UX
  return withTooltip && tooltip && !disabled ? (
    <Tooltip content={tooltip}>{link}</Tooltip>
  ) : (
    link
  );
}
