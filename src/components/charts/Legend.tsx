import { TONE_BG, type ChartTone } from './chartTones';

/** Pastille de légende : couleur + libellé (la couleur ne porte jamais l'information seule). */
export function LegendKey({ tone, label }: { tone: ChartTone; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-mention text-text-muted">
      <span className={`inline-block h-2.5 w-2.5 rounded-pill ${TONE_BG[tone]}`} aria-hidden="true" />
      {label}
    </span>
  );
}

export function Legend({ items }: { items: Array<{ tone: ChartTone; label: string }> }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
      {items.map((it) => (
        <LegendKey key={it.label} tone={it.tone} label={it.label} />
      ))}
    </div>
  );
}
