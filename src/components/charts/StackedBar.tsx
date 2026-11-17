import { TONE_BG, TONE_ON, type ChartTone } from './chartTones';

export type StackedSegment = {
  key: string;
  label: string;
  value: number;
  tone: ChartTone;
};

type Props = {
  segments: StackedSegment[];
  /** total de référence (par défaut : somme des parts) */
  total?: number;
  /** une part est cliquable si fourni */
  onSegmentClick?: (key: string) => void;
  /** part minimale (0–1) pour écrire la valeur dans la barre */
  labelMinShare?: number;
  height?: 'md' | 'lg';
  ariaLabel: string;
  formatValue?: (n: number) => string;
};

/**
 * Barre empilée horizontale (parts d'un total) – HTML, sans bibliothèque.
 * Filet blanc de 2 px entre les parts (tokens.md § 3) ; chaque part a un libellé accessible.
 */
export function StackedBar({
  segments,
  total,
  onSegmentClick,
  labelMinShare = 0.07,
  height = 'lg',
  ariaLabel,
  formatValue = (n) => n.toLocaleString('fr-FR')
}: Props) {
  const tot = total ?? segments.reduce((s, x) => s + x.value, 0);
  const visible = segments.filter((s) => s.value > 0);
  const h = height === 'lg' ? 'h-control' : 'h-3';
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`flex w-full gap-0.5 overflow-hidden rounded-control bg-surface-muted border border-border-subtle ${h}`}
    >
      {visible.length === 0 && <div className="flex-1 bg-border-subtle" aria-hidden="true" />}
      {visible.map((s) => {
        const share = tot ? s.value / tot : 0;
        const pctTxt = `${Math.round(share * 100)} %`;
        const text = height === 'lg' && share >= labelMinShare && TONE_ON[s.tone] ? formatValue(s.value) : '';
        const cls = `flex items-center justify-center text-mention font-semibold tabular-nums first:rounded-l-control last:rounded-r-control ${TONE_BG[s.tone]} ${
          TONE_ON[s.tone] ?? ''
        }`;
        const label = `${s.label} : ${formatValue(s.value)} (${pctTxt})`;
        return onSegmentClick ? (
          <button
            key={s.key}
            type="button"
            style={{ flex: Math.max(s.value, 0.0001) }}
            className={`${cls} transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus focus-visible:ring-inset`}
            title={label}
            aria-label={label}
            onClick={() => onSegmentClick(s.key)}
          >
            {text}
          </button>
        ) : (
          <div
            key={s.key}
            style={{ flex: Math.max(s.value, 0.0001) }}
            className={cls}
            title={label}
            aria-label={label}
            role="img"
          >
            {text}
          </div>
        );
      })}
    </div>
  );
}
