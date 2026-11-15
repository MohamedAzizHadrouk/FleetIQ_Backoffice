/** Petits utilitaires de dates (heure locale, sans dépendance). */

const DAY_MS = 24 * 60 * 60 * 1000;

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** AAAA-MM-JJ en heure locale */
export function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** AAAA-MM */
export function toIsoMonth(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

/** JJ/MM/AAAA HH:MM:SS (format de lastPosition.dateLocal) */
export function toDateLocal(d: Date): string {
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}:${pad(d.getSeconds())}`;
}

/** Date AAAA-MM-JJ (ou ISO complet) → Date locale ; null si invalide */
export function parseDate(s: string | null | undefined): Date | null {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  const d = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Nombre de jours (fractionnaire) entre deux dates : b − a */
export function daysBetween(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / DAY_MS;
}

export function formatDateFr(d: Date): string {
  return d.toLocaleDateString('fr-FR');
}

const MONTHS_FR = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

/** « oct. 2026 » à partir de AAAA-MM */
export function formatMonthFr(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return `${MONTHS_FR[(m || 1) - 1]} ${y}`;
}

/** « oct. » à partir de AAAA-MM */
export function formatMonthShortFr(month: string): string {
  const m = Number(month.split('-')[1]);
  return MONTHS_FR[(m || 1) - 1];
}
