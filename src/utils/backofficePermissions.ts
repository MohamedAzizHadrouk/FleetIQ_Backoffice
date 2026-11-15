/**
 * Back-office roles and permissions – single source of truth (card FleetIQ 04, matrix approved 2026-11-14).
 *
 * | Role            | Pages (default first)                                  | Notes                                             |
 * |-----------------|--------------------------------------------------------|---------------------------------------------------|
 * | admin_tunav     | /dashboard, clients, packs, puces, équipements, /sav   | everything                                        |
 * | finance_tunav   | /dashboard, clients, packs, puces, équipements         | payment yes; packs create/edit no; puces +        |
 * |                 |                                                        | équipements read-only; prices visible             |
 * | revendeur       | /dashboard, clients, équipements                       | own clients/equipment only (fleetVisibility),     |
 * |                 |                                                        | add/edit clients, no payment (Q2), no prices      |
 * | responsable_sav | /sav, équipements, clients                             | clients read-only, équipements whole network,     |
 * |                 |                                                        | no prices                                         |
 * | technicien_sav  | /sav                                                   | his interventions and zone only, no other         |
 *                 |                                                        | technician, reseller or contract (FleetIQ 10)     |
 *
 * A forbidden URL redirects to the role's default page (App.tsx); the sidebar shows only allowed pages.
 * Mock only: in production these rules must be enforced by the API as well.
 */
export type BackofficeRole =
  | 'admin_tunav'
  | 'responsable_sav'
  | 'technicien_sav'
  | 'revendeur'
  | 'finance_tunav';

export type BackofficeRouteKey =
  | 'dashboard'
  | 'clients'
  | 'subscriptions'
  | 'sims'
  | 'equipments'
  | 'sav';

/** URL of each back-office page. */
export const BACKOFFICE_ROUTE_PATHS: Record<BackofficeRouteKey, string> = {
  dashboard: '/dashboard',
  clients: '/clients',
  subscriptions: '/subscriptions',
  sims: '/sims',
  equipments: '/equipments',
  sav: '/sav'
};

/** Display label of each role (sidebar, login). */
export const BACKOFFICE_ROLE_LABELS: Record<BackofficeRole, string> = {
  admin_tunav: 'Admin TUNAV',
  finance_tunav: 'Finance',
  revendeur: 'Revendeur',
  responsable_sav: 'Responsable SAV',
  technicien_sav: 'Technicien SAV'
};

export type BackofficePermissions = {
  routes: Record<BackofficeRouteKey, boolean>;
  /** Default page after login and target of every forbidden URL. */
  defaultRoute: BackofficeRouteKey;
  /** Prices (SIM offers in TND…) – Admin and Finance only. */
  canSeePrices: boolean;
  clients: {
    /** true = consultation only (no add / edit / payment / install actions). */
    readOnly: boolean;
    canAddEdit: boolean;
    canViewDetails: boolean;
    canViewEquipments: boolean;
    canInstallEquipment: boolean;
    canUninstallEquipment: boolean;
    canEditEquipmentSim: boolean;
    canManagePayment: boolean;
    /**
     * Blocs commerciaux de Gestion Clients (FleetIQ 06) : A-01, A-02, A-04 (a), C-01, C-03, D-03, D-04.
     * false pour le Responsable SAV (consultation sans actions commerciales – analyse § 7-3).
     */
    canSeeCommercialBlocks: boolean;
  };
  equipments: {
    readOnly: boolean;
    canAdd: boolean;
    canEdit: boolean;
    canAssign: boolean;
    canReturnToStock: boolean;
    canViewDetails: boolean;
  };
  sims: {
    readOnly: boolean;
    /** Add / edit / assign / unassign SIMs and manage SIM offers. */
    canManage: boolean;
  };
  subscriptions: {
    /** Create and edit packs (features, description…). */
    canCreateEdit: boolean;
    /** Assign packs to a client. */
    canAssignPacks: boolean;
    /** Validate / block client payments from the Packs page. */
    canManagePayment: boolean;
  };
  dashboard: { canViewAdminSections: boolean };
  /**
   * Interventions SAV (FleetIQ 10). view 'team' = vue équipe (Admin, Responsable SAV) ; 'technician' = ses interventions
   * et sa zone seulement (Technicien SAV) ; 'none' = pas d'accès. Aucun prix ni donnée de contrat pour les profils SAV.
   */
  sav: {
    view: 'team' | 'technician' | 'none';
    /** Créer une intervention, planifier / affecter, modifier le type (S-08, S-09, S-11) */
    canPlan: boolean;
    /** Démarrer, cocher les contrôles, clôturer (T-06) */
    canExecute: boolean;
  };
};

const NO_SAV: BackofficePermissions['sav'] = { view: 'none', canPlan: false, canExecute: false };
const SAV_TEAM: BackofficePermissions['sav'] = { view: 'team', canPlan: true, canExecute: false };

const NO_ROUTES: Record<BackofficeRouteKey, boolean> = {
  dashboard: false,
  clients: false,
  subscriptions: false,
  sims: false,
  equipments: false,
  sav: false
};

const ALL_ROUTES: Record<BackofficeRouteKey, boolean> = {
  dashboard: true,
  clients: true,
  subscriptions: true,
  sims: true,
  equipments: true,
  sav: true
};

