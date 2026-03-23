'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { type WCProduct } from '@/lib/api';
import ProductCard from '@/components/ProductCard';

const TIPOLOGIA = ['Vini Rossi', 'Vini Bianchi', 'Rosati', 'Prosecco', 'Franciacorta', 'Spumanti', 'Champagne', 'Distillati'];
const DENOMINAZIONE = ['DOCG', 'DOC', 'IGT', 'IGP'];
const FASCIA_PREZZO = [
  { label: 'Fino a 10€', min: 0, max: 10 },
  { label: '10€ - 20€', min: 10, max: 20 },
  { label: '20€ - 50€', min: 20, max: 50 },
  { label: 'Oltre 50€', min: 50, max: 999 },
];

interface Props {
  initialProducts: WCProduct[];
  initialQuery: string;
  initialOnSale: boolean;
}

export default function SearchClient({ initialProducts, initialQuery, initialOnSale }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [products, setProducts] = useState(initialProducts);
  const [loading, setLoading] = useState(false);
  const [priceRange, setPriceRange] = useState<{ min: number; max: number } | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const doSearch = useCallback(async (q: string, onSale = false, minPrice?: number, maxPrice?: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (onSale) params.set('on_sale', 'true');
      router.push(`/cerca?${params.toString()}`, { scroll: false });

      const apiUrl = new URL('https://stappando.it/wp-json/wc/v3/products');
      apiUrl.searchParams.set('consumer_key', 'ck_e28bb3c3e86e007bad35911cffb20258a1343b53');
      apiUrl.searchParams.set('consumer_secret', 'cs_9494a1fed3d4ed450ff53df9166078abb2388e44');
      apiUrl.searchParams.set('per_page', '40');
      apiUrl.searchParams.set('status', 'publish');
      apiUrl.searchParams.set('orderby', 'popularity');
      if (q) apiUrl.searchParams.set('search', q);
      if (onSale) apiUrl.searchParams.set('on_sale', 'true');
      if (minPrice !== undefined) apiUrl.searchParams.set('min_price', String(minPrice));
      if (maxPrice !== undefined && maxPrice < 999) apiUrl.searchParams.set('max_price', String(maxPrice));

      const res = await fetch(apiUrl.toString());
      if (res.ok) {
        const data: WCProduct[] = await res.json();
        setProducts(data);
      }
    } catch {
      // keep existing
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) doSearch(query.trim(), false, priceRange?.min, priceRange?.max);
  };

  const handleQuickFilter = (term: string) => {
    setQuery(term);
    doSearch(term, false, priceRange?.min, priceRange?.max);
  };

  const handlePriceFilter = (range: { min: number; max: number } | null) => {
    setPriceRange(range);
    doSearch(query.trim() || '', false, range?.min, range?.max);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
          {initialOnSale ? '🔥 Offerte' : initialQuery ? `Risultati per "${initialQuery}"` : 'Cerca vini'}
        </h1>
        {products.length > 0 && (
          <p className="text-sm text-gray-500 mt-1">{products.length} prodotti trovati</p>
        )}
      </div>

      {/* Search bar */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="relative max-w-2xl">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cerca per nome, cantina, vitigno, regione..."
            className="w-full h-14 pl-12 pr-28 rounded-2xl bg-white border border-gray-200 text-base focus:outline-none focus:border-[#055667] focus:ring-2 focus:ring-[#055667]/20 shadow-sm"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2.5 bg-[#055667] text-white rounded-xl text-sm font-bold hover:bg-[#044556] transition-colors"
          >
            Cerca
          </button>
        </div>
      </form>

      {/* Filter toggle */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="mb-4 flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        Filtri {showFilters ? '▲' : '▼'}
        {priceRange && <span className="w-2 h-2 rounded-full bg-[#055667]" />}
      </button>

      {/* Filters panel */}
      {showFilters && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6 shadow-sm space-y-5">
          {/* Tipologia */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Tipologia</h3>
            <div className="flex flex-wrap gap-2">
              {TIPOLOGIA.map(t => (
                <button
                  key={t}
                  onClick={() => handleQuickFilter(t)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    query === t
                      ? 'bg-[#055667] text-white'
                      : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-[#055667] hover:text-white hover:border-[#055667]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Denominazione */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Denominazione</h3>
            <div className="flex flex-wrap gap-2">
              {DENOMINAZIONE.map(d => (
                <button
                  key={d}
                  onClick={() => handleQuickFilter(d)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    query === d
                      ? 'bg-[#055667] text-white'
                      : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-[#055667] hover:text-white hover:border-[#055667]'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Fascia prezzo */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Fascia di prezzo</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handlePriceFilter(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  !priceRange
                    ? 'bg-[#b8973f] text-white'
                    : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-[#b8973f] hover:text-white hover:border-[#b8973f]'
                }`}
              >
                Tutte
              </button>
              {FASCIA_PREZZO.map(fp => (
                <button
                  key={fp.label}
                  onClick={() => handlePriceFilter({ min: fp.min, max: fp.max })}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    priceRange?.min === fp.min && priceRange?.max === fp.max
                      ? 'bg-[#b8973f] text-white'
                      : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-[#b8973f] hover:text-white hover:border-[#b8973f]'
                  }`}
                >
                  {fp.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick pills (always visible) */}
      <div className="flex flex-wrap gap-2 mb-8">
        {['Rossi', 'Bianchi', 'Rosati', 'Bollicine', 'Barolo', 'Chianti', 'Primitivo', 'Amarone'].map(f => (
          <button
            key={f}
            onClick={() => handleQuickFilter(f)}
            className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-[#055667] hover:text-white transition-all"
          >
            {f}
          </button>
        ))}
        <button
          onClick={() => doSearch('', true)}
          className="px-3 py-1.5 rounded-full text-xs font-medium bg-red-50 text-red-600 hover:bg-red-500 hover:text-white transition-all"
        >
          🔥 Offerte
        </button>
      </div>

      {/* Results grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-3 border-[#055667]/20 border-t-[#055667] rounded-full animate-spin" />
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : initialQuery || initialOnSale ? (
        <div className="text-center py-20">
          <span className="text-5xl mb-4 block">🔍</span>
          <p className="text-lg font-semibold text-gray-700">Nessun risultato</p>
          <p className="text-sm text-gray-500 mt-1">Prova con termini diversi o meno filtri</p>
        </div>
      ) : (
        <div className="text-center py-20">
          <span className="text-5xl mb-4 block">🍷</span>
          <p className="text-lg font-semibold text-gray-700">Cerca tra centinaia di vini</p>
          <p className="text-sm text-gray-500 mt-1">Usa la barra di ricerca o i filtri per trovare il vino perfetto</p>
        </div>
      )}
    </div>
  );
}
