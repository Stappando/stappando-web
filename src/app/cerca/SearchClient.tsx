'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { type WCCategory, decodeHtml, formatPrice } from '@/lib/api';
import ProductCard from '@/components/ProductCard';

const MACRO_CATEGORIES: { label: string; subs?: string[] }[] = [
  { label: 'Vini', subs: ['Vini Rossi', 'Vini Bianchi', 'Vini Rosati', 'Vini Liquorosi'] },
  { label: 'Bollicine', subs: ['Prosecco', 'Franciacorta', 'Champagne', 'Spumanti', 'Trento DOC'] },
  { label: 'Distillati', subs: ['Gin', 'Whisky', 'Rum', 'Grappe', 'Vodka', 'Tequila', 'Cognac', 'Brandy'] },
  { label: 'Liquori', subs: ['Amari', 'Limoncello', 'Genziana', 'Ratafià', 'Bitter'] },
  { label: 'Birre', subs: ['Birre Bionde', 'Birre Rosse'] },
  { label: 'Aperitivi' },
  { label: 'Cocktail' },
];

const ORDINA_OPTIONS = [
  { label: 'Più popolari', value: 'popularity' },
  { label: 'Novità', value: 'date' },
  { label: 'Prezzo ↑', value: 'price-asc' },
  { label: 'Prezzo ↓', value: 'price-desc' },
];

interface SearchResult {
  id: number;
  slug: string;
  name: string;
  price: string;
  regular_price: string;
  sale_price: string;
  image: string | null;
  vendor: string;
  region: string;
  on_sale: boolean;
  is_circuito: boolean;
  circuito_badge: string;
}

interface Props {
  initialQuery: string;
  initialOnSale: boolean;
  initialTag: string;
  initialVendor: string;
  categories: WCCategory[];
}

export default function SearchClient({ initialQuery, initialOnSale, initialTag, initialVendor, categories }: Props) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState(initialQuery);
  const [tag, setTag] = useState(initialTag);
  const [vendor, setVendor] = useState(initialVendor);
  const [onSale, setOnSale] = useState(initialOnSale);
  const [orderBy, setOrderBy] = useState('popularity');
  const [maxPrice, setMaxPrice] = useState(500);
  const [searched, setSearched] = useState(false);

  // Build WC API search term from all active filters
  const searchTerm = useMemo(() => {
    if (query) return query;
    if (tag) return tag;
    if (vendor) return vendor;
    return '';
  }, [query, tag, vendor]);

  // Fetch results from API
  const doSearch = useCallback(async (term: string) => {
    if (!term && !onSale) {
      // No search term and no sale filter — show nothing (or could show featured)
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (term) params.set('q', term);
      params.set('limit', '20');

      const res = await fetch(`/api/search?${params.toString()}`);
      if (res.ok) {
        let data: SearchResult[] = await res.json();

        // Client-side filters on top of API results
        if (onSale) data = data.filter(r => r.on_sale);
        if (maxPrice < 500) data = data.filter(r => parseFloat(r.price) <= maxPrice);

        // Sort
        if (orderBy === 'price-asc') data.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        else if (orderBy === 'price-desc') data.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        else if (orderBy === 'date') data.sort((a, b) => b.id - a.id);

        setResults(data);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }, [onSale, maxPrice, orderBy]);

  // Initial search on mount / param change
  useEffect(() => {
    if (searchTerm || onSale) {
      doSearch(searchTerm);
    }
  }, [searchTerm, onSale, doSearch]);

  // Category pill handler — search by category name
  const handleCategory = useCallback((cat: string) => {
    setQuery(cat === 'offerte' ? '' : cat);
    setTag('');
    setVendor('');
    setOnSale(cat === 'offerte');
  }, []);

  const activeCategory = onSale ? 'offerte' : query || tag || vendor || '';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* Toolbar */}
      <div className="flex items-center gap-1.5 overflow-visible flex-wrap mb-3">
        <button onClick={() => handleCategory('')} className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all ${!activeCategory ? 'bg-[#055667] text-white' : 'bg-white border border-gray-200 text-gray-700 hover:border-[#055667]'}`}>Tutti</button>

        {MACRO_CATEGORIES.map(mc => (
          <MacroDropdown key={mc.label} mc={mc} activeCategory={activeCategory} onSelect={handleCategory} />
        ))}

        <button onClick={() => handleCategory('offerte')} className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all ${onSale ? 'bg-red-500 text-white' : 'bg-red-50 border border-red-200 text-red-600 hover:bg-red-500 hover:text-white'}`}>Offerte</button>

        <div className="w-px h-5 bg-gray-200 shrink-0" />

        <select value={orderBy} onChange={(e) => setOrderBy(e.target.value)} className="h-7 px-2 rounded-lg border border-gray-200 text-[11px] text-gray-600 bg-white focus:outline-none focus:border-[#055667] shrink-0">
          {ORDINA_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <div className="hidden sm:flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] text-gray-500">max</span>
          <input type="range" min={5} max={500} step={5} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="w-16 h-1 bg-gray-200 rounded-full appearance-none cursor-pointer accent-[#055667]" />
          <span className="text-[10px] font-semibold text-[#055667] w-7">{maxPrice}€</span>
        </div>

        <span className="text-[10px] text-gray-400 shrink-0">{results.length} prodotti</span>
      </div>

      {/* Mobile price */}
      <div className="sm:hidden flex items-center gap-2 mb-3">
        <span className="text-[10px] text-gray-500">max</span>
        <input type="range" min={5} max={500} step={5} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="flex-1 h-1 bg-gray-200 rounded-full appearance-none cursor-pointer accent-[#055667]" />
        <span className="text-[10px] font-semibold text-[#055667]">{maxPrice}€</span>
      </div>

      {/* Active filter label */}
      {(tag || vendor) && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-gray-500">Filtro:</span>
          <span className="px-3 py-1 rounded-full bg-[#005667]/10 text-[#005667] text-xs font-semibold">
            {tag || vendor}
          </span>
          <button
            onClick={() => { setTag(''); setVendor(''); setQuery(''); }}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            ✕ Rimuovi
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-2">
          <div className="w-6 h-6 border-2 border-[#055667]/20 border-t-[#055667] rounded-full animate-spin" />
          <p className="text-xs text-gray-400">Ricerca in corso...</p>
        </div>
      )}

      {/* Results grid */}
      {!loading && results.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {results.map(r => (
            <SearchResultCard key={r.id} result={r} />
          ))}
        </div>
      )}

      {/* No results */}
      {!loading && searched && results.length === 0 && (
        <div className="text-center py-16">
          <svg className="w-10 h-10 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <p className="text-sm font-semibold text-gray-700">Nessun prodotto trovato</p>
          <p className="text-xs text-gray-500 mt-1">Prova con altri filtri</p>
        </div>
      )}

      {/* Empty state — no search active */}
      {!loading && !searched && !searchTerm && !onSale && (
        <div className="text-center py-16">
          <svg className="w-10 h-10 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <p className="text-sm font-semibold text-gray-700">Cerca un vino o scegli una categoria</p>
          <p className="text-xs text-gray-500 mt-1">Usa i filtri sopra per trovare il vino perfetto</p>
        </div>
      )}
    </div>
  );
}

