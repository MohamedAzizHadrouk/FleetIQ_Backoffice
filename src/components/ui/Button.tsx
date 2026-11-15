import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { LoaderCircle } from 'lucide-react';
import { FOCUS, TRANSITION } from './focus';

export type ButtonVariant = 'primary' | 'secondary' | 'neutral' | 'ghost' | 'danger';
export type ButtonSize = 'default' | 'compact' | 'icon' | 'icon-sm';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children?: ReactNode;
};

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-text-inverse border border-primary hover:bg-primary-hover active:bg-primary-active',
  secondary:
    'bg-surface text-primary border border-primary hover:bg-primary-50 active:bg-primary-100',
  neutral: 'bg-surface text-text border border-border-strong hover:bg-surface-muted',
  ghost: 'bg-transparent text-primary border border-transparent hover:bg-primary-50',
  danger: 'bg-danger text-text-inverse border border-danger hover:bg-danger-hover'
};

const SIZE: Record<ButtonSize, string> = {
  default: 'h-control max-lg:h-control-touch px-3 text-button-sm',
  compact: 'h-control-sm px-2 text-mention font-medium',
  icon: 'h-control w-control max-lg:h-control-touch max-lg:w-control-touch p-0',
  'icon-sm': 'h-control-sm w-control-sm p-0'
};

const DISABLED =
  'disabled:cursor-not-allowed disabled:bg-surface disabled:text-text-muted disabled:border-border';

/**
 * Bouton Industrial Tech (DL § 9.10).
 * Une action principale par vue ; icône 16 px à gauche.
 */
export function Button({
  variant = 'neutral',
  size = 'default',
  loading = false,
  className = '',
  children,
  disabled,
  type = 'button',
  ...rest
}: Props) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center gap-2 rounded-control whitespace-nowrap ${TRANSITION} ${FOCUS} ${VARIANT[variant]} ${SIZE[size]} ${DISABLED} ${className}`}
      {...rest}
    >
      {loading && <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}
