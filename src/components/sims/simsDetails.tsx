/**
 * Gestion des puces v3 – contenu des fenêtres de détail (carte FleetIQ 09). Chaque élément de la page ouvre son détail
 * au clic ; une puce d'une liste ouvre sa fiche (PU-F-21). Prix : prix fixe par puce et par mois seulement.
 */
import type { DetailSpec } from '../dashboard/DetailModal';
import { Legend, StackedBar } from '../charts';
import { SimMiniList, type MiniColumn } from './SimUi';
import {
  DETAIL_TITLE,
  MIN_MO,
  REMIND_PCT,
  fmt,
  formatTnd,
  pct,
  plusVolume,
  volume,
  type OfferSummary,
  type OperatorSummary,
  type OverNetwork,
  type SimDetail,
  type SimPeriod,
  type SimRow,
  type SimsData
} from '../../utils/simsKpis';

export type DetailCtx = {
  data: SimsData;
  period: SimPeriod;
  showPrices: boolean;
  openFiche: (r: SimRow) => void;
};

const list = (ctx: DetailCtx, rows: SimRow[], columns?: MiniColumn[], hideOffer = false) => (
  <SimMiniList
    rows={rows}
    onOpen={ctx.openFiche}
    showPrices={ctx.showPrices}
    columns={columns}
    hideOffer={hideOffer}
    initialSize={5}
  />
);

/** PU-P-01 – Total puces */
export function totalDetail(ctx: DetailCtx): DetailSpec {
  const { data } = ctx;
  return {
    title: 'Total puces',
    kpiId: 'PU-P-01',
    big: fmt(data.total),
    caption: `puces · Tunav ${fmt(data.tunavSims)} · revendeurs ${fmt(data.resellerSims)}${ctx.showPrices ? ` · coût ${formatTnd(data.cost)} / mois` : ''}`,
    what: 'Toutes les puces du réseau : clients directs de Tunav (dont le stock) et puces de chaque revendeur.',
    definition: 'Total = toutes les puces SIM du périmètre choisi (barre « Réseau »).',
    formula: 'Total = COUNT(puces) · coût / mois = somme des prix fixes par puce et par mois de leur offre',
    table: {
      headers: ['Réseau', 'Clients', 'Puces', 'Installées', 'Non installées', ...(ctx.showPrices ? ['Coût / mois'] : [])],
      rows: data.networks.map((n) => [n.label, n.clients, n.sims, n.installed, n.notInstalled, ...(ctx.showPrices ? [formatTnd(n.cost)] : [])])
    },
    note: list(ctx, data.rows, ['price', 'status'])
  };
}

/** PU-P-02 – Installées */
export function installedDetail(ctx: DetailCtx): DetailSpec {
  const rows = ctx.data.rows.filter((r) => r.installed);
  return {
    title: 'Puces installées',
    kpiId: 'PU-P-02',
    big: fmt(rows.length),
    caption: `puces · ${pct(rows.length, ctx.data.total)} % du total`,
    what: 'La puce est dans un équipement posé chez le client : c’est le seul état « en service ».',
    definition: 'Installée = puce affectée à un équipement installé (même règle que le Tableau de bord, D-04 / D-08).',
    formula: 'Installées = COUNT(puces dont l’équipement est installé) · % = installées ÷ total',
    note: list(ctx, rows, ['conso', 'status'])
  };
}

/** PU-P-03 – Non installées (trois parts), ou une seule part */
export function notInstalledDetail(ctx: DetailCtx, part?: Exclude<SimDetail, 'installed'>): DetailSpec {
  const { data } = ctx;
  const all = data.rows.filter((r) => !r.installed);
  const rows = part ? all.filter((r) => r.detail === part) : all;
  const order: Record<string, number> = { sans_equipement: 0, non_posee: 1, stock: 2 };
  rows.sort((a, b) => order[a.detail] - order[b.detail]);
  return {
    title: part ? `Non installées · ${DETAIL_TITLE[part]}` : 'Puces non installées',
    kpiId: 'PU-P-03',
    big: fmt(rows.length),
    caption: `puces · ${pct(rows.length, data.total)} % du total`,
    what: 'Une puce non installée a un abonnement mais ne transmet rien : équipement pas encore posé, puce payée sans équipement, ou puce en stock.',
    chart: part ? undefined : (
      <div className="space-y-2">
        <StackedBar
          ariaLabel="Détail des puces non installées"
          segments={[
            { key: 'non_posee', label: DETAIL_TITLE.non_posee, value: data.parts.non_posee, tone: 'warning' },
            { key: 'sans_equipement', label: DETAIL_TITLE.sans_equipement, value: data.parts.sans_equipement, tone: 'danger' },
            { key: 'stock', label: DETAIL_TITLE.stock, value: data.parts.stock, tone: 'neutral' }
          ]}
        />
        <Legend
          items={[
            { tone: 'warning', label: `${DETAIL_TITLE.non_posee} : ${fmt(data.parts.non_posee)}` },
            { tone: 'danger', label: `${DETAIL_TITLE.sans_equipement} : ${fmt(data.parts.sans_equipement)}` },
            { tone: 'neutral', label: `${DETAIL_TITLE.stock} : ${fmt(data.parts.stock)}` }
          ]}
        />
      </div>
    ),
    definition: 'Non installées = total − installées · détail : affectée à un équipement non posé | payée sans équipement (client défini, aucun équipement) | en stock (client « *_Stock »).',
    formula: 'Non installées = Total − Installées',
    note: list(ctx, rows, ctx.showPrices ? ['price', 'status'] : ['status'])
  };
}

