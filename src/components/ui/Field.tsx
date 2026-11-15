import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';
import { CircleAlert } from 'lucide-react';
import { TRANSITION } from './focus';

const CONTROL =
  `w-full h-control px-2.5 rounded-control bg-surface border border-border-strong text-small text-text placeholder:text-text-muted hover:border-text ${TRANSITION} focus-visible:outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-focus/25 max-md:h-control-touch max-md:text-body disabled:bg-surface-muted disabled:text-text-muted disabled:border-border`;

type FieldProps = {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
};

/** Libellé + contrôle + aide / erreur (DL § 9.11). */
export function Field({ label, htmlFor, hint, error, children, className = '' }: FieldProps) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="block mb-1 text-label text-text">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="mt-1 flex items-center gap-1 text-mention text-danger" role="alert">
          <CircleAlert size={14} aria-hidden="true" />
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="mt-1 text-mention text-text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean };

export function Input({ className = '', invalid, id, ...rest }: InputProps) {
  return (
    <input
      id={id}
      aria-invalid={invalid || undefined}
      aria-describedby={invalid && id ? `${id}-error` : undefined}
      className={`${CONTROL} ${invalid ? 'border-danger' : ''} ${className}`}
      {...rest}
    />
  );
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean };

export function Select({ className = '', invalid, id, children, ...rest }: SelectProps) {
  return (
    <select
      id={id}
      aria-invalid={invalid || undefined}
      className={`${CONTROL} pr-7 ${invalid ? 'border-danger' : ''} ${className}`}
      {...rest}
    >
      {children}
    </select>
  );
}

export const fieldControlClass = CONTROL;
