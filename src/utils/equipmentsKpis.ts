/**
 * Gestion des Équipements v3 – calcul des KPI (carte FleetIQ 07 · maquette Equipements-v3 · Documentation-Equipements-v3).
 * IDs du code préfixés `EQ-` (analyse § 7-5) ; l'ID de la maquette est rappelé en commentaire.
 *
 * Règles (doc Équipements, décisions du 2026-11-14) :
 * - Un équipement est « stock » (client `*_Stock`) ou « vendu » (affecté à un client).
 * - Un vendu est installé ou non installé ; un installé est connecté (données ≤ seuil global, 7 j par défaut)
 *   ou non connecté. Le libellé « sans signal » n'existe plus.
 * - Tous les chiffres sont recalculés à partir des lignes du tableau (EqRow), jamais saisis à la main.
 * - Aucun prix, aucune valeur de stock.
 * - A-23 (alerte « En direct ») : installé, aucune donnée depuis plus de @AlertDays (1 j) et au plus @AlertDays + 7 j
 *   (alertes des 7 derniers jours) – même règle que la cloche du Tableau de bord (dashboardKpis.ts).
 */
import type { FleetEquipment, Pack, SimCard, SimOffer } from '../state/FleetStore';
import { daysBetween, parseDate } from '../state/mock/dates';
import { equipmentState } from './dashboardKpis';

export const fmt = (n: number) => n.toLocaleString('fr-FR');
export const pct = (a: number, b: number) => (b ? Math.round((a * 100) / b) : 0);
export const frDate = (d: Date | null | undefined) => (d ? d.toLocaleDateString('fr-FR') : '—');

/** Ordre d'affichage des réseaux : Tunav (clients directs) en premier, puis les revendeurs de la maquette. */
export const NETWORK_ORDER = ['Tunav', 'MyCom', 'FleetPro Sfax', 'NavSud'];
export const networkLabel = (n: string) => (n === 'Tunav' ? 'Tunav · clients directs' : n);
const networkRank = (n: string) => {
  const i = NETWORK_ORDER.indexOf(n);
  return i < 0 ? NETWORK_ORDER.length : i;
};
export const compareNetworks = (a: string, b: string) => networkRank(a) - networkRank(b) || a.localeCompare(b);

/** Seuil des cartes « À traiter » (@AlertDays de la doc, 30 j) */
export const TODO_DAYS = 30;

export type EqState = 'connected' | 'not_connected' | 'not_installed' | 'stock';
export const STATE_ORDER: EqState[] = ['connected', 'not_connected', 'not_installed', 'stock'];
export const STATE_LABELS: Record<EqState, string> = {
  connected: 'Connecté',
  not_connected: 'Non connecté',
  not_installed: 'Non installé',
  stock: 'Stock'
};

/** Une ligne du tableau T-11 : source unique de tous les chiffres de la page. */
export type EqRow = {
  eq: FleetEquipment;
  state: EqState;
  /** Réseau : « Tunav » (clients directs et stock Tunav) ou nom du revendeur */
  network: string;
  /** Propriétaire = client (ou stock) */
  owner: string;
  type: string;
  packId: number | null;
  packName: string;
  iccid: string;
  phone: string;
  offer: string;
  assigned: Date | null;
  lastComm: Date | null;
  /** jours depuis la dernière communication (null = jamais) */
  daysSince: number | null;
  /** non installé : jours depuis l'affectation · stock : jours depuis l'entrée en stock */
  daysWaiting: number | null;
  /** jours avec données sur 30 (à confirmer back-end) */
  days30: number;
  /** EQ-A-23 : déconnecté depuis plus de 1 j (alertes des 7 derniers jours) */
  live: boolean;
  /** EQ-A-21 : installé, non connecté depuis plus de 30 j */
  off30: boolean;
  /** EQ-A-22 : affecté, installation en attente depuis plus de 30 j */
  pending30: boolean;
};

export type EqRowsInput = {
  equipments: FleetEquipment[];
  simCards: SimCard[];
  simOffers: SimOffer[];
  packs: Pack[];
  now: Date;
  connThresholdHours: number;
  /** alerte « déconnecté depuis plus de N j » (A-23), 1 j par défaut */
  alertDays: number;
};

