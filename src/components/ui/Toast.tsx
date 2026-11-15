import { createPortal } from 'react-dom';
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from './Button';
import type { StatusFamily } from './StatusTag';

export type ToastProps = {
  open: boolean;
  family?: Exclude<StatusFamily, 'neutral'>;
  eyebrow?: string;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  onClose: () => void;
};

const TOAST_SHADOW: Record<Exclude<StatusFamily, 'neutral'>, string> = {
  success: 'shadow-toast-success',
  warning: 'shadow-toast-warning',
  danger: 'shadow-toast-danger',
  info: 'shadow-toast-info'
};

const EYEBROW: Record<Exclude<StatusFamily, 'neutral'>, { cls: string; Icon: LucideIcon; default: string }> = {
  success: { cls: 'text-success-700', Icon: CircleCheck, default: 'Succès' },
  warning: { cls: 'text-warning-700', Icon: TriangleAlert, default: 'Attention' },
  danger: { cls: 'text-danger-700', Icon: CircleAlert, default: 'Critique' },
  info: { cls: 'text-info-700', Icon: Info, default: 'Information' }
};

/**
 * Notification flottante zone F (DL § 3.1 / § 9.13).
 * fixed bottom-6 right-6, 360 px, filet d'état + ombre raised.
 */
export function Toast({
  open,
  family = 'info',
  eyebrow,
  title,
  message,
  actionLabel,
  onAction,
  onClose
}: ToastProps) {
  if (!open || typeof document === 'undefined') return null;

  const meta = EYEBROW[family];
  const Icon = meta.Icon;

  return createPortal(
    <div
      role={family === 'danger' ? 'alert' : 'status'}
      className={`fixed bottom-6 right-6 z-toast w-[360px] max-w-[calc(100vw-2rem)] p-3 pl-4 bg-surface border border-border-strong rounded-card ${TOAST_SHADOW[family]}`}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className={`flex items-center gap-1.5 text-overline uppercase ${meta.cls}`}>
            <Icon size={14} aria-hidden="true" />
            {eyebrow ?? meta.default}
          </p>
          <p className="mt-0.5 text-small font-semibold text-text">{title}</p>
          {message && <p className="mt-0.5 text-mention text-text-muted">{message}</p>}
          {actionLabel && onAction && (
            <div className="mt-2">
              <Button size="compact" variant="secondary" onClick={onAction}>
                {actionLabel}
              </Button>
            </div>
          )}
        </div>
        <Button size="icon-sm" variant="ghost" aria-label="Fermer" onClick={onClose} className="text-text-muted hover:text-text shrink-0">
          <X size={16} aria-hidden="true" />
        </Button>
      </div>
    </div>,
    document.body
  );
}
