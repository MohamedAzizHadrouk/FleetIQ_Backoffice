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

/**
 * Classement en barres horizontales (HTML) : rang, libellé, barre proportionnelle, valeur écrite.
 * Chaque ligne est un bouton si onRowClick est fourni.
 */
export function HorizontalBarList({ rows, max, ranked = false, tone = 'series1', onRowClick, ariaLabel }: Props) {
  const top = max ?? Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="divide-y divide-border-subtle" aria-label={ariaLabel}>
      {rows.map((r, i) => {
        const content = (
          <>
            {ranked && (
              <span className="w-6 shrink-0 text-small font-semibold text-text-muted tabular-nums" aria-hidden="true">
                {i + 1}
              </span>
            )}
            {/* < 640 px : le libellé prend sa propre ligne (barre et valeur en dessous) – aucun défilement horizontal à 375 px */}
            <span className={`${ranked ? 'basis-[calc(100%-2.25rem)]' : 'basis-full'} min-w-0 sm:basis-auto sm:w-56 sm:shrink-0`}>
              <span className="block truncate text-small font-medium text-text">{r.label}</span>
              {r.sub && <span className="block truncate text-mention text-text-muted">{r.sub}</span>}
            </span>
            <span className="flex-1 min-w-[80px] h-3 rounded-pill bg-border-subtle overflow-hidden" aria-hidden="true">
              <span
                className={`block h-full rounded-pill ${TONE_BG[r.tone ?? tone]}`}
                style={{ width: `${top ? Math.max(r.value ? 2 : 0, (r.value / top) * 100) : 0}%` }}
              />
            </span>
            <span className="w-24 shrink-0 text-right text-small font-semibold text-text tabular-nums">
              {r.valueLabel ?? r.value.toLocaleString('fr-FR')}
            </span>
            {r.extra}
          </>
        );
        return (
          <li key={r.key}>
            {onRowClick ? (
              <button
                type="button"
                title={r.title}
                onClick={() => onRowClick(r.key)}
                className="flex flex-wrap sm:flex-nowrap w-full items-center gap-x-3 gap-y-1 px-2 py-2.5 text-left rounded-control hover:bg-primary-50 transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
              >
                {content}
              </button>
            ) : (
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-x-3 gap-y-1 px-2 py-2.5" title={r.title}>
                {content}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
