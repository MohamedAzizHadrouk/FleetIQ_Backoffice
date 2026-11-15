import { TONE_STROKE, type ChartTone } from './chartTones';

export type RingSegment = { label: string; value: number; tone: ChartTone };

type Props = {
  segments: RingSegment[];
  /** texte central (ex. « 82 % ») */
  centerLabel: string;
  /** petit texte sous le centre (ex. « connectés ») */
  centerSub?: string;
  size?: number;
  thickness?: number;
  /** total de référence (par défaut : somme des parts) */
  total?: number;
};

/**
 * Anneau (donut) SVG fait main : parts proportionnelles, texte au centre.
 * Décoratif pour les lecteurs d'écran (aria-hidden) : le composant parent porte le libellé complet.
 */
export function DonutRing({ segments, centerLabel, centerSub, size = 112, thickness = 15, total }: Props) {
  const r = (size - thickness) / 2;
  const circ = 2 * Math.PI * r;
  const tot = total ?? segments.reduce((s, x) => s + x.value, 0);
  const c = size / 2;
  let offset = 0;
  const arcs = tot
    ? segments
        .filter((s) => s.value > 0)
        .map((s) => {
          const len = (s.value / tot) * circ;
          const el = (
            <circle
              key={s.label}
              cx={c}
              cy={c}
              r={r}
              fill="none"
              strokeWidth={thickness}
              className={TONE_STROKE[s.tone]}
              strokeDasharray={`${Math.max(len - 2, 0.5)} ${circ}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${c} ${c})`}
            />
          );
          offset += len;
          return el;
        })
    : [];
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" focusable="false">
      <circle cx={c} cy={c} r={r} fill="none" strokeWidth={thickness} className="stroke-chart-grid" />
      {arcs}
      <text x="50%" y={centerSub ? c + 2 : c + 7} textAnchor="middle" className="fill-text text-h4 font-semibold tabular-nums">
        {centerLabel}
      </text>
      {centerSub && (
        <text x="50%" y={c + 19} textAnchor="middle" className="fill-text-muted text-mention">
          {centerSub}
        </text>
      )}
    </svg>
  );
}
