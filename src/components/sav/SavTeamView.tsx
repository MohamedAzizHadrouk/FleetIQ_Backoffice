/**
 * Interventions SAV – vue équipe (Admin TUNAV, Responsable SAV) – carte FleetIQ 10.
 * Ordre de la doc : SAV-S-01…S-05 + rappel S-06 → charge S-07 → à planifier S-08 → toutes les interventions S-09.
 */
import { useMemo, useState } from 'react';
import { ArrowRight, CalendarPlus, CircleCheck, ClipboardList, Clock, Plus, Search, Timer, TriangleAlert } from 'lucide-react';
import type { FleetEquipment, Intervention, InterventionType, SavZone, Technician } from '../../state/FleetStore';
import { addDays, toIsoDate } from '../../state/mock/dates';
import { Modal } from '../Modal';
import { SearchableSelect } from '../SearchableSelect';
import {
  SAV_DISPLAY_STATUSES,
  SAV_FIRST_VISIT_GOAL,
  SAV_SLOTS,
  SAV_TYPES,
  displayStatus,
  filterInterventions,
  fmt,
  isHighPriority,
  isOpen,
  proposedType,
  rdvText,
  sortInterventions,
  techOfZone,
  type EquipmentAlertCounts,
  type NewInterventionInput,
  type SavFilters,
  type TeamKpis,
  type TechLoad
} from '../../utils/savKpis';
import { BTN_GHOST, BTN_PRIMARY, BTN_SECONDARY, FIELD, KpiButton, Pager, Section, StatusBadge, TypeCell } from './SavUi';

const PAGE_SIZE = 15;

type Props = {
  list: Intervention[];
  toPlan: Intervention[];
  kpis: TeamKpis;
  loads: TechLoad[];
  asOf: Date;
  asOfIso: string;
  now: Date;
  techs: Technician[];
  zones: SavZone[];
  eqAlerts: EquipmentAlertCounts;
  eqBySerial: Map<string, FleetEquipment>;
  soldEquipments: FleetEquipment[];
  cityOf: (eq: FleetEquipment) => string;
  zoneOfCity: (city: string) => string;
  filters: SavFilters;
  setFilters: (f: SavFilters) => void;
  canPlan: boolean;
  canOpenEquipments: boolean;
  onOpen: (iv: Intervention) => void;
  onPlan: (iv: Intervention, techId: string, date: string, time: string) => void;
  onCreate: (input: NewInterventionInput) => void;
  onGo: (href: string) => void;
  scrollTo: (id: 'sav-a-planifier' | 'sav-liste') => void;
};

