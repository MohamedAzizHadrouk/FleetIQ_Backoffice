/**
 * Données saisies à la main (reprises de l'ancien FleetStore et de l'ancien ClientsPage) – carte FleetIQ 05, étape A.
 * Elles restent la base du jeu fictif ; generate.ts complète les volumes avec une graine fixe.
 * Toutes les données sont fictives.
 */
import type { ClientProfile, FleetEquipment, Pack, SimCard, SimOffer } from './types';

export const HAND_PACKS: Pack[] = [
  {
    id: 1,
    name: 'FleetIQ Pro',
    description: 'Pack standard avec suivi et rapports essentiels.',
    color: 'indigo',
    vehicleLimit: 50,
    supportedEquipments: ['ETX', 'ET6', 'ET8'],
    features: [
      'suivie:flotte:tri_dynamique',
      'suivie:flotte:visualisation_cartographique',
      'trajet:trajectoire:trace_itineraire',
      'rapport:suivi_vehicules:detaille:consult'
    ]
  },
  {
    id: 2,
    name: 'FleetIQ Secure',
    description: 'Pack orienté sécurité et alertes.',
    color: 'blue',
    vehicleLimit: 30,
    supportedEquipments: ['ETX', 'ETBLE', 'Dashcam'],
    features: [
      'alerte:securite_actifs:remorquage',
      'alerte:conducteur_urgences:sos',
      'alerte:geofencing:entree_sortie_zone',
      'alerte:parametrage:destinataires'
    ]
  },
  {
    id: 3,
    name: 'FleetIQ Mechanic',
    description: 'Pack orienté maintenance et parc.',
    color: 'amber',
    vehicleLimit: 40,
    supportedEquipments: ['ET6', 'ET8', 'EasyCAN'],
    features: [
      'parc:vehicules:read_update',
      'parc:vehicules:count',
      'alerte:etat_mecanique:dtc',
      'alerte:etat_mecanique:pression_pneus'
    ]
  },
  {
    id: 4,
    name: 'FleetIQ Vision',
    description: 'Pack premium avec dashboard exécutif.',
    color: 'emerald',
    vehicleLimit: 100,
    supportedEquipments: ['ET8+CAN', 'ET6+CAN', 'EasyCAN'],
    features: ['dashboard:executif:kpis', 'dashboard:executif:tendance', 'dashboard:etat_parc:flux_alertes']
  }
];

export type ClientSeed = {
  id: number;
  name: string;
  type: 'Simple' | 'Revendeur';
  reseller: string;
  email: string;
  tel: string;
  expiry: string;
  status: 'Active' | 'Blocked';
  abonnement?: string;
  vehicleLimit: number; // -1 = illimité
};

