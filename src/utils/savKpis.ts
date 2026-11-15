/**
 * Interventions SAV v3 – calculs et actions (carte FleetIQ 10 · maquette SAV-v3 · Documentation-SAV-v3).
 * IDs du code préfixés `SAV-` (analyse § 7-5) ; l'ID de la maquette est rappelé en commentaire.
 *
 * Règles (doc SAV) :
 * - Statuts : À planifier · Planifiée · En cours · Terminée · À revoir. « En retard » = Planifiée ET date < « État au ».
 * - Ouvertes = À planifier + Planifiée + En cours + À revoir (S-01).
 * - Priorité haute (S-08) = aucune donnée depuis plus de 30 j OU pose en attente depuis plus de 30 j.
 * - Clôture (T-06) : « Terminée » exige le contrôle d'envoi (test d'envoi / premier envoi reçu), sauf résultat
 *   « Client absent » ou « À revoir (pièce manquante) » → l'intervention passe « À revoir » pour le responsable.
 * - Clôturer une « Installation » passe l'équipement à « installé » dans le mock (analyse § 7-10).
 * - Aucun prix, aucune donnée de contrat ni de facturation (profils SAV).
 */
import type { FleetEquipment, Intervention, InterventionStatus, InterventionType, SavZone, Technician } from '../state/FleetStore';
import { addDays, parseDate, toIsoDate } from '../state/mock/dates';
import { SAV_CHECKS, SAV_REQUIRED_CHECK, SAV_RESULTS_TO_REVIEW } from '../state/mock/interventions';

export { SAV_CHECKS, SAV_REQUIRED_CHECK, SAV_RESULTS, SAV_RESULTS_TO_REVIEW, SAV_SLOTS } from '../state/mock/interventions';

/** SAV-S-04 : objectif « résolues à la 1re visite » – proposition de la maquette, à valider */
export const SAV_FIRST_VISIT_GOAL = 85;
/** SAV-S-07 / S-10 : charge signalée à partir de N interventions (aujourd'hui + retards) */
export const SAV_LOAD_ALERT = 5;
/**
 * Technicien connecté (mock) : le profil « Technicien SAV » est relié au technicien fictif de la zone Sud.
 * À confirmer back-end : lien utilisateur → Technician (analyse § 6).
 */
export const CONNECTED_TECHNICIAN_ID = 'tech-sud';
/** Horizon de « Prochains jours » (technicien) */
export const SAV_NEXT_DAYS = 14;

export const fmt = (n: number) => n.toLocaleString('fr-FR');
export const pct = (a: number, b: number) => (b ? Math.round((a * 100) / b) : 0);

export const SAV_TYPES: InterventionType[] = ['Dépannage', 'Contrôle', 'Installation', 'Remplacement'];
export const SAV_STATUSES: InterventionStatus[] = ['À planifier', 'Planifiée', 'En cours', 'Terminée', 'À revoir'];
export type SavDisplayStatus = InterventionStatus | 'En retard';
export const SAV_DISPLAY_STATUSES: SavDisplayStatus[] = ['En retard', ...SAV_STATUSES];

const OPEN: InterventionStatus[] = ['À planifier', 'Planifiée', 'En cours', 'À revoir'];
export const isOpen = (iv: Intervention) => OPEN.includes(iv.status);
/** SAV-S-03 / T-02 (S-03 / T-02) : planifiée, date de rendez-vous dépassée */
export const isLate = (iv: Intervention, asOfIso: string) =>
  iv.status === 'Planifiée' && !!iv.plannedDate && iv.plannedDate < asOfIso;
export const displayStatus = (iv: Intervention, asOfIso: string): SavDisplayStatus =>
  isLate(iv, asOfIso) ? 'En retard' : iv.status;

const DAY_MS = 24 * 3600 * 1000;

/** Terminée dans les N jours qui précèdent la fin du jour « État au » */
export function closedWithin(iv: Intervention, asOf: Date, days: number): boolean {
  if (iv.status !== 'Terminée' || !iv.closedAt) return false;
  const t = new Date(iv.closedAt).getTime();
  const end = addDays(asOf, 1).getTime();
  return t < end && t >= end - days * DAY_MS;
}

