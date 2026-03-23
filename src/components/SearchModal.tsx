'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TIPOLOGIA = ['Vini Rossi', 'Vini Bianchi', 'Rosati', 'Prosecco', 'Franciacorta', 'Spumanti', 'Champagne'];
const REGIONI = ['Toscana', 'Piemonte', 'Puglia', 'Sicilia', 'Veneto', 'Campania', 'Lazio', 'Emilia-Romagna', 'Sardegna', 'Friuli'];

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
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

  const toggleFilter = (f: string) => {
    setSelectedFilters(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  };

  const doSearch = () => {
    const searchTerms = [query.trim(), ...selectedFilters].filter(Boolean).join(' ');
    if (!searchTerms) return;
    onClose();
    setQuery('');
    setSelectedFilters([]);
    router.push(`/cerca?q=${encodeURIComponent(searchTerms)}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch();
  };

  const quickSearch = (term: string) => {
    onClose();
    setQuery('');
    setSelectedFilters([]);
    router.push(`/cerca?q=${encodeURIComponent(term)}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] animate-fadeIn">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full h-full md:h-auto md:max-w-2xl md:mx-auto md:mt-[8vh] md:rounded-2xl bg-white overflow-hidden flex flex-col md:max-h-[80vh] shadow-2xl">
        {/* Header */}
        <div className="flex-shrink-0 p-4 sm:p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[#055667]">Cosa stai cercando?</h2>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cerca per nome, cantina, vitigno..."
                className="w-full h-14 pl-12 pr-24 rounded-xl bg-gray-50 border border-gray-200 text-lg focus:outline-none focus:border-[#055667] focus:ring-2 focus:ring-[#055667]/20"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2 bg-[#055667] text-white rounded-lg text-sm font-semibold hover:bg-[#044556] transition-colors"
              >
                Cerca
              </button>
            </div>
          </form>
        </div>

        {/* Filters */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Tipologia */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Tipologia</h3>
            <div className="flex flex-wrap gap-2">
              {TIPOLOGIA.map(f => (
                <button
                  key={f}
                  onClick={() => quickSearch(f)}
                  className="px-4 py-2 rounded-full text-sm font-medium bg-gray-50 border border-gray-200 text-gray-700 hover:bg-[#055667] hover:text-white hover:border-[#055667] transition-all duration-150"
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Regione */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Regione</h3>
            <div className="flex flex-wrap gap-2">
              {REGIONI.map(f => (
                <button
                  key={f}
                  onClick={() => quickSearch(f)}
                  className="px-4 py-2 rounded-full text-sm font-medium bg-gray-50 border border-gray-200 text-gray-700 hover:bg-[#055667] hover:text-white hover:border-[#055667] transition-all duration-150"
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Più cercati</h3>
            <div className="flex flex-wrap gap-2">
              {['Primitivo', 'Sangiovese', 'Nebbiolo', 'Nero d\'Avola', 'Barolo', 'Chianti', 'Amarone'].map(f => (
                <button
                  key={f}
                  onClick={() => quickSearch(f)}
                  className="px-4 py-2 rounded-full text-sm font-medium bg-[#055667]/5 border border-[#055667]/20 text-[#055667] hover:bg-[#055667] hover:text-white transition-all duration-150"
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Offerte */}
          <button
            onClick={() => { onClose(); router.push('/cerca?on_sale=true'); }}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#b8973f] to-[#d4af5a] text-white font-semibold text-center hover:shadow-lg transition-shadow"
          >
            🔥 Scopri tutte le offerte
          </button>
        </div>
      </div>
    </div>
  );
}
