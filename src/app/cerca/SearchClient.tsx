'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { type WCProduct } from '@/lib/api';
import ProductGrid from '@/components/ProductGrid';

const QUICK_FILTERS = [
  { label: 'Rossi', query: 'rosso' },
  { label: 'Bianchi', query: 'bianco' },
  { label: 'Rosati', query: 'rosato' },
  { label: 'Bollicine', query: 'spumante' },
  { label: 'In offerta', query: '', onSale: true },
];

interface Props {
  initialProducts: WCProduct[];
  initialQuery: string;
  initialOnSale: boolean;
}

export default function SearchClient({ initialProducts, initialQuery, initialOnSale }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [products, setProducts] = useState(initialProducts);
  const [loading, setLoading] = useState(false);

  const doSearch = useCallback(async (q: string, onSale = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (onSale) params.set('on_sale', 'true');
      router.push(`/cerca?${params.toString()}`);

      // Also fetch client-side for instant update
      const apiUrl = new URL('https://stappando.it/wp-json/wc/v3/products');
      apiUrl.searchParams.set('consumer_key', 'ck_e28bb3c3e86e007bad35911cffb20258a1343b53');
      apiUrl.searchParams.set('consumer_secret', 'cs_9494a1fed3d4ed450ff53df9166078abb2388e44');
      apiUrl.searchParams.set('per_page', '40');
      apiUrl.searchParams.set('status', 'publish');
      if (q) apiUrl.searchParams.set('search', q);
      if (onSale) apiUrl.searchParams.set('on_sale', 'true');
      apiUrl.searchParams.set('orderby', 'popularity');

      const res = await fetch(apiUrl.toString());
      if (res.ok) {
        const data: WCProduct[] = await res.json();
        setProducts(data);
      }
    } catch {
      // keep existing
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) doSearch(query.trim());
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-brand-text mb-6">
        {initialOnSale ? 'Offerte' : initialQuery ? `Risultati per "${initialQuery}"` : 'Cerca vini'}
      </h1>

      {/* Search form */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="relative max-w-xl">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cerca vini, cantine, regioni..."
            className="w-full h-12 pl-12 pr-4 rounded-xl bg-white border border-brand-border text-base focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
          />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </form>

      {/* Quick filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        {QUICK_FILTERS.map((filter) => (
          <button
            key={filter.label}
            onClick={() => {
              if (filter.onSale) {
                setQuery('');
                doSearch('', true);
              } else {
                setQuery(filter.query);
                doSearch(filter.query);
              }
            }}
            className="px-4 py-2 rounded-full text-sm font-medium border border-brand-border text-brand-text hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-colors"
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <ProductGrid products={products} />
      )}
    </div>
  );
}
