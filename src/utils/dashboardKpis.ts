/**
 * Tableau de bord v3 (Main-v3 · Documentation-TableauDeBord-v3) – calcul des KPI à partir de FleetStore.
 * Carte FleetIQ 05. IDs préfixés `TDB-` (analyse § 7-5) ; l'ID de la maquette est gardé à côté (D-xx, R-xx).
 * Aucun prix n'est calculé ni renvoyé (règle de la page).
 *
 * Règles (documentation de la maquette) :
 * - Stock = clients « *_Stock » : exclus de tous les KPI « vendus ».
 * - Client actif = non bloqué ET date du jour ≤ expiration + @GraceDays (30 j).
 * - Installé = isInstalled ; connecté = installé ET dernière communication ≤ seuil global (7 j par défaut).
 * - Puce installée = puce affectée à un équipement installé.
 */
import type { BackofficeRouteKey } from './backofficePermissions';
import type {
  DashboardSettings,
  FleetClient,
  FleetEquipment,
  KpiSnapshot,
  KpiSnapshotKey,
  Pack,
  SimCard,
  SimConsumption,
  SimOffer,
  UserConnection
} from '../state/FleetStore';
import { addDays, daysBetween, formatMonthFr, parseDate, toIsoDate, toIsoMonth } from '../state/mock/dates';

/* ------------------------------------------------------------------ types */

/** Options du filtre « Vue équipe » (ajout approuvé, absent de Main-v3) */
export type TeamView = 'Toutes' | 'Finance' | 'Commercial' | 'SAV' | 'Admin';
export type Team = Exclude<TeamView, 'Toutes'>;
export const TEAM_VIEWS: TeamView[] = ['Toutes', 'Finance', 'Commercial', 'SAV', 'Admin'];

/**
 * Tag `team` de chaque bloc (analyse § 5.1) ; Direction → Admin, Installation → SAV.
 * Les blocs sans tag (cloche, bandeau Urgent, en-tête = « Tous ») restent toujours affichés.
 */
export const TDB_TEAMS: Record<string, Team[]> = {
  'D-01': ['Admin', 'Commercial'],
  'D-02': ['SAV'],
  'D-03': ['SAV'],
  'D-04': ['Finance'],
  'D-05': ['Commercial', 'Admin'],
  'D-07': ['Admin', 'SAV'],
  'D-08': ['Finance'],
  'D-09': ['Admin', 'SAV', 'Commercial'],
  'D-10': ['Commercial'],
  'D-11': ['Finance']
};

export function isVisibleForTeam(mockupId: string, view: TeamView): boolean {
  if (view === 'Toutes') return true;
  const tags = TDB_TEAMS[mockupId];
  return !tags || tags.includes(view);
}

export type DashboardScope = { kind: 'network' } | { kind: 'reseller'; name: string };

export type KpiTable = { headers: string[]; rows: Array<Array<string | number>> };

/** Carte de « L'essentiel » (D-01…D-05, R-01…R-04) */
export type GoalKpi = {
  /** ID code, ex. TDB-D-01 */
  id: string;
  /** ID maquette, ex. D-01 */
  mockupId: string;
  label: string;
  value: number;
  /** dénominateur (taux) ; absent = simple compte */
  of?: number;
  unit: string;
  /** objectif en % (proposition) */
  goal?: number;
  /** pastille quand il n'y a pas d'objectif */
  info?: string;
  context: string;
  /** phrase métier (fenêtre de détail) */
  what: string;
  /** définition + formule métier (documentation de la maquette) */
  definition: string;
  formula: string;
  table?: KpiTable;
  route: BackofficeRouteKey;
  routeLabel: string;
  /** filtres de la page cible, ex. « ?alerte=echeance » (Gestion Clients, carte 06) */
  routeQuery?: string;
  snapshotKey: KpiSnapshotKey;
  /** série mensuelle pour un petit graphique dans le détail */
  monthly?: Array<{ label: string; value: number }>;
  /** « Comparer » (maquette) : [valeur, dénominateur?] il y a 30 j et l'an dernier */
  prev?: { m30: [number, number?]; y1: [number, number?] };
  /** courbe 12 mois du détail (mois · valeur, en % pour un taux) */
  trend?: Array<{ label: string; value: number }>;
};

export type TodoPriority = 1 | 2 | 3;
export const PRIORITY_LABELS: Record<TodoPriority, string> = { 1: 'Urgent', 2: 'Cette semaine', 3: 'Ce mois-ci' };

/** Sujet « À traiter » (cloche D-06 / R-05) */
export type TodoItem = {
  id: string;
  /** règle d'alerte de la page source (maquettes) */
  sourceRule: string;
  priority: TodoPriority;
  title: string;
  detail: string;
  count: number;
  unit: string;
  what: string;
  route: BackofficeRouteKey;
  routeLabel: string;
  /** filtres de la page cible, ex. « ?alerte=blocage » (Gestion Clients, carte 06) */
  routeQuery?: string;
  table?: KpiTable;
  /** libellé du bouton de la fenêtre (défaut « Ouvrir <page> ») */
  goLabel?: string;
};

/** Une ligne « parc » : revendeur (vue Tunav) ou client (vue revendeur) */
export type ParkRow = {
  key: string;
  label: string;
  /** vendus (hors stock) */
  sold: number;
  installed: number;
  connected: number;
  notConnected: number;
  notInstalled: number;
  sims?: number;
  simsInstalled?: number;
};

