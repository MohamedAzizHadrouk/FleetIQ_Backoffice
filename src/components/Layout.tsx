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
 * Mise en page : barre latérale fixe à partir de 768 px (md) ; en dessous, barre du haut + tiroir
 * (tokens.md §5 « la barre latérale fixe doit devenir un tiroir sous md » – carte FleetIQ 10, page SAV sur téléphone).
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
      <div className="md:hidden sticky top-0 z-30 flex h-14 items-center justify-between gap-3 bg-surface-inverse px-4">
        <img src="/brand/tunav-logo-horizontal-sans-signature-blanc-ui.svg" alt="TUNAV" className="h-9 w-auto" />
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Ouvrir le menu"
          aria-expanded={drawerOpen}
          aria-controls="menu-principal"
          className="inline-flex h-11 w-11 items-center justify-center rounded-control text-text-inverse hover:bg-surface-inverse-hover focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus-inverse"
        >
          <Menu size={22} aria-hidden="true" />
        </button>
      </div>
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-tunav-anthracite/60" aria-hidden="true" onClick={() => setDrawerOpen(false)} />
      )}
      <Sidebar role={role} onLogout={onLogout} mobileOpen={drawerOpen} onCloseMobile={() => setDrawerOpen(false)} />
      <main className="flex-1 min-w-0 md:ml-60 p-4 md:p-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}>
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
