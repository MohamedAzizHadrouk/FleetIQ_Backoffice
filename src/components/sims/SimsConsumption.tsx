/**
 * Gestion des puces v3 – « Consommation data » (carte FleetIQ 09) :
 * - PU-C-21 : tableau en arbre revendeur → clients → puces (Par client / Par revendeur), recherche client, filtre de
 *   consommation, pagination 5 / 10 / 25 / 50. Colonnes : puces (dont installées), conso / mois (et par puce), forfait par
 *   mois des puces installées, utilisé du forfait (jauge), dépassement, écart avec la période précédente.
 *   Le % utilisé ne compte que les puces installées avec forfait. Colonnes « Consommation » et « Coût / mois » retirées.
 * - PU-C-25 : puces en surconsommation par revendeur (barres rouges) ; clic = liste des puces.
 * Aucun prix dans ce bloc.
 */
import { Fragment, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';
import { HorizontalBarList } from '../charts';
import { Block, Pager, SimStatusBadge } from './SimUi';
import { usePager } from './useSimPager';
import {
  CONS_FILTERS,
  fmt,
  groupConsumption,
  matchesConsFilter,
  pct,
  plusVolume,
  usedPct,
  volume,
  type ConsFilter,
  type ConsGroup,
  type OverNetwork,
  type SimPeriod,
  type SimRow,
  type SimsData
} from '../../utils/simsKpis';

type Props = {
  data: SimsData;
  period: SimPeriod;
  onOpenSim: (r: SimRow) => void;
  onOverNetwork: (n: OverNetwork) => void;
};

function Gauge({ value }: { value: number | null }) {
  if (value == null) return <span className="text-mention text-text-muted">illimité</span>;
  const tone = value > 100 ? 'bg-danger' : value >= 80 ? 'bg-warning' : 'bg-primary';
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-1.5 w-20 overflow-hidden rounded-pill bg-border-subtle" aria-hidden="true">
        <span className={`block h-full rounded-pill ${tone}`} style={{ width: `${Math.min(100, value)}%` }} />
      </span>
      <span className={`tabular-nums ${value > 100 ? 'font-semibold text-danger-700' : 'text-text'}`}>{fmt(value)} %</span>
    </span>
  );
}

function Delta({ now, before }: { now: number; before: number | null }) {
  if (before == null || before < 1) return <span className="text-text-muted">—</span>;
  const p = Math.round(((now - before) * 100) / before);
  return <span className={p > 0 ? 'text-warning-700' : 'text-text'}>{p > 0 ? '+' : p < 0 ? '−' : ''}{fmt(Math.abs(p))} %</span>;
}

function GroupCells({ g, period, share }: { g: ConsGroup; period: SimPeriod; share?: number }) {
  const perMonth = g.used / Math.max(0.01, period.monthsCount);
  const quotaMonth = g.quotaInstalled / Math.max(0.01, period.monthsCount);
  return (
    <>
      <td className="px-3 py-2.5 text-right tabular-nums">
        {fmt(g.sims.length)}
        <span className="block text-mention text-text-muted">{fmt(g.installed)} installée(s)</span>
      </td>
      <td className="px-3 py-2.5 text-right tabular-nums">
        <b>{volume(perMonth)}</b>
        <span className="block text-mention text-text-muted">
          {volume(perMonth / Math.max(1, g.sims.length))} / puce{share != null ? ` · ${fmt(share)} % du revendeur` : ''}
        </span>
      </td>
      <td className="px-3 py-2.5 text-right tabular-nums">
        {g.quotaInstalled > 0 ? volume(quotaMonth) : '—'}
        <span className="block text-mention text-text-muted">par mois</span>
      </td>
      <td className="px-3 py-2.5">
        <Gauge value={usedPct(g)} />
      </td>
      <td className="px-3 py-2.5 text-right tabular-nums">
        {g.overSims > 0 ? (
          <>
            <b className="text-danger-700">{plusVolume(g.excess)}</b>
            <span className="block text-mention text-text-muted">
              {fmt(g.overSims)} puce{g.overSims > 1 ? 's dépassent' : ' dépasse'}
            </span>
          </>
        ) : (
          '—'
        )}
      </td>
      <td className="px-3 py-2.5 text-right tabular-nums">
        <Delta now={g.used} before={g.prev} />
      </td>
    </>
  );
}