export function buildRows(input: EqRowsInput): EqRow[] {
  const { now, connThresholdHours, alertDays } = input;
  const packById = new Map(input.packs.map((p) => [p.id, p]));
  const offerById = new Map(input.simOffers.map((o) => [o.id, o]));
  const simByEq = new Map<number, SimCard>();
  for (const s of input.simCards) if (s.equipmentId != null) simByEq.set(s.equipmentId, s);

  const rows = input.equipments.map((eq): EqRow => {
    const st = equipmentState(eq, now, connThresholdHours);
    const state: EqState = st.stock ? 'stock' : !st.installed ? 'not_installed' : st.connected ? 'connected' : 'not_connected';
    const sim = simByEq.get(eq.id);
    const offer = sim?.offerId != null ? offerById.get(sim.offerId) : undefined;
    const pack = typeof eq.packId === 'number' ? packById.get(eq.packId) : undefined;
    const assigned = st.stock ? null : parseDate(eq.assignedAt ?? eq.contractDate);
    const stockSince = st.stock ? parseDate(eq.contractDate) : null;
    const waitFrom = state === 'not_installed' ? assigned : stockSince;
    const daysWaiting = waitFrom ? Math.max(0, Math.floor(daysBetween(waitFrom, now))) : null;
    const daysSince = st.daysSince;
    return {
      eq,
      state,
      network: eq.reseller || 'Tunav',
      owner: eq.client,
      type: eq.equipmentType ?? eq.type,
      packId: pack ? pack.id : null,
      packName: pack ? pack.name : 'Aucun pack',
      iccid: sim?.iccid || eq.iccid || '',
      phone: sim?.phoneNumber || eq.sim || '',
      offer: offer ? `${offer.name}${offer.operator && !offer.name.includes(offer.operator) ? ` · ${offer.operator}` : ''}` : '',
      assigned,
      lastComm: eq.lastCommunication ? new Date(eq.lastCommunication) : null,
      daysSince,
      daysWaiting,
      days30: st.installed ? eq.daysConnected30 ?? 0 : 0,
      live: st.installed && daysSince != null && daysSince > alertDays && daysSince <= alertDays + 7,
      off30: st.installed && (daysSince == null || daysSince > TODO_DAYS),
      pending30: state === 'not_installed' && daysWaiting != null && daysWaiting > TODO_DAYS
    };
  });
  return sortRows(rows);
}

/** T-11 : Tunav en premier, puis MyCom, FleetPro Sfax, NavSud ; client ; état ; le stock à la fin. */
export function sortRows(rows: EqRow[]): EqRow[] {
  return rows.slice().sort((a, b) => {
    const sa = a.state === 'stock' ? 1 : 0;
    const sb = b.state === 'stock' ? 1 : 0;
    return (
      sa - sb ||
      compareNetworks(a.network, b.network) ||
      a.owner.localeCompare(b.owner) ||
      STATE_ORDER.indexOf(a.state) - STATE_ORDER.indexOf(b.state) ||
      a.eq.serial.localeCompare(b.eq.serial)
    );
  });
}

export type StateCounts = {
  park: number;
  sold: number;
  stock: number;
  installed: number;
  notInstalled: number;
  connected: number;
  notConnected: number;
};

/** EQ-E-01 … EQ-E-05 : comptes des 4 états (Installés + Non installés = Vendus ; Connectés + Non connectés = Installés) */
export function countStates(rows: EqRow[]): StateCounts {
  const c: StateCounts = { park: rows.length, sold: 0, stock: 0, installed: 0, notInstalled: 0, connected: 0, notConnected: 0 };
  for (const r of rows) {
    if (r.state === 'stock') {
      c.stock += 1;
      continue;
    }
    c.sold += 1;
    if (r.state === 'not_installed') c.notInstalled += 1;
    else {
      c.installed += 1;
      if (r.state === 'connected') c.connected += 1;
      else c.notConnected += 1;
    }
  }
  return c;
}

/* ------------------------------------------------------------------ Répartition */

