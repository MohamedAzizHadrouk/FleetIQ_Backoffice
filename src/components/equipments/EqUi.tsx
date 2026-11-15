/**
 * Éléments partagés Équipements – Industrial Tech (T-002).
 * « Non installé » = Attention + Clock (T-001).
 */
import type { ReactNode } from 'react';
import { ArrowRight, Boxes, Clock, Wifi, WifiOff } from 'lucide-react';
import { fmt, pct, rowFollowUp, STATE_LABELS, type EqRow, type EqState, type StateCounts } from '../../utils/equipmentsKpis';
import { StatusTag, type StatusFamily } from '../ui/StatusTag';
import { FOCUS, TRANSITION } from '../ui/focus';

const BADGE: Record<EqState, { family: StatusFamily; Icon: typeof Wifi }> = {
  connected: { family: 'success', Icon: Wifi },
  not_connected: { family: 'danger', Icon: WifiOff },
  not_installed: { family: 'warning', Icon: Clock },
  stock: { family: 'neutral', Icon: Boxes }
};

export function StateBadge({ state, label }: { state: EqState; label?: string }) {
  const { family, Icon } = BADGE[state];
  return <StatusTag label={label ?? STATE_LABELS[state]} family={family} icon={Icon} />;
}

export function EqListItem({ row, onOpen, showNetwork }: { row: EqRow; onOpen: (r: EqRow) => void; showNetwork?: boolean }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(row)}
        className={`flex w-full items-start gap-3 px-2 py-2 text-left rounded-control hover:bg-surface-muted ${TRANSITION} ${FOCUS}`}
      >
        <span className="flex-1 min-w-0">
          <span className="block truncate text-small font-medium text-text">
            <span className="text-mention tracking-[0.03em] text-text-muted">{row.eq.serial}</span> · {row.type}
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
            className={`inline-flex items-center gap-1 text-mention font-medium text-primary hover:underline rounded-control ${FOCUS}`}
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
            <span className="text-section text-text">{pct(l.n, l.of)} %</span>
            <span className="text-mention text-text-muted">
              {fmt(l.n)} / {fmt(l.of)} {l.base}
            </span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function DetailPanel({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
  return (
    <aside className="rounded-card border border-border bg-surface p-4 space-y-3 min-w-0" aria-live="polite">
      <div>
        <h4 className="text-section text-text">{title}</h4>
        {sub && <p className="text-mention text-text-muted">{sub}</p>}
      </div>
      {children}
    </aside>
  );
}
