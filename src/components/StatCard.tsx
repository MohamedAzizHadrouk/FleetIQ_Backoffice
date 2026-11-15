import React from 'react';
import { BoxIcon } from 'lucide-react';
interface StatCardProps {
  title: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  subtitle: string;
  icon?: BoxIcon;
  onClick?: () => void;
  color?: 'blue' | 'red';
}
// TUNAV – carte KPI (tokens.md §10.2) : carte blanche, icône sur fond primary-100 ; variante alerte = liseré danger.
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
  const colorClasses = {
    blue: {
      border: 'border-l-accent',
      iconBg: 'bg-primary-100',
      iconText: 'text-primary'
    },
    red: {
      border: 'border-l-danger',
      iconBg: 'bg-danger-50',
      iconText: 'text-danger-700'
    }
  };
  return <div onClick={onClick} className={`bg-surface p-5 rounded-card border border-border border-l-4 ${colorClasses[color].border} shadow-card transition-shadow ${isClickable ? 'cursor-pointer hover:shadow-raised hover:border-primary-200' : ''}`}>
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-text-muted text-overline uppercase">
          {title}
        </h3>
        {Icon && <div className={`flex h-10 w-10 items-center justify-center rounded-control ${colorClasses[color].iconBg}`}>
            <Icon className={colorClasses[color].iconText} size={20} aria-hidden="true" />
          </div>}
      </div>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-kpi text-text tabular-nums">{value}</span>
        {trend && <span className={`text-mention font-medium ${trendUp ? 'text-success' : 'text-danger'}`}>
            {trendUp ? '↗' : '↘'} {trend}
          </span>}
      </div>
      <p className="text-small text-text-muted">{subtitle}</p>
    </div>;
}
