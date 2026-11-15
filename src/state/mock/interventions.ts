/**
 * Interventions SAV fictives – carte FleetIQ 10 (maquette SAV-v3 · Documentation-SAV-v3).
 *
 * - Graine propre (SAV_SEED) : le reste du jeu fictif (generate.ts) ne change pas.
 * - Point de départ : les signalements de la carte 05 (alertes Équipements + appels). Le type proposé est recalculé
 *   avec la règle S-11 : vendu non installé → Installation · installé sans donnée depuis plus de 7 j → Dépannage ·
 *   déconnecté depuis plus de 1 j → Contrôle · Remplacement jamais automatique.
 * - Par zone (= par technicien) : signalements à planifier, 1 en retard, une tournée du jour (5 rendez-vous),
 *   les prochains jours, 1 « à revoir », et un historique de clôtures (≈ 45 j) pour S-04 / S-05 / T-03.
 * - Un seul ticket ouvert par équipement (doc SAV, point 2 « sans doublon pour le même IMEI ouvert »).
 * - Aucun prix, aucune donnée de contrat. Adresses génériques « rue + ville », techniciens désignés par leur zone.
 * Toutes ces données sont « à confirmer back-end » (tables Intervention, Technician, TechnicianZone, InterventionCheck).
 */
import { addDays, daysBetween, parseDate, toIsoDate } from './dates';
import { Rng } from './rng';
import type {
  ClientProfile,
  FleetClient,
  FleetEquipment,
  Intervention,
  InterventionStatus,
  InterventionType,
  SavZone,
  Technician
} from './types';

/** Graine des interventions (MOCK_SEED + 10) – indépendante du reste du jeu. */
export const SAV_SEED = 20261124;

export const SAV_ZONE_LIST: SavZone[] = [
  { id: 'grand-tunis', name: 'Grand Tunis et Nord', cities: ['Tunis', 'Ariana', 'Ben Arous', 'Nabeul', 'Bizerte', 'Béja', 'Jendouba'] },
  { id: 'sahel', name: 'Sahel', cities: ['Sousse', 'Monastir', 'Mahdia', 'Kairouan'] },
  { id: 'sud', name: 'Sud', cities: ['Sfax', 'Gabès', 'Médenine', 'Tataouine', 'Gafsa', 'Tozeur'] }
];
/** Techniciens fictifs : désignés par leur zone, aucun nom de personne (carte 05). */
export const SAV_TECHNICIANS: Technician[] = [
  { id: 'tech-gt', name: 'Technicien Grand Tunis', zoneId: 'grand-tunis' },
  { id: 'tech-sahel', name: 'Technicien Sahel', zoneId: 'sahel' },
  { id: 'tech-sud', name: 'Technicien Sud', zoneId: 'sud' }
];
const TECH_BY_ZONE: Record<string, string> = Object.fromEntries(SAV_TECHNICIANS.map((t) => [t.zoneId, t.id]));

/** Heures de rendez-vous de la tournée (maquette). */
export const SAV_SLOTS = ['08:30', '10:00', '11:30', '14:00', '15:30'];

/** SAV-T-06 – contrôles sur place par type (Dépannage et Installation = maquette ; Contrôle et Remplacement = proposition). */
export const SAV_CHECKS: Record<InterventionType, string[]> = {
  Dépannage: [
    'Alimentation et fusible vérifiés',
    'Antenne GPS et GSM vérifiées',
    'SIM présente et active',
    'Test d’envoi : position reçue',
    'Photo après intervention'
  ],
  Contrôle: [
    'Alimentation et fusible vérifiés',
    'Antenne GPS et GSM vérifiées',
    'SIM présente et active',
    'Test d’envoi : position reçue',
    'Photo après intervention'
  ],
  Installation: [
    'Boîtier fixé et alimenté (+12/24 V, masse)',
    'Antenne GPS dégagée',
    'SIM insérée',
    'Premier envoi reçu sur la plateforme',
    'Photo de la pose'
  ],
  Remplacement: [
    'Ancien boîtier déposé',
    'Nouveau boîtier fixé et alimenté',
    'SIM transférée',
    'Test d’envoi : position reçue',
    'Photo après intervention'
  ]
};

/** Contrôle obligatoire pour clôturer « Terminée » (doc T-06 : test d’envoi ; pour une pose : premier envoi reçu). */
export const SAV_REQUIRED_CHECK: Record<InterventionType, string> = {
  Dépannage: 'Test d’envoi : position reçue',
  Contrôle: 'Test d’envoi : position reçue',
  Installation: 'Premier envoi reçu sur la plateforme',
  Remplacement: 'Test d’envoi : position reçue'
};

