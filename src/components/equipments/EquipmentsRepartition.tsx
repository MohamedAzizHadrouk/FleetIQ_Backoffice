/**
 * Gestion des Équipements v3 – « Répartition » (carte FleetIQ 07), chaque graphique avec son détail à droite :
 * - EQ-G-01 (G-01) Par revendeur et client (vue revendeur : par client)
 * - EQ-G-02 (G-02) Top 5 produits vendus (+ autres modèles, modèle le plus en stock)
 * - EQ-G-03 (G-03) Dernière communication
 * - EQ-G-04 (G-04) Affectations par mois (‹ › année), couleur = état actuel
 * Les 4 panneaux de la maquette Equipements-v3 (les ajouts hors maquette C-01…C-03 ont été retirés).
 * Tous les chiffres viennent des lignes du tableau T-11 (EqRow) ; aucun prix.
 */
import { useMemo, useState, type ReactNode } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { BarChart, ColumnChart, HorizontalBarList, Legend, StackedBar } from '../charts';
import { SectionTitle } from '../clients/ClientsOverview';
import { DetailPanel, EqListItem, EqShortList, StatesLines } from './EqUi';
import {
  assignmentsByMonth,
  assignmentYears,
  countStates,
  fmt,
  groupByNetwork,
  lastCommDistribution,
  LAST_COMM_BUCKETS,
  networkLabel,
  pct,
  productRanking,
  type EqRow,
  type GroupRow,
  type LastCommBucket,
  type TableFilterPatch
} from '../../utils/equipmentsKpis';

type Props = {
  rows: EqRow[];
  isNetwork: boolean;
  now: Date;
  onOpenRow: (r: EqRow) => void;
  onFilter: (f: TableFilterPatch) => void;
};

const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const pad = (n: number) => String(n).padStart(2, '0');
const lastDay = (y: number, m: number) => new Date(y, m + 1, 0).getDate();

function Card({ id, title, hint, chart, detail }: { id: string; title: string; hint?: string; chart: ReactNode; detail: ReactNode }) {
  return (
    <div data-kpi={id} className="bg-surface rounded-card border border-border p-4">
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-4">
        <div className="min-w-0 space-y-2">
          <div>
            <h3 className="text-section text-text">{title}</h3>
            {hint ? <p className="text-mention text-text-muted">{hint}</p> : null}
          </div>
          {chart}
        </div>
        {detail}
      </div>
    </div>
  );
}

const stateSegments = (g: GroupRow) => [
  { key: 'c', label: 'Connecté', value: g.counts.connected, tone: 'success' as const },
  { key: 'n', label: 'Non connecté', value: g.counts.notConnected, tone: 'danger' as const },
  { key: 'w', label: 'Non installé', value: g.counts.notInstalled, tone: 'warning' as const }
];

