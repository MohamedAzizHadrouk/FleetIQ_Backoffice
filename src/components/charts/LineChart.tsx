import { TONE_FILL, TONE_STROKE, type ChartTone } from './chartTones';

export type LineSeries = {
  key: string;
  label: string;
  /** null = pas de point (mois à venir) */
  values: Array<number | null>;
  tone: ChartTone;
  dashed?: boolean;
};

type Props = {
  labels: string[];
  series: LineSeries[];
  ariaLabel: string;
  height?: number;
  selectedIndex?: number | null;
  onPointClick?: (index: number) => void;
  formatValue?: (n: number) => string;
};

/**
 * Courbes SVG faites main (carte FleetIQ 06, C-01) : grille 1 px, axe des mois, 4 séries au plus (tokens.md § 3).
 * La dernière valeur de chaque série est écrite à côté du point ; le mois sélectionné est surligné.
 */
export function LineChart({
  labels,
  series,
  ariaLabel,
  height = 200,
  selectedIndex = null,
  onPointClick,
  formatValue = (n) => n.toLocaleString('fr-FR')
}: Props) {
  const width = 640;
  const padL = 40;
  const padR = 48;
  const padTop = 14;
  const padBottom = 24;
  const plotW = width - padL - padR;
  const plotH = height - padTop - padBottom;
  const all = series.flatMap((s) => s.values.filter((v): v is number => v != null));
  const max = Math.max(1, ...all);
  const step = plotW / Math.max(1, labels.length - 1);
  const x = (i: number) => padL + i * step;
  const y = (v: number) => padTop + plotH * (1 - v / max);
  const grid = [0, 0.5, 1];
  return (
    <figure className="w-full" role="group" aria-label={ariaLabel}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label={ariaLabel}>
        {grid.map((g) => (
          <g key={g}>
            <line x1={padL} x2={width - padR} y1={padTop + plotH * (1 - g)} y2={padTop + plotH * (1 - g)} strokeWidth={1} className="stroke-chart-grid" />
            <text x={padL - 6} y={padTop + plotH * (1 - g) + 4} textAnchor="end" className="fill-text-muted text-mention tabular-nums">
              {formatValue(Math.round(max * g))}
            </text>
          </g>
        ))}
        {selectedIndex != null && (
          <rect x={x(selectedIndex) - step / 2} y={padTop} width={step} height={plotH} className="fill-primary-50" />
        )}
        {labels.map((l, i) => (
          <text
            key={l + i}
            x={x(i)}
            y={height - 6}
            textAnchor="middle"
            className={`text-mention ${selectedIndex === i ? 'fill-primary font-semibold' : 'fill-text-muted'}`}
          >
            {l}
          </text>
        ))}
        {series.map((s) => {
          const pts = s.values.map((v, i) => (v == null ? null : ([x(i), y(v)] as const)));
          const d = pts
            .map((p, i) => (p ? `${i === 0 || !pts[i - 1] ? 'M' : 'L'}${p[0].toFixed(1)} ${p[1].toFixed(1)}` : ''))
            .join(' ');
          const lastI = s.values.reduce<number>((acc, v, i) => (v != null ? i : acc), -1);
          return (
            <g key={s.key}>
              <path
                d={d}
                fill="none"
                strokeWidth={2}
                strokeDasharray={s.dashed ? '5 4' : undefined}
                strokeLinecap="round"
                strokeLinejoin="round"
                className={TONE_STROKE[s.tone]}
              />
              {pts.map((p, i) =>
                p ? (
                  <circle key={i} cx={p[0]} cy={p[1]} r={selectedIndex === i ? 4.5 : 3} className={TONE_FILL[s.tone]}>
                    <title>{`${s.label} · ${labels[i]} : ${formatValue(s.values[i] ?? 0)}`}</title>
                  </circle>
                ) : null
              )}
              {lastI >= 0 && (
                <text x={x(lastI) + 8} y={y(s.values[lastI] ?? 0) + 4} className="fill-text text-mention font-medium tabular-nums">
                  {formatValue(s.values[lastI] ?? 0)}
                </text>
              )}
            </g>
          );
        })}
        {onPointClick &&
          labels.map((l, i) => (
            <rect
              key={`hit-${l}-${i}`}
              x={x(i) - step / 2}
              y={padTop}
              width={step}
              height={plotH + padBottom}
              className="fill-transparent cursor-pointer"
              onClick={() => onPointClick(i)}
            >
              <title>{l}</title>
            </rect>
          ))}
      </svg>
    </figure>
  );
}
