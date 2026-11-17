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
import { FOCUS_INVERSE, TRANSITION } from './ui/focus';

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
 * Anthracite, logo blanc et Bleu Royal pour la navigation active.
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
      className={`fixed inset-y-0 left-0 z-topbar flex flex-col bg-surface-inverse text-text-inverse border-r border-white/10 overflow-y-auto overflow-x-hidden transition-[width,transform] duration-slow ease-standard
        ${rail ? 'md:w-rail' : 'md:w-sidebar'} w-sidebar
        md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
    >
      {/* Identité TUNAV */}
      <div
        className={`relative flex items-center gap-2 border-b border-white/10 text-text-inverse ${
          rail ? 'md:flex-col md:px-1 md:py-3 px-4 py-3' : 'px-4 py-3'
        }`}
      >
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Fermer le menu"
          className={`absolute right-2 top-2 inline-flex h-control-touch w-control-touch items-center justify-center rounded-control text-text-inverse hover:bg-surface-inverse-hover md:hidden ${FOCUS_INVERSE}`}
        >
          <X size={20} aria-hidden="true" />
        </button>

        <img
          src="/brand/tunav-symbole-blanc.svg"
          alt="TUNAV"
          className={`h-7 w-7 shrink-0 ${rail ? 'hidden md:block' : 'hidden'}`}
        />

        <div className={`min-w-0 flex-1 flex-col gap-0.5 pr-8 md:pr-0 ${rail ? 'flex md:hidden' : 'flex'}`}>
          <img
            src="/brand/tunav-logo-horizontal-sans-signature-blanc-ui.svg"
            alt="TUNAV"
            className="h-9 w-auto max-w-full"
          />
          <span className="text-small font-semibold text-text-inverse/90">FleetIQ Back-office</span>
        </div>

        {onToggleCollapsed && (
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label={rail ? 'Agrandir le menu' : 'Réduire le menu'}
            aria-expanded={!rail}
            aria-controls="menu-principal"
            title={rail ? 'Agrandir le menu' : 'Réduire le menu'}
            className={`hidden h-9 w-9 shrink-0 items-center justify-center rounded-control text-text-inverse hover:bg-surface-inverse-hover md:inline-flex ${FOCUS_INVERSE}`}
          >
            {rail ? <PanelLeftOpen size={18} aria-hidden="true" /> : <PanelLeftClose size={18} aria-hidden="true" />}
          </button>
        )}
      </div>

      {/* Rôle connecté */}
      <div className={`m-3 ${rail ? 'md:hidden' : ''}`}>
        <div className="flex items-center gap-2.5 rounded-control border border-white/10 bg-white/10 px-3 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-primary text-text-inverse">
            <RoleIcon size={16} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="text-overline uppercase text-text-inverse-muted">Connecté</div>
            <div className="truncate text-small font-medium text-text-inverse">{roleMeta.label}</div>
            {isReseller && (
              <div className="truncate text-mention font-medium text-text-inverse-muted">{subtitle}</div>
            )}
          </div>
        </div>
      </div>

      {rail && (
        <div className="hidden md:flex justify-center py-2" title={roleMeta.label}>
          <div className="flex h-9 w-9 items-center justify-center rounded-control bg-primary text-text-inverse">
            <RoleIcon size={18} aria-hidden="true" />
          </div>
        </div>
      )}

      <nav
        aria-label="Menu principal"
        className={`flex flex-1 flex-col gap-0.5 py-2 ${rail ? 'md:px-1.5' : 'px-3'}`}
      >
        <div className={`mb-2 px-3 text-overline uppercase text-text-inverse-muted ${rail ? 'md:hidden' : ''}`}>
          Menu
        </div>
        {navItems.map((item) => (
          <NavLink
            key={item.key}
            to={BACKOFFICE_ROUTE_PATHS[item.key]}
            title={item.label}
            aria-label={item.label}
            className={({ isActive }) =>
              `relative flex items-center gap-3 rounded-control text-label ${TRANSITION} ${FOCUS_INVERSE} ${
                rail ? 'md:h-11 md:justify-center md:px-0' : 'h-10 px-3'
              } h-11 px-3 md:h-10 ${
                isActive
                  ? 'bg-primary font-medium text-text-inverse before:absolute before:inset-y-1 before:left-0 before:w-[3px] before:rounded-r before:bg-accent'
                  : 'text-text-inverse-muted hover:bg-surface-inverse-hover hover:text-text-inverse'
              }`
            }
          >
            <item.icon size={20} aria-hidden="true" className="shrink-0" />
            <span className={`truncate ${rail ? 'md:hidden' : ''}`}>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className={`border-t border-white/10 ${rail ? 'md:p-1.5' : 'p-3'} p-3`}>
        <button
          type="button"
          onClick={onLogout}
          title="Déconnexion"
          aria-label="Déconnexion"
          className={`flex w-full items-center gap-3 rounded-control text-label text-text-inverse-muted hover:bg-surface-inverse-hover hover:text-text-inverse ${TRANSITION} ${FOCUS_INVERSE} ${
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
