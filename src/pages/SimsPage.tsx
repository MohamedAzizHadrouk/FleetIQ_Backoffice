/**
 * Gestion des puces v3 (Puces-v3 · Documentation-Puces-v3) – carte FleetIQ 09.
 * Ordre de la page (« Organisation de la page » de la documentation) :
 * 0. En-tête et barre d'outils : Réseau puis période (7 derniers jours · 30 jours · Mois · Année) ; cloche ;
 *    notification « En direct » (PU-A-21, simulée) ;
 * 1. Quatre cartes PU-P-01 · PU-P-02 · PU-P-03 · PU-P-07 ;  2. Puces installées par offre avec le prix (PU-P-05) ;
 * 3. Liste des puces PU-T-21 (une ligne ouvre la fiche PU-F-21) ;  4. Consommation data PU-C-21 puis PU-C-25 ;
 * 5. Statistiques sans prix : PU-S-22, PU-S-21, PU-C-22 et PU-S-23.
 * Seule page avec des prix (prix fixe par puce et par mois) : Admin TUNAV et Finance (lecture seule) y ont accès.
 * Actions existantes (offres puce, ajouter, modifier, affecter, retour au stock, supprimer, menu contextuel,
 * sélection groupée) : Admin seulement. Paramètres d'URL (liens du Tableau de bord) : voir README « Puces v3 ».
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Smartphone,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Wifi,
  Hash,
  Tag,
  Package,
  Unlink,
  ArrowLeftRight,
  X,
  CalendarDays,
  Network
} from 'lucide-react';
import { Modal } from '../components/Modal';
import { TableExportButtons } from '../components/TableExportButtons';
import { SearchableSelect } from '../components/SearchableSelect';
import {
  SimTableContextMenu,
  type SimRowContextMenuState
} from '../components/SimTableContextMenu';
import { SimCard, SimOffer, useFleetStore } from '../state/FleetStore';
import { useBackofficePermissions } from '../hooks/useBackofficePermissions';
import {
  getAssignableSimTargets,
  getSimAssignmentClientName
} from '../utils/fleetAssignment';
import { exportSimsToExcel, exportSimsToPdf, getSimStatus } from '../utils/simTableExport';
import { DetailModal, type DetailSpec } from '../components/dashboard/DetailModal';
import { SectionTitle } from '../components/clients/ClientsOverview';
import { PageChrome, PageShell } from '../components/shell/PageShell';
import { Button } from '../components/ui/Button';
import { SimsOffers, SimsTopCards } from '../components/sims/SimsOverview';
import { SimsConsumption } from '../components/sims/SimsConsumption';
import { SimsStats } from '../components/sims/SimsStats';
import { SimsBell, SimLiveToast } from '../components/sims/SimsAlerts';
import { SimFiche } from '../components/sims/SimFiche';
import { Pager, SimStatusBadge } from '../components/sims/SimUi';
import { usePager } from '../components/sims/useSimPager';
import {
  alertDetail,
  installedDetail,
  notInstalledDetail,
  offerDetail,
  operatorDetail,
  overClientDetail,
  overDetail,
  overNetworkDetail,
  statusDetail,
  totalDetail,
  type DetailCtx
} from '../components/sims/simsDetails';
import {
  ALERT_FILTERS,
  EMPTY_FILTERS,
  NETWORK_ORDER,
  PERIOD_OPTIONS,
  STATUS_FILTERS,
  buildPeriod,
  buildSimRows,
  computeSims,
  filterRows,
  fmt,
  formatTnd,
  frDate,
  indexConsumption,
  networkLabel,
  periodContext,
  type AlertFilter,
  type ListFilters,
  type PeriodKind,
  type SimRow,
  type StatusFilter
} from '../utils/simsKpis';
import { formatMonthFr } from '../state/mock/dates';
import { MaquettePage } from '../components/shell/MaquettePage';
import simsMarkup from '../components/sims/maquette/markup.html?raw';
import { mount as mountSimsMaquette } from '../components/sims/maquette/script';
import '../components/sims/maquette/style.css';

const OPERATORS = ['Télécom', 'Orange', 'Ooredoo'];

function formatPrice(value: number) {
  return formatTnd(value);
}

function formatMonthlyData(offer: SimOffer): string | null {
  if (offer.dataQuotaMB === null) return 'Data illimitée';
  if (offer.dataQuotaMB === undefined) return null;
  const gb = offer.dataQuotaMB / 1024;
  return Number.isInteger(gb) ? `${gb} Go/mois` : `${offer.dataQuotaMB} Mo/mois`;
}

const PERIOD_PARAM: Record<string, PeriodKind> = { '7j': '7j', '30j': '30j', mois: 'mois', annee: 'annee' };

export function SimsPage() {
  const {
    currentUserRole,
    currentUserName,
    clients,
    equipments,
    simOffers,
    setSimOffers,
    simCards,
    setSimCards,
    simConsumption,
    mockToday
  } = useFleetStore();
  const permissions = useBackofficePermissions();
  // Admin TUNAV : actions ; Finance : lecture seule (aucune action, case à cocher ni menu contextuel – carte 04)
  const canManageSims = permissions?.sims.canManage ?? false;
  // PU : prix fixes visibles pour les deux rôles qui ont accès à la page (Admin, Finance) ; aucun prix de revente ni marge
  const showPrices = true;

  const isTunavUser = currentUserRole === 'Tunav';

  const stockClientName = useMemo(
    () => (isTunavUser ? 'Tunav_Stock' : `${currentUserName}_Stock`),
    [isTunavUser, currentUserName]
  );

  // Clients visibles pour l'affectation (clients simples du périmètre courant)
  const assignableClients = useMemo(
    () => getAssignableSimTargets(clients, isTunavUser, currentUserName),
    [clients, isTunavUser, currentUserName]
  );

  const visibleSims = useMemo(() => {
    if (isTunavUser) return simCards;
    return simCards.filter((s) => s.reseller === currentUserName);
  }, [simCards, isTunavUser, currentUserName]);

  const offerById = useMemo(() => new Map(simOffers.map((o) => [o.id, o])), [simOffers]);
  const equipmentById = useMemo(() => new Map(equipments.map((e) => [e.id, e])), [equipments]);

  /* ---------- barre d'outils : Réseau puis période ---------- */
  const ctx = useMemo(() => periodContext(mockToday), [mockToday]);
  const [network, setNetwork] = useState('');
  const [periodKind, setPeriodKind] = useState<PeriodKind>('mois');
  const [month, setMonth] = useState(ctx.lastFullMonth);
  const period = useMemo(() => buildPeriod(periodKind, month, ctx), [periodKind, month, ctx]);
  const allNetworks = useMemo(() => {
    const set = new Set(visibleSims.map((s) => s.reseller));
    return [...NETWORK_ORDER.filter((n) => set.has(n)), ...Array.from(set).filter((n) => !NETWORK_ORDER.includes(n)).sort()];
  }, [visibleSims]);
  const scopeNetworks = useMemo(() => (network ? [network] : allNetworks), [network, allNetworks]);

  const cons = useMemo(() => indexConsumption(simConsumption), [simConsumption]);
  const rows = useMemo(
    () =>
      buildSimRows({
        simCards: network ? visibleSims.filter((s) => s.reseller === network) : visibleSims,
        simOffers,
        equipments,
        cons,
        period,
        ctx
      }),
    [visibleSims, network, simOffers, equipments, cons, period, ctx]
  );
  const data = useMemo(() => computeSims(rows, scopeNetworks), [rows, scopeNetworks]);

  /* ---------- liste PU-T-21 ---------- */
  const [filters, setFilters] = useState<ListFilters>(EMPTY_FILTERS);
  const setFilter = <K extends keyof ListFilters>(k: K, v: ListFilters[K]) => setFilters((f) => ({ ...f, [k]: v }));
  const filteredRows = useMemo(() => filterRows(data.rows, filters), [data.rows, filters]);
  const filteredSims = useMemo(() => filteredRows.map((r) => r.sim), [filteredRows]);
  const pager = usePager(filteredRows, 10);
  const listRef = useRef<HTMLElement>(null);
  const filteredCost = filteredRows.reduce((s, r) => s + (r.price ?? 0), 0);
  const clientOptions = useMemo(
    () =>
      Array.from(new Map(data.rows.map((r) => [r.sim.client, r.clientLabel])).entries()).sort((a, b) => a[1].localeCompare(b[1])),
    [data.rows]
  );
  const operatorOptions = useMemo(() => Array.from(new Set(data.rows.map((r) => r.offer?.operator ?? '—'))).sort(), [data.rows]);
  const hasFilters = Object.values(filters).some(Boolean);
  const scrollToList = () => window.setTimeout(() => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);

  /* ---------- détails, fiche, cloche ---------- */
  const [detail, setDetail] = useState<DetailSpec | null>(null);
  const [ficheId, setFicheId] = useState<number | null>(null);
  const [bellOpen, setBellOpen] = useState(false);
  const [toastClosed, setToastClosed] = useState(false);
  const ficheRow = useMemo(() => {
    if (ficheId == null) return null;
    const inScope = data.rows.find((r) => r.sim.id === ficheId);
    if (inScope) return inScope;
    const sim = visibleSims.find((s) => s.id === ficheId);
    return sim ? buildSimRows({ simCards: [sim], simOffers, equipments, cons, period, ctx })[0] : null;
  }, [ficheId, data.rows, visibleSims, simOffers, equipments, cons, period, ctx]);
  const openFiche = (r: SimRow) => {
    setDetail(null);
    setFicheId(r.sim.id);
  };
  const dctx: DetailCtx = { data, period, showPrices, openFiche };

  /* ---------- paramètres d'URL (liens du Tableau de bord), lus une fois ---------- */
  // ?statut=installee|non_installee|non_posee|sans_equipement|stock · ?revendeur=<réseau> · ?alerte=surconso|haut|bas|
  // sans_equipement|toutes · ?offre=<id> · ?client=<nom> · ?q=<texte> · ?periode=7j|30j|mois|annee · ?mois=AAAA-MM ·
  // ?puce=<id> (ouvre la fiche) · ?detail=surconso (ouvre PU-P-07)
  const [searchParams, setSearchParams] = useSearchParams();
  const [pendingDetail, setPendingDetail] = useState<string | null>(null);
  useEffect(() => {
    const keys = ['statut', 'revendeur', 'alerte', 'offre', 'client', 'q', 'periode', 'mois', 'puce', 'detail'];
    if (!keys.some((k) => searchParams.has(k))) return;
    const statut = (searchParams.get('statut') ?? '') as StatusFilter;
    const alerte = (searchParams.get('alerte') ?? '') as AlertFilter;
    const rev = searchParams.get('revendeur') ?? '';
    setNetwork(rev && simCards.some((s) => s.reseller === rev) ? rev : '');
    const per = PERIOD_PARAM[searchParams.get('periode') ?? ''];
    if (per) setPeriodKind(per);
    const m = searchParams.get('mois');
    if (m && /^\d{4}-\d{2}$/.test(m)) setMonth(m);
    setFilters({
      ...EMPTY_FILTERS,
      status: STATUS_FILTERS.some((s) => s.key === statut) ? statut : '',
      alert: ALERT_FILTERS.some((a) => a.key === alerte) ? alerte : '',
      offer: searchParams.get('offre') ?? '',
      client: searchParams.get('client') ?? '',
      q: searchParams.get('q') ?? ''
    });
    const puce = Number(searchParams.get('puce'));
    if (puce) setFicheId(puce);
    setPendingDetail(searchParams.get('detail'));
    setSearchParams({}, { replace: true });
    if (!puce && !searchParams.get('detail')) scrollToList();
  }, [searchParams, setSearchParams, simCards]);
  useEffect(() => {
    if (pendingDetail === 'surconso') setDetail(overDetail(dctx));
    if (pendingDetail) setPendingDetail(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingDetail]);

  // --- Add/Edit SIM modal ---
  const [isSimModalOpen, setIsSimModalOpen] = useState(false);
  const [simEditingId, setSimEditingId] = useState<number | null>(null);
  const [simForm, setSimForm] = useState<{
    offerId: number | null;
    phoneNumber: string;
    iccid: string;
  }>({
    offerId: simOffers[0]?.id ?? null,
    phoneNumber: '',
    iccid: ''
  });
  const [simError, setSimError] = useState<string | null>(null);

  // --- Offer modal ---
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [offerEditingId, setOfferEditingId] = useState<number | null>(null);
  const [offerForm, setOfferForm] = useState<{
    name: string;
    description: string;
    operator: string;
    pricePerSim: number;
    dataQuotaMB: number | null | undefined;
    monthlySmsQuota: number | null;
    validityDays: number | null;
    isActive: boolean;
  }>({
    name: '',
    description: '',
    operator: '',
    pricePerSim: 0,
    dataQuotaMB: undefined,
    monthlySmsQuota: null,
    validityDays: null,
    isActive: true
  });
  const [offerError, setOfferError] = useState<string | null>(null);
  const [isOffersListOpen, setIsOffersListOpen] = useState(false);

  // --- Selection & assign-to-client ---
  const [selectedSimIds, setSelectedSimIds] = useState<Set<number>>(new Set());
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [assignSimIds, setAssignSimIds] = useState<number[]>([]);
  const [assignClientName, setAssignClientName] = useState<string>('');

  const isSimSelectable = (sim: SimCard) => getSimStatus(sim) !== 'assigned_equipment';

  const selectableFilteredSims = useMemo(
    () => filteredSims.filter(isSimSelectable),
    [filteredSims]
  );

  const allSelectableSelected =
    selectableFilteredSims.length > 0 &&
    selectableFilteredSims.every((s) => selectedSimIds.has(s.id));

  const someSelectableSelected = selectableFilteredSims.some((s) => selectedSimIds.has(s.id));

  const assignSimsPreview = useMemo(
    () => assignSimIds.map((id) => visibleSims.find((s) => s.id === id)).filter(Boolean) as SimCard[],
    [assignSimIds, visibleSims]
  );

  // --- Delete confirm modal ---
  const [simToDelete, setSimToDelete] = useState<SimCard | null>(null);

  const [contextMenu, setContextMenu] = useState<SimRowContextMenuState>(null);

  const openCreateSim = () => {
    setSimEditingId(null);
    setSimForm({
      offerId: simOffers[0]?.id ?? null,
      phoneNumber: '',
      iccid: ''
    });
    setSimError(null);
    setIsSimModalOpen(true);
  };

  const openEditSim = (sim: SimCard) => {
    setSimEditingId(sim.id);
    setSimForm({
      offerId: sim.offerId,
      phoneNumber: sim.phoneNumber,
      iccid: sim.iccid
    });
    setSimError(null);
    setIsSimModalOpen(true);
  };

  const validateSimForm = () => {
    if (simForm.offerId == null) return 'Veuillez sélectionner une offre puce.';
    const iccid = simForm.iccid.trim();
    if (!iccid) return 'Le numéro CCID (ICCID) est obligatoire.';
    return null;
  };

  const upsertSim = () => {
    const error = validateSimForm();
    if (error) {
      setSimError(error);
      return;
    }
    const phone = simForm.phoneNumber.trim();
    const iccid = simForm.iccid.trim();

    setSimCards((prev) => {
      if (simEditingId === null) {
        const nextId = prev.length ? Math.max(...prev.map((s) => s.id)) + 1 : 1;
        const next: SimCard = {
          id: nextId,
          offerId: simForm.offerId,
          phoneNumber: phone,
          iccid,
          client: stockClientName,
          reseller: isTunavUser ? 'Tunav' : currentUserName,
          activationDate: mockToday.toISOString().slice(0, 10)
        };
        return [next, ...prev];
      }
      return prev.map((s) =>
        s.id === simEditingId
          ? {
              ...s,
              offerId: simForm.offerId,
              phoneNumber: phone,
              iccid
            }
          : s
      );
    });
    setIsSimModalOpen(false);
  };

  const openCreateOffer = () => {
    setOfferEditingId(null);
    setOfferForm({
      name: '', description: '', operator: '', pricePerSim: 0,
      dataQuotaMB: undefined, monthlySmsQuota: null, validityDays: null, isActive: true
    });
    setOfferError(null);
    setIsOfferModalOpen(true);
  };

  const openEditOffer = (offer: SimOffer) => {
    setOfferEditingId(offer.id);
    setOfferForm({
      name: offer.name,
      description: offer.description,
      operator: offer.operator,
      pricePerSim: offer.pricePerSim,
      dataQuotaMB: offer.dataQuotaMB,
      monthlySmsQuota: offer.monthlySmsQuota ?? null,
      validityDays: offer.validityDays ?? null,
      isActive: offer.isActive !== false
    });
    setOfferError(null);
    setIsOfferModalOpen(true);
  };

  const upsertOffer = () => {
    if (!offerForm.name.trim()) {
      setOfferError('Le nom de l’offre est obligatoire.');
      return;
    }
    if (!offerForm.operator.trim()) {
      setOfferError('L’opérateur téléphonique est obligatoire.');
      return;
    }
    if (!Number.isFinite(offerForm.pricePerSim) || offerForm.pricePerSim < 0) {
      setOfferError('Le prix par puce doit être un nombre positif.');
      return;
    }
    if (typeof offerForm.dataQuotaMB === 'number' && (!Number.isInteger(offerForm.dataQuotaMB) || offerForm.dataQuotaMB < 0)) {
      setOfferError('Le forfait data mensuel doit être un nombre entier positif.');
      return;
    }
    if (offerForm.monthlySmsQuota != null && (!Number.isInteger(offerForm.monthlySmsQuota) || offerForm.monthlySmsQuota < 0)) {
      setOfferError('Le nombre de SMS mensuels doit être un entier positif.');
      return;
    }
    if (offerForm.validityDays != null && (!Number.isInteger(offerForm.validityDays) || offerForm.validityDays < 0)) {
      setOfferError('La validité doit être un nombre entier de jours positif.');
      return;
    }
    setSimOffers((prev) => {
      if (offerEditingId === null) {
        const nextId = prev.length ? Math.max(...prev.map((o) => o.id)) + 1 : 1;
        return [
          ...prev,
          {
            id: nextId,
            name: offerForm.name.trim(),
            description: offerForm.description.trim(),
            operator: offerForm.operator.trim(),
            pricePerSim: Number(offerForm.pricePerSim),
            dataQuotaMB: offerForm.dataQuotaMB,
            monthlySmsQuota: offerForm.monthlySmsQuota,
            validityDays: offerForm.validityDays,
            isActive: offerForm.isActive
          }
        ];
      }
      return prev.map((o) =>
        o.id === offerEditingId
          ? {
              ...o,
              name: offerForm.name.trim(),
              description: offerForm.description.trim(),
              operator: offerForm.operator.trim(),
              pricePerSim: Number(offerForm.pricePerSim),
              dataQuotaMB: offerForm.dataQuotaMB,
              monthlySmsQuota: offerForm.monthlySmsQuota,
              validityDays: offerForm.validityDays,
              isActive: offerForm.isActive
            }
          : o
      );
    });
    setIsOfferModalOpen(false);
  };

  const deleteOffer = (offerId: number) => {
    setSimOffers((prev) => prev.filter((o) => o.id !== offerId));
    setSimCards((prev) => prev.map((s) => (s.offerId === offerId ? { ...s, offerId: null } : s)));
  };

  const toggleSimSelection = (simId: number) => {
    setSelectedSimIds((prev) => {
      const next = new Set(prev);
      if (next.has(simId)) next.delete(simId);
      else next.add(simId);
      return next;
    });
  };

  const toggleSelectAllFiltered = () => {
    if (allSelectableSelected) {
      setSelectedSimIds((prev) => {
        const next = new Set(prev);
        for (const s of selectableFilteredSims) next.delete(s.id);
        return next;
      });
    } else {
      setSelectedSimIds((prev) => {
        const next = new Set(prev);
        for (const s of selectableFilteredSims) next.add(s.id);
        return next;
      });
    }
  };

  const clearSelection = () => setSelectedSimIds(new Set());

  const closeAssignModal = () => {
    setIsAssignOpen(false);
    setAssignSimIds([]);
    setAssignClientName('');
  };

  const openAssignToClient = (sim: SimCard) => {
    setAssignSimIds([sim.id]);
    setAssignClientName(sim.client.endsWith('_Stock') ? '' : sim.client);
    setIsAssignOpen(true);
  };

  const openBulkAssignToClient = () => {
    const ids = Array.from(selectedSimIds);
    if (ids.length === 0) return;
    setAssignSimIds(ids);
    setAssignClientName('');
    setIsAssignOpen(true);
  };

  const getBulkAssignIdsForSim = (sim: SimCard) => {
    const ids = new Set(selectedSimIds);
    if (isSimSelectable(sim)) ids.add(sim.id);
    return Array.from(ids).filter((id) => {
      const s = visibleSims.find((x) => x.id === id);
      return s != null && isSimSelectable(s);
    });
  };

  const openBulkAssignFromContext = (sim: SimCard) => {
    const ids = getBulkAssignIdsForSim(sim);
    if (ids.length === 0) return;
    setSelectedSimIds(new Set(ids));
    setAssignSimIds(ids);
    setAssignClientName('');
    setIsAssignOpen(true);
  };

  const handleRowContextMenu = (e: React.MouseEvent, sim: SimCard) => {
    e.preventDefault();
    // Read-only profiles (Finance): no action menu
    if (!canManageSims) return;
    setContextMenu({ sim, x: e.clientX, y: e.clientY });
  };

  const confirmAssignToClient = () => {
    if (assignSimIds.length === 0 || !assignClientName) return;
    const client = clients.find((c) => c.name === assignClientName);
    if (!client) return;
    const idSet = new Set(assignSimIds);
    const targetClient = getSimAssignmentClientName(client);
    const targetReseller = client.type === 'Revendeur' ? client.name : client.reseller;
    setSimCards((prev) =>
      prev.map((s) =>
        idSet.has(s.id) ? { ...s, client: targetClient, reseller: targetReseller } : s
      )
    );
    closeAssignModal();
    clearSelection();
  };

  const unassignSim = (sim: SimCard) => {
    setSimCards((prev) =>
      prev.map((s) =>
        s.id === sim.id
          ? {
              ...s,
              client: isTunavUser ? 'Tunav_Stock' : `${currentUserName}_Stock`,
              reseller: isTunavUser ? 'Tunav' : currentUserName,
              equipmentId: undefined
            }
          : s
      )
    );
  };

  const confirmDeleteSim = () => {
    if (!simToDelete) return;
    setSimCards((prev) => prev.filter((s) => s.id !== simToDelete.id));
    setSimToDelete(null);
    setFicheId(null);
  };

  const exportFilteredExcel = () => {
    exportSimsToExcel(filteredSims, offerById, 'puces-export.xlsx', equipmentById);
  };

  const exportFilteredPdf = () => {
    exportSimsToPdf(
      filteredSims,
      offerById,
      'Gestion des puces — export',
      'puces-export.pdf',
      equipmentById
    );
  };

  const selCls =
    'h-control px-2 border border-border-strong rounded-control text-small bg-surface focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus';
  const overClient = data.alerts.overClients[0];

  const dateFr = mockToday.toLocaleDateString('fr-FR');
  const bell = (
    <SimsBell
      data={data}
      showPrices={showPrices}
      open={bellOpen}
      onToggle={setBellOpen}
      onOverClient={(c) => setDetail(overClientDetail(dctx, c))}
      onOpenSim={openFiche}
      onAlertGroup={(k) => setDetail(alertDetail(dctx, k))}
      onShowAll={() => {
        setFilters({ ...EMPTY_FILTERS, alert: 'toutes' });
        scrollToList();
      }}
    />
  );

  // Maquette validée sims (FleetAdmin-maquettes v3) : même page, mêmes données, mêmes fenêtres (Documentation et grands paragraphes retirés)
  return (
    <>
      <MaquettePage
        slug="sims"
        markup={simsMarkup}
        mount={mountSimsMaquette}
        view={''}
        role={''}
        actions={canManageSims ? { 'Offres puce': () => setIsOffersListOpen(true), 'Ajouter une puce': () => openCreateSim() } : undefined}
      />

      <Modal isOpen={ficheRow != null} onClose={() => setFicheId(null)} title="Fiche puce" size="lg">
        {ficheRow && (
          <SimFiche
            row={ficheRow}
            ctx={ctx}
            cons={cons}
            showPrices={showPrices}
            canManage={canManageSims}
            onEdit={() => {
              setFicheId(null);
              openEditSim(ficheRow.sim);
            }}
            onAssign={() => {
              setFicheId(null);
              openAssignToClient(ficheRow.sim);
            }}
            onUnassign={() => unassignSim(ficheRow.sim)}
            onDelete={() => {
              setFicheId(null);
              setSimToDelete(ficheRow.sim);
            }}
          />
        )}
      </Modal>

      {/* PU-A-21 – notification « En direct » (simulée au chargement) */}
      {!toastClosed && overClient && (
        <SimLiveToast
          client={overClient}
          onView={() => {
            setToastClosed(true);
            setDetail(overClientDetail(dctx, overClient));
          }}
          onClose={() => setToastClosed(true)}
        />
      )}

      {contextMenu && (() => {
        const sim = contextMenu.sim;
        const status = getSimStatus(sim);
        const selectable = isSimSelectable(sim);
        const bulkIds = getBulkAssignIdsForSim(sim);
        return (
          <SimTableContextMenu
            menu={contextMenu}
            onClose={() => setContextMenu(null)}
            selectedCount={selectedSimIds.size}
            isRowSelected={selectedSimIds.has(sim.id)}
            isSelectable={selectable}
            canAssign={status !== 'assigned_equipment'}
            canUnassign={status === 'assigned_client'}
            canDelete={status !== 'assigned_equipment'}
            bulkAssignCount={bulkIds.length}
            onEdit={() => openEditSim(sim)}
            onAssign={() => openAssignToClient(sim)}
            onUnassign={() => unassignSim(sim)}
            onDelete={() => setSimToDelete(sim)}
            onToggleSelection={() => toggleSimSelection(sim.id)}
            onBulkAssign={() => openBulkAssignFromContext(sim)}
          />
        );
      })()}

      {/* --- ADD/EDIT SIM MODAL --- */}
      <Modal
        isOpen={isSimModalOpen}
        onClose={() => setIsSimModalOpen(false)}
        title={simEditingId === null ? 'Ajouter une puce' : 'Modifier la puce'}
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-primary-50 text-primary p-3 rounded-control text-small flex items-start gap-3">
            <AlertCircle className="shrink-0 mt-0.5" size={16} />
            <p>
              Le <strong>numéro CCID (ICCID)</strong> est obligatoire. L'opérateur téléphonique est défini au
              niveau de l'offre puce.
            </p>
          </div>

          <div>
            <label className="text-label font-medium text-text mb-1 flex items-center gap-1.5">
              <Package size={14} className="text-text-muted" />
              Offre puce <span className="text-danger">*</span>
            </label>
            <select
              value={simForm.offerId ?? ''}
              onChange={(e) =>
                setSimForm((f) => ({ ...f, offerId: e.target.value ? Number(e.target.value) : null }))
              }
              className="w-full px-3 py-2 border border-border-strong rounded-card focus-visible:ring-3 focus-visible:ring-focus focus-visible:border-transparent text-small transition-shadow bg-surface"
            >
              <option value="">— Sélectionner une offre —</option>
              {simOffers.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} — {o.operator} ({formatPrice(o.pricePerSim)})
                </option>
              ))}
            </select>
            {simForm.offerId != null && (() => {
              const selectedOffer = offerById.get(simForm.offerId);
              if (!selectedOffer) return null;
              return (
                <p className="text-mention text-text-muted mt-1 flex items-center gap-1.5">
                  <Wifi size={11} />
                  Opérateur de l'offre&nbsp;: <strong className="text-text">{selectedOffer.operator}</strong>
                </p>
              );
            })()}
          </div>

          <div>
            <label className="text-label font-medium text-text mb-1 flex items-center gap-1.5">
              <Hash size={14} className="text-text-muted" />
              Numéro CCID (ICCID) <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={simForm.iccid}
              onChange={(e) => setSimForm((f) => ({ ...f, iccid: e.target.value }))}
              placeholder="Ex: 89330123456789012345"
              className="w-full px-3 py-2 border border-border-strong rounded-card focus-visible:ring-3 focus-visible:ring-focus focus-visible:border-transparent text-small transition-shadow"
            />
          </div>

          <div>
            <label className="text-label font-medium text-text mb-1 flex items-center gap-1.5">
              <Smartphone size={14} className="text-text-muted" />
              Numéro puce
            </label>
            <input
              type="text"
              value={simForm.phoneNumber}
              onChange={(e) => setSimForm((f) => ({ ...f, phoneNumber: e.target.value }))}
              placeholder="Ex: +216 71 12 34 56"
              className="w-full px-3 py-2 border border-border-strong rounded-card focus-visible:ring-3 focus-visible:ring-focus focus-visible:border-transparent text-small transition-shadow"
            />
            <p className="text-mention text-text-muted mt-1">Optionnel.</p>
          </div>

          {simError && (
            <div className="bg-danger-50 text-danger-700 border border-danger-200 rounded-control p-3 text-small">{simError}</div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-border-subtle">
            <button
              onClick={() => setIsSimModalOpen(false)}
              className="px-4 py-2 text-small font-medium text-text bg-surface border border-border rounded-control hover:bg-surface-muted transition-colors duration-fast ease-standard inline-flex items-center gap-2"
            >
              <XCircle size={16} />
              Annuler
            </button>
            <button
              onClick={upsertSim}
              className="px-4 py-2 text-small font-medium text-text-inverse bg-primary rounded-card hover:bg-primary-hover transition-colors duration-fast ease-standard inline-flex items-center gap-2"
            >
              <CheckCircle2 size={16} />
              {simEditingId === null ? 'Ajouter la puce' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </Modal>

      {/* --- OFFER LIST MODAL --- */}
      <Modal
        isOpen={isOffersListOpen}
        onClose={() => setIsOffersListOpen(false)}
        title="Offres puce"
        size="lg"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-end">
            <button
              onClick={openCreateOffer}
              className="bg-primary hover:bg-primary-hover text-text-inverse px-3 py-1.5 rounded-card text-small font-medium flex items-center gap-2 transition-colors duration-fast ease-standard"
            >
              <Plus size={14} />
              Nouvelle offre
            </button>
          </div>

          <div className="border border-border rounded-card divide-y divide-border-subtle overflow-hidden">
            {simOffers.length === 0 && (
              <div className="p-6 text-center text-small text-text-muted">Aucune offre. Créez-en une nouvelle.</div>
            )}
            {simOffers.map((offer) => {
              const usage = simCards.filter((s) => s.offerId === offer.id).length;
              return (
                <div key={offer.id} className="p-4 flex items-start justify-between gap-4 hover:bg-surface-muted">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-control text-mention font-semibold bg-primary-50 text-primary border border-primary-200">
                        {offer.name}
                      </span>
                      <span className="inline-flex items-center gap-1 text-mention font-medium text-text bg-surface-muted border border-border px-2 py-0.5 rounded-control">
                        <Wifi size={11} />
                        {offer.operator}
                      </span>
                      <span className="text-mention font-medium text-text">{formatPrice(offer.pricePerSim)} / puce</span>
                      {offer.isActive === false && (
                        <span className="text-mention font-medium text-danger-700">Inactive</span>
                      )}
                      <span className="text-mention text-text-muted">
                        {usage} puce{usage > 1 ? 's' : ''} associée{usage > 1 ? 's' : ''}
                      </span>
                    </div>
                    <p className="text-small text-text mt-1.5">{offer.description || '—'}</p>
                    {(formatMonthlyData(offer) || offer.monthlySmsQuota != null || offer.validityDays != null) && (
                      <p className="text-mention text-text-muted mt-1">
                        {[
                          formatMonthlyData(offer),
                          offer.monthlySmsQuota != null ? `${offer.monthlySmsQuota} SMS/mois` : null,
                          offer.validityDays != null ? `${offer.validityDays} jours de validité` : null
                        ].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEditOffer(offer)}
                      className="p-1.5 text-text-muted hover:text-primary hover:bg-primary-50 rounded-control transition-colors duration-fast ease-standard"
                      title="Modifier l'offre"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => deleteOffer(offer.id)}
                      className="p-1.5 text-text-muted hover:text-danger-700 hover:bg-danger-50 rounded-control transition-colors duration-fast ease-standard"
                      title="Supprimer l'offre"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Modal>

      {/* --- OFFER CREATE/EDIT MODAL --- */}
      <Modal
        isOpen={isOfferModalOpen}
        onClose={() => setIsOfferModalOpen(false)}
        title={offerEditingId === null ? 'Créer une offre puce' : 'Modifier une offre puce'}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-label font-medium text-text mb-1">Nom de l'offre <span className="text-danger">*</span></label>
            <input
              type="text"
              value={offerForm.name}
              onChange={(e) => setOfferForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ex: Data 5 Go + SMS"
              className="w-full px-3 py-2 border border-border-strong rounded-card focus-visible:ring-3 focus-visible:ring-focus focus-visible:border-transparent text-small transition-shadow"
            />
          </div>

          <div>
            <label className="block text-label font-medium text-text mb-1">Description</label>
            <textarea
              value={offerForm.description}
              onChange={(e) => setOfferForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Décrivez le contenu de l'offre…"
              rows={3}
              className="w-full px-3 py-2 border border-border-strong rounded-card focus-visible:ring-3 focus-visible:ring-focus focus-visible:border-transparent text-small transition-shadow"
            />
          </div>

          <div>
            <label className="text-label font-medium text-text mb-1 flex items-center gap-1.5">
              <Wifi size={14} className="text-text-muted" />
              Opérateur téléphonique <span className="text-danger">*</span>
            </label>
            <SearchableSelect
              value={offerForm.operator}
              onChange={(v) => setOfferForm((f) => ({ ...f, operator: v }))}
              options={OPERATORS}
              placeholder="Sélectionner un opérateur..."
            />
          </div>

          <div>
            <label className="block text-label font-medium text-text mb-1">Prix par puce (TND) <span className="text-danger">*</span></label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={offerForm.pricePerSim}
              onChange={(e) => setOfferForm((f) => ({ ...f, pricePerSim: Number(e.target.value) }))}
              className="w-full px-3 py-2 border border-border-strong rounded-card focus-visible:ring-3 focus-visible:ring-focus focus-visible:border-transparent text-small transition-shadow"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="offer-data-quota" className="block text-label font-medium text-text mb-1">Data mensuelle (Mo)</label>
              <input
                id="offer-data-quota"
                type="number"
                min={0}
                step={1}
                value={typeof offerForm.dataQuotaMB === 'number' ? offerForm.dataQuotaMB : ''}
                disabled={offerForm.dataQuotaMB === null}
                onChange={(e) => setOfferForm((f) => ({
                  ...f, dataQuotaMB: e.target.value === '' ? undefined : Number(e.target.value)
                }))}
                className="w-full px-3 py-2 border border-border-strong rounded-card focus-visible:ring-3 focus-visible:ring-focus focus-visible:border-transparent text-small disabled:bg-surface-muted"
              />
            </div>
            <div>
              <label htmlFor="offer-sms-quota" className="block text-label font-medium text-text mb-1">SMS / mois</label>
              <input
                id="offer-sms-quota"
                type="number"
                min={0}
                step={1}
                value={offerForm.monthlySmsQuota ?? ''}
                onChange={(e) => setOfferForm((f) => ({
                  ...f, monthlySmsQuota: e.target.value === '' ? null : Number(e.target.value)
                }))}
                className="w-full px-3 py-2 border border-border-strong rounded-card focus-visible:ring-3 focus-visible:ring-focus focus-visible:border-transparent text-small"
              />
            </div>
            <div>
              <label htmlFor="offer-validity" className="block text-label font-medium text-text mb-1">Validité (jours)</label>
              <input
                id="offer-validity"
                type="number"
                min={0}
                step={1}
                value={offerForm.validityDays ?? ''}
                onChange={(e) => setOfferForm((f) => ({
                  ...f, validityDays: e.target.value === '' ? null : Number(e.target.value)
                }))}
                className="w-full px-3 py-2 border border-border-strong rounded-card focus-visible:ring-3 focus-visible:ring-focus focus-visible:border-transparent text-small"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <label className="inline-flex items-center gap-2 text-small text-text">
              <input
                type="checkbox"
                checked={offerForm.dataQuotaMB === null}
                onChange={(e) => setOfferForm((f) => ({ ...f, dataQuotaMB: e.target.checked ? null : undefined }))}
                className="h-4 w-4 accent-primary"
              />
              Data illimitée
            </label>
            <label className="inline-flex items-center gap-2 text-small text-text">
              <input
                type="checkbox"
                checked={offerForm.isActive}
                onChange={(e) => setOfferForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="h-4 w-4 accent-primary"
              />
              Offre active
            </label>
          </div>

          {offerError && (
            <div className="bg-danger-50 text-danger-700 border border-danger-200 rounded-control p-3 text-small">{offerError}</div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-border-subtle">
            <button
              onClick={() => setIsOfferModalOpen(false)}
              className="px-4 py-2 text-small font-medium text-text bg-surface border border-border rounded-control hover:bg-surface-muted transition-colors duration-fast ease-standard"
            >
              Annuler
            </button>
            <button
              onClick={upsertOffer}
              className="px-4 py-2 text-small font-medium text-text-inverse bg-primary rounded-card hover:bg-primary-hover transition-colors duration-fast ease-standard"
            >
              Enregistrer
            </button>
          </div>
        </div>
      </Modal>

      {/* --- ASSIGN-TO-CLIENT MODAL --- */}
      <Modal
        isOpen={isAssignOpen}
        onClose={closeAssignModal}
        title={
          assignSimIds.length > 1
            ? `Affecter ${assignSimIds.length} puces à un client`
            : 'Affecter la puce à un client'
        }
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-primary-50 text-primary p-3 rounded-control text-small flex items-start gap-3">
            <ArrowLeftRight className="shrink-0 mt-0.5" size={16} />
            <p>
              {assignSimIds.length > 1
                ? `Sélectionnez le client auquel affecter les ${assignSimIds.length} puces. Elles sortiront du stock et pourront ensuite être associées à des équipements.`
                : 'Sélectionnez le client auquel affecter cette puce. La puce sortira du stock et pourra ensuite être associée à un équipement.'}
            </p>
          </div>

          <div className="bg-surface-muted border border-border rounded-control p-3 text-small">
            <p className="text-overline font-medium text-text-muted uppercase mb-2">
              {assignSimsPreview.length > 1 ? 'Puces sélectionnées' : 'Puce sélectionnée'}
            </p>
            <ul className="max-h-40 overflow-y-auto divide-y divide-border-subtle">
              {assignSimsPreview.map((sim) => {
                const offer = sim.offerId != null ? offerById.get(sim.offerId) : undefined;
                return (
                  <li key={sim.id} className="py-2 first:pt-0 last:pb-0 flex flex-col gap-0.5">
                    {sim.phoneNumber ? (
                      <span className="font-medium text-text">{sim.phoneNumber}</span>
                    ) : (
                      <span className="text-text-muted italic text-mention">Pas de numéro</span>
                    )}
                    {sim.iccid && (
                      <span className="text-mention text-text-muted">
                        ICCID&nbsp;: <strong>{sim.iccid}</strong>
                      </span>
                    )}
                    {offer && (
                      <span className="text-mention text-text-muted">
                        {offer.name} · {offer.operator}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <label className="block text-label font-medium text-text mb-1">Client</label>
            <SearchableSelect
              value={assignClientName}
              onChange={setAssignClientName}
              options={assignableClients.map((c) => c.name)}
              placeholder="Sélectionner un client..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border-subtle">
            <button
              onClick={closeAssignModal}
              className="px-4 py-2 text-small font-medium text-text bg-surface border border-border rounded-control hover:bg-surface-muted transition-colors duration-fast ease-standard"
            >
              Annuler
            </button>
            <button
              onClick={confirmAssignToClient}
              disabled={!assignClientName}
              className="px-4 py-2 text-small font-medium text-text-inverse bg-primary rounded-card hover:bg-primary-hover transition-colors duration-fast ease-standard disabled:bg-border disabled:cursor-not-allowed"
            >
              {assignSimIds.length > 1 ? `Affecter ${assignSimIds.length} puces` : 'Affecter'}
            </button>
          </div>
        </div>
      </Modal>

      {/* --- DELETE CONFIRM MODAL --- */}
      <Modal
        isOpen={simToDelete !== null}
        onClose={() => setSimToDelete(null)}
        title="Supprimer la puce"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-danger-50 text-danger-700 p-3 rounded-control text-small flex items-start gap-3">
            <AlertCircle className="shrink-0 mt-0.5" size={16} />
            <p>
              Cette action est <strong>irréversible</strong>. La puce sera définitivement supprimée du système.
            </p>
          </div>

          {simToDelete && (
            <div className="bg-surface-muted border border-border rounded-control p-3 text-small flex flex-col gap-1">
              {simToDelete.phoneNumber && (
                <div>
                  <span className="text-text-muted">Numéro puce&nbsp;:</span> <strong>{simToDelete.phoneNumber}</strong>
                </div>
              )}
              {simToDelete.iccid && (
                <div>
                  <span className="text-text-muted">ICCID&nbsp;:</span> <strong>{simToDelete.iccid}</strong>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-border-subtle">
            <button
              onClick={() => setSimToDelete(null)}
              className="px-4 py-2 text-small font-medium text-text bg-surface border border-border rounded-control hover:bg-surface-muted transition-colors duration-fast ease-standard"
            >
              Annuler
            </button>
            <button
              onClick={confirmDeleteSim}
              className="px-4 py-2 text-small font-medium text-text-inverse bg-danger rounded-card hover:bg-danger-hover transition-colors duration-fast ease-standard inline-flex items-center gap-2"
            >
              <Trash2 size={16} />
              Supprimer
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