const FULL_CLIENTS: BackofficePermissions['clients'] = {
  readOnly: false,
  canAddEdit: true,
  canViewDetails: true,
  canViewEquipments: true,
  canInstallEquipment: true,
  canUninstallEquipment: true,
  canEditEquipmentSim: true,
  canManagePayment: true,
  canSeeCommercialBlocks: true
};

const READ_ONLY_CLIENTS: BackofficePermissions['clients'] = {
  readOnly: true,
  canAddEdit: false,
  canViewDetails: true,
  canViewEquipments: true,
  canInstallEquipment: false,
  canUninstallEquipment: false,
  canEditEquipmentSim: false,
  canManagePayment: false,
  canSeeCommercialBlocks: false
};

const NO_CLIENTS: BackofficePermissions['clients'] = {
  ...READ_ONLY_CLIENTS,
  canViewDetails: false,
  canViewEquipments: false
};

const FULL_EQUIPMENTS: BackofficePermissions['equipments'] = {
  readOnly: false,
  canAdd: true,
  canEdit: true,
  canAssign: true,
  canReturnToStock: true,
  canViewDetails: true
};

const READ_ONLY_EQUIPMENTS: BackofficePermissions['equipments'] = {
  readOnly: true,
  canAdd: false,
  canEdit: false,
  canAssign: false,
  canReturnToStock: false,
  canViewDetails: true
};

const NO_EQUIPMENTS: BackofficePermissions['equipments'] = {
  ...READ_ONLY_EQUIPMENTS,
  canViewDetails: false
};

const NO_SUBSCRIPTIONS: BackofficePermissions['subscriptions'] = {
  canCreateEdit: false,
  canAssignPacks: false,
  canManagePayment: false
};

const PERMISSIONS_BY_ROLE: Record<BackofficeRole, BackofficePermissions> = {
  admin_tunav: {
    routes: ALL_ROUTES,
    defaultRoute: 'dashboard',
    canSeePrices: true,
    clients: FULL_CLIENTS,
    equipments: FULL_EQUIPMENTS,
    sims: { readOnly: false, canManage: true },
    subscriptions: { canCreateEdit: true, canAssignPacks: true, canManagePayment: true },
    dashboard: { canViewAdminSections: true },
    sav: SAV_TEAM
  },
  finance_tunav: {
    routes: { ...NO_ROUTES, dashboard: true, clients: true, subscriptions: true, sims: true, equipments: true },
    defaultRoute: 'dashboard',
    canSeePrices: true,
    // Clients + payment management (existing Finance rights kept, without equipment actions)
    clients: {
      readOnly: false,
      canAddEdit: true,
      canViewDetails: true,
      canViewEquipments: true,
      canInstallEquipment: false,
      canUninstallEquipment: false,
      canEditEquipmentSim: false,
      canManagePayment: true,
      canSeeCommercialBlocks: true
    },
    equipments: READ_ONLY_EQUIPMENTS,
    sims: { readOnly: true, canManage: false },
    // Packs: payment yes; create / edit packs no; pack assignment not in the approved matrix -> off (to confirm)
    subscriptions: { canCreateEdit: false, canAssignPacks: false, canManagePayment: true },
    dashboard: { canViewAdminSections: false },
    sav: NO_SAV
  },
  revendeur: {
    routes: { ...NO_ROUTES, dashboard: true, clients: true, equipments: true },
    defaultRoute: 'dashboard',
    canSeePrices: false,
    // Existing reseller rights kept (own clients only, see utils/fleetVisibility.ts), except payment:
    // FleetIQ 13 (Q2, approved by the owner): « Valider le paiement » / « Bloquer » = Admin + Finance only
    clients: { ...FULL_CLIENTS, canManagePayment: false },
    equipments: { ...FULL_EQUIPMENTS, canAdd: false },
    sims: { readOnly: true, canManage: false },
    subscriptions: NO_SUBSCRIPTIONS,
    dashboard: { canViewAdminSections: false },
    sav: NO_SAV
  },
  responsable_sav: {
    routes: { ...NO_ROUTES, sav: true, equipments: true, clients: true },
    defaultRoute: 'sav',
    canSeePrices: false,
    clients: READ_ONLY_CLIENTS,
    equipments: FULL_EQUIPMENTS,
    sims: { readOnly: true, canManage: false },
    subscriptions: NO_SUBSCRIPTIONS,
    dashboard: { canViewAdminSections: false },
    sav: SAV_TEAM
  },
  technicien_sav: {
    routes: { ...NO_ROUTES, sav: true },
    defaultRoute: 'sav',
    canSeePrices: false,
    clients: NO_CLIENTS,
    equipments: NO_EQUIPMENTS,
    sims: { readOnly: true, canManage: false },
    subscriptions: NO_SUBSCRIPTIONS,
    dashboard: { canViewAdminSections: false },
    sav: { view: 'technician', canPlan: false, canExecute: true }
  }
};

export function getBackofficePermissions(role: BackofficeRole): BackofficePermissions {
  return PERMISSIONS_BY_ROLE[role];
}

export function canAccessRoute(role: BackofficeRole, route: BackofficeRouteKey): boolean {
  return getBackofficePermissions(role).routes[route];
}

export function getDefaultRoute(role: BackofficeRole): string {
  return BACKOFFICE_ROUTE_PATHS[getBackofficePermissions(role).defaultRoute];
}
