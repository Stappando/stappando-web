'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { type WCProduct, type WCCategory, decodeHtml } from '@/lib/api';
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

function toWCProduct(r: SearchResult): WCProduct {
  return {
    id: r.id, slug: r.slug, name: r.name, price: r.price,
    regular_price: r.regular_price, sale_price: r.sale_price, on_sale: r.on_sale,
    images: r.image ? [{ id: 0, src: r.image, alt: r.name }] : [],
    attributes: [
      ...(r.vendor ? [{ id: 0, name: 'Produttore', options: [r.vendor] }] : []),
      ...(r.region ? [{ id: 0, name: 'Regione', options: [r.region] }] : []),
    ],
    tags: r.is_circuito ? [{ id: 21993, name: 'circuito', slug: 'circuito' }] : [],
    meta_data: r.circuito_badge ? [{ key: '_circuito_badge', value: r.circuito_badge }] : [],
    _vendorName: r.vendor, _vendorId: 'search',
    store: { id: 0, name: r.vendor, url: '' },
    categories: [], description: '', short_description: '', status: 'publish',
  } as unknown as WCProduct;
}

/* ── Suggestions when no results ──────────────────────── */

function NoResultsSuggestions() {
  const [suggestions, setSuggestions] = useState<WCProduct[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Fetch circuito/featured products as suggestions
    fetch('/api/search?per_page=8&tag=circuito')
      .then(r => r.ok ? r.json() : { products: [] })
      .then(data => {
        const products = (data.products || []).map(toWCProduct);
        if (products.length > 0) {
          setSuggestions(products);
        } else {
          // Fallback: fetch bestsellers
          fetch('/api/search?per_page=8&orderby=popularity')
            .then(r => r.ok ? r.json() : { products: [] })
            .then(d2 => setSuggestions((d2.products || []).map(toWCProduct)))
            .catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded || suggestions.length === 0) return null;

  return (
    <div>
      <p className="text-[11px] font-semibold text-[#005667] uppercase tracking-wider mb-4">Selezione del sommelier</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {suggestions.map(p => <ProductCard key={p.id} product={p} />)}
      </div>
    </div>
  );
}

interface Props {
  initialQuery: string;
  initialOnSale: boolean;
  initialTag: string;
  initialVendor: string;
  categories: WCCategory[];
}

export default function SearchClient({ initialQuery, initialOnSale, initialTag, initialVendor, categories }: Props) {
  // results derived from filteredResults useMemo below
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState(initialQuery);
  const [tag, setTag] = useState(initialTag);
  const [vendor, setVendor] = useState(initialVendor);
  const [onSale, setOnSale] = useState(initialOnSale);
  const [orderBy, setOrderBy] = useState('popularity');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(999);
  const [rawResults, setRawResults] = useState<SearchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Build WC API search term from all active filters
  const searchTerm = useMemo(() => {
    if (query) return query;
    if (tag) return tag;
    if (vendor) return vendor;
    return '';
  }, [query, tag, vendor]);

  // Fetch results from API — no price/sort in deps to avoid loops
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const searchRef = useRef({ rawResults: [] as SearchResult[], searching: false });

  const doSearch = useCallback(async (term: string, pageNum: number = 1, append: boolean = false) => {
    if (!term && !onSale) {
      setRawResults([]);
      setSearched(false);
      searchRef.current.rawResults = [];
      return;
    }
    if (searchRef.current.searching) return;
    searchRef.current.searching = true;

    if (append) setLoadingMore(true); else setLoading(true);
    try {
      const params = new URLSearchParams();
      if (term) params.set('q', term);
      if (onSale) params.set('on_sale', 'true');
      params.set('limit', '40');
      params.set('page', String(pageNum));

      const res = await fetch(`/api/search?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const raw: SearchResult[] = Array.isArray(data) ? data : (data.products || []);
        const more = Array.isArray(data) ? false : !!data.hasMore;

        const allRaw = append ? [...searchRef.current.rawResults, ...raw] : raw;
        searchRef.current.rawResults = allRaw;

        setRawResults(allRaw);
        setHasMore(more);

        // Set price range on new search only
        if (!append) {
          const prices = allRaw.map(r => parseFloat(r.price) || 0).filter(p => p > 0);
          if (prices.length > 0) {
            setMinPrice(Math.floor(Math.min(...prices) / 5) * 5);
            setMaxPrice(Math.ceil(Math.max(...prices) / 5) * 5);
          }
        }
      }
    } catch {
      if (!append) { setRawResults([]); searchRef.current.rawResults = []; }
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setSearched(true);
      searchRef.current.searching = false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onSale]);

  // Initial search — runs once per searchTerm/onSale change
  useEffect(() => {
    if (searchTerm || onSale) {
      doSearch(searchTerm);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, onSale]);

  // Filtered + sorted results (derived from raw, no re-fetch needed)
  const filteredResults = useMemo(() => {
    let data = [...rawResults];
    const prices = rawResults.map(r => parseFloat(r.price) || 0).filter(p => p > 0);
    const dataMin = prices.length > 0 ? Math.floor(Math.min(...prices) / 5) * 5 : 0;
    const dataMax = prices.length > 0 ? Math.ceil(Math.max(...prices) / 5) * 5 : 999;

    // Only filter if user moved the sliders from the auto-set range
    if (minPrice > dataMin) data = data.filter(r => parseFloat(r.price) >= minPrice);
    if (maxPrice < dataMax) data = data.filter(r => parseFloat(r.price) <= maxPrice);

    if (orderBy === 'price-asc') data.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    else if (orderBy === 'price-desc') data.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    else if (orderBy === 'date') data.sort((a, b) => b.id - a.id);

    return data;
  }, [rawResults, minPrice, maxPrice, orderBy]);

  // Category handler — reset price on category change
  const handleCategory = useCallback((cat: string) => {
    setMinPrice(0);
    setMaxPrice(999);
    setPage(1);
    setQuery(cat === 'offerte' ? '' : cat);
    setTag('');
    setVendor('');
    setOnSale(cat === 'offerte');
  }, []);

  const activeCategory = onSale ? 'offerte' : query || tag || vendor || '';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* Toolbar row 1: category + offerte + ordina */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <select
          value={activeCategory}
          onChange={(e) => handleCategory(e.target.value)}
          className="h-8 px-3 rounded-lg border border-gray-200 text-[12px] font-semibold text-gray-700 bg-white focus:outline-none focus:border-[#005667] shrink-0"
        >
          <option value="">Cerca per categoria</option>
          {MACRO_CATEGORIES.map(mc => (
            <optgroup key={mc.label} label={mc.label}>
              <option value={mc.label}>Tutti {mc.label}</option>
              {mc.subs?.map(sub => <option key={sub} value={sub}>{sub}</option>)}
            </optgroup>
          ))}
        </select>

        <button onClick={() => handleCategory('offerte')} className={`h-8 px-3 rounded-lg text-[12px] font-semibold shrink-0 transition-all ${onSale ? 'bg-red-500 text-white' : 'bg-red-50 border border-red-200 text-red-600 hover:bg-red-500 hover:text-white'}`}>Offerte</button>

        <div className="w-px h-5 bg-gray-200 shrink-0" />

        <select value={orderBy} onChange={(e) => setOrderBy(e.target.value)} className="h-8 px-2 rounded-lg border border-gray-200 text-[11px] text-gray-600 bg-white focus:outline-none focus:border-[#005667] shrink-0">
          <option value="" disabled>ORDINA PER</option>
          {ORDINA_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <span className="text-[10px] text-gray-400 shrink-0 ml-auto">{filteredResults.length} prodotti</span>
      </div>

      {/* Toolbar row 2: price range full width */}
      <div className="flex items-center gap-2 mb-3">
        {(() => {
          const dynMax = Math.max(...rawResults.map(r => parseFloat(r.price) || 0), 10);
          const sliderMax = Math.ceil(dynMax / 5) * 5;
          return (
            <>
              <span className="text-[10px] font-semibold text-[#005667] shrink-0 w-7 text-right">{minPrice}€</span>
              <div className="relative h-5 flex-1 flex items-center">
                <input type="range" min={0} max={sliderMax} step={5} value={minPrice}
                  onChange={(e) => { const v = Number(e.target.value); if (v < maxPrice) setMinPrice(v); }}
                  className="absolute w-full h-1 bg-transparent appearance-none cursor-pointer z-20 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#005667] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-sm" />
                <input type="range" min={0} max={sliderMax} step={5} value={maxPrice}
                  onChange={(e) => { const v = Number(e.target.value); if (v > minPrice) setMaxPrice(v); }}
                  className="absolute w-full h-1 bg-transparent appearance-none cursor-pointer z-20 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#005667] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-sm" />
                <div className="absolute w-full h-1 bg-gray-200 rounded-full" />
                <div className="absolute h-1 bg-[#005667] rounded-full" style={{ left: `${(minPrice / sliderMax) * 100}%`, right: `${100 - (maxPrice / sliderMax) * 100}%` }} />
              </div>
              <span className="text-[10px] font-semibold text-[#005667] shrink-0">{maxPrice}€</span>
            </>
          );
        })()}
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
      {!loading && filteredResults.length > 0 && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {filteredResults.map(r => (
              <ProductCard key={r.id} product={toWCProduct(r)} />
            ))}
          </div>
          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center mt-6">
              <button
                onClick={() => {
                  const nextPage = page + 1;
                  setPage(nextPage);
                  doSearch(searchTerm, nextPage, true);
                }}
                disabled={loadingMore}
                className="px-8 py-3 border border-[#005667] text-[#005667] rounded-lg text-[13px] font-semibold hover:bg-[#005667] hover:text-white transition-colors disabled:opacity-50"
              >
                {loadingMore ? 'Caricamento...' : 'Carica altri prodotti'}
              </button>
            </div>
          )}
        </>
      )}

      {/* No results — show suggestions */}
      {!loading && searched && filteredResults.length === 0 && rawResults.length === 0 && (
        <div className="py-12">
          <div className="text-center mb-8">
            <svg className="w-10 h-10 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <p className="text-[15px] font-semibold text-gray-700">La ricerca non ha portato risultati</p>
            <p className="text-[13px] text-gray-500 mt-1">Ma ti consigliamo questi vini selezionati per te</p>
          </div>
          <NoResultsSuggestions />
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

/* ── Macro dropdown ────────────────────────────────────── */

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
