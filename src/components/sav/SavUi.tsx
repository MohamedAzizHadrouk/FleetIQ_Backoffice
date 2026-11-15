/** Interventions SAV – petits éléments d'interface partagés (carte FleetIQ 10, tokens.md §10.2 – §10.4). */
import type { ReactNode } from 'react';
import { CalendarClock, CalendarPlus, CircleCheck, Clock, RotateCcw, Wrench, type LucideIcon } from 'lucide-react';
import type { Intervention } from '../../state/FleetStore';
import { typeMention, type SavDisplayStatus } from '../../utils/savKpis';

export const FOCUS = 'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface';
export const BTN_PRIMARY = `inline-flex items-center justify-center gap-2 min-h-11 md:min-h-9 px-4 rounded-control bg-primary text-text-inverse text-button-sm hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${FOCUS}`;
export const BTN_SECONDARY = `inline-flex items-center justify-center gap-2 min-h-11 md:min-h-9 px-4 rounded-control border border-primary bg-surface text-primary text-button-sm hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${FOCUS}`;
export const BTN_GHOST = `inline-flex items-center justify-center gap-2 min-h-11 md:min-h-9 px-3 rounded-control border border-border bg-surface text-text text-button-sm hover:bg-surface-muted transition-colors ${FOCUS}`;
export const FIELD = `h-11 md:h-9 px-3 border border-border-strong rounded-control bg-surface text-body md:text-small text-text ${FOCUS}`;

const STATUS_STYLE: Record<SavDisplayStatus, { cls: string; icon: LucideIcon }> = {
  'En retard': { cls: 'bg-danger-50 text-danger-700 border-danger-200', icon: Clock },
  'À planifier': { cls: 'bg-primary-100 text-primary border-primary-200', icon: CalendarPlus },
  Planifiée: { cls: 'bg-border-subtle text-text border-border', icon: CalendarClock },
  'En cours': { cls: 'bg-info-50 text-info-700 border-info-200', icon: Wrench },
  Terminée: { cls: 'bg-success-50 text-success-700 border-success-200', icon: CircleCheck },
  'À revoir': { cls: 'bg-warning-50 text-warning-700 border-warning-200', icon: RotateCcw }
};

export function StatusBadge({ status }: { status: SavDisplayStatus }) {
  const s = STATUS_STYLE[status];
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill border text-mention font-medium whitespace-nowrap ${s.cls}`}>
      <Icon size={14} aria-hidden="true" />
      {status}
    </span>
  );
}

/** Type + mention auto / manuel / modifié (SAV-S-11) */
export function TypeCell({ iv }: { iv: Intervention }) {
  return (
    <span className="inline-flex flex-col leading-tight">
      <span className="text-small font-medium text-text">{iv.type}</span>
      <span className="text-mention text-text-muted">{typeMention(iv)}</span>
    </span>
  );
}

/** Carte KPI cliquable (tokens.md §10.2 : élément <button>) */
export function KpiButton({
  kpi,
  title,
  value,
  unit,
  sub,
  tone = 'default',
  onClick,
  icon: Icon
}: {
  kpi: string;
  title: string;
  value: string;
  unit?: string;
  sub: ReactNode;
  tone?: 'default' | 'danger';
  onClick?: () => void;
  icon: LucideIcon;
}) {
  const danger = tone === 'danger';
  return (
    <button
      type="button"
      data-kpi={kpi}
      onClick={onClick}
      className={`text-left w-full bg-surface p-4 md:p-5 rounded-card border border-border border-l-4 ${danger ? 'border-l-danger' : 'border-l-accent'} shadow-card hover:shadow-raised hover:border-primary-200 transition-shadow ${FOCUS}`}
    >
      <span className="flex items-start justify-between gap-2 mb-2">
        <span className="text-overline uppercase text-text-muted">{title}</span>
        <span className={`hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-control ${danger ? 'bg-danger-50 text-danger-700' : 'bg-primary-100 text-primary'}`}>
          <Icon size={18} aria-hidden="true" />
        </span>
      </span>
      <span className="flex items-baseline gap-1.5">
        <span className="text-kpi text-text tabular-nums">{value}</span>
        {unit && <span className="text-small text-text-muted">{unit}</span>}
      </span>
      <span className="mt-1 block text-small text-text-muted">{sub}</span>
    </button>
  );
}

export function Section({ id, title, sub, right, children, kpi }: { id?: string; title: string; sub?: ReactNode; right?: ReactNode; children: ReactNode; kpi?: string }) {
  return (
    <section id={id} data-kpi={kpi} className="bg-surface rounded-card border border-border shadow-card scroll-mt-20">
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 md:px-6 pt-4 md:pt-5 pb-3">
        <div className="min-w-0">
          <h2 className="text-h4 text-text">{title}</h2>
          {sub && <p className="text-small text-text-muted mt-0.5">{sub}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

export function Pager({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-3 px-4 md:px-6 py-3 border-t border-border-subtle text-small text-text-muted">
      <span>
        Page {page + 1} / {pages}
      </span>
      <span className="flex gap-2">
        <button type="button" className={BTN_GHOST} disabled={page === 0} onClick={() => onPage(page - 1)}>
          Précédent
        </button>
        <button type="button" className={BTN_GHOST} disabled={page >= pages - 1} onClick={() => onPage(page + 1)}>
          Suivant
        </button>
      </span>
    </div>
  );
}
