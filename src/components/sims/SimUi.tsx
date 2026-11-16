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
  const detail = DETAIL_LABEL[row.detail];
  return (
    <span className="inline-flex" title={detail}>
      <StatusTagFromLabel label="Non installée" />
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
    <nav
      aria-label={label}
      className="flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle bg-surface-muted/60 px-4 py-3 text-mention text-text-muted"
    >
      <label className="inline-flex items-center gap-2">
        <select
          value={size}
          onChange={(e) => pager.setSize(Number(e.target.value))}
          aria-label="Lignes par page"
          className="h-control-sm rounded-control border border-border-strong bg-surface px-2 text-small focus-visible:border-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/25"
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

/** Liste paginée de puces (popups) – densifiée sans empiler 3–4 lignes par cellule. */
export function SimMiniList({
  rows,
  onOpen,
  columns = ['conso', 'status'],
  showPrices,
  initialSize = 5,
  hideOffer = false
}: {
  rows: SimRow[];
  onOpen: (r: SimRow) => void;
  columns?: MiniColumn[];
  showPrices: boolean;
  initialSize?: number;
  /** Masquer la colonne Offre (ex. popup déjà titré avec le nom de l’offre). */
  hideOffer?: boolean;
}) {
  const pager = usePager(rows, initialSize);
  const cols = columns.filter((c) => c !== 'price' || showPrices);
  if (!rows.length) return <p className="py-6 text-center text-small text-text-muted">Aucune puce.</p>;
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
        <table className="w-full min-w-[36rem] text-left text-small text-text">
          <thead>
            <tr className="border-b border-border bg-surface-muted text-overline uppercase tracking-wide text-text-muted">
              <th className="px-4 py-3 font-medium">Puce</th>
              <th className="px-4 py-3 font-medium">Client</th>
              {!hideOffer && <th className="px-4 py-3 font-medium">Offre</th>}
              {cols.map((c) => (
                <th key={c} className="px-4 py-3 text-right font-medium">
                  {head[c]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {pager.slice.map((r) => {
              const subClient = [r.networkLabel, r.eq?.serial].filter(Boolean).join(' · ');
              const detailHint = !r.installed ? DETAIL_LABEL[r.detail] : undefined;
              return (
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
                  className="cursor-pointer transition-colors duration-fast ease-standard hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-focus"
                >
                  <td className="px-4 py-3 align-middle">
                    <div className="font-medium text-text leading-snug">{r.sim.phoneNumber || 'Pas de numéro'}</div>
                    <div className="mt-1 text-mention tabular-nums text-text-muted">ICCID · {r.sim.id}</div>
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <div className="font-medium text-text leading-snug">{r.clientLabel}</div>
                    {subClient && <div className="mt-1 truncate text-mention text-text-muted" title={subClient}>{subClient}</div>}
                  </td>
                  {!hideOffer && (
                    <td className="max-w-[10rem] truncate px-4 py-3 align-middle text-text-muted" title={r.offer?.name ?? 'Aucune offre'}>
                      {r.offer ? r.offer.name : 'Aucune offre'}
                    </td>
                  )}
                  {cols.map((c) => (
                    <td key={c} className="px-4 py-3 text-right align-middle tabular-nums">
                      {c === 'conso' && (
                        <span className="inline-flex flex-col items-end gap-0.5">
                          <span className="font-medium">{volume(r.usage.used)}</span>
                          {r.usage.quota != null && (
                            <span className="text-mention text-text-muted">/ {volume(r.usage.quota)}</span>
                          )}
                        </span>
                      )}
                      {c === 'excess' &&
                        (r.usage.excess > 0.5 ? (
                          <b className="text-danger-700">{plusVolume(r.usage.excess)}</b>
                        ) : (
                          <span className="text-text-muted">—</span>
                        ))}
                      {c === 'price' && (r.price != null ? formatTnd(r.price) : '—')}
                      {c === 'pct30' &&
                        (r.pct30 != null ? (
                          <span className="inline-flex flex-col items-end gap-0.5">
                            <span className="font-medium">{fmt(r.pct30)} %</span>
                            <span className="text-mention text-text-muted">{volume(r.used30)}</span>
                          </span>
                        ) : (
                          volume(r.used30)
                        ))}
                      {c === 'status' && (
                        <span className="inline-flex flex-col items-end gap-1">
                          <SimStatusBadge row={r} />
                          {detailHint && (
                            <span className="max-w-[9rem] text-right text-mention leading-snug text-text-muted">{detailHint}</span>
                          )}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
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
          {sub && <p className="mt-1 text-small text-text-muted">{sub}</p>}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}
