import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';
import type { BackofficeRole } from '../utils/backofficePermissions';
import { FOCUS, TRANSITION } from './ui/focus';

interface LayoutProps {
  role: BackofficeRole;
  onLogout: () => void;
}

const SIDEBAR_COLLAPSED_KEY = 'fleetiq-sidebar-collapsed';

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Coque – zone A (sidebar claire + bascule) + contenu.
 * < 768 px : barre claire + tiroir · ≥ 768 : sidebar 240 px ou rail 56 px (préférence utilisateur).
 */
export function Layout({ role, onLogout }: LayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const location = useLocation();

  useEffect(() => setDrawerOpen(false), [location.pathname]);
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawerOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-surface-muted md:flex">
      {/* Barre mobile claire */}
      <div className="sticky top-0 z-topbar flex h-topbar-mobile items-center justify-between gap-3 border-b border-border bg-surface px-4 md:hidden">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-primary">
            <img src="/brand/tunav-symbole-blanc.svg" alt="" className="h-5 w-5" />
          </div>
          <span className="truncate text-small font-semibold text-text">FleetIQ</span>
        </div>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Ouvrir le menu"
          aria-expanded={drawerOpen}
          aria-controls="menu-principal"
          className={`inline-flex h-control-touch w-control-touch items-center justify-center rounded-control text-text hover:bg-surface-muted ${TRANSITION} ${FOCUS}`}
        >
          <Menu size={20} aria-hidden="true" />
        </button>
      </div>

      {drawerOpen && (
        <div
          className="fixed inset-0 z-overlay bg-tunav-anthracite/40 md:hidden"
          aria-hidden="true"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      <Sidebar
        role={role}
        onLogout={onLogout}
        mobileOpen={drawerOpen}
        onCloseMobile={() => setDrawerOpen(false)}
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
      />

      {/* Menu réduit : seul le rail à gauche ; header / page en pleine largeur (pas de bande vide à droite) */}
      <main
        className={`min-w-0 flex-1 transition-[margin] duration-slow ease-standard [&:has(.fiq-shell)]:p-0 p-4 md:p-6 ${
          collapsed ? 'md:ml-rail' : 'md:ml-sidebar'
        }`}
      >
        <Outlet />
      </main>
    </div>
  );
}
