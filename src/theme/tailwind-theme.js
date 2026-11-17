/**
 * FleetIQ Back-office – thème Tailwind 3.4 (theme.extend).
 * Design system TUNAV (Brand Book) : Bleu Royal #0848FE, Fond clair #F2F6FF, Anthracite, Bleu Ciel.
 */

const tunavTheme = {
  colors: {
    /* ---- Couleurs brutes (charte TUNAV) ---- */
    tunav: {
      'bleu-royal': '#0848FE',
      'bleu-ciel': '#0099FF',
      anthracite: '#3F3F3F',
      'gris-texte': '#6E6E6E',
      gris: '#777777',
      'fond-clair': '#F2F6FF',
      blanc: '#FFFFFF',
    },

    /* ---- Sémantique ---- */
    primary: {
      DEFAULT: '#0848FE', // Bleu Royal – action, sélection, focus
      hover: '#0639CB',
      active: '#052AA3',
      50: '#F2F6FF', // Fond clair
      100: '#E0E9FF',
      200: '#C2D4FF',
    },
    accent: {
      DEFAULT: '#0099FF', // Bleu Ciel – filet actif / accent UI
    },
    surface: {
      DEFAULT: '#FFFFFF',
      muted: '#F2F6FF',
      page: '#F2F6FF',
      inverse: '#3F3F3F', // Anthracite
      'inverse-hover': '#2E2E2E',
    },
    text: {
      DEFAULT: '#3F3F3F',
      muted: '#6E6E6E',
      inverse: '#FFFFFF',
      'inverse-muted': '#D4D4D4',
      link: '#0848FE',
    },
    border: {
      DEFAULT: '#E2E8F0',
      subtle: '#F2F6FF',
      strong: '#CBD5E1',
    },

    /* ---- États (pastilles .badge de la maquette) ---- */
    success: {
      DEFAULT: '#1B7F3B',
      hover: '#145C2B',
      50: '#E8F5EC',
      200: '#A7D4B5',
      700: '#0F4A22',
    },
    warning: {
      DEFAULT: '#B45309',
      hover: '#92400E',
      50: '#FEF3C7',
      200: '#FDE68A',
      700: '#78350F',
    },
    danger: {
      DEFAULT: '#C62828',
      hover: '#9B1C1C',
      50: '#FDECEC',
      200: '#F5B5B5',
      700: '#7F1D1D',
    },
    info: {
      DEFAULT: '#0848FE',
      50: '#F2F6FF',
      200: '#C2D4FF',
      700: '#052AA3',
    },
    neutral: {
      50: '#F2F6FF',
      200: '#E2E8F0',
      700: '#6E6E6E',
    },

    /* ---- Graphiques ---- */
    chart: {
      1: '#0848FE',
      2: '#0099FF',
      3: '#777777',
      4: '#6E6E6E',
      grid: '#F2F6FF',
    },

    /* ---- Focus clavier ---- */
    focus: {
      DEFAULT: '#0848FE',
      inverse: '#FFFFFF',
    },
  },

  fontFamily: {
    sans: ['Poppins', 'system-ui', '-apple-system', '"Segoe UI"', 'Arial', 'sans-serif'],
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
    kpi: ['1.875rem', { lineHeight: '1.05', fontWeight: '600' }], // 30 – chiffre des cartes (mono, voir index.css)
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
    card: '0 1px 2px rgba(15, 23, 42, 0.06)',
    raised: '0 12px 32px rgba(15, 23, 42, 0.14)', // cloche, menus
    overlay: '0 20px 50px rgba(15, 23, 42, 0.25)', // fenêtres
    // bord gauche 3 px (cartes « À traiter » de la maquette)
    'rail-success': 'inset 3px 0 0 0 #1B7F3B',
    'rail-warning': 'inset 3px 0 0 0 #B45309',
    'rail-danger': 'inset 3px 0 0 0 #C62828',
    'rail-info': 'inset 3px 0 0 0 #0848FE',
    'toast-success': 'inset 3px 0 0 0 #1B7F3B, 0 12px 32px rgba(63, 63, 63, 0.14)',
    'toast-warning': 'inset 3px 0 0 0 #B45309, 0 12px 32px rgba(63, 63, 63, 0.14)',
    'toast-danger': 'inset 3px 0 0 0 #C62828, 0 12px 32px rgba(63, 63, 63, 0.14)',
    'toast-info': 'inset 3px 0 0 0 #0848FE, 0 12px 32px rgba(63, 63, 63, 0.14)',
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
    sidebar: '240px', // w-60 – chrome sombre type FleetAdmin
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
