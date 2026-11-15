/**
 * Gestion des puces v3 (Puces-v3 · Documentation-Puces-v3) – calcul des KPI à partir de FleetStore. Carte FleetIQ 09.
 * IDs préfixés `PU-` (analyse § 7-5) ; l'ID de la maquette est gardé à côté (P-xx, T-21, F-21, C-xx, S-xx, A-21).
 *
 * Règles (documentation de la maquette) :
 * - Une puce est INSTALLÉE si elle est affectée à un équipement installé (posé chez le client, hors stock) – même règle
 *   que le Tableau de bord (TDB-D-04 / D-08). Sinon elle est NON INSTALLÉE, avec le détail : affectée à un équipement
 *   non posé · payée sans équipement (client défini, aucun équipement) · en stock (client « *_Stock »).
 * - Réseau = Tunav (clients directs + stock Tunav) et chaque revendeur (champ `reseller` de la puce).
 * - Consommation : totaux MENSUELS fictifs (SIMConsumptionHistory par jour à confirmer back-end). « 7 derniers jours » et
 *   « 30 jours » sont ESTIMÉS à partir des totaux mensuels (doc, point à confirmer n° 6).
 * - Surconsommation (P-07, C-21, C-25) = somme sur les mois de la période de MAX(0, conso du mois − forfait mensuel) ;
 *   7 j / 30 j : MAX(0, conso − forfait × jours ÷ 30). Offre sans forfait (illimitée) : jamais en surconsommation.
 * - Prix : cette page est la SEULE qui montre les prix des puces (prix fixe par puce et par mois de l'offre, coût
 *   mensuel par offre, par réseau, par client). Aucun prix de revente ni marge.
 */
import type { FleetEquipment, SimCard, SimConsumption, SimOffer } from '../state/FleetStore';
import { daysBetween, formatMonthFr, formatMonthShortFr, parseDate, toIsoMonth } from '../state/mock/dates';
import { fmt, networkLabel, pct, volume } from './dashboardKpis';

export { fmt, pct, volume, networkLabel };

/* ------------------------------------------------------------------ paramètres (à confirmer) */

/** @MinMo – bas de l'intervalle attendu sur 30 j (puce muette en dessous) – à confirmer */
export const MIN_MO = 100;
/** @RemindPct – rappel au client au-delà de ce % du forfait (30 j) – à confirmer */
export const REMIND_PCT = 80;
/** @MuteDays – jours sans consommation pour une puce muette – à confirmer */
export const MUTE_DAYS = 7;

export const NETWORK_ORDER = ['Tunav', 'MyCom', 'FleetPro Sfax', 'NavSud'];

/* ------------------------------------------------------------------ formats */

export const formatTnd = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'TND', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

/** « +1,3 Go » (dépassement) */
export const plusVolume = (mo: number) => `+${volume(mo)}`;

export const frDate = (s: string | null | undefined) => {
  const d = parseDate(s);
  return d ? d.toLocaleDateString('fr-FR') : '—';
};

export const stockLabel = (client: string) => `Stock ${client.replace(/_Stock$/, '')}`;
export const isStockClient = (client: string) => client.endsWith('_Stock');

/* ------------------------------------------------------------------ période */

export type PeriodKind = '7j' | '30j' | 'mois' | 'annee';
export const PERIOD_OPTIONS: Array<{ key: PeriodKind; label: string }> = [
  { key: '7j', label: '7 derniers jours' },
  { key: '30j', label: '30 jours' },
  { key: 'mois', label: 'Mois' },
  { key: 'annee', label: 'Année' }
];

export type SimPeriod = {
  kind: PeriodKind;
  /** mois choisi (AAAA-MM) pour « Mois » */
  month: string;
  /** libellé court : « oct. 2026 », « 30 derniers jours »… */
  label: string;
  /** libellé de la période de comparaison : « vs sept. » */
  prevLabel: string;
  /** nombre de mois couverts (fractionnaire) – sert à « Conso / mois » et au forfait de la période */
  monthsCount: number;
  /** mois de l'année (« Année ») */
  yearMonths: string[];
  estimated: boolean;
};

