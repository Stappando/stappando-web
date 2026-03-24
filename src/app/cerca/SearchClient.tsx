'use client';

import { useState, useEffect, useMemo } from 'react';
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
const ALL_CAT_NAMES = MACRO_CATEGORIES.flatMap(mc => [mc.label, ...(mc.subs || [])]).map(s => s.toLowerCase());
const ORDINA_OPTIONS = [
  { label: 'Più popolari', value: 'popularity' },
  { label: 'Novità', value: 'date' },
  { label: 'Prezzo ↑', value: 'price-asc' },
  { label: 'Prezzo ↓', value: 'price-desc' },
];

interface Props {
  initialQuery: string;
  initialOnSale: boolean;
  initialTag: string;
  initialVendor: string;
  categories: WCCategory[];
}

// Global cache — loaded once
let _cachedProducts: WCProduct[] | null = null;

export default function SearchClient({ initialQuery, initialOnSale, initialTag, initialVendor, categories }: Props) {
  const [allProducts, setAllProducts] = useState<WCProduct[]>(_cachedProducts || []);
  const [ready, setReady] = useState(!!_cachedProducts);
  const [activeCategory, setActiveCategory] = useState<string>(
    initialQuery || (initialOnSale ? 'offerte' : ''),
  );
  const [activeTag, setActiveTag] = useState(initialTag);
  const [activeVendor, setActiveVendor] = useState(initialVendor);
  const [maxPrice, setMaxPrice] = useState(500);
  const [orderBy, setOrderBy] = useState('popularity');
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  // Load products.json — static file, CDN cached, ~1MB, loads in <500ms
  useEffect(() => {
    if (_cachedProducts) { setReady(true); return; }
    fetch('/products.json')
      .then(r => r.json())
      .then((data: WCProduct[]) => {
        _cachedProducts = data;
        setAllProducts(data);
        setReady(true);
      })
      .catch(() => setReady(true));
  }, []);

  // Sync from URL
  useEffect(() => {
    if (initialQuery) setActiveCategory(initialQuery);
    else if (initialOnSale) setActiveCategory('offerte');
    setActiveTag(initialTag);
    setActiveVendor(initialVendor);
  }, [initialQuery, initialOnSale, initialTag, initialVendor]);

  // INSTANT filtering — no API calls
  const filtered = useMemo(() => {
    if (!ready) return [];
    let result = [...allProducts];

    // Filter by tag slug (occasione, best-seller, regali)
    if (activeTag) {
      const tagSlug = activeTag.toLowerCase();
      result = result.filter(p =>
        p.tags?.some(t => t.slug === tagSlug || t.name.toLowerCase() === tagSlug),
      );
    }

    // Filter by vendor name
    if (activeVendor) {
      const v = activeVendor.toLowerCase();
      result = result.filter(p => {
        // Check meta_data for vendor, or attributes for "Produttore"
        const vendorMeta = p.meta_data?.find((m: { key: string; value: string }) =>
          m.key === '_vendorName' || m.key === 'vendor_name',
        );
        if (vendorMeta && String(vendorMeta.value).toLowerCase().includes(v)) return true;
        // Check attributes
        const produttore = p.attributes?.find(a =>
          a.name.toLowerCase() === 'produttore' || a.name.toLowerCase() === 'cantina',
        );
        if (produttore && produttore.options.some(o => o.toLowerCase().includes(v))) return true;
        // Fallback: search in name
        return p.name.toLowerCase().includes(v);
      });
    }

    if (activeCategory && activeCategory !== 'offerte') {
      const q = activeCategory.toLowerCase();
      const isCatPill = ALL_CAT_NAMES.includes(q);
      if (isCatPill) {
        result = result.filter(p => p.categories?.some(c => c.name.toLowerCase() === q));
      } else {
        result = result.filter(p => {
          const text = [p.name, p.categories?.map(c => c.name).join(' '), p.attributes?.map(a => a.options.join(' ')).join(' ')].join(' ').toLowerCase();
          return text.includes(q);
        });
      }
    }
    if (activeCategory === 'offerte') result = result.filter(p => p.on_sale);
    if (maxPrice < 500) result = result.filter(p => parseFloat(p.price) <= maxPrice);

    // Circuito first
    const circ = result.filter(p => p.tags?.some(t => t.id === 21993));
    const rest = result.filter(p => !p.tags?.some(t => t.id === 21993));
    if (orderBy === 'price-asc') rest.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    else if (orderBy === 'price-desc') rest.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    else if (orderBy === 'date') rest.sort((a, b) => b.id - a.id);
    return [...circ, ...rest];
  }, [allProducts, activeCategory, activeTag, activeVendor, maxPrice, orderBy, ready]);

  const handleCategory = (cat: string) => setActiveCategory(cat);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* Toolbar — categorie + ordina + prezzo, tutto inline */}
      <div className="flex items-center gap-1.5 overflow-visible flex-wrap mb-3">
        <button onClick={() => handleCategory('')} className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all ${activeCategory === '' ? 'bg-[#055667] text-white' : 'bg-white border border-gray-200 text-gray-700 hover:border-[#055667]'}`}>Tutti</button>

        {MACRO_CATEGORIES.map(mc => (
          <MacroDropdown key={mc.label} mc={mc} activeCategory={activeCategory} onSelect={handleCategory} />
        ))}

        <button onClick={() => handleCategory('offerte')} className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all ${activeCategory === 'offerte' ? 'bg-red-500 text-white' : 'bg-red-50 border border-red-200 text-red-600 hover:bg-red-500 hover:text-white'}`}>Offerte</button>

        <div className="w-px h-5 bg-gray-200 shrink-0" />

        <select value={orderBy} onChange={(e) => setOrderBy(e.target.value)} className="h-7 px-2 rounded-lg border border-gray-200 text-[11px] text-gray-600 bg-white focus:outline-none focus:border-[#055667] shrink-0">
          {ORDINA_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <div className="hidden sm:flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] text-gray-500">max</span>
          <input type="range" min={5} max={500} step={5} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="w-16 h-1 bg-gray-200 rounded-full appearance-none cursor-pointer accent-[#055667]" />
          <span className="text-[10px] font-semibold text-[#055667] w-7">{maxPrice}€</span>
        </div>

        <span className="text-[10px] text-gray-400 shrink-0">{filtered.length} prodotti</span>
      </div>
      <SearchModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)} />

      {/* Mobile price */}
      <div className="sm:hidden flex items-center gap-2 mb-3">
        <span className="text-[10px] text-gray-500">max</span>
        <input type="range" min={5} max={500} step={5} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="flex-1 h-1 bg-gray-200 rounded-full appearance-none cursor-pointer accent-[#055667]" />
        <span className="text-[10px] font-semibold text-[#055667]">{maxPrice}€</span>
      </div>

      {/* Results */}
      {!ready ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2">
          <div className="w-6 h-6 border-2 border-[#055667]/20 border-t-[#055667] rounded-full animate-spin" />
          <p className="text-xs text-gray-400">Caricamento...</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filtered.map(product => <ProductCard key={product.id} product={product} />)}
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

/* ── Macro dropdown ── */
function MacroDropdown({ mc, activeCategory, onSelect }: { mc: { label: string; subs?: string[] }; activeCategory: string; onSelect: (c: string) => void }) {
  const [open, setOpen] = useState(false);
  const isActive = activeCategory === mc.label || mc.subs?.includes(activeCategory);

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
            <button onClick={() => { onSelect(mc.label); setOpen(false); }} className={`block w-full text-left px-4 py-2 text-xs font-semibold hover:bg-gray-50 ${activeCategory === mc.label ? 'text-[#055667]' : 'text-gray-700'}`}>Tutti {mc.label}</button>
            <div className="h-px bg-gray-100 mx-3" />
            {mc.subs.map(sub => (
              <button key={sub} onClick={() => { onSelect(sub); setOpen(false); }} className={`block w-full text-left px-4 py-2 text-xs hover:bg-gray-50 ${activeCategory === sub ? 'font-bold text-[#055667]' : 'text-gray-600'}`}>{sub}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
