'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuthStore } from '@/store/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [step, setStep] = useState<'initial' | 'password' | 'register'>('initial');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [newsletter, setNewsletter] = useState(false);
  const [localError, setLocalError] = useState('');
  const { login, register, isLoading, error, clearError } = useAuthStore();

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setStep('initial');
      setEmail('');
      setPassword('');
      setFirstName('');
      setLastName('');
      setNewsletter(false);
      setLocalError('');
      clearError();
    }
  }, [isOpen, clearError]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    // Try login first — if it fails with invalid credentials, show register
    setStep('password');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    clearError();
    try {
      await login(email, password);
      const state = useAuthStore.getState();
      if (state.token) {
        onClose();
      }
    } catch {
      // Login failed — switch to registration automatically
      clearError();
      setPassword('');
      setLocalError('Email non registrata — completa la registrazione qui sotto.');
      setStep('register');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    await register(email, password, firstName, lastName, newsletter);
    const state = useAuthStore.getState();
    if (state.token) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center animate-fadeIn">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-sm mx-4 rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Close */}
        <button onClick={onClose} className="absolute top-3 right-3 z-10 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="p-6">
          {/* Logo */}
          <div className="flex justify-center mb-5">
            <Image src="/logo.png" alt="Stappando" width={120} height={30} className="h-7 w-auto" />
          </div>

          <h2 className="text-lg font-bold text-center text-gray-900 mb-1">
            {step === 'register' ? 'Crea il tuo account' : 'Accedi o registrati'}
          </h2>
          <p className="text-center text-xs text-gray-500 mb-5">
            {step === 'register' ? 'Completa i dati per registrarti' : 'Per ordinare, salvare preferiti e accumulare Punti POP'}
          </p>

          {/* Social login — always visible on initial + password step */}
          {step !== 'register' && (
            <>
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
            </>
          )}

          {/* Error */}
          {(error || localError) && (
            <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
              {localError || error}
            </div>
          )}

          {/* Step: initial — email only */}
          {step === 'initial' && (
            <form onSubmit={handleEmailSubmit}>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#055667] focus:ring-2 focus:ring-[#055667]/20 mb-3"
                placeholder="Email o nome utente"
                autoFocus
              />
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#055667] text-white font-bold text-sm hover:bg-[#044556] transition-colors"
              >
                Continua
              </button>
            </form>
          )}

          {/* Step: password */}
          {step === 'password' && (
            <form onSubmit={handleLogin}>
              <div className="flex items-center gap-2 mb-3 p-2.5 rounded-lg bg-gray-50 border border-gray-200">
                <span className="text-sm text-gray-700 truncate flex-1">{email}</span>
                <button type="button" onClick={() => { setStep('initial'); clearError(); setLocalError(''); }} className="text-xs text-[#055667] font-medium hover:underline shrink-0">Cambia</button>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#055667] focus:ring-2 focus:ring-[#055667]/20 mb-3"
                placeholder="Password"
                autoFocus
              />
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-[#055667] text-white font-bold text-sm hover:bg-[#044556] transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Accesso...' : 'Accedi'}
              </button>
              <div className="flex justify-between mt-3">
                <a href="https://stappando.it/my-account/lost-password/" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-[#055667]">Password dimenticata?</a>
                <button type="button" onClick={() => setStep('register')} className="text-xs text-[#055667] font-medium hover:underline">Non hai un account?</button>
              </div>
            </form>
          )}

          {/* Step: register */}
          {step === 'register' && (
            <form onSubmit={handleRegister}>
              <div className="grid grid-cols-2 gap-2.5 mb-2.5">
                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#055667] focus:ring-2 focus:ring-[#055667]/20" placeholder="Nome" />
                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#055667] focus:ring-2 focus:ring-[#055667]/20" placeholder="Cognome" />
              </div>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#055667] focus:ring-2 focus:ring-[#055667]/20 mb-2.5" placeholder="Email" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#055667] focus:ring-2 focus:ring-[#055667]/20 mb-3" placeholder="Password (min 6 caratteri)" />
              {/* Newsletter opt-in — NOT checked by default (GDPR) */}
              <label className="flex items-start gap-2.5 mb-4 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={newsletter}
                  onChange={(e) => setNewsletter(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#055667] focus:ring-[#055667] shrink-0"
                />
                <span className="text-xs text-gray-600 leading-relaxed">
                  Voglio ricevere offerte e novità da Stappando
                </span>
              </label>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-[#055667] text-white font-bold text-sm hover:bg-[#044556] transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Registrazione...' : 'Crea account'}
              </button>
              <button type="button" onClick={() => { setStep('password'); setLocalError(''); clearError(); }} className="block w-full mt-3 text-center text-xs text-gray-500 hover:text-[#055667]">
                Hai già un account? <span className="underline font-medium">Accedi</span>
              </button>
              <p className="text-[9px] text-gray-400 text-center mt-3">
                Registrandoti accetti i <a href="https://stappando.it/termini-e-condizioni/" target="_blank" rel="noopener noreferrer" className="underline">Termini</a> e la <a href="https://stappando.it/privacy-policy-2/" target="_blank" rel="noopener noreferrer" className="underline">Privacy Policy</a>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
