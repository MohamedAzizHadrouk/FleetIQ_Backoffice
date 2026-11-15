/**
 * Gestion des Packs v3 (Packs-v3 · Documentation-Packs-v3) – calcul des KPI à partir de FleetStore.
 * Carte FleetIQ 08. IDs préfixés `PK-` (analyse § 7-5) ; l'ID de la maquette est gardé à côté (P-xx, A-xx).
 * Aucun prix n'est calculé ici (doc : « aucun prix ni historique de paiement »).
 *
 * Règles (documentation de la maquette + décisions du 2026-11-14) :
 * - Périmètre : tous les clients du réseau (clients directs Tunav, comptes revendeurs, clients des revendeurs),
 *   sans les stocks (« *_Stock ») ni l'entité « Tunav » – même périmètre que Gestion Clients (carte 06).
 * - Actif / bloqué : même règle que Gestion Clients (`clientStateAt` : non bloqué ET date ≤ expiration + 30 j).
 * - A-10 critique = client actif ET 0 ≤ expiration − aujourd'hui ≤ 10 j ; A-11 = actif ET 10 j < … ≤ 60 j ;
 *   A-13 = bloqué OU expiration dépassée ; A-12 = équipement dont le type n'est supporté par aucun pack du client.
 * - Connecté = dernière communication ≤ seuil global (7 j par défaut, réglage existant) – même règle que K-04.
 * - Un équipement appartient au pack porté par l'équipement (`packId`, 1 équipement = 1 pack), sinon au premier
 *   pack du client (doc point 4 : « équipements d'un pack = équipements des clients qui ont ce pack »).
 * - Ventes = lignes d'affectation pack → client datées (`assignedAt`, à confirmer back-end).
 */
import type { FleetClient, FleetEquipment, Pack } from '../state/FleetStore';
import { addDays, daysBetween, parseDate, startOfDay, toIsoDate, toIsoMonth } from '../state/mock/dates';
import { clientStateAt, ownerKey, ownerLabel } from './clientsKpis';
import { FEATURE_CATALOG, featureLeaves, type FeatureLeaf } from './packFeatureCatalog';

export const fmt = (n: number) => n.toLocaleString('fr-FR');
export const pct = (a: number, b: number) => (b ? Math.round((a * 100) / b) : 0);
export const frDate = (d: Date | null | undefined) => (d ? d.toLocaleDateString('fr-FR') : '—');

/** Taux de connexion sous lequel un pack est signalé (doc @MinConnPct) */
export const MIN_CONN_PCT = 60;
/** Durée maximale d'une période personnalisée (doc : 1 an maximum) */
export const MAX_PERIOD_DAYS = 366;

/* ------------------------------------------------------------------ période (barre d'outils) */

export type PeriodKind = '7d' | '30d' | '3m' | 'custom';
export type CompareKind = 'prev' | 'year' | 'custom';
export type Period = { from: Date; to: Date; days: number };

const dayCount = (from: Date, to: Date) => Math.round(daysBetween(startOfDay(from), startOfDay(to))) + 1;

/** Période choisie : 7 j / 30 j / 3 mois jusqu'à la date « Au », ou personnalisée (≤ 1 an). null + erreur si invalide. */
export function resolvePeriod(kind: PeriodKind, au: Date, customFrom: string, customTo: string): { period: Period | null; error: string } {
  if (kind === 'custom') {
    const from = parseDate(customFrom);
    const to = parseDate(customTo);
    if (!from || !to) return { period: null, error: 'Choisissez les deux dates de la période.' };
    if (from > to) return { period: null, error: 'La date de début doit précéder la date de fin.' };
    const days = dayCount(from, to);
    if (days > MAX_PERIOD_DAYS) return { period: null, error: 'Période personnalisée : 1 an maximum.' };
    return { period: { from, to, days }, error: '' };
  }
  const to = startOfDay(au);
  let from: Date;
  if (kind === '7d') from = addDays(to, -6);
  else if (kind === '30d') from = addDays(to, -29);
  else {
    from = new Date(to);
    from.setMonth(from.getMonth() - 3);
    from = addDays(from, 1);
  }
  return { period: { from, to, days: dayCount(from, to) }, error: '' };
}

