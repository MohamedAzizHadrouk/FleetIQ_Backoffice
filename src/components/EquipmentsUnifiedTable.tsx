/**
 * EQ-T-11 (T-11) – Liste des équipements « propriétaire et connexion » (carte FleetIQ 07, maquette Equipements-v3).
 * - Tout le parc du périmètre : Tunav (clients directs) en premier, puis MyCom, FleetPro Sfax, NavSud ; le stock à la fin.
 * - Colonnes : propriétaire (client / revendeur), type · IMEI, SIM · offre, pack, affectation, dernière communication,
 *   connexion (jours avec données / 30), statut. Ligne rouge = installé non connecté ; ligne jaune = affecté non installé.
 * - Barre des états (Tous, Installés, Non installés, Connectés, Non connectés, Stock) : nombres et % suivant les autres
 *   filtres ; filtres recherche, type, revendeur (masqué au revendeur), propriétaire, statut, pack, connexion,
 *   période d'affectation ; 25 lignes à la fois.
 * - Une ligne ouvre la fiche EQ-F-11 ; les actions existantes du back-office restent, limitées par rôle.
 * Aucun prix.
 */
import { useEffect, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { ArrowLeftRight, Boxes, Edit2, Eye, RotateCcw, Search, X } from 'lucide-react';
import type { EquipmentType, FleetEquipment, Pack } from '../state/FleetStore';
import type { BackofficePermissions } from '../utils/backofficePermissions';
import { StateBadge } from './equipments/EqUi';
import {
  ETAT_KEYS,
  fmt,
  frDate,
  lastCommText,
  networkLabel,
  pct,
  type EqRow,
  type EqTableFilters,
  type EtatKey,
  type StateCounts
} from '../utils/equipmentsKpis';

export type EquipmentRowStatus = 'installed' | 'not_installed' | 'stock';

type Props = {
  rows: EqRow[];
  /** total du périmètre (compteur « n / total ») */
  totalCount: number;
  /** comptes de la barre des états (tous les filtres sauf l'état) */
  stateCounts: StateCounts;
  filters: EqTableFilters;
  onFiltersChange: (patch: Partial<EqTableFilters>) => void;
  onReset: () => void;
  equipmentTypes: EquipmentType[];
  packs: Pack[];
  networkOptions: string[];
  showNetworkFilter: boolean;
  ownerGroups: Array<{ network: string; owners: string[] }>;
  /** libellé du filtre « À traiter » actif */
  alertLabel: string | null;
  onClearAlert: () => void;
  connDays: number;
  actionPermissions: BackofficePermissions['equipments'];
  onOpen: (r: EqRow) => void;
  onEdit: (eq: FleetEquipment) => void;
  onAssign: (eq: FleetEquipment) => void;
  onReturnToStock: (eq: FleetEquipment) => void;
};

const PAGE = 25;
const ctrl =
  'h-9 px-2 border border-border-strong rounded-control text-small bg-surface focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus';

const ETAT_LABELS: Record<EtatKey, string> = {
  tous: 'Tous',
  installe: 'Installés',
  non_installe: 'Non installés',
  connecte: 'Connectés',
  non_connecte: 'Non connectés',
  stock: 'Stock'
};

const statusOf = (e: EtatKey): string => (e === 'non_installe' || e === 'stock' ? e : e === 'tous' ? 'tous' : 'installe');
const connOf = (e: EtatKey): string => (e === 'connecte' || e === 'non_connecte' ? e : 'tous');

export function EquipmentsUnifiedTable({
  rows,
  totalCount,
  stateCounts: c,
  filters,
  onFiltersChange,
  onReset,
  equipmentTypes,
  packs,
  networkOptions,
  showNetworkFilter,
  ownerGroups,
  alertLabel,
  onClearAlert,
  connDays,
  actionPermissions,
  onOpen,
  onEdit,
  onAssign,
  onReturnToStock
}: Props) {
  const [shown, setShown] = useState(PAGE);
  useEffect(() => setShown(PAGE), [rows.length, filters]);
  const visible = rows.slice(0, shown);
  const canOpen = actionPermissions.canViewDetails;
  const hasActions = actionPermissions.canEdit || actionPermissions.canViewDetails || actionPermissions.canAssign || actionPermissions.canReturnToStock;

  const etatInfo: Record<EtatKey, { n: number; sub: string }> = {
    tous: { n: c.park, sub: `${fmt(c.sold)} vendus · ${fmt(c.stock)} en stock` },
    installe: { n: c.installed, sub: `${pct(c.installed, c.sold)} % sur ${fmt(c.sold)} vendus` },
    non_installe: { n: c.notInstalled, sub: `${pct(c.notInstalled, c.sold)} % sur ${fmt(c.sold)} vendus` },
    connecte: { n: c.connected, sub: `${pct(c.connected, c.installed)} % sur ${fmt(c.installed)} installés` },
    non_connecte: { n: c.notConnected, sub: `${pct(c.notConnected, c.installed)} % sur ${fmt(c.installed)} installés` },
    stock: { n: c.stock, sub: 'non affectés' }
  };

  const stop = (e: MouseEvent) => e.stopPropagation();
  const rowKey = (e: KeyboardEvent<HTMLTableRowElement>, r: EqRow) => {
    if (canOpen && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onOpen(r);
    }
  };
  const rowTint = (r: EqRow) =>
    r.state === 'not_connected' ? 'bg-danger-50' : r.state === 'not_installed' ? 'bg-warning-50' : 'hover:bg-primary-50';

  return (
    <div className="bg-surface rounded-card border border-border overflow-hidden shadow-card" data-kpi="EQ-T-11">
      {/* filtres */}
      <div className="p-4 border-b border-border-subtle bg-surface-muted space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex-1 min-w-[220px]">
            <span className="block text-mention font-medium text-text-muted mb-1">Recherche</span>
            <span className="relative block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} aria-hidden="true" />
              <input
                type="text"
                placeholder="IMEI, client, revendeur, SIM, ICCID…"
                value={filters.q}
                onChange={(e) => onFiltersChange({ q: e.target.value })}
                className="w-full h-9 pl-9 pr-3 bg-surface border border-border-strong rounded-control focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus text-small"
              />
            </span>
          </label>
          <label>
            <span className="block text-mention font-medium text-text-muted mb-1">Type</span>
            <select value={filters.type} onChange={(e) => onFiltersChange({ type: e.target.value })} className={ctrl}>
              <option value="">Tous les types</option>
              {equipmentTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          {showNetworkFilter && (
            <label>
              <span className="block text-mention font-medium text-text-muted mb-1">Revendeur</span>
              <select value={filters.network} onChange={(e) => onFiltersChange({ network: e.target.value, owner: '' })} className={ctrl}>
                <option value="">Tous</option>
                {networkOptions.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label>
            <span className="block text-mention font-medium text-text-muted mb-1">Propriétaire</span>
            <select value={filters.owner} onChange={(e) => onFiltersChange({ owner: e.target.value })} className={`${ctrl} max-w-[220px]`}>
              <option value="">Tous les propriétaires</option>
              {ownerGroups.map((g) =>
                showNetworkFilter ? (
                  <optgroup key={g.network} label={networkLabel(g.network)}>
                    {g.owners.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </optgroup>
                ) : (
                  g.owners.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))
                )
              )}
            </select>
          </label>
          <label>
            <span className="block text-mention font-medium text-text-muted mb-1">Statut</span>
            <select value={statusOf(filters.etat)} onChange={(e) => onFiltersChange({ etat: e.target.value as EtatKey })} className={ctrl}>
              <option value="tous">Tous les statuts</option>
              <option value="installe">Installé</option>
              <option value="non_installe">Non installé</option>
              <option value="stock">Stock</option>
            </select>
          </label>
          <label>
            <span className="block text-mention font-medium text-text-muted mb-1">Pack</span>
            <select value={filters.pack} onChange={(e) => onFiltersChange({ pack: e.target.value })} className={ctrl}>
              <option value="">Tous les packs</option>
              {packs.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.name}
                </option>
              ))}
              <option value="none">Aucun pack</option>
            </select>
          </label>
          <label>
            <span className="block text-mention font-medium text-text-muted mb-1">Connexion</span>
            <select value={connOf(filters.etat)} onChange={(e) => onFiltersChange({ etat: e.target.value as EtatKey })} className={ctrl}>
              <option value="tous">Tous</option>
              <option value="connecte">Connecté (≤ {fmt(connDays)} j)</option>
              <option value="non_connecte">Non connecté</option>
            </select>
          </label>
          <label>
            <span className="block text-mention font-medium text-text-muted mb-1">Affecté du</span>
            <input type="date" value={filters.from} max={filters.to || undefined} onChange={(e) => onFiltersChange({ from: e.target.value })} className={ctrl} />
          </label>
          <label>
            <span className="block text-mention font-medium text-text-muted mb-1">au</span>
            <input type="date" value={filters.to} min={filters.from || undefined} onChange={(e) => onFiltersChange({ to: e.target.value })} className={ctrl} />
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-small text-text tabular-nums">
            <b>{fmt(rows.length)}</b> / {fmt(totalCount)} équipement(s) · {fmt(visible.length)} affichés
          </span>
          {alertLabel && (
            <span className="inline-flex items-center gap-1 rounded-pill border border-primary-200 bg-primary-50 px-3 py-0.5 text-mention font-medium text-primary">
              À traiter : {alertLabel}
              <button type="button" onClick={onClearAlert} aria-label="Retirer le filtre À traiter" className="rounded-pill hover:bg-primary-100 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus">
                <X size={12} aria-hidden="true" />
              </button>
            </span>
          )}
          <button
            type="button"
            onClick={onReset}
            className="ml-auto inline-flex items-center gap-1.5 h-8 px-3 text-button-sm rounded-control border border-border bg-surface text-text hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
          >
            <RotateCcw size={14} aria-hidden="true" />
            Réinitialiser
          </button>
        </div>
      </div>

      {/* barre des états */}
      <div className="border-b border-border-subtle px-4 py-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
          <h3 className="text-small font-semibold text-text">Équipements : propriétaire et connexion</h3>
          <span className="text-mention text-text-muted">
            {fmt(c.park)} équipements · {fmt(c.connected)} connectés · {fmt(c.notConnected)} non connectés · {fmt(c.notInstalled)} non installés ·{' '}
            {fmt(c.stock)} en stock{showNetworkFilter ? ' — Tunav en premier, puis MyCom, FleetPro Sfax et NavSud' : ''}
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2" role="group" aria-label="Filtrer par état">
          {ETAT_KEYS.map((k) => {
            const on = filters.etat === k;
            return (
              <button
                key={k}
                type="button"
                aria-pressed={on}
                onClick={() => onFiltersChange({ etat: on && k !== 'tous' ? 'tous' : k })}
                className={`text-left rounded-control border px-3 py-2 transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus ${
                  on ? 'border-primary bg-primary-50' : 'border-border bg-surface hover:bg-surface-muted'
                }`}
              >
                <span className="block text-mention text-text-muted">{ETAT_LABELS[k]}</span>
                <span className="block text-h4 text-text tabular-nums">{fmt(etatInfo[k].n)}</span>
                <span className="block text-mention text-text-muted">{etatInfo[k].sub}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1180px] text-left">
          <thead>
            <tr className="border-b border-border-subtle text-text-muted text-overline uppercase bg-surface-muted">
              <th className="px-4 py-3 font-medium">Propriétaire</th>
              <th className="px-4 py-3 font-medium">Type · IMEI</th>
              <th className="px-4 py-3 font-medium">SIM · offre</th>
              <th className="px-4 py-3 font-medium">Pack</th>
              <th className="px-4 py-3 font-medium">Affectation</th>
              <th className="px-4 py-3 font-medium">Dernière comm.</th>
              <th className="px-4 py-3 font-medium">Connexion</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              {hasActions && <th className="px-4 py-3 font-medium text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="text-small divide-y divide-border-subtle">
            {visible.map((r) => {
              const eq = r.eq;
              const inStock = r.state === 'stock';
              const installed = r.state === 'connected' || r.state === 'not_connected';
              return (
                <tr
                  key={eq.id}
                  onClick={canOpen ? () => onOpen(r) : undefined}
                  onKeyDown={(e) => rowKey(e, r)}
                  tabIndex={canOpen ? 0 : undefined}
                  aria-label={canOpen ? `Ouvrir la fiche de ${eq.serial}` : undefined}
                  className={`${rowTint(r)} transition-colors ${canOpen ? 'cursor-pointer focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus focus-visible:ring-inset' : ''}`}
                >
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 font-medium text-text">
                      {inStock && <Boxes size={12} className="text-text-muted shrink-0" aria-hidden="true" />}
                      {r.owner}
                    </span>
                    <span className="block text-mention text-text-muted">{r.network}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="block font-medium text-text">{r.type}</span>
                    <span className="block whitespace-nowrap font-mono text-mention text-text">{eq.serial}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="block whitespace-nowrap text-mention text-text">{r.phone || <i className="text-text-muted">Pas de numéro</i>}</span>
                    <span className="block whitespace-nowrap text-mention text-text-muted">{r.offer || 'Aucune offre'}</span>
                  </td>
                  <td className="px-4 py-3">
                    {r.packId != null ? (
                      <span className="inline-flex whitespace-nowrap px-2 py-0.5 rounded-control text-mention font-medium bg-primary-50 text-primary border border-primary-200">
                        {r.packName}
                      </span>
                    ) : (
                      <span className="text-mention text-text-muted">{inStock ? '—' : 'Aucun pack'}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 tabular-nums whitespace-nowrap">{frDate(r.assigned)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {installed && r.lastComm ? (
                      <>
                        <span className="block tabular-nums text-text">{frDate(r.lastComm)}</span>
                        <span className="block text-mention text-text-muted">{lastCommText(r)}</span>
                      </>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {installed ? (
                      <>
                        <StateBadge state={r.state} />
                        <span className="block mt-0.5 text-mention text-text-muted tabular-nums">{r.days30} / 30 j</span>
                      </>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {installed ? (
                      <span className="text-text">Installé</span>
                    ) : (
                      <>
                        <StateBadge state={r.state} />
                        {r.daysWaiting != null && (
                          <span className="block mt-0.5 text-mention text-text-muted">
                            {inStock ? `depuis ${fmt(r.daysWaiting)} j` : `en attente depuis ${fmt(r.daysWaiting)} j`}
                          </span>
                        )}
                      </>
                    )}
                  </td>
                  {hasActions && (
                    <td className="px-4 py-3 text-right" onClick={stop}>
                      <div className="flex items-center justify-end gap-1">
                        {actionPermissions.canEdit && (
                          <button
                            type="button"
                            onClick={() => onEdit(eq)}
                            className="p-1.5 text-text-muted hover:text-primary hover:bg-primary-50 rounded-control transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
                            title="Modifier"
                            aria-label={`Modifier ${eq.serial}`}
                          >
                            <Edit2 size={16} aria-hidden="true" />
                          </button>
                        )}
                        {actionPermissions.canViewDetails && (
                          <button
                            type="button"
                            onClick={() => onOpen(r)}
                            className="p-1.5 text-text-muted hover:text-primary hover:bg-primary-50 rounded-control transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
                            title="Voir détail"
                            aria-label={`Voir le détail de ${eq.serial}`}
                          >
                            <Eye size={16} aria-hidden="true" />
                          </button>
                        )}
                        {actionPermissions.canAssign && (inStock || r.state === 'not_installed') && (
                          <button
                            type="button"
                            onClick={() => onAssign(eq)}
                            className="p-1.5 text-text-muted hover:text-primary hover:bg-primary-50 rounded-control transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
                            title="Affecter"
                            aria-label={`Affecter ${eq.serial}`}
                          >
                            <ArrowLeftRight size={16} aria-hidden="true" />
                          </button>
                        )}
                        {actionPermissions.canReturnToStock && r.state === 'not_installed' && (
                          <button
                            type="button"
                            onClick={() => onReturnToStock(eq)}
                            className="p-1.5 text-text-muted hover:text-text hover:bg-surface-muted rounded-control transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
                            title="Retour au stock"
                            aria-label={`Retour au stock de ${eq.serial}`}
                          >
                            <Boxes size={16} aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={hasActions ? 9 : 8} className="p-8 text-center text-text-muted">
                  Aucun équipement trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle px-4 py-3">
        <span className="text-mention text-text-muted">
          <span className="inline-block h-2.5 w-2.5 rounded-pill bg-danger-200 align-middle mr-1" aria-hidden="true" />
          ligne rouge = installé non connecté ·{' '}
          <span className="inline-block h-2.5 w-2.5 rounded-pill bg-warning-200 align-middle mr-1" aria-hidden="true" />
          ligne jaune = affecté non installé{canOpen ? ' · cliquez sur une ligne pour la fiche' : ''}
        </span>
        {rows.length > shown && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShown((n) => n + PAGE)}
              className="h-8 px-3 text-button-sm rounded-control border border-primary text-primary bg-surface hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
            >
              Afficher 25 de plus
            </button>
            <button
              type="button"
              onClick={() => setShown(rows.length)}
              className="h-8 px-3 text-button-sm rounded-control border border-border text-text bg-surface hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
            >
              Tout afficher ({fmt(rows.length)})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
