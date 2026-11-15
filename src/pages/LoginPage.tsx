import React, { useMemo, useState } from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  Wrench,
  Store,
  ShieldCheck,
  Wallet,
  ChevronDown,
  HardHat,
  Check,
  CircleAlert,
  Loader2
} from 'lucide-react';
import { useFleetStore } from '../state/FleetStore';
import { BACKOFFICE_ROLE_LABELS, type BackofficeRole } from '../utils/backofficePermissions';

export type { BackofficeRole };

interface RoleDefinition {
  id: BackofficeRole;
  label: string;
  sublabel: string;
  description: string;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;
}

const ROLES: RoleDefinition[] = [
  {
    id: 'admin_tunav',
    label: BACKOFFICE_ROLE_LABELS.admin_tunav,
    sublabel: 'Administration globale',
    description: 'Gestion complète de la plateforme et des accès',
    icon: ShieldCheck
  },
  {
    id: 'responsable_sav',
    label: BACKOFFICE_ROLE_LABELS.responsable_sav,
    sublabel: 'Service Après-Vente',
    description: 'Interventions SAV, équipements du réseau, clients en consultation',
    icon: Wrench
  },
  {
    id: 'technicien_sav',
    label: BACKOFFICE_ROLE_LABELS.technicien_sav,
    sublabel: 'Interventions terrain',
    description: 'Interventions SAV',
    icon: HardHat
  },
  {
    id: 'revendeur',
    label: BACKOFFICE_ROLE_LABELS.revendeur,
    sublabel: 'Espace partenaire',
    description: 'Tableau de bord, clients et équipements de votre réseau',
    icon: Store
  },
  {
    id: 'finance_tunav',
    label: BACKOFFICE_ROLE_LABELS.finance_tunav,
    sublabel: 'Finance & facturation',
    description: 'Tableau de bord, clients et paiements ; puces et équipements en consultation',
    icon: Wallet
  }
];

const FOCUS =
  'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface';
const FIELD =
  'block w-full h-11 rounded-control bg-surface border border-border-strong text-body md:text-small text-text placeholder:text-text-muted hover:border-text transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-focus/25';

export interface LoginContext {
  role: BackofficeRole;
  userName: string;
}

interface LoginPageProps {
  onLogin: (ctx: LoginContext) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const { clients, setCurrentUserRole, setCurrentUserName, setBackofficeRole } = useFleetStore();

  const resellers = useMemo(
    () =>
      clients
        .filter((c) => c.type === 'Revendeur' && c.name !== 'Tunav' && !c.name.endsWith('_Stock'))
        .map((c) => c.name)
        .sort((a, b) => a.localeCompare(b)),
    [clients]
  );

