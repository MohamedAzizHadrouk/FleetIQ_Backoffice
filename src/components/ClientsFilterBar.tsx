import React from 'react';
import { Calendar, Filter, Search, SlidersHorizontal, X } from 'lucide-react';
import { PeriodFilter, PeriodKey } from './PeriodFilter';
import { FOCUS } from './ui/focus';

type Props = {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  typeFilter: string;
  onTypeChange: (v: string) => void;
  statusFilter: string;
  onStatusChange: (v: string) => void;
  expiryFilterEnabled: boolean;
  onExpiryFilterEnabledChange: (v: boolean) => void;
  periodFilter: PeriodKey;
  onPeriodChange: (v: PeriodKey) => void;
  periodStart: string;
  periodEnd: string;
  onPeriodStartChange: (v: string) => void;
  onPeriodEndChange: (v: string) => void;
  activeFilterCount: number;
  hasActiveFilters: boolean;
  onReset: () => void;
  filteredCount: number;
  totalCount: number;
  /** FleetIQ 06 (T-01) : filtres Propriétaire (vue Tunav), Pack et Connexion équipements */
  ownerFilter?: string;
  onOwnerChange?: (v: string) => void;
  owners?: Array<{ value: string; label: string }>;
  packFilter?: string;
  onPackChange?: (v: string) => void;
  packs?: Array<{ value: string; label: string }>;
  connFilter?: string;
  onConnChange?: (v: string) => void;
  /** filtre « À traiter » actif (libellé) – retiré avec onClearAlert */
  alertLabel?: string | null;
  onClearAlert?: () => void;
};

const selectCls =
  'w-full h-control max-md:h-control-touch px-2.5 rounded-control bg-surface border border-border-strong text-small text-text hover:border-text transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-focus/25';

