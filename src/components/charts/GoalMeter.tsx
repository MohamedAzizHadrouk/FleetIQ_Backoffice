import { TONE_BG, type ChartTone } from './chartTones';

type Props = {
  /** valeur en % (0–100) */
  value: number;
  /** objectif en % : repère vertical */
  goal?: number;
  tone: ChartTone;
  label: string;
};

/** Jauge horizontale avec repère d'objectif (cartes « L'essentiel »). */
export function GoalMeter({ value, goal, tone, label }: Props) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <span className="relative block h-2 w-full rounded-pill bg-border-subtle" role="img" aria-label={label} title={label}>
      <span className={`absolute inset-y-0 left-0 rounded-pill ${TONE_BG[tone]}`} style={{ width: `${v}%` }} />
      {goal != null && (
        <span
          className="absolute -top-1 -bottom-1 w-0.5 rounded-pill bg-text"
          style={{ left: `calc(${Math.max(0, Math.min(100, goal))}% - 1px)` }}
          aria-hidden="true"
        />
      )}
    </span>
  );
}
