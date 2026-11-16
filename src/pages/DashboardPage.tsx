/**
 * Tableau de bord v3 – carte FleetIQ 05 (maquette Main-v3 · Documentation-TableauDeBord-v3).
 * - Vue Tunav (Admin TUNAV, Finance) : TDB-D-01…D-12, tout le réseau.
 * - Vue revendeur : TDB-R-01…R-08, ses clients seulement (@ResellerId), sans stock Tunav, sans puces, sans packs Tunav.
 * - Toujours la vue complète (ex-« Toutes ») — filtre Vue équipe retiré.
 * - Aucun prix sur cette page.
 */
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { CalendarDays, GitCompareArrows, Settings } from 'lucide-react';
import { Modal } from '../components/Modal';
import { TableExportButtons } from '../components/TableExportButtons';
import { BarChart } from '../components/charts';
import { KpiTrend, objectiveKey, readObjectives } from '../components/dashboard/KpiTrend';
import { BellMenu, UrgentBand } from '../components/dashboard/BellMenu';
import { DetailModal, type DetailSpec } from '../components/dashboard/DetailModal';
import { GoalKpiCard, type CompareInfo } from '../components/dashboard/GoalKpiCard';
import { EquipmentPartsCard, SimPartsCard } from '../components/dashboard/PartsCards';
import { ParkHealthRings, SimOverCard, TopPacksCard } from '../components/dashboard/WhereToActCards';
import { PageChrome, PageShell, SectionRule } from '../components/shell/PageShell';
import { Button } from '../components/ui/Button';
import { useFleetStore } from '../state/FleetStore';
import { buildMaquetteDashboard } from '../state/mock/maquetteDashboard';
import { parseDate, startOfDay, toIsoDate } from '../state/mock/dates';
import { useBackofficePermissions, useBackofficeRole } from '../hooks/useBackofficePermissions';
import { canAccessRoute, type BackofficeRouteKey } from '../utils/backofficePermissions';
import {
  fmt,
  pct,
  PRIORITY_LABELS,
  volume,
  type DashboardScope,
  type GoalKpi,
  type TodoItem
} from '../utils/dashboardKpis';
import { exportTableToExcel, exportTableToPdf } from '../utils/tableExport';

type CompareMode = 'm30' | 'y1';
const COMPARE_LABELS: Record<CompareMode, string> = { m30: 'il y a 30 j', y1: 'l’an dernier' };

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="col-span-12 grid grid-cols-12 gap-4">
      <SectionRule id={id} title={title} />
      {children}
    </section>
  );
}

