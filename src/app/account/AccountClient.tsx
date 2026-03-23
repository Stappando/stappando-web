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

function IconLogout() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
    </svg>
  );
}

/* ── Section type ───────────────────────────────────────── */

type Section =
  | 'profilo'
  | 'ordini'
  | 'indirizzi'
  | 'punti'
  | 'preferiti'
  | 'dettagli'
  | 'buoni'
  | 'assistenza';

const sections: { key: Section; label: string; icon: () => React.ReactNode }[] = [
  { key: 'profilo', label: 'Profilo', icon: IconUser },
  { key: 'ordini', label: 'I miei ordini', icon: IconBox },
  { key: 'indirizzi', label: 'Indirizzi', icon: IconMap },
  { key: 'punti', label: 'Punti POP', icon: IconStar },
  { key: 'preferiti', label: 'Preferiti', icon: IconHeart },
  { key: 'dettagli', label: 'Dettagli account', icon: IconLock },
  { key: 'buoni', label: 'Buoni regalo', icon: IconGift },
  { key: 'assistenza', label: 'Ticket assistenza', icon: IconTicket },
];

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
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden w-full flex items-center justify-between bg-white rounded-xl border border-brand-border p-4 mb-3"
          >
            <span className="font-medium">
              {sections.find((s) => s.key === activeSection)?.label}
            </span>
            <svg className={`w-5 h-5 transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <nav className={`bg-white rounded-2xl border border-brand-border overflow-hidden ${mobileMenuOpen ? 'block' : 'hidden lg:block'}`}>
            {sections.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => { setActiveSection(s.key); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-5 py-3.5 text-sm font-medium transition-colors text-left ${
                    activeSection === s.key
                      ? 'bg-brand-primary/5 text-brand-primary border-l-3 border-brand-primary'
                      : 'text-brand-text hover:bg-brand-bg'
                  }`}
                >
                  <Icon />
                  {s.label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-5 py-3.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors text-left border-t border-brand-border"
            >
              <IconLogout />
              Esci
            </button>
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeSection === 'profilo' && <ProfileSection user={user} />}
          {activeSection === 'ordini' && <OrdersSection userId={user.id} />}
          {activeSection === 'indirizzi' && <AddressesSection userId={user.id} />}
          {activeSection === 'punti' && <PointsSection userId={user.id} />}
          {activeSection === 'preferiti' && <FavoritesSection />}
          {activeSection === 'dettagli' && <AccountDetailsSection userId={user.id} />}
          {activeSection === 'buoni' && <GiftCardsSection />}
          {activeSection === 'assistenza' && <SupportSection user={user} />}
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
  return (
    <SectionCard title="Il mio profilo">
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="flex items-center gap-4 sm:col-span-2">
          <div className="w-16 h-16 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary text-2xl font-bold">
            {(user.firstName?.[0] || user.username[0] || '?').toUpperCase()}
          </div>
          <div>
            <p className="text-lg font-semibold text-brand-text">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-sm text-brand-muted">{user.email}</p>
          </div>
        </div>
        <InfoRow label="Nome" value={user.firstName || '---'} />
        <InfoRow label="Cognome" value={user.lastName || '---'} />
        <InfoRow label="Email" value={user.email} />
        <InfoRow label="Username" value={user.username} />
      </div>
    </SectionCard>
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

  useEffect(() => {
    fetchOrders(userId).then((data) => { setOrders(data); setLoading(false); });
  }, [userId]);

  if (loading) return <LoadingSpinner />;

  return (
    <SectionCard title="I miei ordini">
      {orders.length === 0 ? (
        <EmptyState message="Non hai ancora effettuato nessun ordine." />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="border border-brand-border rounded-xl p-4 hover:border-brand-primary/30 transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-brand-text">#{order.number}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
                    {statusLabels[order.status] || order.status}
                  </span>
                </div>
                <div className="text-right">
                  <p className="font-bold text-brand-primary">&euro; {formatPrice(order.total)}</p>
                  <p className="text-xs text-brand-muted">
                    {new Date(order.date_created).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
              {order.line_items.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {order.line_items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 bg-brand-bg rounded-lg px-3 py-1.5 text-sm">
                      {item.image?.src && (
                        <img src={item.image.src} alt={item.name} className="w-8 h-8 rounded object-cover" />
                      )}
                      <span className="text-brand-text truncate max-w-[200px]">{item.name}</span>
                      <span className="text-brand-muted">x{item.quantity}</span>
                    </div>
                  ))}
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
  const [code, setCode] = useState('');

  return (
    <SectionCard title="Buoni regalo">
      <p className="text-sm text-brand-muted mb-4">
        Inserisci il codice del tuo buono regalo per applicarlo al tuo account.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (code.trim()) {
            window.location.href = `https://stappando.it/my-account/?apply_coupon=${encodeURIComponent(code.trim())}`;
          }
        }}
        className="flex gap-3 max-w-md"
      >
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="flex-1 px-4 py-3 rounded-lg border border-brand-border bg-brand-bg focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors"
          placeholder="Inserisci codice buono"
        />
        <button
          type="submit"
          className="px-6 py-3 bg-brand-accent text-white font-semibold rounded-lg hover:bg-brand-accent/90 transition-colors"
        >
          Riscatta
        </button>
      </form>
      <div className="mt-6 p-4 bg-brand-accent/5 rounded-xl border border-brand-accent/20">
        <h3 className="text-sm font-semibold text-brand-accent mb-1">Regala un&apos;esperienza enologica</h3>
        <p className="text-sm text-brand-muted">
          Acquista un buono regalo Stappando e fai un dono speciale a chi ami.
        </p>
        <a href="https://stappando.it/prodotto/gift-card-stappando/" className="inline-block mt-3 text-sm text-brand-accent font-semibold hover:underline">
          Acquista buono regalo &rarr;
        </a>
      </div>
    </SectionCard>
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