export function EquipmentsRepartition({ rows, isNetwork, now, onOpenRow, onFilter }: Props) {
  /* ---------- EQ-G-01 ---------- */
  const groups = useMemo(() => groupByNetwork(rows, isNetwork), [rows, isNetwork]);
  const [openNet, setOpenNet] = useState<string | null>(null);
  const [g01Sel, setG01Sel] = useState<{ network?: string; owner?: string } | null>(null);
  const g01Rows = rows.filter(
    (r) => r.state !== 'stock' && (!g01Sel || ((!g01Sel.network || r.network === g01Sel.network) && (!g01Sel.owner || r.owner === g01Sel.owner)))
  );
  const g01Title = g01Sel?.owner ?? (g01Sel?.network ? networkLabel(g01Sel.network) : isNetwork ? 'Tout le réseau' : 'Tous mes clients');
  const g01Counts = countStates(g01Rows);
  const g01Filter = (etat: 'non_connecte' | 'non_installe') =>
    onFilter({ etat, network: g01Sel?.network, owner: g01Sel?.owner });
  const pctOf = (sold: number) => (n: number) => `${pct(n, sold)} %`;

  const g01Line = (g: GroupRow, level: 0 | 1, network?: string) => {
    const selected = level === 0 ? g01Sel?.network === g.key && !g01Sel?.owner : g01Sel?.owner === g.key;
    const isGroup = !!g.children;
    return (
      <button
        type="button"
        aria-expanded={isGroup ? openNet === g.key : undefined}
        onClick={() => {
          if (isGroup) {
            setOpenNet((cur) => (cur === g.key ? null : g.key));
            setG01Sel({ network: g.key });
          } else setG01Sel(isNetwork ? { network, owner: g.key } : { owner: g.key });
        }}
        className={`flex flex-wrap sm:flex-nowrap w-full items-center gap-x-3 gap-y-1 py-2 pr-2 text-left rounded-control transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus ${
          level ? 'pl-8' : 'pl-2'
        } ${selected ? 'bg-primary-50' : 'hover:bg-primary-50'}`}
      >
        {/* FleetIQ 13 (B5) : < 640 px, le libellé prend sa propre ligne (même règle que B4) */}
        <span className="basis-full min-w-0 flex items-center gap-1 sm:basis-auto sm:w-44 sm:shrink-0">
          {isGroup && <ChevronDown size={14} aria-hidden="true" className={`shrink-0 text-text-muted transition-transform ${openNet === g.key ? '' : '-rotate-90'}`} />}
          <span className={`truncate text-small text-text ${level ? '' : 'font-semibold'}`}>{g.label}</span>
        </span>
        <span className="flex-1 min-w-[90px]">
          <StackedBar height="md" labelMinShare={0.12} ariaLabel={`${g.label} : états en % des vendus`} formatValue={pctOf(g.counts.sold)} segments={stateSegments(g)} />
        </span>
        <span className="w-14 shrink-0 text-right text-small font-semibold text-text tabular-nums">{fmt(g.counts.sold)}</span>
      </button>
    );
  };

  /* ---------- EQ-G-02 ---------- */
  const products = useMemo(() => productRanking(rows), [rows]);
  const [g02Type, setG02Type] = useState<string | null>(null);
  const typeSel = products.top.find((t) => t.type === g02Type) ?? products.top[0] ?? null;
  const typeByNetwork = typeSel
    ? groupByNetwork(
        rows.filter((r) => r.type === typeSel.type),
        isNetwork
      )
    : [];

  /* ---------- EQ-G-03 ---------- */
  const dist = useMemo(() => lastCommDistribution(rows), [rows]);
  const [g03Sel, setG03Sel] = useState<LastCommBucket>('> 180 j');
  const g03List = (dist.find((d) => d.bucket === g03Sel)?.rows ?? []).slice().sort((a, b) => (b.daysSince ?? 1e9) - (a.daysSince ?? 1e9) || (b.daysWaiting ?? 0) - (a.daysWaiting ?? 0));
  const bucketTone = (b: LastCommBucket) => (b === '≤ 1 j' || b === '2–7 j' ? 'success' : b === 'Jamais' ? 'warning' : 'danger');

  /* ---------- EQ-G-04 ---------- */
  const years = useMemo(() => assignmentYears(rows, now), [rows, now]);
  const [year, setYear] = useState(now.getFullYear());
  const months = useMemo(() => assignmentsByMonth(rows, year), [rows, year]);
  const yearTotal = months.reduce((s, m) => s + m.rows.length, 0);
  const defaultMonth = year === now.getFullYear() ? now.getMonth() : 11;
  const [g04Month, setG04Month] = useState<number | null>(null);
  const monthIdx = g04Month ?? defaultMonth;
  const isFuture = (m: number) => year > now.getFullYear() || (year === now.getFullYear() && m > now.getMonth());
  const monthList = months[monthIdx]?.rows ?? [];

  return (
    <section aria-labelledby="eq-rep" className="space-y-4">
      <SectionTitle id="eq-rep" title="Répartition" />

      {/* EQ-G-01 Par revendeur et client */}
      <Card
        id="EQ-G-01"
        title={isNetwork ? 'Par revendeur et client' : 'Par client'}
        
        chart={
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <Legend
                items={[
                  { tone: 'success', label: 'Connecté' },
                  { tone: 'danger', label: 'Non connecté' },
                  { tone: 'warning', label: 'Non installé' }
                ]}
              />
              <span className="text-mention text-text-muted">installé = vert + rouge · nombre = vendus</span>
            </div>
            <ul className="divide-y divide-border-subtle">
              {(isNetwork ? groups : groups.slice(0, 12)).map((g) => (
                <li key={g.key}>
                  {g01Line(g, 0)}
                  {g.children && openNet === g.key && (
                    <ul className="pb-2">
                      {g.children.map((ch) => (
                        <li key={ch.key}>{g01Line(ch, 1, g.key)}</li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
            {!isNetwork && groups.length > 12 && <p className="text-mention text-text-muted">+ {fmt(groups.length - 12)} autre(s) client(s) dans le tableau</p>}
          </div>
        }
        detail={
          <DetailPanel title={g01Title} sub={`${fmt(g01Counts.sold)} équip. vendus`}>
            <StatesLines counts={g01Counts} />
            <EqShortList
              title="Non connectés"
              rows={g01Rows.filter((r) => r.state === 'not_connected').sort((a, b) => (b.daysSince ?? 1e9) - (a.daysSince ?? 1e9))}
              onOpen={onOpenRow}
              onShowAll={() => g01Filter('non_connecte')}
              max={6}
            />
            <EqShortList
              title="Non installés"
              rows={g01Rows.filter((r) => r.state === 'not_installed').sort((a, b) => (b.daysWaiting ?? 0) - (a.daysWaiting ?? 0))}
              onOpen={onOpenRow}
              onShowAll={() => g01Filter('non_installe')}
              max={6}
            />
          </DetailPanel>
        }
      />

      <div className="grid grid-cols-1 gap-4">
        {/* EQ-G-02 Top 5 produits vendus */}
        <Card
          id="EQ-G-02"
          title="Top 5 produits vendus"
          
          chart={
            <div className="space-y-2">
              <HorizontalBarList
                ranked
                ariaLabel="Top 5 produits vendus"
                onRowClick={setG02Type}
                rows={products.top.map((t) => ({
                  key: t.type,
                  label: t.type,
                  sub: t.type === typeSel?.type ? 'sélectionné' : undefined,
                  value: t.sold,
                  valueLabel: `${fmt(t.sold)} · ${t.share} %`
                }))}
              />
              <p className="text-mention text-text-muted">
                {products.others.length ? `Autres modèles : ${products.others.map((t) => `${t.type} ${t.sold}`).join(' · ')}. ` : ''}
                {products.mostStock
                  ? `Le plus en stock : ${products.mostStock.type}, ${fmt(products.mostStock.stock)} en stock pour ${fmt(products.mostStock.sold)} vendus.`
                  : 'Aucun équipement en stock.'}
              </p>
            </div>
          }
          detail={
            typeSel ? (
              <DetailPanel title={typeSel.type} sub={`${fmt(typeSel.sold)} vendus · ${typeSel.share} % des ventes · ${fmt(typeSel.stock)} en stock`}>
                <StatesLines counts={typeSel.counts} />
                <div>
                  <h4 className="px-2 text-small font-semibold text-text">Ventes par {isNetwork ? 'revendeur' : 'client'}</h4>
                  <ul className="divide-y divide-border-subtle">
                    {typeByNetwork.slice(0, 8).map((g) => (
                      <li key={g.key}>
                        <button
                          type="button"
                          onClick={() => onFilter({ type: typeSel.type, ...(isNetwork ? { network: g.key } : { owner: g.key }) })}
                          className="flex w-full items-start justify-between gap-3 px-2 py-2 text-left rounded-control hover:bg-primary-50 transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-small font-medium text-text">{g.label}</span>
                            <span className="block text-mention text-text-muted">
                              {fmt(g.counts.installed)} installés · {fmt(g.counts.connected)} connectés · {fmt(g.counts.notInstalled)} non installés
                            </span>
                          </span>
                          <span className="shrink-0 text-right text-small font-semibold text-text tabular-nums">
                            {fmt(g.counts.sold)}
                            <span className="block text-mention font-normal text-text-muted">{pct(g.counts.sold, typeSel.sold)} % des ventes</span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  
                </div>
              </DetailPanel>
            ) : (
              <DetailPanel title="Aucun équipement vendu">
                <p className="text-small text-text-muted">—</p>
              </DetailPanel>
            )
          }
        />

        {/* EQ-G-03 Dernière communication */}
        <Card
          id="EQ-G-03"
          title="Dernière communication"
          
          chart={
            <BarChart
              ariaLabel="Équipements par ancienneté du dernier envoi"
              onBarClick={(i) => setG03Sel(LAST_COMM_BUCKETS[i])}
              data={dist.map((d) => ({ label: d.bucket, value: d.rows.length, tone: bucketTone(d.bucket) }))}
            />
          }
          detail={
            <DetailPanel title={`Dernier envoi ${g03Sel}`} sub={`${fmt(g03List.length)} équip.${g03Sel === 'Jamais' ? ' · non installés ou jamais connectés' : ''}`}>
              <ul className="divide-y divide-border-subtle max-h-80 overflow-y-auto">
                {g03List.slice(0, 30).map((r) => (
                  <EqListItem key={r.eq.id} row={r} onOpen={onOpenRow} showNetwork={isNetwork} />
                ))}
              </ul>
              {g03List.length > 30 && <p className="text-mention text-text-muted">+ {fmt(g03List.length - 30)} autre(s)</p>}
            </DetailPanel>
          }
        />

        {/* EQ-G-04 Affectations par mois */}
        <Card
          id="EQ-G-04"
          title="Affectations par mois"
          
          chart={
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="Année précédente"
                    disabled={year <= years[0]}
                    onClick={() => {
                      setYear((y) => y - 1);
                      setG04Month(null);
                    }}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-control border border-border bg-surface text-text hover:bg-surface-muted disabled:opacity-40 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
                  >
                    <ChevronLeft size={16} aria-hidden="true" />
                  </button>
                  <span className="w-14 text-center text-small font-semibold text-text tabular-nums">{year}</span>
                  <button
                    type="button"
                    aria-label="Année suivante"
                    disabled={year >= now.getFullYear()}
                    onClick={() => {
                      setYear((y) => y + 1);
                      setG04Month(null);
                    }}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-control border border-border bg-surface text-text hover:bg-surface-muted disabled:opacity-40 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
                  >
                    <ChevronRight size={16} aria-hidden="true" />
                  </button>
                </div>
                <span className="text-mention text-text-muted">{fmt(yearTotal)} équipement(s) affecté(s) · mois à venir : « à venir »</span>
              </div>
              <ColumnChart
                mode="stacked"
                ariaLabel={`Affectations par mois en ${year}`}
                selectedIndex={monthIdx}
                onColumnClick={(i) => setG04Month(i)}
                series={[
                  { key: 'c', label: 'Connecté', tone: 'success' },
                  { key: 'n', label: 'Non connecté', tone: 'danger' },
                  { key: 'w', label: 'Non installé', tone: 'warning' }
                ]}
                data={months.map((m, i) => ({
                  label: isFuture(i) ? `${MONTHS[i]} (à venir)` : MONTHS[i],
                  values: [m.counts.connected, m.counts.notConnected, m.counts.notInstalled]
                }))}
              />
              <Legend
                items={[
                  { tone: 'success', label: 'Connecté' },
                  { tone: 'danger', label: 'Non connecté' },
                  { tone: 'warning', label: 'Non installé' }
                ]}
              />
            </div>
          }
          detail={
            <DetailPanel title={`Affectés en ${MONTHS[monthIdx]} ${year}`} sub={isFuture(monthIdx) ? 'mois à venir' : `${fmt(monthList.length)} équip.`}>
              <EqShortList
                title="Équipements"
                rows={monthList}
                max={10}
                onOpen={onOpenRow}
                onShowAll={() =>
                  onFilter({ assignedFrom: `${year}-${pad(monthIdx + 1)}-01`, assignedTo: `${year}-${pad(monthIdx + 1)}-${pad(lastDay(year, monthIdx))}` })
                }
                showNetwork={isNetwork}
              />
            </DetailPanel>
          }
        />

      </div>
    </section>
  );
}
