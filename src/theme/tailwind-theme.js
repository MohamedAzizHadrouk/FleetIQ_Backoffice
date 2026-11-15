/**
 * TUNAV – FleetIQ Back-office – thème Tailwind 3.4 (theme.extend) – « Industrial Tech »
 * Appliqué T-002 (2026-11-15) depuis assets/redesign/tailwind-theme.proposed.js (R1 validé).
 * Écarts : assets/redesign/tokens-update.md · règles : assets/redesign/design-language.md.
 *
 * Légende des commentaires :
 *   [Marque]    valeur du BRAND.md / Brand Book validé le 2026-11-11 – INCHANGÉE
 *   [Dérivé]    teinte ou ombre calculée à partir d'une couleur de marque (formule indiquée)
 *   [R1]        jeton nouveau ou modifié par R1 – « à ajouter au Brand Book » (interface produit)
 *
 * Couleurs et polices de la marque : aucune valeur modifiée. Le « Ciel logo » du symbole reste absent de ce thème.
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
    neutral: {
      // [R1] famille d'état « Neutre » (En stock, Planifiée, bientôt) – mêmes valeurs que border.subtle / border / text,
      // nommées comme les autres familles pour écrire bg-{famille}-50 text-{famille}-700 border-{famille}-200.
      // Attention : ces 3 clés remplacent celles de la palette « neutral » par défaut de Tailwind (non utilisée dans l'application).
      50: '#EFEFEF', // [Dérivé] Gris 12 % sur blanc (= border.subtle)
      200: '#DDDDDD', // [Dérivé] Gris 25 % sur blanc (= border.DEFAULT)
      700: '#3F3F3F', // [Marque] Anthracite – 9,16:1 sur neutral.50
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
    kpi: ['1.75rem', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '700' }], // [R1] 28 Bold (était 36) – valeur des cartes KPI, 5 cartes par rangée sans retour à la ligne
    title: ['1.25rem', { lineHeight: '1.4', letterSpacing: '0', fontWeight: '600' }], // [R1] 20 SemiBold – titre de page dans la barre du haut
    section: ['1rem', { lineHeight: '1.5', letterSpacing: '0', fontWeight: '600' }], // [R1] 16 SemiBold – titre de panneau
  },

  borderRadius: {
    tag: '2px', // [R1] nouveau – étiquette d'état, étiquette de catégorie, nom de pack
    control: '4px', // [R1] était 8px – boutons, champs, listes, groupes segmentés, entrées de menu
    card: '6px', // [R1] était 12px – panneaux, cartes KPI, tableaux, menus déroulants, notifications
    modal: '8px', // [R1] était 16px – modales, carte de connexion. Le cadre 16 px du Brand Book (images-icones.md §6) reste la règle des images du site.
    pill: '9999px', // inchangé – usage restreint : compteur de la cloche, avatar, interrupteur
  },

  boxShadow: {
    // [R1] « le filet avant l'ombre » : une ombre seulement pour ce qui flotte au-dessus de la page.
    card: 'none', // [R1] était 0 1px 2px … – les cartes n'ont plus d'ombre (jeton gardé pour la migration, à retirer ensuite)
    raised: '0 2px 8px 0 rgba(63, 63, 63, 0.14)', // [R1][Dérivé] Anthracite 14 % – menu déroulant, menu contextuel, cloche, infobulle (était 0 4px 12px -2px)
    overlay: '0 12px 32px -8px rgba(63, 63, 63, 0.28)', // [R1][Dérivé] Anthracite 28 % – modale, tiroir (était 0 16px 48px -8px)
    // [R1] filet d'état : trait intérieur de 3 px sur le bord gauche (carte, première cellule d'une ligne, bandeau)
    'rail-success': 'inset 3px 0 0 0 #1B7F3B', // [Marque – état web] Succès
    'rail-warning': 'inset 3px 0 0 0 #B45309', // [Marque – état web] Avertissement
    'rail-danger': 'inset 3px 0 0 0 #C62828', // [Marque – état web] Erreur
    'rail-info': 'inset 3px 0 0 0 #0848FE', // [Marque] Bleu Royal
    // [R1] notification flottante = filet d'état + ombre « raised »
    'toast-success': 'inset 3px 0 0 0 #1B7F3B, 0 2px 8px 0 rgba(63, 63, 63, 0.14)',
    'toast-warning': 'inset 3px 0 0 0 #B45309, 0 2px 8px 0 rgba(63, 63, 63, 0.14)',
    'toast-danger': 'inset 3px 0 0 0 #C62828, 0 2px 8px 0 rgba(63, 63, 63, 0.14)',
    'toast-info': 'inset 3px 0 0 0 #0848FE, 0 2px 8px 0 rgba(63, 63, 63, 0.14)',
  },

  /* ---- [R1] Mesures de la coque et densité (échelle 4 / 8 px) – utilisables en h-*, w-*, min-h-*, top-*, ml-* ---- */
  spacing: {
    control: '36px', // contrôle par défaut (bouton, champ, liste) – bureau
    'control-sm': '28px', // contrôle compact (dans un tableau, un pied de panneau) – ≥ 24 px (WCAG 2.5.8)
    'control-touch': '44px', // contrôle tactile (< 1024 px) – règle maison 44 px
    row: '48px', // ligne de tableau confortable (2 lignes de texte au plus)
    'row-compact': '36px', // ligne de tableau compacte (1 ligne)
    'row-head': '36px', // en-tête de tableau
    topbar: '48px', // barre du haut (bureau)
    'topbar-mobile': '56px', // barre du haut (< 768 px)
    sidebar: '240px', // barre latérale (inchangée)
    rail: '56px', // barre latérale réduite, 768–1023 px
  },

  maxWidth: {
    content: '1680px', // [R1] largeur maximale de la grille de contenu (12 colonnes, gouttière 16 px)
  },

  zIndex: {
    // [R1] un seul ordre d'empilement pour toute l'application
    topbar: '30',
    dropdown: '40',
    overlay: '50',
    toast: '60',
  },

  transitionDuration: {
    fast: '120ms', // [R1] survol, pression, focus
    base: '160ms', // [R1] menu, infobulle, modale (opacité)
    slow: '240ms', // [R1] tiroir mobile, notification
  },

  transitionTimingFunction: {
    standard: 'cubic-bezier(0.2, 0, 0, 1)', // [R1] courbe unique
  },

  ringWidth: {
    3: '3px', // [Marque] contour de focus 3 px (palette.md §2.3)
  },
};

export default tunavTheme;
