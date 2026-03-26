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

function IconGear() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
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
  | 'punti'
  | 'buoni'
  | 'profilo'
  | 'indirizzi'
  | 'pagamenti'
  | 'preferenze'
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
    ],
  },
  {
    label: 'VANTAGGI',
    items: [
      { key: 'punti', label: 'Punti POP & storico', icon: IconStar },
      { key: 'buoni', label: 'Buoni regalo & coupon', icon: IconGift },
      { key: 'recensioni', label: 'Lascia una recensione', icon: IconStar },
    ],
  },
  {
    label: 'ACCOUNT',
    items: [
      { key: 'profilo', label: 'Profilo & sicurezza', icon: IconUser },
      { key: 'indirizzi', label: 'Indirizzi', icon: IconMap },
      { key: 'pagamenti', label: 'Metodi di pagamento', icon: IconLock },
      { key: 'preferenze', label: 'Preferenze', icon: IconGear },
    ],
  },
  {
    label: 'SUPPORTO',
    items: [
      { key: 'assistenza', label: 'Assistenza & ticket', icon: IconTicket },
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
          {activeSection === 'punti' && <PointsSection userId={user.id} />}
          {activeSection === 'buoni' && <GiftCardsSection />}
          {activeSection === 'profilo' && <ProfileSection user={user} />}
          {activeSection === 'indirizzi' && <AddressesSection userId={user.id} />}
          {activeSection === 'pagamenti' && <PaymentMethodsSection />}
          {activeSection === 'preferenze' && <PreferencesSection userId={user.id} />}
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

/* ── Orders (unified with tracking + reso) ─────────────── */

type OrderFilter = 'all' | 'processing' | 'completed' | 'cancelled';

function OrdersSection({ userId }: { userId: number }) {
  const [orders, setOrders] = useState<WCOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [filter, setFilter] = useState<OrderFilter>('all');
  const [resoOrder, setResoOrder] = useState<WCOrder | null>(null);
  const [trackingModal, setTrackingModal] = useState<{ trackingNumber: string; zipCode: string } | null>(null);
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    fetchOrders(userId).then((data) => { setOrders(data); setLoading(false); });
  }, [userId]);

  const handleReorder = (order: WCOrder) => {
    order.line_items.forEach(item => {
      addItem({ id: item.product_id, name: item.name, price: parseFloat(item.price), image: item.image?.src || '', vendorId: 'default', vendorName: DEFAULT_VENDOR_NAME });
    });
    alert('Prodotti aggiunti al carrello!');
  };

  const getTrackingNumber = (order: WCOrder): string | null => {
    const meta = (order as unknown as { meta_data?: { key: string; value: string }[] }).meta_data || [];
    const t = meta.find(m => m.key === '_tracking_number' || m.key === 'tracking_number' || m.key === 'sp_tracking_number' || m.key === '_wc_shipment_tracking_items');
    if (t?.value) { try { const p = JSON.parse(t.value); return p[0]?.tracking_number || t.value; } catch { return t.value; } }
    return null;
  };

  const getZipCode = (order: WCOrder): string => (order as unknown as { shipping?: { postcode?: string } }).shipping?.postcode || '';

  const trackingSteps = ['Ordinato', 'Preparazione', 'Spedito', 'In consegna', 'Consegnato'];
  const getStep = (status: string) => { if (status === 'completed') return 4; if (status === 'processing') return 1; return 0; };

  const getReturnStatus = (order: WCOrder): string | null => {
    const meta = (order as unknown as { meta_data?: { key: string; value: string }[] }).meta_data || [];
    const rs = meta.find(m => m.key === '_return_status');
    return rs?.value || null;
  };

  const returnLabels: Record<string, { label: string; css: string }> = {
    requested: { label: 'Reso richiesto', css: 'bg-orange-100 text-orange-700' },
    approved: { label: 'Reso approvato', css: 'bg-blue-100 text-blue-700' },
    completed: { label: 'Reso completato', css: 'bg-green-100 text-green-700' },
  };

  const filters: { key: OrderFilter; label: string }[] = [
    { key: 'all', label: 'Tutti' }, { key: 'processing', label: 'In corso' },
    { key: 'completed', label: 'Completati' }, { key: 'cancelled', label: 'Annullati' },
  ];

  const filtered = filter === 'all' ? orders : orders.filter(o => {
    if (filter === 'processing') return ['processing', 'on-hold', 'pending'].includes(o.status);
    return o.status === filter;
  });

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <div className="bg-white rounded-2xl border border-[#e8e4dc] shadow-sm">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e8e4dc] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-[17px] font-bold text-[#005667]">I miei ordini <span className="text-[13px] font-normal text-[#888]">({orders.length})</span></h2>
          <div className="flex gap-2 flex-wrap">
            {filters.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`px-3.5 py-1.5 rounded-full text-[11px] font-semibold transition-colors ${filter === f.key ? 'bg-[#005667] text-white' : 'bg-white border border-[#e8e4dc] text-[#888] hover:border-[#005667] hover:text-[#005667]'}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {filtered.length === 0 ? (
            <EmptyState message="Nessun ordine trovato." />
          ) : (
            <div className="space-y-4">
              {filtered.map((order) => {
                const isOpen = expanded === order.id;
                const currentStep = getStep(order.status);
                const trackNum = getTrackingNumber(order);

                return (
                  <div key={order.id} className={`border rounded-xl overflow-hidden transition-colors ${isOpen ? 'border-[#005667]/30' : 'border-[#e8e4dc] hover:border-[#005667]/20'}`}>
                    {/* Closed row */}
                    <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setExpanded(isOpen ? null : order.id)}>
                      {/* Stacked product images */}
                      <div className="flex -space-x-2 shrink-0">
                        {order.line_items.slice(0, 3).map((item, i) => (
                          <div key={item.id} className="w-9 h-9 rounded-full border-2 border-white bg-gradient-to-br from-[#f5f1ea] to-[#e8e0d2] overflow-hidden" style={{ zIndex: 3 - i }}>
                            {item.image?.src && <img src={item.image.src} alt="" className="w-full h-full object-cover" />}
                          </div>
                        ))}
                        {order.line_items.length > 3 && (
                          <div className="w-9 h-9 rounded-full border-2 border-white bg-[#e8e4dc] flex items-center justify-center text-[9px] font-bold text-[#888]">+{order.line_items.length - 3}</div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[14px] font-bold text-[#1a1a1a]">#{order.number}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
                            {statusLabels[order.status] || order.status}
                          </span>
                          {(() => { const rs = getReturnStatus(order); return rs && returnLabels[rs] ? <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${returnLabels[rs].css}`}>{returnLabels[rs].label}</span> : null; })()}
                        </div>
                        <p className="text-[11px] text-[#888] mt-0.5">{safeDate(order.date_created)} · {formatPrice(order.total)} €</p>
                      </div>

                      {/* Action buttons — desktop only */}
                      <div className="hidden sm:flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <button onClick={() => handleReorder(order)} className="px-3 py-1.5 bg-[#005667] text-white rounded-md text-[11px] font-semibold hover:bg-[#004555] transition-colors">Riordina</button>
                        {['completed', 'processing'].includes(order.status) && (
                          <button onClick={() => trackNum ? setTrackingModal({ trackingNumber: trackNum, zipCode: getZipCode(order) }) : alert('Tracking non ancora disponibile. Riceverai una mail con il link di tracciamento quando l\'ordine verrà spedito.')} className="px-3 py-1.5 border border-[#005667] text-[#005667] rounded-md text-[11px] font-semibold hover:bg-[#005667]/5 transition-colors">Traccia</button>
                        )}
                        {order.status === 'completed' && !getReturnStatus(order) && (
                          <button onClick={() => setResoOrder(order)} className="px-3 py-1.5 border border-[#e8e4dc] text-[#888] rounded-md text-[11px] font-semibold hover:bg-[#f8f6f1] transition-colors">Reso</button>
                        )}
                      </div>

                      <svg className={`w-4 h-4 text-[#bbb] transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>

                    {/* Expanded detail */}
                    {isOpen && (
                      <div className="border-t border-[#f0f0f0] bg-[#fafaf8]">
                        {/* Timeline */}
                        {['processing', 'completed'].includes(order.status) && (
                          <div className="px-6 py-5">
                            <div className="relative flex items-start justify-between">
                              <div className="absolute top-4 left-[10%] right-[10%] h-0.5 bg-[#e8e4dc]" />
                              <div className="absolute top-4 left-[10%] h-0.5 bg-[#005667] transition-all" style={{ width: `${Math.min((currentStep / 4) * 80, 80)}%` }} />
                              {trackingSteps.map((s, i) => (
                                <div key={s} className="flex flex-col items-center relative z-10" style={{ width: '20%' }}>
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                    i < currentStep ? 'bg-[#005667] text-white' : i === currentStep ? 'bg-[#005667] text-white animate-pulse' : 'bg-white border-2 border-[#e8e4dc] text-[#bbb]'
                                  }`}>
                                    {i < currentStep ? <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> : i + 1}
                                  </div>
                                  <p className={`text-[8px] mt-1.5 text-center ${i <= currentStep ? 'text-[#005667] font-semibold' : 'text-[#bbb]'}`}>{s}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Products */}
                        <div className="px-6 pb-4 space-y-2.5">
                          {order.line_items.map((item) => (
                            <div key={item.id} className="flex items-center gap-3">
                              <div className="w-12 h-16 rounded-lg bg-gradient-to-br from-[#f5f1ea] to-[#e8e0d2] overflow-hidden shrink-0 flex items-center justify-center">
                                {item.image?.src && <img src={item.image.src} alt={item.name} className="w-full h-full object-contain" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <a href={`/prodotto/${item.product_id}`} className="text-[13px] font-semibold text-[#1a1a1a] truncate hover:text-[#005667] transition-colors block">{item.name}</a>
                                <p className="text-[11px] text-[#888]">x{item.quantity}</p>
                              </div>
                              <p className="text-[13px] font-bold text-[#005667] shrink-0">{formatPrice(item.price)} €</p>
                            </div>
                          ))}
                        </div>

                        {/* Summary */}
                        <div className="px-6 py-3 border-t border-[#f0f0f0] flex items-center justify-between">
                          <p className="text-[13px] text-[#888]">Totale ordine</p>
                          <p className="text-[16px] font-bold text-[#005667]">{formatPrice(order.total)} €</p>
                        </div>

                        {/* Mobile actions */}
                        <div className="sm:hidden px-6 pb-4 flex gap-2">
                          <button onClick={() => handleReorder(order)} className="flex-1 py-2.5 bg-[#005667] text-white rounded-lg text-[12px] font-semibold">Riordina</button>
                          {['completed', 'processing'].includes(order.status) && (
                            <button onClick={() => trackNum ? setTrackingModal({ trackingNumber: trackNum, zipCode: getZipCode(order) }) : alert('Tracking non ancora disponibile.')} className="flex-1 py-2.5 border border-[#005667] text-[#005667] rounded-lg text-[12px] font-semibold">Traccia</button>
                          )}
                          {order.status === 'completed' && !getReturnStatus(order) && <button onClick={() => setResoOrder(order)} className="py-2.5 px-4 border border-[#e8e4dc] text-[#888] rounded-lg text-[12px] font-semibold">Reso</button>}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ShippyPro tracking modal */}
      {trackingModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setTrackingModal(null)} />
          <div className="relative bg-white rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0f0f0]">
              <h3 className="text-[15px] font-bold">Traccia la tua spedizione</h3>
              <button onClick={() => setTrackingModal(null)} className="p-2 hover:bg-[#f0f0f0] rounded-lg"><svg className="w-5 h-5 text-[#888]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <iframe src={`https://www.shippypro.com/tracking/?tracking=${encodeURIComponent(trackingModal.trackingNumber)}&zip=${encodeURIComponent(trackingModal.zipCode)}`} className="w-full h-[400px] border-0" title="Tracking" />
          </div>
        </div>
      )}

      {/* Reso modal */}
      {resoOrder && <ResoModal order={resoOrder} onClose={() => setResoOrder(null)} />}
    </>
  );
}