export type OverRow = { reseller: string; label: string; sims: number; overSims: number; excessMB: number };
export type PackRankRow = { packId: number; name: string; clients: number; tunav: number; resellers: number; equipments: number };

export type DashboardData = {
  scope: DashboardScope;
  asOf: Date;
  connDays: number;
  kpis: GoalKpi[];
  todo: TodoItem[];
  /** D-07 / R-06 */
  parkRows: ParkRow[];
  /** anneaux « santé du parc » (vue revendeur : tous ses clients) ; défaut = parkRows */
  ringRows?: ParkRow[];
  parkAll: ParkRow;
  /** stock (vue Tunav seulement) ; détail par réseau */
  stock: number;
  stockByNetwork: Array<{ label: string; count: number }>;
  /** D-08 (vue Tunav) */
  simsTotal: number;
  simsInstalled: number;
  /** D-11 (vue Tunav) */
  overMonth: string;
  overRows: OverRow[];
  /** D-10 / R-08 */
  packRank: PackRankRow[];
  packClientsTotal: number;
  topReseller: { name: string; packs: number } | null;
};

export type DashboardInput = {
  scope: DashboardScope;
  /** « État au » : date de référence des règles datées (échéances, 30 j…) */
  asOf: Date;
  /** heure réelle (âge des dernières communications) */
  now: Date;
  connThresholdHours: number;
  settings: DashboardSettings;
  clients: FleetClient[];
  equipments: FleetEquipment[];
  simCards: SimCard[];
  simOffers: SimOffer[];
  simConsumption: SimConsumption[];
  userConnections: UserConnection[];
  packs: Pack[];
};

/* ------------------------------------------------------------------ petits utilitaires */

export const pct = (a: number, b: number) => (b ? Math.round((a * 100) / b) : 0);
export const fmt = (n: number) => n.toLocaleString('fr-FR');
export const volume = (mo: number) =>
  mo >= 1024 ? `${(mo / 1024).toFixed(1).replace('.', ',')} Go` : `${fmt(Math.round(mo))} Mo`;

export const isStockName = (name: string) => name.endsWith('_Stock');
export const networkLabel = (reseller: string) => (reseller === 'Tunav' ? 'Tunav · clients directs' : reseller);
const ownerLabel = (reseller: string) => (reseller === 'Tunav' ? 'Tunav (direct)' : reseller);

/** Statut d'un taux face à son objectif : atteint · à moins de 10 points · en dessous (règle de la maquette) */
export function goalStatus(p: number, goal: number): 'ok' | 'warn' | 'bad' {
  if (p >= goal) return 'ok';
  if (p >= goal - 10) return 'warn';
  return 'bad';
}

type EqState = { stock: boolean; installed: boolean; connected: boolean; daysSince: number | null };

/** État d’un équipement (stock / installé / connecté) – règle unique, reprise par la page Équipements (equipmentsKpis.ts) */
export function equipmentState(e: FleetEquipment, now: Date, connHours: number): EqState {
  const stock = isStockName(e.client);
  const last = e.lastCommunication ? new Date(e.lastCommunication) : null;
  const daysSince = last ? daysBetween(last, now) : null;
  const installed = !stock && e.isInstalled;
  return { stock, installed, connected: installed && daysSince != null && daysSince * 24 <= connHours, daysSince };
}

/** Client « réel » (pas un stock, pas l'entité Tunav) */
const isRealClient = (c: FleetClient) => !isStockName(c.name) && c.name !== 'Tunav';

function topNames(items: Array<{ name: string; days: number }>, n = 3): string {
  return items
    .sort((a, b) => a.days - b.days)
    .slice(0, n)
    .map((x) => `${x.name} J-${Math.max(0, Math.round(x.days))}`)
    .join(' · ');
}

function countBy<T>(list: T[], key: (x: T) => string): Array<[string, number]> {
  const m = new Map<string, number>();
  for (const x of list) m.set(key(x), (m.get(key(x)) ?? 0) + 1);
  return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
}

const byDetail = (entries: Array<[string, number]>, max = 4) => {
  const shown = entries.slice(0, max).map(([k, n]) => `${k} ${n}`);
  const rest = entries.slice(max).reduce((s, [, n]) => s + n, 0);
  return rest ? [...shown, `autres ${rest}`].join(' · ') : shown.join(' · ');
};

/** Valeur d'un instantané (le plus proche de la date demandée) – « Comparer » (TDB-D-12) */
export function snapshotValue(
  snapshots: KpiSnapshot[],
  scope: string,
  kpi: KpiSnapshotKey,
  date: Date
): number | null {
  let best: KpiSnapshot | null = null;
  let bestGap = Infinity;
  for (const s of snapshots) {
    if (s.scope !== scope || s.kpi !== kpi) continue;
    const d = parseDate(s.date);
    if (!d) continue;
    const gap = Math.abs(daysBetween(d, date));
    if (gap < bestGap) {
      best = s;
      bestGap = gap;
    }
  }
  return best && bestGap <= 20 ? best.value : null;
}

