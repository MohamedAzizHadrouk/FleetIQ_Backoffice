/**
 * Jeu de données fictif UNIQUE du back-office – carte FleetIQ 05, étape A (prérequis des cartes 05 à 10).
 *
 * - 4 réseaux : Tunav (clients directs), MyCom, FleetPro Sfax, NavSud (décision 2026-11-14, analyse § 7-7).
 * - Types d'équipements : liste EquipmentType du back-office.
 * - Génération déterministe : graine fixe MOCK_SEED ; les dates sont calculées par rapport au jour d'ouverture
 *   (mêmes chiffres toute la journée, les âges « dernière communication » restent réalistes d'un jour à l'autre).
 * - Toutes les données sont fictives (noms de sociétés génériques « activité + ville », domaines .example,
 *   techniciens désignés par leur zone). Aucun prix n'est ajouté.
 * - Champs nouveaux = « à confirmer back-end » (voir types.ts).
 */
import { Rng } from './rng';
import { buildSavInterventions, SAV_TECHNICIANS, SAV_ZONE_LIST } from './interventions';
import { addDays, daysBetween, parseDate, startOfDay, toDateLocal, toIsoDate, toIsoMonth } from './dates';
import {
  HAND_CLIENTS,
  HAND_CLIENT_PROFILES,
  HAND_EQUIPMENTS,
  HAND_PACKS,
  HAND_SIM_CARDS,
  HAND_SIM_OFFERS
} from './handData';
import {
  EQUIPMENT_TYPES,
  type ClientPackAssignment,
  type ClientProfile,
  type DashboardSettings,
  type FleetClient,
  type FleetEquipment,
  type Intervention,
  type InterventionStatus,
  type InterventionType,
  type KpiSnapshot,
  type KpiSnapshotKey,
  type OfferChange,
  type Pack,
  type SavZone,
  type SimCard,
  type SimConsumption,
  type SimOffer,
  type Technician,
  type UserConnection,
  type Vehicle
} from './types';

/** Graine fixe de la génération (même jeu à chaque ouverture). */
export const MOCK_SEED = 20261114;

/** Les 4 réseaux du jeu de données (Tunav = clients directs). */
export const RESELLERS = ['Tunav', 'MyCom', 'FleetPro Sfax', 'NavSud'] as const;

export const DEFAULT_DASHBOARD_SETTINGS: DashboardSettings = {
  // TDB-D-01…D-04 : objectifs = propositions de la maquette, à valider par la Direction
  goals: { clientsActifs: 95, installes: 90, connectes: 85, pucesInstallees: 85 },
  graceDays: 30,
  alertDays: 1,
  renewDays: 60,
  critDays: 10
};

/* ------------------------------------------------------------------ référentiels fictifs */

type NetworkProfile = {
  name: (typeof RESELLERS)[number];
  /** probabilité qu'un équipement vendu soit installé */
  install: number;
  /** probabilité qu'un équipement installé soit connecté (≤ 7 j) */
  health: number;
  newClients: number;
  cities: string[];
  stockEquipments: number;
  stockSims: number;
};

const NETWORK: NetworkProfile[] = [
  { name: 'Tunav', install: 0.88, health: 0.88, newClients: 16, cities: ['Tunis', 'Ariana', 'Ben Arous', 'Sousse', 'Nabeul'], stockEquipments: 30, stockSims: 18 },
  { name: 'MyCom', install: 0.8, health: 0.58, newClients: 13, cities: ['Tunis', 'Bizerte', 'Béja', 'Jendouba'], stockEquipments: 3, stockSims: 3 },
  { name: 'FleetPro Sfax', install: 0.85, health: 0.8, newClients: 11, cities: ['Sfax', 'Mahdia', 'Monastir'], stockEquipments: 3, stockSims: 3 },
  { name: 'NavSud', install: 0.72, health: 0.7, newClients: 10, cities: ['Gabès', 'Médenine', 'Tataouine', 'Gafsa', 'Tozeur'], stockEquipments: 3, stockSims: 3 }
];

/** Zones et techniciens SAV fictifs (définis avec les interventions, carte 10). */
export const SAV_ZONES: SavZone[] = SAV_ZONE_LIST;
export const TECHNICIANS: Technician[] = SAV_TECHNICIANS;

