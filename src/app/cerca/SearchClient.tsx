'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import SearchModal from '@/components/SearchModal';
import { useRouter } from 'next/navigation';
import { type WCProduct, type WCCategory, decodeHtml, formatPrice } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
// Image and Link kept for potential future use

const MACRO_CATEGORIES: { label: string; subs?: string[] }[] = [
  { label: 'Vini Rossi' },
  { label: 'Vini Bianchi' },
  { label: 'Rosati' },
  { label: 'Spumanti', subs: ['Prosecco', 'Franciacorta', 'Trento DOC', 'Alta Langa', 'Metodo Classico'] },
  { label: 'Champagne' },
  { label: 'Distillati' },
  { label: 'Birre' },
  { label: 'Aperitivi' },
];
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
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const suggestRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-fetch when navigating from modal
  useEffect(() => {
    if (initialQuery && initialQuery !== activeCategory) {
      setActiveCategory(initialQuery);
      setQuery(initialQuery);
    }
  }, [initialQuery]); // eslint-disable-line react-hooks/exhaustive-deps

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
      if (res.ok) {
        const data: WCProduct[] = await res.json();
        // Circuito (tag 21993) sempre primi
        const circuito = data.filter(p => p.tags?.some(t => t.id === 21993));
        const rest = data.filter(p => !p.tags?.some(t => t.id === 21993));
        setProducts([...circuito, ...rest]);
      }
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
    }, 200);
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
      {/* ROW 1: Search input + Cerca button + Price + Sort */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center flex-1 sm:flex-none sm:w-64 h-9 bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="flex items-center flex-1 px-3 gap-2">
            <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <span className="text-xs text-gray-500 truncate">{activeCategory && activeCategory !== 'offerte' ? activeCategory : 'Cerca vini...'}</span>
          </div>
          <button onClick={() => setSearchModalOpen(true)} className="h-full px-3 bg-[#055667] text-white text-xs font-bold hover:bg-[#044556] transition-colors shrink-0">Cerca</button>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2 h-9">
          <span className="text-[10px] text-gray-500 shrink-0">max</span>
          <input type="range" min={5} max={500} step={5} value={maxPrice} onChange={(e) => handlePriceChange('max', Number(e.target.value))} className="w-20 h-1 bg-gray-200 rounded-full appearance-none cursor-pointer accent-[#055667]" />
          <span className="text-[10px] font-semibold text-[#055667] w-8 shrink-0">{maxPrice}€</span>
        </div>
        <select value={orderBy} onChange={(e) => handleOrder(e.target.value)} className="h-9 px-2 rounded-lg border border-gray-200 text-[11px] text-gray-700 bg-white focus:outline-none focus:border-[#055667] shrink-0">
          {ORDINA_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <SearchModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)} />

      {/* ROW 2: Macrocategorie con dropdown */}
      <CategoriesBar categories={categories} activeCategory={activeCategory} onSelect={handleCategory} />

      {/* Count */}
      <p className="text-[10px] text-gray-400 mb-2">{products.length} prodotti</p>

      {/* Results */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-8 h-8 border-2 border-[#055667]/20 border-t-[#055667] rounded-full animate-spin" />
          <p className="text-xs text-gray-400">Caricamento prodotti...</p>
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

/* ── Categories Bar with dropdowns ── */
function CategoriesBar({ categories, activeCategory, onSelect }: { categories: WCCategory[]; activeCategory: string; onSelect: (c: string) => void }) {
  const [openDrop, setOpenDrop] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar mb-3 pb-0.5 relative">
      <button onClick={() => onSelect('')} className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all ${activeCategory === '' ? 'bg-[#055667] text-white' : 'bg-white border border-gray-200 text-gray-700 hover:border-[#055667]'}`}>Tutti</button>

      {MACRO_CATEGORIES.map(mc => (
        <div key={mc.label} className="relative shrink-0">
          {mc.subs ? (
            <>
              <button
                onClick={() => setOpenDrop(openDrop === mc.label ? null : mc.label)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeCategory === mc.label || mc.subs.includes(activeCategory) ? 'bg-[#055667] text-white' : 'bg-white border border-gray-200 text-gray-700 hover:border-[#055667]'
                }`}
              >
                {mc.label}
                <svg className={`w-3 h-3 transition-transform ${openDrop === mc.label ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              {openDrop === mc.label && (
                <div className="absolute top-full left-0 mt-1 bg-white rounded-lg border border-gray-200 shadow-lg z-30 py-1 min-w-[140px]">
                  <button onClick={() => { onSelect(mc.label); setOpenDrop(null); }} className="block w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">Tutti {mc.label}</button>
                  {mc.subs.map(sub => (
                    <button key={sub} onClick={() => { onSelect(sub); setOpenDrop(null); }} className={`block w-full text-left px-3 py-2 text-xs hover:bg-gray-50 ${activeCategory === sub ? 'font-bold text-[#055667]' : 'text-gray-600'}`}>{sub}</button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <button onClick={() => onSelect(mc.label)} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${activeCategory === mc.label ? 'bg-[#055667] text-white' : 'bg-white border border-gray-200 text-gray-700 hover:border-[#055667]'}`}>
              {mc.label}
            </button>
          )}
        </div>
      ))}

      <button onClick={() => onSelect('offerte')} className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all ${activeCategory === 'offerte' ? 'bg-red-500 text-white' : 'bg-red-50 border border-red-200 text-red-600 hover:bg-red-500 hover:text-white'}`}>Offerte</button>
    </div>
  );
}
