/**
 * Gestion des puces v3 – petits éléments partagés (carte FleetIQ 09) : pastille de statut, pagination 5 / 10 / 25 / 50,
 * liste simple de puces cliquable (fenêtres de détail), titre de bloc.
 */
import type { ReactNode } from 'react';
import { PAGE_SIZES, usePager } from './useSimPager';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DETAIL_LABEL, fmt, formatTnd, plusVolume, volume, type SimRow } from '../../utils/simsKpis';
import { StatusTagFromLabel } from '../ui/StatusTag';


export function SimStatusBadge({ row }: { row: SimRow }) {
  if (row.installed) {
    return <StatusTagFromLabel label="Installée" />;
  }
  return (
    <span className="inline-flex flex-col items-start">
      <StatusTagFromLabel label="Non installée" />
      <span className="mt-0.5 text-mention text-text-muted">{DETAIL_LABEL[row.detail]}</span>
    </span>
  );
}

export function Pager({
  pager,
  label = 'Pagination'
}: {
  pager: { size: number; page: number; pages: number; total: number; setSize: (n: number) => void; setPage: (n: number) => void };
  label?: string;
}) {
  const { size, page, pages, total } = pager;
  if (total === 0) return null;
  const from = page * size + 1;
  const to = Math.min(total, from + size - 1);
  const btn =
    'inline-flex h-control-sm w-control-sm items-center justify-center rounded-control border border-border-strong bg-surface text-text hover:bg-surface-muted disabled:bg-surface disabled:text-text-muted disabled:border-border disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface';
  return (
    <nav aria-label={label} className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 border-t border-border-subtle text-mention text-text-muted">
      <label className="inline-flex items-center gap-2">
        <select
          value={size}
          onChange={(e) => pager.setSize(Number(e.target.value))}
          aria-label="Lignes par page"
          className="h-control-sm px-2 border border-border-strong rounded-control bg-surface text-small focus-visible:outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-focus/25"
        >
          {PAGE_SIZES.map((n) => (
            <option key={n} value={n}>
              {n} par page
            </option>
          ))}
        </select>
      </label>
      <span className="inline-flex items-center gap-2">
        <span className="tabular-nums text-text-muted">
          {fmt(from)}–{fmt(to)} sur {fmt(total)}
        </span>
        <button type="button" className={btn} onClick={() => pager.setPage(page - 1)} disabled={page === 0} aria-label="Page précédente">
          <ChevronLeft size={16} aria-hidden="true" />
        </button>
        <span className="tabular-nums">
          {fmt(page + 1)} / {fmt(pages)}
        </span>
        <button type="button" className={btn} onClick={() => pager.setPage(page + 1)} disabled={page >= pages - 1} aria-label="Page suivante">
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </span>
    </nav>
  );
}

export type MiniColumn = 'conso' | 'excess' | 'price' | 'status' | 'pct30';

/** Liste simple et paginée de puces (fenêtres de détail) ; une ligne ouvre la fiche F-21. */
export function SimMiniList({
  rows,
  onOpen,
  columns = ['conso', 'status'],
  showPrices,
  initialSize = 10
}: {
  rows: SimRow[];
  onOpen: (r: SimRow) => void;
  columns?: MiniColumn[];
  showPrices: boolean;
  initialSize?: number;
}) {
  const pager = usePager(rows, initialSize);
  const cols = columns.filter((c) => c !== 'price' || showPrices);
  if (!rows.length) return <p className="py-4 text-center text-small text-text-muted">Aucune puce.</p>;
  const head: Record<MiniColumn, string> = {
    conso: 'Conso',
    excess: 'Dépassement',
    price: 'Prix / mois',
    status: 'Statut',
    pct30: '30 j / forfait'
  };
  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-small text-text">
          <thead>
            <tr className="border-b border-border bg-surface-muted text-overline uppercase text-text-muted">
              <th className="px-3 py-2">Puce</th>
              <th className="px-3 py-2">Client · revendeur</th>
              <th className="px-3 py-2">Offre</th>
              {cols.map((c) => (
                <th key={c} className="px-3 py-2 text-right">
                  {head[c]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {pager.slice.map((r) => (
              <tr
                key={r.sim.id}
                tabIndex={0}
                onClick={() => onOpen(r)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onOpen(r);
                  }
                }}
                className="cursor-pointer hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-focus"
              >
                <td className="px-3 py-2">
                  <span className="block font-medium">{r.sim.phoneNumber || 'Pas de numéro'}</span>
                  <span className="block text-mention text-text-muted">ID {r.sim.id}</span>
                </td>
                <td className="px-3 py-2">
                  <span className="block">{r.clientLabel}</span>
                  <span className="block text-mention text-text-muted">
                    {r.networkLabel}
                    {r.eq ? ` · ${r.eq.serial}` : ''}
                  </span>
                </td>
                <td className="px-3 py-2">{r.offer ? r.offer.name : 'Aucune offre'}</td>
                {cols.map((c) => (
                  <td key={c} className="px-3 py-2 text-right tabular-nums">
                    {c === 'conso' && (
                      <>
                        {volume(r.usage.used)}
                        {r.usage.quota != null && <span className="block text-mention text-text-muted">sur {volume(r.usage.quota)}</span>}
                      </>
                    )}
                    {c === 'excess' && (r.usage.excess > 0.5 ? <b className="text-danger-700">{plusVolume(r.usage.excess)}</b> : '—')}
                    {c === 'price' && (r.price != null ? formatTnd(r.price) : '—')}
                    {c === 'pct30' && (r.pct30 != null ? `${fmt(r.pct30)} % · ${volume(r.used30)}` : volume(r.used30))}
                    {c === 'status' && <SimStatusBadge row={r} />}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager pager={pager} label="Pagination des puces" />
    </div>
  );
}

export function Block({ id, kpiId, title, sub, right, children }: { id: string; kpiId: string; title: string; sub?: ReactNode; right?: ReactNode; children: ReactNode }) {
  return (
    <div data-kpi={kpiId} className="space-y-4 rounded-card border border-border bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 id={id} className="text-h4 text-text">
            {title}
          </h3>
          {sub && <p className="text-small text-text-muted">{sub}</p>}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}