/** Période de comparaison (optionnelle) : précédente de même durée, même période l'an dernier ou personnalisée. */
export function resolveCompare(kind: CompareKind, p: Period, customFrom: string, customTo: string): { period: Period | null; error: string } {
  if (kind === 'prev') {
    const to = addDays(p.from, -1);
    const from = addDays(p.from, -p.days);
    return { period: { from, to, days: p.days }, error: '' };
  }
  if (kind === 'year') {
    const from = new Date(p.from);
    from.setFullYear(from.getFullYear() - 1);
    const to = new Date(p.to);
    to.setFullYear(to.getFullYear() - 1);
    return { period: { from, to, days: dayCount(from, to) }, error: '' };
  }
  const from = parseDate(customFrom);
  const to = parseDate(customTo);
  if (!from || !to) return { period: null, error: 'Choisissez les deux dates de comparaison.' };
  if (from > to) return { period: null, error: 'Comparaison : la date de début doit précéder la date de fin.' };
  const days = dayCount(from, to);
  if (days > MAX_PERIOD_DAYS) return { period: null, error: 'Comparaison : 1 an maximum.' };
  return { period: { from, to, days }, error: '' };
}

export const inPeriod = (d: Date | null, p: Period) => !!d && toIsoDate(d) >= toIsoDate(p.from) && toIsoDate(d) <= toIsoDate(p.to);

/* ------------------------------------------------------------------ types */

export type PkAlertKey = 'critique' | 'anticiper' | 'hors_pack' | 'bloques';
export const PK_ALERT_KEYS: PkAlertKey[] = ['critique', 'anticiper', 'hors_pack', 'bloques'];

export type ExpiryLevel = 'expire' | 'critique' | 'anticiper' | 'plus_tard';
export const EXPIRY_LEVELS: ExpiryLevel[] = ['expire', 'critique', 'anticiper', 'plus_tard'];

export type PkEquipment = {
  eq: FleetEquipment;
  client: FleetClient;
  packId: number | null;
  type: string;
  connected: boolean;
  never: boolean;
  /** jours depuis la dernière communication (null = jamais) */
  daysSince: number | null;
  /** type supporté par au moins un pack du client (A-12) */
  covered: boolean;
};

export type PkClient = {
  client: FleetClient;
  /** « Tunav (direct) » ou nom du revendeur */
  owner: string;
  /** clé du réseau : « Tunav » (clients directs et comptes revendeurs) ou nom du revendeur */
  network: string;
  packs: Pack[];
  equipments: PkEquipment[];
  active: boolean;
  expiry: Date | null;
  daysToExpiry: number | null;
  level: ExpiryLevel | null;
  /** première affectation d'un pack (P-01 « nouveaux clients équipés ») */
  firstAssignedAt: Date | null;
  outOfPack: PkEquipment[];
};

export type PkSale = { client: PkClient; pack: Pack; date: Date };

export type PkPackRow = {
  pack: Pack;
  clients: PkClient[];
  tunav: number;
  resellers: number;
  equipments: PkEquipment[];
  connected: number;
  soldInPeriod: number;
};

export type PkFeatureRow = FeatureLeaf & { clients: PkClient[]; packs: Pack[] };

export type PkModuleCell = { moduleId: string; module: string; packId: number; selected: string[]; total: number };

export type PacksKpiInput = {
  clients: FleetClient[];
  equipments: FleetEquipment[];
  packs: Pack[];
  /** jour de référence des alertes (aujourd'hui) */
  today: Date;
  /** heure réelle (âge des dernières communications) */
  now: Date;
  connHours: number;
  graceDays: number;
  critDays: number;
  renewDays: number;
  period: Period;
  compare: Period | null;
};

const isStock = (name: string) => name.endsWith('_Stock');
export const isRealClient = (c: FleetClient) => !isStock(c.name) && c.name !== 'Tunav';

/** Fonctionnalités d'un client : celles de ses packs (ou la sélection personnalisée de l'affectation) */
function clientFeatures(c: FleetClient, packById: Map<number, Pack>): Set<string> {
  const s = new Set<string>();
  for (const a of c.packs) {
    const list = a.customFeatures ?? packById.get(a.packId)?.features ?? [];
    list.forEach((f) => s.add(f));
  }
  return s;
}

/* ------------------------------------------------------------------ calcul principal */

export type PacksData = ReturnType<typeof computePacks>;