export type GroupRow = { key: string; label: string; counts: StateCounts; children?: GroupRow[] };

const problems = (c: StateCounts) => c.notConnected + c.notInstalled;

/**
 * EQ-G-01 (G-01) Par revendeur et client : vue Tunav = une ligne par réseau (Tunav en premier) avec ses clients
 * (les clients avec le plus de problèmes en premier) ; vue revendeur = une ligne par client. Stock exclu.
 */
export function groupByNetwork(rows: EqRow[], isNetwork: boolean): GroupRow[] {
  const sold = rows.filter((r) => r.state !== 'stock');
  const byOwner = (list: EqRow[]) => {
    const m = new Map<string, EqRow[]>();
    for (const r of list) m.set(r.owner, [...(m.get(r.owner) ?? []), r]);
    return Array.from(m.entries())
      .map(([k, l]) => ({ key: k, label: k, counts: countStates(l) }))
      .sort((a, b) => problems(b.counts) - problems(a.counts) || b.counts.sold - a.counts.sold || a.label.localeCompare(b.label));
  };
  if (!isNetwork) return byOwner(sold);
  const m = new Map<string, EqRow[]>();
  for (const r of sold) m.set(r.network, [...(m.get(r.network) ?? []), r]);
  return Array.from(m.entries())
    .sort((a, b) => compareNetworks(a[0], b[0]))
    .map(([k, l]) => ({ key: k, label: networkLabel(k), counts: countStates(l), children: byOwner(l) }));
}

export type TypeRow = { type: string; sold: number; stock: number; share: number; counts: StateCounts };

/** EQ-G-02 (G-02) Top 5 produits vendus (+ autres modèles, modèle le plus en stock) */
export function productRanking(rows: EqRow[]) {
  const m = new Map<string, EqRow[]>();
  for (const r of rows) m.set(r.type, [...(m.get(r.type) ?? []), r]);
  const soldTotal = rows.filter((r) => r.state !== 'stock').length;
  const all: TypeRow[] = Array.from(m.entries())
    .map(([type, l]) => {
      const counts = countStates(l);
      return { type, sold: counts.sold, stock: counts.stock, share: pct(counts.sold, soldTotal), counts };
    })
    .sort((a, b) => b.sold - a.sold || a.type.localeCompare(b.type));
  const ranked = all.filter((t) => t.sold > 0);
  const top = ranked.slice(0, 5);
  const others = ranked.slice(5);
  const mostStock = all.filter((t) => t.stock > 0).sort((a, b) => b.stock - a.stock || a.sold - b.sold)[0] ?? null;
  return { soldTotal, all, top, others, mostStock };
}

export const LAST_COMM_BUCKETS = ['≤ 1 j', '2–7 j', '8–30 j', '31–180 j', '> 180 j', 'Jamais'] as const;
export type LastCommBucket = (typeof LAST_COMM_BUCKETS)[number];

/** EQ-G-03 (G-03) tranche de dernière communication (vendus : installés et non installés) */
export function lastCommBucket(r: EqRow): LastCommBucket {
  if (r.state === 'not_installed' || r.daysSince == null) return 'Jamais';
  const d = Math.floor(r.daysSince);
  if (d <= 1) return '≤ 1 j';
  if (d <= 7) return '2–7 j';
  if (d <= 30) return '8–30 j';
  if (d <= 180) return '31–180 j';
  return '> 180 j';
}

export function lastCommDistribution(rows: EqRow[]) {
  const sold = rows.filter((r) => r.state !== 'stock');
  return LAST_COMM_BUCKETS.map((b) => ({ bucket: b, rows: sold.filter((r) => lastCommBucket(r) === b) }));
}

/** EQ-G-04 (G-04) affectations par mois de l'année choisie, colorées par état actuel */
export function assignmentsByMonth(rows: EqRow[], year: number) {
  const months = Array.from({ length: 12 }, (_, m) => ({ month: m, rows: [] as EqRow[] }));
  for (const r of rows) {
    if (r.state === 'stock' || !r.assigned || r.assigned.getFullYear() !== year) continue;
    months[r.assigned.getMonth()].rows.push(r);
  }
  return months.map((x) => ({ ...x, counts: countStates(x.rows) }));
}

