/**
 * Interventions SAV v3 – carte FleetIQ 10 (maquette SAV-v3 · Documentation-SAV-v3 · analyse § 5.7, § 7-10).
 * - Admin TUNAV et Responsable SAV : vue équipe (SAV-S-01 … S-11, cloche S-10).
 * - Technicien SAV : une seule page utilisable sur téléphone (SAV-T-01 … T-07), sa zone et ses interventions seulement.
 * - Finance et Revendeur : pas d'accès (route absente → page par défaut, App.tsx).
 * Aucun prix, aucune donnée de contrat ni de facturation. Données fictives (FleetStore, « à confirmer back-end »).
 */
import { useCallback, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { CalendarDays } from 'lucide-react';
import { Modal } from '../components/Modal';
import { TableExportButtons } from '../components/TableExportButtons';
import { InterventionFiche } from '../components/sav/InterventionFiche';
import { SavBell } from '../components/sav/SavBell';
import { SavTeamView } from '../components/sav/SavTeamView';
import { SavTechnicianView } from '../components/sav/SavTechnicianView';
import { PageChrome, PageShell } from '../components/shell/PageShell';
import { Button } from '../components/ui/Button';
import { useBackofficePermissions, useBackofficeRole } from '../hooks/useBackofficePermissions';
import { useFleetStore, type FleetEquipment, type Intervention } from '../state/FleetStore';
import { addDays, parseDate, startOfDay, toIsoDate } from '../state/mock/dates';
import { canAccessRoute } from '../utils/backofficePermissions';
import { buildRows } from '../utils/equipmentsKpis';
import {
  CONNECTED_TECHNICIAN_ID,
  EMPTY_SAV_FILTERS,
  applyInstallation,
  changeType,
  closeIntervention,
  createIntervention,
  exportRows,
  filterInterventions,
  planIntervention,
  sortInterventions,
  startIntervention,
  teamBell,
  teamKpis,
  techBell,
  techKpis,
  techLists,
  techLoads,
  toPlanRows,
  toggleCheck,
  type NewInterventionInput,
  type SavBellItem,
  type SavFilters
} from '../utils/savKpis';
import { exportTableToCsv, exportTableToPdf } from '../utils/tableExport';

export function SavPage() {
  const store = useFleetStore();
  const { interventions, setInterventions, technicians, zones, equipments, setEquipments, clients } = store;
  const permissions = useBackofficePermissions();
  const role = useBackofficeRole();
  const navigate = useNavigate();
  const sav = permissions?.sav;
  const team = sav?.view === 'team';

  const realToday = useMemo(() => startOfDay(new Date()), []);
  const [asOfIso, setAsOfIso] = useState(toIsoDate(realToday));
  const asOf = useMemo(() => parseDate(asOfIso) ?? realToday, [asOfIso, realToday]);
  const isToday = asOfIso === toIsoDate(realToday);
  const now = useMemo(() => new Date(), []);

  const [filters, setFilters] = useState<SavFilters>(EMPTY_SAV_FILTERS);
  const [bellOpen, setBellOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const eqBySerial = useMemo(() => new Map(equipments.map((e) => [e.serial, e])), [equipments]);
  const cityByClient = useMemo(() => new Map(clients.map((c) => [c.name, c.city ?? 'Tunis'])), [clients]);
  const cityOf = useCallback((e: FleetEquipment) => cityByClient.get(e.client) ?? 'Tunis', [cityByClient]);
  const zoneOfCity = useCallback((city: string) => zones.find((z) => z.cities.includes(city))?.id ?? zones[0]?.id ?? '', [zones]);
  const techName = useCallback((id: string | null) => technicians.find((t) => t.id === id)?.name ?? '—', [technicians]);

  /* ---------- SAV-S-06 : mêmes lignes et règles que la page Équipements (EQ-E-03, EQ-A-23, EQ-A-22) ---------- */
  const eqAlerts = useMemo(() => {
    if (!team) return { notConnected: 0, disconnected1d: 0, pending30: 0 };
    const rows = buildRows({
      equipments,
      simCards: store.simCards,
      simOffers: store.simOffers,
      packs: store.packs,
      now: new Date(),
      connThresholdHours: store.disconnectThresholdHours,
      alertDays: store.dashboardSettings.alertDays
    });
    return {
      notConnected: rows.filter((r) => r.state === 'not_connected').length,
      disconnected1d: rows.filter((r) => r.live).length,
      pending30: rows.filter((r) => r.pending30).length
    };
  }, [team, equipments, store.simCards, store.simOffers, store.packs, store.disconnectThresholdHours, store.dashboardSettings.alertDays]);

  /* ---------- vue équipe ---------- */
  const kpis = useMemo(() => teamKpis(interventions, asOf), [interventions, asOf]);
  const loads = useMemo(() => techLoads(interventions, technicians, zones, asOf), [interventions, technicians, zones, asOf]);
  const toPlan = useMemo(() => toPlanRows(interventions), [interventions]);

  /* ---------- vue technicien : ses interventions et sa zone ---------- */
  const me = technicians.find((t) => t.id === CONNECTED_TECHNICIAN_ID) ?? technicians[0];
  const mine = useMemo(() => interventions.filter((iv) => iv.technicianId === me?.id), [interventions, me]);
  const zoneToPlan = useMemo(
    () => toPlanRows(interventions.filter((iv) => iv.zoneId === me?.zoneId)),
    [interventions, me]
  );
  const tKpis = useMemo(() => techKpis(mine, zoneToPlan, asOf), [mine, zoneToPlan, asOf]);
  const tLists = useMemo(() => techLists(mine, asOf), [mine, asOf]);

  const bellItems = useMemo(
    () => (team ? teamBell(interventions, loads, techName, asOf, eqAlerts) : techBell(mine, zoneToPlan, asOf, new Date())),
    [team, interventions, loads, techName, asOf, eqAlerts, mine, zoneToPlan]
  );

  /** le technicien n'ouvre que ses interventions et les signalements de sa zone */
  const visible = useCallback(
    (iv: Intervention) => team || iv.technicianId === me?.id || (iv.status === 'À planifier' && iv.zoneId === me?.zoneId),
    [team, me]
  );
  const selected = interventions.find((iv) => iv.id === selectedId && visible(iv)) ?? null;

  const scrollTo = (id: string) => window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  const onBell = (it: SavBellItem) => {
    if (it.action.kind === 'fiche') setSelectedId(it.action.id);
    else if (it.action.kind === 'equipments') navigate(it.action.href);
    else {
      if (team) setFilters({ ...EMPTY_SAV_FILTERS, ...it.action.patch });
      scrollTo(it.action.section === 'toPlan' ? 'sav-a-planifier' : it.action.section === 'zone' ? 'sav-zone' : 'sav-liste');
    }
  };

  const update = (id: string, fn: (iv: Intervention) => Intervention) => setInterventions((list) => list.map((iv) => (iv.id === id ? fn(iv) : iv)));
  const onPlan = (iv: Intervention, techId: string, date: string, time: string) => {
    update(iv.id, (x) => planIntervention(x, techId, date, time, new Date()));
    setNotice(`${iv.id} planifiée chez ${techName(techId)} le ${(parseDate(date) ?? asOf).toLocaleDateString('fr-FR')} à ${time}.`);
  };
  const onCreate = (input: NewInterventionInput) => {
    const created = createIntervention(interventions, input, new Date());
    setInterventions((list) => [...list, created]);
    setNotice(`${created.id} créée (${created.type}, ${created.status}).`);
  };
  const onFinish = (iv: Intervention, result: string, plate: string): string | null => {
    const at = new Date();
    const out = closeIntervention(iv, result, at, plate);
    if (!out.ok) return out.error;
    update(iv.id, () => out.iv);
    // § 7-10 : une Installation terminée passe l'équipement à « installé » (Équipements, Tableau de bord, Gestion Clients)
    if (out.iv.status === 'Terminée' && out.iv.type === 'Installation') {
      setEquipments((list) => list.map((e) => (e.serial === iv.serial ? applyInstallation(e, out.iv.vehicle, at) : e)));
      setNotice(`${iv.id} clôturée : l’équipement ${iv.serial} est maintenant « installé » (${out.iv.vehicle}).`);
    } else {
      setNotice(`${iv.id} ${out.iv.status === 'À revoir' ? 'rendue « À revoir » au responsable SAV' : 'clôturée'}.`);
    }
    return null;
  };

  if (!sav || sav.view === 'none') return <Navigate to="/" replace />;

  /* ---------- exports : Excel = CSV, PDF ---------- */
  const exportList = team ? sortInterventions(filterInterventions(interventions, filters, asOfIso), asOfIso) : sortInterventions(mine, asOfIso);
  const exp = () => exportRows(exportList, asOfIso, eqBySerial, techName, team);
  const exportName = team ? `interventions-sav-${asOfIso}` : `mes-interventions-${asOfIso}`;

  const pageTitle = team ? 'Interventions SAV' : 'Mes interventions';
  const dateFr = realToday.toLocaleDateString('fr-FR');
  const bell = <SavBell kpi={team ? 'SAV-S-10' : 'SAV-T-07'} items={bellItems} open={bellOpen} onToggle={setBellOpen} onSelect={onBell} />;

  return (
    <PageShell
      header={
        <PageChrome
          title={pageTitle}
          date={dateFr}
          actions={
            <TableExportButtons
              size="compact"
              onExportExcel={() => {
                const { headers, rows } = exp();
                exportTableToCsv(headers, rows, exportName);
              }}
              onExportPdf={() => {
                const { headers, rows } = exp();
                exportTableToPdf(
                  `${team ? 'Interventions SAV' : `Mes interventions – ${me?.name ?? ''}`} – état au ${asOf.toLocaleDateString('fr-FR')}`,
                  headers,
                  rows,
                  exportName
                );
              }}
            />
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
                  min={toIsoDate(addDays(realToday, -60))}
                  max={toIsoDate(addDays(realToday, 30))}
                  onChange={(e) => setAsOfIso(e.target.value || toIsoDate(realToday))}
                  className="h-control max-md:h-control-touch px-2 border border-border-strong rounded-control text-small max-md:text-body bg-surface focus-visible:outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-focus/25"
                />
              </label>
              <Button type="button" variant="neutral" onClick={() => setAsOfIso(toIsoDate(realToday))}>
                Aujourd’hui
              </Button>
            </>
          }
        />
      }
    >

      {notice && (
        <div role="status" className="flex items-start justify-between gap-3 rounded-control border border-success-200 bg-success-50 px-4 py-3 text-small text-success-700">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)} className="font-medium underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus rounded-control">
            OK
          </button>
        </div>
      )}

      {team ? (
        <SavTeamView
          list={interventions}
          toPlan={toPlan}
          kpis={kpis}
          loads={loads}
          asOf={asOf}
          asOfIso={asOfIso}
          now={now}
          techs={technicians}
          zones={zones}
          eqAlerts={eqAlerts}
          eqBySerial={eqBySerial}
          soldEquipments={equipments.filter((e) => !e.client.endsWith('_Stock'))}
          cityOf={cityOf}
          zoneOfCity={zoneOfCity}
          filters={filters}
          setFilters={setFilters}
          canPlan={sav.canPlan}
          canOpenEquipments={!!role && canAccessRoute(role, 'equipments')}
          onOpen={(iv) => setSelectedId(iv.id)}
          onPlan={onPlan}
          onCreate={onCreate}
          onGo={(href) => navigate(href)}
          scrollTo={scrollTo}
        />
      ) : (
        <SavTechnicianView
          kpis={tKpis}
          lists={tLists}
          zoneToPlan={zoneToPlan}
          asOfIso={asOfIso}
          isToday={isToday}
          eqBySerial={eqBySerial}
          onOpen={(iv) => setSelectedId(iv.id)}
          scrollTo={scrollTo}
        />
      )}

      <Modal
        isOpen={!!selected}
        onClose={() => setSelectedId(null)}
        title={selected ? `${selected.id} · ${selected.type}` : ''}
        size="lg"
        footer={null}
      >
        {selected && (
          <InterventionFiche
            key={selected.id}
            iv={selected}
            mode={team ? 'team' : 'technician'}
            asOfIso={asOfIso}
            eq={eqBySerial.get(selected.serial)}
            techs={technicians}
            zones={zones}
            canPlan={sav.canPlan}
            canExecute={sav.canExecute}
            canOpenEquipments={!!role && canAccessRoute(role, 'equipments')}
            onSaveType={(type) => update(selected.id, (x) => changeType(x, type))}
            onPlan={(techId, date, time) => onPlan(selected, techId, date, time)}
            onStart={() => update(selected.id, startIntervention)}
            onToggleCheck={(item) => update(selected.id, (x) => toggleCheck(x, item))}
            onFinish={(result, plate) => onFinish(selected, result, plate)}
            onOpenEquipments={() => navigate(`/equipments?imei=${encodeURIComponent(selected.serial)}`)}
            onDismiss={() => setSelectedId(null)}
          />
        )}
      </Modal>
    </PageShell>
  );
}
