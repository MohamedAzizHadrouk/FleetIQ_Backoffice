import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Edit2,
  Trash2,
  ArrowLeftRight,
  Unlink,
  CheckSquare,
  Square,
  Users
} from 'lucide-react';
import type { SimCard } from '../state/FleetStore';

export type SimRowContextMenuState = {
  sim: SimCard;
  x: number;
  y: number;
} | null;

type SimTableContextMenuProps = {
  menu: SimRowContextMenuState;
  onClose: () => void;
  selectedCount: number;
  isRowSelected: boolean;
  isSelectable: boolean;
  canAssign: boolean;
  canUnassign: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onAssign: () => void;
  onUnassign: () => void;
  onDelete: () => void;
  onToggleSelection: () => void;
  onBulkAssign: () => void;
  bulkAssignCount: number;
};

export function SimTableContextMenu({
  menu,
  onClose,
  selectedCount,
  isRowSelected,
  isSelectable,
  canAssign,
  canUnassign,
  canDelete,
  onEdit,
  onAssign,
  onUnassign,
  onDelete,
  onToggleSelection,
  onBulkAssign,
  bulkAssignCount
}: SimTableContextMenuProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useLayoutEffect(() => {
    if (!menu || !panelRef.current) return;
    const panel = panelRef.current;
    const margin = 8;
    const { innerWidth, innerHeight } = window;
    let x = menu.x;
    let y = menu.y;
    const rect = panel.getBoundingClientRect();
    if (x + rect.width > innerWidth - margin) x = innerWidth - rect.width - margin;
    if (y + rect.height > innerHeight - margin) y = innerHeight - rect.height - margin;
    if (x < margin) x = margin;
    if (y < margin) y = margin;
    setPosition({ x, y });
  }, [menu]);

  useEffect(() => {
    if (!menu) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menu, onClose]);

  if (!menu) return null;

  const run = (fn: () => void) => {
    fn();
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} onContextMenu={(e) => e.preventDefault()} />
      <div
        ref={panelRef}
        role="menu"
        className="fixed z-50 min-w-[220px] py-1.5 bg-surface border border-border rounded-card shadow-raised text-small"
        style={{ left: position.x, top: position.y }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <p className="px-3 py-1.5 text-overline font-semibold uppercase text-text-muted border-b border-border-subtle mb-1">
          Actions sur la puce
        </p>
        <button
          type="button"
          role="menuitem"
          onClick={() => run(onEdit)}
          className="w-full flex items-center gap-2 px-3 py-2 text-left text-text hover:bg-surface-muted transition-colors duration-fast ease-standard"
        >
          <Edit2 size={15} className="text-text-muted" />
          Modifier la puce
        </button>
        {canAssign && (
          <button
            type="button"
            role="menuitem"
            onClick={() => run(onAssign)}
            className="w-full flex items-center gap-2 px-3 py-2 text-left text-text hover:bg-success-50 hover:text-success-700 transition-colors duration-fast ease-standard"
          >
            <ArrowLeftRight size={15} className="text-success" />
            Affecter à un client
          </button>
        )}
        {canUnassign && (
          <button
            type="button"
            role="menuitem"
            onClick={() => run(onUnassign)}
            className="w-full flex items-center gap-2 px-3 py-2 text-left text-text hover:bg-warning-50 hover:text-warning-700 transition-colors duration-fast ease-standard"
          >
            <Unlink size={15} className="text-warning" />
            Retirer du client
          </button>
        )}

        {isSelectable && (
          <>
            <div className="my-1 border-t border-border-subtle" />
            <p className="px-3 py-1 text-overline font-semibold uppercase text-text-muted">
              Affectation groupée
            </p>
            <button
              type="button"
              role="menuitem"
              onClick={() => run(onToggleSelection)}
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-text hover:bg-primary-50 transition-colors duration-fast ease-standard"
            >
              {isRowSelected ? (
                <Square size={15} className="text-primary" />
              ) : (
                <CheckSquare size={15} className="text-primary" />
              )}
              {isRowSelected ? 'Désélectionner' : 'Sélectionner'}
              {selectedCount > 0 && !isRowSelected && (
                <span className="ml-auto text-mention text-text-muted">{selectedCount} déjà</span>
              )}
            </button>
            {bulkAssignCount > 0 && (
              <button
                type="button"
                role="menuitem"
                onClick={() => run(onBulkAssign)}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-primary hover:bg-primary-50 font-medium transition-colors duration-fast ease-standard"
              >
                <Users size={15} className="text-primary" />
                Affecter en groupe ({bulkAssignCount} puce{bulkAssignCount > 1 ? 's' : ''})
              </button>
            )}
          </>
        )}

        {canDelete && (
          <>
            <div className="my-1 border-t border-border-subtle" />
            <button
              type="button"
              role="menuitem"
              onClick={() => run(onDelete)}
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-danger-700 hover:bg-danger-50 transition-colors duration-fast ease-standard"
            >
              <Trash2 size={15} />
              Supprimer la puce
            </button>
          </>
        )}
      </div>
    </>
  );
}