/** SAV-S-08 (S-08) : priorité haute = aucune donnée depuis plus de 30 j ou pose en attente depuis plus de 30 j */
export function isHighPriority(iv: Intervention): boolean {
  const p = iv.problem ?? '';
  if (/^Aucune donnée reçue/.test(p)) return true;
  const m = /depuis (\d+) j/.exec(p);
  const n = m ? Number(m[1]) : 0;
  return n > 30 && (/^Aucune donnée/.test(p) || /^Vendu, en attente de pose/.test(p));
}

/** SAV-S-11 (S-11) : mention sous le type dans les tableaux */
export const typeMention = (iv: Intervention) =>
  iv.typeChangedBy ? 'modifié' : iv.source === 'alerte' ? 'auto' : 'manuel';

const ALERT_ORIGIN: Record<InterventionType, string> = {
  Installation: 'vendu non installé',
  Dépannage: 'installé non connecté (aucune donnée depuis plus de 7 j)',
  Contrôle: 'déconnecté depuis plus de 1 j',
  Remplacement: 'boîtier à remplacer'
};
/** SAV-S-11 : ligne « Origine » de la fiche */
export function originText(iv: Intervention): string {
  const base = iv.source === 'alerte' ? `Alerte automatique · Équipements : ${ALERT_ORIGIN[iv.typeAuto]}` : 'Créée par le responsable SAV (appel client)';
  return iv.typeChangedBy ? `${base} · type modifié par le responsable SAV (proposé : ${iv.typeAuto})` : base;
}

/** S-11 : type proposé à partir de l'état de l'équipement (même règle que la génération) */
export function proposedType(eq: FleetEquipment | undefined, now: Date): InterventionType | null {
  if (!eq) return null;
  if (!eq.isInstalled) return 'Installation';
  const d = eq.lastCommunication ? (now.getTime() - new Date(eq.lastCommunication).getTime()) / DAY_MS : null;
  if (d == null || d > 7) return 'Dépannage';
  if (d > 1) return 'Contrôle';
  return null;
}

export const frDay = (iso: string | null) => {
  const d = parseDate(iso);
  return d ? d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit' }) : '—';
};
export const rdvText = (iv: Intervention) => (iv.plannedDate ? `${frDay(iv.plannedDate)}${iv.plannedTime ? ` · ${iv.plannedTime}` : ''}` : '—');
export const frDateTime = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('fr-FR') : '—');

/* ------------------------------------------------------------------ vue équipe (Admin, Responsable SAV) */

export type TeamKpis = {
  /** SAV-S-01 */ open: number; toPlan: number; running: number; review: number;
  /** SAV-S-03 */ late: number;
  /** SAV-S-04 */ closed30: number; firstVisit30: number; firstVisitPct: number;
  /** SAV-S-05 */ avgDelayDays: number | null;
};

export function teamKpis(list: Intervention[], asOf: Date): TeamKpis {
  const asOfIso = toIsoDate(asOf);
  const closed = list.filter((iv) => closedWithin(iv, asOf, 30));
  const first = closed.filter((iv) => iv.firstVisit).length;
  const delays = closed.map((iv) => (new Date(iv.closedAt as string).getTime() - new Date(iv.createdAt).getTime()) / DAY_MS);
  return {
    open: list.filter(isOpen).length,
    toPlan: list.filter((iv) => iv.status === 'À planifier').length,
    running: list.filter((iv) => iv.status === 'En cours').length,
    review: list.filter((iv) => iv.status === 'À revoir').length,
    late: list.filter((iv) => isLate(iv, asOfIso)).length,
    closed30: closed.length,
    firstVisit30: first,
    firstVisitPct: pct(first, closed.length),
    avgDelayDays: delays.length ? delays.reduce((s, d) => s + d, 0) / delays.length : null
  };
}

export type TechLoad = {
  tech: Technician;
  zone: SavZone | undefined;
  /** SAV-S-07 : ouvertes = planifiées + en cours */
  open: number;
  late: number;
  today: number;
  closed30: number;
  /** aujourd'hui (non clôturées) + retards – sert à S-10 « charge la plus élevée » */
  load: number;
};

/** SAV-S-07 (S-07) Charge par technicien */
export function techLoads(list: Intervention[], techs: Technician[], zones: SavZone[], asOf: Date): TechLoad[] {
  const asOfIso = toIsoDate(asOf);
  return techs.map((tech) => {
    const mine = list.filter((iv) => iv.technicianId === tech.id);
    const open = mine.filter((iv) => iv.status === 'Planifiée' || iv.status === 'En cours').length;
    const late = mine.filter((iv) => isLate(iv, asOfIso)).length;
    const today = mine.filter((iv) => iv.plannedDate === asOfIso).length;
    const todayLeft = mine.filter((iv) => iv.plannedDate === asOfIso && (iv.status === 'Planifiée' || iv.status === 'En cours')).length;
    return {
      tech,
      zone: zones.find((z) => z.id === tech.zoneId),
      open,
      late,
      today,
      closed30: mine.filter((iv) => closedWithin(iv, asOf, 30)).length,
      load: todayLeft + late
    };
  });
}

