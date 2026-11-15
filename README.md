# FleetIQ Back-office (TUNAV)

Back-office mock of FleetIQ – React 18 + TypeScript + Vite 5 + Tailwind 3.4, mock data only (`src/state/FleetStore.tsx`).
Initially generated with Magic Patterns (Vite template).

## Getting started

1. `npm install`
2. `npm run dev` – development server
3. `npm run build` – production build (`dist/`)
4. `npm run lint` – ESLint

No environment variable is needed (no back-end yet).

## Design system (TUNAV)

- Tailwind theme: `src/theme/tailwind-theme.js` (TUNAV design tokens, card FleetIQ 02), plugged in `tailwind.config.js`
  through `theme.extend`. Use the semantic names (`bg-primary`, `text-text`, `text-text-muted`, `bg-surface`,
  `border-border`, `text-small`, `text-label`, `rounded-control`, `rounded-card`, `shadow-card`…), never the default
  Tailwind palettes (`slate-*`, `blue-*`…), hard-coded hex values or text below 12 px (`text-mention`).
- Base styles and fonts (Poppins, IBM Plex Sans Arabic): `src/index.css`.
- Keyboard focus: `focus-visible:ring-3 focus-visible:ring-focus` (Bleu Royal); on dark backgrounds `ring-focus-inverse`.
- Logos: `public/brand/` (vector masters from the TUNAV brand book; `…-ui.svg` = interface clear space 0.5 X).
  The light band colour of the logo symbol is reserved to the logo and never used in the UI.

## Roles and permissions (mock login)

All rules live in `src/utils/backofficePermissions.ts` (routes, default page, read-only flags, `canSeePrices`,
pack create/edit vs assignment vs payment). The login screen is a mock: pick a profile, type any e-mail and password.

| Role | Pages (default first) | Notes |
|---|---|---|
| Admin TUNAV (`admin_tunav`) | Tableau de bord, Clients, Packs, Puces, Équipements, Interventions SAV | everything |
| Finance (`finance_tunav`) | Tableau de bord, Clients, Packs, Puces, Équipements | clients + payment; packs: payment only; puces and équipements read-only; prices visible |
| Revendeur (`revendeur`) | Tableau de bord, Clients, Équipements | own clients / equipment only (`utils/fleetVisibility.ts`); no prices |
| Responsable SAV (`responsable_sav`) | Interventions SAV, Clients, Équipements | clients read-only; équipements whole network |
| Technicien SAV (`technicien_sav`) | Interventions SAV | – |

A forbidden URL redirects to the role's default page; the sidebar lists only the allowed pages.
Logout resets the address, so the next login opens the default page of the new profile; a URL typed before logging in
(e.g. `/clients?alerte=echeance`) is kept. In production the same rules must be enforced by the API.
Test report per role (card FleetIQ 12): `assets/dev-reports/recette-fleetiq-v3.md` in the project folder (outside this repo).

## Mock data (card FleetIQ 05)
One fictitious data set for every page, generated once at start-up with a fixed seed (`src/state/mock/generate.ts`,
seed `MOCK_SEED`; hand-written base records in `src/state/mock/handData.ts`, types in `src/state/mock/types.ts`).
4 networks (Tunav direct clients, MyCom, FleetPro Sfax, NavSud), the back-office `EquipmentType` list, dates relative to
the day the app is opened. Fields that do not exist in the back-end schema yet are commented « à confirmer back-end ».
Global « connecté » threshold: the existing back-office setting (`fleet_disconnect_threshold_hours`), 7 days by default.

## Tableau de bord v3 (card FleetIQ 05)
KPIs computed in `src/utils/dashboardKpis.ts` (IDs `TDB-D-xx` / `TDB-R-xx`), UI in `src/pages/DashboardPage.tsx` and
`src/components/dashboard/`. Hand-made SVG/HTML charts, reusable by the next cards: `src/components/charts/`
(BarChart, HorizontalBarList, DonutRing, StackedBar, Sparkline, GoalMeter, Legend). No chart library, no prices on the page.

## Gestion Clients v3 (card FleetIQ 06)
KPIs computed in `src/utils/clientsKpis.ts` (IDs `CLI-K-xx`, `CLI-A-xx`, `CLI-D-xx`, `CLI-C-xx`), UI in
`src/pages/ClientsPage.tsx` and `src/components/clients/` (ClientsOverview, ClientsActivity, ClientFiche). New charts:
`LineChart`, `ColumnChart`. Commercial blocks are hidden by `clients.canSeeCommercialBlocks` (false for Responsable SAV);
revenue and SIM consumption in the client sheet need `canSeePrices` (Admin TUNAV, Finance). Passwords are never displayed.

