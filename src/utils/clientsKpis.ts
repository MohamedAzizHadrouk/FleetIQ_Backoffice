/**
 * Gestion Clients v3 (Clients-v3 · Documentation-Clients-v3) – calcul des KPI à partir de FleetStore.
 * Carte FleetIQ 06. IDs préfixés `CLI-` (analyse § 7-5) ; l'ID de la maquette est gardé à côté (K-xx, A-xx, D-xx, C-xx).
 * Même style que utils/dashboardKpis.ts (TDB-) ; aucun prix n'est calculé ici.
 *
 * Règles (documentation de la maquette + décisions du 2026-11-14) :
 * - Client stock (« *_Stock ») et l'entité « Tunav » : exclus de tous les KPI.
 * - Actif = non bloqué ET date « État au » ≤ expiration + @GraceDays (30 j) (même règle que le Tableau de bord).
 * - Bloqué dans N j (A-04 a) = abonnement expiré depuis 0 à 30 j, pas encore bloqué ; N = expiration + 30 j − date.
 * - Connecté = équipement affecté (hors stock) dont la dernière communication ≤ seuil global (7 j par défaut).
 *   Les états des équipements sont ceux du jour (pas d'historique quotidien – à confirmer back-end).
 * - « Délai » (A-01, A-02, D-04) = 15, 30 (défaut) ou 60 j.
 */
import type { FleetClient, FleetEquipment, OfferChange, Pack, UserConnection } from '../state/FleetStore';
import { addDays, daysBetween, formatMonthFr, parseDate, toIsoDate, toIsoMonth } from '../state/mock/dates';
import type { KpiTable } from './dashboardKpis';

export const DELAY_OPTIONS = [15, 30, 60] as const;
export type DelayDays = (typeof DELAY_OPTIONS)[number];

/** Filtre « À traiter » appliqué au tableau (clic sur une carte ou paramètre d'URL `alerte`) */
export type AlertKey = 'blocage' | 'echeance' | 'relance' | 'jamais';
export const ALERT_KEYS: AlertKey[] = ['blocage', 'echeance', 'relance', 'jamais'];

export type Priority = 'Critique' | 'À risque' | 'À surveiller' | 'OK';
export type Reason = { level: Exclude<Priority, 'OK'>; reason: string; action: string };

export type ClientInfo = {
  client: FleetClient;
  /** « Tunav (direct) » ou nom du revendeur */
  owner: string;
  /** le client existe à la date « État au » (création ≤ date) */
  exists: boolean;
  active: boolean;
  /** jours avant blocage (A-04 a) ; null si non concerné */
  blockedInDays: number | null;
  /** échéance − date (jours, peut être négatif) */
  daysToExpiry: number | null;
  /** packs : un par pack (équipements du pack + packs sans équipement) */
  packs: Array<{ packId: number; name: string; equipments: number }>;
  /** équipements du client (revendeur : tout son réseau, hors stock) */
  equipments: FleetEquipment[];
  assigned: number;
  installed: number;
  connected: number;
  neverConnected: number;
  lastLogin: Date | null;
  lastChannel: 'PC' | 'Mobile' | null;
  /** dernière communication d'un de ses équipements */
  lastEquipmentComm: Date | null;
  priority: Priority;
  reasons: Reason[];
};

export type OwnerRow = { key: string; label: string; clients: number; connected: number; assigned: number };

export type MonthCell = { month: string; label: string };

export type ClientsKpiInput = {
  /** clients du périmètre (vue Tunav : tous ; revendeur : ses clients) – sans stock */
  clients: FleetClient[];
  /** équipements visibles (vue Tunav : tous ; revendeur : son réseau) */
  equipments: FleetEquipment[];
  userConnections: UserConnection[];
  packs: Pack[];
  offerChanges: OfferChange[];
  asOf: Date;
  now: Date;
  connHours: number;
  graceDays: number;
  delayDays: number;
  isNetwork: boolean;
};