/** Résultats possibles (maquette) ; les deux derniers rendent l’intervention « À revoir ». */
export const SAV_RESULTS = [
  'Réparé (alimentation)',
  'Antenne GPS repositionnée',
  'Boîtier remplacé',
  'Installé et testé',
  'SIM remplacée',
  'Contrôle OK',
  'Client absent',
  'À revoir (pièce manquante)'
];
export const SAV_RESULTS_TO_REVIEW = ['Client absent', 'À revoir (pièce manquante)'];

const RESULTS_BY_TYPE: Record<InterventionType, string[]> = {
  Dépannage: ['Réparé (alimentation)', 'Antenne GPS repositionnée', 'SIM remplacée', 'Boîtier remplacé'],
  Contrôle: ['Contrôle OK', 'Antenne GPS repositionnée', 'Réparé (alimentation)'],
  Installation: ['Installé et testé'],
  Remplacement: ['Boîtier remplacé']
};

const STREETS = ['Zone industrielle', 'Dépôt central', 'Route de Tunis km 4', 'Avenue principale', 'Rue de la République', 'Parc logistique'];
const CALL_PROBLEMS = ['Appel client : positions irrégulières', 'Appel client : contrôle après choc', 'Appel client : alimentation coupée la nuit'];

type BuildInput = {
  signals: Intervention[];
  equipments: FleetEquipment[];
  clientByName: Map<string, FleetClient>;
  clientProfiles: Record<number, ClientProfile>;
  now: Date;
  today: Date;
};

type Cand = { eq: FleetEquipment; city: string; zoneId: string; typeAuto: InterventionType; source: Intervention['source'] };

const zoneOfCity = (city: string) => SAV_ZONE_LIST.find((z) => z.cities.includes(city))?.id ?? 'grand-tunis';

