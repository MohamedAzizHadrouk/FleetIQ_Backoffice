/**
 * PU-F-21 (F-21) – fiche d'une puce (carte FleetIQ 09) : s'ouvre au clic sur une puce (liste, cartes, offres, alertes,
 * cloche, consommation…). Offre et forfait (prix fixe pour Admin / Finance), client et revendeur, équipement, data 30 j
 * avec % du forfait, jours sans service, activation / expiration, consommation de janvier à décembre avec la ligne du
 * forfait (mois au-dessus en orange), événements, décision. Actions existantes (Admin) en bas.
 */
import type { ReactNode } from 'react';
import { ArrowLeftRight, Edit2, Trash2, Unlink } from 'lucide-react';
import { BarChart } from '../charts';
import { SimStatusBadge } from './SimUi';
import {
  DETAIL_LABEL,
  MIN_MO,
  REMIND_PCT,
  daysWithoutService,
  fmt,
  formatTnd,
  frDate,
  volume,
  type ConsIndex,
  type PeriodContext,
  type SimRow
} from '../../utils/simsKpis';
import { formatMonthFr, formatMonthShortFr } from '../../state/mock/dates';

type Props = {
  row: SimRow;
  ctx: PeriodContext;
  cons: ConsIndex;
  showPrices: boolean;
  canManage: boolean;
  onEdit: () => void;
  onAssign: () => void;
  onUnassign: () => void;
  onDelete: () => void;
};

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-control border border-border-subtle bg-surface-muted px-3 py-2">
      <p className="text-overline uppercase text-text-muted">{label}</p>
      <div className="text-small text-text">{children}</div>
    </div>
  );
}

