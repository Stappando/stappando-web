'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/store/cart';
import { DEFAULT_VENDOR_NAME } from '@/lib/config';

/* ── Types ─────────────────────────────── */
interface Product {
  id: number; name: string; slug: string; price: string;
  regular_price: string; sale_price: string; on_sale: boolean;
  images: { src: string }[]; categories: { id: number; name: string; slug: string }[];
  tags: { id: number; name: string }[]; stock_status: string;
  attributes: { name: string; options: string[] }[];
  _vendorName?: string; _vendorId?: string;
}

const fmt = (p: string) => parseFloat(p || '0').toFixed(2).replace('.', ',');
const pct = (r: string, s: string) => { const rv = parseFloat(r), sv = parseFloat(s); return rv > 0 && sv > 0 ? Math.round((1 - sv / rv) * 100) : 0; };

/* ── Regioni italiane per filtro ───────── */
const REGIONI = [
  'Piemonte', 'Toscana', 'Veneto', 'Puglia', 'Sicilia', 'Sardegna', 'Campania',
  'Emilia-Romagna', 'Friuli Venezia Giulia', 'Trentino-Alto Adige', 'Lombardia',
  'Marche', 'Abruzzo', 'Lazio', 'Umbria', 'Liguria', 'Calabria', 'Basilicata', 'Molise', "Valle d'Aosta"
];

/* ── Quick Links ───────────────────────── */
const QUICK_LINKS = [
  { label: 'Vini Rossi', cat: 'vini-rossi-2' },
  { label: 'Vini Bianchi', cat: 'vini-bianchi' },
  { label: 'Bollicine', cat: 'spumanti' },
  { label: 'Offerte', filter: 'sale' },
  { label: 'Regali', cat: 'vuoi-fare-un-regalo' },
];

const SUGGESTIONS = [
  'Chianti', 'Prosecco', 'Barolo', 'Brunello', 'Amarone',
  'Vino per aperitivo', 'Rosso leggero', 'Bianco fresco', 'Bollicine per brindisi'
];

/* ══════════════════════════════════════════
   Search Autocomplete Dropdown
   ══════════════════════════════════════════ */
