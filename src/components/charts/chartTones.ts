/**
 * Couleurs des graphiques faits main (SVG / HTML) – jetons TUNAV uniquement (tokens.md § 3 et § 10.4).
 * Les classes sont écrites en entier pour que Tailwind les génère.
 * - Séries ordinaires : chart-1 (Bleu Royal), chart-2 (Bleu Ciel, toujours avec valeur affichée), chart-3, chart-4.
 * - États (connecté, non connecté, non installé…) : couleurs d'état, jamais comme séries ordinaires.
 */
export type ChartTone =
  | 'series1'
  | 'series2'
  | 'series3'
  | 'series4'
  | 'success'
  | 'danger'
  | 'warning'
  | 'neutral';

/** Fond (barres HTML, pastilles de légende) */
export const TONE_BG: Record<ChartTone, string> = {
  series1: 'bg-chart-1',
  series2: 'bg-chart-2',
  series3: 'bg-chart-3',
  series4: 'bg-chart-4',
  success: 'bg-success',
  danger: 'bg-danger',
  warning: 'bg-warning',
  neutral: 'bg-chart-3'
};

/** Remplissage SVG */
export const TONE_FILL: Record<ChartTone, string> = {
  series1: 'fill-chart-1',
  series2: 'fill-chart-2',
  series3: 'fill-chart-3',
  series4: 'fill-chart-4',
  success: 'fill-success',
  danger: 'fill-danger',
  warning: 'fill-warning',
  neutral: 'fill-chart-3'
};

/** Trait SVG */
export const TONE_STROKE: Record<ChartTone, string> = {
  series1: 'stroke-chart-1',
  series2: 'stroke-chart-2',
  series3: 'stroke-chart-3',
  series4: 'stroke-chart-4',
  success: 'stroke-success',
  danger: 'stroke-danger',
  warning: 'stroke-warning',
  neutral: 'stroke-chart-3'
};

/** Texte lisible posé sur le fond de la teinte (contraste ≥ 4,5:1) ; null = ne rien écrire dans la barre */
export const TONE_ON: Record<ChartTone, string | null> = {
  series1: 'text-text-inverse',
  series2: null, // Bleu Ciel : 3:1 seulement – valeur affichée à côté
  series3: 'text-text-inverse',
  series4: null, // Gris : 4,48:1 – valeur affichée à côté
  success: 'text-text-inverse',
  danger: 'text-text-inverse',
  warning: 'text-text-inverse',
  neutral: 'text-text-inverse'
};
