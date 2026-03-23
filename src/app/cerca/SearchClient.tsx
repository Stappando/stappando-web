'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { type WCProduct, type WCCategory, decodeHtml } from '@/lib/api';
import ProductCard from '@/components/ProductCard';

const CATEGORIE_EXTRA = ['Champagne', 'Distillati', 'Birre', 'Aperitivi', 'Cocktail'];

interface Props {
  initialProducts: WCProduct[];
  initialQuery: string;
  initialOnSale: boolean;
  categories: WCCategory[];
}

export default function SearchClient({ initialProducts, initialQuery, initialOnSale, categories }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [products, setProducts] = useState(initialProducts);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>(initialQuery || (initialOnSale ? 'offerte' : ''));
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(500);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchProducts = useCallback(async (search: string, onSale = false, pMin?: number, pMax?: number) => {
    setLoading(true);
    try {
      const apiUrl = new URL('https://stappando.it/wp-json/wc/v3/products');
      apiUrl.searchParams.set('consumer_key', 'ck_e28bb3c3e86e007bad35911cffb20258a1343b53');
      apiUrl.searchParams.set('consumer_secret', 'cs_9494a1fed3d4ed450ff53df9166078abb2388e44');
      apiUrl.searchParams.set('per_page', '40');
      apiUrl.searchParams.set('status', 'publish');
      apiUrl.searchParams.set('orderby', 'popularity');
      if (search) apiUrl.searchParams.set('search', search);
      if (onSale) apiUrl.searchParams.set('on_sale', 'true');
      if (pMin && pMin > 0) apiUrl.searchParams.set('min_price', String(pMin));
      if (pMax && pMax < 500) apiUrl.searchParams.set('max_price', String(pMax));

      const res = await fetch(apiUrl.toString());
      if (res.ok) {
        setProducts(await res.json());
      }
    } catch { /* keep */ }
    finally { setLoading(false); }
  }, []);

  const handleCategory = (cat: string) => {
    setActiveCategory(cat);
    setQuery(cat === 'offerte' ? '' : cat);
    if (cat === 'offerte') {
      fetchProducts('', true, minPrice, maxPrice);
      router.push('/cerca?on_sale=true', { scroll: false });
    } else if (cat === '') {
      fetchProducts('', false, minPrice, maxPrice);
      router.push('/cerca', { scroll: false });
    } else {
      fetchProducts(cat, false, minPrice, maxPrice);
      router.push(`/cerca?q=${encodeURIComponent(cat)}`, { scroll: false });
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      setActiveCategory(q);
      fetchProducts(q, false, minPrice, maxPrice);
      router.push(`/cerca?q=${encodeURIComponent(q)}`, { scroll: false });
    }
  };

  const handlePriceChange = (type: 'min' | 'max', val: number) => {
    if (type === 'min') setMinPrice(val);
    else setMaxPrice(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const pMin = type === 'min' ? val : minPrice;
      const pMax = type === 'max' ? val : maxPrice;
      fetchProducts(activeCategory === 'offerte' ? '' : activeCategory, activeCategory === 'offerte', pMin, pMax);
    }, 500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Title */}
      <h1 className="text-2xl font-extrabold text-gray-900 mb-4">Shop</h1>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="mb-5">
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cerca per nome, cantina, vitigno, regione..."
            className="w-full h-12 pl-12 pr-24 rounded-xl bg-white border border-gray-200 text-sm focus:outline-none focus:border-[#055667] focus:ring-2 focus:ring-[#055667]/20"
          />
          <button type="submit" className="absolute right-1.5 top-1/2 -translate-y-1/2 px-5 py-2 bg-[#055667] text-white rounded-lg text-xs font-bold hover:bg-[#044556] transition-colors">
            Cerca
          </button>
        </div>
      </form>

      {/* Category pills — sempre visibili */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => handleCategory('')} className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${activeCategory === '' ? 'bg-[#055667] text-white' : 'bg-white border border-gray-200 text-gray-700 hover:border-[#055667] hover:text-[#055667]'}`}>
          Tutti
        </button>
        {categories.filter(c => c.slug !== 'uncategorized').map(cat => (
          <button key={cat.id} onClick={() => handleCategory(cat.name)} className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${activeCategory === cat.name ? 'bg-[#055667] text-white' : 'bg-white border border-gray-200 text-gray-700 hover:border-[#055667] hover:text-[#055667]'}`}>
            {decodeHtml(cat.name)}
          </button>
        ))}
        {CATEGORIE_EXTRA.map(cat => (
          <button key={cat} onClick={() => handleCategory(cat)} className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${activeCategory === cat ? 'bg-[#055667] text-white' : 'bg-white border border-gray-200 text-gray-700 hover:border-[#055667] hover:text-[#055667]'}`}>
            {cat}
          </button>
        ))}
        <button onClick={() => handleCategory('offerte')} className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${activeCategory === 'offerte' ? 'bg-red-500 text-white' : 'bg-red-50 border border-red-200 text-red-600 hover:bg-red-500 hover:text-white hover:border-red-500'}`}>
          Offerte
        </button>
      </div>

      {/* Advanced filters toggle */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-[#055667] transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
          {showAdvanced ? 'Nascondi filtri' : 'Altri filtri'}
        </button>
        <p className="text-xs text-gray-400">{products.length} prodotti</p>
      </div>

      {/* Advanced filters */}
      {showAdvanced && (
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-5 space-y-4">
          {/* Price range slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Prezzo</h3>
              <span className="text-xs text-gray-500">{minPrice}€ — {maxPrice === 500 ? '500+' : maxPrice}€</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[10px] text-gray-400 w-6">0€</span>
              <div className="flex-1 space-y-2">
                <input
                  type="range"
                  min={0}
                  max={500}
                  step={5}
                  value={minPrice}
                  onChange={(e) => handlePriceChange('min', Number(e.target.value))}
                  className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-[#055667]"
                />
                <input
                  type="range"
                  min={0}
                  max={500}
                  step={5}
                  value={maxPrice}
                  onChange={(e) => handlePriceChange('max', Number(e.target.value))}
                  className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-[#b8973f]"
                />
              </div>
              <span className="text-[10px] text-gray-400 w-8">500€</span>
            </div>
          </div>

          {/* Denominazione */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Denominazione</h3>
            <div className="flex flex-wrap gap-2">
              {['DOCG', 'DOC', 'IGT', 'IGP'].map(d => (
                <button key={d} onClick={() => handleCategory(d)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${activeCategory === d ? 'bg-[#055667] text-white' : 'bg-gray-50 border border-gray-200 text-gray-600 hover:border-[#055667]'}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#055667]/20 border-t-[#055667] rounded-full animate-spin" />
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <p className="text-base font-semibold text-gray-700">Nessun prodotto trovato</p>
          <p className="text-sm text-gray-500 mt-1">Prova con altri filtri</p>
        </div>
      )}
    </div>
  );
}