// Clients de départ (Gestion Clients)
export const HAND_CLIENTS: ClientSeed[] = [
  {
    id: 0,
    name: 'Tunav',
    type: 'Revendeur',
    reseller: 'Tunav',
    email: 'admin@tunav.local',
    tel: '+216 00 00 00 00',
    expiry: '2030-12-31',
    status: 'Active',
    abonnement: 'FleetIQ Vision',
    vehicleLimit: -1
  },
  {
    id: 1,
    name: 'Transport Express',
    type: 'Simple',
    reseller: 'Tunav',
    email: 'contact@texpress.example',
    tel: '+216 00 00 00 06',
    expiry: '2026-12-31',
    status: 'Active',
    abonnement: 'FleetIQ Pro',
    vehicleLimit: 50
  },
  {
    id: 2,
    name: 'MyCom',
    type: 'Revendeur',
    reseller: 'Tunav',
    email: 'admin@mycom.example',
    tel: '+216 00 00 00 01',
    expiry: '2026-12-31',
    status: 'Active',
    abonnement: 'FleetIQ Secure',
    vehicleLimit: -1
  },
  {
    id: 3,
    name: 'Livraison Rapide',
    type: 'Simple',
    reseller: 'MyCom',
    email: 'hello@lrapide.example',
    tel: '+216 00 00 00 07',
    expiry: '2024-10-15',
    status: 'Blocked',
    abonnement: 'FleetIQ Mechanics',
    vehicleLimit: 20
  },
  {
    id: 5,
    name: 'Société Médicale ABC',
    type: 'Simple',
    reseller: 'Tunav',
    email: 'contact@medicale-abc.example',
    tel: '+216 00 00 00 02',
    expiry: '2026-12-31',
    status: 'Active',
    abonnement: 'FleetIQ Pro',
    vehicleLimit: 30
  },
  {
    id: 6,
    name: 'Transport Urbain Tunis',
    type: 'Simple',
    reseller: 'Tunav',
    email: 'admin@tut.example',
    tel: '+216 00 00 00 03',
    expiry: '2027-06-30',
    status: 'Active',
    abonnement: 'FleetIQ Secure',
    vehicleLimit: 50
  },
  {
    id: 7,
    name: 'Fret International',
    type: 'Simple',
    reseller: 'Tunav',
    email: 'contact@fret-intl.example',
    tel: '+216 00 00 00 04',
    expiry: '2026-08-20',
    status: 'Active',
    abonnement: 'FleetIQ Pro',
    vehicleLimit: 40
  },
  {
    id: 8,
    name: 'Distribution Nord',
    type: 'Simple',
    reseller: 'Tunav',
    email: 'info@dist-nord.example',
    tel: '+216 00 00 00 08',
    expiry: '2026-05-10',
    status: 'Blocked',
    abonnement: 'FleetIQ Mechanic',
    vehicleLimit: 25
  },
  {
    id: 9,
    name: 'Transit Maroc',
    type: 'Simple',
    reseller: 'MyCom',
    email: 'ops@transit-ma.example',
    tel: '+216 00 00 00 09',
    expiry: '2026-03-15',
    status: 'Active',
    abonnement: 'FleetIQ Secure',
    vehicleLimit: 35
  },
  {
    id: 11,
    name: 'Logistique Sud',
    type: 'Simple',
    reseller: 'MyCom',
    email: 'contact@logistique-sud.example',
    tel: '+216 00 00 00 05',
    expiry: '2026-11-30',
    status: 'Active',
    abonnement: 'FleetIQ Pro',
    vehicleLimit: 20
  }
];

