/**
 * EQ-F-11 (F-11) – Fiche d'un équipement, partie « v3 » (carte FleetIQ 07) : état + phrase d'explication, client et
 * revendeur, pack, date d'affectation, dernier envoi, activité sur 30 jours, SIM, action à faire et jusqu'à 8 autres
 * équipements du même client. Les blocs existants de la fenêtre (détails, serveur, position) restent en dessous.
 * Aucun prix. « Jours avec données sur 30 j » : à confirmer back-end.
 */
import { CalendarDays, Cpu, Package, Signal, Store, User, Wrench } from 'lucide-react';
import type { ReactNode } from 'react';
import { EqListItem, StateBadge } from './EqUi';
import { parseDate } from '../../state/mock/dates';
import { frDate, lastCommText, networkLabel, nextAction, stateSentence, type EqRow } from '../../utils/equipmentsKpis';

function Field({ icon: Icon, label, children }: { icon: typeof Cpu; label: string; children: ReactNode }) {
  return (
    <div>
      <div className="text-mention font-medium text-text-muted mb-1 flex items-center gap-1.5">
        <Icon size={14} aria-hidden="true" /> {label}
      </div>
      <div className="text-small font-medium text-text">{children}</div>
    </div>
  );
}

export function EquipmentFicheSummary({
  row,
  others,
  connDays,
  alertDays,
  onOpenRow
}: {
  row: EqRow;
  others: EqRow[];
  connDays: number;
  alertDays: number;
  onOpenRow: (r: EqRow) => void;
}) {
  const tone =
    row.state === 'connected'
      ? 'border-success-200 bg-success-50'
      : row.state === 'not_connected'
        ? 'border-danger-200 bg-danger-50'
        : row.state === 'not_installed'
          ? 'border-warning-200 bg-warning-50'
          : 'border-border bg-surface-muted';
  const installed = row.state === 'connected' || row.state === 'not_connected';
  return (
    <div className="space-y-4" data-kpi="EQ-F-11">
      <div className={`rounded-card border p-4 ${tone}`}>
        <div className="flex flex-wrap items-center gap-2">
          <StateBadge state={row.state} />
          {row.live && <span className="text-mention font-medium text-danger-700">Alerte : déconnecté depuis plus de {alertDays} j</span>}
        </div>
        <p className="mt-2 text-small text-text">{stateSentence(row, connDays, alertDays)}</p>
        <p className="mt-1 text-small text-text">
          <Wrench size={14} aria-hidden="true" className="inline mr-1 text-text-muted" />
          <b>Action :</b> {nextAction(row)}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-4">
        <Field icon={User} label="Client">
          {row.state === 'stock' ? '—' : row.owner}
        </Field>
        <Field icon={Store} label="Revendeur">
          {networkLabel(row.network)}
        </Field>
        <Field icon={Package} label="Pack">
          {row.packName}
        </Field>
        <Field icon={CalendarDays} label="Affectation">
          {frDate(row.assigned)}
        </Field>
        <Field icon={Signal} label="Dernier envoi">
          {row.lastComm && installed ? `${frDate(row.lastComm)} · ${lastCommText(row)}` : '—'}
        </Field>
        <Field icon={CalendarDays} label="Installation">
          {installed ? frDate(parseDate(row.eq.installDate ?? null)) : '—'}
        </Field>
        <div className="col-span-2 md:col-span-3">
          <div className="text-mention font-medium text-text-muted mb-1">Activité sur 30 jours (jours avec au moins un envoi · à confirmer back-end)</div>
          <div className="flex items-center gap-3">
            <span className="flex-1 h-3 rounded-pill bg-border-subtle overflow-hidden" aria-hidden="true">
              <span
                className={`block h-full rounded-pill ${row.days30 >= 20 ? 'bg-success' : row.days30 > 0 ? 'bg-warning' : 'bg-danger'}`}
                style={{ width: `${(Math.min(30, row.days30) / 30) * 100}%` }}
              />
            </span>
            <span className="w-20 text-right text-small font-semibold text-text tabular-nums">{row.days30} / 30 j</span>
          </div>
        </div>
        <div className="col-span-2 md:col-span-3">
          <div className="text-mention font-medium text-text-muted mb-1">SIM</div>
          <div className="text-small text-text">
            {row.phone || 'Pas de numéro'} · {row.iccid || 'Pas de CCID'}
            {row.offer ? ` · ${row.offer}` : ' · Aucune offre'}
          </div>
        </div>
      </div>

      {others.length > 0 && (
        <div>
          <h4 className="text-small font-semibold text-text mb-1">Autres équipements de {row.owner} ({others.length})</h4>
          <ul className="divide-y divide-border-subtle rounded-control border border-border-subtle">
            {others.map((o) => (
              <EqListItem key={o.eq.id} row={o} onOpen={onOpenRow} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