export const fmt = (n: number) => n.toLocaleString('fr-FR');
export const pct = (a: number, b: number) => (b ? Math.round((a * 100) / b) : 0);
export const ownerLabel = (reseller: string) => (reseller === 'Tunav' ? 'Tunav (direct)' : reseller);
export const frDate = (d: Date | null | undefined) => (d ? d.toLocaleDateString('fr-FR') : '—');
export const frIso = (s: string | null | undefined) => frDate(parseDate(s ?? null));
const isStock = (name: string) => name.endsWith('_Stock');

/** Owner d'un client : les revendeurs et les clients directs appartiennent à Tunav. */
export const ownerKey = (c: FleetClient) => (c.type === 'Revendeur' ? 'Tunav' : c.reseller);

/* ------------------------------------------------------------------ état d'un client à une date */

export type ClientState = 'absent' | 'active' | 'blocked';

/**
 * CLI-K-02 / CLI-K-03 – état d'un client à une date (sert aussi à « Comparer »).
 * Bloqué si la date de blocage est passée, ou si la date dépasse expiration + grâce.
 */
export function clientStateAt(c: FleetClient, d: Date, graceDays: number): ClientState {
  const created = parseDate(c.createdAt);
  if (created && created > d) return 'absent';
  const blockedAt = parseDate(c.blockedAt ?? null);
  if (blockedAt && blockedAt <= d) return 'blocked';
  const exp = parseDate(c.expiry);
  if (exp && d > addDays(exp, graceDays)) return 'blocked';
  if (c.status === 'Blocked' && !c.blockedAt) return 'blocked';
  return 'active';
}

/** Date de passage en bloqué (BlockedAt, ou expiration + grâce si elle est seulement calculée). */
export function blockedDateOf(c: FleetClient, graceDays: number): Date | null {
  const b = parseDate(c.blockedAt ?? null);
  if (b) return b;
  const exp = parseDate(c.expiry);
  return exp ? addDays(exp, graceDays) : null;
}

/** Totaux K-01 / K-02 à une date (« État au » ou date de comparaison). */
export function countsAt(clients: FleetClient[], d: Date, graceDays: number) {
  let total = 0;
  let active = 0;
  for (const c of clients) {
    const st = clientStateAt(c, d, graceDays);
    if (st === 'absent') continue;
    total += 1;
    if (st === 'active') active += 1;
  }
  return { total, active, blocked: total - active };
}

/* ------------------------------------------------------------------ calcul principal */

export type ClientsData = ReturnType<typeof computeClients>;

