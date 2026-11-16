import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Car,
  Eye,
  Link2,
  CheckCircle2,
  XCircle,
  Trash2,
  CreditCard,
  ChevronRight,
  ChevronLeft,
  Check,
  MapPin,
  Hash,
  Cpu,
  Wifi,
  Server as ServerIcon,
  Calendar,
  Download,
  Ban,
  Settings,
  Gauge,
  Fuel,
  Thermometer,
  Activity,
  Navigation,
  Smartphone } from
'lucide-react';
import { Modal } from '../components/Modal';
import { TableExportButtons } from '../components/TableExportButtons';
import { PeriodKey } from '../components/PeriodFilter';
import { ClientsFilterBar } from '../components/ClientsFilterBar';
import { SimIccidPicker, type SimCreateContext } from '../components/SimIccidPicker';
import { useFleetStore, type ClientProfile, type FleetClient, type FleetEquipment } from '../state/FleetStore';
import { useBackofficePermissions } from '../hooks/useBackofficePermissions';
import {
  getVisibleClients,
  getVisibleEquipments,
  isStockClientName
} from '../utils/fleetVisibility';
import { exportClientsToExcel, exportClientsToPdf } from '../utils/clientTableExport';
import { useSearchParams } from 'react-router-dom';
import { CalendarDays, ChevronDown, ChevronUp, GitCompareArrows, WifiOff } from 'lucide-react';
import { ClientFiche, type FicheTab } from '../components/clients/ClientFiche';
import { ClientsOverview, type CompareCounts } from '../components/clients/ClientsOverview';
import { ClientsActivity } from '../components/clients/ClientsActivity';
import { DetailModal, type DetailSpec } from '../components/dashboard/DetailModal';
import { BellMenu } from '../components/dashboard/BellMenu';
import { PageChrome, PageShell } from '../components/shell/PageShell';
import { Button } from '../components/ui/Button';
import { StatusTag, StatusTagFromLabel } from '../components/ui/StatusTag';
import type { TodoItem } from '../utils/dashboardKpis';
import { addDays, daysBetween, parseDate, startOfDay, toIsoDate } from '../state/mock/dates';
import {
  ALERT_KEYS,
  computeClients,
  countsAt,
  DELAY_OPTIONS,
  fmt,
  frIso,
  ownerKey,
  ownerLabel,
  pct,
  type AlertKey,
  type DelayDays
} from '../utils/clientsKpis';
import {
  applyClientBlock,
  applyPaymentValidation,
  BLOCK_REASON_LABELS,
  validatePaymentExpiry,
  type BlockReason
} from '../utils/clientPayment';
import {
  emptyClientForm,
  renameClientReferences,
  validateClientForm,
  type ClientForm
} from '../utils/clientForm';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
// Fix for default marker icon in react-leaflet
const customMarkerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl:
  'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function getPeriodRange(
  period: PeriodKey,
  start: string,
  end: string
): { from: Date; to: Date } {
  const now = new Date();
  const to = new Date(now);
  to.setHours(23, 59, 59, 999);
  let from = new Date(now);
  from.setHours(0, 0, 0, 0);
  switch (period) {
    case '7d':
      from.setDate(from.getDate() - 6);
      break;
    case '30d':
      from.setDate(from.getDate() - 29);
      break;
    case '3m':
      from.setMonth(from.getMonth() - 3);
      break;
    case 'custom':
      if (start) from = new Date(start);
      if (end) {
        to.setTime(new Date(end).getTime());
        to.setHours(23, 59, 59, 999);
      }
      break;
    default:
      break;
  }
  return { from, to };
}

function isDateInRange(dateStr: string, from: Date, to: Date): boolean {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return true;
  return d >= from && d <= to;
}

