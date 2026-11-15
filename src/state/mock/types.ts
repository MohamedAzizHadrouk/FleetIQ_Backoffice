/**
 * Types du jeu de données fictif (FleetStore) – carte FleetIQ 05, étape A.
 * Toutes les données sont fictives (aucun client, aucune personne réelle).
 * Les champs marqués « à confirmer back-end » n'existent pas (encore) dans le schéma cité par la documentation
 * des maquettes : ils servent aux KPI des cartes 05 à 10 et devront être confirmés avec l'équipe back-end.
 */

export type EquipmentType =
  | 'ETX'
  | 'MiniTrace'
  | 'MedWatch'
  | 'ETBLE'
  | 'ET8'
  | 'ET6'
  | 'EasyCAN'
  | 'ET8+CAN'
  | 'ET6+CAN'
  | 'Dashcam';

/** Liste EquipmentType du back-office (référence unique pour toutes les pages). */
export const EQUIPMENT_TYPES: EquipmentType[] = [
  'ETX',
  'MiniTrace',
  'MedWatch',
  'ETBLE',
  'ET8',
  'ET6',
  'EasyCAN',
  'ET8+CAN',
  'ET6+CAN',
  'Dashcam'
];

export type Pack = {
  id: number;
  name: 'FleetIQ Secure' | 'FleetIQ Pro' | 'FleetIQ Mechanic' | 'FleetIQ Vision';
  description: string;
  color: 'blue' | 'indigo' | 'amber' | 'emerald' | 'slate';
  vehicleLimit: number;
  supportedEquipments: EquipmentType[];
  features: string[];
  isActive?: boolean;
};

export type ClientPackAssignment = {
  packId: number;
  vehicleLimit: number;
  equipmentLimits: Partial<Record<EquipmentType, number>>;
  customFeatures?: string[];
  /** Date d'affectation du pack au client (AAAA-MM-JJ) – à confirmer back-end */
  assignedAt?: string;
  /** Date d'expiration du pack (AAAA-MM-JJ), = échéance du client par défaut – à confirmer back-end */
  expiresAt?: string;
};

export type FleetClient = {
  id: number;
  name: string;
  type: 'Simple' | 'Revendeur';
  reseller: string;
  email: string;
  tel: string;
  expiry: string;
  status: 'Active' | 'Blocked';
  /**
   * Quota véhicules défini dans "Gestion Clients".
   * null = illimité (pas d’icône quotas + pas de limite d’installation)
   */
  vehicleLimit: number | null;
  packs: ClientPackAssignment[];
  /** Date de création du compte client (AAAA-MM-JJ) – à confirmer back-end */
  createdAt?: string;
  /** Ville principale (sert aux zones SAV) – à confirmer back-end */
  city?: string;
  /** Date du passage en « bloqué » (AAAA-MM-JJ) – à confirmer back-end (Customer.BlockedAt, à ajouter) */
  blockedAt?: string | null;
  /** Motif du blocage – à confirmer back-end */
  blockReason?: 'paiement' | 'expiré' | null;
  /** Comptes utilisateurs utilisés (accountLimit dans la fiche) – à confirmer back-end */
  accountsUsed?: number;
};

/** Informations de fiche client (onglets Général / Contact / Compte de Gestion Clients). */
export type ClientProfile = {
  website: string;
  formula: string;
  abonnement: string;
  timezone: string;
  address: string;
  tel2: string;
  email2: string;
  /** -1 = illimité */
  accountLimit: number;
  username: string;
  // FleetIQ 06 (sécurité) : aucun mot de passe dans les données ni à l'écran – la fiche affiche « •••• » sans bouton
  // « afficher ». En production, le mot de passe n'est jamais renvoyé par l'API (seulement « réinitialiser »).
};

export type FleetEquipment = {
  id: number;
  serial: string;
  /** Type d’équipement métier (ETX, MiniTrace, ...) */
  equipmentType?: EquipmentType;
  /** Support bus CAN */
  supportsCan?: boolean;
  /** Pack affecté à l’équipement (1 équipement = 1 pack) */
  packId?: number;
  type: string;
  sim: string;
  simCallNumber: string;
  iccid: string;
  server: string;
  port: string;
  client: string;
  reseller: string;
  car: string;
  isInstalled: boolean;
  firstSendDate: string;
  contractDate: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lastPosition: any;
  /** Date d'affectation à son client actuel (AAAA-MM-JJ) – à confirmer back-end */
  assignedAt?: string | null;
  /** Date d'installation dans le véhicule (AAAA-MM-JJ) – à confirmer back-end */
  installDate?: string | null;
  /** Dernière communication reçue (ISO 8601) ; null = jamais – à confirmer back-end (ServerQuery.PostingTime) */
  lastCommunication?: string | null;
  /** Nombre de jours avec données sur les 30 derniers jours – à confirmer back-end */
  daysConnected30?: number;
};

export type SimOffer = {
  id: number;
  name: string;
  description: string;
  pricePerSim: number;
  /** Opérateur téléphonique de l'offre (Télécom, Orange, Ooredoo, ...) */
  operator: string;
  /** Forfait data mensuel en Mo ; null = illimité – à confirmer back-end (SIMPack.DataQuotaMB) */
  dataQuotaMB?: number | null;
};