export type PeriodContext = {
  today: Date;
  /** AAAA-MM du mois en cours */
  currentMonth: string;
  /** dernier mois complet (défaut de « Mois », même mois que TDB-D-11) */
  lastFullMonth: string;
  /** jours écoulés du mois en cours (le jeu fictif couvre le mois en cours au prorata) */
  elapsed: number;
  /** mois de janvier au mois en cours (sélecteur « Mois », S-23, fiche F-21) */
  yearMonths: string[];
};

const monthOffset = (month: string, k: number) => {
  const [y, m] = month.split('-').map(Number);
  return toIsoMonth(new Date(y, m - 1 + k, 1));
};
const daysInMonth = (month: string) => {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m, 0).getDate();
};

export function periodContext(today: Date): PeriodContext {
  const currentMonth = toIsoMonth(today);
  const yearMonths: string[] = [];
  for (let m = 0; m <= today.getMonth(); m++) yearMonths.push(toIsoMonth(new Date(today.getFullYear(), m, 1)));
  return {
    today,
    currentMonth,
    lastFullMonth: monthOffset(currentMonth, -1),
    elapsed: Math.max(1, today.getDate()),
    yearMonths
  };
}

export function buildPeriod(kind: PeriodKind, month: string, ctx: PeriodContext): SimPeriod {
  const curShare = ctx.elapsed / daysInMonth(ctx.currentMonth);
  if (kind === '7j')
    return { kind, month, label: '7 derniers jours', prevLabel: 'vs semaine moy. du mois préc.', monthsCount: 7 / 30, yearMonths: [], estimated: true };
  if (kind === '30j')
    return { kind, month, label: '30 derniers jours', prevLabel: 'vs 30 j précédents', monthsCount: 1, yearMonths: [], estimated: true };
  if (kind === 'annee') {
    const n = ctx.yearMonths.length - 1 + curShare;
    return {
      kind,
      month,
      label: `janv. → ${formatMonthFr(ctx.currentMonth)}`,
      prevLabel: 'vs année préc.',
      monthsCount: n,
      yearMonths: ctx.yearMonths,
      estimated: false
    };
  }
  const isCurrent = month === ctx.currentMonth;
  return {
    kind,
    month,
    label: `${formatMonthFr(month)}${isCurrent ? ' (en cours)' : ''}`,
    prevLabel: `vs ${formatMonthShortFr(monthOffset(month, -1))}`,
    monthsCount: isCurrent ? curShare : 1,
    yearMonths: [],
    estimated: false
  };
}

/* ------------------------------------------------------------------ consommation */

export type ConsIndex = Map<number, Map<string, number>>;

export function indexConsumption(list: SimConsumption[]): ConsIndex {
  const m: ConsIndex = new Map();
  for (const c of list) {
    let row = m.get(c.simId);
    if (!row) {
      row = new Map();
      m.set(c.simId, row);
    }
    row.set(c.month, c.usedMB);
  }
  return m;
}

export type Usage = {
  /** Mo consommés sur la période */
  used: number;
  /** forfait de la période (Mo) ; null = offre illimitée ou sans offre */
  quota: number | null;
  /** Mo au-delà du forfait */
  excess: number;
};

/** Consommation d'une puce sur une période (règles en tête de fichier). */
export function usageOf(
  cons: Map<string, number> | undefined,
  monthlyQuota: number | null,
  period: SimPeriod,
  ctx: PeriodContext
): Usage {
  const v = (m: string) => cons?.get(m) ?? 0;
  const q = monthlyQuota;
  const cur = v(ctx.currentMonth);
  const prevM = ctx.lastFullMonth;
  const prev = v(prevM);
  if (period.kind === '30j' || period.kind === '7j') {
    const days = period.kind === '7j' ? 7 : 30;
    const fromPrev = Math.max(0, days - ctx.elapsed);
    const used = fromPrev > 0 ? cur + (prev * fromPrev) / daysInMonth(prevM) : (cur * days) / ctx.elapsed;
    const quota = q == null ? null : (q * days) / 30;
    return { used, quota, excess: quota == null ? 0 : Math.max(0, used - quota) };
  }
  if (period.kind === 'annee') {
    let used = 0;
    let excess = 0;
    for (const m of period.yearMonths) {
      const u = v(m);
      used += u;
      if (q != null) excess += Math.max(0, u - q);
    }
    return { used, quota: q == null ? null : q * period.monthsCount, excess };
  }
  const used = v(period.month);
  return { used, quota: q == null ? null : q * period.monthsCount, excess: q == null ? 0 : Math.max(0, used - q) };
}

