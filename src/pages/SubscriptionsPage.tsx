/**
 * Gestion des Packs v3 (Packs-v3 · Documentation-Packs-v3) – carte FleetIQ 08.
 * Ordre de la page (doc) : en-tête (cloche à droite, 7 j · 30 j · 3 mois · Personnalisé, « Au » = aujourd'hui,
 * « Comparer » optionnel) + bandeau ≤ 10 j → cartes PK-P-01, P-02, P-03, P-05 → À traiter PK-A-10…A-13 →
 * Packs les plus choisis (PK-P-03, PK-P-06) → Catalogue et affectations (packs, clients, Modifier, Paiement) →
 * Fonctionnalités par pack (PK-P-04) → Usage et renouvellement (PK-P-05, PK-A-10 / PK-A-11).
 * Aucun prix sur cette page. Droits : Admin tout ; Finance = paiement, sans créer / modifier un pack ni affecter ;
 * Revendeur, Responsable SAV, Technicien SAV : pas d'accès (redirigés par App.tsx).
 * Hors périmètre (décision 2026-11-14) : filtre B2B / B2C, « changements d'offre » (historique dans la fiche client),
 * « Packs vendus aux revendeurs ».
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Edit2,
  AlertTriangle,
  CheckCircle2,
  Package,
  XCircle,
  ChevronDown,
  ChevronRight,
  Check,
  ListChecks,
  CreditCard,
  Ban,
  CalendarDays,
  GitCompareArrows,
  Plus,
  X
} from 'lucide-react';
import { Modal } from '../components/Modal';
import { TableExportButtons } from '../components/TableExportButtons';
import { BellMenu } from '../components/dashboard/BellMenu';
import { DetailModal, type DetailSpec } from '../components/dashboard/DetailModal';
import { SectionTitle } from '../components/clients/ClientsOverview';
import { CriticalBanner, PacksOverview } from '../components/packs/PacksOverview';
import { ResellerPacksSection } from '../components/packs/PacksResellers';
import { PageChrome, PageShell } from '../components/shell/PageShell';
import { Button } from '../components/ui/Button';
import { ALERT_META, alertDetail } from '../components/packs/packsAlerts';
import { FeaturesSection, PacksChosenSection, UsageSection } from '../components/packs/PacksCharts';
import {
  useFleetStore,
  EQUIPMENT_TYPES,
  type ClientPackAssignment,
  type EquipmentType,
  type FleetClient,
  type Pack as StorePack
} from '../state/FleetStore';
import { useBackofficePermissions } from '../hooks/useBackofficePermissions';
import { startOfDay, toIsoDate, parseDate } from '../state/mock/dates';
import type { TodoItem } from '../utils/dashboardKpis';
import { applyClientBlock, applyPaymentValidation, validatePaymentExpiry } from '../utils/clientPayment';
import { FEATURE_CATALOG, countSelectedLeaves, flattenLeafIds, toggleAllLeaves, type FeatureNode } from '../utils/packFeatureCatalog';
import {
  computePacks,
  fmt,
  frDate,
  lastCommLabel,
  namesWithDays,
  PK_ALERT_KEYS,
  resolveCompare,
  resolvePeriod,
  sortClientsForList,
  type CompareKind,
  type Period,
  type PeriodKind,
  type PkAlertKey,
  type PkClient
} from '../utils/packsKpis';
import {
  exportPackClientsToExcel,
  exportPackClientsToPdf,
  exportPacksListToExcel,
  exportPacksListToPdf
} from '../utils/packTableExport';
import { MaquettePage } from '../components/shell/MaquettePage';
import packsMarkup from '../components/packs/maquette/markup.html?raw';
import { mount as mountPacksMaquette } from '../components/packs/maquette/script';
import '../components/packs/maquette/style.css';

/** Pack de la page : le nom est libre à la création (« Nouveau pack ») */
type Pack = Omit<StorePack, 'name'> & { name: string };

// TUNAV (tokens.md §10.4) : une seule pastille de pack, identifiée par son nom. Le champ « Couleur » du formulaire
// est supprimé (carte 08, décidé en carte 04) ; la donnée `color` reste dans le jeu fictif (Pack.Color du schéma).
const PACK_BADGE = 'bg-primary-100 text-primary border border-primary-200';
const PACK_ORDER = ['FleetIQ Secure', 'FleetIQ Pro', 'FleetIQ Mechanic', 'FleetIQ Vision'];
const PAGE_SIZE = 25;

const PERIOD_OPTIONS: Array<{ key: PeriodKind; label: string }> = [
  { key: '7d', label: '7 jours' },
  { key: '30d', label: '30 jours' },
  { key: '3m', label: '3 mois' },
  { key: 'custom', label: 'Personnalisé' }
];
const PERIOD_PARAM: Record<string, PeriodKind> = { '7j': '7d', '30j': '30d', '3m': '3m' };

