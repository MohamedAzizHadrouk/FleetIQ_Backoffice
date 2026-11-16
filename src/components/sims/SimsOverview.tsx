/**
 * Gestion des puces v3 – quatre cartes (PU-P-01 Total · PU-P-02 Installées · PU-P-03 Non installées ·
 * PU-P-07 Puces en surconsommation) et « Puces installées par offre » avec le prix fixe (PU-P-05). Carte FleetIQ 09.
 * Retirés à la demande (maquette) : cartes « Sans offre (stock) », « Coût des puces » (P-06), « Alertes consommation ».
 */
import type { ReactNode } from 'react';
import { ArrowRight, Boxes, Flame, Package, Smartphone, Wifi } from 'lucide-react';
import { SectionTitle } from '../clients/ClientsOverview';
import { fmt, formatTnd, pct, plusVolume, volume, type OfferSummary, type SimPeriod, type SimsData } from '../../utils/simsKpis';

function TopCard({
  kpiId,
  title,
  icon: Icon,
  tone = 'primary',
  children,
  onOpen
}: {
  kpiId: string;
  title: string;
  icon: typeof Smartphone;
  tone?: 'primary' | 'success' | 'warning' | 'danger';
  children: ReactNode;
  onOpen: () => void;
}) {
  const TONE = {
    primary: 'text-text-muted',
    success: 'text-success-700',
    warning: 'text-warning-700',
    danger: 'text-danger-700'
  } as const;
  return (
    <button
      type="button"
      onClick={onOpen}
      data-kpi={kpiId}
      className="group flex h-full w-full flex-col gap-1.5 text-left bg-surface rounded-card border border-border p-4 pt-3 hover:border-border-strong transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
    >
      <span className="flex items-start justify-between gap-2">
        <span className="text-overline uppercase text-text-muted">{title}</span>
        <Icon size={16} className={`shrink-0 ${TONE[tone]}`} aria-hidden="true" />
      </span>
      {children}
      <span className="mt-auto inline-flex items-center gap-1 pt-2 border-t border-border-subtle text-mention font-medium text-primary">
        Voir le détail
        <ArrowRight size={14} aria-hidden="true" />
      </span>
    </button>
  );
}

type Props = {
  data: SimsData;
  period: SimPeriod;
  showPrices: boolean;
  onTotal: () => void;
  onInstalled: () => void;
  onNotInstalled: () => void;
  onOver: () => void;
  onOffer: (o: OfferSummary) => void;
  onOfferList: (o: OfferSummary) => void;
};

export function SimsTopCards({ data, period, onTotal, onInstalled, onNotInstalled, onOver }: Props) {
  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-12 grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {/* PU-P-01 (P-01) */}
      <TopCard kpiId="PU-P-01" title="Total puces" icon={Smartphone} onOpen={onTotal}>
        <p className="text-kpi text-text font-qty">{fmt(data.total)}</p>
        <p className="text-small text-text-muted">
          Tunav {fmt(data.tunavSims)} · revendeurs {fmt(data.resellerSims)}
        </p>
      </TopCard>
      {/* PU-P-02 (P-02) */}
      <TopCard kpiId="PU-P-02" title="Installées" icon={Wifi} tone="success" onOpen={onInstalled}>
        <p className="text-kpi text-text font-qty">
          {fmt(data.installed)} <span className="text-h4 text-success-700">{pct(data.installed, data.total)} %</span>
        </p>
        <p className="text-small text-text-muted">dans un équipement posé chez le client</p>
      </TopCard>
      {/* PU-P-03 (P-03) */}
      <TopCard kpiId="PU-P-03" title="Non installées" icon={Boxes} tone="warning" onOpen={onNotInstalled}>
        <p className="text-kpi text-text font-qty">
          {fmt(data.notInstalled)} <span className="text-h4 text-warning-700">{pct(data.notInstalled, data.total)} %</span>
        </p>
        <p className="text-small text-text-muted">
          {fmt(data.parts.non_posee)} non posée(s) · {fmt(data.parts.sans_equipement)} sans équipement · {fmt(data.parts.stock)} en stock
        </p>
      </TopCard>
      {/* PU-P-07 (P-07) – remplace la carte « Alertes consommation » (les alertes restent dans la cloche) */}
      <TopCard kpiId="PU-P-07" title="Puces en surconsommation" icon={Flame} tone="danger" onOpen={onOver}>
        <p className="text-kpi text-text font-qty">
          {fmt(data.over.length)} <span className="text-h4 text-text-muted">puce(s)</span>
        </p>
        <p className="text-small text-text-muted">
          <b className="text-danger-700">{plusVolume(data.overMB)}</b> au-delà du forfait · {period.label}
          {period.estimated ? ' (estimé)' : ''}
        </p>
      </TopCard>
      </div>
    </div>
  );
}

/** PU-P-05 – une carte par offre : nom, opérateur, prix fixe / puce / mois, installées / puces, coût mensuel */
export function SimsOffers({ data, showPrices, onOffer, onOfferList }: Props) {
  return (
    <section aria-labelledby="pu-offers" className="space-y-3" data-kpi="PU-P-05">
      <SectionTitle id="pu-offers" title="Puces installées par offre" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {data.offers.map((o) => {
          const rate = pct(o.installed, o.sims);
          return (
            <div
              key={o.key}
              role="button"
              tabIndex={0}
              onClick={() => onOffer(o)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onOffer(o);
                }
              }}
              className="cursor-pointer bg-surface rounded-card border border-border border-l-4 border-l-primary p-4 flex flex-col gap-3 hover:border-border-strong transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-small font-semibold text-text truncate">{o.name}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-control border border-border bg-surface-muted px-2 py-0.5 text-mention font-medium text-text">
                      <Wifi size={11} aria-hidden="true" />
                      {o.operator}
                    </span>
                    {showPrices && o.price != null && <span className="text-mention text-text">{formatTnd(o.price)} / puce / mois</span>}
                    <span className="text-mention text-text-muted">{o.quota != null ? `forfait ${volume(o.quota)}` : 'data illimitée'}</span>
                  </div>
                </div>
                <span className="flex h-control w-9 shrink-0 items-center justify-center rounded-control bg-primary-50 text-primary">
                  <Package size={18} aria-hidden="true" />
                </span>
              </div>
              <p className="text-title text-text tabular-nums">
                {fmt(o.installed)}
                <span className="font-normal text-text-muted"> / {fmt(o.sims)}</span>
                <span className="ml-2 text-mention font-normal text-text-muted">installées / puces</span>
              </p>
              <div className="space-y-1">
                <div className="h-1.5 w-full overflow-hidden rounded-pill bg-border-subtle">
                  <div className="h-full rounded-pill bg-primary" style={{ width: `${rate}%` }} />
                </div>
                <div className="flex items-center justify-between gap-2 text-mention text-text-muted">
                  <span>
                    {fmt(rate)} % installées{showPrices ? ` · ${formatTnd(o.cost)} / mois` : ''}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOfferList(o);
                    }}
                    className="font-medium text-primary hover:underline underline-offset-2 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus rounded-control"
                  >
                    Voir les puces →
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