export function DashboardPage() {
  const store = useFleetStore();
  const { disconnectThresholdHours, setDisconnectThresholdHours, currentUserName } = store;
  const permissions = useBackofficePermissions();
  const role = useBackofficeRole();
  const isReseller = role === 'revendeur';
  const canEditThreshold = permissions?.dashboard.canViewAdminSections ?? false;
  const canOpen = useCallback((route: BackofficeRouteKey) => (role ? canAccessRoute(role, route) : false), [role]);

  const realToday = useMemo(() => startOfDay(new Date()), []);
  const [asOfIso, setAsOfIso] = useState(toIsoDate(realToday));
  const asOf = parseDate(asOfIso) ?? realToday;
  const [compareOn, setCompareOn] = useState(false);
  const [compareMode, setCompareMode] = useState<CompareMode>('m30');
  const [bellOpen, setBellOpen] = useState(false);
  const [detail, setDetail] = useState<DetailSpec | null>(null);
  const [thresholdOpen, setThresholdOpen] = useState(false);
  const [thresholdDraft, setThresholdDraft] = useState('');

  const scope: DashboardScope = useMemo(
    () => (isReseller ? { kind: 'reseller', name: currentUserName } : { kind: 'network' }),
    [isReseller, currentUserName]
  );

  // Données de la maquette validée Main-v3 (mêmes chiffres que la maquette)
  const data = useMemo(
    () => buildMaquetteDashboard(scope, asOf),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scope, asOfIso]
  );

  // objectif de l'année saisi dans la fenêtre de détail (« Objectif <année> ») : repris par la carte
  const year = asOf.getFullYear();
  const [objectives, setObjectives] = useState<Record<string, number>>(() => readObjectives());
  const onObjective = useCallback((key: string, value: number | null) => {
    setObjectives((cur) => {
      const next = { ...cur };
      if (value == null) delete next[key];
      else next[key] = value;
      return next;
    });
  }, []);
  const visibleKpis = useMemo(
    () =>
      data.kpis.map((k) => {
        const saved = objectives[objectiveKey(k.id, year)];
        return saved != null && k.of != null ? { ...k, goal: saved } : k;
      }),
    [data.kpis, objectives, year]
  );
  const [kpiDetailId, setKpiDetailId] = useState<string | null>(null);
  const compareFor = (k: GoalKpi): CompareInfo => {
    if (!compareOn) return null;
    const pv = k.prev?.[compareMode];
    const previous = pv ? (k.of != null && pv[1] ? pct(pv[0], pv[1]) : pv[0]) : null;
    return { label: COMPARE_LABELS[compareMode], previous };
  };

  /* ---------- fenêtres de détail ---------- */
  const kpiSpec = (k: GoalKpi): DetailSpec => {
    const rate = k.of != null ? pct(k.value, k.of) : null;
    const trend = k.trend ?? [];
    const savedGoal = objectives[objectiveKey(k.id, year)];
    const goalTxt = savedGoal ?? k.goal;
    return {
      title: k.label,
      kpiId: k.id,
      big: rate != null ? `${rate} %` : fmt(k.value),
      caption:
        rate != null
          ? `${fmt(k.value)} sur ${fmt(k.of ?? 0)} ${k.unit}${goalTxt != null ? ` · objectif ${goalTxt} %` : ''}`
          : `${k.unit} · ${k.context}${savedGoal != null ? ` · objectif ${year} : ${fmt(savedGoal)} ${k.unit}` : ''}`,
      table: k.table,
      chart: k.monthly ? (
        <div className="space-y-1">
          <p className="text-small font-medium text-text">Packs affectés par mois (6 derniers mois)</p>
          <BarChart data={k.monthly} ariaLabel="Packs affectés par mois" />
        </div>
      ) : trend.length > 1 ? (
        <KpiTrend kpi={k} year={year} initial={savedGoal ?? null} onChange={onObjective} />
      ) : undefined,
      route: k.route,
      routeLabel: k.routeLabel,
      routeQuery: k.routeQuery
    };
  };
  const openKpi = (k: GoalKpi) => {
    setDetail(null);
    setKpiDetailId(k.id);
  };
  const kpiDetailKpi = kpiDetailId ? visibleKpis.find((k) => k.id === kpiDetailId) ?? null : null;
  const openTodo = (t: TodoItem) =>
    setDetail({
      title: t.title,
      big: fmt(t.count),
      caption: `${t.unit} · ${PRIORITY_LABELS[t.priority]}`,
      table: t.table && t.table.rows.length ? t.table : undefined,
      note: <p className="text-small text-text-muted">{t.detail}</p>,
      route: t.route,
      routeLabel: t.routeLabel,
      routeQuery: t.routeQuery,
      goLabel: t.goLabel
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

  const ringsKey = isReseller ? `fiq-tdb-r07-${currentUserName}` : 'fiq-tdb-d09';
  const showSimsParts = !isReseller;
  const dateFr = realToday.toLocaleDateString('fr-FR');

  return (
    <PageShell
      header={
        <PageChrome
          title="Tableau de bord"
          date={dateFr}
          actions={
            <>
              <TableExportButtons
                size="compact"
                onExportExcel={() => exportTableToExcel(exportHeaders, exportRows(), 'Tableau de bord', exportName)}
                onExportPdf={() =>
                  exportTableToPdf(`Tableau de bord – état au ${asOf.toLocaleDateString('fr-FR')}`, exportHeaders, exportRows(), exportName)
                }
              />
              {canEditThreshold ? (
                <Button type="button" variant="neutral" onClick={openThreshold} title="Seuil global « connecté »">
                  <Settings size={16} aria-hidden="true" className="text-text-muted" />
                  Connecté ≤ {fmt(data.connDays)} j
                </Button>
              ) : null}
            </>
          }
          bell={<BellMenu items={data.todo} open={bellOpen} onToggle={setBellOpen} onOpenItem={openTodo} canOpen={canOpen} />}
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
                variant="secondary" className={compareOn ? '!border-solid !border-primary !bg-primary-50 !text-primary-hover font-semibold' : 'border-dashed font-semibold !text-text-muted'}
                aria-pressed={compareOn}
                onClick={() => setCompareOn((v) => !v)}
              >
                <GitCompareArrows size={16} aria-hidden="true" />
                Comparer
              </Button>
              {compareOn && (
                <label className="inline-flex items-center gap-2 text-small text-text">
                  à
                  <select
                    value={compareMode}
                    onChange={(e) => setCompareMode(e.target.value as CompareMode)}
                    aria-label="Date de comparaison"
                    className="h-control px-2 border border-border-strong rounded-control text-small bg-surface focus-visible:outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-focus/25"
                  >
                    <option value="m30">Il y a 30 jours</option>
                    <option value="y1">Même date l’an dernier</option>
                  </select>
                </label>
              )}
            </>
          }
        />
      }
    >

      {visibleKpis.length > 0 && (
        <Section id="tdb-essentiel" title="L’essentiel">
          {/* TDB-D-01…D-05 / TDB-R-01…R-04 — rangée KPI à parts égales (DL § 3.2) */}
          <div
            className={`col-span-12 grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch ${
              visibleKpis.length >= 5 ? 'xl:grid-cols-5' : visibleKpis.length === 4 ? 'xl:grid-cols-4' : 'xl:grid-cols-3'
            }`}
          >
            {visibleKpis.map((k) => (
              <GoalKpiCard key={k.id} kpi={k} compare={compareFor(k)} onOpen={() => openKpi(k)} />
            ))}
          </div>
        </Section>
      )}

      <Section id="tdb-stock" title="Du stock au service">
        {/* TDB-D-06 / TDB-R-05 – bandeau Urgent */}
        <div className="col-span-12">
          <UrgentBand items={data.todo} onOpenItem={openTodo} onOpenBell={() => setBellOpen(true)} />
        </div>
        <div className={showSimsParts ? 'col-span-12 xl:col-span-8' : 'col-span-12'}>
          <EquipmentPartsCard data={data} onOpenDetail={setDetail} />
        </div>
        {showSimsParts && (
          <div className="col-span-12 xl:col-span-4">
            <SimPartsCard data={data} onOpenDetail={setDetail} />
          </div>
        )}
      </Section>

      <Section id="tdb-agir" title="Où agir">
        <div className="col-span-12">
          <ParkHealthRings key={ringsKey} data={data} storageKey={ringsKey} onOpenDetail={setDetail} />
        </div>
        <div className="col-span-12">
          <TopPacksCard data={data} onOpenDetail={setDetail} />
        </div>
        {!isReseller && (
          <div className="col-span-12">
            <SimOverCard data={data} onOpenDetail={setDetail} canOpen={canOpen} />
          </div>
        )}
      </Section>

      <DetailModal
        detail={detail ?? (kpiDetailKpi ? kpiSpec(kpiDetailKpi) : null)}
        onClose={() => {
          setDetail(null);
          setKpiDetailId(null);
        }}
        canOpen={canOpen}
      />

      {/* Seuil global « connecté » (réglage BO existant, 7 j par défaut) – Admin TUNAV */}
      <Modal isOpen={thresholdOpen} onClose={() => setThresholdOpen(false)} title="Seuil « connecté »" size="md">
        <div className="space-y-4">
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
              className="w-full h-control px-2.5 border border-border-strong rounded-control text-small focus-visible:outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-focus/25"
            />
            <p className="mt-1 text-mention text-text-muted">1–30 jours</p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border-subtle">
            <Button type="button" variant="secondary" onClick={() => setThresholdOpen(false)}>
              Annuler
            </Button>
            <Button type="button" variant="primary" onClick={saveThreshold}>
              Enregistrer
            </Button>
          </div>
        </div>
      </Modal>
    </PageShell>
  );
}
