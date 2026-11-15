/**
 * Gestion des Équipements v3 – carte FleetIQ 07 (maquette Equipements-v3 · Documentation-Equipements-v3).
 * Ordre de la page : en-tête (titre, Documentation « bientôt », date des données, cloche EQ-A-23) → cartes du haut
 * (EQ-E-01 … EQ-E-05) → À traiter (EQ-A-23, EQ-A-21, EQ-A-22) → liste EQ-T-11 (fiche EQ-F-11) → Répartition
 * (EQ-G-01 … EQ-G-04, EQ-C-01 … EQ-C-03). Tous les chiffres sont recalculés à partir des lignes du tableau ; aucun prix.
 * Droits : Admin tout ; Responsable SAV tout le réseau + actions existantes ; Finance lecture seule (« Voir détail ») ;
 * Revendeur ses clients seulement (sans stock Tunav ni filtre Revendeur) ; Technicien SAV aucun accès (App.tsx).
 * Paramètres d'URL (liens du Tableau de bord) : ?etat= · ?alerte= · ?revendeur= · ?proprietaire= · ?pack= · ?type= · ?q= · ?imei=
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  Plus,
  Store,
  Cpu,
  Hash,
  Wifi,
  Server as ServerIcon,
  Calendar,
  MapPin,
  Gauge,
  Activity,
  Fuel,
  Thermometer,
  Navigation,
  User as UserIcon,
  Car as CarIcon,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { Modal } from '../components/Modal';
import { EquipmentsUnifiedTable } from '../components/EquipmentsUnifiedTable';
import { TableExportButtons } from '../components/TableExportButtons';
import { SimIccidPicker, type SimCreateContext } from '../components/SimIccidPicker';
import { SearchableSelect } from '../components/SearchableSelect';
import { DetailModal, type DetailSpec } from '../components/dashboard/DetailModal';
import { SectionTitle } from '../components/clients/ClientsOverview';
import { EquipmentsOverview } from '../components/equipments/EquipmentsOverview';
import { EquipmentsRepartition } from '../components/equipments/EquipmentsRepartition';
import { EquipmentsBell, LiveAlertToast } from '../components/equipments/EquipmentsAlerts';
import { EquipmentFicheSummary } from '../components/equipments/EquipmentFicheSummary';
import { EquipmentType, EQUIPMENT_TYPES, useFleetStore } from '../state/FleetStore';
import { parseDate } from '../state/mock/dates';
import { useBackofficePermissions, useBackofficeRole } from '../hooks/useBackofficePermissions';
import { canAccessRoute, type BackofficeRouteKey } from '../utils/backofficePermissions';
import { getVisibleEquipments, isStockClientName } from '../utils/fleetVisibility';
import {
  buildRows,
  compareNetworks,
  countStates,
  EMPTY_EQ_FILTERS,
  EQ_ALERT_KEYS,
  ETAT_KEYS,
  matchesEtat,
  type EqAlertKey,
  type EqRow,
  type EqTableFilters,
  type EtatKey,
  type TableFilterPatch
} from '../utils/equipmentsKpis';
import {
  exportEquipmentsToExcel,
  exportEquipmentsToPdf
} from '../utils/equipmentTableExport';
import {
  MapContainer as MapContainerBase,
  TileLayer as TileLayerBase,
  Marker as MarkerBase,
  Popup
} from 'react-leaflet';
// @ts-expect-error - leaflet has no bundled types in this project (same usage as ClientsPage)
import L from 'leaflet';

// Cast to any to bypass missing @types/leaflet declarations
const MapContainer = MapContainerBase as any;
const TileLayer = TileLayerBase as any;
const Marker = MarkerBase as any;

const customMarkerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Donnée mock par défaut pour les équipements qui n'ont pas encore communiqué
const DEFAULT_POSITION = {
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
};

export function EquipmentsPage() {
  const {
    currentUserRole,
    currentUserName,
    clients,
    setClients,
    equipments,
    setEquipments,
    packs,
    simCards,
    setSimCards,
    simOffers,
    setSimOffers,
    disconnectThresholdHours,
    dashboardSettings,
    mockToday
  } = useFleetStore();
  const permissions = useBackofficePermissions();
  const role = useBackofficeRole();
  const canOpenRoute = useCallback((route: BackofficeRouteKey) => (role ? canAccessRoute(role, route) : false), [role]);
  const packById = useMemo(() => new Map(packs.map((p) => [p.id, p])), [packs]);
  const simOfferById = useMemo(() => new Map(simOffers.map((o) => [o.id, o])), [simOffers]);
  const isTunavUser = currentUserRole === 'Tunav';
  const isResellerUser = currentUserRole === 'Revendeur';

  const buildSimCreateContext = (clientName: string, reseller: string): SimCreateContext => ({
    clientName,
    reseller
  });

  // FleetIQ 07 – filtres du tableau T-11, filtre « À traiter », fiche, détail, cloche, notification « En direct »
  const [filters, setFilters] = useState<EqTableFilters>(EMPTY_EQ_FILTERS);
  const [alertFilter, setAlertFilter] = useState<EqAlertKey | null>(null);
  const [detail, setDetail] = useState<DetailSpec | null>(null);
  const [bellOpen, setBellOpen] = useState(false);
  const [toastClosed, setToastClosed] = useState(false);
  const [pendingImei, setPendingImei] = useState<string | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const [equipmentToDelete, setEquipmentToDelete] = useState<any | null>(null);

  const [equipmentToEdit, setEquipmentToEdit] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [equipmentToView, setEquipmentToView] = useState<any | null>(null);
  const [showPositionMap, setShowPositionMap] = useState(false);

  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [equipmentToInstall, setEquipmentToInstall] = useState<any | null>(null);
  const [installPlate, setInstallPlate] = useState<string>('');
  const [installSimId, setInstallSimId] = useState<number | null>(null);
  const [installError, setInstallError] = useState<string | null>(null);

  const vehiclePlateSuggestions = useMemo(() => {
    const clientName = equipmentToInstall?.client;
    if (!clientName) return [];
    const plates = new Set<string>();
    for (const e of equipments) {
      if (e.client !== clientName) continue;
      const plate = typeof e.car === 'string' ? e.car.trim() : '';
      if (!plate || plate === 'Unassigned') continue;
      plates.add(plate);
    }
    return Array.from(plates).sort((a, b) => a.localeCompare(b));
  }, [equipments, equipmentToInstall]);

  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [stockToAssign, setStockToAssign] = useState<any | null>(null);
  const [assignTargetName, setAssignTargetName] = useState<string>('');
  const [assignError, setAssignError] = useState<string | null>(null);

  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [newStock, setNewStock] = useState({
    serial: '',
    server: '',
    port: '',
    firstSendDate: '',
    contractDate: '',
    type: 'FMC130',
    equipmentType: 'ETX' as EquipmentType,
    supportsCan: false
  });

  const equipmentTypes = EQUIPMENT_TYPES;

  const [isQuotasOpen, setIsQuotasOpen] = useState(false);
  const [clientToQuota] = useState<(typeof clients)[number] | null>(null);
  const [quotaEquipmentLimits, setQuotaEquipmentLimits] = useState<Record<string, number>>({});
  const [quotaError, setQuotaError] = useState<string | null>(null);

  const installedCountByClient = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of equipments) {
      if (!e.isInstalled) continue;
      m.set(e.client, (m.get(e.client) ?? 0) + 1);
    }
    return m;
  }, [equipments]);

  const stockClientName = useMemo(
    () => (currentUserRole === 'Tunav' ? 'Tunav_Stock' : `${currentUserName}_Stock`),
    [currentUserRole, currentUserName]
  );
  const stockEquipments = useMemo(
    () => equipments.filter((e) => e.client === stockClientName),
    [equipments, stockClientName]
  );

  const isStockEquipment = (client: string) => client.endsWith('_Stock');

  const getEquipmentStatus = (eq: (typeof equipments)[number]): 'installed' | 'not_installed' | 'stock' => {
    if (isStockEquipment(eq.client)) return 'stock';
    if (eq.isInstalled) return 'installed';
    return 'not_installed';
  };

  const simByEquipmentId = useMemo(() => {
    const m = new Map<number, (typeof simCards)[number]>();
    for (const s of simCards) {
      if (s.equipmentId != null) m.set(s.equipmentId, s);
    }
    return m;
  }, [simCards]);

  const visibleEquipments = useMemo(
    () => getVisibleEquipments(equipments, currentUserRole, currentUserName),
    [equipments, currentUserRole, currentUserName]
  );

  /* ---------- FleetIQ 07 : lignes du tableau T-11 = source de tous les chiffres ---------- */
  const isNetwork = !isResellerUser;
  const connDays = Math.round((disconnectThresholdHours / 24) * 10) / 10;
  const alertDays = dashboardSettings.alertDays;
  const now = useMemo(() => new Date(), []);
  const allRows = useMemo(
    () =>
      buildRows({
        equipments: visibleEquipments,
        simCards,
        simOffers,
        packs,
        now,
        connThresholdHours: disconnectThresholdHours,
        alertDays
      }),
    [visibleEquipments, simCards, simOffers, packs, now, disconnectThresholdHours, alertDays]
  );
  const rowById = useMemo(() => new Map(allRows.map((r) => [r.eq.id, r])), [allRows]);

  const networkOptions = useMemo(
    () => Array.from(new Set(allRows.map((r) => r.network))).sort(compareNetworks),
    [allRows]
  );
  const ownerGroups = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const r of allRows) {
      if (filters.network && r.network !== filters.network) continue;
      if (!m.has(r.network)) m.set(r.network, new Set());
      m.get(r.network)?.add(r.owner);
    }
    return Array.from(m.entries())
      .sort((a, b) => compareNetworks(a[0], b[0]))
      .map(([network, set]) => ({
        network,
        owners: Array.from(set).sort((a, b) => (isStockClientName(a) ? 1 : 0) - (isStockClientName(b) ? 1 : 0) || a.localeCompare(b))
      }));
  }, [allRows, filters.network]);

  /** tous les filtres sauf l'état (sert à la barre des états du tableau) */
  const baseRows = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    const from = parseDate(filters.from);
    const to = parseDate(filters.to);
    return allRows.filter((r) => {
      if (filters.type && r.type !== filters.type) return false;
      if (filters.network && r.network !== filters.network) return false;
      if (filters.owner && r.owner !== filters.owner) return false;
      if (filters.pack && (filters.pack === 'none' ? r.packId != null : String(r.packId) !== filters.pack)) return false;
      // la période d'affectation ne s'applique que si elle est renseignée (le stock n'a pas de date d'affectation)
      if ((from || to) && (!r.assigned || (from && r.assigned < from) || (to && r.assigned > to))) return false;
      if (alertFilter === 'direct' && !r.live) return false;
      if (alertFilter === 'non_connecte_30' && !r.off30) return false;
      if (alertFilter === 'attente_30' && !r.pending30) return false;
      if (q) {
        const hay = [r.eq.serial, r.owner, r.network, r.type, r.eq.type, r.iccid, r.phone, r.packName, r.offer, r.eq.car, r.eq.server]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [allRows, filters, alertFilter]);
  const tableRows = useMemo(() => baseRows.filter((r) => matchesEtat(r, filters.etat)), [baseRows, filters.etat]);
  const barCounts = useMemo(() => countStates(baseRows), [baseRows]);
  const filteredEquipments = useMemo(() => tableRows.map((r) => r.eq), [tableRows]);

  const liveAlerts = useMemo(
    () => allRows.filter((r) => r.live).sort((a, b) => (a.daysSince ?? 0) - (b.daysSince ?? 0)),
    [allRows]
  );

  const scrollToTable = () =>
    window.setTimeout(() => tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  const patchFilters = (patch: Partial<EqTableFilters>) => setFilters((f) => ({ ...f, ...patch }));
  const resetFilters = () => {
    setFilters(EMPTY_EQ_FILTERS);
    setAlertFilter(null);
  };
  /** filtre demandé par un graphique de « Répartition » : remplace les filtres du tableau */
  const applyPatch = (p: TableFilterPatch) => {
    setFilters({
      ...EMPTY_EQ_FILTERS,
      etat: p.etat ?? 'tous',
      network: isNetwork ? p.network ?? '' : '',
      owner: p.owner ?? '',
      pack: p.pack ?? '',
      type: p.type ?? '',
      from: p.assignedFrom ?? '',
      to: p.assignedTo ?? ''
    });
    setAlertFilter(null);
    scrollToTable();
  };
  const toggleAlert = (k: EqAlertKey) => {
    setAlertFilter((cur) => (cur === k ? null : k));
    scrollToTable();
  };
  const ALERT_LABELS: Record<EqAlertKey, string> = {
    direct: `déconnectés depuis plus de ${alertDays} j (A-23)`,
    non_connecte_30: 'non connectés > 30 j (A-21)',
    attente_30: 'installation en attente > 30 j (A-22)'
  };

  /* ---------- fiche EQ-F-11 (s'ouvre depuis une ligne, une liste, la cloche ou la notification) ---------- */
  const openFiche = useCallback((r: EqRow) => {
    setDetail(null);
    setEquipmentToView(r.eq);
    setShowPositionMap(false);
    setIsDetailsModalOpen(true);
  }, []);
  const ficheRow = equipmentToView ? rowById.get(equipmentToView.id) ?? null : null;
  const ficheOthers = ficheRow && ficheRow.state !== 'stock'
    ? allRows.filter((r) => r.owner === ficheRow.owner && r.eq.id !== ficheRow.eq.id).slice(0, 8)
    : [];

  /* ---------- paramètres d'URL (liens du Tableau de bord et des détails de la page) ---------- */
  // ?etat=tous|installe|non_installe|connecte|non_connecte|stock · ?alerte=direct|non_connecte_30|attente_30
  // ?revendeur=<nom> (ignoré pour le revendeur) · ?proprietaire=<client> · ?pack=<id>|none · ?type=<type> · ?q=<texte>
  // ?imei=<n° de série> (ouvre la fiche). Lus une fois, puis l'adresse redevient /equipments.
  useEffect(() => {
    const keys = ['etat', 'alerte', 'revendeur', 'proprietaire', 'pack', 'type', 'q', 'imei'];
    if (!keys.some((k) => searchParams.has(k))) return;
    const etat = searchParams.get('etat') ?? '';
    const alerte = searchParams.get('alerte') ?? '';
    setFilters({
      ...EMPTY_EQ_FILTERS,
      etat: (ETAT_KEYS as string[]).includes(etat) ? (etat as EtatKey) : 'tous',
      network: isNetwork ? searchParams.get('revendeur') ?? '' : '',
      owner: searchParams.get('proprietaire') ?? '',
      pack: searchParams.get('pack') ?? '',
      type: searchParams.get('type') ?? '',
      q: searchParams.get('q') ?? ''
    });
    setAlertFilter((EQ_ALERT_KEYS as string[]).includes(alerte) ? (alerte as EqAlertKey) : null);
    const imei = searchParams.get('imei');
    if (imei) setPendingImei(imei);
    else window.setTimeout(() => tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams, isNetwork]);
  useEffect(() => {
    if (!pendingImei) return;
    const r = allRows.find((x) => x.eq.serial === pendingImei);
    if (r) openFiche(r);
    setPendingImei(null);
  }, [pendingImei, allRows, openFiche]);

  const resellersList = useMemo(
    () =>
      clients
        .filter(
          (c) =>
            c.type === 'Revendeur' &&
            c.name !== 'Tunav' &&
            !c.name.endsWith('_Stock') &&
            c.reseller === 'Tunav'
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [clients]
  );

  const assignableClients = useMemo(
    () =>
      clients
        .filter((c) => !c.name.endsWith('_Stock'))
        .filter((c) => c.name !== 'Tunav')
        .filter((c) => c.type === 'Simple')
        .filter((c) =>
          currentUserRole === 'Tunav' ? c.reseller === 'Tunav' : c.reseller === currentUserName
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [clients, currentUserRole, currentUserName]
  );

  const assignableResellerOptions = useMemo(
    () => resellersList.map((c) => c.name),
    [resellersList]
  );

  const combinedAssignOptions = useMemo(() => {
    const clientNames = assignableClients.map((c) => c.name);
    const resellerNames = assignableResellerOptions;
    return [...clientNames, ...resellerNames].sort((a, b) => a.localeCompare(b));
  }, [assignableClients, assignableResellerOptions]);

  const assignTargetTypeMap = useMemo(() => {
    const map = new Map<string, 'client' | 'reseller'>();
    assignableClients.forEach((c) => map.set(c.name, 'client'));
    assignableResellerOptions.forEach((n) => map.set(n, 'reseller'));
    return map;
  }, [assignableClients, assignableResellerOptions]);

  const saveQuotas = () => {
    if (!clientToQuota) return;
    const limit = clientToQuota.vehicleLimit;
    const total = Object.values(quotaEquipmentLimits).reduce((acc, v) => acc + (Number(v) || 0), 0);
    if (typeof limit === 'number' && total > limit) {
      setQuotaError(`Le total (${total}) ne doit pas dépasser les véhicules autorisés (${limit}).`);
      return;
    }
    setClients((prev) =>
      prev.map((c) => {
        if (c.id !== clientToQuota.id) return c;
        const a = c.packs[0];
        if (!a) return c;
        return {
          ...c,
          packs: [
            {
              ...a,
              equipmentLimits: { ...a.equipmentLimits, ...(quotaEquipmentLimits as any) }
            }
          ]
        };
      })
    );
    setIsQuotasOpen(false);
  };

  const cancelAssignmentToTunavStock = (equipmentId: number) => {
    setEquipments((prev) =>
      prev.map((e) =>
        e.id === equipmentId
          ? {
              ...e,
              client: stockClientName,
              reseller: currentUserName,
              car: 'Unassigned',
              isInstalled: false
            }
          : e
      )
    );
  };

  const openInstallModal = (eq: any) => {
    const c = clients.find((x) => x.name === eq.client);
    if (!c) return;
    const limit = c.vehicleLimit;
    const installed = installedCountByClient.get(eq.client) ?? 0;
    if (typeof limit === 'number' && installed >= limit) {
      window.alert(`Limite atteinte: ${installed}/${limit}.`);
      return;
    }
    const currentSim =
      simCards.find((s) => s.equipmentId === eq.id) ??
      simCards.find((s) => s.iccid && s.iccid === eq.iccid);
    setEquipmentToInstall(eq);
    setInstallPlate(eq.car && eq.car !== 'Unassigned' ? eq.car : '');
    setInstallSimId(currentSim?.id ?? null);
    setInstallError(null);
    setIsInstallModalOpen(true);
  };

  const installAvailableSims = useMemo(() => {
    const eq = equipmentToInstall;
    if (!eq) return [];
    const stock = isStockClientName(eq.client);
    return simCards.filter((s) => {
      if (s.equipmentId === eq.id) return true;
      if (s.equipmentId != null) return false;
      if (stock) {
        return s.client === eq.client || s.reseller === eq.reseller;
      }
      return s.client === eq.client;
    });
  }, [simCards, equipmentToInstall]);

  const confirmInstall = () => {
    if (!equipmentToInstall) return;
    const plate = installPlate.trim();
    if (!plate) {
      setInstallError('Veuillez saisir une immatriculation.');
      return;
    }
    const eqId = equipmentToInstall.id;
    const selectedSim = installSimId != null ? simCards.find((s) => s.id === installSimId) : undefined;
    setEquipments((prev) =>
      prev.map((e) =>
        e.id === eqId
          ? {
              ...e,
              isInstalled: true,
              car: plate,
              ...(selectedSim
                ? {
                    sim: selectedSim.phoneNumber,
                    simCallNumber: selectedSim.phoneNumber,
                    iccid: selectedSim.iccid
                  }
                : {})
            }
          : e
      )
    );
    setSimCards((prev) =>
      prev.map((s) => {
        if (s.equipmentId === eqId && s.id !== installSimId) {
          return { ...s, equipmentId: undefined };
        }
        if (installSimId != null && s.id === installSimId) {
          return {
            ...s,
            equipmentId: eqId,
            client: equipmentToInstall.client,
            reseller: equipmentToInstall.reseller
          };
        }
        return s;
      })
    );
    setIsInstallModalOpen(false);
    setInstallSimId(null);
  };

  const uninstallEquipment = (eq: (typeof equipments)[number]) => {
    setEquipments((prev) =>
      prev.map((e) =>
        e.id === eq.id ? { ...e, isInstalled: false, car: 'Unassigned' } : e
      )
    );
  };

  const confirmDeleteEquipment = () => {
    if (!equipmentToDelete) return;
    setEquipments((prev) => prev.filter((e) => e.id !== equipmentToDelete.id));
    setSimCards((prev) =>
      prev.map((s) => (s.equipmentId === equipmentToDelete.id ? { ...s, equipmentId: undefined } : s))
    );
    setEquipmentToDelete(null);
  };

  const openEditEquipment = (eq: any) => {
    const client = clients.find((c) => c.name === eq.client && !c.name.endsWith('_Stock'));
    const defaultPackId =
      typeof eq.packId === 'number'
        ? eq.packId
        : client?.packs?.[0]?.packId ?? packs[0]?.id ?? null;
    setEquipmentToEdit({ ...eq, packId: defaultPackId ?? eq.packId });
    setIsEditModalOpen(true);
  };

  const saveEditEquipment = () => {
    if (!equipmentToEdit) return;
    const eqId = equipmentToEdit.id;
    setEquipments((prev) => prev.map((e) => (e.id === eqId ? equipmentToEdit : e)));
    setIsEditModalOpen(false);
  };

  const openAssign = (eq: any) => {
    setStockToAssign(eq);
    setAssignTargetName('');
    setAssignError(null);
    setIsAssignOpen(true);
  };

  const confirmAssign = () => {
    if (!stockToAssign || !assignTargetName) return;

    const targetType = assignTargetTypeMap.get(assignTargetName);
    if (!targetType) return;

    if (targetType === 'client') {
      const c = clients.find((x) => x.name === assignTargetName);
      if (!c) return;
      const limit = c.vehicleLimit;
      const installed = installedCountByClient.get(c.name) ?? 0;
      if (typeof limit === 'number' && installed >= limit) {
        setAssignError(`Limite atteinte: ${installed}/${limit}.`);
        return;
      }
      setEquipments((prev) =>
        prev.map((e) =>
          e.id === stockToAssign.id
            ? {
                ...e,
                client: c.name,
                reseller: c.reseller,
                car: 'Unassigned',
                isInstalled: false,
                packId: e.packId ?? c.packs?.[0]?.packId
              }
            : e
        )
      );
    } else {
      if (!isTunavUser) return;
      const r = clients.find((x) => x.type === 'Revendeur' && x.name === assignTargetName);
      if (!r) return;
      setEquipments((prev) =>
        prev.map((e) =>
          e.id === stockToAssign.id
            ? {
                ...e,
                reseller: r.name,
                client: `${r.name}_Stock`,
                car: 'Unassigned',
                isInstalled: false
              }
            : e
        )
      );
    }
    setIsAssignOpen(false);
  };

  const openAddStock = () => {
    setNewStock({
      serial: '',
      server: '',
      port: '',
      firstSendDate: '',
      contractDate: '',
      type: 'FMC130',
      equipmentType: 'ETX',
      supportsCan: false
    });
    setIsAddStockOpen(true);
  };

  const confirmAddStock = () => {
    const serial = newStock.serial.trim();
    if (!serial) return;
    const nextId = Math.max(0, ...equipments.map((e) => e.id)) + 1;
    setEquipments((prev) => [
      {
        id: nextId,
        serial,
        equipmentType: newStock.equipmentType,
        supportsCan: newStock.supportsCan,
        packId: undefined,
        type: newStock.type,
        sim: '',
        simCallNumber: '',
        iccid: '',
        server: newStock.server.trim(),
        port: newStock.port.trim(),
        firstSendDate: newStock.firstSendDate,
        contractDate: newStock.contractDate,
        client: stockClientName,
        reseller: currentUserName,
        car: 'Unassigned',
        isInstalled: false,
        lastPosition: null
      },
      ...prev
    ]);
    setIsAddStockOpen(false);
  };

  // Exports Excel / PDF existants : lignes filtrées du tableau, pack visible pour tous les rôles (aucun prix)
  const equipmentExportOptions = {
    equipments: filteredEquipments,
    getEquipmentStatus,
    simByEquipmentId,
    simOfferById,
    packById,
    showPack: true
  };

  const exportFilteredExcel = () => exportEquipmentsToExcel(equipmentExportOptions);
  const exportFilteredPdf = () => exportEquipmentsToPdf(equipmentExportOptions);

  const toast = !toastClosed && liveAlerts.length > 0 ? liveAlerts[0] : null;

  return (
    <div className="space-y-8 pb-8">
      {/* En-tête : titre, Documentation (bientôt), exports, ajout, date des données, cloche EQ-A-23 */}
      <header className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-title text-text">Gestion des Équipements</h1>
            <button
              type="button"
              aria-disabled="true"
              title="Documentation des KPI : bientôt (carte FleetIQ 11)"
              onClick={(e) => e.preventDefault()}
              className="inline-flex items-center gap-1.5 h-control px-3 text-button-sm rounded-control border border-border bg-surface text-text-muted cursor-not-allowed"
            >
              <BookOpen size={16} aria-hidden="true" />
              Documentation
              <span className="rounded-pill bg-border-subtle px-2 py-0.5 text-mention text-text">bientôt</span>
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <TableExportButtons
              size="compact"
              onExportExcel={exportFilteredExcel}
              onExportPdf={exportFilteredPdf}
              disabled={filteredEquipments.length === 0}
            />
            {permissions?.equipments.canAdd && (
              <button
                onClick={openAddStock}
                className="inline-flex items-center gap-2 h-control px-3 text-button-sm rounded-control bg-primary text-text-inverse hover:bg-primary-hover transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus focus-visible:ring-offset-2"
              >
                <Plus size={16} aria-hidden="true" />
                Ajouter un équipement
              </button>
            )}
            <span className="inline-flex items-center gap-2 h-control px-3 rounded-control border border-border bg-surface text-small text-text">
              <span className="h-2 w-2 rounded-pill bg-success" aria-hidden="true" />
              Données au <b className="tabular-nums">{mockToday.toLocaleDateString('fr-FR')}</b>
            </span>
            <EquipmentsBell
              alerts={liveAlerts}
              alertDays={alertDays}
              open={bellOpen}
              onToggle={setBellOpen}
              onOpenRow={openFiche}
              onShowAll={() => toggleAlert('direct')}
            />
          </div>
        </div>
        <p className="text-small text-text-muted">
          {isNetwork
            ? 'Parc des boîtiers GPS de tout le réseau (Tunav, puis les revendeurs) : installés ou non, connectés ou non, quoi faire.'
            : `Parc des boîtiers GPS de vos clients (${currentUserName}) : installés ou non, connectés ou non, quoi faire.`}
          {permissions?.equipments.readOnly ? ' Consultation seule.' : ''}
        </p>
      </header>

      <EquipmentsOverview
        rows={allRows}
        isNetwork={isNetwork}
        connDays={connDays}
        alertDays={alertDays}
        alertFilter={alertFilter}
        onAlertClick={toggleAlert}
        onOpenDetail={setDetail}
      />

      {/* EQ-T-11 Liste des équipements, juste sous « À traiter » */}
      <section aria-labelledby="eq-list" className="space-y-3 scroll-mt-4" ref={tableRef}>
        <SectionTitle id="eq-list" title="Liste des équipements" hint="Cliquez sur une ligne pour la fiche de l’équipement" />
        <EquipmentsUnifiedTable
          rows={tableRows}
          totalCount={allRows.length}
          stateCounts={barCounts}
          filters={filters}
          onFiltersChange={patchFilters}
          onReset={resetFilters}
          equipmentTypes={equipmentTypes}
          packs={packs}
          networkOptions={networkOptions}
          showNetworkFilter={isNetwork}
          ownerGroups={ownerGroups}
          alertLabel={alertFilter ? ALERT_LABELS[alertFilter] : null}
          onClearAlert={() => setAlertFilter(null)}
          connDays={connDays}
          actionPermissions={
            permissions?.equipments ?? {
              readOnly: true,
              canAdd: false,
              canEdit: false,
              canAssign: false,
              canReturnToStock: false,
              canViewDetails: false
            }
          }
          onOpen={openFiche}
          onEdit={openEditEquipment}
          onAssign={openAssign}
          onReturnToStock={(eq) => cancelAssignmentToTunavStock(eq.id)}
        />
      </section>

      <EquipmentsRepartition rows={allRows} isNetwork={isNetwork} now={now} onOpenRow={openFiche} onFilter={applyPatch} />

      <DetailModal detail={detail} onClose={() => setDetail(null)} canOpen={canOpenRoute} />

      {toast && (
        <LiveAlertToast
          alert={toast}
          others={liveAlerts.length - 1}
          alertDays={alertDays}
          onView={() => {
            openFiche(toast);
            setToastClosed(true);
          }}
          onClose={() => setToastClosed(true)}
        />
      )}

      {/* Quotas modal (placeholder write path) */}
      <Modal
        isOpen={isQuotasOpen}
        onClose={() => setIsQuotasOpen(false)}
        title={`Quotas — ${clientToQuota?.name ?? ''}`}
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-surface-muted border border-border rounded-control p-3 text-small text-text">
            Véhicules autorisés: <strong>{clientToQuota?.vehicleLimit === null ? '∞' : (clientToQuota?.vehicleLimit ?? 0)}</strong>
          </div>
          <div className="border border-border rounded-control p-3 bg-surface">
            <div className="text-small font-medium text-text">Équipements autorisés (par type)</div>
            <div className="mt-3 space-y-2">
              {Object.keys(quotaEquipmentLimits).length === 0 && (
                <div className="text-mention text-text-muted italic">Aucun type pour ce pack.</div>
              )}
              {Object.entries(quotaEquipmentLimits).map(([t, v]) => (
                <div key={t} className="flex items-center justify-between gap-3">
                  <div className="text-small text-text">{t}</div>
                  <input
                    type="number"
                    min={0}
                    value={v ?? 0}
                    onChange={(e) =>
                      setQuotaEquipmentLimits((prev) => ({ ...prev, [t]: Math.max(0, Number(e.target.value)) }))
                    }
                    className="w-28 px-3 py-2 border border-border-strong rounded-control focus-visible:ring-3 focus-visible:ring-focus focus-visible:border-transparent text-small"
                  />
                </div>
              ))}
            </div>
          </div>
          {quotaError && <div className="bg-danger-50 text-danger-700 border border-danger-200 rounded-control p-3 text-small">{quotaError}</div>}
          <div className="flex justify-end gap-3 pt-4 border-t border-border-subtle">
            <button
              onClick={() => setIsQuotasOpen(false)}
              className="px-4 py-2 text-small font-medium text-text bg-surface border border-border rounded-control hover:bg-surface-muted transition-colors duration-fast ease-standard"
            >
              Annuler
            </button>
            <button
              onClick={saveQuotas}
              className="px-4 py-2 text-small font-medium text-text-inverse bg-primary rounded-card hover:bg-primary-hover transition-colors duration-fast ease-standard"
            >
              Enregistrer
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit equipment popup */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Modifier l'équipement"
        size="lg">
        <div className="space-y-6">
          <div>
            <h3 className="text-small font-semibold text-text mb-3 pb-2 border-b border-border-subtle">
              Informations Équipement
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-mention font-medium text-text mb-1">Type d’équipement</label>
                <select
                  value={(equipmentToEdit?.equipmentType ?? 'ETX') as EquipmentType}
                  onChange={(e) => setEquipmentToEdit((p: any) => ({ ...p, equipmentType: e.target.value as EquipmentType }))}
                  className="w-full px-3 py-2 border border-border-strong rounded-control focus-visible:ring-3 focus-visible:ring-focus focus-visible:border-transparent text-small bg-surface"
                >
                  {equipmentTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-mention font-medium text-text mb-1">Bus CAN</label>
                <select
                  value={equipmentToEdit?.supportsCan ? 'yes' : 'no'}
                  onChange={(e) => setEquipmentToEdit((p: any) => ({ ...p, supportsCan: e.target.value === 'yes' }))}
                  className="w-full px-3 py-2 border border-border-strong rounded-control focus-visible:ring-3 focus-visible:ring-focus focus-visible:border-transparent text-small bg-surface"
                >
                  <option value="no">Non</option>
                  <option value="yes">Oui</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-mention font-medium text-text mb-1">Numéro de série (IMEI)</label>
                <input
                  value={equipmentToEdit?.serial ?? ''}
                  readOnly
                  disabled
                  className="w-full px-3 py-2 border border-border rounded-control text-small bg-surface-muted text-text-muted cursor-not-allowed"
                />
              </div>
              {!isResellerUser && (
              <div className="md:col-span-2">
                <label className="block text-mention font-medium text-text mb-1">Pack</label>
                <select
                  value={equipmentToEdit?.packId ?? ''}
                  onChange={(e) =>
                    setEquipmentToEdit((p: any) => ({
                      ...p,
                      packId: e.target.value ? Number(e.target.value) : undefined
                    }))
                  }
                  className="w-full px-3 py-2 border border-border-strong rounded-control focus-visible:ring-3 focus-visible:ring-focus focus-visible:border-transparent text-small bg-surface"
                >
                  <option value="">— Aucun pack —</option>
                  {packs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-small font-semibold text-text mb-3 pb-2 border-b border-border-subtle">Connexion Serveur</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-mention font-medium text-text mb-1">Serveur</label>
                <input
                  value={equipmentToEdit?.server ?? ''}
                  onChange={(e) => setEquipmentToEdit((p: any) => ({ ...p, server: e.target.value }))}
                  className="w-full px-3 py-2 border border-border-strong rounded-control focus-visible:ring-3 focus-visible:ring-focus focus-visible:border-transparent text-small"
                />
              </div>
              <div>
                <label className="block text-mention font-medium text-text mb-1">Port</label>
                <input
                  value={equipmentToEdit?.port ?? ''}
                  onChange={(e) => setEquipmentToEdit((p: any) => ({ ...p, port: e.target.value }))}
                  className="w-full px-3 py-2 border border-border-strong rounded-control focus-visible:ring-3 focus-visible:ring-focus focus-visible:border-transparent text-small"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-small font-semibold text-text mb-3 pb-2 border-b border-border-subtle">Dates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-mention font-medium text-text mb-1">Date du premier envoi</label>
                <input
                  type="date"
                  value={equipmentToEdit?.firstSendDate ?? ''}
                  readOnly
                  disabled
                  className="w-full px-3 py-2 border border-border-strong rounded-control focus-visible:ring-3 focus-visible:ring-focus focus-visible:border-transparent text-small"
                />
              </div>
              <div>
                <label className="block text-mention font-medium text-text mb-1">Date contractuelle adoptée</label>
                <input
                  type="date"
                  value={equipmentToEdit?.contractDate ?? ''}
                  onChange={(e) => setEquipmentToEdit((p: any) => ({ ...p, contractDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-border-strong rounded-control focus-visible:ring-3 focus-visible:ring-focus focus-visible:border-transparent text-small"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border-subtle">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 text-small font-medium text-text bg-surface border border-border rounded-control hover:bg-surface-muted transition-colors duration-fast ease-standard"
            >
              Annuler
            </button>
            <button
              onClick={saveEditEquipment}
              className="px-4 py-2 text-small font-medium text-text-inverse bg-primary rounded-card hover:bg-primary-hover transition-colors duration-fast ease-standard"
            >
              Enregistrer
            </button>
          </div>
        </div>
      </Modal>

      {/* Install equipment popup */}
      <Modal
        isOpen={isInstallModalOpen}
        onClose={() => {
          setIsInstallModalOpen(false);
          setInstallSimId(null);
        }}
        title={`Installer — ${equipmentToInstall?.serial ?? ''}`}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-label font-medium text-text mb-1">Immatriculation (Matricule)</label>
            <input
              value={installPlate}
              onChange={(e) => setInstallPlate(e.target.value)}
              list="vehicle-plates"
              placeholder="Ex: AB-123-CD"
              className="w-full px-3 py-2 border border-border-strong rounded-control focus-visible:ring-3 focus-visible:ring-focus focus-visible:border-transparent text-small"
            />
            <datalist id="vehicle-plates">
              {vehiclePlateSuggestions.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
            <div className="mt-1 text-mention text-text-muted">
              Recherchez dans la liste ou saisissez une nouvelle matricule si elle n’existe pas.
            </div>
          </div>
          <div>
            <h3 className="text-small font-semibold text-text mb-2 pb-2 border-b border-border-subtle flex items-center gap-2">
              <Wifi size={16} className="text-text-muted" />
              Carte SIM
            </h3>
            <SimIccidPicker
              label="N° de série puce (ICCID)"
              labelClassName="block text-small font-medium text-text mb-1"
              availableSims={installAvailableSims}
              selectedSimId={installSimId}
              onSelectSimId={setInstallSimId}
              simOfferById={simOfferById}
              simOffers={simOffers}
              allSimCards={simCards}
              showPrices={permissions?.canSeePrices ?? false}
              allowCreate
              setSimCards={setSimCards}
              setSimOffers={setSimOffers}
              createContext={
                equipmentToInstall
                  ? buildSimCreateContext(equipmentToInstall.client, equipmentToInstall.reseller)
                  : undefined
              }
              emptyMessage="Aucune puce disponible pour cet équipement."
            />
          </div>
          {installError && (
            <div className="bg-danger-50 text-danger-700 border border-danger-200 rounded-control p-3 text-small">{installError}</div>
          )}
          <div className="flex justify-end gap-3 pt-4 border-t border-border-subtle">
            <button
              onClick={() => setIsInstallModalOpen(false)}
              className="px-4 py-2 text-small font-medium text-text bg-surface border border-border rounded-control hover:bg-surface-muted transition-colors duration-fast ease-standard"
            >
              Annuler
            </button>
            <button
              onClick={confirmInstall}
              className="px-4 py-2 text-small font-medium text-text-inverse bg-success rounded-card hover:bg-success-hover transition-colors duration-fast ease-standard"
            >
              Installer
            </button>
          </div>
        </div>
      </Modal>

      {/* Equipment details popup */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setShowPositionMap(false);
        }}
        title={`Fiche équipement${equipmentToView ? ` · ${equipmentToView.serial}` : ''}`}
        size="lg"
      >
        {equipmentToView ? (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-50 rounded-control flex items-center justify-center text-primary">
                  <Cpu size={20} />
                </div>
                <div>
                  <h3 className="text-h4 font-semibold text-text">{equipmentToView.serial}</h3>
                  <p className="text-small text-text-muted">{equipmentToView.type}</p>
                </div>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-control text-mention font-medium ${
                  equipmentToView.isInstalled
                    ? 'bg-success-50 text-success-700 border border-success-200'
                    : 'bg-warning-50 text-warning-700 border border-warning-200'
                }`}
              >
                {equipmentToView.isInstalled ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                {equipmentToView.isInstalled ? 'Installé' : 'Non installé'}
              </span>
            </div>

            {/* EQ-F-11 – fiche v3 : état, phrase, client, revendeur, pack, affectation, dernier envoi, 30 j, SIM, action */}
            {ficheRow && (
              <EquipmentFicheSummary row={ficheRow} others={ficheOthers} connDays={connDays} alertDays={alertDays} onOpenRow={openFiche} />
            )}

            {/* Equipment details */}
            <div>
              <h4 className="text-small font-semibold text-text mb-3 flex items-center gap-2">
                <Cpu size={16} className="text-primary" />
                Détails de l'équipement
              </h4>
              <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                <div>
                  <div className="text-mention font-medium text-text-muted mb-1 flex items-center gap-1.5">
                    <Hash size={14} /> N° de série
                  </div>
                  <div className="text-small font-medium text-text">{equipmentToView.serial}</div>
                </div>
                <div>
                  <div className="text-mention font-medium text-text-muted mb-1 flex items-center gap-1.5">
                    <Cpu size={14} /> Type
                  </div>
                  <div className="text-small font-medium text-text">{equipmentToView.type}</div>
                </div>
                <div>
                  <div className="text-mention font-medium text-text-muted mb-1 flex items-center gap-1.5">
                    <Wifi size={14} /> N° SIM
                  </div>
                  <div className="text-small font-medium text-text">{equipmentToView.sim || '-'}</div>
                </div>
                <div>
                  <div className="text-mention font-medium text-text-muted mb-1 flex items-center gap-1.5">
                    <Wifi size={14} /> N° d'appel puce
                  </div>
                  <div className="text-small font-medium text-text">
                    {equipmentToView.simCallNumber || '-'}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-mention font-medium text-text-muted mb-1 flex items-center gap-1.5">
                    <Hash size={14} /> ICCID
                  </div>
                  <div className="text-small font-medium text-text break-all">
                    {equipmentToView.iccid || '-'}
                  </div>
                </div>
                <div>
                  <div className="text-mention font-medium text-text-muted mb-1 flex items-center gap-1.5">
                    <ServerIcon size={14} /> Serveur
                  </div>
                  <div className="text-small font-medium text-text">{equipmentToView.server || '-'}</div>
                </div>
                <div>
                  <div className="text-mention font-medium text-text-muted mb-1 flex items-center gap-1.5">
                    <Hash size={14} /> Port
                  </div>
                  <div className="text-small font-medium text-text">{equipmentToView.port || '-'}</div>
                </div>
                <div>
                  <div className="text-mention font-medium text-text-muted mb-1 flex items-center gap-1.5">
                    <Calendar size={14} /> Date premier envoi
                  </div>
                  <div className="text-small font-medium text-text">
                    {equipmentToView.firstSendDate
                      ? new Date(equipmentToView.firstSendDate).toLocaleDateString('fr-FR')
                      : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-mention font-medium text-text-muted mb-1 flex items-center gap-1.5">
                    <Calendar size={14} /> Date contractuelle
                  </div>
                  <div className="text-small font-medium text-text">
                    {equipmentToView.contractDate
                      ? new Date(equipmentToView.contractDate).toLocaleDateString('fr-FR')
                      : '-'}
                  </div>
                </div>
              </div>
            </div>

            {/* Client details */}
            <div>
              <h4 className="text-small font-semibold text-text mb-3 flex items-center gap-2">
                <UserIcon size={16} className="text-primary" />
                Détails du Client
              </h4>
              <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                <div>
                  <div className="text-mention font-medium text-text-muted mb-1 flex items-center gap-1.5">
                    <UserIcon size={14} /> Client
                  </div>
                  <div className="text-small font-medium text-text">{equipmentToView.client || '-'}</div>
                </div>
                <div>
                  <div className="text-mention font-medium text-text-muted mb-1 flex items-center gap-1.5">
                    <Store size={14} /> Revendeur
                  </div>
                  <div className="text-small font-medium text-text">
                    {equipmentToView.reseller || '-'}
                  </div>
                </div>
                <div>
                  <div className="text-mention font-medium text-text-muted mb-1 flex items-center gap-1.5">
                    <CarIcon size={14} /> Véhicule
                  </div>
                  <div className="text-small font-medium text-text">{equipmentToView.car || '-'}</div>
                </div>
                <div>
                  <div className="text-mention font-medium text-text-muted mb-1 flex items-center gap-1.5">
                    <CheckCircle2 size={14} /> Statut installation
                  </div>
                  <div className="text-small font-medium text-text">
                    {equipmentToView.isInstalled ? 'Installé' : 'Non installé'}
                  </div>
                </div>
              </div>
            </div>

            {/* Map + Position details */}
            {showPositionMap && (() => {
              const lp = equipmentToView.lastPosition ?? DEFAULT_POSITION;
              const isConnected = lp.etat === 'Connectée';
              return (
                <>
                  <div className="border border-border rounded-card overflow-hidden h-[250px] relative z-0">
                    <MapContainer
                      center={[lp.latitude, lp.longitude]}
                      zoom={13}
                      scrollWheelZoom={false}
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker position={[lp.latitude, lp.longitude]} icon={customMarkerIcon}>
                        <Popup>
                          <div className="text-mention leading-relaxed">
                            <strong>Dernière position:</strong>
                            <br />
                            Date Local={lp.dateLocal}
                            <br />
                            Vitesse= {lp.vitesse}km/h
                            <br />
                            État={' '}
                            <span style={{ color: isConnected ? 'var(--tunav-success-700)' : 'var(--tunav-danger-700)' }}>{lp.etat}</span>
                            <br />
                            Niveau de carburant={lp.niveauCarburant}%
                            <br />
                            Total de carburant={lp.totalCarburant}
                            <br />
                            RPM={lp.rpm}
                            <br />
                            Température Moteur={lp.temperatureMoteur}°C
                            <br />
                            Kilométrage={lp.kilometrage}km
                          </div>
                        </Popup>
                      </Marker>
                    </MapContainer>
                  </div>

                  <div className="bg-surface-muted border border-border rounded-card p-4">
                    <h4 className="text-small font-semibold text-text mb-3 pb-2 border-b border-border flex items-center gap-2">
                      <Navigation size={16} className="text-primary" />
                      Dernière position
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-4">
                      <div>
                        <div className="text-mention font-medium text-text-muted mb-0.5 flex items-center gap-1">
                          <Calendar size={12} /> Date Local
                        </div>
                        <div className="text-small font-semibold text-text">{lp.dateLocal}</div>
                      </div>
                      <div>
                        <div className="text-mention font-medium text-text-muted mb-0.5 flex items-center gap-1">
                          <MapPin size={12} /> Latitude
                        </div>
                        <div className="text-small font-semibold text-text">{lp.latitude}</div>
                      </div>
                      <div>
                        <div className="text-mention font-medium text-text-muted mb-0.5 flex items-center gap-1">
                          <MapPin size={12} /> Longitude
                        </div>
                        <div className="text-small font-semibold text-text">{lp.longitude}</div>
                      </div>
                      <div>
                        <div className="text-mention font-medium text-text-muted mb-0.5 flex items-center gap-1">
                          <Gauge size={12} /> Vitesse
                        </div>
                        <div className="text-small font-semibold text-text">{lp.vitesse} km/h</div>
                      </div>
                      <div>
                        <div className="text-mention font-medium text-text-muted mb-0.5 flex items-center gap-1">
                          <Activity size={12} /> État
                        </div>
                        <div
                          className={`text-small font-semibold flex items-center gap-1.5 ${
                            isConnected ? 'text-success' : 'text-danger'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-pill ${
                              isConnected ? 'bg-success' : 'bg-danger'
                            }`}
                          />
                          {lp.etat}
                        </div>
                      </div>
                      <div>
                        <div className="text-mention font-medium text-text-muted mb-0.5 flex items-center gap-1">
                          <Fuel size={12} /> Niveau de carburant
                        </div>
                        <div className="text-small font-semibold text-text">{lp.niveauCarburant}%</div>
                      </div>
                      <div>
                        <div className="text-mention font-medium text-text-muted mb-0.5 flex items-center gap-1">
                          <Fuel size={12} /> Total de carburant
                        </div>
                        <div className="text-small font-semibold text-text">{lp.totalCarburant}</div>
                      </div>
                      <div>
                        <div className="text-mention font-medium text-text-muted mb-0.5 flex items-center gap-1">
                          <Activity size={12} /> RPM
                        </div>
                        <div className="text-small font-semibold text-text">{lp.rpm}</div>
                      </div>
                      <div>
                        <div className="text-mention font-medium text-text-muted mb-0.5 flex items-center gap-1">
                          <Thermometer size={12} /> Température Moteur
                        </div>
                        <div className="text-small font-semibold text-text">{lp.temperatureMoteur}°C</div>
                      </div>
                      <div>
                        <div className="text-mention font-medium text-text-muted mb-0.5 flex items-center gap-1">
                          <Navigation size={12} /> Kilométrage
                        </div>
                        <div className="text-small font-semibold text-text">
                          {lp.kilometrage.toLocaleString('fr-FR')} km
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}

            {/* Footer actions */}
            <div className="pt-4 border-t border-border-subtle flex justify-end gap-3">
              {equipmentToView.isInstalled && (
              <button
                onClick={() => setShowPositionMap(!showPositionMap)}
                className={`px-4 py-2 text-small font-medium rounded-control transition-colors duration-fast ease-standard flex items-center gap-2 ${
                  showPositionMap
                    ? 'bg-primary-50 text-primary border border-primary-200'
                    : 'bg-surface text-text border border-border hover:bg-surface-muted'
                }`}
              >
                <MapPin size={16} />
                {showPositionMap ? 'Masquer la position' : 'Voir position'}
              </button>
              )}
              <button
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  setShowPositionMap(false);
                }}
                className="px-4 py-2 text-small font-medium text-text bg-surface border border-border rounded-control hover:bg-surface-muted transition-colors duration-fast ease-standard"
              >
                Fermer
              </button>
            </div>
          </div>
        ) : (
          <div className="text-small text-text-muted">—</div>
        )}
      </Modal>

      {/* Affectation client ou revendeur */}
      <Modal
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        title="Affectation"
        size="md"
      >
        <div className="space-y-4">
          <div className="text-small text-text">
            Équipement: <strong>{stockToAssign?.serial}</strong>
          </div>
          <div>
            <label className="block text-label font-medium text-text mb-1">Client / Revendeur</label>
            <SearchableSelect
              value={assignTargetName}
              onChange={(v) => {
                setAssignTargetName(v);
                setAssignError(null);
              }}
              options={combinedAssignOptions}
              placeholder="Rechercher et sélectionner un client ou revendeur…"
            />
          </div>

          {assignError && <div className="bg-danger-50 text-danger-700 border border-danger-200 rounded-control p-3 text-small">{assignError}</div>}
          <div className="flex justify-end gap-3 pt-4 border-t border-border-subtle">
            <button
              onClick={() => setIsAssignOpen(false)}
              className="px-4 py-2 text-small font-medium text-text bg-surface border border-border rounded-control hover:bg-surface-muted transition-colors duration-fast ease-standard"
            >
              Annuler
            </button>
            <button
              onClick={confirmAssign}
              className="px-4 py-2 text-small font-medium text-text-inverse bg-primary rounded-card hover:bg-primary-hover transition-colors duration-fast ease-standard"
              disabled={!assignTargetName}
            >
              Confirmer
            </button>
          </div>
        </div>
      </Modal>

      {/* Supprimer équipement */}
      <Modal
        isOpen={equipmentToDelete !== null}
        onClose={() => setEquipmentToDelete(null)}
        title="Supprimer l'équipement"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-danger-50 text-danger-700 p-3 rounded-control text-small flex items-start gap-3">
            <AlertCircle className="shrink-0 mt-0.5" size={16} />
            <p>
              Supprimer définitivement l'équipement <strong>{equipmentToDelete?.serial}</strong> ?
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border-subtle">
            <button
              onClick={() => setEquipmentToDelete(null)}
              className="px-4 py-2 text-small font-medium text-text bg-surface border border-border rounded-control hover:bg-surface-muted transition-colors duration-fast ease-standard"
            >
              Annuler
            </button>
            <button
              onClick={confirmDeleteEquipment}
              className="px-4 py-2 text-small font-medium text-text-inverse bg-danger rounded-card hover:bg-danger-hover transition-colors duration-fast ease-standard inline-flex items-center gap-2"
            >
              <Trash2 size={16} />
              Supprimer
            </button>
          </div>
        </div>
      </Modal>

      {/* Add stock equipment */}
      <Modal isOpen={isAddStockOpen} onClose={() => setIsAddStockOpen(false)} title="Stock équipements" size="lg">
        <div className="space-y-6">
          <div>
            <h3 className="text-small font-semibold text-text mb-3 pb-2 border-b border-border-subtle">
              Informations Équipement
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-mention font-medium text-text mb-1">Type d’équipement</label>
                <select
                  value={newStock.equipmentType}
                  onChange={(e) => setNewStock((p) => ({ ...p, equipmentType: e.target.value as EquipmentType }))}
                  className="w-full px-3 py-2 border border-border-strong rounded-control focus-visible:ring-3 focus-visible:ring-focus focus-visible:border-transparent text-small bg-surface"
                >
                  {equipmentTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-mention font-medium text-text mb-1">Bus CAN</label>
                <select
                  value={newStock.supportsCan ? 'yes' : 'no'}
                  onChange={(e) => setNewStock((p) => ({ ...p, supportsCan: e.target.value === 'yes' }))}
                  className="w-full px-3 py-2 border border-border-strong rounded-control focus-visible:ring-3 focus-visible:ring-focus focus-visible:border-transparent text-small bg-surface"
                >
                  <option value="no">Non</option>
                  <option value="yes">Oui</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-mention font-medium text-text mb-1">Numéro de série (IMEI)</label>
                <input
                  value={newStock.serial}
                  onChange={(e) => setNewStock((p) => ({ ...p, serial: e.target.value }))}
                  className="w-full px-3 py-2 border border-border-strong rounded-control focus-visible:ring-3 focus-visible:ring-focus focus-visible:border-transparent text-small"
                />
              </div>
            </div>
            <p className="text-mention text-text-muted mt-2">
              La puce SIM sera associée lors de l'affectation à un client ou à un revendeur depuis le tableau.
            </p>
          </div>

          <div>
            <h3 className="text-small font-semibold text-text mb-3 pb-2 border-b border-border-subtle">Connexion Serveur</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-mention font-medium text-text mb-1">Serveur</label>
                <input
                  value={newStock.server}
                  onChange={(e) => setNewStock((p) => ({ ...p, server: e.target.value }))}
                  className="w-full px-3 py-2 border border-border-strong rounded-control focus-visible:ring-3 focus-visible:ring-focus focus-visible:border-transparent text-small"
                />
              </div>
              <div>
                <label className="block text-mention font-medium text-text mb-1">Port</label>
                <input
                  value={newStock.port}
                  onChange={(e) => setNewStock((p) => ({ ...p, port: e.target.value }))}
                  className="w-full px-3 py-2 border border-border-strong rounded-control focus-visible:ring-3 focus-visible:ring-focus focus-visible:border-transparent text-small"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-small font-semibold text-text mb-3 pb-2 border-b border-border-subtle">Dates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-mention font-medium text-text mb-1">Date du premier envoi</label>
                <input
                  type="date"
                  value={newStock.firstSendDate}
                  onChange={(e) => setNewStock((p) => ({ ...p, firstSendDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-border-strong rounded-control focus-visible:ring-3 focus-visible:ring-focus focus-visible:border-transparent text-small"
                />
              </div>
              <div>
                <label className="block text-mention font-medium text-text mb-1">Date contractuelle adoptée</label>
                <input
                  type="date"
                  value={newStock.contractDate}
                  onChange={(e) => setNewStock((p) => ({ ...p, contractDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-border-strong rounded-control focus-visible:ring-3 focus-visible:ring-focus focus-visible:border-transparent text-small"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border-subtle">
            <button
              onClick={() => setIsAddStockOpen(false)}
              className="px-4 py-2 text-small font-medium text-text bg-surface border border-border rounded-control hover:bg-surface-muted transition-colors duration-fast ease-standard"
            >
              Annuler
            </button>
            <button
              onClick={confirmAddStock}
              className="px-4 py-2 text-small font-medium text-text-inverse bg-primary rounded-card hover:bg-primary-hover transition-colors duration-fast ease-standard"
            >
              Ajouter
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}