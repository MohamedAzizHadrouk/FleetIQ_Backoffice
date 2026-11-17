/**
 * Données du Tableau de bord – reprises À L'IDENTIQUE de la maquette validée Main-v3.html (FleetAdmin-maquettes v3, données au 02/11/2026).
 * Vue Tunav (admin) et vue revendeur (MyCom). Chaque chiffre est celui de la maquette ; la page les lit d'ici.
 */
import type { DashboardData, DashboardScope, GoalKpi, ParkRow, TodoItem } from '../../utils/dashboardKpis';

const pct = (a: number, b: number) => (b ? Math.round((a * 100) / b) : 0);
const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

/* ---------------- Gestion Clients : propriétaire → clients, bloqués ---------------- */
const OWN: Array<[string, number, number]> = [
  ['Tunav (direct)', 207, 23], ['MyCom', 188, 10], ['Comafrique', 38, 0], ['Côte d’Ivoire', 16, 0],
  ['Mali', 5, 1], ['Sénégal', 8, 1], ['Cameroun', 10, 1], ['Burkina Faso', 5, 1]
];

/* ---------------- Équipements + puces par réseau ---------------- */
type Res = { key: string; r: string; a: number; inst: number; on: number; off: number; wait: number; sim: number; simI: number };
const RES: Res[] = [
  { key: 'Tunav', r: 'Tunav · clients directs', a: 219, inst: 191, on: 171, off: 20, wait: 28, sim: 150, simI: 88 },
  { key: 'MyCom', r: 'MyCom', a: 159, inst: 130, on: 72, off: 58, wait: 29, sim: 100, simI: 72 },
  { key: 'FleetPro Sfax', r: 'FleetPro Sfax', a: 134, inst: 113, on: 92, off: 21, wait: 21, sim: 100, simI: 71 },
  { key: 'NavSud', r: 'NavSud', a: 128, inst: 89, on: 62, off: 27, wait: 39, sim: 100, simI: 68 }
];
const STOCK = 90;

/* ---------------- Puces en surconsommation, oct. 2026 ---------------- */
const OVER = [
  { reseller: 'Tunav', label: 'Tunav · clients directs', overSims: 3, excessMB: 2048, sims: 150 },
  { reseller: 'NavSud', label: 'NavSud', overSims: 3, excessMB: 1536, sims: 100 },
  { reseller: 'MyCom', label: 'MyCom', overSims: 2, excessMB: 625, sims: 100 },
  { reseller: 'FleetPro Sfax', label: 'FleetPro Sfax', overSims: 3, excessMB: 563, sims: 100 }
];

