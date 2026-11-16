/**
 * Gestion des Équipements v3 – cartes du haut et « À traiter » (carte FleetIQ 07).
 * EQ-E-01 Parc (E-01) puis les 4 états en % : EQ-E-05 Installés · EQ-E-04 Non installés · EQ-E-02 Connectés ·
 * EQ-E-03 Non connectés ; détail au clic (fenêtre partagée avec le Tableau de bord).
 * À traiter : EQ-A-23 (déconnectés > 1 j, alerte « En direct »), EQ-A-21 (non connectés > 30 j),
 * EQ-A-22 (installation en attente > 30 j) – un clic filtre le tableau T-11.
 * Tous les chiffres viennent des lignes du tableau (EqRow) ; aucun prix.
 */
import { ArrowRight, CheckCircle2, Clock, Cpu, Wifi, WifiOff } from 'lucide-react';
import type { ReactNode } from 'react';
import { DonutRing, Legend, StackedBar } from '../charts';
import type { DetailSpec } from '../dashboard/DetailModal';
import { SectionRule } from '../shell/PageShell';
import { FAMILY_CLS } from '../ui/StatusTag';
import type { KpiTable } from '../../utils/dashboardKpis';
import {
  byNetworkText,
  compareNetworks,
  countStates,
  groupRowsBy as groupBy,
  fmt,
  networkLabel,
  pct,
  TODO_DAYS,
  type EqAlertKey,
  type EqRow,
  type StateCounts
} from '../../utils/equipmentsKpis';

type Props = {
  rows: EqRow[];
  isNetwork: boolean;
  connDays: number;
  alertDays: number;
  alertFilter: EqAlertKey | null;
  onAlertClick: (k: EqAlertKey) => void;
  onOpenDetail: (d: DetailSpec) => void;
};

/** Tableau « revendeur → client » d'une liste d'équipements (détails E-02…E-05, A-21…A-23) */
function networkClientTable(list: EqRow[], isNetwork: boolean, extra?: { header: string; value: (l: EqRow[]) => string }): KpiTable {
  const rows: Array<Array<string | number>> = [];
  const byNet = groupBy(list, (r) => r.network);
  const nets = Array.from(byNet.entries()).sort((a, b) => compareNetworks(a[0], b[0]));
  for (const [net, l] of nets) {
    if (isNetwork) rows.push([networkLabel(net), l.length, ...(extra ? [extra.value(l)] : [])]);
    const byOwner = Array.from(groupBy(l, (r) => r.owner).entries()).sort((a, b) => b[1].length - a[1].length);
    for (const [owner, ol] of byOwner) rows.push([isNetwork ? `   ↳ ${owner}` : owner, ol.length, ...(extra ? [extra.value(ol)] : [])]);
  }
  return { headers: [isNetwork ? 'Revendeur → client' : 'Client', 'Équipements', ...(extra ? [extra.header] : [])], rows };
}

const maxDays = (l: EqRow[], f: (r: EqRow) => number | null) => {
  const v = Math.max(0, ...l.map((r) => f(r) ?? 0));
  return `${fmt(Math.floor(v))} j`;
};

function TopCard({
  kpiId,
  title,
  children,
  onOpen,
  rail
}: {
  kpiId: string;
  title: string;
  children: ReactNode;
  onOpen: () => void;
  rail?: string;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      data-kpi={kpiId}
      className={`group flex h-full w-full flex-col gap-1.5 text-left bg-surface rounded-card border border-border p-4 pt-3 hover:border-border-strong transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus ${rail ?? ''}`}
    >
      <span className="text-overline uppercase text-text-muted">{title}</span>
      {children}
      <span className="mt-auto inline-flex items-center gap-1 pt-2 border-t border-border-subtle text-mention font-medium text-primary">
        Voir le détail
        <ArrowRight size={14} aria-hidden="true" />
      </span>
    </button>
  );
}