  const [selectedRole, setSelectedRole] = useState<BackofficeRole>('admin_tunav');
  const [selectedReseller, setSelectedReseller] = useState<string>(resellers[0] ?? '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const currentRole = ROLES.find((r) => r.id === selectedRole) ?? ROLES[0];
  const isReseller = selectedRole === 'revendeur';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    if (isReseller && !selectedReseller) {
      setError('Veuillez sélectionner un revendeur');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const storeRole = isReseller ? 'Revendeur' : 'Tunav';
      const userName = isReseller ? selectedReseller : 'Tunav';
      setCurrentUserRole(storeRole);
      setCurrentUserName(userName);
      setBackofficeRole(selectedRole);
      setIsLoading(false);
      onLogin({ role: selectedRole, userName });
    }, 1000);
  };

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 bg-surface-muted">
      {/* Panneau marque (lg et plus) – aplat Bleu Royal + logo BLANC + globe en filigrane (tokens.md §10.8) */}
      <div className="hidden lg:flex relative overflow-hidden bg-primary text-text-inverse p-12 flex-col justify-between">
        <img
          src="/brand/tunav-symbole-blanc.svg"
          alt=""
          aria-hidden="true"
          className="pointer-events-none select-none absolute -right-40 top-1/2 -translate-y-1/2 w-[720px] max-w-none opacity-10"
        />
        <img
          src="/brand/tunav-logo-horizontal-avec-signature-blanc.svg"
          alt="TUNAV – One intelligent ecosystem"
          className="relative w-96 h-auto -ml-8 -mt-8"
        />
        <div className="relative max-w-lg">
          <p className="text-overline uppercase text-text-inverse mb-4">Back-office FleetIQ</p>
          <h1 className="text-h1 text-text-inverse mb-4">FleetIQ Back-office</h1>
          <p className="text-lead text-text-inverse">
            Plateforme d'administration et de gestion de la flotte TUNAV
          </p>
        </div>
        <p className="relative text-small text-text-inverse">
          &copy; {new Date().getFullYear()} TUNAV. Tous droits réservés.
        </p>
      </div>

      <div className="flex flex-col">
        {/* Bandeau mobile (< lg) */}
        <div className="lg:hidden bg-primary px-6 py-6">
          <img
            src="/brand/tunav-logo-horizontal-sans-signature-blanc-ui.svg"
            alt="TUNAV"
            className="h-12 w-auto"
          />
          <p className="mt-2 text-small font-semibold text-text-inverse">FleetIQ Back-office</p>
        </div>

        <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
          <div className="w-full max-w-lg p-8 bg-surface rounded-modal border border-border">
            <div className="mb-6">
              <h2 className="text-title text-text mb-1">Connexion au back-office</h2>
              <p className="text-small text-text-muted">Sélectionnez votre profil pour vous connecter</p>
            </div>

            {/* Choix du rôle (maquette – mock) */}
            <fieldset className="mb-5">
              <legend className="text-label text-text mb-2">Profil</legend>
              <div role="radiogroup" aria-label="Profil" className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ROLES.map((role) => {
                  const Icon = role.icon;
                  const isActive = role.id === selectedRole;
                  return (
                    <label
                      key={role.id}
                      data-role={role.id}
                      className={`relative flex items-center gap-3 min-h-11 p-3 rounded-control border cursor-pointer transition-colors duration-fast ease-standard has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-focus has-[:focus-visible]:ring-offset-2 ${
                        isActive
                          ? 'border-primary bg-primary-100'
                          : 'border-border-strong bg-surface hover:bg-primary-50'
                      }`}>
                      <input
                        type="radio"
                        name="role"
                        value={role.id}
                        checked={isActive}
                        onChange={() => setSelectedRole(role.id)}
                        className="sr-only"
                      />
                      <Icon className="w-5 h-5 text-primary flex-shrink-0" aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-label text-text truncate">{role.label}</span>
                        <span className="block text-mention text-text-muted truncate">{role.sublabel}</span>
                      </span>
                      {isActive && <Check className="w-4 h-4 text-primary flex-shrink-0" aria-hidden="true" />}
                    </label>
                  );
                })}
              </div>
              <p className="mt-2 text-small text-text-muted">
                <span className="font-medium text-text">
                  {isReseller && selectedReseller ? `${currentRole.label} — ${selectedReseller}` : currentRole.label}
                </span>{' '}
                · {currentRole.description}
              </p>
            </fieldset>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div
                  role="alert"
                  className="flex items-center gap-2 p-3 rounded-control bg-danger-50 border border-danger-200 text-danger-700 text-small">
                  <CircleAlert className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  {error}
                </div>
              )}

              {/* Revendeur (uniquement pour le rôle Revendeur) */}
              {isReseller && (
                <div>
                  <label htmlFor="login-reseller" className="block text-label text-text mb-2">
                    Revendeur
                  </label>
                  <div className="relative">
                    <Store
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted pointer-events-none"
                      aria-hidden="true"
                    />
                    <select
                      id="login-reseller"
                      value={selectedReseller}
                      onChange={(e) => setSelectedReseller(e.target.value)}
                      className={`${FIELD} appearance-none pl-10 pr-10`}>
                      {resellers.length === 0 && <option value="">Aucun revendeur disponible</option>}
                      {resellers.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted pointer-events-none"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="login-email" className="block text-label text-text mb-2">
                  Adresse email
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`${FIELD} pl-10 pr-3`}
                    placeholder={isReseller ? 'admin@revendeur.com' : 'nom@tunav.com'}
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="login-password" className="block text-label text-text mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${FIELD} pl-10 pr-12`}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    className={`absolute right-1 top-1/2 -translate-y-1/2 flex h-control w-9 items-center justify-center rounded-control text-text-muted hover:text-text hover:bg-surface-muted transition-colors duration-fast ease-standard ${FOCUS}`}>
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Eye className="h-5 w-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  className={`text-small text-primary font-medium hover:underline rounded-control ${FOCUS}`}>
                  Mot de passe oublié ?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                aria-busy={isLoading}
                className={`w-full inline-flex items-center justify-center gap-2 h-12 px-5 rounded-control bg-primary text-text-inverse text-button hover:bg-primary-hover active:bg-primary-active transition-colors duration-fast ease-standard disabled:opacity-50 disabled:cursor-not-allowed ${FOCUS}`}>
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                ) : (
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                )}
                Se connecter
              </button>
            </form>
          </div>
        </div>

        <p className="lg:hidden pb-6 text-center text-small text-text-muted">
          &copy; {new Date().getFullYear()} TUNAV. Tous droits réservés.
        </p>
      </div>
    </div>
  );
}
