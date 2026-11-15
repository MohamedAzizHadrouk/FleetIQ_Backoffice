/** SAV-S-10 (S-10) / SAV-T-07 (T-07) – cloche groupée Urgent · Aujourd’hui · À suivre (carte FleetIQ 10). */
import { useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { fmt, type SavBellGroup, type SavBellItem } from '../../utils/savKpis';

const GROUPS: SavBellGroup[] = ['Urgent', 'Aujourd’hui', 'À suivre'];

type Props = {
  kpi: string;
  items: SavBellItem[];
  open: boolean;
  onToggle: (open: boolean) => void;
  onSelect: (item: SavBellItem) => void;
};

export function SavBell({ kpi, items, open, onToggle, onSelect }: Props) {
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

  const urgent = items.filter((i) => i.urgent).length;
  return (
    <div className="relative" ref={ref} data-kpi={kpi}>
      <button
        type="button"
        onClick={() => onToggle(!open)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`Notifications : ${items.length}, dont ${urgent} urgente(s)`}
        className="relative inline-flex h-control w-control max-lg:h-control-touch max-lg:w-control-touch items-center justify-center rounded-control border border-border-strong bg-surface text-text hover:bg-surface-muted transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus focus-visible:ring-offset-2"
      >
        <Bell size={18} aria-hidden="true" />
        {items.length > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-pill bg-danger text-text-inverse text-mention font-semibold leading-[18px] text-center">
            {items.length > 99 ? '99+' : items.length}
          </span>
        )}
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 z-dropdown mt-1 w-[360px] max-w-[calc(100vw-2rem)] max-h-[70vh] overflow-y-auto rounded-card border border-border-strong bg-surface shadow-raised"
        >
          <div className="border-b border-border px-3 py-2">
            <span className="block text-section text-text">Notifications</span>
            <span className="block text-mention text-text-muted">
              {fmt(urgent)} urgente(s) · {fmt(items.length)} au total
            </span>
          </div>
          {items.length === 0 && <p className="px-4 py-4 text-small text-text-muted">Aucune notification.</p>}
          {GROUPS.map((g) => {
            const list = items.filter((i) => i.group === g);
            if (!list.length) return null;
            return (
              <div key={g}>
                <p className="px-4 pt-3 pb-1 text-overline uppercase text-text-muted">{g}</p>
                <ul>
                  {list.map((it) => (
                    <li key={it.key}>
                      <button
                        type="button"
                        onClick={() => {
                          onToggle(false);
                          onSelect(it);
                        }}
                        className="flex w-full items-start gap-3 px-4 py-2.5 text-left hover:bg-primary-50 transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus focus-visible:ring-inset"
                      >
                        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-pill ${it.urgent ? 'bg-danger' : 'bg-primary'}`} aria-hidden="true" />
                        <span className="flex-1 min-w-0">
                          <span className="block text-small font-medium text-text">{it.title}</span>
                          <span className="block text-mention text-text-muted">{it.sub}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
