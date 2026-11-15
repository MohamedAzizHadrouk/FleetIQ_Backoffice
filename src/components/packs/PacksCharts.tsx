/**
 * Gestion des Packs v3 – graphiques (carte FleetIQ 08). Aucun prix.
 * - PK-P-03 Classement des packs (tri Clients / Équipements, part par propriétaire) ;
 * - PK-P-06 Packs vendus par mois (janv. → déc. de l'année de fin de période, empilé par pack) ;
 * - PK-P-04 Fonctionnalités par pack : composition par module + les plus / moins / jamais vendues ;
 * - PK-P-05 Équipements connectés par pack (alerte sous 60 %) ;
 * - PK-A-10 / PK-A-11 Échéances des abonnements par mois (‹ année ›).
 * Couleurs : jetons TUNAV (4 séries max, états en couleurs d'état) ; la valeur est toujours écrite.
 */
import { useMemo, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Minus } from 'lucide-react';
import type { Pack } from '../../state/FleetStore';
import { formatMonthFr, formatMonthShortFr } from '../../state/mock/dates';
import { ColumnChart, Legend, StackedBar, type ChartTone } from '../charts';
import type { DetailSpec } from '../dashboard/DetailModal';
import { DetailPanel } from '../equipments/EqUi';
import { compareNetworks, networkLabel } from '../../utils/equipmentsKpis';
import { FEATURE_CATALOG } from '../../utils/packFeatureCatalog';
import {
  EXPIRY_LEVELS,
  fmt,
  frDate,
  lastCommLabel,
  MIN_CONN_PCT,
  pct,
  type ExpiryLevel,
  type PacksData,
  type PkClient,
  type PkPackRow
} from '../../utils/packsKpis';

const SERIES: ChartTone[] = ['series1', 'series2', 'series3', 'series4'];
const packTone = (packs: Pack[], id: number): ChartTone => SERIES[Math.max(0, packs.findIndex((p) => p.id === id)) % 4];

const panelCls = 'bg-surface rounded-card border border-border shadow-card p-5';
const tabBtn = (on: boolean) =>
  `h-8 px-3 text-button-sm rounded-control border transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus ${
    on ? 'bg-primary text-text-inverse border-primary' : 'bg-surface text-text border-border hover:bg-surface-muted'
  }`;

function clientsOfPackDetail(r: PkPackRow, periodLabel: string): DetailSpec {
  return {
    title: r.pack.name,
    kpiId: 'PK-P-03',
    big: fmt(r.clients.length),
    caption: `clients · ${fmt(r.equipments.length)} équipements · ${fmt(r.soldInPeriod)} vendu(s) (${periodLabel})`,
    what: `${fmt(r.tunav)} chez Tunav (clients directs et comptes revendeurs), ${fmt(r.resellers)} via les revendeurs.`,
    table: {
      headers: ['Client', 'Propriétaire', 'Équipements du pack', 'Connectés', 'Expiration'],
      rows: r.clients.map((c) => {
        const eqs = c.equipments.filter((e) => e.packId === r.pack.id);
        return [c.client.name, c.owner, eqs.length, eqs.filter((e) => e.connected).length, frDate(c.expiry)];
      })
    },
    route: 'subscriptions',
    routeLabel: 'Packs',
    routeQuery: `?pack=${r.pack.id}`,
    goLabel: 'Filtrer la liste des clients',
    definition: 'Clients qui ont ce pack aujourd’hui et équipements portant ce pack. Un client à deux packs compte dans les deux.',
    formula: 'Clients(p) = clients distincts ayant p · Équipements(p) = équipements de ces clients portant p'
  };
}

/* ------------------------------------------------------------------ PK-P-03 + PK-P-06 */

