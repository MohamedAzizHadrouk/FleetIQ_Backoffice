import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { motion } from 'framer-motion';
import type { BackofficeRole } from '../utils/backofficePermissions';

interface LayoutProps {
  role: BackofficeRole;
  onLogout: () => void;
}

/**
 * Coque Industrial Tech – zone A (sidebar / rail / tiroir) + colonne contenu (B–E via PageShell).
 * < 768 px : barre anthracite (logo + menu) = topbar mobile (DL § 9.2).
 * 768–1023 : rail 56 px · ≥ 1024 : sidebar 240 px.
 */
export function Layout({ role, onLogout }: LayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setDrawerOpen(false), [location.pathname]);
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawerOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  return (
    <div className="min-h-screen bg-surface-muted md:flex">
      {/* Zone B mobile (< 768) */}
      <div className="md:hidden sticky top-0 z-topbar flex h-topbar-mobile items-center justify-between gap-3 bg-surface-inverse px-4">
        <img src="/brand/tunav-logo-horizontal-sans-signature-blanc-ui.svg" alt="TUNAV" className="h-9 w-auto" />
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Ouvrir le menu"
          aria-expanded={drawerOpen}
          aria-controls="menu-principal"
          className="inline-flex h-control-touch w-control-touch items-center justify-center rounded-control text-text-inverse hover:bg-surface-inverse-hover focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus-inverse"
        >
          <Menu size={20} aria-hidden="true" />
        </button>
      </div>

      {drawerOpen && (
        <div
          className="md:hidden fixed inset-0 z-overlay bg-tunav-anthracite/60"
          aria-hidden="true"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      <Sidebar role={role} onLogout={onLogout} mobileOpen={drawerOpen} onCloseMobile={() => setDrawerOpen(false)} />

      {/* Padding de page : les pages migrées (PageShell) gèrent B–E en pleine largeur ;
          les autres gardent la marge via .fiq-page (appliquée dans chaque page ou ici en secours). */}
      <main className="flex-1 min-w-0 md:ml-rail lg:ml-sidebar [&:has(.fiq-shell)]:p-0 p-4 md:p-6">
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.16, ease: [0.2, 0, 0, 1] }}
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