const CITY_COORDS: Record<string, [number, number]> = {
  Tunis: [36.8065, 10.1815], Ariana: [36.8625, 10.1956], 'Ben Arous': [36.7531, 10.2189], Nabeul: [36.4561, 10.7376],
  Bizerte: [37.2744, 9.8739], Béja: [36.7256, 9.1817], Jendouba: [36.5011, 8.7802], Sousse: [35.8256, 10.6084],
  Monastir: [35.7643, 10.8113], Mahdia: [35.5047, 11.0622], Kairouan: [35.6781, 10.0963], Sfax: [34.7406, 10.7603],
  Gabès: [33.8815, 10.0982], Médenine: [33.3549, 10.5055], Tataouine: [32.9297, 10.4518], Gafsa: [34.425, 8.7842],
  Tozeur: [33.9197, 8.1335]
};

const HAND_CLIENT_CITY: Record<number, string> = {
  1: 'Tunis', 2: 'Tunis', 3: 'Bizerte', 5: 'Tunis', 6: 'Tunis', 7: 'Sfax', 8: 'Ariana', 9: 'Béja', 11: 'Gabès'
};

const ACTIVITIES = ['Transport', 'Logistique', 'Livraison', 'Cargo', 'Navette', 'Distribution', 'Froid', 'Citerne', 'BTP', 'Agri', 'Location', 'Express', 'Fret', 'Taxi'];
const HW_MODELS = ['FMB120', 'FMC130', 'FMB920'];
/** Ordre des packs pour qualifier un changement d'offre (montée / descente). */
const PACK_RANK: Record<number, number> = { 2: 1, 1: 2, 3: 3, 4: 4 };

