import { TONE_FILL, type ChartTone } from './chartTones';

export type ColumnSeries = { key: string; label: string; tone: ChartTone };
export type ColumnDatum = { label: string; values: number[] };

type Props = {
  data: ColumnDatum[];
  series: ColumnSeries[];
  /** barres empilées (parts d'un total) ou côte à côte (comparaison) */
  mode: 'stacked' | 'grouped';
  ariaLabel: string;
  height?: number;
  selectedIndex?: number | null;
  onColumnClick?: (index: number) => void;
  formatValue?: (n: number) => string;
};

/**
 * Histogramme multi-séries SVG fait main (carte FleetIQ 06 : D-03 côte à côte, D-04 empilé).
 * Filet blanc de 2 px entre les parts empilées (tokens.md § 3) ; la valeur est toujours écrite (total ou par barre).
 */
export function ColumnChart({
  data,
  series,
  mode,
  ariaLabel,
  height = 180,
  selectedIndex = null,
  onColumnClick,
  formatValue = (n) => n.toLocaleString('fr-FR')
}: Props) {
  const width = 640;
  const padTop = 20;
  const padBottom = 24;
  const plotH = height - padTop - padBottom;
  const totals = data.map((d) => d.values.reduce((s, v) => s + v, 0));
  const max = Math.max(1, ...(mode === 'stacked' ? totals : data.flatMap((d) => d.values)));
  const step = width / Math.max(1, data.length);
  const groupW = Math.min(64, step * 0.7);
  const barW = mode === 'stacked' ? groupW : groupW / Math.max(1, series.length);
  return (
    <figure className="w-full" role="group" aria-label={ariaLabel}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label={ariaLabel}>
        {[0, 0.5, 1].map((g) => (
          <line key={g} x1={0} x2={width} y1={padTop + plotH * (1 - g)} y2={padTop + plotH * (1 - g)} strokeWidth={1} className="stroke-chart-grid" />
        ))}
        {data.map((d, i) => {
          const x0 = i * step + (step - groupW) / 2;
          const selected = selectedIndex === i;
          let acc = 0;
          return (
            <g
              key={d.label + i}
              className={onColumnClick ? 'cursor-pointer' : undefined}
              onClick={onColumnClick ? () => onColumnClick(i) : undefined}
            >
              <title>{`${d.label} : ${series.map((s, si) => `${s.label} ${formatValue(d.values[si] ?? 0)}`).join(' · ')}`}</title>
              {selected && <rect x={i * step + 2} y={padTop - 16} width={step - 4} height={plotH + 16} rx={6} className="fill-primary-50" />}
              {onColumnClick && <rect x={i * step} y={0} width={step} height={height} className="fill-transparent" />}
              {series.map((s, si) => {
                const v = d.values[si] ?? 0;
                const h = (v / max) * plotH;
                if (mode === 'stacked') {
                  const yTop = padTop + plotH - acc - h;
                  acc += h;
                  return v ? <rect key={s.key} x={x0} y={yTop} width={barW} height={h} stroke="white" strokeWidth={2} className={TONE_FILL[s.tone]} /> : null;
                }
                const x = x0 + si * barW;
                const yTop = padTop + plotH - h;
                return (
                  <g key={s.key}>
                    <rect x={x + 1} y={yTop} width={barW - 2} height={Math.max(h, v ? 2 : 0)} rx={3} className={TONE_FILL[s.tone]} />
                    <text x={x + barW / 2} y={yTop - 4} textAnchor="middle" className="fill-text text-mention font-medium tabular-nums">
                      {formatValue(v)}
                    </text>
                  </g>
                );
              })}
              {mode === 'stacked' && (
                <text x={x0 + groupW / 2} y={padTop + plotH - acc - 5} textAnchor="middle" className="fill-text text-mention font-medium tabular-nums">
                  {formatValue(totals[i])}
                </text>
              )}
              <text
                x={i * step + step / 2}
                y={height - 6}
                textAnchor="middle"
                className={`text-mention ${selected ? 'fill-primary font-semibold' : 'fill-text-muted'}`}
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
