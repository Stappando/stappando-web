'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  useAuthStore,
  fetchCustomer,
  updateCustomer,
  fetchOrders,
  fetchPoints,
  changePassword,
  sendSupportTicket,
  type WCCustomer,
  type WCOrder,
  type Address,
} from '@/store/auth';
import { formatPrice } from '@/lib/api';
import { useCartStore } from '@/store/cart';
import { DEFAULT_VENDOR_NAME } from '@/lib/config';

/* ── Status badge colors ───────────────────────────────── */

const statusLabels: Record<string, string> = {
  pending: 'In attesa',
  processing: 'In lavorazione',
  'on-hold': 'In sospeso',
  completed: 'Completato',
  cancelled: 'Annullato',
  refunded: 'Rimborsato',
  failed: 'Fallito',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  'on-hold': 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-600',
  refunded: 'bg-purple-100 text-purple-800',
  failed: 'bg-red-100 text-red-800',
};

/* ── Icons (inline SVGs) ───────────────────────────────── */

function IconUser() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

function IconBox() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  );
}

function IconMap() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
  );
}

function IconStar() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  );
}

function IconHeart() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}

function IconGift() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H4.5a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  );
}

function IconTicket() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
    </svg>
  );
}

function IconTruck() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
    </svg>
  );
}

/* ── Section type ───────────────────────────────────────── */

type Section =
  | 'ordini'
  | 'tracking'
  | 'punti'
  | 'buoni'
  | 'preferiti'
  | 'profilo'
  | 'indirizzi'
  | 'pagamenti'
  | 'assistenza'
  | 'recensioni';

interface SectionGroup {
  label: string;
  items: { key: Section; label: string; icon: () => React.ReactNode }[];
}

const sectionGroups: SectionGroup[] = [
  {
    label: 'ORDINI',
    items: [
      { key: 'ordini', label: 'I miei ordini', icon: IconBox },
      { key: 'tracking', label: 'Tracciamento spedizioni', icon: IconTruck },
    ],
  },
  {
    label: 'VANTAGGI',
    items: [
      { key: 'punti', label: 'Punti POP & storico', icon: IconStar },
      { key: 'buoni', label: 'Buoni regalo & coupon', icon: IconGift },
      { key: 'preferiti', label: 'Preferiti', icon: IconHeart },
    ],
  },
  {
    label: 'ACCOUNT',
    items: [
      { key: 'profilo', label: 'Profilo & sicurezza', icon: IconUser },
      { key: 'indirizzi', label: 'Indirizzi', icon: IconMap },
      { key: 'pagamenti', label: 'Metodi di pagamento', icon: IconLock },
    ],
  },
  {
    label: 'SUPPORTO',
    items: [
      { key: 'assistenza', label: 'Assistenza & ticket', icon: IconTicket },
      { key: 'recensioni', label: 'Lascia una recensione', icon: IconStar },
    ],
  },
];

// Flat list for mobile toggle label
const allSections = sectionGroups.flatMap(g => g.items);

/* ── Main component ────────────────────────────────────── */

export default function AccountClient() {
  const { user, isLoading, error, isAuthenticated, logout, clearError } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated()) {
    return <AuthForms isLoading={isLoading} error={error} clearError={clearError} />;
  }

  return <Dashboard user={user!} onLogout={logout} />;
}

/* ══════════════════════════════════════════════════════════
   AUTH FORMS (Login / Register)
   ══════════════════════════════════════════════════════════ */