/** PU-P-07 – Puces en surconsommation (période de la barre d'outils) */
export function overDetail(ctx: DetailCtx, rows?: SimRow[], title?: string): DetailSpec {
  const { data, period } = ctx;
  const over = rows ?? data.over;
  const mb = over.reduce((s, r) => s + r.usage.excess, 0);
  const byOffer = new Map<string, number>();
  for (const r of over) byOffer.set(r.offer?.name ?? 'Aucune offre', (byOffer.get(r.offer?.name ?? 'Aucune offre') ?? 0) + 1);
  const topOffer = Array.from(byOffer.entries()).sort((a, b) => b[1] - a[1])[0];
  const byNet = new Map<string, { n: number; mb: number; clients: Set<string> }>();
  for (const r of over) {
    const x = byNet.get(r.networkLabel) ?? { n: 0, mb: 0, clients: new Set<string>() };
    x.n += 1;
    x.mb += r.usage.excess;
    x.clients.add(r.sim.client);
    byNet.set(r.networkLabel, x);
  }
  return {
    title: title ?? 'Puces en surconsommation',
    kpiId: 'PU-P-07',
    big: fmt(over.length),
    caption: `puce(s) au-delà du forfait · ${plusVolume(mb)} · ${period.label}${period.estimated ? ' (estimé)' : ''}`,
    what: `Puces qui ont consommé plus que leur forfait data sur la période. ${topOffer ? `Offre la plus touchée : ${topOffer[0]} (${fmt(topOffer[1])} puce(s)).` : ''}`,
    definition: 'Surconsommation = somme sur les mois de la période de MAX(0, conso du mois − forfait) ; 7 j / 30 j : MAX(0, conso − forfait × jours ÷ 30). Offre illimitée : jamais en surconsommation. Forfait data à confirmer back-end.',
    formula: 'Dépassement = Σ MAX(0, conso − forfait) · même chiffre que le Tableau de bord (D-11) pour le dernier mois complet',
    table: {
      headers: ['Réseau', 'Puces', 'Clients', 'Dépassement'],
      rows: Array.from(byNet.entries()).map(([k, x]) => [k, x.n, x.clients.size, plusVolume(x.mb)])
    },
    note: list(ctx, over, ['conso', 'excess'])
  };
}

/** PU-P-05 / PU-S-21 – une offre */
export function offerDetail(ctx: DetailCtx, o: OfferSummary, kpiId = 'PU-P-05'): DetailSpec {
  const rows = ctx.data.rows.filter((r) => String(r.offer?.id ?? 'none') === o.key).sort((a, b) => Number(a.installed) - Number(b.installed));
  const showPrices = ctx.showPrices && kpiId === 'PU-P-05';
  return {
    title: o.name,
    kpiId,
    big: `${fmt(o.installed)} / ${fmt(o.sims)}`,
    caption: `installées / puces · ${pct(o.installed, o.sims)} % · ${o.operator}${o.quota != null ? ` · forfait ${volume(o.quota)} / mois` : ' · data illimitée'}`,
    what: showPrices
      ? `Prix fixe : ${o.price != null ? formatTnd(o.price) : '—'} par puce et par mois · coût ${formatTnd(o.cost)} / mois, dont ${formatTnd(o.costNotInstalled)} pour ${fmt(o.sims - o.installed)} puce(s) non installée(s).`
      : 'Puces de l’offre, les non installées en premier.',
    definition: 'Par offre : installées (équipement posé) / puces de l’offre.',
    formula: showPrices ? 'Coût mensuel = puces × prix fixe par puce et par mois' : 'Non installées = puces − installées',
    note: list(ctx, rows, showPrices ? ['price', 'status'] : ['status'], true)
  };
}