function RateCard({
  kpiId,
  title,
  icon: Icon,
  n,
  of,
  base,
  tone,
  onOpen,
  rail
}: {
  kpiId: string;
  title: string;
  icon: typeof Cpu;
  n: number;
  of: number;
  base: string;
  tone: 'success' | 'danger' | 'warning';
  onOpen: () => void;
  rail?: string;
}) {
  const txt = tone === 'success' ? 'text-success-700' : tone === 'danger' ? 'text-danger-700' : 'text-warning-700';
  return (
    <TopCard kpiId={kpiId} title={title} onOpen={onOpen} rail={rail}>
      <span className="flex items-baseline gap-2 flex-wrap">
        <span className="text-kpi text-text font-qty">{fmt(n)}</span>
        <span className={`text-small font-semibold ${txt}`}>{pct(n, of)} %</span>
        <Icon size={16} className="text-text-muted" aria-hidden="true" />
      </span>
      <p className="text-small text-text-muted">
        sur {fmt(of)} {base}
      </p>
    </TopCard>
  );
}

export function EquipmentsOverview({ rows, isNetwork, connDays, alertDays, alertFilter, onAlertClick, onOpenDetail }: Props) {
  const c: StateCounts = countStates(rows);
  const sold = rows.filter((r) => r.state !== 'stock');
  const installed = sold.filter((r) => r.state !== 'not_installed');
  const conn = `${fmt(connDays)} j`;
  const scopeLabel = isNetwork ? 'Revendeur' : 'Client';
  const groups = (() => {
    const m = groupBy(sold, (r) => (isNetwork ? r.network : r.owner));
    return Array.from(m.entries()).sort((a, b) => (isNetwork ? compareNetworks(a[0], b[0]) : b[1].length - a[1].length));
  })();
  const statesTable: KpiTable = {
    headers: [scopeLabel, 'Vendus', 'Installés', 'Non installés', 'Connectés', 'Non connectés'],
    rows: groups.map(([k, l]) => {
      const x = countStates(l);
      return [
        isNetwork ? networkLabel(k) : k,
        x.sold,
        `${fmt(x.installed)} · ${pct(x.installed, x.sold)} %`,
        `${fmt(x.notInstalled)} · ${pct(x.notInstalled, x.sold)} %`,
        `${fmt(x.connected)} · ${pct(x.connected, x.installed)} %`,
        `${fmt(x.notConnected)} · ${pct(x.notConnected, x.installed)} %`
      ];
    })
  };

  /* ---------- détails des cartes du haut ---------- */
  const openParc = () => {
    const byType = Array.from(groupBy(rows, (r) => r.type).entries()).sort((a, b) => b[1].length - a[1].length);
    onOpenDetail({
      title: 'Parc',
      kpiId: 'EQ-E-01',
      big: fmt(c.park),
      caption: `équipements · ${fmt(c.sold)} vendus · ${fmt(c.stock)} en stock`,
      what: 'Tous les boîtiers du périmètre : vendus (affectés à un client) et en stock. Un vendu est installé ou non installé ; un installé est connecté ou non connecté.',
      definition: `Parc = vendus + stock. Connecté = installé avec un envoi depuis ${conn} ou moins (seuil global).`,
      formula: 'Parc = COUNT(équipements) · Vendus = Parc − Stock · État = connecté | non connecté | non installé | stock',
      chart: (
        <div className="flex flex-wrap items-center gap-6 rounded-control border border-border-subtle p-3">
          <DonutRing
            centerLabel={fmt(c.park)}
            centerSub="équip."
            segments={[
              { label: 'Connecté', value: c.connected, tone: 'success' },
              { label: 'Non connecté', value: c.notConnected, tone: 'danger' },
              { label: 'Non installé', value: c.notInstalled, tone: 'warning' },
              { label: 'Stock', value: c.stock, tone: 'series4' }
            ]}
          />
          <ul className="space-y-1 text-small text-text tabular-nums">
            <li>Connecté : <b>{fmt(c.connected)}</b> · {pct(c.connected, c.park)} %</li>
            <li>Non connecté : <b>{fmt(c.notConnected)}</b> · {pct(c.notConnected, c.park)} %</li>
            <li>Non installé : <b>{fmt(c.notInstalled)}</b> · {pct(c.notInstalled, c.park)} %</li>
            <li>Stock : <b>{fmt(c.stock)}</b> · {pct(c.stock, c.park)} %</li>
          </ul>
        </div>
      ),
      table: statesTable,
      note: (
        <p className="text-text-muted">
          Par type : {byType.map(([t, l]) => `${t} ${l.length}`).join(' · ')}
        </p>
      ),
      route: 'equipments',
      routeLabel: 'Équipements',
      goLabel: 'Voir tout le parc dans le tableau',
      routeQuery: '?etat=tous'
    });
  };
  const openState = (kind: 'installe' | 'non_installe' | 'connecte' | 'non_connecte') => {
    const spec = {
      installe: {
        id: 'EQ-E-05',
        title: 'Installés',
        list: installed,
        of: c.sold,
        base: 'vendus',
        what: 'Équipements vendus déjà posés chez le client (premier envoi reçu), connectés ou non.',
        formula: 'Installés = COUNT(client ≠ stock ET 1er envoi renseigné) · % = Installés ÷ Vendus × 100',
        extra: undefined
      },
      non_installe: {
        id: 'EQ-E-04',
        title: 'Non installés',
        list: sold.filter((r) => r.state === 'not_installed'),
        of: c.sold,
        base: 'vendus',
        what: 'Équipements affectés à un client mais jamais connectés (pas encore posés) : facturés sans service.',
        formula: 'Non installés = COUNT(client ≠ stock ET 1er envoi vide) · % = Non installés ÷ Vendus × 100',
        extra: { header: 'Attente max', value: (l: EqRow[]) => maxDays(l, (r) => r.daysWaiting) }
      },
      connecte: {
        id: 'EQ-E-02',
        title: 'Connectés',
        list: installed.filter((r) => r.state === 'connected'),
        of: c.installed,
        base: 'installés',
        what: `Équipements installés qui ont envoyé au moins une position depuis ${conn} ou moins.`,
        formula: `Connectés = COUNT(installés dont dernière position ≥ aujourd’hui − ${conn}) · % = Connectés ÷ Installés × 100`,
        extra: undefined
      },
      non_connecte: {
        id: 'EQ-E-03',
        title: 'Non connectés',
        list: installed.filter((r) => r.state === 'not_connected'),
        of: c.installed,
        base: 'installés',
        what: `Équipements installés chez un client (donc facturés) sans aucune position depuis plus de ${conn}.`,
        formula: 'Non connectés = Installés − Connectés · % = Non connectés ÷ Installés × 100',
        extra: { header: 'Sans envoi (max)', value: (l: EqRow[]) => maxDays(l, (r) => r.daysSince) }
      }
    }[kind];
    onOpenDetail({
      title: spec.title,
      kpiId: spec.id,
      big: `${pct(spec.list.length, spec.of)} %`,
      caption: `${fmt(spec.list.length)} sur ${fmt(spec.of)} ${spec.base}`,
      what: spec.what,
      definition: 'Installés + Non installés = Vendus ; Connectés + Non connectés = Installés. États du jour.',
      formula: spec.formula,
      table: networkClientTable(spec.list, isNetwork, spec.extra),
      route: 'equipments',
      routeLabel: 'Équipements',
      goLabel: 'Voir la liste dans le tableau',
      routeQuery: `?etat=${kind}`
    });
  };

  /* ---------- À traiter ---------- */
  const live = installed.filter((r) => r.live);
  const off30 = installed.filter((r) => r.off30);
  const pending = sold.filter((r) => r.pending30);
  const cards: Array<{
    key: EqAlertKey;
    id: string;
    title: string;
    tag: string;
    family: 'danger' | 'warning';
    list: EqRow[];
    icon: typeof Cpu;
  }> = [
    {
      key: 'direct',
      id: 'EQ-A-23',
      title: `Déconnectés depuis plus de ${fmt(alertDays)} j`,
      tag: 'SAV · en direct',
      family: 'danger',
      list: live,
      icon: WifiOff
    },
    {
      key: 'non_connecte_30',
      id: 'EQ-A-21',
      title: `Non connectés > ${TODO_DAYS} j`,
      tag: 'SAV',
      family: 'danger',
      list: off30,
      icon: WifiOff
    },
    {
      key: 'attente_30',
      id: 'EQ-A-22',
      title: `Installation en attente > ${TODO_DAYS} j`,
      tag: 'Installation',
      family: 'warning',
      list: pending,
      icon: Clock
    }
  ];

  const notInstalledRail = c.notInstalled > 0 ? 'shadow-rail-warning' : undefined;
  const notConnectedRail = c.notConnected > 0 ? 'shadow-rail-danger' : undefined;

  return (
    <div className="grid grid-cols-12 gap-4 gap-y-8">
      <div className="col-span-12 space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 items-stretch">
          {/* EQ-E-01 Parc (E-01) */}
          <TopCard kpiId="EQ-E-01" title="Parc" onOpen={openParc}>
            <span className="flex items-baseline gap-2 flex-wrap">
              <span className="text-kpi text-text font-qty">{fmt(c.park)}</span>
              <Cpu size={16} className="text-text-muted" aria-hidden="true" />
            </span>
            <p className="text-small text-text-muted">
              {fmt(c.sold)} vendus · {fmt(c.stock)} en stock
            </p>
            <div className="mt-1">
              <StackedBar
                height="md"
                labelMinShare={1}
                ariaLabel="États du parc"
                segments={[
                  { key: 'c', label: 'Connecté', value: c.connected, tone: 'success' },
                  { key: 'n', label: 'Non connecté', value: c.notConnected, tone: 'danger' },
                  { key: 'w', label: 'Non installé', value: c.notInstalled, tone: 'warning' },
                  { key: 's', label: 'Stock', value: c.stock, tone: 'series4' }
                ]}
              />
            </div>
          </TopCard>
          <RateCard kpiId="EQ-E-05" title="Installés" icon={CheckCircle2} n={c.installed} of={c.sold} base="vendus" tone="success" onOpen={() => openState('installe')} />
          <RateCard
            kpiId="EQ-E-04"
            title="Non installés"
            icon={Clock}
            n={c.notInstalled}
            of={c.sold}
            base="vendus"
            tone="warning"
            onOpen={() => openState('non_installe')}
            rail={notInstalledRail}
          />
          <RateCard kpiId="EQ-E-02" title="Connectés" icon={Wifi} n={c.connected} of={c.installed} base="installés" tone="success" onOpen={() => openState('connecte')} />
          <RateCard
            kpiId="EQ-E-03"
            title="Non connectés"
            icon={WifiOff}
            n={c.notConnected}
            of={c.installed}
            base="installés"
            tone="danger"
            onOpen={() => openState('non_connecte')}
            rail={notConnectedRail}
          />
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <Legend
            items={[
              { tone: 'success', label: `Connecté ${fmt(c.connected)}` },
              { tone: 'danger', label: `Non connecté ${fmt(c.notConnected)}` },
              { tone: 'warning', label: `Non installé ${fmt(c.notInstalled)}` },
              { tone: 'series4', label: `Stock ${fmt(c.stock)}` }
            ]}
          />
          <span className="text-mention text-text-muted">
            Installé = connecté + non connecté · connecté = un envoi depuis {conn} ou moins
          </span>
        </div>
      </div>

      <section aria-labelledby="eq-todo" className="col-span-12 grid grid-cols-12 gap-4">
        <SectionRule id="eq-todo" title="À traiter" />
        <div className="col-span-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          {cards.map((a) => {
            const on = alertFilter === a.key;
            const Icon = a.icon;
            const rail =
              a.list.length > 0 ? (a.family === 'danger' ? 'shadow-rail-danger' : 'shadow-rail-warning') : '';
            return (
              <button
                key={a.key}
                type="button"
                aria-pressed={on}
                data-kpi={a.id}
                onClick={() => onAlertClick(a.key)}
                className={`text-left rounded-card border p-4 transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus ${rail} ${
                  on ? 'border-primary bg-primary-50' : 'border-border bg-surface hover:border-border-strong'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="inline-flex items-center gap-2 text-small font-semibold text-text">
                    <Icon size={16} aria-hidden="true" className="text-text-muted" />
                    {a.title}
                  </span>
                  <span
                    className={`shrink-0 inline-flex items-center h-6 px-2 rounded-tag border text-mention font-semibold uppercase tracking-[0.06em] whitespace-nowrap ${FAMILY_CLS[a.family]}`}
                  >
                    {a.tag}
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-kpi text-text font-qty">{fmt(a.list.length)}</span>
                  <span className="text-small text-text-muted">équipement(s)</span>
                </div>
                <p className="text-mention text-text-muted truncate" title={byNetworkText(a.list, isNetwork)}>
                  {byNetworkText(a.list, isNetwork)}
                </p>
                {on && <p className="mt-1 text-mention text-text-muted">Filtre actif</p>}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