export function computeClients(input: ClientsKpiInput) {
  const { asOf, now, connHours, graceDays, delayDays, isNetwork } = input;
  const packName = new Map(input.packs.map((p) => [p.id, p.name]));
  const isoAsOf = toIsoDate(asOf);

  /* ---------- équipements par client / revendeur ---------- */
  const sold = input.equipments.filter((e) => !isStock(e.client) && e.client !== 'Tunav');
  const byClient = new Map<string, FleetEquipment[]>();
  const byReseller = new Map<string, FleetEquipment[]>();
  for (const e of sold) {
    pushTo(byClient, e.client, e);
    pushTo(byReseller, e.reseller, e);
  }
  const lastCommOf = (e: FleetEquipment) => (e.lastCommunication ? new Date(e.lastCommunication) : null);
  const isConnected = (e: FleetEquipment) => {
    const d = lastCommOf(e);
    return !!d && daysBetween(d, now) * 24 <= connHours;
  };
  const isNever = (e: FleetEquipment) => !e.lastCommunication && !e.firstSendDate?.trim();

  /* ---------- connexions utilisateurs (journal à confirmer back-end), jusqu'à la date « État au » ---------- */
  const clientIds = new Set(input.clients.map((c) => c.id));
  const logins = input.userConnections.filter((u) => clientIds.has(u.clientId) && u.date.slice(0, 10) <= isoAsOf);
  const lastLogin = new Map<number, { d: Date; ch: 'PC' | 'Mobile' }>();
  for (const u of logins) {
    const d = new Date(u.date);
    const cur = lastLogin.get(u.clientId);
    if (!cur || d > cur.d) lastLogin.set(u.clientId, { d, ch: u.channel });
  }

  /* ---------- fiche synthétique de chaque client ---------- */
  const infos = new Map<number, ClientInfo>();
  for (const c of input.clients) {
    const state = clientStateAt(c, asOf, graceDays);
    const exp = parseDate(c.expiry);
    const daysToExpiry = exp ? Math.round(daysBetween(asOf, exp)) : null;
    const active = state === 'active';
    const blockedInDays =
      active && exp && exp < asOf && exp >= addDays(asOf, -graceDays) ? Math.max(0, Math.round(daysBetween(asOf, addDays(exp, graceDays)))) : null;
    const eqs = c.type === 'Revendeur' ? byReseller.get(c.name) ?? [] : byClient.get(c.name) ?? [];
    // Packs : packs des équipements + packs affectés sans équipement (doc T-01, point 5)
    const packCount = new Map<number, number>();
    for (const e of eqs) if (e.packId != null && c.type !== 'Revendeur') packCount.set(e.packId, (packCount.get(e.packId) ?? 0) + 1);
    for (const a of c.packs) if (!packCount.has(a.packId)) packCount.set(a.packId, 0);
    const packs = Array.from(packCount.entries()).map(([packId, n]) => ({ packId, name: packName.get(packId) ?? `Pack ${packId}`, equipments: n }));
    const connected = eqs.filter(isConnected).length;
    const never = eqs.filter(isNever).length;
    const lastComm = eqs.reduce<Date | null>((m, e) => {
      const d = lastCommOf(e);
      return d && (!m || d > m) ? d : m;
    }, null);
    const ll = lastLogin.get(c.id) ?? null;

    // Priorité de la fiche F-01 (doc) : Critique > À risque > À surveiller > OK
    const reasons: Reason[] = [];
    if (!active) reasons.push({ level: 'Critique', reason: 'Client bloqué', action: 'Régulariser le paiement ou renouveler l’abonnement' });
    else if (blockedInDays != null)
      reasons.push({ level: 'Critique', reason: `Abonnement expiré · bloqué dans ${blockedInDays} j`, action: 'Renouveler avant le blocage' });
    else if (daysToExpiry != null && daysToExpiry <= 10)
      reasons.push({ level: 'Critique', reason: `Expire dans ${Math.max(0, daysToExpiry)} j`, action: 'Relancer pour le renouvellement' });
    if (never > 0) reasons.push({ level: 'Critique', reason: `${never} équipement(s) jamais connecté(s)`, action: 'Planifier l’installation / vérifier le boîtier' });
    if (active && (!ll || daysBetween(ll.d, asOf) > delayDays))
      reasons.push({ level: 'À risque', reason: ll ? `Aucune connexion depuis ${Math.round(daysBetween(ll.d, asOf))} j` : 'Aucune connexion utilisateur', action: 'Relancer le client' });
    if (eqs.length && (eqs.length - connected) * 2 > eqs.length)
      reasons.push({ level: 'À risque', reason: `${eqs.length - connected} / ${eqs.length} équipements non connectés`, action: 'Ouvrir une intervention SAV' });
    if (active && blockedInDays == null && daysToExpiry != null && daysToExpiry > 10 && daysToExpiry <= delayDays)
      reasons.push({ level: 'À surveiller', reason: `Échéance dans ${daysToExpiry} j`, action: 'Préparer le renouvellement' });
    if (!c.packs.length) reasons.push({ level: 'À surveiller', reason: 'Aucun pack affecté', action: 'Affecter un pack' });
    const priority: Priority = reasons.some((r) => r.level === 'Critique')
      ? 'Critique'
      : reasons.some((r) => r.level === 'À risque')
        ? 'À risque'
        : reasons.length
          ? 'À surveiller'
          : 'OK';

    infos.set(c.id, {
      client: c,
      owner: ownerLabel(ownerKey(c)),
      exists: state !== 'absent',
      active,
      blockedInDays,
      daysToExpiry,
      packs,
      equipments: eqs,
      assigned: eqs.length,
      installed: eqs.filter((e) => e.isInstalled).length,
      connected,
      neverConnected: never,
      lastLogin: ll?.d ?? null,
      lastChannel: ll?.ch ?? null,
      lastEquipmentComm: lastComm,
      priority,
      reasons
    });
  }
  const existing = input.clients.filter((c) => infos.get(c.id)?.exists);
  const info = (c: FleetClient) => infos.get(c.id) as ClientInfo;

  /* ---------- CLI-K-01 … K-05 (cartes du haut) ---------- */
  const k = countsAt(input.clients, asOf, graceDays);
  const resellersCount = existing.filter((c) => c.type === 'Revendeur').length;
  const assigned = sold.length;
  const connectedEq = sold.filter(isConnected).length;

  /* ---------- CLI-A-04 (a) / A-01 / A-02 / A-04 (b) – « À traiter » ---------- */
  const a04a = existing.filter((c) => info(c).blockedInDays != null).sort((a, b) => (info(a).blockedInDays ?? 0) - (info(b).blockedInDays ?? 0));
  const a01 = existing
    .filter((c) => {
      const i = info(c);
      return i.active && i.blockedInDays == null && i.daysToExpiry != null && i.daysToExpiry >= 0 && i.daysToExpiry <= delayDays;
    })
    .sort((a, b) => (info(a).daysToExpiry ?? 0) - (info(b).daysToExpiry ?? 0));
  const a02 = existing.filter((c) => {
    const i = info(c);
    return i.active && (!i.lastLogin || daysBetween(i.lastLogin, asOf) > delayDays);
  });
  const a04bEq = sold.filter((e) => isNever(e) && existing.some((c) => c.name === e.client || (c.type === 'Revendeur' && c.name === e.reseller)));
  const a04bClients = existing.filter((c) => c.type !== 'Revendeur' && info(c).neverConnected > 0);
  const alertSets: Record<AlertKey, Set<number>> = {
    blocage: new Set(a04a.map((c) => c.id)),
    echeance: new Set(a01.map((c) => c.id)),
    relance: new Set(a02.map((c) => c.id)),
    jamais: new Set(a04bClients.map((c) => c.id))
  };
  const byOwnerText = (list: FleetClient[]) => {
    const m = new Map<string, number>();
    for (const c of list) {
      const key = isNetwork ? (ownerKey(c) === 'Tunav' ? 'Tunav' : ownerKey(c)) : c.name;
      m.set(key, (m.get(key) ?? 0) + 1);
    }
    const e = Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
    const shown = e.slice(0, 3).map(([n, v]) => `${n} ${v}`);
    const rest = e.slice(3).reduce((s, [, v]) => s + v, 0);
    return (rest ? [...shown, `autres ${rest}`] : shown).join(' · ') || 'Aucun';
  };

  /* ---------- CLI-D-01 – clients et équipements par pack ---------- */
  const d01 = input.packs.map((p) => ({
    key: String(p.id),
    label: p.name,
    clients: existing.filter((c) => c.type !== 'Revendeur' && info(c).packs.some((x) => x.packId === p.id)).length,
    equipments: sold.filter((e) => e.packId === p.id).length
  }));
  const noPack = existing.filter((c) => c.type !== 'Revendeur' && !c.packs.length).length;

  /* ---------- CLI-D-02 – connectés / non connectés (par propriétaire, ou par client pour un revendeur) ---------- */
  const d02: OwnerRow[] = [];
  if (isNetwork) {
    const m = new Map<string, OwnerRow>();
    for (const e of sold) {
      const r = m.get(e.reseller) ?? { key: e.reseller, label: ownerLabel(e.reseller), clients: 0, connected: 0, assigned: 0 };
      r.assigned += 1;
      if (isConnected(e)) r.connected += 1;
      m.set(e.reseller, r);
    }
    for (const c of existing) {
      const r = m.get(ownerKey(c));
      if (r && c.type !== 'Revendeur') r.clients += 1;
    }
    d02.push(...m.values());
  } else {
    for (const c of existing) {
      const i = info(c);
      if (i.assigned) d02.push({ key: String(c.id), label: c.name, clients: 1, connected: i.connected, assigned: i.assigned });
    }
  }
  d02.sort((a, b) => b.assigned - b.connected - (a.assigned - a.connected) || b.assigned - a.assigned);

  /* ---------- CLI-C-01 – connexions par mois, janvier → décembre de l'année « État au » ---------- */
  const year = asOf.getFullYear();
  const yearMonths: MonthCell[] = Array.from({ length: 12 }, (_, m) => {
    const month = `${year}-${String(m + 1).padStart(2, '0')}`;
    return { month, label: formatMonthFr(month).split(' ')[0] };
  });
  const asOfMonth = toIsoMonth(asOf);
  const ownerOfId = new Map(input.clients.map((c) => [c.id, ownerKey(c)]));
  const monthConn = new Map<string, number>();
  const monthConnByOwner = new Map<string, Map<string, number>>();
  const monthConnByClient = new Map<number, Map<string, number>>();
  const monthClients = new Map<string, Set<number>>();
  for (const u of logins) {
    const m = u.date.slice(0, 7);
    monthConn.set(m, (monthConn.get(m) ?? 0) + 1);
    const o = ownerOfId.get(u.clientId) ?? 'Tunav';
    const om = monthConnByOwner.get(o) ?? new Map<string, number>();
    om.set(m, (om.get(m) ?? 0) + 1);
    monthConnByOwner.set(o, om);
    const cm = monthConnByClient.get(u.clientId) ?? new Map<string, number>();
    cm.set(m, (cm.get(m) ?? 0) + 1);
    monthConnByClient.set(u.clientId, cm);
    const ms = monthClients.get(m) ?? new Set<number>();
    ms.add(u.clientId);
    monthClients.set(m, ms);
  }
  /** valeur d'un mois futur = null (le point n'est pas dessiné) */
  const seriesFor = (get: (m: string) => number) => yearMonths.map((x) => (x.month > asOfMonth ? null : get(x.month)));
  const c01Total = seriesFor((m) => monthConn.get(m) ?? 0);
  const c01ByOwner = (owner: string) => seriesFor((m) => monthConnByOwner.get(owner)?.get(m) ?? 0);
  const c01ByClient = (id: number) => seriesFor((m) => monthConnByClient.get(id)?.get(m) ?? 0);
  const activeClients = existing.filter((c) => info(c).active);
  const connected30 = activeClients.filter((c) => {
    const d = info(c).lastLogin;
    return !!d && daysBetween(d, asOf) <= 30;
  }).length;
  const c01Owners = isNetwork
    ? Array.from(new Set(existing.map(ownerKey)))
        .map((o) => {
          const list = existing.filter((c) => ownerKey(c) === o);
          const act = list.filter((c) => info(c).active);
          const conn = act.filter((c) => {
            const d = info(c).lastLogin;
            return !!d && daysBetween(d, asOf) <= 30;
          }).length;
          return { key: o, label: ownerLabel(o), clients: list.length, active: act.length, connected30: conn, monthConn: monthConnByOwner.get(o)?.get(asOfMonth) ?? 0 };
        })
        .sort((a, b) => b.clients - a.clients)
    : [];

  /* ---------- CLI-C-03 – clients connectés par mois (6 mois) + pic ---------- */
  const last6: MonthCell[] = [];
  for (let kk = 5; kk >= 0; kk--) {
    const month = toIsoMonth(new Date(asOf.getFullYear(), asOf.getMonth() - kk, 1));
    last6.push({ month, label: formatMonthFr(month).split(' ')[0] });
  }
  const c03 = last6.map((m) => ({ ...m, value: monthClients.get(m.month)?.size ?? 0 }));
  const peakIdx = c03.reduce((best, x, i) => (x.value > c03[best].value ? i : best), 0);
  const recentClients = existing.filter((c) => {
    const d = info(c).lastLogin;
    return !!d && toIsoMonth(d) >= last6[0].month;
  });
  const channelSplit = {
    PC: recentClients.filter((c) => info(c).lastChannel === 'PC').length,
    Mobile: recentClients.filter((c) => info(c).lastChannel === 'Mobile').length
  };
  const connectedInMonth = (month: string) => existing.filter((c) => monthClients.get(month)?.has(c.id));
  const activeNotConnectedInMonth = (month: string) =>
    existing.filter((c) => clientStateAt(c, endOfMonth(month, asOf), graceDays) === 'active' && !monthClients.get(month)?.has(c.id));

  /* ---------- CLI-D-03 – nouveaux clients vs bloqués par mois (6 mois) ---------- */
  const createdMonth = (c: FleetClient) => (c.createdAt ? c.createdAt.slice(0, 7) : '');
  const blockedMonth = (c: FleetClient) => {
    if (clientStateAt(c, asOf, graceDays) !== 'blocked') return '';
    const d = blockedDateOf(c, graceDays);
    return d && d <= asOf ? toIsoMonth(d) : '';
  };
  const d03 = last6.map((m) => ({
    ...m,
    newClients: input.clients.filter((c) => createdMonth(c) === m.month && (parseDate(c.createdAt) ?? asOf) <= asOf),
    blocked: input.clients.filter((c) => blockedMonth(c) === m.month)
  }));

  /* ---------- CLI-D-04 – échéances des packs par mois (année choisie) ---------- */
  const expiryLevel = (c: FleetClient): 'expired' | 'soon' | 'later' => {
    const d = info(c).daysToExpiry;
    if (d == null || d < 0) return 'expired';
    return d <= delayDays ? 'soon' : 'later';
  };
  const d04For = (y: number, owner: string | null) =>
    Array.from({ length: 12 }, (_, m) => {
      const month = `${y}-${String(m + 1).padStart(2, '0')}`;
      const list = existing.filter((c) => c.expiry.slice(0, 7) === month && (!owner || ownerKey(c) === owner));
      return {
        month,
        label: formatMonthFr(month).split(' ')[0],
        list,
        expired: list.filter((c) => expiryLevel(c) === 'expired').length,
        soon: list.filter((c) => expiryLevel(c) === 'soon').length,
        later: list.filter((c) => expiryLevel(c) === 'later').length
      };
    });
  const expiredCount = existing.filter((c) => expiryLevel(c) === 'expired').length;
  const soonCount = existing.filter((c) => expiryLevel(c) === 'soon').length;

  return {
    asOf,
    delayDays,
    graceDays,
    connDays: Math.round((connHours / 24) * 10) / 10,
    infos,
    existing,
    k01: { total: k.total, resellers: resellersCount, equipments: assigned },
    k02: { active: k.active, blocked: k.blocked },
    k04: { connected: connectedEq, assigned, notConnected: assigned - connectedEq },
    alerts: {
      blocage: { list: a04a, detail: byOwnerText(a04a) },
      echeance: { list: a01, detail: byOwnerText(a01) },
      relance: { list: a02, detail: byOwnerText(a02) },
      jamais: { list: a04bClients, equipments: a04bEq, detail: byOwnerText(a04bClients) }
    },
    alertSets,
    d01,
    noPack,
    d02,
    c01: { yearMonths, total: c01Total, byOwner: c01ByOwner, byClient: c01ByClient, owners: c01Owners, connected30, without30: activeClients.length - connected30, activeCount: activeClients.length, monthConn, monthClients, asOfMonth },
    c03: { months: c03, peakIdx, channelSplit, connectedInMonth, activeNotConnectedInMonth },
    d03,
    d04: { forYear: d04For, expiredCount, soonCount, total: existing.length },
    expiryLevel
  };
}

