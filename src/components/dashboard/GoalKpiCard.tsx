import { ArrowRight, CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react';
import { GoalMeter } from '../charts';
import { fmt, goalStatus, pct, type GoalKpi } from '../../utils/dashboardKpis';

export type CompareInfo = { label: string; previous: number | null } | null;

const STATUS = {
  ok: { text: 'Objectif atteint', cls: 'bg-success-50 text-success-700 border-success-200', Icon: CircleCheck, tone: 'success' as const },
  warn: { text: 'À surveiller', cls: 'bg-warning-50 text-warning-700 border-warning-200', Icon: TriangleAlert, tone: 'warning' as const },
  bad: { text: 'Sous l’objectif', cls: 'bg-danger-50 text-danger-700 border-danger-200', Icon: CircleAlert, tone: 'danger' as const }
};

type Props = {
  kpi: GoalKpi;
  compare: CompareInfo;
  onOpen: () => void;
};

/** Carte « L'essentiel » : taux face à son objectif (proposition), contexte, écart « Comparer », page source. */
export function GoalKpiCard({ kpi, compare, onOpen }: Props) {
  const rate = kpi.of != null ? pct(kpi.value, kpi.of) : null;
  const st = rate != null && kpi.goal != null ? STATUS[goalStatus(rate, kpi.goal)] : null;
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
      className="group flex h-full w-full flex-col gap-2 bg-surface rounded-card border border-border shadow-card p-5 text-left transition-shadow hover:shadow-raised hover:border-primary-200 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
    >
      <span className="flex items-start justify-between gap-2">
        <span className="text-overline uppercase text-text-muted">{kpi.label}</span>
        <span className="text-text-muted" title={tooltip} aria-label={`Définition : ${tooltip}`} role="img">
          <Info size={16} aria-hidden="true" />
        </span>
      </span>
      <span className="flex items-baseline gap-2">
        <span className="text-kpi text-text tabular-nums">{rate != null ? `${rate} %` : fmt(kpi.value)}</span>
        <span className="text-small text-text-muted tabular-nums">
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
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill border text-mention font-medium whitespace-nowrap ${st.cls}`}>
              <st.Icon size={14} aria-hidden="true" />
              {st.text}
            </span>
            <span className="text-mention text-text-muted">objectif {kpi.goal} % (proposition)</span>
          </>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill border text-mention font-medium whitespace-nowrap bg-info-50 text-info-700 border-info-200">
            <Info size={14} aria-hidden="true" />
            {kpi.info}
          </span>
        )}
      </span>
      <span className="text-small text-text-muted">{kpi.context}</span>
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
      <span className="mt-auto inline-flex items-center gap-1 pt-1 text-mention font-medium text-primary">
        {kpi.routeLabel}
        <ArrowRight size={14} aria-hidden="true" />
      </span>
    </button>
  );
}
