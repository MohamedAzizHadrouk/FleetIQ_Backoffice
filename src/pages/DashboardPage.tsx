/**
 * Tableau de bord v3 – carte FleetIQ 05 (maquette Main-v3 · Documentation-TableauDeBord-v3).
 * - Vue Tunav (Admin TUNAV, Finance) : TDB-D-01…D-12, tout le réseau.
 * - Vue revendeur : TDB-R-01…R-08, ses clients seulement (@ResellerId), sans stock Tunav, sans puces, sans packs Tunav.
 * - Filtre « Vue équipe » (ajout approuvé le 2026-11-14) : Toutes · Finance · Commercial · SAV · Admin ;
 *   Finance s'ouvre sur « Finance » ; jamais montré au revendeur.
 * - Aucun prix sur cette page.
 */
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { BookOpen, CalendarDays, GitCompareArrows, Settings } from 'lucide-react';
import { Modal } from '../components/Modal';
import { TableExportButtons } from '../components/TableExportButtons';
import { BarChart, Sparkline } from '../components/charts';
import { BellMenu, UrgentBand } from '../components/dashboard/BellMenu';
import { DetailModal, type DetailSpec } from '../components/dashboard/DetailModal';
import { GoalKpiCard, type CompareInfo } from '../components/dashboard/GoalKpiCard';
import { EquipmentPartsCard, SimPartsCard } from '../components/dashboard/PartsCards';
import { ParkHealthRings, SimOverCard, TopPacksCard } from '../components/dashboard/WhereToActCards';
import { useFleetStore } from '../state/FleetStore';
import { addDays, parseDate, startOfDay, toIsoDate } from '../state/mock/dates';
import { useBackofficePermissions, useBackofficeRole } from '../hooks/useBackofficePermissions';
import { canAccessRoute, type BackofficeRouteKey } from '../utils/backofficePermissions';
import {
  computeDashboard,
  fmt,
  isVisibleForTeam,
  pct,
  PRIORITY_LABELS,
  snapshotSeries,
  snapshotValue,
  TEAM_VIEWS,
  volume,
  type DashboardScope,
  type GoalKpi,
  type TeamView,
  type TodoItem
} from '../utils/dashboardKpis';
import { exportTableToExcel, exportTableToPdf } from '../utils/tableExport';

type CompareMode = 'm30' | 'y1';
const COMPARE_LABELS: Record<CompareMode, string> = { m30: 'il y a 30 j', y1: 'l’an dernier' };

function Section({ id, title, hint, children }: { id: string; title: string; hint: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="space-y-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 id={id} className="text-h4 text-text">
          {title}
        </h2>
        <span className="text-small text-text-muted">{hint}</span>
      </div>
      {children}
    </section>
  );
}

