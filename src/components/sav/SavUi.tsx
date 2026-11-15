/** Interventions SAV – éléments d'interface partagés (Industrial Tech T-002). */
import type { ReactNode } from 'react';
import {
  CalendarClock,
  CalendarPlus,
  CircleCheck,
  ClockAlert,
  RotateCcw,
  Wrench,
  type LucideIcon
} from 'lucide-react';
import type { Intervention } from '../../state/FleetStore';
import { typeMention, type SavDisplayStatus } from '../../utils/savKpis';
import { StatusTag, type StatusFamily } from '../ui/StatusTag';
import { FOCUS, TRANSITION } from '../ui/focus';

export { FOCUS };
export const BTN_PRIMARY = `inline-flex items-center justify-center gap-2 h-control max-lg:h-control-touch px-3 rounded-control bg-primary text-text-inverse text-button-sm border border-primary hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-surface disabled:text-text-muted disabled:border-border ${TRANSITION} ${FOCUS}`;
export const BTN_SECONDARY = `inline-flex items-center justify-center gap-2 h-control max-lg:h-control-touch px-3 rounded-control border border-primary bg-surface text-primary text-button-sm hover:bg-primary-50 disabled:cursor-not-allowed disabled:bg-surface disabled:text-text-muted disabled:border-border ${TRANSITION} ${FOCUS}`;
export const BTN_GHOST = `inline-flex items-center justify-center gap-2 h-control max-lg:h-control-touch px-3 rounded-control border border-border-strong bg-surface text-text text-button-sm hover:bg-surface-muted ${TRANSITION} ${FOCUS}`;
export const FIELD = `h-control max-md:h-control-touch px-2.5 border border-border-strong rounded-control bg-surface text-small max-md:text-body text-text hover:border-text ${TRANSITION} focus-visible:outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-focus/25`;

const STATUS_META: Record<SavDisplayStatus, { family: StatusFamily; icon: LucideIcon }> = {
  'En retard': { family: 'danger', icon: ClockAlert },
  'À planifier': { family: 'info', icon: CalendarPlus },
  Planifiée: { family: 'neutral', icon: CalendarClock },
  'En cours': { family: 'info', icon: Wrench },
  Terminée: { family: 'success', icon: CircleCheck },
  'À revoir': { family: 'warning', icon: RotateCcw }
};

export function StatusBadge({ status }: { status: SavDisplayStatus }) {
  const meta = STATUS_META[status];
  return <StatusTag label={status} family={meta.family} icon={meta.icon} />;
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

/** Carte KPI cliquable – filet d’état hors norme uniquement (plus de liseré accent partout). */
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
      className={`text-left w-full flex flex-col gap-1.5 p-4 pt-3 bg-surface border border-border rounded-card hover:border-border-strong ${TRANSITION} ${FOCUS} ${
        danger ? 'shadow-rail-danger' : ''
      }`}
    >
      <span className="flex items-start justify-between gap-2">
        <span className="text-overline uppercase text-text-muted">{title}</span>
        <span
          className={`hidden sm:flex h-control-sm w-control-sm shrink-0 items-center justify-center rounded-control ${
            danger ? 'bg-danger-50 text-danger-700' : 'bg-primary-100 text-primary'
          }`}
        >
          <Icon size={16} aria-hidden="true" />
        </span>
      </span>
      <span className="flex items-baseline gap-1.5">
        <span className="text-kpi text-text">{value}</span>
        {unit && <span className="text-small text-text-muted">{unit}</span>}
      </span>
      <span className="block text-small text-text-muted">{sub}</span>
    </button>
  );
}

export function Section({
  id,
  title,
  sub,
  right,
  children,
  kpi
}: {
  id?: string;
  title: string;
  sub?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  kpi?: string;
}) {
  return (
    <section id={id} data-kpi={kpi} className="bg-surface rounded-card border border-border min-w-0 scroll-mt-topbar">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 border-b border-border">
        <div className="min-w-0">
          <h2 className="text-section text-text">{title}</h2>
          {sub && <p className="text-mention text-text-muted mt-0.5">{sub}</p>}
        </div>
        {right && <div className="ml-auto">{right}</div>}
      </div>
      {children}
    </section>
  );
}

/** Pagination pied de panneau (DL § 9.8). */
/** Pagination pied de panneau (DL § 9.8). */
export function Pager({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2 border-t border-border-subtle text-mention text-text-muted">
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
