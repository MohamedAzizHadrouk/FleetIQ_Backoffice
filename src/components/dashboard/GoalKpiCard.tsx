import { ArrowRight } from 'lucide-react';
import { GoalMeter } from '../charts';
import { fmt, goalStatus, pct, type GoalKpi } from '../../utils/dashboardKpis';
import { StatusTag, StatusTagFromLabel } from '../ui/StatusTag';
import { FOCUS, TRANSITION } from '../ui/focus';

export type CompareInfo = { label: string; previous: number | null } | null;

const STATUS_META = {
  ok: { text: 'Objectif atteint', tone: 'success' as const, rail: '' },
  warn: { text: 'À surveiller', tone: 'warning' as const, rail: 'shadow-rail-warning' },
  bad: { text: 'Sous l’objectif', tone: 'danger' as const, rail: 'shadow-rail-danger' }
};

type Props = {
  kpi: GoalKpi;
  compare: CompareInfo;
  onOpen: () => void;
};

/** Carte KPI « L'essentiel » – Industrial Tech (DL § 9.6). */
export function GoalKpiCard({ kpi, compare, onOpen }: Props) {
  const rate = kpi.of != null ? pct(kpi.value, kpi.of) : null;
  const st = rate != null && kpi.goal != null ? STATUS_META[goalStatus(rate, kpi.goal)] : null;
  let delta: { txt: string; cls: string; prevTxt: string } | null = null;
  if (compare && compare.previous != null) {
    const d = rate != null ? rate - compare.previous : kpi.value - compare.previous;
    delta = {
      txt: `${d > 0 ? '+' : ''}${fmt(d)}${rate != null ? ' pt' : ''}`,
      cls: d > 0 ? 'bg-success-50 text-success-700' : d < 0 ? 'bg-danger-50 text-danger-700' : 'bg-neutral-50 text-neutral-700',
      prevTxt: rate != null ? `${compare.previous} %` : fmt(compare.previous)
    };
  }
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`group flex h-full w-full min-w-0 flex-col gap-1.5 bg-surface rounded-card border border-border px-4 pt-4 pb-3.5 text-left hover:border-accent hover:shadow-[0_2px_8px_rgba(15,23,42,0.06)] ${TRANSITION} ${FOCUS}`}
    >
      <span className="text-overline uppercase text-text-muted">{kpi.label}</span>
      <span className="text-kpi text-text">
        {rate != null ? `${rate} %` : fmt(kpi.value)}
        <small className="ml-1.5 font-sans text-small font-medium text-text-muted">
          {rate != null ? `${fmt(kpi.value)} / ${fmt(kpi.of ?? 0)}` : kpi.unit}
        </small>
      </span>
      {rate != null && (
        <GoalMeter
          value={rate}
          goal={kpi.goal}
          tone={st?.tone ?? 'series1'}
          label={`${rate} %${kpi.goal != null ? ` · objectif ${kpi.goal} %` : ''}`}
        />
      )}
      <span className="mt-0.5 flex items-center justify-between gap-2 text-mention text-text-muted">
        {st ? (
          <>
            <StatusTagFromLabel label={st.text} />
            {kpi.goal != null && <span>objectif {kpi.goal} %</span>}
          </>
        ) : (
          <StatusTag label={kpi.info ?? 'Information'} family="info" />
        )}
      </span>
      <span className="text-[12.5px] text-text-muted">{kpi.context}</span>
      {compare && (
        <span className="text-[12.5px] text-text-muted">
          {delta ? (
            <>
              <span className={`rounded-[6px] px-1.5 py-px font-mono text-mention font-semibold ${delta.cls}`}>{delta.txt}</span> vs {compare.label} ({delta.prevTxt})
            </>
          ) : (
            <>Pas d’instantané pour {compare.label}</>
          )}
        </span>
      )}
      <span className="mt-auto inline-flex items-center gap-1 text-[11.5px] font-semibold text-primary-hover">
        {kpi.routeLabel}
        <ArrowRight size={12} aria-hidden="true" />
      </span>
    </button>
  );
}
