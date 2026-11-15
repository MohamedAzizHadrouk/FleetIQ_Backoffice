import { TONE_FILL, type ChartTone } from './chartTones';

export type BarDatum = { label: string; value: number; tone?: ChartTone };

type Props = {
  data: BarDatum[];
  ariaLabel: string;
  height?: number;
  tone?: ChartTone;
  formatValue?: (n: number) => string;
  onBarClick?: (index: number) => void;
  /** ligne de référence en pointillé (ex. forfait des puces – carte FleetIQ 09) */
  refLine?: { value: number; label: string };
  /** barre surlignée */
  selectedIndex?: number | null;
};

/**
 * Histogramme vertical SVG fait main : grille 1 px (chart-grid), valeur écrite au-dessus de chaque barre,
 * libellés en Gris texte. Largeur fluide (viewBox), pas de bibliothèque.
 */
export function BarChart({
  data,
  ariaLabel,
  height = 160,
  tone = 'series1',
  formatValue = (n) => n.toLocaleString('fr-FR'),
  onBarClick,
  refLine,
  selectedIndex = null
}: Props) {
  const width = 480;
  const padTop = 22;
  const padBottom = 24;
  const plotH = height - padTop - padBottom;
  const max = Math.max(1, refLine?.value ?? 0, ...data.map((d) => d.value));
  const step = width / Math.max(1, data.length);
  const barW = Math.min(48, step * 0.6);
  const gridLines = [0, 0.5, 1];
  const refY = refLine ? padTop + plotH * (1 - refLine.value / max) : 0;
  return (
    <figure className="w-full" aria-label={ariaLabel} role="group">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label={ariaLabel}>
        {gridLines.map((g) => {
          const y = padTop + plotH * (1 - g);
          return <line key={g} x1={0} x2={width} y1={y} y2={y} strokeWidth={1} className="stroke-chart-grid" />;
        })}
        {selectedIndex != null && <rect x={selectedIndex * step} y={padTop} width={step} height={plotH} className="fill-primary-50" />}
        {data.map((d, i) => {
          const h = (d.value / max) * plotH;
          const x = i * step + (step - barW) / 2;
          const y = padTop + plotH - h;
          return (
            <g
              key={d.label + i}
              className={onBarClick ? 'cursor-pointer' : undefined}
              onClick={onBarClick ? () => onBarClick(i) : undefined}
            >
              <title>{`${d.label} : ${formatValue(d.value)}`}</title>
              <rect x={x} y={y} width={barW} height={Math.max(h, d.value ? 2 : 0)} rx={4} className={TONE_FILL[d.tone ?? tone]} />
              <text x={x + barW / 2} y={y - 6} textAnchor="middle" className="fill-text text-mention font-medium tabular-nums">
                {formatValue(d.value)}
              </text>
              <text
                x={x + barW / 2}
                y={height - 6}
                textAnchor="middle"
                className={`text-mention ${selectedIndex === i ? 'fill-primary font-semibold' : 'fill-text-muted'}`}
              >
                {d.label}
              </text>
            </g>
          );
        })}
        {refLine && refLine.value > 0 && (
          <g>
            <line x1={0} x2={width} y1={refY} y2={refY} strokeWidth={1.5} strokeDasharray="5 4" className="stroke-danger" />
            <text x={width - 4} y={refY - 4} textAnchor="end" className="fill-danger-700 text-mention font-medium">
              {refLine.label}
            </text>
          </g>
        )}
      </svg>
    </figure>
  );
}
