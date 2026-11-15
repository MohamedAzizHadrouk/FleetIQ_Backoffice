/**
 * TUNAV – FleetIQ Back-office – thème Tailwind 3.4 (theme.extend)
 * Carte : FleetIQ 02 « Design tokens TUNAV pour le Backoffice » – agent UI/UX – 2026-11-14
 * Documentation complète, contrastes et règles de composants : tokens.md (même dossier).
 *
 * Légende des commentaires :
 *   [Marque]       valeur du BRAND.md / brand book validé le 2026-11-11 (palette.md, typographie.md, images-icones.md)
 *   [Dérivé]       teinte ou ombre calculée à partir d'une couleur de marque – proposition, à valider
 *   [Proposition]  valeur proposée par l'agent UI/UX – à valider
 *
 * Règle absolue : le « Ciel logo » du symbole n'existe PAS dans ce thème. Il est réservé au symbole du logo
 * (fichiers de brand-book/assets/4-logo/) et n'est jamais utilisé dans l'interface.
 *
 * Utilisation (carte 03) – tailwind.config.js :
 *   import tunavTheme from './src/theme/tailwind-theme.js'; // chemin au choix de la carte 03
 *   export default {
 *     content: ['./index.html', './src/**\/*.{js,ts,jsx,tsx}'],
 *     theme: { extend: tunavTheme },
 *   };
 */