/** SAV-S-08 : à planifier, priorité haute d'abord puis le plus ancien signalement */
export function toPlanRows(list: Intervention[]): Intervention[] {
  return list
    .filter((iv) => iv.status === 'À planifier')
    .sort((a, b) => Number(isHighPriority(b)) - Number(isHighPriority(a)) || a.createdAt.localeCompare(b.createdAt));
}

export const techOfZone = (techs: Technician[], zoneId: string) => techs.find((t) => t.zoneId === zoneId) ?? null;

/** status 'Ouvertes' = À planifier + Planifiée + En cours + À revoir (clic sur S-01) */
export type SavFilters = { tech: string; status: '' | 'Ouvertes' | SavDisplayStatus; type: '' | InterventionType; q: string };
export const EMPTY_SAV_FILTERS: SavFilters = { tech: '', status: '', type: '', q: '' };

/** SAV-S-09 (S-09) : filtres technicien / statut (dont « En retard ») / type + recherche (client, ville, IMEI, n°) */
export function filterInterventions(list: Intervention[], f: SavFilters, asOfIso: string): Intervention[] {
  const q = f.q.trim().toLowerCase();
  return list.filter((iv) => {
    if (f.tech === 'none' ? iv.technicianId !== null : f.tech && iv.technicianId !== f.tech) return false;
    if (f.status === 'Ouvertes' ? !isOpen(iv) : f.status && displayStatus(iv, asOfIso) !== f.status) return false;
    if (f.type && iv.type !== f.type) return false;
    if (q && ![iv.id, iv.client, iv.city, iv.serial].some((s) => s.toLowerCase().includes(q))) return false;
    return true;
  });
}

/** S-09 : les retards d'abord, puis par date de rendez-vous (sans date à la fin, plus ancien signalement d'abord) */
export function sortInterventions(list: Intervention[], asOfIso: string): Intervention[] {
  const key = (iv: Intervention) => `${iv.plannedDate ?? '9999-99-99'} ${iv.plannedTime ?? ''} ${iv.createdAt}`;
  return list.slice().sort((a, b) => Number(isLate(b, asOfIso)) - Number(isLate(a, asOfIso)) || key(a).localeCompare(key(b)));
}

/* ------------------------------------------------------------------ vue technicien */

export type TechKpis = {
  /** SAV-T-01 */ today: number; todayLeft: number; todayDone: number;
  /** SAV-T-02 */ late: number;
  /** SAV-T-03 */ closed7: number; first7Pct: number;
  /** SAV-T-04 */ zoneToPlan: number;
};

export function techKpis(mine: Intervention[], zoneToPlan: Intervention[], asOf: Date): TechKpis {
  const asOfIso = toIsoDate(asOf);
  const today = mine.filter((iv) => iv.plannedDate === asOfIso);
  const closed7 = mine.filter((iv) => closedWithin(iv, asOf, 7));
  return {
    today: today.length,
    todayDone: today.filter((iv) => iv.status === 'Terminée' || iv.status === 'À revoir').length,
    todayLeft: today.filter((iv) => iv.status === 'Planifiée' || iv.status === 'En cours').length,
    late: mine.filter((iv) => isLate(iv, asOfIso)).length,
    closed7: closed7.length,
    first7Pct: pct(closed7.filter((iv) => iv.firstVisit).length, closed7.length),
    zoneToPlan: zoneToPlan.length
  };
}

const byTime = (a: Intervention, b: Intervention) =>
  `${a.plannedDate} ${a.plannedTime ?? ''}`.localeCompare(`${b.plannedDate} ${b.plannedTime ?? ''}`);

/** SAV-T-02 / T-05 : en retard, tournée du jour (ordre des heures), prochains jours */
export function techLists(mine: Intervention[], asOf: Date) {
  const asOfIso = toIsoDate(asOf);
  const horizon = toIsoDate(addDays(asOf, SAV_NEXT_DAYS));
  return {
    late: mine.filter((iv) => isLate(iv, asOfIso)).sort(byTime),
    today: mine.filter((iv) => iv.plannedDate === asOfIso).sort(byTime),
    next: mine
      .filter((iv) => iv.plannedDate && iv.plannedDate > asOfIso && iv.plannedDate <= horizon && isOpen(iv))
      .sort(byTime)
  };
}

