/**
 * Détail d'une carte « L'essentiel » : évolution sur 12 mois + objectif de l'année.
 * L'objectif se saisit dans le champ « Objectif <année> » ; il est tracé en pointillés sur la courbe
 * et repris par la carte (jauge, pastille). Il est gardé sur ce poste (par carte et par année).
 */
import { useState } from 'react';
import { LineChart } from '../charts';
import { fmt, type GoalKpi } from '../../utils/dashboardKpis';

const KEY = 'fiq-tdb-objectifs';

export function readObjectives(): Record<string, number> {
  try {
    const v = JSON.parse(window.localStorage.getItem(KEY) ?? '{}');
    return v && typeof v === 'object' ? v : {};
  } catch {
    return {};
  }
}

function writeObjectives(all: Record<string, number>) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // poste sans stockage : l'objectif reste valable jusqu'à la fermeture de la page
  }
}

export const objectiveKey = (kpiId: string, year: number) => `${kpiId}-${year}`;

type Props = {
  kpi: GoalKpi;
  year: number;
  /** objectif enregistré pour cette carte et cette année (sinon l'objectif par défaut de la carte) */
  initial: number | null;
  onChange: (key: string, value: number | null) => void;
};

export function KpiTrend({ kpi, year, initial, onChange }: Props) {
  const isRate = kpi.of != null;
  const trend = kpi.trend ?? [];
  const [draft, setDraft] = useState(initial != null ? String(initial) : kpi.goal != null ? String(kpi.goal) : '');
  const n = draft.trim() === '' ? null : Number(draft.replace(',', '.'));
  const goal = n != null && Number.isFinite(n) && n >= 0 && (!isRate || n <= 100) ? n : null;
  const invalid = draft.trim() !== '' && goal == null;

  const save = (value: string) => {
    setDraft(value);
    const v = value.trim() === '' ? null : Number(value.replace(',', '.'));
    const ok = v == null || (Number.isFinite(v) && v >= 0 && (!isRate || v <= 100));
    if (!ok) return;
    const all = readObjectives();
    const k = objectiveKey(kpi.id, year);
    if (v == null) delete all[k];
    else all[k] = v;
    writeObjectives(all);
    onChange(k, v);
  };

  const values = trend.map((t) => t.value);
  const low = Math.min(...values, goal ?? Infinity);

  return (
    <div className="rounded-control border border-border-subtle px-3 pt-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-mention font-semibold uppercase tracking-[0.06em] text-text-muted">Évolution sur 12 mois</p>
        <label className="inline-flex items-center gap-2 text-small text-text">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-0 w-5 border-t-2 border-dashed border-success" aria-hidden="true" />
            Objectif {year}
          </span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            max={isRate ? 100 : undefined}
            step={1}
            value={draft}
            onChange={(e) => save(e.target.value)}
            aria-label={`Objectif ${year} pour ${kpi.label}`}
            aria-invalid={invalid || undefined}
            className={`h-control w-20 rounded-control border px-2 text-right font-mono text-small focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/25 ${
              invalid ? 'border-danger' : 'border-border-strong'
            }`}
          />
          <span className="text-text-muted">{isRate ? '%' : kpi.unit}</span>
        </label>
      </div>
      {invalid && <p className="text-mention text-danger-700">{isRate ? 'Entre 0 et 100 %' : 'Nombre positif'}</p>}
      <LineChart
        height={190}
        labels={trend.map((t) => t.label)}
        min={isRate ? Math.max(0, Math.floor(low) - 5) : 0}
        showAllValues
        goal={goal}
        goalLabel={`Objectif ${year} :`}
        formatValue={(v) => (isRate ? `${v} %` : fmt(v))}
        series={[{ key: kpi.id, label: kpi.label, values, tone: 'series1' }]}
        ariaLabel={`Évolution sur 12 mois de ${kpi.label}${goal != null ? `, objectif ${year} ${isRate ? `${goal} %` : fmt(goal)}` : ''}`}
      />
    </div>
  );
}
