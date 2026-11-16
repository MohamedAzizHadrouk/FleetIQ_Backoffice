/**
 * Gestion Clients v3 – « Activité et renouvellement » (carte FleetIQ 06) – blocs commerciaux, masqués au Responsable SAV.
 * CLI-C-01 Connexion mensuelle des clients · CLI-C-03 Pic du nombre de clients connectés
 * CLI-D-03 Nouveaux clients vs bloqués par mois · CLI-D-04 Échéances des packs par mois.
 * Journal des connexions, dates de création et de blocage : données fictives « à confirmer back-end ».
 */
import { useMemo, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { BarChart, ColumnChart, Legend, LineChart, type ChartTone, type LineSeries } from '../charts';
import type { DetailSpec } from '../dashboard/DetailModal';
import type { FleetClient } from '../../state/FleetStore';
import { daysBetween, formatMonthFr, parseDate } from '../../state/mock/dates';
import { fmt, frDate, frIso, ownerKey, ownerLabel, pct, type ClientsData } from '../../utils/clientsKpis';
import { Panel, SectionRule } from '../shell/PageShell';

type Props = {
  data: ClientsData;
  isNetwork: boolean;
  onOpenDetail: (d: DetailSpec) => void;
  onClientOpen: (clientId: number) => void;
};

const SERIES_TONES: ChartTone[] = ['series2', 'series3', 'series4'];

function Card({ title, hint, children, side }: { title: string; hint?: string; children: ReactNode; side: ReactNode }) {
  return (
    <Panel title={title} hint={hint} bodyClassName="p-0">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-0">
        <div className="xl:col-span-2 min-w-0 p-4 border-b xl:border-b-0 xl:border-r border-border-subtle">{children}</div>
        <div className="min-w-0 p-4 bg-surface-muted">{side}</div>
      </div>
    </Panel>
  );
}

/** Liste courte de clients (8 lignes) + « Voir tout » (fenêtre de détail). */
function ClientList({
  title,
  list,
  right,
  onClientOpen,
  onSeeAll
}: {
  title: string;
  list: FleetClient[];
  right: (c: FleetClient) => ReactNode;
  onClientOpen: (id: number) => void;
  onSeeAll?: () => void;
}) {
  return (
    <div className="space-y-1">
      <div className="text-overline uppercase text-text-muted">
        {title} ({fmt(list.length)})
      </div>
      {list.length === 0 ? (
        <p className="text-small text-text-muted">Aucun</p>
      ) : (
        <ul className="divide-y divide-border-subtle rounded-control border border-border-subtle bg-surface">
          {list.slice(0, 8).map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onClientOpen(c.id)}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-small hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium text-text">{c.name}</span>
                  <span className="block truncate text-mention text-text-muted">{ownerKey(c) === 'Tunav' ? 'Tunav' : `via ${c.reseller}`}</span>
                </span>
                <span className="shrink-0 text-mention text-text-muted text-right">{right(c)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {list.length > 8 && onSeeAll && (
        <button type="button" onClick={onSeeAll} className="text-mention font-medium text-primary hover:underline">
          Voir les {fmt(list.length)} →
        </button>
      )}
    </div>
  );
}

export function ClientsActivity({ data, isNetwork, onOpenDetail, onClientOpen }: Props) {
  const { c01, c03, d03, d04, infos, asOf } = data;
  const curMonthIdx = c01.yearMonths.findIndex((m) => m.month === c01.asOfMonth);

  /* ---------- C-01 ---------- */
  const [c01Month, setC01Month] = useState(Math.max(0, curMonthIdx));
  const [c01Owners, setC01Owners] = useState<string[]>([]);
  const [c01Query, setC01Query] = useState('');
  const queryMatch = useMemo(() => {
    const q = c01Query.trim().toLowerCase();
    return q ? data.existing.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 3) : [];
  }, [c01Query, data.existing]);
  const series: LineSeries[] = [{ key: 'total', label: isNetwork ? 'Total réseau' : 'Tous mes clients', values: c01.total, tone: 'series1' }];
  if (queryMatch.length) {
    queryMatch.forEach((c, i) => series.push({ key: `c${c.id}`, label: c.name, values: c01.byClient(c.id), tone: SERIES_TONES[i], dashed: true }));
  } else {
    c01Owners.slice(0, 3).forEach((o, i) => series.push({ key: o, label: ownerLabel(o), values: c01.byOwner(o), tone: SERIES_TONES[i], dashed: true }));
  }
  const selMonth = c01.yearMonths[c01Month]?.month ?? c01.asOfMonth;
  const isFuture = selMonth > c01.asOfMonth;
  const selConn = c01.monthConn.get(selMonth) ?? 0;
  const selClients = c01.monthClients.get(selMonth)?.size ?? 0;
  const notConnectedSel = isFuture ? [] : c03.activeNotConnectedInMonth(selMonth);

  /* ---------- C-03 ---------- */
  const [c03Idx, setC03Idx] = useState(c03.peakIdx);
  const c03Sel = c03.months[c03Idx];
  const c03Connected = useMemo(() => c03.connectedInMonth(c03Sel.month), [c03, c03Sel.month]);
  const c03NotConnected = useMemo(() => c03.activeNotConnectedInMonth(c03Sel.month), [c03, c03Sel.month]);

  /* ---------- D-03 ---------- */
  const [d03Idx, setD03Idx] = useState(d03.length - 1);
  const d03Sel = d03[d03Idx];

  /* ---------- D-04 ---------- */
  const [d04Year, setD04Year] = useState(asOf.getFullYear());
  const [d04Owner, setD04Owner] = useState<string | null>(null);
  const d04Data = useMemo(() => d04.forYear(d04Year, d04Owner), [d04, d04Year, d04Owner]);
  const defaultD04 = d04Year === asOf.getFullYear() ? asOf.getMonth() : 0;
  const [d04Idx, setD04Idx] = useState<number>(defaultD04);
  const d04Sel = d04Data[Math.min(d04Idx, 11)];
  const ownersD04 = useMemo(() => Array.from(new Set(data.existing.map(ownerKey))).sort(), [data.existing]);

  const listDetail = (title: string, kpiId: string, list: FleetClient[], col: (c: FleetClient) => string, colName: string) =>
    onOpenDetail({
      title,
      kpiId,
      big: fmt(list.length),
      caption: 'client(s)',
      table: { headers: ['Client', 'Propriétaire', colName], rows: list.map((c) => [c.name, infos.get(c.id)?.owner ?? '', col(c)]) }
    });
  const lastLoginTxt = (c: FleetClient) => {
    const d = infos.get(c.id)?.lastLogin;
    return d ? `dernière : ${frDate(d)}` : 'jamais';
  };

  const chip = (on: boolean) =>
    `rounded-control border px-3 py-1 text-mention font-medium transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus ${
      on ? 'bg-primary text-text-inverse border-primary' : 'bg-surface text-text border-border hover:bg-surface-muted'
    }`;

  return (
    <section aria-labelledby="cli-activite" className="grid grid-cols-12 gap-4">
      <SectionRule id="cli-activite" title="Activité et renouvellement" />

      {/* CLI-C-01 Connexion mensuelle des clients */}
      <div className="col-span-12">
      <Card
        title="Connexion mensuelle des clients"
        
        side={
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-small font-semibold text-text">{formatMonthFr(selMonth)}</span>
              <span className="text-mention text-text-muted">
                {isFuture ? 'mois à venir' : `${fmt(selConn)} connexion(s) · ${fmt(selClients)} client(s)`}
              </span>
            </div>
            <div className="grid grid-cols-6 gap-1">
              {c01.yearMonths.map((m, i) => (
                <button
                  key={m.month}
                  type="button"
                  disabled={m.month > c01.asOfMonth}
                  onClick={() => setC01Month(i)}
                  className={`rounded-control border px-1 py-1 text-center text-mention transition-colors duration-fast ease-standard disabled:opacity-50 ${
                    i === c01Month ? 'bg-primary text-text-inverse border-primary' : 'bg-surface border-border-subtle text-text hover:bg-primary-50'
                  }`}
                >
                  <span className="block">{m.label}</span>
                  <span className="block tabular-nums font-semibold">{m.month > c01.asOfMonth ? '—' : fmt(c01.monthConn.get(m.month) ?? 0)}</span>
                </button>
              ))}
            </div>
            {isNetwork && (
              <div>
                <div className="text-overline uppercase text-text-muted mb-1">Par propriétaire</div>
                <ul className="space-y-1">
                  {c01.owners.map((o) => {
                    const on = c01Owners.includes(o.key);
                    return (
                      <li key={o.key}>
                        <button
                          type="button"
                          aria-pressed={on}
                          onClick={() => setC01Owners((cur) => (on ? cur.filter((x) => x !== o.key) : [...cur, o.key].slice(-3)))}
                          className={`w-full rounded-control border px-2 py-1.5 text-left text-mention transition-colors duration-fast ease-standard ${
                            on ? 'border-primary bg-primary-50' : 'border-border-subtle bg-surface hover:bg-primary-50'
                          }`}
                        >
                          <span className="font-semibold text-text">{o.label}</span>
                          <span className="text-text-muted">
                            {' '}
                            · {fmt(o.connected30)} / {fmt(o.active)} actifs connectés (30 j) · {fmt(o.monthConn)} connexion(s) ce mois
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            {!isFuture && (
              <div className="rounded-control border border-primary-200 bg-primary-50 p-3 text-small">
                {formatMonthFr(selMonth)} : <b>{fmt(notConnectedSel.length)}</b> client(s) actif(s) sans aucune connexion ce mois-ci.
                <button
                  type="button"
                  onClick={() =>
                    listDetail(`Actifs sans connexion – ${formatMonthFr(selMonth)}`, 'CLI-C-01', notConnectedSel, lastLoginTxt, 'Dernière connexion')
                  }
                  className="mt-2 flex items-center h-control px-3 text-button-sm rounded-control bg-primary text-text-inverse hover:bg-primary-hover"
                >
                  Voir la liste →
                </button>
              </div>
            )}
          </div>
        }
      >
        <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
          <p className="text-mention text-text-muted">
            Connexions par mois, janvier → décembre {asOf.getFullYear()} · {fmt(c01.connected30)} client(s) actif(s) connecté(s) dans les 30
            derniers jours · {fmt(c01.without30)} sans connexion · C-01
          </p>
          <label className="relative">
            <span className="sr-only">Filtrer par client</span>
            <Search size={14} aria-hidden="true" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="search"
              value={c01Query}
              onChange={(e) => setC01Query(e.target.value)}
              placeholder="Filtrer par client…"
              className="h-control w-52 pl-8 pr-2 border border-border-strong rounded-control text-small focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
            />
          </label>
        </div>
        <LineChart
          labels={c01.yearMonths.map((m) => m.label)}
          series={series}
          selectedIndex={c01Month}
          onPointClick={(i) => c01.yearMonths[i].month <= c01.asOfMonth && setC01Month(i)}
          ariaLabel="Nombre de connexions des clients par mois"
          height={220}
        />
        <Legend items={series.map((s) => ({ tone: s.tone, label: s.label }))} />
        {queryMatch.length > 0 && (
          <p className="mt-2 text-mention text-text-muted">
            {queryMatch.map((c) => (
              <button key={c.id} type="button" onClick={() => onClientOpen(c.id)} className="mr-3 font-medium text-primary hover:underline">
                Ouvrir la fiche {c.name}
              </button>
            ))}
          </p>
        )}
      </Card>
      </div>

      {/* CLI-C-03 Pic du nombre de clients connectés */}
      <div className="col-span-12">
      <Card
        title="Pic du nombre de clients connectés"
        hint={`Pic : ${fmt(c03.months[c03.peakIdx].value)} clients · ${formatMonthFr(c03.months[c03.peakIdx].month)}`}
        side={
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-small font-semibold text-text">{formatMonthFr(c03Sel.month)}</span>
              <span className="text-mention text-text-muted">
                {fmt(c03Sel.value)} connecté(s){c03Idx === c03.peakIdx ? ' · pic' : ''}
              </span>
            </div>
            <ClientList
              title="Connectés"
              list={c03Connected}
              right={(c) => infos.get(c.id)?.lastChannel ?? ''}
              onClientOpen={onClientOpen}
              onSeeAll={() => listDetail(`Clients connectés – ${formatMonthFr(c03Sel.month)}`, 'CLI-C-03', c03Connected, (c) => infos.get(c.id)?.lastChannel ?? '', 'Canal (dernière)')}
            />
            <ClientList
              title="Actifs sans connexion ce mois-ci"
              list={c03NotConnected}
              right={lastLoginTxt}
              onClientOpen={onClientOpen}
              onSeeAll={() => listDetail(`Actifs sans connexion – ${formatMonthFr(c03Sel.month)}`, 'CLI-C-03', c03NotConnected, lastLoginTxt, 'Dernière connexion')}
            />
          </div>
        }
      >
        <p className="text-mention text-text-muted mb-2">
          Dernière connexion via PC {fmt(c03.channelSplit.PC)} · Mobile {fmt(c03.channelSplit.Mobile)}
        </p>
        <BarChart
          data={c03.months.map((m, i) => ({ label: i === c03.peakIdx ? `${m.label} · pic` : m.label, value: m.value, tone: i === c03.peakIdx ? 'series1' : 'series2' }))}
          onBarClick={setC03Idx}
          ariaLabel="Clients distincts connectés par mois, 6 derniers mois"
          height={190}
        />
        <Legend
          items={[
            { tone: 'series2', label: 'Clients connectés dans le mois' },
            { tone: 'series1', label: 'Pic de la période' }
          ]}
        />
      </Card>
      </div>

      {/* CLI-D-03 Nouveaux clients vs bloqués par mois */}
      <div className="col-span-12">
      <Card
        title="Nouveaux clients vs clients bloqués par mois"
        
        side={
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-small font-semibold text-text">{formatMonthFr(d03Sel.month)}</span>
              <span className="text-mention text-text-muted tabular-nums">
                +{d03Sel.newClients.length} / −{d03Sel.blocked.length}
              </span>
            </div>
            <ClientList title="Nouveaux clients" list={d03Sel.newClients} right={(c) => `créé le ${frIso(c.createdAt)}`} onClientOpen={onClientOpen} />
            <ClientList
              title="Clients bloqués"
              list={d03Sel.blocked}
              right={(c) => {
                const exp = parseDate(c.expiry);
                const b = parseDate(c.blockedAt ?? null);
                if (c.blockReason === 'paiement') return `paiement · ${frIso(c.blockedAt)}`;
                const n = exp && b ? Math.round(daysBetween(exp, b)) : null;
                return n == null ? `échéance ${frIso(c.expiry)}` : `${n} j après l’échéance (${frIso(c.expiry)})`;
              }}
              onClientOpen={onClientOpen}
            />
          </div>
        }
      >
        <ColumnChart
          mode="grouped"
          series={[
            { key: 'n', label: 'Nouveaux clients', tone: 'series1' },
            { key: 'b', label: 'Clients bloqués', tone: 'danger' }
          ]}
          data={d03.map((m) => ({ label: m.label, values: [m.newClients.length, m.blocked.length] }))}
          selectedIndex={d03Idx}
          onColumnClick={setD03Idx}
          ariaLabel="Nouveaux clients et clients bloqués par mois"
        />
        <Legend
          items={[
            { tone: 'series1', label: 'Nouveaux clients' },
            { tone: 'danger', label: 'Clients bloqués' }
          ]}
        />
      </Card>
      </div>

      {/* CLI-D-04 Échéances des packs par mois */}
      <div className="col-span-12">
      <Card
        title="Échéances des packs par mois"
        hint={`${fmt(d04.expiredCount)} expiré(s) · ${fmt(d04.soonCount)} ≤ ${data.delayDays} j`}
        side={
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-small font-semibold text-text">Échéances {formatMonthFr(d04Sel.month)}</span>
              <span className="text-mention text-text-muted">{fmt(d04Sel.list.length)} client(s)</span>
            </div>
            <ClientList
              title="Clients"
              list={d04Sel.list}
              right={(c) => {
                const i = infos.get(c.id);
                const lvl = data.expiryLevel(c);
                const packs = i?.packs.map((p) => p.name).join(' + ') || 'sans pack';
                const dec = lvl === 'expired' ? (i?.active ? 'à régulariser' : 'bloqué') : lvl === 'soon' ? `J-${i?.daysToExpiry} · à relancer` : `J-${i?.daysToExpiry}`;
                return (
                  <>
                    <span className="block">{packs}</span>
                    <span className={`block font-medium ${lvl === 'expired' ? 'text-danger-700' : lvl === 'soon' ? 'text-warning-700' : 'text-text'}`}>
                      {frIso(c.expiry)} · {dec}
                    </span>
                  </>
                );
              }}
              onClientOpen={onClientOpen}
              onSeeAll={() =>
                listDetail(`Échéances – ${formatMonthFr(d04Sel.month)}`, 'CLI-D-04', d04Sel.list, (c) => `${frIso(c.expiry)} · ${infos.get(c.id)?.daysToExpiry ?? ''} j`, 'Échéance')
              }
            />
          </div>
        }
      >
        <div className="flex flex-wrap items-center justify-end gap-2 mb-2">
          <div className="inline-flex items-center gap-1">
            <button type="button" aria-label="Année précédente" onClick={() => setD04Year((y) => y - 1)} className="h-control-sm w-control-sm inline-flex items-center justify-center rounded-control border border-border hover:bg-surface-muted">
              <ChevronLeft size={16} aria-hidden="true" />
            </button>
            <span className="px-2 text-small font-semibold font-qty">{d04Year}</span>
            <button type="button" aria-label="Année suivante" onClick={() => setD04Year((y) => y + 1)} className="h-control-sm w-control-sm inline-flex items-center justify-center rounded-control border border-border hover:bg-surface-muted">
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
        {isNetwork && (
          <div className="mb-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Propriétaire">
            <button type="button" role="radio" aria-checked={!d04Owner} onClick={() => setD04Owner(null)} className={chip(!d04Owner)}>
              Tous
            </button>
            {ownersD04.map((o) => (
              <button key={o} type="button" role="radio" aria-checked={d04Owner === o} onClick={() => setD04Owner(o)} className={chip(d04Owner === o)}>
                {o}
              </button>
            ))}
          </div>
        )}
        <div className="mb-3 grid grid-cols-2 gap-3">
          <div className={`rounded-control border border-border p-3 ${d04.expiredCount > 0 ? 'shadow-rail-danger' : ''}`}>
            <div className="text-kpi text-text font-qty">{pct(d04.expiredCount, d04.total)} %</div>
            <div className="text-mention text-text-muted">
              clients expirés · {fmt(d04.expiredCount)} / {fmt(d04.total)}
            </div>
          </div>
          <div className={`rounded-control border border-border p-3 ${d04.soonCount > 0 ? 'shadow-rail-warning' : ''}`}>
            <div className="text-kpi text-text font-qty">{pct(d04.soonCount, d04.total)} %</div>
            <div className="text-mention text-text-muted">
              échéance ≤ {data.delayDays} j · {fmt(d04.soonCount)} / {fmt(d04.total)}
            </div>
          </div>
        </div>
        <ColumnChart
          mode="stacked"
          series={[
            { key: 'e', label: 'Déjà expiré', tone: 'danger' },
            { key: 's', label: `Dans ${data.delayDays} j`, tone: 'warning' },
            { key: 'l', label: 'Plus tard', tone: 'series1' }
          ]}
          data={d04Data.map((m) => ({ label: m.label, values: [m.expired, m.soon, m.later] }))}
          selectedIndex={Math.min(d04Idx, 11)}
          onColumnClick={setD04Idx}
          ariaLabel={`Échéances des packs par mois en ${d04Year}`}
        />
        <Legend
          items={[
            { tone: 'danger', label: 'Déjà expiré' },
            { tone: 'warning', label: `Dans ${data.delayDays} j` },
            { tone: 'series1', label: 'Plus tard' }
          ]}
        />
      </Card>
      </div>
    </section>
  );
}
