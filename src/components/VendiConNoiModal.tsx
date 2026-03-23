'use client';

import { useEffect } from 'react';
import Image from 'next/image';

interface VendiConNoiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth?: () => void;
}

const benefits = [
  { icon: '👁️', title: 'Visibilità', desc: 'Migliaia di appassionati pronti a scoprire i tuoi vini' },
  { icon: '🚚', title: 'Logistica', desc: 'Spedizioni con corrieri specializzati nel trasporto vini' },
  { icon: '💳', title: 'Pagamenti', desc: 'Incassi sicuri e puntuali, commissioni trasparenti' },
  { icon: '🤝', title: 'Supporto', desc: 'Team dedicato per configurazione e crescita vendite' },
];

export default function VendiConNoiModal({ isOpen, onClose, onOpenAuth }: VendiConNoiModalProps) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
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
          <div className="flex justify-center mb-5">
            <Image src="/logo.png" alt="Stappando" width={140} height={35} className="h-8 w-auto" />
          </div>

          <h2 className="text-xl font-bold text-[#055667] text-center mb-1">Vendi i tuoi vini su Stappando</h2>
          <p className="text-center text-sm text-gray-500 mb-6">Zero costi di attivazione, massima visibilità</p>

          {/* Benefits - compact */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {benefits.map(b => (
              <div key={b.title} className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-50">
                <span className="text-lg">{b.icon}</span>
                <div>
                  <p className="text-xs font-bold text-gray-800">{b.title}</p>
                  <p className="text-[10px] text-gray-500 leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <a
            href="https://stappando.it/vendor-register/"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-3 bg-[#b8973f] text-white font-bold text-sm text-center rounded-xl hover:bg-[#a07f30] transition-colors"
          >
            Registrati come Venditore
          </a>

          <button
            onClick={() => { onClose(); onOpenAuth?.(); }}
            className="block w-full mt-3 text-center text-sm text-gray-500 hover:text-[#055667] transition-colors"
          >
            Già venditore? <span className="underline font-medium">Accedi</span>
          </button>
        </div>
      </div>
    </div>
  );
}