/** PU-C-22 – un opérateur */
export function operatorDetail(ctx: DetailCtx, o: OperatorSummary): DetailSpec {
  const rows = ctx.data.rows.filter((r) => (r.offer?.operator ?? '—') === o.operator).sort((a, b) => a.usage.used - b.usage.used);
  return {
    title: `Consommation · ${o.operator}`,
    kpiId: 'PU-C-22',
    big: volume(o.used),
    caption: `${ctx.period.label} · ${fmt(o.active)} puces actives sur ${fmt(o.sims)} · ${fmt(o.sims - o.active)} sans consommation · ${plusVolume(o.excess)} au-delà du forfait`,
    what: 'Volume consommé par les puces de l’opérateur sur la période (sans prix). Les moins consommatrices en premier.',
    definition: 'Active = puce avec une consommation > 0 sur la période.',
    formula: 'Volume(opérateur) = Σ Mo de ses puces',
    note: list(ctx, rows, ['conso', 'status'])
  };
}

/** PU-C-25 – un réseau */
export function overNetworkDetail(ctx: DetailCtx, n: OverNetwork): DetailSpec {
  const rows = ctx.data.over.filter((r) => r.network === n.network);
  const d = overDetail(ctx, rows, `Surconsommation · ${n.label}`);
  return {
    ...d,
    kpiId: 'PU-C-25',
    caption: `puce(s) au-delà du forfait · ${fmt(n.clients)} client(s) · ${plusVolume(n.excessMB)} · ${ctx.period.label} · ${pct(n.overSims, n.sims)} % de ses ${fmt(n.sims)} puces`,
    table: undefined
  };
}

/** PU-S-22 – une couleur de la barre des statuts */
export function statusDetail(ctx: DetailCtx, installed: boolean): DetailSpec {
  const rows = ctx.data.rows.filter((r) => r.installed === installed);
  return {
    title: installed ? 'Statut · Installée' : 'Statut · Non installée',
    kpiId: 'PU-S-22',
    big: fmt(rows.length),
    caption: `puces · ${pct(rows.length, ctx.data.total)} % du total`,
    note: list(ctx, rows, ['conso', 'status'])
  };
}

/** PU-P-04 – alertes 30 j (cloche, filtre Alerte) */
export function alertDetail(ctx: DetailCtx, kind: 'haut' | 'bas' | 'sans_equipement'): DetailSpec {
  const a = ctx.data.alerts;
  const rows = kind === 'haut' ? a.high : kind === 'bas' ? a.low : a.noEquipment;
  const META = {
    haut: [`Puces à ${REMIND_PCT} % ou plus du forfait`, `Consommation des 30 derniers jours ≥ ${REMIND_PCT} % du forfait : proposer l’offre supérieure.`],
    bas: ['Puces muettes', `Puce installée qui consomme moins de ${MIN_MO} Mo sur 30 j (ou rien sur 7 j) : vérifier l’équipement.`],
    sans_equipement: ['Puces payées sans équipement', 'Le client paie l’abonnement de la puce mais aucun équipement ne la porte : installer ou récupérer la puce.']
  } as const;
  return {
    title: META[kind][0],
    kpiId: 'PU-P-04',
    big: fmt(rows.length),
    caption: 'puce(s) · 30 derniers jours (estimé à partir des totaux mensuels)',
    what: META[kind][1],
    definition: `Alerte haute : conso 30 j ≥ @RemindPct (${REMIND_PCT} %) du forfait · alerte basse : puce installée, conso 30 j < @MinMo (${MIN_MO} Mo) – paramètres à confirmer.`,
    note: list(ctx, rows, kind === 'sans_equipement' ? (ctx.showPrices ? ['price', 'status'] : ['status']) : ['pct30', 'status'])
  };
}

/** PU-A-21 – un client en surconsommation (cloche, notification) */
export function overClientDetail(ctx: DetailCtx, client: { client: string; network: string; sims: SimRow[]; excessMB: number }): DetailSpec {
  return {
    title: `${client.client} : au-delà du forfait`,
    kpiId: 'PU-A-21',
    big: fmt(client.sims.length),
    caption: `puce(s) au-delà du forfait sur 30 j · ${client.network === 'Tunav' ? 'Tunav · clients directs' : client.network} · ${plusVolume(client.excessMB)}`,
    what: 'Alerte « En direct » : une puce du client a dépassé son forfait mensuel. En production, déclenchée à chaque relevé de consommation (job serveur, à confirmer).',
    note: list(ctx, client.sims, ['pct30', 'status'])
  };
}