export type SimCard = {
  id: number;
  offerId: number | null;
  /** Numéro de la puce (MSISDN). Optionnel. */
  phoneNumber: string;
  /** Numéro CCID/ICCID. Obligatoire. */
  iccid: string;
  /** Client propriétaire. "<Reseller>_Stock" si la puce est en stock. */
  client: string;
  /** Revendeur rattaché (ou "Tunav" pour le stock Tunav). */
  reseller: string;
  /** Identifiant de l’équipement auquel la puce est affectée, le cas échéant. */
  equipmentId?: number;
  /** Date d'activation (AAAA-MM-JJ) – à confirmer back-end */
  activationDate?: string;
  /** Date d'expiration de l'abonnement puce (AAAA-MM-JJ) – à confirmer back-end */
  expirationDate?: string;
};

/** Consommation data mensuelle d'une puce – à confirmer back-end (SIMConsumptionHistory). */
export type SimConsumption = {
  simId: number;
  /** Mois AAAA-MM */
  month: string;
  usedMB: number;
};

/** Journal des connexions des utilisateurs clients à la plateforme – à confirmer back-end. */
export type UserConnection = {
  clientId: number;
  userId: string;
  /** ISO 8601 */
  date: string;
  channel: 'PC' | 'Mobile';
};

/** Historique des changements d'offre (pack) d'un client – à confirmer back-end. Pas de prix ici. */
export type OfferChange = {
  clientId: number;
  /** AAAA-MM-JJ */
  date: string;
  fromPackId: number | null;
  toPackId: number;
  direction: 'nouveau' | 'montée' | 'descente';
};

/** Véhicules d'un client (fenêtre « Véhicules » de Gestion Clients). */
export type Vehicle = {
  id: number;
  clientId: number;
  plate: string;
  /** N° de série de l'équipement, '-' si aucun */
  equipment: string;
  isInstalled: boolean;
  expiry: string;
};

/** Zone SAV (fictive) – à confirmer back-end. */
export type SavZone = { id: string; name: string; cities: string[] };

/** Technicien SAV (fictif, aucun nom réel) – à confirmer back-end. */
export type Technician = { id: string; name: string; zoneId: string };

export type InterventionType = 'Installation' | 'Dépannage' | 'Contrôle' | 'Remplacement';
export type InterventionStatus = 'À planifier' | 'Planifiée' | 'En cours' | 'Terminée' | 'À revoir';

/** Intervention SAV (fictive) – à confirmer back-end. Sert à la carte 10. */
export type Intervention = {
  id: string;
  type: InterventionType;
  /** Type proposé automatiquement (modifiable par le Responsable SAV) */
  typeAuto: InterventionType;
  status: InterventionStatus;
  technicianId: string | null;
  /** AAAA-MM-JJ */
  plannedDate: string | null;
  plannedTime: string | null;
  /** ISO 8601 */
  createdAt: string;
  closedAt: string | null;
  result: string | null;
  firstVisit: boolean | null;
  serial: string;
  client: string;
  reseller: string;
  city: string;
  zoneId: string;
  vehicle: string;
  source: 'alerte' | 'appel';
  /* ---- carte FleetIQ 10 (doc SAV : tables Intervention / InterventionCheck à créer) – à confirmer back-end ---- */
  /** Adresse du rendez-vous (Intervention.Address) */
  address?: string;
  /** Problème signalé, figé à la création (ex. « Aucune donnée depuis 44 j ») */
  problem?: string;
  /** Type modifié par le responsable SAV (Intervention.TypeChangedBy) */
  typeChangedBy?: 'responsable' | null;
  /** Date d'affectation au technicien (ISO 8601) – sert à « Nouvelle intervention » dans la cloche du technicien */
  assignedAt?: string | null;
  /** Contrôles sur place cochés (InterventionCheck.Item → Done) */
  checks?: Record<string, boolean>;
  /** true si l'intervention a déjà été rendue « à revoir » (2e passage : plus « résolue à la 1re visite ») */
  revisit?: boolean;
};

/** Objectifs et paramètres des règles du Tableau de bord – à confirmer back-end (paramétrables). */
export type DashboardSettings = {
  /** Objectifs en % – propositions, à valider par la Direction */
  goals: { clientsActifs: number; installes: number; connectes: number; pucesInstallees: number };
  /** Un client reste actif N jours après l'expiration de son abonnement, puis il est bloqué */
  graceDays: number;
  /** Alerte « déconnecté depuis plus de N j » (A-23) – distincte du seuil « connecté » */
  alertDays: number;
  /** Horizon des renouvellements (Packs A-11) */
  renewDays: number;
  /** Expiration critique (Packs A-10) */
  critDays: number;
};

export type KpiSnapshotKey =
  | 'clientsActifs'
  | 'installes'
  | 'connectes'
  | 'pucesInstallees'
  | 'packsVendus30'
  | 'echeances30';

/** Instantané mensuel d'un KPI (historique quotidien inexistant aujourd'hui) – à confirmer back-end. */
export type KpiSnapshot = {
  /** 'network' (vue Tunav) ou nom du revendeur */
  scope: string;
  kpi: KpiSnapshotKey;
  /** AAAA-MM-JJ */
  date: string;
  /** % pour les taux, nombre pour les comptes */
  value: number;
};