/** Consommation de la période précédente (colonne « vs … » de C-21) ; null si l'historique manque. */
export function prevUsageOf(cons: Map<string, number> | undefined, period: SimPeriod, ctx: PeriodContext): number | null {
  if (!cons) return null;
  const has = (m: string) => cons.has(m);
  const v = (m: string) => cons.get(m) ?? 0;
  if (period.kind === 'mois') {
    const pm = monthOffset(period.month, -1);
    return has(pm) ? v(pm) : null;
  }
  if (period.kind === 'annee') {
    const months = period.yearMonths.map((m) => monthOffset(m, -12));
    if (!months.every(has)) return null;
    return months.reduce((s, m) => s + v(m), 0);
  }
  const p1 = ctx.lastFullMonth;
  const p2 = monthOffset(p1, -1);
  if (period.kind === '7j') return has(p1) ? (v(p1) * 7) / daysInMonth(p1) : null;
  // 30 j précédents ≈ début du mois précédent + fin du mois d'avant
  const fromP1 = Math.min(daysInMonth(p1), ctx.elapsed);
  const fromP2 = Math.max(0, 30 - fromP1);
  if (!has(p1) || (fromP2 > 0 && !has(p2))) return null;
  return (v(p1) * fromP1) / daysInMonth(p1) + (v(p2) * fromP2) / daysInMonth(p2);
}

/* ------------------------------------------------------------------ lignes (une par puce) */

export type SimDetail = 'installed' | 'non_posee' | 'sans_equipement' | 'stock';
export const DETAIL_LABEL: Record<SimDetail, string> = {
  installed: 'Installée',
  non_posee: 'affectée, équipement non posé',
  sans_equipement: 'payée sans équipement',
  stock: 'en stock'
};
export const DETAIL_TITLE: Record<Exclude<SimDetail, 'installed'>, string> = {
  non_posee: 'Affectée, équipement non posé',
  sans_equipement: 'Payée sans équipement',
  stock: 'En stock'
};

export type SimAlert = 'haut' | 'bas' | null;

export type SimRow = {
  sim: SimCard;
  offer: SimOffer | undefined;
  /** forfait mensuel (Mo) ; null = illimité / sans offre */
  quota: number | null;
  /** prix fixe par puce et par mois (TND) ; null = sans offre */
  price: number | null;
  network: string;
  networkLabel: string;
  /** nom du client affiché (« Stock Tunav » pour le stock) */
  clientLabel: string;
  isStock: boolean;
  eq: FleetEquipment | undefined;
  installed: boolean;
  detail: SimDetail;
  /** période choisie */
  usage: Usage;
  prevUsed: number | null;
  /** 30 derniers jours (alertes P-04 / A-21, fiche) */
  used30: number;
  pct30: number | null;
  /** 7 derniers jours (puce muette) */
  used7: number;
  alert: SimAlert;
  muted: boolean;
};

export type SimsInput = {
  simCards: SimCard[];
  simOffers: SimOffer[];
  equipments: FleetEquipment[];
  cons: ConsIndex;
  period: SimPeriod;
  ctx: PeriodContext;
};

