'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TIPOLOGIA = ['Vini Rossi', 'Vini Bianchi', 'Rosati', 'Spumanti', 'Champagne'];
const SPUMANTI = ['Prosecco', 'Franciacorta', 'Trento DOC', 'Alta Langa'];
const REGIONI = ['Toscana', 'Piemonte', 'Puglia', 'Sicilia', 'Veneto', 'Campania', 'Sardegna'];
const VITIGNI = ['Primitivo', 'Sangiovese', 'Nebbiolo', 'Nero d\'Avola', 'Barolo', 'Chianti', 'Amarone'];

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isOpen, onClose]);

  const [loading, setLoading] = useState(false);

  const go = (term: string) => {
    setLoading(true);
    setQuery('');
    router.push(`/cerca?q=${encodeURIComponent(term)}`);
    setTimeout(() => { onClose(); setLoading(false); }, 300);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) go(query.trim());
  };

  if (!isOpen) return null;

  const pill = (label: string) => (
    <button key={label} onClick={() => go(label)} className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-50 border border-gray-200 text-gray-700 hover:bg-[#055667] hover:text-white hover:border-[#055667] transition-all">
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-[100] animate-fadeIn">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full h-full md:h-auto md:max-w-lg md:mx-auto md:mt-[12vh] md:rounded-2xl bg-white overflow-hidden flex flex-col md:max-h-[70vh] shadow-2xl">
        {/* Header + Search */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-[#055667]">Cerca</h2>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <form onSubmit={handleSubmit} className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input ref={inputRef} type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nome, cantina, vitigno..." className="w-full h-10 pl-9 pr-20 rounded-lg bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-[#055667]" autoFocus />
            <button type="submit" className="absolute right-1 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-[#055667] text-white rounded-md text-xs font-bold hover:bg-[#044556] transition-colors">Cerca</button>
          </form>
        </div>

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-[#055667]/20 border-t-[#055667] rounded-full animate-spin" />
              <span className="text-xs text-gray-500">Caricamento...</span>
            </div>
          </div>
        )}

        {/* Pills */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Tipologia — sfondo leggero teal */}
          <div className="bg-[#055667]/5 rounded-xl p-3">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#055667] mb-2">Tipologia</h3>
            <div className="flex flex-wrap gap-1.5">
              {TIPOLOGIA.map(f => (
                <button key={f} onClick={() => go(f)} className="px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-[#055667]/20 text-[#055667] hover:bg-[#055667] hover:text-white transition-all">{f}</button>
              ))}
            </div>
          </div>
          {/* Bollicine — sfondo gold */}
          <div className="bg-[#b8973f]/5 rounded-xl p-3">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#b8973f] mb-2">Bollicine</h3>
            <div className="flex flex-wrap gap-1.5">
              {SPUMANTI.map(f => (
                <button key={f} onClick={() => go(f)} className="px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-[#b8973f]/20 text-[#b8973f] hover:bg-[#b8973f] hover:text-white transition-all">{f}</button>
              ))}
            </div>
          </div>
          {/* Regione */}
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Per regione</h3>
            <div className="flex flex-wrap gap-1.5">
              {REGIONI.map(f => (
                <button key={f} onClick={() => go(f)} className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-50 border border-gray-200 text-gray-700 hover:bg-[#055667] hover:text-white hover:border-[#055667] transition-all">{f}</button>
              ))}
            </div>
          </div>
          {/* Più cercati — sfondo scuro */}
          <div className="bg-gray-900 rounded-xl p-3">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-white/60 mb-2">Più cercati</h3>
            <div className="flex flex-wrap gap-1.5">
              {VITIGNI.map(f => (
                <button key={f} onClick={() => go(f)} className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/10 border border-white/20 text-white hover:bg-white hover:text-gray-900 transition-all">{f}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
