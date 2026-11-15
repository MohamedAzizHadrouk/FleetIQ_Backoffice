import React from 'react';
import { BoxIcon } from 'lucide-react';
import { FOCUS, TRANSITION } from './ui/focus';

interface StatCardProps {
  title: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  subtitle: string;
  icon?: BoxIcon;
  onClick?: () => void;
  /** Hors norme → filet d'état (DL § 9.6). */
  color?: 'blue' | 'red' | 'warning';
}

/** Carte KPI Industrial Tech (DL § 9.6) – pas d'ombre, filet d'état si hors norme. */
export function StatCard({
  title,
  value,
  trend,
  trendUp,
  subtitle,
  icon: Icon,
  onClick,
  color = 'blue'
}: StatCardProps) {
  const isClickable = !!onClick;
  const rail =
    color === 'red' ? 'shadow-rail-danger' : color === 'warning' ? 'shadow-rail-warning' : '';
  const iconBg = color === 'red' ? 'bg-danger-50' : color === 'warning' ? 'bg-warning-50' : 'bg-primary-100';
  const iconText = color === 'red' ? 'text-danger-700' : color === 'warning' ? 'text-warning-700' : 'text-primary';

  const base =
    `flex flex-col gap-1.5 p-4 pt-3 bg-surface border border-border rounded-card ${rail} ${TRANSITION}`;
  const interactive = isClickable
    ? `cursor-pointer hover:border-border-strong text-left w-full ${FOCUS}`
    : '';

  const content = (
    <>
      <div className="flex justify-between items-start gap-2">
        <h3 className="text-text-muted text-overline uppercase">{title}</h3>
        {Icon && (
          <div className={`flex h-8 w-8 items-center justify-center rounded-control shrink-0 ${iconBg}`}>
            <Icon className={iconText} size={16} aria-hidden="true" />
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-kpi text-text">{value}</span>
        {trend && (
          <span className={`text-mention font-medium ${trendUp ? 'text-success' : 'text-danger'}`}>
            {trendUp ? '↗' : '↘'} {trend}
          </span>
        )}
      </div>
      <p className="text-small text-text">{subtitle}</p>
    </>
  );

  if (isClickable) {
    return (
      <button type="button" onClick={onClick} className={`${base} ${interactive}`}>
        {content}
      </button>
    );
  }
  return <div className={base}>{content}</div>;
}