export function buildSimRows({ simCards, simOffers, equipments, cons, period, ctx }: SimsInput): SimRow[] {
  const offerById = new Map(simOffers.map((o) => [o.id, o]));
  const eqById = new Map(equipments.map((e) => [e.id, e]));
  const p30 = buildPeriod('30j', ctx.currentMonth, ctx);
  const p7 = buildPeriod('7j', ctx.currentMonth, ctx);
  return simCards.map((sim) => {
    const offer = sim.offerId != null ? offerById.get(sim.offerId) : undefined;
    const quota = offer?.dataQuotaMB ?? null;
    const eq = sim.equipmentId != null ? eqById.get(sim.equipmentId) : undefined;
    const isStock = isStockClient(sim.client);
    // PU-P-02 : même règle que TDB-D-04 (équipement installé, hors stock)
    const installed = !!eq && !isStockClient(eq.client) && eq.isInstalled;
    const detail: SimDetail = installed ? 'installed' : isStock ? 'stock' : eq ? 'non_posee' : 'sans_equipement';
    const c = cons.get(sim.id);
    const u30 = usageOf(c, quota, p30, ctx);
    const u7 = usageOf(c, quota, p7, ctx);
    const pct30 = quota ? Math.round((u30.used * 100) / quota) : null;
    // PU-P-04 : alertes sur 30 j, puces installées seulement (les non installées sont dans P-03)
    const muted = installed && (u30.used < MIN_MO || u7.used <= 0);
    const alert: SimAlert = !installed ? null : pct30 != null && pct30 >= REMIND_PCT ? 'haut' : muted ? 'bas' : null;
    return {
      sim,
      offer,
      quota,
      price: offer ? offer.pricePerSim : null,
      network: sim.reseller,
      networkLabel: networkLabel(sim.reseller),
      clientLabel: isStock ? stockLabel(sim.client) : sim.client,
      isStock,
      eq,
      installed,
      detail,
      usage: usageOf(c, quota, period, ctx),
      prevUsed: prevUsageOf(c, period, ctx),
      used30: u30.used,
      pct30,
      used7: u7.used,
      alert,
      muted
    };
  });
}

/** Jours sans service (fiche F-21) : 0 si la puce consomme, sinon jours depuis la dernière communication de
 *  l'équipement (ou depuis l'activation) – estimé, SIMConsumptionHistory par jour à confirmer back-end. */
export function daysWithoutService(r: SimRow, today: Date): number {
  if (r.used7 > 0) return 0;
  const last = r.eq?.lastCommunication ? new Date(r.eq.lastCommunication) : parseDate(r.sim.activationDate);
  return last ? Math.max(0, Math.floor(daysBetween(last, today))) : 0;
}

/* ------------------------------------------------------------------ agrégats */

export type NetworkSummary = {
  network: string;
  label: string;
  clients: number;
  sims: number;
  installed: number;
  notInstalled: number;
  /** coût mensuel (prix fixe × puces) */
  cost: number;
};

export type OfferSummary = {
  key: string;
  offer: SimOffer | undefined;
  name: string;
  operator: string;
  price: number | null;
  quota: number | null;
  sims: number;
  installed: number;
  cost: number;
  costNotInstalled: number;
};

export type OperatorSummary = {
  operator: string;
  sims: number;
  active: number;
  used: number;
  excess: number;
};

export type OverNetwork = { network: string; label: string; sims: number; overSims: number; clients: number; excessMB: number };

export type SimsData = {
  rows: SimRow[];
  total: number;
  installed: number;
  notInstalled: number;
  parts: Record<Exclude<SimDetail, 'installed'>, number>;
  tunavSims: number;
  resellerSims: number;
  cost: number;
  networks: NetworkSummary[];
  offers: OfferSummary[];
  operators: OperatorSummary[];
  /** PU-P-07 : puces au-delà du forfait sur la période (de la plus en dépassement à la moins) */
  over: SimRow[];
  overMB: number;
  overNetworks: OverNetwork[];
  /** PU-P-04 / PU-A-21 (30 derniers jours) */
  alerts: {
    overClients: Array<{ client: string; network: string; sims: SimRow[]; excessMB: number }>;
    high: SimRow[];
    low: SimRow[];
    noEquipment: SimRow[];
  };
};

const sortNetworks = (a: string, b: string) => {
  const ia = NETWORK_ORDER.indexOf(a);
  const ib = NETWORK_ORDER.indexOf(b);
  return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
};