export function computePacks(input: PacksKpiInput) {
  const { today, now, connHours, graceDays, critDays, renewDays, period, compare } = input;
  const packById = new Map(input.packs.map((p) => [p.id, p]));
  const connDays = Math.round((connHours / 24) * 10) / 10;

  /* ---------- équipements par client ---------- */
  const eqByClient = new Map<string, FleetEquipment[]>();
  for (const e of input.equipments) {
    if (isStock(e.client) || e.client === 'Tunav') continue;
    const l = eqByClient.get(e.client) ?? [];
    l.push(e);
    eqByClient.set(e.client, l);
  }

  /* ---------- fiche de chaque client ---------- */
  const scope = input.clients.filter(isRealClient);
  const clients: PkClient[] = scope.map((c) => {
    const packs = Array.from(new Set(c.packs.map((a) => a.packId)))
      .map((id) => packById.get(id))
      .filter(Boolean) as Pack[];
    const supported = new Set(packs.flatMap((p) => p.supportedEquipments as string[]));
    const equipments: PkEquipment[] = (eqByClient.get(c.name) ?? []).map((e) => {
      const last = e.lastCommunication ? new Date(e.lastCommunication) : null;
      const daysSince = last ? daysBetween(last, now) : null;
      const type = e.equipmentType ?? e.type;
      return {
        eq: e,
        client: c,
        packId: e.packId ?? packs[0]?.id ?? null,
        type,
        connected: daysSince != null && daysSince * 24 <= connHours,
        never: !last && !e.firstSendDate?.trim(),
        daysSince,
        // PK-A-12 : type inconnu (non renseigné) = non signalé
        covered: !packs.length || !e.equipmentType || supported.has(e.equipmentType)
      };
    });
    const active = clientStateAt(c, today, graceDays) === 'active';
    const expiry = parseDate(c.expiry);
    const daysToExpiry = expiry ? Math.round(daysBetween(today, expiry)) : null;
    let level: ExpiryLevel | null = null;
    if (expiry && daysToExpiry != null) {
      if (!active || daysToExpiry < 0) level = 'expire';
      else if (daysToExpiry <= critDays) level = 'critique';
      else if (daysToExpiry <= renewDays) level = 'anticiper';
      else level = 'plus_tard';
    }
    const firstAssignedAt = c.packs
      .map((a) => parseDate(a.assignedAt ?? null))
      .filter(Boolean)
      .sort((a, b) => (a as Date).getTime() - (b as Date).getTime())[0] as Date | undefined;
    return {
      client: c,
      owner: ownerLabel(ownerKey(c)),
      network: ownerKey(c),
      packs,
      equipments,
      active,
      expiry,
      daysToExpiry,
      level,
      firstAssignedAt: firstAssignedAt ?? null,
      outOfPack: equipments.filter((e) => !e.covered)
    };
  });
  const byId = new Map(clients.map((c) => [c.client.id, c]));
  const withPack = clients.filter((c) => c.packs.length > 0);

  /* ---------- ventes (affectations datées) ---------- */
  const sales: PkSale[] = [];
  for (const pc of clients) {
    for (const a of pc.client.packs) {
      const d = parseDate(a.assignedAt ?? null);
      const pack = packById.get(a.packId);
      if (d && pack) sales.push({ client: pc, pack, date: d });
    }
  }
  sales.sort((a, b) => b.date.getTime() - a.date.getTime());
  const salesIn = (p: Period) => sales.filter((s) => inPeriod(s.date, p));
  const periodSales = salesIn(period);
  const compareSales = compare ? salesIn(compare) : null;

  /* ---------- PK-P-01 Clients avec pack ---------- */
  const multi = withPack.filter((c) => c.packs.length > 1);
  const without = clients.filter((c) => c.packs.length === 0);
  const newIn = (p: Period) => withPack.filter((c) => inPeriod(c.firstAssignedAt, p));
  const p01 = {
    withPack: withPack.length,
    total: clients.length,
    multi,
    without,
    single: withPack.length - multi.length,
    newClients: newIn(period),
    newClientsCompare: compare ? newIn(compare) : null
  };

  /* ---------- PK-P-03 Classement (+ PK-P-05 par pack) ---------- */
  const allEq = withPack.flatMap((c) => c.equipments);
  const packRows: PkPackRow[] = input.packs.map((pack) => {
    const cl = withPack.filter((c) => c.packs.some((p) => p.id === pack.id));
    const eqs = allEq.filter((e) => e.packId === pack.id);
    return {
      pack,
      clients: cl,
      tunav: cl.filter((c) => c.network === 'Tunav').length,
      resellers: cl.filter((c) => c.network !== 'Tunav').length,
      equipments: eqs,
      connected: eqs.filter((e) => e.connected).length,
      soldInPeriod: periodSales.filter((s) => s.pack.id === pack.id).length
    };
  });
  const ranking = packRows.slice().sort((a, b) => b.clients.length - a.clients.length || b.equipments.length - a.equipments.length);

  /* ---------- PK-P-05 Équipements connectés ---------- */
  const p05 = {
    connected: allEq.filter((e) => e.connected).length,
    total: allEq.length,
    byPack: packRows
      .filter((r) => r.equipments.length > 0)
      .sort((a, b) => pct(a.connected, a.equipments.length) - pct(b.connected, b.equipments.length))
  };

  /* ---------- PK-P-06 Packs vendus par mois (année de la fin de période) ---------- */
  const year = period.to.getFullYear();
  const currentMonth = toIsoMonth(today);
  const months = Array.from({ length: 12 }, (_, i) => {
    const month = `${year}-${String(i + 1).padStart(2, '0')}`;
    const list = sales.filter((s) => toIsoMonth(s.date) === month);
    return {
      month,
      future: month > currentMonth,
      sales: list,
      byPack: input.packs.map((p) => list.filter((s) => s.pack.id === p.id).length)
    };
  });

  /* ---------- PK-P-04 Fonctionnalités (composition et ventes) ---------- */
  const leaves = featureLeaves(FEATURE_CATALOG);
  const activeWithPack = withPack.filter((c) => c.active);
  const featOf = new Map(activeWithPack.map((c) => [c.client.id, clientFeatures(c.client, packById)]));
  const features: PkFeatureRow[] = leaves.map((f) => ({
    ...f,
    clients: activeWithPack.filter((c) => featOf.get(c.client.id)?.has(f.id)),
    packs: input.packs.filter((p) => p.features.includes(f.id))
  }));
  const composition: PkModuleCell[] = FEATURE_CATALOG.flatMap((mod) => {
    const modLeaves = leaves.filter((l) => l.moduleId === mod.id);
    return input.packs.map((p) => ({
      moduleId: mod.id,
      module: mod.label,
      packId: p.id,
      selected: modLeaves.filter((l) => p.features.includes(l.id)).map((l) => l.id),
      total: modLeaves.length
    }));
  });

  /* ---------- À traiter (A-10 … A-13) ---------- */
  const byExpiry = (a: PkClient, b: PkClient) => (a.daysToExpiry ?? 0) - (b.daysToExpiry ?? 0);
  const critique = clients.filter((c) => c.level === 'critique').sort(byExpiry);
  const anticiper = clients.filter((c) => c.level === 'anticiper').sort(byExpiry);
  const horsPack = clients.filter((c) => c.outOfPack.length > 0);
  const bloques = clients.filter((c) => !c.active || (c.daysToExpiry != null && c.daysToExpiry < 0)).sort(byExpiry);
  const alerts: Record<PkAlertKey, PkClient[]> = { critique, anticiper, hors_pack: horsPack, bloques };

  /* ---------- Échéances des abonnements par mois (A-10 / A-11) ---------- */
  const expiryYears = Array.from(new Set(clients.map((c) => c.expiry?.getFullYear()).filter(Boolean) as number[])).sort();
  const expiriesByMonth = (y: number) =>
    Array.from({ length: 12 }, (_, i) => {
      const month = `${y}-${String(i + 1).padStart(2, '0')}`;
      const list = clients.filter((c) => c.expiry && toIsoMonth(c.expiry) === month);
      return { month, list, byLevel: EXPIRY_LEVELS.map((lv) => list.filter((c) => c.level === lv).length) };
    });

  return {
    connDays,
    critDays,
    renewDays,
    period,
    compare,
    clients,
    byId,
    withPack,
    sales,
    periodSales,
    compareSales,
    p01,
    packRows,
    ranking,
    p05,
    year,
    months,
    features,
    composition,
    activeWithPackCount: activeWithPack.length,
    alerts,
    expiryYears,
    expiriesByMonth
  };
}

