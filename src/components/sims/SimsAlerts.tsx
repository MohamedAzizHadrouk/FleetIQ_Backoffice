/**
 * Gestion des puces v3 – cloche et notification « En direct » (carte FleetIQ 09).
 * - Cloche (PU-P-04 / PU-A-21) : clients en surconsommation (en tête), puces payées sans équipement, puces ≥ @RemindPct,
 *   puces muettes. Les alertes restent ici (plus de carte « Alertes consommation » sur la page).
 * - PU-A-21 : notification « En direct » en bas à droite quand une puce d'un client dépasse son forfait. SIMULÉE au
 *   chargement de la page (maquette) ; en production : déclenchée à chaque import de consommation (job serveur).
 */
import { useEffect, useRef } from 'react';
import { ArrowRight, Bell, Radio, X } from 'lucide-react';
import { fmt, formatTnd, networkLabel, plusVolume, REMIND_PCT, simulatedMinutes, volume, type SimRow, type SimsData } from '../../utils/simsKpis';

type OverClient = SimsData['alerts']['overClients'][number];

type BellProps = {
  data: SimsData;
  showPrices: boolean;
  open: boolean;
  onToggle: (open: boolean) => void;
  onOverClient: (c: OverClient) => void;
  onOpenSim: (r: SimRow) => void;
  onShowAll: () => void;
  /** ouvre la liste d'un groupe d'alertes (PU-P-04) */
  onAlertGroup: (kind: 'haut' | 'bas' | 'sans_equipement') => void;
};

