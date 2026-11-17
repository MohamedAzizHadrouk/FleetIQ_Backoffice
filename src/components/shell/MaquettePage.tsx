/**
 * Monte une page de la maquette validée (FleetAdmin-maquettes v3) dans la page React du back-office :
 * même contenu, mêmes données, mêmes fenêtres. Le contenu et le script sont générés par scripts/port-maquette.py.
 * - le compte connecté (revendeur, profil SAV) vient du rôle du back-office ;
 * - les liens vers les autres pages de la maquette deviennent des navigations du back-office ;
 * - le CSS est limité au conteneur .mq-<slug>.
 */
import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './legacyModalChrome.css';
import { enhanceModalTables } from './modalTableEnhancer';

type MountFn = (
  root: HTMLElement,
  opts: {
    view?: string;
    role?: string;
    search?: string;
    navigate?: (href: string) => void;
    actions?: { edit: boolean; payment: boolean };
    onClientAction?: (action: string, name: string) => boolean;
    getClientDetails?: (name: string) => Record<string, string | number | null | undefined> | null;
    after?: (api: { setView: ((v: string) => void) | null }) => void;
  }
) => () => void;

/** Page de la maquette → route du back-office (les pages Documentation sont ignorées) */
const ROUTES: Record<string, string> = {
  'Main-v3.html': '/dashboard',
  'Clients-v3.html': '/clients',
  'ClientDetail-v3.html': '/clients',
  'Packs-v3.html': '/subscriptions',
  'Puces-v3.html': '/sims',
  'Equipements-v3.html': '/equipments',
  'SAV-v3.html': '/sav'
};

export function toBackofficeRoute(href: string): string | null {
  const m = href.match(/([A-Za-z]+-v3\.html)(\?[^#]*)?/);
  if (!m) return null;
  const route = ROUTES[m[1]];
  return route ? route + (m[2] ?? '') : null;
}

type Props = {
  slug: string;
  markup: string;
  mount: MountFn;
  /** compte revendeur vu par la maquette ('' = Admin TUNAV) */
  view?: string;
  /** profil SAV vu par la maquette : 'RespSAV' | 'TechSAV' | '' */
  role?: string;
  /** clic sur un bouton de la maquette repéré par son texte (ex. « Ajouter un client ») */
  actions?: Record<string, (name?: string) => boolean | void>;
  getClientDetails?: (name: string) => Record<string, string | number | null | undefined> | null;
};

export function MaquettePage({ slug, markup, mount, view = '', role = '', actions, getClientDetails }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const actionsRef = useRef(actions);
  actionsRef.current = actions;
  const detailsRef = useRef(getClientDetails);
  detailsRef.current = getClientDetails;

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    root.innerHTML = markup;
    const go = (href: string) => {
      const to = toBackofficeRoute(href);
      if (to) navigate(to);
    };
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const a = target.closest('a[href]') as HTMLAnchorElement | null;
      if (a && /-v3\.html/.test(a.getAttribute('href') ?? '')) {
        e.preventDefault();
        go(a.getAttribute('href') ?? '');
        return;
      }
      const btn = target.closest('button') as HTMLButtonElement | null;
      const label = btn?.textContent?.trim() ?? '';
      const action = label && actionsRef.current?.[label];
      if (action) {
        e.preventDefault();
        action();
      }
    };
    root.addEventListener('click', onClick);
    let cleanup: (() => void) | undefined;
    try {
      cleanup = mount(root, {
        view, role, search: location.search, navigate: go,
        actions: { edit: Boolean(actionsRef.current?.['client-edit']), payment: Boolean(actionsRef.current?.['client-payment']) },
        onClientAction: (action, name) => Boolean(actionsRef.current?.[action]?.(name)),
        getClientDetails: (name) => detailsRef.current?.(name) ?? null
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`Maquette ${slug} :`, err);
    }
    const cleanupTables = enhanceModalTables(root);
    return () => {
      cleanupTables();
      root.removeEventListener('click', onClick);
      cleanup?.();
      root.innerHTML = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markup, mount, view, role]);

  return <div ref={ref} className={`fiq-shell mq-root mq-${slug}${view ? ' as-rev' : ''}`} />;
}
