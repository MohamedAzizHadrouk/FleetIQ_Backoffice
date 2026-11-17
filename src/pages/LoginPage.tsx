import React, { useMemo, useState } from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  Wrench,
  Store,
  ShieldCheck,
  Wallet,
  ChevronDown,
  HardHat,
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
  gradient: string;
  accent: string;
  glow: string;
}

const ROLES: RoleDefinition[] = [
  {
    id: 'admin_tunav',
    label: BACKOFFICE_ROLE_LABELS.admin_tunav,
    sublabel: 'Administration globale',
    description: 'Gestion complète de la plateforme et des accès',
    icon: ShieldCheck,
    gradient: 'from-cyan-500 to-blue-600',
    accent: 'text-cyan-300',
    glow: 'shadow-cyan-500/40'
  },
  {
    id: 'responsable_sav',
    label: BACKOFFICE_ROLE_LABELS.responsable_sav,
    sublabel: 'Service Après-Vente',
    description: 'Interventions SAV, équipements du réseau, clients en consultation',
    icon: Wrench,
    gradient: 'from-emerald-500 to-teal-600',
    accent: 'text-emerald-300',
    glow: 'shadow-emerald-500/40'
  },
  {
    id: 'technicien_sav',
    label: BACKOFFICE_ROLE_LABELS.technicien_sav,
    sublabel: 'Interventions terrain',
    description: 'Interventions SAV',
    icon: HardHat,
    gradient: 'from-lime-500 to-green-600',
    accent: 'text-lime-300',
    glow: 'shadow-lime-500/40'
  },
  {
    id: 'revendeur',
    label: BACKOFFICE_ROLE_LABELS.revendeur,
    sublabel: 'Espace partenaire',
    description: 'Tableau de bord, clients et équipements de votre réseau',
    icon: Store,
    gradient: 'from-amber-500 to-orange-600',
    accent: 'text-amber-300',
    glow: 'shadow-amber-500/40'
  },
  {
    id: 'finance_tunav',
    label: BACKOFFICE_ROLE_LABELS.finance_tunav,
    sublabel: 'Finance & facturation',
    description: 'Tableau de bord, clients et paiements ; puces et équipements en consultation',
    icon: Wallet,
    gradient: 'from-fuchsia-500 to-purple-600',
    accent: 'text-fuchsia-300',
    glow: 'shadow-fuchsia-500/40'
  }
];

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
  const [isFocused, setIsFocused] = useState<string | null>(null);

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
    <div className="min-h-screen w-full flex relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
          poster="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop"
        >
          <source
            src="https://cdn.coverr.co/videos/coverr-aerial-view-of-city-at-night-1573/1080p.mp4"
            type="video/mp4"
          />
        </video>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-blue-900/90 to-slate-900/95" />
        <div className="absolute inset-0 opacity-20">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px),
                               linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)`,
              backgroundSize: '50px 50px',
              animation: 'gridMove 20s linear infinite'
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(6, 182, 212, 0.3); }
          50% { box-shadow: 0 0 40px rgba(6, 182, 212, 0.6); }
        }
        @media (prefers-reduced-motion: reduce) {
          .fiq-login-anim { animation: none !important; }
        }
      `}</style>

      <div className="relative z-10 w-full flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
          <div className="flex-1 text-center lg:text-left">
            <div className="mb-6">
              <div className="inline-block bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
                <img
                  src="/brand/tunav-logo-horizontal-avec-signature-blanc.svg"
                  alt="TUNAV"
                  className="h-14 lg:h-16 w-auto"
                />
              </div>
            </div>

            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-semibold tracking-wider uppercase mb-4">
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                Back-Office FleetIQ
              </div>
              <h1 className="text-3xl lg:text-5xl font-bold text-white mb-4 leading-tight">
                Technology{' '}
                <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  Powered
                </span>
                <br />
                By Intelligence
              </h1>
              <p className="text-slate-300 text-lg lg:text-xl max-w-md mx-auto lg:mx-0">
                Plateforme d&apos;administration et de gestion de la flotte TUNAV
              </p>
            </div>
          </div>

          <div className="w-full max-w-lg">
            <div
              className="fiq-login-anim bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-7 lg:p-8 shadow-2xl"
              style={{ animation: 'pulse-glow 4s ease-in-out infinite' }}
            >
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold text-white mb-2">Connexion Back-Office</h2>
                <p className="text-slate-300 text-sm">Sélectionnez votre profil pour vous connecter</p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 mb-5">
                {ROLES.map((role) => {
                  const Icon = role.icon;
                  const isActive = role.id === selectedRole;
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setSelectedRole(role.id)}
                      className={`group relative text-left rounded-xl p-3 border transition-all duration-300 ${
                        isActive
                          ? `bg-white/15 border-white/40 shadow-lg ${role.glow} scale-[1.02]`
                          : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-lg bg-gradient-to-br ${role.gradient} flex items-center justify-center shadow-md flex-shrink-0`}
                        >
                          <Icon className="w-5 h-5 text-white" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-white text-xs font-semibold leading-tight truncate">{role.label}</div>
                          <div className="text-slate-400 text-[10px] leading-tight truncate">{role.sublabel}</div>
                        </div>
                      </div>
                      {isActive && (
                        <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mb-4 p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${currentRole.gradient} flex items-center justify-center flex-shrink-0`}
                  >
                    <currentRole.icon className="w-5 h-5 text-white" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <div className={`text-xs font-semibold ${currentRole.accent}`}>Connexion en tant que</div>
                    <div className="text-white text-sm font-medium truncate">
                      {isReseller && selectedReseller
                        ? `${currentRole.label} — ${selectedReseller}`
                        : currentRole.label}
                    </div>
                    <div className="text-slate-400 text-xs truncate">{currentRole.description}</div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div
                    role="alert"
                    className="flex items-center gap-2 p-3 rounded-xl bg-red-500/15 border border-red-400/30 text-red-200 text-sm"
                  >
                    <CircleAlert className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                    {error}
                  </div>
                )}

                {isReseller && (
                  <div>
                    <label htmlFor="login-reseller" className="block text-xs font-medium text-slate-300 mb-1.5">
                      Revendeur
                    </label>
                    <div className="relative">
                      <Store
                        className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none"
                        aria-hidden="true"
                      />
                      <select
                        id="login-reseller"
                        value={selectedReseller}
                        onChange={(e) => setSelectedReseller(e.target.value)}
                        onFocus={() => setIsFocused('reseller')}
                        onBlur={() => setIsFocused(null)}
                        className={`w-full h-11 appearance-none rounded-xl bg-white/10 border pl-10 pr-10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50 ${
                          isFocused === 'reseller' ? 'border-cyan-400/50' : 'border-white/20'
                        }`}
                      >
                        {resellers.length === 0 && <option value="">Aucun revendeur disponible</option>}
                        {resellers.map((r) => (
                          <option key={r} value={r} className="text-slate-900">
                            {r}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none"
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="login-email" className="block text-xs font-medium text-slate-300 mb-1.5">
                    Adresse email
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      id="login-email"
                      type="email"
                      autoComplete="username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setIsFocused('email')}
                      onBlur={() => setIsFocused(null)}
                      className={`w-full h-11 rounded-xl bg-white/10 border pl-10 pr-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 ${
                        isFocused === 'email' ? 'border-cyan-400/50' : 'border-white/20'
                      }`}
                      placeholder={isReseller ? 'admin@revendeur.com' : 'nom@tunav.com'}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="login-password" className="block text-xs font-medium text-slate-300 mb-1.5">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setIsFocused('password')}
                      onBlur={() => setIsFocused(null)}
                      className={`w-full h-11 rounded-xl bg-white/10 border pl-10 pr-12 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 ${
                        isFocused === 'password' ? 'border-cyan-400/50' : 'border-white/20'
                      }`}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                      className="absolute right-1 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" aria-hidden="true" />
                      ) : (
                        <Eye className="h-5 w-5" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  aria-busy={isLoading}
                  className="w-full inline-flex items-center justify-center gap-2 h-12 px-5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
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
        </div>
      </div>
    </div>
  );
}
