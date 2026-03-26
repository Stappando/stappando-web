'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuthStore } from '@/store/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendorMode?: boolean;
}

export default function AuthModal({ isOpen, onClose, vendorMode = false }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPatience, setShowPatience] = useState(false);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setPassword('');
      setLocalError('');
      setLoading(false);
      setShowPatience(false);
    }
  }, [isOpen]);

  const isVendorRole = (role: string) => ['vendor', 'wcfm_vendor', 'dc_vendor'].includes(role);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const em = email.trim();
    const pw = password;
    if (!em || !pw) return;
    if (pw.length < 6) { setLocalError('Password minimo 6 caratteri'); return; }

    setLoading(true);
    setLocalError('');
    setShowPatience(false);
    const patienceTimer = setTimeout(() => setShowPatience(true), 4000);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);

      const res = await fetch('/api/auth/auto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: em, password: pw, vendorMode }),
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const data = await res.json();

      if (!res.ok) {
        clearTimeout(patienceTimer);
        setLocalError(data.message || 'Errore. Riprova.');
        setLoading(false);
        setShowPatience(false);
        return;
      }

      clearTimeout(patienceTimer);

      // If registered but no token — show success message
      if (data.action === 'registered_no_login') {
        setLocalError('');
        setLoading(false);
        setShowPatience(false);
        onClose();
        alert(data.message || 'Account creato! Accedi con le tue credenziali.');
        return;
      }

      // Write to store
      if (data.token) {
        useAuthStore.setState({
          user: data.user,
          token: data.token,
          role: data.role || 'customer',
          vendorStatus: data.vendorStatus || (data.isVendor ? 'pending_contract' : null),
          isLoading: false,
          error: null,
        });
      }

      setLoading(false);

      // Redirect BEFORE closing modal
      if (vendorMode || isVendorRole(data.role || '')) {
        // Write full state to Zustand — this persists to localStorage
        useAuthStore.setState({
          user: data.user,
          token: data.token,
          role: 'vendor',
          vendorStatus: data.vendorStatus || 'pending_contract',
          isLoading: false,
          error: null,
        });

        // Also write a simple flag as backup
        localStorage.setItem('stappando-is-vendor', 'true');
        localStorage.setItem('stappando-vendor-status', data.vendorStatus || 'pending_contract');

        // Small delay to let Zustand flush to localStorage
        setTimeout(() => {
          window.location.href = '/vendor/dashboard';
        }, 100);
        return;
      }

      onClose();
    } catch (err) {
      clearTimeout(patienceTimer);
      if (err instanceof DOMException && err.name === 'AbortError') {
        setLocalError('Il server sta rispondendo lentamente. Riprova tra qualche secondo.');
      } else {
        setLocalError('Errore di connessione. Riprova.');
      }
      setLoading(false);
      setShowPatience(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center animate-fadeIn">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-sm mx-4 rounded-2xl bg-white shadow-2xl overflow-hidden">
        <button onClick={onClose} className="absolute top-3 right-3 z-10 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="p-6">
          <div className="flex justify-center mb-5">
            <Image src="/logo.png" alt="Stappando" width={120} height={30} className="h-7 w-auto" />
          </div>

          <h2 className="text-lg font-bold text-center text-gray-900 mb-1">
            {vendorMode ? 'Accedi come venditore' : 'Accedi o registrati'}
          </h2>
          <p className="text-center text-xs text-gray-500 mb-5">
            {vendorMode ? 'Inserisci email e password per iniziare' : 'Per ordinare, salvare preferiti e accumulare Punti POP'}
          </p>

          {/* Social login */}
          <div className="space-y-2.5 mb-4">
            <a
              href="https://stappando.it/?loginSocial=google"
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors font-medium text-sm text-gray-700"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continua con Google
            </a>
            <a
              href="https://stappando.it/?loginSocial=facebook"
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-[#1877F2] hover:bg-[#166FE5] transition-colors font-medium text-sm text-white"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              Continua con Facebook
            </a>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-[10px] text-gray-400 font-medium">oppure con email</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Error */}
          {localError && (
            <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
              {localError}
            </div>
          )}

          {/* Single form */}
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#055667] focus:ring-2 focus:ring-[#055667]/20 mb-2.5"
              placeholder="Email"
              autoFocus
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#055667] focus:ring-2 focus:ring-[#055667]/20 mb-3"
              placeholder="Password"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#055667] text-white font-bold text-sm hover:bg-[#044556] transition-colors disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Accesso in corso...
                </span>
              ) : (
                'Continua'
              )}
            </button>

            {showPatience && loading && (
              <div className="mt-4 p-4 rounded-xl bg-[#005667] text-center">
                <p className="text-[14px] text-white font-bold mb-1">Non chiudere la finestra</p>
                <p className="text-[12px] text-white/70 mb-3">Stiamo configurando il tuo account...</p>
                <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-[#d9c39a] rounded-full animate-[progress_20s_ease-in-out_forwards]" />
                </div>
                <style jsx>{`
                  @keyframes progress {
                    0% { width: 5%; }
                    30% { width: 40%; }
                    60% { width: 65%; }
                    80% { width: 82%; }
                    95% { width: 95%; }
                    100% { width: 98%; }
                  }
                `}</style>
              </div>
            )}
          </form>

          <div className="flex justify-center mt-3">
            <a href="https://stappando.it/my-account/lost-password/" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-[#055667]">Password dimenticata?</a>
          </div>

          <p className="text-[9px] text-gray-400 text-center mt-3">
            Continuando accetti i <a href="https://stappando.it/termini-e-condizioni/" target="_blank" rel="noopener noreferrer" className="underline">Termini</a> e la <a href="https://stappando.it/privacy-policy-2/" target="_blank" rel="noopener noreferrer" className="underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}
