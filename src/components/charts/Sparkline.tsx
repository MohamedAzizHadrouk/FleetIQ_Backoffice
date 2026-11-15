import { TONE_FILL, TONE_STROKE, type ChartTone } from './chartTones';

type Props = {
  values: number[];
  ariaLabel: string;
  width?: number;
  height?: number;
  tone?: ChartTone;
  /** bornes fixes (ex. 0–100 pour un %) ; sinon min / max des valeurs */
  min?: number;
  max?: number;
};

/** Petite courbe SVG (tendance), point final marqué. Sans axes : la valeur doit être écrite à côté. */
export function Sparkline({ values, ariaLabel, width = 160, height = 40, tone = 'series1', min, max }: Props) {
  if (values.length < 2) return null;
  const lo = min ?? Math.min(...values);
  const hi = max ?? Math.max(...values);
  const span = hi - lo || 1;
  const pad = 4;
  const pts = values.map((v, i) => {
    const x = pad + (i * (width - 2 * pad)) / (values.length - 1);
    const y = pad + (1 - (v - lo) / span) * (height - 2 * pad);
    return [x, y] as const;
  });
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const [lx, ly] = pts[pts.length - 1];
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={ariaLabel}>
      <path d={d} fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={TONE_STROKE[tone]} />
      <circle cx={lx} cy={ly} r={3.5} className={TONE_FILL[tone]} />
    </svg>
  );
}
