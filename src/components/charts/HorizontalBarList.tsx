import type { ReactNode } from 'react';
import { TONE_BG, type ChartTone } from './chartTones';

export type HBarRow = {
  key: string;
  label: string;
  /** petit texte sous le libellé */
  sub?: string;
  value: number;
  /** texte de la valeur (par défaut : le nombre) */
  valueLabel?: ReactNode;
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

/**
 * Classement en barres horizontales – design system TUNAV
 * (séries chart-1…4, piste Fond clair, coins control).
 */
export function HorizontalBarList({ rows, max, ranked = false, tone = 'series1', onRowClick, ariaLabel }: Props) {
  const top = max ?? Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-1" aria-label={ariaLabel}>
      {rows.map((r, i) => {
        const rowTone = r.tone ?? (tone === 'series1' ? SERIES[i % SERIES.length] : tone);
        const widthPct = top ? Math.max(r.value ? 3 : 0, (r.value / top) * 100) : 0;
        const content = (
          <>
            {ranked && (
              <span className="w-6 shrink-0 text-small font-semibold text-text-muted tabular-nums" aria-hidden="true">
                {i + 1}
              </span>
            )}
            <span
              className={`${ranked ? 'basis-[calc(100%-2.25rem)]' : 'basis-full'} min-w-0 sm:basis-auto sm:w-44 sm:shrink-0`}
            >
              <span className="flex items-center gap-2 min-w-0">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-[2px] ${TONE_BG[rowTone]}`} aria-hidden="true" />
                <span className="block truncate text-small font-medium text-text">{r.label}</span>
              </span>
              {r.sub && <span className="mt-0.5 block truncate pl-[18px] text-mention text-text-muted">{r.sub}</span>}
            </span>
            <span
              className="flex-1 min-w-[80px] h-3 rounded-control bg-surface-muted border border-border-subtle overflow-hidden"
              aria-hidden="true"
            >
              <span className={`block h-full rounded-control ${TONE_BG[rowTone]}`} style={{ width: `${widthPct}%` }} />
            </span>
            <span className="w-36 shrink-0 text-right text-small font-medium text-text tabular-nums">
              {r.valueLabel ?? r.value.toLocaleString('fr-FR')}
            </span>
            {r.extra}
          </>
        );
        return (
          <li key={r.key} className="border-b border-border-subtle last:border-b-0">
            {onRowClick ? (
              <button
                type="button"
                title={r.title}
                onClick={() => onRowClick(r.key)}
                className="flex flex-wrap sm:flex-nowrap w-full items-center gap-x-3 gap-y-1.5 px-1 py-2.5 text-left rounded-control hover:bg-primary-50 transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
              >
                {content}
              </button>
            ) : (
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-x-3 gap-y-1.5 px-1 py-2.5" title={r.title}>
                {content}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