export function assignmentYears(rows: EqRow[], now: Date): number[] {
  const ys = new Set<number>([now.getFullYear()]);
  for (const r of rows) if (r.assigned) ys.add(r.assigned.getFullYear());
  return Array.from(ys).sort((a, b) => a - b);
}

/**
 * EQ-C-01 Connectés / non connectés par client ou par pack (ajout carte 07, d'après § 5.4 E-02 / E-03 :
 * « liste par revendeur → client »). Installés seulement ; triés par non connectés.
 */
export function connectionBy(rows: EqRow[], key: 'owner' | 'pack') {
  const m = new Map<string, EqRow[]>();
  for (const r of rows) {
    if (r.state !== 'connected' && r.state !== 'not_connected') continue;
    const k = key === 'owner' ? r.owner : r.packId != null ? String(r.packId) : 'none';
    m.set(k, [...(m.get(k) ?? []), r]);
  }
  return Array.from(m.entries())
    .map(([k, l]) => ({
      key: k,
      label: key === 'owner' ? k : l[0].packName,
      network: l[0].network,
      counts: countStates(l)
    }))
    .sort((a, b) => b.counts.notConnected - a.counts.notConnected || b.counts.installed - a.counts.installed || a.label.localeCompare(b.label));
}

/** EQ-C-02 Équipements les plus connectés (jours avec données sur 30, puis dernier envoi le plus récent) */
export function topConnected(rows: EqRow[], n = 10): EqRow[] {
  return rows
    .filter((r) => r.state === 'connected')
    .sort((a, b) => b.days30 - a.days30 || (a.daysSince ?? 0) - (b.daysSince ?? 0) || a.eq.serial.localeCompare(b.eq.serial))
    .slice(0, n);
}

/** EQ-C-03 Taux de connexion par type d'équipement (connectés ÷ installés) */
export function connectionRateByType(rows: EqRow[]) {
  const m = new Map<string, EqRow[]>();
  for (const r of rows) {
    if (r.state !== 'connected' && r.state !== 'not_connected') continue;
    m.set(r.type, [...(m.get(r.type) ?? []), r]);
  }
  return Array.from(m.entries())
    .map(([type, l]) => ({ type, counts: countStates(l), rate: pct(countStates(l).connected, l.length) }))
    .sort((a, b) => b.rate - a.rate || b.counts.installed - a.counts.installed);
}

/* ------------------------------------------------------------------ textes de ligne / fiche */

const days = (n: number | null) => (n == null ? '—' : `${fmt(Math.max(0, Math.floor(n)))} j`);

/** Texte court « Dernière comm. » */
export function lastCommText(r: EqRow): string {
  if (r.state === 'stock' || r.state === 'not_installed') return '—';
  if (r.daysSince == null) return 'jamais';
  const d = Math.floor(r.daysSince);
  return d < 1 ? "aujourd'hui" : `il y a ${fmt(d)} j`;
}

/** EQ-F-11 : phrase d'explication de l'état */
export function stateSentence(r: EqRow, connDays: number, alertDays: number): string {
  switch (r.state) {
    case 'connected':
      return r.live
        ? `Connecté, mais aucune donnée depuis ${days(r.daysSince)} (alerte « déconnecté depuis plus de ${alertDays} j »). Il passe « Non connecté » après ${fmt(connDays)} j sans données.`
        : `Connecté : dernier envoi il y a ${days(r.daysSince)} (seuil ${fmt(connDays)} j). Le client a le service.`;
    case 'not_connected':
      return r.daysSince == null
        ? 'Non connecté : installé chez le client mais aucune donnée reçue.'
        : `Non connecté : installé chez le client mais aucune donnée depuis ${days(r.daysSince)} (plus de ${fmt(connDays)} j). Le client n’a pas le service.`;
    case 'not_installed':
      return `Non installé : affecté au client le ${frDate(r.assigned)}, jamais connecté, en attente de pose depuis ${days(r.daysWaiting)}.`;
    default:
      return `En stock${r.network ? ` chez ${r.network}` : ''}${r.daysWaiting != null ? ` depuis ${days(r.daysWaiting)}` : ''} : pas encore affecté à un client.`;
  }
}