/* ── Reso Modal (4 step) ──────────────────────────────── */

function ResoModal({ order, onClose }: { order: WCOrder; onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [reason, setReason] = useState('');
  const [otherText, setOtherText] = useState('');
  const [pickup, setPickup] = useState<'self' | 'home'>('self');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupSlot, setPickupSlot] = useState('9:00-13:00');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const toggleItem = (id: number) => setSelectedItems(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const selectedTotal = order.line_items.filter(i => selectedItems.includes(i.id)).reduce((sum, i) => sum + parseFloat(i.price) * i.quantity, 0);
  const refundAmount = pickup === 'home' ? Math.max(selectedTotal - 2.5, 0) : selectedTotal;

  const reasons = [
    'Prodotto danneggiato alla consegna',
    'Prodotto diverso da quanto ordinato',
    'Ho cambiato idea',
    'Altro',
  ];

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await fetch('/api/support/reso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          orderNumber: order.number,
          items: selectedItems,
          productNames: order.line_items.filter(i => selectedItems.includes(i.id)).map(i => i.name),
          productQtys: order.line_items.filter(i => selectedItems.includes(i.id)).map(i => i.quantity),
          customerName: `${(order as unknown as { billing?: { first_name?: string; last_name?: string } }).billing?.first_name || ''} ${(order as unknown as { billing?: { last_name?: string } }).billing?.last_name || ''}`.trim(),
          customerEmail: (order as unknown as { billing?: { email?: string } }).billing?.email || '',
          reason: reason === 'Altro' ? otherText : reason,
          pickup,
          pickupDate: pickup === 'home' ? pickupDate : null,
          pickupSlot: pickup === 'home' ? pickupSlot : null,
          refundAmount,
        }),
      });
    } catch {}
    setDone(true);
    setSubmitting(false);
  };

  const stepIndicator = (
    <div className="flex items-center justify-center gap-2 mb-6">
      {[1, 2, 3, 4].map(s => (
        <div key={s} className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold ${
          s < step ? 'bg-[#005667] text-white' : s === step ? 'bg-[#005667] text-white' : 'bg-[#e8e4dc] text-[#bbb]'
        }`}>
          {s < step ? <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> : s}
        </div>
      ))}
    </div>
  );

  if (done) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-2xl w-full max-w-[480px] p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-[#e8f4f1] flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#005667]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          </div>
          <h3 className="text-[18px] font-bold text-[#1a1a1a] mb-2">Richiesta reso inviata</h3>
          <p className="text-[13px] text-[#888] mb-6">Riceverai una mail di conferma con le istruzioni. Il rimborso verrà elaborato entro 5-7 giorni lavorativi.</p>
          <button onClick={onClose} className="px-8 py-3 bg-[#005667] text-white rounded-lg text-[14px] font-semibold hover:bg-[#004555] transition-colors">Chiudi</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-[480px] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white px-7 pt-6 pb-4 border-b border-[#f0f0f0] z-10">
          <button onClick={onClose} className="absolute top-5 right-5 p-2 hover:bg-[#f0f0f0] rounded-lg">
            <svg className="w-5 h-5 text-[#888]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <h3 className="text-[17px] font-bold text-[#1a1a1a]">Richiesta reso · Ordine #{order.number}</h3>
        </div>

        <div className="px-7 py-6">
          {stepIndicator}

          {/* Step 1 — Select products */}
          {step === 1 && (
            <>
              <h4 className="text-[15px] font-semibold mb-4">Quale prodotto vuoi rendere?</h4>
              <div className="space-y-2.5 mb-6">
                {order.line_items.map(item => (
                  <label key={item.id} className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${selectedItems.includes(item.id) ? 'border-[#005667] bg-[#005667]/5' : 'border-[#e8e4dc] hover:border-[#005667]/30'}`}>
                    <input type="checkbox" checked={selectedItems.includes(item.id)} onChange={() => toggleItem(item.id)} className="w-4 h-4 rounded border-[#ccc] text-[#005667] focus:ring-[#005667] shrink-0" />
                    <div className="w-10 h-14 rounded-lg bg-gradient-to-br from-[#f5f1ea] to-[#e8e0d2] overflow-hidden shrink-0">
                      {item.image?.src && <img src={item.image.src} alt="" className="w-full h-full object-contain" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold truncate">{item.name}</p>
                      <p className="text-[11px] text-[#888]">x{item.quantity} · {formatPrice(item.price)} €</p>
                    </div>
                  </label>
                ))}
              </div>
              <button onClick={() => setStep(2)} disabled={selectedItems.length === 0} className="w-full py-3 bg-[#005667] text-white rounded-lg text-[14px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#004555] transition-colors">Continua →</button>
            </>
          )}

          {/* Step 2 — Reason */}
          {step === 2 && (
            <>
              <h4 className="text-[15px] font-semibold mb-4">Perché vuoi fare il reso?</h4>
              <div className="space-y-2.5 mb-5">
                {reasons.map(r => (
                  <label key={r} className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${reason === r ? 'border-[#005667] bg-[#005667]/5' : 'border-[#e8e4dc]'}`}>
                    <input type="radio" name="reason" checked={reason === r} onChange={() => setReason(r)} className="w-4 h-4 text-[#005667] focus:ring-[#005667]" />
                    <span className="text-[13px]">{r}</span>
                  </label>
                ))}
                {reason === 'Altro' && (
                  <textarea value={otherText} onChange={e => setOtherText(e.target.value)} rows={3} placeholder="Descrivi il motivo..." className="w-full px-4 py-3 rounded-lg border border-[#e5e5e5] text-[13px] focus:outline-none focus:border-[#005667] resize-none" />
                )}
              </div>

              {/* Warning box */}
              <div className="p-4 mb-5 rounded-xl border border-[#c0392b] bg-[#fce4ec]">
                <p className="text-[12px] text-[#c0392b] leading-relaxed">
                  <strong>Attenzione:</strong> le bottiglie che arrivano rotte in magazzino non sono rimborsabili. Assicurati di imballare correttamente i prodotti prima della spedizione.
                </p>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 py-3 border border-[#e8e4dc] rounded-lg text-[13px] font-semibold hover:bg-[#f8f6f1] transition-colors">← Indietro</button>
                <button onClick={() => setStep(3)} disabled={!reason || (reason === 'Altro' && !otherText.trim())} className="flex-1 py-3 bg-[#005667] text-white rounded-lg text-[14px] font-semibold disabled:opacity-40 hover:bg-[#004555] transition-colors">Continua →</button>
              </div>
            </>
          )}

          {/* Step 3 — Pickup method */}
          {step === 3 && (
            <>
              <h4 className="text-[15px] font-semibold mb-4">Come vuoi restituire i prodotti?</h4>
              <div className="space-y-3 mb-6">
                <label className={`block p-4 rounded-xl border cursor-pointer transition-colors ${pickup === 'self' ? 'border-[#005667] bg-[#005667]/5' : 'border-[#e8e4dc]'}`} onClick={() => setPickup('self')}>
                  <div className="flex items-start gap-3">
                    <input type="radio" checked={pickup === 'self'} readOnly className="mt-1 w-4 h-4 text-[#005667] focus:ring-[#005667]" />
                    <div>
                      <p className="text-[14px] font-semibold">Porto il pacco alle Poste</p>
                      <p className="text-[12px] text-[#888] mt-0.5">Gratuito · Entro 14 giorni</p>
                    </div>
                  </div>
                </label>
                <label className={`block p-4 rounded-xl border cursor-pointer transition-colors ${pickup === 'home' ? 'border-[#005667] bg-[#005667]/5' : 'border-[#e8e4dc]'}`} onClick={() => setPickup('home')}>
                  <div className="flex items-start gap-3">
                    <input type="radio" checked={pickup === 'home'} readOnly className="mt-1 w-4 h-4 text-[#005667] focus:ring-[#005667]" />
                    <div>
                      <p className="text-[14px] font-semibold">Ritiro a domicilio</p>
                      <p className="text-[12px] text-[#888] mt-0.5">+2,50€ · Scegli data e fascia oraria</p>
                    </div>
                  </div>
                </label>
              </div>

              {pickup === 'home' && (
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div>
                    <label className="block text-[11px] text-[#888] uppercase tracking-wider mb-1.5">Data ritiro</label>
                    <input type="date" value={pickupDate} onChange={e => setPickupDate(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-[#e5e5e5] text-[13px] focus:outline-none focus:border-[#005667]" />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#888] uppercase tracking-wider mb-1.5">Fascia oraria</label>
                    <select value={pickupSlot} onChange={e => setPickupSlot(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-[#e5e5e5] text-[13px] focus:outline-none focus:border-[#005667]">
                      <option value="9:00-13:00">9:00 – 13:00</option>
                      <option value="13:00-18:00">13:00 – 18:00</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 py-3 border border-[#e8e4dc] rounded-lg text-[13px] font-semibold hover:bg-[#f8f6f1] transition-colors">← Indietro</button>
                <button onClick={() => setStep(4)} disabled={pickup === 'home' && !pickupDate} className="flex-1 py-3 bg-[#005667] text-white rounded-lg text-[14px] font-semibold disabled:opacity-40 hover:bg-[#004555] transition-colors">Continua →</button>
              </div>
            </>
          )}

          {/* Step 4 — Confirm */}
          {step === 4 && (
            <>
              <h4 className="text-[15px] font-semibold mb-4">Conferma reso</h4>
              <div className="bg-[#f8f6f1] rounded-xl p-4 mb-5 space-y-2.5">
                <div className="flex justify-between text-[13px]"><span className="text-[#888]">Prodotti</span><span className="font-semibold">{selectedItems.length}</span></div>
                <div className="flex justify-between text-[13px]"><span className="text-[#888]">Motivo</span><span className="font-medium text-right max-w-[60%] truncate">{reason === 'Altro' ? otherText : reason}</span></div>
                <div className="flex justify-between text-[13px]"><span className="text-[#888]">Modalità</span><span className="font-medium">{pickup === 'self' ? 'Porto alle Poste' : 'Ritiro a domicilio'}</span></div>
                {pickup === 'home' && (
                  <>
                    <div className="flex justify-between text-[13px]"><span className="text-[#888]">Data ritiro</span><span className="font-medium">{safeDate(pickupDate)} · {pickupSlot}</span></div>
                    <div className="flex justify-between text-[13px]"><span className="text-[#888]">Costo ritiro</span><span className="font-medium text-[#c0392b]">−2,50 €</span></div>
                  </>
                )}
                <div className="flex justify-between text-[15px] pt-2 border-t border-[#e0dbd4]"><span className="font-semibold">Rimborso stimato</span><span className="font-bold text-[#005667]">{formatPrice(refundAmount)} €</span></div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(3)} className="flex-1 py-3 border border-[#e8e4dc] rounded-lg text-[13px] font-semibold hover:bg-[#f8f6f1] transition-colors">← Indietro</button>
                <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-3 bg-[#005667] text-white rounded-lg text-[14px] font-semibold disabled:opacity-60 hover:bg-[#004555] transition-colors">{submitting ? 'Invio...' : 'Invia richiesta reso'}</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
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

function safeDate(dateString: string): string {
  if (!dateString) return '—';
  const d = new Date(dateString);
  return !isNaN(d.getTime()) ? d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
}

function PointsSection({ userId }: { userId: number }) {
  const { user } = useAuthStore();
  const [points, setPoints] = useState<{ points: number; history: { date: string; points: number; reason: string }[] }>({ points: 0, history: [] });
  const [loading, setLoading] = useState(true);

  // Redeem state
  const [redeemAmount, setRedeemAmount] = useState(100);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemResult, setRedeemResult] = useState<{ code: string; euroValue: string; remainingPoints: number } | null>(null);
  const [redeemError, setRedeemError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchPoints(userId).then((data) => { setPoints(data); setLoading(false); });
  }, [userId]);

  const handleRedeem = async () => {
    setRedeeming(true);
    setRedeemError('');
    try {
      const res = await fetch('/api/points/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          points: redeemAmount,
          email: user?.email,
          firstName: user?.firstName,
          lastName: user?.lastName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore');
      setRedeemResult(data);
      setPoints(prev => ({ ...prev, points: data.remainingPoints }));
    } catch (err) {
      setRedeemError(err instanceof Error ? err.message : 'Errore nel riscatto');
    }
    setRedeeming(false);
  };

  const handleCopyCode = () => {
    if (redeemResult?.code) {
      navigator.clipboard.writeText(redeemResult.code).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) return <LoadingSpinner />;

  const euroValue = (points.points / 100).toFixed(2).replace('.', ',');
  const nextEuro = 100 - (points.points % 100);
  const progressPct = Math.min(((points.points % 100) / 100) * 100, 100);
  const canRedeem = points.points >= 100;
  const maxRedeem = Math.floor(points.points / 100) * 100;
  const redeemEuro = (redeemAmount / 100).toFixed(2).replace('.', ',');

  return (
    <div className="space-y-6">
      {/* Saldo hero */}
      <div className="bg-[#1a1a1a] border-[1.5px] border-[#d9c39a] rounded-2xl p-8 text-center">
        <p className="text-[10px] text-[#d9c39a] font-bold uppercase tracking-[0.1em] mb-3">I tuoi Punti POP</p>
        <p className="text-[48px] font-bold text-[#d9c39a] leading-none mb-2">{points.points}</p>
        <p className="text-[13px] text-[#888]">= {euroValue}€ di sconto disponibile</p>

        {/* Progress bar */}
        <div className="mt-6 max-w-xs mx-auto">
          <div className="flex justify-between text-[10px] text-[#666] mb-1.5">
            <span>{points.points % 100} / 100</span>
            <span>{nextEuro} punti al prossimo euro</span>
          </div>
          <div className="w-full h-2 bg-[#333] rounded-full overflow-hidden">
            <div className="h-full bg-[#d9c39a] rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>

      {/* Redeem section */}
      {!redeemResult ? (
        <div className="bg-[#1a1a1a] border-[1.5px] border-[#d9c39a] rounded-2xl p-6">
          <h3 className="text-[18px] font-bold text-[#d9c39a] mb-2">Riscatta i tuoi punti</h3>
          <p className="text-[13px] text-[#999] mb-5 leading-relaxed">
            Scegli quanti punti vuoi riscattare. Ogni 100 punti = 1€ di sconto.
            Ti generiamo un codice da usare al checkout.
          </p>

          {canRedeem ? (
            <>
              <div className="mb-4">
                <label className="block text-[11px] text-[#888] uppercase tracking-wider mb-2">Quanti punti vuoi riscattare?</label>
                <input
                  type="range"
                  min={100} max={maxRedeem} step={100}
                  value={redeemAmount}
                  onChange={e => setRedeemAmount(Number(e.target.value))}
                  className="w-full h-2 bg-[#333] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-[#d9c39a] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[24px] font-bold text-[#d9c39a]">{redeemAmount} punti</span>
                  <span className="text-[18px] font-bold text-white">= {redeemEuro}€</span>
                </div>
              </div>

              {redeemError && (
                <div className="p-3 mb-4 bg-red-900/30 border border-red-500/30 rounded-lg text-[13px] text-red-300">{redeemError}</div>
              )}

              <button
                onClick={handleRedeem}
                disabled={redeeming}
                className="w-full py-3.5 bg-[#d9c39a] text-[#1a1a1a] rounded-lg text-[15px] font-bold hover:bg-[#c9b38a] transition-colors disabled:opacity-60"
              >
                {redeeming ? 'Generazione codice...' : `Genera codice sconto · ${redeemEuro}€`}
              </button>

              <p className="text-[11px] text-[#666] mt-3 text-center leading-relaxed">
                Il codice azzera i punti usati · Valido per un solo ordine · Cumulabile con altre promozioni
              </p>
            </>
          ) : (
            <div className="text-center py-3">
              <p className="text-[14px] text-[#888]">Hai bisogno di almeno <strong className="text-[#d9c39a]">100 punti</strong> per riscattare uno sconto</p>
              <p className="text-[12px] text-[#666] mt-1">Ti mancano {100 - points.points} punti</p>
            </div>
          )}
        </div>
      ) : (
        /* Codice generato */
        <div className="bg-[#f0f7f5] border-[1.5px] border-[#005667] rounded-2xl p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-[#005667] flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          </div>
          <h3 className="text-[18px] font-bold text-[#1a1a1a] mb-1">Codice sconto generato!</h3>
          <p className="text-[13px] text-[#888] mb-5">Hai riscattato {redeemResult.code && redeemAmount} punti</p>

          <div className="bg-white border-2 border-dashed border-[#005667] rounded-xl p-5 mb-4">
            <p className="text-[11px] text-[#888] uppercase tracking-wider mb-2">Il tuo codice</p>
            <p className="text-[26px] font-bold text-[#005667] tracking-[0.1em] font-mono">{redeemResult.code}</p>
            <p className="text-[16px] font-bold text-[#005667] mt-1">vale {redeemResult.euroValue}€</p>
          </div>

          <button onClick={handleCopyCode}
            className={`w-full py-3 rounded-lg text-[14px] font-semibold transition-colors mb-3 ${
              copied ? 'bg-green-100 text-green-700' : 'bg-[#005667] text-white hover:bg-[#004555]'
            }`}>
            {copied ? 'Copiato! ✓' : 'Copia codice'}
          </button>

          <p className="text-[12px] text-[#888]">
            Usa questo codice al checkout. Lo abbiamo inviato anche alla tua email.
          </p>
          <p className="text-[13px] text-[#005667] font-semibold mt-3">
            Saldo aggiornato: {redeemResult.remainingPoints} punti
          </p>
        </div>
      )}

      {/* Come guadagnare */}
      <SectionCard title="Come guadagnare punti">
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { title: 'Acquista', desc: '1 punto per ogni euro speso', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
            { title: 'Recensisci', desc: '100 punti per ogni recensione', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
            { title: 'Compleanno', desc: 'Bonus speciale il giorno del tuo compleanno', icon: 'M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H4.5a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z' },
          ].map((item) => (
            <div key={item.title} className="text-center p-4 bg-[#f8f6f1] rounded-xl">
              <svg className="w-6 h-6 text-[#005667] mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              <p className="text-[13px] font-semibold text-[#1a1a1a]">{item.title}</p>
              <p className="text-[11px] text-[#888] mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Cronologia */}
      {points.history.length > 0 && (
        <SectionCard title="Cronologia movimenti">
          <div className="space-y-0">
            {points.history.map((h, i) => (
              <div key={i} className="flex items-center justify-between py-3.5 border-b border-[#f0f0f0] last:border-0">
                <div>
                  <p className="text-[13px] font-medium text-[#1a1a1a]">{h.reason || 'Movimento punti'}</p>
                  <p className="text-[11px] text-[#888] mt-0.5">{safeDate(h.date)}</p>
                </div>
                <span className={`text-[15px] font-bold ${h.points > 0 ? 'text-[#005667]' : 'text-[#c0392b]'}`}>
                  {h.points > 0 ? '+' : ''}{h.points}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
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
    if (c.startsWith('pop-')) return 'Da Punti POP';
    if (c.startsWith('benvenuto')) return 'Sconto benvenuto';
    if (c.startsWith('grazie')) return 'Premio fedeltà';
    if (c.startsWith('compleanno') || desc.toLowerCase().includes('compleanno')) return 'Buon compleanno';
    if (desc) return desc;
    return 'Coupon';
  };

  if (loading) return <LoadingSpinner />;

  const activeCoupons = coupons.filter(c => c.status === 'active');
  const usedCoupons = coupons.filter(c => c.status === 'used');
  const expiredCoupons = coupons.filter(c => c.status === 'expired');

  return (
    <div className="space-y-6">
      {/* 1. CTA Regala una gift card — always on top */}
      <div className="bg-[#1a1a1a] border-[1.5px] border-[#d9c39a] rounded-[14px] p-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-[16px] font-bold text-[#d9c39a]">Regala una gift card</p>
          <p className="text-[12px] text-[#888]">Il regalo perfetto per un amante del vino</p>
        </div>
        <a href="/cerca?cat=gift-card" className="shrink-0 bg-[#d9c39a] text-[#1a1a1a] rounded-lg px-5 py-2.5 text-[13px] font-bold hover:bg-[#c9b38a] transition-colors">
          Acquista ora →
        </a>
      </div>

      {/* Redeem code */}
      <SectionCard title="Riscatta un codice">
        <form onSubmit={(e) => { e.preventDefault(); if (redeemCode.trim()) handleCopy(redeemCode.trim()); }} className="flex gap-3 max-w-md">
          <input type="text" value={redeemCode} onChange={(e) => setRedeemCode(e.target.value)}
            className="flex-1 px-4 py-3 rounded-lg border border-[#e5e5e5] bg-white text-[14px] focus:outline-none focus:border-[#005667] focus:ring-1 focus:ring-[#005667]"
            placeholder="Inserisci codice buono o coupon" />
          <button type="submit" className="px-6 py-3 bg-[#005667] text-white font-semibold rounded-lg text-[14px] hover:bg-[#004555] transition-colors shrink-0">Riscatta</button>
        </form>
      </SectionCard>

      {/* 3. Coupon attivi — only if present */}
      {activeCoupons.length > 0 && (
        <div>
          <p className="text-[10px] text-[#888] uppercase tracking-[0.06em] font-semibold mb-3">Coupon attivi</p>
          <div className="space-y-3">
            {activeCoupons.map((c) => (
              <div key={c.id} className="bg-white border-[1.5px] border-[#005667] rounded-xl p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-[#005667] font-semibold uppercase tracking-wider mb-1">{getCouponLabel(c.description, c.code)}</p>
                  <p className="text-[18px] font-bold text-[#005667]">
                    {c.type === 'percent' ? `${c.amount}%` : `${c.amount}€`}
                    <span className="text-[12px] font-normal text-[#888] ml-1">di sconto</span>
                  </p>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="text-[12px] text-[#888] font-mono bg-[#f8f6f1] px-2 py-0.5 rounded">{c.code}</span>
                    {c.expires ? (
                      <span className="text-[11px] text-[#888]">Scade il {safeDate(c.expires)}</span>
                    ) : (
                      <span className="text-[11px] text-[#888]">Nessuna scadenza</span>
                    )}
                    {c.usageLimit && (
                      <span className="text-[11px] text-[#888]">{c.usageLimit - c.usageCount} utilizz{c.usageLimit - c.usageCount === 1 ? 'o' : 'i'}</span>
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
        </div>
      )}

      {/* 4. Storico coupon utilizzati — only if present */}
      {usedCoupons.length > 0 && (
        <div>
          <p className="text-[10px] text-[#888] uppercase tracking-[0.06em] font-semibold mb-3">Storico coupon utilizzati</p>
          <div className="space-y-3">
            {usedCoupons.map((c) => (
              <div key={c.id} className="bg-white border border-[#e8e4dc] rounded-xl p-4 flex items-center gap-4 opacity-60">
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-[#888] font-semibold uppercase tracking-wider mb-1">{getCouponLabel(c.description, c.code)}</p>
                  <p className="text-[16px] font-bold text-[#888]">
                    {c.type === 'percent' ? `${c.amount}%` : `${c.amount}€`}
                  </p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-[14px] text-[#888] font-mono line-through">{c.code}</span>
                    <span className="bg-[#f5f5f5] text-[#888] rounded-full px-2 py-0.5 text-[10px] font-semibold">Utilizzato</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expired — only if present */}
      {expiredCoupons.length > 0 && (
        <div>
          <p className="text-[10px] text-[#888] uppercase tracking-[0.06em] font-semibold mb-3">Coupon scaduti</p>
          <div className="space-y-3">
            {expiredCoupons.map((c) => (
              <div key={c.id} className="bg-white border border-[#e8e4dc] rounded-xl p-4 flex items-center gap-4 opacity-60">
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-[#888] font-semibold uppercase tracking-wider mb-1">{getCouponLabel(c.description, c.code)}</p>
                  <p className="text-[16px] font-bold text-[#888]">{c.type === 'percent' ? `${c.amount}%` : `${c.amount}€`}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[12px] text-[#aaa] font-mono">{c.code}</span>
                    <span className="bg-orange-100 text-orange-700 rounded-full px-2 py-0.5 text-[10px] font-semibold">Scaduto</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Regala esperienza enologica */}
      <div className="bg-[#f8f6f1] border border-[#e8e4dc] rounded-xl p-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-[15px] font-semibold text-[#1a1a1a]">Regala un&apos;esperienza enologica</p>
          <p className="text-[13px] text-[#888]">Degustazioni, corsi e wine experience</p>
        </div>
        <a href="https://app.vineis.eu" target="_blank" rel="noopener noreferrer" className="shrink-0 bg-[#1a1a1a] text-[#d9c39a] rounded-lg px-5 py-2.5 text-[13px] font-semibold hover:bg-[#333] transition-colors">
          Regala esperienza
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
  const [trackingModal, setTrackingModal] = useState<{ trackingNumber: string; zipCode: string } | null>(null);

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

  const getTrackingNumber = (order: WCOrder): string | null => {
    const meta = (order as unknown as { meta_data?: { key: string; value: string }[] }).meta_data || [];
    const trackingMeta = meta.find(m =>
      m.key === '_tracking_number' || m.key === 'tracking_number' ||
      m.key === '_wc_shipment_tracking_items' || m.key === 'sp_tracking_number'
    );
    if (trackingMeta?.value) {
      try { const parsed = JSON.parse(trackingMeta.value); return parsed[0]?.tracking_number || trackingMeta.value; } catch { return trackingMeta.value; }
    }
    return null;
  };

  const getZipCode = (order: WCOrder): string => {
    return (order as unknown as { shipping?: { postcode?: string } }).shipping?.postcode || '';
  };

  return (
    <SectionCard title="Tracciamento spedizioni">
      {shippedOrders.length === 0 ? (
        <p className="text-[14px] text-[#888] py-8 text-center">Nessun ordine in spedizione</p>
      ) : (
        <div className="space-y-5">
          {shippedOrders.slice(0, 10).map((order) => {
            const currentStep = getStep(order.status);
            const trackingNum = getTrackingNumber(order);
            const zipCode = getZipCode(order);

            return (
              <div key={order.id} className="border border-[#e8e4dc] rounded-xl p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-[15px] font-bold text-[#1a1a1a]">Ordine #{order.number}</p>
                    <p className="text-[12px] text-[#888] mt-0.5">{safeDate(order.date_created)}</p>
                  </div>
                  <span className={`text-[11px] font-semibold px-3 py-1.5 rounded-full ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
                    {statusLabels[order.status] || order.status}
                  </span>
                </div>

                {/* Timeline horizontal */}
                <div className="relative flex items-start justify-between mb-5">
                  {/* Connector line */}
                  <div className="absolute top-4 left-[10%] right-[10%] h-0.5 bg-[#e8e4dc]" />
                  <div className="absolute top-4 left-[10%] h-0.5 bg-[#005667] transition-all duration-500" style={{ width: `${Math.min((currentStep / (steps.length - 1)) * 80, 80)}%` }} />

                  {steps.map((s, i) => (
                    <div key={s} className="flex flex-col items-center relative z-10" style={{ width: '20%' }}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                        i < currentStep ? 'bg-[#005667] text-white' :
                        i === currentStep ? 'bg-[#005667] text-white animate-pulse' :
                        'bg-white border-2 border-[#e8e4dc] text-[#bbb]'
                      }`}>
                        {i < currentStep ? (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        ) : i + 1}
                      </div>
                      <p className={`text-[9px] mt-2 text-center leading-tight ${
                        i <= currentStep ? 'text-[#005667] font-semibold' : 'text-[#bbb]'
                      }`}>{s}</p>
                    </div>
                  ))}
                </div>

                {/* Tracking button */}
                <div className="pt-3 border-t border-[#f0f0f0]">
                  {trackingNum ? (
                    <button
                      onClick={() => setTrackingModal({ trackingNumber: trackingNum, zipCode })}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-[#005667] text-white rounded-lg text-[13px] font-semibold hover:bg-[#004555] transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                      Traccia spedizione
                    </button>
                  ) : (
                    <p className="text-[12px] text-[#888] text-center py-2">
                      <svg className="w-4 h-4 inline mr-1 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Tracking non ancora disponibile — riceverai una mail quando spedito
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ShippyPro tracking modal */}
      {trackingModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setTrackingModal(null)} />
          <div className="relative bg-white rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0f0f0]">
              <h3 className="text-[15px] font-bold text-[#1a1a1a]">Traccia la tua spedizione</h3>
              <button onClick={() => setTrackingModal(null)} className="p-2 hover:bg-[#f0f0f0] rounded-lg transition-colors">
                <svg className="w-5 h-5 text-[#888]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-5">
              <iframe
                src={`https://www.shippypro.com/tracking/?tracking=${encodeURIComponent(trackingModal.trackingNumber)}&zip=${encodeURIComponent(trackingModal.zipCode)}`}
                className="w-full h-[400px] border-0 rounded-lg"
                title="Tracciamento spedizione"
              />
            </div>
          </div>
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
   PREFERENCES SECTION
   ══════════════════════════════════════════════════════════ */

function PreferencesSection({ userId }: { userId: number }) {
  const { user } = useAuthStore();
  const [carrier, setCarrier] = useState<string>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('stappando_carrier') || 'brt';
    return 'brt';
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  // Newsletter state from Mailchimp
  const [nlLoading, setNlLoading] = useState(true);
  const [nlSubscribed, setNlSubscribed] = useState(false);
  const [nlActioning, setNlActioning] = useState(false);

  // Notification prefs from WC meta
  const [notifOrders, setNotifOrders] = useState(true);
  const [notifOffers, setNotifOffers] = useState(true);
  const [notifPop, setNotifPop] = useState(true);
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  // Load Mailchimp status + WC customer meta on mount
  useEffect(() => {
    if (!user?.email) { setNlLoading(false); return; }

    // Mailchimp status
    fetch(`/api/mailchimp/status?email=${encodeURIComponent(user.email)}`)
      .then(r => r.json())
      .then(d => { setNlSubscribed(d.subscribed); setNlLoading(false); })
      .catch(() => setNlLoading(false));

    // WC customer meta for notifications
    fetchCustomer(userId).then(c => {
      const meta = (c as unknown as { meta_data?: { key: string; value: string }[] }).meta_data || [];
      const get = (k: string) => meta.find(m => m.key === k)?.value;
      if (get('_notify_orders') !== undefined) setNotifOrders(get('_notify_orders') !== 'false');
      if (get('_notify_promos') !== undefined) setNotifOffers(get('_notify_promos') !== 'false');
      if (get('_notify_points') !== undefined) setNotifPop(get('_notify_points') !== 'false');
      if (get('_preferred_carrier')) {
        setCarrier(get('_preferred_carrier')!);
        if (typeof window !== 'undefined') localStorage.setItem('stappando_carrier', get('_preferred_carrier')!);
      }
      setPrefsLoaded(true);
    }).catch(() => setPrefsLoaded(true));
  }, [user?.email, userId]);

  const handleCarrier = async (id: string) => {
    setCarrier(id);
    if (typeof window !== 'undefined') localStorage.setItem('stappando_carrier', id);
    setSaving(true);
    try {
      await updateCustomer(userId, { meta_data: [{ key: '_preferred_carrier', value: id }] } as Record<string, unknown>);
      setMsg('Corriere preferito salvato');
      setTimeout(() => setMsg(''), 2500);
    } catch {} finally { setSaving(false); }
  };

  const handleNewsletterToggle = async () => {
    setNlActioning(true);
    try {
      if (nlSubscribed) {
        // Unsubscribe
        await fetch('/api/mailchimp/status', {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user?.email, status: 'unsubscribed' }),
        });
        setNlSubscribed(false);
      } else {
        // Subscribe
        await fetch('/api/newsletter', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user?.email, firstName: user?.firstName, lastName: user?.lastName }),
        });
        setNlSubscribed(true);
      }
    } catch {} finally { setNlActioning(false); }
  };

  const handleNotifToggle = async (key: string, value: boolean, setter: (v: boolean) => void, tagName: string) => {
    setter(value);
    // Save to WC meta
    updateCustomer(userId, { meta_data: [{ key, value: String(value) }] } as Record<string, unknown>).catch(() => {});
    // Update Mailchimp tag
    if (user?.email) {
      fetch('/api/mailchimp/status', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, tags: [{ name: tagName, status: value ? 'active' : 'inactive' }] }),
      }).catch(() => {});
    }
  };

  const carriers = [
    { id: 'brt', name: 'BRT Corriere Espresso', time: '24-48h lavorativi', color: '#8B0000', abbr: 'BRT' },
    { id: 'fedex', name: 'FedEx / TNT', time: '24-48h lavorativi', color: '#4D148C', abbr: 'FedEx' },
    { id: 'poste', name: 'Poste Italiane', time: '1-3 giorni lavorativi', color: '#003087', abbr: 'Poste' },
  ];

  return (
    <div className="space-y-6">
      {msg && <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-[13px] text-green-700">{msg}</div>}

      {/* Carrier */}
      <SectionCard title="Corriere preferito">
        <p className="text-[13px] text-[#888] mb-4">Verrà preselezionato automaticamente al checkout</p>
        <div className="space-y-2.5">
          {carriers.map(c => (
            <label key={c.id} onClick={() => handleCarrier(c.id)}
              className={`flex items-center gap-3.5 p-4 rounded-[10px] border cursor-pointer transition-all ${
                carrier === c.id ? 'border-[#005667] bg-[#f0f7f5]' : 'border-[#e8e4dc] hover:border-[#005667]/30'
              }`}>
              <input type="radio" name="pref_carrier" checked={carrier === c.id} readOnly className="w-4 h-4 text-[#005667] focus:ring-[#005667]" />
              <div className="w-11 h-7 rounded flex items-center justify-center shrink-0" style={{ backgroundColor: c.color }}>
                <span className="text-white text-[9px] font-bold">{c.abbr}</span>
              </div>
              <div>
                <p className="text-[14px] font-semibold text-[#1a1a1a]">{c.name}</p>
                <p className="text-[12px] text-[#888]">Consegna {c.time}</p>
              </div>
              {carrier === c.id && saving && <span className="ml-auto text-[11px] text-[#888]">Salvataggio...</span>}
            </label>
          ))}
        </div>
      </SectionCard>

      {/* Newsletter — real Mailchimp status */}
      <SectionCard title="Newsletter">
        {nlLoading ? (
          <div className="flex items-center gap-2 py-2"><div className="w-4 h-4 border-2 border-[#005667]/20 border-t-[#005667] rounded-full animate-spin" /><span className="text-[13px] text-[#888]">Verifica iscrizione...</span></div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[14px] font-semibold text-[#1a1a1a]">Offerte e novità dal mondo del vino</p>
              <p className="text-[12px] text-[#888]">{nlSubscribed ? 'Sei iscritto alla newsletter' : 'Ricevi promozioni esclusive via email'}</p>
            </div>
            <div className="flex items-center gap-3">
              {nlSubscribed && (
                <svg className="w-5 h-5 text-[#005667]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              )}
              <div
                className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${nlSubscribed ? 'bg-[#005667]' : 'bg-[#e0e0e0]'} ${nlActioning ? 'opacity-50' : ''}`}
                onClick={() => !nlActioning && handleNewsletterToggle()}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${nlSubscribed ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      {/* Notifications — save to WC meta + Mailchimp tags */}
      <SectionCard title="Notifiche email">
        <p className="text-[12px] text-[#888] mb-4">Le email transazionali (conferma ordine, spedizione) arrivano sempre per legge.</p>
        <div className="space-y-4">
          {[
            { label: 'Offerte e promozioni', desc: 'Sconti, nuovi arrivi, eventi', checked: notifOffers, key: '_notify_promos', tag: 'promo-attive', set: setNotifOffers },
            { label: 'Punti POP', desc: 'Accrediti, premi, scadenze punti', checked: notifPop, key: '_notify_points', tag: 'punti-pop-attivi', set: setNotifPop },
          ].map(n => (
            <label key={n.label} className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-[14px] font-semibold text-[#1a1a1a]">{n.label}</p>
                <p className="text-[12px] text-[#888]">{n.desc}</p>
              </div>
              <div
                className={`relative w-11 h-6 rounded-full transition-colors ${n.checked ? 'bg-[#005667]' : 'bg-[#e0e0e0]'}`}
                onClick={() => handleNotifToggle(n.key, !n.checked, n.set, n.tag)}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${n.checked ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
              </div>
            </label>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   REVIEWS SECTION
   ══════════════════════════════════════════════════════════ */

interface ReviewData { id: number; rating: number; review: string; date: string }

function ReviewsSection({ userId }: { userId: number }) {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<WCOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewMap, setReviewMap] = useState<Record<number, ReviewData | null>>({});
  const [justReviewed, setJustReviewed] = useState<Record<number, { rating: number; text: string }>>({});
  const [activeReview, setActiveReview] = useState<number | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successId, setSuccessId] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const ordersData = await fetchOrders(userId);
        setOrders(ordersData);

        const completed = ordersData.filter(o => o.status === 'completed');
        const allItems = completed.flatMap(o => o.line_items || []);
        const seen = new Set<number>();
        const uniqueIds = allItems.filter(p => { if (seen.has(p.product_id)) return false; seen.add(p.product_id); return true; }).map(p => p.product_id);

        if (uniqueIds.length > 0 && user?.email) {
          const checkRes = await fetch(`/api/reviews/check?email=${encodeURIComponent(user.email)}&productIds=${uniqueIds.join(',')}`);
          if (checkRes.ok) {
            const { reviewed } = await checkRes.json();
            setReviewMap(reviewed);
          }
        }
      } catch {}
      setLoading(false);
    })();
  }, [userId, user?.email]);

  const handleSubmitReview = async (productId: number, productName: string) => {
    if (rating === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, rating, review: reviewText, reviewer: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(), reviewerEmail: user?.email || '', customerId: user?.id, productName }),
      });
      if (res.ok) {
        setJustReviewed(prev => ({ ...prev, [productId]: { rating, text: reviewText } }));
        setSuccessId(productId);
        setActiveReview(null);
        const savedRating = rating;
        const savedText = reviewText;
        setRating(0);
        setReviewText('');
        // After 3s move to reviewed
        setTimeout(() => {
          setSuccessId(null);
          setReviewMap(prev => ({ ...prev, [productId]: { id: 0, rating: savedRating, review: savedText, date: new Date().toISOString() } }));
          setJustReviewed(prev => { const n = { ...prev }; delete n[productId]; return n; });
        }, 3000);
      }
    } catch {}
    setSubmitting(false);
  };

  if (loading) return <LoadingSpinner />;

  const completedOrders = orders.filter(o => o.status === 'completed');
  const allProducts = completedOrders.flatMap(o => o.line_items || []);
  const seen = new Set<number>();
  const uniqueProducts = allProducts.filter(p => { if (seen.has(p.product_id)) return false; seen.add(p.product_id); return true; });

  const toReview = uniqueProducts.filter(p => !reviewMap[p.product_id] && !justReviewed[p.product_id]);
  const alreadyReviewed = uniqueProducts.filter(p => reviewMap[p.product_id] || justReviewed[p.product_id]);
  const reviewCount = alreadyReviewed.length;
  const earnedPop = reviewCount * 100;
  const earnedEuro = (earnedPop / 100).toFixed(2).replace('.', ',');

  // Stars component
  const Stars = ({ count, size = 24, interactive = false, onRate, onHover }: { count: number; size?: number; interactive?: boolean; onRate?: (n: number) => void; onHover?: (n: number) => void }) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <button key={s} type="button" disabled={!interactive}
          onMouseEnter={() => onHover?.(s)} onMouseLeave={() => onHover?.(0)} onClick={() => onRate?.(s)}
          className={`${interactive ? 'cursor-pointer' : 'cursor-default'} p-0`} style={{ width: size, height: size }}>
          <svg className={`transition-colors ${s <= count ? 'text-[#d9c39a]' : 'text-[#ddd]'}`} viewBox="0 0 24 24" fill="currentColor" width={size} height={size}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Banner punti guadagnati */}
      {reviewCount > 0 && (
        <div className="bg-[#1a1a1a] border-[1.5px] border-[#d9c39a] rounded-[14px] p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-[13px] text-[#888]">Grazie alle tue recensioni hai guadagnato</p>
            <p className="text-[28px] font-bold text-[#d9c39a] leading-tight">{earnedPop} Punti POP</p>
            <p className="text-[11px] text-[#888]">= {earnedEuro}€ di sconto disponibile</p>
          </div>
          <a href="/account" onClick={() => { /* navigate to punti tab */ }} className="shrink-0 bg-[#d9c39a] text-[#1a1a1a] rounded-lg px-5 py-2.5 text-[13px] font-bold hover:bg-[#c9b38a] transition-colors">
            Riscatta ora →
          </a>
        </div>
      )}

      {/* Section: Da recensire */}
      {orders.length === 0 ? (
        <SectionCard title="Le tue recensioni">
          <div className="text-center py-8">
            <p className="text-[14px] text-[#888] mb-4">Ancora nessun acquisto. Ogni bottiglia che acquisti potrà essere recensita dopo la consegna.</p>
            <a href="/cerca" className="inline-block bg-[#005667] text-white rounded-lg px-6 py-3 text-[14px] font-semibold hover:bg-[#004555] transition-colors">Scopri i vini</a>
          </div>
        </SectionCard>
      ) : completedOrders.length === 0 ? (
        <SectionCard title="Le tue recensioni">
          <div className="text-center py-8">
            <p className="text-[14px] text-[#888] mb-2">I prodotti diventano recensibili dopo la consegna dell&apos;ordine.</p>
            <p className="text-[12px] text-[#aaa]">Riceverai una notifica quando potrai lasciare la tua prima recensione.</p>
          </div>
        </SectionCard>
      ) : (
        <>
          {/* Da recensire */}
          {toReview.length > 0 ? (
            <div>
              <p className="text-[10px] text-[#888] uppercase tracking-[0.06em] font-semibold mb-3">Da recensire</p>
              <div className="space-y-3">
                {toReview.map(product => (
                  <div key={product.product_id} className={`bg-white border border-[#e8e4dc] rounded-xl p-4 transition-all ${successId === product.product_id ? 'opacity-50 scale-[0.98]' : ''}`}>
                    {/* Success alert */}
                    {successId === product.product_id && (
                      <div className="bg-[#f0f7f5] border-l-[3px] border-[#005667] rounded-lg p-3.5 mb-3">
                        <p className="text-[13px] text-[#005667] font-medium">Grazie! Hai guadagnato +100 Punti POP — verranno accreditati entro 24h.</p>
                      </div>
                    )}

                    {/* Product row */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-16 rounded-lg bg-gradient-to-br from-[#f5f1ea] to-[#e8e0d2] overflow-hidden shrink-0 flex items-center justify-center">
                        {product.image?.src && <img src={product.image.src} alt={product.name} className="w-full h-full object-contain" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <a href={`/prodotto/${product.product_id}`} className="text-[13px] font-semibold text-[#1a1a1a] hover:text-[#005667] transition-colors block">{product.name}</a>
                        <p className="text-[10px] text-[#bbb]">Ordine completato</p>
                      </div>
                    </div>

                    {/* Stars */}
                    <div className="mb-3">
                      <Stars count={activeReview === product.product_id ? (hoverRating || rating) : 0} size={24} interactive onRate={(n) => { setActiveReview(product.product_id); setRating(n); }} onHover={setHoverRating} />
                    </div>

                    {/* Textarea (appears after first star click) */}
                    {activeReview === product.product_id && rating > 0 && (
                      <>
                        <textarea value={reviewText} onChange={e => setReviewText(e.target.value)} rows={3}
                          placeholder="Raccontaci la tua esperienza con questo vino..."
                          className="w-full px-3 py-3 rounded-lg border border-[#e8e4dc] bg-white text-[13px] focus:outline-none focus:border-[#005667] focus:ring-1 focus:ring-[#005667] resize-none mb-3" />
                        <div className="flex items-center gap-3">
                          <button onClick={() => handleSubmitReview(product.product_id, product.name)} disabled={submitting}
                            className="bg-[#005667] text-white rounded-lg px-4 py-2.5 text-[13px] font-semibold hover:bg-[#004555] transition-colors disabled:opacity-50">
                            {submitting ? 'Invio...' : 'Invia recensione'}
                          </button>
                          <span className="bg-[#f0f7f5] text-[#005667] border border-[#005667] rounded-full px-2.5 py-1 text-[11px] font-semibold">+100 POP</span>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : reviewCount > 0 ? (
            <div className="text-center py-6">
              <p className="text-[14px] text-[#888] mb-2">Hai recensito tutti i tuoi acquisti!</p>
              <p className="text-[12px] text-[#aaa] mb-4">Continua a fare shopping per guadagnare altri Punti POP.</p>
              <a href="/cerca" className="inline-block bg-[#005667] text-white rounded-lg px-6 py-3 text-[14px] font-semibold hover:bg-[#004555] transition-colors">Scopri i vini</a>
            </div>
          ) : null}

          {/* Recensite */}
          {alreadyReviewed.length > 0 && (
            <div>
              <p className="text-[10px] text-[#888] uppercase tracking-[0.06em] font-semibold mb-3">Le tue recensioni</p>
              <div className="space-y-3">
                {alreadyReviewed.map(product => {
                  const rev = reviewMap[product.product_id] || (justReviewed[product.product_id] ? { rating: justReviewed[product.product_id].rating, review: justReviewed[product.product_id].text, date: new Date().toISOString(), id: 0 } : null);
                  if (!rev) return null;
                  return (
                    <div key={product.product_id} className="bg-[#f8f6f1] border border-[#e8e4dc] rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-16 rounded-lg bg-gradient-to-br from-[#f5f1ea] to-[#e8e0d2] overflow-hidden shrink-0 flex items-center justify-center">
                          {product.image?.src && <img src={product.image.src} alt={product.name} className="w-full h-full object-contain" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <a href={`/prodotto/${product.product_id}`} className="text-[13px] font-semibold text-[#1a1a1a] hover:text-[#005667] transition-colors block">{product.name}</a>
                          <p className="text-[10px] text-[#bbb]">{safeDate(rev.date)}</p>
                        </div>
                        <span className="bg-[#e8f5e9] text-[#2e7d32] rounded-full px-2 py-0.5 text-[10px] font-semibold shrink-0">Recensione inviata ✓</span>
                      </div>
                      <div className="mb-2"><Stars count={rev.rating} size={20} /></div>
                      {rev.review && (
                        <div className="bg-white rounded-lg px-3 py-2.5">
                          <p className="text-[13px] text-[#555] italic leading-relaxed">{rev.review}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
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