export function computeSims(rows: SimRow[], allNetworks: string[]): SimsData {
  const installed = rows.filter((r) => r.installed).length;
  const parts = { non_posee: 0, sans_equipement: 0, stock: 0 };
  for (const r of rows) if (r.detail !== 'installed') parts[r.detail] += 1;

  const netMap = new Map<string, NetworkSummary & { clientSet: Set<string> }>();
  const ensureNet = (n: string) => {
    let x = netMap.get(n);
    if (!x) {
      x = { network: n, label: networkLabel(n), clients: 0, sims: 0, installed: 0, notInstalled: 0, cost: 0, clientSet: new Set() };
      netMap.set(n, x);
    }
    return x;
  };
  allNetworks.forEach(ensureNet);
  for (const r of rows) {
    const x = ensureNet(r.network);
    x.sims += 1;
    if (r.installed) x.installed += 1;
    else x.notInstalled += 1;
    x.cost += r.price ?? 0;
    if (!r.isStock) x.clientSet.add(r.sim.client);
  }
  const networks = Array.from(netMap.values())
    .filter((x) => allNetworks.includes(x.network) || x.sims > 0)
    .map(({ clientSet, ...x }) => ({ ...x, clients: clientSet.size }))
    .sort((a, b) => sortNetworks(a.network, b.network));

  const offerMap = new Map<string, OfferSummary>();
  for (const r of rows) {
    const key = r.offer ? String(r.offer.id) : 'none';
    let o = offerMap.get(key);
    if (!o) {
      o = {
        key,
        offer: r.offer,
        name: r.offer?.name ?? 'Aucune offre',
        operator: r.offer?.operator ?? '—',
        price: r.price,
        quota: r.quota,
        sims: 0,
        installed: 0,
        cost: 0,
        costNotInstalled: 0
      };
      offerMap.set(key, o);
    }
    o.sims += 1;
    if (r.installed) o.installed += 1;
    else o.costNotInstalled += r.price ?? 0;
    o.cost += r.price ?? 0;
  }
  const offers = Array.from(offerMap.values()).sort((a, b) => (a.key === 'none' ? 1 : b.key === 'none' ? -1 : Number(a.key) - Number(b.key)));

  const opMap = new Map<string, OperatorSummary>();
  for (const r of rows) {
    const op = r.offer?.operator ?? '—';
    let o = opMap.get(op);
    if (!o) {
      o = { operator: op, sims: 0, active: 0, used: 0, excess: 0 };
      opMap.set(op, o);
    }
    o.sims += 1;
    if (r.usage.used > 0.5) o.active += 1;
    o.used += r.usage.used;
    o.excess += r.usage.excess;
  }
  const operators = Array.from(opMap.values()).sort((a, b) => b.used - a.used);

  const over = rows.filter((r) => r.usage.excess > 0.5).sort((a, b) => b.usage.excess - a.usage.excess);
  const overNetMap = new Map<string, OverNetwork & { clientSet: Set<string> }>();
  for (const n of networks) overNetMap.set(n.network, { network: n.network, label: n.label, sims: n.sims, overSims: 0, clients: 0, excessMB: 0, clientSet: new Set() });
  for (const r of over) {
    const x = overNetMap.get(r.network);
    if (!x) continue;
    x.overSims += 1;
    x.excessMB += r.usage.excess;
    x.clientSet.add(r.sim.client);
  }
  const overNetworks = Array.from(overNetMap.values())
    .map(({ clientSet, ...x }) => ({ ...x, clients: clientSet.size }))
    .sort((a, b) => b.overSims - a.overSims || b.excessMB - a.excessMB);

  // PU-A-21 : clients dont une puce dépasse son forfait sur les 30 derniers jours (estimé, voir en-tête)
  const overClientMap = new Map<string, { client: string; network: string; sims: SimRow[]; excessMB: number }>();
  for (const r of rows) {
    if (r.quota == null || r.isStock || r.used30 <= r.quota) continue;
    let x = overClientMap.get(r.sim.client);
    if (!x) {
      x = { client: r.sim.client, network: r.network, sims: [], excessMB: 0 };
      overClientMap.set(r.sim.client, x);
    }
    x.sims.push(r);
    x.excessMB += r.used30 - r.quota;
  }
  const overClients = Array.from(overClientMap.values()).sort((a, b) => b.excessMB - a.excessMB);

  return {
    rows,
    total: rows.length,
    installed,
    notInstalled: rows.length - installed,
    parts,
    tunavSims: rows.filter((r) => r.network === 'Tunav').length,
    resellerSims: rows.filter((r) => r.network !== 'Tunav').length,
    cost: rows.reduce((s, r) => s + (r.price ?? 0), 0),
    networks,
    offers,
    operators,
    over,
    overMB: over.reduce((s, r) => s + r.usage.excess, 0),
    overNetworks,
    alerts: {
      overClients,
      high: rows.filter((r) => r.alert === 'haut').sort((a, b) => (b.pct30 ?? 0) - (a.pct30 ?? 0)),
      low: rows.filter((r) => r.alert === 'bas'),
      noEquipment: rows.filter((r) => r.detail === 'sans_equipement')
    }
  };
}

