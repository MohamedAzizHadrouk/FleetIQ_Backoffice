import type { ReactNode } from 'react';
import { TONE_BG, type ChartTone } from './chartTones';

export type HBarRow = {
  key: string;
  label: string;
  /** petit texte sous le libellé */
  sub?: string;
  value: number;
  /** texte de la valeur (par défaut : le nombre) — préférer `metrics` pour l’affichage */
  valueLabel?: ReactNode;
  /** pastilles métriques sous la barre (évite le débordement horizontal) */
  metrics?: Array<{ label: string; value: string; tone?: 'default' | 'danger' | 'muted' }>;
  /** colonne(s) supplémentaire(s) à droite */
  extra?: ReactNode;
  title?: string;
  tone?: ChartTone;
};

type Props = {
  rows: HBarRow[];
  /** valeur pleine largeur (par défaut : la plus grande) */
  max?: number;
  /** numéro de rang à gauche */
  ranked?: boolean;
  tone?: ChartTone;
  onRowClick?: (key: string) => void;
  ariaLabel: string;
};

const SERIES: ChartTone[] = ['series1', 'series2', 'series3', 'series4'];

const METRIC_CLS = {
  default: 'bg-primary-50 text-primary border-primary-200',
  danger: 'bg-danger-50 text-danger border-danger-200',
  muted: 'bg-surface-muted text-text-muted border-border'
} as const;

/**
 * Barres horizontales TUNAV.
 * Affichage : titre → barre pleine largeur → pastilles métriques (wrap).
 * Aucun texte long collé à droite de la barre.
 */
export function HorizontalBarList({ rows, max, ranked = false, tone = 'series1', onRowClick, ariaLabel }: Props) {
  const top = max ?? Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="w-full min-w-0" aria-label={ariaLabel}>
      {rows.map((r, i) => {
        const rowTone = r.tone ?? (tone === 'series1' ? SERIES[i % SERIES.length] : tone);
        const widthPct = top ? Math.min(100, Math.max(0, (r.value / top) * 100)) : 0;
        const content = (
          <span className="flex w-full min-w-0 flex-col gap-2">
            <span className="flex min-w-0 items-center gap-2">
              {ranked && (
                <span className="w-5 shrink-0 text-small font-semibold text-text-muted tabular-nums" aria-hidden="true">
                  {i + 1}
                </span>
              )}
              <span className={`h-2.5 w-2.5 shrink-0 rounded-[2px] ${TONE_BG[rowTone]}`} aria-hidden="true" />
              <span className="min-w-0">
                <span className="block truncate text-small font-medium text-text">{r.label}</span>
                {r.sub && <span className="mt-0.5 block truncate text-mention text-text-muted">{r.sub}</span>}
              </span>
            </span>

            <span
              className="block h-2.5 w-full rounded-control border border-border-subtle bg-surface-muted overflow-hidden"
              aria-hidden="true"
            >
              <span className={`block h-full rounded-control ${TONE_BG[rowTone]}`} style={{ width: `${widthPct}%` }} />
            </span>

            {r.metrics && r.metrics.length > 0 ? (
              <span className="flex flex-wrap gap-1.5">
                {r.metrics.map((m) => (
                  <span
                    key={m.label}
                    className={`inline-flex items-baseline gap-1 rounded-[2px] border px-2 py-0.5 text-mention ${METRIC_CLS[m.tone ?? 'default']}`}
                  >
                    <span className="font-semibold tabular-nums">{m.value}</span>
                    <span className="opacity-80">{m.label}</span>
                  </span>
                ))}
              </span>
            ) : r.valueLabel != null ? (
              <span className="text-mention text-text-muted">{r.valueLabel}</span>
            ) : (
              <span className="text-mention font-semibold tabular-nums text-text">{r.value.toLocaleString('fr-FR')}</span>
            )}
            {r.extra}
          </span>
        );
        return (
          <li key={r.key} className="w-full min-w-0 border-b border-border-subtle last:border-b-0">
            {onRowClick ? (
              <button
                type="button"
                title={r.title}
                onClick={() => onRowClick(r.key)}
                className="block w-full min-w-0 px-0.5 py-3 text-left rounded-control hover:bg-primary-50 transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
              >
                {content}
              </button>
            ) : (
              <div className="w-full min-w-0 px-0.5 py-3" title={r.title}>
                {content}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