function SimLines({ sims, depth, onOpenSim, period }: { sims: SimRow[]; depth: number; onOpenSim: (r: SimRow) => void; period: SimPeriod }) {
  const [all, setAll] = useState(false);
  const shown = all ? sims : sims.slice(0, 5);
  return (
    <>
      {shown.map((r) => {
        const p = r.usage.quota ? Math.round((r.usage.used * 100) / r.usage.quota) : null;
        return (
          <tr
            key={r.sim.id}
            tabIndex={0}
            onClick={() => onOpenSim(r)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onOpenSim(r);
            }}
            className="cursor-pointer bg-surface-muted hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-focus"
          >
            <td className="py-2 pr-3 text-small" style={{ paddingLeft: `${12 + depth * 20}px` }}>
              <span className="font-medium text-text">{r.sim.phoneNumber || 'Pas de numéro'}</span>
              <span className="ml-2 text-mention text-text-muted">
                ID {r.sim.id} · {r.offer?.name ?? 'Aucune offre'}
              </span>
              <span className="ml-2">
                <SimStatusBadge row={r} />
              </span>
            </td>
            <td className="px-3 py-2 text-right text-mention text-text-muted">1</td>
            <td className="px-3 py-2 text-right tabular-nums text-small">{volume(r.usage.used / Math.max(0.01, period.monthsCount))}</td>
            <td className="px-3 py-2 text-right tabular-nums text-small">{r.quota != null ? volume(r.quota) : 'illimité'}</td>
            <td className="px-3 py-2 text-small">{r.quota != null ? <Gauge value={p} /> : <span className="text-mention text-text-muted">illimité</span>}</td>
            <td className="px-3 py-2 text-right tabular-nums text-small">{r.usage.excess > 0.5 ? <b className="text-danger-700">{plusVolume(r.usage.excess)}</b> : '—'}</td>
            <td className="px-3 py-2 text-right tabular-nums text-small">
              <Delta now={r.usage.used} before={r.prevUsed} />
            </td>
          </tr>
        );
      })}
      {sims.length > 5 && (
        <tr className="bg-surface-muted">
          <td colSpan={7} className="py-1.5" style={{ paddingLeft: `${12 + depth * 20}px` }}>
            <button
              type="button"
              onClick={() => setAll((v) => !v)}
              className="text-mention font-medium text-primary hover:underline underline-offset-2 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus rounded-control"
            >
              {all ? 'Voir les 5 premières' : `Voir les ${fmt(sims.length)} puces`}
            </button>
          </td>
        </tr>
      )}
    </>
  );
}