export function buildSavInterventions(input: BuildInput): Intervention[] {
  const { equipments, clientByName, now, today } = input;
  const rng = new Rng(SAV_SEED);
  const iso = (d: Date) => toIsoDate(d);
  const sinceComm = (e: FleetEquipment) => (e.lastCommunication ? daysBetween(new Date(e.lastCommunication), now) : null);
  const cityOf = (e: FleetEquipment) => clientByName.get(e.client)?.city ?? 'Tunis';
  const autoTypeOf = (e: FleetEquipment): InterventionType | null => {
    if (!e.isInstalled) return 'Installation';
    const d = sinceComm(e);
    if (d == null || d > 7) return 'Dépannage';
    if (d > 1) return 'Contrôle';
    return null;
  };
  const problemOf = (e: FleetEquipment, type: InterventionType, source: Intervention['source']) => {
    if (source === 'appel') return type === 'Remplacement' ? 'Boîtier défectueux à remplacer' : rng.pick(CALL_PROBLEMS);
    if (type === 'Installation') {
      const a = parseDate(e.assignedAt ?? e.contractDate);
      return `Vendu, en attente de pose depuis ${a ? Math.max(1, Math.floor(daysBetween(a, today))) : '?'} j`;
    }
    const d = sinceComm(e);
    if (d == null) return 'Aucune donnée reçue depuis la pose';
    return type === 'Contrôle' ? `Déconnecté depuis ${Math.floor(d)} j (alerte > 1 j)` : `Aucune donnée depuis ${Math.floor(d)} j`;
  };

  const sold = equipments.filter((e) => !e.client.endsWith('_Stock'));
  const usedOpen = new Set<string>();
  const out: Intervention[] = [];

  // Candidats ouverts : d'abord les signalements de la carte 05, puis le reste du parc de la zone (même règle).
  const fromSignals: Cand[] = [];
  for (const s of input.signals) {
    const eq = sold.find((e) => e.serial === s.serial);
    if (!eq) continue;
    const auto = s.source === 'alerte' ? autoTypeOf(eq) : null;
    const city = cityOf(eq);
    fromSignals.push({ eq, city, zoneId: zoneOfCity(city), typeAuto: auto ?? s.typeAuto, source: auto ? 'alerte' : 'appel' });
  }

  const push = (c: Cand, status: InterventionStatus, opts: {
    planned?: Date | null; time?: string | null; createdAt: Date; closedAt?: Date | null; result?: string | null;
    firstVisit?: boolean | null; assignedAt?: Date | null; type?: InterventionType; problem?: string; revisit?: boolean;
  }) => {
    const type = opts.type ?? c.typeAuto;
    const checks: Record<string, boolean> = {};
    if (status === 'Terminée') SAV_CHECKS[type].forEach((k) => (checks[k] = true));
    if (status === 'À revoir') SAV_CHECKS[type].slice(0, 2).forEach((k) => (checks[k] = true));
    out.push({
      id: '',
      type,
      typeAuto: c.typeAuto,
      status,
      technicianId: status === 'À planifier' ? null : TECH_BY_ZONE[c.zoneId],
      plannedDate: opts.planned ? iso(opts.planned) : null,
      plannedTime: opts.planned ? opts.time ?? rng.pick(SAV_SLOTS) : null,
      createdAt: opts.createdAt.toISOString(),
      closedAt: opts.closedAt ? opts.closedAt.toISOString() : null,
      result: opts.result ?? null,
      firstVisit: opts.firstVisit ?? null,
      serial: c.eq.serial,
      client: c.eq.client,
      reseller: c.eq.reseller,
      city: c.city,
      zoneId: c.zoneId,
      vehicle: c.eq.car && c.eq.car !== 'Unassigned' ? c.eq.car : '',
      source: c.source,
      address: `${rng.pick(STREETS)}, ${c.city}`,
      problem: opts.problem ?? problemOf(c.eq, c.typeAuto, c.source),
      typeChangedBy: type !== c.typeAuto ? 'responsable' : null,
      assignedAt: status === 'À planifier' ? null : (opts.assignedAt ?? opts.createdAt).toISOString(),
      checks,
      revisit: opts.revisit ?? false
    });
  };
  const at = (d: Date, time: string, plusHours = 0) => {
    const [h, m] = time.split(':').map(Number);
    const x = new Date(d);
    x.setHours(h, m, 0, 0);
    return new Date(x.getTime() + plusHours * 3600 * 1000);
  };
  const before = (d: Date, minDays: number, maxDays: number) => {
    const x = new Date(d.getTime() - rng.float(minDays, maxDays) * 24 * 3600 * 1000);
    return x > now ? new Date(now.getTime() - 3600 * 1000) : x;
  };

  for (const zone of SAV_ZONE_LIST) {
    const zoneSold = sold.filter((e) => zoneOfCity(cityOf(e)) === zone.id);
    const signals = fromSignals.filter((c) => c.zoneId === zone.id);
    /** prend un candidat ouvert du type voulu : signalement d'abord, sinon un équipement de la zone dans le bon état */
    const take = (wanted: InterventionType): Cand | null => {
      const i = signals.findIndex((c) => c.typeAuto === wanted && !usedOpen.has(c.eq.serial));
      if (i >= 0) {
        const c = signals[i];
        usedOpen.add(c.eq.serial);
        return c;
      }
      const pool = zoneSold.filter((e) => !usedOpen.has(e.serial) && (
        wanted === 'Remplacement' || (wanted === 'Contrôle' && e.isInstalled) ? e.isInstalled : autoTypeOf(e) === wanted));
      if (!pool.length) return null;
      const eq = rng.pick(pool);
      usedOpen.add(eq.serial);
      const auto = autoTypeOf(eq);
      const city = cityOf(eq);
      return wanted === auto
        ? { eq, city, zoneId: zone.id, typeAuto: wanted, source: 'alerte' }
        : { eq, city, zoneId: zone.id, typeAuto: wanted, source: 'appel' };
    };

    // 1. En retard (planifiée, date passée)
    const late = take('Dépannage');
    if (late) {
      const d = addDays(today, -rng.int(1, 2));
      push(late, 'Planifiée', { planned: d, time: rng.pick(SAV_SLOTS), createdAt: before(d, 2, 6) });
    }
    // 2. Tournée du jour : 1 terminée, 1 en cours, 3 planifiées (dont une pose)
    const todayTypes: InterventionType[] = ['Contrôle', 'Dépannage', 'Installation', 'Dépannage', 'Remplacement'];
    todayTypes.forEach((t, i) => {
      const c = take(t) ?? take('Dépannage');
      if (!c) return;
      const time = SAV_SLOTS[i];
      const created = before(today, 1, 8);
      // 2 rendez-vous du jour affectés depuis hier → « Nouvelle intervention » dans la cloche du technicien
      const assigned = i >= 3 ? new Date(now.getTime() - rng.float(2, 20) * 3600 * 1000) : created;
      if (i === 0) {
        const closed = at(today, time, 1);
        push(c, 'Terminée', { planned: today, time, createdAt: created, closedAt: closed > now ? now : closed, result: RESULTS_BY_TYPE[c.typeAuto][0], firstVisit: true });
      } else {
        push(c, i === 1 ? 'En cours' : 'Planifiée', { planned: today, time, createdAt: created < assigned ? created : assigned, assignedAt: assigned });
      }
    });
    // 3. Prochains jours
    const nextTypes: InterventionType[] = ['Installation', 'Remplacement', 'Dépannage', 'Installation', 'Contrôle', 'Dépannage'];
    nextTypes.forEach((t, i) => {
      const c = take(t) ?? take('Dépannage');
      if (!c) return;
      const d = addDays(today, 1 + Math.floor(i * 1.2));
      push(c, 'Planifiée', { planned: d, time: SAV_SLOTS[i % SAV_SLOTS.length], createdAt: before(today, 0.5, 6) });
    });
    // 4. À revoir (rendue par le technicien)
    const review = take('Dépannage') ?? take('Contrôle');
    if (review) {
      const d = addDays(today, -rng.int(1, 4));
      const time = rng.pick(SAV_SLOTS);
      push(review, 'À revoir', { planned: d, time, createdAt: before(d, 1, 5), result: rng.pick(SAV_RESULTS_TO_REVIEW), firstVisit: false });
    }
    // 5. À planifier : les signalements restants de la zone, puis des alertes du parc (jusqu'à 6), 1 type modifié (S-11)
    signals.filter((c) => !usedOpen.has(c.eq.serial)).forEach((c) => {
      usedOpen.add(c.eq.serial);
      push(c, 'À planifier', { createdAt: before(today, 0.2, 6) });
    });
    const toPlanTypes: InterventionType[] = ['Dépannage', 'Installation', 'Contrôle', 'Dépannage', 'Installation', 'Remplacement'];
    const already = out.filter((iv) => iv.zoneId === zone.id && iv.status === 'À planifier').length;
    toPlanTypes.slice(already).forEach((t) => {
      const c = take(t);
      if (c) push(c, 'À planifier', { createdAt: before(today, 0.2, 6) });
    });
    const changed = out.find((iv) => iv.zoneId === zone.id && iv.status === 'À planifier' && iv.typeAuto === 'Dépannage');
    if (changed) {
      changed.type = 'Remplacement';
      changed.typeChangedBy = 'responsable';
    }

    // 6. Historique : clôtures des 45 derniers jours (S-04, S-05, T-03)
    const healthy = zoneSold.filter((e) => e.isInstalled && (sinceComm(e) ?? 99) <= 1);
    const recentInstalls = zoneSold.filter((e) => {
      const d = parseDate(e.installDate);
      return e.isInstalled && d && daysBetween(d, today) >= 1 && daysBetween(d, today) <= 45;
    });
    for (let k = 0; k < 16 && healthy.length; k++) {
      let type = rng.weighted<InterventionType>([['Dépannage', 0.45], ['Contrôle', 0.2], ['Installation', 0.2], ['Remplacement', 0.15]]);
      let eq: FleetEquipment;
      let day: Date;
      const inst = type === 'Installation' ? recentInstalls.shift() : undefined;
      if (inst) {
        eq = inst;
        day = parseDate(inst.installDate) ?? addDays(today, -rng.int(1, 40));
      } else {
        if (type === 'Installation') type = 'Dépannage';
        eq = rng.pick(healthy);
        day = addDays(today, -rng.int(1, 44));
      }
      const time = rng.pick(SAV_SLOTS);
      const closed = at(day, time, 1);
      const source: Intervention['source'] = type === 'Remplacement' || (type === 'Contrôle' && rng.chance(0.5)) ? 'appel' : 'alerte';
      const first = rng.chance(0.86);
      const problem = source === 'appel'
        ? type === 'Remplacement' ? 'Boîtier défectueux à remplacer' : rng.pick(CALL_PROBLEMS)
        : type === 'Installation' ? `Vendu, en attente de pose depuis ${rng.int(5, 35)} j`
          : type === 'Contrôle' ? `Déconnecté depuis ${rng.int(2, 6)} j (alerte > 1 j)` : `Aucune donnée depuis ${rng.int(8, 50)} j`;
      const city = cityOf(eq);
      push({ eq, city, zoneId: zone.id, typeAuto: type, source }, 'Terminée', {
        planned: day,
        time,
        createdAt: new Date(closed.getTime() - rng.float(0.6, 6.5) * 24 * 3600 * 1000),
        closedAt: closed,
        result: rng.pick(RESULTS_BY_TYPE[type]),
        firstVisit: first,
        revisit: !first,
        problem
      });
    }
  }

  // Numéros INT-AA-NNNN dans l'ordre des signalements
  out.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const yy = String(today.getFullYear()).slice(-2);
  out.forEach((iv, i) => (iv.id = `INT-${yy}-${String(i + 101).padStart(4, '0')}`));
  return out;
}
