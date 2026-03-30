'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { type WCProduct, type WCCategory, decodeHtml } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import { useAnalyticsStore } from '@/store/analytics';

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
  producer: string;
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
      ...(r.producer ? [{ id: 0, name: 'Produttore', options: [r.producer] }] : []),
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
    fetch('/api/search?per_page=8&tag=circuito')
      .then(r => r.ok ? r.json() : { products: [] })
      .then(data => {
        const products = (data.products || []).map(toWCProduct);
        if (products.length > 0) {
          setSuggestions(products);
        } else {
          fetch('/api/search?per_page=8&sort=popularity')
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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {suggestions.map(p => <ProductCard key={p.id} product={p} />)}
    </div>
  );
}

/* ── Skeleton Grid ──────────────────────────────────────── */

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg border border-gray-100 overflow-hidden animate-pulse">
          <div className="aspect-square bg-gray-100" />
          <div className="p-3 space-y-2">
            <div className="h-2.5 bg-gray-100 rounded w-16" />
            <div className="h-3 bg-gray-100 rounded w-full" />
            <div className="h-3 bg-gray-100 rounded w-3/4" />
            <div className="h-4 bg-gray-100 rounded w-14 mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────── */

interface Props {
  initialQuery: string;
  initialOnSale: boolean;
  initialTag: string;
  initialVendor: string;
  initialMaxPrice: string;
  initialSort?: string;
  initialResults?: unknown[];
  initialTotal?: number;
  initialHasMore?: boolean;
  categories: WCCategory[];
}

export default function SearchClient({ initialQuery, initialOnSale, initialTag, initialVendor, initialMaxPrice, initialSort, initialResults, initialTotal, initialHasMore, categories }: Props) {
  // Parse initial results from server
  const ssrResults = (initialResults || []) as SearchResult[];

  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState(initialQuery);
  const [tag, setTag] = useState(initialTag);
  const [vendor, setVendor] = useState(initialVendor);
  const [onSale, setOnSale] = useState(initialOnSale);
  const [orderBy, setOrderBy] = useState(initialSort || 'popularity');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(() => {
    const prices = ssrResults.map(r => parseFloat(r.price) || 0).filter(p => p > 0);
    return prices.length > 0 ? Math.ceil(Math.max(...prices) / 2) * 2 : 999;
  });
  const [priceMax, setPriceMax] = useState(() => {
    const prices = ssrResults.map(r => parseFloat(r.price) || 0).filter(p => p > 0);
    return prices.length > 0 ? Math.ceil(Math.max(...prices) / 2) * 2 : 999;
  });
  const [results, setResults] = useState<SearchResult[]>(ssrResults);
  const [searched, setSearched] = useState(ssrResults.length > 0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(!!initialHasMore);
  const [loadingMore, setLoadingMore] = useState(false);
  const [total, setTotal] = useState(initialTotal || ssrResults.length);
  const priceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch results from API
  const fetchResults = useCallback(async (opts: {
    q: string; tagVal: string; vendorVal: string; onSaleVal: boolean;
    sort: string; maxP: string; minP: number; pageNum: number; append: boolean;
  }) => {
    const params = new URLSearchParams();
    if (opts.q && !opts.tagVal) params.set('q', opts.q);
    if (opts.tagVal) params.set('tag', opts.tagVal);
    if (opts.vendorVal && !opts.q && !opts.tagVal) params.set('q', opts.vendorVal);
    if (opts.onSaleVal) params.set('on_sale', 'true');
    if (opts.sort && opts.sort !== 'popularity') params.set('sort', opts.sort);
    if (opts.maxP) params.set('max_price', opts.maxP);
    if (opts.minP > 0) params.set('min_price', String(opts.minP));
    params.set('per_page', '24');
    params.set('page', String(opts.pageNum));

    if (opts.append) setLoadingMore(true); else setLoading(true);

    try {
      const url = `/api/search?${params.toString()}`;
      console.log('[Search] fetching:', url);
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const raw: SearchResult[] = data.products || [];
        console.log('[Search] got', raw.length, 'products');

        if (opts.append) {
          setResults(prev => [...prev, ...raw]);
        } else {
          setResults(raw);
          const prices = raw.map((r: SearchResult) => parseFloat(r.price) || 0).filter((p: number) => p > 0);
          if (prices.length > 0) {
            const dynMax = Math.ceil(Math.max(...prices) / 2) * 2;
            setPriceMax(dynMax);
            setMaxPrice(dynMax);
          }
        }
        setHasMore(!!data.hasMore);
        setTotal(data.total || raw.length);

        if (!opts.append) {
          const term = opts.q || opts.tagVal || opts.vendorVal || '';
          if (term) useAnalyticsStore.getState().trackSearch(term, raw.length);
        }
      }
    } catch (e) {
      console.error('[Search] error:', e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setSearched(true);
    }
  }, []);

  // Track if user changed filters (vs initial load)
  const [userChangedFilters, setUserChangedFilters] = useState(false);

  // Only fetch when user changes filters — SSR handles initial load
  useEffect(() => {
    if (!userChangedFilters) return;
    setPage(1);
    fetchResults({
      q: query, tagVal: tag, vendorVal: vendor, onSaleVal: onSale,
      sort: orderBy, maxP: initialMaxPrice, minP: minPrice, pageNum: 1, append: false,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, tag, vendor, onSale, orderBy, initialMaxPrice, userChangedFilters]);

  // If no SSR results (e.g. client navigation), fetch on mount
  useEffect(() => {
    if (ssrResults.length === 0) {
      const term = initialQuery || initialTag || initialVendor || '';
      if (term || initialMaxPrice) {
        fetchResults({
          q: initialQuery, tagVal: initialTag, vendorVal: initialVendor, onSaleVal: initialOnSale,
          sort: initialSort || 'popularity', maxP: initialMaxPrice, minP: 0, pageNum: 1, append: false,
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync state when URL props change (client-side navigation between search pages)
  const prevPropsRef = useRef({ q: initialQuery, tag: initialTag, vendor: initialVendor, onSale: initialOnSale, maxPrice: initialMaxPrice });
  useEffect(() => {
    const prev = prevPropsRef.current;
    const changed = prev.q !== initialQuery || prev.tag !== initialTag || prev.vendor !== initialVendor || prev.onSale !== initialOnSale || prev.maxPrice !== initialMaxPrice;
    if (!changed) return;
    prevPropsRef.current = { q: initialQuery, tag: initialTag, vendor: initialVendor, onSale: initialOnSale, maxPrice: initialMaxPrice };

    // Reset all filters to new URL params
    setQuery(initialQuery);
    setTag(initialTag);
    setVendor(initialVendor);
    setOnSale(initialOnSale);
    setMinPrice(0);
    setMaxPrice(999);
    setPriceMax(999);
    setPage(1);
    setOrderBy(initialSort || 'popularity');
    setUserChangedFilters(false);

    // Use SSR results if available
    if (ssrResults.length > 0) {
      setResults(ssrResults);
      setTotal(initialTotal || ssrResults.length);
      setHasMore(!!initialHasMore);
      setSearched(true);
      const prices = ssrResults.map(r => parseFloat(r.price) || 0).filter(p => p > 0);
      if (prices.length > 0) {
        const dynMax = Math.ceil(Math.max(...prices) / 2) * 2;
        setPriceMax(dynMax);
        setMaxPrice(dynMax);
      }
    } else {
      // Client-side navigation without SSR results — fetch
      fetchResults({
        q: initialQuery, tagVal: initialTag, vendorVal: initialVendor, onSaleVal: initialOnSale,
        sort: initialSort || 'popularity', maxP: initialMaxPrice, minP: 0, pageNum: 1, append: false,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery, initialTag, initialVendor, initialOnSale, initialMaxPrice]);

  // Debounced price filter
  const handlePriceChange = useCallback((type: 'min' | 'max', value: number) => {
    if (type === 'min') setMinPrice(value);
    else setMaxPrice(value);
  }, []);

  // Debounce price changes
  useEffect(() => {
    if (priceTimerRef.current) clearTimeout(priceTimerRef.current);
    priceTimerRef.current = setTimeout(() => {
      if (minPrice > 0 || maxPrice < priceMax) {
        setPage(1);
        fetchResults({
          q: query, tagVal: tag, vendorVal: vendor, onSaleVal: onSale,
          sort: orderBy, maxP: maxPrice < priceMax ? String(maxPrice) : initialMaxPrice, minP: minPrice, pageNum: 1, append: false,
        });
      }
    }, 600);
    return () => { if (priceTimerRef.current) clearTimeout(priceTimerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minPrice, maxPrice]);

  // Category change
  const handleCategory = useCallback((cat: string) => {
    setUserChangedFilters(true);
    setMinPrice(0);
    setMaxPrice(999);
    setPriceMax(999);
    setPage(1);
    setQuery(cat);
    setTag('');
    setVendor('');
  }, []);

  // Toggle offerte
  const handleOfferte = useCallback(() => {
    setUserChangedFilters(true);
    setOnSale(prev => !prev);
    setPage(1);
  }, []);

  const activeCategory = query || tag || vendor || '';
  const sliderMax = initialMaxPrice ? parseInt(initialMaxPrice) : priceMax;

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

        <button onClick={handleOfferte} className={`h-8 px-3 rounded-lg text-[12px] font-semibold shrink-0 transition-all ${onSale ? 'bg-red-500 text-white' : 'bg-white border border-red-200 text-red-500 hover:bg-red-500 hover:text-white'}`}>
          {onSale ? '✕ In offerta' : 'In offerta'}
        </button>

        <div className="w-px h-5 bg-gray-200 shrink-0" />

        <select value={orderBy} onChange={(e) => { setUserChangedFilters(true); setOrderBy(e.target.value); }} className="h-8 px-2 rounded-lg border border-gray-200 text-[11px] text-gray-600 bg-white focus:outline-none focus:border-[#005667] shrink-0">
          <option value="" disabled>ORDINA PER</option>
          {ORDINA_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <span className="text-[10px] text-gray-400 shrink-0 ml-auto">{total > 0 ? `${total} prodotti` : ''}</span>
      </div>

      {/* Toolbar row 2: price range full width */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-semibold text-[#005667] shrink-0 w-7 text-right">{minPrice}€</span>
        <div className="relative h-5 flex-1 flex items-center">
          <input type="range" min={0} max={sliderMax} step={2} value={minPrice}
            onChange={(e) => { const v = Number(e.target.value); if (v < maxPrice) handlePriceChange('min', v); }}
            className="absolute w-full h-1 bg-transparent appearance-none cursor-pointer z-20 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#005667] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-sm" />
          <input type="range" min={0} max={sliderMax} step={2} value={maxPrice > sliderMax ? sliderMax : maxPrice}
            onChange={(e) => { const v = Number(e.target.value); if (v > minPrice) handlePriceChange('max', v); }}
            className="absolute w-full h-1 bg-transparent appearance-none cursor-pointer z-20 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#005667] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-sm" />
          <div className="absolute w-full h-1 bg-gray-200 rounded-full" />
          <div className="absolute h-1 bg-[#005667] rounded-full" style={{ left: `${(minPrice / sliderMax) * 100}%`, right: `${100 - ((maxPrice > sliderMax ? sliderMax : maxPrice) / sliderMax) * 100}%` }} />
        </div>
        <span className="text-[10px] font-semibold text-[#005667] shrink-0">{maxPrice > sliderMax ? sliderMax : maxPrice}€</span>
      </div>

      {/* Active filter chips */}
      {(onSale || tag || vendor) && (
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {onSale && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-600 text-[11px] font-medium">
              Solo offerte
              <button onClick={handleOfferte} className="ml-1 hover:text-red-800">✕</button>
            </span>
          )}
          {(tag || vendor) && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#005667]/10 text-[#005667] text-[11px] font-semibold">
              {tag || vendor}
              <button onClick={() => { setTag(''); setVendor(''); setQuery(''); }} className="ml-1 hover:text-[#003d4d]">✕</button>
            </span>
          )}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && <SkeletonGrid />}

      {/* Results grid */}
      {!loading && results.length > 0 && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {results.map(r => (
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
                  fetchResults({
                    q: query, tagVal: tag, vendorVal: vendor, onSaleVal: onSale,
                    sort: orderBy, maxP: initialMaxPrice, minP: minPrice, pageNum: nextPage, append: true,
                  });
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
      {!loading && searched && results.length === 0 && (
        <div className="py-12">
          <div className="text-center mb-8">
            <svg className="w-10 h-10 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <p className="text-[15px] font-semibold text-gray-700">La ricerca non ha portato risultati</p>
            <p className="text-[13px] text-gray-500 mt-1">Ma ti consigliamo questi vini selezionati per te</p>
          </div>
          <NoResultsSuggestions />
        </div>
      )}
    </div>
  );
}
