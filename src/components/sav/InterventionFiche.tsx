/**
 * Fiche d'intervention (carte FleetIQ 10).
 * - Vue équipe (Admin, Responsable SAV) : détail, technicien, résultat ; SAV-S-11 « Enregistrer le type » ; « Planifier ».
 * - Technicien : SAV-T-06 contrôles sur place, « Démarrer », « Clôturer l'intervention » (ni revendeur, ni autre technicien).
 */
import { useEffect, useState, type ReactNode } from 'react';
import { Camera, ExternalLink, Play, Save } from 'lucide-react';
import type { FleetEquipment, Intervention, InterventionType, SavZone, Technician } from '../../state/FleetStore';
import { addDays, parseDate, toIsoDate } from '../../state/mock/dates';
import {
  SAV_REQUIRED_CHECK,
  SAV_RESULTS,
  SAV_RESULTS_TO_REVIEW,
  SAV_SLOTS,
  SAV_TYPES,
  checksFor,
  displayStatus,
  frDateTime,
  originText,
  rdvText
} from '../../utils/savKpis';
import { BTN_GHOST, BTN_PRIMARY, BTN_SECONDARY, FIELD, StatusBadge } from './SavUi';

type Props = {
  iv: Intervention;
  mode: 'team' | 'technician';
  asOfIso: string;
  eq: FleetEquipment | undefined;
  techs: Technician[];
  zones: SavZone[];
  canPlan: boolean;
  canExecute: boolean;
  canOpenEquipments: boolean;
  onSaveType: (type: InterventionType) => void;
  onPlan: (techId: string, date: string, time: string) => void;
  onStart: () => void;
  onToggleCheck: (item: string) => void;
  /** renvoie un message d'erreur, ou null si la clôture est faite */
  onFinish: (result: string, plate: string) => string | null;
  onOpenEquipments: () => void;
  onDismiss: () => void;
};

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-3 py-2 border-b border-border-subtle last:border-b-0">
      <dt className="text-small text-text-muted">{label}</dt>
      <dd className="text-small text-text min-w-0 break-words">{children}</dd>
    </div>
  );
}

