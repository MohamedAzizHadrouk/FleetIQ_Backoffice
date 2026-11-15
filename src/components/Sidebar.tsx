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

interface SidebarProps {
  role: BackofficeRole;
  onLogout: () => void;
  /** sous 768 px : tiroir ouvert (Layout) */
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

// TUNAV (tokens.md §10.7) : une seule couleur pour tous les rôles – le rôle est identifié par l'icône + le libellé.
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

const FOCUS_INVERSE =
  'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus-inverse focus-visible:ring-offset-2 focus-visible:ring-offset-surface-inverse';

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
      className={`w-60 bg-surface-inverse text-text-inverse h-screen flex flex-col fixed left-0 top-0 z-50 overflow-y-auto transition-transform md:translate-x-0 ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
      <div className="relative px-5 py-4 flex flex-col items-start gap-1 border-b border-white/10">
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Fermer le menu"
          className={`md:hidden absolute right-2 top-2 inline-flex h-11 w-11 items-center justify-center rounded-control text-text-inverse hover:bg-surface-inverse-hover ${FOCUS_INVERSE}`}>
          <X size={20} aria-hidden="true" />
        </button>
        {/* Logo TUNAV horizontal sans signature, version BLANC – zone de protection 0,5 X incluse (logo-spec §2) */}
        <img
          src="/brand/tunav-logo-horizontal-sans-signature-blanc-ui.svg"
          alt="TUNAV"
          className="h-11 w-auto"
        />
        <span className="text-small font-semibold text-text-inverse">FleetIQ Back-office</span>
      </div>

      <div className="px-3 pt-3">
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-control bg-white/10">
          <div className="w-8 h-8 rounded-control bg-primary flex items-center justify-center text-text-inverse flex-shrink-0">
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

      <nav aria-label="Menu principal" className="flex-1 py-4 px-3 flex flex-col gap-0.5">
        <div className="text-overline uppercase text-text-inverse-muted mb-2 px-3">Menu</div>
        {navItems.map((item) => (
          <NavLink
            key={item.key}
            to={BACKOFFICE_ROUTE_PATHS[item.key]}
            className={({ isActive }) =>
              `relative flex items-center gap-3 min-h-11 px-3 rounded-control text-label transition-colors ${FOCUS_INVERSE} ${
                isActive
                  ? 'bg-primary text-text-inverse font-medium before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:rounded-pill before:bg-accent'
                  : 'text-text-inverse-muted hover:bg-surface-inverse-hover hover:text-text-inverse'
              }`
            }>
            <item.icon size={20} aria-hidden="true" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-white/10">
        <button
          type="button"
          onClick={onLogout}
          className={`flex items-center gap-3 min-h-11 px-3 rounded-control text-label text-text-inverse-muted hover:bg-surface-inverse-hover hover:text-text-inverse transition-colors w-full ${FOCUS_INVERSE}`}>
          <LogOut size={20} aria-hidden="true" />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