/* ------------------------------------------------------------------ C-21 : arbre revendeur → clients → puces */

export type ConsGroup = {
  key: string;
  label: string;
  network: string;
  sims: SimRow[];
  installed: number;
  used: number;
  /** forfait de la période des puces installées avec forfait */
  quotaInstalled: number;
  /** conso de ces mêmes puces (numérateur du % utilisé) */
  usedInstalled: number;
  excess: number;
  overSims: number;
  prev: number | null;
};

export function groupConsumption(rows: SimRow[], by: 'network' | 'client'): ConsGroup[] {
  const map = new Map<string, ConsGroup>();
  for (const r of rows) {
    const key = by === 'network' ? r.network : r.sim.client;
    let g = map.get(key);
    if (!g) {
      g = {
        key,
        label: by === 'network' ? r.networkLabel : r.clientLabel,
        network: r.network,
        sims: [],
        installed: 0,
        used: 0,
        quotaInstalled: 0,
        usedInstalled: 0,
        excess: 0,
        overSims: 0,
        prev: 0
      };
      map.set(key, g);
    }
    g.sims.push(r);
    g.used += r.usage.used;
    g.excess += r.usage.excess;
    if (r.usage.excess > 0.5) g.overSims += 1;
    if (r.installed) {
      g.installed += 1;
      if (r.usage.quota != null) {
        g.quotaInstalled += r.usage.quota;
        g.usedInstalled += r.usage.used;
      }
    }
    g.prev = g.prev == null || r.prevUsed == null ? null : g.prev + r.prevUsed;
  }
  for (const g of map.values()) g.sims.sort((a, b) => b.usage.excess - a.usage.excess || b.usage.used - a.usage.used);
  return Array.from(map.values()).sort((a, b) => b.used - a.used);
}

export type ConsFilter = 'all' | 'over' | 'high' | 'low' | 'none';
export const CONS_FILTERS: Array<{ key: ConsFilter; label: string }> = [
  { key: 'all', label: 'Toutes' },
  { key: 'over', label: 'Avec surconsommation' },
  { key: 'high', label: `≥ ${REMIND_PCT} % du forfait` },
  { key: 'low', label: '< 20 % du forfait' },
  { key: 'none', label: 'Aucune consommation' }
];

export const usedPct = (g: Pick<ConsGroup, 'usedInstalled' | 'quotaInstalled'>) =>
  g.quotaInstalled > 0 ? Math.round((g.usedInstalled * 100) / g.quotaInstalled) : null;

export function matchesConsFilter(g: ConsGroup, f: ConsFilter): boolean {
  const p = usedPct(g);
  if (f === 'over') return g.overSims > 0;
  if (f === 'high') return p != null && p >= REMIND_PCT;
  if (f === 'low') return p != null && p < 20;
  if (f === 'none') return g.used < 1;
  return true;
}

/* ------------------------------------------------------------------ S-23 : évolution mensuelle */

export type MonthPoint = { month: string; used: number; quota: number; excess: number };