export const HAND_EQUIPMENTS: FleetEquipment[] = [
  // --- Stock Tunav (non affecté) ---
  {
    id: 1001,
    serial: 'STK-2026-001',
    type: 'FMC130',
    sim: '+33600000001',
    simCallNumber: '0600000001',
    iccid: '89330000000000000001',
    server: 'Srv-Paris-1',
    port: '5027',
    client: 'Tunav_Stock',
    reseller: 'Tunav',
    car: 'Unassigned',
    isInstalled: false,
    firstSendDate: '2026-01-10',
    contractDate: '2026-01-10',
    lastPosition: null
  },
  {
    id: 1002,
    serial: 'STK-2026-002',
    type: 'FMB120',
    sim: '+33600000002',
    simCallNumber: '0600000002',
    iccid: '89330000000000000002',
    server: 'Srv-Lyon-1',
    port: '5028',
    client: 'Tunav_Stock',
    reseller: 'Tunav',
    car: 'Unassigned',
    isInstalled: false,
    firstSendDate: '2026-01-12',
    contractDate: '2026-01-12',
    lastPosition: null
  },
  {
    id: 1003,
    serial: 'STK-2026-003',
    type: 'FMB920',
    sim: '+33600000003',
    simCallNumber: '0600000003',
    iccid: '89330000000000000003',
    server: 'Srv-Paris-1',
    port: '5027',
    client: 'Tunav_Stock',
    reseller: 'Tunav',
    car: 'Unassigned',
    isInstalled: false,
    firstSendDate: '2026-01-15',
    contractDate: '2026-01-15',
    lastPosition: null
  },
  {
    id: 1,
    serial: 'EQ-2024-001',
    equipmentType: 'ETX',
    packId: 1,
    type: 'FMB120',
    sim: '+33612345678',
    simCallNumber: '0612345678',
    iccid: '89330123456789012345',
    server: 'Srv-Paris-1',
    port: '5027',
    client: 'Transport Express',
    reseller: 'Tunav',
    car: 'AB-123-CD',
    isInstalled: true,
    firstSendDate: '2024-01-15',
    contractDate: '2024-01-01',
    lastPosition: {
      dateLocal: '18/04/2025 00:48:50',
      latitude: 48.8566,
      longitude: 2.3522,
      vitesse: 16,
      etat: 'Connectée',
      niveauCarburant: 33,
      totalCarburant: 5122.44,
      rpm: 960,
      temperatureMoteur: 80,
      kilometrage: 64085.301
    }
  },
  {
    id: 2,
    serial: 'EQ-2024-002',
    equipmentType: 'ET6',
    packId: 2,
    type: 'FMC130',
    sim: '+33687654321',
    simCallNumber: '0687654321',
    iccid: '89330987654321098765',
    server: 'Srv-Paris-1',
    port: '5027',
    client: 'MyCom',
    reseller: 'MyCom',
    car: 'Unassigned',
    isInstalled: false,
    firstSendDate: '',
    contractDate: '2024-02-01',
    lastPosition: {
      dateLocal: '15/04/2025 14:22:10',
      latitude: 48.8738,
      longitude: 2.295,
      vitesse: 0,
      etat: 'Déconnectée',
      niveauCarburant: 58,
      totalCarburant: 3200.12,
      rpm: 0,
      temperatureMoteur: 25,
      kilometrage: 42150.8
    }
  },
  {
    id: 3,
    serial: 'EQ-2025-101',
    equipmentType: 'ETX',
    packId: 1,
    type: 'FMB120',
    sim: '+21620101010',
    simCallNumber: '020101010',
    iccid: '89330216000000000001',
    server: 'Srv-Tunis-1',
    port: '5027',
    client: 'Société Médicale ABC',
    reseller: 'Tunav',
    car: 'TN-1234-A',
    isInstalled: true,
    firstSendDate: '2025-03-01',
    contractDate: '2025-01-15',
    lastPosition: null
  },
  {
    id: 4,
    serial: 'EQ-2025-102',
    equipmentType: 'ET6',
    packId: 1,
    type: 'FMC130',
    sim: '+21620101011',
    simCallNumber: '020101011',
    iccid: '89330216000000000002',
    server: 'Srv-Tunis-1',
    port: '5027',
    client: 'Société Médicale ABC',
    reseller: 'Tunav',
    car: 'Unassigned',
    isInstalled: false,
    firstSendDate: '2025-04-10',
    contractDate: '2025-01-15',
    lastPosition: null
  },
  {
    id: 5,
    serial: 'EQ-2025-201',
    equipmentType: 'ET8',
    packId: 2,
    type: 'FMB920',
    sim: '+21670987654',
    simCallNumber: '070987654',
    iccid: '89330216000000000003',
    server: 'Srv-Tunis-1',
    port: '5028',
    client: 'Transport Urbain Tunis',
    reseller: 'Tunav',
    car: 'TU-100-AA',
    isInstalled: true,
    firstSendDate: '2025-06-01',
    contractDate: '2025-05-01',
    lastPosition: null
  },
  {
    id: 6,
    serial: 'EQ-2025-202',
    equipmentType: 'ETX',
    packId: 2,
    type: 'FMB120',
    sim: '+21670987655',
    simCallNumber: '070987655',
    iccid: '89330216000000000004',
    server: 'Srv-Tunis-1',
    port: '5028',
    client: 'Transport Urbain Tunis',
    reseller: 'Tunav',
    car: 'TU-200-BB',
    isInstalled: true,
    firstSendDate: '2025-06-15',
    contractDate: '2025-05-01',
    lastPosition: null
  },
  {
    id: 7,
    serial: 'EQ-2025-203',
    equipmentType: 'ET6',
    packId: 2,
    type: 'FMC130',
    sim: '+21670987656',
    simCallNumber: '070987656',
    iccid: '89330216000000000005',
    server: 'Srv-Tunis-1',
    port: '5028',
    client: 'Transport Urbain Tunis',
    reseller: 'Tunav',
    car: 'Unassigned',
    isInstalled: false,
    firstSendDate: '2025-07-01',
    contractDate: '2025-05-01',
    lastPosition: null
  },
  {
    id: 8,
    serial: 'EQ-2026-301',
    equipmentType: 'ETX',
    packId: 1,
    type: 'FMB120',
    sim: '+21671554433',
    simCallNumber: '071554433',
    iccid: '89330216000000000006',
    server: 'Srv-Tunis-2',
    port: '5027',
    client: 'Fret International',
    reseller: 'Tunav',
    car: 'FI-500-CC',
    isInstalled: true,
    firstSendDate: '2026-01-20',
    contractDate: '2026-01-01',
    lastPosition: null
  },
  {
    id: 9,
    serial: 'EQ-2026-302',
    equipmentType: 'ET6',
    packId: 3,
    type: 'FMC130',
    sim: '+21671554434',
    simCallNumber: '071554434',
    iccid: '89330216000000000007',
    server: 'Srv-Tunis-2',
    port: '5027',
    client: 'Fret International',
    reseller: 'Tunav',
    car: 'Unassigned',
    isInstalled: false,
    firstSendDate: '2026-02-01',
    contractDate: '2026-01-01',
    lastPosition: null
  },
  {
    id: 10,
    serial: 'EQ-2026-401',
    equipmentType: 'ETX',
    packId: 2,
    type: 'FMB920',
    sim: '+21252233445',
    simCallNumber: '052233445',
    iccid: '89330212000000000001',
    server: 'Srv-Casa-1',
    port: '5029',
    client: 'Transit Maroc',
    reseller: 'MyCom', // FleetIQ 05 : Transit Maroc est un client MyCom (jeu de données unique)
    car: 'MA-7890-D',
    isInstalled: true,
    firstSendDate: '2026-02-15',
    contractDate: '2026-02-01',
    lastPosition: null
  },
  {
    id: 11,
    serial: 'EQ-2026-501',
    equipmentType: 'ET8',
    packId: 4,
    type: 'FMC130',
    sim: '+33698765432',
    simCallNumber: '0698765432',
    iccid: '89330198765432109876',
    server: 'Srv-Paris-2',
    port: '5027',
    client: 'MyCom',
    reseller: 'MyCom',
    car: 'GL-001-EF',
    isInstalled: true,
    firstSendDate: '2026-03-01',
    contractDate: '2026-01-01',
    lastPosition: null
  },
  {
    id: 12,
    serial: 'EQ-2026-502',
    equipmentType: 'ET6',
    packId: 4,
    type: 'FMB120',
    sim: '',
    simCallNumber: '',
    iccid: '',
    server: 'Srv-Paris-2',
    port: '5027',
    client: 'MyCom_Stock',
    reseller: 'MyCom',
    car: 'Unassigned',
    isInstalled: false,
    firstSendDate: '2026-03-10',
    contractDate: '2026-03-10',
    lastPosition: null
  },
  {
    id: 13,
    serial: 'EQ-2026-601',
    equipmentType: 'ETX',
    packId: 1,
    type: 'FMB120',
    sim: '+21674123456',
    simCallNumber: '074123456',
    iccid: '89330216000000000008',
    server: 'Srv-Tunis-1',
    port: '5027',
    client: 'Logistique Sud',
    reseller: 'MyCom',
    car: 'LS-300-GG',
    isInstalled: true,
    firstSendDate: '2026-04-01',
    contractDate: '2026-03-15',
    lastPosition: null
  },
  {
    id: 14,
    serial: 'EQ-2024-003',
    equipmentType: 'ETX',
    packId: 1,
    type: 'FMB920',
    sim: '+33611223344',
    simCallNumber: '061122334',
    iccid: '89330111223344556677',
    server: 'Srv-Lyon-1',
    port: '5028',
    client: 'Transport Express',
    reseller: 'Tunav',
    car: 'Unassigned',
    isInstalled: false,
    firstSendDate: '2024-06-01',
    contractDate: '2024-06-01',
    lastPosition: null
  },
  {
    id: 15,
    serial: 'EQ-2026-701',
    equipmentType: 'ET6',
    packId: 3,
    type: 'FMC130',
    sim: '+33620112233',
    simCallNumber: '062011223',
    iccid: '89330201000000000001',
    server: 'Srv-Lille-1',
    port: '5030',
    client: 'Distribution Nord',
    reseller: 'Tunav',
    car: 'DN-450-HH',
    isInstalled: false,
    firstSendDate: '2026-01-05',
    contractDate: '2026-01-01',
    lastPosition: null
  }
];

