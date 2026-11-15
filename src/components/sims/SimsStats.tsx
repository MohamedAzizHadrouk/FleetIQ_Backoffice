/**
 * Gestion des puces v3 – « Statistiques puces », sans prix (carte FleetIQ 09) :
 * PU-S-22 statut des puces (2 états) · PU-S-21 puces installées par offre · PU-C-22 consommation par opérateur ·
 * à sa droite PU-S-23 évolution de la consommation par revendeur, avec filtre « Revendeur ».
 * Retirés à la demande (maquette) : numéros et textes « À faire » des statistiques.
 */
import { useMemo, useState } from 'react';
import { BarChart, HorizontalBarList, Legend, LineChart, StackedBar, type ChartTone } from '../charts';
import type { DetailSpec } from '../dashboard/DetailModal';
import { SectionTitle } from '../clients/ClientsOverview';
import { Block } from './SimUi';
import {
  fmt,
  monthlyEvolution,
  networkLabel,
  pct,
  plusVolume,
  volume,
  type ConsIndex,
  type OfferSummary,
  type OperatorSummary,
  type PeriodContext,
  type SimPeriod,
  type SimsData
} from '../../utils/simsKpis';
import { formatMonthFr, formatMonthShortFr } from '../../state/mock/dates';

const SERIES: ChartTone[] = ['series1', 'series2', 'series3', 'series4'];

type Props = {
  data: SimsData;
  period: SimPeriod;
  ctx: PeriodContext;
  cons: ConsIndex;
  /** réseaux du périmètre (barre « Réseau ») */
  networks: string[];
  onStatus: (installed: boolean) => void;
  onOffer: (o: OfferSummary) => void;
  onOperator: (o: OperatorSummary) => void;
  onOpenDetail: (d: DetailSpec) => void;
};