/** Par groupe (réseau ou client) et par mois de l'année : conso, forfait des puces installées, dépassement. */
export function monthlyEvolution(rows: SimRow[], cons: ConsIndex, months: string[], keyOf: (r: SimRow) => string) {
  const out = new Map<string, MonthPoint[]>();
  for (const r of rows) {
    const k = keyOf(r);
    let pts = out.get(k);
    if (!pts) {
      pts = months.map((m) => ({ month: m, used: 0, quota: 0, excess: 0 }));
      out.set(k, pts);
    }
    const c = cons.get(r.sim.id);
    const target = pts;
    months.forEach((m, i) => {
      const u = c?.get(m) ?? 0;
      target[i].used += u;
      if (r.quota != null) {
        if (r.installed) target[i].quota += r.quota;
        target[i].excess += Math.max(0, u - r.quota);
      }
    });
  }
  return out;
}

/* ------------------------------------------------------------------ filtres de la liste T-21 */

export type StatusFilter = '' | 'installee' | 'non_installee' | 'non_posee' | 'sans_equipement' | 'stock';
export const STATUS_FILTERS: Array<{ key: StatusFilter; label: string }> = [
  { key: '', label: 'Tous' },
  { key: 'installee', label: 'Installée' },
  { key: 'non_installee', label: 'Non installée' },
  { key: 'non_posee', label: '· affectée, équipement non posé' },
  { key: 'sans_equipement', label: '· payée sans équipement' },
  { key: 'stock', label: '· en stock' }
];
export type AlertFilter = '' | 'toutes' | 'haut' | 'bas' | 'surconso' | 'sans_equipement';
export const ALERT_FILTERS: Array<{ key: AlertFilter; label: string }> = [
  { key: '', label: 'Toutes' },
  { key: 'toutes', label: 'Toutes les alertes (cloche)' },
  { key: 'haut', label: `≥ ${REMIND_PCT} % du forfait (30 j)` },
  { key: 'bas', label: 'Sous l’intervalle (muette)' },
  { key: 'surconso', label: 'Au-delà du forfait (période)' },
  { key: 'sans_equipement', label: 'Payée sans équipement' }
];

export type ListFilters = {
  q: string;
  status: StatusFilter;
  offer: string;
  operator: string;
  network: string;
  client: string;
  alert: AlertFilter;
};
export const EMPTY_FILTERS: ListFilters = { q: '', status: '', offer: '', operator: '', network: '', client: '', alert: '' };

/** Puce présente dans la cloche : alerte 30 j, payée sans équipement ou au-delà du forfait sur 30 j (PU-A-21) */
export const isBellAlert = (r: SimRow) =>
  r.alert != null || r.detail === 'sans_equipement' || (!r.isStock && r.quota != null && r.used30 > r.quota);

export function filterRows(rows: SimRow[], f: ListFilters): SimRow[] {
  const q = f.q.trim().toLowerCase();
  return rows.filter((r) => {
    if (f.status === 'installee' && !r.installed) return false;
    if (f.status === 'non_installee' && r.installed) return false;
    if ((f.status === 'non_posee' || f.status === 'sans_equipement' || f.status === 'stock') && r.detail !== f.status) return false;
    if (f.offer && String(r.offer?.id ?? 'none') !== f.offer) return false;
    if (f.operator && (r.offer?.operator ?? '—') !== f.operator) return false;
    if (f.network && r.network !== f.network) return false;
    if (f.client && r.sim.client !== f.client) return false;
    if (f.alert === 'toutes' && !isBellAlert(r)) return false;
    if (f.alert === 'haut' && r.alert !== 'haut') return false;
    if (f.alert === 'bas' && r.alert !== 'bas') return false;
    if (f.alert === 'surconso' && !(r.usage.excess > 0.5)) return false;
    if (f.alert === 'sans_equipement' && r.detail !== 'sans_equipement') return false;
    if (!q) return true;
    return (
      r.sim.phoneNumber.toLowerCase().includes(q) ||
      r.sim.iccid.toLowerCase().includes(q) ||
      String(r.sim.id) === q ||
      r.clientLabel.toLowerCase().includes(q) ||
      (r.eq?.serial.toLowerCase().includes(q) ?? false) ||
      (r.offer?.operator.toLowerCase().includes(q) ?? false)
    );
  });
}

/** Minutes fictives « il y a n min » de la cloche / notification (simulation de la maquette) */
export const simulatedMinutes = (i: number) => [3, 12, 27, 45, 70, 95, 130, 180][i] ?? 60 * (i - 4);