export function SimsBell({ data, showPrices, open, onToggle, onOverClient, onOpenSim, onShowAll, onAlertGroup }: BellProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onToggle(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onToggle(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onToggle]);

  const a = data.alerts;
  const count = a.overClients.length + a.noEquipment.length + a.high.length + a.low.length;
  const item =
    'flex w-full items-start gap-3 px-4 py-2.5 text-left hover:bg-primary-50 transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus focus-visible:ring-inset';
  const SimItem = ({ r, dot, title, sub }: { r: SimRow; dot: string; title: string; sub: string }) => (
    <li className="border-b border-border-subtle last:border-b-0">
      <button
        type="button"
        className={item}
        onClick={() => {
          onToggle(false);
          onOpenSim(r);
        }}
      >
        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-pill ${dot}`} aria-hidden="true" />
        <span className="flex-1 min-w-0">
          <span className="block truncate text-small font-medium text-text">{title}</span>
          <span className="block truncate text-mention text-text-muted">{sub}</span>
        </span>
        <ArrowRight size={14} className="mt-1 shrink-0 text-primary" aria-hidden="true" />
      </button>
    </li>
  );

  return (
    <div className="relative" ref={ref} data-kpi="PU-P-04">
      <button
        type="button"
        onClick={() => onToggle(!open)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`Alertes puces : ${count} à traiter`}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-control border border-border bg-surface text-text hover:bg-surface-muted transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
      >
        <Bell size={18} aria-hidden="true" />
        {count > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-pill bg-danger text-text-inverse text-mention font-semibold leading-5 text-center tabular-nums">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Alertes puces"
          className="absolute right-0 z-40 mt-2 w-[min(28rem,calc(100vw-2rem))] max-h-[70vh] overflow-y-auto rounded-card border border-border bg-surface shadow-raised"
        >
          <div className="border-b border-border-subtle px-4 py-3">
            <span className="block text-small font-semibold text-text">Alertes · {fmt(count)} à traiter</span>
            <span className="block text-mention text-text-muted">
              {fmt(a.overClients.length)} client(s) en surconsommation ·{' '}
              {(
                [
                  ['sans_equipement', `${fmt(a.noEquipment.length)} payées sans équipement`],
                  ['haut', `${fmt(a.high.length)} ≥ ${REMIND_PCT} %`],
                  ['bas', `${fmt(a.low.length)} muettes`]
                ] as const
              ).map(([k, l]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    onToggle(false);
                    onAlertGroup(k);
                  }}
                  className="mr-1 text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus rounded-control"
                >
                  {l} ·
                </button>
              ))}
              30 derniers jours
            </span>
          </div>
          <ul>
            {a.overClients.slice(0, 5).map((c, i) => (
              <li key={c.client} className="border-b border-border-subtle" data-kpi="PU-A-21">
                <button
                  type="button"
                  className={item}
                  onClick={() => {
                    onToggle(false);
                    onOverClient(c);
                  }}
                >
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-pill bg-danger" aria-hidden="true" />
                  <span className="flex-1 min-w-0">
                    <span className="block truncate text-small font-medium text-text">
                      {c.client} : {fmt(c.sims.length)} puce(s) au-delà du forfait
                    </span>
                    <span className="block truncate text-mention text-text-muted">
                      {networkLabel(c.network)} · {plusVolume(c.excessMB)} · il y a {fmt(simulatedMinutes(i))} min (simulé)
                    </span>
                  </span>
                  <ArrowRight size={14} className="mt-1 shrink-0 text-primary" aria-hidden="true" />
                </button>
              </li>
            ))}
            {a.noEquipment.slice(0, 5).map((r) => (
              <SimItem
                key={`ne-${r.sim.id}`}
                r={r}
                dot="bg-warning"
                title={`${r.clientLabel} : puce payée sans équipement`}
                sub={`${r.sim.phoneNumber || `ID ${r.sim.id}`}${showPrices && r.price != null ? ` · ${formatTnd(r.price)} / mois` : ''} · ${r.networkLabel}`}
              />
            ))}
            {a.high.slice(0, 5).map((r) => (
              <SimItem
                key={`hi-${r.sim.id}`}
                r={r}
                dot="bg-warning"
                title={`${r.clientLabel} : ${fmt(r.pct30 ?? 0)} % du forfait`}
                sub={`${r.sim.phoneNumber || `ID ${r.sim.id}`} · ${volume(r.used30)} / ${r.quota != null ? volume(r.quota) : '—'}`}
              />
            ))}
            {a.low.slice(0, 5).map((r) => (
              <SimItem key={`lo-${r.sim.id}`} r={r} dot="bg-chart-4" title={`${r.clientLabel} : puce muette`} sub={`${r.sim.phoneNumber || `ID ${r.sim.id}`} · ${volume(r.used30)} sur 30 j`} />
            ))}
          </ul>
          {count > 0 && (
            <button
              type="button"
              onClick={() => {
                onToggle(false);
                onShowAll();
              }}
              className="flex w-full items-center justify-center gap-1 border-t border-border-subtle px-4 py-3 text-small font-medium text-primary hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus focus-visible:ring-inset"
            >
              Voir toutes les alertes dans la liste <ArrowRight size={14} aria-hidden="true" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** PU-A-21 – notification « En direct » (simulée) */
export function SimLiveToast({ client, onView, onClose }: { client: OverClient; onView: () => void; onClose: () => void }) {
  const top = client.sims.reduce((a, b) => (b.used30 - (b.quota ?? 0) > a.used30 - (a.quota ?? 0) ? b : a), client.sims[0]);
  return (
    <div
      role="status"
      aria-live="polite"
      data-kpi="PU-A-21"
      className="fixed bottom-4 right-4 z-50 w-[min(24rem,calc(100vw-2rem))] rounded-card border border-danger-200 bg-surface shadow-overlay"
    >
      <div className="flex items-start gap-3 p-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-danger-50 text-danger-700">
          <Radio size={16} aria-hidden="true" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-overline uppercase text-danger-700">En direct</p>
          <p className="text-small font-semibold text-text">{client.client} dépasse son forfait</p>
          <p className="text-mention text-text-muted">
            {networkLabel(client.network)} · puce {top.sim.phoneNumber || '—'} (ID {top.sim.id}) · {plusVolume(top.used30 - (top.quota ?? 0))} au-delà de{' '}
            {top.quota != null ? volume(top.quota) : '—'}
          </p>
          <p className="mt-1 text-mention text-text-muted">Notification simulée (maquette) – en production : à chaque relevé de consommation.</p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={onView}
              className="inline-flex items-center gap-1 h-8 px-3 text-button-sm rounded-control bg-primary text-text-inverse hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus focus-visible:ring-offset-2"
            >
              Voir
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer la notification"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-control text-text-muted hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
