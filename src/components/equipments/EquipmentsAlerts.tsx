/**
 * EQ-A-23 (A-23) – alerte « équipement déconnecté depuis plus de 1 j » (carte FleetIQ 07) :
 * - cloche de l'en-tête : alertes des 7 derniers jours, la plus récente en premier ; « Voir les alertes » filtre le tableau ;
 * - notification « En direct » en bas à droite, simulée au chargement de la page (mock : en production, un job
 *   planifié sur la dernière position de chaque équipement – doc Équipements, point à confirmer n° 7).
 */
import { useEffect, useRef } from 'react';
import { ArrowRight, Bell, Radio, X } from 'lucide-react';
import { fmt, lastCommText, type EqRow } from '../../utils/equipmentsKpis';

type BellProps = {
  alerts: EqRow[];
  alertDays: number;
  open: boolean;
  onToggle: (open: boolean) => void;
  onOpenRow: (r: EqRow) => void;
  onShowAll: () => void;
};

export function EquipmentsBell({ alerts, alertDays, open, onToggle, onOpenRow, onShowAll }: BellProps) {
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

  const shown = alerts.slice(0, 15);
  return (
    <div className="relative" ref={ref} data-kpi="EQ-A-23">
      <button
        type="button"
        onClick={() => onToggle(!open)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`Équipements déconnectés depuis plus de ${alertDays} j : ${alerts.length}`}
        className="relative inline-flex h-control w-9 items-center justify-center rounded-control border border-border bg-surface text-text hover:bg-surface-muted transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
      >
        <Bell size={18} aria-hidden="true" />
        {alerts.length > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-pill bg-danger text-text-inverse text-mention font-semibold leading-5 text-center tabular-nums">
            {alerts.length > 99 ? '99+' : alerts.length}
          </span>
        )}
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Équipements déconnectés"
          className="absolute right-0 z-40 mt-2 w-[min(28rem,calc(100vw-2rem))] max-h-[70vh] overflow-y-auto rounded-card border border-border bg-surface shadow-raised"
        >
          <div className="border-b border-border-subtle px-4 py-3">
            <span className="block text-small font-semibold text-text">Déconnectés depuis plus de {fmt(alertDays)} j</span>
            <span className="block text-mention text-text-muted">
              {fmt(alerts.length)} équipement(s) installé(s) sans données · alertes des 7 derniers jours
            </span>
          </div>
          {shown.length === 0 ? (
            <p className="px-4 py-4 text-small text-text-muted">Aucune alerte.</p>
          ) : (
            <ul>
              {shown.map((r) => (
                <li key={r.eq.id} className="border-b border-border-subtle last:border-b-0">
                  <button
                    type="button"
                    onClick={() => {
                      onToggle(false);
                      onOpenRow(r);
                    }}
                    className="flex w-full items-start gap-3 px-4 py-2.5 text-left hover:bg-primary-50 transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus focus-visible:ring-inset"
                  >
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-pill bg-danger" aria-hidden="true" />
                    <span className="flex-1 min-w-0">
                      <span className="block truncate text-small font-medium text-text">
                        <span className="font-mono">{r.eq.serial}</span> · {r.type}
                      </span>
                      <span className="block truncate text-mention text-text-muted">
                        {r.owner} · {r.packName}
                      </span>
                    </span>
                    <span className="shrink-0 text-right text-mention text-text-muted">
                      <span className="block font-medium text-text">{r.state === 'connected' ? 'Connecté' : 'Non connecté'}</span>
                      dernier envoi {lastCommText(r)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {alerts.length > 0 && (
            <button
              type="button"
              onClick={() => {
                onToggle(false);
                onShowAll();
              }}
              className="flex w-full items-center justify-center gap-1 border-t border-border-subtle px-4 py-3 text-small font-medium text-primary hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus focus-visible:ring-inset"
            >
              Voir les {fmt(alerts.length)} alertes <ArrowRight size={14} aria-hidden="true" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** Notification « En direct » (simulée) : l'alerte la plus récente + le nombre d'autres alertes de la semaine */
export function LiveAlertToast({
  alert,
  others,
  alertDays,
  onView,
  onClose
}: {
  alert: EqRow;
  others: number;
  alertDays: number;
  onView: () => void;
  onClose: () => void;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      data-kpi="EQ-A-23"
      className="fixed bottom-4 right-4 z-50 w-[min(24rem,calc(100vw-2rem))] rounded-card border border-danger-200 bg-surface shadow-overlay"
    >
      <div className="flex items-start gap-3 p-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-danger-50 text-danger-700">
          <Radio size={16} aria-hidden="true" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-overline uppercase text-danger-700">En direct</p>
          <p className="text-small font-semibold text-text">
            <span className="font-mono">{alert.eq.serial}</span> · {alert.type} ne répond plus depuis plus de {fmt(alertDays)} j
          </p>
          <p className="text-mention text-text-muted">
            {alert.owner} · {alert.network === 'Tunav' ? 'Tunav · clients directs' : alert.network} · aucune donnée depuis{' '}
            {fmt(Math.floor(alert.daysSince ?? 0))} j · {fmt(others)} autre(s) cette semaine
          </p>
          <p className="mt-1 text-mention text-text-muted">Notification simulée (maquette) – en production : job planifié.</p>
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