export function SubscriptionsPage() {
  const {
    packs: basePacks,
    clients: allClients,
    setClients,
    equipments,
    mockToday,
    dashboardSettings,
    disconnectThresholdHours
  } = useFleetStore();
  const permissions = useBackofficePermissions();
  const canCreateEditPacks = permissions?.subscriptions.canCreateEdit ?? false;
  const canAssignPacks = permissions?.subscriptions.canAssignPacks ?? false;
  const canManagePayment = permissions?.subscriptions.canManagePayment ?? false;
  const allLeafFeatureIds = useMemo(() => flattenLeafIds(FEATURE_CATALOG), []);
  const equipmentTypes = EQUIPMENT_TYPES;
  const today = useMemo(() => startOfDay(mockToday), [mockToday]);
  const todayIso = toIsoDate(today);

  const [packs, setPacks] = useState<Pack[]>(basePacks as Pack[]);

  /* ---------- barre d'outils : période + comparaison ---------- */
  const [periodKind, setPeriodKind] = useState<PeriodKind>('30d');
  const [auIso, setAuIso] = useState(todayIso);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState(todayIso);
  const [compareOn, setCompareOn] = useState(false);
  const [compareKind, setCompareKind] = useState<CompareKind>('prev');
  const [cmpFrom, setCmpFrom] = useState('');
  const [cmpTo, setCmpTo] = useState('');
  const au = parseDate(auIso) ?? today;
  const periodRes = resolvePeriod(periodKind, au > today ? today : au, customFrom, customTo);
  const fallback = resolvePeriod('30d', today, '', '').period as Period;
  const period = periodRes.period ?? fallback;
  const compareRes = compareOn ? resolveCompare(compareKind, period, cmpFrom, cmpTo) : { period: null, error: '' };
  const periodLabel =
    periodKind === 'custom' ? `${frDate(period.from)} → ${frDate(period.to)}` : periodKind === '7d' ? '7 j' : periodKind === '30d' ? '30 j' : '3 mois';
  const compareLabel = compareRes.period
    ? compareKind === 'prev'
      ? 'vs période précédente'
      : compareKind === 'year'
        ? 'vs même période l’an dernier'
        : `vs ${frDate(compareRes.period.from)} → ${frDate(compareRes.period.to)}`
    : null;

  /* ---------- KPI (PK-) ---------- */
  const data = useMemo(
    () =>
      computePacks({
        clients: allClients,
        equipments,
        packs: packs as unknown as StorePack[],
        today,
        now: new Date(),
        connHours: disconnectThresholdHours,
        graceDays: dashboardSettings.graceDays,
        critDays: dashboardSettings.critDays,
        renewDays: dashboardSettings.renewDays,
        period,
        compare: compareRes.period
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allClients, equipments, packs, today, disconnectThresholdHours, dashboardSettings, period.from.getTime(), period.to.getTime(), compareRes.period?.from.getTime(), compareRes.period?.to.getTime()]
  );

  /* ---------- liste des clients (Catalogue et affectations) ---------- */
  const [clientSearch, setClientSearch] = useState('');
  const [packSearch, setPackSearch] = useState('');
  const [packFilter, setPackFilter] = useState('');
  const [alertFilter, setAlertFilter] = useState<PkAlertKey | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [detail, setDetail] = useState<DetailSpec | null>(null);
  const [bellOpen, setBellOpen] = useState(false);
  const [bannerClosed, setBannerClosed] = useState(false);
  const catalogRef = useRef<HTMLElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  // Paramètres d'URL (liens du Tableau de bord, de la cloche et des détails de la page), lus une fois :
  // ?alerte=critique|anticiper|hors_pack|bloques · ?pack=<id>|none · ?q=<texte> · ?periode=7j|30j|3m
  useEffect(() => {
    const keys = ['alerte', 'pack', 'q', 'periode'];
    if (!keys.some((k) => searchParams.has(k))) return;
    const alerte = searchParams.get('alerte') ?? '';
    setAlertFilter((PK_ALERT_KEYS as string[]).includes(alerte) ? (alerte as PkAlertKey) : null);
    setPackFilter(searchParams.get('pack') ?? '');
    setClientSearch(searchParams.get('q') ?? '');
    const per = PERIOD_PARAM[searchParams.get('periode') ?? ''];
    if (per) setPeriodKind(per);
    setVisibleCount(PAGE_SIZE);
    setSearchParams({}, { replace: true });
    window.setTimeout(() => catalogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
  }, [searchParams, setSearchParams]);

  const packById = useMemo(() => new Map(packs.map((p) => [p.id, p])), [packs]);

  const filteredPacks = useMemo(() => {
    const q = packSearch.trim().toLowerCase();
    const rank = (n: string) => (PACK_ORDER.includes(n) ? PACK_ORDER.indexOf(n) : 999);
    const base = packs.slice().sort((a, b) => rank(a.name) - rank(b.name) || a.id - b.id);
    if (!q) return base;
    return base.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
  }, [packSearch, packs]);
  const allPacksSorted = useMemo(() => {
    const rank = (n: string) => (PACK_ORDER.includes(n) ? PACK_ORDER.indexOf(n) : 999);
    return packs.slice().sort((a, b) => rank(a.name) - rank(b.name) || a.id - b.id);
  }, [packs]);

  const listClients = useMemo(() => {
    const q = clientSearch.trim().toLowerCase();
    let list: PkClient[] = alertFilter ? data.alerts[alertFilter] : data.clients;
    if (packFilter === 'none') list = list.filter((c) => c.packs.length === 0);
    else if (packFilter) list = list.filter((c) => c.packs.some((p) => String(p.id) === packFilter));
    if (q) list = list.filter((c) => c.client.name.toLowerCase().includes(q) || c.client.email.toLowerCase().includes(q) || c.owner.toLowerCase().includes(q));
    return sortClientsForList(list);
  }, [clientSearch, alertFilter, packFilter, data]);
  const filteredClients: FleetClient[] = useMemo(() => listClients.map((c) => c.client), [listClients]);

  const clientsPerPack = useMemo(() => new Map(data.packRows.map((r) => [r.pack.id, r.clients.length])), [data]);

  const bellItems: TodoItem[] = useMemo(() => {
    const item = (k: PkAlertKey, priority: 1 | 2 | 3): TodoItem => {
      const list = data.alerts[k];
      const n = k === 'hors_pack' ? list.reduce((s, c) => s + c.outOfPack.length, 0) : list.length;
      return {
        id: k,
        sourceRule: `Packs ${ALERT_META[k].mockup}`,
        priority,
        title: ALERT_META[k].title(data),
        detail:
          k === 'critique' || k === 'anticiper'
            ? list.length
              ? namesWithDays(list, 3)
              : 'Aucun'
            : list.length
              ? list.slice(0, 3).map((c) => c.client.name).join(', ') + (list.length > 3 ? '…' : '')
              : 'Aucun',
        count: n,
        unit: ALERT_META[k].unit,
        what: '',
        route: 'subscriptions',
        routeLabel: 'la liste des clients',
        routeQuery: `?alerte=${k}`
      };
    };
    return [item('critique', 1), item('bloques', 1), item('hors_pack', 2), item('anticiper', 3)].filter((t) => t.count > 0);
  }, [data]);

  // --- Create/Edit pack modal ---
  const [isPackModalOpen, setIsPackModalOpen] = useState(false);
  const [packEditingId, setPackEditingId] = useState<number | null>(null);
  const [packName, setPackName] = useState('');
  const [packDescription, setPackDescription] = useState('');
  const [packEquipments, setPackEquipments] = useState<EquipmentType[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(new Set());
  const [featureSearch, setFeatureSearch] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['module:suivie', 'module:parc']));

  // --- Assign pack to client modal ---
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [clientToAssign, setClientToAssign] = useState<FleetClient | null>(null);
  const [selectedPackIds, setSelectedPackIds] = useState<Set<number>>(new Set());

  // --- Quotas modal (per client) – inchangé (ouverture non reliée à l'écran, comme avant) ---
  const [isQuotasModalOpen, setIsQuotasModalOpen] = useState(false);
  const [clientToEditQuotas] = useState<FleetClient | null>(null);
  const [quotaVehicleLimit] = useState<number>(0);
  const [quotaEquipmentLimits, setQuotaEquipmentLimits] = useState<Partial<Record<EquipmentType, number>>>({});
  const [quotaError, setQuotaError] = useState<string | null>(null);

  // --- Payment modal ---
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [clientForPayment, setClientForPayment] = useState<FleetClient | null>(null);
  const [newExpiry, setNewExpiry] = useState('');

  const openCreatePackModal = () => {
    setPackEditingId(null);
    setPackName('');
    setPackDescription('');
    setPackEquipments([]);
    setSelectedFeatures(new Set());
    setFeatureSearch('');
    setExpandedNodes(new Set(['module:suivie', 'module:parc']));
    setIsPackModalOpen(true);
  };

  const openEditPackModal = (pack: Pack) => {
    setPackEditingId(pack.id);
    setPackName(pack.name);
    setPackDescription(pack.description);
    setPackEquipments(pack.supportedEquipments);
    setSelectedFeatures(new Set(pack.features));
    setFeatureSearch('');
    setExpandedNodes(new Set(['module:suivie', 'module:parc', 'module:alerte', 'module:rapport', 'module:dashboard']));
    setIsPackModalOpen(true);
  };

  const upsertPack = () => {
    const name = packName.trim();
    if (!name) return;

    const features = Array.from(selectedFeatures);
    const existing = packEditingId != null ? packs.find((p) => p.id === packEditingId) : undefined;
    const nextPack: Omit<Pack, 'id'> = {
      name,
      description: packDescription.trim(),
      // donnée gardée (Pack.Color du schéma), plus modifiable à l'écran
      color: existing?.color ?? 'blue',
      vehicleLimit: existing?.vehicleLimit ?? 50,
      supportedEquipments: Array.from(new Set(packEquipments)).sort((a, b) => a.localeCompare(b)),
      features,
      isActive: true
    };

    setPacks((prev) => {
      if (packEditingId === null) {
        const nextId = prev.length ? Math.max(...prev.map((p) => p.id)) + 1 : 1;
        return [...prev, { id: nextId, ...nextPack }];
      }
      return prev.map((p) => (p.id === packEditingId ? { ...p, ...nextPack, id: packEditingId } : p));
    });

    setIsPackModalOpen(false);
  };

  const openAssignModal = (client: FleetClient) => {
    setClientToAssign(client);
    setSelectedPackIds(new Set(client.packs.map((a) => a.packId)));
    setIsAssignModalOpen(true);
  };

  const openPaymentModal = (client: FleetClient) => {
    setClientForPayment(client);
    // FleetIQ 13 : la nouvelle date est obligatoire (champ vide à l'ouverture, comme dans Gestion Clients)
    setNewExpiry('');
    setIsPaymentModalOpen(true);
  };

  const handleAssignPack = () => {
    if (!clientToAssign) return;
    const selected = Array.from(selectedPackIds);
    setClients((prev) =>
      prev.map((c) => {
        if (c.id !== clientToAssign.id) return c;

        const byPackId = new Map(c.packs.map((a) => [a.packId, a]));
        const nextAssignments: ClientPackAssignment[] = selected
          .map((packId) => {
            const existing = byPackId.get(packId);
            if (existing) return existing;
            const pack = packById.get(packId);
            if (!pack) return null;
            return {
              packId,
              vehicleLimit: pack.vehicleLimit,
              equipmentLimits: pack.supportedEquipments.reduce<Partial<Record<EquipmentType, number>>>((acc, t) => {
                acc[t] = 0;
                return acc;
              }, {}),
              // FleetIQ 08 : date d'affectation = vente du jour (PK-P-02 / P-06) – à confirmer back-end
              assignedAt: todayIso,
              expiresAt: c.expiry
            } satisfies ClientPackAssignment;
          })
          .filter(Boolean) as ClientPackAssignment[];

        return { ...c, packs: nextAssignments };
      })
    );
    setIsAssignModalOpen(false);
  };

  // FleetIQ 08 : valider le paiement réactive le client (la date de blocage est effacée) – A-10 disparaît
  // FleetIQ 12 / 13 : pas de validation sans nouvelle date d'expiration (règle commune utils/clientPayment.ts)
  const paymentError = clientForPayment ? validatePaymentExpiry(newExpiry, todayIso) : null;
  const handleValidatePayment = () => {
    if (!clientForPayment || paymentError) return;
    setClients((prev) => prev.map((c) => (c.id === clientForPayment.id ? applyPaymentValidation(c, newExpiry) : c)));
    setIsPaymentModalOpen(false);
  };

  // Bloquer : date de blocage = aujourd'hui, motif « paiement » (même règle que Gestion Clients, A-13)
  const handleBlockClient = () => {
    if (!clientForPayment) return;
    setClients((prev) => prev.map((c) => (c.id === clientForPayment.id ? applyClientBlock(c, todayIso, 'paiement') : c)));
    setIsPaymentModalOpen(false);
  };

  const matchesFeatureSearch = (label: string) => {
    const q = featureSearch.trim().toLowerCase();
    if (!q) return true;
    return label.toLowerCase().includes(q);
  };

  const doesNodeMatch = (node: FeatureNode): boolean => {
    if (matchesFeatureSearch(node.label)) return true;
    if (!node.children) return false;
    return node.children.some(doesNodeMatch);
  };

  const toggleNodeExpanded = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderFeatureTree = (nodes: FeatureNode[], depth = 0) => {
    return nodes
      .filter((n) => (featureSearch.trim() ? doesNodeMatch(n) : true))
      .map((node) => {
        const isLeaf = !node.children || node.children.length === 0;
        const expanded = expandedNodes.has(node.id);
        const pad = depth * 12;

        if (isLeaf) {
          const checked = selectedFeatures.has(node.id);
          return (
            <label
              key={node.id}
              className="flex items-start gap-3 py-2 px-2 rounded-control hover:bg-surface-muted cursor-pointer"
              style={{ paddingLeft: 12 + pad }}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => {
                  setSelectedFeatures((prev) => {
                    const next = new Set(prev);
                    if (next.has(node.id)) next.delete(node.id);
                    else next.add(node.id);
                    return next;
                  });
                }}
                className="mt-0.5 h-4 w-4 border-border-strong text-primary focus-visible:ring-focus"
              />
              <span className="text-small text-text">{node.label}</span>
            </label>
          );
        }

        const { selected, total } = countSelectedLeaves(node, selectedFeatures);
        const isAllSelected = total > 0 && selected === total;
        const isPartiallySelected = selected > 0 && selected < total;

        return (
          <div key={node.id} className="rounded-control">
            <div
              className="flex items-center gap-2 py-2 px-2 rounded-control hover:bg-surface-muted"
              style={{ paddingLeft: 8 + pad }}
            >
              <button
                type="button"
                onClick={() => toggleNodeExpanded(node.id)}
                className="p-1 rounded-control hover:bg-surface border border-transparent hover:border-border text-text-muted"
                aria-label={expanded ? 'Réduire' : 'Déplier'}
              >
                {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>

              <button
                type="button"
                onClick={() => {
                  const next = toggleAllLeaves(node, selectedFeatures, !isAllSelected);
                  setSelectedFeatures(next);
                }}
                className={`h-4 w-4 rounded-control border flex items-center justify-center ${
                  isAllSelected
                    ? 'bg-primary border-primary text-text-inverse'
                    : isPartiallySelected
                      ? 'bg-primary-100 border-primary-200 text-primary'
                      : 'bg-surface border-border-strong text-text'
                }`}
                aria-label="Sélectionner/désélectionner tout"
                title="Sélectionner/désélectionner tout"
              >
                {(isAllSelected || isPartiallySelected) && <Check size={12} />}
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-small text-text truncate">{node.label}</span>
                  <span className="text-mention text-text-muted">
                    {selected}/{total}
                  </span>
                </div>
              </div>
            </div>

            {expanded && node.children && (
              <div className="pl-2">{renderFeatureTree(node.children, depth + 1)}</div>
            )}
          </div>
        );
      });
  };

  const selectedFeatureCount = selectedFeatures.size;
  const totalLeafFeatureCount = allLeafFeatureIds.length;

  const exportPacksExcel = () => exportPacksListToExcel(filteredPacks as unknown as StorePack[]);
  const exportPacksPdf = () => exportPacksListToPdf(filteredPacks as unknown as StorePack[]);
  const exportPackClientsExcel = () => exportPackClientsToExcel(filteredClients, packById as unknown as Map<number, StorePack>);
  const exportPackClientsPdf = () => exportPackClientsToPdf(filteredClients, packById as unknown as Map<number, StorePack>);

  const dateInput =
    'h-control px-2 border border-border-strong rounded-control text-small bg-surface focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus';
  const shownClients = listClients.slice(0, visibleCount);
  const filterActive = !!alertFilter || !!packFilter || !!clientSearch.trim();
  const packFilterLabel = packFilter === 'none' ? 'Sans pack' : packById.get(Number(packFilter))?.name;

  const dateFr = today.toLocaleDateString('fr-FR');
  const bell = (
    <BellMenu
      items={bellItems}
      open={bellOpen}
      onToggle={setBellOpen}
      onOpenItem={(t) => setDetail(alertDetail(t.id as PkAlertKey, data))}
      canOpen={(r) => r === 'subscriptions'}
    />
  );

  // Maquette validée packs (FleetAdmin-maquettes v3) : même page, mêmes données, mêmes fenêtres (Documentation et grands paragraphes retirés)
  return (
    <>
      <MaquettePage
        slug="packs"
        markup={packsMarkup}
        mount={mountPacksMaquette}
        view={''}
        role={''}
        actions={canCreateEditPacks ? { 'Nouveau pack': () => openCreatePackModal() } : undefined}
      />

      <Modal
        isOpen={isPackModalOpen}
        onClose={() => setIsPackModalOpen(false)}
        title={packEditingId === null ? 'Créer un pack' : 'Modifier un pack'}
        size="xl"
      >
        <div className="flex flex-col min-h-[70vh]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
            <div className="lg:col-span-1 space-y-4">
            <div>
              <label className="block text-label font-medium text-text mb-1">Nom du pack</label>
              <input
                type="text"
                value={packName}
                onChange={(e) => setPackName(e.target.value)}
                placeholder="Ex: Pack Premium"
                className="w-full px-3 py-2 border border-border-strong rounded-card focus-visible:ring-3 focus-visible:ring-focus focus-visible:border-transparent text-small transition-shadow"
              />
            </div>

            <div>
              <label className="block text-label font-medium text-text mb-1">Description</label>
              <textarea
                value={packDescription}
                onChange={(e) => setPackDescription(e.target.value)}
                placeholder="Décrivez l’objectif du pack…"
                rows={4}
                className="w-full px-3 py-2 border border-border-strong rounded-card focus-visible:ring-3 focus-visible:ring-focus focus-visible:border-transparent text-small transition-shadow"
              />
            </div>


            <div className="border border-border rounded-control p-3 bg-surface">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-small font-medium text-text">Types d’équipements supportés</div>
                </div>
                <button
                  type="button"
                  onClick={() => setPackEquipments(equipmentTypes)}
                  className="px-3 py-1.5 text-mention font-medium text-text bg-surface-muted border border-border rounded-control hover:bg-surface-muted transition-colors duration-fast ease-standard"
                  title="Ajouter tous les types"
                >
                  Tout ajouter
                </button>
              </div>

              <div className="mt-3 space-y-2">
                {equipmentTypes.map((t) => {
                  const enabled = packEquipments.includes(t);
                  return (
                    <div key={t} className="flex items-center gap-3">
                      <label className="flex items-center gap-2 min-w-[140px]">
                        <input
                          type="checkbox"
                          checked={enabled}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setPackEquipments((prev) => {
                              if (checked) return [...prev, t];
                              return prev.filter((x) => x !== t);
                            });
                          }}
                          className="h-4 w-4 border-border-strong text-primary focus-visible:ring-focus"
                        />
                        <span className="text-small text-text">{t}</span>
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-surface-muted border border-border rounded-control p-3 text-small text-text flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 text-text-muted" size={16} />
              <div>
                <div className="font-medium">Fonctionnalités sélectionnées</div>
                <div className="text-text-muted text-mention mt-1">
                  {selectedFeatureCount}/{totalLeafFeatureCount} sélectionnées
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedFeatures(new Set(allLeafFeatureIds))}
                className="w-full px-3 py-2 text-small font-medium text-text bg-surface border border-border rounded-control hover:bg-surface-muted transition-colors duration-fast ease-standard"
              >
                Tout sélectionner
              </button>
              <button
                type="button"
                onClick={() => setSelectedFeatures(new Set())}
                className="w-full px-3 py-2 text-small font-medium text-text bg-surface border border-border rounded-control hover:bg-surface-muted transition-colors duration-fast ease-standard"
              >
                Tout retirer
              </button>
            </div>
            </div>

            <div className="lg:col-span-2 space-y-3 flex flex-col min-h-0">
            <div className="flex items-center gap-3">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                <input
                  type="text"
                  placeholder="Rechercher une fonctionnalité…"
                  value={featureSearch}
                  onChange={(e) => setFeatureSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-surface border border-border-strong rounded-card focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus text-small transition-shadow"
                />
              </div>
              <button
                type="button"
                onClick={() => setExpandedNodes(new Set(FEATURE_CATALOG.map((m) => m.id)))}
                className="px-3 py-2 text-small font-medium text-text bg-surface border border-border rounded-control hover:bg-surface-muted transition-colors duration-fast ease-standard"
                title="Déplier les modules"
              >
                Déplier
              </button>
              <button
                type="button"
                onClick={() => setExpandedNodes(new Set())}
                className="px-3 py-2 text-small font-medium text-text bg-surface border border-border rounded-control hover:bg-surface-muted transition-colors duration-fast ease-standard"
                title="Réduire les modules"
              >
                Réduire
              </button>
            </div>

            <div className="border border-border rounded-control flex-1 min-h-0 overflow-auto">
              <div className="p-2">{renderFeatureTree(FEATURE_CATALOG)}</div>
            </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-5 mt-6 border-t border-border-subtle">
          <button
            onClick={() => setIsPackModalOpen(false)}
            className="px-4 py-2 text-small font-medium text-text bg-surface border border-border rounded-control hover:bg-surface-muted transition-colors duration-fast ease-standard inline-flex items-center gap-2"
          >
            <XCircle size={16} />
            Annuler
          </button>
          <button
            onClick={upsertPack}
            className="px-4 py-2 text-small font-medium text-text-inverse bg-primary rounded-card hover:bg-primary-hover transition-colors duration-fast ease-standard"
          >
            Enregistrer
          </button>
          </div>
        </div>
      </Modal>

      {/* --- PAYMENT MODAL --- */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={`Paiement — ${clientForPayment?.name}`}
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-primary-50 text-primary p-3 rounded-control text-small flex items-start gap-3">
            <CreditCard className="shrink-0 mt-0.5" size={16} />
            <p>
              Date d'expiration actuelle :{' '}
              <strong>
                {clientForPayment?.expiry ? new Date(clientForPayment.expiry).toLocaleDateString('fr-FR') : '-'}
              </strong>
            </p>
          </div>

          <div className="flex items-center gap-2 text-small">
            <span className="text-text-muted">Statut actuel :</span>
            <span
              className={`flex items-center gap-1.5 text-mention font-medium ${
                clientForPayment?.status === 'Active' ? 'text-success' : 'text-danger'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-pill ${
                  clientForPayment?.status === 'Active' ? 'bg-success' : 'bg-danger'
                }`}
              />
              {clientForPayment?.status === 'Active' ? 'Actif' : 'Bloqué'}
            </span>
          </div>

          {(() => {
            const packId = clientForPayment?.packs?.[0]?.packId;
            const pack = packId != null ? packById.get(packId) : undefined;

            if (!pack) return null;

            return (
              <div className="flex items-center gap-2 text-small">
                <span className="text-text-muted">Pack :</span>
                <span
                  className={`px-2 py-0.5 rounded-control text-mention font-semibold ${PACK_BADGE}`}
                >
                  {pack.name}
                </span>
              </div>
            );
          })()}

          <div>
            <label className="block text-label font-medium text-text mb-1">Nouvelle date d'expiration</label>
            <input
              type="date"
              value={newExpiry}
              onChange={(e) => setNewExpiry(e.target.value)}
              aria-invalid={paymentError ? true : undefined}
              aria-describedby={paymentError ? 'packs-payment-error' : undefined}
              className="w-full px-3 py-2 border border-border-strong rounded-card focus-visible:ring-3 focus-visible:ring-focus focus-visible:border-transparent text-small transition-shadow"
            />
            {paymentError && (
              <p id="packs-payment-error" role="alert" className="mt-1 text-mention text-danger">
                {paymentError}
              </p>
            )}
          </div>

          <div className="flex justify-between pt-4 border-t border-border-subtle">
            <button
              onClick={handleBlockClient}
              className="px-4 py-2 text-small font-medium text-text-inverse bg-danger rounded-card hover:bg-danger-hover transition-colors duration-fast ease-standard flex items-center gap-2"
            >
              <Ban size={14} />
              Bloquer
            </button>
            <div className="flex gap-3">
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="px-4 py-2 text-small font-medium text-text bg-surface border border-border rounded-control hover:bg-surface-muted transition-colors duration-fast ease-standard"
              >
                Annuler
              </button>
              <button
                onClick={handleValidatePayment}
                disabled={Boolean(paymentError)}
                title={paymentError ?? undefined}
                className="px-4 py-2 text-small font-medium text-text-inverse bg-primary rounded-card hover:bg-primary-hover transition-colors duration-fast ease-standard disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Valider le paiement
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* --- ASSIGN PACK MODAL --- */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title={`Pack — ${clientToAssign?.name}`}
        size="md"
      >
        <div className="space-y-5">
          <div className="bg-primary-50 text-primary p-3 rounded-control text-small flex items-start gap-3">
            <Package className="shrink-0 mt-0.5" size={16} />
            <p>
              Sélectionnez un ou plusieurs packs à affecter au client <strong>{clientToAssign?.name}</strong>.
            </p>
          </div>

          <div>
            <label className="block text-label font-medium text-text mb-2">Pack</label>
            <div className="space-y-2">
              {filteredPacks.map((pack) => {
                const isSelected = selectedPackIds.has(pack.id);
                return (
                  <label
                    key={pack.id}
                    className={`flex items-start gap-3 p-3 border rounded-control cursor-pointer transition-colors duration-fast ease-standard ${
                      isSelected
                        ? `border-primary bg-primary-50 ring-1 ring-primary`
                        : 'border-border hover:bg-surface-muted'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() =>
                        setSelectedPackIds((prev) => {
                          const next = new Set(prev);
                          if (next.has(pack.id)) next.delete(pack.id);
                          else next.add(pack.id);
                          return next;
                        })
                      }
                      className="mt-1 text-primary focus-visible:ring-focus border-border-strong"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-control text-mention font-semibold ${PACK_BADGE}`}>
                          {pack.name}
                        </span>
                        <span className="text-mention text-text-muted">{pack.features.length} fonctionnalités</span>
                        {isSelected && <CheckCircle2 size={16} className="text-primary ml-auto shrink-0" />}
                      </div>
                      <div className="text-mention text-text-muted mt-1 line-clamp-2">{pack.description || '—'}</div>
                    </div>
                  </label>
                );
              })}

              <label className="flex items-center justify-between gap-3 p-3 border rounded-control border-border hover:bg-surface-muted">
                <span className="text-small text-text">Aucun pack</span>
                <button
                  type="button"
                  onClick={() => setSelectedPackIds(new Set())}
                  className="px-3 py-1.5 text-mention font-medium text-text bg-surface border border-border rounded-control hover:bg-surface-muted transition-colors duration-fast ease-standard"
                >
                  Retirer
                </button>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border-subtle">
            <button
              onClick={() => setIsAssignModalOpen(false)}
              className="px-4 py-2 text-small font-medium text-text bg-surface border border-border rounded-control hover:bg-surface-muted transition-colors duration-fast ease-standard"
            >
              Annuler
            </button>
            <button
              onClick={handleAssignPack}
              className="px-4 py-2 text-small font-medium text-text-inverse bg-primary rounded-card hover:bg-primary-hover transition-colors duration-fast ease-standard"
            >
              Confirmer
            </button>
          </div>
        </div>
      </Modal>

      {/* --- QUOTAS MODAL --- */}
      <Modal
        isOpen={isQuotasModalOpen}
        onClose={() => setIsQuotasModalOpen(false)}
        title={`Quotas — ${clientToEditQuotas?.name ?? ''}`}
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-label font-medium text-text mb-1">Véhicules autorisés</label>
              <input
                type="number"
                min={0}
                value={quotaVehicleLimit}
                disabled
                className="w-full px-3 py-2 border border-border-strong rounded-control focus-visible:ring-3 focus-visible:ring-focus focus-visible:border-transparent text-small"
              />
              <p className="text-mention text-text-muted mt-1">
                Ce quota vient de <strong>Gestion Clients</strong> (illimité = pas d’icône).
              </p>
            </div>
          </div>

          <div className="border border-border rounded-control p-3 bg-surface">
            <div className="text-small font-medium text-text">Quotas par type d’équipement</div>
            <div className="text-mention text-text-muted mt-1">
              Les types proviennent du pack affecté au client.
            </div>
            <div className="mt-3 space-y-2">
              {Object.keys(quotaEquipmentLimits).length === 0 && (
                <div className="text-mention text-text-muted italic">Aucun type (ou aucun pack affecté).</div>
              )}
              {Object.entries(quotaEquipmentLimits).map(([t, v]) => (
                <div key={t} className="flex items-center justify-between gap-3">
                  <div className="text-small text-text">{t}</div>
                  <input
                    type="number"
                    min={0}
                    value={v ?? 0}
                    onChange={(e) =>
                      setQuotaEquipmentLimits((prev) => ({
                        ...prev,
                        [t]: Math.max(0, Number(e.target.value))
                      }))
                    }
                    className="w-28 px-3 py-2 border border-border-strong rounded-control focus-visible:ring-3 focus-visible:ring-focus focus-visible:border-transparent text-small"
                  />
                </div>
              ))}
            </div>
          </div>

          {quotaError && (
            <div className="bg-danger-50 text-danger-700 border border-danger-200 rounded-control p-3 text-small">
              {quotaError}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-border-subtle">
            <button
              onClick={() => setIsQuotasModalOpen(false)}
              className="px-4 py-2 text-small font-medium text-text bg-surface border border-border rounded-control hover:bg-surface-muted transition-colors duration-fast ease-standard"
            >
              Annuler
            </button>
            <button
              onClick={() => {
                if (!clientToEditQuotas) return;
                const limit = clientToEditQuotas.vehicleLimit;
                const total = Object.values(quotaEquipmentLimits).reduce((acc, v) => acc + (Number(v) || 0), 0);
                if (typeof limit === 'number' && total > limit) {
                  setQuotaError(
                    `Le total des équipements à installer (${total}) ne doit pas dépasser les véhicules autorisés (${limit}).`
                  );
                  return;
                }
                setClients((prev) =>
                  prev.map((c) => {
                    if (c.id !== clientToEditQuotas.id) return c;
                    const a = c.packs[0];
                    if (!a) return c;
                    return {
                      ...c,
                      packs: [
                        {
                          ...a,
                          equipmentLimits: quotaEquipmentLimits
                        }
                      ]
                    };
                  })
                );
                setIsQuotasModalOpen(false);
              }}
              className="px-4 py-2 text-small font-medium text-text-inverse bg-primary rounded-card hover:bg-primary-hover transition-colors duration-fast ease-standard"
            >
              Enregistrer
            </button>
          </div>
        </div>
      </Modal>

    </>
  );
}