function SearchAutocomplete({ query, products, onSelect, onClose }: {
  query: string; products: Product[]; onSelect: (q: string) => void; onClose: () => void;
}) {
  const matching = useMemo(() => {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();
    return products
      .filter(p => p.name.toLowerCase().includes(q) || p.categories.some(c => c.name.toLowerCase().includes(q)))
      .sort((a, b) => {
        const aStapp = (a._vendorName || '').toLowerCase().includes('stappando') ? 0 : 1;
        const bStapp = (b._vendorName || '').toLowerCase().includes('stappando') ? 0 : 1;
        return aStapp - bStapp;
      })
      .slice(0, 5);
  }, [query, products]);

  const suggestions = useMemo(() => {
    if (!query || query.length < 1) return SUGGESTIONS.slice(0, 5);
    const q = query.toLowerCase();
    return SUGGESTIONS.filter(s => s.toLowerCase().includes(q)).slice(0, 3);
  }, [query]);

  if (!query) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[100]" onMouseDown={e => e.preventDefault()}>
      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="px-4 pt-3 pb-2">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Suggerimenti</p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map(s => (
              <button key={s} onClick={() => onSelect(s)} className="px-3 py-1.5 bg-gray-50 hover:bg-[#055667] hover:text-white text-xs font-medium text-gray-700 rounded-full transition-colors">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Products */}
      {matching.length > 0 && (
        <div className="border-t border-gray-50 px-2 py-2">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 px-2">Prodotti</p>
          {matching.map(p => {
            const isStapp = (p._vendorName || '').toLowerCase().includes('stappando');
            return (
              <Link key={p.id} href={`/prodotto/${p.slug}`} onClick={onClose} className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-50 transition-colors">
                {p.images?.[0]?.src && (
                  <img src={p.images[0].src} alt="" className="w-10 h-10 object-contain rounded-lg bg-gray-50 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                  <div className="flex items-center gap-2">
                    {isStapp ? (
                      <span className="text-[9px] font-semibold text-emerald-600">✓ Spedito da Stappando</span>
                    ) : (
                      <span className="text-[9px] font-medium text-amber-600">🍇 Dalla cantina</span>
                    )}
                  </div>
                </div>
                <span className="text-sm font-bold text-gray-900 shrink-0">{fmt(p.price)}€</span>
              </Link>
            );
          })}
        </div>
      )}

      {/* Quick Links */}
      <div className="border-t border-gray-50 px-4 py-3 bg-gray-50/50">
        <div className="flex flex-wrap gap-2">
          {QUICK_LINKS.map(l => (
            <button key={l.label} onClick={() => onSelect(l.label)} className="text-xs font-medium text-[#055667] hover:underline">
              {l.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   Search Results Product Card
   ══════════════════════════════════════════ */
function ResultCard({ p }: { p: Product }) {
  const addItem = useCartStore(s => s.addItem);
  const [added, setAdded] = useState(false);
  const vendor = p._vendorName || DEFAULT_VENDOR_NAME;
  const isStapp = vendor.toLowerCase().includes('stappando');
  const discount = p.on_sale ? pct(p.regular_price, p.sale_price) : 0;
  const img = p.images?.[0]?.src || '';

  const handleAdd = () => {
    addItem({ id: p.id, name: p.name, price: parseFloat(p.price), image: img, vendorId: p._vendorId || 'stappando', vendorName: vendor });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col">
      <Link href={`/prodotto/${p.slug}`} className="relative aspect-square bg-gradient-to-b from-gray-50 to-white p-3 flex items-center justify-center overflow-hidden">
        {discount > 0 && <span className="absolute top-2.5 left-2.5 z-10 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">-{discount}%</span>}
        {isStapp && <span className="absolute top-2.5 right-2.5 z-10 bg-emerald-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">⚡ VELOCE</span>}
        {img && <img src={img} alt={p.name} className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500" loading="lazy" />}
      </Link>
      <div className="p-3 flex flex-col flex-1">
        <div className="flex items-center gap-1 mb-1">
          {isStapp ? (
            <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">Consegna veloce</span>
          ) : (
            <span className="text-[9px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full">2-4 giorni</span>
          )}
        </div>
        <Link href={`/prodotto/${p.slug}`} className="text-sm font-medium text-gray-900 leading-snug line-clamp-2 hover:text-[#055667] transition-colors mb-auto min-h-[2.5rem]">
          {p.name}
        </Link>
        <div className="flex items-end justify-between mt-2 gap-2">
          <div>
            {p.on_sale && p.regular_price && <span className="text-xs text-gray-400 line-through mr-1">{fmt(p.regular_price)}€</span>}
            <span className="text-lg font-bold text-gray-900">{fmt(p.price)}<span className="text-sm">€</span></span>
          </div>
          <button onClick={handleAdd} className={`shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${added ? 'bg-emerald-500 text-white scale-95' : 'bg-[#055667] text-white hover:bg-[#044556] active:scale-95'}`}>
            {added ? '✓' : 'Aggiungi'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   FILTERS SIDEBAR
   ══════════════════════════════════════════ */
function FiltersSidebar({ filters, setFilters, categories, regions, priceRange }: {
  filters: Filters; setFilters: (f: Filters) => void;
  categories: string[]; regions: string[]; priceRange: [number, number];
}) {
  return (
    <div className="space-y-6">
      {/* Spedizione */}
      <div>
        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Spedizione</h3>
        <div className="space-y-2">
          {[
            { label: 'Tutti', value: 'all' },
            { label: '⚡ Veloce (Stappando)', value: 'stappando' },
            { label: '🍇 Dalla cantina', value: 'cantina' },
          ].map(o => (
            <button key={o.value} onClick={() => setFilters({ ...filters, shipping: o.value as any })}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filters.shipping === o.value ? 'bg-[#055667] text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tipologia */}
      <div>
        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Tipologia</h3>
        <div className="flex flex-wrap gap-1.5">
          {['Tutti', ...categories].map(c => (
            <button key={c} onClick={() => setFilters({ ...filters, category: c === 'Tutti' ? '' : c })}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${(c === 'Tutti' && !filters.category) || filters.category === c ? 'bg-[#055667] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Prezzo */}
      <div>
        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Prezzo</h3>
        <div className="px-1">
          <input type="range" min={priceRange[0]} max={priceRange[1]} value={filters.maxPrice || priceRange[1]}
            onChange={e => setFilters({ ...filters, maxPrice: parseInt(e.target.value) })}
            className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-[#055667]" />
          <div className="flex justify-between mt-1.5">
            <span className="text-xs text-gray-500">{priceRange[0]}€</span>
            <span className="text-xs font-bold text-[#055667]">Max {filters.maxPrice || priceRange[1]}€</span>
          </div>
        </div>
      </div>

      {/* Regione */}
      {regions.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Regione</h3>
          <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
            {['Tutte', ...regions].map(r => (
              <button key={r} onClick={() => setFilters({ ...filters, region: r === 'Tutte' ? '' : r })}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${(r === 'Tutte' && !filters.region) || filters.region === r ? 'bg-[#055667] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {r}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Filters type ──────────────────────── */
interface Filters {
  category: string;
  shipping: 'all' | 'stappando' | 'cantina';
  maxPrice: number;
  region: string;
  sort: string;
}

/* ══════════════════════════════════════════
   MAIN SEARCH PAGE
   ══════════════════════════════════════════ */
export default function SearchV2({ initialQuery }: { initialQuery?: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState(initialQuery || '');
  const [searchInput, setSearchInput] = useState(initialQuery || '');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [page, setPage] = useState(1);
  const inputRef = useRef<HTMLInputElement>(null);
  const PER_PAGE = 24;

  const [filters, setFilters] = useState<Filters>({
    category: '', shipping: 'all', maxPrice: 500, region: '', sort: 'relevance',
  });

  // Load products.json
  useEffect(() => {
    fetch('/products.json').then(r => r.json()).then((all: Product[]) => { setProducts(all); setLoaded(true); }).catch(() => setLoaded(true));
  }, []);

  // Extract available categories and regions
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach(p => p.categories.forEach(c => cats.add(c.name)));
    return ['Vini Rossi', 'Vini Bianchi', 'Vini Rosati', 'Spumanti', 'Prosecco', 'Champagne', 'Franciacorta', 'Distillati', 'Liquori', 'Birre', 'Aperitivi'].filter(c => cats.has(c));
  }, [products]);

  const availableRegions = useMemo(() => {
    const regs = new Set<string>();
    products.forEach(p => {
      const regAttr = p.attributes?.find(a => a.name.toLowerCase() === 'regione');
      if (regAttr?.options?.[0]) regs.add(regAttr.options[0]);
    });
    return REGIONI.filter(r => regs.has(r));
  }, [products]);

  const priceRange: [number, number] = useMemo(() => {
    const prices = products.map(p => parseFloat(p.price)).filter(p => p > 0);
    return [Math.floor(Math.min(...prices) || 0), Math.ceil(Math.max(...prices) || 500)];
  }, [products]);

  // Filter + sort
  const results = useMemo(() => {
    let filtered = products.filter(p => p.stock_status === 'instock');

    // Text search
    if (query) {
      const q = query.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.categories.some(c => c.name.toLowerCase().includes(q)) ||
        p.attributes?.some(a => a.options?.some(o => o.toLowerCase().includes(q)))
      );
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(p => p.categories.some(c => c.name === filters.category));
    }

    // Shipping filter
    if (filters.shipping === 'stappando') {
      filtered = filtered.filter(p => (p._vendorName || '').toLowerCase().includes('stappando'));
    } else if (filters.shipping === 'cantina') {
      filtered = filtered.filter(p => !(p._vendorName || '').toLowerCase().includes('stappando') && p._vendorName);
    }

    // Price filter
    if (filters.maxPrice < priceRange[1]) {
      filtered = filtered.filter(p => parseFloat(p.price) <= filters.maxPrice);
    }

    // Region filter
    if (filters.region) {
      filtered = filtered.filter(p => {
        const reg = p.attributes?.find(a => a.name.toLowerCase() === 'regione');
        return reg?.options?.some(o => o === filters.region);
      });
    }

    // Sort
    switch (filters.sort) {
      case 'price_asc':
        filtered.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        break;
      case 'price_desc':
        filtered.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        break;
      case 'new':
        // Already sorted by ID desc from API
        filtered.sort((a, b) => b.id - a.id);
        break;
      default:
        // Relevance: Stappando first, then by ID
        filtered.sort((a, b) => {
          const aS = (a._vendorName || '').toLowerCase().includes('stappando') ? 0 : 1;
          const bS = (b._vendorName || '').toLowerCase().includes('stappando') ? 0 : 1;
          if (aS !== bS) return aS - bS;
          return b.id - a.id;
        });
        break;
    }

    return filtered;
  }, [products, query, filters, priceRange]);

  const paginatedResults = results.slice(0, page * PER_PAGE);
  const hasMore = paginatedResults.length < results.length;

  const handleSearch = (q: string) => {
    setQuery(q);
    setSearchInput(q);
    setShowDropdown(false);
    setPage(1);
  };

  // Popular products for empty state
  const popular = useMemo(() => products.filter(p => p.stock_status === 'instock').slice(0, 4), [products]);

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* ── Search Header ─────────────── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/homepage-v2" className="shrink-0">
              <img src="/logo.png" alt="Stappando" className="h-8 w-auto" />
            </Link>

            {/* Search bar */}
            <div className="flex-1 max-w-2xl relative">
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                <input
                  ref={inputRef}
                  type="text"
                  value={searchInput}
                  onChange={e => { setSearchInput(e.target.value); setShowDropdown(true); }}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSearch(searchInput); }}
                  placeholder='Cerca vino, cantina o occasione (es. aperitivo, rosso leggero)'
                  className="w-full pl-11 pr-20 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-[#055667] focus:ring-2 focus:ring-[#055667]/10 focus:bg-white transition-all"
                />
                <button onClick={() => handleSearch(searchInput)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#055667] text-white px-4 py-1.5 rounded-xl text-xs font-bold hover:bg-[#044556] transition-colors">
                  Cerca
                </button>
              </div>

              {/* Autocomplete */}
              {showDropdown && searchInput.length >= 1 && (
                <SearchAutocomplete query={searchInput} products={products} onSelect={handleSearch} onClose={() => setShowDropdown(false)} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Results Area ──────────────── */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <p className="text-sm text-gray-600">
              <span className="font-bold text-gray-900">{results.length}</span> {results.length === 1 ? 'risultato' : 'risultati'}
              {query && <> per <span className="font-semibold text-[#055667]">&ldquo;{query}&rdquo;</span></>}
            </p>
            {/* Mobile filter toggle */}
            <button onClick={() => setShowMobileFilters(!showMobileFilters)} className="lg:hidden flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>
              Filtri
            </button>
          </div>

          {/* Sort */}
          <select value={filters.sort} onChange={e => setFilters({ ...filters, sort: e.target.value })}
            className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-700 focus:outline-none focus:border-[#055667]">
            <option value="relevance">Più rilevanti</option>
            <option value="price_asc">Prezzo ↑</option>
            <option value="price_desc">Prezzo ↓</option>
            <option value="new">Novità</option>
          </select>
        </div>

        <div className="flex gap-6">
          {/* Sidebar — desktop */}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-24 bg-white rounded-2xl border border-gray-100 p-5">
              <FiltersSidebar filters={filters} setFilters={(f) => { setFilters(f); setPage(1); }} categories={availableCategories} regions={availableRegions} priceRange={priceRange} />
            </div>
          </aside>

          {/* Mobile filters */}
          {showMobileFilters && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-black/30" onClick={() => setShowMobileFilters(false)} />
              <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold">Filtri</h2>
                  <button onClick={() => setShowMobileFilters(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">✕</button>
                </div>
                <FiltersSidebar filters={filters} setFilters={(f) => { setFilters(f); setPage(1); }} categories={availableCategories} regions={availableRegions} priceRange={priceRange} />
                <button onClick={() => setShowMobileFilters(false)} className="w-full mt-6 bg-[#055667] text-white py-3 rounded-xl font-bold text-sm">
                  Mostra {results.length} risultati
                </button>
              </div>
            </div>
          )}

          {/* Grid */}
          <main className="flex-1">
            {!loaded ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                    <div className="aspect-square bg-gray-100" />
                    <div className="p-3 space-y-2">
                      <div className="h-3 bg-gray-100 rounded-full w-1/3" />
                      <div className="h-4 bg-gray-100 rounded-full w-full" />
                      <div className="h-4 bg-gray-100 rounded-full w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : results.length === 0 ? (
              /* Empty State */
              <div className="text-center py-16">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Nessun risultato</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Non abbiamo trovato vini per {query ? `"${query}"` : 'i filtri selezionati'}
                </p>
                <div className="mb-8">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Prova con:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {['Chianti', 'Prosecco', 'Barolo', 'Amarone', 'Rosato'].map(s => (
                      <button key={s} onClick={() => handleSearch(s)} className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:border-[#055667] hover:text-[#055667] transition-colors">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                {popular.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">I più popolari</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
                      {popular.map(p => <ResultCard key={p.id} p={p} />)}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {paginatedResults.map(p => <ResultCard key={p.id} p={p} />)}
                </div>

                {/* Load more */}
                {hasMore && (
                  <div className="text-center mt-8">
                    <button onClick={() => setPage(page + 1)} className="px-8 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:border-[#055667] hover:text-[#055667] transition-colors">
                      Mostra altri prodotti ({results.length - paginatedResults.length} rimanenti)
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
