import React from 'react';
import { CalendarIcon } from 'lucide-react';

export type PeriodKey = 'today' | '7d' | '30d' | '3m' | 'custom';

interface PeriodFilterProps {
  value: PeriodKey;
  onChange: (period: PeriodKey) => void;
  startDate?: string;
  endDate?: string;
  onStartDateChange?: (date: string) => void;
  onEndDateChange?: (date: string) => void;
  /** inline = barre compacte (tableau de bord) ; block = pleine largeur (modales, filtres) */
  variant?: 'inline' | 'block';
  /** Masquer l’option « Aujourd’hui » (ex. tableau de bord) */
  hideToday?: boolean;
}

const periods: { key: PeriodKey; label: string }[] = [
  { key: 'today', label: "Aujourd'hui" },
  { key: '7d', label: '7 jours' },
  { key: '30d', label: '30 jours' },
  { key: '3m', label: '3 mois' },
  { key: 'custom', label: 'Personnalisé' }
];

export function PeriodFilter({
  value,
  onChange,
  startDate = '',
  endDate = '',
  onStartDateChange,
  onEndDateChange,
  variant = 'block',
  hideToday = false
}: PeriodFilterProps) {
  const isInline = variant === 'inline';
  const visiblePeriods = hideToday ? periods.filter((p) => p.key !== 'today') : periods;

  return (
    <div
      className={`flex flex-col gap-2 min-w-0 ${isInline ? 'w-fit shrink-0' : 'w-full'}`}
    >
      <div
        className={`inline-flex items-center bg-surface border border-border rounded-card shadow-card ${
          isInline ? 'p-1 gap-0.5 flex-nowrap' : 'flex flex-wrap gap-1 p-1.5 w-full min-w-0'
        }`}
      >
        <CalendarIcon
          size={14}
          className={`text-text-muted shrink-0 ${isInline ? 'ml-2 mr-0.5' : 'ml-1.5'}`}
        />
        {visiblePeriods.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => onChange(p.key)}
            className={`font-medium rounded-control transition-colors whitespace-nowrap shrink-0 ${
              isInline ? 'px-3 py-1.5 text-mention' : 'px-2.5 py-1.5 text-mention'
            } ${
              value === p.key
                ? 'bg-primary text-text-inverse shadow-card'
                : 'text-text hover:bg-surface-muted'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {value === 'custom' && (
        <div
          className={`flex flex-wrap items-center gap-2 bg-surface border border-border rounded-card p-2 shadow-card min-w-0 ${
            isInline ? 'w-fit' : 'w-full'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <label className="text-mention text-text-muted font-medium">Du</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange?.(e.target.value)}
              className="px-2 py-1 border border-border-strong rounded-control text-mention text-text focus-visible:ring-3 focus-visible:ring-focus focus-visible:border-transparent outline-none transition-shadow"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-mention text-text-muted font-medium">Au</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange?.(e.target.value)}
              className="px-2 py-1 border border-border-strong rounded-control text-mention text-text focus-visible:ring-3 focus-visible:ring-focus focus-visible:border-transparent outline-none transition-shadow"
            />
          </div>
        </div>
      )}
    </div>
  );
}
