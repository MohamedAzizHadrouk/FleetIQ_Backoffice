import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Modal } from '../Modal';
import { Button } from '../ui/Button';
import { BACKOFFICE_ROUTE_PATHS, type BackofficeRouteKey } from '../../utils/backofficePermissions';
import type { KpiTable } from '../../utils/dashboardKpis';

/** Contenu d'une fenêtre de détail : chiffre, tableau, graphique, lien vers la page source. */
export type DetailSpec = {
  title: string;
  /** ID KPI (TDB-…) affiché discrètement */
  kpiId?: string;
  big: string;
  caption: string;
  /** @deprecated non rendu – champs KPI conservés pour compatibilité des appelants */
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
    return <p className="py-6 text-center text-small text-text-muted">Aucune ligne.</p>;
  }
  return (
    <div className="overflow-hidden overflow-x-auto rounded-card border border-border bg-surface">
      <table className="w-full text-small text-text tabular-nums">
        <thead>
          <tr className="border-b border-border bg-surface-muted">
            {table.headers.map((h, i) => (
              <th
                key={h + i}
                className={`px-4 py-3 text-overline font-medium uppercase tracking-wide text-text-muted ${i ? 'text-right' : 'text-left'}`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {table.rows.map((r, ri) => (
            <tr key={ri} className="transition-colors duration-fast ease-standard hover:bg-primary-50">
              {r.map((v, i) => (
                <td key={i} className={`px-4 py-3 align-middle ${i ? 'text-right' : 'text-left font-medium'}`}>
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
  const route = d?.route && canOpen(d.route) ? d.route : null;
  const wide = !!(d?.table || d?.note || d?.chart);

  const footer = (
    <>
      <Button type="button" variant="neutral" onClick={onClose}>
        Fermer
      </Button>
      {route && d && (
        <Button
          type="button"
          variant="primary"
          onClick={() => {
            onClose();
            navigate(BACKOFFICE_ROUTE_PATHS[route] + (d.routeQuery ?? ''));
          }}
        >
          {d.goLabel ?? `Ouvrir ${d.routeLabel ?? 'la page'}`}
          <ArrowRight size={16} aria-hidden="true" />
        </Button>
      )}
    </>
  );

  return (
    <Modal isOpen={!!d} onClose={onClose} title={d?.title ?? ''} size={wide ? 'xl' : 'lg'} footer={footer}>
      {d && (
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="text-kpi tabular-nums text-text">{d.big}</div>
            {d.caption ? <p className="max-w-3xl text-small leading-relaxed text-text-muted">{d.caption}</p> : null}
          </div>

          {d.chart && <div className="space-y-3">{d.chart}</div>}

          {d.table && <KpiDataTable table={d.table} />}

          {d.note && <div className="space-y-3">{d.note}</div>}
        </div>
      )}
    </Modal>
  );
}
