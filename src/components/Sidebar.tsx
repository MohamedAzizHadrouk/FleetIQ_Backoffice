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
 * Zone A – barre latérale claire (palette TUNAV) + bascule réduire / agrandir.
 * Fond Blanc + Fond clair, texte Anthracite, action Bleu Royal – plus confortable à l’œil
 * que l’ancien fond anthracite plein.
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
      className={`fixed inset-y-0 left-0 z-topbar flex flex-col bg-surface-inverse text-text-inverse-muted overflow-y-auto overflow-x-hidden transition-[width,transform] duration-slow ease-standard
        ${rail ? 'md:w-rail' : 'md:w-sidebar'} w-sidebar
        md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
    >
      {/* Bande marque Bleu Royal (logo blanc) + bascule */}
      <div
        className={`relative flex items-center gap-2 text-text-inverse ${
          rail ? 'md:flex-col md:px-1 md:py-4 px-4 pt-5 pb-2' : 'px-4 pt-5 pb-2'
        }`}
      >
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Fermer le menu"
          className={`absolute right-2 top-2 inline-flex h-control-touch w-control-touch items-center justify-center rounded-control text-text-inverse hover:bg-surface-inverse-hover md:hidden ${FOCUS}`}
        >
          <X size={20} aria-hidden="true" />
        </button>

        {/* Rail desktop : symbole seul */}
        <img
          src="/brand/tunav-symbole-blanc.svg"
          alt="TUNAV"
          className={`h-7 w-7 shrink-0 ${rail ? 'hidden md:block' : 'hidden'}`}
        />

        {/* Large : logo + sous-titre (mobile toujours ; desktop si non réduit) */}
        <div className={`min-w-0 flex-1 flex-col gap-0.5 pr-8 md:pr-0 ${rail ? 'flex md:hidden' : 'flex'}`}>
          <img
            src="/brand/tunav-logo-horizontal-sans-signature-blanc-ui.svg"
            alt="TUNAV"
            className="h-8 w-auto max-w-full self-start"
          />
          <span className="text-[17px] font-bold leading-tight text-text-inverse">FleetIQ Back-office</span>
        </div>

        {onToggleCollapsed && (
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label={rail ? 'Agrandir le menu' : 'Réduire le menu'}
            aria-expanded={!rail}
            aria-controls="menu-principal"
            title={rail ? 'Agrandir le menu' : 'Réduire le menu'}
            className={`hidden h-9 w-9 shrink-0 items-center justify-center rounded-control text-text-inverse-muted hover:bg-surface-inverse-hover hover:text-text-inverse md:inline-flex ${FOCUS}`}
          >
            {rail ? <PanelLeftOpen size={18} aria-hidden="true" /> : <PanelLeftClose size={18} aria-hidden="true" />}
          </button>
        )}
      </div>

      {/* Bloc de rôle – masqué en rail */}
      <div className={`mx-4 my-3 ${rail ? 'md:hidden' : ''}`}>
        <div className="rounded-[10px] border border-surface-inverse-hover bg-[#111C33] px-3 py-2.5">
          <div className="text-[10px] tracking-[0.08em] text-[#94A3B8]">CONNECTÉ</div>
          <div className="mt-1 truncate text-small font-semibold text-text-inverse">{roleMeta.label}</div>
          {isReseller && <div className="truncate text-mention font-medium text-text-inverse-muted">{subtitle}</div>}
        </div>
      </div>

      {/* Rail : pastille rôle seule */}
      {rail && (
        <div className="hidden md:flex justify-center py-2" title={roleMeta.label}>
          <div className="flex h-9 w-9 items-center justify-center rounded-control bg-[#172554] text-[#BFDBFE]">
            <RoleIcon size={18} aria-hidden="true" />
          </div>
        </div>
      )}

      <nav
        aria-label="Menu principal"
        className={`flex flex-1 flex-col gap-1 py-2 ${rail ? 'md:px-1.5' : 'px-4'}`}
      >
        <div className={`mb-2 text-[10px] tracking-[0.08em] text-[#94A3B8] ${rail ? 'md:hidden' : ''}`}>
          MENU
        </div>
        {navItems.map((item) => (
          <NavLink
            key={item.key}
            to={BACKOFFICE_ROUTE_PATHS[item.key]}
            title={item.label}
            aria-label={item.label}
            className={({ isActive }) =>
              `relative flex items-center gap-3 rounded-control text-body ${TRANSITION} ${FOCUS} ${
                rail ? 'md:h-11 md:justify-center md:px-0' : 'px-3 py-2.5'
              } px-3 py-2.5 ${
                isActive
                  ? 'bg-[#172554] font-semibold text-[#BFDBFE]'
                  : 'text-text-inverse-muted hover:bg-surface-inverse-hover hover:text-text-inverse'
              }`
            }
          >
            <item.icon size={20} aria-hidden="true" className={`shrink-0 ${rail ? 'hidden md:block' : 'hidden'}`} />
            <span className={`truncate ${rail ? 'md:hidden' : ''}`}>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className={`border-t border-surface-inverse-hover ${rail ? 'md:p-1.5' : 'p-4'} p-4`}>
        <button
          type="button"
          onClick={onLogout}
          title="Déconnexion"
          aria-label="Déconnexion"
          className={`flex w-full items-center gap-3 rounded-control text-body text-text-inverse-muted hover:bg-surface-inverse-hover hover:text-text-inverse ${TRANSITION} ${FOCUS} ${
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