/** Série mensuelle d'instantanés (12 mois) pour la courbe du détail */
export function snapshotSeries(snapshots: KpiSnapshot[], scope: string, kpi: KpiSnapshotKey): number[] {
  return snapshots
    .filter((s) => s.scope === scope && s.kpi === kpi)
    .sort((a, b) => a.date.localeCompare(b.date))
    .filter((s, i, arr) => i === 0 || s.date.slice(0, 7) !== arr[i - 1].date.slice(0, 7))
    .map((s) => s.value);
}

/* ------------------------------------------------------------------ calcul principal */

export function computeDashboard(input: DashboardInput): DashboardData {
  const { scope, asOf, now, connThresholdHours, settings } = input;
  const isNetwork = scope.kind === 'network';
  const me = scope.kind === 'reseller' ? scope.name : '';
  const connDays = Math.round((connThresholdHours / 24) * 10) / 10;
  const expiryOf = (c: FleetClient) => parseDate(c.expiry);

  /* ---------- périmètre ---------- */
  const scopeClients = input.clients.filter(
    (c) => isRealClient(c) && (isNetwork ? true : c.reseller === me && c.type === 'Simple')
  );
  // D-01 : IsReseller = 0 (les revendeurs ne sont pas comptés comme clients)
  const endClients = scopeClients.filter((c) => c.type === 'Simple');
  const scopeEquipments = input.equipments.filter((e) => (isNetwork ? true : e.reseller === me));
  const states = new Map(scopeEquipments.map((e) => [e.id, equipmentState(e, now, connThresholdHours)]));
  const stateOf = (e: FleetEquipment) => states.get(e.id) ?? equipmentState(e, now, connThresholdHours);
  const sold = scopeEquipments.filter((e) => !stateOf(e).stock);
  const stockEq = isNetwork ? scopeEquipments.filter((e) => stateOf(e).stock) : [];

  const isActive = (c: FleetClient) => {
    const exp = expiryOf(c);
    return c.status === 'Active' && (!exp || asOf <= addDays(exp, settings.graceDays));
  };
  /** expiré, encore actif, bloqué au plus tard dans @GraceDays jours */
  const blockedSoon = (c: FleetClient) => {
    const exp = expiryOf(c);
    return c.status === 'Active' && !!exp && exp < asOf && exp >= addDays(asOf, -settings.graceDays);
  };
  const daysTo = (c: FleetClient) => daysBetween(asOf, expiryOf(c) ?? asOf);

  /* ---------- parc par revendeur (vue Tunav) ou par client (vue revendeur) ---------- */
  const equipmentById = new Map(input.equipments.map((e) => [e.id, e]));
  const scopeSims = input.simCards.filter((s) => (isNetwork ? true : s.reseller === me));
  const simInstalled = (s: SimCard) => {
    const e = s.equipmentId != null ? equipmentById.get(s.equipmentId) : undefined;
    return !!e && !isStockName(e.client) && e.isInstalled;
  };

  const rowsMap = new Map<string, ParkRow>();
  const rowKeyOf = (e: FleetEquipment) => (isNetwork ? e.reseller : e.client);
  const rowLabelOf = (key: string) =>
    isNetwork ? networkLabel(key) : key === me ? `${me} (flotte propre)` : key;
  const ensureRow = (key: string) => {
    let r = rowsMap.get(key);
    if (!r) {
      r = { key, label: rowLabelOf(key), sold: 0, installed: 0, connected: 0, notConnected: 0, notInstalled: 0 };
      if (isNetwork) {
        r.sims = 0;
        r.simsInstalled = 0;
      }
      rowsMap.set(key, r);
    }
    return r;
  };
  if (isNetwork) ['Tunav', 'MyCom', 'FleetPro Sfax', 'NavSud'].forEach(ensureRow);
  for (const e of sold) {
    const st = stateOf(e);
    const r = ensureRow(rowKeyOf(e));
    r.sold += 1;
    if (st.installed) {
      r.installed += 1;
      if (st.connected) r.connected += 1;
      else r.notConnected += 1;
    } else r.notInstalled += 1;
  }
  if (isNetwork) {
    for (const s of scopeSims) {
      const r = ensureRow(s.reseller);
      r.sims = (r.sims ?? 0) + 1;
      if (simInstalled(s)) r.simsInstalled = (r.simsInstalled ?? 0) + 1;
    }
  }
  const parkRows = Array.from(rowsMap.values()).filter((r) => r.sold > 0 || (r.sims ?? 0) > 0);
  if (!isNetwork) parkRows.sort((a, b) => b.sold - a.sold);
  const sum = (k: keyof ParkRow) => parkRows.reduce((s, r) => s + ((r[k] as number) ?? 0), 0);
  const parkAll: ParkRow = {
    key: '*',
    label: isNetwork ? 'Tout le réseau' : 'Tous mes clients',
    sold: sum('sold'),
    installed: sum('installed'),
    connected: sum('connected'),
    notConnected: sum('notConnected'),
    notInstalled: sum('notInstalled'),
    sims: isNetwork ? sum('sims') : undefined,
    simsInstalled: isNetwork ? sum('simsInstalled') : undefined
  };
  const stockByNetwork = countBy(stockEq, (e) => e.reseller).map(([r, n]) => ({
    label: r === 'Tunav' ? 'Stock Tunav' : `Stock ${r}`,
    count: n
  }));

  /* ---------- puces ---------- */
  const simsTotal = scopeSims.length;
  const simsInstalledCount = scopeSims.filter(simInstalled).length;
  const lastFullMonth = toIsoMonth(new Date(asOf.getFullYear(), asOf.getMonth() - 1, 1));
  const offerById = new Map(input.simOffers.map((o) => [o.id, o]));
  const overRowsMap = new Map<string, OverRow>();
  if (isNetwork) {
    const simById = new Map(input.simCards.map((s) => [s.id, s]));
    for (const r of ['Tunav', 'MyCom', 'FleetPro Sfax', 'NavSud']) {
      overRowsMap.set(r, { reseller: r, label: networkLabel(r), sims: 0, overSims: 0, excessMB: 0 });
    }
    for (const s of input.simCards) {
      const row = overRowsMap.get(s.reseller);
      if (row) row.sims += 1;
    }
    for (const c of input.simConsumption) {
      if (c.month !== lastFullMonth) continue;
      const s = simById.get(c.simId);
      const quota = s?.offerId != null ? offerById.get(s.offerId)?.dataQuotaMB : null;
      if (!s || quota == null || c.usedMB <= quota) continue;
      const row = overRowsMap.get(s.reseller);
      if (!row) continue;
      row.overSims += 1;
      row.excessMB += c.usedMB - quota;
    }
  }
  const overRows = Array.from(overRowsMap.values()).sort((a, b) => b.excessMB - a.excessMB);

  /* ---------- packs ---------- */
  const packRankMap = new Map<number, PackRankRow>();
  for (const p of input.packs) {
    packRankMap.set(p.id, { packId: p.id, name: p.name, clients: 0, tunav: 0, resellers: 0, equipments: 0 });
  }
  const packClients = isNetwork ? scopeClients : endClients;
  for (const c of packClients) {
    const ids = new Set(c.packs.map((a) => a.packId));
    for (const id of ids) {
      const row = packRankMap.get(id);
      if (!row) continue;
      row.clients += 1;
      if (c.reseller === 'Tunav') row.tunav += 1;
      else row.resellers += 1;
    }
  }
  for (const e of sold) {
    const row = e.packId != null ? packRankMap.get(e.packId) : undefined;
    if (row) row.equipments += 1;
  }
  const packRank = Array.from(packRankMap.values()).sort((a, b) => b.clients - a.clients || b.equipments - a.equipments);
  const packClientsTotal = packRank.reduce((s, r) => s + r.clients, 0);
  const resellerPacks = countBy(
    packClients.filter((c) => c.reseller !== 'Tunav').flatMap((c) => c.packs.map(() => c.reseller)),
    (x) => x
  );
  const topReseller = resellerPacks.length ? { name: resellerPacks[0][0], packs: resellerPacks[0][1] } : null;

  // packs vendus = affectations datées dans les 30 derniers jours (date d'affectation à confirmer back-end)
  const assignments = packClients.flatMap((c) =>
    c.packs.map((a) => ({ client: c, packId: a.packId, date: parseDate(a.assignedAt) }))
  );
  const sold30 = assignments.filter((a) => a.date && a.date > addDays(asOf, -30) && a.date <= asOf);
  const monthly: Array<{ label: string; value: number }> = [];
  for (let k = 5; k >= 0; k--) {
    const m = toIsoMonth(new Date(asOf.getFullYear(), asOf.getMonth() - k, 1));
    monthly.push({
      label: formatMonthFr(m).split(' ')[0],
      value: assignments.filter((a) => a.date && toIsoMonth(a.date) === m && a.date <= asOf).length
    });
  }

  /* ---------- connexions utilisateurs ---------- */
  const lastLogin = new Map<number, Date>();
  for (const u of input.userConnections) {
    const d = new Date(u.date);
    if (d > asOf && toIsoDate(d) !== toIsoDate(asOf)) continue;
    const cur = lastLogin.get(u.clientId);
    if (!cur || d > cur) lastLogin.set(u.clientId, d);
  }

  /* ---------- L'essentiel ---------- */
  const activeCount = endClients.filter(isActive).length;
  const blockedCount = endClients.length - activeCount;
  const blockedSoonList = endClients.filter(blockedSoon);
  const inst = parkAll.installed;
  const wait = parkAll.notInstalled;
  const connected = parkAll.connected;
  const notConnected = parkAll.notConnected;
  const goals = settings.goals;
  const connRule = `${fmt(connDays)} j`;

  const kpis: GoalKpi[] = [];
  if (isNetwork) {
    const owners = countBy(endClients, (c) => c.reseller).map(([r]) => r);
    // TDB-D-01 Clients actifs (vs objectif 95 %)
    kpis.push({
      id: 'TDB-D-01',
      mockupId: 'D-01',
      label: 'Clients actifs',
      value: activeCount,
      of: endClients.length,
      unit: 'clients',
      goal: goals.clientsActifs,
      context: `${fmt(blockedCount)} bloqué${blockedCount > 1 ? "s" : ""} · ${fmt(blockedSoonList.length)} bloqué${blockedSoonList.length > 1 ? "s" : ""} dans ≤ ${settings.graceDays} j`,
      what: 'Clients dont l’abonnement est actif. Un client bloqué ne peut plus utiliser la plateforme : c’est un client à risque.',
      definition: `Part des clients (clients directs Tunav et clients des revendeurs) dont le compte est actif. Un client reste actif ${settings.graceDays} jours après l’expiration de son abonnement, puis il est bloqué.`,
      formula: `Actif = non bloqué ET date ≤ expiration + ${settings.graceDays} j · % = actifs ÷ clients × 100 · atteint ≥ objectif, à surveiller ≥ objectif − 10`,
      table: {
        headers: ['Propriétaire', 'Clients', 'Bloqués', '% bloqués'],
        rows: owners.map((o) => {
          const list = endClients.filter((c) => c.reseller === o);
          const b = list.filter((c) => !isActive(c)).length;
          return [ownerLabel(o), list.length, b, `${pct(b, list.length)} %`];
        })
      },
      route: 'clients',
      routeLabel: 'Gestion Clients',
      snapshotKey: 'clientsActifs'
    });
    // TDB-D-02 Équipements installés (vs 90 %)
    kpis.push({
      id: 'TDB-D-02',
      mockupId: 'D-02',
      label: 'Équipements installés',
      value: inst,
      of: parkAll.sold,
      unit: 'vendus',
      goal: goals.installes,
      context: `${fmt(wait)} vendus pas encore posés · ${fmt(stockEq.length)} en stock`,
      what: 'Part des boîtiers vendus qui sont posés dans un véhicule. Un boîtier vendu mais non posé ne rend aucun service au client.',
      definition: 'Part des équipements vendus (hors stock) qui sont posés dans un véhicule.',
      formula: 'Installés = vendus posés dans un véhicule · % = installés ÷ vendus × 100',
      table: {
        headers: ['Revendeur', 'Vendus', 'Installés', '% installés'],
        rows: parkRows.map((r) => [r.label, r.sold, r.installed, `${pct(r.installed, r.sold)} %`])
      },
      route: 'equipments',
      routeLabel: 'Équipements',
      routeQuery: '?etat=installe',
      snapshotKey: 'installes'
    });
    // TDB-D-03 Équipements connectés (vs 85 %)
    kpis.push({
      id: 'TDB-D-03',
      mockupId: 'D-03',
      label: 'Équipements connectés',
      value: connected,
      of: inst,
      unit: 'installés',
      goal: goals.connectes,
      context: `${fmt(notConnected)} installés muets depuis plus de ${connRule}`,
      what: `Part des boîtiers installés qui ont envoyé des données depuis ${connRule} ou moins. Un boîtier muet est facturé mais ne sert pas.`,
      definition: `Part des équipements installés qui ont envoyé des données dans les ${connRule} (seuil global « connecté »).`,
      formula: `Connectés = installés dont la dernière communication ≥ date − ${connRule} · % = connectés ÷ installés × 100`,
      table: {
        headers: ['Revendeur', 'Installés', 'Connectés', '% connectés'],
        rows: parkRows.map((r) => [r.label, r.installed, r.connected, `${pct(r.connected, r.installed)} %`])
      },
      route: 'equipments',
      routeLabel: 'Équipements',
      routeQuery: '?etat=connecte',
      snapshotKey: 'connectes'
    });
    // TDB-D-04 Puces installées (vs 85 %)
    kpis.push({
      id: 'TDB-D-04',
      mockupId: 'D-04',
      label: 'Puces installées',
      value: simsInstalledCount,
      of: simsTotal,
      unit: 'puces',
      goal: goals.pucesInstallees,
      context: `${fmt(simsTotal - simsInstalledCount)} puces dans un équipement pas encore installé ou en stock`,
      what: 'Part des puces SIM dont l’équipement est posé. Une puce non installée coûte son abonnement chaque mois sans rien transmettre.',
      definition: 'Part des puces dont l’équipement est installé. Une puce non installée est dans un équipement pas encore posé, ou en stock.',
      formula: 'Installée = puce affectée à un équipement installé · % = installées ÷ puces × 100',
      table: {
        headers: ['Réseau', 'Puces', 'Installées', '% installées'],
        rows: parkRows.map((r) => [r.label, r.sims ?? 0, r.simsInstalled ?? 0, `${pct(r.simsInstalled ?? 0, r.sims ?? 0)} %`])
      },
      route: 'sims',
      routeLabel: 'Gestion des puces',
      // FleetIQ 09 : Gestion des puces s'ouvre filtrée sur les puces installées (PU-P-02)
      routeQuery: '?statut=installee',
      snapshotKey: 'pucesInstallees'
    });
    // TDB-D-05 Packs vendus · 30 j
    const leader = packRank[0];
    const viaResellers = pct(
      packRank.reduce((s, r) => s + r.resellers, 0),
      packClientsTotal
    );
    kpis.push({
      id: 'TDB-D-05',
      mockupId: 'D-05',
      label: 'Packs vendus · 30 j',
      value: sold30.length,
      unit: 'packs',
      info: leader && leader.clients ? `${leader.name} en tête` : 'Aucun pack',
      context: `${fmt(packClientsTotal)} packs en cours · ${viaResellers} % via les revendeurs`,
      what: `Nouveaux packs affectés sur les 30 derniers jours. ${leader ? `${leader.name} est le pack le plus choisi (${leader.clients} clients sur ${packClientsTotal}).` : ''}`,
      definition: 'Nombre de packs affectés à un client sur les 30 derniers jours, avec le pack en tête et la part vendue via les revendeurs. Pas d’objectif.',
      formula: 'Packs vendus = nombre d’affectations pack → client datées de moins de 30 j',
      table: {
        headers: ['Pack', 'Clients', 'Tunav', 'Revendeurs'],
        rows: packRank.map((r) => [r.name, r.clients, r.tunav, r.resellers])
      },
      route: 'subscriptions',
      routeLabel: 'Packs',
      // FleetIQ 08 : Packs s'ouvre sur la période 30 j (PK-P-02)
      routeQuery: '?periode=30j',
      snapshotKey: 'packsVendus30',
      monthly
    });
  } else {
    const due30 = endClients.filter((c) => c.status === 'Active' && daysTo(c) >= 0 && daysTo(c) <= 30);
    // TDB-R-01 Mes clients actifs
    kpis.push({
      id: 'TDB-R-01',
      mockupId: 'R-01',
      label: 'Mes clients actifs',
      value: activeCount,
      of: endClients.length,
      unit: 'clients',
      goal: goals.clientsActifs,
      context: `${fmt(blockedCount)} bloqué${blockedCount > 1 ? "s" : ""} · ${fmt(blockedSoonList.length)} bloqué${blockedSoonList.length > 1 ? "s" : ""} dans ≤ ${settings.graceDays} j`,
      what: 'Vos clients dont l’abonnement est actif. Un client bloqué ne peut plus utiliser la plateforme.',
      definition: `Part de vos clients dont le compte est actif (actif jusqu’à ${settings.graceDays} jours après l’expiration).`,
      formula: `Actif = non bloqué ET date ≤ expiration + ${settings.graceDays} j · limité à vos clients`,
      table: {
        headers: ['', 'Clients', '%'],
        rows: [
          ['Actifs', activeCount, `${pct(activeCount, endClients.length)} %`],
          [`dont bloqués dans ≤ ${settings.graceDays} j`, blockedSoonList.length, `${pct(blockedSoonList.length, endClients.length)} %`],
          ['Bloqués', blockedCount, `${pct(blockedCount, endClients.length)} %`]
        ]
      },
      route: 'clients',
      routeLabel: 'Gestion Clients',
      snapshotKey: 'clientsActifs'
    });
    // TDB-R-02 Équipements installés (ses clients)
    kpis.push({
      id: 'TDB-R-02',
      mockupId: 'R-02',
      label: 'Équipements installés',
      value: inst,
      of: parkAll.sold,
      unit: 'vendus',
      goal: goals.installes,
      context: `${fmt(wait)} vendus pas encore posés`,
      what: 'Part de vos boîtiers vendus qui sont posés dans un véhicule.',
      definition: 'Part de vos équipements vendus qui sont posés dans un véhicule.',
      formula: '% = installés ÷ vendus × 100, limité à vos clients',
      table: {
        headers: ['Client', 'Vendus', 'Installés', '% installés'],
        rows: parkRows.map((r) => [r.label, r.sold, r.installed, `${pct(r.installed, r.sold)} %`])
      },
      route: 'equipments',
      routeLabel: 'Équipements',
      routeQuery: '?etat=installe',
      snapshotKey: 'installes'
    });
    // TDB-R-03 Équipements connectés (ses clients)
    kpis.push({
      id: 'TDB-R-03',
      mockupId: 'R-03',
      label: 'Équipements connectés',
      value: connected,
      of: inst,
      unit: 'installés',
      goal: goals.connectes,
      context: `${fmt(notConnected)} installés muets depuis plus de ${connRule}`,
      what: `Part de vos boîtiers installés qui ont envoyé des données depuis ${connRule} ou moins.`,
      definition: `Part de vos équipements installés qui ont envoyé des données dans les ${connRule}.`,
      formula: '% = connectés ÷ installés × 100, limité à vos clients',
      table: {
        headers: ['Client', 'Installés', 'Connectés', '% connectés'],
        rows: parkRows.map((r) => [r.label, r.installed, r.connected, `${pct(r.connected, r.installed)} %`])
      },
      route: 'equipments',
      routeLabel: 'Équipements',
      routeQuery: '?etat=connecte',
      snapshotKey: 'connectes'
    });
    // TDB-R-04 Échéances dans 30 j
    kpis.push({
      id: 'TDB-R-04',
      mockupId: 'R-04',
      label: 'Échéances dans 30 j',
      value: due30.length,
      unit: 'clients',
      info: 'À renouveler',
      context: `sur vos ${fmt(endClients.length)} clients`,
      what: 'Vos clients dont l’abonnement arrive à échéance dans les 30 prochains jours.',
      definition: 'Nombre de vos clients dont l’abonnement arrive à échéance dans les 30 prochains jours (à renouveler).',
      formula: 'Échéance = date ≤ expiration ≤ date + 30 j',
      table: due30.length
        ? {
            headers: ['Client', 'Échéance', 'Dans'],
            rows: due30
              .sort((a, b) => daysTo(a) - daysTo(b))
              .map((c) => [c.name, (expiryOf(c) ?? asOf).toLocaleDateString('fr-FR'), `${Math.round(daysTo(c))} j`])
          }
        : undefined,
      route: 'clients',
      routeLabel: 'Gestion Clients',
      routeQuery: '?alerte=echeance&delai=30',
      snapshotKey: 'echeances30'
    });
  }

  /* ---------- À traiter (cloche D-06 / R-05) ---------- */
  const todo: TodoItem[] = [];
  const allScopeClients = isNetwork ? scopeClients : endClients;
  const owner = (c: FleetClient) => (isNetwork ? ownerLabel(c.reseller) : c.name);

  // Packs A-10 : expiration ≤ 10 j (vue Tunav seulement : pas de sujet « packs » pour le revendeur)
  if (isNetwork) {
    const crit = allScopeClients.filter(
      (c) => c.status === 'Active' && daysTo(c) >= 0 && daysTo(c) <= settings.critDays
    );
    todo.push({
      id: 'expire10',
      sourceRule: 'Packs A-10',
      priority: 1,
      title: `Abonnements qui expirent dans ${settings.critDays} j`,
      detail: crit.length ? topNames(crit.map((c) => ({ name: c.name, days: daysTo(c) }))) : 'Aucun',
      count: crit.length,
      unit: 'clients',
      what: `L’abonnement de ces clients se termine dans moins de ${settings.critDays} jours. Sans renouvellement, ils seront bloqués ${settings.graceDays} jours après l’échéance.`,
      route: 'subscriptions',
      routeLabel: 'Packs',
      // FleetIQ 08 : liste des clients de Packs filtrée sur PK-A-10 (même règle : actifs, 0–10 j)
      routeQuery: '?alerte=critique',
      table: {
        headers: ['Client', 'Propriétaire', 'Échéance'],
        rows: crit
          .sort((a, b) => daysTo(a) - daysTo(b))
          .map((c) => [c.name, ownerLabel(c.reseller), `J-${Math.round(daysTo(c))}`])
      }
    });
  }
  // Gestion Clients A-04 (a) : bloqués dans ≤ 30 j
  const soon = allScopeClients.filter(blockedSoon);
  todo.push({
    id: 'blocked30',
    routeQuery: '?alerte=blocage',
    sourceRule: 'Gestion Clients A-04',
    priority: 1,
    title: `Clients bloqués dans ${settings.graceDays} j ou moins`,
    detail: soon.length
      ? isNetwork
        ? `Abonnement expiré · ${byDetail(countBy(soon, owner))}`
        : topNames(soon.map((c) => ({ name: c.name, days: daysBetween(asOf, addDays(expiryOf(c) ?? asOf, settings.graceDays)) })), 4)
      : 'Aucun',
    count: soon.length,
    unit: 'clients',
    what: `Abonnement expiré mais pas encore renouvelé : le client est bloqué ${settings.graceDays} jours après la date d’expiration.`,
    route: 'clients',
    routeLabel: 'Gestion Clients',
    table: {
      headers: ['Client', isNetwork ? 'Propriétaire' : 'Expiré le', 'Blocage dans'],
      rows: soon
        .map((c) => ({ c, d: daysBetween(asOf, addDays(expiryOf(c) ?? asOf, settings.graceDays)) }))
        .sort((a, b) => a.d - b.d)
        .map(({ c, d }) => [c.name, isNetwork ? ownerLabel(c.reseller) : c.expiry.split('-').reverse().join('/'), `${Math.round(d)} j`])
    }
  });
  // Équipements A-21 : non connectés > 30 j
  const off30 = sold.filter((e) => {
    const st = stateOf(e);
    return st.installed && (st.daysSince == null || st.daysSince > 30);
  });
  todo.push({
    id: 'off30',
    routeQuery: '?alerte=non_connecte_30',
    sourceRule: 'Équipements A-21',
    priority: 1,
    title: 'Équipements non connectés depuis plus de 30 j',
    detail: isNetwork ? 'Installés chez le client, muets depuis plus d’un mois' : 'Installés chez vos clients, muets depuis plus d’un mois',
    count: off30.length,
    unit: 'équip.',
    what: 'Boîtiers posés chez le client mais qui n’envoient plus rien depuis plus de 30 jours.',
    route: 'equipments',
    routeLabel: 'Équipements',
    table: { headers: [isNetwork ? 'Revendeur' : 'Client', 'Équipements'], rows: countBy(off30, (e) => rowLabelOf(rowKeyOf(e))) }
  });
  // Équipements A-23 : déconnectés > 1 j (alerte « En direct »), encore « connectés » jusqu'au seuil
  const alert1 = sold.filter((e) => {
    const st = stateOf(e);
    return st.installed && st.daysSince != null && st.daysSince > settings.alertDays && st.daysSince <= settings.alertDays + 7;
  });
  todo.push({
    id: 'alert1',
    routeQuery: '?alerte=direct',
    sourceRule: 'Équipements A-23',
    priority: 1,
    title: `Équipements déconnectés depuis plus de ${settings.alertDays} j`,
    detail: `Installés, aucune donnée depuis plus de ${settings.alertDays * 24} h · alertes des 7 derniers jours`,
    count: alert1.length,
    unit: 'équip.',
    what: `L’alerte part dès qu’un équipement installé n’a envoyé aucune donnée depuis plus de ${settings.alertDays} jour. Il reste « Connecté » jusqu’à ${connRule}, puis passe « Non connecté ».`,
    route: 'equipments',
    routeLabel: 'Équipements',
    table: { headers: [isNetwork ? 'Revendeur' : 'Client', 'Équipements'], rows: countBy(alert1, (e) => rowLabelOf(rowKeyOf(e))) }
  });
  // Gestion Clients A-01 : échéances dans 30 j
  const due = allScopeClients.filter((c) => c.status === 'Active' && daysTo(c) >= 0 && daysTo(c) <= 30);
  todo.push({
    id: 'due30',
    routeQuery: '?alerte=echeance&delai=30',
    sourceRule: 'Gestion Clients A-01',
    priority: 2,
    title: 'Échéances d’abonnement dans 30 j',
    detail: due.length ? (isNetwork ? byDetail(countBy(due, owner)) : 'Clients à renouveler ce mois-ci') : 'Aucune',
    count: due.length,
    unit: 'clients',
    what: 'Clients dont l’abonnement arrive à échéance dans les 30 prochains jours.',
    route: 'clients',
    routeLabel: 'Gestion Clients'
  });
  // Équipements A-22 : installation en attente > 30 j
  const pending = sold.filter((e) => {
    const st = stateOf(e);
    const assigned = parseDate(e.assignedAt ?? e.contractDate);
    return !st.installed && !!assigned && daysBetween(assigned, asOf) > 30;
  });
  todo.push({
    id: 'pending30',
    routeQuery: '?alerte=attente_30',
    sourceRule: 'Équipements A-22',
    priority: 2,
    title: 'Installation en attente depuis plus de 30 j',
    detail: 'Vendus, jamais posés',
    count: pending.length,
    unit: 'équip.',
    what: 'Boîtiers affectés à un client depuis plus d’un mois et toujours pas installés.',
    route: 'equipments',
    routeLabel: 'Équipements',
    table: { headers: [isNetwork ? 'Revendeur' : 'Client', 'Équipements'], rows: countBy(pending, (e) => rowLabelOf(rowKeyOf(e))) }
  });
  // Gestion Clients A-02 : sans connexion utilisateur > 30 j (journal des connexions à confirmer back-end)
  // FleetIQ 07 : même règle que la page Gestion Clients (CLI-A-02) : clients ACTIFS seulement, comptes revendeurs
  // compris en vue Tunav (allScopeClients), clients du revendeur seulement en vue revendeur
  const noLogin = allScopeClients.filter((c) => {
    if (!isActive(c)) return false;
    const d = lastLogin.get(c.id);
    return !d || daysBetween(d, asOf) > 30;
  });
  todo.push({
    id: 'nologin30',
    routeQuery: '?alerte=relance&delai=30',
    sourceRule: 'Gestion Clients A-02',
    priority: isNetwork ? 2 : 3,
    title: 'Clients sans connexion depuis plus de 30 j',
    detail: noLogin.length ? (isNetwork ? byDetail(countBy(noLogin, owner)) : 'Risque de départ') : 'Aucun',
    count: noLogin.length,
    unit: 'clients',
    what: 'Clients actifs qui ne se sont pas connectés à la plateforme depuis plus d’un mois : risque de départ (les clients bloqués ne sont pas comptés, comme dans Gestion Clients).',
    route: 'clients',
    routeLabel: 'Gestion Clients'
  });
  if (isNetwork) {
    const nonInstalled = scopeSims.filter((s) => !simInstalled(s));
    todo.push({
      id: 'simsNotInstalled',
      sourceRule: 'Gestion des puces P-03',
      priority: 3,
      title: 'Puces non installées',
      detail: `${pct(nonInstalled.length, simsTotal)} % des puces · ${byDetail(countBy(nonInstalled, (s) => s.reseller))}`,
      count: nonInstalled.length,
      unit: 'puces',
      what: 'Puces dont l’équipement n’est pas encore posé dans un véhicule (ou encore en stock) : l’abonnement court sans service.',
      route: 'sims',
      routeLabel: 'Gestion des puces',
      routeQuery: '?statut=non_installee'
    });
    const overTotal = overRows.reduce((s, r) => s + r.overSims, 0);
    const overMB = overRows.reduce((s, r) => s + r.excessMB, 0);
    todo.push({
      id: 'simsOver',
      sourceRule: 'Gestion des puces P-04 / C-25',
      priority: 3,
      title: 'Puces en surconsommation',
      detail: `+${volume(overMB)} au-delà du forfait en ${formatMonthFr(lastFullMonth)} · ${overRows
        .filter((r) => r.overSims)
        .map((r) => `${r.reseller} ${r.overSims}`)
        .join(' · ')}`,
      count: overTotal,
      unit: 'puces',
      what: 'Puces qui ont dépassé leur forfait data le mois dernier.',
      route: 'sims',
      routeLabel: 'Gestion des puces',
      // FleetIQ 09 : même mois que PU-P-07 (période « Mois » = dernier mois complet)
      routeQuery: `?alerte=surconso&periode=mois&mois=${lastFullMonth}`
    });
  }
  todo.sort((a, b) => a.priority - b.priority);

  return {
    scope,
    asOf,
    connDays,
    kpis,
    todo,
    parkRows,
    parkAll,
    stock: stockEq.length,
    stockByNetwork,
    simsTotal,
    simsInstalled: simsInstalledCount,
    overMonth: lastFullMonth,
    overRows,
    packRank,
    packClientsTotal,
    topReseller
  };
}
