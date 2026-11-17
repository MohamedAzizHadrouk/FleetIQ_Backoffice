/**
 * Packs vendus aux revendeurs (maquette Packs-v3, vue Tunav) : tableau propriétaire × pack,
 * Tunav direct en ligne de référence, totaux, part du total ; le clic sur une case liste les clients à droite.
 */
import { useMemo, useState, type ReactNode } from 'react';
import type { Pack } from '../../state/FleetStore';
import { fmt, frDate, pct, type PacksData, type PkClient } from '../../utils/packsKpis';

type Mode = 'all' | 'period';
type Sale = { client: PkClient; pack: Pack; date: Date | null };

const DIRECT = 'Tunav (direct)';
const OWNER_DOT = ['#2563EB', '#D97706', '#7C3AED', '#DB2777', '#0891B2', '#65A30D'];

export function ResellerPacksSection({ data, periodLabel }: { data: PacksData; periodLabel: string }) {
  const [mode, setMode] = useState<Mode>('all');
  const packs = useMemo(() => data.packRows.map((r) => r.pack), [data.packRows]);

  const sales: Sale[] = useMemo(() => {
    if (mode === 'period') return data.periodSales.map((s) => ({ client: s.client, pack: s.pack, date: s.date }));
    const latest = new Map<string, Date>();
    for (const s of data.sales) {
      const k = `${s.client.client.id}|${s.pack.id}`;
      if (!latest.has(k)) latest.set(k, s.date);
    }
    return data.clients.flatMap((c) =>
      c.packs.map((p) => ({ client: c, pack: p, date: latest.get(`${c.client.id}|${p.id}`) ?? c.firstAssignedAt }))
    );
  }, [mode, data]);

  const resellers = useMemo(
    () => Array.from(new Set(data.clients.map((c) => c.owner).filter((o) => o !== DIRECT))).sort((a, b) => a.localeCompare(b, 'fr')),
    [data.clients]
  );
  const n = (owner: string | null, packId = 0) =>
    sales.filter((s) => (owner === null ? s.client.owner !== DIRECT : s.client.owner === owner) && (!packId || s.pack.id === packId)).length;
  const totR = n(null);
  const totD = n(DIRECT);
  const all = totR + totD;
  const topPack = packs.map((p) => ({ p, k: n(null, p.id) })).sort((a, b) => b.k - a.k)[0];
  const topRes = resellers.map((o) => ({ o, k: n(o) })).sort((a, b) => b.k - a.k)[0];

  const [sel, setSel] = useState<{ o: string; p: number } | null>(null);
  const cur = sel ?? { o: topRes?.o ?? DIRECT, p: 0 };
  const list = sales
    .filter((s) => s.client.owner === cur.o && (!cur.p || s.pack.id === cur.p))
    .sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0));

  const cellCls = (on: boolean, k: number) =>
    `cursor-pointer text-center font-mono ${on ? 'bg-primary-50 font-semibold text-primary-hover shadow-[inset_0_0_0_2px_#2563EB]' : k ? 'hover:bg-primary-50' : 'text-text-muted'}`;
  const share = (t: number, color: string) => (
    <span className="flex items-center gap-2 text-mention text-text-muted">
      <span className="relative block h-1.5 w-16 rounded-[4px] bg-[#EEF2F7]">
        <span className="absolute inset-y-0 left-0 rounded-[4px]" style={{ width: `${pct(t, all)}%`, background: color }} />
      </span>
      {pct(t, all)} %
    </span>
  );
  const row = (owner: string, label: ReactNode, color: string, cls = '') => {
    const t = n(owner);
    return (
      <tr key={owner} className={cls}>
        <td className="whitespace-nowrap">{label}</td>
        {packs.map((p) => {
          const k = n(owner, p.id);
          return (
            <td key={p.id} className={cellCls(cur.o === owner && cur.p === p.id, k)} onClick={() => setSel({ o: owner, p: p.id })}>
              {k || '—'}
            </td>
          );
        })}
        <td className={cellCls(cur.o === owner && !cur.p, t)} onClick={() => setSel({ o: owner, p: 0 })}>
          <b>{t}</b>
        </td>
        <td>{share(t, color)}</td>
      </tr>
    );
  };
  const totRow = (label: string, f: (packId: number) => number, t: number) => (
    <tr className="bg-surface-muted font-semibold">
      <td>{label}</td>
      {packs.map((p) => (
        <td key={p.id} className="text-center font-mono">
          {f(p.id) || '—'}
        </td>
      ))}
      <td className="text-center font-mono">{t}</td>
      <td className="text-mention text-text-muted">{pct(t, all)} %</td>
    </tr>
  );
  const dot = (c: string) => <i className="mr-1.5 inline-block h-2 w-2 rounded-pill align-middle" style={{ background: c }} />;
  const pill = (on: boolean) =>
    `rounded-pill border px-2.5 py-1 text-mention ${on ? 'border-accent bg-primary-50 font-semibold text-primary-hover' : 'border-border-strong bg-surface text-[#334155] hover:border-accent'}`;

  return (
    <div className="grid grid-cols-1 gap-4 rounded-card border border-border bg-surface p-4 2xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className="min-w-0 space-y-3">
        <p className="text-small text-text-muted">
          <b className="font-mono text-text">{fmt(totR)}</b> pack(s) {mode === 'all' ? 'vendus' : `vendus (${periodLabel})`} via les revendeurs ·{' '}
          <b className="font-mono text-text">{pct(totR, all)} %</b> du total (vs {fmt(totD)} en direct Tunav)
          <br />
          Pack le plus revendu : <b className="text-text">{topPack?.k ? `${topPack.p.name} (${topPack.k})` : '—'}</b> · Revendeur n°1 :{' '}
          <b className="text-text">{topRes?.k ? `${topRes.o} (${topRes.k})` : '—'}</b>
        </p>
        <div className="overflow-x-auto">
          <table className="fiq-table">
            <thead>
              <tr>
                <th>Propriétaire</th>
                {packs.map((p) => (
                  <th key={p.id} className="!text-center">
                    {p.name}
                  </th>
                ))}
                <th className="!text-center">Total</th>
                <th className="min-w-[120px]">Part du total</th>
              </tr>
            </thead>
            <tbody>
              {row(DIRECT, <>{dot('#64748B')}<b>Tunav</b> <small className="text-text-muted">direct</small></>, '#64748B')}
              {resellers.map((o, i) => row(o, <>{dot(OWNER_DOT[i % OWNER_DOT.length])}<b>{o}</b></>, OWNER_DOT[i % OWNER_DOT.length]))}
              {totRow('Total revendeurs', (id) => n(null, id), totR)}
              {totRow('Total (Tunav + revendeurs)', (id) => n(null, id) + n(DIRECT, id), all)}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-mention text-text-muted">
          <span>Compter :</span>
          <button type="button" aria-pressed={mode === 'all'} className={pill(mode === 'all')} onClick={() => setMode('all')}>
            Tous les packs en cours
          </button>
          <button type="button" aria-pressed={mode === 'period'} className={pill(mode === 'period')} onClick={() => setMode('period')}>
            Vendus sur la période ({periodLabel})
          </button>
        </div>
      </div>
      <div className="min-w-0 rounded-card border border-border">
        <div className="flex items-baseline justify-between gap-2 border-b border-border px-3 py-2.5 text-small">
          <span>
            <b>{cur.o === DIRECT ? 'Tunav (direct)' : cur.o}</b> · {cur.p ? packs.find((p) => p.id === cur.p)?.name : 'Tous les packs'}
          </span>
          <span className="text-mention text-text-muted">{fmt(list.length)} pack(s) vendu(s)</span>
        </div>
        {list.length ? (
          <div className="max-h-[360px] overflow-auto">
            <table className="fiq-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Pack</th>
                  <th>Vendu le</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {list.map((s, i) => (
                  <tr key={`${s.client.client.id}-${s.pack.id}-${i}`}>
                    <td>{s.client.client.name}</td>
                    <td>{s.pack.name}</td>
                    <td className="whitespace-nowrap">{frDate(s.date)}</td>
                    <td>
                      <span className={`rounded-pill px-2 py-0.5 text-[11.5px] font-semibold ${s.client.active ? 'bg-success-50 text-success-700' : 'bg-danger-50 text-danger-700'}`}>
                        {s.client.active ? 'Actif' : 'Bloqué'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-8 text-center text-small text-text-muted">Aucun pack vendu</p>
        )}
      </div>
    </div>
  );
}