function pushTo<K, V>(m: Map<K, V[]>, k: K, v: V) {
  const list = m.get(k);
  if (list) list.push(v);
  else m.set(k, [v]);
}

function endOfMonth(month: string, cap: Date): Date {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m, 0);
  return d > cap ? cap : d;
}

/* ------------------------------------------------------------------ fiche client (F-01 + ClientDetail-v3) */

/** CD-6 – connexions des 12 derniers mois (mois de « État au » inclus). */
export function monthlyConnections12(userConnections: UserConnection[], clientId: number, asOf: Date) {
  const isoAsOf = toIsoDate(asOf);
  const out: Array<{ month: string; label: string; value: number; pc: number; mobile: number }> = [];
  for (let kk = 11; kk >= 0; kk--) {
    const month = toIsoMonth(new Date(asOf.getFullYear(), asOf.getMonth() - kk, 1));
    out.push({ month, label: formatMonthFr(month).split(' ')[0], value: 0, pc: 0, mobile: 0 });
  }
  const idx = new Map(out.map((x, i) => [x.month, i]));
  for (const u of userConnections) {
    if (u.clientId !== clientId || u.date.slice(0, 10) > isoAsOf) continue;
    const i = idx.get(u.date.slice(0, 7));
    if (i == null) continue;
    out[i].value += 1;
    if (u.channel === 'PC') out[i].pc += 1;
    else out[i].mobile += 1;
  }
  return out;
}

