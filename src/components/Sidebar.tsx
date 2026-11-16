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
  X
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
 * Zone A – barre latérale Industrial Tech (DL § 9.1).
 * ≥ 1024 : 240 px · 768–1023 : rail 56 px (icônes) · < 768 : tiroir.
 */
export function Sidebar({ role, onLogout, mobileOpen = false, onCloseMobile }: SidebarProps) {
  const { currentUserName } = useFleetStore();
  const roleMeta = ROLE_META[role];
  const RoleIcon = roleMeta.icon;
  const routePermissions = getBackofficePermissions(role).routes;
  const navItems = NAV_ITEMS.filter((item) => routePermissions[item.key]);
  const isReseller = role === 'revendeur';
  const subtitle = isReseller ? currentUserName : roleMeta.label;

  return (
    <aside
      id="menu-principal"
      className={`fixed inset-y-0 left-0 z-topbar flex flex-col bg-surface-inverse text-text-inverse overflow-y-auto overflow-x-hidden transition-transform duration-slow ease-standard
        w-sidebar md:w-rail lg:w-sidebar
        md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
    >
      {/* Logo */}
      <div className="relative px-5 pt-3 pb-3.5 border-b border-white/10 md:px-0 md:flex md:justify-center lg:px-5 lg:block">
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Fermer le menu"
          className={`md:hidden absolute right-2 top-2 inline-flex h-control-touch w-control-touch items-center justify-center rounded-control text-text-inverse hover:bg-surface-inverse-hover ${FOCUS_INVERSE}`}
        >
          <X size={20} aria-hidden="true" />
        </button>
        {/* Rail : symbole seul · pleine largeur : logo horizontal */}
        <img
          src="/brand/tunav-symbole-blanc.svg"
          alt="TUNAV"
          className="hidden md:block lg:hidden h-6 w-6 mt-2"
        />
        <div className="md:hidden lg:flex lg:flex-col lg:items-start gap-1">
          <img
            src="/brand/tunav-logo-horizontal-sans-signature-blanc-ui.svg"
            alt="TUNAV"
            className="h-10 w-auto"
          />
          <span className="text-small font-semibold text-text-inverse">FleetIQ Back-office</span>
        </div>
      </div>

      {/* Bloc de rôle – masqué en rail */}
      <div className="m-3 md:hidden lg:block">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-control border border-white/15">
          <div className="h-8 w-8 rounded-control bg-primary flex items-center justify-center text-text-inverse flex-shrink-0">
            <RoleIcon size={16} />
          </div>
          <div className="min-w-0">
            <div className="text-overline uppercase text-text-inverse-muted">Connecté</div>
            <div className="text-small text-text-inverse font-medium truncate">{roleMeta.label}</div>
            {isReseller && (
              <div className="text-mention text-text-inverse-muted font-medium truncate">{subtitle}</div>
            )}
          </div>
        </div>
      </div>

      <nav aria-label="Menu principal" className="flex-1 py-2 px-3 md:px-1 lg:px-3 flex flex-col gap-0.5">
        <div className="text-overline uppercase text-text-inverse-muted mb-2 px-3 md:hidden lg:block">Menu</div>
        {navItems.map((item) => (
          <NavLink
            key={item.key}
            to={BACKOFFICE_ROUTE_PATHS[item.key]}
            title={item.label}
            aria-label={item.label}
            className={({ isActive }) =>
              `relative flex items-center gap-3 h-11 md:h-11 md:justify-center lg:justify-start lg:h-10 px-3 md:px-0 lg:px-3 rounded-control text-label ${TRANSITION} ${FOCUS_INVERSE} ${
                isActive
                  ? 'bg-primary text-text-inverse before:absolute before:-left-3 md:before:left-0 before:inset-y-0 before:w-[3px] before:bg-accent'
                  : 'text-text-inverse-muted hover:bg-surface-inverse-hover hover:text-text-inverse'
              }`
            }
          >
            <item.icon size={20} aria-hidden="true" className="shrink-0" />
            <span className="md:hidden lg:inline truncate">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-3 md:p-1 lg:p-3 border-t border-white/10">
        <button
          type="button"
          onClick={onLogout}
          title="Déconnexion"
          aria-label="Déconnexion"
          className={`flex items-center gap-3 h-11 md:h-11 md:justify-center lg:justify-start lg:h-10 px-3 md:px-0 lg:px-3 rounded-control text-label text-text-inverse-muted hover:bg-surface-inverse-hover hover:text-text-inverse w-full ${TRANSITION} ${FOCUS_INVERSE}`}
        >
          <LogOut size={20} aria-hidden="true" className="shrink-0" />
          <span className="md:hidden lg:inline">Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
