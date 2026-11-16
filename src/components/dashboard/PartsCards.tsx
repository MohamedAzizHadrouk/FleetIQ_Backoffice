import { useState } from 'react';
import { Legend, StackedBar, TONE_BG, type ChartTone } from '../charts';
import { fmt, pct, volume, type DashboardData, type ParkRow } from '../../utils/dashboardKpis';
import { formatMonthFr } from '../../state/mock/dates';
import { Panel } from '../shell/PageShell';
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
      className={`flex w-full items-center gap-3 py-2 pr-2 text-left rounded-control hover:bg-surface-muted transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus ${indent}`}
    >
      {branch && (
        <span className="text-small text-text-muted tracking-wide" aria-hidden="true">
          {branch}
        </span>
      )}
      <span className={`h-2.5 w-2.5 shrink-0 rounded-[1px] ${tone ? TONE_BG[tone] : 'bg-transparent'}`} aria-hidden="true" />
      <span className="flex-1 min-w-0">
        <span className={`block text-small text-text ${level === 0 ? 'font-semibold' : 'font-medium'}`}>{label}</span>
        {sub && <span className="block text-mention text-text-muted">{sub}</span>}
      </span>
      <span className="w-16 text-right text-small font-semibold text-text font-qty">{fmt(value)}</span>
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
        route: 'equipments',
        routeLabel: 'Équipements',
        routeQuery: '?etat=stock'
      });
      return;
    }
    const INFO: Record<Exclude<PartKey, 'stock'>, [string, (r: ParkRow) => number, (r: ParkRow) => number, string]> = {
      total: ['Total', (r) => r.sold, (r) => r.sold, 'des vendus'],
      wait: ['Vendus, non installés', (r) => r.notInstalled, (r) => r.sold, 'de ses vendus'],
      inst: ['Installés', (r) => r.installed, (r) => r.sold, 'de ses vendus'],
      on: ['Connectés', (r) => r.connected, (r) => r.installed, 'de ses installés'],
      off: ['Non connectés', (r) => r.notConnected, (r) => r.installed, 'de ses installés']
    };
    const [label, v, base, baseLabel] = INFO[k];
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
      table: { headers: [by, 'Équipements', '%'], rows: tableRows },
      route: 'equipments',
      routeLabel: 'Équipements',
      routeQuery: queryFor(k)
    });
  };

  return (
    <Panel
      title={`Équipements : ${fmt(total)} ${stock ? 'au total' : 'vendus'}`}
      hint={`état au ${data.asOf.toLocaleDateString('fr-FR')}`}
      bodyClassName="p-4 space-y-4"
    >
      <div role="group" aria-label={`Filtrer par ${by.toLowerCase()}`} className="flex flex-wrap gap-1.5">
        {[data.parkAll, ...rows].map((r) => {
          const on = r.key === sel;
          return (
            <button
              key={r.key}
              type="button"
              aria-pressed={on}
              onClick={() => setSel(r.key)}
              className={`rounded-pill border px-2.5 py-1 text-mention transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus ${
                on ? 'bg-primary-50 text-primary-hover border-accent font-semibold' : 'bg-surface text-[#334155] border-border-strong hover:border-accent'
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
          <TreeLine level={1} branch="├─" tone="neutral" label="En stock chez Tunav" sub="pas encore vendus" value={stock} share={`${pct(stock, total)} % du total`} onClick={() => open('stock')} />
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
    </Panel>
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
      all: ['Toutes les puces', (r: ParkRow) => r.sims ?? 0, total],
      ins: ['Puces installées', (r: ParkRow) => r.simsInstalled ?? 0, ins],
      non: ['Puces non installées', (r: ParkRow) => (r.sims ?? 0) - (r.simsInstalled ?? 0), non]
    } as const;
    const [title, v, n] = INFO[k];
    onOpenDetail({
      title,
      kpiId: 'TDB-D-08',
      big: fmt(n),
      caption: `puces · ${pct(n, total)} % du total`,
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
    <Panel title={`Puces : ${fmt(total)} au total`} bodyClassName="p-4 space-y-4">
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
        <span className="h-2.5 w-2.5 rounded-[1px] bg-danger" aria-hidden="true" />
        {fmt(over)} en surconsommation ({formatMonthFr(data.overMonth)}) →
      </button>
    </Panel>
  );
}