export function SimsStats({ data, period, ctx, cons, networks, onStatus, onOffer, onOperator, onOpenDetail }: Props) {
  const [reseller, setReseller] = useState('');
  const [selMonth, setSelMonth] = useState<number | null>(null);
  const months = ctx.yearMonths;
  const labels = months.map((m) => (m === ctx.currentMonth ? `${formatMonthShortFr(m)} (en cours)` : formatMonthShortFr(m)));

  const byNetwork = useMemo(() => monthlyEvolution(data.rows, cons, months, (r) => r.network), [data.rows, cons, months]);
  const focusRows = useMemo(() => (reseller ? data.rows.filter((r) => r.network === reseller) : []), [data.rows, reseller]);
  const byClient = useMemo(() => monthlyEvolution(focusRows, cons, months, (r) => r.clientLabel), [focusRows, cons, months]);
  const lineNetworks = networks.filter((n) => byNetwork.has(n)).slice(0, 4);

  // pics de surconsommation : mois le plus dépassé de chaque réseau
  const peaks = lineNetworks
    .map((n) => {
      const pts = byNetwork.get(n) ?? [];
      const best = pts.reduce((a, b) => (b.excess > a.excess ? b : a), pts[0] ?? { month: '', used: 0, quota: 0, excess: 0 });
      return { network: n, ...best };
    })
    .filter((p) => p.excess > 0.5)
    .sort((a, b) => b.excess - a.excess);
  const focusPts = reseller ? byNetwork.get(reseller) ?? [] : [];
  const focusQuota = focusPts.length ? focusPts[focusPts.length - 1].quota : 0;
  const topFocus = [...focusPts]
    .map((p, i) => ({ ...p, i }))
    .filter((p) => p.excess > 0.5)
    .sort((a, b) => b.excess - a.excess)
    .slice(0, 3);

  const openMonth = (i: number) => {
    setSelMonth(i);
    const m = months[i];
    const src = reseller ? byClient : byNetwork;
    const rows = Array.from(src.entries())
      .map(([k, pts]) => ({ k, p: pts[i] }))
      .filter((x) => x.p.used > 0 || x.p.quota > 0)
      .sort((a, b) => b.p.used - a.p.used);
    const used = rows.reduce((s, x) => s + x.p.used, 0);
    const exc = rows.reduce((s, x) => s + x.p.excess, 0);
    onOpenDetail({
      title: `Consommation · ${formatMonthFr(m)}${m === ctx.currentMonth ? ' (en cours)' : ''}`,
      kpiId: 'PU-S-23',
      big: volume(used),
      caption: `${reseller ? `${networkLabel(reseller)} · par client` : 'par revendeur'} · dépassement ${plusVolume(exc)}`,
      table: {
        headers: [reseller ? 'Client' : 'Revendeur', 'Consommation', 'Forfait (installées)', 'Dépassement'],
        rows: rows.map((x) => [reseller ? x.k : networkLabel(x.k), volume(x.p.used), x.p.quota ? volume(x.p.quota) : '—', x.p.excess > 0.5 ? plusVolume(x.p.excess) : '—'])
      },
      definition: 'Forfait = forfait mensuel des puces installées aujourd’hui (historique des installations à confirmer back-end). Dépassement = Σ MAX(0, conso du mois − forfait) par puce.'
    });
  };

  return (
    <section aria-labelledby="pu-stats" className="space-y-3">
      <SectionTitle id="pu-stats" title="Statistiques puces" hint="Cliquez sur une barre, une couleur ou un mois pour voir le détail" />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* PU-S-22 (S-22) */}
        <Block id="pu-s22" kpiId="PU-S-22" title="Statut des puces" sub={`${fmt(data.installed)} puce(s) sur ${fmt(data.total)} sont dans un équipement posé · cliquez sur une couleur`}>
          <StackedBar
            ariaLabel="Statut des puces"
            height="lg"
            total={data.total}
            onSegmentClick={(k) => onStatus(k === 'ins')}
            segments={[
              { key: 'ins', label: 'Installée', value: data.installed, tone: 'series1' },
              { key: 'non', label: 'Non installée', value: data.notInstalled, tone: 'warning' }
            ]}
          />
          <Legend
            items={[
              { tone: 'series1', label: `Installée : ${fmt(data.installed)} (${pct(data.installed, data.total)} %)` },
              { tone: 'warning', label: `Non installée : ${fmt(data.notInstalled)} (${pct(data.notInstalled, data.total)} %)` }
            ]}
          />
        </Block>

        {/* PU-S-21 (S-21) */}
        <Block id="pu-s21" kpiId="PU-S-21" title="Puces installées par offre" sub="Pour chaque offre : puces installées / total · cliquez sur une offre">
          <div className="space-y-3">
            {data.offers.map((o) => (
              <div key={o.key} className="space-y-1">
                <button
                  type="button"
                  onClick={() => onOffer(o)}
                  className="flex w-full items-baseline justify-between gap-2 text-left text-small focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus rounded-control"
                >
                  <span className="font-medium text-text">
                    {o.name} <span className="font-normal text-text-muted">· {o.operator}</span>
                  </span>
                  <span className="tabular-nums text-text">
                    {fmt(o.installed)} / {fmt(o.sims)}
                  </span>
                </button>
                <StackedBar
                  ariaLabel={`${o.name} : installées et non installées`}
                  total={o.sims}
                  onSegmentClick={() => onOffer(o)}
                  segments={[
                    { key: 'ins', label: 'Installées', value: o.installed, tone: 'series1' },
                    { key: 'non', label: 'Non installées', value: o.sims - o.installed, tone: 'warning' }
                  ]}
                />
              </div>
            ))}
            <Legend items={[{ tone: 'series1', label: 'Installées' }, { tone: 'warning', label: 'Non installées' }]} />
          </div>
        </Block>

        {/* PU-C-22 (C-22) */}
        <Block id="pu-c22" kpiId="PU-C-22" title="Consommation par opérateur" sub={`${period.label} · volume consommé par opérateur · cliquez sur une barre pour voir ses puces`}>
          <HorizontalBarList
            ariaLabel="Consommation par opérateur"
            rows={data.operators.map((o, i) => ({
              key: o.operator,
              label: o.operator,
              sub: `${fmt(o.active)} puces actives sur ${fmt(o.sims)}`,
              value: o.used,
              valueLabel: volume(o.used),
              tone: SERIES[i % 4],
              extra: (
                <span className="w-24 shrink-0 text-right text-mention text-text-muted" title="Volume au-delà du forfait">
                  {o.excess > 0.5 ? <b className="text-danger-700">{plusVolume(o.excess)}</b> : '0 Mo'}
                  <span className="block">en trop</span>
                </span>
              )
            }))}
            onRowClick={(k) => {
              const o = data.operators.find((x) => x.operator === k);
              if (o) onOperator(o);
            }}
          />
        </Block>

        {/* PU-S-23 (S-23) */}
        <Block
          id="pu-s23"
          kpiId="PU-S-23"
          title="Évolution de la consommation"
          sub={
            <>
              {reseller ? `${networkLabel(reseller)} · barres par mois et forfait des puces installées` : 'Un trait par revendeur'} · janv. → {formatMonthFr(ctx.currentMonth)}
              {!reseller && peaks[0] && (
                <span className="block font-medium text-danger-700">
                  Pic de surconsommation : {formatMonthShortFr(peaks[0].month)} · {networkLabel(peaks[0].network)} {plusVolume(peaks[0].excess)}
                </span>
              )}
              {reseller && topFocus.length > 0 && (
                <span className="block font-medium text-danger-700">
                  Mois les plus dépassés : {topFocus.map((p) => `${formatMonthShortFr(p.month)} ${plusVolume(p.excess)}`).join(' · ')}
                </span>
              )}
            </>
          }
          right={
            <label className="inline-flex items-center gap-2 text-small text-text">
              Revendeur
              <select
                value={reseller}
                onChange={(e) => {
                  setReseller(e.target.value);
                  setSelMonth(null);
                }}
                className="h-control px-2 border border-border-strong rounded-control bg-surface text-small focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
              >
                <option value="">Tous les revendeurs</option>
                {lineNetworks.map((n) => (
                  <option key={n} value={n}>
                    {networkLabel(n)}
                  </option>
                ))}
              </select>
            </label>
          }
        >
          {reseller ? (
            <BarChart
              ariaLabel={`Consommation mensuelle de ${networkLabel(reseller)}`}
              height={200}
              data={focusPts.map((p, i) => ({ label: labels[i].replace(' (en cours)', '*'), value: Math.round(p.used / 1024), tone: p.quota > 0 && p.used > p.quota ? 'warning' : 'series1' }))}
              formatValue={(n) => `${fmt(n)} Go`}
              refLine={focusQuota ? { value: Math.round(focusQuota / 1024), label: `forfait ${volume(focusQuota)}` } : undefined}
              selectedIndex={selMonth}
              onBarClick={openMonth}
            />
          ) : (
            <LineChart
              ariaLabel="Évolution de la consommation par revendeur"
              labels={labels.map((l) => l.replace(' (en cours)', '*'))}
              series={lineNetworks.map((n, i) => ({
                key: n,
                label: networkLabel(n),
                tone: SERIES[i],
                values: (byNetwork.get(n) ?? []).map((p) => Math.round(p.used / 1024))
              }))}
              formatValue={(n) => `${fmt(n)} Go`}
              selectedIndex={selMonth}
              onPointClick={openMonth}
            />
          )}
          <div className="flex flex-wrap items-center justify-between gap-2">
            {reseller ? (
              <Legend items={[{ tone: 'series1', label: 'Sous le forfait' }, { tone: 'warning', label: 'Au-dessus du forfait' }]} />
            ) : (
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {lineNetworks.map((n, i) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setReseller(n)}
                    className="inline-flex items-center gap-1.5 text-mention text-text-muted hover:text-text focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus rounded-control"
                  >
                    <Legend items={[{ tone: SERIES[i], label: networkLabel(n) }]} />
                  </button>
                ))}
              </div>
            )}
            <span className="text-mention text-text-muted">* mois en cours, partiel</span>
          </div>
        </Block>
      </div>
    </section>
  );
}
