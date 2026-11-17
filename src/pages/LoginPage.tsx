import React, { useMemo, useState } from 'react';
import {
  ArrowRight, Check, ChevronDown, CircleAlert, Eye, EyeOff, HardHat,
  Loader2, Lock, Mail, ShieldCheck, Store, Wallet, Wrench
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
  { id: 'admin_tunav', label: BACKOFFICE_ROLE_LABELS.admin_tunav, sublabel: 'Administration globale', description: 'Gestion complète de la plateforme et des accès', icon: ShieldCheck },
  { id: 'responsable_sav', label: BACKOFFICE_ROLE_LABELS.responsable_sav, sublabel: 'Service après-vente', description: 'Interventions SAV, équipements du réseau, clients en consultation', icon: Wrench },
  { id: 'technicien_sav', label: BACKOFFICE_ROLE_LABELS.technicien_sav, sublabel: 'Interventions terrain', description: 'Interventions SAV', icon: HardHat },
  { id: 'revendeur', label: BACKOFFICE_ROLE_LABELS.revendeur, sublabel: 'Espace partenaire', description: 'Tableau de bord, clients et équipements de votre réseau', icon: Store },
  { id: 'finance_tunav', label: BACKOFFICE_ROLE_LABELS.finance_tunav, sublabel: 'Finance et facturation', description: 'Tableau de bord, clients et paiements ; puces et équipements en consultation', icon: Wallet }
];

export interface LoginContext {
  role: BackofficeRole;
  userName: string;
}

interface LoginPageProps {
  onLogin: (ctx: LoginContext) => void;
}

const fieldClass = 'h-control-touch w-full rounded-[4px] border border-tunav-gris bg-surface text-body text-text placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus focus-visible:ring-offset-2';

