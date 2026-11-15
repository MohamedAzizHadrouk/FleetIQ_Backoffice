import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, Filter, Search, SlidersHorizontal, X } from 'lucide-react';
import { PeriodFilter, PeriodKey } from './PeriodFilter';

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
  'w-full bg-surface border border-border-strong rounded-card px-3 py-2 text-small focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus shadow-card';

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
    <div className="p-4 border-b border-border-subtle bg-surface-muted space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-small font-semibold text-text">
          <SlidersHorizontal size={16} className="text-text-muted" />
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
            className="inline-flex items-center gap-1.5 text-mention font-medium text-text hover:text-danger bg-surface border border-border hover:border-danger-200 rounded-control px-2.5 py-1.5 transition-colors">
            <X size={14} />
            Réinitialiser
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3">
        <div className="lg:col-span-5">
          <label className="block text-overline font-medium text-text-muted uppercase mb-1">
            Recherche
          </label>
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              size={16}
            />
            <input
              type="text"
              placeholder="Nom, e-mail…"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-surface border border-border-strong rounded-card focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus text-small shadow-card"
            />
          </div>
        </div>
        <div className="lg:col-span-3">
          <label className="block text-overline font-medium text-text-muted uppercase mb-1">
            Type client
          </label>
          <select
            value={typeFilter}
            onChange={(e) => onTypeChange(e.target.value)}
            className="w-full bg-surface border border-border-strong rounded-card px-3 py-2 text-small focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus shadow-card">
            <option value="">Tous les types</option>
            <option value="Simple">Simple</option>
            <option value="Revendeur">Revendeur</option>
          </select>
        </div>
        <div className="lg:col-span-4">
          <label className="block text-overline font-medium text-text-muted uppercase mb-1">
            Statut
          </label>
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full bg-surface border border-border-strong rounded-card px-3 py-2 text-small focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus shadow-card">
            <option value="">Tous les statuts</option>
            <option value="Active">Actif</option>
            <option value="Blocked">Bloqué</option>
          </select>
        </div>
      </div>

      {(onOwnerChange || onPackChange || onConnChange) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {onOwnerChange && owners && (
            <div>
              <label htmlFor="cli-f-owner" className="block text-overline font-medium text-text-muted uppercase mb-1">
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
          {onPackChange && packs && (
            <div>
              <label htmlFor="cli-f-pack" className="block text-overline font-medium text-text-muted uppercase mb-1">
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
              <label htmlFor="cli-f-conn" className="block text-overline font-medium text-text-muted uppercase mb-1">
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
      )}

      {alertLabel && (
        <div className="flex flex-wrap items-center gap-2 rounded-control border border-primary-200 bg-primary-50 px-3 py-2 text-small text-text">
          <Filter size={14} className="text-primary" aria-hidden="true" />
          À traiter : <b>{alertLabel}</b>
          {onClearAlert && (
            <button
              type="button"
              onClick={onClearAlert}
              className="ml-auto inline-flex items-center gap-1 text-mention font-medium text-primary hover:underline"
            >
              <X size={12} aria-hidden="true" /> Retirer
            </button>
          )}
        </div>
      )}

      <div className="rounded-card border border-border bg-surface p-3 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <button
              type="button"
              role="switch"
              aria-checked={expiryFilterEnabled}
              onClick={() => onExpiryFilterEnabledChange(!expiryFilterEnabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-pill transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus focus-visible:ring-offset-2 ${
                expiryFilterEnabled ? 'bg-primary' : 'bg-border'
              }`}>
              <span
                className={`inline-block h-4 w-4 transform rounded-pill bg-surface shadow-card transition-transform ${
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
        <AnimatePresence>
          {expiryFilterEnabled && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden">
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
            </motion.div>
          )}
        </AnimatePresence>
        {!expiryFilterEnabled && (
          <p className="mt-2 text-mention text-text-muted">
            Toutes les dates d&apos;expiration sont affichées. Activez le filtre pour restreindre la liste.
          </p>
        )}
      </div>

      <div className="text-mention text-text-muted">
        {filteredCount} client{filteredCount !== 1 ? 's' : ''} affiché
        {filteredCount !== totalCount ? ` sur ${totalCount}` : ''}
      </div>
    </div>
  );
}
