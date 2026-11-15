/**
 * Interventions SAV – vue Technicien SAV, une seule page utilisable sur téléphone (carte FleetIQ 10).
 * Ordre de la doc : SAV-T-01…T-04 → en retard → ma tournée du jour (T-05) → prochains jours → à vérifier dans ma zone.
 * Le technicien ne voit que sa zone et ses interventions : ni les autres techniciens, ni les revendeurs, ni les contrats.
 */
import type { ReactNode } from 'react';
import { CalendarClock, CircleCheck, Clock, MapPin, Search } from 'lucide-react';
import type { FleetEquipment, Intervention } from '../../state/FleetStore';
import { toIsoDate } from '../../state/mock/dates';
import { displayStatus, fmt, frDay, type TechKpis } from '../../utils/savKpis';
import { FOCUS, KpiButton, StatusBadge } from './SavUi';

type Props = {
  kpis: TechKpis;
  lists: { late: Intervention[]; today: Intervention[]; next: Intervention[] };
  zoneToPlan: Intervention[];
  asOfIso: string;
  isToday: boolean;
  eqBySerial: Map<string, FleetEquipment>;
  onOpen: (iv: Intervention) => void;
  scrollTo: (id: string) => void;
};

function Visit({ iv, asOfIso, eq, onOpen, dayLabel }: { iv: Intervention; asOfIso: string; eq?: FleetEquipment; onOpen: (iv: Intervention) => void; dayLabel: string }) {
  const st = displayStatus(iv, asOfIso);
  const done = iv.status === 'Terminée';
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(iv)}
        className={`w-full flex gap-3 rounded-card border px-3 py-3 text-left transition-colors duration-fast ease-standard hover:bg-primary-50 ${FOCUS} ${
          st === 'En retard' ? 'border-danger-200 shadow-rail-danger bg-surface' : done ? 'border-border bg-surface-muted' : 'border-border bg-surface'
        }`}
      >
        <span className="w-[4.75rem] shrink-0">
          <span className={`block text-body font-semibold tabular-nums ${done ? 'text-text-muted' : 'text-text'}`}>{iv.plannedTime ?? '—'}</span>
          <span className="block text-mention text-text-muted">{dayLabel}</span>
        </span>
        <span className="flex-1 min-w-0">
          <span className={`block text-small font-medium ${done ? 'text-text-muted' : 'text-text'}`}>
            {iv.client} · {iv.city}
          </span>
          <span className="block text-mention text-text-muted">
            {iv.problem} · {eq?.equipmentType ?? ''}
            {iv.vehicle ? ` · ${iv.vehicle}` : ''}
          </span>
          <span className="mt-0.5 flex items-center gap-1 text-mention text-text-muted">
            <MapPin size={12} aria-hidden="true" /> {iv.address ?? iv.city}
          </span>
          <span className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-tag border border-border px-2 py-0.5 text-mention text-text">{iv.type}</span>
            <StatusBadge status={st} />
          </span>
        </span>
      </button>
    </li>
  );
}

function Block({ id, title, sub, empty, children, kpi }: { id: string; title: string; sub: string; empty: string; children: ReactNode[]; kpi?: string }) {
  return (
    <section id={id} data-kpi={kpi} className="col-span-12 scroll-mt-topbar bg-surface rounded-card border border-border min-w-0">
      <div className="px-4 py-2.5 border-b border-border">
        <h2 className="text-section text-text">{title}</h2>
        <p className="text-mention text-text-muted mt-0.5">{sub}</p>
      </div>
      <div className="p-4">
        {children.length ? (
          <ul className="space-y-2">{children}</ul>
        ) : (
          <p className="py-8 text-center text-small text-text-muted">{empty}</p>
        )}
      </div>
    </section>
  );
}

export function SavTechnicianView({ kpis, lists, zoneToPlan, asOfIso, isToday, eqBySerial, onOpen, scrollTo }: Props) {
  const dayWord = isToday ? 'aujourd’hui' : frDay(asOfIso);
  return (
    <div className="grid grid-cols-12 gap-4 gap-y-6">
      <div className="col-span-12 grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
        <KpiButton kpi="SAV-T-01" icon={CalendarClock} title={isToday ? 'Aujourd’hui' : 'Ce jour'} value={fmt(kpis.today)} unit="interv." sub={`${fmt(kpis.todayLeft)} restante(s) · ${fmt(kpis.todayDone)} terminée(s)`} onClick={() => scrollTo('sav-tournee')} />
        <KpiButton kpi="SAV-T-02" icon={Clock} tone={kpis.late ? 'danger' : 'default'} title="En retard" value={fmt(kpis.late)} unit="à faire" sub="date dépassée, à faire en priorité" onClick={() => scrollTo('sav-retard')} />
        <KpiButton kpi="SAV-T-03" icon={CircleCheck} title="Terminées · 7 j" value={fmt(kpis.closed7)} unit="interv." sub={`${fmt(kpis.first7Pct)} % résolues à la 1re visite`} onClick={() => scrollTo('sav-tournee')} />
        <KpiButton kpi="SAV-T-04" icon={Search} title="À vérifier dans ma zone" value={fmt(kpis.zoneToPlan)} unit="équip." sub="pas encore planifiés par le responsable" onClick={() => scrollTo('sav-zone')} />
      </div>

      <Block id="sav-retard" kpi="SAV-T-02" title="En retard" sub="à faire en premier" empty="Aucune intervention en retard.">
        {lists.late.map((iv) => (
          <Visit key={iv.id} iv={iv} asOfIso={asOfIso} eq={eqBySerial.get(iv.serial)} onOpen={onOpen} dayLabel={frDay(iv.plannedDate)} />
        ))}
      </Block>

      <Block id="sav-tournee" kpi="SAV-T-05" title="Ma tournée du jour" sub="dans l’ordre des rendez-vous · touchez une intervention pour ouvrir la fiche, cocher les contrôles et clôturer" empty="Aucun rendez-vous ce jour.">
        {lists.today.map((iv) => (
          <Visit key={iv.id} iv={iv} asOfIso={asOfIso} eq={eqBySerial.get(iv.serial)} onOpen={onOpen} dayLabel={dayWord} />
        ))}
      </Block>

      <Block id="sav-prochains" kpi="SAV-T-05" title="Prochains jours" sub="déjà planifiées (14 jours)" empty="Rien de planifié pour les prochains jours.">
        {lists.next.map((iv) => (
          <Visit key={iv.id} iv={iv} asOfIso={asOfIso} eq={eqBySerial.get(iv.serial)} onOpen={onOpen} dayLabel={frDay(iv.plannedDate)} />
        ))}
      </Block>

      <Block id="sav-zone" kpi="SAV-T-04" title="À vérifier dans ma zone" sub="équipements signalés, pas encore planifiés · le responsable SAV les planifie" empty="Aucun signalement en attente dans votre zone.">
        {zoneToPlan.map((iv) => (
          <Visit key={iv.id} iv={iv} asOfIso={asOfIso} eq={eqBySerial.get(iv.serial)} onOpen={onOpen} dayLabel={`signalé ${frDay(toIsoDate(new Date(iv.createdAt)))}`} />
        ))}
      </Block>
    </div>
  );
}