The page reads URL parameters once, applies them as filters, then clears the URL:
`/clients?alerte=blocage|echeance|relance|jamais&delai=15|30|60&statut=Active|Blocked&pack=<id>|none&connexion=tous|partiel|aucun&proprietaire=<name>&q=<text>&client=<id>`
(`client` opens the client sheet). The dashboard (card 05) uses them for its Gestion Clients links.

Actions (card FleetIQ 13) save into FleetStore, so Gestion Clients, Packs and the dashboard update in the same session
(mock: lost on reload):
- « Valider le paiement » (Admin, Finance – not Revendeur, decision Q2): new expiry date mandatory and after today;
  clears `blockedAt` / `blockReason`, moves the pack expiries. « Bloquer »: `blockedAt` = today + reason (paiement / expiré).
  Same rule as Packs (`src/utils/clientPayment.ts`).
- « Ajouter un client » / « Modifier » (Admin, Finance, Revendeur): validated in French (`src/utils/clientForm.ts`);
  new client `createdAt` = today, owner = the reseller for a Revendeur (Tunav otherwise), no pack; a rename follows the
  client's equipments, SIMs and interventions. The password fields are checked but never stored.

## Équipements v3 (card FleetIQ 07)
KPIs computed in `src/utils/equipmentsKpis.ts` (IDs `EQ-E-xx`, `EQ-A-xx`, `EQ-G-xx`, `EQ-C-xx`, `EQ-T-11`, `EQ-F-11`) from
the table rows (`buildRows`), UI in `src/pages/EquipmentsPage.tsx`, `src/components/EquipmentsUnifiedTable.tsx` (list T-11)
and `src/components/equipments/` (EquipmentsOverview, EquipmentsRepartition, EquipmentsAlerts, EquipmentFicheSummary, EqUi).
States: stock, or sold = installed (connected ≤ global threshold, 7 days by default / not connected) or not installed.
The « En direct » alert (A-23) is simulated on page load (mock only). No prices on the page.
Rights: Admin everything; Responsable SAV whole network + existing actions; Finance read-only (« Voir détail » only);
Revendeur own clients only (no Tunav stock, no Revendeur filter); Technicien SAV no access.

URL parameters (read once, then cleared): `/equipments?etat=tous|installe|non_installe|connecte|non_connecte|stock`
`&alerte=direct|non_connecte_30|attente_30&revendeur=<name>&proprietaire=<client>&pack=<id>|none&type=<type>&q=<text>&imei=<serial>`
(`imei` opens the equipment sheet). The dashboard links (cards, parts, rings, bell) use them.

