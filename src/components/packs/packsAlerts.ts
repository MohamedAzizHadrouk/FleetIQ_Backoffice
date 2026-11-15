/**
 * Gestion des Packs v3 – libellés et détail des alertes « À traiter » PK-A-10 … PK-A-13 (carte FleetIQ 08).
 * Partagé par les cartes À traiter, la cloche et le bandeau. Aucun prix.
 */
import type { DetailSpec } from '../dashboard/DetailModal';
import type { KpiTable } from '../../utils/dashboardKpis';
import { fmt, frDate, type PacksData, type PkAlertKey, type PkClient } from '../../utils/packsKpis';

export const ALERT_META: Record<PkAlertKey, { mockup: string; tag: string; tagCls: string; title: (d: PacksData) => string; unit: string }> = {
  critique: {
    mockup: 'A-10',
    tag: 'Critique',
    tagCls: 'bg-danger-50 text-danger-700 border-danger-200',
    title: (d) => `Expire dans ${d.critDays} j ou moins`,
    unit: 'client(s)'
  },
  anticiper: {
    mockup: 'A-11',
    tag: 'À anticiper',
    tagCls: 'bg-warning-50 text-warning-700 border-warning-200',
    title: (d) => `Expire dans ${d.critDays + 1} à ${d.renewDays} j`,
    unit: 'client(s)'
  },
  hors_pack: {
    mockup: 'A-12',
    tag: 'Cohérence',
    tagCls: 'bg-primary-50 text-primary border-primary-200',
    title: () => 'Équipement non couvert par le pack',
    unit: 'équip.'
  },
  bloques: {
    mockup: 'A-13',
    tag: 'Bloqués',
    tagCls: 'bg-danger-50 text-danger-700 border-danger-200',
    title: () => 'Clients bloqués ou expirés',
    unit: 'client(s)'
  }
};

/** Détail d'une alerte (fenêtre ouverte par la carte « À traiter » ou la cloche) */
export function alertDetail(key: PkAlertKey, d: PacksData): DetailSpec {
  const list = d.alerts[key];
  const meta = ALERT_META[key];
  const packsOf = (c: PkClient) => c.packs.map((p) => p.name).join(', ') || '—';
  const common = {
    title: meta.title(d),
    kpiId: `PK-${meta.mockup}`,
    route: 'subscriptions' as const,
    routeLabel: 'Packs',
    routeQuery: `?alerte=${key}`,
    goLabel: 'Filtrer la liste des clients'
  };
  if (key === 'hors_pack') {
    const eqs = list.flatMap((c) => c.outOfPack);
    return {
      ...common,
      big: fmt(eqs.length),
      caption: `équipement(s) chez ${fmt(list.length)} client(s)`,
      what: 'Le type de ces équipements n’est coché dans aucun des packs du client (« Types d’équipements supportés »). À corriger : changer de pack, ajouter le type au pack ou reprendre l’équipement.',
      definition: 'Équipement e du client c incohérent si son type n’est supporté par aucun des packs de c. Les clients sans pack ne sont pas concernés.',
      formula: 'e.Type ∉ ∪ Types(packs de c)',
      table: {
        headers: ['Client', 'N° de série', 'Type', 'Packs du client'],
        rows: eqs.map((e) => [e.client.name, e.eq.serial, e.type, list.find((c) => c.client.id === e.client.id)?.packs.map((p) => p.name).join(', ') ?? '—'])
      }
    };
  }
  const definitions: Record<Exclude<PkAlertKey, 'hors_pack'>, { what: string; definition: string; formula: string }> = {
    critique: {
      what: `Ces abonnements se terminent dans ${d.critDays} jours ou moins. Action : relancer le client et valider le paiement (nouvelle date d’expiration) – l’alerte disparaît alors.`,
      definition: 'Clients actifs dont la date d’expiration tombe dans les 10 prochains jours (cloche, bandeau et À traiter). Même règle « actif » que Gestion Clients.',
      formula: `Client actif ET 0 ≤ expiration − aujourd’hui ≤ ${d.critDays} j`
    },
    anticiper: {
      what: `Ces abonnements expirent dans ${d.critDays + 1} à ${d.renewDays} jours. Action : préparer le renouvellement (proposition, relance).`,
      definition: 'Clients actifs dont l’abonnement expire après la zone critique et avant 60 jours. Sert à préparer le renouvellement.',
      formula: `Client actif ET ${d.critDays} j < expiration − aujourd’hui ≤ ${d.renewDays} j`
    },
    bloques: {
      what: 'Clients bloqués (depuis l’écran Paiement ou automatiquement après la période de grâce) ou dont l’expiration est dépassée. Action : régulariser le paiement.',
      definition: 'Simple comptage : aucun historique de paiement n’est utilisé.',
      formula: 'Client bloqué OU expiration < aujourd’hui'
    }
  };
  const t = definitions[key];
  const table: KpiTable = {
    headers: ['Client', 'Propriétaire', 'Pack(s)', 'Expiration', key === 'bloques' ? 'Statut' : 'Dans'],
    rows: list.map((c) => [
      c.client.name,
      c.owner,
      packsOf(c),
      frDate(c.expiry),
      key === 'bloques' ? (c.active ? 'Actif · expiré' : 'Bloqué') : `J-${Math.max(0, c.daysToExpiry ?? 0)}`
    ])
  };
  return { ...common, big: fmt(list.length), caption: 'client(s)', ...t, table };
}
