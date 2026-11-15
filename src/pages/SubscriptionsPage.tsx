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
  AlertCircle,
  AlertTriangle,
  BookOpen,
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
  MAX_PERIOD_DAYS,
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

  const ctrlBtn =
    'inline-flex items-center gap-2 h-9 px-3 text-button-sm rounded-control border transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus';
  const dateInput =
    'h-9 px-2 border border-border-strong rounded-control text-small bg-surface focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus';
  const shownClients = listClients.slice(0, visibleCount);
  const filterActive = !!alertFilter || !!packFilter || !!clientSearch.trim();
  const packFilterLabel = packFilter === 'none' ? 'Sans pack' : packById.get(Number(packFilter))?.name;

  return (
    <div className="space-y-8 pb-8">
      {/* En-tête v3 : titre, Documentation (bientôt), exports, Nouveau pack, date du jour, cloche toujours à droite */}
      <header className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-h3 text-text">Gestion des Packs</h1>
            <button
              type="button"
              aria-disabled="true"
              title="Documentation des KPI : bientôt (carte FleetIQ 11)"
              onClick={(e) => e.preventDefault()}
              className="inline-flex items-center gap-1.5 h-9 px-3 text-button-sm rounded-control border border-border bg-surface text-text-muted cursor-not-allowed"
            >
              <BookOpen size={16} aria-hidden="true" />
              Documentation
              <span className="rounded-pill bg-border-subtle px-2 py-0.5 text-mention text-text">bientôt</span>
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <TableExportButtons
              size="compact"
              onExportExcel={exportPackClientsExcel}
              onExportPdf={exportPackClientsPdf}
              disabled={filteredClients.length === 0}
            />
            {canCreateEditPacks && (
              <button
                type="button"
                onClick={openCreatePackModal}
                className="inline-flex items-center gap-2 h-9 px-3 text-button-sm rounded-control bg-primary text-text-inverse hover:bg-primary-hover transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus focus-visible:ring-offset-2"
              >
                <Plus size={16} aria-hidden="true" />
                Nouveau pack
              </button>
            )}
            <span className="inline-flex items-center gap-2 h-9 px-3 rounded-control border border-border bg-surface text-small text-text">
              <span className="h-2 w-2 rounded-pill bg-success" aria-hidden="true" />
              Aujourd’hui <b className="tabular-nums">{today.toLocaleDateString('fr-FR')}</b>
            </span>
            <BellMenu
              items={bellItems}
              open={bellOpen}
              onToggle={setBellOpen}
              onOpenItem={(t) => setDetail(alertDetail(t.id as PkAlertKey, data))}
              canOpen={(r) => r === 'subscriptions'}
            />
          </div>
        </div>
        <p className="text-small text-text-muted">
          Créez des packs, affectez des fonctionnalités, puis associez un pack à chaque client. Aucun prix sur cette page.
          {!canCreateEditPacks && canManagePayment ? ' Finance : paiement seulement (création et modification des packs réservées à l’Admin).' : ''}
        </p>

        {/* Barre d'outils : période (≤ 1 an), « Au » = aujourd'hui, comparaison optionnelle */}
        <div className="flex flex-wrap items-center gap-3 rounded-card border border-border bg-surface px-4 py-3 shadow-card">
          <div className="inline-flex flex-wrap items-center gap-0.5 rounded-control border border-border p-0.5" role="group" aria-label="Période">
            <CalendarDays size={16} aria-hidden="true" className="mx-1.5 text-text-muted" />
            {PERIOD_OPTIONS.map((p) => (
              <button
                key={p.key}
                type="button"
                aria-pressed={periodKind === p.key}
                onClick={() => {
                  setPeriodKind(p.key);
                  if (p.key === 'custom' && !customFrom) setCustomFrom(toIsoDate(period.from));
                }}
                className={`h-8 px-3 text-button-sm rounded-control transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus ${
                  periodKind === p.key ? 'bg-primary text-text-inverse' : 'text-text hover:bg-surface-muted'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {periodKind === 'custom' ? (
            <span className="inline-flex flex-wrap items-center gap-2 text-small text-text">
              Du
              <input type="date" aria-label="Début de la période" value={customFrom} max={todayIso} onChange={(e) => setCustomFrom(e.target.value)} className={dateInput} />
              au
              <input type="date" aria-label="Fin de la période" value={customTo} max={todayIso} onChange={(e) => setCustomTo(e.target.value)} className={dateInput} />
            </span>
          ) : (
            <label className="inline-flex items-center gap-2 text-small text-text">
              <span className="font-medium">Au</span>
              <input type="date" value={auIso} max={todayIso} onChange={(e) => setAuIso(e.target.value || todayIso)} className={dateInput} />
            </label>
          )}
          <span className="hidden sm:block h-6 w-px bg-border" aria-hidden="true" />
          <button
            type="button"
            aria-pressed={compareOn}
            onClick={() => setCompareOn((v) => !v)}
            className={`${ctrlBtn} ${compareOn ? 'bg-primary text-text-inverse border-primary' : 'bg-surface text-primary border-primary hover:bg-primary-50'}`}
          >
            <GitCompareArrows size={16} aria-hidden="true" />
            Comparer
          </button>
          {compareOn && (
            <>
              <label className="inline-flex items-center gap-2 text-small text-text">
                à
                <select value={compareKind} onChange={(e) => setCompareKind(e.target.value as CompareKind)} aria-label="Période de comparaison" className={dateInput}>
                  <option value="prev">Période précédente</option>
                  <option value="year">Même période l’an dernier</option>
                  <option value="custom">Personnalisée</option>
                </select>
              </label>
              {compareKind === 'custom' && (
                <span className="inline-flex flex-wrap items-center gap-2 text-small text-text">
                  Du
                  <input type="date" aria-label="Début de la comparaison" value={cmpFrom} max={todayIso} onChange={(e) => setCmpFrom(e.target.value)} className={dateInput} />
                  au
                  <input type="date" aria-label="Fin de la comparaison" value={cmpTo} max={todayIso} onChange={(e) => setCmpTo(e.target.value)} className={dateInput} />
                </span>
              )}
            </>
          )}
        </div>
        <p className="text-mention text-text-muted">
          Période : <b className="text-text">{frDate(period.from)} → {frDate(period.to)}</b> ({fmt(period.days)} j)
          {compareRes.period ? (
            <>
              {' '}
              · comparée au <b className="text-text">{frDate(compareRes.period.from)} → {frDate(compareRes.period.to)}</b>
            </>
          ) : (
            ' · sans comparaison'
          )}
          {` · période personnalisée : ${fmt(MAX_PERIOD_DAYS)} j maximum · alertes et échéances calculées au ${frDate(today)} · connecté = données ≤ ${fmt(data.connDays)} j`}
          {(periodRes.error || compareRes.error) && (
            <span role="alert" className="ml-2 font-medium text-danger-700">
              {periodRes.error || compareRes.error}
              {periodRes.error ? ' (30 derniers jours affichés)' : ''}
            </span>
          )}
        </p>
        {!bannerClosed && (
          <CriticalBanner
            data={data}
            onClose={() => setBannerClosed(true)}
            onShow={() => {
              setAlertFilter('critique');
              setVisibleCount(PAGE_SIZE);
              catalogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          />
        )}
      </header>

      <PacksOverview data={data} periodLabel={periodLabel} compareLabel={compareLabel} alertFilter={alertFilter} onOpenDetail={setDetail} />

      {/* Packs les plus choisis : PK-P-03 + PK-P-06 */}
      <section aria-labelledby="pk-chosen" className="space-y-3">
        <SectionTitle id="pk-chosen" title="Packs les plus choisis" />
        <PacksChosenSection data={data} packs={allPacksSorted as unknown as StorePack[]} periodLabel={periodLabel} onOpenDetail={setDetail} />
      </section>

      {/* Catalogue et affectations (écran existant : packs, clients, Modifier, Paiement) */}
      <section aria-labelledby="pk-catalog" className="space-y-3 scroll-mt-4" ref={catalogRef}>
        <SectionTitle id="pk-catalog" title="Catalogue et affectations" hint="Cliquez sur un pack pour filtrer la liste des clients" />
        <div className="space-y-4">
          {/* Packs */}
          <div className="bg-surface rounded-card border border-border overflow-hidden shadow-card">
            <div className="p-4 border-b border-border-subtle bg-surface-muted flex items-center justify-between gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                <input
                  type="text"
                  placeholder="Rechercher un pack..."
                  value={packSearch}
                  onChange={(e) => setPackSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-surface border border-border-strong rounded-card focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus text-small transition-shadow"
                />
              </div>
              <TableExportButtons size="compact" onExportExcel={exportPacksExcel} onExportPdf={exportPacksPdf} disabled={filteredPacks.length === 0} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 divide-y sm:divide-y-0 divide-border-subtle">
              {filteredPacks.map((pack) => {
                const on = packFilter === String(pack.id);
                const allTypes = pack.supportedEquipments.length >= equipmentTypes.length;
                return (
                  <div key={pack.id} className={`p-4 transition-colors xl:border-r last:border-r-0 border-border-subtle ${on ? 'bg-primary-50' : 'hover:bg-surface-muted'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <button
                        type="button"
                        aria-pressed={on}
                        onClick={() => {
                          setPackFilter(on ? '' : String(pack.id));
                          setVisibleCount(PAGE_SIZE);
                        }}
                        className="min-w-0 flex-1 text-left rounded-control focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
                        title="Filtrer la liste des clients sur ce pack"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-control text-mention font-medium ${PACK_BADGE}`}>{pack.name}</span>
                          <span className="text-mention text-text-muted flex items-center gap-1">
                            <ListChecks size={12} />
                            {pack.features.length} fonctionnalité(s)
                          </span>
                          <span className="text-mention text-text-muted">· {fmt(clientsPerPack.get(pack.id) ?? 0)} client(s)</span>
                        </div>
                        <p className="text-small text-text mt-2 line-clamp-2">{pack.description || '—'}</p>
                        <p className="text-mention text-text-muted mt-1">
                          Équipements : {allTypes ? 'tous les types' : pack.supportedEquipments.join(', ') || 'aucun type coché'}
                        </p>
                      </button>

                      <div className="flex items-center gap-1 shrink-0">
                        {canCreateEditPacks && (
                          <button
                            onClick={() => openEditPackModal(pack)}
                            className="p-1.5 text-text-muted hover:text-primary hover:bg-primary-50 rounded-control transition-colors"
                            title="Modifier le pack"
                            aria-label={`Modifier le pack ${pack.name}`}
                          >
                            <Edit2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredPacks.length === 0 && <div className="p-8 text-center text-text-muted text-small">Aucun pack trouvé.</div>}
            </div>
          </div>

          {/* Clients */}
          <div className="bg-surface rounded-card border border-border overflow-hidden shadow-card min-w-0">
            <div className="p-4 border-b border-border-subtle bg-surface-muted flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                <input
                  type="text"
                  placeholder="Rechercher un client..."
                  value={clientSearch}
                  onChange={(e) => {
                    setClientSearch(e.target.value);
                    setVisibleCount(PAGE_SIZE);
                  }}
                  className="w-full pl-9 pr-4 py-2 bg-surface border border-border-strong rounded-card focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus text-small transition-shadow"
                />
              </div>
              <select
                value={packFilter}
                onChange={(e) => {
                  setPackFilter(e.target.value);
                  setVisibleCount(PAGE_SIZE);
                }}
                aria-label="Filtrer par pack"
                className={dateInput}
              >
                <option value="">Tous les packs</option>
                {allPacksSorted.map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    {p.name}
                  </option>
                ))}
                <option value="none">Sans pack</option>
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-2 px-4 py-2 border-b border-border-subtle">
              <span className="text-small text-text">
                <b className="tabular-nums">{fmt(listClients.length)}</b> client(s)
              </span>
              {alertFilter && (
                <span className="inline-flex items-center gap-1 rounded-pill border border-primary-200 bg-primary-50 px-3 py-1 text-mention text-text">
                  À traiter : {ALERT_META[alertFilter].title(data)} ({ALERT_META[alertFilter].mockup})
                  <button type="button" aria-label="Retirer le filtre À traiter" onClick={() => setAlertFilter(null)} className="rounded-pill p-0.5 hover:bg-primary-100">
                    <X size={12} aria-hidden="true" />
                  </button>
                </span>
              )}
              {packFilterLabel && (
                <span className="inline-flex items-center gap-1 rounded-pill border border-primary-200 bg-primary-50 px-3 py-1 text-mention text-text">
                  Pack : {packFilterLabel}
                  <button type="button" aria-label="Retirer le filtre pack" onClick={() => setPackFilter('')} className="rounded-pill p-0.5 hover:bg-primary-100">
                    <X size={12} aria-hidden="true" />
                  </button>
                </span>
              )}
              {filterActive && (
                <button
                  type="button"
                  onClick={() => {
                    setAlertFilter(null);
                    setPackFilter('');
                    setClientSearch('');
                  }}
                  className="ml-auto text-mention font-medium text-primary hover:underline"
                >
                  Tout afficher
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border-subtle text-text text-overline uppercase bg-surface-muted">
                    <th className="p-3 font-medium">Client</th>
                    <th className="p-3 font-medium">Pack</th>
                    <th className="p-3 font-medium">Parc</th>
                    <th className="p-3 font-medium">Expiration</th>
                    <th className="p-3 font-medium">Statut</th>
                    <th className="p-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-small divide-y divide-border-subtle">
                  {shownClients.map((pc) => {
                    const client = pc.client;
                    const open = expanded.has(client.id);
                    const d = pc.daysToExpiry;
                    return (
                      <React.Fragment key={client.id}>
                        <tr className="hover:bg-surface-muted transition-colors align-top">
                          <td className="p-3">
                            <div className="font-medium text-text">
                              {client.name}{' '}
                              <span className="text-mention font-normal text-text-muted">{pc.network === 'Tunav' ? '· Tunav' : `· via ${pc.network}`}</span>
                            </div>
                            <div className="text-text-muted text-mention truncate max-w-[260px]" title={client.email}>{client.email}</div>
                          </td>
                          <td className="p-3">
                            {pc.packs.length > 0 ? (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {pc.packs.map((p) => (
                                  <span key={p.id} className={`px-2 py-0.5 rounded-control text-mention font-medium ${PACK_BADGE}`}>
                                    {p.name}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-text-muted italic text-mention">Non affecté</span>
                            )}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <button
                              type="button"
                              aria-expanded={open}
                              disabled={pc.equipments.length === 0}
                              onClick={() =>
                                setExpanded((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(client.id)) next.delete(client.id);
                                  else next.add(client.id);
                                  return next;
                                })
                              }
                              className="inline-flex items-center gap-1 rounded-control px-1.5 py-0.5 text-small text-primary hover:bg-primary-50 disabled:text-text-muted disabled:hover:bg-transparent focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
                            >
                              {fmt(pc.equipments.length)} équip. {pc.equipments.length > 0 && (open ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
                            </button>
                            {pc.outOfPack.length > 0 && (
                              <span className="mt-1 flex items-center gap-1 text-mention font-medium text-warning-700" title="Type d’équipement non supporté par les packs du client (A-12)">
                                <AlertTriangle size={12} aria-hidden="true" />
                                {fmt(pc.outOfPack.length)} hors pack
                              </span>
                            )}
                          </td>
                          <td className="p-3 whitespace-nowrap text-text">
                            {frDate(pc.expiry)}
                            {pc.level === 'critique' && d != null && (
                              <span className="ml-1.5 rounded-pill border border-danger-200 bg-danger-50 px-2 py-0.5 text-mention font-semibold text-danger-700">J-{d}</span>
                            )}
                            {pc.level === 'anticiper' && d != null && (
                              <span className="ml-1.5 rounded-pill border border-warning-200 bg-warning-50 px-2 py-0.5 text-mention font-semibold text-warning-700">J-{d}</span>
                            )}
                            {pc.active && d != null && d < 0 && (
                              <span className="ml-1.5 rounded-pill border border-border bg-border-subtle px-2 py-0.5 text-mention font-semibold text-text">expiré</span>
                            )}
                          </td>
                          <td className="p-3">
                            <span className={`flex items-center gap-1.5 text-mention font-medium ${pc.active ? 'text-success-700' : 'text-danger-700'}`}>
                              <span className={`w-1.5 h-1.5 rounded-pill ${pc.active ? 'bg-success' : 'bg-danger'}`} />
                              {pc.active ? 'Actif' : 'Bloqué'}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {canAssignPacks && (
                                <button
                                  onClick={() => openAssignModal(client)}
                                  className="p-1.5 text-text-muted hover:text-primary hover:bg-primary-50 rounded-control transition-colors"
                                  title="Modifier les packs du client"
                                  aria-label={`Modifier les packs de ${client.name}`}
                                >
                                  <Edit2 size={16} />
                                </button>
                              )}
                              {canManagePayment && (
                                <button
                                  onClick={() => openPaymentModal(client)}
                                  className="p-1.5 text-text-muted hover:text-warning-700 hover:bg-warning-50 rounded-control transition-colors"
                                  title="Paiement : valider / bloquer"
                                  aria-label={`Paiement de ${client.name}`}
                                >
                                  <CreditCard size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {open && (
                          <tr className="bg-surface-muted">
                            <td colSpan={6} className="px-3 pb-3 pt-1">
                              <table className="w-full text-mention text-text">
                                <thead>
                                  <tr className="text-left text-text-muted">
                                    <th className="py-1 pr-3 font-medium">N° de série</th>
                                    <th className="py-1 pr-3 font-medium">Type</th>
                                    <th className="py-1 pr-3 font-medium">Pack</th>
                                    <th className="py-1 pr-3 font-medium">Affecté le</th>
                                    <th className="py-1 font-medium">Connexion</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {pc.equipments.map((e) => (
                                    <tr key={e.eq.id} className="border-t border-border-subtle">
                                      <td className="py-1 pr-3 font-mono">{e.eq.serial}</td>
                                      <td className="py-1 pr-3">
                                        {e.type}
                                        {!e.covered && <span className="ml-1 font-medium text-warning-700">· hors pack</span>}
                                      </td>
                                      <td className="py-1 pr-3">{e.packId != null ? packById.get(e.packId)?.name ?? '—' : '—'}</td>
                                      <td className="py-1 pr-3">{frDate(parseDate(e.eq.assignedAt ?? null))}</td>
                                      <td className={`py-1 font-medium ${e.connected ? 'text-success-700' : 'text-danger-700'}`}>{lastCommLabel(e)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                  {listClients.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-text-muted">
                        Aucun client trouvé.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {listClients.length > visibleCount && (
              <div className="flex flex-wrap items-center justify-center gap-3 border-t border-border-subtle p-3 text-small">
                <span className="text-text-muted">
                  {fmt(visibleCount)} sur {fmt(listClients.length)}
                </span>
                <button type="button" onClick={() => setVisibleCount((n) => n + PAGE_SIZE)} className="font-medium text-primary hover:underline">
                  Afficher 25 de plus
                </button>
                <button type="button" onClick={() => setVisibleCount(listClients.length)} className="font-medium text-primary hover:underline">
                  Tout afficher
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Fonctionnalités par pack : PK-P-04 */}
      <section aria-labelledby="pk-features" className="space-y-3">
        <SectionTitle id="pk-features" title="Fonctionnalités par pack" />
        <FeaturesSection data={data} packs={allPacksSorted as unknown as StorePack[]} />
      </section>

      {/* Usage et renouvellement : PK-P-05, PK-A-10 / PK-A-11 */}
      <section aria-labelledby="pk-usage" className="space-y-3">
        <SectionTitle id="pk-usage" title="Usage et renouvellement" />
        <UsageSection data={data} today={today} />
      </section>

      <DetailModal detail={detail} onClose={() => setDetail(null)} canOpen={(r) => !!permissions?.routes[r]} />

      {/* --- PACK CREATE/EDIT MODAL --- */}
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
                  <div className="text-mention text-text-muted mt-0.5">
                    Cochez les types supportés. Les quotas seront définis dans la modale d’affectation client.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPackEquipments(equipmentTypes)}
                  className="px-3 py-1.5 text-mention font-medium text-text bg-surface-muted border border-border rounded-control hover:bg-surface-muted transition-colors"
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
                className="w-full px-3 py-2 text-small font-medium text-text bg-surface border border-border rounded-control hover:bg-surface-muted transition-colors"
              >
                Tout sélectionner
              </button>
              <button
                type="button"
                onClick={() => setSelectedFeatures(new Set())}
                className="w-full px-3 py-2 text-small font-medium text-text bg-surface border border-border rounded-control hover:bg-surface-muted transition-colors"
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
                className="px-3 py-2 text-small font-medium text-text bg-surface border border-border rounded-control hover:bg-surface-muted transition-colors"
                title="Déplier les modules"
              >
                Déplier
              </button>
              <button
                type="button"
                onClick={() => setExpandedNodes(new Set())}
                className="px-3 py-2 text-small font-medium text-text bg-surface border border-border rounded-control hover:bg-surface-muted transition-colors"
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
            className="px-4 py-2 text-small font-medium text-text bg-surface border border-border rounded-control hover:bg-surface-muted transition-colors inline-flex items-center gap-2"
          >
            <XCircle size={16} />
            Annuler
          </button>
          <button
            onClick={upsertPack}
            className="px-4 py-2 text-small font-medium text-text-inverse bg-primary rounded-card hover:bg-primary-hover transition-colors shadow-card"
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

          <div className="bg-warning-50 text-warning-700 p-3 rounded-control text-small flex items-start gap-3">
            <AlertCircle className="shrink-0 mt-0.5 text-warning-700" size={16} />
            <p>
              La validation du paiement met à jour l’expiration et réactive le client. Le blocage empêche l’accès
              jusqu’à régularisation.
            </p>
          </div>

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
              className="px-4 py-2 text-small font-medium text-text-inverse bg-danger rounded-card hover:bg-danger-hover transition-colors shadow-card flex items-center gap-2"
            >
              <Ban size={14} />
              Bloquer
            </button>
            <div className="flex gap-3">
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="px-4 py-2 text-small font-medium text-text bg-surface border border-border rounded-control hover:bg-surface-muted transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleValidatePayment}
                disabled={Boolean(paymentError)}
                title={paymentError ?? undefined}
                className="px-4 py-2 text-small font-medium text-text-inverse bg-primary rounded-card hover:bg-primary-hover transition-colors shadow-card disabled:opacity-50 disabled:cursor-not-allowed"
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
                    className={`flex items-start gap-3 p-3 border rounded-control cursor-pointer transition-colors ${
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
                  className="px-3 py-1.5 text-mention font-medium text-text bg-surface border border-border rounded-control hover:bg-surface-muted transition-colors"
                >
                  Retirer
                </button>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border-subtle">
            <button
              onClick={() => setIsAssignModalOpen(false)}
              className="px-4 py-2 text-small font-medium text-text bg-surface border border-border rounded-control hover:bg-surface-muted transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleAssignPack}
              className="px-4 py-2 text-small font-medium text-text-inverse bg-primary rounded-card hover:bg-primary-hover transition-colors shadow-card"
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
              className="px-4 py-2 text-small font-medium text-text bg-surface border border-border rounded-control hover:bg-surface-muted transition-colors"
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
              className="px-4 py-2 text-small font-medium text-text-inverse bg-primary rounded-card hover:bg-primary-hover transition-colors shadow-card"
            >
              Enregistrer
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}