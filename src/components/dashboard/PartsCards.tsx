import { useState } from 'react';
import { Legend, StackedBar, TONE_BG, type ChartTone } from '../charts';
import { fmt, pct, volume, type DashboardData, type ParkRow } from '../../utils/dashboardKpis';
import { formatMonthFr } from '../../state/mock/dates';
import type { DetailSpec } from './DetailModal';

type PartKey = 'total' | 'stock' | 'wait' | 'inst' | 'on' | 'off';

function TreeLine({
  level,
  branch,
  tone,
  label,
  sub,
  value,
  share,
  onClick
}: {
  level: 0 | 1 | 2;
  branch?: string;
  tone?: ChartTone;
  label: string;
  sub?: string;
  value: number;
  share: string;
  onClick: () => void;
}) {
  const indent = level === 0 ? '' : level === 1 ? 'pl-4' : 'pl-10';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 py-2 pr-2 text-left rounded-control hover:bg-primary-50 transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus ${indent}`}
    >
      {branch && (
        <span className="font-mono text-small text-text-muted" aria-hidden="true">
          {branch}
        </span>
      )}
      <span className={`h-2.5 w-2.5 shrink-0 rounded-pill ${tone ? TONE_BG[tone] : 'bg-transparent'}`} aria-hidden="true" />
      <span className="flex-1 min-w-0">
        <span className={`block text-small text-text ${level === 0 ? 'font-semibold' : 'font-medium'}`}>{label}</span>
        {sub && <span className="block text-mention text-text-muted">{sub}</span>}
      </span>
      <span className="w-16 text-right text-small font-semibold text-text tabular-nums">{fmt(value)}</span>
      <span className="w-32 text-right text-mention text-text-muted">{share}</span>
    </button>
  );
}

/** TDB-D-07 (vue Tunav) / TDB-R-06 (vue revendeur) – Du stock au service : équipements découpés en parts. */
export function EquipmentPartsCard({
  data,
  onOpenDetail
}: {
  data: DashboardData;
  onOpenDetail: (d: DetailSpec) => void;
}) {
  const isNetwork = data.scope.kind === 'network';
  const [sel, setSel] = useState<string>('*');
  const rows = data.parkRows;
  const x: ParkRow = sel === '*' ? data.parkAll : rows.find((r) => r.key === sel) ?? data.parkAll;
  const stock = isNetwork && sel === '*' ? data.stock : 0;
  const total = x.sold + stock;
  const by = isNetwork ? 'Revendeur' : 'Client';
  const conn = `${fmt(data.connDays)} j`;

  // FleetIQ 07 : la page Équipements s'ouvre pré-filtrée (état + revendeur ou client choisi)
  const ETAT: Record<PartKey, string> = { total: '', stock: 'stock', wait: 'non_installe', inst: 'installe', on: 'connecte', off: 'non_connecte' };
  const queryFor = (k: PartKey) => {
    const parts = [ETAT[k] && `etat=${ETAT[k]}`, sel !== '*' && `${isNetwork ? 'revendeur' : 'proprietaire'}=${encodeURIComponent(sel)}`].filter(Boolean);
    return parts.length ? `?${parts.join('&')}` : '';
  };
  const open = (k: PartKey) => {
    const kpiId = isNetwork ? 'TDB-D-07' : 'TDB-R-06';
    if (k === 'stock') {
      onOpenDetail({
        title: 'En stock',
        kpiId,
        big: fmt(data.stock),
        caption: `équipements · ${pct(data.stock, total)} % du total`,
        what: 'Équipements pas encore vendus à un client : stock Tunav et stock des revendeurs.',
        table: { headers: ['Stock', 'Équipements'], rows: data.stockByNetwork.map((s) => [s.label, s.count]) },
        route: 'equipments',
        routeLabel: 'Équipements',
        routeQuery: '?etat=stock'
      });
      return;
    }
    const INFO: Record<Exclude<PartKey, 'stock'>, [string, string, (r: ParkRow) => number, (r: ParkRow) => number, string]> = {
      total: ['Total', isNetwork ? 'Tous les équipements vendus à un client (le stock est détaillé à part).' : 'Tous les équipements vendus à vos clients.', (r) => r.sold, (r) => r.sold, 'des vendus'],
      wait: ['Vendus, non installés', 'Vendus à un client mais pas encore posés dans un véhicule.', (r) => r.notInstalled, (r) => r.sold, 'de ses vendus'],
      inst: ['Installés', 'Posés dans un véhicule. Un installé est soit connecté, soit non connecté.', (r) => r.installed, (r) => r.sold, 'de ses vendus'],
      on: ['Connectés', `Installés et données reçues dans les ${conn} : le client a le service.`, (r) => r.connected, (r) => r.installed, 'de ses installés'],
      off: ['Non connectés', `Installés mais aucune donnée reçue depuis plus de ${conn} : le client n’a pas le service.`, (r) => r.notConnected, (r) => r.installed, 'de ses installés']
    };
    const [label, what, v, base, baseLabel] = INFO[k];
    const n = v(x) + (k === 'total' ? stock : 0);
    const tableRows: Array<Array<string | number>> = (sel === '*' ? rows : [x])
      .map((r) => [r.label, v(r), `${pct(v(r), base(r))} % ${baseLabel}`] as Array<string | number>)
      .sort((a, b) => (b[1] as number) - (a[1] as number));
    if (k === 'total' && stock) data.stockByNetwork.forEach((s) => tableRows.push([s.label, s.count, 'en stock']));
    onOpenDetail({
      title: `${label} · ${x.label}`,
      kpiId,
      big: fmt(n),
      caption: `équipements · ${k === 'on' || k === 'off' ? `${pct(n, x.installed)} % des installés` : `${pct(n, total)} % du total`}`,
      what,
      definition: 'Total = stock + vendus non installés + installés · Installés = connectés + non connectés.',
      formula: '% connectés = connectés ÷ installés',
      table: { headers: [by, 'Équipements', '%'], rows: tableRows },
      route: 'equipments',
      routeLabel: 'Équipements',
      routeQuery: queryFor(k)
    });
  };

  return (
    <div className="bg-surface rounded-card border border-border shadow-card p-5 space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-h4 text-text">
          Équipements : {fmt(total)} {stock ? 'au total' : 'vendus'}
        </h3>
        <span className="text-mention text-text-muted">état au {data.asOf.toLocaleDateString('fr-FR')}</span>
      </div>
      <div role="group" aria-label={`Filtrer par ${by.toLowerCase()}`} className="flex flex-wrap gap-2">
        {[data.parkAll, ...rows].map((r) => {
          const on = r.key === sel;
          return (
            <button
              key={r.key}
              type="button"
              aria-pressed={on}
              onClick={() => setSel(r.key)}
              className={`rounded-pill border px-3 py-1 text-mention font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus ${
                on ? 'bg-primary text-text-inverse border-primary' : 'bg-surface text-text border-border hover:bg-primary-50'
              }`}
            >
              {r.label}
            </button>
          );
        })}
      </div>
      <StackedBar
        ariaLabel="Équipements découpés en parts"
        total={total}
        onSegmentClick={(k) => open(k as PartKey)}
        segments={[
          { key: 'on', label: 'Connectés', value: x.connected, tone: 'success' },
          { key: 'off', label: 'Non connectés', value: x.notConnected, tone: 'danger' },
          { key: 'wait', label: 'Vendus, non installés', value: x.notInstalled, tone: 'warning' },
          { key: 'stock', label: 'En stock', value: stock, tone: 'neutral' }
        ]}
      />
      <Legend
        items={[
          { tone: 'success', label: 'Connectés' },
          { tone: 'danger', label: 'Non connectés' },
          { tone: 'warning', label: 'Vendus, non installés' },
          ...(stock ? [{ tone: 'neutral' as const, label: 'En stock' }] : [])
        ]}
      />
      <div>
        <TreeLine level={0} label={stock ? 'Total' : 'Total vendus'} value={total} share="100 %" onClick={() => open('total')} />
        {stock > 0 && (
          <TreeLine level={1} branch="├─" tone="neutral" label="En stock" sub="Tunav et revendeurs, pas encore vendus" value={stock} share={`${pct(stock, total)} % du total`} onClick={() => open('stock')} />
        )}
        <TreeLine level={1} branch="├─" tone="warning" label="Vendus, non installés" sub="pas encore posés dans un véhicule" value={x.notInstalled} share={`${pct(x.notInstalled, total)} % du total`} onClick={() => open('wait')} />
        <TreeLine level={1} branch="└─" label="Installés" sub="posés dans un véhicule" value={x.installed} share={`${pct(x.installed, total)} % du total`} onClick={() => open('inst')} />
        <TreeLine level={2} branch="├─" tone="success" label="Connectés" sub={`données reçues dans les ${conn}`} value={x.connected} share={`${pct(x.connected, x.installed)} % des installés`} onClick={() => open('on')} />
        <TreeLine level={2} branch="└─" tone="danger" label="Non connectés" sub={`aucune donnée depuis plus de ${conn}`} value={x.notConnected} share={`${pct(x.notConnected, x.installed)} % des installés`} onClick={() => open('off')} />
      </div>
      <p className="text-small text-text">
        {x.label} : sur <b>{fmt(x.installed)} installés</b>, <b className="text-success-700">{fmt(x.connected)} envoient des données</b> et{' '}
        <b className="text-danger-700">{fmt(x.notConnected)} n’envoient rien depuis plus de {conn}</b>. {fmt(x.notInstalled)} vendus attendent encore leur
        installation.
      </p>
    </div>
  );
}

/** TDB-D-08 – Du stock au service : puces (vue Tunav seulement, aucun prix). */
export function SimPartsCard({ data, onOpenDetail }: { data: DashboardData; onOpenDetail: (d: DetailSpec) => void }) {
  const total = data.simsTotal;
  const ins = data.simsInstalled;
  const non = total - ins;
  const over = data.overRows.reduce((s, r) => s + r.overSims, 0);
  const overMB = data.overRows.reduce((s, r) => s + r.excessMB, 0);
  const open = (k: 'all' | 'ins' | 'non') => {
    const INFO = {
      all: ['Toutes les puces', 'Puces avec un abonnement en cours.', (r: ParkRow) => r.sims ?? 0, total],
      ins: ['Puces installées', 'La puce est dans un équipement posé dans un véhicule.', (r: ParkRow) => r.simsInstalled ?? 0, ins],
      non: ['Puces non installées', 'La puce est dans un équipement pas encore posé, ou en stock.', (r: ParkRow) => (r.sims ?? 0) - (r.simsInstalled ?? 0), non]
    } as const;
    const [title, what, v, n] = INFO[k];
    onOpenDetail({
      title,
      kpiId: 'TDB-D-08',
      big: fmt(n),
      caption: `puces · ${pct(n, total)} % du total`,
      what,
      definition: 'Total = installées + non installées. Une puce est toujours dans un équipement ou en stock.',
      formula: 'Installée = puce affectée à un équipement installé',
      table: {
        headers: ['Revendeur', 'Puces', '%'],
        rows: data.parkRows
          .map((r) => [r.label, v(r), `${pct(v(r), r.sims ?? 0)} % de ses puces`] as Array<string | number>)
          .sort((a, b) => (b[1] as number) - (a[1] as number))
      },
      route: 'sims',
      routeLabel: 'Gestion des puces',
      // FleetIQ 09 : Gestion des puces pré-filtrée (statut)
      routeQuery: k === 'ins' ? '?statut=installee' : k === 'non' ? '?statut=non_installee' : undefined
    });
  };
  return (
    <div className="bg-surface rounded-card border border-border shadow-card p-5 space-y-4">
      <h3 className="text-h4 text-text">Puces : {fmt(total)} au total</h3>
      <StackedBar
        ariaLabel="Puces découpées en parts"
        total={total}
        onSegmentClick={(k) => open(k as 'ins' | 'non')}
        segments={[
          { key: 'ins', label: 'Installées', value: ins, tone: 'success' },
          { key: 'non', label: 'Non installées', value: non, tone: 'warning' }
        ]}
      />
      <Legend items={[{ tone: 'success', label: 'Installées' }, { tone: 'warning', label: 'Non installées' }]} />
      <div>
        <TreeLine level={0} label="Total" value={total} share="100 %" onClick={() => open('all')} />
        <TreeLine level={1} branch="├─" tone="success" label="Installées" sub="dans un équipement installé" value={ins} share={`${pct(ins, total)} %`} onClick={() => open('ins')} />
        <TreeLine level={1} branch="└─" tone="warning" label="Non installées" sub="dans un équipement pas encore installé, ou en stock" value={non} share={`${pct(non, total)} %`} onClick={() => open('non')} />
      </div>
      <button
        type="button"
        onClick={() =>
          onOpenDetail({
            title: 'Puces en surconsommation',
            kpiId: 'TDB-D-11',
            big: fmt(over),
            caption: `puces au-delà de leur forfait en ${formatMonthFr(data.overMonth)} · +${volume(overMB)}`,
            table: {
              headers: ['Revendeur', 'Puces', 'Dépassement'],
              rows: data.overRows.map((r) => [r.label, r.overSims, `+${volume(r.excessMB)}`])
            },
            route: 'sims',
            routeLabel: 'Gestion des puces',
            routeQuery: `?alerte=surconso&periode=mois&mois=${data.overMonth}`,
            goLabel: 'Voir plus de détails'
          })
        }
        className="inline-flex items-center gap-2 text-small font-medium text-danger-700 hover:underline underline-offset-2 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus rounded-control"
      >
        <span className="h-2 w-2 rounded-pill bg-danger" aria-hidden="true" />
        {fmt(over)} en surconsommation ({formatMonthFr(data.overMonth)}) →
      </button>
    </div>
  );
}
