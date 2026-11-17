/**
 * Gestion des Packs v3 – bandeau critique, cartes du haut et « À traiter » (carte FleetIQ 08).
 * Cartes : PK-P-01 Clients avec pack · PK-P-02 Packs affectés sur la période · PK-P-03 Pack le plus choisi ·
 * PK-P-05 Équipements connectés. À traiter : PK-A-10 (≤ 10 j), PK-A-11 (11–60 j), PK-A-12 (équipement hors pack),
 * PK-A-13 (bloqués ou expirés) – un clic ouvre le détail, « Filtrer la liste des clients » filtre le catalogue.
 * Aucun prix.
 */
import { AlertTriangle, ArrowRight, Package, Trophy, Users, Wifi, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { StackedBar } from '../charts';
import type { DetailSpec } from '../dashboard/DetailModal';
import { ALERT_META, alertDetail } from './packsAlerts';
import { SectionTitle } from '../clients/ClientsOverview';
import { FAMILY_CLS, RAIL_CLS, type StatusFamily } from '../ui/StatusTag';
import { fmt, frDate, MIN_CONN_PCT, namesWithDays, pct, type PacksData, type PkAlertKey } from '../../utils/packsKpis';

/** Famille d'état Industrial Tech de chaque alerte « À traiter » */
const ALERT_FAMILY: Record<PkAlertKey, StatusFamily> = {
  critique: 'danger',
  anticiper: 'warning',
  hors_pack: 'info',
  bloques: 'danger'
};

/** PK-A-10 – bandeau en haut de la page (expirations ≤ 10 j), fermable */
export function CriticalBanner({ data, onShow, onClose }: { data: PacksData; onShow: () => void; onClose: () => void }) {
  const list = data.alerts.critique;
  if (!list.length) return null;
  return (
    <div role="alert" data-kpi="PK-A-10" className="flex flex-wrap items-center gap-3 rounded-card border border-danger-200 bg-danger-50 px-4 py-3">
      <AlertTriangle size={18} className="shrink-0 text-danger-700" aria-hidden="true" />
      <p className="flex-1 min-w-0 text-small text-text">
        <b className="text-danger-700">{fmt(list.length)} abonnement(s)</b> expirent dans {data.critDays} jours ou moins : {namesWithDays(list, 4)}
      </p>
      <button
        type="button"
        onClick={onShow}
        className="inline-flex items-center gap-1 h-8 px-3 text-button-sm rounded-control border border-danger-200 bg-surface text-danger-700 hover:border-danger transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
      >
        Voir les clients <ArrowRight size={14} aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer le bandeau"
        className="inline-flex h-8 w-8 items-center justify-center rounded-control text-text-muted hover:bg-surface focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

function TopCard({ kpiId, title, icon: Icon, children, onOpen, iconCls = 'bg-primary-50 text-primary' }: { kpiId: string; title: string; icon: typeof Users; children: ReactNode; onOpen: () => void; iconCls?: string }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      data-kpi={kpiId}
      className="group flex h-full w-full flex-col gap-1.5 text-left bg-surface rounded-card border border-border p-4 hover:border-accent transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
    >
      <span className="flex items-start justify-between gap-2">
        <span className="text-overline uppercase text-text-muted">{title}</span>
        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-control ${iconCls}`} aria-hidden="true">
          <Icon size={16} />
        </span>
      </span>
      {children}
      <span className="mt-auto inline-flex items-center gap-1 self-end text-[11.5px] text-text-muted group-hover:text-primary-hover">
        Voir le détail
        <ArrowRight size={12} aria-hidden="true" />
      </span>
    </button>
  );
}

function Evolution({ now, before }: { now: number; before: number }) {
  if (before === 0) return <span className="text-mention text-text-muted">{now ? 'nouveau (0 avant)' : '= 0'}</span>;
  const p = Math.round(((now - before) * 100) / before);
  if (p === 0) return <span className="text-mention text-text-muted">= {fmt(before)}</span>;
  return (
    <span className={`text-mention font-semibold ${p > 0 ? 'text-success-700' : 'text-danger-700'}`}>
      {p > 0 ? '↗ +' : '↘ −'}
      {fmt(Math.abs(p))} % <span className="font-normal text-text-muted">(avant {fmt(before)})</span>
    </span>
  );
}

type Props = {
  /** bloc affiché entre les cartes et « À traiter » (Packs vendus aux revendeurs) */
  between?: ReactNode;
  data: PacksData;
  periodLabel: string;
  compareLabel: string | null;
  alertFilter: PkAlertKey | null;
  onOpenDetail: (d: DetailSpec) => void;
};

export function PacksOverview({ data, periodLabel, compareLabel, alertFilter, onOpenDetail, between }: Props) {
  const { p01, p05 } = data;
  const lead = data.ranking[0];
  const n02 = data.periodSales.length;
  const c02 = data.compareSales?.length ?? null;
  const p05Rate = pct(p05.connected, p05.total);

  const openP02 = () =>
    onOpenDetail({
      title: 'Packs affectés sur la période',
      kpiId: 'PK-P-02',
      big: fmt(n02),
      caption: `affectation(s) · ${periodLabel}${c02 != null ? ` · ${fmt(c02)} ${compareLabel ?? ''}` : ''}`,
      what: 'Packs vendus = nouvelles affectations pack → client pendant la période (sans prix).',
      table: {
        headers: ['Date', 'Pack', 'Client', 'Propriétaire'],
        rows: data.periodSales.map((s) => [frDate(s.date), s.pack.name, s.client.client.name, s.client.owner])
      },
      definition: 'Nombre de lignes d’affectation pack → client créées pendant la période, comparé à la période de comparaison si « Comparer » est actif.',
      formula: 'N = affectations datées dans [Du ; Au] · évolution = (N − N_comp) ÷ N_comp × 100'
    });

  const openP03 = () =>
    onOpenDetail({
      title: 'Pack le plus choisi',
      kpiId: 'PK-P-03',
      big: lead ? lead.pack.name : '—',
      caption: lead ? `${fmt(lead.clients.length)} clients · ${pct(lead.clients.length, p01.withPack)} % des clients avec pack` : '',
      table: {
        headers: ['#', 'Pack', 'Clients', 'Tunav', 'Revendeurs', 'Équipements', `Vendus (${periodLabel})`],
        rows: data.ranking.map((r, i) => [i + 1, r.pack.name, r.clients.length, r.tunav, r.resellers, r.equipments.length, r.soldInPeriod])
      },
      definition: 'Pour chaque pack : clients qui l’ont aujourd’hui et équipements de ces clients. Un client à deux packs compte dans les deux.',
      formula: 'Clients(p) = clients distincts ayant p · Part = Clients(p) ÷ clients avec pack'
    });

  const openP05 = () =>
    onOpenDetail({
      title: 'Équipements connectés · par pack',
      kpiId: 'PK-P-05',
      big: `${p05Rate} %`,
      caption: `${fmt(p05.connected)} / ${fmt(p05.total)} équipements des clients avec pack · données ≤ ${fmt(data.connDays)} j`,
      chart: (
        <StackedBar
          ariaLabel="Équipements connectés et hors ligne"
          segments={[
            { key: 'c', label: 'Connectés', value: p05.connected, tone: 'success' },
            { key: 'n', label: 'Hors ligne', value: p05.total - p05.connected, tone: 'danger' }
          ]}
        />
      ),
      table: {
        headers: ['Pack', 'Connectés', 'Équipements', '%', ''],
        rows: p05.byPack.map((r) => {
          const p = pct(r.connected, r.equipments.length);
          return [r.pack.name, r.connected, r.equipments.length, `${p} %`, p < MIN_CONN_PCT ? 'BAS' : ''];
        })
      },
      note: (() => {
        const off = data.withPack
          .filter((c) => c.equipments.some((e) => !e.connected))
          .sort((a, b) => b.equipments.filter((e) => !e.connected).length - a.equipments.filter((e) => !e.connected).length)
          .slice(0, 10);
        return off.length ? (
          <p>
            <b>Clients avec des équipements hors ligne :</b>{' '}
            {off.map((c) => `${c.client.name} (${c.equipments.filter((e) => e.connected).length}/${c.equipments.length})`).join(' · ')}
          </p>
        ) : null;
      })(),
      definition: `Parmi les équipements des clients qui ont un pack, part de ceux qui ont envoyé des données depuis moins de ${fmt(data.connDays)} j (seuil global, même règle que Gestion Clients K-04). Un pack sous ${MIN_CONN_PCT} % signale un risque de non-renouvellement.`,
      formula: 'Taux(p) = équipements connectés des clients de p ÷ équipements des clients de p × 100'
    });

  return (
    <div className="grid grid-cols-12 gap-4 gap-y-8">
      {/* Maquette Packs-v3 : 3 cartes (Packs vendus · Pack le plus choisi · Équipements connectés par pack) */}
      <div className="col-span-12 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch">
        {/* PK-P-02 Packs affectés sur la période (vs comparaison) */}
        <TopCard kpiId="PK-P-02" title={`Packs vendus (${periodLabel})`} icon={Package} onOpen={openP02} iconCls="bg-[#EDE9FE] text-[#7C3AED]">
          <div className="text-kpi text-text font-qty">{fmt(n02)}</div>
          <p className="mt-1">
            {c02 != null ? (
              <>
                <Evolution now={n02} before={c02} /> <span className="text-mention text-text-muted">{compareLabel}</span>
              </>
            ) : (
              <span className="text-small text-text-muted">nouvelles affectations · sans comparaison</span>
            )}
          </p>
        </TopCard>
        {/* PK-P-03 Pack le plus choisi */}
        <TopCard kpiId="PK-P-03" title="Pack le plus choisi" icon={Trophy} onOpen={openP03} iconCls="bg-warning-50 text-warning">
          <div className="text-title text-text">{lead?.pack.name ?? '—'}</div>
          <p className="text-small text-text-muted mt-1">
            {lead ? `${fmt(lead.clients.length)} clients · ${fmt(lead.equipments.length)} équipements` : 'Aucun pack affecté'}
          </p>
        </TopCard>
        {/* PK-P-05 Équipements connectés */}
        <TopCard kpiId="PK-P-05" title="Équipements connectés · par pack" icon={Wifi} onOpen={openP05} iconCls="bg-success-50 text-success">
          <div className="flex items-baseline gap-2">
            <span className="text-kpi text-text font-qty">{p05Rate} %</span>
            <span className="text-small text-text-muted">
              {fmt(p05.connected)} / {fmt(p05.total)}
            </span>
          </div>
          <div className="mt-2">
            <StackedBar
              height="md"
              ariaLabel="Équipements connectés et hors ligne"
              segments={[
                { key: 'c', label: 'Connectés', value: p05.connected, tone: 'success' },
                { key: 'n', label: 'Hors ligne', value: p05.total - p05.connected, tone: 'danger' }
              ]}
            />
          </div>
          <p className="mt-1 text-mention text-text-muted">données ≤ {fmt(data.connDays)} j</p>
        </TopCard>
      </div>

      {between}

      {/* À traiter */}
      <section aria-labelledby="pk-todo" className="col-span-12 grid grid-cols-12 gap-4">
        <SectionTitle id="pk-todo" title="À traiter" />
        <div className="col-span-12 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {(['critique', 'anticiper', 'hors_pack', 'bloques'] as PkAlertKey[]).map((k) => {
            const meta = ALERT_META[k];
            const list = data.alerts[k];
            const count = k === 'hors_pack' ? list.reduce((s, c) => s + c.outOfPack.length, 0) : list.length;
            const detail =
              k === 'critique' || k === 'anticiper'
                ? list.length
                  ? namesWithDays(list, 2)
                  : 'Aucun'
                : k === 'hors_pack'
                  ? `${fmt(list.length)} client(s)${list.length ? ` · ${list.slice(0, 2).map((c) => c.client.name).join(', ')}` : ''}`
                  : list.length
                    ? `${fmt(list.filter((c) => !c.active).length)} bloqué(s) · ${fmt(list.filter((c) => c.active).length)} expiré(s) encore actif(s)`
                    : 'Aucun';
            const on = alertFilter === k;
            return (
              <button
                key={k}
                type="button"
                aria-pressed={on}
                data-kpi={`PK-${meta.mockup}`}
                onClick={() => onOpenDetail(alertDetail(k, data))}
                className={`text-left rounded-card border p-4 transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus ${
                  count > 0 ? RAIL_CLS[ALERT_FAMILY[k]] : ''
                } ${on ? 'border-primary bg-primary-50' : 'border-border bg-surface hover:border-border-strong'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-small font-semibold text-text">{meta.title(data)}</span>
                  <span
                    className={`shrink-0 inline-flex items-center h-6 px-2 rounded-tag border text-mention font-semibold uppercase tracking-[0.06em] whitespace-nowrap ${FAMILY_CLS[ALERT_FAMILY[k]]}`}
                  >
                    {meta.tag}
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-kpi text-text font-qty">{fmt(count)}</span>
                  <span className="text-small text-text-muted">{meta.unit}</span>
                </div>
                <p className="text-mention text-text-muted truncate" title={detail}>
                  {detail}
                </p>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