/* ------------------------------------------------------------------ cloches (S-10, T-07) */

export type SavBellGroup = 'Urgent' | 'Aujourd’hui' | 'À suivre';
export type SavBellAction =
  | { kind: 'fiche'; id: string }
  | { kind: 'filter'; patch: Partial<SavFilters>; section?: 'list' | 'toPlan' | 'zone' }
  | { kind: 'equipments'; href: string };
export type SavBellItem = { key: string; group: SavBellGroup; urgent?: boolean; title: string; sub: string; action: SavBellAction };

export type EquipmentAlertCounts = { notConnected: number; disconnected1d: number; pending30: number };

/** SAV-S-10 (S-10) Cloche du Responsable SAV */
export function teamBell(list: Intervention[], loads: TechLoad[], techName: (id: string | null) => string, asOf: Date, eqAlerts: EquipmentAlertCounts): SavBellItem[] {
  const asOfIso = toIsoDate(asOf);
  const items: SavBellItem[] = [];
  sortInterventions(list.filter((iv) => isLate(iv, asOfIso)), asOfIso).forEach((iv) =>
    items.push({ key: `late-${iv.id}`, group: 'Urgent', urgent: true, title: `En retard : ${iv.client} · ${iv.city}`, sub: `${techName(iv.technicianId)} · prévue ${frDay(iv.plannedDate)} · ${iv.type}`, action: { kind: 'fiche', id: iv.id } })
  );
  list.filter((iv) => iv.status === 'À revoir').forEach((iv) =>
    items.push({ key: `rev-${iv.id}`, group: 'Urgent', urgent: true, title: `À revoir : ${iv.client} · ${iv.city}`, sub: `${techName(iv.technicianId)} · ${iv.result ?? 'à revoir'} · à replanifier`, action: { kind: 'fiche', id: iv.id } })
  );
  const toPlan = list.filter((iv) => iv.status === 'À planifier');
  const high = toPlan.filter(isHighPriority).length;
  if (high) items.push({ key: 'high', group: 'Urgent', urgent: true, title: `${fmt(high)} signalement(s) priorité haute à planifier`, sub: 'équipement muet ou installation en attente depuis plus de 30 j', action: { kind: 'filter', patch: { status: 'À planifier' }, section: 'toPlan' } });
  if (toPlan.length) items.push({ key: 'toplan', group: 'Aujourd’hui', title: `${fmt(toPlan.length)} signalement(s) à planifier`, sub: 'sans technicien ni date', action: { kind: 'filter', patch: { status: 'À planifier' }, section: 'toPlan' } });
  const top = loads.slice().sort((a, b) => b.load - a.load)[0];
  if (top && top.load >= SAV_LOAD_ALERT)
    items.push({ key: 'load', group: 'Aujourd’hui', title: `Charge la plus élevée : ${top.tech.name}`, sub: `${fmt(top.load)} interventions à faire aujourd’hui, retards compris · zone ${top.zone?.name ?? ''}`, action: { kind: 'filter', patch: { tech: top.tech.id }, section: 'list' } });
  if (eqAlerts.disconnected1d)
    items.push({ key: 'eq', group: 'Aujourd’hui', title: `Alertes Équipements : ${fmt(eqAlerts.disconnected1d)} déconnectés depuis plus de 1 j`, sub: `et ${fmt(eqAlerts.notConnected)} installés non connectés · à transformer en interventions`, action: { kind: 'equipments', href: '/equipments?alerte=direct' } });
  const closedToday = list.filter((iv) => iv.status === 'Terminée' && iv.closedAt && toIsoDate(new Date(iv.closedAt)) === asOfIso);
  if (closedToday.length)
    items.push({ key: 'closed', group: 'À suivre', title: `${fmt(closedToday.length)} intervention(s) clôturée(s) ce jour`, sub: closedToday.map((iv) => `${techName(iv.technicianId)} · ${iv.client}`).slice(0, 3).join(' ; '), action: { kind: 'filter', patch: { status: 'Terminée' }, section: 'list' } });
  return items;
}

