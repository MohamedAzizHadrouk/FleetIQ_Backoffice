/**
 * Gestion Clients v3 – cartes du haut, « À traiter » et « Répartition » (carte FleetIQ 06).
 * CLI-K-01 Total clients · CLI-K-02/K-03 Statut des clients · CLI-K-04/K-05 Équipements connectés
 * CLI-A-04a · CLI-A-01 · CLI-A-02 · CLI-A-04b (À traiter, un seul filtre « Délai ») · CLI-D-01 · CLI-D-02.
 * Les blocs commerciaux (A-01, A-02, A-04 a) sont masqués au Responsable SAV (canSeeCommercial = false).
 */
import type { ReactNode } from 'react';
import { ArrowRight, Cpu, UserCheck, Users } from 'lucide-react';
import { HorizontalBarList, Legend, StackedBar } from '../charts';
import type { DetailSpec } from '../dashboard/DetailModal';
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

export function SectionTitle({ id, title, hint, right }: { id: string; title: string; hint?: string; right?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 id={id} className="text-overline uppercase text-text">
          {title}
        </h2>
        {hint && <span className="text-small text-text-muted">{hint}</span>}
      </div>
      {right}
    </div>
  );
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
  icon: Icon,
  children,
  onOpen
}: {
  kpiId: string;
  title: string;
  icon: typeof Users;
  children: ReactNode;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      data-kpi={kpiId}
      className="text-left w-full bg-surface rounded-card border border-border shadow-card p-5 hover:shadow-raised hover:border-primary-200 transition-shadow focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-overline uppercase text-text-muted">{title}</h3>
        <span className="flex h-10 w-10 items-center justify-center rounded-control bg-primary-100 text-primary">
          <Icon size={20} aria-hidden="true" />
        </span>
      </div>
      {children}
      <span className="mt-3 flex items-center justify-end gap-1 text-mention text-primary">
        Voir le détail <ArrowRight size={12} aria-hidden="true" />
      </span>
    </button>
  );
}

