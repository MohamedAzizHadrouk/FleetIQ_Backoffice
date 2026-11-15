/**
 * Petits éléments partagés de la page Équipements v3 (carte FleetIQ 07) : pastille d'état, ligne d'équipement
 * cliquable (ouvre la fiche EQ-F-11) et panneau « détail à droite » des 4 états.
 * Couleurs : jetons d'état TUNAV ; la couleur ne porte jamais l'information seule (icône + texte).
 */
import type { ReactNode } from 'react';
import { ArrowRight, Boxes, Clock, Wifi, WifiOff } from 'lucide-react';
import { fmt, pct, rowFollowUp, STATE_LABELS, type EqRow, type EqState, type StateCounts } from '../../utils/equipmentsKpis';

const BADGE: Record<EqState, { cls: string; Icon: typeof Wifi }> = {
  connected: { cls: 'bg-success-50 text-success-700 border-success-200', Icon: Wifi },
  not_connected: { cls: 'bg-danger-50 text-danger-700 border-danger-200', Icon: WifiOff },
  not_installed: { cls: 'bg-warning-50 text-warning-700 border-warning-200', Icon: Clock },
  stock: { cls: 'bg-border-subtle text-text border-border', Icon: Boxes }
};

export function StateBadge({ state, label }: { state: EqState; label?: string }) {
  const { cls, Icon } = BADGE[state];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap px-2 py-0.5 rounded-control border text-mention font-medium ${cls}`}>
      <Icon size={12} aria-hidden="true" />
      {label ?? STATE_LABELS[state]}
    </span>
  );
}

/** Ligne d'équipement d'une liste de détail : clic = fiche */
export function EqListItem({ row, onOpen, showNetwork }: { row: EqRow; onOpen: (r: EqRow) => void; showNetwork?: boolean }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(row)}
        className="flex w-full items-start gap-3 px-2 py-2 text-left rounded-control hover:bg-primary-50 transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
      >
        <span className="flex-1 min-w-0">
          <span className="block truncate text-small font-medium text-text">
            <span className="font-mono">{row.eq.serial}</span> · {row.type}
          </span>
          <span className="block truncate text-mention text-text-muted">
            {row.owner}
            {showNetwork ? ` · ${row.network}` : ''} · {row.packName}
          </span>
        </span>
        <span className="shrink-0 text-right">
          <StateBadge state={row.state} />
          <span className="block mt-0.5 text-mention text-text-muted">{rowFollowUp(row)}</span>
        </span>
      </button>
    </li>
  );
}

/** Liste d'équipements limitée (n premiers) + lien « voir dans le tableau » */
export function EqShortList({
  title,
  rows,
  max = 8,
  onOpen,
  onShowAll,
  showNetwork
}: {
  title: string;
  rows: EqRow[];
  max?: number;
  onOpen: (r: EqRow) => void;
  onShowAll?: () => void;
  showNetwork?: boolean;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 px-2">
        <h4 className="text-small font-semibold text-text">
          {title} · {fmt(rows.length)}
        </h4>
        {onShowAll && rows.length > 0 && (
          <button
            type="button"
            onClick={onShowAll}
            className="inline-flex items-center gap-1 text-mention font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus rounded-control"
          >
            Voir dans le tableau <ArrowRight size={12} aria-hidden="true" />
          </button>
        )}
      </div>
      {rows.length === 0 ? (
        <p className="px-2 py-2 text-mention text-text-muted">Aucun équipement.</p>
      ) : (
        <ul className="divide-y divide-border-subtle">
          {rows.slice(0, max).map((r) => (
            <EqListItem key={r.eq.id} row={r} onOpen={onOpen} showNetwork={showNetwork} />
          ))}
        </ul>
      )}
      {rows.length > max && <p className="px-2 pt-1 text-mention text-text-muted">+ {fmt(rows.length - max)} autre(s)</p>}
    </div>
  );
}

/** Les 4 états en % (installés / non installés sur les vendus ; connectés / non connectés sur les installés) */
export function StatesLines({ counts }: { counts: StateCounts }) {
  const lines: Array<{ state: EqState; label: string; n: number; of: number; base: string }> = [
    { state: 'connected', label: 'Installés', n: counts.installed, of: counts.sold, base: 'vendus' },
    { state: 'not_installed', label: 'Non installés', n: counts.notInstalled, of: counts.sold, base: 'vendus' },
    { state: 'connected', label: 'Connectés', n: counts.connected, of: counts.installed, base: 'installés' },
    { state: 'not_connected', label: 'Non connectés', n: counts.notConnected, of: counts.installed, base: 'installés' }
  ];
  return (
    <dl className="grid grid-cols-2 gap-2">
      {lines.map((l) => (
        <div key={l.label} className="rounded-control border border-border-subtle bg-surface-muted px-3 py-2">
          <dt className="text-mention text-text-muted">{l.label}</dt>
          <dd className="flex items-baseline gap-2">
            <span className="text-h4 text-text tabular-nums">{pct(l.n, l.of)} %</span>
            <span className="text-mention text-text-muted tabular-nums">
              {fmt(l.n)} / {fmt(l.of)} {l.base}
            </span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Panneau de détail à droite d'un graphique de « Répartition » */
export function DetailPanel({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
  return (
    <aside className="rounded-card border border-border-subtle bg-surface p-4 space-y-3 min-w-0" aria-live="polite">
      <div>
        <h4 className="text-small font-semibold text-text">{title}</h4>
        {sub && <p className="text-mention text-text-muted">{sub}</p>}
      </div>
      {children}
    </aside>
  );
}
