import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DonutRing, HorizontalBarList, Legend } from '../charts';
import { formatMonthFr } from '../../state/mock/dates';
import { BACKOFFICE_ROUTE_PATHS, type BackofficeRouteKey } from '../../utils/backofficePermissions';
import { fmt, pct, volume, type DashboardData, type ParkRow } from '../../utils/dashboardKpis';
import { Panel } from '../shell/PageShell';
import { Button } from '../ui/Button';
import type { DetailSpec } from './DetailModal';

const ratio = (r: ParkRow) => pct(r.connected, r.installed);

function readShown(key: string): string[] | null {
  try {
    const raw = window.localStorage.getItem(key);
    const v = raw ? JSON.parse(raw) : null;
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : null;
  } catch {
    return null;
  }
}
function writeShown(key: string, list: string[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(list));
  } catch {
    // poste sans stockage : le choix n'est simplement pas gardé
  }
}

/**
 * TDB-D-09 (vue Tunav : un anneau par revendeur, « + Revendeur ») /
 * TDB-R-07 (vue revendeur : un anneau par client, « + Client », recherche, « Les 6 à surveiller »).
 * Centre = % des installés connectés ; parts = connectés / non connectés / non installés des vendus ; < 60 % = fond rouge clair.
 */
export function ParkHealthRings({
  data,
  storageKey,
  onOpenDetail
}: {
  data: DashboardData;
  storageKey: string;
  onOpenDetail: (d: DetailSpec) => void;
}) {
  const isNetwork = data.scope.kind === 'network';
  const rows = data.parkRows;
  const DEF_COUNT = 6;
  const byPct = (a: ParkRow, b: ParkRow) => ratio(a) - ratio(b) || b.installed - a.installed;
  const defaults = useMemo(() => {
    if (isNetwork) return rows.map((r) => r.key);
    // les 6 clients à surveiller : plus faible % connectés, au moins 5 installés (complété si moins de 6)
    const eligible = rows.filter((r) => r.installed >= 5).sort(byPct);
    const others = rows.filter((r) => r.installed > 0 && r.installed < 5).sort(byPct);
    return [...eligible, ...others].slice(0, DEF_COUNT).map((r) => r.key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, isNetwork]);
  const [shown, setShown] = useState<string[]>(() => {
    const saved = readShown(storageKey);
    return saved && saved.some((k) => rows.some((r) => r.key === k)) ? saved : defaults;
  });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState('');
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pickerOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setPickerOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setPickerOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [pickerOpen]);

  const update = (next: string[]) => {
    if (!next.length) return; // au moins un reste affiché
    setShown(next);
    writeShown(storageKey, next);
  };

  const visible = rows.filter((r) => shown.includes(r.key) && r.sold > 0).sort((a, b) => byPct(b, a));
  const worst = visible[visible.length - 1];
  const what = isNetwork ? 'revendeur' : 'client';
  const sorted = [...rows].sort((a, b) => a.label.localeCompare(b.label, 'fr'));
  const filtered = query.trim() ? sorted.filter((r) => r.label.toLowerCase().includes(query.trim().toLowerCase())) : sorted;
  const openRow = (r: ParkRow) =>
    onOpenDetail({
      title: r.label,
      kpiId: isNetwork ? 'TDB-D-09' : 'TDB-R-07',
      big: `${ratio(r)} %`,
      caption: `${fmt(r.connected)} / ${fmt(r.installed)} installés · ${fmt(r.sold)} vendus`,
      table: {
        headers: ['État', 'Équipements', '%'],
        rows: [
          ['Installés', r.installed, `${pct(r.installed, r.sold)} % des vendus`],
          ['Non installés', r.notInstalled, `${pct(r.notInstalled, r.sold)} % des vendus`],
          ['Connectés', r.connected, `${pct(r.connected, r.installed)} % des installés`],
          ['Non connectés', r.notConnected, `${pct(r.notConnected, r.installed)} % des installés`]
        ]
      },
      note:
        r.sims != null ? (
          <p>
            Puces : <b>{fmt(r.simsInstalled ?? 0)} / {fmt(r.sims)}</b> installées ({pct(r.simsInstalled ?? 0, r.sims)} %).
          </p>
        ) : undefined,
      route: isNetwork ? 'equipments' : 'clients',
      routeLabel: isNetwork ? 'Équipements' : 'Gestion Clients',
      // FleetIQ 07 : Équipements pré-filtré sur le revendeur ; Gestion Clients ouvre la fiche du client
      routeQuery: isNetwork ? `?revendeur=${encodeURIComponent(r.key)}` : undefined
    });

  const picker = (
    <div className="relative" ref={pickerRef}>
      <Button
        type="button"
        variant="secondary"
        aria-expanded={pickerOpen}
        aria-controls={`${storageKey}-picker`}
        onClick={() => setPickerOpen((o) => !o)}
      >
        <Plus size={16} aria-hidden="true" />
        {isNetwork ? 'Revendeur' : 'Client'}
      </Button>
      {pickerOpen && (
        <div
          id={`${storageKey}-picker`}
          role="dialog"
          aria-label={`Choisir les ${what}s affichés`}
          className="absolute right-0 z-30 mt-2 w-72 rounded-card border border-border-strong bg-surface p-3 shadow-raised space-y-2"
        >
          <p className="text-small font-semibold text-text">{isNetwork ? 'Revendeurs' : 'Clients'} affichés</p>
          {rows.length > 8 && (
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Rechercher un ${what}`}
              aria-label={`Rechercher un ${what}`}
              className="w-full h-control px-3 border border-border-strong rounded-control text-small focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
            />
          )}
          <div className="flex items-center justify-between text-mention text-text-muted">
            <span>
              {shown.length} affiché(s) sur {rows.length}
            </span>
            {!isNetwork && (
              <button type="button" onClick={() => update(defaults)} className="font-medium text-primary hover:underline">
                Les {DEF_COUNT} à surveiller
              </button>
            )}
          </div>
          <div className="max-h-64 overflow-y-auto divide-y divide-border-subtle">
            {filtered.map((r) => (
              <label key={r.key} className="flex items-center gap-2 py-1.5 text-small text-text cursor-pointer">
                <input
                  type="checkbox"
                  checked={shown.includes(r.key)}
                  onChange={(e) => update(e.target.checked ? [...shown, r.key] : shown.filter((k) => k !== r.key))}
                  className="h-4 w-4 accent-primary"
                />
                <span className="flex-1 truncate">{r.label}</span>
                <span className="text-mention text-text-muted font-qty">
                  {ratio(r)} % · {fmt(r.sold)} éq.
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Panel
      title={isNetwork ? 'Revendeurs : santé du parc' : 'Mes clients : santé du parc'}
      actions={picker}
      bodyClassName="p-4 space-y-4"
    >
      <Legend
        items={[
          { tone: 'success', label: 'Connectés' },
          { tone: 'danger', label: 'Non connectés' },
          { tone: 'warning', label: 'Non installés' }
        ]}
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {visible.map((r) => {
          const low = ratio(r) < 60;
          return (
            <button
              key={r.key}
              type="button"
              onClick={() => openRow(r)}
              aria-label={`${r.label} : ${ratio(r)} % des installés connectés, ${fmt(r.sold)} vendus`}
              className={`flex flex-col items-center gap-1 rounded-card border border-border p-3 transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus hover:border-border-strong ${
                low ? 'shadow-rail-danger bg-surface' : 'bg-surface'
              }`}
            >
              <DonutRing
                total={r.sold}
                centerLabel={`${ratio(r)} %`}
                centerSub="connectés"
                segments={[
                  { label: 'Connectés', value: r.connected, tone: 'success' },
                  { label: 'Non connectés', value: r.notConnected, tone: 'danger' },
                  { label: 'Non installés', value: r.notInstalled, tone: 'warning' }
                ]}
              />
              <span className="text-small font-medium text-text text-center leading-tight">{r.label}</span>
              <span className="text-mention text-text-muted font-qty">{fmt(r.sold)} vendus</span>
            </button>
          );
        })}
      </div>
      {worst && (
        <p className="text-small text-text">
          À regarder en premier : <b>{worst.label}</b>, seulement {ratio(worst)} % de ses équipements installés sont connectés.
        </p>
      )}
    </Panel>
  );
}

/** TDB-D-10 (Packs les plus choisis) / TDB-R-08 (Mes clients par pack). Aucun prix. */
export function TopPacksCard({ data, onOpenDetail }: { data: DashboardData; onOpenDetail: (d: DetailSpec) => void }) {
  const isNetwork = data.scope.kind === 'network';
  const rows = data.packRank;
  const tot = data.packClientsTotal;
  const viaRes = pct(
    rows.reduce((s, r) => s + r.resellers, 0),
    tot
  );
  const lead = rows[0];
  return (
    <Panel
      title={isNetwork ? 'Packs les plus choisis' : 'Mes clients par pack'}
      hint={isNetwork ? `Nombre de clients par pack (${fmt(tot)} packs en cours)` : `Pack actuel de chaque client (${fmt(tot)} clients)`}
      bodyClassName="p-4 space-y-4"
    >
      <HorizontalBarList
        ranked
        ariaLabel={isNetwork ? 'Packs les plus choisis' : 'Mes clients par pack'}
        rows={rows.map((r) => ({
          key: String(r.packId),
          label: r.name,
          sub: isNetwork ? `${r.tunav} chez Tunav, ${r.resellers} via les revendeurs` : `${fmt(r.equipments)} équipements`,
          value: r.clients,
          valueLabel: `${fmt(r.clients)} clients`
        }))}
        onRowClick={(key) => {
          const r = rows.find((x) => String(x.packId) === key);
          if (!r) return;
          onOpenDetail({
            title: r.name,
            kpiId: isNetwork ? 'TDB-D-10' : 'TDB-R-08',
            big: fmt(r.clients),
            caption: `clients · ${pct(r.clients, tot)} % du total`,
            route: isNetwork ? 'subscriptions' : 'clients',
            routeLabel: isNetwork ? 'Packs' : 'Gestion Clients',
            // FleetIQ 08 / 06 : la page cible s'ouvre filtrée sur ce pack
            routeQuery: `?pack=${r.packId}`
          });
        }}
      />
      <p className="text-small text-text">
        {isNetwork ? (
          <>
            {viaRes} % des packs sont vendus par les revendeurs.
            {data.topReseller && (
              <>
                {' '}
                <b>{data.topReseller.name}</b> est le revendeur n°1 ({fmt(data.topReseller.packs)} packs).
              </>
            )}
          </>
        ) : (
          lead && (
            <>
              <b>{lead.name}</b> est le pack le plus choisi par vos clients.
            </>
          )
        )}
      </p>
    </Panel>
  );
}

/** TDB-D-11 – Puces en surconsommation par revendeur (dernier mois complet, vue Tunav). Volumes, aucun prix. */
export function SimOverCard({
  data,
  onOpenDetail,
  canOpen
}: {
  data: DashboardData;
  onOpenDetail: (d: DetailSpec) => void;
  canOpen: (route: BackofficeRouteKey) => boolean;
}) {
  const navigate = useNavigate();
  const rows = data.overRows;
  const tot = rows.reduce((s, r) => s + r.overSims, 0);
  const totMB = rows.reduce((s, r) => s + r.excessMB, 0);
  const month = formatMonthFr(data.overMonth);
  const first = rows.find((r) => r.overSims > 0);
  return (
    <Panel
      title="Puces en surconsommation par revendeur"
      hint={`${month} · ${fmt(tot)} puces · +${volume(totMB)}`}
      actions={
        canOpen('sims') ? (
          <button
            type="button"
            onClick={() => navigate(`${BACKOFFICE_ROUTE_PATHS.sims}?periode=mois&mois=${data.overMonth}&detail=surconso`)}
            className="inline-flex items-center gap-1 text-small font-medium text-primary hover:underline underline-offset-2 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus rounded-control"
          >
            Voir plus de détails <ArrowRight size={14} aria-hidden="true" />
          </button>
        ) : undefined
      }
      bodyClassName="p-4 space-y-4"
    >
      <HorizontalBarList
        ariaLabel="Puces en surconsommation par revendeur"
        tone="danger"
        rows={rows.map((r) => ({
          key: r.reseller,
          label: r.label,
          sub: `${fmt(r.sims)} puces`,
          value: r.excessMB,
          valueLabel: `+${volume(r.excessMB)}`,
          extra: (
            <span className="w-28 shrink-0 text-right text-mention text-text-muted">
              <span className="block text-small font-semibold text-text font-qty">{fmt(r.overSims)} puce(s)</span>
              {pct(r.overSims, r.sims)} % de ses puces
            </span>
          )
        }))}
        onRowClick={(key) => {
          const r = rows.find((x) => x.reseller === key);
          if (!r) return;
          onOpenDetail({
            title: `Surconsommation · ${r.label}`,
            kpiId: 'TDB-D-11',
            big: fmt(r.overSims),
            caption: `puce(s) · +${volume(r.excessMB)} · ${pct(r.overSims, r.sims)} % de ${fmt(r.sims)}`,
            route: 'sims',
            routeLabel: 'Gestion des puces',
            // FleetIQ 09 : liste filtrée sur ce réseau et ce mois (PU-P-07 / PU-C-25)
            routeQuery: `?alerte=surconso&periode=mois&mois=${data.overMonth}&revendeur=${encodeURIComponent(r.reseller)}`,
            goLabel: 'Voir plus de détails'
          });
        }}
      />
      {first && (
        <p className="text-small text-text">
          Le plus gros dépassement : <b>{first.label}</b> (+{volume(first.excessMB)} sur {fmt(first.overSims)} puces).
        </p>
      )}
    </Panel>
  );
}