export function SimFiche({ row: r, ctx, cons, showPrices, canManage, onEdit, onAssign, onUnassign, onDelete }: Props) {
  const year = ctx.today.getFullYear();
  const months = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`);
  const c = cons.get(r.sim.id);
  const noService = daysWithoutService(r, ctx.today);
  const overMonths = months.filter((m) => r.quota != null && (c?.get(m) ?? 0) > r.quota);

  const decision = !r.installed
    ? r.detail === 'sans_equipement'
      ? 'Le client paie la puce sans équipement : installer un équipement ou récupérer la puce.'
      : r.detail === 'non_posee'
        ? 'L’équipement n’est pas encore posé : planifier l’installation (la puce coûte sans transmettre).'
        : 'Puce en stock : à affecter à un client ou à un équipement.'
    : r.alert === 'haut'
      ? `Consommation ≥ ${REMIND_PCT} % du forfait sur 30 j : proposer l’offre supérieure au client.`
      : r.alert === 'bas'
        ? `Puce muette (moins de ${MIN_MO} Mo sur 30 j) : vérifier l’équipement.`
        : 'Rien à faire : la puce consomme dans son intervalle.';

  const events: Array<[string, string]> = [];
  if (r.sim.activationDate) events.push([frDate(r.sim.activationDate), 'Activation de la puce']);
  if (r.eq?.assignedAt) events.push([frDate(r.eq.assignedAt), `Affectée à l’équipement ${r.eq.serial}`]);
  if (r.eq?.installDate) events.push([frDate(r.eq.installDate), 'Équipement installé chez le client']);
  for (const m of overMonths) events.push([formatMonthFr(m), `Au-delà du forfait : ${volume((c?.get(m) ?? 0) - (r.quota ?? 0))} en trop`]);
  if (r.sim.expirationDate) events.push([frDate(r.sim.expirationDate), 'Expiration de l’abonnement (prévue)']);

  const btn =
    'inline-flex items-center gap-1.5 h-9 px-3 text-button-sm rounded-control border border-border bg-surface text-text hover:bg-surface-muted transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus';
  return (
    <div className="space-y-4" data-kpi="PU-F-21">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-h4 text-text">{r.sim.phoneNumber || 'Pas de numéro'}</p>
          <p className="text-mention text-text-muted">
            ICCID {r.sim.iccid || '—'} · ID {r.sim.id}
          </p>
        </div>
        <SimStatusBadge row={r} />
      </div>
      <p className={`rounded-control border px-3 py-2 text-small ${r.alert || !r.installed ? 'border-warning-200 bg-warning-50 text-text' : 'border-success-200 bg-success-50 text-text'}`}>
        <b>Décision : </b>
        {decision}
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Field label="Offre et forfait">
          {r.offer ? (
            <>
              <b>{r.offer.name}</b> · {r.offer.operator}
              <span className="block text-mention text-text-muted">
                {r.quota != null ? `forfait ${volume(r.quota)} / mois` : 'data illimitée'}
                {showPrices && r.price != null ? ` · ${formatTnd(r.price)} / mois` : ''}
              </span>
            </>
          ) : (
            'Aucune offre'
          )}
        </Field>
        <Field label="Client · revendeur">
          <b>{r.clientLabel}</b>
          <span className="block text-mention text-text-muted">{r.networkLabel}</span>
        </Field>
        <Field label="Équipement">
          {r.eq ? (
            <>
              <b className="font-mono">{r.eq.serial}</b> · {r.eq.equipmentType ?? r.eq.type}
              <span className="block text-mention text-text-muted">
                {r.installed ? `installé${r.eq.installDate ? ` le ${frDate(r.eq.installDate)}` : ''}` : 'non posé'}
              </span>
            </>
          ) : (
            <span className="text-text-muted">Aucun équipement ({DETAIL_LABEL[r.detail]})</span>
          )}
        </Field>
        <Field label="Activation · expiration">
          {frDate(r.sim.activationDate)} → {frDate(r.sim.expirationDate)}
        </Field>
        <Field label="Data 30 j (estimé)">
          <b>{volume(r.used30)}</b>
          {r.pct30 != null && <span className={r.pct30 >= REMIND_PCT ? 'font-semibold text-warning-700' : 'text-text-muted'}> · {fmt(r.pct30)} % du forfait</span>}
        </Field>
        <Field label="Jours sans service">
          <b>{fmt(noService)}</b> j<span className="block text-mention text-text-muted">0 si la puce consomme (estimé)</span>
        </Field>
      </div>

      <div className="space-y-1">
        <p className="text-small font-medium text-text">Consommation janv. → déc. {year}</p>
        <BarChart
          ariaLabel={`Consommation mensuelle de la puce ${r.sim.id}`}
          height={170}
          data={months.map((m) => ({
            label: m > ctx.currentMonth ? '·' : m === ctx.currentMonth ? `${formatMonthShortFr(m)}*` : formatMonthShortFr(m),
            value: m > ctx.currentMonth ? 0 : c?.get(m) ?? 0,
            tone: r.quota != null && (c?.get(m) ?? 0) > r.quota ? 'warning' : 'series1'
          }))}
          formatValue={(n) => (n ? volume(n) : '')}
          refLine={r.quota != null ? { value: r.quota, label: `forfait ${volume(r.quota)}` } : undefined}
        />
        <p className="text-mention text-text-muted">Mois au-dessus du forfait en orange · * mois en cours (partiel) · « · » mois à venir.</p>
      </div>

      <div className="space-y-1">
        <p className="text-small font-medium text-text">Événements</p>
        <ul className="divide-y divide-border-subtle rounded-control border border-border-subtle text-small">
          {events.map(([d, l], i) => (
            <li key={i} className="flex gap-3 px-3 py-1.5">
              <span className="w-24 shrink-0 tabular-nums text-text-muted">{d}</span>
              <span className="text-text">{l}</span>
            </li>
          ))}
        </ul>
        <p className="text-mention text-text-muted">Déduits des données (journal SimEvent à créer – à confirmer back-end).</p>
      </div>

      {canManage && (
        <div className="flex flex-wrap justify-end gap-2 border-t border-border-subtle pt-4">
          <button type="button" className={btn} onClick={onEdit}>
            <Edit2 size={16} aria-hidden="true" /> Modifier
          </button>
          {r.sim.equipmentId == null && (
            <button type="button" className={btn} onClick={onAssign}>
              <ArrowLeftRight size={16} aria-hidden="true" /> Affecter à un client
            </button>
          )}
          {r.detail === 'sans_equipement' && (
            <button type="button" className={btn} onClick={onUnassign}>
              <Unlink size={16} aria-hidden="true" /> Retour au stock
            </button>
          )}
          {r.sim.equipmentId == null && (
            <button type="button" className={`${btn} text-danger-700`} onClick={onDelete}>
              <Trash2 size={16} aria-hidden="true" /> Supprimer
            </button>
          )}
        </div>
      )}
    </div>
  );
}