/** Tri de la liste des clients (maquette) : actifs par échéance la plus proche, puis expirés / bloqués */
export function sortClientsForList(list: PkClient[]): PkClient[] {
  return list.slice().sort((a, b) => {
    const ea = a.level === 'expire' ? 1 : 0;
    const eb = b.level === 'expire' ? 1 : 0;
    if (ea !== eb) return ea - eb;
    return (a.daysToExpiry ?? 99999) - (b.daysToExpiry ?? 99999) || a.client.name.localeCompare(b.client.name);
  });
}

/** Texte « dernier envoi » d'un équipement */
export function lastCommLabel(e: PkEquipment): string {
  if (e.daysSince == null) return 'Jamais connecté';
  const d = Math.floor(e.daysSince);
  if (e.connected) return d < 1 ? 'Connecté · aujourd’hui' : `Connecté · il y a ${fmt(d)} j`;
  return `Hors ligne · ${fmt(d)} j`;
}

/** « J-4 · Frigo Express » … pour le bandeau et la cloche */
export function namesWithDays(list: PkClient[], n = 3): string {
  const head = list.slice(0, n).map((c) => `${c.client.name} (J-${Math.max(0, c.daysToExpiry ?? 0)})`);
  return head.join(', ') + (list.length > n ? ` et ${fmt(list.length - n)} autre(s)` : '');
}
