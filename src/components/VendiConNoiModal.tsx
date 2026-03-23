'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface VendiConNoiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth?: () => void;
}

const benefits = [
  { icon: '👁️', title: 'Visibilità', desc: 'Migliaia di appassionati pronti a scoprire i tuoi vini' },
  { icon: '🚚', title: 'Logistica', desc: 'Corrieri specializzati nel trasporto vini' },
  { icon: '💳', title: 'Pagamenti', desc: 'Incassi sicuri, commissioni trasparenti' },
  { icon: '🤝', title: 'Supporto', desc: 'Team dedicato per la tua crescita' },
];

export default function VendiConNoiModal({ isOpen, onClose, onOpenAuth }: VendiConNoiModalProps) {
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else { document.body.style.overflow = ''; setShowForm(false); }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center animate-fadeIn">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* Close */}
        <button onClick={onClose} className="absolute top-3 right-3 z-10 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="p-6 sm:p-8">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <Image src="/logo.png" alt="Stappando" width={120} height={30} className="h-7 w-auto" />
          </div>

          {!showForm ? (
            <>
              <h2 className="text-lg font-bold text-[#055667] text-center mb-1">Vendi i tuoi vini su Stappando</h2>
              <p className="text-center text-xs text-gray-500 mb-5">Zero costi di attivazione</p>

              <div className="grid grid-cols-2 gap-2.5 mb-5">
                {benefits.map(b => (
                  <div key={b.title} className="flex items-start gap-2 p-2.5 rounded-lg bg-gray-50">
                    <span className="text-base">{b.icon}</span>
                    <div>
                      <p className="text-[11px] font-bold text-gray-800">{b.title}</p>
                      <p className="text-[9px] text-gray-500 leading-relaxed">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowForm(true)}
                className="block w-full py-3 bg-[#b8973f] text-white font-bold text-sm text-center rounded-xl hover:bg-[#a07f30] transition-colors"
              >
                Registrati come Venditore
              </button>

              <button
                onClick={() => { onClose(); onOpenAuth?.(); }}
                className="block w-full mt-3 text-center text-xs text-gray-500 hover:text-[#055667] transition-colors"
              >
                Già venditore? <span className="underline font-medium">Accedi</span>
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setShowForm(false)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#055667] mb-4">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Indietro
              </button>
              <h2 className="text-lg font-bold text-[#055667] text-center mb-4">Registrazione Venditore</h2>
              <iframe
                src="https://stappando.it/vendor-register/"
                className="w-full h-[50vh] rounded-xl border border-gray-200"
                title="Registrazione Venditore"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
