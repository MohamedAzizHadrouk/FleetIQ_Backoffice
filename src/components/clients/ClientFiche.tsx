/**
 * CLI-F-01 – Fiche « Détails du client » (œil du tableau) – carte FleetIQ 06.
 * Une seule fiche (décision 2026-11-14, analyse § 7-4) = F-01 de Clients-v3 (Synthèse · Équipements · Activité)
 * + « Connexion mensuelle 12 mois » (CD-6) et « Historique des offres » (CD-7) de ClientDetail-v3,
 * + l'onglet Informations de l'ancienne fiche BO (Général, Contact, Configuration, Compte).
 * - Revenu mensuel (CD-4) et consommation des puces (CD-5) : Admin TUNAV et Finance seulement (canSeePrices).
 * - Score de santé (CD-2) : barème proposé, à valider – affiché comme tel.
 * - Sécurité : le mot de passe du compte client n'est jamais affiché (« •••• », sans bouton « afficher »).
 */
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  CircleCheck,
  CirclePlus,
  Clock,
  Globe,
  Hash,
  Key,
  Mail,
  MapPin,
  Phone,
  Shield,
  TriangleAlert,
  Users,
  Wifi,
  WifiOff
} from 'lucide-react';
import { Modal } from '../Modal';
import { BarChart } from '../charts';
import type { ClientProfile, OfferChange, Pack, SimCard, SimConsumption, UserConnection } from '../../state/FleetStore';
import { daysBetween, formatMonthFr, toIsoMonth } from '../../state/mock/dates';
import { fmt, frDate, frIso, healthScore, monthlyConnections12, pct, type ClientInfo, type Priority } from '../../utils/clientsKpis';

export type FicheTab = 'synthese' | 'equipements' | 'activite' | 'informations';
const TABS: Array<{ key: FicheTab; label: string }> = [
  { key: 'synthese', label: 'Synthèse' },
  { key: 'equipements', label: 'Équipements' },
  { key: 'activite', label: 'Activité' },
  { key: 'informations', label: 'Informations' }
];

const PRIORITY_CLS: Record<Priority, string> = {
  Critique: 'bg-danger-50 text-danger-700 border-danger-200',
  'À risque': 'bg-warning-50 text-warning-700 border-warning-200',
  'À surveiller': 'bg-primary-50 text-primary border-primary-200',
  OK: 'bg-success-50 text-success-700 border-success-200'
};

type Props = {
  info: ClientInfo | null;
  profile?: ClientProfile;
  packs: Pack[];
  offerChanges: OfferChange[];
  userConnections: UserConnection[];
  simCards: SimCard[];
  simConsumption: SimConsumption[];
  canSeePrices: boolean;
  asOf: Date;
  now: Date;
  delayDays: number;
  connHours: number;
  initialTab?: FicheTab;
  onClose: () => void;
};

function Tile({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'danger' | 'warning' | 'success' }) {
  const color = tone === 'danger' ? 'text-danger-700' : tone === 'warning' ? 'text-warning-700' : tone === 'success' ? 'text-success-700' : 'text-text';
  return (
    <div className="rounded-control border border-border-subtle bg-surface p-3">
      <div className="text-overline uppercase text-text-muted">{label}</div>
      <div className={`mt-1 text-h4 tabular-nums ${color}`}>{value}</div>
      {sub && <div className="text-mention text-text-muted">{sub}</div>}
    </div>
  );
}

function Field({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <div>
      <div className="text-text-muted text-mention mb-1 flex items-center gap-1.5">
        <Icon size={12} aria-hidden="true" /> {label}
      </div>
      <div className="font-medium text-text break-words">{value || '-'}</div>
    </div>
  );
}