/** SAV-T-07 (T-07) Cloche du technicien : ses notifications seulement */
export function techBell(mine: Intervention[], zoneToPlan: Intervention[], asOf: Date, now: Date): SavBellItem[] {
  const asOfIso = toIsoDate(asOf);
  const items: SavBellItem[] = [];
  mine.filter((iv) => isLate(iv, asOfIso)).sort(byTime).forEach((iv) =>
    items.push({ key: `late-${iv.id}`, group: 'Urgent', urgent: true, title: `En retard : ${iv.client} · ${iv.city}`, sub: `${iv.type} prévue ${frDay(iv.plannedDate)}${iv.plannedTime ? ` à ${iv.plannedTime}` : ''} · ${iv.problem ?? ''}`, action: { kind: 'fiche', id: iv.id } })
  );
  mine.filter((iv) => iv.status === 'À revoir').forEach((iv) =>
    items.push({ key: `rev-${iv.id}`, group: 'Urgent', urgent: true, title: `À revoir : ${iv.client}`, sub: `${iv.result ?? 'à revoir'} · le responsable va replanifier`, action: { kind: 'fiche', id: iv.id } })
  );
  const since = now.getTime() - DAY_MS;
  mine
    .filter((iv) => isOpen(iv) && iv.status !== 'À revoir' && iv.assignedAt && new Date(iv.assignedAt).getTime() >= since)
    .sort(byTime)
    .forEach((iv) =>
      items.push({ key: `new-${iv.id}`, group: 'Aujourd’hui', title: `Nouvelle intervention : ${iv.client} · ${iv.city}`, sub: `${iv.type} · ${rdvText(iv)} · affectée par le responsable SAV`, action: { kind: 'fiche', id: iv.id } })
    );
  const next = mine.filter((iv) => iv.plannedDate === asOfIso && (iv.status === 'Planifiée' || iv.status === 'En cours')).sort(byTime)[0];
  if (next)
    items.push({ key: 'next', group: 'Aujourd’hui', title: `Prochain rendez-vous : ${next.plannedTime ?? ''} · ${next.client}`, sub: `${next.problem ?? ''} · ${next.address ?? next.city}`, action: { kind: 'fiche', id: next.id } });
  if (zoneToPlan.length)
    items.push({ key: 'zone', group: 'À suivre', title: `${fmt(zoneToPlan.length)} équipement(s) signalé(s) dans ma zone`, sub: 'pas encore planifiés · le responsable SAV les planifie', action: { kind: 'filter', patch: {}, section: 'zone' } });
  return items;
}

/* ------------------------------------------------------------------ actions (mock, état FleetStore) */

/** SAV-S-08 / S-09 : planifier (ou replanifier) chez un technicien */
export function planIntervention(iv: Intervention, techId: string, date: string, time: string, now: Date): Intervention {
  return {
    ...iv,
    status: 'Planifiée',
    technicianId: techId,
    plannedDate: date,
    plannedTime: time,
    assignedAt: iv.technicianId === techId && iv.status !== 'À revoir' ? iv.assignedAt ?? now.toISOString() : now.toISOString(),
    revisit: iv.revisit || iv.status === 'À revoir',
    result: iv.status === 'À revoir' ? null : iv.result
  };
}

/** SAV-S-11 : « Enregistrer le type » (tant que l'intervention n'est pas terminée) */
export function changeType(iv: Intervention, type: InterventionType): Intervention {
  if (iv.status === 'Terminée') return iv;
  return { ...iv, type, typeChangedBy: type !== iv.typeAuto ? 'responsable' : null };
}

/** SAV-T-06 : « Démarrer » */
export const startIntervention = (iv: Intervention): Intervention => (iv.status === 'Planifiée' ? { ...iv, status: 'En cours' } : iv);

export const toggleCheck = (iv: Intervention, item: string): Intervention => ({
  ...iv,
  checks: { ...(iv.checks ?? {}), [item]: !iv.checks?.[item] }
});

export type CloseOutcome = { ok: true; iv: Intervention } | { ok: false; error: string };