function AuthForms({
  isLoading,
  error,
  clearError,
}: {
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);

  // Login form
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // Register form
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regPassConfirm, setRegPassConfirm] = useState('');
  const [regFirst, setRegFirst] = useState('');
  const [regLast, setRegLast] = useState('');
  const [regError, setRegError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await login(loginUser, loginPass);
    } catch {
      // error is set in store
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setRegError('');
    if (regPass !== regPassConfirm) {
      setRegError('Le password non coincidono');
      return;
    }
    if (regPass.length < 6) {
      setRegError('La password deve contenere almeno 6 caratteri');
      return;
    }
    try {
      await register(regEmail, regPass, regFirst, regLast);
    } catch {
      // error is set in store
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-primary">Il Mio Account</h1>
          <p className="mt-2 text-brand-muted">
            {mode === 'login' ? 'Accedi per gestire i tuoi ordini e preferiti' : 'Crea il tuo account Stappando'}
          </p>
        </div>

        {/* Toggle */}
        <div className="flex bg-white rounded-xl overflow-hidden border border-brand-border mb-6">
          <button
            type="button"
            onClick={() => { setMode('login'); clearError(); setRegError(''); }}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              mode === 'login' ? 'bg-brand-primary text-white' : 'text-brand-muted hover:text-brand-text'
            }`}
          >
            Accedi
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); clearError(); setRegError(''); }}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              mode === 'register' ? 'bg-brand-primary text-white' : 'text-brand-muted hover:text-brand-text'
            }`}
          >
            Registrati
          </button>
        </div>

        {/* Error message */}
        {(error || regError) && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error || regError}
          </div>
        )}

        {/* Social login buttons */}
        {mode === 'login' && (
          <div className="space-y-3 mb-4">
            <a
              href="https://stappando.it/?loginSocial=google"
              className="flex items-center justify-center gap-3 w-full py-3 px-4 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:shadow-sm transition-all"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continua con Google
            </a>
            <a
              href="https://stappando.it/?loginSocial=facebook"
              className="flex items-center justify-center gap-3 w-full py-3 px-4 bg-[#1877F2] rounded-xl text-sm font-medium text-white hover:bg-[#166fe5] hover:shadow-sm transition-all"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Continua con Facebook
            </a>

            {/* Divider */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">oppure</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
          </div>
        )}

        {/* Login form */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="bg-white rounded-2xl shadow-sm border border-brand-border p-6 space-y-4">
            <div>
              <label htmlFor="login-user" className="block text-sm font-medium text-brand-text mb-1">
                Email o nome utente
              </label>
              <input
                id="login-user"
                type="text"
                autoComplete="username"
                required
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-brand-border bg-brand-bg focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors"
                placeholder="mario@email.com"
              />
            </div>
            <div>
              <label htmlFor="login-pass" className="block text-sm font-medium text-brand-text mb-1">
                Password
              </label>
              <input
                id="login-pass"
                type="password"
                autoComplete="current-password"
                required
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-brand-border bg-brand-bg focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors"
                placeholder="La tua password"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-brand-primary text-white font-semibold rounded-lg hover:bg-brand-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Accesso in corso...
                </span>
              ) : (
                'Accedi'
              )}
            </button>
            <p className="text-center text-sm text-brand-muted">
              <a href="https://stappando.it/my-account/lost-password/" className="text-brand-primary hover:underline">
                Password dimenticata?
              </a>
            </p>
          </form>
        )}

        {/* Register form */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="bg-white rounded-2xl shadow-sm border border-brand-border p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="reg-first" className="block text-sm font-medium text-brand-text mb-1">
                  Nome
                </label>
                <input
                  id="reg-first"
                  type="text"
                  required
                  value={regFirst}
                  onChange={(e) => setRegFirst(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-brand-border bg-brand-bg focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors"
                  placeholder="Mario"
                />
              </div>
              <div>
                <label htmlFor="reg-last" className="block text-sm font-medium text-brand-text mb-1">
                  Cognome
                </label>
                <input
                  id="reg-last"
                  type="text"
                  required
                  value={regLast}
                  onChange={(e) => setRegLast(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-brand-border bg-brand-bg focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors"
                  placeholder="Rossi"
                />
              </div>
            </div>
            <div>
              <label htmlFor="reg-email" className="block text-sm font-medium text-brand-text mb-1">
                Email
              </label>
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-brand-border bg-brand-bg focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors"
                placeholder="mario@email.com"
              />
            </div>
            <div>
              <label htmlFor="reg-pass" className="block text-sm font-medium text-brand-text mb-1">
                Password
              </label>
              <input
                id="reg-pass"
                type="password"
                autoComplete="new-password"
                required
                value={regPass}
                onChange={(e) => setRegPass(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-brand-border bg-brand-bg focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors"
                placeholder="Minimo 6 caratteri"
              />
            </div>
            <div>
              <label htmlFor="reg-pass-confirm" className="block text-sm font-medium text-brand-text mb-1">
                Conferma password
              </label>
              <input
                id="reg-pass-confirm"
                type="password"
                autoComplete="new-password"
                required
                value={regPassConfirm}
                onChange={(e) => setRegPassConfirm(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-brand-border bg-brand-bg focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors"
                placeholder="Ripeti la password"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-brand-primary text-white font-semibold rounded-lg hover:bg-brand-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Registrazione...
                </span>
              ) : (
                'Crea account'
              )}
            </button>
            <p className="text-center text-xs text-brand-muted">
              Registrandoti, accetti i{' '}
              <a href="https://stappando.it/termini-e-condizioni/" className="text-brand-primary hover:underline">
                Termini e condizioni
              </a>{' '}
              e la{' '}
              <a href="https://stappando.it/privacy-policy/" className="text-brand-primary hover:underline">
                Privacy policy
              </a>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   DASHBOARD
   ══════════════════════════════════════════════════════════ */

function Dashboard({ user, onLogout }: { user: { id: number; email: string; firstName: string; lastName: string; username: string }; onLogout: () => void }) {
  const [activeSection, setActiveSection] = useState<Section>('profilo');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-brand-primary">
          Ciao, {user.firstName || user.username}
        </h1>
        <p className="mt-1 text-brand-muted">Gestisci il tuo account e i tuoi ordini</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <aside className="lg:w-64 shrink-0">
          {/* Mobile toggle */}
          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden w-full flex items-center justify-between bg-white rounded-xl border border-brand-border p-4 mb-3"
          >
            <span className="font-medium">
              {allSections.find((s) => s.key === activeSection)?.label}
            </span>
            <svg className={`w-5 h-5 transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <nav className={`bg-white rounded-2xl border border-brand-border overflow-hidden ${mobileMenuOpen ? 'block' : 'hidden lg:block'}`}>
            {sectionGroups.map((group, gi) => (
              <div key={group.label}>
                <p className={`px-5 text-[10px] font-semibold text-[#bbb] uppercase tracking-[0.06em] ${gi === 0 ? 'pt-4' : 'pt-4 mt-1 border-t border-brand-border'} pb-1.5`}>
                  {group.label}
                </p>
                {group.items.map((s) => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => { setActiveSection(s.key); setMobileMenuOpen(false); }}
                      className={`w-full flex items-center gap-3 px-5 py-3 text-[13px] font-medium transition-colors text-left ${
                        activeSection === s.key
                          ? 'bg-[#005667]/5 text-[#005667] border-l-[3px] border-[#005667]'
                          : 'text-[#1a1a1a] hover:bg-[#f8f6f1]'
                      }`}
                    >
                      <Icon />
                      {s.label}
                    </button>
                  );
                })}
              </div>
            ))}
            <button
              type="button"
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-5 py-3.5 text-[13px] font-medium text-red-500 hover:bg-red-50 transition-colors text-left border-t border-brand-border mt-2"
            >
              <IconLogout />
              Esci
            </button>
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeSection === 'ordini' && <OrdersSection userId={user.id} />}
          {activeSection === 'tracking' && <TrackingSection userId={user.id} />}
          {activeSection === 'punti' && <PointsSection userId={user.id} />}
          {activeSection === 'buoni' && <GiftCardsSection />}
          {activeSection === 'preferiti' && <FavoritesSection />}
          {activeSection === 'profilo' && <ProfileSection user={user} />}
          {activeSection === 'indirizzi' && <AddressesSection userId={user.id} />}
          {activeSection === 'pagamenti' && <PaymentMethodsSection />}
          {activeSection === 'assistenza' && <SupportSection user={user} />}
          {activeSection === 'recensioni' && <ReviewsSection userId={user.id} />}
        </div>
      </div>
    </div>
  );
}

/* ── Section wrapper ───────────────────────────────────── */

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-brand-border shadow-sm">
      <div className="px-6 py-4 border-b border-brand-border">
        <h2 className="text-lg font-bold text-brand-primary">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

/* ── Profile ───────────────────────────────────────────── */

function ProfileSection({ user }: { user: { id: number; email: string; firstName: string; lastName: string; username: string } }) {
  const [customer, setCustomer] = useState<WCCustomer | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', dob: '' });
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [nlChecked, setNlChecked] = useState(false);
  const [nlSaving, setNlSaving] = useState(false);

  useEffect(() => {
    fetchCustomer(user.id).then((c) => {
      setCustomer(c);
      setForm({
        firstName: c.first_name || user.firstName,
        lastName: c.last_name || user.lastName,
        email: c.email || user.email,
        phone: c.billing?.phone || '',
        dob: '',
      });
      setLoading(false);
    });
  }, [user.id, user.firstName, user.lastName, user.email]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      await updateCustomer(user.id, {
        first_name: form.firstName,
        last_name: form.lastName,
        email: form.email,
        billing: { ...customer?.billing, phone: form.phone, first_name: form.firstName, last_name: form.lastName, email: form.email } as Address,
      });
      setMsg('Profilo aggiornato');
      setTimeout(() => setMsg(''), 3000);
    } catch { setMsg('Errore nel salvataggio'); }
    setSaving(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPw !== pwForm.confirm) { setPwMsg('Le password non corrispondono'); return; }
    if (pwForm.newPw.length < 6) { setPwMsg('Minimo 6 caratteri'); return; }
    setPwSaving(true); setPwMsg('');
    try {
      await changePassword(user.id, pwForm.newPw);
      setPwMsg('Password aggiornata');
      setPwForm({ current: '', newPw: '', confirm: '' });
      setTimeout(() => setPwMsg(''), 3000);
    } catch { setPwMsg('Errore — password attuale errata?'); }
    setPwSaving(false);
  };

  const handleNewsletter = async () => {
    setNlSaving(true);
    try {
      await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, firstName: form.firstName, lastName: form.lastName }),
      });
      setNlChecked(true);
    } catch {}
    setNlSaving(false);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <SectionCard title="Profilo & sicurezza">
        {/* Avatar + name */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-[#1a1a1a] flex items-center justify-center text-[#d9c39a] text-2xl font-bold">
            {(form.firstName?.[0] || '?').toUpperCase()}
          </div>
          <div>
            <p className="text-[18px] font-semibold text-[#1a1a1a]">{form.firstName} {form.lastName}</p>
            <p className="text-[13px] text-[#888]">{form.email}</p>
          </div>
        </div>

        {msg && <div className={`p-3 rounded-lg text-[13px] mb-4 ${msg.includes('Errore') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>{msg}</div>}

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] text-[#888] uppercase tracking-wider mb-1.5">Nome</label>
              <input type="text" value={form.firstName} onChange={(e) => setForm({...form, firstName: e.target.value})} className="w-full px-4 py-3 rounded-lg border border-[#e5e5e5] text-[14px] focus:outline-none focus:border-[#005667] focus:ring-1 focus:ring-[#005667]" />
            </div>
            <div>
              <label className="block text-[11px] text-[#888] uppercase tracking-wider mb-1.5">Cognome</label>
              <input type="text" value={form.lastName} onChange={(e) => setForm({...form, lastName: e.target.value})} className="w-full px-4 py-3 rounded-lg border border-[#e5e5e5] text-[14px] focus:outline-none focus:border-[#005667] focus:ring-1 focus:ring-[#005667]" />
            </div>
          </div>
          <div>
            <label className="block text-[11px] text-[#888] uppercase tracking-wider mb-1.5">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="w-full px-4 py-3 rounded-lg border border-[#e5e5e5] text-[14px] focus:outline-none focus:border-[#005667] focus:ring-1 focus:ring-[#005667]" />
          </div>
          <div>
            <label className="block text-[11px] text-[#888] uppercase tracking-wider mb-1.5">Telefono</label>
            <input type="tel" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="w-full px-4 py-3 rounded-lg border border-[#e5e5e5] text-[14px] focus:outline-none focus:border-[#005667] focus:ring-1 focus:ring-[#005667]" />
          </div>
          {/* Newsletter */}
          <div className="flex items-center justify-between py-3 border-t border-[#f0f0f0]">
            <div>
              <p className="text-[13px] font-semibold text-[#1a1a1a]">Newsletter</p>
              <p className="text-[11px] text-[#888]">Ricevi offerte e novità dal mondo del vino</p>
            </div>
            <button type="button" onClick={handleNewsletter} disabled={nlSaving || nlChecked}
              className={`px-4 py-2 rounded-lg text-[12px] font-semibold transition-colors ${nlChecked ? 'bg-green-100 text-green-700' : 'bg-[#005667] text-white hover:bg-[#004555]'} disabled:opacity-60`}>
              {nlSaving ? '...' : nlChecked ? 'Iscritto' : 'Iscriviti'}
            </button>
          </div>
          <button type="submit" disabled={saving} className="w-full sm:w-auto px-8 py-3 bg-[#005667] text-white rounded-lg text-[14px] font-semibold hover:bg-[#004555] transition-colors disabled:opacity-60">
            {saving ? 'Salvataggio...' : 'Salva modifiche'}
          </button>
        </form>
      </SectionCard>

      {/* Password */}
      <SectionCard title="Cambio password">
        {pwMsg && <div className={`p-3 rounded-lg text-[13px] mb-4 ${pwMsg.includes('Errore') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>{pwMsg}</div>}
        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div>
            <label className="block text-[11px] text-[#888] uppercase tracking-wider mb-1.5">Password attuale</label>
            <input type="password" value={pwForm.current} onChange={(e) => setPwForm({...pwForm, current: e.target.value})} required className="w-full px-4 py-3 rounded-lg border border-[#e5e5e5] text-[14px] focus:outline-none focus:border-[#005667] focus:ring-1 focus:ring-[#005667]" />
          </div>
          <div>
            <label className="block text-[11px] text-[#888] uppercase tracking-wider mb-1.5">Nuova password</label>
            <input type="password" value={pwForm.newPw} onChange={(e) => setPwForm({...pwForm, newPw: e.target.value})} required minLength={6} className="w-full px-4 py-3 rounded-lg border border-[#e5e5e5] text-[14px] focus:outline-none focus:border-[#005667] focus:ring-1 focus:ring-[#005667]" />
          </div>
          <div>
            <label className="block text-[11px] text-[#888] uppercase tracking-wider mb-1.5">Conferma password</label>
            <input type="password" value={pwForm.confirm} onChange={(e) => setPwForm({...pwForm, confirm: e.target.value})} required className="w-full px-4 py-3 rounded-lg border border-[#e5e5e5] text-[14px] focus:outline-none focus:border-[#005667] focus:ring-1 focus:ring-[#005667]" />
          </div>
          <button type="submit" disabled={pwSaving} className="px-8 py-3 bg-[#1a1a1a] text-white rounded-lg text-[14px] font-semibold hover:bg-[#333] transition-colors disabled:opacity-60">
            {pwSaving ? 'Aggiornamento...' : 'Cambia password'}
          </button>
        </form>
      </SectionCard>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-brand-muted uppercase tracking-wider">{label}</p>
      <p className="mt-1 text-brand-text font-medium">{value}</p>
    </div>
  );
}

/* ── Orders ────────────────────────────────────────────── */

function OrdersSection({ userId }: { userId: number }) {
  const [orders, setOrders] = useState<WCOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    fetchOrders(userId).then((data) => { setOrders(data); setLoading(false); });
  }, [userId]);

  const handleReorder = (order: WCOrder) => {
    order.line_items.forEach(item => {
      addItem({
        id: item.product_id,
        name: item.name,
        price: parseFloat(item.price),
        image: item.image?.src || '',
        vendorId: 'default',
        vendorName: DEFAULT_VENDOR_NAME,
      });
    });
    alert('Prodotti aggiunti al carrello!');
  };

  if (loading) return <LoadingSpinner />;

  return (
    <SectionCard title="I miei ordini">
      {orders.length === 0 ? (
        <EmptyState message="Non hai ancora effettuato nessun ordine." />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="border border-brand-border rounded-xl overflow-hidden hover:border-brand-primary/30 transition-colors">
              {/* Header — sempre visibile */}
              <div className="flex items-center justify-between p-3 cursor-pointer" onClick={() => setExpanded(expanded === order.id ? null : order.id)}>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-brand-text">#{order.number}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
                    {statusLabels[order.status] || order.status}
                  </span>
                  <span className="text-xs text-brand-muted">{new Date(order.date_created).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-brand-primary">{formatPrice(order.total)} €</span>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform ${expanded === order.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>

              {/* Dettagli — espandibile */}
              {expanded === order.id && (
                <div className="border-t border-brand-border p-3 bg-gray-50/50">
                  {/* Prodotti */}
                  <div className="space-y-2 mb-3">
                    {order.line_items.map((item) => (
                      <div key={item.id} className="flex items-center gap-2 text-sm">
                        {item.image?.src && <img src={item.image.src} alt={item.name} className="w-8 h-8 rounded object-cover shrink-0" />}
                        <span className="text-brand-text truncate flex-1">{item.name}</span>
                        <span className="text-brand-muted text-xs">x{item.quantity}</span>
                        <span className="text-brand-text font-medium text-xs">{formatPrice(item.price)} €</span>
                      </div>
                    ))}
                  </div>
                  {/* Azioni */}
                  <div className="flex gap-2">
                    <button onClick={() => handleReorder(order)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#055667] text-white text-xs font-semibold hover:bg-[#044556] transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      Riordina
                    </button>
                    {(order.status === 'completed' || order.status === 'processing') && (
                      <a href={`https://stappando.it/tracking/?order_id=${order.id}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                        Traccia
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

/* ── Addresses ─────────────────────────────────────────── */

function AddressesSection({ userId }: { userId: number }) {
  const [customer, setCustomer] = useState<WCCustomer | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<'billing' | 'shipping' | null>(null);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    fetchCustomer(userId).then((data) => { setCustomer(data); setLoading(false); });
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (type: 'billing' | 'shipping', address: Address) => {
    setSaving(true);
    try {
      await updateCustomer(userId, { [type]: address });
      setSuccessMsg('Indirizzo aggiornato con successo');
      setEditing(null);
      load();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch {
      // keep editing
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <SectionCard title="I miei indirizzi">
      {successMsg && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{successMsg}</div>
      )}
      <div className="grid md:grid-cols-2 gap-6">
        <AddressCard
          title="Indirizzo di fatturazione"
          address={customer?.billing}
          isEditing={editing === 'billing'}
          onEdit={() => setEditing(editing === 'billing' ? null : 'billing')}
          onSave={(addr) => handleSave('billing', addr)}
          saving={saving}
        />
        <AddressCard
          title="Indirizzo di spedizione"
          address={customer?.shipping}
          isEditing={editing === 'shipping'}
          onEdit={() => setEditing(editing === 'shipping' ? null : 'shipping')}
          onSave={(addr) => handleSave('shipping', addr)}
          saving={saving}
        />
      </div>
    </SectionCard>
  );
}

function AddressCard({
  title,
  address,
  isEditing,
  onEdit,
  onSave,
  saving,
}: {
  title: string;
  address?: Address;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (addr: Address) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<Address>(
    address || { first_name: '', last_name: '', company: '', address_1: '', address_2: '', city: '', state: '', postcode: '', country: 'IT', phone: '' },
  );

  useEffect(() => {
    if (address) setForm(address);
  }, [address]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  const hasAddress = address && (address.address_1 || address.city);

  if (isEditing) {
    return (
      <form onSubmit={handleSubmit} className="border border-brand-primary/20 rounded-xl p-4 space-y-3 bg-brand-primary/[0.02]">
        <h3 className="font-semibold text-brand-primary text-sm">{title}</h3>
        <div className="grid grid-cols-2 gap-2">
          <AddressInput label="Nome" value={form.first_name} onChange={(v) => setForm({ ...form, first_name: v })} />
          <AddressInput label="Cognome" value={form.last_name} onChange={(v) => setForm({ ...form, last_name: v })} />
        </div>
        <AddressInput label="Azienda" value={form.company} onChange={(v) => setForm({ ...form, company: v })} />
        <AddressInput label="Indirizzo" value={form.address_1} onChange={(v) => setForm({ ...form, address_1: v })} required />
        <AddressInput label="Indirizzo riga 2" value={form.address_2} onChange={(v) => setForm({ ...form, address_2: v })} />
        <div className="grid grid-cols-2 gap-2">
          <AddressInput label="Città" value={form.city} onChange={(v) => setForm({ ...form, city: v })} required />
          <AddressInput label="CAP" value={form.postcode} onChange={(v) => setForm({ ...form, postcode: v })} required />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <AddressInput label="Provincia" value={form.state} onChange={(v) => setForm({ ...form, state: v })} />
          <AddressInput label="Telefono" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
        </div>
        <div className="flex gap-2 pt-2">
          <button type="submit" disabled={saving} className="flex-1 py-2 bg-brand-primary text-white text-sm font-semibold rounded-lg hover:bg-brand-primary/90 disabled:opacity-60">
            {saving ? 'Salvataggio...' : 'Salva'}
          </button>
          <button type="button" onClick={onEdit} className="px-4 py-2 border border-brand-border text-sm rounded-lg hover:bg-brand-bg">
            Annulla
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="border border-brand-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-brand-text text-sm">{title}</h3>
        <button type="button" onClick={onEdit} className="text-xs text-brand-primary hover:underline font-medium">
          Modifica
        </button>
      </div>
      {hasAddress ? (
        <div className="text-sm text-brand-muted space-y-0.5">
          <p className="text-brand-text font-medium">{address.first_name} {address.last_name}</p>
          {address.company && <p>{address.company}</p>}
          <p>{address.address_1}</p>
          {address.address_2 && <p>{address.address_2}</p>}
          <p>{address.postcode} {address.city} {address.state && `(${address.state})`}</p>
          {address.phone && <p>Tel: {address.phone}</p>}
        </div>
      ) : (
        <p className="text-sm text-brand-muted italic">Nessun indirizzo salvato</p>
      )}
    </div>
  );
}

function AddressInput({ label, value, onChange, required }: { label: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <div>
      <label className="block text-xs text-brand-muted mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full px-3 py-2 text-sm rounded-lg border border-brand-border bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
      />
    </div>
  );
}

/* ── Points ────────────────────────────────────────────── */

function PointsSection({ userId }: { userId: number }) {
  const [points, setPoints] = useState<{ points: number; history: { date: string; points: number; reason: string }[] }>({ points: 0, history: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPoints(userId).then((data) => { setPoints(data); setLoading(false); });
  }, [userId]);

  if (loading) return <LoadingSpinner />;

  return (
    <SectionCard title="Punti POP">
      <div className="text-center py-6">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-brand-accent/10 mb-4">
          <span className="text-3xl font-bold text-brand-accent">{points.points}</span>
        </div>
        <p className="text-lg font-semibold text-brand-text">Punti disponibili</p>
        <p className="text-sm text-brand-muted mt-1">Accumula punti con ogni acquisto e riscattali per ottenere sconti</p>
      </div>
      {points.history.length > 0 && (
        <div className="mt-6 border-t border-brand-border pt-4">
          <h3 className="text-sm font-semibold text-brand-text mb-3">Cronologia</h3>
          <div className="space-y-2">
            {points.history.map((h, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-brand-border last:border-0">
                <div>
                  <p className="text-sm text-brand-text">{h.reason}</p>
                  <p className="text-xs text-brand-muted">
                    {new Date(h.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <span className={`text-sm font-bold ${h.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {h.points > 0 ? '+' : ''}{h.points}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </SectionCard>
  );
}

/* ── Favorites ─────────────────────────────────────────── */

function FavoritesSection() {
  return (
    <SectionCard title="I miei preferiti">
      <EmptyState message="Non hai ancora aggiunto prodotti ai preferiti. Esplora il nostro catalogo e salva i vini che ami." />
      <div className="mt-4 text-center">
        <a href="/shop" className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-primary text-white text-sm font-semibold rounded-lg hover:bg-brand-primary/90 transition-colors">
          Esplora i vini
        </a>
      </div>
    </SectionCard>
  );
}

/* ── Account Details (password change) ─────────────────── */

function AccountDetailsSection({ userId }: { userId: number }) {
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (newPass !== confirmPass) {
      setMessage({ type: 'error', text: 'Le password non coincidono' });
      return;
    }
    if (newPass.length < 6) {
      setMessage({ type: 'error', text: 'La password deve contenere almeno 6 caratteri' });
      return;
    }
    setSaving(true);
    try {
      await changePassword(userId, newPass);
      setMessage({ type: 'success', text: 'Password aggiornata con successo' });
      setNewPass('');
      setConfirmPass('');
    } catch {
      setMessage({ type: 'error', text: 'Errore durante l\'aggiornamento della password' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionCard title="Dettagli account">
      <form onSubmit={handleSubmit} className="max-w-md space-y-4">
        {message && (
          <div className={`p-3 rounded-lg text-sm ${
            message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message.text}
          </div>
        )}
        <div>
          <label htmlFor="new-pass" className="block text-sm font-medium text-brand-text mb-1">Nuova password</label>
          <input
            id="new-pass"
            type="password"
            autoComplete="new-password"
            required
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-brand-border bg-brand-bg focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors"
            placeholder="Minimo 6 caratteri"
          />
        </div>
        <div>
          <label htmlFor="confirm-pass" className="block text-sm font-medium text-brand-text mb-1">Conferma nuova password</label>
          <input
            id="confirm-pass"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPass}
            onChange={(e) => setConfirmPass(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-brand-border bg-brand-bg focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors"
            placeholder="Ripeti la nuova password"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 bg-brand-primary text-white font-semibold rounded-lg hover:bg-brand-primary/90 transition-colors disabled:opacity-60"
        >
          {saving ? 'Aggiornamento...' : 'Aggiorna password'}
        </button>
      </form>
    </SectionCard>
  );
}

/* ── Gift Cards ────────────────────────────────────────── */

function GiftCardsSection() {
  const { user } = useAuthStore();
  const [coupons, setCoupons] = useState<{ id: number; code: string; description: string; type: string; amount: string; expires: string | null; usageCount: number; usageLimit: number | null; status: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [redeemCode, setRedeemCode] = useState('');

  useEffect(() => {
    if (!user?.email) { setLoading(false); return; }
    fetch(`/api/coupons/user?email=${encodeURIComponent(user.email)}`)
      .then(r => r.json())
      .then(d => { setCoupons(d.coupons || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user?.email]);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const getCouponLabel = (desc: string, code: string) => {
    const c = code.toLowerCase();
    if (c.startsWith('benvenuto')) return 'Sconto benvenuto';
    if (c.startsWith('grazie')) return 'Premio fedeltà';
    if (c.startsWith('compleanno') || desc.toLowerCase().includes('compleanno')) return 'Buon compleanno';
    if (desc) return desc;
    return 'Coupon';
  };

  if (loading) return <LoadingSpinner />;

  const activeCoupons = coupons.filter(c => c.status === 'active');
  const inactiveCoupons = coupons.filter(c => c.status !== 'active');

  return (
    <div className="space-y-6">
      {/* Redeem code */}
      <SectionCard title="Riscatta un codice">
        <form onSubmit={(e) => { e.preventDefault(); if (redeemCode.trim()) handleCopy(redeemCode.trim()); }} className="flex gap-3 max-w-md">
          <input type="text" value={redeemCode} onChange={(e) => setRedeemCode(e.target.value)}
            className="flex-1 px-4 py-3 rounded-lg border border-[#e5e5e5] bg-white text-[14px] focus:outline-none focus:border-[#005667] focus:ring-1 focus:ring-[#005667]"
            placeholder="Inserisci codice buono o coupon" />
          <button type="submit" className="px-6 py-3 bg-[#005667] text-white font-semibold rounded-lg text-[14px] hover:bg-[#004555] transition-colors shrink-0">Riscatta</button>
        </form>
      </SectionCard>

      {/* Active coupons */}
      <SectionCard title="Coupon attivi">
        {activeCoupons.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-[14px] text-[#888] mb-4">Non hai coupon attivi al momento</p>
            <a href="/cerca?tag=regali" className="inline-block bg-[#005667] text-white rounded-lg px-6 py-3 text-[14px] font-semibold hover:bg-[#004555] transition-colors">Regala un vino</a>
          </div>
        ) : (
          <div className="space-y-3">
            {activeCoupons.map((c) => (
              <div key={c.id} className="border-[1.5px] border-[#005667] rounded-xl p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-[#005667] font-semibold uppercase tracking-wider mb-1">{getCouponLabel(c.description, c.code)}</p>
                  <p className="text-[18px] font-bold text-[#005667]">
                    {c.type === 'percent' ? `${c.amount}%` : `${c.amount}€`}
                    <span className="text-[12px] font-normal text-[#888] ml-1">di sconto</span>
                  </p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[12px] text-[#888] font-mono bg-[#f8f6f1] px-2 py-0.5 rounded">{c.code}</span>
                    {c.expires && (
                      <span className="text-[11px] text-[#888]">Scade il {new Date(c.expires).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    )}
                    {c.usageLimit && (
                      <span className="text-[11px] text-[#888]">{c.usageLimit - c.usageCount} utilizz{c.usageLimit - c.usageCount === 1 ? 'o' : 'i'} rimast{c.usageLimit - c.usageCount === 1 ? 'o' : 'i'}</span>
                    )}
                  </div>
                </div>
                <button onClick={() => handleCopy(c.code)}
                  className={`shrink-0 px-4 py-2.5 rounded-lg text-[12px] font-semibold transition-all ${
                    copied === c.code ? 'bg-green-100 text-green-700' : 'bg-[#005667] text-white hover:bg-[#004555]'
                  }`}>
                  {copied === c.code ? (
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      Copiato!
                    </span>
                  ) : 'Copia codice'}
                </button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Expired/used coupons */}
      {inactiveCoupons.length > 0 && (
        <SectionCard title="Coupon scaduti o usati">
          <div className="space-y-3">
            {inactiveCoupons.map((c) => (
              <div key={c.id} className="border border-[#e8e4dc] rounded-xl p-4 flex items-center gap-4 opacity-50">
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-[#888] font-semibold uppercase tracking-wider mb-1">{getCouponLabel(c.description, c.code)}</p>
                  <p className="text-[16px] font-bold text-[#888]">
                    {c.type === 'percent' ? `${c.amount}%` : `${c.amount}€`}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[12px] text-[#aaa] font-mono">{c.code}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${c.status === 'expired' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                      {c.status === 'expired' ? 'Scaduto' : 'Già usato'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Gift card CTA */}
      <div className="bg-[#f8f6f1] border border-[#e8e4dc] rounded-xl p-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-[15px] font-semibold text-[#1a1a1a]">Regala un&apos;esperienza enologica</p>
          <p className="text-[13px] text-[#888]">Acquista un buono regalo Stappando</p>
        </div>
        <a href="/cerca?tag=regali" className="shrink-0 bg-[#1a1a1a] text-[#d9c39a] rounded-lg px-5 py-2.5 text-[13px] font-semibold hover:bg-[#333] transition-colors">
          Regala un vino
        </a>
      </div>
    </div>
  );
}

/* ── Support Ticket ────────────────────────────────────── */

function SupportSection({ user }: { user: { id: number; email: string; firstName: string; lastName: string } }) {
  const [orderId, setOrderId] = useState('');
  const [issue, setIssue] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await sendSupportTicket({
        orderId,
        issue,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
      });
      setSent(true);
    } catch {
      // sendSupportTicket falls back to mailto
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <SectionCard title="Ticket assistenza">
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-brand-text">Richiesta inviata</h3>
          <p className="text-sm text-brand-muted mt-2">
            Il nostro team di assistenza ti risponderà il prima possibile a <strong>{user.email}</strong>.
          </p>
          <button
            type="button"
            onClick={() => { setSent(false); setOrderId(''); setIssue(''); }}
            className="mt-4 text-sm text-brand-primary font-semibold hover:underline"
          >
            Invia un altro ticket
          </button>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Ticket assistenza">
      <p className="text-sm text-brand-muted mb-4">
        Hai bisogno di aiuto con un ordine? Compila il modulo e il nostro team ti risponderà al più presto.
      </p>
      <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
        <div>
          <label htmlFor="ticket-order" className="block text-sm font-medium text-brand-text mb-1">
            Numero ordine
          </label>
          <input
            id="ticket-order"
            type="text"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-brand-border bg-brand-bg focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors"
            placeholder="Es. 12345"
          />
        </div>
        <div>
          <label htmlFor="ticket-issue" className="block text-sm font-medium text-brand-text mb-1">
            Descrivi la problematica *
          </label>
          <textarea
            id="ticket-issue"
            required
            rows={5}
            value={issue}
            onChange={(e) => setIssue(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-brand-border bg-brand-bg focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors resize-none"
            placeholder="Descrivi il problema riscontrato..."
          />
        </div>
        <div className="bg-brand-bg rounded-lg p-3 text-sm text-brand-muted">
          La risposta verrà inviata a <strong>{user.email}</strong>
        </div>
        <button
          type="submit"
          disabled={sending}
          className="w-full py-3 bg-brand-primary text-white font-semibold rounded-lg hover:bg-brand-primary/90 transition-colors disabled:opacity-60"
        >
          {sending ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Invio in corso...
            </span>
          ) : (
            'Invia richiesta di assistenza'
          )}
        </button>
      </form>
    </SectionCard>
  );
}

/* ══════════════════════════════════════════════════════════
   TRACKING SECTION
   ══════════════════════════════════════════════════════════ */

function TrackingSection({ userId }: { userId: number }) {
  const [orders, setOrders] = useState<WCOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders(userId).then((o) => { setOrders(o); setLoading(false); }).catch(() => setLoading(false));
  }, [userId]);

  if (loading) return <LoadingSpinner />;

  const shippedOrders = orders.filter(o => ['completed', 'processing'].includes(o.status));

  const steps = ['Ordinato', 'In preparazione', 'Spedito', 'In consegna', 'Consegnato'];
  const getStep = (status: string) => {
    if (status === 'completed') return 4;
    if (status === 'processing') return 1;
    return 0;
  };

  return (
    <SectionCard title="Tracciamento spedizioni">
      {shippedOrders.length === 0 ? (
        <p className="text-[14px] text-[#888] py-8 text-center">Nessun ordine in spedizione</p>
      ) : (
        <div className="space-y-6">
          {shippedOrders.slice(0, 10).map((order) => {
            const currentStep = getStep(order.status);
            return (
              <div key={order.id} className="border border-[#e8e4dc] rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[14px] font-bold">Ordine #{order.number}</p>
                    <p className="text-[12px] text-[#888]">{new Date(order.date_created).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                  <span className={`text-[11px] font-semibold px-3 py-1 rounded-full ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
                    {statusLabels[order.status] || order.status}
                  </span>
                </div>

                {/* Timeline */}
                <div className="flex items-center gap-0 mb-2">
                  {steps.map((s, i) => (
                    <div key={s} className="flex-1 flex flex-col items-center">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        i <= currentStep ? 'bg-[#005667] text-white' : 'bg-[#e8e4dc] text-[#bbb]'
                      }`}>{i < currentStep ? '✓' : i + 1}</div>
                      <p className={`text-[9px] mt-1 text-center ${i <= currentStep ? 'text-[#005667] font-semibold' : 'text-[#bbb]'}`}>{s}</p>
                      {i < steps.length - 1 && (
                        <div className={`h-0.5 w-full absolute ${i < currentStep ? 'bg-[#005667]' : 'bg-[#e8e4dc]'}`} />
                      )}
                    </div>
                  ))}
                </div>

                {order.status === 'completed' && (
                  <p className="text-[12px] text-[#005667] font-medium mt-3 text-center">Consegnato con successo</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}

/* ══════════════════════════════════════════════════════════
   PAYMENT METHODS SECTION
   ══════════════════════════════════════════════════════════ */

function PaymentMethodsSection() {
  return (
    <SectionCard title="Metodi di pagamento">
      <div className="space-y-5">
        <p className="text-[14px] text-[#888]">I metodi di pagamento accettati su Stappando:</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { name: 'Carta di credito', desc: 'Visa, Mastercard, Amex' },
            { name: 'PayPal', desc: 'Account PayPal o carta' },
            { name: 'Satispay', desc: 'Pagamento mobile' },
            { name: 'Klarna', desc: 'Paga in 3 rate' },
            { name: 'Google Pay', desc: 'Dal tuo telefono' },
            { name: 'Apple Pay', desc: 'Solo dispositivi Apple' },
          ].map((m) => (
            <div key={m.name} className="border border-[#e8e4dc] rounded-xl p-4">
              <svg className="w-6 h-6 text-[#005667] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
              </svg>
              <p className="text-[13px] font-semibold text-[#1a1a1a]">{m.name}</p>
              <p className="text-[11px] text-[#888]">{m.desc}</p>
            </div>
          ))}
        </div>
        <div className="bg-[#f8f6f1] rounded-xl p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-[#005667] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
          <div>
            <p className="text-[13px] font-semibold text-[#1a1a1a]">Pagamento sicuro</p>
            <p className="text-[12px] text-[#888]">I dati di pagamento non vengono mai salvati sui nostri server. Tutti i pagamenti sono processati da Stripe e PayPal con crittografia SSL 256-bit.</p>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

/* ══════════════════════════════════════════════════════════
   REVIEWS SECTION
   ══════════════════════════════════════════════════════════ */

function ReviewsSection({ userId }: { userId: number }) {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<WCOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewed, setReviewed] = useState<Set<number>>(new Set());
  const [activeReview, setActiveReview] = useState<number | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successId, setSuccessId] = useState<number | null>(null);

  useEffect(() => {
    fetchOrders(userId).then((o) => { setOrders(o); setLoading(false); }).catch(() => setLoading(false));
  }, [userId]);

  const handleSubmitReview = async (productId: number) => {
    if (rating === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          rating,
          review: reviewText,
          reviewer: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
          reviewerEmail: user?.email || '',
        }),
      });
      if (res.ok) {
        setReviewed(new Set([...reviewed, productId]));
        setSuccessId(productId);
        setActiveReview(null);
        setRating(0);
        setReviewText('');
        setTimeout(() => setSuccessId(null), 4000);
      }
    } catch {}
    setSubmitting(false);
  };

  if (loading) return <LoadingSpinner />;

  const completedOrders = orders.filter(o => o.status === 'completed');
  const allProducts = completedOrders.flatMap(o => o.line_items || []);
  const seen = new Set<number>();
  const uniqueProducts = allProducts.filter(p => {
    if (seen.has(p.product_id) || reviewed.has(p.product_id)) return false;
    seen.add(p.product_id);
    return true;
  });

  return (
    <SectionCard title="Lascia una recensione">
      <p className="text-[14px] text-[#888] mb-6">
        Ogni recensione ti fa guadagnare <strong className="text-[#005667]">100 Punti POP</strong>
      </p>

      {successId && (
        <div className="p-4 mb-4 bg-green-50 border border-green-200 rounded-xl text-[13px] text-green-700 flex items-center gap-2">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          Recensione inviata! +100 Punti POP accreditati
        </div>
      )}

      {uniqueProducts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-[14px] text-[#888] mb-4">{reviewed.size > 0 ? 'Hai recensito tutti i prodotti!' : 'Nessun prodotto da recensire.'}</p>
          <a href="/cerca" className="inline-block bg-[#005667] text-white rounded-lg px-6 py-3 text-[14px] font-semibold hover:bg-[#004555] transition-colors">Scopri i vini</a>
        </div>
      ) : (
        <div className="space-y-4">
          {uniqueProducts.slice(0, 20).map((product) => (
            <div key={product.product_id} className="border border-[#e8e4dc] rounded-xl overflow-hidden">
              <div className="flex items-center gap-4 p-4">
                <div className="w-12 h-16 rounded-lg bg-gradient-to-br from-[#f5f1ea] to-[#e8e0d2] flex items-center justify-center shrink-0 overflow-hidden">
                  {product.image?.src && <img src={product.image.src} alt={product.name} className="w-full h-full object-contain" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-[#1a1a1a] truncate">{product.name}</p>
                  <p className="text-[11px] text-[#888]">+100 Punti POP per la recensione</p>
                </div>
                <button
                  onClick={() => { setActiveReview(activeReview === product.product_id ? null : product.product_id); setRating(0); setReviewText(''); }}
                  className="shrink-0 bg-[#005667] text-white rounded-lg px-4 py-2.5 text-[12px] font-semibold hover:bg-[#004555] transition-colors"
                >
                  {activeReview === product.product_id ? 'Chiudi' : 'Recensisci'}
                </button>
              </div>

              {activeReview === product.product_id && (
                <div className="border-t border-[#e8e4dc] p-4 bg-[#f8f6f1]">
                  {/* Stars */}
                  <div className="flex items-center gap-1 mb-3">
                    <span className="text-[12px] text-[#888] mr-2">Voto:</span>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button key={s} type="button"
                        onMouseEnter={() => setHoverRating(s)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(s)}
                        className="p-0.5"
                      >
                        <svg className={`w-7 h-7 transition-colors ${s <= (hoverRating || rating) ? 'text-[#d9c39a]' : 'text-[#ddd]'}`}
                          viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                      </button>
                    ))}
                    {rating > 0 && <span className="text-[12px] text-[#005667] font-semibold ml-2">{rating}/5</span>}
                  </div>
                  {/* Text */}
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    rows={3}
                    placeholder="Racconta la tua esperienza con questo vino..."
                    className="w-full px-4 py-3 rounded-lg border border-[#e5e5e5] bg-white text-[14px] focus:outline-none focus:border-[#005667] focus:ring-1 focus:ring-[#005667] resize-none mb-3"
                  />
                  <button
                    onClick={() => handleSubmitReview(product.product_id)}
                    disabled={submitting || rating === 0}
                    className="w-full sm:w-auto px-6 py-2.5 bg-[#005667] text-white rounded-lg text-[13px] font-semibold hover:bg-[#004555] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Invio...' : `Invia recensione${rating > 0 ? ` (${rating}★)` : ''}`}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

/* ── Shared small components ───────────────────────────── */

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand-bg flex items-center justify-center">
        <svg className="w-8 h-8 text-brand-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      </div>
      <p className="text-sm text-brand-muted">{message}</p>
    </div>
  );
}