export function SimsConsumption({ data, period, onOpenSim, onOverNetwork }: Props) {
  const [by, setBy] = useState<'client' | 'network'>('client');
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<ConsFilter>('all');
  const [open, setOpen] = useState<Set<string>>(new Set());
  const consRows = useMemo(() => data.rows.filter((r) => !r.isStock), [data.rows]);
  const groups = useMemo(() => groupConsumption(consRows, by), [consRows, by]);
  const clientGroupsOf = useMemo(() => {
    const m = new Map<string, ConsGroup[]>();
    if (by === 'network') for (const g of groups) m.set(g.key, groupConsumption(g.sims, 'client'));
    return m;
  }, [groups, by]);
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return groups.filter((g) => {
      if (!matchesConsFilter(g, filter)) return false;
      if (!s) return true;
      if (by === 'client') return g.label.toLowerCase().includes(s);
      return g.label.toLowerCase().includes(s) || (clientGroupsOf.get(g.key) ?? []).some((c) => c.label.toLowerCase().includes(s));
    });
  }, [groups, filter, q, by, clientGroupsOf]);
  const pager = usePager(shown, 10);
  const totalUsed = groups.reduce((s, g) => s + g.used, 0) / Math.max(0.01, period.monthsCount);
  const toggle = (k: string) =>
    setOpen((prev) => {
      const n = new Set(prev);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });
  const sel = 'h-control px-2 border border-border-strong rounded-control bg-surface text-small focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus';
  const overTotal = data.overNetworks.reduce((s, n) => s + n.overSims, 0);

  return (
    <div className="space-y-4">
      <Block
        id="pu-c21"
        kpiId="PU-C-21"
        title={`Consommation data · ${period.label}`}
        sub={
          <>
            {by === 'client' ? `Par client (${fmt(groups.length)})` : `Par revendeur (${fmt(groups.length)})`} · conso {volume(totalUsed)} / mois · dépassement{' '}
            {plusVolume(data.overMB)} ({fmt(data.over.length)} puce(s)){period.estimated ? ' · estimé à partir des totaux mensuels' : ''}
          </>
        }
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} aria-hidden="true" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher un client…"
              aria-label="Rechercher un client"
              className="w-full h-control pl-9 pr-3 border border-border-strong rounded-control bg-surface text-small focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
            />
          </div>
          <label className="inline-flex items-center gap-2 text-small text-text">
            Consommation
            <select value={filter} onChange={(e) => setFilter(e.target.value as ConsFilter)} className={sel}>
              {CONS_FILTERS.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
          <div className="inline-flex rounded-control border border-border p-0.5" role="group" aria-label="Regroupement">
            {(['client', 'network'] as const).map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={by === k}
                onClick={() => {
                  setBy(k);
                  setOpen(new Set());
                }}
                className={`h-8 px-3 text-button-sm rounded-control focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus ${by === k ? 'bg-primary text-text-inverse' : 'text-text hover:bg-surface-muted'}`}
              >
                {k === 'client' ? 'Par client' : 'Par revendeur'}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-hidden rounded-card border border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-small text-text">
              <thead>
                <tr className="border-b border-border bg-surface-muted text-overline uppercase text-text-muted">
                  <th className="px-3 py-2">{by === 'client' ? 'Client / puce' : 'Revendeur / client / puce'}</th>
                  <th className="px-3 py-2 text-right">Puces</th>
                  <th className="px-3 py-2 text-right">Conso / mois</th>
                  <th className="px-3 py-2 text-right">Forfait</th>
                  <th className="px-3 py-2">Utilisé du forfait</th>
                  <th className="px-3 py-2 text-right">Dépassement</th>
                  <th className="px-3 py-2 text-right">{period.prevLabel}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {pager.slice.map((g) => {
                  const isOpen = open.has(g.key);
                  const children = by === 'network' ? clientGroupsOf.get(g.key) ?? [] : [];
                  return (
                    <Fragment key={g.key}>
                      <tr className="hover:bg-primary-50">
                        <td className="px-3 py-2.5">
                          <button
                            type="button"
                            aria-expanded={isOpen}
                            onClick={() => toggle(g.key)}
                            className="inline-flex items-start gap-1.5 text-left focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus rounded-control"
                          >
                            {isOpen ? <ChevronDown size={16} className="mt-0.5" aria-hidden="true" /> : <ChevronRight size={16} className="mt-0.5" aria-hidden="true" />}
                            <span>
                              <span className="block font-medium">{g.label}</span>
                              {by === 'client' && <span className="block text-mention text-text-muted">{g.sims[0]?.networkLabel}</span>}
                            </span>
                          </button>
                        </td>
                        <GroupCells g={g} period={period} />
                      </tr>
                      {isOpen && by === 'client' && <SimLines sims={g.sims} depth={1} onOpenSim={onOpenSim} period={period} />}
                      {isOpen &&
                        by === 'network' &&
                        children.map((c) => {
                          const ck = `${g.key}/${c.key}`;
                          const cOpen = open.has(ck);
                          return (
                            <Fragment key={ck}>
                              <tr className="bg-surface hover:bg-primary-50">
                                <td className="py-2 pr-3" style={{ paddingLeft: '32px' }}>
                                  <button
                                    type="button"
                                    aria-expanded={cOpen}
                                    onClick={() => toggle(ck)}
                                    className="inline-flex items-center gap-1.5 text-left focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus rounded-control"
                                  >
                                    {cOpen ? <ChevronDown size={14} aria-hidden="true" /> : <ChevronRight size={14} aria-hidden="true" />}
                                    <span className="font-medium">{c.label}</span>
                                  </button>
                                </td>
                                <GroupCells g={c} period={period} share={pct(c.used, g.used)} />
                              </tr>
                              {cOpen && <SimLines sims={c.sims} depth={2} onOpenSim={onOpenSim} period={period} />}
                            </Fragment>
                          );
                        })}
                    </Fragment>
                  );
                })}
                {shown.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-center text-text-muted">
                      Aucune ligne.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pager pager={pager} label="Pagination de la consommation" />
        </div>
        <p className="text-mention text-text-muted">
          Le % utilisé ne compte que les puces installées avec un forfait (une puce non installée a un forfait mais ne consomme pas). Offres illimitées hors %.
          Stock exclu.
        </p>
      </Block>

      <Block
        id="pu-c25"
        kpiId="PU-C-25"
        title="Puces en surconsommation par revendeur"
        sub={`${period.label} · ${fmt(overTotal)} puce(s) au-delà du forfait · cliquez sur une barre pour voir les puces`}
      >
        <HorizontalBarList
          ariaLabel="Puces en surconsommation par revendeur"
          tone="danger"
          rows={data.overNetworks.map((n) => ({
            key: n.network,
            label: n.label,
            sub: `${fmt(n.clients)} client(s) concerné(s)`,
            value: n.overSims,
            valueLabel: `${fmt(n.overSims)} puce(s)`,
            extra: <span className="w-20 shrink-0 text-right text-small font-semibold text-danger-700 tabular-nums">{plusVolume(n.excessMB)}</span>
          }))}
          onRowClick={(key) => {
            const n = data.overNetworks.find((x) => x.network === key);
            if (n) onOverNetwork(n);
          }}
        />
      </Block>
    </div>
  );
}