/**
 * CD-2 – score de santé /100 : Connexion 30 %, Contrat 25 %, Installation 25 %, Quota véhicules 20 %.
 * Barème proposé par la maquette, À VALIDER avec Tunav (affiché comme tel).
 */
export function healthScore(i: ClientInfo, asOf: Date, delayDays: number) {
  const since = i.lastLogin ? daysBetween(i.lastLogin, asOf) : null;
  const connexion = since == null ? 0 : since <= 7 ? 100 : since <= delayDays ? 60 : since <= 90 ? 30 : 0;
  const contrat = !i.active ? 0 : i.blockedInDays != null ? 20 : i.daysToExpiry != null && i.daysToExpiry <= delayDays ? 60 : 100;
  const installation = i.assigned ? pct(i.installed, i.assigned) : 0;
  const limit = i.client.vehicleLimit;
  // Quota : part du quota véhicules utilisée par des équipements installés (illimité = 100)
  const quota = limit == null ? 100 : limit > 0 ? Math.min(100, pct(i.installed, limit)) : 0;
  const total = Math.round(0.3 * connexion + 0.25 * contrat + 0.25 * installation + 0.2 * quota);
  return { total, connexion, contrat, installation, quota };
}

/** Lignes d'export / tableau de détail d'une liste de clients. */
export function clientsTable(list: FleetClient[], infos: Map<number, ClientInfo>, extra: 'echeance' | 'blocage' | 'connexion' | 'parc'): KpiTable {
  const headers = ['Client', 'Propriétaire', extra === 'echeance' ? 'Échéance' : extra === 'blocage' ? 'Blocage dans' : extra === 'connexion' ? 'Dernière connexion' : 'Connectés / affectés'];
  return {
    headers,
    rows: list.map((c) => {
      const i = infos.get(c.id);
      const v =
        extra === 'echeance'
          ? `${frIso(c.expiry)} · J-${Math.max(0, i?.daysToExpiry ?? 0)}`
          : extra === 'blocage'
            ? `${i?.blockedInDays ?? '—'} j`
            : extra === 'connexion'
              ? i?.lastLogin
                ? `${frDate(i.lastLogin)} · ${i.lastChannel ?? ''}`
                : 'jamais'
              : `${i?.connected ?? 0} / ${i?.assigned ?? 0}`;
      return [c.name, i?.owner ?? '', v];
    })
  };
}
