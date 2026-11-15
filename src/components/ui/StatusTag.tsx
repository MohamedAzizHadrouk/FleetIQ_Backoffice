import type { LucideIcon } from 'lucide-react';
import {
  BadgeCheck,
  Boxes,
  CalendarClock,
  CalendarPlus,
  Check,
  CheckCheck,
  CircleAlert,
  CircleCheck,
  Clock,
  ClockAlert,
  Eye,
  Info,
  Lock,
  RotateCcw,
  ShieldAlert,
  Siren,
  Target,
  TriangleAlert,
  Wifi,
  WifiOff,
  Wrench
} from 'lucide-react';

/** Familles d'état Industrial Tech (DL § 8). */
export type StatusFamily = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export type StatusTagProps = {
  label: string;
  family: StatusFamily;
  icon?: LucideIcon;
  /** Filet d'état 3 px à gauche (carte / cellule / bandeau). */
  rail?: boolean;
  className?: string;
};

const FAMILY_CLS: Record<StatusFamily, string> = {
  success: 'bg-success-50 text-success-700 border-success-200',
  warning: 'bg-warning-50 text-warning-700 border-warning-200',
  danger: 'bg-danger-50 text-danger-700 border-danger-200',
  info: 'bg-info-50 text-info-700 border-info-200',
  neutral: 'bg-neutral-50 text-neutral-700 border-neutral-200'
};

const RAIL_CLS: Record<StatusFamily, string> = {
  success: 'shadow-rail-success',
  warning: 'shadow-rail-warning',
  danger: 'shadow-rail-danger',
  info: 'shadow-rail-info',
  neutral: ''
};

/**
 * Étiquette d'état rectangulaire (rounded-tag 2 px) – DL § 8.
 * Toujours : famille + pictogramme + libellé.
 */
export function StatusTag({ label, family, icon: Icon, rail = false, className = '' }: StatusTagProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 h-6 px-2 rounded-tag border text-mention font-medium whitespace-nowrap ${FAMILY_CLS[family]} ${
        rail ? RAIL_CLS[family] : ''
      } ${className}`}
    >
      {Icon && <Icon size={14} aria-hidden="true" />}
      {label}
    </span>
  );
}

/** Correspondance libellés métier → famille + icône (T-001 + DL § 8). */
const LABEL_MAP: Record<string, { family: StatusFamily; icon: LucideIcon }> = {
  Connecté: { family: 'success', icon: Wifi },
  Installé: { family: 'success', icon: CircleCheck },
  Installée: { family: 'success', icon: CircleCheck },
  Actif: { family: 'success', icon: BadgeCheck },
  Active: { family: 'success', icon: BadgeCheck },
  Terminée: { family: 'success', icon: CheckCheck },
  'Objectif atteint': { family: 'success', icon: Target },
  OK: { family: 'success', icon: Check },
  'Non installé': { family: 'warning', icon: Clock },
  'Non installée': { family: 'warning', icon: Clock },
  Alerte: { family: 'warning', icon: TriangleAlert },
  'À surveiller': { family: 'warning', icon: Eye },
  'À risque': { family: 'warning', icon: ShieldAlert },
  'À revoir': { family: 'warning', icon: RotateCcw },
  'Non connecté': { family: 'danger', icon: WifiOff },
  Bloqué: { family: 'danger', icon: Lock },
  'En retard': { family: 'danger', icon: ClockAlert },
  'Sous l’objectif': { family: 'danger', icon: CircleAlert },
  "Sous l'objectif": { family: 'danger', icon: CircleAlert },
  Critique: { family: 'danger', icon: CircleAlert },
  Urgent: { family: 'danger', icon: Siren },
  'En cours': { family: 'info', icon: Wrench },
  'À planifier': { family: 'info', icon: CalendarPlus },
  Information: { family: 'info', icon: Info },
  'En stock': { family: 'neutral', icon: Boxes },
  Stock: { family: 'neutral', icon: Boxes },
  Planifiée: { family: 'neutral', icon: CalendarClock },
  bientôt: { family: 'neutral', icon: Info }
};

export function statusFromLabel(label: string): { family: StatusFamily; icon: LucideIcon } {
  return LABEL_MAP[label] ?? { family: 'neutral', icon: Info };
}

/** Raccourci : libellé connu → étiquette complète. */
export function StatusTagFromLabel({ label, rail, className }: { label: string; rail?: boolean; className?: string }) {
  const { family, icon } = statusFromLabel(label);
  return <StatusTag label={label} family={family} icon={icon} rail={rail} className={className} />;
}

export { FAMILY_CLS, RAIL_CLS };
