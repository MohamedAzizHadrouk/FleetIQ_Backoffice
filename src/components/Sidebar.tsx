import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  Server,
  LogOut,
  Wrench,
  Store,
  ShieldCheck,
  Wallet,
  Smartphone,
  HardHat,
  ClipboardList,
  X,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import type { BackofficeRole, BackofficeRouteKey } from '../utils/backofficePermissions';
import {
  BACKOFFICE_ROLE_LABELS,
  BACKOFFICE_ROUTE_PATHS,
  getBackofficePermissions
} from '../utils/backofficePermissions';
import { useFleetStore } from '../state/FleetStore';
import { FOCUS, TRANSITION } from './ui/focus';

interface SidebarProps {
  role: BackofficeRole;
  onLogout: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  /** Desktop (≥ md) : menu réduit (rail icônes) ou plein. */
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

const NAV_ITEMS: { key: BackofficeRouteKey; icon: typeof LayoutDashboard; label: string }[] = [
  { key: 'dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
  { key: 'clients', icon: Users, label: 'Gestion Clients' },
  { key: 'subscriptions', icon: Package, label: 'Packs' },
  { key: 'sims', icon: Smartphone, label: 'Gestion des puces' },
  { key: 'equipments', icon: Server, label: 'Équipements' },
  { key: 'sav', icon: ClipboardList, label: 'Interventions SAV' }
];

const ROLE_META: Record<
  BackofficeRole,
  { label: string; icon: React.ComponentType<{ size?: number; className?: string }> }
> = {
  admin_tunav: { label: BACKOFFICE_ROLE_LABELS.admin_tunav, icon: ShieldCheck },
  responsable_sav: { label: BACKOFFICE_ROLE_LABELS.responsable_sav, icon: Wrench },
  technicien_sav: { label: BACKOFFICE_ROLE_LABELS.technicien_sav, icon: HardHat },
  revendeur: { label: BACKOFFICE_ROLE_LABELS.revendeur, icon: Store },
  finance_tunav: { label: BACKOFFICE_ROLE_LABELS.finance_tunav, icon: Wallet }
};

/**
 * Zone A – barre latérale design system TUNAV :
 * Fond clair, logo Bleu Royal et sélection discrète sur blanc.
 */
export function Sidebar({
  role,
  onLogout,
  mobileOpen = false,
  onCloseMobile,
  collapsed = false,
  onToggleCollapsed
}: SidebarProps) {
  const { currentUserName } = useFleetStore();
  const roleMeta = ROLE_META[role];
  const RoleIcon = roleMeta.icon;
  const routePermissions = getBackofficePermissions(role).routes;
  const navItems = NAV_ITEMS.filter((item) => routePermissions[item.key]);
  const isReseller = role === 'revendeur';
  const subtitle = isReseller ? currentUserName : roleMeta.label;
  const rail = collapsed;

  return (
    <aside
      id="menu-principal"
      data-collapsed={rail ? 'true' : 'false'}
      className={`fixed inset-y-0 left-0 z-topbar flex flex-col bg-surface-muted text-text border-r border-border overflow-y-auto overflow-x-hidden transition-[width,transform] duration-slow ease-standard
        ${rail ? 'md:w-rail' : 'md:w-sidebar'} w-sidebar
        md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
    >
      {/* Identité TUNAV */}
      <div
        className={`relative flex items-center gap-2 border-b border-border bg-surface text-text ${
          rail ? 'md:flex-col md:px-1 md:py-3 px-5 py-4' : 'px-5 py-4'
        }`}
      >
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Fermer le menu"
          className={`absolute right-2 top-2 inline-flex h-control-touch w-control-touch items-center justify-center rounded-control text-text-muted hover:bg-primary-50 hover:text-primary md:hidden ${FOCUS}`}
        >
          <X size={20} aria-hidden="true" />
        </button>

        <span
          role="img"
          aria-label="TUNAV"
          className={`h-7 w-7 shrink-0 bg-primary ${rail ? 'hidden md:block' : 'hidden'}`}
          style={{ mask: "url('/brand/tunav-symbole-blanc.svg') center / contain no-repeat" }}
        />

        <div className={`min-w-0 flex-1 flex-col items-start gap-1 pr-8 md:pr-0 ${rail ? 'flex md:hidden' : 'flex'}`}>
          <span
            role="img"
            aria-label="TUNAV"
            className="block h-[50px] w-32 shrink-0 bg-primary"
            style={{ mask: "url('/brand/tunav-logo-horizontal-sans-signature-blanc-ui.svg') left center / contain no-repeat" }}
          />
          <span className="pl-1 text-xs font-medium leading-5 text-text-muted">FleetIQ Back-office</span>
        </div>

        {onToggleCollapsed && (
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label={rail ? 'Agrandir le menu' : 'Réduire le menu'}
            aria-expanded={!rail}
            aria-controls="menu-principal"
            title={rail ? 'Agrandir le menu' : 'Réduire le menu'}
            className={`hidden h-9 w-9 shrink-0 items-center justify-center rounded-control text-text-muted hover:bg-primary-50 hover:text-primary md:inline-flex ${FOCUS}`}
          >
            {rail ? <PanelLeftOpen size={18} aria-hidden="true" /> : <PanelLeftClose size={18} aria-hidden="true" />}
          </button>
        )}
      </div>

      {/* Rôle connecté */}
      <div className={`m-3 ${rail ? 'md:hidden' : ''}`}>
        <div className="flex items-center gap-2.5 rounded-control border border-border bg-surface px-3 py-2.5 shadow-sm">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-primary-100 text-primary">
            <RoleIcon size={16} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="text-overline uppercase text-text-muted">Connecté</div>
            <div className="truncate text-small font-semibold text-text">{roleMeta.label}</div>
            {isReseller && (
              <div className="truncate text-mention font-medium text-text-muted">{subtitle}</div>
            )}
          </div>
        </div>
      </div>

      {rail && (
        <div className="hidden md:flex justify-center py-2" title={roleMeta.label}>
          <div className="flex h-9 w-9 items-center justify-center rounded-control bg-surface text-primary border border-border">
            <RoleIcon size={18} aria-hidden="true" />
          </div>
        </div>
      )}

      <nav
        aria-label="Menu principal"
        className={`flex flex-1 flex-col gap-0.5 py-2 ${rail ? 'md:px-1.5' : 'px-3'}`}
      >
        <div className={`mb-2 px-3 text-overline uppercase text-text-muted ${rail ? 'md:hidden' : ''}`}>
          Menu
        </div>
        {navItems.map((item) => (
          <NavLink
            key={item.key}
            to={BACKOFFICE_ROUTE_PATHS[item.key]}
            title={item.label}
            aria-label={item.label}
            className={({ isActive }) =>
              `relative flex items-center gap-3 rounded-control text-label ${TRANSITION} ${FOCUS} ${
                rail ? 'md:h-11 md:justify-center md:px-0' : 'h-10 px-3'
              } h-11 px-3 md:h-10 ${
                isActive
                  ? 'bg-surface font-semibold text-primary shadow-sm ring-1 ring-border before:absolute before:inset-y-1 before:left-0 before:w-[3px] before:rounded-r before:bg-primary'
                  : 'text-text hover:bg-surface hover:text-primary'
              }`
            }
          >
            <item.icon size={20} aria-hidden="true" className="shrink-0" />
            <span className={`truncate ${rail ? 'md:hidden' : ''}`}>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className={`border-t border-border ${rail ? 'md:p-1.5' : 'p-3'} p-3`}>
        <button
          type="button"
          onClick={onLogout}
          title="Déconnexion"
          aria-label="Déconnexion"
          className={`flex w-full items-center gap-3 rounded-control text-label text-text hover:bg-surface hover:text-primary ${TRANSITION} ${FOCUS} ${
            rail ? 'md:h-11 md:justify-center md:px-0' : 'h-10 px-3'
          } h-11 px-3`}
        >
          <LogOut size={20} aria-hidden="true" className="shrink-0" />
          <span className={rail ? 'md:hidden' : ''}>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