const ALERT_META: Record<AlertKey, { mockup: string; tag: string; tagCls: string }> = {
  blocage: { mockup: 'A-04 (a)', tag: 'Blocage', tagCls: 'bg-danger-50 text-danger-700 border-danger-200' },
  echeance: { mockup: 'A-01', tag: 'Échéance', tagCls: 'bg-warning-50 text-warning-700 border-warning-200' },
  relance: { mockup: 'A-02', tag: 'Relance', tagCls: 'bg-warning-50 text-warning-700 border-warning-200' },
  jamais: { mockup: 'A-04 (b)', tag: 'Parc', tagCls: 'bg-primary-50 text-primary border-primary-200' }
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
  alertCards.push({
    key: 'jamais',
    title: 'Équipements jamais connectés',
    count: alerts.jamais.equipments.length,
    unit: 'équip.',
    detail: `${fmt(alerts.jamais.list.length)} client(s) · ${alerts.jamais.detail}`
  });

  const d01Max = Math.max(1, ...data.d01.map((r) => r.equipments));

  return (
    <div className="space-y-8">
      {/* Cartes du haut */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* CLI-K-01 Total clients */}
        <TopCard kpiId="CLI-K-01" title="Total clients" icon={Users} onOpen={openK01}>
          <div className="text-kpi text-text tabular-nums">{fmt(k01.total)}</div>
          <p className="text-small text-text-muted mt-1">
            dont {fmt(k01.resellers)} revendeur(s) · {fmt(k01.equipments)} équip.
          </p>
          {compare && (
            <p className="mt-1">
              <Delta now={k01.total} before={compare.total} /> <span className="text-mention text-text-muted">vs {compare.label}</span>
            </p>
          )}
        </TopCard>
        {/* CLI-K-02 + CLI-K-03 Statut des clients (carte réunie) */}
        <TopCard kpiId="CLI-K-02" title="Statut des clients" icon={UserCheck} onOpen={openK02}>
          <div className="flex items-baseline gap-2">
            <span className="text-kpi text-success-700 tabular-nums">{fmt(k02.active)}</span>
            <span className="text-small text-text-muted">actifs ·</span>
            <span className="text-kpi text-danger-700 tabular-nums">{fmt(k02.blocked)}</span>
            <span className="text-small text-text-muted">bloqués</span>
          </div>
          <div className="mt-2">
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
            <p className="mt-1 text-mention text-text-muted">
              Actifs <Delta now={k02.active} before={compare.active} /> · bloqués <Delta now={k02.blocked} before={compare.blocked} />
            </p>
          )}
        </TopCard>
        {/* CLI-K-04 Équipements connectés (+ K-05 dans le détail) */}
        <TopCard kpiId="CLI-K-04" title="Équipements connectés" icon={Cpu} onOpen={openK04}>
          <div className="flex items-baseline gap-2">
            <span className="text-kpi text-text tabular-nums">{fmt(k04.connected)}</span>
            <span className="text-small text-text-muted">/ {fmt(k04.assigned)}</span>
            <span className="text-small font-semibold text-success-700">{pct(k04.connected, k04.assigned)} %</span>
          </div>
          <div className="mt-2">
            <StackedBar
              height="md"
              ariaLabel="Équipements connectés et non connectés"
              segments={[
                { key: 'c', label: 'Connectés', value: k04.connected, tone: 'success' },
                { key: 'n', label: 'Non connectés', value: k04.notConnected, tone: 'danger' }
              ]}
            />
          </div>
          <p className="mt-1 text-small text-text-muted">
            connectés · <b className="text-danger-700">{fmt(k04.notConnected)}</b> hors ligne · données ≤ {fmt(data.connDays)} j
          </p>
        </TopCard>
      </div>

      {/* À traiter */}
      <section aria-labelledby="cli-todo" className="space-y-3">
        <SectionTitle
          id="cli-todo"
          title="À traiter"
          hint="Cliquez sur une carte pour filtrer le tableau des clients"
          right={
            canSeeCommercial ? (
              <label className="inline-flex items-center gap-2 text-small text-text">
                Délai
                <select
                  value={delay}
                  onChange={(e) => onDelayChange(Number(e.target.value) as DelayDays)}
                  className="h-9 px-2 border border-border-strong rounded-control bg-surface text-small focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
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
        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${alertCards.length >= 4 ? 'xl:grid-cols-4' : ''}`}>
          {alertCards.map((a) => {
            const meta = ALERT_META[a.key];
            const on = alertFilter === a.key;
            return (
              <button
                key={a.key}
                type="button"
                aria-pressed={on}
                data-kpi={`CLI-${meta.mockup.replace(' ', '').replace('(', '').replace(')', '')}`}
                onClick={() => onAlertClick(a.key)}
                className={`text-left rounded-card border p-4 shadow-card transition-shadow hover:shadow-raised focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus ${
                  on ? 'border-primary bg-primary-50' : 'border-border bg-surface'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-small font-semibold text-text">{a.title}</span>
                  <span className={`px-2 py-0.5 rounded-pill border text-mention font-semibold uppercase ${meta.tagCls}`}>{meta.tag}</span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-kpi text-text tabular-nums">{fmt(a.count)}</span>
                  <span className="text-small text-text-muted">{a.unit}</span>
                </div>
                <p className="text-mention text-text-muted truncate" title={a.detail}>
                  {a.detail}
                </p>
                <p className="mt-1 text-mention text-text-muted">{on ? 'Filtre actif · cliquez pour le retirer' : `${meta.mockup}`}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Répartition */}
      <section aria-labelledby="cli-rep" className="space-y-3">
        <SectionTitle id="cli-rep" title="Répartition" />
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* CLI-D-01 Clients et équipements par pack */}
          <div className="bg-surface rounded-card border border-border shadow-card p-5">
            <h3 className="text-small font-semibold text-text">Clients et équipements par pack</h3>
            <p className="text-mention text-text-muted mb-2">
              Un client à plusieurs packs compte dans chacun · longueur = équipements du pack · cliquez pour filtrer le tableau · D-01
            </p>
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
          </div>
          {/* CLI-D-02 Connectés / non connectés */}
          <div className="bg-surface rounded-card border border-border shadow-card p-5">
            <h3 className="text-small font-semibold text-text">
              {isNetwork ? 'Équipements hors ligne par propriétaire' : 'Équipements hors ligne par client'}
            </h3>
            <p className="text-mention text-text-muted mb-2">
              {isNetwork ? 'Un propriétaire par ligne · cliquez pour voir ses clients' : 'Triés par non connectés · cliquez pour ouvrir la fiche'} · D-02
            </p>
            <ul className="divide-y divide-border-subtle">
              {data.d02.slice(0, isNetwork ? 10 : 8).map((r) => (
                <li key={r.key}>
                  <button
                    type="button"
                    onClick={() => (isNetwork ? onOwnerClick(r.key) : onClientOpen(Number(r.key), 'equipements'))}
                    className="flex flex-wrap sm:flex-nowrap w-full items-center gap-x-3 gap-y-1 px-2 py-2.5 text-left rounded-control hover:bg-primary-50 transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
                  >
                    {/* FleetIQ 13 (B5) : < 640 px, le libellé prend sa propre ligne (même règle que B4) */}
                    <span className="basis-full min-w-0 truncate text-small font-medium text-text sm:basis-auto sm:w-40 sm:shrink-0">{r.label}</span>
                    <span className="flex-1 min-w-[80px]">
                      <StackedBar
                        height="md"
                        labelMinShare={1}
                        ariaLabel={`${r.label} : connectés et non connectés`}
                        segments={[
                          { key: 'c', label: 'Connectés', value: r.connected, tone: 'success' },
                          { key: 'n', label: 'Non connectés', value: r.assigned - r.connected, tone: 'danger' }
                        ]}
                      />
                    </span>
                    <span className="shrink-0 text-right text-small tabular-nums sm:w-40">
                      <b className="text-danger-700">{fmt(r.assigned - r.connected)}</b> hors ligne / {fmt(r.assigned)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-2">
              <Legend
                items={[
                  { tone: 'success', label: 'Connectés' },
                  { tone: 'danger', label: 'Non connectés' }
                ]}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