/** EQ-F-11 : action à faire */
export function nextAction(r: EqRow): string {
  switch (r.state) {
    case 'connected':
      return r.live ? 'Surveiller : vérifier demain que les données reviennent.' : 'Aucune action.';
    case 'not_connected':
      return r.off30
        ? 'Planifier une intervention SAV (contrôle ou dépannage) et prévenir le client.'
        : 'Appeler le client, vérifier l’alimentation du boîtier et la puce.';
    case 'not_installed':
      return r.pending30 ? 'Relancer le client et planifier l’installation (intervention SAV).' : 'Planifier l’installation.';
    default:
      return 'Affecter à un client ou à un revendeur.';
  }
}

/** Texte de suivi d'une ligne : « dernier envoi il y a N j » ou « en attente depuis N j » */
export function rowFollowUp(r: EqRow): string {
  if (r.state === 'not_installed') return r.daysWaiting != null ? `en attente depuis ${fmt(r.daysWaiting)} j` : 'en attente';
  if (r.state === 'stock') return r.daysWaiting != null ? `en stock depuis ${fmt(r.daysWaiting)} j` : 'en stock';
  return `dernier envoi ${lastCommText(r)}`;
}


/* ------------------------------------------------------------------ À traiter */

export type EqAlertKey = 'direct' | 'non_connecte_30' | 'attente_30';
export const EQ_ALERT_KEYS: EqAlertKey[] = ['direct', 'non_connecte_30', 'attente_30'];

export const groupRowsBy = (rows: EqRow[], key: (r: EqRow) => string) => {
  const m = new Map<string, EqRow[]>();
  for (const r of rows) m.set(key(r), [...(m.get(key(r)) ?? []), r]);
  return m;
};

/** « Tunav 12 · MyCom 30 · … » */
export function byNetworkText(rows: EqRow[], isNetwork: boolean): string {
  if (!rows.length) return 'Aucun';
  const m = groupRowsBy(rows, (r) => (isNetwork ? r.network : r.owner));
  const entries = Array.from(m.entries()).sort((a, b) => (isNetwork ? compareNetworks(a[0], b[0]) : b[1].length - a[1].length));
  const shown = entries.slice(0, 4).map(([k, l]) => `${k} ${l.length}`);
  const rest = entries.slice(4).reduce((s, [, l]) => s + l.length, 0);
  return [...shown, ...(rest ? [`autres ${rest}`] : [])].join(' · ');
}

/* ------------------------------------------------------------------ filtres du tableau T-11 */

/** Barre des états du tableau (et paramètre d'URL ?etat=) */
export type EtatKey = 'tous' | 'installe' | 'non_installe' | 'connecte' | 'non_connecte' | 'stock';
export const ETAT_KEYS: EtatKey[] = ['tous', 'installe', 'non_installe', 'connecte', 'non_connecte', 'stock'];

export function matchesEtat(r: EqRow, etat: EtatKey): boolean {
  switch (etat) {
    case 'installe':
      return r.state === 'connected' || r.state === 'not_connected';
    case 'non_installe':
      return r.state === 'not_installed';
    case 'connecte':
      return r.state === 'connected';
    case 'non_connecte':
      return r.state === 'not_connected';
    case 'stock':
      return r.state === 'stock';
    default:
      return true;
  }
}

/** Changement de filtres demandé depuis un graphique ou une carte (les champs absents sont remis à zéro) */
export type TableFilterPatch = {
  etat?: EtatKey;
  network?: string;
  owner?: string;
  pack?: string;
  type?: string;
  assignedFrom?: string;
  assignedTo?: string;
};

/** Filtres du tableau T-11 */
export type EqTableFilters = {
  q: string;
  type: string;
  network: string;
  owner: string;
  pack: string;
  from: string;
  to: string;
  etat: EtatKey;
};

export const EMPTY_EQ_FILTERS: EqTableFilters = { q: '', type: '', network: '', owner: '', pack: '', from: '', to: '', etat: 'tous' };
