'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { type WCProduct, type WCCategory, decodeHtml, formatPrice } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import Image from 'next/image';
import Link from 'next/link';

const SPUMANTI_SUB = ['Prosecco', 'Franciacorta', 'Trento DOC', 'Alta Langa', 'Metodo Classico'];
const ORDINA_OPTIONS = [
  { label: 'Più popolari', value: 'popularity' },
  { label: 'Novità', value: 'date' },
  { label: 'Prezzo: basso → alto', value: 'price-asc' },
  { label: 'Prezzo: alto → basso', value: 'price-desc' },
  { label: 'Valutazione', value: 'rating' },
];

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
  const [orderBy, setOrderBy] = useState('popularity');
  const [suggestions, setSuggestions] = useState<WCProduct[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const suggestRef = useRef<NodeJS.Timeout | null>(null);

  const fetchProducts = useCallback(async (search: string, onSale = false, pMin?: number, pMax?: number, order?: string) => {
    setLoading(true);
    try {
      const apiUrl = new URL('https://stappando.it/wp-json/wc/v3/products');
      apiUrl.searchParams.set('consumer_key', 'ck_e28bb3c3e86e007bad35911cffb20258a1343b53');
      apiUrl.searchParams.set('consumer_secret', 'cs_9494a1fed3d4ed450ff53df9166078abb2388e44');
      apiUrl.searchParams.set('per_page', '40');
      apiUrl.searchParams.set('status', 'publish');
      const ob = order || orderBy;
      if (ob === 'price-asc') { apiUrl.searchParams.set('orderby', 'price'); apiUrl.searchParams.set('order', 'asc'); }
      else if (ob === 'price-desc') { apiUrl.searchParams.set('orderby', 'price'); apiUrl.searchParams.set('order', 'desc'); }
      else { apiUrl.searchParams.set('orderby', ob); }
      if (search) apiUrl.searchParams.set('search', search);
      if (onSale) apiUrl.searchParams.set('on_sale', 'true');
      if (pMin && pMin > 0) apiUrl.searchParams.set('min_price', String(pMin));
      if (pMax && pMax < 500) apiUrl.searchParams.set('max_price', String(pMax));
      const res = await fetch(apiUrl.toString());
      if (res.ok) setProducts(await res.json());
    } catch { /* */ }
    finally { setLoading(false); }
  }, [orderBy]);

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
    setShowSuggestions(false);
    if (q) {
      setActiveCategory(q);
      fetchProducts(q, false, minPrice, maxPrice);
      router.push(`/cerca?q=${encodeURIComponent(q)}`, { scroll: false });
    }
  };

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (suggestRef.current) clearTimeout(suggestRef.current);
    if (val.trim().length >= 2) {
      suggestRef.current = setTimeout(async () => {
        try {
          const url = `https://stappando.it/wp-json/wc/v3/products?consumer_key=ck_e28bb3c3e86e007bad35911cffb20258a1343b53&consumer_secret=cs_9494a1fed3d4ed450ff53df9166078abb2388e44&search=${encodeURIComponent(val)}&per_page=5&status=publish`;
          const res = await fetch(url);
          if (res.ok) { const data: WCProduct[] = await res.json(); setSuggestions(data); setShowSuggestions(data.length > 0); }
        } catch { /* */ }
      }, 300);
    } else { setSuggestions([]); setShowSuggestions(false); }
  };

  const handlePriceChange = (type: 'min' | 'max', val: number) => {
    if (type === 'min') setMinPrice(val); else setMaxPrice(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchProducts(activeCategory === 'offerte' ? '' : activeCategory, activeCategory === 'offerte', type === 'min' ? val : minPrice, type === 'max' ? val : maxPrice);
    }, 500);
  };

  const handleOrder = (val: string) => {
    setOrderBy(val);
    fetchProducts(activeCategory === 'offerte' ? '' : activeCategory, activeCategory === 'offerte', minPrice, maxPrice, val);
  };

  const pill = (label: string, active: boolean, onClick: () => void, variant: 'default' | 'red' = 'default') => (
    <button key={label} onClick={onClick} className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
      active
        ? variant === 'red' ? 'bg-red-500 text-white' : 'bg-[#055667] text-white'
        : variant === 'red' ? 'bg-red-50 border border-red-200 text-red-600 hover:bg-red-500 hover:text-white hover:border-red-500' : 'bg-white border border-gray-200 text-gray-700 hover:border-[#055667] hover:text-[#055667]'
    }`}>{label}</button>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-2xl font-extrabold text-gray-900 mb-4">Shop</h1>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="mb-5 relative">
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="search" value={query} onChange={(e) => handleQueryChange(e.target.value)} onFocus={() => suggestions.length > 0 && setShowSuggestions(true)} onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} placeholder="Cerca per nome, cantina, vitigno, regione..." className="w-full h-12 pl-12 pr-24 rounded-xl bg-white border border-gray-200 text-sm focus:outline-none focus:border-[#055667] focus:ring-2 focus:ring-[#055667]/20" />
          <button type="submit" className="absolute right-1.5 top-1/2 -translate-y-1/2 px-5 py-2 bg-[#055667] text-white rounded-lg text-xs font-bold hover:bg-[#044556] transition-colors">Cerca</button>
        </div>
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg z-20 overflow-hidden">
            {suggestions.map(s => (
              <Link key={s.id} href={`/prodotto/${s.slug}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors" onClick={() => setShowSuggestions(false)}>
                <div className="relative w-8 h-8 rounded bg-gray-50 shrink-0 overflow-hidden">
                  {s.images[0]?.src && <Image src={s.images[0].src} alt="" width={32} height={32} className="object-contain" />}
                </div>
                <p className="text-sm text-gray-800 truncate flex-1">{decodeHtml(s.name)}</p>
                <span className="text-sm font-bold text-[#055667] shrink-0">{formatPrice(s.price)} €</span>
              </Link>
            ))}
          </div>
        )}
      </form>

      {/* Category pills */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {pill('Tutti', activeCategory === '', () => handleCategory(''))}
        {categories.filter(c => c.slug !== 'uncategorized').map(cat =>
          pill(decodeHtml(cat.name), activeCategory === cat.name, () => handleCategory(cat.name))
        )}
      </div>

      {/* Spumanti subcategories */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {SPUMANTI_SUB.map(s => pill(s, activeCategory === s, () => handleCategory(s)))}
        {['Champagne', 'Distillati', 'Birre', 'Aperitivi', 'Cocktail'].map(s => pill(s, activeCategory === s, () => handleCategory(s)))}
        {pill('Offerte', activeCategory === 'offerte', () => handleCategory('offerte'), 'red')}
      </div>

      {/* Filters + Sort row */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          {/* Price */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Prezzo</h3>
              <span className="text-[11px] text-gray-500">{minPrice}€ — {maxPrice === 500 ? '500+' : maxPrice + '€'}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-gray-400">0€</span>
              <div className="flex-1 space-y-1.5">
                <input type="range" min={0} max={500} step={5} value={minPrice} onChange={(e) => handlePriceChange('min', Number(e.target.value))} className="w-full h-1 bg-gray-200 rounded-full appearance-none cursor-pointer accent-[#055667]" />
                <input type="range" min={0} max={500} step={5} value={maxPrice} onChange={(e) => handlePriceChange('max', Number(e.target.value))} className="w-full h-1 bg-gray-200 rounded-full appearance-none cursor-pointer accent-[#b8973f]" />
              </div>
              <span className="text-[10px] text-gray-400">500€</span>
            </div>
          </div>

          {/* Denominazione */}
          <div>
            <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Denominazione</h3>
            <div className="flex gap-1.5">
              {['DOCG', 'DOC', 'IGT', 'IGP'].map(d => (
                <button key={d} onClick={() => handleCategory(d)} className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${activeCategory === d ? 'bg-[#055667] text-white' : 'bg-gray-50 border border-gray-200 text-gray-600 hover:border-[#055667]'}`}>{d}</button>
              ))}
            </div>
          </div>

          {/* Ordina per */}
          <div>
            <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Ordina per</h3>
            <select value={orderBy} onChange={(e) => handleOrder(e.target.value)} className="h-8 px-3 rounded-lg border border-gray-200 text-xs text-gray-700 bg-white focus:outline-none focus:border-[#055667]">
              {ORDINA_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Count */}
      <p className="text-xs text-gray-400 mb-3">{products.length} prodotti</p>

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