/* ── Search Result Card (uses API data format) ─────────── */

function SearchResultCard({ result }: { result: SearchResult }) {
  return (
    <Link href={`/prodotto/${result.slug}`} className={`group rounded-2xl bg-white overflow-hidden border transition-all hover:shadow-md ${result.is_circuito ? 'border-[#d9c39a]' : 'border-gray-200'}`}>
      <div className="relative aspect-square bg-[#f8f7f5] overflow-hidden">
        {result.image && (
          <Image
            src={result.image}
            alt={decodeHtml(result.name)}
            fill
            className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        )}
        {result.is_circuito && (
          <div className="absolute top-2 left-2 px-2 py-0.5 bg-[#d9c39a] text-[#5a4200] text-[9px] font-bold rounded">
            {result.circuito_badge || 'Sommelier'}
          </div>
        )}
        {result.on_sale && result.regular_price && (
          <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded">
            -{Math.round((1 - parseFloat(result.price) / parseFloat(result.regular_price)) * 100)}%
          </div>
        )}
      </div>
      <div className="p-3">
        {result.vendor && (
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#b8973f] mb-0.5 line-clamp-1">{result.vendor}</p>
        )}
        <p className="text-sm text-gray-900 line-clamp-2 mb-1.5 min-h-[2.5rem]">{decodeHtml(result.name)}</p>
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm font-bold text-[#005667]">{formatPrice(result.price)} €</span>
          {result.on_sale && result.regular_price && (
            <span className="text-[11px] text-gray-400 line-through">{formatPrice(result.regular_price)} €</span>
          )}
        </div>
        {result.region && (
          <p className="text-[10px] text-gray-400 mt-1">{result.region}</p>
        )}
      </div>
    </Link>
  );
}

/* ── Macro dropdown (same as before) ───────────────────── */

function MacroDropdown({ mc, activeCategory, onSelect }: { mc: { label: string; subs?: string[] }; activeCategory: string; onSelect: (c: string) => void }) {
  const [open, setOpen] = useState(false);
  const isActive = activeCategory.toLowerCase() === mc.label.toLowerCase() || mc.subs?.some(s => activeCategory.toLowerCase() === s.toLowerCase());

  if (!mc.subs) {
    return <button onClick={() => onSelect(mc.label)} className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all ${isActive ? 'bg-[#055667] text-white' : 'bg-white border border-gray-200 text-gray-700 hover:border-[#055667]'}`}>{mc.label}</button>;
  }

  return (
    <div className="relative shrink-0" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${isActive ? 'bg-[#055667] text-white' : 'bg-white border border-gray-200 text-gray-700 hover:border-[#055667]'}`}>
        {mc.label}
        <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>
      {open && (
        <div className="absolute top-full left-0 pt-1 z-30">
          <div className="bg-white rounded-lg border border-gray-200 shadow-xl py-1 min-w-[160px]">
            <button onClick={() => { onSelect(mc.label); setOpen(false); }} className={`block w-full text-left px-4 py-2 text-xs font-semibold hover:bg-gray-50 ${activeCategory.toLowerCase() === mc.label.toLowerCase() ? 'text-[#055667]' : 'text-gray-700'}`}>Tutti {mc.label}</button>
            <div className="h-px bg-gray-100 mx-3" />
            {mc.subs.map(sub => (
              <button key={sub} onClick={() => { onSelect(sub); setOpen(false); }} className={`block w-full text-left px-4 py-2 text-xs hover:bg-gray-50 ${activeCategory.toLowerCase() === sub.toLowerCase() ? 'font-bold text-[#055667]' : 'text-gray-600'}`}>{sub}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
