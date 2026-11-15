import { ArrowRight, Info } from 'lucide-react';
import { GoalMeter } from '../charts';
import { fmt, goalStatus, pct, type GoalKpi } from '../../utils/dashboardKpis';
import { StatusTagFromLabel } from '../ui/StatusTag';
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
  const tooltip = `${kpi.definition}\nFormule : ${kpi.formula}`;
  let delta: { txt: string; cls: string; prevTxt: string } | null = null;
  if (compare && compare.previous != null) {
    const d = rate != null ? rate - compare.previous : kpi.value - compare.previous;
    delta = {
      txt: `${d > 0 ? '+' : ''}${fmt(d)}${rate != null ? ' pt' : ''}`,
      cls: d > 0 ? 'text-success' : d < 0 ? 'text-danger' : 'text-text-muted',
      prevTxt: rate != null ? `${compare.previous} %` : fmt(compare.previous)
    };
  }
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`group flex h-full w-full flex-col gap-1.5 bg-surface rounded-card border border-border p-4 pt-3 text-left hover:border-border-strong ${TRANSITION} ${FOCUS} ${st?.rail ?? ''}`}
    >
      <span className="flex items-start justify-between gap-2">
        <span className="text-overline uppercase text-text-muted">{kpi.label}</span>
        <span className="text-text-muted" title={tooltip} aria-label={`Définition : ${tooltip}`} role="img">
          <Info size={16} aria-hidden="true" />
        </span>
      </span>
      <span className="flex items-baseline gap-2">
        <span className="text-kpi text-text">{rate != null ? `${rate} %` : fmt(kpi.value)}</span>
        <span className="text-small text-text-muted">
          {rate != null ? `${fmt(kpi.value)} / ${fmt(kpi.of ?? 0)}` : kpi.unit}
        </span>
      </span>
      {rate != null && (
        <GoalMeter
          value={rate}
          goal={kpi.goal}
          tone={st?.tone ?? 'series1'}
          label={`${rate} %${kpi.goal != null ? ` · objectif ${kpi.goal} %` : ''}`}
        />
      )}
      <span className="flex flex-wrap items-center gap-2">
        {st ? (
          <>
            <StatusTagFromLabel label={st.text} />
            <span className="text-mention text-text-muted">objectif {kpi.goal} % (proposition)</span>
          </>
        ) : (
          <StatusTagFromLabel label="Information" />
        )}
        {!st && kpi.info && <span className="text-mention text-text-muted">{kpi.info}</span>}
      </span>
      <span className="text-small text-text">{kpi.context}</span>
      {compare && (
        <span className="text-mention text-text-muted">
          {delta ? (
            <>
              <span className={`font-semibold ${delta.cls}`}>{delta.txt}</span> vs {compare.label} ({delta.prevTxt})
            </>
          ) : (
            <>Pas d’instantané pour {compare.label}</>
          )}
        </span>
      )}
      <span className="mt-auto inline-flex items-center gap-1 pt-2 border-t border-border-subtle text-mention font-medium text-primary">
        {kpi.routeLabel}
        <ArrowRight size={14} aria-hidden="true" />
      </span>
    </button>
  );
}