/* ---------------- Vue revendeur MyCom ---------------- */
const MY_CL: Array<[string, number, number, number]> = [
  ['Bus Côtier', 36, 29, 18], ['Logistique Sud', 35, 28, 16], ['MyCom (flotte propre)', 34, 30, 19],
  ['Transport Sahel', 28, 26, 12], ['Livraison Rapide', 26, 17, 7]
];
/** Gestion Clients, compte MyCom : client → vendus, installés, connectés (copie du 04/11/2026) */
const MY_ALL: Array<[string, number, number, number]> = [
  ['Logistique Sud', 1, 1, 1],
  ['Transport Sahel', 2, 0, 0],
  ['Citerne Ben Arous', 4, 4, 1],
  ['Froid Monastir', 13, 13, 13],
  ['Express Ariana 2', 2, 2, 2],
  ['Taxi Gafsa 3', 1, 1, 1],
  ['Express Jendouba 2', 4, 4, 4],
  ['Citerne Tozeur 2', 5, 5, 5],
  ['Cargo Sousse 2', 3, 3, 0],
  ['Agri Médenine', 12, 12, 12],
  ['Transport Kasserine', 77, 77, 77],
  ['Logistique Béja 2', 73, 73, 73],
  ['Cargo Béja', 17, 17, 17],
  ['Distribution Zaghouan 2', 32, 32, 32],
  ['Express Jendouba 3', 2, 2, 2],
  ['BTP Tozeur', 6, 5, 0],
  ['Citerne Monastir', 40, 39, 0],
  ['Froid Gabès 2', 34, 34, 34],
  ['Taxi Médenine', 41, 40, 39],
  ['Taxi Médenine 2', 9, 9, 7],
  ['BTP Gabès', 76, 76, 76],
  ['Navette Kasserine', 43, 43, 41],
  ['Transport Nabeul 2', 17, 17, 17],
  ['Livraison Tataouine', 42, 42, 42],
  ['Navette Gabès 2', 36, 36, 36],
  ['Agri Sousse 2', 65, 65, 65],
  ['Cargo Nabeul', 44, 44, 40],
  ['Distribution Kasserine', 30, 30, 25],
  ['Froid Bizerte 3', 12, 12, 12],
  ['Navette Béja 2', 29, 29, 25],
  ['Transport Tataouine', 58, 58, 58],
  ['Livraison Kef 2', 24, 24, 24],
  ['Express Nabeul', 20, 20, 20],
  ['Express Sfax 3', 7, 7, 7],
  ['Agri Siliana', 12, 12, 12],
  ['Taxi Mahdia 2', 3, 3, 3],
  ['Fret Jendouba 2', 39, 37, 0],
  ['Express Kairouan 3', 38, 38, 38],
  ['Livraison Zaghouan 2', 38, 38, 38],
  ['Transport Nabeul 3', 37, 37, 37],
  ['Citerne Sfax', 19, 19, 15],
  ['Agri Siliana 2', 50, 50, 50],
  ['BTP Ariana', 59, 59, 59],
  ['Express Zaghouan 2', 69, 69, 69],
  ['Livraison Sfax', 75, 75, 75],
  ['Logistique Kef 2', 17, 17, 17],
  ['Agri Médenine 2', 74, 74, 74],
  ['Distribution Béja 2', 1, 1, 0],
  ['Express Béja', 25, 25, 25],
  ['Transport Médenine', 70, 70, 70],
  ['Transport Gafsa', 61, 61, 61],
  ['Citerne Médenine 2', 51, 51, 51],
  ['Navette Mahdia 3', 1, 1, 1],
  ['Cargo Kef', 66, 66, 66],
  ['Navette Kasserine 2', 3, 3, 3],
  ['Logistique Sousse 2', 33, 33, 33],
  ['Agri Siliana 3', 65, 65, 65],
  ['Location Ben Arous 2', 9, 9, 9],
  ['Livraison Nabeul 2', 6, 6, 6],
  ['BTP Kef 2', 33, 33, 31],
  ['BTP Médenine 5', 28, 28, 26],
  ['Express Béja 2', 20, 20, 20],
  ['Cargo Kasserine 4', 1, 1, 1],
  ['Location Ben Arous 3', 78, 78, 77],
  ['BTP Gabès 2', 79, 79, 79],
  ['Navette Monastir 2', 79, 79, 77],
  ['Navette Béja 3', 3, 3, 3],
  ['Fret Gafsa', 1, 1, 1],
  ['Transport Médenine 2', 1, 1, 1],
  ['Taxi Kairouan 2', 35, 35, 35],
  ['Logistique Sousse 3', 1, 1, 1],
  ['Taxi Gafsa 4', 9, 8, 0],
  ['Logistique Bizerte 2', 1, 1, 1],
  ['BTP Ariana 2', 2, 2, 2],
  ['Citerne Médenine 3', 1, 1, 0],
  ['Agri Kasserine 2', 1, 1, 0],
  ['Navette Ariana', 36, 36, 36],
  ['Agri Sousse 3', 28, 28, 26],
  ['Logistique Tataouine', 13, 13, 0],
  ['Cargo Gafsa 5', 39, 38, 0],
  ['Transport Bizerte', 34, 34, 34],
  ['Distribution Gabès', 39, 39, 39],
  ['BTP Gabès 3', 6, 6, 6],
  ['BTP Béja 2', 55, 55, 55],
  ['Citerne Tozeur 3', 4, 4, 4],
  ['Agri Kasserine 3', 54, 54, 54],
  ['Agri Gabès', 74, 74, 69],
  ['Logistique Monastir 2', 4, 4, 4],
  ['Logistique Monastir 3', 50, 50, 50],
  ['Express Ariana 3', 1, 1, 1],
  ['Froid Sousse', 1, 1, 1],
  ['Taxi Nabeul 2', 31, 31, 31],
  ['Navette Jendouba', 76, 76, 76],
  ['Distribution Jendouba 3', 54, 54, 54],
  ['Agri Béja 3', 11, 11, 11],
  ['Fret Mahdia 2', 36, 36, 36],
  ['Livraison Ariana 3', 15, 15, 15],
  ['Transport Tataouine 2', 24, 24, 24],
  ['Express Kasserine 2', 3, 3, 3],
  ['Citerne Béja', 75, 75, 75],
  ['Fret Tozeur', 1, 1, 1],
  ['Express Kairouan 4', 30, 30, 30],
  ['Cargo Sfax', 64, 64, 64],
  ['Location Zaghouan 2', 4, 4, 4],
  ['Distribution Sousse 2', 64, 64, 64],
  ['Livraison Ben Arous', 14, 14, 14],
  ['Cargo Monastir 2', 41, 41, 41],
  ['Location Sfax', 52, 52, 52],
  ['Livraison Gafsa 2', 7, 7, 6],
  ['Transport Médenine 3', 61, 61, 56],
  ['Distribution Tataouine 3', 13, 13, 13],
  ['BTP Ben Arous 2', 5, 5, 4],
  ['Logistique Béja 3', 2, 2, 1],
  ['Location Tataouine', 44, 44, 44],
  ['Transport Ben Arous', 13, 13, 13],
  ['Livraison Monastir 2', 47, 47, 47],
  ['Citerne Sfax 2', 1, 1, 0],
  ['Express Ariana 4', 33, 33, 33],
  ['Livraison Sfax 2', 20, 20, 18],
  ['Livraison Tataouine 2', 25, 25, 25],
  ['Froid Gabès 3', 34, 34, 34],
  ['Livraison Mahdia', 57, 57, 56],
  ['Citerne Tataouine 3', 16, 16, 14],
  ['Distribution Gabès 2', 32, 32, 32],
  ['Cargo Kairouan 2', 27, 27, 27],
  ['Citerne Kasserine', 6, 6, 6],
  ['Logistique Tozeur', 34, 34, 34],
  ['BTP Sfax', 1, 1, 1],
  ['Taxi Tozeur', 1, 1, 0],
  ['Cargo Kef 2', 2, 2, 2],
  ['Navette Béja 4', 48, 48, 48],
  ['Navette Ben Arous', 1, 1, 1],
  ['Fret Gafsa 2', 1, 1, 1],
  ['Navette Siliana', 1, 1, 1],
  ['Froid Jendouba 3', 40, 40, 40],
  ['Transport Ariana', 18, 18, 18],
  ['Agri Sousse 4', 50, 50, 50],
  ['Navette Kairouan 2', 46, 46, 46],
  ['Logistique Ariana', 16, 15, 0],
  ['BTP Mahdia 2', 18, 18, 18],
  ['Distribution Sfax', 3, 3, 2],
  ['Logistique Médenine 2', 4, 4, 4],
  ['Navette Tataouine 3', 50, 48, 0],
  ['Taxi Bizerte 2', 58, 58, 58],
  ['Livraison Gabès 2', 49, 49, 49],
  ['BTP Jendouba', 6, 6, 6],
  ['Cargo Mahdia', 12, 12, 12],
  ['Froid Gabès 4', 1, 1, 0],
  ['Fret Kef', 63, 60, 0],
  ['Location Siliana', 67, 67, 62],
  ['Location Sfax 2', 34, 34, 34],
  ['Livraison Sfax 3', 1, 1, 1],
  ['Livraison Ariana 4', 77, 77, 77],
  ['Distribution Bizerte 2', 1, 1, 0],
  ['Taxi Sousse 2', 32, 32, 29],
  ['Transport Gabès', 8, 8, 8],
  ['Distribution Siliana', 3, 3, 0],
  ['Citerne Jendouba 2', 49, 49, 49],
  ['Cargo Kasserine 5', 33, 33, 33],
  ['Logistique Siliana', 1, 1, 1],
  ['Fret Sfax', 33, 33, 30],
  ['Navette Zaghouan', 29, 29, 29],
  ['Express Siliana 2', 4, 4, 0],
  ['Fret Ben Arous 3', 49, 47, 0],
  ['Livraison Tozeur 5', 7, 7, 7],
  ['Cargo Gabès 2', 22, 22, 22],
  ['Livraison Jendouba', 63, 63, 60],
  ['Agri Gafsa 3', 20, 20, 20],
  ['BTP Béja 3', 3, 2, 1],
  ['Livraison Kairouan', 11, 11, 11],
  ['Navette Mahdia 4', 7, 7, 6],
  ['Taxi Monastir 3', 37, 37, 37],
  ['Agri Nabeul', 4, 4, 4],
  ['Citerne Nabeul', 3, 3, 3],
  ['Location Gafsa', 3, 3, 3],
  ['BTP Zaghouan 2', 4, 4, 4],
  ['Froid Kef', 38, 38, 38],
  ['Navette Siliana 2', 78, 78, 78],
  ['Location Nabeul', 3, 3, 3],
  ['Fret Kasserine', 8, 8, 8],
  ['Froid Siliana 2', 17, 16, 0],
  ['BTP Kef 3', 1, 1, 0],
  ['Fret Mahdia 3', 71, 71, 71],
  ['Logistique Tataouine 2', 5, 5, 5],
];

