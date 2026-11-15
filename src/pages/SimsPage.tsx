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
  BookOpen,
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
  MIN_MO,
  MUTE_DAYS,
  NETWORK_ORDER,
  PERIOD_OPTIONS,
  REMIND_PCT,
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

const OPERATORS = ['Télécom', 'Orange', 'Ooredoo'];

function formatPrice(value: number) {
  return formatTnd(value);
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
  }>({
    name: '',
    description: '',
    operator: '',
    pricePerSim: 0
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
    setOfferForm({ name: '', description: '', operator: '', pricePerSim: 0 });
    setOfferError(null);
    setIsOfferModalOpen(true);
  };

  const openEditOffer = (offer: SimOffer) => {
    setOfferEditingId(offer.id);
    setOfferForm({
      name: offer.name,
      description: offer.description,
      operator: offer.operator,
      pricePerSim: offer.pricePerSim
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
            pricePerSim: Number(offerForm.pricePerSim)
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
              pricePerSim: Number(offerForm.pricePerSim)
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

  return (
    <div className="space-y-8 pb-8">
      {/* 0. En-tête v3 : titre, Documentation (bientôt), exports, Offres puce, Ajouter une puce, date, cloche à droite */}
      <header className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-title text-text">Gestion des puces</h1>
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
            <TableExportButtons size="compact" onExportExcel={exportFilteredExcel} onExportPdf={exportFilteredPdf} disabled={filteredSims.length === 0} />
            {canManageSims && (
              <>
                <button
                  type="button"
                  onClick={() => setIsOffersListOpen(true)}
                  className="inline-flex items-center gap-2 h-control px-3 text-button-sm rounded-control border border-border bg-surface text-text hover:bg-surface-muted transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
                >
                  <Tag size={16} aria-hidden="true" />
                  Offres puce
                </button>
                <button
                  type="button"
                  onClick={openCreateSim}
                  className="inline-flex items-center gap-2 h-control px-3 text-button-sm rounded-control bg-primary text-text-inverse hover:bg-primary-hover transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus focus-visible:ring-offset-2"
                >
                  <Plus size={16} aria-hidden="true" />
                  Ajouter une puce
                </button>
              </>
            )}
            <span className="inline-flex items-center gap-2 h-control px-3 rounded-control border border-border bg-surface text-small text-text">
              <span className="h-2 w-2 rounded-pill bg-success" aria-hidden="true" />
              Aujourd’hui <b className="tabular-nums">{mockToday.toLocaleDateString('fr-FR')}</b>
            </span>
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
          </div>
        </div>
        <p className="text-small text-text-muted">
          Puces SIM de Tunav et de ses revendeurs : offre, prix fixe par puce et par mois, affectation aux clients et équipements. Une puce est installée
          (son équipement est posé) ou non installée.{!canManageSims ? ' Finance : consultation seulement (aucune action).' : ''}
        </p>

        {/* Barre d'outils : Réseau en premier, puis période */}
        <div className="flex flex-wrap items-center gap-3 rounded-card border border-border bg-surface px-4 py-3">
          <label className="inline-flex items-center gap-2 text-small text-text">
            <Network size={16} aria-hidden="true" className="text-text-muted" />
            <span className="font-medium">Réseau</span>
            <select value={network} onChange={(e) => setNetwork(e.target.value)} className={selCls}>
              <option value="">Tout le réseau</option>
              {allNetworks.map((n) => (
                <option key={n} value={n}>
                  {networkLabel(n)}
                </option>
              ))}
            </select>
          </label>
          <span className="hidden sm:block h-6 w-px bg-border" aria-hidden="true" />
          <div className="inline-flex flex-wrap items-center gap-0.5 rounded-control border border-border p-0.5" role="group" aria-label="Période">
            <CalendarDays size={16} aria-hidden="true" className="mx-1.5 text-text-muted" />
            {PERIOD_OPTIONS.map((p) => (
              <button
                key={p.key}
                type="button"
                aria-pressed={periodKind === p.key}
                onClick={() => setPeriodKind(p.key)}
                className={`h-8 px-3 text-button-sm rounded-control transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus ${
                  periodKind === p.key ? 'bg-primary text-text-inverse' : 'text-text hover:bg-surface-muted'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {periodKind === 'mois' && (
            <select value={month} onChange={(e) => setMonth(e.target.value)} aria-label="Mois" className={selCls}>
              {ctx.yearMonths.map((m) => (
                <option key={m} value={m}>
                  {formatMonthFr(m)}
                  {m === ctx.currentMonth ? ' (en cours)' : ''}
                </option>
              ))}
            </select>
          )}
        </div>
        <p className="text-mention text-text-muted">
          Période : <b className="text-text">{period.label}</b>
          {period.estimated ? ' (estimée à partir des totaux mensuels)' : ''} · {fmt(data.total)} puces : Tunav {fmt(data.tunavSims)} · revendeurs{' '}
          {fmt(data.resellerSims)} · paramètres (à confirmer) : @MinMo {fmt(MIN_MO)} Mo · @RemindPct {fmt(REMIND_PCT)} % · @MuteDays {fmt(MUTE_DAYS)} j
        </p>
      </header>

      {/* 1. Quatre cartes · 2. Puces installées par offre (PU-P-05) */}
      <SimsTopCards
        data={data}
        period={period}
        showPrices={showPrices}
        onTotal={() => setDetail(totalDetail(dctx))}
        onInstalled={() => setDetail(installedDetail(dctx))}
        onNotInstalled={() => setDetail(notInstalledDetail(dctx))}
        onOver={() => setDetail(overDetail(dctx))}
        onOffer={(o) => setDetail(offerDetail(dctx, o))}
        onOfferList={() => undefined}
      />
      <SimsOffers
        data={data}
        period={period}
        showPrices={showPrices}
        onTotal={() => undefined}
        onInstalled={() => undefined}
        onNotInstalled={() => undefined}
        onOver={() => undefined}
        onOffer={(o) => setDetail(offerDetail(dctx, o))}
        onOfferList={(o) => {
          setFilters({ ...EMPTY_FILTERS, offer: o.key });
          scrollToList();
        }}
      />

      {/* 3. Liste des puces PU-T-21 (T-21) – une ligne ouvre la fiche PU-F-21 */}
      <section aria-labelledby="pu-t21" className="space-y-3 scroll-mt-4" ref={listRef} data-kpi="PU-T-21">
        <SectionTitle id="pu-t21" title="Liste des puces" hint="Cliquez sur une puce pour voir sa fiche" />
        <div className="bg-surface rounded-card border border-border overflow-hidden">
          <div className="p-4 border-b border-border-subtle bg-surface-muted flex flex-wrap items-end gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} aria-hidden="true" />
              <input
                type="search"
                aria-label="Recherche"
                placeholder="Numéro, ICCID, ID, client, équipement, opérateur…"
                value={filters.q}
                onChange={(e) => setFilter('q', e.target.value)}
                className="w-full h-control pl-9 pr-4 bg-surface border border-border-strong rounded-control focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus text-small"
              />
            </div>
            <select aria-label="Statut" value={filters.status} onChange={(e) => setFilter('status', e.target.value as StatusFilter)} className={selCls}>
              {STATUS_FILTERS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.key ? s.label : 'Statut : tous'}
                </option>
              ))}
            </select>
            <select aria-label="Offre" value={filters.offer} onChange={(e) => setFilter('offer', e.target.value)} className={selCls}>
              <option value="">Offre : toutes</option>
              {data.offers.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.name}
                </option>
              ))}
            </select>
            <select aria-label="Opérateur" value={filters.operator} onChange={(e) => setFilter('operator', e.target.value)} className={selCls}>
              <option value="">Opérateur : tous</option>
              {operatorOptions.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
            <select aria-label="Revendeur" value={filters.network} onChange={(e) => setFilter('network', e.target.value)} className={selCls}>
              <option value="">Revendeur : tous</option>
              {scopeNetworks.map((n) => (
                <option key={n} value={n}>
                  {n === 'Tunav' ? 'Tunav (clients directs)' : n}
                </option>
              ))}
            </select>
            <select aria-label="Client" value={filters.client} onChange={(e) => setFilter('client', e.target.value)} className={`${selCls} max-w-[14rem]`}>
              <option value="">Client : tous</option>
              {clientOptions.map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
            <select aria-label="Alerte" value={filters.alert} onChange={(e) => setFilter('alert', e.target.value as AlertFilter)} className={selCls}>
              {ALERT_FILTERS.map((a) => (
                <option key={a.key} value={a.key}>
                  {a.key ? a.label : 'Alerte : toutes'}
                </option>
              ))}
            </select>
            {hasFilters && (
              <button
                type="button"
                onClick={() => setFilters(EMPTY_FILTERS)}
                className="inline-flex items-center gap-1 h-control px-3 text-button-sm rounded-control text-primary hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
              >
                <X size={14} aria-hidden="true" /> Effacer les filtres
              </button>
            )}
          </div>
          <p className="px-4 py-2 text-small text-text border-b border-border-subtle">
            <b>{fmt(filteredRows.length)}</b> puce(s){showPrices ? ` · coût ${formatTnd(filteredCost)} / mois` : ''}
            {filters.alert === 'surconso' ? ` · au-delà du forfait sur ${period.label}` : ''}
          </p>

          {canManageSims && selectedSimIds.size > 0 && (
            <div className="px-4 py-3 bg-primary-50 border-b border-primary-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-small text-primary">
                <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-2 rounded-pill bg-primary text-text-inverse text-mention font-semibold">
                  {selectedSimIds.size}
                </span>
                <span className="font-medium">
                  puce{selectedSimIds.size > 1 ? 's' : ''} sélectionnée{selectedSimIds.size > 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={clearSelection}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-mention font-medium text-text bg-surface border border-border rounded-control hover:bg-surface-muted transition-colors duration-fast ease-standard"
                >
                  <X size={14} />
                  Tout désélectionner
                </button>
                <button
                  type="button"
                  onClick={openBulkAssignToClient}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-mention font-medium text-text-inverse bg-primary rounded-card hover:bg-primary-hover transition-colors duration-fast ease-standard"
                >
                  <ArrowLeftRight size={14} />
                  Affecter au client
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto" onContextMenu={(e) => e.preventDefault()}>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border-subtle text-text-muted text-overline uppercase bg-surface-muted">
                  {canManageSims && (
                    <th className="p-3 w-10">
                      <input
                        type="checkbox"
                        checked={allSelectableSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = someSelectableSelected && !allSelectableSelected;
                        }}
                        onChange={toggleSelectAllFiltered}
                        disabled={selectableFilteredSims.length === 0}
                        aria-label="Tout sélectionner (puces affectables)"
                        className="rounded-control border-border-strong text-primary focus-visible:ring-focus"
                      />
                    </th>
                  )}
                  <th className="p-3 font-medium">Numéro / ICCID</th>
                  <th className="p-3 font-medium">Client · équipement</th>
                  <th className="p-3 font-medium">Revendeur</th>
                  <th className="p-3 font-medium">Offre · prix</th>
                  <th className="p-3 font-medium">Activation</th>
                  <th className="p-3 font-medium">Statut</th>
                  {canManageSims && <th className="p-3 font-medium text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="text-small divide-y divide-border-subtle">
                {pager.slice.map((r) => {
                  const sim = r.sim;
                  const status = getSimStatus(sim);
                  const selectable = isSimSelectable(sim);
                  const isSelected = selectedSimIds.has(sim.id);
                  return (
                    <tr
                      key={sim.id}
                      tabIndex={0}
                      onClick={() => openFiche(r)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.target === e.currentTarget) openFiche(r);
                      }}
                      className={`cursor-pointer hover:bg-primary-50 transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-focus ${isSelected ? 'bg-primary-50' : ''} ${contextMenu?.sim.id === sim.id ? 'ring-1 ring-inset ring-primary-200' : ''}`}
                      onContextMenu={(e) => handleRowContextMenu(e, sim)}
                    >
                      {canManageSims && (
                        <td className="p-3 w-10" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={!selectable}
                            onChange={() => toggleSimSelection(sim.id)}
                            aria-label={selectable ? `Sélectionner la puce ${sim.id}` : 'Non sélectionnable (affectée à un équipement)'}
                            className="rounded-control border-border-strong text-primary focus-visible:ring-focus disabled:opacity-40"
                          />
                        </td>
                      )}
                      <td className="p-3">
                        <span className="font-medium text-text inline-flex items-center gap-1.5">
                          <Smartphone size={14} className="text-text-muted" aria-hidden="true" />
                          {sim.phoneNumber || <span className="italic text-text-muted">Pas de numéro</span>}
                        </span>
                        <span className="block text-mention text-text-muted">
                          <Hash size={11} className="inline" aria-hidden="true" /> {sim.iccid || 'Pas d’ICCID'}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="block font-medium text-text">{r.clientLabel}</span>
                        <span className="block text-mention text-text-muted">
                          {r.eq ? `${r.eq.serial} · ${r.installed ? 'installé' : 'non installé'}` : 'Aucun équipement'}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="block text-text">{r.network}</span>
                        <span className="block text-mention text-text-muted">{r.network === 'Tunav' ? 'client direct' : 'revendeur'}</span>
                      </td>
                      <td className="p-3">
                        {r.offer ? (
                          <>
                            <span className="block text-text">
                              {r.offer.name.split(' - ')[0]} · {r.offer.operator}
                            </span>
                            {showPrices && <span className="block text-mention text-text-muted">{formatTnd(r.offer.pricePerSim)} / mois</span>}
                          </>
                        ) : (
                          <span className="italic text-mention text-text-muted">Aucune offre</span>
                        )}
                      </td>
                      <td className="p-3 tabular-nums text-text">{frDate(sim.activationDate)}</td>
                      <td className="p-3">
                        <SimStatusBadge row={r} />
                      </td>
                      {canManageSims && (
                        <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEditSim(sim)}
                              className="p-1.5 text-text-muted hover:text-primary hover:bg-primary-50 rounded-control transition-colors duration-fast ease-standard"
                              title="Modifier la puce"
                              aria-label="Modifier la puce"
                            >
                              <Edit2 size={16} />
                            </button>
                            {status !== 'assigned_equipment' && (
                              <button
                                type="button"
                                onClick={() => openAssignToClient(sim)}
                                className="p-1.5 text-text-muted hover:text-success-700 hover:bg-success-50 rounded-control transition-colors duration-fast ease-standard"
                                title="Affecter à un client"
                                aria-label="Affecter à un client"
                              >
                                <ArrowLeftRight size={16} />
                              </button>
                            )}
                            {status === 'assigned_client' && (
                              <button
                                type="button"
                                onClick={() => unassignSim(sim)}
                                className="p-1.5 text-text-muted hover:text-warning-700 hover:bg-warning-50 rounded-control transition-colors duration-fast ease-standard"
                                title="Retirer du client (retour au stock)"
                                aria-label="Retirer du client (retour au stock)"
                              >
                                <Unlink size={16} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setSimToDelete(sim)}
                              className="p-1.5 text-text-muted hover:text-danger-700 hover:bg-danger-50 rounded-control transition-colors duration-fast ease-standard disabled:opacity-40"
                              title="Supprimer la puce"
                              aria-label="Supprimer la puce"
                              disabled={status === 'assigned_equipment'}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-text-muted">
                      Aucune puce trouvée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pager pager={pager} label="Pagination de la liste des puces" />
        </div>
      </section>

      {/* 4. Consommation data : PU-C-21 puis PU-C-25 */}
      <section aria-labelledby="pu-cons" className="space-y-3">
        <SectionTitle id="pu-cons" title="Consommation data" hint="Cliquez sur un revendeur pour voir ses clients, sur un client pour voir ses puces" />
        <SimsConsumption data={data} period={period} onOpenSim={openFiche} onOverNetwork={(n) => setDetail(overNetworkDetail(dctx, n))} />
      </section>

      {/* 5. Statistiques (sans prix) */}
      <SimsStats
        data={data}
        period={period}
        ctx={ctx}
        cons={cons}
        networks={scopeNetworks}
        onStatus={(ins) => setDetail(statusDetail(dctx, ins))}
        onOffer={(o) => setDetail(offerDetail(dctx, o, 'PU-S-21'))}
        onOperator={(o) => setDetail(operatorDetail(dctx, o))}
        onOpenDetail={setDetail}
      />

      <DetailModal detail={detail} onClose={() => setDetail(null)} canOpen={() => false} />

      {/* PU-F-21 – fiche puce */}
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
          <div className="flex items-center justify-between">
            <p className="text-small text-text-muted">
              Créez et gérez les offres tarifaires applicables aux puces SIM.
            </p>
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
                      <span className="text-mention text-text-muted">
                        {usage} puce{usage > 1 ? 's' : ''} associée{usage > 1 ? 's' : ''}
                      </span>
                    </div>
                    <p className="text-small text-text mt-1.5">{offer.description || '—'}</p>
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
    </div>
  );
}