const tunavTheme = {
  colors: {
    /* ---- Couleurs de marque brutes (à éviter dans les composants : préférer les noms sémantiques) ---- */
    tunav: {
      'bleu-royal': '#0848FE', // [Marque] primaire
      'bleu-ciel': '#0099FF', // [Marque] accent – jamais pour du petit texte (3,00:1 sur blanc)
      anthracite: '#3F3F3F', // [Marque] texte, fond sombre
      'gris-texte': '#6E6E6E', // [Marque] texte secondaire
      gris: '#777777', // [Marque] neutre graphique – jamais pour du petit texte (4,48:1)
      'fond-clair': '#F2F6FF', // [Marque] fond alterné
      blanc: '#FFFFFF', // [Marque]
    },

    /* ---- Sémantique ---- */
    primary: {
      DEFAULT: '#0848FE', // [Marque] Bleu Royal – boutons, liens, élément actif
      hover: '#063ACB', // [Dérivé] Bleu Royal × 80 % (ombré) – blanc dessus 8,48:1
      active: '#052FA5', // [Dérivé] Bleu Royal × 65 % (ombré) – blanc dessus 10,73:1
      50: '#F2F6FF', // [Marque] = Fond clair (≈ 5 % de Bleu Royal) – survol de ligne, bouton secondaire au survol
      100: '#E1E9FF', // [Dérivé] 12 % de Bleu Royal sur blanc – ligne sélectionnée, fond d'icône KPI
      200: '#C1D1FF', // [Dérivé] 25 % de Bleu Royal sur blanc – bordure d'élément sélectionné (décoratif)
    },
    accent: {
      DEFAULT: '#0099FF', // [Marque] Bleu Ciel – filets, pictos ≥ 24 px, série 2 des graphiques, grand texte ≥ 24 px
    },
    surface: {
      DEFAULT: '#FFFFFF', // [Marque] Blanc – cartes, tableaux, modales, champs
      muted: '#F2F6FF', // [Marque] Fond clair – fond de l'application, en-têtes de tableau
      inverse: '#3F3F3F', // [Marque] Anthracite – barre latérale (fond sombre)
      'inverse-hover': '#525252', // [Dérivé] Blanc 10 % sur Anthracite – survol dans la barre latérale
    },
    text: {
      DEFAULT: '#3F3F3F', // [Marque] Anthracite – texte courant, titres
      muted: '#6E6E6E', // [Marque] Gris texte – légendes, placeholders, en-têtes secondaires
      inverse: '#FFFFFF', // [Marque] Blanc – texte sur Bleu Royal / Anthracite / états
      'inverse-muted': '#D9D9D9', // [Dérivé] Blanc 80 % sur Anthracite – menu inactif (7,46:1 sur Anthracite)
      link: '#0848FE', // [Marque] Bleu Royal – liens (soulignés dans un paragraphe)
    },
    border: {
      DEFAULT: '#DDDDDD', // [Dérivé] 25 % de Gris sur blanc – séparateurs, contours de cartes (décoratif)
      subtle: '#EFEFEF', // [Dérivé] 12 % de Gris sur blanc – séparateurs de lignes, fond de pastille neutre
      strong: '#777777', // [Marque] Gris – contour des champs de formulaire (4,48:1 ≥ 3:1 requis)
    },

    /* ---- États d'interface : palette.md §2.3 (couleurs de base) + teintes dérivées ---- */
    success: {
      DEFAULT: '#1B7F3B', // [Marque – état web] Succès
      hover: '#176C32', // [Dérivé] Succès × 85 %
      50: '#EDF5EF', // [Dérivé] 8 % sur blanc – fond de pastille / bandeau
      200: '#BBD9C4', // [Dérivé] 30 % sur blanc – bordure de pastille (décoratif)
      700: '#176C32', // [Dérivé] texte sur fond 50 (5,86:1)
    },
    warning: {
      DEFAULT: '#B45309', // [Marque – état web] Avertissement
      hover: '#994708', // [Dérivé] Avertissement × 85 %
      50: '#F9F1EB', // [Dérivé] 8 % sur blanc
      200: '#E9CBB5', // [Dérivé] 30 % sur blanc
      700: '#994708', // [Dérivé] texte sur fond 50 (5,77:1) – #B45309 sur 50 = 4,498:1, échoue
    },
    danger: {
      DEFAULT: '#C62828', // [Marque – état web] Erreur
      hover: '#A82222', // [Dérivé] Erreur × 85 %
      50: '#FAEEEE', // [Dérivé] 8 % sur blanc
      200: '#EEBFBF', // [Dérivé] 30 % sur blanc
      700: '#A82222', // [Dérivé] texte sur fond 50 (6,35:1)
    },
    info: {
      DEFAULT: '#0848FE', // [Marque – état web] Info = Bleu Royal
      50: '#F2F6FF', // [Marque] Fond clair
      200: '#C1D1FF', // [Dérivé]
      700: '#0848FE', // texte sur fond 50 (5,76:1)
    },

    /* ---- Graphiques : 4 séries maximum (images-icones.md §5) ---- */
    chart: {
      1: '#0848FE', // [Marque] Bleu Royal
      2: '#0099FF', // [Marque] Bleu Ciel – toujours avec étiquette directe (2,9998:1 sur blanc)
      3: '#3F3F3F', // [Marque] Anthracite
      4: '#777777', // [Marque] Gris – sert aussi pour « Autres »
      grid: '#EFEFEF', // [Dérivé] = border.subtle – lignes de grille 1 px
    },

    /* ---- Focus clavier ---- */
    focus: {
      DEFAULT: '#0848FE', // [Proposition] Bleu Royal (6,23:1) au lieu du Bleu Ciel de palette.md (2,9998:1) – voir tokens.md §8
      inverse: '#FFFFFF', // [Marque] contour Blanc sur fond sombre / Bleu Royal (palette.md §2.3)
    },
  },

  fontFamily: {
    // [Marque] typographie.md §5.1 et §2.3
    sans: ['Poppins', '"Segoe UI"', 'system-ui', '-apple-system', '"Helvetica Neue"', 'Arial', 'sans-serif'],
    arabic: ['"IBM Plex Sans Arabic"', '"Segoe UI"', 'Tahoma', '"Geeza Pro"', '"Noto Sans Arabic"', 'Arial', 'sans-serif'],
  },

  fontSize: {
    // [Marque] typographie.md §2 (bureau / mobile, clamp 375 → 1200 px). Graisse incluse quand la marque l'impose.
    h1: ['clamp(2rem, 1.546rem + 1.94vw, 3rem)', { lineHeight: '1.15', letterSpacing: '-0.015em', fontWeight: '700' }], // 32 → 48
    h2: ['clamp(1.625rem, 1.341rem + 1.21vw, 2.25rem)', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '600' }], // 26 → 36
    h3: ['clamp(1.375rem, 1.205rem + 0.73vw, 1.75rem)', { lineHeight: '1.3', letterSpacing: '0', fontWeight: '600' }], // 22 → 28
    h4: ['clamp(1.125rem, 1.011rem + 0.48vw, 1.375rem)', { lineHeight: '1.35', letterSpacing: '0', fontWeight: '600' }], // 18 → 22
    lead: ['clamp(1.125rem, 1.068rem + 0.24vw, 1.25rem)', { lineHeight: '1.6' }], // 18 → 20
    body: ['1rem', { lineHeight: '1.6' }], // 16
    small: ['0.875rem', { lineHeight: '1.5', letterSpacing: '0.005em' }], // 14 – texte de tableau, légende
    mention: ['0.75rem', { lineHeight: '1.5', letterSpacing: '0.01em' }], // 12 – minimum absolu
    label: ['0.875rem', { lineHeight: '1.4', letterSpacing: '0.005em', fontWeight: '500' }], // 14 Medium
    button: ['1rem', { lineHeight: '1.25', letterSpacing: '0.01em', fontWeight: '500' }], // 16 Medium
    'button-sm': ['0.875rem', { lineHeight: '1.25', letterSpacing: '0.01em', fontWeight: '500' }], // [Proposition] 14 – boutons compacts de tableau
    overline: ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.08em', fontWeight: '600' }], // 12 SemiBold CAPITALES
    kpi: ['2.25rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }], // 36 Bold (= « chiffre clé » mobile, fixe dans le back-office – proposition)
  },

  borderRadius: {
    control: '8px', // [Proposition] boutons, champs, pastilles rectangulaires, éléments de menu
    card: '12px', // [Proposition] cartes KPI, panneaux, tableaux, menus déroulants
    modal: '16px', // [Marque] cadre à coins arrondis 16 px (images-icones.md §6, héros du site) – modales, carte de connexion
    pill: '9999px', // pastilles d'état arrondies
  },

  boxShadow: {
    // [Proposition] ombres teintées Anthracite, discrètes. Jamais pour « sauver » un contraste de texte.
    card: '0 1px 2px 0 rgba(63, 63, 63, 0.06), 0 1px 3px 0 rgba(63, 63, 63, 0.10)',
    raised: '0 4px 12px -2px rgba(63, 63, 63, 0.14)', // survol de carte cliquable, menus déroulants
    overlay: '0 16px 48px -8px rgba(63, 63, 63, 0.28)', // modales
  },

  ringWidth: {
    3: '3px', // [Marque] contour de focus 3 px (palette.md §2.3)
  },
};

export default tunavTheme;