export function ClientsFilterBar({
  searchQuery,
  onSearchChange,
  typeFilter,
  onTypeChange,
  statusFilter,
  onStatusChange,
  expiryFilterEnabled,
  onExpiryFilterEnabledChange,
  periodFilter,
  onPeriodChange,
  periodStart,
  periodEnd,
  onPeriodStartChange,
  onPeriodEndChange,
  activeFilterCount,
  hasActiveFilters,
  onReset,
  filteredCount,
  totalCount,
  ownerFilter = '',
  onOwnerChange,
  owners,
  packFilter = '',
  onPackChange,
  packs,
  connFilter = '',
  onConnChange,
  alertLabel,
  onClearAlert
}: Props) {
  return (
    <div className="grid grid-cols-12 gap-x-4 gap-y-3 px-4 py-3 border-b border-border bg-surface">
      <div className="col-span-12 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-small font-semibold text-text">
          <SlidersHorizontal size={16} className="text-text-muted" aria-hidden="true" />
          Filtres
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-pill bg-primary text-text-inverse text-mention font-medium">
              {activeFilterCount}
            </span>
          )}
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 text-mention font-medium text-text hover:text-danger bg-surface border border-border hover:border-danger-200 rounded-control px-2.5 py-1.5 transition-colors duration-fast ease-standard">
            <X size={14} />
            Réinitialiser
          </button>
        )}
      </div>

      {/* Ordre de la maquette Clients-v3 : Recherche · Propriétaire · Type client · Statut · Pack · Connexion équip. */}
      <div className="col-span-12 grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <div>
          <label className="block text-mention font-medium text-text mb-1">Recherche</label>
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              size={16}
              aria-hidden="true"
            />
            <input
              type="text"
              placeholder="Nom, e-mail…"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className={`${selectCls} pl-9`}
            />
          </div>
        </div>
        {onOwnerChange && owners && (
          <div>
            <label htmlFor="cli-f-owner" className="block text-mention font-medium text-text mb-1">
              Propriétaire
            </label>
            <select id="cli-f-owner" value={ownerFilter} onChange={(e) => onOwnerChange(e.target.value)} className={selectCls}>
              <option value="">Tous les propriétaires</option>
              {owners.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="block text-mention font-medium text-text mb-1">Type client</label>
          <select value={typeFilter} onChange={(e) => onTypeChange(e.target.value)} className={selectCls}>
            <option value="">Tous les types</option>
            <option value="Simple">Client final</option>
            <option value="Revendeur">Revendeur</option>
          </select>
        </div>
        <div>
          <label className="block text-mention font-medium text-text mb-1">Statut</label>
          <select value={statusFilter} onChange={(e) => onStatusChange(e.target.value)} className={selectCls}>
            <option value="">Tous les statuts</option>
            <option value="Active">Actif</option>
            <option value="Blocked">Bloqué</option>
          </select>
        </div>
        {onPackChange && packs && (
          <div>
            <label htmlFor="cli-f-pack" className="block text-mention font-medium text-text mb-1">
              Pack
            </label>
            <select id="cli-f-pack" value={packFilter} onChange={(e) => onPackChange(e.target.value)} className={selectCls}>
              <option value="">Tous les packs</option>
              {packs.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
              <option value="none">Sans pack</option>
            </select>
          </div>
        )}
        {onConnChange && (
          <div>
            <label htmlFor="cli-f-conn" className="block text-mention font-medium text-text mb-1">
              Connexion équip.
            </label>
            <select id="cli-f-conn" value={connFilter} onChange={(e) => onConnChange(e.target.value)} className={selectCls}>
              <option value="">Tous</option>
              <option value="tous">Tous connectés</option>
              <option value="partiel">Au moins 1 non connecté</option>
              <option value="aucun">Aucun équipement</option>
            </select>
          </div>
        )}
      </div>

      {alertLabel && (
        <div className="col-span-12 flex flex-wrap items-center gap-2 rounded-control border border-info-200 bg-info-50 px-3 py-2 text-small text-text">
          <Filter size={14} className="text-info-700" aria-hidden="true" />
          À traiter : <b>{alertLabel}</b>
          {onClearAlert && (
            <button
              type="button"
              onClick={onClearAlert}
              aria-label={`Retirer le filtre ${alertLabel}`}
              className={`ml-auto inline-flex h-control-sm w-control-sm items-center justify-center rounded-control text-info-700 hover:bg-surface ${FOCUS}`}
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      <div className="col-span-12 rounded-card border border-border bg-surface p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <button
              type="button"
              role="switch"
              aria-checked={expiryFilterEnabled}
              onClick={() => onExpiryFilterEnabledChange(!expiryFilterEnabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-pill transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus focus-visible:ring-offset-2 ${
                expiryFilterEnabled ? 'bg-primary' : 'bg-border'
              }`}>
              <span
                className={`inline-block h-4 w-4 transform rounded-pill bg-surface transition-transform ${
                  expiryFilterEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="flex items-center gap-2 text-small font-medium text-text">
              <Calendar size={15} className="text-text-muted" />
              Filtrer par date d&apos;expiration
            </span>
          </label>
          {expiryFilterEnabled && (
            <span className="inline-flex items-center gap-1 text-mention font-medium text-primary bg-primary-50 border border-primary-200 px-2 py-0.5 rounded-control">
              <Filter size={11} />
              Filtre actif
            </span>
          )}
        </div>
        {expiryFilterEnabled && (
          <div className="mt-3 pt-3 border-t border-border-subtle">
            <PeriodFilter
              value={periodFilter}
              onChange={onPeriodChange}
              startDate={periodStart}
              endDate={periodEnd}
              onStartDateChange={onPeriodStartChange}
              onEndDateChange={onPeriodEndChange}
            />
          </div>
        )}
      </div>

      <div className="col-span-12 flex items-center gap-3 text-small text-text border-t border-border pt-2">
        {filteredCount} / {totalCount} client{filteredCount !== 1 ? 's' : ''}
        {filteredCount !== totalCount ? ' · filtrés' : ''}
      </div>
    </div>
  );
}