/** SAV-T-06 : « Clôturer l'intervention » */
export function closeIntervention(iv: Intervention, result: string, now: Date, plate?: string): CloseOutcome {
  if (!result) return { ok: false, error: 'Choisissez un résultat.' };
  const review = SAV_RESULTS_TO_REVIEW.includes(result);
  const required = SAV_REQUIRED_CHECK[iv.type];
  if (!review && !iv.checks?.[required]) return { ok: false, error: `Cochez « ${required} » avant de clôturer (ou choisissez « Client absent » / « À revoir »).` };
  if (!review && iv.type === 'Installation' && !(plate ?? iv.vehicle).trim()) return { ok: false, error: 'Indiquez l’immatriculation du véhicule équipé.' };
  return {
    ok: true,
    iv: {
      ...iv,
      status: review ? 'À revoir' : 'Terminée',
      result,
      closedAt: review ? null : now.toISOString(),
      firstVisit: review ? false : !iv.revisit,
      vehicle: iv.type === 'Installation' && plate ? plate.trim() : iv.vehicle
    }
  };
}

/** § 7-10 : une Installation terminée passe l'équipement à « installé » (et connecté : premier envoi reçu) */
export function applyInstallation(eq: FleetEquipment, plate: string, now: Date): FleetEquipment {
  const today = toIsoDate(now);
  return {
    ...eq,
    isInstalled: true,
    installDate: today,
    firstSendDate: eq.firstSendDate || today,
    lastCommunication: now.toISOString(),
    daysConnected30: Math.max(1, eq.daysConnected30 ?? 0),
    car: plate.trim() || eq.car
  };
}

export type NewInterventionInput = {
  eq: FleetEquipment;
  type: InterventionType;
  problem: string;
  city: string;
  zoneId: string;
  address: string;
  plan?: { techId: string; date: string; time: string } | null;
};

/** Création manuelle par le responsable SAV (appel client) – numéro suivant */
export function createIntervention(list: Intervention[], input: NewInterventionInput, now: Date): Intervention {
  const yy = String(now.getFullYear()).slice(-2);
  const max = list.reduce((m, iv) => Math.max(m, Number(iv.id.split('-')[2]) || 0), 0);
  const base: Intervention = {
    id: `INT-${yy}-${String(max + 1).padStart(4, '0')}`,
    type: input.type,
    typeAuto: input.type,
    status: 'À planifier',
    technicianId: null,
    plannedDate: null,
    plannedTime: null,
    createdAt: now.toISOString(),
    closedAt: null,
    result: null,
    firstVisit: null,
    serial: input.eq.serial,
    client: input.eq.client,
    reseller: input.eq.reseller,
    city: input.city,
    zoneId: input.zoneId,
    vehicle: input.eq.car && input.eq.car !== 'Unassigned' ? input.eq.car : '',
    source: 'appel',
    address: input.address,
    problem: input.problem,
    typeChangedBy: null,
    assignedAt: null,
    checks: {},
    revisit: false
  };
  return input.plan ? planIntervention(base, input.plan.techId, input.plan.date, input.plan.time, now) : base;
}

/** Contrôles de la fiche pour un type */
export const checksFor = (type: InterventionType) => SAV_CHECKS[type];

/* ------------------------------------------------------------------ exports (Excel = CSV, PDF) */

export function exportRows(
  list: Intervention[],
  asOfIso: string,
  eqBySerial: Map<string, FleetEquipment>,
  techName: (id: string | null) => string,
  team: boolean
) {
  const headers = team
    ? ['N°', 'Type', 'Origine', 'Statut', 'Client', 'Revendeur', 'Ville', 'Adresse', 'Véhicule', 'Équipement', 'IMEI', 'Problème', 'Technicien', 'Rendez-vous', 'Signalée le', 'Clôturée le', 'Résultat', '1re visite']
    : ['N°', 'Type', 'Origine', 'Statut', 'Client', 'Ville', 'Adresse', 'Véhicule', 'Équipement', 'IMEI', 'Problème', 'Rendez-vous', 'Clôturée le', 'Résultat'];
  const rows = list.map((iv) => {
    const eq = eqBySerial.get(iv.serial);
    const model = eq ? [eq.equipmentType, eq.type].filter(Boolean).join(' · ') : '';
    const common = [iv.id, iv.type, typeMention(iv), displayStatus(iv, asOfIso), iv.client];
    const place = [iv.city, iv.address ?? '', iv.vehicle || '—', model, iv.serial, iv.problem ?? ''];
    return team
      ? [...common, iv.reseller, ...place, techName(iv.technicianId), rdvText(iv), frDateTime(iv.createdAt), frDateTime(iv.closedAt), iv.result ?? '', iv.firstVisit == null ? '' : iv.firstVisit ? 'oui' : 'non']
      : [...common, ...place, rdvText(iv), frDateTime(iv.closedAt), iv.result ?? ''];
  });
  return { headers, rows };
}