function parseEquipmentLastConnection(eq: FleetEquipment): Date | null {
  const dateLocal = eq.lastPosition?.dateLocal;
  if (typeof dateLocal === 'string' && dateLocal.trim()) {
    const m = dateLocal.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/);
    if (m) {
      return new Date(+m[3], +m[2] - 1, +m[1], +m[4], +m[5], +m[6]);
    }
    const parsed = new Date(dateLocal.replace(' ', 'T'));
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  if (eq.firstSendDate?.trim()) {
    const d = new Date(eq.firstSendDate);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}

function formatClientLastConnection(date: Date | null | undefined): string {
  if (!date) return <span className="text-text-muted italic text-mention">—</span>;
  return (
    <span className="text-small text-text tabular-nums">
      {date.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}
    </span>
  );
}

function enrichClientForModal(c: FleetClient, profiles: Record<number, ClientProfile>) {
  const profile = profiles[c.id];
  if (profile) {
    return {
      ...profile,
      ...c,
      vehicleLimit: c.vehicleLimit ?? -1
    };
  }
  return {
    ...c,
    website: '',
    formula: '',
    abonnement: '',
    timezone: 'UTC+1',
    address: '',
    tel2: '',
    email2: '',
    accountLimit: 10,
    username: ''
  };
}

/* FleetIQ 06 – Gestion Clients v3 : libellés du filtre « À traiter » et du « Comparer » */
const ALERT_LABELS: Record<AlertKey, (delay: number, grace: number) => string> = {
  blocage: (_d, g) => `Bloqués dans ≤ ${g} j (A-04)`,
  echeance: (d) => `Échéance ≤ ${d} j (A-01)`,
  relance: (d) => `Sans connexion > ${d} j (A-02)`,
  jamais: () => 'Équipements jamais connectés (A-04)'
};
type CompareMode = 'm30' | 'y1' | 'custom';
const PAGE_SIZES = [5, 10, 25, 50] as const;

// FleetIQ 05 : les données fictives (fiches clients, véhicules, équipements) viennent de FleetStore

const STEPS = [
{
  id: 1,
  label: 'Général'
},
{
  id: 2,
  label: 'Contact'
},
{
  id: 3,
  label: 'Configuration'
},
{
  id: 4,
  label: 'Compte'
}];

const FLEETIQ_ABONNEMENTS = ['FleetIQ Secure', 'FleetIQ Pro', 'FleetIQ Mechanics', 'FleetIQ Vision'] as const;

function InstallPlateSelect({
  value,
  onChange,
  plates




}: {value: string;onChange: (v: string) => void;plates: string[];}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
      containerRef.current &&
      !containerRef.current.contains(e.target as Node))
      {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const filtered = plates.filter((p) =>
  p.toLowerCase().includes(query.toLowerCase())
  );
  const showAddOption =
  query.trim() !== '' &&
  !plates.some((p) => p.toLowerCase() === query.trim().toLowerCase());
  return (
    <div ref={containerRef} className="relative">
      <div
        onClick={() => {
          setIsOpen(true);
          setQuery('');
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
        className={`w-full flex items-center justify-between px-3 py-2 border rounded-card text-small cursor-pointer transition-shadow ${isOpen ? 'border-primary ring-2 ring-primary' : 'border-border hover:border-text'}`}>
        
        <span className={value ? 'text-text' : 'text-text-muted'}>
          {value || 'Sélectionner une immatriculation...'}
        </span>
        <Car size={16} className="text-text-muted shrink-0" />
      </div>

      {isOpen &&
      <div className="absolute z-50 mt-1 w-full bg-surface border border-border rounded-card shadow-raised overflow-hidden">
          <div className="p-2 border-b border-border-subtle">
            <div className="relative">
              <Search
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted"
              size={14} />
            
              <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher ou saisir une nouvelle..."
              className="w-full pl-8 pr-3 py-1.5 bg-surface-muted border border-border-strong rounded-control text-small text-text focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus focus-visible:border-primary transition-shadow" />
            
            </div>
          </div>
          <div className="max-h-44 overflow-y-auto">
            {filtered.map((plate) =>
          <button
            key={plate}
            type="button"
            onClick={() => {
              onChange(plate);
              setIsOpen(false);
              setQuery('');
            }}
            className={`w-full text-left px-3 py-2 text-small transition-colors duration-fast ease-standard flex items-center justify-between ${value === plate ? 'bg-primary-50 text-primary font-medium' : 'text-text hover:bg-surface-muted'}`}>
            
                <span className="flex items-center gap-2">
                  <Car size={14} className="text-text-muted" />
                  {plate}
                </span>
                {value === plate &&
            <CheckCircle2 size={14} className="text-primary" />
            }
              </button>
          )}
            {showAddOption &&
          <button
            type="button"
            onClick={() => {
              onChange(query.trim());
              setIsOpen(false);
              setQuery('');
            }}
            className="w-full text-left px-3 py-2 text-small text-success-700 hover:bg-success-50 transition-colors duration-fast ease-standard flex items-center gap-2 border-t border-border-subtle">
            
                <Plus size={14} className="text-success" />
                Ajouter "<strong>{query.trim()}</strong>"
              </button>
          }
            {filtered.length === 0 && !showAddOption &&
          <div className="px-3 py-4 text-center text-small text-text-muted">
                Aucune immatriculation trouvée
              </div>
          }
          </div>
        </div>
      }
    </div>);

}
export function ClientsPage() {
  const {
    currentUserRole,
    currentUserName,
    clients: storeClients,
    setClients,
    equipments,
    setEquipments,
    simCards,
    setSimCards,
    simOffers,
    setSimOffers,
    clientProfiles,
    setClientProfiles,
    setInterventions,
    mockToday,
    vehicles: storeVehicles,
    packs,
    userConnections,
    offerChanges,
    simConsumption,
    disconnectThresholdHours,
    dashboardSettings
  } = useFleetStore();
  const permissions = useBackofficePermissions();
  const canSeeCommercial = permissions?.clients.canSeeCommercialBlocks ?? false;
  const canSeePrices = permissions?.canSeePrices ?? false;
  const [searchParams, setSearchParams] = useSearchParams();

  const buildSimCreateContext = (clientName: string, reseller: string): SimCreateContext => ({
    clientName,
    reseller
  });
  const simOfferById = useMemo(() => new Map(simOffers.map((o) => [o.id, o])), [simOffers]);
  const isResellerUser = currentUserRole === 'Revendeur';
  const isTunavUser = currentUserRole === 'Tunav';
  // Main Table State
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expiryFilterEnabled, setExpiryFilterEnabled] = useState(false);
  const [periodFilter, setPeriodFilter] = useState<PeriodKey>('30d');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  // Multi-step Add/Edit Modal State
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [editAbonnement, setEditAbonnement] = useState<string>(FLEETIQ_ABONNEMENTS[0]);
  const [currentStep, setCurrentStep] = useState(1);
  const [clientType, setClientType] = useState<'Simple' | 'Revendeur'>('Simple');
  // FleetIQ 06 – fiche client unique (CLI-F-01), état de la page v3
  const [fiche, setFiche] = useState<{ id: number; tab: FicheTab } | null>(null);
  const realToday = useMemo(() => startOfDay(new Date()), []);
  const [asOfIso, setAsOfIso] = useState(toIsoDate(realToday));
  const asOf = parseDate(asOfIso) ?? realToday;
  const [compareOn, setCompareOn] = useState(false);
  const [compareMode, setCompareMode] = useState<CompareMode>('m30');
  const [compareCustom, setCompareCustom] = useState(toIsoDate(addDays(realToday, -90)));
  const [delay, setDelay] = useState<DelayDays>(30);
  const [alertFilter, setAlertFilter] = useState<AlertKey | null>(null);
  const [ownerFilter, setOwnerFilter] = useState('');
  const [packFilter, setPackFilter] = useState('');
  const [connFilter, setConnFilter] = useState('');
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<DetailSpec | null>(null);
  const [bellOpen, setBellOpen] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);
  // Vehicles Modal State
  const [allVehicles, setAllVehicles] = useState<any[]>(storeVehicles);
  const [isVehiclesModalOpen, setIsVehiclesModalOpen] = useState(false);
  const [clientForVehicles, setClientForVehicles] = useState<any>(null);
  const [clientVehicles, setClientVehicles] = useState<any[]>([]);
  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [clientForPayment, setClientForPayment] = useState<any>(null);
  // FleetIQ 13 (B7) : paiement / blocage enregistrés dans FleetStore (même règle que Packs, utils/clientPayment.ts)
  const [paymentExpiry, setPaymentExpiry] = useState('');
  const [blockReasonChoice, setBlockReasonChoice] = useState<BlockReason>('paiement');
  const [clientForm, setClientForm] = useState<ClientForm>(emptyClientForm);
  const [clientFormError, setClientFormError] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const mockTodayIso = toIsoDate(startOfDay(mockToday));
  // Add Vehicle Modal State
  const [isAddVehicleModalOpen, setIsAddVehicleModalOpen] = useState(false);
  const [newVehiclePlate, setNewVehiclePlate] = useState('');
  // Assign Equipment Modal State
  const [isAssignEquipmentModalOpen, setIsAssignEquipmentModalOpen] =
  useState(false);
  const [vehicleToAssign, setVehicleToAssign] = useState<any>(null);
  const [selectedEquipmentSerial, setSelectedEquipmentSerial] = useState('');
  // Equipment search state
  const [equipmentSearchQuery, setEquipmentSearchQuery] = useState('');
  // Form States for Limits Step
  const [vehicleLimitType, setVehicleLimitType] = useState('authorized');
  const [accountLimitType, setAccountLimitType] = useState('authorized');
  // Edit Equipment Modal State
  const [isEditEquipmentModalOpen, setIsEditEquipmentModalOpen] =
  useState(false);
  const [equipmentToEdit, setEquipmentToEdit] = useState<any>(null);
  // Install Equipment Modal State
  const [isInstallEquipmentModalOpen, setIsInstallEquipmentModalOpen] =
  useState(false);
  const [vehicleToInstall, setVehicleToInstall] = useState<any>(null);
  const [installPlate, setInstallPlate] = useState('');
  // View Equipment Details Modal State
  const [isViewEquipmentModalOpen, setIsViewEquipmentModalOpen] =
  useState(false);
  const [equipmentToView, setEquipmentToView] = useState<any>(null);
  const [showPositionMap, setShowPositionMap] = useState(false);
  // Configuration Modal State
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [vehicleToConfig, setVehicleToConfig] = useState<any>(null);
  const [configLog, setConfigLog] = useState('desactiver');
  const [configIButton, setConfigIButton] = useState(true);
  const [configAAD, setConfigAAD] = useState('');
  const [configCalcStat, setConfigCalcStat] = useState(false);
  const [configDupPos, setConfigDupPos] = useState(false);
  const [configDupSerial, setConfigDupSerial] = useState('');
  // --- Handlers ---
  const openAddEditModal = (client: any = null) => {
    setSelectedClient(client);
    const nextAbonnement =
    client?.abonnement && FLEETIQ_ABONNEMENTS.includes(client.abonnement as (typeof FLEETIQ_ABONNEMENTS)[number]) ?
    client.abonnement :
    FLEETIQ_ABONNEMENTS[0];
    setEditAbonnement(nextAbonnement);
    setCurrentStep(1);
    setClientType(isResellerUser ? 'Simple' : client?.type === 'Revendeur' ? 'Revendeur' : 'Simple');
    // FleetIQ 13 : formulaire contrôlé, pré-rempli depuis FleetStore (fiche + client)
    const vehicleUnlimited = client ? client.vehicleLimit == null || client.vehicleLimit < 0 : false;
    const accountUnlimited = client ? client.accountLimit == null || client.accountLimit < 0 : false;
    setClientForm(
      client
        ? {
            ...emptyClientForm(),
            name: client.name ?? '',
            expiry: client.expiry ?? '',
            website: client.website ?? '',
            timezone: client.timezone || 'UTC+1',
            address: client.address ?? '',
            tel: client.tel ?? '',
            email: client.email ?? '',
            tel2: client.tel2 ?? '',
            email2: client.email2 ?? '',
            vehicleUnlimited,
            vehicleLimit: vehicleUnlimited ? '' : String(client.vehicleLimit),
            accountUnlimited,
            accountLimit: accountUnlimited ? '' : String(client.accountLimit),
            username: client.username ?? ''
          }
        : emptyClientForm()
    );
    setClientFormError(null);
    setVehicleLimitType(vehicleUnlimited ? 'unlimited' : 'authorized');
    setAccountLimitType(accountUnlimited ? 'unlimited' : 'authorized');
    setIsAddEditModalOpen(true);
  };
  const setFormField = <K extends keyof ClientForm>(key: K, value: ClientForm[K]) => {
    setClientForm((f) => ({ ...f, [key]: value }));
    setClientFormError(null);
  };
  // FleetIQ 13 (B7) : « Enregistrer » ajoute ou modifie le client dans FleetStore (Clients, Packs, Tableau de bord)
  const saveClientForm = () => {
    const form: ClientForm = {
      ...clientForm,
      vehicleUnlimited: vehicleLimitType === 'unlimited',
      accountUnlimited: accountLimitType === 'unlimited'
    };
    const editingId: number | null = selectedClient?.id ?? null;
    const error = validateClientForm(form, {
      isNew: editingId == null,
      clientType,
      editingId,
      clients: storeClients,
      todayIso: mockTodayIso
    });
    if (error) {
      setClientFormError(error.message);
      if (visibleSteps.some((s) => s.id === error.step)) setCurrentStep(error.step);
      return;
    }
    const name = form.name.trim();
    const vehicleLimit = clientType === 'Revendeur' || form.vehicleUnlimited ? null : parseInt(form.vehicleLimit, 10);
    const accountLimit = clientType === 'Revendeur' || form.accountUnlimited ? -1 : parseInt(form.accountLimit, 10);
    const id = editingId ?? storeClients.reduce((m, c) => Math.max(m, c.id), 0) + 1;
    const previous = editingId != null ? storeClients.find((c) => c.id === editingId) : undefined;
    const previousProfile = clientProfiles[id];
    const profile: ClientProfile = {
      website: form.website.trim(),
      formula: previousProfile?.formula ?? '',
      abonnement: editingId != null ? editAbonnement : previousProfile?.abonnement ?? '',
      timezone: form.timezone,
      address: form.address.trim(),
      tel2: form.tel2.trim(),
      email2: form.email2.trim(),
      accountLimit,
      username: form.username.trim()
    };
    if (previous) {
      const rename = previous.name !== name ? renameClientReferences(previous.name, name) : null;
      setClients((prev) =>
        (rename ? rename.clients(prev) : prev).map((c) =>
          c.id === previous.id
            ? {
                ...c,
                name,
                type: clientType,
                email: form.email.trim(),
                tel: form.tel.trim(),
                expiry: form.expiry,
                vehicleLimit,
                packs: form.expiry !== c.expiry ? c.packs.map((a) => ({ ...a, expiresAt: form.expiry })) : c.packs
              }
            : c
        )
      );
      if (rename) {
        setEquipments(rename.equipments);
        setSimCards(rename.simCards);
        setInterventions(rename.interventions);
      }
    } else {
      const created: FleetClient = {
        id,
        name,
        type: clientType,
        // Revendeur : le client lui appartient ; Tunav : client direct
        reseller: isResellerUser ? currentUserName : 'Tunav',
        email: form.email.trim(),
        tel: form.tel.trim(),
        expiry: form.expiry,
        status: 'Active',
        vehicleLimit,
        packs: [],
        createdAt: mockTodayIso,
        blockedAt: null,
        blockReason: null,
        accountsUsed: 0
      };
      setClients((prev) => [...prev, created]);
    }
    setClientProfiles((prev) => ({ ...prev, [id]: profile }));
    setIsAddEditModalOpen(false);
    setSaveNotice(previous ? `Client « ${name} » modifié.` : `Client « ${name} » ajouté.`);
  };
  const openFiche = (clientId: number, tab: FicheTab = 'synthese') => setFiche({ id: clientId, tab });
  const openClientEquipmentsModal = (client: FleetClient) => {
    setClientForVehicles(client);
    setIsVehiclesModalOpen(true);
  };

  const clientAssignedEquipments = useMemo(() => {
    if (!clientForVehicles?.name) return [];
    return equipments.filter(
      (e) => e.client === clientForVehicles.name && !e.client.endsWith('_Stock')
    );
  }, [equipments, clientForVehicles?.name]);

  // Équipements proposés dans « Affecter un équipement » : le stock (FleetStore), N° de série + modèle
  const assignableEquipments = useMemo(
    () => equipments.filter((e) => isStockClientName(e.client)).map((e) => ({ serial: e.serial, type: e.type })),
    [equipments]
  );

  const installedCountByClient = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of equipments) {
      if (e.isInstalled && !e.client.endsWith('_Stock')) {
        m.set(e.client, (m.get(e.client) ?? 0) + 1);
      }
    }
    return m;
  }, [equipments]);

  const [clientEquipmentToInstall, setClientEquipmentToInstall] = useState<FleetEquipment | null>(null);
  const [clientInstallPlate, setClientInstallPlate] = useState('');
  const [clientInstallSimId, setClientInstallSimId] = useState<number | null>(null);
  const [clientInstallError, setClientInstallError] = useState<string | null>(null);
  const [isClientInstallOpen, setIsClientInstallOpen] = useState(false);

  const [clientEquipmentForSimEdit, setClientEquipmentForSimEdit] = useState<FleetEquipment | null>(null);
  const [clientEditSimId, setClientEditSimId] = useState<number | null>(null);
  const [isClientEditSimOpen, setIsClientEditSimOpen] = useState(false);

  const availableSimsForEquipment = (eq: FleetEquipment) => {
    const stock = isStockClientName(eq.client);
    return simCards.filter((s) => {
      if (s.equipmentId === eq.id) return true;
      if (s.equipmentId != null) return false;
      if (stock) {
        return s.client === eq.client || s.reseller === eq.reseller;
      }
      return s.client === eq.client;
    });
  };

  const currentSimIdForEquipment = (eq: FleetEquipment) => {
    const current =
      simCards.find((s) => s.equipmentId === eq.id) ??
      simCards.find((s) => s.iccid && s.iccid === eq.iccid);
    return current?.id ?? null;
  };

  const clientInstallAvailableSims = useMemo(() => {
    if (!clientEquipmentToInstall) return [];
    return availableSimsForEquipment(clientEquipmentToInstall);
  }, [simCards, clientEquipmentToInstall]);

  const clientEditSimAvailableSims = useMemo(() => {
    if (!clientEquipmentForSimEdit) return [];
    return availableSimsForEquipment(clientEquipmentForSimEdit);
  }, [simCards, clientEquipmentForSimEdit]);

  const clientInstallPlateOptions = useMemo(() => {
    const clientName = clientEquipmentToInstall?.client;
    if (!clientName) return [];
    const plates = new Set<string>();
    for (const e of equipments) {
      if (e.client !== clientName) continue;
      const plate = typeof e.car === 'string' ? e.car.trim() : '';
      if (!plate || plate === 'Unassigned') continue;
      plates.add(plate);
    }
    return Array.from(plates).sort((a, b) => a.localeCompare(b));
  }, [equipments, clientEquipmentToInstall?.client]);

  const openClientEquipmentInstall = (eq: FleetEquipment) => {
    const c = storeClients.find((x) => x.name === eq.client);
    const limit = c?.vehicleLimit;
    const installed = installedCountByClient.get(eq.client) ?? 0;
    if (typeof limit === 'number' && limit >= 0 && installed >= limit) {
      window.alert(`Limite atteinte: ${installed}/${limit} véhicules installés.`);
      return;
    }
    setClientEquipmentToInstall(eq);
    setClientInstallPlate(eq.car && eq.car !== 'Unassigned' ? eq.car : '');
    setClientInstallSimId(currentSimIdForEquipment(eq));
    setClientInstallError(null);
    setIsClientInstallOpen(true);
  };

  const confirmClientEquipmentInstall = () => {
    if (!clientEquipmentToInstall) return;
    const plate = clientInstallPlate.trim();
    if (!plate) {
      setClientInstallError('Veuillez saisir une immatriculation.');
      return;
    }
    const eqId = clientEquipmentToInstall.id;
    const selectedSim =
      clientInstallSimId != null ? simCards.find((s) => s.id === clientInstallSimId) : undefined;
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
        if (s.equipmentId === eqId && s.id !== clientInstallSimId) {
          return { ...s, equipmentId: undefined };
        }
        if (clientInstallSimId != null && s.id === clientInstallSimId) {
          return {
            ...s,
            equipmentId: eqId,
            client: clientEquipmentToInstall.client,
            reseller: clientEquipmentToInstall.reseller
          };
        }
        return s;
      })
    );
    setIsClientInstallOpen(false);
    setClientEquipmentToInstall(null);
    setClientInstallSimId(null);
  };

  const openClientEquipmentEditSim = (eq: FleetEquipment) => {
    setClientEquipmentForSimEdit(eq);
    setClientEditSimId(currentSimIdForEquipment(eq));
    setIsClientEditSimOpen(true);
  };

  const confirmClientEquipmentEditSim = () => {
    if (!clientEquipmentForSimEdit) return;
    const eq = clientEquipmentForSimEdit;
    const eqId = eq.id;
    const selectedSim =
      clientEditSimId != null ? simCards.find((s) => s.id === clientEditSimId) : undefined;
    setEquipments((prev) =>
      prev.map((e) =>
        e.id === eqId
          ? {
              ...e,
              ...(selectedSim
                ? {
                    sim: selectedSim.phoneNumber,
                    simCallNumber: selectedSim.phoneNumber,
                    iccid: selectedSim.iccid
                  }
                : { sim: '', simCallNumber: '', iccid: '' })
            }
          : e
      )
    );
    setSimCards((prev) =>
      prev.map((s) => {
        if (s.equipmentId === eqId && s.id !== clientEditSimId) {
          return { ...s, equipmentId: undefined };
        }
        if (clientEditSimId != null && s.id === clientEditSimId) {
          return {
            ...s,
            equipmentId: eqId,
            client: eq.client,
            reseller: eq.reseller
          };
        }
        return s;
      })
    );
    setIsClientEditSimOpen(false);
    setClientEquipmentForSimEdit(null);
    setClientEditSimId(null);
  };

  const uninstallClientEquipment = (eq: FleetEquipment) => {
    setEquipments((prev) =>
      prev.map((e) => (e.id === eq.id ? { ...e, isInstalled: false, car: 'Unassigned' } : e))
    );
  };
  const toggleVehicleStatus = (vehicleId: number, status: boolean) => {
    const updateFn = (prev: any[]) =>
    prev.map((v) =>
    v.id === vehicleId ?
    {
      ...v,
      isInstalled: status
    } :
    v
    );
    setClientVehicles(updateFn);
    setAllVehicles(updateFn);
  };
  const deleteVehicle = (vehicleId: number) => {
    setClientVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
    setAllVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
  };
  const openPaymentModal = (client: any) => {
    setClientForPayment(client);
    setPaymentExpiry('');
    setBlockReasonChoice('paiement');
    setIsPaymentModalOpen(true);
  };
  const paymentError = clientForPayment ? validatePaymentExpiry(paymentExpiry, mockTodayIso) : null;
  const canManagePayment = permissions?.clients.canManagePayment ?? false;
  const handleValidatePayment = () => {
    if (!clientForPayment || paymentError || !canManagePayment) return;
    setClients((prev) => prev.map((c) => (c.id === clientForPayment.id ? applyPaymentValidation(c, paymentExpiry) : c)));
    setIsPaymentModalOpen(false);
    setSaveNotice(`Paiement validé pour « ${clientForPayment.name} » : expiration au ${frIso(paymentExpiry)}.`);
  };
  const handleBlockClient = () => {
    if (!clientForPayment || !canManagePayment) return;
    setClients((prev) =>
      prev.map((c) => (c.id === clientForPayment.id ? applyClientBlock(c, mockTodayIso, blockReasonChoice) : c))
    );
    setIsPaymentModalOpen(false);
    setSaveNotice(`Client « ${clientForPayment.name} » bloqué (${BLOCK_REASON_LABELS[blockReasonChoice].toLowerCase()}).`);
  };
  const openAddVehicleModal = () => {
    setNewVehiclePlate('');
    setIsAddVehicleModalOpen(true);
  };
  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehiclePlate.trim() || !clientForVehicles) return;
    const newVehicle = {
      id: Date.now(),
      clientId: clientForVehicles.id,
      plate: newVehiclePlate,
      equipment: '-',
      isInstalled: false,
      expiry: clientForVehicles.expiry
    };
    setClientVehicles((prev) => [...prev, newVehicle]);
    setAllVehicles((prev) => [...prev, newVehicle]);
    setIsAddVehicleModalOpen(false);
  };
  const openAssignEquipmentModal = (vehicle: any) => {
    setVehicleToAssign(vehicle);
    setSelectedEquipmentSerial(
      vehicle.equipment !== '-' ? vehicle.equipment : ''
    );
    setEquipmentSearchQuery('');
    setIsAssignEquipmentModalOpen(true);
  };
  const handleAssignEquipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleToAssign) return;
    const updateFn = (prev: any[]) =>
    prev.map((v) =>
    v.id === vehicleToAssign.id ?
    {
      ...v,
      equipment: selectedEquipmentSerial || '-'
    } :
    v
    );
    setClientVehicles(updateFn);
    setAllVehicles(updateFn);
    setIsAssignEquipmentModalOpen(false);
  };
  const openEditEquipmentModal = (vehicle: any) => {
    const eqSerial = vehicle.equipment;
    if (eqSerial && eqSerial !== '-') {
      const eqData = equipments.find((x) => x.serial === eqSerial) || {
        serial: eqSerial,
        type: '',
        sim: '',
        simCallNumber: '',
        iccid: '',
        server: '',
        port: '',
        isInstalled: vehicle.isInstalled,
        firstSendDate: '',
        contractDate: ''
      };
      setEquipmentToEdit(eqData);
    } else {
      setEquipmentToEdit(null);
    }
    setIsEditEquipmentModalOpen(true);
  };
  // Install Equipment Handler
  const openInstallEquipmentModal = (vehicle: any) => {
    setVehicleToInstall(vehicle);
    setInstallPlate(vehicle.plate);
    setIsInstallEquipmentModalOpen(true);
  };
  const handleInstallEquipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleToInstall || !installPlate.trim()) return;
    const updateFn = (prev: any[]) =>
    prev.map((v) =>
    v.id === vehicleToInstall.id ?
    {
      ...v,
      plate: installPlate,
      isInstalled: true
    } :
    v
    );
    setClientVehicles(updateFn);
    setAllVehicles(updateFn);
    setIsInstallEquipmentModalOpen(false);
  };
  const openViewEquipmentDetailsModal = (vehicle: any) => {
    const eqSerial = vehicle.equipment;
    if (eqSerial && eqSerial !== '-') {
      const eqData = equipments.find((x) => x.serial === eqSerial) || {
        serial: eqSerial,
        type: '',
        sim: '',
        simCallNumber: '',
        iccid: '',
        server: '',
        port: '',
        isInstalled: vehicle.isInstalled,
        firstSendDate: '',
        contractDate: ''
      };
      setEquipmentToView(eqData);
    } else {
      setEquipmentToView(null);
    }
    setShowPositionMap(false);
    setIsViewEquipmentModalOpen(true);
  };

  const openClientAssignedEquipmentDetails = (eq: FleetEquipment) => {
    setEquipmentToView(eq);
    setShowPositionMap(false);
    setIsViewEquipmentModalOpen(true);
  };

  const openConfigModal = (vehicle: any) => {
    setVehicleToConfig(vehicle);
    // Reset config states to default
    setConfigLog('desactiver');
    setConfigIButton(true);
    setConfigAAD('');
    setConfigCalcStat(false);
    setConfigDupPos(false);
    setConfigDupSerial('');
    setIsConfigModalOpen(true);
  };
  const visibleEquipments = useMemo(
    () => getVisibleEquipments(equipments, currentUserRole, currentUserName),
    [equipments, currentUserRole, currentUserName]
  );

  const equipmentStats = useMemo(() => {
    const simpleByClient = new Map<string, { installed: number; total: number }>();
    const resellerTotals = new Map<string, number>();
    const lastConnectionByClient = new Map<string, Date>();

    const registerLastConnection = (key: string, at: Date) => {
      const cur = lastConnectionByClient.get(key);
      if (!cur || at > cur) lastConnectionByClient.set(key, at);
    };

    for (const e of visibleEquipments) {
      const lastAt = parseEquipmentLastConnection(e);

      if (e.reseller) {
        resellerTotals.set(e.reseller, (resellerTotals.get(e.reseller) ?? 0) + 1);
        if (lastAt) registerLastConnection(e.reseller, lastAt);
      }

      if (!e.client.endsWith('_Stock') && e.client !== 'Tunav') {
        const cur = simpleByClient.get(e.client) ?? { installed: 0, total: 0 };
        cur.total += 1;
        if (e.isInstalled) cur.installed += 1;
        simpleByClient.set(e.client, cur);
        if (lastAt) registerLastConnection(e.client, lastAt);
      }
    }
    return { simpleByClient, resellerTotals, lastConnectionByClient };
  }, [visibleEquipments]);

  const visibleClients = useMemo(
    () =>
      getVisibleClients(
        storeClients,
        visibleEquipments,
        currentUserRole,
        currentUserName
      ),
    [storeClients, visibleEquipments, currentUserRole, currentUserName]
  );

  const periodRange = useMemo(
    () => getPeriodRange(periodFilter, periodStart, periodEnd),
    [periodFilter, periodStart, periodEnd]
  );

  /* ---------- FleetIQ 06 : KPI de la page (utils/clientsKpis.ts, IDs CLI-) ---------- */
  const isNetwork = isTunavUser;
  const nowRef = useMemo(() => new Date(), []);
  const kpis = useMemo(
    () =>
      computeClients({
        clients: visibleClients,
        equipments: visibleEquipments,
        userConnections,
        packs,
        offerChanges,
        asOf,
        now: nowRef,
        connHours: disconnectThresholdHours,
        graceDays: dashboardSettings.graceDays,
        delayDays: delay,
        isNetwork
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visibleClients, visibleEquipments, userConnections, packs, offerChanges, asOfIso, nowRef, disconnectThresholdHours, dashboardSettings.graceDays, delay, isNetwork]
  );
  const compareDate =
    compareMode === 'm30' ? addDays(asOf, -30) : compareMode === 'y1' ? addDays(asOf, -365) : parseDate(compareCustom) ?? addDays(asOf, -30);
  const compare: CompareCounts = compareOn
    ? {
        label: compareMode === 'm30' ? 'il y a 30 j' : compareMode === 'y1' ? 'l’an dernier' : compareDate.toLocaleDateString('fr-FR'),
        date: compareDate,
        ...countsAt(visibleClients, compareDate, dashboardSettings.graceDays)
      }
    : null;
  const ownerOptions = useMemo(
    () =>
      Array.from(new Set(visibleClients.map(ownerKey)))
        .sort((a, b) => (a === 'Tunav' ? -1 : b === 'Tunav' ? 1 : a.localeCompare(b)))
        .map((o) => ({ value: o, label: ownerLabel(o) })),
    [visibleClients]
  );
  const packOptions = useMemo(() => packs.map((p) => ({ value: String(p.id), label: p.name })), [packs]);

  /* ---------- paramètres d'URL (liens du Tableau de bord, carte 05) ---------- */
  // ?alerte=blocage|echeance|relance|jamais · ?delai=15|30|60 · ?statut=Active|Blocked · ?pack=<id>|none
  // ?connexion=tous|partiel|aucun · ?proprietaire=<nom> · ?q=<texte> · ?client=<id> (ouvre la fiche)
  useEffect(() => {
    const a = searchParams.get('alerte');
    const d = Number(searchParams.get('delai'));
    const st = searchParams.get('statut');
    const pk = searchParams.get('pack');
    const cx = searchParams.get('connexion');
    const ow = searchParams.get('proprietaire');
    const q = searchParams.get('q');
    const cl = Number(searchParams.get('client'));
    if (!a && !d && !st && !pk && !cx && !ow && !q && !cl) return;
    if (a && (ALERT_KEYS as string[]).includes(a) && (canSeeCommercial || a === 'jamais')) setAlertFilter(a as AlertKey);
    if ((DELAY_OPTIONS as readonly number[]).includes(d)) setDelay(d as DelayDays);
    if (st === 'Active' || st === 'Blocked') setStatusFilter(st);
    if (pk) setPackFilter(pk);
    if (cx === 'tous' || cx === 'partiel' || cx === 'aucun') setConnFilter(cx);
    if (ow && isNetwork) setOwnerFilter(ow);
    if (q) setSearchQuery(q);
    if (cl) setFiche({ id: cl, tab: 'synthese' });
    setPage(1);
    // les filtres sont appliqués une fois, puis l'URL redevient /clients
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams, canSeeCommercial, isNetwork]);

  /** Filtres du tableau sans le filtre « À traiter » (sert aux cartes du haut : « selon filtres actifs ») */
  const baseFiltered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return visibleClients.filter((client) => {
      const info = kpis.infos.get(client.id);
      const matchSearch =
        !q ||
        client.name.toLowerCase().includes(q) ||
        client.email.toLowerCase().includes(q);
      const matchType = typeFilter ? client.type === typeFilter : true;
      const matchStatus = statusFilter ? (statusFilter === 'Active') === !!info?.active : true;
      const matchPeriod =
        !expiryFilterEnabled ||
        isDateInRange(client.expiry, periodRange.from, periodRange.to);
      const matchOwner = !ownerFilter || ownerKey(client) === ownerFilter;
      const matchPack = !packFilter || (packFilter === 'none' ? !client.packs.length : !!info?.packs.some((p) => String(p.packId) === packFilter));
      const matchConn =
        !connFilter ||
        (connFilter === 'aucun'
          ? !info?.assigned
          : connFilter === 'tous'
            ? !!info?.assigned && info.connected === info.assigned
            : !!info?.assigned && info.connected < info.assigned);
      return matchSearch && matchType && matchStatus && matchPeriod && matchOwner && matchPack && matchConn && !!info?.exists;
    });
  }, [visibleClients, kpis, searchQuery, typeFilter, statusFilter, expiryFilterEnabled, periodRange, ownerFilter, packFilter, connFilter]);

  const filteredClients = useMemo(
    () => (alertFilter ? baseFiltered.filter((c) => kpis.alertSets[alertFilter].has(c.id)) : baseFiltered),
    [baseFiltered, alertFilter, kpis]
  );
  useEffect(() => setPage(1), [filteredClients.length, pageSize]);
  const pageCount = Math.max(1, Math.ceil(filteredClients.length / pageSize));
  const pageClients = filteredClients.slice((Math.min(page, pageCount) - 1) * pageSize, Math.min(page, pageCount) * pageSize);

  const hasActiveFilters =
    !!searchQuery.trim() ||
    !!typeFilter ||
    !!statusFilter ||
    expiryFilterEnabled ||
    !!ownerFilter ||
    !!packFilter ||
    !!connFilter ||
    !!alertFilter;

  const activeFilterCount = [
    searchQuery.trim(),
    typeFilter,
    statusFilter,
    expiryFilterEnabled,
    ownerFilter,
    packFilter,
    connFilter,
    alertFilter
  ].filter(Boolean).length;

  const resetFilters = () => {
    setSearchQuery('');
    setTypeFilter('');
    setStatusFilter('');
    setExpiryFilterEnabled(false);
    setPeriodFilter('30d');
    setPeriodStart('');
    setPeriodEnd('');
    setOwnerFilter('');
    setPackFilter('');
    setConnFilter('');
    setAlertFilter(null);
  };

  const scrollToTable = () => window.setTimeout(() => tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  const toggleAlert = (key: AlertKey) => {
    setAlertFilter((cur) => (cur === key ? null : key));
    scrollToTable();
  };

  /* ---------- cloche « À traiter » (mêmes règles que les cartes ; A-04 a en premier) ---------- */
  const bellItems: TodoItem[] = (
    [
      canSeeCommercial && { key: 'blocage', priority: 1, title: `Bloqués dans ≤ ${kpis.graceDays} j`, count: kpis.alerts.blocage.list.length, unit: 'clients', detail: kpis.alerts.blocage.detail },
      canSeeCommercial && { key: 'echeance', priority: 2, title: `Échéance ≤ ${delay} j`, count: kpis.alerts.echeance.list.length, unit: 'clients', detail: kpis.alerts.echeance.detail },
      { key: 'jamais', priority: 2, title: 'Équipements affectés jamais connectés', count: kpis.alerts.jamais.equipments.length, unit: 'équip.', detail: kpis.alerts.jamais.detail },
      canSeeCommercial && { key: 'relance', priority: 3, title: `Sans connexion > ${delay} j`, count: kpis.alerts.relance.list.length, unit: 'clients', detail: kpis.alerts.relance.detail }
    ].filter(Boolean) as Array<{ key: AlertKey; priority: 1 | 2 | 3; title: string; count: number; unit: string; detail: string }>
  )
    .filter((x) => x.count > 0)
    .map((x) => ({
      id: x.key,
      sourceRule: `Gestion Clients ${x.key === 'echeance' ? 'A-01' : x.key === 'relance' ? 'A-02' : 'A-04'}`,
      priority: x.priority,
      title: x.title,
      detail: x.detail,
      count: x.count,
      unit: x.unit,
      what: '',
      route: 'clients',
      routeLabel: 'Gestion Clients'
    }));
  // --- Wizard Navigation ---
  const visibleSteps = useMemo(
    () => (clientType === 'Revendeur' ? STEPS.filter((s) => s.id !== 3) : STEPS),
    [clientType]
  );
  const currentStepIdx = Math.max(
    0,
    visibleSteps.findIndex((s) => s.id === currentStep)
  );
  const nextStep = () =>
    setCurrentStep(visibleSteps[Math.min(currentStepIdx + 1, visibleSteps.length - 1)]?.id ?? 1);
  const prevStep = () => setCurrentStep(visibleSteps[Math.max(currentStepIdx - 1, 0)]?.id ?? 1);

  useEffect(() => {
    // If switching to Revendeur while on Configuration step, move back to Contact
    if (clientType === 'Revendeur' && currentStep === 3) setCurrentStep(2);
  }, [clientType, currentStep]);

  useEffect(() => {
    if (isResellerUser && clientType === 'Revendeur') setClientType('Simple');
  }, [isResellerUser, clientType]);

  const exportFilteredExcel = () =>
    exportClientsToExcel(filteredClients, equipmentStats);
  const exportFilteredPdf = () => exportClientsToPdf(filteredClients, equipmentStats);

  const ficheInfo = fiche ? kpis.infos.get(fiche.id) ?? null : null;
  const thCls = 'h-row-head px-3 text-left text-overline uppercase text-text bg-surface-muted border-b border-border-strong whitespace-nowrap';
  const dateFr = realToday.toLocaleDateString('fr-FR');
  const bell = (
    <BellMenu
      items={bellItems}
      open={bellOpen}
      onToggle={setBellOpen}
      onOpenItem={(t) => {
        setBellOpen(false);
        toggleAlert(t.id as AlertKey);
      }}
      canOpen={() => false}
    />
  );

  return (
    <PageShell
      header={
        <PageChrome
          title="Gestion Clients"
          date={dateFr}
          actions={
            <>
              <TableExportButtons
                size="compact"
                onExportExcel={exportFilteredExcel}
                onExportPdf={exportFilteredPdf}
                disabled={filteredClients.length === 0}
              />
              {permissions?.clients.canAddEdit && (
                <Button type="button" variant="primary" onClick={() => openAddEditModal()}>
                  <Plus size={16} aria-hidden="true" />
                  Ajouter un client
                </Button>
              )}
            </>
          }
          bell={bell}
          tools={
            <>
              <label className="inline-flex items-center gap-2 text-label text-text">
                <CalendarDays size={16} aria-hidden="true" className="text-text-muted" />
                État au
                <input
                  type="date"
                  lang="fr"
                  value={asOfIso}
                  max={toIsoDate(realToday)}
                  onChange={(e) => setAsOfIso(e.target.value || toIsoDate(realToday))}
                  className="h-control px-2 border border-border-strong rounded-control text-small bg-surface focus-visible:outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-focus/25"
                />
              </label>
              <Button type="button" variant="neutral" onClick={() => setAsOfIso(toIsoDate(realToday))}>
                Aujourd’hui
              </Button>
              <span className="hidden sm:block h-6 w-px bg-border" aria-hidden="true" />
              <Button
                type="button"
                variant={compareOn ? 'primary' : 'secondary'}
                aria-pressed={compareOn}
                onClick={() => setCompareOn((v) => !v)}
              >
                <GitCompareArrows size={16} aria-hidden="true" />
                Comparer
              </Button>
              {compareOn && (
                <>
                  <select
                    value={compareMode}
                    onChange={(e) => setCompareMode(e.target.value as CompareMode)}
                    aria-label="Date de comparaison"
                    className="h-control px-2 border border-border-strong rounded-control text-small bg-surface focus-visible:outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-focus/25"
                  >
                    <option value="m30">Il y a 30 jours</option>
                    <option value="y1">Même date l’an dernier</option>
                    <option value="custom">Date personnalisée</option>
                  </select>
                  {compareMode === 'custom' && (
                    <input
                      type="date"
                      lang="fr"
                      aria-label="Date personnalisée"
                      value={compareCustom}
                      max={asOfIso}
                      onChange={(e) => setCompareCustom(e.target.value)}
                      className="h-control px-2 border border-border-strong rounded-control text-small bg-surface focus-visible:outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-focus/25"
                    />
                  )}
                </>
              )}
            </>
          }
        />
      }
    >
      {saveNotice && (
        <div
          role="status"
          className="flex items-start justify-between gap-3 rounded-control border border-success-200 bg-success-50 px-4 py-3 text-small text-success-700"
        >
          <span className="flex items-start gap-2">
            <CheckCircle2 size={16} className="shrink-0 mt-0.5" aria-hidden="true" />
            {saveNotice}{' '}
            {permissions?.routes.subscriptions
              ? 'Les chiffres de Gestion Clients, Packs et du Tableau de bord sont mis à jour'
              : 'Les chiffres de Gestion Clients et du Tableau de bord sont mis à jour'}{' '}
            (maquette : jusqu’au rechargement).
          </span>
          <button
            type="button"
            onClick={() => setSaveNotice(null)}
            aria-label="Fermer le message"
            className="shrink-0 rounded-control px-1 text-success-700 hover:bg-surface focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
          >
            <XCircle size={16} aria-hidden="true" />
          </button>
        </div>
      )}

      <ClientsOverview
        data={kpis}
        isNetwork={isNetwork}
        canSeeCommercial={canSeeCommercial}
        compare={compare}
        delay={delay}
        onDelayChange={setDelay}
        alertFilter={alertFilter}
        onAlertClick={toggleAlert}
        onOpenDetail={setDetail}
        onOwnerClick={(o) => {
          setOwnerFilter(o);
          scrollToTable();
        }}
        onPackClick={(k) => {
          setPackFilter(k);
          scrollToTable();
        }}
        onClientOpen={(id, tab) => openFiche(id, tab ?? 'synthese')}
      />

      {/* CLI-T-01 – Filtres et tableau des clients (panneau DL § 9.7 / 9.8) */}
      <div ref={tableRef} className="bg-surface rounded-card border border-border overflow-hidden scroll-mt-4">
        <ClientsFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          typeFilter={typeFilter}
          onTypeChange={setTypeFilter}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          expiryFilterEnabled={expiryFilterEnabled}
          onExpiryFilterEnabledChange={setExpiryFilterEnabled}
          periodFilter={periodFilter}
          onPeriodChange={setPeriodFilter}
          periodStart={periodStart}
          periodEnd={periodEnd}
          onPeriodStartChange={setPeriodStart}
          onPeriodEndChange={setPeriodEnd}
          activeFilterCount={activeFilterCount}
          hasActiveFilters={hasActiveFilters}
          onReset={resetFilters}
          filteredCount={filteredClients.length}
          totalCount={visibleClients.length}
          ownerFilter={ownerFilter}
          onOwnerChange={isNetwork ? setOwnerFilter : undefined}
          owners={ownerOptions}
          packFilter={packFilter}
          onPackChange={setPackFilter}
          packs={packOptions}
          connFilter={connFilter}
          onConnChange={setConnFilter}
          alertLabel={alertFilter ? ALERT_LABELS[alertFilter](delay, kpis.graceDays) : null}
          onClearAlert={() => setAlertFilter(null)}
        />

        <div className="overflow-x-auto">
          <table className="fiq-table w-full border-collapse text-small text-text min-w-[1100px]">
            <thead>
              <tr>
                <th scope="col" className={thCls}>Client</th>
                <th scope="col" className={thCls}>Revendeur</th>
                <th scope="col" className={thCls}>Type</th>
                <th scope="col" className={thCls}>Pack</th>
                <th scope="col" className={`${thCls} text-right`}>Parc équipements</th>
                <th scope="col" className={`${thCls} text-right`}>Équipements connectés</th>
                <th scope="col" className={thCls}>Dernière connexion</th>
                <th scope="col" className={thCls}>Échéance</th>
                <th scope="col" className={thCls}>Statut</th>
                <th scope="col" className={`${thCls} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageClients.length === 0 && (
                <tr>
                  <td colSpan={10} className="h-row px-3 py-12 text-center text-text-muted">
                    Aucun client ne correspond aux filtres.
                  </td>
                </tr>
              )}
              {pageClients.map((client) => {
                const info = kpis.infos.get(client.id);
                const expanded = expandedId === client.id;
                const dte = info?.daysToExpiry ?? null;
                const rowRail =
                  !info?.active
                    ? 'shadow-rail-danger'
                    : info.blockedInDays != null || (dte != null && dte >= 0 && dte <= delay)
                      ? 'shadow-rail-warning'
                      : '';
                return (
                  <React.Fragment key={client.id}>
                    <tr className="hover:bg-surface-muted transition-colors duration-fast ease-standard">
                      <td className={`h-row px-3 py-1.5 border-b border-border-subtle align-middle font-medium text-text ${rowRail}`}>
                        {permissions?.clients.canViewDetails ? (
                          <button type="button" onClick={() => openFiche(client.id)} className="text-left font-medium text-text hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus rounded-control">
                            {client.name}
                          </button>
                        ) : (
                          client.name
                        )}
                      </td>
                      <td className="h-row px-3 py-1.5 border-b border-border-subtle align-middle text-text">{client.reseller}</td>
                      <td className="h-row px-3 py-1.5 border-b border-border-subtle align-middle">
                        <span
                          className={`inline-flex h-6 px-2 items-center rounded-tag border text-mention font-medium ${client.type === 'Revendeur' ? 'bg-info-50 text-info-700 border-info-200' : 'bg-neutral-50 text-neutral-700 border-neutral-200'}`}
                        >
                          {client.type === 'Revendeur' ? 'Revendeur' : 'Simple'}
                        </span>
                      </td>
                      <td className="h-row px-3 py-1.5 border-b border-border-subtle align-middle">
                        {info?.packs.length ? (
                          <div className="flex flex-col gap-1">
                            {info.packs.map((p) => (
                              <span
                                key={p.packId}
                                className="inline-flex w-fit items-center gap-1 h-6 px-2 rounded-tag border border-primary-200 bg-primary-50 text-primary text-mention font-medium whitespace-nowrap"
                              >
                                {p.name}
                                {client.type !== 'Revendeur' && <span className="text-text-muted font-normal font-qty">{p.equipments} éq.</span>}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-text-muted italic text-mention">Sans pack</span>
                        )}
                      </td>
                      <td className="h-row px-3 py-1.5 border-b border-border-subtle align-middle text-right">
                        {client.type === 'Revendeur' ? (
                          (() => {
                            const total = equipmentStats.resellerTotals.get(client.name) ?? 0;
                            return (
                              <span
                                className={`text-small font-medium font-qty ${total === 0 ? 'text-text-muted italic' : 'text-text'}`}
                                title={`${total} équipement${total > 1 ? 's' : ''} affecté${total > 1 ? 's' : ''} au total`}
                              >
                                {total === 0 ? 'Aucun' : total}
                              </span>
                            );
                          })()
                        ) : (
                          (() => {
                            const stats = equipmentStats.simpleByClient.get(client.name) ?? { installed: 0, total: 0 };
                            if (stats.total === 0) {
                              return <span className="text-text-muted italic text-mention">Aucun équipement</span>;
                            }
                            return (
                              <span
                                className="text-small font-medium font-qty text-text"
                                title={`${stats.installed} installé${stats.installed > 1 ? 's' : ''} sur ${stats.total} affecté${stats.total > 1 ? 's' : ''}`}
                              >
                                <span className="text-success-700">{stats.installed}</span>
                                <span className="text-text-muted mx-1">/</span>
                                <span>{stats.total}</span>
                              </span>
                            );
                          })()
                        )}
                      </td>
                      <td className="h-row px-3 py-1.5 border-b border-border-subtle align-middle text-right">
                        {info && info.assigned > 0 ? (
                          <button
                            type="button"
                            aria-expanded={expanded}
                            onClick={() => setExpandedId(expanded ? null : client.id)}
                            className="text-right w-36 ml-auto focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus rounded-control"
                            title="Voir le détail par équipement"
                          >
                            <span className="inline-flex items-center justify-end gap-1 text-small font-medium font-qty">
                              <span className={info.connected < info.assigned ? 'text-danger-700' : 'text-success-700'}>{fmt(info.connected)}</span>
                              <span className="text-text-muted">/ {fmt(info.assigned)}</span>
                              {expanded ? <ChevronUp size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
                            </span>
                            <span className="mt-1 block h-1.5 rounded-[1px] bg-danger-200 overflow-hidden" aria-hidden="true">
                              <span className="block h-full bg-success rounded-[1px]" style={{ width: `${pct(info.connected, info.assigned)}%` }} />
                            </span>
                            {client.type === 'Revendeur' && <span className="block text-mention text-text-muted text-right">tous ses clients</span>}
                          </button>
                        ) : (
                          <span className="text-text-muted italic text-mention">—</span>
                        )}
                      </td>
                      <td className="h-row px-3 py-1.5 border-b border-border-subtle align-middle">{formatClientLastConnection(equipmentStats.lastConnectionByClient.get(client.name))}</td>
                      <td className="h-row px-3 py-1.5 border-b border-border-subtle align-middle whitespace-nowrap">
                        {frIso(client.expiry)}
                        {info?.blockedInDays != null ? (
                          <span className="ml-2 inline-flex h-6 items-center px-2 rounded-tag border border-danger-200 bg-danger-50 text-danger-700 text-mention font-medium">blocage J-{info.blockedInDays}</span>
                        ) : info?.active && dte != null && dte >= 0 && dte <= delay ? (
                          <span className="ml-2 inline-flex h-6 items-center px-2 rounded-tag border border-warning-200 bg-warning-50 text-warning-700 text-mention font-medium">J-{dte}</span>
                        ) : null}
                      </td>
                      <td className="h-row px-3 py-1.5 border-b border-border-subtle align-middle">
                        {info?.active ? (
                          info.blockedInDays != null ? (
                            <StatusTag label={`Actif · bloqué dans ${info.blockedInDays} j`} family="warning" icon={Eye} />
                          ) : (
                            <StatusTagFromLabel label="Actif" />
                          )
                        ) : (
                          <StatusTagFromLabel label="Bloqué" />
                        )}
                      </td>
                      <td className="h-row px-3 py-1.5 border-b border-border-subtle align-middle text-right">
                        <div className="flex items-center justify-end gap-1">
                          {permissions?.clients.canAddEdit && (
                            <button
                              onClick={() => openAddEditModal(enrichClientForModal(client, clientProfiles))}
                              className="inline-flex h-control-sm w-control-sm items-center justify-center text-text-muted hover:text-text hover:bg-surface-muted rounded-control transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
                              aria-label="Modifier"
                              title="Modifier"
                            >
                              <Edit2 size={16} aria-hidden="true" />
                            </button>
                          )}
                          {permissions?.clients.canViewDetails && (
                            <button
                              onClick={() => openFiche(client.id)}
                              className="inline-flex h-control-sm w-control-sm items-center justify-center text-text-muted hover:text-text hover:bg-surface-muted rounded-control transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
                              aria-label="Voir détails"
                              title="Voir détails"
                            >
                              <Eye size={16} aria-hidden="true" />
                            </button>
                          )}
                          {permissions?.clients.canViewEquipments && (
                            <button
                              onClick={() => openClientEquipmentsModal(client)}
                              className="inline-flex h-control-sm w-control-sm items-center justify-center text-text-muted hover:text-text hover:bg-surface-muted rounded-control transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
                              aria-label="Équipements affectés"
                              title="Équipements affectés"
                            >
                              <Cpu size={16} aria-hidden="true" />
                            </button>
                          )}
                          {permissions?.clients.canManagePayment && (
                            <button
                              onClick={() => openPaymentModal(enrichClientForModal(client, clientProfiles))}
                              className="inline-flex h-control-sm w-control-sm items-center justify-center text-text-muted hover:text-text hover:bg-surface-muted rounded-control transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
                              aria-label="Valider le paiement"
                              title="Valider le paiement"
                            >
                              <CreditCard size={16} aria-hidden="true" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expanded && info && (
                      <tr className="bg-surface-muted">
                        <td colSpan={10} className="px-4 py-3">
                          <table className="w-full text-small">
                            <thead>
                              <tr className="text-overline uppercase text-text">
                                <th className="py-1 text-left">N° de série</th>
                                <th className="py-1 text-left">Pack</th>
                                <th className="py-1 text-left">Affecté le</th>
                                <th className="py-1 text-left">1er envoi</th>
                                <th className="py-1 text-left">Dernière position</th>
                                <th className="py-1 text-left">Statut</th>
                              </tr>
                            </thead>
                            <tbody>
                              {info.equipments.slice(0, 50).map((e) => {
                                const last = e.lastCommunication ? new Date(e.lastCommunication) : null;
                                const ok = !!last && daysBetween(last, nowRef) * 24 <= disconnectThresholdHours;
                                const statusLabel = !last ? 'Non connecté' : ok ? 'Connecté' : 'Non connecté';
                                return (
                                  <tr key={e.id}>
                                    <td className="py-1.5 text-mention tracking-[0.03em] text-text-muted">{e.serial}</td>
                                    <td className="py-1.5">{packs.find((p) => p.id === e.packId)?.name ?? '—'}</td>
                                    <td className="py-1.5">{frIso(e.assignedAt ?? e.contractDate)}</td>
                                    <td className="py-1.5">{e.firstSendDate ? frIso(e.firstSendDate) : 'Jamais'}</td>
                                    <td className="py-1.5">{last ? last.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—'}</td>
                                    <td className="py-1.5">
                                      {!last ? (
                                        <StatusTag label="Jamais connecté" family="danger" icon={WifiOff} />
                                      ) : (
                                        <StatusTagFromLabel label={statusLabel} />
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                          {info.equipments.length > 50 && (
                            <p className="mt-1 text-mention text-text-muted">50 premiers équipements sur {fmt(info.equipments.length)}.</p>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 border-t border-border-subtle text-mention text-text-muted">
          <label className="inline-flex items-center gap-2 text-small">
            Afficher
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="h-control-sm px-2 border border-border-strong rounded-control bg-surface text-small focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
            >
              {PAGE_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            par page
          </label>
          <span className="text-small">
            {filteredClients.length ? (Math.min(page, pageCount) - 1) * pageSize + 1 : 0}–{Math.min(Math.min(page, pageCount) * pageSize, filteredClients.length)} sur{' '}
            {fmt(filteredClients.length)} client(s)
          </span>
          <div className="inline-flex items-center gap-1">
            <button
              type="button"
              aria-label="Page précédente"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-control-sm w-control-sm inline-flex items-center justify-center rounded-control border border-border bg-surface hover:bg-surface-muted disabled:opacity-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
            >
              <ChevronLeft size={16} aria-hidden="true" />
            </button>
            <span className="px-2 font-qty text-text text-small">
              {Math.min(page, pageCount)} / {pageCount}
            </span>
            <button
              type="button"
              aria-label="Page suivante"
              disabled={page >= pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              className="h-control-sm w-control-sm inline-flex items-center justify-center rounded-control border border-border bg-surface hover:bg-surface-muted disabled:opacity-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
            >
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {canSeeCommercial && (
        <ClientsActivity data={kpis} isNetwork={isNetwork} onOpenDetail={setDetail} onClientOpen={(id) => openFiche(id)} />
      )}

      {/* CLI-F-01 – fiche client unique */}
      <ClientFiche
        info={ficheInfo}
        profile={fiche ? clientProfiles[fiche.id] : undefined}
        packs={packs}
        offerChanges={offerChanges}
        userConnections={userConnections}
        simCards={simCards}
        simConsumption={simConsumption}
        canSeePrices={canSeePrices}
        asOf={asOf}
        now={nowRef}
        delayDays={delay}
        connHours={disconnectThresholdHours}
        initialTab={fiche?.tab}
        onClose={() => setFiche(null)}
      />
      <DetailModal detail={detail} onClose={() => setDetail(null)} canOpen={() => false} />

      {/* --- 1. MULTI-STEP ADD/EDIT MODAL --- */}
      <Modal
        isOpen={isAddEditModalOpen}
        onClose={() => setIsAddEditModalOpen(false)}
        title={selectedClient ? 'Modifier le client' : 'Ajouter un client'}
        size="lg">
        
        <div className="flex flex-col h-full">
          {/* Step Indicator */}
          <div className="mb-8 px-4">
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-border-subtle -z-10"></div>
              <div
                className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-primary -z-10 transition-all duration-300"
                style={{
                  width: `${visibleSteps.length <= 1 ? 0 : currentStepIdx / (visibleSteps.length - 1) * 100}%`
                }}>
              </div>
              {visibleSteps.map((step) => {
                const isCompleted = currentStep > step.id;
                const isCurrent = currentStep === step.id;
                return (
                  <div
                    key={step.id}
                    className="flex flex-col items-center gap-2">
                    
                    <div
                      className={`w-8 h-8 rounded-pill flex items-center justify-center text-small font-medium transition-colors duration-fast ease-standard ${isCompleted ? 'bg-primary text-text-inverse' : isCurrent ? 'bg-primary text-text-inverse ring-4 ring-primary-200' : 'bg-surface border-2 border-border text-text-muted'}`}>
                      
                      {isCompleted ? <Check size={16} /> : step.id}
                    </div>
                    <span
                      className={`text-mention font-medium absolute -bottom-6 whitespace-nowrap ${isCurrent ? 'text-primary' : 'text-text-muted'}`}>
                      
                      {step.label}
                    </span>
                  </div>);

              })}
            </div>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-hidden relative min-h-[320px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.16, ease: [0.2, 0, 0, 1] }}
                className="space-y-4">
                
                {currentStep === 1 &&
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-mention font-medium text-text mb-2">
                          Type de client
                        </label>
                        <div className="flex gap-6">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                            type="radio"
                            name="type"
                            checked={clientType === 'Simple'}
                            onChange={() => setClientType('Simple')}
                            className="text-primary focus-visible:ring-focus border-border-strong" />
                          
                            <span className="text-small text-text">
                              Simple
                            </span>
                          </label>
                          {!isResellerUser && (
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                              type="radio"
                              name="type"
                              checked={clientType === 'Revendeur'}
                              onChange={() => setClientType('Revendeur')}
                              className="text-primary focus-visible:ring-focus border-border-strong" />
                            
                              <span className="text-small text-text">
                                Revendeur
                              </span>
                            </label>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-mention font-medium text-text mb-1">
                          Nom
                        </label>
                        <input
                        type="text"
                        value={clientForm.name}
                        onChange={(e) => setFormField('name', e.target.value)}
                        required
                        maxLength={80}
                        className="w-full px-3 py-2 border border-border-strong rounded-card focus-visible:ring-3 focus-visible:ring-focus focus-visible:border-transparent text-small transition-shadow" />
                      
                      </div>
                      <div>
                        <label className="block text-mention font-medium text-text mb-1">
                          Date d'expiration
                        </label>
                        <input
                        type="date"
                        value={clientForm.expiry}
                        onChange={(e) => setFormField('expiry', e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-border-strong rounded-card focus-visible:ring-3 focus-visible:ring-focus focus-visible:border-transparent text-small transition-shadow" />
                      
                      </div>
                      <div>
                        <label className="block text-mention font-medium text-text mb-1">
                          Site web
                        </label>
                        <input
                        type="url"
                        value={clientForm.website}
                        onChange={(e) => setFormField('website', e.target.value)}
                        className="w-full px-3 py-2 border border-border-strong rounded-card focus-visible:ring-3 focus-visible:ring-focus focus-visible:border-transparent text-small transition-shadow" />
                      
                      </div>
                      <div>
                        <label className="block text-mention font-medium text-text mb-1">
                          Décalage horaire
                        </label>
                        <select
                        value={clientForm.timezone}
                        onChange={(e) => setFormField('timezone', e.target.value)}
                        className="w-full px-3 py-2 border border-border-strong rounded-card focus-visible:ring-3 focus-visible:ring-focus focus-visible:border-transparent text-small transition-shadow">
                          <option value="UTC">UTC</option>
                          <option value="UTC+1">UTC+1 (Europe centrale)</option>
                          <option value="UTC+2">UTC+2 (Europe de l'Est)</option>
                        </select>
                      </div>
                      {selectedClient &&
                    <div className="col-span-1 md:col-span-2">
                          <label className="block text-mention font-medium text-text mb-1">
                            Abonnement FleetIQ
                          </label>
                          <select
                        value={editAbonnement}
                        onChange={(e) => setEditAbonnement(e.target.value)}
                        className="w-full px-3 py-2 border border-border-strong rounded-card focus-visible:ring-3 focus-visible:ring-focus focus-visible:border-transparent text-small transition-shadow">
                        
                            {FLEETIQ_ABONNEMENTS.map((ab) =>
                        <option key={ab} value={ab}>
                                {ab}
                              </option>
                        )}
                          </select>
                        </div>
                    }
                    </div>
                  </div>
                }

                {currentStep === 2 &&
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-mention font-medium text-text mb-1">
                          Adresse complète
                        </label>
                        <input
                        type="text"
                        value={clientForm.address}
                        onChange={(e) => setFormField('address', e.target.value)}
                        className="w-full px-3 py-2 border border-border-strong rounded-card focus-visible:ring-3 focus-visible:ring-focus focus-visible:border-transparent text-small transition-shadow" />
                      
                      </div>
                      <div>
                        <label className="block text-mention font-medium text-text mb-1">
                          Téléphone 1
                        </label>
                        <input
                        type="tel"
                        value={clientForm.tel}
                        onChange={(e) => setFormField('tel', e.target.value)}
                        className="w-full px-3 py-2 border border-border-strong rounded-card focus-visible:ring-3 focus-visible:ring-focus focus-visible:border-transparent text-small transition-shadow" />
                      
                      </div>
                      <div>
                        <label className="block text-mention font-medium text-text mb-1">
                          Email 1
                        </label>
                        <input
                        type="email"
                        value={clientForm.email}
                        onChange={(e) => setFormField('email', e.target.value)}
                        className="w-full px-3 py-2 border border-border-strong rounded-card focus-visible:ring-3 focus-visible:ring-focus focus-visible:border-transparent text-small transition-shadow" />
                      
                      </div>
                      <div>
                        <label className="block text-mention font-medium text-text mb-1">
                          Téléphone 2
                        </label>
                        <input
                        type="tel"
                        value={clientForm.tel2}
                        onChange={(e) => setFormField('tel2', e.target.value)}
                        className="w-full px-3 py-2 border border-border-strong rounded-card focus-visible:ring-3 focus-visible:ring-focus focus-visible:border-transparent text-small transition-shadow" />
                      
                      </div>
                      <div>
                        <label className="block text-mention font-medium text-text mb-1">
                          Email 2
                        </label>
                        <input
                        type="email"
                        value={clientForm.email2}
                        onChange={(e) => setFormField('email2', e.target.value)}
                        className="w-full px-3 py-2 border border-border-strong rounded-card focus-visible:ring-3 focus-visible:ring-focus focus-visible:border-transparent text-small transition-shadow" />
                      
                      </div>
                    </div>
                  </div>
                }

                {currentStep === 3 &&
                <div className="space-y-6">
                    {/* Véhicules */}
                    <div className="bg-surface-muted p-4 rounded-card border border-border">
                      <h4 className="text-small font-medium text-text mb-3">
                        Nombre de véhicules
                      </h4>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                          type="radio"
                          name="vehicleLimit"
                          checked={vehicleLimitType === 'authorized'}
                          onChange={() => setVehicleLimitType('authorized')}
                          className="text-primary focus-visible:ring-focus border-border-strong" />
                        
                          <span className="text-small text-text">
                            Nombre de véhicules autorisé
                          </span>
                        </label>
                        {vehicleLimitType === 'authorized' &&
                      <div className="pl-7">
                            <input
                          type="number"
                          min={1}
                          aria-label="Nombre de véhicules autorisé"
                          value={clientForm.vehicleLimit}
                          onChange={(e) => setFormField('vehicleLimit', e.target.value)}
                          placeholder="Saisissez le nombre"
                          className="w-full max-w-xs px-3 py-2 border border-border-strong rounded-card focus-visible:ring-3 focus-visible:ring-focus focus-visible:border-transparent text-small transition-shadow" />
                        
                          </div>
                      }
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                          type="radio"
                          name="vehicleLimit"
                          checked={vehicleLimitType === 'unlimited'}
                          onChange={() => setVehicleLimitType('unlimited')}
                          className="text-primary focus-visible:ring-focus border-border-strong" />
                        
                          <span className="text-small text-text">
                            Nombre de véhicules illimité
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Comptes */}
                    <div className="bg-surface-muted p-4 rounded-card border border-border">
                      <h4 className="text-small font-medium text-text mb-3">
                        Nombre de comptes
                      </h4>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                          type="radio"
                          name="accountLimit"
                          checked={accountLimitType === 'authorized'}
                          onChange={() => setAccountLimitType('authorized')}
                          className="text-primary focus-visible:ring-focus border-border-strong" />
                        
                          <span className="text-small text-text">
                            Nombre de comptes autorisé
                          </span>
                        </label>
                        {accountLimitType === 'authorized' &&
                      <div className="pl-7">
                            <input
                          type="number"
                          min={1}
                          aria-label="Nombre de comptes autorisé"
                          value={clientForm.accountLimit}
                          onChange={(e) => setFormField('accountLimit', e.target.value)}
                          placeholder="Saisissez le nombre"
                          className="w-full max-w-xs px-3 py-2 border border-border-strong rounded-card focus-visible:ring-3 focus-visible:ring-focus focus-visible:border-transparent text-small transition-shadow" />
                        
                          </div>
                      }
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                          type="radio"
                          name="accountLimit"
                          checked={accountLimitType === 'unlimited'}
                          onChange={() => setAccountLimitType('unlimited')}
                          className="text-primary focus-visible:ring-focus border-border-strong" />
                        
                          <span className="text-small text-text">
                            Nombre de comptes illimité
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                }

                {currentStep === 4 &&
                <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 max-w-md mx-auto">
                      <div>
                        <label className="block text-mention font-medium text-text mb-1">
                          Nom d'utilisateur
                        </label>
                        <input
                        type="text"
                        autoComplete="off"
                        value={clientForm.username}
                        onChange={(e) => setFormField('username', e.target.value)}
                        className="w-full px-3 py-2 border border-border-strong rounded-card focus-visible:ring-3 focus-visible:ring-focus focus-visible:border-transparent text-small transition-shadow" />
                      
                      </div>
                      <div>
                        <label className="block text-mention font-medium text-text mb-1">
                          Nouveau mot de passe
                        </label>
                        <input
                        type="password"
                        autoComplete="new-password"
                        value={clientForm.password}
                        onChange={(e) => setFormField('password', e.target.value)}
                        className="w-full px-3 py-2 border border-border-strong rounded-card focus-visible:ring-3 focus-visible:ring-focus focus-visible:border-transparent text-small transition-shadow" />
                      
                      </div>
                      <div>
                        <label className="block text-mention font-medium text-text mb-1">
                          Répétez mot de passe
                        </label>
                        <input
                        type="password"
                        autoComplete="new-password"
                        value={clientForm.password2}
                        onChange={(e) => setFormField('password2', e.target.value)}
                        className="w-full px-3 py-2 border border-border-strong rounded-card focus-visible:ring-3 focus-visible:ring-focus focus-visible:border-transparent text-small transition-shadow" />
                      
                      </div>
                    </div>
                  </div>
                }
              </motion.div>
            </AnimatePresence>
          </div>

          {clientFormError &&
          <p role="alert" className="mt-4 bg-danger-50 text-danger-700 p-3 rounded-control text-small">
              {clientFormError}
            </p>
          }
          {/* Footer Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-6 mt-4 border-t border-border-subtle">
            <button
              onClick={() => setIsAddEditModalOpen(false)}
              className="px-4 py-2 text-small font-medium text-text hover:text-text transition-colors duration-fast ease-standard">
              
              Annuler
            </button>
            <div className="flex gap-3">
              {currentStep > 1 &&
              <button
                onClick={prevStep}
                className="px-4 py-2 text-small font-medium text-text bg-surface border border-border rounded-control hover:bg-surface-muted transition-colors duration-fast ease-standard flex items-center gap-1">
                
                  <ChevronLeft size={16} />
                  Précédent
                </button>
              }
              {currentStepIdx < visibleSteps.length - 1 ?
              <button
                onClick={nextStep}
                className="px-4 py-2 text-small font-medium text-text-inverse bg-primary rounded-card hover:bg-primary-hover transition-colors duration-fast ease-standard flex items-center gap-1">
                
                  Suivant
                  <ChevronRight size={16} />
                </button> :

              <button
                onClick={saveClientForm}
                className="px-4 py-2 text-small font-medium text-text-inverse bg-success rounded-card hover:bg-success-hover transition-colors duration-fast ease-standard flex items-center gap-1">
                
                  <Check size={16} />
                  Enregistrer
                </button>
              }
            </div>
          </div>
        </div>
      </Modal>

      {/* --- 3. CLIENT EQUIPMENTS POPUP --- */}
      <Modal
        isOpen={isVehiclesModalOpen}
        onClose={() => setIsVehiclesModalOpen(false)}
        title={`Équipements affectés — ${clientForVehicles?.name ?? ''}`}
        size="xl"
      >
        <div className="space-y-4">
          <p className="text-small text-text">
            {clientAssignedEquipments.length} équipement
            {clientAssignedEquipments.length > 1 ? 's' : ''} affecté
            {clientAssignedEquipments.length > 1 ? 's' : ''} à ce client.
          </p>
          <div className="border border-border rounded-card overflow-hidden overflow-x-auto">
            <table className="w-full text-left min-w-[640px]">
              <thead>
                <tr className="bg-surface-muted border-b border-border text-overline uppercase text-text-muted">
                  <th className="p-3 font-medium">Équipement</th>
                  <th className="p-3 font-medium">Véhicule</th>
                  <th className="p-3 font-medium">Statut</th>
                  <th className="p-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle text-small">
                {clientAssignedEquipments.length > 0 ? (
                  clientAssignedEquipments.map((eq) => {
                    const eqType = eq.equipmentType ?? eq.type;
                    const plate = eq.car && eq.car !== 'Unassigned' ? eq.car : null;
                    return (
                      <tr key={eq.id} className="hover:bg-surface-muted">
                        <td className="p-3">
                          <div className="font-medium text-text">{eqType}</div>
                          <div className="text-mention text-text-muted font-mono mt-0.5 flex items-center gap-1">
                            <Hash size={11} />
                            {eq.serial}
                          </div>
                        </td>
                        <td className="p-3 font-medium text-text">
                          {plate ?? (
                            <span className="text-text-muted italic font-normal">—</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-control text-mention font-medium ${
                              eq.isInstalled
                                ? 'bg-success-50 text-success-700 border border-success-200'
                                : 'bg-warning-50 text-warning-700 border border-warning-200'
                            }`}
                          >
                            {eq.isInstalled ? (
                              <CheckCircle2 size={12} />
                            ) : (
                              <XCircle size={12} />
                            )}
                            {eq.isInstalled ? 'Installée' : 'Non installée'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="inline-flex items-center justify-end gap-1">
                            {permissions?.clients.canViewEquipments && eq.isInstalled && (
                              <button
                                type="button"
                                onClick={() => openClientAssignedEquipmentDetails(eq)}
                                className="p-1.5 text-text-muted hover:text-primary hover:bg-primary-50 rounded-control transition-colors duration-fast ease-standard"
                                title="Voir détail"
                              >
                                <Eye size={16} />
                              </button>
                            )}
                            {permissions?.clients.canEditEquipmentSim && eq.isInstalled && (
                              <button
                                type="button"
                                onClick={() => openClientEquipmentEditSim(eq)}
                                className="p-1.5 text-text-muted hover:text-primary hover:bg-primary-50 rounded-control transition-colors duration-fast ease-standard"
                                title="Modifier la puce"
                              >
                                <Smartphone size={16} />
                              </button>
                            )}
                            {eq.isInstalled ? (
                              permissions?.clients.canUninstallEquipment && (
                                <button
                                  type="button"
                                  onClick={() => uninstallClientEquipment(eq)}
                                  className="p-1.5 text-text-muted hover:text-warning-700 hover:bg-warning-50 rounded-control transition-colors duration-fast ease-standard"
                                  title="Désinstaller"
                                >
                                  <XCircle size={16} />
                                </button>
                              )
                            ) : (
                              permissions?.clients.canInstallEquipment && (
                                <button
                                  type="button"
                                  onClick={() => openClientEquipmentInstall(eq)}
                                  className="p-1.5 text-text-muted hover:text-success-700 hover:bg-success-50 rounded-control transition-colors duration-fast ease-standard"
                                  title="Installer"
                                >
                                  <CheckCircle2 size={16} />
                                </button>
                              )
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-text-muted">
                      Aucun équipement affecté à ce client.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isClientInstallOpen}
        onClose={() => {
          setIsClientInstallOpen(false);
          setClientEquipmentToInstall(null);
          setClientInstallSimId(null);
        }}
        title={`Installer — ${clientEquipmentToInstall?.serial ?? ''}`}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-label font-medium text-text mb-1">
              Immatriculation (véhicule)
            </label>
            <InstallPlateSelect
              value={clientInstallPlate}
              onChange={setClientInstallPlate}
              plates={clientInstallPlateOptions}
            />
            <p className="mt-1 text-mention text-text-muted">
              Recherchez dans la liste ou ajoutez une nouvelle immatriculation si elle n&apos;existe pas.
            </p>
          </div>
          <div>
            <h3 className="text-small font-semibold text-text mb-2 pb-2 border-b border-border-subtle flex items-center gap-2">
              <Wifi size={16} className="text-text-muted" />
              Carte SIM
            </h3>
            <SimIccidPicker
              label="N° de série puce (ICCID)"
              labelClassName="block text-small font-medium text-text mb-1"
              availableSims={clientInstallAvailableSims}
              selectedSimId={clientInstallSimId}
              onSelectSimId={setClientInstallSimId}
              simOfferById={simOfferById}
              simOffers={simOffers}
              allSimCards={simCards}
              showPrices={permissions?.canSeePrices ?? false}
              allowCreate
              setSimCards={setSimCards}
              setSimOffers={setSimOffers}
              createContext={
                clientEquipmentToInstall
                  ? buildSimCreateContext(
                      clientEquipmentToInstall.client,
                      clientEquipmentToInstall.reseller
                    )
                  : undefined
              }
              emptyMessage="Aucune puce disponible pour ce client."
            />
          </div>
          {clientInstallError && (
            <div className="bg-danger-50 text-danger-700 border border-danger-200 rounded-control p-3 text-small">
              {clientInstallError}
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4 border-t border-border-subtle">
            <button
              type="button"
              onClick={() => {
                setIsClientInstallOpen(false);
                setClientEquipmentToInstall(null);
              }}
              className="px-4 py-2 text-small font-medium text-text bg-surface border border-border rounded-control hover:bg-surface-muted transition-colors duration-fast ease-standard"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={confirmClientEquipmentInstall}
              className="px-4 py-2 text-small font-medium text-text-inverse bg-success rounded-card hover:bg-success-hover transition-colors duration-fast ease-standard"
            >
              Installer
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isClientEditSimOpen}
        onClose={() => {
          setIsClientEditSimOpen(false);
          setClientEquipmentForSimEdit(null);
          setClientEditSimId(null);
        }}
        title={`Modifier la puce — ${clientEquipmentForSimEdit?.serial ?? ''}`}
        size="lg"
      >
        <div className="space-y-4">
          <SimIccidPicker
            label="N° de série puce (ICCID)"
            labelClassName="block text-small font-medium text-text mb-1"
            availableSims={clientEditSimAvailableSims}
            selectedSimId={clientEditSimId}
            onSelectSimId={setClientEditSimId}
            simOfferById={simOfferById}
            simOffers={simOffers}
            allSimCards={simCards}
              showPrices={permissions?.canSeePrices ?? false}
            allowCreate
            setSimCards={setSimCards}
            setSimOffers={setSimOffers}
            createContext={
              clientEquipmentForSimEdit
                ? buildSimCreateContext(
                    clientEquipmentForSimEdit.client,
                    clientEquipmentForSimEdit.reseller
                  )
                : undefined
            }
            emptyMessage="Aucune puce disponible pour ce client."
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-border-subtle">
            <button
              type="button"
              onClick={() => {
                setIsClientEditSimOpen(false);
                setClientEquipmentForSimEdit(null);
                setClientEditSimId(null);
              }}
              className="px-4 py-2 text-small font-medium text-text bg-surface border border-border rounded-control hover:bg-surface-muted transition-colors duration-fast ease-standard"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={confirmClientEquipmentEditSim}
              className="px-4 py-2 text-small font-medium text-text-inverse bg-primary rounded-card hover:bg-primary-hover transition-colors duration-fast ease-standard"
            >
              Enregistrer
            </button>
          </div>
        </div>
      </Modal>

      {/* --- 4. PAYMENT VALIDATION POPUP --- */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={`Paiement - ${clientForPayment?.name}`}
        size="md">
        
        <div className="space-y-4">
          <div className="bg-primary-50 text-primary p-3 rounded-control text-small flex items-start gap-3">
            <CreditCard className="shrink-0 mt-0.5" size={16} />
            <p>
              Date d'expiration actuelle :{' '}
              <strong>
                {clientForPayment?.expiry ?
                new Date(clientForPayment.expiry).toLocaleDateString(
                  'fr-FR'
                ) :
                '-'}
              </strong>
            </p>
          </div>
          <div className="flex items-center gap-2 text-small">
            <span className="text-text-muted">Statut actuel :</span>
            <span
              className={`flex items-center gap-1.5 text-mention font-medium ${clientForPayment?.status === 'Active' ? 'text-success' : 'text-danger'}`}>
              
              <span
                className={`w-1.5 h-1.5 rounded-pill ${clientForPayment?.status === 'Active' ? 'bg-success' : 'bg-danger'}`}>
              </span>
              {clientForPayment?.status === 'Active' ? 'Actif' : 'Bloqué'}
            </span>
          </div>
          <p className="text-small text-text-muted">
            La validation du paiement met à jour l’expiration (client, packs) et réactive le client. Le blocage
            empêche l’accès jusqu’à régularisation.
          </p>
          <div>
            <label htmlFor="clients-payment-expiry" className="block text-label font-medium text-text mb-1">
              Nouvelle date d'expiration
            </label>
            <input
              id="clients-payment-expiry"
              type="date"
              value={paymentExpiry}
              min={toIsoDate(addDays(startOfDay(mockToday), 1))}
              onChange={(e) => setPaymentExpiry(e.target.value)}
              aria-invalid={paymentError ? true : undefined}
              aria-describedby={paymentError ? 'clients-payment-error' : undefined}
              className="w-full px-3 py-2 border border-border-strong rounded-card focus-visible:ring-3 focus-visible:ring-focus focus-visible:border-transparent text-small transition-shadow" />
            {paymentError &&
            <p id="clients-payment-error" role="alert" className="mt-1 text-mention text-danger">
                {paymentError}
              </p>
            }
          </div>
          <div>
            <label htmlFor="clients-block-reason" className="block text-label font-medium text-text mb-1">
              Motif du blocage
            </label>
            <select
              id="clients-block-reason"
              value={blockReasonChoice}
              onChange={(e) => setBlockReasonChoice(e.target.value as BlockReason)}
              className="w-full px-3 py-2 border border-border-strong rounded-card focus-visible:ring-3 focus-visible:ring-focus focus-visible:border-transparent text-small transition-shadow">
              {(Object.keys(BLOCK_REASON_LABELS) as BlockReason[]).map((r) =>
              <option key={r} value={r}>
                  {BLOCK_REASON_LABELS[r]}
                </option>
              )}
            </select>
          </div>
          <div className="flex flex-wrap justify-between gap-3 pt-4 border-t border-border-subtle">
            <button
              onClick={handleBlockClient}
              className="px-4 py-2 text-small font-medium text-text-inverse bg-danger rounded-card hover:bg-danger-hover transition-colors duration-fast ease-standard flex items-center gap-2">

              <Ban size={14} />
              Bloquer
            </button>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="px-4 py-2 text-small font-medium text-text bg-surface border border-border rounded-control hover:bg-surface-muted transition-colors duration-fast ease-standard">

                Annuler
              </button>
              <button
                onClick={handleValidatePayment}
                disabled={Boolean(paymentError)}
                title={paymentError ?? undefined}
                className="px-4 py-2 text-small font-medium text-text-inverse bg-primary rounded-card hover:bg-primary-hover transition-colors duration-fast ease-standard disabled:opacity-50 disabled:cursor-not-allowed">

                Valider le paiement
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* --- 5. ADD VEHICLE MODAL --- */}
      <Modal
        isOpen={isAddVehicleModalOpen}
        onClose={() => setIsAddVehicleModalOpen(false)}
        title="Ajouter un véhicule"
        size="md">
        
        <form onSubmit={handleAddVehicle} className="space-y-4">
          <div>
            <label className="block text-label font-medium text-text mb-1">
              Nom / Immatriculation du véhicule
            </label>
            <input
              type="text"
              value={newVehiclePlate}
              onChange={(e) => setNewVehiclePlate(e.target.value)}
              placeholder="Ex: AB-123-CD"
              autoFocus
              className="w-full px-3 py-2 border border-border-strong rounded-card focus-visible:ring-3 focus-visible:ring-focus focus-visible:border-transparent text-small transition-shadow"
              required />
            
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border-subtle">
            <button
              type="button"
              onClick={() => setIsAddVehicleModalOpen(false)}
              className="px-4 py-2 text-small font-medium text-text bg-surface border border-border rounded-control hover:bg-surface-muted transition-colors duration-fast ease-standard">
              
              Annuler
            </button>
            <button
              type="submit"
              disabled={!newVehiclePlate.trim()}
              className="px-4 py-2 text-small font-medium text-text-inverse bg-primary rounded-card hover:bg-primary-hover transition-colors duration-fast ease-standard disabled:opacity-50 disabled:cursor-not-allowed">
              
              Ajouter
            </button>
          </div>
        </form>
      </Modal>

      {/* --- 6. ASSIGN EQUIPMENT MODAL --- */}
      <Modal
        isOpen={isAssignEquipmentModalOpen}
        onClose={() => setIsAssignEquipmentModalOpen(false)}
        title={`Affecter un équipement - ${vehicleToAssign?.plate}`}
        size="md">
        
        <form onSubmit={handleAssignEquipment} className="space-y-4">
          <div>
            <label className="block text-label font-medium text-text mb-1">
              Rechercher un équipement
            </label>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                size={16} />
              
              <input
                type="text"
                value={equipmentSearchQuery}
                onChange={(e) => setEquipmentSearchQuery(e.target.value)}
                placeholder="Rechercher par N° série ou type..."
                autoFocus
                className="w-full pl-9 pr-4 py-2 border border-border-strong rounded-card focus-visible:ring-3 focus-visible:ring-focus focus-visible:border-transparent text-small transition-shadow" />
              
            </div>
            {selectedEquipmentSerial &&
            <div className="mt-2 flex items-center gap-2 bg-primary-50 text-primary px-3 py-1.5 rounded-control text-small">
                <CheckCircle2 size={14} />
                <span className="font-medium">{selectedEquipmentSerial}</span>
                <span className="text-primary">
                  (
                  {
                assignableEquipments.find(
                  (eq) => eq.serial === selectedEquipmentSerial
                )?.type
                }
                  )
                </span>
                <button
                type="button"
                onClick={() => setSelectedEquipmentSerial('')}
                className="ml-auto text-primary hover:text-primary">
                
                  <XCircle size={14} />
                </button>
              </div>
            }
            <div className="mt-2 border border-border rounded-control max-h-48 overflow-y-auto">
              {assignableEquipments.
              filter((eq) => {
                const q = equipmentSearchQuery.toLowerCase();
                return (
                  eq.serial.toLowerCase().includes(q) ||
                  eq.type.toLowerCase().includes(q));

              }).
              map((eq) =>
              <button
                key={eq.serial}
                type="button"
                onClick={() => setSelectedEquipmentSerial(eq.serial)}
                className={`w-full text-left px-3 py-2 text-small flex items-center justify-between hover:bg-surface-muted transition-colors duration-fast ease-standard border-b border-border-subtle last:border-b-0 ${selectedEquipmentSerial === eq.serial ? 'bg-primary-50 text-primary' : 'text-text'}`}>
                
                    <span>
                      <span className="font-medium">{eq.serial}</span>
                      <span className="text-text-muted ml-2">({eq.type})</span>
                    </span>
                    {selectedEquipmentSerial === eq.serial &&
                <CheckCircle2
                  size={14}
                  className="text-primary shrink-0" />

                }
                  </button>
              )}
              {assignableEquipments.filter((eq) => {
                const q = equipmentSearchQuery.toLowerCase();
                return (
                  eq.serial.toLowerCase().includes(q) ||
                  eq.type.toLowerCase().includes(q));

              }).length === 0 &&
              <div className="px-3 py-4 text-center text-small text-text-muted">
                  Aucun équipement trouvé
                </div>
              }
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border-subtle">
            <button
              type="button"
              onClick={() => setIsAssignEquipmentModalOpen(false)}
              className="px-4 py-2 text-small font-medium text-text bg-surface border border-border rounded-control hover:bg-surface-muted transition-colors duration-fast ease-standard">
              
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-small font-medium text-text-inverse bg-primary rounded-card hover:bg-primary-hover transition-colors duration-fast ease-standard">
              
              Confirmer
            </button>
          </div>
        </form>
      </Modal>

      {/* --- 7. EDIT EQUIPMENT MODAL --- */}
      <Modal
        isOpen={isEditEquipmentModalOpen}
        onClose={() => setIsEditEquipmentModalOpen(false)}
        title="Modifier l'équipement"
        size="lg">
        
        {equipmentToEdit ?
        <form className="space-y-6">
            {/* Informations Équipement */}
            <div>
              <h3 className="text-small font-semibold text-text mb-3 pb-2 border-b border-border-subtle flex items-center gap-2">
                <Cpu size={16} className="text-text-muted" />
                Informations Équipement
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-mention font-medium text-text mb-1">
                    Type d'équipement
                  </label>
                  <select
                  defaultValue={equipmentToEdit.type}
                  className="w-full px-3 py-2 border border-border-strong rounded-card focus-visible:ring-3 focus-visible:ring-focus focus-visible:border-transparent text-small transition-shadow">
                  
                    <option>FMB120</option>
                    <option>FMC130</option>
                    <option>FMB920</option>
                  </select>
                </div>
                <div>
                  <label className="block text-mention font-medium text-text mb-1">
                    Numéro de série (IMEI)
                  </label>
                  <input
                  type="text"
                  defaultValue={equipmentToEdit.serial}
                  className="w-full px-3 py-2 border border-border-strong rounded-card focus-visible:ring-3 focus-visible:ring-focus focus-visible:border-transparent text-small transition-shadow" />
                
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-mention font-medium text-text mb-1">
                    Statut installation
                  </label>
                  <select
                  defaultValue={
                  equipmentToEdit.isInstalled ? 'true' : 'false'
                  }
                  className="w-full px-3 py-2 border border-border-strong rounded-card focus-visible:ring-3 focus-visible:ring-focus focus-visible:border-transparent text-small transition-shadow">
                  
                    <option value="true">Installé</option>
                    <option value="false">Non installé</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Connexion Serveur */}
            <div>
              <h3 className="text-small font-semibold text-text mb-3 pb-2 border-b border-border-subtle flex items-center gap-2">
                <ServerIcon size={16} className="text-text-muted" />
                Connexion Serveur
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-mention font-medium text-text mb-1">
                    Serveur
                  </label>
                  <input
                  type="text"
                  defaultValue={equipmentToEdit.server}
                  placeholder="Ex: Srv-Paris-1"
                  className="w-full px-3 py-2 border border-border-strong rounded-card focus-visible:ring-3 focus-visible:ring-focus focus-visible:border-transparent text-small transition-shadow" />
                
                </div>
                <div>
                  <label className="block text-mention font-medium text-text mb-1">
                    Port
                  </label>
                  <input
                  type="text"
                  defaultValue={equipmentToEdit.port}
                  className="w-full px-3 py-2 border border-border-strong rounded-card focus-visible:ring-3 focus-visible:ring-focus focus-visible:border-transparent text-small transition-shadow" />
                
                </div>
              </div>
            </div>

            {/* Dates */}
            <div>
              <h3 className="text-small font-semibold text-text mb-3 pb-2 border-b border-border-subtle flex items-center gap-2">
                <Calendar size={16} className="text-text-muted" />
                Dates
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-mention font-medium text-text mb-1">
                    Date du premier envoi
                  </label>
                  <input
                  type="date"
                  defaultValue={equipmentToEdit.firstSendDate}
                  className="w-full px-3 py-2 border border-border-strong rounded-card focus-visible:ring-3 focus-visible:ring-focus focus-visible:border-transparent text-small transition-shadow" />
                
                </div>
                <div>
                  <label className="block text-mention font-medium text-text mb-1">
                    Date contractuelle adoptée
                  </label>
                  <input
                  type="date"
                  defaultValue={equipmentToEdit.contractDate}
                  className="w-full px-3 py-2 border border-border-strong rounded-card focus-visible:ring-3 focus-visible:ring-focus focus-visible:border-transparent text-small transition-shadow" />
                
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border-subtle">
              <button
              type="button"
              onClick={() => setIsEditEquipmentModalOpen(false)}
              className="px-4 py-2 text-small font-medium text-text bg-surface border border-border rounded-control hover:bg-surface-muted transition-colors duration-fast ease-standard">
              
                Annuler
              </button>
              <button
              type="button"
              onClick={() => setIsEditEquipmentModalOpen(false)}
              className="px-4 py-2 text-small font-medium text-text-inverse bg-primary rounded-card hover:bg-primary-hover transition-colors duration-fast ease-standard">
              
                Enregistrer
              </button>
            </div>
          </form> :

        <div className="py-8 text-center text-text-muted text-small">
            Aucun équipement associé à ce véhicule. Veuillez d'abord affecter un
            équipement.
          </div>
        }
      </Modal>

      {/* --- 8. INSTALL EQUIPMENT MODAL --- */}
      <Modal
        isOpen={isInstallEquipmentModalOpen}
        onClose={() => setIsInstallEquipmentModalOpen(false)}
        title={`Installer l'équipement - ${vehicleToInstall?.equipment}`}
        size="md">
        
        <form onSubmit={handleInstallEquipment} className="space-y-4">
          <div className="bg-success-50 text-success-700 p-3 rounded-control text-small flex items-start gap-3">
            <Download className="shrink-0 mt-0.5" size={16} />
            <p>
              Saisissez l'immatriculation du véhicule pour confirmer
              l'installation de l'équipement{' '}
              <strong>{vehicleToInstall?.equipment}</strong>.
            </p>
          </div>
          <div>
            <label className="block text-label font-medium text-text mb-1">
              Immatriculation du véhicule
            </label>
            <InstallPlateSelect
              value={installPlate}
              onChange={setInstallPlate}
              plates={clientVehicles.map((v) => v.plate)} />
            
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border-subtle">
            <button
              type="button"
              onClick={() => setIsInstallEquipmentModalOpen(false)}
              className="px-4 py-2 text-small font-medium text-text bg-surface border border-border rounded-control hover:bg-surface-muted transition-colors duration-fast ease-standard">
              
              Annuler
            </button>
            <button
              type="submit"
              disabled={!installPlate.trim()}
              className="px-4 py-2 text-small font-medium text-text-inverse bg-success rounded-card hover:bg-success-hover transition-colors duration-fast ease-standard disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              
              <CheckCircle2 size={14} />
              Confirmer l'installation
            </button>
          </div>
        </form>
      </Modal>

      {/* --- 9. VIEW EQUIPMENT DETAILS MODAL --- */}
      <Modal
        isOpen={isViewEquipmentModalOpen}
        onClose={() => setIsViewEquipmentModalOpen(false)}
        title="Détails de l'équipement"
        size="lg"
        footer={null}
      >
        
        {equipmentToView ?
        <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-50 rounded-control flex items-center justify-center text-primary">
                  <Cpu size={20} />
                </div>
                <div>
                  <h3 className="text-h4 font-semibold text-text">
                    {equipmentToView.serial}
                  </h3>
                  <p className="text-small text-text-muted">
                    {equipmentToView.type}
                  </p>
                </div>
              </div>
              <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-control text-mention font-medium ${equipmentToView.isInstalled ? 'bg-success-50 text-success-700 border border-success-200' : 'bg-warning-50 text-warning-700 border border-warning-200'}`}>
              
                {equipmentToView.isInstalled ?
              <CheckCircle2 size={14} /> :

              <XCircle size={14} />
              }
                {equipmentToView.isInstalled ? 'Installé' : 'Non installé'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-y-5 gap-x-4">
              <div>
                <div className="text-mention font-medium text-text-muted mb-1 flex items-center gap-1.5">
                  <Hash size={14} /> N° de série
                </div>
                <div className="text-small font-medium text-text">
                  {equipmentToView.serial}
                </div>
              </div>
              <div>
                <div className="text-mention font-medium text-text-muted mb-1 flex items-center gap-1.5">
                  <Cpu size={14} /> Type
                </div>
                <div className="text-small font-medium text-text">
                  {equipmentToView.type}
                </div>
              </div>
              <div>
                <div className="text-mention font-medium text-text-muted mb-1 flex items-center gap-1.5">
                  <Wifi size={14} /> N° d'appel puce
                </div>
                <div className="text-small font-medium text-text">
                  {equipmentToView.simCallNumber || '-'}
                </div>
              </div>
              <div>
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
                <div className="text-small font-medium text-text">
                  {equipmentToView.server || '-'}
                </div>
              </div>
              <div>
                <div className="text-mention font-medium text-text-muted mb-1 flex items-center gap-1.5">
                  <Hash size={14} /> Port
                </div>
                <div className="text-small font-medium text-text">
                  {equipmentToView.port || '-'}
                </div>
              </div>
              <div>
                <div className="text-mention font-medium text-text-muted mb-1 flex items-center gap-1.5">
                  <Calendar size={14} /> Date premier envoi
                </div>
                <div className="text-small font-medium text-text">
                  {equipmentToView.firstSendDate ?
                new Date(
                  equipmentToView.firstSendDate
                ).toLocaleDateString('fr-FR') :
                '-'}
                </div>
              </div>
              <div>
                <div className="text-mention font-medium text-text-muted mb-1 flex items-center gap-1.5">
                  <Calendar size={14} /> Date contractuelle
                </div>
                <div className="text-small font-medium text-text">
                  {equipmentToView.contractDate ?
                new Date(equipmentToView.contractDate).toLocaleDateString(
                  'fr-FR'
                ) :
                '-'}
                </div>
              </div>
            </div>

            {showPositionMap &&
          <div className="mt-4 border border-border rounded-card overflow-hidden h-[250px] relative z-0">
                <MapContainer
              center={[
              equipmentToView.lastPosition?.latitude ?? 48.8566,
              equipmentToView.lastPosition?.longitude ?? 2.3522]
              }
              zoom={13}
              scrollWheelZoom={false}
              style={{
                height: '100%',
                width: '100%'
              }}>
              
                  <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              
                  <Marker
                position={[
                equipmentToView.lastPosition?.latitude ?? 48.8566,
                equipmentToView.lastPosition?.longitude ?? 2.3522]
                }
                icon={customMarkerIcon}>
                
                    <Popup>
                      <div className="text-mention leading-relaxed">
                        <strong>Dernière position:</strong>
                        <br />
                        Date Local={equipmentToView.lastPosition?.dateLocal}
                        <br />
                        Vitesse= {equipmentToView.lastPosition?.vitesse}km/h
                        <br />
                        État={' '}
                        <span
                      style={{
                        color:
                        equipmentToView.lastPosition?.etat === 'Connectée' ?
                        'var(--tunav-success-700)' :
                        'var(--tunav-danger-700)'
                      }}>
                      
                          {equipmentToView.lastPosition?.etat}
                        </span>
                        <br />
                        Niveau de carburant=
                        {equipmentToView.lastPosition?.niveauCarburant}%<br />
                        Total de carburant=
                        {equipmentToView.lastPosition?.totalCarburant}
                        <br />
                        RPM={equipmentToView.lastPosition?.rpm}
                        <br />
                        Température Moteur=
                        {equipmentToView.lastPosition?.temperatureMoteur}°C
                        <br />
                        Kilométrage={equipmentToView.lastPosition?.kilometrage}
                        km
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>
          }

            {/* Position Details Info */}
            {showPositionMap && equipmentToView.lastPosition &&
          <div className="mt-4 bg-surface-muted border border-border rounded-card p-4">
                <h4 className="text-small font-semibold text-text mb-3 pb-2 border-b border-border flex items-center gap-2">
                  <Navigation size={16} className="text-primary" />
                  Dernière position
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-4">
                  <div>
                    <div className="text-mention font-medium text-text-muted mb-0.5 flex items-center gap-1">
                      <Calendar size={12} /> Date Local
                    </div>
                    <div className="text-small font-semibold text-text">
                      {equipmentToView.lastPosition.dateLocal}
                    </div>
                  </div>
                  <div>
                    <div className="text-mention font-medium text-text-muted mb-0.5 flex items-center gap-1">
                      <MapPin size={12} /> Latitude
                    </div>
                    <div className="text-small font-semibold text-text">
                      {equipmentToView.lastPosition.latitude}
                    </div>
                  </div>
                  <div>
                    <div className="text-mention font-medium text-text-muted mb-0.5 flex items-center gap-1">
                      <MapPin size={12} /> Longitude
                    </div>
                    <div className="text-small font-semibold text-text">
                      {equipmentToView.lastPosition.longitude}
                    </div>
                  </div>
                  <div>
                    <div className="text-mention font-medium text-text-muted mb-0.5 flex items-center gap-1">
                      <Gauge size={12} /> Vitesse
                    </div>
                    <div className="text-small font-semibold text-text">
                      {equipmentToView.lastPosition.vitesse} km/h
                    </div>
                  </div>
                  <div>
                    <div className="text-mention font-medium text-text-muted mb-0.5 flex items-center gap-1">
                      <Activity size={12} /> État
                    </div>
                    <div
                  className={`text-small font-semibold flex items-center gap-1.5 ${equipmentToView.lastPosition.etat === 'Connectée' ? 'text-success' : 'text-danger'}`}>
                  
                      <span
                    className={`w-2 h-2 rounded-pill ${equipmentToView.lastPosition.etat === 'Connectée' ? 'bg-success' : 'bg-danger'}`}>
                  </span>
                      {equipmentToView.lastPosition.etat}
                    </div>
                  </div>
                  <div>
                    <div className="text-mention font-medium text-text-muted mb-0.5 flex items-center gap-1">
                      <Fuel size={12} /> Niveau de carburant
                    </div>
                    <div className="text-small font-semibold text-text">
                      {equipmentToView.lastPosition.niveauCarburant}%
                    </div>
                  </div>
                  <div>
                    <div className="text-mention font-medium text-text-muted mb-0.5 flex items-center gap-1">
                      <Fuel size={12} /> Total de carburant
                    </div>
                    <div className="text-small font-semibold text-text">
                      {equipmentToView.lastPosition.totalCarburant}
                    </div>
                  </div>
                  <div>
                    <div className="text-mention font-medium text-text-muted mb-0.5 flex items-center gap-1">
                      <Activity size={12} /> RPM
                    </div>
                    <div className="text-small font-semibold text-text">
                      {equipmentToView.lastPosition.rpm}
                    </div>
                  </div>
                  <div>
                    <div className="text-mention font-medium text-text-muted mb-0.5 flex items-center gap-1">
                      <Thermometer size={12} /> Température Moteur
                    </div>
                    <div className="text-small font-semibold text-text">
                      {equipmentToView.lastPosition.temperatureMoteur}°C
                    </div>
                  </div>
                  <div>
                    <div className="text-mention font-medium text-text-muted mb-0.5 flex items-center gap-1">
                      <Navigation size={12} /> Kilométrage
                    </div>
                    <div className="text-small font-semibold text-text">
                      {equipmentToView.lastPosition.kilometrage.toLocaleString(
                    'fr-FR'
                  )}{' '}
                      km
                    </div>
                  </div>
                </div>
              </div>
          }

            <div className="flex flex-wrap justify-end gap-3 -mx-4 -mb-4 mt-4 border-t border-border bg-surface-muted px-4 py-3">
              {equipmentToView.isInstalled && (
              <button
              onClick={() => setShowPositionMap(!showPositionMap)}
              className={`px-4 py-2 text-small font-medium rounded-control transition-colors duration-fast ease-standard flex items-center gap-2 ${showPositionMap ? 'bg-primary-50 text-primary border border-primary-200' : 'bg-surface text-text border border-border hover:bg-white'}`}>
              
                <MapPin size={16} />
                {showPositionMap ? 'Masquer la position' : 'Voir position'}
              </button>
              )}
              <button
              onClick={() => setIsViewEquipmentModalOpen(false)}
              className="px-4 py-2 text-small font-medium text-text bg-surface border border-border rounded-control hover:bg-white transition-colors duration-fast ease-standard">
              
                Fermer
              </button>
            </div>
          </div> :

        <div className="py-8 text-center text-text-muted text-small">
            Aucun équipement associé à ce véhicule.
          </div>
        }
      </Modal>

      {/* --- 10. CONFIGURATION MODAL --- */}
      <Modal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        title={`Configuration: ${vehicleToConfig?.equipment}`}
        size="lg">
        
        <div className="space-y-4">
          {/* Voltage Section */}
          <fieldset className="border border-border rounded-control p-3">
            <legend className="text-small font-medium text-text px-1">
              Voltage(en Volt):
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
              <div className="flex items-center justify-between sm:justify-start gap-2">
                <label className="text-label text-text w-48">
                  Voltage du reservoir plein:
                </label>
                <input
                  type="number"
                  step="0.1"
                  defaultValue="0.0"
                  className="w-24 px-2 py-1 border border-border-strong rounded-control text-small focus-visible:ring-3 focus-visible:ring-focus outline-none" />
                
              </div>
              <div className="flex items-center justify-between sm:justify-start gap-2">
                <label className="text-label text-text w-48">
                  Voltage du reservoir vide:
                </label>
                <input
                  type="number"
                  step="0.1"
                  defaultValue="0.0"
                  className="w-24 px-2 py-1 border border-border-strong rounded-control text-small focus-visible:ring-3 focus-visible:ring-focus outline-none" />
                
              </div>
              <div className="flex items-center justify-between sm:justify-start gap-2">
                <label className="text-label text-text w-48">
                  Voltage du température max:
                </label>
                <input
                  type="number"
                  step="0.1"
                  defaultValue="0.0"
                  className="w-24 px-2 py-1 border border-border-strong rounded-control text-small focus-visible:ring-3 focus-visible:ring-focus outline-none" />
                
              </div>
              <div className="flex items-center justify-between sm:justify-start gap-2">
                <label className="text-label text-text w-48">
                  Voltage du température min:
                </label>
                <input
                  type="number"
                  step="0.1"
                  defaultValue="-0.2"
                  className="w-24 px-2 py-1 border border-border-strong rounded-control text-small focus-visible:ring-3 focus-visible:ring-focus outline-none" />
                
              </div>
            </div>
          </fieldset>

          {/* Log Section */}
          <fieldset className="border border-border rounded-control p-3">
            <legend className="text-small font-medium text-text px-1">
              Activation/désactivation de log:
            </legend>
            <div className="flex flex-col gap-1.5 mt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="configLog"
                  checked={configLog === 'activer'}
                  onChange={() => setConfigLog('activer')}
                  className="text-primary focus-visible:ring-focus" />
                
                <span className="text-small text-text">Activer</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="configLog"
                  checked={configLog === 'desactiver'}
                  onChange={() => setConfigLog('desactiver')}
                  className="text-primary focus-visible:ring-focus" />
                
                <span className="text-small text-text">Désactiver</span>
              </label>
            </div>
          </fieldset>

          {/* Options Section */}
          <fieldset className="border border-border rounded-control p-3">
            <legend className="text-small font-medium text-text px-1">
              Activation/désactivation des options:
            </legend>
            <div className="mt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={configIButton}
                  onChange={(e) => setConfigIButton(e.target.checked)}
                  className="text-primary focus-visible:ring-focus rounded-control" />
                
                <span className="text-small text-text">
                  iButton ou interface conducteur est installée
                </span>
              </label>
            </div>
          </fieldset>

          {/* AAD Section */}
          <fieldset className="border border-border rounded-control p-3">
            <legend className="text-small font-medium text-text px-1">
              Configuration de AAD:
            </legend>
            <div className="flex flex-col gap-1.5 mt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="configAAD"
                  checked={configAAD === 'courant'}
                  onChange={() => setConfigAAD('courant')}
                  className="text-primary focus-visible:ring-focus" />
                
                <span className="text-small text-text">
                  AAD est installé sur courant
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="configAAD"
                  checked={configAAD === 'pompe'}
                  onChange={() => setConfigAAD('pompe')}
                  className="text-primary focus-visible:ring-focus" />
                
                <span className="text-small text-text">
                  AAD est installé sur pompe à essence
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="configAAD"
                  checked={configAAD === 'demarreur'}
                  onChange={() => setConfigAAD('demarreur')}
                  className="text-primary focus-visible:ring-focus" />
                
                <span className="text-small text-text">
                  AAD est installé sur démarreur
                </span>
              </label>
            </div>
          </fieldset>

          {/* Stats Section */}
          <fieldset className="border border-border rounded-control p-3">
            <legend className="text-small font-medium text-text px-1">
              Activation/désactivation le calcul de statistique de consommation
              de carburant:
            </legend>
            <div className="mt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={configCalcStat}
                  onChange={(e) => setConfigCalcStat(e.target.checked)}
                  className="text-primary focus-visible:ring-focus rounded-control" />
                
                <span className="text-small text-text">
                  Calculer la statistique de consommation de carburant
                </span>
              </label>
            </div>
          </fieldset>

          {/* Duplication Section */}
          <fieldset className="border border-border rounded-control p-3">
            <legend className="text-small font-medium text-text px-1">
              Les positions sont dupliqués avec le N° serie:
            </legend>
            <div className="flex flex-col gap-3 mt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={configDupPos}
                  onChange={(e) => setConfigDupPos(e.target.checked)}
                  className="text-primary focus-visible:ring-focus rounded-control" />
                
                <span className="text-small text-text">
                  Activer la modification
                </span>
              </label>
              <div className="flex items-center gap-2">
                <label className="text-label text-text">N° de série:</label>
                <input
                  type="text"
                  value={configDupSerial}
                  onChange={(e) => setConfigDupSerial(e.target.value)}
                  disabled={!configDupPos}
                  className="w-48 px-2 py-1 border border-border-strong rounded-control text-small focus-visible:ring-3 focus-visible:ring-focus outline-none disabled:bg-border-subtle disabled:text-text-muted" />
                
              </div>
            </div>
          </fieldset>

          <div className="pt-2">
            <button className="px-4 py-2 text-small font-medium text-text bg-border-subtle border border-border-strong rounded-control hover:bg-border transition-colors duration-fast ease-standard">
              Supprimer la dernière information de cet équipement
            </button>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border-subtle mt-4">
            <button
              onClick={() => setIsConfigModalOpen(false)}
              className="px-4 py-2 text-small font-medium text-text bg-surface border border-border rounded-control hover:bg-surface-muted transition-colors duration-fast ease-standard">
              
              Annuler
            </button>
            <button
              onClick={() => setIsConfigModalOpen(false)}
              className="px-4 py-2 text-small font-medium text-text-inverse bg-primary rounded-card hover:bg-primary-hover transition-colors duration-fast ease-standard">
              
              Enregistrer
            </button>
          </div>
        </div>
      </Modal>
    </PageShell>
  );
}