export const HAND_SIM_OFFERS: SimOffer[] = [
  {
    id: 1,
    name: 'Data 1 Go - Orange',
    description: 'Offre data légère pour télémétrie - 1 Go inclus / mois.',
    pricePerSim: 12,
    operator: 'Orange',
    dataQuotaMB: 1024 // à confirmer back-end
  },
  {
    id: 2,
    name: 'Data 5 Go + SMS - Télécom',
    description: 'Offre standard avec data et SMS pour alertes - 5 Go / mois.',
    pricePerSim: 25,
    operator: 'Télécom',
    dataQuotaMB: 5120 // à confirmer back-end
  },
  {
    id: 3,
    name: 'M2M Premium - Ooredoo',
    description: 'Offre M2M premium avec data illimitée.',
    pricePerSim: 40,
    operator: 'Ooredoo',
    dataQuotaMB: null // illimitée – à confirmer back-end
  }
];

export const HAND_SIM_CARDS: SimCard[] = [
  { id: 1, offerId: 2, phoneNumber: '+216 71 12 34 56', iccid: '89330123456789012345', client: 'Transport Express', reseller: 'Tunav', equipmentId: 1 },
  { id: 2, offerId: 1, phoneNumber: '+216 71 65 43 21', iccid: '89330987654321098765', client: 'MyCom', reseller: 'MyCom', equipmentId: 2 },
  { id: 3, offerId: 3, phoneNumber: '+216 71 11 22 33', iccid: '89216001100110011001', client: 'Société Médicale ABC', reseller: 'Tunav' },
  { id: 4, offerId: 1, phoneNumber: '+216 71 00 00 01', iccid: '89330000000000000001', client: 'Tunav_Stock', reseller: 'Tunav' },
  { id: 5, offerId: 2, phoneNumber: '', iccid: '89330000000000000099', client: 'Tunav_Stock', reseller: 'Tunav' },
  { id: 6, offerId: 3, phoneNumber: '+216 71 11 11 22', iccid: '89216002200220022002', client: 'MyCom_Stock', reseller: 'MyCom' }
];

