/**
 * Gestion Clients v3 – cartes du haut, « À traiter » et « Répartition » (carte FleetIQ 06).
 * CLI-K-01 Total clients · CLI-K-02/K-03 Statut des clients · CLI-K-04/K-05 Équipements connectés
 * CLI-A-04a · CLI-A-01 · CLI-A-02 · CLI-A-04b (À traiter, un seul filtre « Délai ») · CLI-D-01 · CLI-D-02.
 * Les blocs commerciaux (A-01, A-02, A-04 a) sont masqués au Responsable SAV (canSeeCommercial = false).
 */
import { useState, type ReactNode } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Cpu, UserCheck, Users } from 'lucide-react';
import { HorizontalBarList, Legend, StackedBar } from '../charts';
import type { DetailSpec } from '../dashboard/DetailModal';
import { Panel, SectionRule } from '../shell/PageShell';
import { FAMILY_CLS } from '../ui/StatusTag';
import {
  DELAY_OPTIONS,
  fmt,
  pct,
  type AlertKey,
  type ClientsData,
  type DelayDays
} from '../../utils/clientsKpis';

export type CompareCounts = { label: string; date: Date; total: number; active: number; blocked: number } | null;

type Props = {
  data: ClientsData;
  isNetwork: boolean;
  canSeeCommercial: boolean;
  compare: CompareCounts;
  delay: DelayDays;
  onDelayChange: (d: DelayDays) => void;
  alertFilter: AlertKey | null;
  onAlertClick: (key: AlertKey) => void;
  onOpenDetail: (d: DetailSpec) => void;
  onOwnerClick: (owner: string) => void;
  /** id du pack, ou « none » (sans pack) */
  onPackClick: (packKey: string) => void;
  onClientOpen: (clientId: number, tab?: 'equipements') => void;
};

/** @deprecated prefer SectionRule – kept for ClientsActivity import compatibility */
export function SectionTitle({ id, title, hint, right }: { id: string; title: string; hint?: string; right?: ReactNode }) {
  return <SectionRule id={id} title={title} hint={hint} right={right} />;
}

function Delta({ now, before }: { now: number; before: number }) {
  const d = now - before;
  if (d === 0) return <span className="text-mention text-text-muted">= {fmt(before)}</span>;
  return (
    <span className="text-mention font-medium text-text">
      {d > 0 ? '↗ +' : '↘ −'}
      {fmt(Math.abs(d))} <span className="text-text-muted font-normal">(avant {fmt(before)})</span>
    </span>
  );
}

