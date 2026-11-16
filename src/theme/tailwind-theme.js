/**
 * FleetIQ Back-office – thème Tailwind 3.4 (theme.extend) – style de la maquette v3 (FleetAdmin-maquettes, pages-navigateur).
 * Valeurs reprises du CSS des maquettes Main-v3, Clients-v3, Packs-v3, Puces-v3, Equipements-v3, SAV-v3 :
 * palette Slate / Blue, IBM Plex Sans + IBM Plex Mono (chiffres), cartes 12 px, contrôles 8 px, fenêtres 14 px.
 * Les noms des jetons sont inchangés : tous les composants suivent sans modification.
 */

const tunavTheme = {
  colors: {
    /* ---- Couleurs brutes (anciens noms gardés pour compatibilité) ---- */
    tunav: {
      'bleu-royal': '#2563EB',
      'bleu-ciel': '#60A5FA',
      anthracite: '#0F172A',
      'gris-texte': '#475569',
      gris: '#64748B',
      'fond-clair': '#F1F5F9',
      blanc: '#FFFFFF',
    },

    /* ---- Sémantique ---- */
    primary: {
      DEFAULT: '#2563EB', // boutons, liens, élément actif
      hover: '#1D4ED8',
      active: '#1E3A8A',
      50: '#EFF6FF', // survol de ligne, puce sélectionnée
      100: '#DBEAFE',
      200: '#BFDBFE',
    },
    accent: {
      DEFAULT: '#93C5FD', // bordure au survol
    },
    surface: {
      DEFAULT: '#FFFFFF', // cartes, tableaux, fenêtres, champs
      muted: '#F8FAFC', // en-têtes de tableau, survol
      page: '#F1F5F9', // fond de l'application
      inverse: '#0F172A', // barre latérale
      'inverse-hover': '#1E293B',
    },
    text: {
      DEFAULT: '#0F172A',
      muted: '#475569',
      inverse: '#FFFFFF',
      'inverse-muted': '#CBD5E1',
      link: '#1D4ED8',
    },
    border: {
      DEFAULT: '#E2E8F0',
      subtle: '#F1F5F9',
      strong: '#CBD5E1',
    },

    /* ---- États (pastilles .badge de la maquette) ---- */
    success: {
      DEFAULT: '#059669',
      hover: '#047857',
      50: '#D1FAE5',
      200: '#A7F3D0',
      700: '#065F46',
    },
    warning: {
      DEFAULT: '#D97706',
      hover: '#B45309',
      50: '#FEF3C7',
      200: '#FDE68A',
      700: '#92400E',
    },
    danger: {
      DEFAULT: '#DC2626',
      hover: '#B91C1C',
      50: '#FEE2E2',
      200: '#FECACA',
      700: '#991B1B',
    },
    info: {
      DEFAULT: '#2563EB',
      50: '#E0E7FF',
      200: '#C7D2FE',
      700: '#3730A3',
    },
    neutral: {
      50: '#F1F5F9',
      200: '#E2E8F0',
      700: '#475569',
    },

    /* ---- Graphiques ---- */
    chart: {
      1: '#2563EB',
      2: '#60A5FA',
      3: '#64748B', // stock / autres
      4: '#94A3B8',
      grid: '#F1F5F9',
    },

    /* ---- Focus clavier ---- */
    focus: {
      DEFAULT: '#2563EB',
      inverse: '#FFFFFF',
    },
  },

  fontFamily: {
    sans: ['"IBM Plex Sans"', 'system-ui', '-apple-system', '"Segoe UI"', 'Arial', 'sans-serif'],
    mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
    arabic: ['"IBM Plex Sans Arabic"', '"Segoe UI"', 'Tahoma', '"Geeza Pro"', '"Noto Sans Arabic"', 'Arial', 'sans-serif'],
  },

  fontSize: {
    h1: ['1.625rem', { lineHeight: '1.2', fontWeight: '700' }], // 26
    h2: ['1.375rem', { lineHeight: '1.25', fontWeight: '600' }], // 22
    h3: ['1.125rem', { lineHeight: '1.3', fontWeight: '600' }], // 18
    h4: ['1.0625rem', { lineHeight: '1.35', fontWeight: '600' }], // 17 – titre de fenêtre
    lead: ['1rem', { lineHeight: '1.5' }],
    body: ['0.875rem', { lineHeight: '1.5' }], // 14
    small: ['0.8125rem', { lineHeight: '1.45' }], // 13 – tableaux, boutons
    mention: ['0.75rem', { lineHeight: '1.45' }], // 12
    label: ['0.8125rem', { lineHeight: '1.4', fontWeight: '500' }], // 13
    button: ['0.8125rem', { lineHeight: '1.25', fontWeight: '600' }], // 13 SemiBold (.btn)
    'button-sm': ['0.8125rem', { lineHeight: '1.25', fontWeight: '500' }], // 13 Medium (.hbtn)
    overline: ['0.6875rem', { lineHeight: '1.4', letterSpacing: '0.06em', fontWeight: '600' }], // 11 CAPITALES (.lbl)
    kpi: ['1.875rem', { lineHeight: '1.05', fontWeight: '600' }], // 30 – chiffre des cartes (IBM Plex Mono, voir index.css)
    title: ['1.625rem', { lineHeight: '1.2', fontWeight: '700' }], // 26 – titre de page
    section: ['1rem', { lineHeight: '1.4', fontWeight: '600' }], // 16 – titre de bloc
  },

  borderRadius: {
    tag: '9999px', // pastilles d'état
    control: '8px', // boutons, champs, listes
    card: '12px', // cartes, panneaux, tableaux
    modal: '14px', // fenêtres
    pill: '9999px',
  },

  boxShadow: {
    card: 'none',
    raised: '0 12px 32px rgba(15, 23, 42, 0.14)', // cloche, menus
    overlay: '0 20px 50px rgba(15, 23, 42, 0.25)', // fenêtres
    // bord gauche 3 px (cartes « À traiter » de la maquette)
    'rail-success': 'inset 3px 0 0 0 #059669',
    'rail-warning': 'inset 3px 0 0 0 #D97706',
    'rail-danger': 'inset 3px 0 0 0 #DC2626',
    'rail-info': 'inset 3px 0 0 0 #2563EB',
    'toast-success': 'inset 3px 0 0 0 #059669, 0 12px 32px rgba(15, 23, 42, 0.14)',
    'toast-warning': 'inset 3px 0 0 0 #D97706, 0 12px 32px rgba(15, 23, 42, 0.14)',
    'toast-danger': 'inset 3px 0 0 0 #DC2626, 0 12px 32px rgba(15, 23, 42, 0.14)',
    'toast-info': 'inset 3px 0 0 0 #2563EB, 0 12px 32px rgba(15, 23, 42, 0.14)',
  },

  spacing: {
    control: '34px',
    'control-sm': '28px',
    'control-touch': '44px',
    row: '40px',
    'row-compact': '34px',
    'row-head': '34px',
    topbar: '48px',
    'topbar-mobile': '56px',
    sidebar: '232px', // barre latérale de la maquette
    rail: '56px',
  },

  maxWidth: {
    content: '1680px',
  },

  zIndex: {
    topbar: '30',
    dropdown: '40',
    overlay: '50',
    toast: '60',
  },

  transitionDuration: {
    fast: '120ms',
    base: '160ms',
    slow: '240ms',
  },

  transitionTimingFunction: {
    standard: 'cubic-bezier(0.2, 0, 0, 1)',
  },

  ringWidth: {
    3: '3px',
  },
};

export default tunavTheme;
