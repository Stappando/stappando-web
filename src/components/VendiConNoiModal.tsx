'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface VendiConNoiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth?: () => void;
}

export default function VendiConNoiModal({ isOpen, onClose, onOpenAuth }: VendiConNoiModalProps) {
  const [step, setStep] = useState<'initial' | 'form'>('initial');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [shopName, setShopName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else { document.body.style.overflow = ''; setStep('initial'); setEmail(''); setPassword(''); setShopName(''); setPhone(''); }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Redirect to vendor register with pre-filled data
    window.open(`https://stappando.it/vendor-register/?email=${encodeURIComponent(email)}&shop=${encodeURIComponent(shopName)}`, '_blank');
    setLoading(false);
    onClose();
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
            {step === 'form' ? 'Registrati come venditore' : 'Vendi con noi'}
          </h2>
          <p className="text-center text-xs text-gray-500 mb-5">
            {step === 'form' ? 'Completa i dati per iniziare' : 'Raggiungi migliaia di appassionati di vino'}
          </p>

          {step === 'initial' && (
            <>
              {/* Social login */}
              <div className="space-y-2.5 mb-4">
                <a href="https://stappando.it/?loginSocial=google" className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors font-medium text-sm text-gray-700">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continua con Google
                </a>
                <a href="https://stappando.it/?loginSocial=facebook" className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-[#1877F2] hover:bg-[#166FE5] transition-colors font-medium text-sm text-white">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  Continua con Facebook
                </a>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-[10px] text-gray-400 font-medium">oppure con email</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <button
                onClick={() => setStep('form')}
                className="w-full py-3 rounded-xl bg-[#b8973f] text-white font-bold text-sm hover:bg-[#a07f30] transition-colors"
              >
                Registrati con email
              </button>

              <button
                onClick={() => { onClose(); onOpenAuth?.(); }}
                className="block w-full mt-3 text-center text-xs text-gray-500 hover:text-[#055667] transition-colors"
              >
                Già venditore? <span className="underline font-medium">Accedi</span>
              </button>
            </>
          )}

          {step === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Nome cantina / azienda</label>
                <input type="text" value={shopName} onChange={(e) => setShopName(e.target.value)} required className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#055667] focus:ring-2 focus:ring-[#055667]/20" placeholder="Es. Cantina Rossi" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#055667] focus:ring-2 focus:ring-[#055667]/20" placeholder="email@cantina.it" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Telefono</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#055667] focus:ring-2 focus:ring-[#055667]/20" placeholder="+39 ..." />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#055667] focus:ring-2 focus:ring-[#055667]/20" placeholder="Minimo 6 caratteri" />
              </div>

              <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-[#b8973f] text-white font-bold text-sm hover:bg-[#a07f30] transition-colors disabled:opacity-50">
                {loading ? 'Registrazione...' : 'Registrati come venditore'}
              </button>

              <button type="button" onClick={() => setStep('initial')} className="block w-full text-center text-xs text-gray-500 hover:text-[#055667]">
                ← Indietro
              </button>

              <p className="text-[9px] text-gray-400 text-center">
                Registrandoti accetti i <a href="https://stappando.it/termini-e-condizioni/" target="_blank" rel="noopener noreferrer" className="underline">Termini</a> e la <a href="https://stappando.it/privacy-policy-2/" target="_blank" rel="noopener noreferrer" className="underline">Privacy Policy</a>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