const park = (key: string, label: string, a: number, inst: number, on: number, sims?: number, simsI?: number): ParkRow => ({
  key, label, sold: a, installed: inst, connected: on, notConnected: inst - on, notInstalled: a - inst,
  ...(sims != null ? { sims, simsInstalled: simsI } : {})
});
const sumRows = (rows: ParkRow[], key: string, label: string, withSims: boolean): ParkRow => ({
  key, label,
  sold: rows.reduce((t, x) => t + x.sold, 0),
  installed: rows.reduce((t, x) => t + x.installed, 0),
  connected: rows.reduce((t, x) => t + x.connected, 0),
  notConnected: rows.reduce((t, x) => t + x.notConnected, 0),
  notInstalled: rows.reduce((t, x) => t + x.notInstalled, 0),
  ...(withSims ? { sims: rows.reduce((t, x) => t + (x.sims ?? 0), 0), simsInstalled: rows.reduce((t, x) => t + (x.simsInstalled ?? 0), 0) } : {})
});

/** Courbe 12 mois : de la valeur de l'an dernier à celle d'il y a 30 j (maquette « Comparer »), puis la valeur du jour */
function trendOf(asOf: Date, now: number, prev: GoalKpi['prev'], rate: boolean): Array<{ label: string; value: number }> {
  if (!prev) return [];
  const val = ([v, of]: [number, number?]) => (rate && of ? pct(v, of) : v);
  const a = val(prev.y1);
  const b = val(prev.m30);
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(asOf.getFullYear(), asOf.getMonth() - 11 + i, 1);
    const value = i === 11 ? now : Math.round(a + ((b - a) * i) / 10);
    return { label: MOIS[d.getMonth()], value };
  });
}

