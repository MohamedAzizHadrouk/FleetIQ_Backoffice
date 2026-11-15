/**
 * Graphiques faits main (SVG / HTML), sans dépendance – carte FleetIQ 05 (+ LineChart, ColumnChart en carte 06).
 * Couleurs : jetons TUNAV seulement (chartTones.ts) ; 4 séries maximum ; la valeur est toujours écrite.
 */
export { BarChart, type BarDatum } from './BarChart';
export { HorizontalBarList, type HBarRow } from './HorizontalBarList';
export { DonutRing, type RingSegment } from './DonutRing';
export { StackedBar, type StackedSegment } from './StackedBar';
export { Sparkline } from './Sparkline';
export { GoalMeter } from './GoalMeter';
export { Legend, LegendKey } from './Legend';
export { LineChart, type LineSeries } from './LineChart';
export { ColumnChart, type ColumnSeries, type ColumnDatum } from './ColumnChart';
export { TONE_BG, TONE_FILL, TONE_STROKE, TONE_ON, type ChartTone } from './chartTones';
