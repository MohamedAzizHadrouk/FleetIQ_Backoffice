import React, { createContext, useContext, useMemo, useState } from 'react';
import type { BackofficeRole } from '../utils/backofficePermissions';
import { buildMockData, DEFAULT_DASHBOARD_SETTINGS } from './mock/generate';
import type {
  ClientProfile,
  DashboardSettings,
  FleetClient,
  FleetEquipment,
  Intervention,
  KpiSnapshot,
  OfferChange,
  Pack,
  SavZone,
  SimCard,
  SimConsumption,
  SimOffer,
  Technician,
  UserConnection,
  Vehicle
} from './mock/types';

// Les types restent importables depuis FleetStore (pages et utilitaires existants).
export type {
  ClientPackAssignment,
  ClientProfile,
  DashboardSettings,
  EquipmentType,
  FleetClient,
  FleetEquipment,
  Intervention,
  InterventionStatus,
  InterventionType,
  KpiSnapshot,
  KpiSnapshotKey,
  OfferChange,
  Pack,
  SavZone,
  SimCard,
  SimConsumption,
  SimOffer,
  Technician,
  UserConnection,
  Vehicle
} from './mock/types';
export { EQUIPMENT_TYPES } from './mock/types';

/**
 * Seuil global « connecté » (décision 2026-11-14, analyse § 7-6) : un équipement installé est « connecté » s'il a
 * communiqué depuis moins de ce délai. Réglage BO existant (en heures, 1–720), 7 j par défaut.
 */
const DISCONNECT_THRESHOLD_STORAGE_KEY = 'fleet_disconnect_threshold_hours';
export const DEFAULT_DISCONNECT_THRESHOLD_HOURS = 7 * 24;

function readDisconnectThresholdHours(): number {
  try {
    const raw = window.localStorage.getItem(DISCONNECT_THRESHOLD_STORAGE_KEY);
    const n = raw ? parseInt(raw, 10) : DEFAULT_DISCONNECT_THRESHOLD_HOURS;
    if (!Number.isFinite(n) || n < 1) return DEFAULT_DISCONNECT_THRESHOLD_HOURS;
    return Math.min(720, n);
  } catch {
    return DEFAULT_DISCONNECT_THRESHOLD_HOURS;
  }
}

type FleetStore = {
  currentUserRole: 'Tunav' | 'Revendeur';
  setCurrentUserRole: React.Dispatch<React.SetStateAction<'Tunav' | 'Revendeur'>>;
  currentUserName: string; // "Tunav" ou nom revendeur
  setCurrentUserName: React.Dispatch<React.SetStateAction<string>>;
  backofficeRole: BackofficeRole | null;
  setBackofficeRole: React.Dispatch<React.SetStateAction<BackofficeRole | null>>;
  /** Délai sans communication au-delà duquel un équipement / client est « non connecté » (7 j par défaut) */
  disconnectThresholdHours: number;
  setDisconnectThresholdHours: (hours: number) => void;
  /** Objectifs et paramètres du Tableau de bord – à confirmer back-end */
  dashboardSettings: DashboardSettings;
  /** Jour de référence du jeu fictif (début de journée) */
  mockToday: Date;
  packs: Pack[];
  clients: FleetClient[];
  setClients: React.Dispatch<React.SetStateAction<FleetClient[]>>;
  /** Fiches clients (site, adresse, comptes…), par id client */
  clientProfiles: Record<number, ClientProfile>;
  /** FleetIQ 13 : fiches modifiables depuis Gestion Clients (Ajouter / Modifier un client) */
  setClientProfiles: React.Dispatch<React.SetStateAction<Record<number, ClientProfile>>>;
  equipments: FleetEquipment[];
  setEquipments: React.Dispatch<React.SetStateAction<FleetEquipment[]>>;
  simOffers: SimOffer[];
  setSimOffers: React.Dispatch<React.SetStateAction<SimOffer[]>>;
  simCards: SimCard[];
  setSimCards: React.Dispatch<React.SetStateAction<SimCard[]>>;
  /** Données en lecture seule (historiques fictifs) – à confirmer back-end */
  simConsumption: SimConsumption[];
  userConnections: UserConnection[];
  offerChanges: OfferChange[];
  vehicles: Vehicle[];
  zones: SavZone[];
  technicians: Technician[];
  /** Interventions SAV (carte 10) : modifiables dans le mock (planifier, démarrer, clôturer, type, création) */
  interventions: Intervention[];
  setInterventions: React.Dispatch<React.SetStateAction<Intervention[]>>;
  kpiSnapshots: KpiSnapshot[];
};

