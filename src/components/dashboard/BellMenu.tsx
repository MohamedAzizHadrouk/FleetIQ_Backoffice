import { useEffect, useRef } from 'react';
import { ArrowRight, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BACKOFFICE_ROUTE_PATHS, type BackofficeRouteKey } from '../../utils/backofficePermissions';
import { fmt, PRIORITY_LABELS, type TodoItem, type TodoPriority } from '../../utils/dashboardKpis';

const PRIORITY_DOT: Record<TodoPriority, string> = { 1: 'bg-danger', 2: 'bg-warning', 3: 'bg-chart-4' };
const PRIORITY_TEXT: Record<TodoPriority, string> = { 1: 'text-danger-700', 2: 'text-warning-700', 3: 'text-text-muted' };

type Props = {
  items: TodoItem[];
  open: boolean;
  onToggle: (open: boolean) => void;
  onOpenItem: (item: TodoItem) => void;
  canOpen: (route: BackofficeRouteKey) => boolean;
};

/**
 * TDB-D-06 / TDB-R-05 – Cloche « À traiter » : tous les sujets, groupés par urgence.
 * Un clic sur un sujet ouvre son détail ; le lien « → » ouvre directement la page source.
 */
export function BellMenu({ items, open, onToggle, onOpenItem, canOpen }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const urgent = items.filter((t) => t.priority === 1).length;

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

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => onToggle(!open)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`À traiter : ${items.length} sujet(s), dont ${urgent} urgent(s)`}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-control border border-border bg-surface text-text hover:bg-surface-muted transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
      >
        <Bell size={18} aria-hidden="true" />
        <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-pill bg-danger text-text-inverse text-mention font-semibold leading-5 text-center tabular-nums">
          {items.length}
        </span>
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="À traiter"
          className="absolute right-0 z-40 mt-2 w-[min(28rem,calc(100vw-2rem))] max-h-[70vh] overflow-y-auto rounded-card border border-border bg-surface shadow-raised"
        >
          <div className="flex items-baseline justify-between gap-3 border-b border-border-subtle px-4 py-3">
            <span className="text-small font-semibold text-text">À traiter</span>
            <span className="text-mention text-text-muted">
              {urgent} urgent(s) · {items.length} sujet(s)
            </span>
          </div>
          <ul>
            {([1, 2, 3] as TodoPriority[]).map((p) => {
              const list = items.filter((t) => t.priority === p);
              if (!list.length) return null;
              return (
                <li key={p}>
                  <div className={`px-4 pt-3 pb-1 text-overline uppercase ${PRIORITY_TEXT[p]}`}>{PRIORITY_LABELS[p]}</div>
                  <ul>
                    {list.map((t) => (
                      <li key={t.id} className="flex items-stretch border-b border-border-subtle last:border-b-0">
                        <button
                          type="button"
                          onClick={() => {
                            onToggle(false);
                            onOpenItem(t);
                          }}
                          className="flex flex-1 min-w-0 items-start gap-3 px-4 py-2.5 text-left hover:bg-primary-50 transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus focus-visible:ring-inset"
                        >
                          <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-pill ${PRIORITY_DOT[t.priority]}`} aria-hidden="true" />
                          <span className="flex-1 min-w-0">
                            <span className="block text-small font-medium text-text">{t.title}</span>
                            <span className="block text-mention text-text-muted">{t.detail}</span>
                          </span>
                          <span className="shrink-0 text-right">
                            <span className="block text-small font-semibold text-text tabular-nums">{fmt(t.count)}</span>
                            <span className="block text-mention text-text-muted">{t.unit}</span>
                          </span>
                        </button>
                        {canOpen(t.route) && (
                          <button
                            type="button"
                            onClick={() => {
                              onToggle(false);
                              navigate(BACKOFFICE_ROUTE_PATHS[t.route] + (t.routeQuery ?? ''));
                            }}
                            title={`Ouvrir ${t.routeLabel}`}
                            aria-label={`Ouvrir ${t.routeLabel}`}
                            className="flex w-10 shrink-0 items-center justify-center text-primary hover:bg-primary-50 transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus focus-visible:ring-inset"
                          >
                            <ArrowRight size={16} aria-hidden="true" />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Bandeau « Urgent » en haut de « Du stock au service » (sujets urgents de la cloche). */
export function UrgentBand({
  items,
  onOpenItem,
  onOpenBell
}: {
  items: TodoItem[];
  onOpenItem: (item: TodoItem) => void;
  onOpenBell: () => void;
}) {
  const urgent = items.filter((t) => t.priority === 1);
  const rest = items.length - urgent.length;
  if (!urgent.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-card border border-danger-200 bg-danger-50 px-4 py-3">
      <span className="text-small font-semibold text-danger-700">Urgent</span>
      {urgent.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onOpenItem(t)}
          className="inline-flex items-center gap-1 rounded-pill border border-danger-200 bg-surface px-3 py-1 text-mention text-text hover:border-danger transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
        >
          <span className="font-semibold tabular-nums text-danger-700">{fmt(t.count)}</span>·{' '}
          {t.title.charAt(0).toLowerCase() + t.title.slice(1)}
        </button>
      ))}
      {rest > 0 && (
        <button
          type="button"
          onClick={onOpenBell}
          className="ml-auto text-mention font-medium text-danger-700 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus rounded-control"
        >
          +{rest} autres sujets dans la cloche
        </button>
      )}
    </div>
  );
}