function TopCard({
  kpiId,
  title,
  children,
  onOpen,
  rail,
  icon: Icon,
  iconCls = 'bg-primary-50 text-primary'
}: {
  kpiId: string;
  title: string;
  children: ReactNode;
  onOpen: () => void;
  rail?: string;
  icon?: typeof Users;
  iconCls?: string;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      data-kpi={kpiId}
      className={`group flex h-full w-full flex-col gap-1.5 text-left bg-surface rounded-card border border-border p-4 hover:border-accent transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus ${rail ?? ''}`}
    >
      <span className="flex items-start justify-between gap-2">
        <span className="text-overline uppercase text-text-muted">{title}</span>
        {Icon && (
          <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-control ${iconCls}`} aria-hidden="true">
            <Icon size={16} />
          </span>
        )}
      </span>
      {children}
      <span className="mt-auto inline-flex items-center gap-1 self-end text-[11.5px] text-text-muted group-hover:text-primary-hover">
        Voir le détail
        <ArrowRight size={12} aria-hidden="true" />
      </span>
    </button>
  );
}

const ALERT_META: Record<AlertKey, { mockup: string; tag: string; family: 'danger' | 'warning' | 'info' }> = {
  blocage: { mockup: 'A-04 (a)', tag: 'BLOCAGE', family: 'danger' },
  echeance: { mockup: 'A-01', tag: 'ÉCHÉANCE', family: 'warning' },
  relance: { mockup: 'A-02', tag: 'RELANCE', family: 'warning' },
  jamais: { mockup: 'A-04 (b)', tag: 'PARC', family: 'info' }
};

export function ClientsOverview({
  data,
  isNetwork,
  canSeeCommercial,
  compare,
  delay,
  onDelayChange,
  alertFilter,
  onAlertClick,
  onOpenDetail,
  onOwnerClick,
  onPackClick,
  onClientOpen
}: Props) {
  const { k01, k02, k04, alerts, infos, existing } = data;
  const ownersOf = () => {
    const m = new Map<string, typeof existing>();
    for (const c of existing) {
      const o = infos.get(c.id)?.owner ?? '';
      m.set(o, [...(m.get(o) ?? []), c]);
    }
    return Array.from(m.entries()).sort((a, b) => b[1].length - a[1].length);
  };

  /* ---------- détails des cartes du haut ---------- */
  const openK01 = () =>
    onOpenDetail({
      title: 'Total clients',
      kpiId: 'CLI-K-01',
      big: fmt(k01.total),
      caption: `clients · dont ${fmt(k01.resellers)} revendeur(s) · ${fmt(k01.equipments)} équipements affectés`,
      definition: 'Nombre de clients du périmètre affiché, hors client stock, à la date « État au ».',
      formula: 'Total clients = COUNT(clients créés à la date) − client stock',
      table: {
        headers: ['Propriétaire', 'Clients', 'Dont revendeurs', 'Équipements'],
        rows: ownersOf().map(([o, list]) => [
          o,
          list.length,
          list.filter((c) => c.type === 'Revendeur').length,
          list.reduce((s, c) => s + (c.type === 'Revendeur' ? 0 : infos.get(c.id)?.assigned ?? 0), 0)
        ])
      }
    });
  const openK02 = () =>
    onOpenDetail({
      title: 'Statut des clients',
      kpiId: 'CLI-K-02 · CLI-K-03',
      big: `${pct(k02.active, k01.total)} %`,
      caption: `${fmt(k02.active)} actifs · ${fmt(k02.blocked)} bloqués sur ${fmt(k01.total)}`,
      definition: `Actif = non bloqué et date « État au » ≤ échéance + ${data.graceDays} j. Bloqué = bloqué manuellement (paiement) ou abonnement expiré depuis plus de ${data.graceDays} j. Actifs + bloqués = total.`,
      formula: 'Taux = actifs ÷ total clients × 100',
      table: {
        headers: ['Propriétaire', 'Clients', 'Actifs', 'Bloqués', '% bloqués'],
        rows: ownersOf().map(([o, list]) => {
          const b = list.filter((c) => !infos.get(c.id)?.active).length;
          return [o, list.length, list.length - b, b, `${pct(b, list.length)} %`];
        })
      }
    });
  const openK04 = () => {
    const rows = existing
      .filter((c) => c.type !== 'Revendeur' && (infos.get(c.id)?.assigned ?? 0) > 0)
      .map((c) => infos.get(c.id))
      .filter((i): i is NonNullable<typeof i> => !!i)
      .sort((a, b) => b.assigned - b.connected - (a.assigned - a.connected));
    onOpenDetail({
      title: 'Équipements connectés',
      kpiId: 'CLI-K-04 · CLI-K-05',
      big: `${pct(k04.connected, k04.assigned)} %`,
      caption: `${fmt(k04.connected)} connectés / ${fmt(k04.assigned)} affectés · ${fmt(k04.notConnected)} non connectés`,
      definition: `Équipements affectés aux clients (hors stock) qui ont envoyé des données dans les ${fmt(data.connDays)} derniers jours (seuil global « connecté »). États du jour.`,
      formula: 'Connectés = affectés dont la dernière communication ≥ maintenant − seuil · Non connectés = affectés − connectés',
      table: {
        headers: ['Client', 'Propriétaire', 'Connectés', 'Affectés', 'Non connectés'],
        rows: rows.map((i) => [i.client.name, i.owner, i.connected, i.assigned, i.assigned - i.connected])
      }
    });
  };

  const alertCards: Array<{ key: AlertKey; title: string; count: number; unit: string; detail: string }> = [];
  if (canSeeCommercial) {
    alertCards.push({ key: 'blocage', title: `Bloqués dans ≤ ${data.graceDays} j`, count: alerts.blocage.list.length, unit: 'client(s)', detail: alerts.blocage.detail });
    alertCards.push({ key: 'echeance', title: `Échéance ≤ ${delay} j`, count: alerts.echeance.list.length, unit: 'client(s)', detail: alerts.echeance.detail });
    alertCards.push({ key: 'relance', title: `Sans connexion > ${delay} j`, count: alerts.relance.list.length, unit: 'client(s)', detail: alerts.relance.detail });
  }
  // Maquette Clients-v3 : 3 cartes (Bloqués, Échéance, Sans connexion). « Jamais connectés » reste la carte du Responsable SAV.
  if (!canSeeCommercial) alertCards.push({
    key: 'jamais',
    title: 'Équipements jamais connectés',
    count: alerts.jamais.equipments.length,
    unit: 'équip.',
    detail: `${fmt(alerts.jamais.list.length)} client(s) · ${alerts.jamais.detail}`
  });

  const d01Max = Math.max(1, ...data.d01.map((r) => r.equipments));

  /* ---------- Revendeurs (vue Tunav) : un propriétaire par ligne, le clic filtre la page ---------- */
  const dueIds = new Set(alerts.echeance.list.map((c) => c.id));
  const resellerRows = ownersOf().map(([owner, list]) => {
    const finals = list.filter((c) => c.type !== 'Revendeur');
    const assigned = finals.reduce((s, c) => s + (infos.get(c.id)?.assigned ?? 0), 0);
    const connected = finals.reduce((s, c) => s + (infos.get(c.id)?.connected ?? 0), 0);
    const blocked = list.filter((c) => !infos.get(c.id)?.active).length;
    const due = list.filter((c) => dueIds.has(c.id)).length;
    return { owner, clients: list.length, assigned, connected, blocked, due };
  });
  const RV_PAGE = 5;
  const rvPages = Math.max(1, Math.ceil(resellerRows.length / RV_PAGE));
  const [rvPage, setRvPage] = useState(0);
  const rvCur = Math.min(rvPage, rvPages - 1);
  const rvShown = resellerRows.slice(rvCur * RV_PAGE, rvCur * RV_PAGE + RV_PAGE);
  const k02Rail = '';
  const k04Rail = '';

  return (
    <div className="grid grid-cols-12 gap-4 gap-y-8">
      {/* Cartes du haut — parts égales sur 12 cols */}
      <div className="col-span-12 grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
        <TopCard kpiId="CLI-K-01" title="Total clients" onOpen={openK01} icon={Users}>
          <span className="flex items-baseline gap-2">
            <span className="text-kpi text-text font-qty">{fmt(k01.total)}</span>
          </span>
          <p className="text-small text-text-muted">
            dont {fmt(k01.resellers)} revendeur(s) · {fmt(k01.equipments)} équip.
          </p>
          {compare && (
            <p>
              <Delta now={k01.total} before={compare.total} /> <span className="text-mention text-text-muted">vs {compare.label}</span>
            </p>
          )}
        </TopCard>
        <TopCard kpiId="CLI-K-02" title="Statut des clients" onOpen={openK02} rail={k02Rail} icon={UserCheck}>
          <span className="flex items-baseline gap-2 flex-wrap">
            <span className="text-kpi text-success font-qty">{fmt(k02.active)}</span>
            <span className="text-small text-text-muted">actifs ·</span>
            <span className="text-kpi text-danger font-qty">{fmt(k02.blocked)}</span>
            <span className="text-small text-text-muted">bloqués</span>
          </span>
          <div className="mt-1">
            <StackedBar
              height="md"
              ariaLabel="Clients actifs et bloqués"
              segments={[
                { key: 'a', label: 'Actifs', value: k02.active, tone: 'success' },
                { key: 'b', label: 'Bloqués', value: k02.blocked, tone: 'danger' }
              ]}
            />
          </div>
          {compare && (
            <p className="text-mention text-text-muted">
              Actifs <Delta now={k02.active} before={compare.active} /> · bloqués <Delta now={k02.blocked} before={compare.blocked} />
            </p>
          )}
        </TopCard>
        <TopCard kpiId="CLI-K-04" title="Parc équipements" onOpen={openK04} rail={k04Rail} icon={Cpu} iconCls="bg-success-50 text-success">
          <span className="flex items-baseline gap-2 flex-wrap">
            <span className="text-kpi text-text font-qty">{fmt(k04.connected)}</span>
            <span className="text-small text-text-muted">/ {fmt(k04.assigned)}</span>
            <span className="text-small font-semibold text-text">{pct(k04.connected, k04.assigned)} %</span>
          </span>
          <div className="mt-1">
            <StackedBar
              height="md"
              ariaLabel="Équipements connectés et non connectés"
              segments={[
                { key: 'c', label: 'Connectés', value: k04.connected, tone: 'success' },
                { key: 'n', label: 'Non connectés', value: k04.notConnected, tone: 'danger' }
              ]}
            />
          </div>
          <p className="text-small text-text-muted">
            connectés · <b className="text-danger-700 font-qty">{fmt(k04.notConnected)}</b> hors ligne · données ≤ {fmt(data.connDays)} j
          </p>
        </TopCard>
      </div>

      {/* À traiter */}
      <section aria-labelledby="cli-todo" className="col-span-12 grid grid-cols-12 gap-4">
        <SectionRule
          id="cli-todo"
          title="À traiter"
         
          right={
            canSeeCommercial ? (
              <label className="inline-flex items-center gap-2 text-small text-text">
                Délai
                <select
                  value={delay}
                  onChange={(e) => onDelayChange(Number(e.target.value) as DelayDays)}
                  className="h-control px-2 border border-border-strong rounded-control bg-surface text-small focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
                >
                  {DELAY_OPTIONS.map((d) => (
                    <option key={d} value={d}>
                      {d} j
                    </option>
                  ))}
                </select>
              </label>
            ) : undefined
          }
        />
        <div className={`col-span-12 grid grid-cols-1 sm:grid-cols-2 gap-4 ${alertCards.length >= 3 ? 'xl:grid-cols-3' : ''}`}>
          {alertCards.map((a) => {
            const meta = ALERT_META[a.key];
            const on = alertFilter === a.key;
            const rail = on ? 'shadow-rail-info' : '';
            return (
              <button
                key={a.key}
                type="button"
                aria-pressed={on}
                data-kpi={`CLI-${meta.mockup.replace(' ', '').replace('(', '').replace(')', '')}`}
                onClick={() => onAlertClick(a.key)}
                className={`text-left rounded-card border p-4 transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus ${rail} ${
                  on ? 'border-primary bg-primary-50' : 'border-border bg-surface hover:border-border-strong'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-small font-semibold text-text">{a.title}</span>
                  <span
                    className={`inline-flex items-center h-6 px-2 rounded-tag border text-mention font-semibold uppercase tracking-[0.06em] whitespace-nowrap ${FAMILY_CLS[meta.family]}`}
                  >
                    {meta.tag}
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-kpi text-text font-qty">{fmt(a.count)}</span>
                  <span className="text-small text-text-muted">{a.unit}</span>
                </div>
                <p className="text-mention text-text-muted truncate" title={a.detail}>
                  {a.detail}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Revendeurs (vue Tunav) */}
      {isNetwork && (
        <section aria-labelledby="cli-rv" className="col-span-12 grid grid-cols-12 gap-4">
          <SectionRule id="cli-rv" title="Revendeurs" />
          <div className="col-span-12 overflow-hidden rounded-card border border-border bg-surface">
            <div className="overflow-x-auto px-3 pt-2">
              <table className="fiq-table">
                <thead>
                  <tr>
                    <th>Propriétaire</th>
                    <th>Clients</th>
                    <th>Équipements</th>
                    <th className="w-[24%]">Connectés</th>
                    <th>Bloqués</th>
                    <th>Échéances ≤ {delay} j</th>
                  </tr>
                </thead>
                <tbody>
                  {rvShown.map((r) => {
                    const pc = pct(r.connected, r.assigned);
                    return (
                      <tr key={r.owner} className="cursor-pointer" onClick={() => onOwnerClick(r.owner)}>
                        <td>
                          <button type="button" onClick={() => onOwnerClick(r.owner)} className="font-semibold text-text hover:text-primary-hover focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus rounded-control">
                            {r.owner}
                          </button>
                        </td>
                        <td className="font-mono">{fmt(r.clients)}</td>
                        <td className="font-mono">{fmt(r.assigned)}</td>
                        <td>
                          <span className="flex items-center gap-2">
                            <span className="relative block h-2 flex-1 rounded-[4px] bg-[#EEF2F7]">
                              <span className={`absolute inset-y-0 left-0 rounded-[4px] ${pc >= 85 ? 'bg-success' : 'bg-warning'}`} style={{ width: `${pc}%` }} />
                            </span>
                            <span className="w-10 text-right font-mono text-mention text-text-muted">{pc} %</span>
                          </span>
                        </td>
                        <td className={`font-mono ${r.blocked ? 'text-danger' : ''}`}>
                          {fmt(r.blocked)} · {pct(r.blocked, r.clients)} %
                        </td>
                        <td className={`font-mono ${r.due ? 'text-warning' : ''}`}>{fmt(r.due)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between gap-2 px-4 py-3 text-mention text-text-muted">
              <span>
                {fmt(rvCur * RV_PAGE + 1)}–{fmt(rvCur * RV_PAGE + rvShown.length)} sur {fmt(resellerRows.length)} propriétaires
              </span>
              {rvPages > 1 && (
                <span className="flex items-center gap-1">
                  <button type="button" aria-label="Page précédente" disabled={rvCur === 0} onClick={() => setRvPage(rvCur - 1)} className="grid h-7 w-7 place-items-center rounded-control border border-border bg-surface disabled:opacity-40">
                    <ChevronLeft size={14} aria-hidden="true" />
                  </button>
                  {Array.from({ length: rvPages }, (_, i) => (
                    <button key={i} type="button" aria-current={i === rvCur ? 'page' : undefined} onClick={() => setRvPage(i)} className={`h-7 min-w-7 rounded-control px-2 font-semibold ${i === rvCur ? 'bg-primary text-text-inverse' : 'border border-border bg-surface text-text'}`}>
                      {i + 1}
                    </button>
                  ))}
                  <button type="button" aria-label="Page suivante" disabled={rvCur === rvPages - 1} onClick={() => setRvPage(rvCur + 1)} className="grid h-7 w-7 place-items-center rounded-control border border-border bg-surface disabled:opacity-40">
                    <ChevronRight size={14} aria-hidden="true" />
                  </button>
                </span>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Répartition */}
      <section aria-labelledby="cli-rep" className="col-span-12 grid grid-cols-12 gap-4">
        <SectionRule id="cli-rep" title="Répartition" />
        <div className="col-span-12 xl:col-span-6">
          <Panel
            title="Clients et équipements par pack"
            bodyClassName="p-4"
          >
            <HorizontalBarList
              ariaLabel="Clients et équipements par pack"
              max={d01Max}
              onRowClick={onPackClick}
              rows={[
                ...data.d01.map((r) => ({
                  key: r.key,
                  label: r.label,
                  value: r.equipments,
                  valueLabel: `${fmt(r.clients)} cl. · ${fmt(r.equipments)} éq.`
                })),
                ...(data.noPack ? [{ key: 'none', label: 'Sans pack', value: 0, valueLabel: `${fmt(data.noPack)} cl.`, tone: 'series4' as const }] : [])
              ]}
            />
          </Panel>
        </div>
        <div className="col-span-12 xl:col-span-6">
          <Panel
            title="Équipements connectés / non connectés"
            bodyClassName="p-0"
            footer={
              <Legend
                items={[
                  { tone: 'success', label: 'Connectés' },
                  { tone: 'danger', label: 'Non connectés' }
                ]}
              />
            }
          >
            <ul>
              {data.d02.slice(0, isNetwork ? 10 : 8).map((r) => {
                const offline = r.assigned - r.connected;
                return (
                  <li key={r.key} className="border-b border-border-subtle last:border-b-0">
                    <button
                      type="button"
                      onClick={() => (isNetwork ? onOwnerClick(r.key) : onClientOpen(Number(r.key), 'equipements'))}
                      className="flex flex-wrap sm:flex-nowrap w-full items-center gap-x-3 gap-y-1 px-4 py-2.5 text-left hover:bg-primary-50 transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
                    >
                      <span className="basis-full min-w-0 truncate text-small font-medium text-text sm:basis-auto sm:w-40 sm:shrink-0">{r.label}</span>
                      <span className="flex-1 min-w-[80px]">
                        <StackedBar
                          height="md"
                          labelMinShare={1}
                          ariaLabel={`${r.label} : connectés et non connectés`}
                          segments={[
                            { key: 'c', label: 'Connectés', value: r.connected, tone: 'success' },
                            { key: 'n', label: 'Non connectés', value: offline, tone: 'danger' }
                          ]}
                        />
                      </span>
                      <span className="shrink-0 text-right text-small font-qty sm:w-40">
                        <b className="text-danger-700">{fmt(offline)}</b> hors ligne / {fmt(r.assigned)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </div>
      </section>
    </div>
  );
}
