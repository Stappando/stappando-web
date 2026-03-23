'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { api, WCProduct, formatPrice, decodeHtml, getDiscount } from '@/lib/api';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FILTERS = {
  Tipologia: ['Rossi', 'Bianchi', 'Rosati', 'Bollicine', 'Spumanti', 'Prosecco', 'Franciacorta'],
  Regione: ['Toscana', 'Piemonte', 'Puglia', 'Sicilia', 'Veneto', 'Campania', 'Lazio', 'Emilia-Romagna'],
  Vitigno: [
    'Sangiovese',
    'Nebbiolo',
    'Primitivo',
    'Nero d\'Avola',
    'Montepulciano',
    'Trebbiano',
    'Glera',
    'Vermentino',
  ],
  Gradazione: ['<12\u00B0', '12-13\u00B0', '13-14\u00B0', '>14\u00B0'],
} as const;

type FilterSection = keyof typeof FILTERS;

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, Set<string>>>({});
  const [results, setResults] = useState<WCProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [visible, setVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Animate in
  useEffect(() => {
    if (isOpen) {
      // Small delay so the CSS transition triggers
      requestAnimationFrame(() => setVisible(true));
      inputRef.current?.focus();
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const toggleFilter = useCallback((section: string, value: string) => {
    setActiveFilters((prev) => {
      const next = { ...prev };
      const set = new Set(prev[section] || []);
      if (set.has(value)) {
        set.delete(value);
      } else {
        set.add(value);
      }
      next[section] = set;
      return next;
    });
  }, []);

  const isFilterActive = (section: string, value: string) => {
    return activeFilters[section]?.has(value) ?? false;
  };

  const getActiveFilterCount = () => {
    return Object.values(activeFilters).reduce((sum, set) => sum + set.size, 0);
  };

  // Build WooCommerce search params from active filters
  const buildSearchParams = useCallback(() => {
    const params: Record<string, string | number> = {};

    // Tag-based filters for Tipologia, Regione, Vitigno
    const tagParts: string[] = [];
    ['Tipologia', 'Regione', 'Vitigno'].forEach((section) => {
      const set = activeFilters[section];
      if (set?.size) {
        set.forEach((v) => tagParts.push(v));
      }
    });

    // For WooCommerce, we search by combining query and filter tags
    // Using the search param plus tag filtering
    if (tagParts.length > 0) {
      // Append filter terms to the search query for broader matching
      const filterTerms = tagParts.join(' ');
      if (params.search) {
        params.search = `${params.search} ${filterTerms}`;
      } else {
        params.search = filterTerms;
      }
    }

    return params;
  }, [activeFilters]);

  // Perform search
  const performSearch = useCallback(async () => {
    const trimmed = query.trim();
    const filterCount = getActiveFilterCount();

    if (!trimmed && filterCount === 0) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      const extraParams = buildSearchParams();
      let products: WCProduct[];

      if (trimmed) {
        products = await api.searchProducts(trimmed, extraParams);
      } else {
        products = await api.getProducts({ ...extraParams, per_page: 20 });
      }

      setResults(products);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, activeFilters, buildSearchParams]);

  // Debounced search on query or filter change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      performSearch();
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [performSearch]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setActiveFilters({});
      setResults([]);
      setHasSearched(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] transition-all duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full h-full md:h-auto md:max-h-[90vh] md:max-w-3xl md:mx-auto md:mt-[5vh] md:rounded-2xl bg-white overflow-hidden flex flex-col transition-transform duration-300 ${
          visible ? 'scale-100' : 'scale-95'
        }`}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-4 sm:px-6 pt-5 pb-4 border-b border-brand-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-brand-primary">Cerca vini</h2>
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-brand-muted hover:text-brand-text transition-colors rounded-full hover:bg-gray-100"
              aria-label="Chiudi"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search input */}
          <div className="relative">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cerca per nome, cantina, vitigno..."
              className="w-full h-12 sm:h-14 pl-12 pr-4 rounded-xl bg-brand-bg border border-brand-border text-base sm:text-lg focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-brand-muted hover:text-brand-text transition-colors"
                aria-label="Cancella ricerca"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {/* Filters */}
          <div className="px-4 sm:px-6 py-4 space-y-4 border-b border-brand-border">
            {(Object.entries(FILTERS) as [FilterSection, readonly string[]][]).map(
              ([section, values]) => (
                <div key={section}>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-muted mb-2">
                    {section}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {values.map((value) => {
                      const active = isFilterActive(section, value);
                      return (
                        <button
                          key={value}
                          onClick={() => toggleFilter(section, value)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                            active
                              ? 'bg-[#055667] text-white shadow-sm'
                              : 'bg-gray-100 text-brand-text hover:bg-gray-200'
                          }`}
                        >
                          {value}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ),
            )}
          </div>

          {/* Results */}
          <div className="px-4 sm:px-6 py-4">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-3 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin" />
              </div>
            )}

            {!loading && hasSearched && results.length === 0 && (
              <div className="text-center py-12">
                <svg
                  className="w-12 h-12 mx-auto text-brand-muted/40 mb-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-brand-muted text-sm">Nessun risultato trovato</p>
                <p className="text-brand-muted/60 text-xs mt-1">Prova con termini diversi o meno filtri</p>
              </div>
            )}

            {!loading && results.length > 0 && (
              <>
                <p className="text-xs text-brand-muted mb-3">
                  {results.length} risultat{results.length === 1 ? 'o' : 'i'}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                  {results.map((product) => {
                    const discount = getDiscount(product);
                    const image = product.images?.[0];
                    return (
                      <Link
                        key={product.id}
                        href={`/prodotto/${product.slug}`}
                        onClick={onClose}
                        className="group bg-white rounded-xl border border-brand-border hover:border-brand-primary/30 hover:shadow-md transition-all duration-200 overflow-hidden"
                      >
                        <div className="relative aspect-square bg-brand-bg">
                          {image ? (
                            <Image
                              src={image.src}
                              alt={decodeHtml(product.name)}
                              fill
                              sizes="(max-width: 640px) 50vw, 200px"
                              className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <svg
                                className="w-10 h-10 text-brand-muted/30"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1}
                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                            </div>
                          )}
                          {discount > 0 && (
                            <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-red-500 text-white text-[10px] font-bold">
                              -{discount}%
                            </span>
                          )}
                        </div>
                        <div className="p-2.5">
                          <h4 className="text-xs sm:text-sm font-medium text-brand-text leading-tight line-clamp-2 mb-1">
                            {decodeHtml(product.name)}
                          </h4>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-sm font-bold text-brand-primary">
                              {formatPrice(product.price)}&euro;
                            </span>
                            {product.on_sale && product.regular_price && (
                              <span className="text-[10px] text-brand-muted line-through">
                                {formatPrice(product.regular_price)}&euro;
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </>
            )}

            {!loading && !hasSearched && (
              <div className="text-center py-8">
                <svg
                  className="w-10 h-10 mx-auto text-brand-muted/30 mb-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <p className="text-brand-muted text-sm">Cerca o seleziona i filtri per esplorare il catalogo</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
