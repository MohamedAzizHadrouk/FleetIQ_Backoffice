import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Modal } from '../Modal';
import { BACKOFFICE_ROUTE_PATHS, type BackofficeRouteKey } from '../../utils/backofficePermissions';
import type { KpiTable } from '../../utils/dashboardKpis';

/** Contenu d'une fenêtre de détail : chiffre, explication, définition, tableau, graphique, lien vers la page source. */
export type DetailSpec = {
  title: string;
  /** ID KPI (TDB-…) affiché discrètement */
  kpiId?: string;
  big: string;
  caption: string;
  what?: string;
  definition?: string;
  formula?: string;
  table?: KpiTable;
  chart?: ReactNode;
  note?: ReactNode;
  route?: BackofficeRouteKey;
  routeLabel?: string;
  /** filtres appliqués à la page cible (paramètres d'URL) */
  routeQuery?: string;
  goLabel?: string;
};

export function KpiDataTable({ table }: { table: KpiTable }) {
  if (!table.rows.length) {
    return <p className="text-small text-text-muted py-4 text-center">Aucune ligne.</p>;
  }
  return (
    <div className="bg-surface rounded-card border border-border overflow-hidden overflow-x-auto">
      <table className="w-full text-small text-text tabular-nums">
        <thead>
          <tr className="bg-surface-muted border-b border-border">
            {table.headers.map((h, i) => (
              <th key={h + i} className={`px-4 py-3 text-overline uppercase text-text ${i ? 'text-right' : 'text-left'}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {table.rows.map((r, ri) => (
            <tr key={ri} className="hover:bg-primary-50 transition-colors duration-fast ease-standard">
              {r.map((v, i) => (
                <td key={i} className={`px-4 py-2.5 ${i ? 'text-right' : 'text-left font-medium'}`}>
                  {typeof v === 'number' ? v.toLocaleString('fr-FR') : v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type Props = {
  detail: DetailSpec | null;
  onClose: () => void;
  canOpen: (route: BackofficeRouteKey) => boolean;
};

export function DetailModal({ detail, onClose, canOpen }: Props) {
  const navigate = useNavigate();
  const d = detail;
  // bouton « Ouvrir la page » seulement si le rôle a accès à la page source
  const route = d?.route && canOpen(d.route) ? d.route : null;
  return (
    <Modal isOpen={!!d} onClose={onClose} title={d?.title ?? ''} size="lg">
      {d && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-kpi text-text tabular-nums">{d.big}</span>
            <span className="text-small text-text-muted">{d.caption}</span>
          </div>
          {d.what && <p className="text-small text-text">{d.what}</p>}
          {d.chart}
          {d.table && <KpiDataTable table={d.table} />}
          {d.note && <div className="text-small text-text">{d.note}</div>}
          {(d.definition || d.formula) && (
            <details className="rounded-control border border-border-subtle bg-surface-muted px-4 py-3 text-small">
              <summary className="cursor-pointer font-medium text-text">Définition et formule{d.kpiId ? ` · ${d.kpiId}` : ''}</summary>
              {d.definition && <p className="mt-2 text-text">{d.definition}</p>}
              {d.formula && <p className="mt-2 text-text-muted">Formule métier : {d.formula}</p>}
            </details>
          )}
          <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-border-subtle">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center h-control px-3 text-button-sm rounded-control bg-transparent text-text hover:bg-surface-muted transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
            >
              Fermer
            </button>
            {route && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate(BACKOFFICE_ROUTE_PATHS[route] + (d.routeQuery ?? ''));
                }}
                className="inline-flex items-center justify-center gap-2 h-control px-3 text-button-sm rounded-control bg-primary text-text-inverse hover:bg-primary-hover active:bg-primary-active transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus focus-visible:ring-offset-2"
              >
                {d.goLabel ?? `Ouvrir ${d.routeLabel ?? 'la page'}`}
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