function slug(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function packIdByName(abonnement?: string): number | null {
  switch (abonnement) {
    case 'FleetIQ Pro':
      return 1;
    case 'FleetIQ Secure':
      return 2;
    case 'FleetIQ Mechanics':
    case 'FleetIQ Mechanic':
      return 3;
    case 'FleetIQ Vision':
      return 4;
    default:
      return null;
  }
}

function makeAssignment(pack: Pack | undefined, packId: number, assignedAt: string, expiresAt: string): ClientPackAssignment {
  const supported = pack?.supportedEquipments ?? [];
  return {
    packId,
    vehicleLimit: pack?.vehicleLimit ?? 0,
    equipmentLimits: supported.reduce<ClientPackAssignment['equipmentLimits']>((acc, t) => {
      acc[t] = 0;
      return acc;
    }, {}),
    assignedAt,
    expiresAt
  };
}

/* ------------------------------------------------------------------ résultat */

export type MockData = {
  today: Date;
  packs: Pack[];
  clients: FleetClient[];
  clientProfiles: Record<number, ClientProfile>;
  equipments: FleetEquipment[];
  simOffers: SimOffer[];
  simCards: SimCard[];
  simConsumption: SimConsumption[];
  userConnections: UserConnection[];
  offerChanges: OfferChange[];
  vehicles: Vehicle[];
  zones: SavZone[];
  technicians: Technician[];
  interventions: Intervention[];
  kpiSnapshots: KpiSnapshot[];
};

export function buildMockData(now: Date = new Date()): MockData {
  const rng = new Rng(MOCK_SEED);
  const today = startOfDay(now);
  const iso = (d: Date) => toIsoDate(d);
  const daysAgo = (n: number) => addDays(today, -n);
  const packs: Pack[] = HAND_PACKS.map((p) => ({ ...p, isActive: true }));
  const packById = new Map(packs.map((p) => [p.id, p]));
  const networkByName = new Map(NETWORK.map((n) => [n.name as string, n]));

  /* ---------------- clients ---------------- */
  const clients: FleetClient[] = [];
  const clientProfiles: Record<number, ClientProfile> = { ...HAND_CLIENT_PROFILES };
  const offerChanges: OfferChange[] = [];

  const pickExpiry = (): { expiry: string; status: FleetClient['status']; blockReason: FleetClient['blockReason'] } => {
    const r = rng.next();
    if (r < 0.07) return { expiry: iso(daysAgo(rng.int(1, 29))), status: 'Active', blockReason: null }; // bloqué dans ≤ 30 j
    if (r < 0.12) return { expiry: iso(daysAgo(rng.int(31, 200))), status: 'Blocked', blockReason: 'expiré' };
    if (r < 0.14) return { expiry: iso(addDays(today, rng.int(40, 300))), status: 'Blocked', blockReason: 'paiement' };
    if (r < 0.2) return { expiry: iso(addDays(today, rng.int(0, 10))), status: 'Active', blockReason: null };
    if (r < 0.3) return { expiry: iso(addDays(today, rng.int(11, 30))), status: 'Active', blockReason: null };
    if (r < 0.42) return { expiry: iso(addDays(today, rng.int(31, 60))), status: 'Active', blockReason: null };
    return { expiry: iso(addDays(today, rng.int(61, 420))), status: 'Active', blockReason: null };
  };

  /** Affectation de pack + historique d'offre (dates d'affectation à confirmer back-end). */
  const assignPack = (clientId: number, packId: number, createdAt: Date, expiry: string): ClientPackAssignment => {
    const pack = packById.get(packId);
    let assignedAt = createdAt;
    if (rng.chance(0.12)) {
      assignedAt = daysAgo(rng.int(1, 29)); // vendu sur les 30 derniers jours (TDB-D-05)
    } else if (rng.chance(0.25) && daysBetween(createdAt, today) > 60) {
      // changement d'offre dans l'année
      const from = rng.pick([1, 2, 3, 4].filter((id) => id !== packId));
      const changeAt = addDays(createdAt, rng.int(20, Math.max(21, Math.floor(daysBetween(createdAt, today)) - 1)));
      offerChanges.push({ clientId, date: iso(createdAt), fromPackId: null, toPackId: from, direction: 'nouveau' });
      offerChanges.push({
        clientId,
        date: iso(changeAt),
        fromPackId: from,
        toPackId: packId,
        direction: PACK_RANK[packId] > PACK_RANK[from] ? 'montée' : 'descente'
      });
      return makeAssignment(pack, packId, iso(changeAt), expiry);
    }
    offerChanges.push({ clientId, date: iso(assignedAt), fromPackId: null, toPackId: packId, direction: 'nouveau' });
    return makeAssignment(pack, packId, iso(assignedAt), expiry);
  };

  // 1. clients saisis à la main (valeurs conservées, champs nouveaux complétés)
  for (const c of HAND_CLIENTS) {
    const packId = packIdByName(c.abonnement);
    const createdAt = daysAgo(rng.int(200, 900));
    clients.push({
      id: c.id,
      name: c.name,
      type: c.type,
      reseller: c.reseller,
      email: c.email,
      tel: c.tel,
      expiry: c.expiry,
      status: c.status,
      vehicleLimit: c.vehicleLimit < 0 ? null : c.vehicleLimit,
      packs: packId ? [assignPack(c.id, packId, createdAt, c.expiry)] : [],
      createdAt: iso(createdAt),
      city: HAND_CLIENT_CITY[c.id] ?? 'Tunis',
      blockReason: c.status === 'Blocked' ? 'expiré' : null,
      accountsUsed: c.vehicleLimit < 0 ? 4 : rng.int(1, 4)
    });
  }

  // 2. revendeurs ajoutés (4 réseaux)
  const extraResellers: Array<{ id: number; name: string; city: string; packId: number }> = [
    { id: 20, name: 'FleetPro Sfax', city: 'Sfax', packId: 1 },
    { id: 21, name: 'NavSud', city: 'Gabès', packId: 2 }
  ];
  for (const r of extraResellers) {
    const createdAt = daysAgo(rng.int(400, 800));
    const expiry = iso(addDays(today, rng.int(120, 400)));
    clients.push({
      id: r.id,
      name: r.name,
      type: 'Revendeur',
      reseller: 'Tunav',
      email: `contact@${slug(r.name)}.example`,
      tel: `+216 0${rng.int(0, 9)} 000 ${String(r.id).padStart(3, '0')}`,
      expiry,
      status: 'Active',
      vehicleLimit: null,
      packs: [assignPack(r.id, r.packId, createdAt, expiry)],
      createdAt: iso(createdAt),
      city: r.city,
      blockReason: null,
      accountsUsed: rng.int(2, 6)
    });
    clientProfiles[r.id] = {
      website: `www.${slug(r.name)}.example`,
      formula: 'Enterprise',
      abonnement: packById.get(r.packId)?.name ?? '',
      timezone: 'UTC+1',
      address: `Zone industrielle, ${r.city}`,
      tel2: '',
      email2: '',
      accountLimit: 25,
      username: `${slug(r.name)}_admin`
    };
  }

  // 3. clients générés par réseau
  const usedNames = new Set(clients.map((c) => c.name));
  let nextClientId = 100;
  const generatedClientIds = new Set<number>();
  for (const net of NETWORK) {
    for (let i = 0; i < net.newClients; i++) {
      let name = '';
      for (let tries = 0; tries < 40 && (!name || usedNames.has(name)); tries++) {
        name = `${rng.pick(ACTIVITIES)} ${rng.pick(net.cities)}`;
      }
      if (usedNames.has(name)) name = `${name} ${i + 2}`;
      usedNames.add(name);
      const id = nextClientId++;
      generatedClientIds.add(id);
      const createdAt = daysAgo(rng.int(15, 900));
      const { expiry, status, blockReason } = pickExpiry();
      const packId = rng.weighted([
        [1, 0.35],
        [2, 0.25],
        [3, 0.22],
        [4, 0.18]
      ] as const);
      const city = rng.pick(net.cities);
      const accountLimit = rng.pick([3, 5, 6, 8, 10]);
      clients.push({
        id,
        name,
        type: 'Simple',
        reseller: net.name,
        email: `contact@${slug(name)}.example`,
        tel: `+216 0${rng.int(0, 9)} ${rng.int(100, 999)} ${String(id).padStart(3, '0')}`,
        expiry,
        status,
        vehicleLimit: rng.chance(0.15) ? null : rng.pick([10, 20, 30, 50]),
        packs: rng.chance(0.04) ? [] : [assignPack(id, packId, createdAt, expiry)],
        createdAt: iso(createdAt),
        city,
        blockReason,
        accountsUsed: rng.int(1, accountLimit)
      });
      clientProfiles[id] = {
        website: `www.${slug(name)}.example`,
        formula: rng.pick(['Standard', 'Premium']),
        abonnement: packById.get(packId)?.name ?? '',
        timezone: 'UTC+1',
        address: `Avenue principale, ${city}`,
        tel2: '',
        email2: '',
        accountLimit,
        username: `${slug(name).replace(/-/g, '_')}_admin`
      };
    }
  }

  // 4. clients « stock » (Tunav_Stock, <Revendeur>_Stock) – exclus de tous les KPI
  const resellerClients = clients.filter((c) => c.type === 'Revendeur');
  const stockClients: FleetClient[] = resellerClients.map((r) => ({
    id: 10000 + r.id,
    name: `${r.name}_Stock`,
    type: 'Simple',
    reseller: r.name,
    email: '-',
    tel: '-',
    expiry: '2030-12-31',
    status: 'Active',
    vehicleLimit: null,
    packs: []
  }));
  const tunavStock: FleetClient = {
    id: 9999,
    name: 'Tunav_Stock',
    type: 'Simple',
    reseller: 'Tunav',
    email: '-',
    tel: '-',
    expiry: '2030-12-31',
    status: 'Active',
    vehicleLimit: null,
    packs: []
  };
  // FleetIQ 06 : date de blocage (D-03, K-03) – calculée sans tirage aléatoire (les autres chiffres ne bougent pas).
  // Expiré : expiration + délai de grâce (30 j) ; paiement : date fixe dérivée de l'id ; jamais avant la création.
  for (const c of clients) {
    if (c.status !== 'Blocked') {
      c.blockedAt = null;
      continue;
    }
    const exp = parseDate(c.expiry);
    const created = parseDate(c.createdAt) ?? daysAgo(400);
    let at = c.blockReason === 'expiré' && exp ? addDays(exp, DEFAULT_DASHBOARD_SETTINGS.graceDays) : daysAgo(((c.id * 37) % 150) + 1);
    if (at > today) at = daysAgo((c.id % 20) + 1);
    if (at < created) at = created;
    c.blockedAt = iso(at);
  }
  const allClients = [tunavStock, ...stockClients, ...clients];
  const clientByName = new Map(allClients.map((c) => [c.name, c]));

  /* ---------------- équipements ---------------- */
  /** Dernière communication selon la « santé » du réseau (à confirmer back-end). */
  const pickLastCommunication = (health: number): Date => {
    if (rng.chance(health)) {
      const hours = rng.chance(0.85) ? rng.float(0.05, 23.5) : rng.float(25, 166); // ≤ 1 j, ou 1–7 j (alerte A-23)
      return new Date(now.getTime() - hours * 3600 * 1000);
    }
    const days = rng.chance(0.5) ? rng.float(7.5, 30) : rng.float(31, 150);
    return new Date(now.getTime() - days * 24 * 3600 * 1000);
  };
  const daysConnectedFor = (last: Date | null): number => {
    if (!last) return 0;
    const since = daysBetween(last, now);
    if (since <= 7) return rng.int(22, 30);
    return Math.max(0, Math.round((30 - since) * rng.float(0.4, 0.9)));
  };

  const equipments: FleetEquipment[] = [];
  // 4a. équipements saisis à la main
  for (const e of HAND_EQUIPMENTS) {
    const net = networkByName.get(e.reseller) ?? NETWORK[0];
    const last = e.isInstalled ? pickLastCommunication(net.health) : null;
    equipments.push({
      ...e,
      assignedAt: e.client.endsWith('_Stock') ? null : e.contractDate || null,
      installDate: e.isInstalled ? e.firstSendDate || null : null,
      lastCommunication: last ? last.toISOString() : null,
      daysConnected30: daysConnectedFor(last)
    });
  }

  // 4b. équipements générés pour les clients générés + flottes des revendeurs ajoutés
  let nextEqId = 2000;
  let iccidCounter = 1;
  const newIccid = () => `8921605${String(iccidCounter++).padStart(13, '0')}`;
  const newPhone = () => `+216 2${rng.int(0, 9)} ${rng.int(100, 999)} ${rng.int(100, 999)}`;
  const serverFor = (city: string) =>
    SAV_ZONES.find((z) => z.cities.includes(city))?.id === 'sud' ? 'Srv-Sfax-1' : 'Srv-Tunis-1';

  const makeEquipment = (client: FleetClient, net: NetworkProfile): FleetEquipment => {
    const id = nextEqId++;
    const packId = client.packs[0]?.packId;
    const pack = packId ? packById.get(packId) : undefined;
    const equipmentType = pack ? rng.pick(pack.supportedEquipments) : rng.pick(EQUIPMENT_TYPES);
    const created = parseDate(client.createdAt) ?? daysAgo(365);
    const span = Math.max(1, Math.floor(daysBetween(created, today)));
    const assignedAt = addDays(created, rng.int(0, span));
    const recent = daysBetween(assignedAt, today) < 4;
    const installed = rng.chance(recent ? 0.3 : net.install);
    const installDate = installed ? addDays(assignedAt, Math.min(rng.int(1, 20), Math.max(0, span - 1))) : null;
    const last = installed ? pickLastCommunication(net.health) : null;
    const city = client.city ?? net.cities[0];
    return {
      id,
      serial: `EQ-${assignedAt.getFullYear()}-${String(id).padStart(4, '0')}`,
      equipmentType,
      supportsCan: equipmentType.includes('CAN'),
      packId,
      type: rng.pick(HW_MODELS),
      sim: '',
      simCallNumber: '',
      iccid: '',
      server: serverFor(city),
      port: rng.pick(['5027', '5028']),
      client: client.name,
      reseller: client.reseller,
      car: installed ? `${rng.int(100, 250)} TU ${rng.int(1000, 9999)}` : 'Unassigned',
      isInstalled: installed,
      firstSendDate: installDate ? iso(installDate) : '',
      contractDate: iso(assignedAt),
      lastPosition: null,
      assignedAt: iso(assignedAt),
      installDate: installDate ? iso(installDate) : null,
      lastCommunication: last ? last.toISOString() : null,
      daysConnected30: daysConnectedFor(last)
    };
  };

  const fleetOwners = allClients.filter(
    (c) => generatedClientIds.has(c.id) || extraResellers.some((r) => r.id === c.id)
  );
  for (const client of fleetOwners) {
    const net = networkByName.get(client.reseller === 'Tunav' && client.type === 'Revendeur' ? client.name : client.reseller) ?? NETWORK[0];
    const count = 1 + Math.floor(Math.pow(rng.next(), 1.6) * 11);
    for (let i = 0; i < count; i++) {
      const eq = makeEquipment(client, net);
      if (client.type === 'Revendeur') eq.reseller = client.name; // flotte propre du revendeur
      eq.iccid = newIccid();
      eq.sim = newPhone();
      eq.simCallNumber = eq.sim.replace(/\D/g, '').slice(3);
      equipments.push(eq);
    }
  }

  // 4c. stock (Tunav et revendeurs)
  for (const net of NETWORK) {
    const stockName = `${net.name}_Stock`;
    for (let i = 0; i < net.stockEquipments; i++) {
      const id = nextEqId++;
      const bought = daysAgo(rng.int(5, 240));
      const withSim = rng.chance(0.5);
      const sim = withSim ? newPhone() : '';
      equipments.push({
        id,
        serial: `STK-${bought.getFullYear()}-${String(id).padStart(4, '0')}`,
        equipmentType: rng.pick(EQUIPMENT_TYPES),
        type: rng.pick(HW_MODELS),
        sim,
        simCallNumber: sim ? sim.replace(/\D/g, '').slice(3) : '',
        iccid: withSim ? newIccid() : '',
        server: 'Srv-Tunis-1',
        port: '5027',
        client: stockName,
        reseller: net.name,
        car: 'Unassigned',
        isInstalled: false,
        firstSendDate: '',
        contractDate: iso(bought),
        lastPosition: null,
        assignedAt: null,
        installDate: null,
        lastCommunication: null,
        daysConnected30: 0
      });
    }
  }

  // 4d. dernière position cohérente avec la dernière communication (lue par Gestion Clients / Équipements)
  for (const e of equipments) {
    if (!e.isInstalled || !e.lastCommunication) continue;
    const last = new Date(e.lastCommunication);
    const connected = daysBetween(last, now) <= 7;
    const client = clientByName.get(e.client);
    const [lat, lng] = CITY_COORDS[client?.city ?? 'Tunis'] ?? CITY_COORDS.Tunis;
    e.lastPosition = {
      ...(e.lastPosition ?? {
        latitude: +(lat + rng.float(-0.05, 0.05)).toFixed(4),
        longitude: +(lng + rng.float(-0.05, 0.05)).toFixed(4),
        vitesse: connected ? rng.int(0, 90) : 0,
        niveauCarburant: rng.int(10, 95),
        totalCarburant: +rng.float(500, 9000).toFixed(2),
        rpm: connected ? rng.int(0, 2400) : 0,
        temperatureMoteur: rng.int(20, 95),
        kilometrage: +rng.float(5000, 180000).toFixed(1)
      }),
      dateLocal: toDateLocal(last),
      etat: connected ? 'Connectée' : 'Déconnectée'
    };
  }

  /* ---------------- puces ---------------- */
  const simOffers: SimOffer[] = HAND_SIM_OFFERS.map((o) => ({ ...o }));
  const simCards: SimCard[] = HAND_SIM_CARDS.map((s) => ({ ...s }));
  let nextSimId = 100;
  const simByIccid = new Set(simCards.map((s) => s.iccid));
  const simByEquipment = new Set(simCards.filter((s) => s.equipmentId != null).map((s) => s.equipmentId));
  const pickOffer = () => rng.weighted([[1, 0.45], [2, 0.4], [3, 0.15]] as const);
  for (const e of equipments) {
    if (!e.iccid || simByIccid.has(e.iccid) || simByEquipment.has(e.id)) continue;
    simCards.push({
      id: nextSimId++,
      offerId: pickOffer(),
      phoneNumber: e.sim || '',
      iccid: e.iccid,
      client: e.client,
      reseller: e.reseller,
      equipmentId: e.id
    });
    simByIccid.add(e.iccid);
  }
  for (const net of NETWORK) {
    for (let i = 0; i < net.stockSims; i++) {
      simCards.push({
        id: nextSimId++,
        offerId: pickOffer(),
        phoneNumber: rng.chance(0.6) ? newPhone() : '',
        iccid: newIccid(),
        client: `${net.name}_Stock`,
        reseller: net.name
      });
    }
  }
  const equipmentById = new Map(equipments.map((e) => [e.id, e]));
  for (const s of simCards) {
    const eq = s.equipmentId != null ? equipmentById.get(s.equipmentId) : undefined;
    const activation = parseDate(eq?.assignedAt ?? eq?.contractDate) ?? daysAgo(rng.int(10, 300));
    s.activationDate = iso(activation);
    s.expirationDate = iso(addDays(activation, 365 * (1 + Math.floor(daysBetween(activation, today) / 365))));
  }

  // consommation mensuelle : 12 mois complets + mois en cours (à confirmer back-end)
  const simConsumption: SimConsumption[] = [];
  const offerById = new Map(simOffers.map((o) => [o.id, o]));
  const months: string[] = [];
  for (let k = 12; k >= 0; k--) months.push(toIsoMonth(new Date(today.getFullYear(), today.getMonth() - k, 1)));
  for (const s of simCards) {
    const eq = s.equipmentId != null ? equipmentById.get(s.equipmentId) : undefined;
    const quota = (s.offerId != null ? offerById.get(s.offerId)?.dataQuotaMB : null) ?? null;
    const active = !!eq?.isInstalled;
    const heavy = active && quota != null && rng.chance(0.05); // gros consommateur → surconsommation fréquente
    const activation = s.activationDate ?? '';
    months.forEach((m, idx) => {
      if (activation && m < activation.slice(0, 7)) return;
      const partial = idx === months.length - 1 ? Math.min(1, today.getDate() / 30) : 1;
      let used: number;
      if (!active) used = rng.float(0, 20);
      else if (quota == null) used = rng.float(2000, 15000);
      else {
        const over = heavy ? rng.chance(0.7) : rng.chance(0.025);
        used = quota * (over ? rng.float(1.05, 1.8) : rng.float(0.2, 0.95));
      }
      simConsumption.push({ simId: s.id, month: m, usedMB: Math.round(used * partial) });
    });
  }
  // FleetIQ 09 : une puce dont l'équipement installé n'envoie plus rien ne consomme plus de data (« puce muette »,
  // PU-P-04) : consommation à 0 après la dernière communication, au prorata le mois de la dernière communication.
  // Calcul déterministe (aucun tirage aléatoire : le reste du jeu fictif ne change pas).
  const simOfId = new Map(simCards.map((s) => [s.id, s]));
  for (const c of simConsumption) {
    const s = simOfId.get(c.simId);
    const eq = s?.equipmentId != null ? equipmentById.get(s.equipmentId) : undefined;
    if (!eq?.isInstalled) continue;
    const last = eq.lastCommunication ? new Date(eq.lastCommunication) : null;
    const lastMonth = last ? toIsoMonth(last) : '';
    if (!last || c.month > lastMonth) c.usedMB = 0;
    else if (c.month === lastMonth) {
      const daysInMonth = new Date(last.getFullYear(), last.getMonth() + 1, 0).getDate();
      const isCurrent = c.month === toIsoMonth(today);
      const share = isCurrent ? last.getDate() / Math.max(1, today.getDate()) : last.getDate() / daysInMonth;
      c.usedMB = Math.round(c.usedMB * Math.min(1, share));
    }
  }

  /* ---------------- journal des connexions utilisateurs (à confirmer back-end) ---------------- */
  const userConnections: UserConnection[] = [];
  for (const c of clients) {
    if (c.name === 'Tunav') continue;
    const users = Math.max(1, Math.min(c.accountsUsed ?? 1, 4));
    const expired = c.status === 'Blocked';
    const inactive = expired || rng.chance(0.2);
    const created = parseDate(c.createdAt) ?? daysAgo(365);
    for (let u = 1; u <= users; u++) {
      let d = inactive ? daysAgo(rng.int(31, 200)) : new Date(now.getTime() - rng.float(0.1, 6) * 24 * 3600 * 1000);
      const limit = Math.min(365, daysBetween(created, today));
      while (daysBetween(d, now) <= limit) {
        d.setHours(rng.int(7, 19), rng.int(0, 59), 0, 0);
        userConnections.push({
          clientId: c.id,
          userId: `u${c.id}-${u}`,
          date: d.toISOString(),
          channel: rng.chance(0.62) ? 'PC' : 'Mobile'
        });
        d = addDays(d, -(inactive ? rng.int(5, 25) : rng.int(1, 9)));
      }
    }
  }

  /* ---------------- véhicules (fenêtre « Véhicules » de Gestion Clients) ---------------- */
  const vehicles: Vehicle[] = [];
  let nextVehicleId = 101;
  for (const e of equipments) {
    if (e.client.endsWith('_Stock') || e.car === 'Unassigned') continue;
    const client = clientByName.get(e.client);
    if (!client) continue;
    vehicles.push({
      id: nextVehicleId++,
      clientId: client.id,
      plate: e.car,
      equipment: e.serial,
      isInstalled: e.isInstalled,
      expiry: client.expiry
    });
  }

  /* ---------------- interventions SAV (fictives, carte 10) ---------------- */
  // Signalements de base (carte 05) : leurs tirages restent ici pour ne pas décaler la suite de la graine (instantanés KPI).
  // La carte 10 en tire le jeu final (statuts, tournées, historique, adresses, problèmes) avec sa propre graine.
  const alertSignals: Intervention[] = [];
  const zoneOf = (city: string) => SAV_ZONES.find((z) => z.cities.includes(city))?.id ?? 'grand-tunis';
  const techOf = (zoneId: string) => TECHNICIANS.find((t) => t.zoneId === zoneId)?.id ?? null;
  const sold = equipments.filter((e) => !e.client.endsWith('_Stock'));
  const disconnected1d = sold.filter((e) => {
    if (!e.isInstalled || !e.lastCommunication) return false;
    const d = daysBetween(new Date(e.lastCommunication), now);
    return d > 1 && d <= 30;
  });
  const pendingInstall = sold.filter(
    (e) => !e.isInstalled && e.assignedAt && daysBetween(parseDate(e.assignedAt) ?? today, today) > 30
  );
  const others = sold.filter((e) => e.isInstalled);
  const statuses: InterventionStatus[] = ['À planifier', 'Planifiée', 'En cours', 'Terminée', 'À revoir'];
  const pushIntervention = (e: FleetEquipment, typeAuto: InterventionType, source: Intervention['source']) => {
    const client = clientByName.get(e.client);
    const city = client?.city ?? 'Tunis';
    const zoneId = zoneOf(city);
    const status = rng.weighted(statuses.map((s, i) => [s, [0.25, 0.3, 0.1, 0.3, 0.05][i]] as const));
    const createdAt = new Date(now.getTime() - rng.float(0.5, 20) * 24 * 3600 * 1000);
    const planned =
      status === 'À planifier'
        ? null
        : status === 'Terminée' || status === 'À revoir'
          ? addDays(today, -rng.int(1, 15))
          : status === 'En cours'
            ? today
            : addDays(today, rng.int(-3, 6)); // une date passée = en retard
    const closed = status === 'Terminée' && planned ? new Date(planned.getTime() + rng.int(9, 17) * 3600 * 1000) : null;
    alertSignals.push({
      id: `IV-${String(alertSignals.length + 1).padStart(4, '0')}`,
      type: typeAuto,
      typeAuto,
      status,
      technicianId: status === 'À planifier' ? null : techOf(zoneId),
      plannedDate: planned ? iso(planned) : null,
      plannedTime: planned ? `${String(rng.int(8, 16)).padStart(2, '0')}:${rng.pick(['00', '30'])}` : null,
      createdAt: createdAt.toISOString(),
      closedAt: closed ? closed.toISOString() : null,
      result: status === 'Terminée' ? 'Résolu' : status === 'À revoir' ? 'Pièce manquante' : null,
      firstVisit: status === 'Terminée' ? rng.chance(0.82) : status === 'À revoir' ? false : null,
      serial: e.serial,
      client: e.client,
      reseller: e.reseller,
      city,
      zoneId,
      vehicle: e.car,
      source
    });
  };
  disconnected1d.slice(0, 14).forEach((e) => pushIntervention(e, 'Dépannage', 'alerte'));
  pendingInstall.slice(0, 8).forEach((e) => pushIntervention(e, 'Installation', 'alerte'));
  for (let i = 0; i < 6 && others.length; i++) pushIntervention(rng.pick(others), 'Contrôle', 'appel');
  for (let i = 0; i < 3 && others.length; i++) pushIntervention(rng.pick(others), 'Remplacement', 'appel');
  const interventions = buildSavInterventions({ signals: alertSignals, equipments, clientByName, clientProfiles, now, today });

  /* ---------------- instantanés mensuels des KPI (« Comparer », à confirmer back-end) ---------------- */
  const kpiSnapshots: KpiSnapshot[] = [];
  const scopes: Array<{ scope: string; base: Record<KpiSnapshotKey, number> }> = [
    { scope: 'network', base: { clientsActifs: 91, installes: 84, connectes: 77, pucesInstallees: 74, packsVendus30: 6, echeances30: 9 } },
    ...NETWORK.map((n) => ({
      scope: n.name as string,
      base: {
        clientsActifs: rng.int(86, 95),
        installes: Math.round(n.install * 100) - 2,
        connectes: Math.round(n.health * 100) - 3,
        pucesInstallees: Math.round(n.install * 90),
        packsVendus30: rng.int(1, 3),
        echeances30: rng.int(1, 5)
      }
    }))
  ];
  const offsets = [30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360, 365];
  for (const { scope, base } of scopes) {
    (Object.keys(base) as KpiSnapshotKey[]).forEach((kpi) => {
      const isRate = kpi !== 'packsVendus30' && kpi !== 'echeances30';
      for (const off of offsets) {
        const age = off / 30;
        const value = isRate
          ? Math.max(0, Math.min(100, Math.round(base[kpi] - age * 0.5 + rng.float(-1.5, 1.5))))
          : Math.max(0, Math.round(base[kpi] + rng.float(-2, 2)));
        kpiSnapshots.push({ scope, kpi, date: iso(daysAgo(off)), value });
      }
    });
  }

  return {
    today,
    packs,
    clients: allClients,
    clientProfiles,
    equipments,
    simOffers,
    simCards,
    simConsumption,
    userConnections,
    offerChanges,
    vehicles,
    zones: SAV_ZONES,
    technicians: TECHNICIANS,
    interventions,
    kpiSnapshots
  };
}