export function PacksChosenSection({
  data,
  packs,
  periodLabel,
  onOpenDetail
}: {
  data: PacksData;
  packs: Pack[];
  periodLabel: string;
  onOpenDetail: (d: DetailSpec) => void;
}) {
  const [sortBy, setSortBy] = useState<'clients' | 'equipments'>('clients');
  const [month, setMonth] = useState<number | null>(null);
  const rows = data.ranking
    .slice()
    .sort((a, b) => (sortBy === 'clients' ? b.clients.length - a.clients.length : b.equipments.length - a.equipments.length));
  const networks = Array.from(new Set(data.withPack.map((c) => c.network))).sort(compareNetworks).slice(0, 4);
  const netTone = (n: string): ChartTone => SERIES[networks.indexOf(n)] ?? 'series4';
  const thCls = 'px-3 py-2 text-overline uppercase text-text font-medium';

  const sel = month != null ? data.months[month] : null;
  const monthsWithSales = data.months.filter((m) => m.sales.length);
  return (
    <div className="space-y-4">
      {/* PK-P-03 Classement des packs */}
      <div className={panelCls} data-kpi="PK-P-03">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="text-h4 text-text">Classement des packs</h3>
            <p className="text-mention text-text-muted">Cliquez sur un pack pour voir ses clients · un client à plusieurs packs compte dans chacun · P-03</p>
          </div>
          <div className="flex gap-1" role="group" aria-label="Trier par">
            <button type="button" aria-pressed={sortBy === 'clients'} className={tabBtn(sortBy === 'clients')} onClick={() => setSortBy('clients')}>
              Clients
            </button>
            <button type="button" aria-pressed={sortBy === 'equipments'} className={tabBtn(sortBy === 'equipments')} onClick={() => setSortBy('equipments')}>
              Équipements
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-small text-text tabular-nums">
            <thead>
              <tr className="bg-surface-muted border-b border-border text-left">
                <th className={thCls}>#</th>
                <th className={thCls}>Pack</th>
                <th className={`${thCls} text-right`}>Clients</th>
                <th className={`${thCls} text-right`}>Tunav</th>
                <th className={`${thCls} text-right`}>Revendeurs</th>
                <th className={`${thCls} text-right`}>Équipements</th>
                <th className={`${thCls} text-right`}>Vendus ({periodLabel})</th>
                <th className={`${thCls} min-w-[200px]`}>Par propriétaire (clients)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {rows.map((r, i) => {
                const byNet = networks.map((n) => ({ n, v: r.clients.filter((c) => c.network === n).length }));
                return (
                  <tr
                    key={r.pack.id}
                    tabIndex={0}
                    onClick={() => onOpenDetail(clientsOfPackDetail(r, periodLabel))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onOpenDetail(clientsOfPackDetail(r, periodLabel));
                      }
                    }}
                    className="cursor-pointer hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus focus-visible:ring-inset"
                  >
                    <td className="px-3 py-2.5 font-semibold">{i + 1}</td>
                    <td className="px-3 py-2.5 font-medium">{r.pack.name}</td>
                    <td className="px-3 py-2.5 text-right font-semibold">{fmt(r.clients.length)}</td>
                    <td className="px-3 py-2.5 text-right">
                      {fmt(r.tunav)} <span className="text-text-muted">· {pct(r.tunav, r.clients.length)} %</span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {fmt(r.resellers)} <span className="text-text-muted">· {pct(r.resellers, r.clients.length)} %</span>
                    </td>
                    <td className="px-3 py-2.5 text-right">{fmt(r.equipments.length)}</td>
                    <td className="px-3 py-2.5 text-right">{fmt(r.soldInPeriod)}</td>
                    <td className="px-3 py-2.5">
                      <StackedBar
                        height="md"
                        ariaLabel={`${r.pack.name} : clients par propriétaire`}
                        segments={byNet.map((x) => ({ key: x.n, label: networkLabel(x.n), value: x.v, tone: netTone(x.n) }))}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-3">
          <Legend items={networks.map((n) => ({ tone: netTone(n), label: n === 'Tunav' ? 'Tunav (direct + comptes revendeurs)' : n }))} />
        </div>
      </div>

      {/* PK-P-06 Packs vendus par mois */}
      <div className={`${panelCls} grid grid-cols-1 xl:grid-cols-[3fr_2fr] gap-5`} data-kpi="PK-P-06">
        <div className="min-w-0">
          <h3 className="text-h4 text-text">Packs vendus par mois</h3>
          <p className="text-mention text-text-muted mb-2">
            Janvier → décembre {data.year} · cliquez sur un mois pour le détail · mois à venir vides · P-06
          </p>
          <ColumnChart
            mode="stacked"
            ariaLabel={`Packs vendus par mois en ${data.year}`}
            series={packs.map((p) => ({ key: String(p.id), label: p.name, tone: packTone(packs, p.id) }))}
            data={data.months.map((m) => ({ label: `${formatMonthShortFr(m.month)}${m.future ? '·' : ''}`, values: m.byPack }))}
            selectedIndex={month}
            onColumnClick={(i) => (data.months[i].future ? undefined : setMonth(i === month ? null : i))}
          />
          <div className="mt-2">
            <Legend items={packs.map((p) => ({ tone: packTone(packs, p.id), label: p.name }))} />
          </div>
          <p className="mt-1 text-mention text-text-muted">« · » après le mois = mois à venir (non cliquable).</p>
        </div>
        {sel ? (
          <DetailPanel title={`${formatMonthFr(sel.month)} · ${fmt(sel.sales.length)} pack(s) vendu(s)`} sub="Ventes, part, fonctionnalités et clients par pack">
            {sel.sales.length === 0 ? (
              <p className="text-small text-text-muted">Aucune vente ce mois-ci.</p>
            ) : (
              <ul className="divide-y divide-border-subtle">
                {packs
                  .map((p, i) => ({ p, n: sel.byPack[i], list: sel.sales.filter((s) => s.pack.id === p.id) }))
                  .filter((x) => x.n > 0)
                  .map((x) => (
                    <li key={x.p.id} className="py-2">
                      <div className="flex items-baseline justify-between gap-2 text-small">
                        <span className="font-medium text-text">{x.p.name}</span>
                        <span className="tabular-nums text-text">
                          {fmt(x.n)} · {pct(x.n, sel.sales.length)} % · {fmt(x.p.features.length)} fonct.
                        </span>
                      </div>
                      <p className="text-mention text-text-muted">{x.list.map((s) => `${s.client.client.name} · ${frDate(s.date).slice(0, 5)}`).join(' · ')}</p>
                    </li>
                  ))}
              </ul>
            )}
          </DetailPanel>
        ) : (
          <DetailPanel title="Détail du mois" sub="Cliquez sur une colonne">
            <p className="text-small text-text">
              {fmt(monthsWithSales.reduce((s, m) => s + m.sales.length, 0))} pack(s) vendu(s) en {data.year}
              {monthsWithSales.length ? ` · meilleur mois : ${formatMonthFr(monthsWithSales.slice().sort((a, b) => b.sales.length - a.sales.length)[0].month)}` : ''}.
            </p>
          </DetailPanel>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ PK-P-04 */

type FeatMode = 'composition' | 'top' | 'bottom' | 'never';

export function FeaturesSection({ data, packs }: { data: PacksData; packs: Pack[] }) {
  const [mode, setMode] = useState<FeatMode>('composition');
  const [cell, setCell] = useState<{ moduleId: string; packId: number } | null>(null);
  const [featId, setFeatId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const base = data.activeWithPackCount;
  const sold = data.features.filter((f) => f.clients.length > 0);
  const never = data.features.filter((f) => f.clients.length === 0);
  const list = useMemo(() => {
    if (mode === 'top') return sold.slice().sort((a, b) => b.clients.length - a.clients.length || a.label.localeCompare(b.label));
    if (mode === 'bottom') return sold.slice().sort((a, b) => a.clients.length - b.clients.length || a.label.localeCompare(b.label));
    if (mode === 'never') return never;
    return [];
  }, [mode, sold, never]);
  const shown = showAll ? list : list.slice(0, 10);
  const feat = featId ? data.features.find((f) => f.id === featId) ?? null : null;
  const cellData = cell ? data.composition.find((c) => c.moduleId === cell.moduleId && c.packId === cell.packId) ?? null : null;
  const cellPack = cell ? packs.find((p) => p.id === cell.packId) : undefined;
  const moduleNode = cell ? FEATURE_CATALOG.find((m) => m.id === cell.moduleId) : undefined;
  const modLeaves = cell ? data.features.filter((f) => f.moduleId === cell.moduleId) : [];

  return (
    <div className={`${panelCls} space-y-4`} data-kpi="PK-P-04">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-h4 text-text">{mode === 'composition' ? 'Composition des packs par module' : 'Fonctionnalités vendues'}</h3>
          <p className="text-mention text-text-muted">
            {mode === 'composition'
              ? 'Fonctionnalités cochées dans chaque pack, par module (« Modifier le pack ») · cliquez sur une case pour la liste · P-04'
              : `Nombre de clients actifs qui ont la fonctionnalité dans au moins un de leurs packs (sur ${fmt(base)}) · cliquez sur une ligne · P-04`}
          </p>
        </div>
        <div className="flex flex-wrap gap-1" role="group" aria-label="Vue">
          {(
            [
              ['composition', 'Composition'],
              ['top', 'Les plus vendues'],
              ['bottom', 'Les moins vendues'],
              ['never', `Jamais vendues (${fmt(never.length)})`]
            ] as Array<[FeatMode, string]>
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              aria-pressed={mode === k}
              className={tabBtn(mode === k)}
              onClick={() => {
                setMode(k);
                setShowAll(false);
                setFeatId(null);
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {mode === 'composition' ? (
        <div className="grid grid-cols-1 xl:grid-cols-[3fr_2fr] gap-5">
          <div className="overflow-x-auto min-w-0">
            <table className="w-full text-small text-text tabular-nums">
              <thead>
                <tr className="bg-surface-muted border-b border-border text-left">
                  <th className="px-3 py-2 text-overline uppercase font-medium">Module</th>
                  {packs.map((p) => (
                    <th key={p.id} className="px-3 py-2 text-overline uppercase font-medium text-right">
                      {p.name.replace('FleetIQ ', '')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {FEATURE_CATALOG.map((m) => (
                  <tr key={m.id}>
                    <td className="px-3 py-2 font-medium">{m.label}</td>
                    {packs.map((p) => {
                      const c = data.composition.find((x) => x.moduleId === m.id && x.packId === p.id);
                      const n = c?.selected.length ?? 0;
                      const tot = c?.total ?? 0;
                      const on = cell?.moduleId === m.id && cell?.packId === p.id;
                      return (
                        <td key={p.id} className="px-1 py-1 text-right">
                          <button
                            type="button"
                            aria-pressed={on}
                            aria-label={`${p.name} · ${m.label} : ${n} sur ${tot}`}
                            onClick={() => setCell(on ? null : { moduleId: m.id, packId: p.id })}
                            className={`w-full rounded-control px-2 py-1.5 text-right transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus ${
                              on ? 'bg-primary text-text-inverse' : n ? 'bg-primary-50 hover:bg-primary-100 text-text' : 'text-text-muted hover:bg-surface-muted'
                            }`}
                          >
                            <span className="font-semibold">{fmt(n)}</span>
                            <span className={on ? '' : 'text-text-muted'}> / {fmt(tot)}</span>
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <tr className="bg-surface-muted">
                  <td className="px-3 py-2 font-semibold">Total</td>
                  {packs.map((p) => (
                    <td key={p.id} className="px-3 py-2 text-right font-semibold">
                      {fmt(p.features.length)} / {fmt(data.features.length)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          {cellData && cellPack && moduleNode ? (
            <DetailPanel title={`${cellPack.name} · ${moduleNode.label}`} sub={`${fmt(cellData.selected.length)} fonctionnalité(s) sur ${fmt(cellData.total)}`}>
              <ul className="space-y-1 max-h-80 overflow-y-auto">
                {modLeaves.map((f) => {
                  const has = cellData.selected.includes(f.id);
                  return (
                    <li key={f.id} className={`flex items-start gap-2 text-small ${has ? 'text-text' : 'text-text-muted'}`}>
                      {has ? <Check size={14} className="mt-0.5 shrink-0 text-success-700" aria-label="incluse" /> : <Minus size={14} className="mt-0.5 shrink-0" aria-label="non incluse" />}
                      <span>
                        {f.label}
                        <span className="block text-mention text-text-muted">{f.path.slice(1).join(' › ')}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </DetailPanel>
          ) : (
            <DetailPanel title="Détail" sub="Cliquez sur une case du tableau">
              <p className="text-small text-text">
                {packs.map((p) => `${p.name} : ${fmt(p.features.length)}`).join(' · ')} fonctionnalités sur {fmt(data.features.length)}. {fmt(never.length)} fonctionnalité(s)
                ne sont vendues à aucun client actif.
              </p>
            </DetailPanel>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[3fr_2fr] gap-5">
          <div className="min-w-0">
            {list.length === 0 ? (
              <p className="text-small text-text-muted py-4">Aucune fonctionnalité.</p>
            ) : (
              <ol className="divide-y divide-border-subtle">
                {shown.map((f, i) => (
                  <li key={f.id}>
                    <button
                      type="button"
                      onClick={() => setFeatId(f.id === featId ? null : f.id)}
                      aria-pressed={f.id === featId}
                      className={`flex w-full items-center gap-3 px-2 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus focus-visible:ring-inset ${
                        f.id === featId ? 'bg-primary-50' : 'hover:bg-surface-muted'
                      }`}
                    >
                      <span className="w-6 text-small font-semibold text-text-muted tabular-nums">{i + 1}</span>
                      <span className="flex-1 min-w-0">
                        <span className="block truncate text-small font-medium text-text">{f.label}</span>
                        <span className="block truncate text-mention text-text-muted">{f.module}</span>
                      </span>
                      <span className="shrink-0 text-small text-text tabular-nums">
                        {fmt(f.clients.length)} client(s) · {pct(f.clients.length, base)} %
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            )}
            {list.length > 10 && (
              <button type="button" onClick={() => setShowAll((v) => !v)} className="mt-2 text-small font-medium text-primary hover:underline">
                {showAll ? 'Afficher les 10 premières' : `Afficher les ${fmt(list.length)} fonctionnalités`}
              </button>
            )}
          </div>
          {feat ? (
            <DetailPanel title={feat.label} sub={[feat.module, ...feat.path.slice(1)].join(' › ')}>
              <p className="text-small text-text">
                {fmt(feat.clients.length)} client(s) actif(s) ·{' '}
                {fmt(feat.clients.reduce((s, c) => s + c.equipments.length, 0))} équipement(s)
              </p>
              <p className="text-small">
                <b>Dans les packs :</b> {feat.packs.length ? feat.packs.map((p) => p.name).join(', ') : 'aucun pack'}
              </p>
              <ul className="text-small text-text max-h-64 overflow-y-auto space-y-0.5">
                {feat.clients.map((c) => (
                  <li key={c.client.id}>
                    {c.client.name} · {c.packs.map((p) => p.name).join(', ')} · {fmt(c.equipments.length)} équip.
                  </li>
                ))}
              </ul>
            </DetailPanel>
          ) : (
            <DetailPanel title="Détail" sub="Cliquez sur une fonctionnalité">
              <p className="text-small text-text">
                {fmt(sold.length)} fonctionnalité(s) vendue(s) à au moins un client actif, {fmt(never.length)} jamais vendue(s) (dans aucun pack ou dans un pack sans client actif).
              </p>
            </DetailPanel>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ PK-P-05 + PK-A-10 / PK-A-11 */

const LEVEL_META: Record<ExpiryLevel, { label: string; tone: ChartTone }> = {
  expire: { label: 'Expiré ou bloqué', tone: 'series3' },
  critique: { label: 'Critique ≤ 10 j', tone: 'danger' },
  anticiper: { label: 'À anticiper ≤ 60 j', tone: 'warning' },
  plus_tard: { label: 'Plus tard', tone: 'series4' }
};

export function UsageSection({ data, today }: { data: PacksData; today: Date }) {
  const [packSel, setPackSel] = useState<{ packId: number; connected: boolean } | null>(null);
  const [year, setYear] = useState(today.getFullYear());
  const [monthSel, setMonthSel] = useState<number | null>(null);
  const years = data.expiryYears.length ? data.expiryYears : [today.getFullYear()];
  const minY = Math.min(...years, today.getFullYear());
  const maxY = Math.max(...years, today.getFullYear());
  const months = data.expiriesByMonth(year);
  const selRow = packSel ? data.p05.byPack.find((r) => r.pack.id === packSel.packId) : undefined;
  const selEq = selRow
    ? selRow.equipments
        .filter((e) => e.connected === packSel?.connected)
        .sort((a, b) => (b.daysSince ?? 1e9) - (a.daysSince ?? 1e9))
    : [];
  const selMonth = monthSel != null ? months[monthSel] : null;
  const arrowBtn =
    'inline-flex h-8 w-8 items-center justify-center rounded-control border border-border bg-surface text-text hover:bg-surface-muted disabled:opacity-40 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus';

  return (
    <div className="space-y-4">
      {/* PK-P-05 Équipements connectés par pack */}
      <div className={`${panelCls} grid grid-cols-1 xl:grid-cols-[3fr_2fr] gap-5`} data-kpi="PK-P-05">
        <div className="min-w-0">
          <h3 className="text-h4 text-text">Équipements connectés par pack</h3>
          <p className="text-mention text-text-muted mb-3">
            Du plus bas au plus haut · cliquez sur le vert ou le rouge d’un pack pour voir ses équipements · alerte sous {MIN_CONN_PCT} % · connecté = données ≤{' '}
            {fmt(data.connDays)} j · P-05
          </p>
          <ul className="space-y-3">
            {data.p05.byPack.map((r) => {
              const p = pct(r.connected, r.equipments.length);
              return (
                <li key={r.pack.id}>
                  <div className="flex items-baseline justify-between gap-2 text-small mb-1">
                    <span className="font-medium text-text">
                      {r.pack.name}
                      {p < MIN_CONN_PCT && (
                        <span className="ml-2 rounded-pill border border-danger-200 bg-danger-50 px-2 py-0.5 text-mention font-semibold text-danger-700">BAS</span>
                      )}
                    </span>
                    <span className="tabular-nums text-text">
                      <b>{p} %</b> · {fmt(r.connected)}/{fmt(r.equipments.length)}
                    </span>
                  </div>
                  <StackedBar
                    height="md"
                    ariaLabel={`${r.pack.name} : connectés et hors ligne`}
                    onSegmentClick={(k) => setPackSel({ packId: r.pack.id, connected: k === 'c' })}
                    segments={[
                      { key: 'c', label: 'Connectés', value: r.connected, tone: 'success' },
                      { key: 'n', label: 'Non connectés', value: r.equipments.length - r.connected, tone: 'danger' }
                    ]}
                  />
                </li>
              );
            })}
          </ul>
          <div className="mt-3">
            <Legend
              items={[
                { tone: 'success', label: 'Connectés' },
                { tone: 'danger', label: 'Non connectés' }
              ]}
            />
          </div>
        </div>
        {selRow && packSel ? (
          <DetailPanel
            title={`${selRow.pack.name} · ${packSel.connected ? 'connectés' : 'non connectés'} (${fmt(selEq.length)})`}
            sub={`Connectés ${fmt(selRow.connected)} · non connectés ${fmt(selRow.equipments.length - selRow.connected)}`}
          >
            <ul className="divide-y divide-border-subtle max-h-80 overflow-y-auto">
              {selEq.map((e) => (
                <li key={e.eq.id} className="py-1.5 text-small">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-medium text-text truncate">{e.client.name}</span>
                    <span className={`shrink-0 text-mention font-medium ${e.connected ? 'text-success-700' : 'text-danger-700'}`}>{lastCommLabel(e)}</span>
                  </div>
                  <span className="text-mention text-text-muted">
                    <span className="font-mono">{e.eq.serial}</span> · {e.type} · {e.client.reseller === 'Tunav' ? 'Tunav' : `via ${e.client.reseller}`}
                  </span>
                </li>
              ))}
            </ul>
          </DetailPanel>
        ) : (
          <DetailPanel title="Détail" sub="Cliquez sur une barre">
            <p className="text-small text-text">
              {(() => {
                const low = data.p05.byPack.filter((r) => pct(r.connected, r.equipments.length) < MIN_CONN_PCT);
                return low.length
                  ? `Sous ${MIN_CONN_PCT} % : ${low.map((r) => r.pack.name).join(', ')} – des clients n’utilisent pas ce qu’ils paient (risque de non-renouvellement).`
                  : `Aucun pack sous ${MIN_CONN_PCT} %.`;
              })()}
            </p>
          </DetailPanel>
        )}
      </div>

      {/* PK-A-10 / PK-A-11 Échéances des abonnements */}
      <div className={`${panelCls} grid grid-cols-1 xl:grid-cols-[3fr_2fr] gap-5`} data-kpi="PK-A-11">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-h4 text-text">Échéances des abonnements</h3>
            <div className="flex items-center gap-2">
              <button type="button" className={arrowBtn} aria-label="Année précédente" disabled={year <= minY} onClick={() => { setYear(year - 1); setMonthSel(null); }}>
                <ChevronLeft size={16} aria-hidden="true" />
              </button>
              <span className="text-small font-semibold text-text tabular-nums">{year}</span>
              <button type="button" className={arrowBtn} aria-label="Année suivante" disabled={year >= maxY} onClick={() => { setYear(year + 1); setMonthSel(null); }}>
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
          <p className="text-mention text-text-muted mb-2">Clients par mois d’expiration, par niveau · cliquez sur un mois · A-10, A-11</p>
          <ColumnChart
            mode="stacked"
            height={170}
            ariaLabel={`Échéances des abonnements en ${year}`}
            series={EXPIRY_LEVELS.map((lv) => ({ key: lv, label: LEVEL_META[lv].label, tone: LEVEL_META[lv].tone }))}
            data={months.map((m) => ({ label: formatMonthShortFr(m.month), values: m.byLevel }))}
            selectedIndex={monthSel}
            onColumnClick={(i) => setMonthSel(i === monthSel ? null : i)}
          />
          <div className="mt-2">
            <Legend items={EXPIRY_LEVELS.map((lv) => ({ tone: LEVEL_META[lv].tone, label: LEVEL_META[lv].label }))} />
          </div>
        </div>
        {selMonth ? (
          <DetailPanel title={`${formatMonthFr(selMonth.month)} · ${fmt(selMonth.list.length)} échéance(s)`} sub="Client, pack, date et niveau">
            {selMonth.list.length === 0 ? (
              <p className="text-small text-text-muted">Aucune échéance ce mois-ci.</p>
            ) : (
              <ul className="divide-y divide-border-subtle max-h-80 overflow-y-auto">
                {selMonth.list
                  .slice()
                  .sort((a, b) => (a.expiry?.getTime() ?? 0) - (b.expiry?.getTime() ?? 0))
                  .map((c: PkClient) => (
                    <li key={c.client.id} className="py-1.5 text-small flex items-baseline justify-between gap-2">
                      <span className="min-w-0">
                        <span className="block font-medium text-text truncate">{c.client.name}</span>
                        <span className="block text-mention text-text-muted truncate">
                          {c.owner} · {c.packs.map((p) => p.name).join(', ') || 'sans pack'}
                        </span>
                      </span>
                      <span className="shrink-0 text-right text-mention">
                        <span className="block text-text tabular-nums">{frDate(c.expiry)}</span>
                        <span className="block text-text-muted">{c.level ? LEVEL_META[c.level].label : ''}</span>
                      </span>
                    </li>
                  ))}
              </ul>
            )}
          </DetailPanel>
        ) : (
          <DetailPanel title="Détail du mois" sub="Cliquez sur une colonne">
            <p className="text-small text-text">
              {fmt(data.alerts.critique.length)} critique(s) ≤ {data.critDays} j · {fmt(data.alerts.anticiper.length)} à anticiper ≤ {data.renewDays} j ·{' '}
              {fmt(data.alerts.bloques.length)} expiré(s) ou bloqué(s).
            </p>
          </DetailPanel>
        )}
      </div>
    </div>
  );
}