## Packs v3 (card FleetIQ 08)
KPIs computed in `src/utils/packsKpis.ts` (IDs `PK-P-01…P-06`, `PK-A-10…A-13`), UI in `src/pages/SubscriptionsPage.tsx` and
`src/components/packs/` (PacksOverview, PacksCharts, packsAlerts). Feature tree moved to `src/utils/packFeatureCatalog.ts`.
Toolbar: 7 j · 30 j · 3 mois · Personnalisé (max 1 year), « Au » = today, optional « Comparer » (previous period / same period
last year / custom). Alerts (A-10 ≤ 10 j, A-11 11–60 j, A-12 equipment type not covered by the client's packs, A-13 blocked or
expired) use the Gestion Clients « active » rule and are computed at today's date. Connected = global threshold (7 days).
No prices on the page. The « Couleur » field of the pack form was removed (the `color` data stays in the mock).
Rights: Admin everything (Nouveau pack, Modifier le pack, Modifier les packs d'un client, Paiement); Finance payment only;
Revendeur, Responsable SAV, Technicien SAV: no access (redirected).

URL parameters (read once, then cleared): `/subscriptions?alerte=critique|anticiper|hors_pack|bloques&pack=<id>|none&q=<text>&periode=7j|30j|3m`.
Dashboard links: bell « Abonnements qui expirent dans 10 j » → `?alerte=critique`; D-10 pack detail → `?pack=<id>`; D-05 → `?periode=30j`.

## Gestion des puces v3 (card FleetIQ 09)
KPIs computed in `src/utils/simsKpis.ts` (IDs `PU-P-01…P-07`, `PU-T-21`, `PU-F-21`, `PU-C-21`, `PU-C-22`, `PU-C-25`,
`PU-S-21…S-23`, `PU-A-21`), UI in `src/pages/SimsPage.tsx` and `src/components/sims/` (SimsOverview, SimsConsumption,
SimsStats, SimsAlerts, SimFiche, simsDetails, SimUi, useSimPager). Page order follows Documentation-Puces-v3.
Toolbar: Réseau (all / Tunav direct clients / each reseller) then period 7 derniers jours · 30 jours · Mois (default = last full
month, same month as dashboard D-11) · Année (Jan → current month). Consumption is monthly mock data: 7 d / 30 d are estimated.
Installed SIM = SIM in an installed equipment (same rule as dashboard D-04 / D-08). Parameters (to confirm): @MinMo 100 Mo,
@RemindPct 80 %, @MuteDays 7 d. Only page with SIM prices (fixed price per SIM per month); no resale prices or margins.
Rights: Admin everything (Offres puce, Ajouter, Modifier, Affecter, Retour au stock, Supprimer, context menu, bulk selection);
Finance read-only with prices (no actions, checkboxes or context menu); Revendeur, Responsable SAV, Technicien SAV: no access.

URL parameters (read once, then cleared): `/sims?statut=installee|non_installee|non_posee|sans_equipement|stock&revendeur=<network>&alerte=toutes|haut|bas|surconso|sans_equipement&offre=<id>&client=<name>&q=<text>&periode=7j|30j|mois|annee&mois=YYYY-MM&puce=<id>&detail=surconso`.
Dashboard links: D-04 → `?statut=installee`; D-08 parts → `?statut=installee|non_installee`; bell « Puces non installées » →
`?statut=non_installee`; bell / D-08 / D-11 over-consumption → `?alerte=surconso&periode=mois&mois=<month>` (+ `&revendeur=` from a D-11 bar);
D-11 « Voir plus de détails » → opens PU-P-07.

## Interventions SAV v3 (card FleetIQ 10)
KPIs and actions in `src/utils/savKpis.ts` (IDs `SAV-S-01…S-11`, `SAV-T-01…T-07`), UI in `src/pages/SavPage.tsx` and
`src/components/sav/` (SavTeamView, SavTechnicianView, InterventionFiche, SavBell, SavUi). Mock interventions built by
`src/state/mock/interventions.ts` with their own seed (the rest of the mock data set is unchanged); `src/state/mock/rng.ts`
holds the shared deterministic random generator. Interventions are FleetStore state (`interventions`, `setInterventions`).
- **Admin TUNAV / Responsable SAV** (team view): « État au » bar, S-01…S-05 cards, S-06 reminder of the Équipements alerts
  (same rows and rules as `/equipments`: links `?etat=non_connecte`, `?alerte=direct`, `?alerte=attente_30`), S-07 load per
  technician (click = filter), S-08 « À planifier » (zone technician + tomorrow proposed, « Planifier »), « Nouvelle intervention »
  (manual, one open intervention per IMEI), S-09 list (technician / status incl. « En retard » / type filters, search, 15 per page),
  fiche with S-11 « Enregistrer le type » and (re)planning, bell S-10, Excel (CSV `;`, UTF-8) and PDF of the filtered list.
- **Technicien SAV** (only page, works at 375 px): T-01…T-04 cards, En retard, Ma tournée du jour (T-05), Prochains jours (14 d),
  À vérifier dans ma zone; fiche T-06 with on-site checks, « Démarrer », « Clôturer » (requires the send-test check unless the
  result is « Client absent » / « À revoir (pièce manquante) » → status « À revoir »); bell T-07; Excel/PDF of his interventions.
  He sees only his zone and his interventions (no other technician, reseller column or contract). Mock link: the profile is the
  fictitious « Technicien Sud » (`CONNECTED_TECHNICIAN_ID`, to confirm back-end).
- Closing an **Installation** as « Terminée » sets the equipment to installed (+ install date, vehicle plate, first send = now) in
  FleetStore, so Équipements, Tableau de bord and Gestion Clients counts update in the same session.
- Finance and Revendeur: no access (`/sav` → `/dashboard`). No prices, contract or billing data on this page.
- Layout: under 768 px the sidebar becomes a drawer opened from a top bar (all pages).
#   F l e e t I Q _ B a c k o f f i c e  
 