/** Fiches clients saisies à la main (ancien `mockClients` de ClientsPage), par id client. */
export const HAND_CLIENT_PROFILES: Record<number, ClientProfile> = {
  1: { website: 'www.texpress.example', formula: 'Premium', abonnement: 'FleetIQ Pro', timezone: 'UTC+1', address: '12 Rue de la Logistique, 75001 Paris, France', tel2: '+216 00 00 00 11', email2: 'support@texpress.example', accountLimit: 10, username: 'texpress_admin' },
  2: { website: 'www.mycom.example', formula: 'Enterprise', abonnement: 'FleetIQ Secure', timezone: 'UTC+1', address: '45 Avenue des Transports, 69002 Lyon, France', tel2: '+216 00 00 00 12', email2: 'tech@glogistics.example', accountLimit: 25, username: 'glogistics_admin' },
  3: { website: 'www.lrapide.example', formula: 'Standard', abonnement: 'FleetIQ Mechanics', timezone: 'UTC+1', address: '8 Boulevard de la Vitesse, 13001 Marseille, France', tel2: '', email2: '', accountLimit: 5, username: 'lrapide_admin' },
  5: { website: 'www.medicale-abc.example', formula: 'Standard', abonnement: 'FleetIQ Pro', timezone: 'UTC+1', address: '15 Avenue Habib Bourguiba, Tunis', tel2: '', email2: '', accountLimit: 8, username: 'medicale_admin' },
  6: { website: 'www.tut.example', formula: 'Premium', abonnement: 'FleetIQ Secure', timezone: 'UTC+1', address: '42 Rue de la Gare, Tunis', tel2: '', email2: '', accountLimit: 12, username: 'tut_admin' },
  7: { website: 'www.fret-intl.example', formula: 'Standard', abonnement: 'FleetIQ Pro', timezone: 'UTC+1', address: 'Zone industrielle, Sfax', tel2: '', email2: '', accountLimit: 10, username: 'fret_admin' },
  8: { website: 'www.dist-nord.example', formula: 'Standard', abonnement: 'FleetIQ Mechanic', timezone: 'UTC+1', address: '8 Rue du Commerce, Lille', tel2: '', email2: '', accountLimit: 6, username: 'distnord_admin' }
};
