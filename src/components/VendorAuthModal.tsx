'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuthStore } from '@/store/auth';

interface VendorAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VendorAuthModal({ isOpen, onClose }: VendorAuthModalProps) {
  const [tab, setTab] = useState<'register' | 'login'>('register');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Register fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [cantina, setCantina] = useState('');
  const [regione, setRegione] = useState('');
  const [piva, setPiva] = useState('');
  const [telefono, setTelefono] = useState('');
  const [sito, setSito] = useState('');
  const [terms, setTerms] = useState(false);

  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPw, setLoginPw] = useState('');

  const authLogin = useAuthStore(s => s.login);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setError('');
      setSuccess(false);
      setEmail(''); setPassword(''); setConfirmPw('');
      setCantina(''); setRegione(''); setPiva('');
      setTelefono(''); setSito(''); setTerms(false);
      setLoginEmail(''); setLoginPw('');
    }
  }, [isOpen]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPw) { setError('Le password non corrispondono'); return; }
    if (!terms) { setError('Devi accettare i termini'); return; }
    setLoading(true); setError('');
    try {
      // 1. Create vendor account in WooCommerce
      const res = await fetch('/api/vendor/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, cantina, regione, piva, telefono, sito }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Errore registrazione');

      // 2. Login to get JWT token and populate store
      await authLogin(email, password);

      // 3. Ensure user.id is set (JWT may not return WP user ID, use register's vendorId)
      const state = useAuthStore.getState();
      if (state.user && (!state.user.id || state.user.id === 0) && data.vendorId) {
        useAuthStore.setState({ user: { ...state.user, id: data.vendorId } });
      }

      setSuccess(true);
      // 4. Redirect to contract page
      setTimeout(() => { onClose(); window.location.href = '/vendor/contratto'; }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore');
    }
    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await authLogin(loginEmail, loginPw);
      const state = useAuthStore.getState();
      onClose();
      if (state.role === 'vendor' || state.role === 'wcfm_vendor' || state.role === 'dc_vendor') {
        window.location.href = '/vendor/dashboard';
      } else {
        window.location.href = '/account';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Credenziali non valide');
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  const inputClass = "w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#005667] focus:ring-2 focus:ring-[#005667]/20";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center animate-fadeIn">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md mx-4 rounded-2xl bg-white shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Close */}
        <button onClick={onClose} className="absolute top-3 right-3 z-10 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="p-6">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <Image src="/logo.png" alt="Stappando" width={120} height={30} className="h-7 w-auto" />
          </div>
          <h2 className="text-lg font-bold text-center text-[#1a1a1a] mb-1">Vendi i tuoi vini su Stappando</h2>
          <p className="text-center text-xs text-[#888] mb-5">Raggiungi migliaia di wine lover in tutta Italia</p>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-5">
            <button onClick={() => { setTab('register'); setError(''); }} className={`flex-1 pb-3 text-sm font-semibold ${tab === 'register' ? 'text-[#005667] border-b-2 border-[#005667]' : 'text-[#888]'}`}>Registrati come venditore</button>
            <button onClick={() => { setTab('login'); setError(''); }} className={`flex-1 pb-3 text-sm font-semibold ${tab === 'login' ? 'text-[#005667] border-b-2 border-[#005667]' : 'text-[#888]'}`}>Accedi</button>
          </div>

          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 mb-4">Account creato! Redirect al contratto...</div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mb-4">{error}</div>
          )}

          {/* Register */}
          {tab === 'register' && !success && (
            <form onSubmit={handleRegister} className="space-y-3">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="Email *" className={inputClass} />
              <div className="grid grid-cols-2 gap-3">
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} placeholder="Password *" className={inputClass} />
                <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} required placeholder="Conferma *" className={inputClass} />
              </div>
              <input type="text" value={cantina} onChange={e => setCantina(e.target.value)} required placeholder="Nome cantina *" className={inputClass} />
              <div className="grid grid-cols-2 gap-3">
                <input type="text" value={regione} onChange={e => setRegione(e.target.value)} required placeholder="Regione *" className={inputClass} />
                <input type="text" value={piva} onChange={e => setPiva(e.target.value)} required minLength={11} maxLength={11} placeholder="P.IVA *" className={inputClass} />
              </div>
              <input type="tel" value={telefono} onChange={e => setTelefono(e.target.value)} required placeholder="Telefono *" className={inputClass} />
              <input type="url" value={sito} onChange={e => setSito(e.target.value)} placeholder="Sito web (opzionale)" className={inputClass} />

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)} className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#005667]" />
                <span className="text-xs text-gray-600">Accetto i <a href="/termini" className="underline">Termini e condizioni</a> per i venditori</span>
              </label>

              <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-[#005667] text-white font-bold text-sm hover:bg-[#004555] disabled:opacity-50">
                {loading ? 'Registrazione...' : 'Crea account cantina'}
              </button>
            </form>
          )}

          {/* Login */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-3">
              <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required placeholder="Email" className={inputClass} />
              <input type="password" value={loginPw} onChange={e => setLoginPw(e.target.value)} required placeholder="Password" className={inputClass} />
              <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-[#005667] text-white font-bold text-sm hover:bg-[#004555] disabled:opacity-50">
                {loading ? 'Accesso...' : 'Accedi'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