/** Schéma décoratif de flotte connectée : les trajets illustrent la synchronisation, sans données réelles. */
function FleetSignalScene() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <svg viewBox="0 0 1440 900" preserveAspectRatio="xMinYMid slice" className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path className="fiq-route-guide" d="M-70 720C250 600 300 170 715 70S1170 110 1500 12" />
        <path className="fiq-route-guide" d="M-40 130C280 80 670 900 1480 750" />
        <path className="fiq-route" d="M455 450C310 380 280 215 155 245" />
        <path className="fiq-route" d="M455 450C520 230 700 155 815 180" />
        <path className="fiq-route" d="M455 450C700 520 845 620 1100 665" />
        <path className="fiq-route" d="M455 450C440 625 330 720 215 765" />

        <circle className="fiq-sync-ring" cx="455" cy="450" r="38" />
        <circle cx="455" cy="450" r="62" fill="white" fillOpacity=".06" stroke="white" strokeOpacity=".32" />
        <circle cx="455" cy="450" r="43" fill="#0848FE" stroke="white" strokeWidth="2" />
        <circle cx="455" cy="450" r="27" fill="white" fillOpacity=".12" />
        <path d="M436 450h38m-13-13 13 13-13 13" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        <g transform="translate(155 245)">
          <circle className="fiq-node-pulse fiq-node-pulse-a" r="34" />
          <circle r="30" fill="#0848FE" stroke="white" strokeOpacity=".7" strokeWidth="1.5" />
          <path d="M-17 7h34l-3-12a5 5 0 0 0-5-4H-9a5 5 0 0 0-5 4L-17 7Zm2 0v6m30-6v6M-9-9l-3 10h24L9-9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="-10" cy="12" r="2.5" fill="white" /><circle cx="10" cy="12" r="2.5" fill="white" />
        </g>
        <g transform="translate(815 180)">
          <circle className="fiq-node-pulse fiq-node-pulse-b" r="34" />
          <circle r="30" fill="#0848FE" stroke="white" strokeOpacity=".7" strokeWidth="1.5" />
          <path d="M-19-11h24v21h-24zM5-4h8l6 8v6H5zM-19 10h38" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="-11" cy="12" r="3" fill="white" /><circle cx="12" cy="12" r="3" fill="white" />
        </g>
        <g transform="translate(1100 665)">
          <circle className="fiq-node-pulse fiq-node-pulse-c" r="34" />
          <circle r="30" fill="#0848FE" stroke="white" strokeOpacity=".7" strokeWidth="1.5" />
          <path d="M-17 7h34l-3-12a5 5 0 0 0-5-4H-9a5 5 0 0 0-5 4L-17 7Zm2 0v6m30-6v6M-9-9l-3 10h24L9-9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="-10" cy="12" r="2.5" fill="white" /><circle cx="10" cy="12" r="2.5" fill="white" />
        </g>
        <g transform="translate(215 765)">
          <circle r="26" fill="#0848FE" stroke="white" strokeOpacity=".55" strokeWidth="1.5" />
          <circle r="9" stroke="white" strokeWidth="2" /><circle r="3" fill="white" />
        </g>
        <circle className="fiq-signal fiq-signal-a" r="6" fill="white" />
        <circle className="fiq-signal fiq-signal-b" r="6" fill="white" />
        <circle className="fiq-signal fiq-signal-c" r="6" fill="white" />
        <circle className="fiq-signal fiq-signal-d" r="5" fill="white" />
      </svg>
    </div>
  );
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const { clients, setCurrentUserRole, setCurrentUserName, setBackofficeRole } = useFleetStore();
  const resellers = useMemo(
    () => clients
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
  const [invalidField, setInvalidField] = useState<'email' | 'password' | 'reseller' | null>(null);
  const currentRole = ROLES.find((r) => r.id === selectedRole) ?? ROLES[0];
  const isReseller = selectedRole === 'revendeur';

  const clearFieldError = (field: 'email' | 'password' | 'reseller') => {
    if (invalidField === field) {
      setInvalidField(null);
      setError('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInvalidField(null);
    if (!email.trim()) {
      setError('Saisissez votre adresse email.');
      setInvalidField('email');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Saisissez une adresse email valide.');
      setInvalidField('email');
      return;
    }
    if (!password) {
      setError('Saisissez votre mot de passe.');
      setInvalidField('password');
      return;
    }
    if (isReseller && !selectedReseller) {
      setError('Sélectionnez un revendeur.');
      setInvalidField('reseller');
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
    <main className="relative flex min-h-screen min-h-[100dvh] w-full flex-col bg-primary">
      <style>{`
        .fiq-route { stroke: white; stroke-opacity: .46; stroke-width: 2; stroke-dasharray: 4 10; }
        .fiq-route-guide { stroke: white; stroke-opacity: .16; stroke-width: 1.5; stroke-dasharray: 3 12; }
        .fiq-sync-ring, .fiq-node-pulse { fill: none; stroke: white; stroke-width: 2; transform-box: fill-box; transform-origin: center; animation: fiq-sync 7s ease-out infinite; }
        .fiq-node-pulse { stroke-width: 1.5; animation-duration: 9s; }
        .fiq-node-pulse-a { animation-delay: -1s; }
        .fiq-node-pulse-b { animation-delay: -4s; }
        .fiq-node-pulse-c { animation-delay: -6s; }
        .fiq-signal { opacity: 0; animation-timing-function: linear; animation-iteration-count: infinite; }
        .fiq-signal-a { animation-name: fiq-travel-a; animation-duration: 10s; animation-delay: -1s; }
        .fiq-signal-b { animation-name: fiq-travel-b; animation-duration: 11s; animation-delay: -5s; }
        .fiq-signal-c { animation-name: fiq-travel-c; animation-duration: 9s; animation-delay: -3s; }
        .fiq-signal-d { animation-name: fiq-travel-d; animation-duration: 12s; animation-delay: -8s; }
        @keyframes fiq-sync {
          0%, 24% { transform: scale(1); opacity: 0; }
          28% { opacity: .45; }
          60%, 100% { transform: scale(2.1); opacity: 0; }
        }
        @keyframes fiq-travel-a {
          0%, 9% { transform: translate(455px, 450px); opacity: 0; }
          12% { opacity: 1; }
          35% { transform: translate(342px, 360px); }
          62% { transform: translate(257px, 255px); opacity: 1; }
          82%, 100% { transform: translate(155px, 245px); opacity: 0; }
        }
        @keyframes fiq-travel-b {
          0%, 9% { transform: translate(455px, 450px); opacity: 0; }
          12% { opacity: 1; }
          37% { transform: translate(534px, 300px); }
          64% { transform: translate(690px, 191px); opacity: 1; }
          82%, 100% { transform: translate(815px, 180px); opacity: 0; }
        }
        @keyframes fiq-travel-c {
          0%, 9% { transform: translate(455px, 450px); opacity: 0; }
          12% { opacity: 1; }
          37% { transform: translate(665px, 514px); }
          64% { transform: translate(871px, 604px); opacity: 1; }
          82%, 100% { transform: translate(1100px, 665px); opacity: 0; }
        }
        @keyframes fiq-travel-d {
          0%, 9% { transform: translate(455px, 450px); opacity: 0; }
          12% { opacity: 1; }
          37% { transform: translate(425px, 585px); }
          64% { transform: translate(334px, 710px); opacity: 1; }
          82%, 100% { transform: translate(215px, 765px); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .fiq-sync-ring, .fiq-node-pulse, .fiq-signal { animation: none !important; }
          .fiq-sync-ring, .fiq-node-pulse { opacity: .2; }
          .fiq-signal { opacity: 0; }
        }
        .fiq-login-layout { display: flex; align-items: center; justify-content: center; width: 100%; }
        .fiq-login-form-zone { width: 100%; max-width: 480px; }
        .fiq-login-card { width: 100%; max-width: 480px; margin-inline: auto; }
        .fiq-brand-copy::before {
          content: '';
          position: absolute;
          inset: -18px -26px;
          z-index: -1;
          pointer-events: none;
          background: radial-gradient(ellipse at 35% 50%, rgba(8,72,254,.98) 20%, rgba(8,72,254,.76) 58%, transparent 100%);
        }
        @media (min-width: 768px) {
          .fiq-login-layout {
            display: grid;
            grid-template-columns: minmax(0, 1fr) minmax(380px, 480px);
            column-gap: 32px;
            max-width: 1600px;
            margin-inline: auto;
          }
          .fiq-login-form-zone { grid-column: 2; justify-self: end; }
          .fiq-login-card { margin-left: auto; margin-right: 0; }
        }
        .fiq-role-select { display: block; }
        .fiq-role-cards { display: none; }
        @media (min-width: 768px) and (min-height: 820px) {
          .fiq-role-select { display: none; }
          .fiq-role-cards { display: block; }
        }
      `}</style>
      <FleetSignalScene />
      <header className="relative z-10 flex items-center gap-2 px-4 pt-2 text-white sm:px-8 md:pt-3 lg:px-12">
        <img src="/brand/tunav-logo-horizontal-avec-signature-blanc.svg" alt="TUNAV — One intelligent ecosystem" className="hidden h-auto w-[250px] max-w-full md:block" />
        <img src="/brand/tunav-logo-horizontal-sans-signature-blanc-ui.svg" alt="TUNAV" className="h-auto w-[165px] max-w-full md:hidden" />
        <h1 className="text-base font-semibold text-white md:hidden">FleetIQ</h1>
      </header>
      <div className="fiq-login-layout relative z-10 flex-1 gap-5 px-3 pb-3 pt-3 md:gap-8 md:px-8 md:pb-6 lg:px-12">
        <div className="fiq-brand-copy relative isolate hidden max-w-xl text-white md:block">
          <div className="mb-5 h-1 w-14 bg-white" aria-hidden="true" />
          <h1 className="text-3xl font-semibold leading-tight text-white lg:text-5xl">FleetIQ Back-office</h1>
          <p className="mt-4 max-w-md text-body text-white lg:text-lead">Gestion de flotte, géolocalisation et opérations connectées.</p>
        </div>
        <section aria-labelledby="login-title" className="fiq-login-form-zone min-w-0" style={{ width: '100%', maxWidth: 480, marginLeft: 'auto' }}>
        <div className="fiq-login-card rounded-[8px] border border-border bg-surface px-3 py-2 sm:p-5 lg:p-6" style={{ width: '100%', maxWidth: 480 }}>
          <header className="mb-2 border-b border-border-subtle pb-1 md:mb-4 md:pb-3">
            <p className="mb-1 hidden text-overline uppercase text-primary md:block">Accès à la plateforme</p>
            <h2 id="login-title" className="text-2xl font-semibold text-text">Connexion</h2>
            <p className="mt-1 hidden text-small text-text-muted md:block">Choisissez votre profil, puis saisissez vos identifiants.</p>
          </header>

          <div className="fiq-role-select mb-2">
            <label htmlFor="login-role-select" className="mb-1 block text-sm font-medium text-text">Profil de connexion</label>
            <div className="relative">
              <select id="login-role-select" value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as BackofficeRole)}
                className={`${fieldClass} appearance-none px-3 pr-10`}>
                {ROLES.map((role) => <option key={role.id} value={role.id}>{role.label}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" aria-hidden="true" />
            </div>
          </div>

          <fieldset className="fiq-role-cards mb-4">
            <legend className="mb-2 text-sm font-medium text-text">Profil de connexion</legend>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((role) => {
                const Icon = role.icon;
                const isActive = role.id === selectedRole;
                return (
                  <label key={role.id}
                    className={`relative flex min-h-11 cursor-pointer items-center gap-3 rounded-[4px] border p-3 transition-colors duration-fast ease-standard focus-within:ring-3 focus-within:ring-focus focus-within:ring-offset-2 ${isActive ? 'border-primary bg-primary-100' : 'border-tunav-gris bg-surface hover:bg-primary-50'}`}>
                    <input type="radio" name="login-role" value={role.id} checked={isActive}
                      onChange={() => setSelectedRole(role.id)} className="sr-only" />
                    <Icon className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-small font-semibold leading-snug text-text">{role.label}</span>
                      <span className="block text-mention leading-snug text-text-muted">{role.sublabel}</span>
                    </span>
                    {isActive && <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />}
                  </label>
                );
              })}
            </div>
            <p className="mt-2 text-mention text-text-muted">
              <span className="font-medium text-text">{currentRole.label}</span> · {currentRole.description}
            </p>
          </fieldset>

          <form onSubmit={handleSubmit} noValidate className="space-y-2 md:space-y-3">
            {error && (
              <div id="login-error" role="alert" className="flex items-start gap-2 rounded-[4px] border border-danger-200 bg-danger-50 p-3 text-small text-danger-700">
                <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}
            {isReseller && (
              <div>
                <label htmlFor="login-reseller" className="mb-1 block text-sm font-medium text-text">Revendeur</label>
                <div className="relative">
                  <Store className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" aria-hidden="true" />
                  <select id="login-reseller" value={selectedReseller}
                    onChange={(e) => { setSelectedReseller(e.target.value); clearFieldError('reseller'); }}
                    aria-invalid={invalidField === 'reseller'}
                    aria-describedby={invalidField === 'reseller' ? 'login-error' : undefined}
                    className={`${fieldClass} appearance-none pl-10 pr-10 ${invalidField === 'reseller' ? '!border-danger' : ''}`}>
                    {resellers.length === 0 && <option value="">Aucun revendeur disponible</option>}
                    {resellers.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" aria-hidden="true" />
                </div>
              </div>
            )}
            <div>
              <label htmlFor="login-email" className="mb-1 block text-sm font-medium text-text">Adresse email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" aria-hidden="true" />
                <input id="login-email" type="email" autoComplete="username" value={email}
                  onChange={(e) => { setEmail(e.target.value); clearFieldError('email'); }}
                  aria-invalid={invalidField === 'email'}
                  aria-describedby={invalidField === 'email' ? 'login-error' : undefined}
                  className={`${fieldClass} pl-10 pr-3 ${invalidField === 'email' ? '!border-danger' : ''}`}
                  placeholder={isReseller ? 'admin@revendeur.com' : 'nom@tunav.com'} />
              </div>
            </div>
            <div>
              <label htmlFor="login-password" className="mb-1 block text-sm font-medium text-text">Mot de passe</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" aria-hidden="true" />
                <input id="login-password" type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password" value={password}
                  onChange={(e) => { setPassword(e.target.value); clearFieldError('password'); }}
                  aria-invalid={invalidField === 'password'}
                  aria-describedby={invalidField === 'password' ? 'login-error' : undefined}
                  className={`${fieldClass} pl-10 pr-12 ${invalidField === 'password' ? '!border-danger' : ''}`} placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  className="absolute right-0 top-0 flex h-control-touch w-control-touch items-center justify-center rounded-[4px] text-text-muted hover:text-primary focus-visible:ring-3 focus-visible:ring-focus focus-visible:ring-inset">
                  {showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={isLoading} aria-busy={isLoading}
              className="flex h-control-touch w-full items-center justify-center gap-2 rounded-[4px] bg-primary px-5 text-button text-white transition-colors duration-fast ease-standard hover:bg-primary-hover focus-visible:ring-3 focus-visible:ring-focus focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ArrowRight className="h-4 w-4" aria-hidden="true" />}
              Se connecter
            </button>
          </form>
        </div>
        </section>
      </div>
    </main>
  );
}