const FleetStoreContext = createContext<FleetStore | null>(null);

export function FleetStoreProvider({ children }: { children: React.ReactNode }) {
  const [currentUserRole, setCurrentUserRole] = useState<'Tunav' | 'Revendeur'>(() => {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem('fleet_role') : null;
    return raw === 'Revendeur' ? 'Revendeur' : 'Tunav';
  });
  const [currentUserName, setCurrentUserName] = useState<string>(() => {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem('fleet_user') : null;
    return raw && raw.trim() ? raw : 'Tunav';
  });
  const [backofficeRole, setBackofficeRole] = useState<BackofficeRole | null>(() => {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem('backoffice_role') : null;
    if (
      raw === 'admin_tunav' ||
      raw === 'responsable_sav' ||
      raw === 'technicien_sav' ||
      raw === 'revendeur' ||
      raw === 'finance_tunav'
    ) {
      return raw;
    }
    return null;
  });

  const [disconnectThresholdHours, setDisconnectThresholdHoursState] = useState<number>(
    readDisconnectThresholdHours
  );

  const setDisconnectThresholdHours = (hours: number) => {
    const value = Math.max(1, Math.min(720, Math.round(hours)));
    setDisconnectThresholdHoursState(value);
    try {
      window.localStorage.setItem(DISCONNECT_THRESHOLD_STORAGE_KEY, String(value));
    } catch {
      // ignore
    }
  };

  // Persist for easy demo/testing
  React.useEffect(() => {
    try {
      window.localStorage.setItem('fleet_role', currentUserRole);
      window.localStorage.setItem('fleet_user', currentUserName);
      if (backofficeRole) {
        window.localStorage.setItem('backoffice_role', backofficeRole);
      } else {
        window.localStorage.removeItem('backoffice_role');
      }
    } catch {
      // ignore
    }
  }, [currentUserRole, currentUserName, backofficeRole]);

  // Un seul jeu de données fictif, généré une fois (graine fixe) – voir state/mock/generate.ts
  const mock = useMemo(() => buildMockData(), []);

  const [clients, setClients] = useState<FleetClient[]>(mock.clients);
  const [clientProfiles, setClientProfiles] = useState<Record<number, ClientProfile>>(mock.clientProfiles);
  const [equipments, setEquipments] = useState<FleetEquipment[]>(mock.equipments);
  const [simOffers, setSimOffers] = useState<SimOffer[]>(mock.simOffers);
  const [simCards, setSimCards] = useState<SimCard[]>(mock.simCards);
  const [interventions, setInterventions] = useState<Intervention[]>(mock.interventions);

  const value = useMemo<FleetStore>(
    () => ({
      currentUserRole,
      setCurrentUserRole,
      currentUserName,
      setCurrentUserName,
      backofficeRole,
      setBackofficeRole,
      disconnectThresholdHours,
      setDisconnectThresholdHours,
      dashboardSettings: DEFAULT_DASHBOARD_SETTINGS,
      mockToday: mock.today,
      packs: mock.packs,
      clients,
      setClients,
      clientProfiles,
      setClientProfiles,
      equipments,
      setEquipments,
      simOffers,
      setSimOffers,
      simCards,
      setSimCards,
      simConsumption: mock.simConsumption,
      userConnections: mock.userConnections,
      offerChanges: mock.offerChanges,
      vehicles: mock.vehicles,
      zones: mock.zones,
      technicians: mock.technicians,
      interventions,
      setInterventions,
      kpiSnapshots: mock.kpiSnapshots
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentUserRole, currentUserName, backofficeRole, disconnectThresholdHours, mock, clients, clientProfiles, equipments, simOffers, simCards, interventions]
  );

  return <FleetStoreContext.Provider value={value}>{children}</FleetStoreContext.Provider>;
}

export function useFleetStore(): FleetStore {
  const ctx = useContext(FleetStoreContext);
  if (!ctx) throw new Error('useFleetStore must be used within FleetStoreProvider');
  return ctx;
}