export function ClientFiche({
  info,
  profile,
  packs,
  offerChanges,
  userConnections,
  simCards,
  simConsumption,
  canSeePrices,
  asOf,
  now,
  delayDays,
  connHours,
  initialTab = 'synthese',
  onClose
}: Props) {
  const [tab, setTab] = useState<FicheTab>(initialTab);
  useEffect(() => setTab(initialTab), [info?.client.id, initialTab]);
  const c = info?.client;
  const packName = useMemo(() => new Map(packs.map((p) => [p.id, p.name])), [packs]);

  const conn12 = useMemo(() => (c ? monthlyConnections12(userConnections, c.id, asOf) : []), [c, userConnections, asOf]);
  const history = useMemo(
    () => (c ? offerChanges.filter((o) => o.clientId === c.id).sort((a, b) => b.date.localeCompare(a.date)) : []),
    [c, offerChanges]
  );
  // CD-5 – consommation data des puces du client (6 mois) – Admin / Finance seulement
  const simMonthly = useMemo(() => {
    if (!c || !canSeePrices) return [];
    const ids = new Set(simCards.filter((s) => s.client === c.name).map((s) => s.id));
    const months: string[] = [];
    for (let k = 6; k >= 1; k--) months.push(toIsoMonth(new Date(asOf.getFullYear(), asOf.getMonth() - k, 1)));
    return months.map((m) => ({
      label: formatMonthFr(m).split(' ')[0],
      value: Math.round(simConsumption.filter((x) => ids.has(x.simId) && x.month === m).reduce((s, x) => s + x.usedMB, 0))
    }));
  }, [c, canSeePrices, simCards, simConsumption, asOf]);

  if (!info || !c) return null;

  const score = healthScore(info, asOf, delayDays);
  const yearStart = `${asOf.getFullYear()}-01`;
  const monthsActive = conn12.filter((m) => m.month >= yearStart && m.value > 0).length;
  const loginsYear = conn12.filter((m) => m.month >= yearStart).reduce((s, m) => s + m.value, 0);
  const connDays = Math.round(connHours / 24);
  const expiryTxt =
    info.daysToExpiry == null
      ? '—'
      : info.daysToExpiry >= 0
        ? `J-${info.daysToExpiry}`
        : `${info.daysToExpiry} j`;
  const expirySub = !info.active
    ? `Bloqué · échéance ${frIso(c.expiry)}`
    : info.blockedInDays != null
      ? `Expiré le ${frIso(c.expiry)} · bloqué dans ${info.blockedInDays} j`
      : `Échéance ${frIso(c.expiry)}`;
  const limit = c.vehicleLimit;
  const accountLimit = profile?.accountLimit ?? null;
  const daysSinceLogin = info.lastLogin ? Math.max(0, Math.round(daysBetween(info.lastLogin, asOf))) : null;

  return (
    <Modal isOpen={!!info} onClose={onClose} title="Détails du client" size="xl">
      <div className="space-y-5">
        {/* En-tête : type, statut, revendeur, pack, priorité */}
        <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-border-subtle">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-50 text-primary rounded-pill flex items-center justify-center">
              <Users size={24} aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-h4 text-text">{c.name}</h3>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-mention">
                <span className={`px-2.5 py-0.5 rounded-control font-medium ${c.type === 'Revendeur' ? 'bg-primary-100 text-primary' : 'bg-border-subtle text-text'}`}>
                  {c.type === 'Revendeur' ? 'Revendeur' : 'Client final'}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-pill border font-medium ${
                    info.active ? 'bg-success-50 text-success-700 border-success-200' : 'bg-danger-50 text-danger-700 border-danger-200'
                  }`}
                >
                  {info.active ? <CircleCheck size={14} aria-hidden="true" /> : <TriangleAlert size={14} aria-hidden="true" />}
                  {info.active ? (info.blockedInDays != null ? `Actif · bloqué dans ${info.blockedInDays} j` : 'Actif') : 'Bloqué'}
                </span>
                <span className="text-text-muted">
                  Propriétaire : {info.owner} · {info.packs.length ? info.packs.map((p) => p.name).join(' + ') : 'Sans pack'}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-overline uppercase text-text-muted">Priorité</div>
            <span className={`inline-flex items-center mt-1 px-2.5 py-1 rounded-pill border text-mention font-semibold ${PRIORITY_CLS[info.priority]}`}>
              {info.priority}
            </span>
          </div>
        </div>

        <div role="tablist" aria-label="Sections de la fiche" className="flex flex-wrap gap-1 border-b border-border-subtle">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 h-9 -mb-px border-b-2 text-small font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus ${
                tab === t.key ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text'
              }`}
            >
              {t.label}
              {t.key === 'equipements' ? ` (${info.assigned})` : ''}
            </button>
          ))}
        </div>

        {tab === 'synthese' && (
          <div className="space-y-5" role="tabpanel">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Tile label="Abonnement" value={expiryTxt} sub={expirySub} tone={!info.active || info.blockedInDays != null ? 'danger' : (info.daysToExpiry ?? 99) <= delayDays ? 'warning' : undefined} />
              <Tile
                label="Équipements connectés"
                value={`${info.connected} / ${info.assigned}`}
                sub={`${pct(info.connected, info.assigned)} % · données ≤ ${connDays} j`}
                tone={info.assigned && info.connected * 2 < info.assigned ? 'danger' : undefined}
              />
              <Tile label="Jamais connectés" value={fmt(info.neverConnected)} sub="affectés, aucune trame reçue" tone={info.neverConnected ? 'danger' : 'success'} />
              <Tile
                label="Dernière connexion"
                value={daysSinceLogin == null ? 'jamais' : `${daysSinceLogin} j`}
                sub={info.lastLogin ? `${frDate(info.lastLogin)} · ${info.lastChannel}` : 'aucun utilisateur connecté'}
                tone={daysSinceLogin == null || daysSinceLogin > delayDays ? 'warning' : undefined}
              />
              <Tile label="Activité de l’année" value={`${monthsActive} mois`} sub={`${fmt(loginsYear)} connexion(s) depuis janvier`} />
              <Tile label="Client depuis" value={frIso(c.createdAt)} sub="date de création (à confirmer back-end)" />
              <Tile
                label="Véhicules équipés"
                value={`${info.installed} / ${limit == null ? '∞' : limit}`}
                sub={limit ? `${pct(info.installed, limit)} % du quota autorisé` : 'quota illimité'}
              />
              <Tile
                label="Comptes utilisés"
                value={`${c.accountsUsed ?? '—'} / ${accountLimit == null ? '—' : accountLimit === -1 ? '∞' : accountLimit}`}
                sub="comptes utilisateurs (à confirmer back-end)"
              />
            </div>

            {canSeePrices && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* CD-4 – Revenu mensuel (Admin / Finance) */}
                <div className="rounded-control border border-border-subtle p-3">
                  <div className="text-overline uppercase text-text-muted">Revenu mensuel · Admin et Finance</div>
                  <div className="mt-1 text-h4 text-text">[—] TND</div>
                  <div className="text-mention text-text-muted">
                    Prix fixe {info.packs.map((p) => p.name).join(' + ') || 'du pack'} : aucun prix de pack dans les données (à confirmer).
                  </div>
                </div>
                {/* CD-5 – Consommation data des puces (Admin / Finance) */}
                <div className="rounded-control border border-border-subtle p-3">
                  <div className="text-overline uppercase text-text-muted">Consommation data des puces (6 mois) · Admin et Finance</div>
                  {simMonthly.some((m) => m.value > 0) ? (
                    <BarChart data={simMonthly} height={120} ariaLabel="Consommation data des puces du client, en Mo, 6 derniers mois" formatValue={(n) => `${fmt(n)}`} />
                  ) : (
                    <p className="mt-2 text-small text-text-muted">Aucune consommation sur les 6 derniers mois.</p>
                  )}
                  <div className="text-mention text-text-muted">En Mo, toutes les puces du client · données fictives (SIMConsumptionHistory à confirmer).</div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Pourquoi : raison + action par signal */}
              <div>
                <h4 className="text-small font-semibold text-text mb-2">Pourquoi « {info.priority} »</h4>
                {info.reasons.length ? (
                  <ul className="space-y-2">
                    {info.reasons.map((r, i) => (
                      <li key={i} className="rounded-control border border-border-subtle p-2.5 text-small">
                        <span className={`mr-2 inline-flex px-2 py-0.5 rounded-pill border text-mention font-medium ${PRIORITY_CLS[r.level]}`}>{r.level}</span>
                        <span className="font-medium text-text">{r.reason}</span>
                        <div className="text-mention text-text-muted mt-1">→ {r.action}</div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-small text-text-muted">Aucun signal : client à jour.</p>
                )}
              </div>
              {/* CD-2 – Score de santé (barème à valider) */}
              <div className="rounded-control border border-border-subtle p-3">
                <div className="flex items-baseline justify-between">
                  <h4 className="text-small font-semibold text-text">Score de santé</h4>
                  <span className="text-mention font-medium text-warning-700">barème à valider</span>
                </div>
                <div className="mt-1 text-kpi text-text tabular-nums">
                  {score.total}
                  <span className="text-small text-text-muted">/100</span>
                </div>
                <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-small">
                  <dt className="text-text-muted">Connexion (30 %)</dt>
                  <dd className="text-right tabular-nums">{score.connexion}</dd>
                  <dt className="text-text-muted">Contrat (25 %)</dt>
                  <dd className="text-right tabular-nums">{score.contrat}</dd>
                  <dt className="text-text-muted">Installation (25 %)</dt>
                  <dd className="text-right tabular-nums">{score.installation}</dd>
                  <dt className="text-text-muted">Quota véhicules (20 %)</dt>
                  <dd className="text-right tabular-nums">{score.quota}</dd>
                </dl>
                <p className="mt-2 text-mention text-text-muted">
                  Barème proposé par la maquette, à valider avec Tunav. 0,30×{score.connexion} + 0,25×{score.contrat} + 0,25×{score.installation} + 0,20×
                  {score.quota} = {score.total}
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-small font-semibold text-text mb-1">Connexions par mois (12 mois)</h4>
              <BarChart data={conn12.map((m) => ({ label: m.label, value: m.value }))} height={130} ariaLabel="Connexions des utilisateurs du client par mois" />
            </div>
          </div>
        )}

        {tab === 'equipements' && (
          <div role="tabpanel" className="border border-border rounded-card overflow-hidden overflow-x-auto">
            <table className="w-full text-left text-small min-w-[720px]">
              <thead>
                <tr className="bg-surface-muted border-b border-border text-overline uppercase text-text">
                  <th className="px-4 py-3">Équipement</th>
                  <th className="px-4 py-3">Pack</th>
                  <th className="px-4 py-3">Affecté le</th>
                  <th className="px-4 py-3">1er envoi</th>
                  <th className="px-4 py-3">Dernière position</th>
                  <th className="px-4 py-3">Connexion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {info.equipments.length ? (
                  info.equipments.map((e) => {
                    const last = e.lastCommunication ? new Date(e.lastCommunication) : null;
                    const days = last ? daysBetween(last, now) : null;
                    const ok = days != null && days * 24 <= connHours;
                    return (
                      <tr key={e.id} className="hover:bg-primary-50">
                        <td className="px-4 py-2.5">
                          <div className="font-medium text-text">{e.equipmentType ?? e.type}</div>
                          <div className="text-mention text-text-muted font-mono flex items-center gap-1">
                            <Hash size={11} aria-hidden="true" />
                            {e.serial}
                            {c.type === 'Revendeur' && <span className="font-sans"> · {e.client}</span>}
                          </div>
                        </td>
                        <td className="px-4 py-2.5">{e.packId != null ? packName.get(e.packId) ?? '—' : '—'}</td>
                        <td className="px-4 py-2.5 tabular-nums">{frIso(e.assignedAt ?? e.contractDate)}</td>
                        <td className="px-4 py-2.5 tabular-nums">{e.firstSendDate ? frIso(e.firstSendDate) : 'Jamais'}</td>
                        <td className="px-4 py-2.5 tabular-nums">{last ? `${frDate(last)} · ${Math.floor(days ?? 0)} j` : '—'}</td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill border text-mention font-medium whitespace-nowrap ${
                              !last
                                ? 'bg-border-subtle text-text border-border'
                                : ok
                                  ? 'bg-success-50 text-success-700 border-success-200'
                                  : 'bg-danger-50 text-danger-700 border-danger-200'
                            }`}
                          >
                            {ok ? <Wifi size={14} aria-hidden="true" /> : <WifiOff size={14} aria-hidden="true" />}
                            {!last ? 'Jamais connecté' : ok ? 'Connecté' : 'Non connecté'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-text-muted">
                      Aucun équipement affecté à ce client.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'activite' && (
          <div role="tabpanel" className="space-y-5">
            {/* CD-6 – Connexion mensuelle 12 mois */}
            <div>
              <h4 className="text-small font-semibold text-text">Connexion mensuelle</h4>
              <p className="text-mention text-text-muted mb-2">
                {conn12[0] ? `${formatMonthFr(conn12[0].month)} → ${formatMonthFr(conn12[conn12.length - 1].month)}` : ''} · canal de la majorité des
                connexions · source : journal des connexions utilisateur (à confirmer back-end)
              </p>
              <div className="grid grid-cols-6 md:grid-cols-12 gap-1.5">
                {conn12.map((m) => (
                  <div
                    key={m.month}
                    className={`rounded-control border p-1.5 text-center ${m.value ? 'border-success-200 bg-success-50' : 'border-border-subtle bg-surface-muted'}`}
                    title={`${formatMonthFr(m.month)} : ${m.value} connexion(s)`}
                  >
                    <div className="text-mention text-text-muted">{m.label}</div>
                    <div className={`text-small font-semibold tabular-nums ${m.value ? 'text-success-700' : 'text-text-muted'}`}>{m.value || '—'}</div>
                    <div className="text-mention text-text-muted">{m.value ? (m.pc >= m.mobile ? 'PC' : 'Mobile') : ''}</div>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-mention text-text">
                {conn12.filter((m) => m.value > 0).length} mois avec connexion sur 12 · {fmt(conn12.reduce((s, m) => s + m.value, 0))} connexion(s)
              </p>
            </div>

            {/* CD-7 – Historique des offres (sans montant : aucun prix de pack dans les données) */}
            <div>
              <h4 className="text-small font-semibold text-text mb-2">Historique des offres</h4>
              <div className="border border-border rounded-card overflow-hidden">
                <table className="w-full text-left text-small">
                  <thead>
                    <tr className="bg-surface-muted border-b border-border text-overline uppercase text-text">
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Offre</th>
                      <th className="px-4 py-3">Changement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {history.length ? (
                      history.map((h, i) => (
                        <tr key={i}>
                          <td className="px-4 py-2.5 tabular-nums">{frIso(h.date)}</td>
                          <td className="px-4 py-2.5 font-medium">{packName.get(h.toPackId) ?? '—'}</td>
                          <td className="px-4 py-2.5">
                            <span className="inline-flex items-center gap-1.5 font-medium">
                              {h.direction === 'montée' ? (
                                <ArrowUpRight size={14} aria-hidden="true" className="text-success-700" />
                              ) : h.direction === 'descente' ? (
                                <ArrowDownRight size={14} aria-hidden="true" className="text-warning-700" />
                              ) : (
                                <CirclePlus size={14} aria-hidden="true" className="text-primary" />
                              )}
                              {h.direction === 'montée' ? 'Montée' : h.direction === 'descente' ? 'Descente' : 'Première affectation'}
                            </span>
                            {h.fromPackId != null && (
                              <div className="text-mention text-text-muted">depuis {packName.get(h.fromPackId) ?? '—'}</div>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-text-muted">
                          Aucun pack affecté.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <p className="mt-1 text-mention text-text-muted">
                Écart de prix non affiché : aucun prix de pack dans les données (historique des affectations à confirmer back-end).
              </p>
            </div>
          </div>
        )}

        {tab === 'informations' && (
          <div role="tabpanel" className="space-y-5 text-small">
            <section>
              <h4 className="text-small font-semibold text-text mb-3 pb-2 border-b border-border-subtle">Informations générales</h4>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                <Field icon={Hash} label="Type de client" value={c.type === 'Revendeur' ? 'Revendeur' : 'Simple'} />
                <Field icon={Building2} label="Revendeur" value={c.reseller} />
                <Field icon={Clock} label="Date d’expiration" value={frIso(c.expiry)} />
                <Field icon={Globe} label="Site web" value={profile?.website ?? ''} />
                <Field icon={Shield} label="Formule commerciale" value={profile?.formula ?? ''} />
                <Field icon={Clock} label="Décalage horaire" value={profile?.timezone ?? ''} />
              </div>
            </section>
            <section>
              <h4 className="text-small font-semibold text-text mb-3 pb-2 border-b border-border-subtle">Contact</h4>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                <div className="col-span-2">
                  <Field icon={MapPin} label="Adresse complète" value={profile?.address ?? ''} />
                </div>
                <Field icon={Phone} label="Téléphone 1" value={c.tel} />
                <Field icon={Mail} label="Email 1" value={c.email} />
                <Field icon={Phone} label="Téléphone 2" value={profile?.tel2 ?? ''} />
                <Field icon={Mail} label="Email 2" value={profile?.email2 ?? ''} />
              </div>
            </section>
            <section>
              <h4 className="text-small font-semibold text-text mb-3 pb-2 border-b border-border-subtle">Configuration</h4>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                <Field icon={Users} label="Nombre de véhicules autorisé" value={limit == null ? 'Illimité' : String(limit)} />
                <Field
                  icon={Users}
                  label="Nombre de comptes autorisé"
                  value={accountLimit == null ? '-' : accountLimit === -1 ? 'Illimité' : String(accountLimit)}
                />
              </div>
            </section>
            <section>
              <h4 className="text-small font-semibold text-text mb-3 pb-2 border-b border-border-subtle">Compte</h4>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                <Field icon={Users} label="Nom d’utilisateur" value={profile?.username ?? ''} />
                {/* Sécurité (FleetIQ 06) : jamais de mot de passe affiché, pas de bouton « afficher » */}
                <div>
                  <div className="text-text-muted text-mention mb-1 flex items-center gap-1.5">
                    <Key size={12} aria-hidden="true" /> Mot de passe
                  </div>
                  <div className="font-medium text-text" aria-label="Mot de passe masqué">
                    ••••
                  </div>
                  <div className="text-mention text-text-muted">Jamais affiché · modification par « Modifier le client ».</div>
                </div>
              </div>
            </section>
          </div>
        )}

        <div className="pt-4 border-t border-border-subtle flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center h-9 px-3 text-button-sm rounded-control bg-surface text-text border border-border hover:bg-surface-muted transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
          >
            Fermer
          </button>
        </div>
      </div>
    </Modal>
  );
}