export function SavTeamView(p: Props) {
  const { list, kpis, loads, asOfIso, techs, zones, filters, setFilters } = p;
  const techName = (id: string | null) => techs.find((t) => t.id === id)?.name ?? '—';
  const zoneName = (id: string | undefined) => zones.find((z) => z.id === id)?.name ?? '';
  const goList = (patch: Partial<SavFilters>) => {
    setFilters({ tech: '', status: '', type: '', q: '', ...patch });
    p.scrollTo('sav-liste');
  };

  /* ---------- S-08 : technicien proposé + date (demain) + heure, par ligne ---------- */
  const tomorrow = toIsoDate(addDays(p.asOf, 1));
  const [planDraft, setPlanDraft] = useState<Record<string, { techId: string; date: string; time: string }>>({});
  const draftOf = (iv: Intervention) =>
    planDraft[iv.id] ?? { techId: techOfZone(techs, iv.zoneId)?.id ?? techs[0]?.id ?? '', date: tomorrow, time: '10:00' };
  const setDraft = (iv: Intervention, patch: Partial<{ techId: string; date: string; time: string }>) =>
    setPlanDraft((d) => ({ ...d, [iv.id]: { ...draftOf(iv), ...patch } }));

  /* ---------- S-09 ---------- */
  const [page, setPage] = useState(0);
  const filtered = useMemo(() => sortInterventions(filterInterventions(list, filters, asOfIso), asOfIso), [list, filters, asOfIso]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pages - 1);
  const shown = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  const setF = (patch: Partial<SavFilters>) => {
    setPage(0);
    setFilters({ ...filters, ...patch });
  };

  /* ---------- création manuelle (appel client) ---------- */
  const [createOpen, setCreateOpen] = useState(false);
  const maxLoad = Math.max(1, ...loads.map((l) => l.open));

  return (
    <div className="space-y-6">
      {/* SAV-S-01 … S-05 */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4">
        <KpiButton kpi="SAV-S-01" icon={ClipboardList} title="Interventions ouvertes" value={fmt(kpis.open)} sub={`${fmt(kpis.toPlan)} à planifier · ${fmt(kpis.running)} en cours`} onClick={() => goList({ status: 'Ouvertes' })} />
        <KpiButton kpi="SAV-S-02" icon={CalendarPlus} title="À planifier" value={fmt(kpis.toPlan)} unit="sans technicien" sub="à affecter à un technicien" onClick={() => p.scrollTo('sav-a-planifier')} />
        <KpiButton kpi="SAV-S-03" icon={Clock} tone={kpis.late ? 'danger' : 'default'} title="En retard" value={fmt(kpis.late)} sub="date de rendez-vous dépassée" onClick={() => goList({ status: 'En retard' })} />
        <KpiButton
          kpi="SAV-S-04"
          icon={CircleCheck}
          tone={kpis.closed30 && kpis.firstVisitPct < SAV_FIRST_VISIT_GOAL ? 'danger' : 'default'}
          title="Résolues à la 1re visite"
          value={kpis.closed30 ? `${fmt(kpis.firstVisitPct)} %` : '—'}
          sub={`${fmt(kpis.closed30)} terminées sur 30 j · objectif ${SAV_FIRST_VISIT_GOAL} %`}
          onClick={() => goList({ status: 'Terminée' })}
        />
        <KpiButton
          kpi="SAV-S-05"
          icon={Timer}
          title="Délai moyen"
          value={kpis.avgDelayDays == null ? '—' : kpis.avgDelayDays.toLocaleString('fr-FR', { maximumFractionDigits: 1 })}
          unit="jours"
          sub="du signalement à la clôture (30 j)"
          onClick={() => goList({ status: 'Terminée' })}
        />
      </div>

      {/* SAV-S-06 : rappel des alertes Équipements (mêmes règles que EQ-E-03, EQ-A-23, EQ-A-22) */}
      <div data-kpi="SAV-S-06" className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-card border border-warning-200 bg-warning-50 px-4 py-3 text-small text-text">
        <span className="inline-flex items-center gap-2 font-medium">
          <TriangleAlert size={16} aria-hidden="true" className="text-warning-700" />
          Alertes Équipements à traiter :
        </span>
        {[
          { n: p.eqAlerts.notConnected, label: 'installés non connectés', href: '/equipments?etat=non_connecte' },
          { n: p.eqAlerts.disconnected1d, label: 'déconnectés depuis plus de 1 j', href: '/equipments?alerte=direct' },
          { n: p.eqAlerts.pending30, label: 'installations en attente depuis plus de 30 j', href: '/equipments?alerte=attente_30' }
        ].map((a) =>
          p.canOpenEquipments ? (
            <button key={a.href} type="button" onClick={() => p.onGo(a.href)} className="underline decoration-1 underline-offset-2 hover:text-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus rounded-control">
              <b className="tabular-nums">{fmt(a.n)}</b> {a.label}
            </button>
          ) : (
            <span key={a.href}>
              <b className="tabular-nums">{fmt(a.n)}</b> {a.label}
            </span>
          )
        )}
        {p.canOpenEquipments && (
          <button type="button" onClick={() => p.onGo('/equipments')} className="inline-flex items-center gap-1 font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus rounded-control">
            Ouvrir Équipements <ArrowRight size={14} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* SAV-S-07 Charge par technicien */}
      <Section kpi="SAV-S-07" title="Charge par technicien" sub="ouvertes (planifiées + en cours), en retard, aujourd’hui · cliquez pour sa liste">
        <ul className="px-4 md:px-6 pb-4 space-y-2">
          {loads.map((l) => (
            <li key={l.tech.id}>
              <button
                type="button"
                onClick={() => goList({ tech: l.tech.id })}
                aria-pressed={filters.tech === l.tech.id}
                className={`w-full grid gap-2 md:grid-cols-[14rem_1fr_auto] md:items-center rounded-control border px-3 py-2.5 text-left transition-colors duration-fast ease-standard hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus ${filters.tech === l.tech.id ? 'border-primary bg-primary-50' : 'border-border'}`}
              >
                <span>
                  <span className="block text-small font-medium text-text">{l.tech.name}</span>
                  <span className="block text-mention text-text-muted">zone {l.zone?.name}</span>
                </span>
                <span className="flex h-5 w-full overflow-hidden rounded-pill bg-border-subtle" aria-hidden="true">
                  <span className="h-full bg-primary" style={{ width: `${((l.open - l.late) / maxLoad) * 100}%` }} />
                  <span className="h-full bg-danger" style={{ width: `${(l.late / maxLoad) * 100}%` }} />
                </span>
                <span className="text-mention text-text-muted md:text-right tabular-nums">
                  <b className="text-text">{fmt(l.open)}</b> ouvertes · <b className={l.late ? 'text-danger-700' : 'text-text'}>{fmt(l.late)}</b> en retard ·{' '}
                  {fmt(l.today)} aujourd’hui · {fmt(l.closed30)} terminées (30 j)
                </span>
              </button>
            </li>
          ))}
        </ul>
        <p className="px-4 md:px-6 pb-4 text-mention text-text-muted">
          <span className="inline-block h-2 w-3 rounded-pill bg-primary align-middle" aria-hidden="true" /> à l’heure ·{' '}
          <span className="inline-block h-2 w-3 rounded-pill bg-danger align-middle" aria-hidden="true" /> en retard
        </p>
      </Section>

      {/* SAV-S-08 À planifier */}
      <Section
        id="sav-a-planifier"
        kpi="SAV-S-08"
        title="À planifier"
        sub={`${fmt(p.toPlan.length)} signalement(s) sans technicien · le technicien de la zone est proposé, date de demain par défaut`}
        right={
          p.canPlan && (
            <button type="button" className={BTN_SECONDARY} onClick={() => setCreateOpen(true)}>
              <Plus size={16} aria-hidden="true" />
              Nouvelle intervention
            </button>
          )
        }
      >
        <div className="overflow-x-auto">
          <table className="min-w-full w-full text-small text-text tabular-nums">
            <thead>
              <tr className="bg-surface-muted border-y border-border">
                {['Signalement', 'Client · ville', 'Problème', 'Technicien', 'Rendez-vous', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-overline uppercase text-text whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {p.toPlan.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-text-muted">
                    Aucun signalement à planifier.
                  </td>
                </tr>
              )}
              {p.toPlan.map((iv) => {
                const d = draftOf(iv);
                const eq = p.eqBySerial.get(iv.serial);
                return (
                  <tr key={iv.id} className="hover:bg-primary-50 transition-colors duration-fast ease-standard">
                    <td className="px-4 py-3 align-top">
                      <button type="button" onClick={() => p.onOpen(iv)} className="font-mono text-primary hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus rounded-control">
                        {iv.id}
                      </button>
                      <span className="block">
                        <TypeCell iv={iv} />
                      </span>
                      {isHighPriority(iv) && (
                        <span className="mt-1 inline-flex items-center gap-1 rounded-tag border border-danger-200 bg-danger-50 px-2 py-0.5 text-mention font-medium text-danger-700">
                          <TriangleAlert size={12} aria-hidden="true" /> priorité haute
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className="block font-medium">{iv.client}</span>
                      <span className="block text-mention text-text-muted">
                        {iv.city} · {iv.reseller}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className="block">{iv.problem}</span>
                      <span className="block text-mention text-text-muted">
                        {eq?.equipmentType ?? ''} · {iv.vehicle || 'véhicule à renseigner'}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <select value={d.techId} disabled={!p.canPlan} onChange={(e) => setDraft(iv, { techId: e.target.value })} aria-label={`Technicien pour ${iv.id}`} className={FIELD}>
                        {techs.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                            {t.zoneId === iv.zoneId ? ' (zone)' : ''}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className="flex gap-2">
                        <input type="date" value={d.date} min={asOfIso} disabled={!p.canPlan} onChange={(e) => setDraft(iv, { date: e.target.value || tomorrow })} aria-label={`Date pour ${iv.id}`} className={FIELD} />
                        <select value={d.time} disabled={!p.canPlan} onChange={(e) => setDraft(iv, { time: e.target.value })} aria-label={`Heure pour ${iv.id}`} className={FIELD}>
                          {SAV_SLOTS.map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top text-right">
                      {p.canPlan && (
                        <button type="button" className={BTN_PRIMARY} onClick={() => p.onPlan(iv, d.techId, d.date, d.time)}>
                          Planifier
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      {/* SAV-S-09 Toutes les interventions */}
      <Section id="sav-liste" kpi="SAV-S-09" title="Toutes les interventions" sub={`${fmt(filtered.length)} intervention(s) · les retards d’abord, puis par date · cliquez sur une ligne pour la fiche`}>
        <div className="flex flex-wrap items-center gap-2 px-4 md:px-6 pb-3">
          <label className="relative">
            <span className="sr-only">Rechercher</span>
            <Search size={16} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input value={filters.q} onChange={(e) => setF({ q: e.target.value })} placeholder="Client, ville, IMEI, n°" className={`${FIELD} pl-9 w-60`} />
          </label>
          <select value={filters.tech} onChange={(e) => setF({ tech: e.target.value })} aria-label="Technicien" className={FIELD}>
            <option value="">Tous les techniciens</option>
            {techs.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
            <option value="none">Sans technicien</option>
          </select>
          <select value={filters.status} onChange={(e) => setF({ status: e.target.value as SavFilters['status'] })} aria-label="Statut" className={FIELD}>
            <option value="">Tous les statuts</option>
            <option value="Ouvertes">Ouvertes</option>
            {SAV_DISPLAY_STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select value={filters.type} onChange={(e) => setF({ type: e.target.value as SavFilters['type'] })} aria-label="Type" className={FIELD}>
            <option value="">Tous les types</option>
            {SAV_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          {(filters.q || filters.tech || filters.status || filters.type) && (
            <button type="button" className={BTN_GHOST} onClick={() => setF({ q: '', tech: '', status: '', type: '' })}>
              Effacer les filtres
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full w-full text-small text-text tabular-nums">
            <thead>
              <tr className="bg-surface-muted border-y border-border">
                {['N°', 'Type', 'Client · ville', 'Technicien', 'Rendez-vous', 'Statut', 'Résultat'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-overline uppercase text-text whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {shown.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-text-muted">
                    Aucune intervention pour ces filtres.
                  </td>
                </tr>
              )}
              {shown.map((iv) => {
                const st = displayStatus(iv, asOfIso);
                return (
                  <tr
                    key={iv.id}
                    tabIndex={0}
                    onClick={() => p.onOpen(iv)}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), p.onOpen(iv))}
                    className={`cursor-pointer hover:bg-primary-50 transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus focus-visible:ring-inset ${iv.status === 'Terminée' ? 'text-text-muted' : ''}`}
                  >
                    <td className="px-4 py-3 font-mono whitespace-nowrap">{iv.id}</td>
                    <td className="px-4 py-3">
                      <TypeCell iv={iv} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="block font-medium text-text">{iv.client}</span>
                      <span className="block text-mention text-text-muted">{iv.city}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{iv.technicianId ? techName(iv.technicianId) : '—'}</td>
                    <td className={`px-4 py-3 whitespace-nowrap ${st === 'En retard' ? 'text-danger-700 font-medium' : ''}`}>{rdvText(iv)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={st} />
                    </td>
                    <td className="px-4 py-3">{iv.result ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pager page={safePage} pages={pages} onPage={setPage} />
      </Section>

      {createOpen && (
        <NewInterventionModal
          onCancel={() => setCreateOpen(false)}
          onCreate={(input) => {
            p.onCreate(input);
            setCreateOpen(false);
          }}
          list={list}
          equipments={p.soldEquipments}
          cityOf={p.cityOf}
          zoneOfCity={p.zoneOfCity}
          zoneName={zoneName}
          techs={techs}
          asOf={p.asOf}
          now={p.now}
        />
      )}
    </div>
  );
}

const DEFAULT_PROBLEM: Record<InterventionType, string> = {
  Dépannage: 'Appel client : aucune position reçue',
  Contrôle: 'Appel client : positions irrégulières',
  Installation: 'Vendu, pose à prévoir',
  Remplacement: 'Boîtier défectueux à remplacer'
};

/** Création manuelle par le responsable SAV (appel client) ; un seul ticket ouvert par IMEI (doc SAV, point 2). */
function NewInterventionModal({
  onCancel,
  onCreate,
  list,
  equipments,
  cityOf,
  zoneOfCity,
  zoneName,
  techs,
  asOf,
  now
}: {
  onCancel: () => void;
  onCreate: (input: NewInterventionInput) => void;
  list: Intervention[];
  equipments: FleetEquipment[];
  cityOf: (eq: FleetEquipment) => string;
  zoneOfCity: (city: string) => string;
  zoneName: (id: string | undefined) => string;
  techs: Technician[];
  asOf: Date;
  now: Date;
}) {
  const label = (e: FleetEquipment) => `${e.serial} · ${e.client}`;
  const options = useMemo(() => equipments.map(label), [equipments]);
  const [choice, setChoice] = useState('');
  const eq = equipments.find((e) => label(e) === choice);
  const auto = proposedType(eq, now);
  const [type, setType] = useState<InterventionType | ''>('');
  const effectiveType: InterventionType = type || auto || 'Contrôle';
  const [problem, setProblem] = useState('');
  const city = eq ? cityOf(eq) : '';
  const zoneId = city ? zoneOfCity(city) : '';
  const [address, setAddress] = useState('');
  const [planNow, setPlanNow] = useState(false);
  const zoneTech = techs.find((t) => t.zoneId === zoneId);
  const [techId, setTechId] = useState('');
  const [date, setDate] = useState(toIsoDate(addDays(asOf, 1)));
  const [time, setTime] = useState('10:00');
  const openDup = eq ? list.find((iv) => iv.serial === eq.serial && isOpen(iv)) : undefined;

  return (
    <Modal isOpen onClose={onCancel} title="Nouvelle intervention" size="lg">
      <div className="space-y-4">
        <div>
          <span className="block text-label text-text mb-2">Équipement (IMEI · client)</span>
          <SearchableSelect value={choice} onChange={setChoice} options={options} placeholder="Rechercher un IMEI ou un client" />
        </div>
        {eq && (
          <p className="text-small text-text-muted">
            {eq.equipmentType} · {eq.type} · {eq.isInstalled ? `installé (${eq.car})` : 'non installé'} · {city} · zone {zoneName(zoneId)}
            {auto ? ` · type proposé : ${auto}` : ' · aucune alerte en cours'}
          </p>
        )}
        {openDup && (
          <p role="alert" className="rounded-control border border-warning-200 bg-warning-50 px-3 py-2 text-small text-warning-700">
            Une intervention est déjà ouverte pour cet équipement ({openDup.id}, {openDup.status}).
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="block text-label text-text mb-2">Type</span>
            <select value={effectiveType} onChange={(e) => setType(e.target.value as InterventionType)} className={`${FIELD} w-full`}>
              {SAV_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                  {t === auto ? ' (proposé)' : ''}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-label text-text mb-2">Adresse du rendez-vous</span>
            <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder={city ? `ex. Dépôt central, ${city}` : 'Adresse'} className={`${FIELD} w-full`} />
          </label>
        </div>
        <label className="block">
          <span className="block text-label text-text mb-2">Problème signalé</span>
          <input value={problem} onChange={(e) => setProblem(e.target.value)} placeholder={DEFAULT_PROBLEM[effectiveType]} className={`${FIELD} w-full`} />
        </label>
        <label className="inline-flex items-center gap-2 text-small text-text">
          <input type="checkbox" className="h-5 w-5 accent-primary" checked={planNow} onChange={(e) => setPlanNow(e.target.checked)} />
          Planifier tout de suite
        </label>
        {planNow && (
          <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
            <select value={techId || zoneTech?.id || techs[0]?.id} onChange={(e) => setTechId(e.target.value)} aria-label="Technicien" className={FIELD}>
              {techs.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                  {t.id === zoneTech?.id ? ' (zone)' : ''}
                </option>
              ))}
            </select>
            <input type="date" value={date} min={toIsoDate(asOf)} onChange={(e) => setDate(e.target.value)} aria-label="Date" className={FIELD} />
            <select value={time} onChange={(e) => setTime(e.target.value)} aria-label="Heure" className={FIELD}>
              {SAV_SLOTS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        )}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2 border-t border-border-subtle">
          <button type="button" className={BTN_GHOST} onClick={onCancel}>
            Annuler
          </button>
          <button
            type="button"
            className={BTN_PRIMARY}
            disabled={!eq || !!openDup}
            onClick={() =>
              eq &&
              onCreate({
                eq,
                type: effectiveType,
                problem: problem.trim() || DEFAULT_PROBLEM[effectiveType],
                city,
                zoneId,
                address: address.trim() || city,
                plan: planNow ? { techId: techId || zoneTech?.id || techs[0]?.id || '', date, time } : null
              })
            }
          >
            Créer l’intervention
          </button>
        </div>
      </div>
    </Modal>
  );
}