type KpiSpec = Omit<GoalKpi, 'id' | 'mockupId' | 'snapshotKey' | 'definition' | 'formula' | 'trend'> & { id: string; snapshotKey: GoalKpi['snapshotKey'] };
const kpi = (asOf: Date, k: KpiSpec): GoalKpi => ({
  ...k,
  mockupId: k.id.replace('TDB-', ''),
  definition: '',
  formula: '',
  trend: trendOf(asOf, k.of ? pct(k.value, k.of) : k.value, k.prev, !!k.of)
});

function todo(id: string, priority: 1 | 2 | 3, title: string, detail: string, count: number, unit: string, route: TodoItem['route'], routeLabel: string, routeQuery?: string, goLabel?: string): TodoItem {
  return { id, sourceRule: '', priority, title, detail, count, unit, what: '', route, routeLabel, routeQuery, goLabel };
}

export function buildMaquetteDashboard(scope: DashboardScope, asOf: Date): DashboardData {
  if (scope.kind === 'network') {
    const parkRows = RES.map((x) => park(x.key, x.r, x.a, x.inst, x.on, x.sim, x.simI));
    const kpis: GoalKpi[] = [
      kpi(asOf, {
        id: 'TDB-D-01', label: 'Clients actifs', value: 447, of: 484, unit: 'clients', goal: 95,
        context: '37 bloqués · 10 bloqués dans ≤ 30 j', what: '',
        table: { headers: ['Propriétaire', 'Clients', 'Bloqués', '% bloqués'], rows: OWN.map(([o, n, b]) => [o, n, b, `${pct(b, n)} %`]) },
        route: 'clients', routeLabel: 'Gestion Clients', snapshotKey: 'clientsActifs', prev: { m30: [449, 488], y1: [380, 420] }
      }),
      kpi(asOf, {
        id: 'TDB-D-02', label: 'Équipements installés', value: 523, of: 640, unit: 'vendus', goal: 90,
        context: '117 vendus pas encore posés · 90 en stock', what: '',
        table: { headers: ['Revendeur', 'Vendus', 'Installés', '% installés'], rows: RES.map((x) => [x.r, x.a, x.inst, `${pct(x.inst, x.a)} %`]) },
        route: 'equipments', routeLabel: 'Équipements', routeQuery: '?etat=installe', snapshotKey: 'installes', prev: { m30: [498, 612], y1: [300, 400] }
      }),
      kpi(asOf, {
        id: 'TDB-D-03', label: 'Équipements connectés', value: 397, of: 523, unit: 'installés', goal: 85,
        context: '126 installés muets depuis plus de 7 j', what: '',
        table: { headers: ['Revendeur', 'Installés', 'Connectés', '% connectés'], rows: RES.map((x) => [x.r, x.inst, x.on, `${pct(x.on, x.inst)} %`]) },
        route: 'equipments', routeLabel: 'Équipements', routeQuery: '?etat=connecte', snapshotKey: 'connectes', prev: { m30: [389, 498], y1: [260, 300] }
      }),
      kpi(asOf, {
        id: 'TDB-D-04', label: 'Puces installées', value: 299, of: 450, unit: 'puces', goal: 85,
        context: '151 puces dans un équipement pas encore installé', what: '',
        table: { headers: ['Réseau', 'Puces', 'Installées', '% installées'], rows: RES.map((x) => [x.r, x.sim, x.simI, `${pct(x.simI, x.sim)} %`]) },
        route: 'sims', routeLabel: 'Gestion des puces', routeQuery: '?statut=installee', snapshotKey: 'pucesInstallees', prev: { m30: [280, 440], y1: [200, 380] }
      }),
      kpi(asOf, {
        id: 'TDB-D-05', label: 'Packs vendus · 30 j', value: 5, unit: 'packs', info: 'FleetIQ Pro en tête',
        context: '21 packs en cours · 57 % via les revendeurs', what: '',
        table: { headers: ['Pack', 'Clients', 'Tunav', 'Revendeurs'], rows: [['FleetIQ Pro', 8, 3, 5], ['FleetIQ Secure', 5, 3, 2], ['FleetIQ Mechanic', 5, 2, 3], ['FleetIQ Vision', 3, 1, 2]] },
        route: 'subscriptions', routeLabel: 'Packs', routeQuery: '?periode=30j', snapshotKey: 'packsVendus30', prev: { m30: [3], y1: [4] }
      })
    ];
    const todos = [
      todo('expire10', 1, 'Abonnements qui expirent dans 10 j', 'Frigo Express J-4 · Fret International J-7 · Transport Express J-8', 3, 'clients', 'subscriptions', 'Packs', '?alerte=critique'),
      todo('blocked30', 1, 'Clients bloqués dans 30 j ou moins', 'Abonnement expiré · Tunav 4 · MyCom 4 · Comafrique 1 · revendeur Burkina Faso', 10, 'clients', 'clients', 'Gestion Clients', '?alerte=blocage'),
      todo('off30', 1, 'Équipements non connectés depuis plus de 30 j', 'Installés chez le client, muets depuis plus d’un mois', 92, 'équip.', 'equipments', 'Équipements', '?alerte=non_connecte_30'),
      todo('alert1', 1, 'Équipements déconnectés depuis plus de 1 j', 'Installés, aucune donnée depuis plus de 24 h · alertes des 7 derniers jours', 252, 'équip.', 'equipments', 'Équipements', '?alerte=direct'),
      todo('due30', 2, 'Échéances d’abonnement dans 30 j', 'MyCom 15 · Tunav 8 · Côte d’Ivoire 1 · autres 2', 26, 'clients', 'clients', 'Gestion Clients', '?alerte=echeance&delai=30'),
      todo('pending30', 2, 'Installation en attente depuis plus de 30 j', 'Vendus, jamais posés', 52, 'équip.', 'equipments', 'Équipements', '?alerte=attente_30'),
      todo('nologin30', 2, 'Clients sans connexion depuis plus de 30 j', 'Tunav 60 · MyCom 43 · Comafrique 11 · autres 6', 120, 'clients', 'clients', 'Gestion Clients', '?alerte=relance&delai=30'),
      todo('simsNotInstalled', 3, 'Puces non installées', '34 % des puces · équipement pas encore installé · Tunav 62 · NavSud 32 · FleetPro Sfax 29 · MyCom 28', 151, 'puces', 'sims', 'Gestion des puces', '?statut=non_installee'),
      todo('simsOver', 3, 'Puces en surconsommation', '+4,7 Go au-delà du forfait en oct. 2026 · Tunav 3 · NavSud 3 · FleetPro Sfax 3 · MyCom 2', 11, 'puces', 'sims', 'Gestion des puces', '?alerte=surconso&periode=mois&mois=2026-10', 'Voir plus de détails')
    ];
    return {
      scope, asOf, connDays: 7, kpis, todo: todos,
      parkRows, parkAll: sumRows(parkRows, '*', 'Tout le réseau', true),
      stock: STOCK, stockByNetwork: [{ label: 'Stock Tunav', count: STOCK }],
      simsTotal: 450, simsInstalled: 299,
      overMonth: '2026-10', overRows: OVER,
      packRank: [
        { packId: 1, name: 'FleetIQ Pro', clients: 8, tunav: 3, resellers: 5, equipments: 0 },
        { packId: 2, name: 'FleetIQ Secure', clients: 5, tunav: 3, resellers: 2, equipments: 0 },
        { packId: 3, name: 'FleetIQ Mechanic', clients: 5, tunav: 2, resellers: 3, equipments: 0 },
        { packId: 4, name: 'FleetIQ Vision', clients: 3, tunav: 1, resellers: 2, equipments: 0 }
      ],
      packClientsTotal: 21,
      topReseller: { name: 'MyCom', packs: 4 }
    };
  }

  /* ---------------- vue revendeur (maquette : MyCom) ---------------- */
  const parkRows = MY_CL.map(([r, a, inst, on]) => park(r, r, a, inst, on));
  const ringRows = MY_ALL.map(([r, a, inst, on]) => park(r, r, a, inst, on));
  const kpis: GoalKpi[] = [
    kpi(asOf, {
      id: 'TDB-R-01', label: 'Mes clients actifs', value: 178, of: 188, unit: 'clients', goal: 95,
      context: '10 bloqués · 4 bloqués dans ≤ 30 j', what: '',
      table: { headers: ['', 'Clients', '%'], rows: [['Actifs', 178, '95 %'], ['dont bloqués dans ≤ 30 j', 4, '2 %'], ['Bloqués', 10, '5 %']] },
      route: 'clients', routeLabel: 'Gestion Clients', snapshotKey: 'clientsActifs', prev: { m30: [196, 205], y1: [150, 160] }
    }),
    kpi(asOf, {
      id: 'TDB-R-02', label: 'Équipements installés', value: 130, of: 159, unit: 'vendus', goal: 90,
      context: '29 vendus pas encore posés', what: '',
      table: { headers: ['Client', 'Vendus', 'Installés', '% installés'], rows: MY_CL.map(([r, a, inst]) => [r, a, inst, `${pct(inst, a)} %`]) },
      route: 'equipments', routeLabel: 'Équipements', routeQuery: '?etat=installe', snapshotKey: 'installes', prev: { m30: [120, 150], y1: [80, 110] }
    }),
    kpi(asOf, {
      id: 'TDB-R-03', label: 'Équipements connectés', value: 72, of: 130, unit: 'installés', goal: 85,
      context: '58 installés muets depuis plus de 7 j', what: '',
      table: { headers: ['Client', 'Installés', 'Connectés', '% connectés'], rows: MY_CL.map(([r, , inst, on]) => [r, inst, on, `${pct(on, inst)} %`]) },
      route: 'equipments', routeLabel: 'Équipements', routeQuery: '?etat=connecte', snapshotKey: 'connectes', prev: { m30: [75, 120], y1: [60, 80] }
    }),
    kpi(asOf, {
      id: 'TDB-R-04', label: 'Échéances dans 30 j', value: 15, unit: 'clients', info: 'À renouveler',
      context: 'sur vos 188 clients', what: '',
      route: 'clients', routeLabel: 'Gestion Clients', routeQuery: '?alerte=echeance&delai=30', snapshotKey: 'echeances30', prev: { m30: [12], y1: [9] }
    })
  ];
  const todos = [
    todo('off30', 1, 'Équipements non connectés depuis plus de 30 j', 'Installés chez vos clients, muets depuis plus d’un mois', 42, 'équip.', 'equipments', 'Équipements', '?alerte=non_connecte_30'),
    todo('blocked30', 1, 'Clients bloqués dans 30 j ou moins', 'Transport Sfax J-3 · Navette Gafsa 3 J-6 · Agri Médenine J-9 · Logistique Gafsa J-12', 4, 'clients', 'clients', 'Gestion Clients', '?alerte=blocage'),
    todo('alert1', 1, 'Équipements déconnectés depuis plus de 1 j', 'Installés chez vos clients, aucune donnée depuis plus de 24 h · 7 derniers jours', 51, 'équip.', 'equipments', 'Équipements', '?alerte=direct'),
    todo('due30', 2, 'Échéances d’abonnement dans 30 j', 'Clients à renouveler ce mois-ci', 15, 'clients', 'clients', 'Gestion Clients', '?alerte=echeance&delai=30'),
    todo('pending30', 2, 'Installation en attente depuis plus de 30 j', 'Vendus, jamais posés', 21, 'équip.', 'equipments', 'Équipements', '?alerte=attente_30'),
    todo('nologin30', 3, 'Clients sans connexion depuis plus de 30 j', 'Risque de départ', 43, 'clients', 'clients', 'Gestion Clients', '?alerte=relance&delai=30')
  ];
  return {
    scope, asOf, connDays: 7, kpis, todo: todos,
    parkRows, ringRows, parkAll: sumRows(parkRows, '*', 'Tous mes clients', false),
    stock: 0, stockByNetwork: [],
    simsTotal: 0, simsInstalled: 0,
    overMonth: '2026-10', overRows: [],
    packRank: [
      { packId: 4, name: 'FleetIQ Vision', clients: 50, tunav: 0, resellers: 50, equipments: 1336 },
      { packId: 1, name: 'FleetIQ Pro', clients: 46, tunav: 0, resellers: 46, equipments: 1017 },
      { packId: 2, name: 'FleetIQ Secure', clients: 41, tunav: 0, resellers: 41, equipments: 1271 },
      { packId: 3, name: 'FleetIQ Mechanic', clients: 39, tunav: 0, resellers: 39, equipments: 1114 }
    ],
    packClientsTotal: 188,
    topReseller: null
  };
}
