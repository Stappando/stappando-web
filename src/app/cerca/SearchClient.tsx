'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import SearchModal from '@/components/SearchModal';
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

const API_BASE = 'https://stappando.it/wp-json/wc/v3/products';
const API_AUTH = 'consumer_key=ck_e28bb3c3e86e007bad35911cffb20258a1343b53&consumer_secret=cs_9494a1fed3d4ed450ff53df9166078abb2388e44';

interface Props {
  initialProducts: WCProduct[];
  initialQuery: string;
  initialOnSale: boolean;
  categories: WCCategory[];
}

// Fetch all products in batches for client cache
async function fetchAllProducts(): Promise<WCProduct[]> {
  const all: WCProduct[] = [];
  const pages = [1, 2, 3, 4, 5]; // 5 pages x 100 = 500 products max
  const results = await Promise.all(
    pages.map(p =>
      fetch(`${API_BASE}?${API_AUTH}&per_page=100&status=publish&page=${p}`)
        .then(r => r.ok ? r.json() : [])
        .catch(() => [])
    )
  );
  results.forEach(r => all.push(...r));
  return all;
}

export default function SearchClient({ initialProducts, initialQuery, initialOnSale, categories }: Props) {
  const [allProducts, setAllProducts] = useState<WCProduct[]>(initialProducts);
  const [loaded, setLoaded] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>(initialQuery || (initialOnSale ? 'offerte' : ''));
  const [maxPrice, setMaxPrice] = useState(500);
  const [orderBy, setOrderBy] = useState('popularity');
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  // Load all products on mount for instant filtering
  useEffect(() => {
    fetchAllProducts().then(prods => {
      if (prods.length > 0) {
        setAllProducts(prods);
        setLoaded(true);
      }
    });
  }, []);

  // Sync from URL navigation (modal search) — only on first mount
  const mountedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      if (initialQuery) setActiveCategory(initialQuery);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Client-side filtering — instant
  const filtered = useMemo(() => {
    let result = [...allProducts];

    // Category/search filter
    if (activeCategory && activeCategory !== 'offerte') {
      const q = activeCategory.toLowerCase();
      // Determina se è una pill categoria (click) o ricerca libera (modal)
      const allCatNames = MACRO_CATEGORIES.flatMap(mc => [mc.label, ...(mc.subs || [])]).map(s => s.toLowerCase());
      const isCategoryPill = allCatNames.includes(q);

      if (isCategoryPill) {
        // SOLO categoria esatta — no nome, no descrizione
        result = result.filter(p => p.categories?.some(c => c.name.toLowerCase() === q));
      } else {
        // Ricerca libera — cerca ovunque
        result = result.filter(p => {
          const name = p.name.toLowerCase();
          const cats = p.categories?.map(c => c.name.toLowerCase()).join(' ') || '';
          const attrs = p.attributes?.map(a => a.options.join(' ').toLowerCase()).join(' ') || '';
          const desc = (p.short_description || '').toLowerCase();
          return name.includes(q) || cats.includes(q) || attrs.includes(q) || desc.includes(q);
        });
      }
    }

    // On sale
    if (activeCategory === 'offerte') {
      result = result.filter(p => p.on_sale);
    }

    // Price
    if (maxPrice < 500) {
      result = result.filter(p => parseFloat(p.price) <= maxPrice);
    }

    // Circuito always first
    const circuito = result.filter(p => p.tags?.some(t => t.id === 21993));
    const rest = result.filter(p => !p.tags?.some(t => t.id === 21993));

    // Sort
    if (orderBy === 'price-asc') rest.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    else if (orderBy === 'price-desc') rest.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    else if (orderBy === 'date') rest.sort((a, b) => b.id - a.id);

    return [...circuito, ...rest];
  }, [allProducts, activeCategory, maxPrice, orderBy]);

  const handleCategory = (cat: string) => {
    setActiveCategory(cat);
  };

  const pill = (label: string, active: boolean, onClick: () => void, variant: 'default' | 'red' = 'default') => (
    <button key={label} onClick={onClick} className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all ${
      active
        ? variant === 'red' ? 'bg-red-500 text-white' : 'bg-[#055667] text-white'
        : variant === 'red' ? 'bg-red-50 border border-red-200 text-red-600 hover:bg-red-500 hover:text-white' : 'bg-white border border-gray-200 text-gray-700 hover:border-[#055667]'
    }`}>{label}</button>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* TOOLBAR: Search + Categories + Price + Sort — tutto una riga */}
      <div className="flex items-center gap-2 mb-3 overflow-x-auto no-scrollbar pb-0.5">
        {/* Cerca */}
        <button onClick={() => setSearchModalOpen(true)} className="flex items-center gap-1.5 h-8 px-3 bg-[#055667] text-white rounded-lg text-xs font-bold hover:bg-[#044556] transition-colors shrink-0">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          Cerca
        </button>

        {/* Tutti */}
        <button onClick={() => handleCategory('')} className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all ${activeCategory === '' ? 'bg-[#055667] text-white' : 'bg-white border border-gray-200 text-gray-700 hover:border-[#055667]'}`}>Tutti</button>

        {/* Macro categorie inline con dropdown */}
        {MACRO_CATEGORIES.map(mc => (
          <MacroDropdown key={mc.label} mc={mc} activeCategory={activeCategory} onSelect={handleCategory} />
        ))}

        {/* Offerte */}
        <button onClick={() => handleCategory('offerte')} className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all ${activeCategory === 'offerte' ? 'bg-red-500 text-white' : 'bg-red-50 border border-red-200 text-red-600 hover:bg-red-500 hover:text-white'}`}>Offerte</button>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200 shrink-0 hidden sm:block" />

        {/* Prezzo */}
        <div className="hidden sm:flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] text-gray-500">max</span>
          <input type="range" min={5} max={500} step={5} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="w-16 h-1 bg-gray-200 rounded-full appearance-none cursor-pointer accent-[#055667]" />
          <span className="text-[10px] font-semibold text-[#055667] w-7">{maxPrice}€</span>
        </div>

        {/* Ordina */}
        <select value={orderBy} onChange={(e) => setOrderBy(e.target.value)} className="h-8 px-2 rounded-lg border border-gray-200 text-[11px] text-gray-700 bg-white focus:outline-none focus:border-[#055667] shrink-0">
          {ORDINA_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <SearchModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)} />

      {/* Mobile price */}
      <div className="sm:hidden flex items-center gap-2 mb-3">
        <span className="text-[10px] text-gray-500">max</span>
        <input type="range" min={5} max={500} step={5} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="flex-1 h-1 bg-gray-200 rounded-full appearance-none cursor-pointer accent-[#055667]" />
        <span className="text-[10px] font-semibold text-[#055667]">{maxPrice}€</span>
      </div>

      {/* Loading indicator for initial fetch */}
      {!loaded && (
        <div className="text-center py-2 mb-2">
          <span className="text-[10px] text-gray-400">Caricamento catalogo completo...</span>
        </div>
      )}

      {/* Results — instant */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <svg className="w-10 h-10 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <p className="text-sm font-semibold text-gray-700">Nessun prodotto trovato</p>
          <p className="text-xs text-gray-500 mt-1">Prova con altri filtri</p>
        </div>
      )}
    </div>
  );
}

/* ── Macro dropdown pill ── */
function MacroDropdown({ mc, activeCategory, onSelect }: { mc: { label: string; subs?: string[] }; activeCategory: string; onSelect: (c: string) => void }) {
  const [open, setOpen] = useState(false);
  const isActive = activeCategory === mc.label || mc.subs?.includes(activeCategory);

  if (!mc.subs) {
    return (
      <button onClick={() => onSelect(mc.label)} className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all ${isActive ? 'bg-[#055667] text-white' : 'bg-white border border-gray-200 text-gray-700 hover:border-[#055667]'}`}>
        {mc.label}
      </button>
    );
  }

  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${isActive ? 'bg-[#055667] text-white' : 'bg-white border border-gray-200 text-gray-700 hover:border-[#055667]'}`}
      >
        {mc.label}
        <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 bg-white rounded-lg border border-gray-200 shadow-xl z-30 py-1 min-w-[160px]">
            <button onClick={() => { onSelect(mc.label); setOpen(false); }} className={`block w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-gray-50 ${activeCategory === mc.label ? 'text-[#055667]' : 'text-gray-700'}`}>Tutti {mc.label}</button>
            <div className="h-px bg-gray-100 mx-3" />
            {mc.subs.map(sub => (
              <button key={sub} onClick={() => { onSelect(sub); setOpen(false); }} className={`block w-full text-left px-4 py-2.5 text-xs hover:bg-gray-50 ${activeCategory === sub ? 'font-bold text-[#055667]' : 'text-gray-600'}`}>{sub}</button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
