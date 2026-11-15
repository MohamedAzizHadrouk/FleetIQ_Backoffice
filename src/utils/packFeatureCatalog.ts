/**
 * Catalogue des fonctionnalités assignables à un pack (arbre module → groupe → fonctionnalité).
 * Déplacé de pages/SubscriptionsPage.tsx (carte FleetIQ 08) pour servir aussi aux KPI de la page Packs (PK-P-04).
 * Chaque « feuille » est une fonctionnalité cochable dans « Créer / Modifier un pack ».
 * À confirmer back-end : tables Feature (module / groupe / nom) et PackFeature (doc Packs, point à confirmer n° 1).
 */
export type FeatureNode = {
  id: string;
  label: string;
  children?: FeatureNode[];
};

// Fonctionnalités (catalogue) – structuré par grands modules.
// Note: chaque "feuille" représente une fonctionnalité assignable à un pack.
export const FEATURE_CATALOG: FeatureNode[] = [
  {
    id: 'module:suivie',
    label: 'Suivie',
    children: [
      {
        id: 'suivie:flotte',
        label: 'Suivi > Flotte',
        children: [
          { id: 'suivie:flotte:tri_dynamique', label: 'Tri dynamique des véhicules' },
          { id: 'suivie:flotte:visualisation_cartographique', label: 'Visualisation cartographique et centrage' },
          { id: 'suivie:flotte:indicateurs_maintenance', label: 'Indicateurs de maintenance' }
        ]
      },
      {
        id: 'suivie:citerne',
        label: 'Suivi > Citerne',
        children: [{ id: 'suivie:citerne:visualisation_donnees', label: 'Visualisation des données citerne' }]
      },
      {
        id: 'suivie:ui_temps_reel',
        label: 'Suivi > UI Temps réel',
        children: [{ id: 'suivie:ui_temps_reel:fenetre', label: 'Fenêtre de suivi en temps réel' }]
      },
      {
        id: 'trajet',
        label: 'Trajet',
        children: [
          {
            id: 'trajet:trajectoire',
            label: 'Trajet > Trajectoire',
            children: [{ id: 'trajet:trajectoire:trace_itineraire', label: "Tracé d'itinéraire directionnel" }]
          },
          {
            id: 'trajet:stop_circulation',
            label: 'Trajet > Stop circulation',
            children: [{ id: 'trajet:stop_circulation:bascule', label: 'Bascule Arrêt/Circulation' }]
          }
        ]
      },
      {
        id: 'cmd_distance',
        label: 'Gestion des Cmd à distance',
        children: [
          {
            id: 'cmd_distance:suivi',
            label: 'Suivi des cmd envoyés',
            children: [{ id: 'cmd_distance:suivi:etat', label: "Suivi d'état des cmd" }]
          }
        ]
      },
      {
        id: 'menu_click_droit',
        label: 'Menu click droit',
        children: [
          { id: 'menu_click_droit:shortcuts', label: 'Shortcuts click droit' },
          { id: 'menu_click_droit:menu', label: 'Menu click droit' }
        ]
      }
    ]
  },
  {
    id: 'module:parc',
    label: 'Parc',
    children: [
      {
        id: 'parc:chauffeurs',
        label: 'Exploitation du parc > Gestion des Chauffeurs',
        children: [
          { id: 'parc:chauffeurs:create', label: 'Créer un chauffeur' },
          { id: 'parc:chauffeurs:read_update', label: 'Consulter et modifier un chauffeur' },
          { id: 'parc:chauffeurs:delete', label: 'Supprimer un chauffeur' },
          { id: 'parc:chauffeurs:count', label: 'Afficher le nombre total des chauffeurs' },
          { id: 'parc:chauffeurs:export', label: 'Exporter la liste des chauffeurs' }
        ]
      },
      {
        id: 'parc:clients',
        label: 'Exploitation du parc > Gestion des Clients',
        children: [
          { id: 'parc:clients:create', label: 'Créer un client' },
          { id: 'parc:clients:read_update', label: 'Consulter et modifier un client' },
          { id: 'parc:clients:delete', label: 'Supprimer un client' },
          { id: 'parc:clients:count', label: 'Afficher le nombre total des clients' },
          { id: 'parc:clients:export', label: 'Exporter la liste des clients' }
        ]
      },
      {
        id: 'parc:vehicules',
        label: 'Gestion des Véhicules',
        children: [
          { id: 'parc:vehicules:create', label: 'Créer un véhicule' },
          { id: 'parc:vehicules:read_update', label: 'Consulter et modifier un véhicule' },
          { id: 'parc:vehicules:delete', label: 'Supprimer un véhicule' },
          { id: 'parc:vehicules:count', label: 'Afficher le nombre total des véhicules' },
          { id: 'parc:vehicules:export', label: 'Exporter la liste des véhicules' }
        ]
      }
    ]
  },
  {
    id: 'module:alerte',
    label: 'Alerte',
    children: [
      {
        id: 'alerte:securite_actifs',
        label: 'Sécurité & Protection des Actifs',
        children: [
          { id: 'alerte:securite_actifs:remorquage', label: 'Remoquage' },
          { id: 'alerte:securite_actifs:batterie_gps', label: 'Batterie gps faible/débranché' },
          { id: 'alerte:securite_actifs:alarme_actif', label: "Systéme d'alarme actif" },
          { id: 'alerte:securite_actifs:porte_arriere', label: 'Etat porte arriére (camion)' },
          { id: 'alerte:securite_actifs:gnss_lost', label: 'GNSS signal Lost' }
        ]
      },
      {
        id: 'alerte:conducteur_urgences',
        label: 'Sécurité du Conducteur & Urgences',
        children: [
          { id: 'alerte:conducteur_urgences:sos', label: 'SOS' },
          { id: 'alerte:conducteur_urgences:collision', label: 'Collision' },
          { id: 'alerte:conducteur_urgences:qualite_conduite', label: 'Qualité de conduite' },
          { id: 'alerte:conducteur_urgences:vitesse', label: 'Dépassement de vitesse' }
        ]
      },
      {
        id: 'alerte:etat_mecanique',
        label: 'État Mécanique & Maintenance',
        children: [
          { id: 'alerte:etat_mecanique:dtc', label: 'DTC (Diagnostic Trouble Codes)' },
          { id: 'alerte:etat_mecanique:batterie_vehicule', label: 'Batterie véhicule faible' },
          { id: 'alerte:etat_mecanique:pression_pneus', label: 'Pression des pneus faible' },
          { id: 'alerte:etat_mecanique:carburant_faible', label: 'Niveau de carburant faible' }
        ]
      },
      {
        id: 'alerte:geofencing',
        label: 'Geofencing',
        children: [
          { id: 'alerte:geofencing:entree_sortie_zone', label: 'Entrée/Sortie de Zone' },
          { id: 'alerte:geofencing:deviation_itineraire', label: "Déviation d'Itinéraire" },
          { id: 'alerte:geofencing:arrivee_site', label: 'Arrivée sur Site Client' },
          { id: 'alerte:geofencing:proximite', label: 'Alerte de Proximité' }
        ]
      },
      {
        id: 'alerte:parametrage',
        label: 'Paramétrage des Alertes',
        children: [
          { id: 'alerte:parametrage:seuils', label: 'Définition des Seuils' },
          { id: 'alerte:parametrage:ciblage', label: 'Ciblage et Assignation' },
          { id: 'alerte:parametrage:destinataires', label: 'Gestion des Destinataires et des Canaux' }
        ]
      }
    ]
  },
  {
    id: 'module:rapport',
    label: 'Rapport',
    children: [
      {
        id: 'rapport:suivi_vehicules',
        label: 'Rapports de Suivi des Véhicules',
        children: [
          {
            id: 'rapport:suivi_vehicules:detaille',
            label: 'Rapport Détaillé',
            children: [
              { id: 'rapport:suivi_vehicules:detaille:consult', label: 'Consultation du rapport détaillé' },
              { id: 'rapport:suivi_vehicules:detaille:filtrage', label: 'Filtrage avancé du rapport' },
              { id: 'rapport:suivi_vehicules:detaille:export', label: 'Export du rapport détaillé' }
            ]
          },
          {
            id: 'rapport:suivi_vehicules:trajets',
            label: 'Rapport des Trajets',
            children: [
              { id: 'rapport:suivi_vehicules:trajets:liste', label: 'Liste des trajets effectués' },
              { id: 'rapport:suivi_vehicules:trajets:detail', label: "Détail d'un trajet" },
              { id: 'rapport:suivi_vehicules:trajets:mensuel', label: 'Rapport mensuel des trajets' },
              { id: 'rapport:suivi_vehicules:trajets:export', label: 'Export des trajets' }
            ]
          },
          {
            id: 'rapport:suivi_vehicules:vitesse',
            label: 'Rapport de Vitesse',
            children: [
              { id: 'rapport:suivi_vehicules:vitesse:visualisation', label: 'Visualisation des données de vitesse' },
              { id: 'rapport:suivi_vehicules:vitesse:exces', label: 'Rapport des excès de vitesse' },
              { id: 'rapport:suivi_vehicules:vitesse:classement', label: 'Classement des infractions de vitesse' },
              { id: 'rapport:suivi_vehicules:vitesse:alerte', label: "Alerte et notification d'excès" }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'module:dashboard',
    label: 'Dashboard',
    children: [
      {
        id: 'dashboard:etat_parc',
        label: 'Etat de parc (Opérationnel)',
        children: [
          { id: 'dashboard:etat_parc:statut_flotte', label: 'Statut de la Flotte' },
          { id: 'dashboard:etat_parc:filtres', label: 'Filtres Rapides' },
          { id: 'dashboard:etat_parc:flux_alertes', label: "Flux d'Alertes en Direct" }
        ]
      },
      {
        id: 'dashboard:eco_conduite',
        label: 'Éco-Conduite (Comportement)',
        children: [
          { id: 'dashboard:eco_conduite:score', label: 'Score de Conduite' },
          { id: 'dashboard:eco_conduite:classement', label: 'Classement (Leaderboard)' },
          { id: 'dashboard:eco_conduite:ralenti', label: 'Analyse du Ralenti' }
        ]
      },
      {
        id: 'dashboard:executif',
        label: 'Exécutif (Résumé)',
        children: [
          { id: 'dashboard:executif:kpis', label: 'Kpis de Performance' },
          { id: 'dashboard:executif:tendance', label: 'Tendance Hebdomadaire/Mensuelle' }
        ]
      }
    ]
  },
  {
    id: 'module:administration',
    label: 'Administration',
    children: [
      {
        id: 'admin:comptes',
        label: 'Gestion des comptes',
        children: [
          { id: 'admin:comptes:list', label: 'Lister et rechercher les comptes' },
          { id: 'admin:comptes:create', label: 'Créer un compte utilisateur' },
          { id: 'admin:comptes:update', label: 'Modifier un compte (droits + périmètre)' },
          { id: 'admin:comptes:reset_delete', label: 'Réinitialiser le mot de passe / Supprimer un compte' }
        ]
      },
      {
        id: 'admin:departements',
        label: 'Gestion des départements & affectations',
        children: [
          { id: 'admin:departements:tree', label: "Visualiser l’arborescence des départements" },
          { id: 'admin:departements:search', label: "Rechercher un département dans l’arbre" },
          { id: 'admin:departements:upsert', label: 'Ajouter / modifier un département' },
          { id: 'admin:departements:delete', label: 'Supprimer un département avec option de transfert' }
        ]
      }
    ]
  }
];

export function flattenLeafIds(nodes: FeatureNode[]): string[] {
  const ids: string[] = [];
  const walk = (n: FeatureNode) => {
    if (!n.children || n.children.length === 0) {
      ids.push(n.id);
      return;
    }
    n.children.forEach(walk);
  };
  nodes.forEach(walk);
  return ids;
}

export function countSelectedLeaves(node: FeatureNode, selected: Set<string>): { selected: number; total: number } {
  if (!node.children || node.children.length === 0) {
    return { selected: selected.has(node.id) ? 1 : 0, total: 1 };
  }
  return node.children.reduce(
    (acc, child) => {
      const r = countSelectedLeaves(child, selected);
      return { selected: acc.selected + r.selected, total: acc.total + r.total };
    },
    { selected: 0, total: 0 }
  );
}

export function toggleAllLeaves(node: FeatureNode, selected: Set<string>, shouldSelect: boolean): Set<string> {
  const next = new Set(selected);
  const walk = (n: FeatureNode) => {
    if (!n.children || n.children.length === 0) {
      if (shouldSelect) next.add(n.id);
      else next.delete(n.id);
      return;
    }
    n.children.forEach(walk);
  };
  walk(node);
  return next;
}

/** Une fonctionnalité (feuille) avec son module et son chemin dans l'arbre */
export type FeatureLeaf = { id: string; label: string; moduleId: string; module: string; path: string[] };

/** Toutes les feuilles du catalogue, dans l'ordre de l'arbre */
export function featureLeaves(nodes: FeatureNode[] = FEATURE_CATALOG): FeatureLeaf[] {
  const out: FeatureLeaf[] = [];
  for (const mod of nodes) {
    const walk = (n: FeatureNode, path: string[]) => {
      if (!n.children || n.children.length === 0) {
        out.push({ id: n.id, label: n.label, moduleId: mod.id, module: mod.label, path });
        return;
      }
      n.children.forEach((c) => walk(c, [...path, n.label]));
    };
    walk(mod, []);
  }
  return out;
}