export function DashboardPage() {
  const store = useFleetStore();
  const { disconnectThresholdHours, setDisconnectThresholdHours, currentUserName, kpiSnapshots } = store;
  const permissions = useBackofficePermissions();
  const role = useBackofficeRole();
  const isReseller = role === 'revendeur';
  const canEditThreshold = permissions?.dashboard.canViewAdminSections ?? false;
  const canOpen = useCallback((route: BackofficeRouteKey) => (role ? canAccessRoute(role, route) : false), [role]);

  const realToday = useMemo(() => startOfDay(new Date()), []);
  const [asOfIso, setAsOfIso] = useState(toIsoDate(realToday));
  const asOf = parseDate(asOfIso) ?? realToday;
  const isToday = asOfIso === toIsoDate(realToday);
  const [compareOn, setCompareOn] = useState(false);
  const [compareMode, setCompareMode] = useState<CompareMode>('m30');
  const [team, setTeam] = useState<TeamView>(role === 'finance_tunav' ? 'Finance' : 'Toutes');
  const [bellOpen, setBellOpen] = useState(false);
  const [detail, setDetail] = useState<DetailSpec | null>(null);
  const [thresholdOpen, setThresholdOpen] = useState(false);
  const [thresholdDraft, setThresholdDraft] = useState('');

  const scope: DashboardScope = useMemo(
    () => (isReseller ? { kind: 'reseller', name: currentUserName } : { kind: 'network' }),
    [isReseller, currentUserName]
  );
  const scopeKey = scope.kind === 'network' ? 'network' : scope.name;

  const data = useMemo(
    () =>
      computeDashboard({
        scope,
        asOf,
        now: new Date(),
        connThresholdHours: disconnectThresholdHours,
        settings: store.dashboardSettings,
        clients: store.clients,
        equipments: store.equipments,
        simCards: store.simCards,
        simOffers: store.simOffers,
        simConsumption: store.simConsumption,
        userConnections: store.userConnections,
        packs: store.packs
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scope, asOfIso, disconnectThresholdHours, store.clients, store.equipments, store.simCards, store.simOffers]
  );

  const show = (mockupId: string) => isReseller || isVisibleForTeam(mockupId, team);
  const visibleKpis = data.kpis.filter((k) => show(k.mockupId));
  const compareDate = compareMode === 'm30' ? addDays(asOf, -30) : addDays(asOf, -365);
  const compareFor = (k: GoalKpi): CompareInfo =>
    compareOn
      ? { label: COMPARE_LABELS[compareMode], previous: snapshotValue(kpiSnapshots, scopeKey, k.snapshotKey, compareDate) }
      : null;

  /* ---------- fenêtres de détail ---------- */
  const openKpi = (k: GoalKpi) => {
    const rate = k.of != null ? pct(k.value, k.of) : null;
    const series = snapshotSeries(kpiSnapshots, scopeKey, k.snapshotKey);
    const current = rate ?? k.value;
    setDetail({
      title: k.label,
      kpiId: k.id,
      big: rate != null ? `${rate} %` : fmt(k.value),
      caption:
        rate != null
          ? `${fmt(k.value)} sur ${fmt(k.of ?? 0)} ${k.unit}${k.goal != null ? ` · objectif ${k.goal} % (proposition)` : ''}`
          : `${k.unit} · ${k.context}`,
      what: k.what,
      definition: k.definition,
      formula: k.formula,
      table: k.table,
      chart: k.monthly ? (
        <div className="space-y-1">
          <p className="text-small font-medium text-text">Packs affectés par mois (6 derniers mois)</p>
          <BarChart data={k.monthly} ariaLabel="Packs affectés par mois" />
        </div>
      ) : series.length > 1 ? (
        <div className="flex flex-wrap items-center gap-4 rounded-control border border-border-subtle p-3">
          <Sparkline
            values={[...series, current]}
            min={rate != null ? Math.max(0, Math.min(...series, current) - 5) : undefined}
            ariaLabel={`Évolution sur 12 mois, valeur actuelle ${rate != null ? `${rate} %` : fmt(k.value)}`}
          />
          <span className="text-mention text-text-muted">
            Évolution sur 12 mois · instantanés mensuels fictifs (historique quotidien à confirmer back-end)
          </span>
        </div>
      ) : undefined,
      route: k.route,
      routeLabel: k.routeLabel,
      routeQuery: k.routeQuery
    });
  };
  const openTodo = (t: TodoItem) =>
    setDetail({
      title: t.title,
      big: fmt(t.count),
      caption: `${t.unit} · ${PRIORITY_LABELS[t.priority]} · règle ${t.sourceRule}`,
      what: t.what,
      note: <p className="text-text-muted">{t.detail}</p>,
      table: t.table && t.table.rows.length ? t.table : undefined,
      route: t.route,
      routeLabel: t.routeLabel,
      routeQuery: t.routeQuery
    });

  /* ---------- exports Excel / PDF (chiffres de la page, sans prix) ---------- */
  const exportRows = (): string[][] => {
    const rows: string[][] = [];
    visibleKpis.forEach((k) =>
      rows.push([
        'L’essentiel',
        `${k.id} ${k.label}`,
        String(k.value),
        k.of != null ? String(k.of) : '',
        k.of != null ? `${pct(k.value, k.of)} %` : '',
        k.goal != null ? `${k.goal} %` : '',
        k.routeLabel
      ])
    );
    data.todo.forEach((t) =>
      rows.push([`À traiter · ${PRIORITY_LABELS[t.priority]}`, t.title, String(t.count), '', '', '', t.routeLabel])
    );
    const a = data.parkAll;
    (
      [
        ['Vendus', a.sold],
        ['Installés', a.installed],
        ['Connectés', a.connected],
        ['Non connectés', a.notConnected],
        ['Vendus, non installés', a.notInstalled]
      ] as Array<[string, number]>
    ).forEach(([l, n]) => rows.push(['Du stock au service', l, String(n), String(a.sold), `${pct(n, a.sold)} %`, '', 'Équipements']));
    if (!isReseller) {
      rows.push(['Du stock au service', 'En stock', String(data.stock), '', '', '', 'Équipements']);
      rows.push(['Du stock au service', 'Puces installées', String(data.simsInstalled), String(data.simsTotal), `${pct(data.simsInstalled, data.simsTotal)} %`, '', 'Gestion des puces']);
      data.overRows.forEach((r) =>
        rows.push(['Où agir · surconsommation', r.label, String(r.overSims), String(r.sims), `+${volume(r.excessMB)}`, '', 'Gestion des puces'])
      );
    }
    data.parkRows.forEach((r) =>
      rows.push(['Où agir · santé du parc', r.label, String(r.connected), String(r.installed), `${pct(r.connected, r.installed)} %`, '', 'Équipements'])
    );
    data.packRank.forEach((r) => rows.push(['Où agir · packs', r.name, String(r.clients), '', '', '', isReseller ? 'Gestion Clients' : 'Packs']));
    return rows;
  };
  const exportHeaders = ['Bloc', 'Indicateur', 'Valeur', 'Sur', '%', 'Objectif', 'Page'];
  const exportName = `tableau-de-bord-${asOfIso}`;

  const openThreshold = () => {
    setThresholdDraft(String(Math.round(disconnectThresholdHours / 24)));
    setThresholdOpen(true);
  };
  const saveThreshold = () => {
    const n = parseInt(thresholdDraft, 10);
    if (!Number.isFinite(n) || n < 1 || n > 30) return;
    setDisconnectThresholdHours(n * 24);
    setThresholdOpen(false);
  };

  const subtitle = isReseller
    ? `Vue revendeur ${currentUserName} : uniquement vos clients et leurs équipements.`
    : 'Vue Tunav : tout le réseau (clients directs et revendeurs). L’essentiel de chaque page, sans le détail.';
  const ringsKey = isReseller ? `fiq-tdb-r07-${currentUserName}` : 'fiq-tdb-d09';
  const showD07 = show(isReseller ? 'R-06' : 'D-07');
  const showD08 = !isReseller && show('D-08');
  const whereIds = isReseller ? ['R-07', 'R-08'] : ['D-09', 'D-10', 'D-11'];
  const anyWhere = whereIds.some(show);
  const ctrlBtn =
    'inline-flex items-center gap-2 h-9 px-3 text-button-sm rounded-control border transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus';

  return (
    <div className="space-y-8 pb-8">
      {/* TDB-D-12 – En-tête : Documentation, Excel, PDF, date du jour, cloche, État au, Comparer */}
      <header className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-h3 text-text">Tableau de bord</h1>
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
              onExportExcel={() => exportTableToExcel(exportHeaders, exportRows(), 'Tableau de bord', exportName)}
              onExportPdf={() =>
                exportTableToPdf(`Tableau de bord – état au ${asOf.toLocaleDateString('fr-FR')}`, exportHeaders, exportRows(), exportName)
              }
            />
            <span className="inline-flex items-center gap-2 h-9 px-3 rounded-control border border-border bg-surface text-small text-text">
              <span className="h-2 w-2 rounded-pill bg-success" aria-hidden="true" />
              Aujourd’hui <b className="tabular-nums">{realToday.toLocaleDateString('fr-FR')}</b>
            </span>
            {canEditThreshold && (
              <button
                type="button"
                onClick={openThreshold}
                className={`${ctrlBtn} border-border bg-surface text-text hover:bg-surface-muted`}
                title="Seuil global « connecté »"
              >
                <Settings size={16} aria-hidden="true" className="text-text-muted" />
                Connecté ≤ {fmt(data.connDays)} j
              </button>
            )}
            <BellMenu items={data.todo} open={bellOpen} onToggle={setBellOpen} onOpenItem={openTodo} canOpen={canOpen} />
          </div>
        </div>
        <p className="text-small text-text-muted">{subtitle}</p>

        <div className="flex flex-wrap items-center gap-3 rounded-card border border-border bg-surface px-4 py-3 shadow-card">
          <label className="inline-flex items-center gap-2 text-small text-text">
            <CalendarDays size={16} aria-hidden="true" className="text-text-muted" />
            <span className="font-medium">État au</span>
            <input
              type="date"
              value={asOfIso}
              max={toIsoDate(realToday)}
              onChange={(e) => setAsOfIso(e.target.value || toIsoDate(realToday))}
              className="h-9 px-2 border border-border-strong rounded-control text-small focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
            />
          </label>
          <button
            type="button"
            onClick={() => setAsOfIso(toIsoDate(realToday))}
            className={`${ctrlBtn} border-border bg-surface text-text hover:bg-surface-muted`}
          >
            Aujourd’hui
          </button>
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
            <label className="inline-flex items-center gap-2 text-small text-text">
              à
              <select
                value={compareMode}
                onChange={(e) => setCompareMode(e.target.value as CompareMode)}
                aria-label="Date de comparaison"
                className="h-9 px-2 border border-border-strong rounded-control text-small bg-surface focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
              >
                <option value="m30">Il y a 30 jours</option>
                <option value="y1">Même date l’an dernier</option>
              </select>
            </label>
          )}
          {!isReseller && (
            <>
              <span className="hidden sm:block h-6 w-px bg-border" aria-hidden="true" />
              <div className="inline-flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Vue équipe">
                <span className="text-small font-medium text-text">Vue équipe</span>
                {TEAM_VIEWS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    role="radio"
                    aria-checked={team === t}
                    onClick={() => setTeam(t)}
                    className={`rounded-pill border px-3 py-1 text-mention font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus ${
                      team === t ? 'bg-primary text-text-inverse border-primary' : 'bg-surface text-text border-border hover:bg-primary-50'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <p className="text-mention text-text-muted">
          État au <b className="text-text">{asOf.toLocaleDateString('fr-FR')}</b>
          {isToday ? ' (aujourd’hui)' : ''} · échéances, alertes et objectifs calculés à cette date
          {compareOn && (
            <>
              {' '}
              · comparé au <b className="text-text">{compareDate.toLocaleDateString('fr-FR')}</b> (instantanés fictifs)
            </>
          )}
          {!isToday && ' · états des équipements et des puces : situation du jour (pas encore d’historique quotidien)'}
          {` · connecté = données reçues dans les ${fmt(data.connDays)} j`}
        </p>
      </header>

      {visibleKpis.length > 0 && (
        <Section id="tdb-essentiel" title="L’essentiel" hint="Un chiffre par sujet, comparé à son objectif · cliquez pour le détail">
          {/* TDB-D-01…D-05 / TDB-R-01…R-04 */}
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${
              visibleKpis.length >= 5 ? 'xl:grid-cols-5' : visibleKpis.length === 4 ? 'xl:grid-cols-4' : 'xl:grid-cols-3'
            }`}
          >
            {visibleKpis.map((k) => (
              <GoalKpiCard key={k.id} kpi={k} compare={compareFor(k)} onOpen={() => openKpi(k)} />
            ))}
          </div>
        </Section>
      )}

      <Section
        id="tdb-stock"
        title="Du stock au service"
        hint={
          isReseller
            ? 'Vos équipements découpés en parts · cliquez sur une part ou une ligne'
            : 'Tous les équipements et toutes les puces, découpés en parts · cliquez sur une part ou une ligne'
        }
      >
        {/* TDB-D-06 / TDB-R-05 – bandeau Urgent */}
        <UrgentBand items={data.todo} onOpenItem={openTodo} onOpenBell={() => setBellOpen(true)} />
        {(showD07 || showD08) && (
          <div className={`grid grid-cols-1 gap-4 ${showD07 && showD08 ? 'xl:grid-cols-2' : ''}`}>
            {showD07 && <EquipmentPartsCard data={data} onOpenDetail={setDetail} />}
            {showD08 && <SimPartsCard data={data} onOpenDetail={setDetail} />}
          </div>
        )}
      </Section>

      {anyWhere && (
        <Section id="tdb-agir" title="Où agir" hint="Cliquez sur une ligne pour le détail">
          {show(isReseller ? 'R-07' : 'D-09') && (
            <ParkHealthRings key={ringsKey} data={data} storageKey={ringsKey} onOpenDetail={setDetail} />
          )}
          {show(isReseller ? 'R-08' : 'D-10') && <TopPacksCard data={data} onOpenDetail={setDetail} />}
          {!isReseller && show('D-11') && <SimOverCard data={data} onOpenDetail={setDetail} canOpen={canOpen} />}
        </Section>
      )}

      <DetailModal detail={detail} onClose={() => setDetail(null)} canOpen={canOpen} />

      {/* Seuil global « connecté » (réglage BO existant, 7 j par défaut) – Admin TUNAV */}
      <Modal isOpen={thresholdOpen} onClose={() => setThresholdOpen(false)} title="Seuil « connecté »" size="md">
        <div className="space-y-4">
          <p className="text-small text-text">
            Un équipement installé est « connecté » s’il a envoyé des données depuis moins de ce délai. Le même seuil sert à toutes
            les pages. L’alerte « déconnecté depuis plus de {store.dashboardSettings.alertDays} j » reste un seuil séparé.
          </p>
          <div>
            <label htmlFor="tdb-threshold" className="block text-label text-text mb-1">
              Délai sans données (jours)
            </label>
            <input
              id="tdb-threshold"
              type="number"
              min={1}
              max={30}
              step={1}
              value={thresholdDraft}
              onChange={(e) => setThresholdDraft(e.target.value)}
              className="w-full h-11 px-3 border border-border-strong rounded-control text-small focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
            />
            <p className="mt-1 text-mention text-text-muted">Entre 1 et 30 jours · 7 jours par défaut.</p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border-subtle">
            <button
              type="button"
              onClick={() => setThresholdOpen(false)}
              className="inline-flex items-center h-11 px-5 text-button rounded-control bg-surface text-primary border border-primary hover:bg-primary-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={saveThreshold}
              className="inline-flex items-center h-11 px-5 text-button rounded-control bg-primary text-text-inverse hover:bg-primary-hover transition-colors"
            >
              Enregistrer
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