export function InterventionFiche(p: Props) {
  const { iv, mode, asOfIso, eq, techs, zones } = p;
  const team = mode === 'team';
  const status = displayStatus(iv, asOfIso);
  const zoneTech = techs.find((t) => t.zoneId === iv.zoneId);
  const tomorrow = toIsoDate(addDays(parseDate(asOfIso) ?? new Date(), 1));

  const [type, setType] = useState<InterventionType>(iv.type);
  const [techId, setTechId] = useState(iv.technicianId ?? zoneTech?.id ?? techs[0]?.id ?? '');
  const [date, setDate] = useState(iv.status === 'Planifiée' && iv.plannedDate && iv.plannedDate >= asOfIso ? iv.plannedDate : tomorrow);
  const [time, setTime] = useState(iv.plannedTime ?? '10:00');
  const [result, setResult] = useState('');
  const [plate, setPlate] = useState(iv.vehicle);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  useEffect(() => setType(iv.type), [iv.type]);

  const model = eq ? [eq.equipmentType, eq.type].filter(Boolean).join(' · ') : '—';
  const closed = iv.status === 'Terminée';
  const canWork = mode === 'technician' && p.canExecute && (iv.status === 'Planifiée' || iv.status === 'En cours');
  const canReplan = team && p.canPlan && iv.status !== 'Terminée' && iv.status !== 'En cours';
  const checks = checksFor(iv.type);
  const required = SAV_REQUIRED_CHECK[iv.type];
  const needsPlate = iv.type === 'Installation' && !iv.vehicle;
  const zoneName = (t: Technician) => zones.find((z) => z.id === t.zoneId)?.name ?? '';

  return (
    <div className="space-y-5" data-kpi={team ? 'SAV-S-09' : 'SAV-T-06'}>
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={status} />
        <span className="text-small text-text-muted">{iv.type}</span>
      </div>
      {done && (
        <p role="status" className="rounded-control border border-success-200 bg-success-50 px-3 py-2 text-small text-success-700">
          {done}
        </p>
      )}

      <dl>
        <Row label="Type">{iv.type}</Row>
        <Row label="Origine">{originText(iv)}</Row>
        <Row label="Problème">{iv.problem ?? '—'}</Row>
        <Row label="Client">{team ? `${iv.client} · ${iv.reseller === 'Tunav' ? 'Tunav · client direct' : iv.reseller}` : iv.client}</Row>
        <Row label="Adresse">{iv.address ?? iv.city}</Row>
        <Row label="Véhicule">{iv.vehicle || 'à renseigner à la pose'}</Row>
        <Row label="Équipement">
          {model} · IMEI <span className="font-mono">{iv.serial}</span>
        </Row>
        <Row label="Rendez-vous">{rdvText(iv)}</Row>
        {team && (
          <Row label="Technicien">
            {iv.technicianId ? `${techs.find((t) => t.id === iv.technicianId)?.name ?? '—'}` : 'aucun (à planifier)'}
          </Row>
        )}
        <Row label="Signalée le">{frDateTime(iv.createdAt)}</Row>
        {(iv.result || iv.closedAt) && (
          <Row label="Résultat">
            {iv.result ?? '—'}
            {iv.closedAt ? ` · clôturée le ${frDateTime(iv.closedAt)}` : ''}
            {iv.firstVisit != null && iv.status === 'Terminée' ? ` · ${iv.firstVisit ? 'résolue à la 1re visite' : '2e passage'}` : ''}
          </Row>
        )}
      </dl>

      {/* SAV-S-11 : type automatique, modifiable par le responsable tant que l'intervention n'est pas terminée */}
      {team && p.canPlan && !closed && (
        <div className="rounded-card border border-border p-4 space-y-3" data-kpi="SAV-S-11">
          <div>
            <p className="text-label text-text">Type d’intervention</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select value={type} onChange={(e) => setType(e.target.value as InterventionType)} aria-label="Type d’intervention" className={FIELD}>
              {SAV_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                  {t === iv.typeAuto && iv.source === 'alerte' ? ' (proposé)' : ''}
                </option>
              ))}
            </select>
            <button
              type="button"
              className={BTN_SECONDARY}
              disabled={type === iv.type}
              onClick={() => {
                p.onSaveType(type);
                setDone(`Type enregistré : ${type}.`);
              }}
            >
              <Save size={16} aria-hidden="true" />
              Enregistrer le type
            </button>
          </div>
        </div>
      )}

      {/* SAV-S-08 / S-09 : planifier (à planifier, à revoir, en retard) ou replanifier */}
      {canReplan && (
        <div className="rounded-card border border-border p-4 space-y-3" data-kpi="SAV-S-08">
          <p className="text-label text-text">{iv.status === 'À planifier' ? 'Planifier' : 'Replanifier'}</p>
          <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
            <select value={techId} onChange={(e) => setTechId(e.target.value)} aria-label="Technicien" className={FIELD}>
              {techs.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} · {zoneName(t)}
                  {t.id === zoneTech?.id ? ' (zone)' : ''}
                </option>
              ))}
            </select>
            <input type="date" value={date} min={asOfIso} onChange={(e) => setDate(e.target.value || tomorrow)} aria-label="Date du rendez-vous" className={FIELD} />
            <select value={time} onChange={(e) => setTime(e.target.value)} aria-label="Heure" className={FIELD}>
              {SAV_SLOTS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className={BTN_PRIMARY}
            onClick={() => {
              p.onPlan(techId, date, time);
              setDone(`Planifiée le ${(parseDate(date) ?? new Date()).toLocaleDateString('fr-FR')} à ${time}.`);
            }}
          >
            Planifier
          </button>
        </div>
      )}

      {/* SAV-T-06 : contrôles sur place et clôture */}
      {mode === 'technician' && (
        <div className="space-y-4">
          <div>
            <p className="text-label text-text mb-2">Contrôles sur place</p>
            <ul className="space-y-1">
              {checks.map((c) => {
                const isPhoto = c.startsWith('Photo');
                return (
                  <li key={c}>
                    <label className={`flex items-center gap-3 min-h-11 px-3 rounded-control border border-border ${canWork ? 'cursor-pointer hover:bg-primary-50' : 'opacity-75'}`}>
                      <input
                        type="checkbox"
                        className="h-5 w-5 accent-primary"
                        checked={!!iv.checks?.[c]}
                        disabled={!canWork}
                        onChange={() => p.onToggleCheck(c)}
                      />
                      <span className="flex-1 text-small text-text">
                        {c}
                        {c === required && <span className="text-mention text-text-muted"> · obligatoire pour clôturer</span>}
                      </span>
                      {isPhoto && <Camera size={16} aria-hidden="true" className="text-text-muted" />}
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>

          {canWork && (
            <div className="space-y-3">
              {needsPlate && (
                <label className="block">
                  <span className="block text-label text-text mb-2">Immatriculation du véhicule équipé</span>
                  <input value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="ex. 123 TU 4567" className={`${FIELD} w-full`} />
                </label>
              )}
              <label className="block">
                <span className="block text-label text-text mb-2">Résultat</span>
                <select value={result} onChange={(e) => setResult(e.target.value)} className={`${FIELD} w-full`}>
                  <option value="">Choisir…</option>
                  {SAV_RESULTS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                      {SAV_RESULTS_TO_REVIEW.includes(r) ? ' → à revoir' : ''}
                    </option>
                  ))}
                </select>
              </label>
              {error && (
                <p role="alert" className="rounded-control border border-danger-200 bg-danger-50 px-3 py-2 text-small text-danger-700">
                  {error}
                </p>
              )}
              <div className="flex flex-col sm:flex-row gap-2">
                {iv.status === 'Planifiée' && (
                  <button type="button" className={BTN_SECONDARY} onClick={p.onStart}>
                    <Play size={16} aria-hidden="true" />
                    Démarrer
                  </button>
                )}
                <button
                  type="button"
                  className={BTN_PRIMARY}
                  onClick={() => {
                    const err = p.onFinish(result, plate);
                    setError(err);
                    if (!err) setDone(SAV_RESULTS_TO_REVIEW.includes(result) ? 'Intervention rendue « À revoir » au responsable SAV.' : 'Intervention clôturée.');
                  }}
                >
                  Clôturer l’intervention
                </button>
              </div>
            </div>
          )}
          {iv.status === 'À planifier' && (
            <p className="text-small text-text-muted">Pas encore planifiée : le responsable SAV choisit la date et le technicien.</p>
          )}
        </div>
      )}

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 -mx-4 -mb-4 mt-4 border-t border-border bg-surface-muted px-4 py-3">
        <button type="button" className={BTN_GHOST} onClick={p.onDismiss}>
          Fermer
        </button>
        {team && p.canOpenEquipments && (
          <button type="button" className={BTN_SECONDARY} onClick={p.onOpenEquipments}>
            <ExternalLink size={16} aria-hidden="true" />
            Ouvrir Équipements
          </button>
        )}
      </div>
    </div>
  );
}
