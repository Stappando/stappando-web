'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatPrice, decodeHtml } from '@/lib/api';

/* ── Types ─────────────────────────────────────────────── */

/** Full result from /api/search (with images, region, badge) */
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

/** Lightweight index entry from /api/search/index */
interface IndexEntry {
  i: number;   // id
  s: string;   // slug
  n: string;   // name (lowercased)
  N: string;   // name (original)
  p: string;   // price
  r: string;   // regular_price
  l: string;   // sale_price
  o: boolean;  // on_sale
  v: string;   // vendor
  g: string;   // region
  t: string[]; // tag slugs
  c: boolean;  // is_circuito
  b: string;   // circuito_badge
  m: string;   // image thumbnail
}

interface Props {
  onClose: () => void;
  isMobile?: boolean;
}

/* ── Quick suggestions ─────────────────────────────────── */

const SUGGESTIONS = [
  'Aperitivo',
  'Regalo',
  'Sotto 15€',
  'Bollicine',
  'Vino rosso',
  'Cena speciale',
];

/* ── Global index cache (shared across overlay openings) ── */

let _indexCache: IndexEntry[] | null = null;
let _indexLoading = false;
let _indexPromise: Promise<IndexEntry[]> | null = null;

function loadIndex(): Promise<IndexEntry[]> {
  if (_indexCache) return Promise.resolve(_indexCache);
  if (_indexPromise) return _indexPromise;

  _indexLoading = true;
  _indexPromise = fetch('/api/search/index')
    .then(r => r.ok ? r.json() : [])
    .then((data: IndexEntry[]) => {
      _indexCache = data;
      _indexLoading = false;
      return data;
    })
    .catch(() => {
      _indexLoading = false;
      _indexPromise = null;
      return [] as IndexEntry[];
    });

  return _indexPromise;
}

/** Search the local index — instant, no network */
function searchIndex(index: IndexEntry[], query: string, limit: number): SearchResult[] {
  const q = query.toLowerCase().trim();
  if (q.length < 1) return [];

  const terms = q.split(/\s+/);

  // Special: "sotto Xé" price filter
  const priceMatch = q.match(/sotto\s+(\d+)/);
  const maxPrice = priceMatch ? parseFloat(priceMatch[1]) : Infinity;

  const scored: { entry: IndexEntry; score: number }[] = [];

  for (const entry of index) {
    let score = 0;

    // Price filter
    const price = parseFloat(entry.p);
    if (maxPrice < Infinity && price > maxPrice) continue;
    if (maxPrice < Infinity && price <= maxPrice) score += 2;

    // Match terms against name, vendor, region, tags
    const searchable = `${entry.n} ${entry.v.toLowerCase()} ${entry.g.toLowerCase()} ${entry.t.join(' ')}`;

    let allMatch = true;
    for (const term of terms) {
      if (term === 'sotto' || /^\d+[€]?$/.test(term)) continue; // skip price terms
      if (searchable.includes(term)) {
        score += 3;
        // Bonus for name match
        if (entry.n.includes(term)) score += 2;
        // Bonus for starts-with
        if (entry.n.startsWith(term)) score += 3;
      } else {
        allMatch = false;
        break;
      }
    }

    if (!allMatch && maxPrice === Infinity) continue;
    if (score === 0) continue;

    // Circuito always boosted
    if (entry.c) score += 10;

    scored.push({ entry, score });
  }

  // Sort by score desc, take top N
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map(({ entry }) => ({
    id: entry.i,
    slug: entry.s,
    name: entry.N,
    price: entry.p,
    regular_price: entry.r,
    sale_price: entry.l,
    image: entry.m || null,
    vendor: entry.v,
    region: entry.g,
    on_sale: entry.o,
    is_circuito: entry.c,
    circuito_badge: entry.b,
  }));
}

/* ── Component ─────────────────────────────────────────── */

export default function SearchOverlay({ onClose, isMobile = false }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [apiFetched, setApiFetched] = useState(false);
  const [indexReady, setIndexReady] = useState(!!_indexCache);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Autofocus
  useEffect(() => { inputRef.current?.focus(); }, []);

  // Load index in background on mount
  useEffect(() => {
    loadIndex().then(() => setIndexReady(true));
  }, []);

  // ESC to close (desktop)
  useEffect(() => {
    if (isMobile) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, isMobile]);

  /**
   * Hybrid search:
   * 1. Instant: filter local index (0ms)
   * 2. Background: call API for fresh data, silently merge
   */
  const doSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (trimmed.length < 1) {
      setResults([]);
      setSearched(false);
      setApiFetched(false);
      setLoading(false);
      return;
    }

    // Step 1: Instant local results
    if (_indexCache) {
      const localResults = searchIndex(_indexCache, trimmed, 5);
      setResults(localResults);
      setLoading(false);
      setSearched(true);
    }

    // Only call API for 2+ chars (1-char queries use local index only)
    if (trimmed.length < 2) {
      setApiFetched(true);
      return;
    }

    // Step 2: Background API call for fresh/accurate results
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}&limit=5`, {
        signal: controller.signal,
      });
      if (res.ok) {
        const apiResults: SearchResult[] = await res.json();
        if (apiResults.length > 0) {
          setResults(apiResults);
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        // Keep local results if API fails
      }
    } finally {
      setLoading(false);
      setSearched(true);
      setApiFetched(true);
    }
  }, []);

  const handleInput = useCallback((value: string) => {
    setQuery(value);
    setApiFetched(false);

    // Show skeleton only if index not ready yet and 1+ chars
    if (value.trim().length >= 1 && !_indexCache) {
      setLoading(true);
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 30);
  }, [doSearch]);

  const handleSuggestion = useCallback((term: string) => {
    // Navigate directly to search results
    const param = term === 'Sotto 15€' ? 'max_price=15' : `q=${encodeURIComponent(term)}`;
    window.location.href = `/cerca?${param}`;
    onClose();
  }, [onClose]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const v = query.trim();
    if (v) {
      window.location.href = `/cerca?q=${encodeURIComponent(v)}`;
      onClose();
    }
  }, [query, onClose]);

  const handleResultClick = useCallback(() => {
    onClose();
  }, [onClose]);

  /* ── Mobile full-screen layout ──────────────────────── */
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-[60] bg-white flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 h-14 border-b border-gray-100">
          <form onSubmit={handleSubmit} className="flex-1 relative">
            <SearchIcon className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-[#005667]/40" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => handleInput(e.target.value)}
              placeholder="Cerca vino, occasione o abbinamento…"
              className="w-full pl-7 pr-2 py-2 text-base border-b-2 border-transparent focus:border-[#005667] focus:outline-none transition-colors"
            />
          </form>
          <button onClick={onClose} className="text-[13px] font-medium text-[#005667] shrink-0 py-2 px-1">
            Annulla
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Suggestions — horizontal scroll */}
          {!query && (
            <div className="px-4 py-4">
              <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium mb-3">Suggerimenti</p>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => handleSuggestion(s)}
                    className="shrink-0 px-4 py-2 rounded-full border border-gray-200 text-[13px] text-gray-700 hover:border-[#005667] hover:text-[#005667] transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && <SkeletonResults />}

          {/* Results */}
          {!loading && results.length > 0 && (
            <div>
              {results.map(r => (
                <ResultRow key={r.id} result={r} onClick={handleResultClick} />
              ))}
              <Link
                href={`/cerca?q=${encodeURIComponent(query)}`}
                onClick={handleResultClick}
                className="block px-4 py-3 text-[13px] font-medium text-[#005667] hover:bg-gray-50 border-t border-gray-100"
              >
                Vedi tutti i risultati per &ldquo;{query}&rdquo; →
              </Link>
            </div>
          )}

          {/* No results — only after API has also responded */}
          {!loading && searched && apiFetched && results.length === 0 && query.length >= 1 && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-gray-500">
                Nessun vino trovato per &ldquo;{query}&rdquo;
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Prova con Rosso o Barolo
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── Desktop overlay ────────────────────────────────── */
  return (
    <div className="absolute inset-x-0 top-full bg-white border-b border-[#e5e5e5] shadow-lg z-50">
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-4">
        <form onSubmit={handleSubmit} className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#005667]/40" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => handleInput(e.target.value)}
            placeholder="Cerca vino, occasione o abbinamento…"
            className="w-full pl-12 pr-20 py-3.5 bg-white border-2 border-[#005667]/15 rounded-2xl text-base focus:outline-none focus:border-[#005667]/40 focus:shadow-[0_0_0_4px_rgba(0,86,103,0.06)] transition-all"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            <button type="submit" className="px-5 py-2 bg-[#005667] text-white rounded-xl text-xs font-bold hover:bg-[#004555] transition-colors shadow-sm">Cerca</button>
            <button type="button" onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </form>

        {/* Suggestions pills — shown when empty */}
        {!query && (
          <div className="flex flex-wrap gap-2 mt-3">
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => handleSuggestion(s)}
                className="px-3.5 py-1.5 rounded-full border border-[#e5e5e5] text-[12px] text-gray-600 hover:border-[#005667] hover:text-[#005667] transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && <SkeletonResults />}

        {/* Results dropdown */}
        {!loading && results.length > 0 && (
          <div className="mt-2 rounded-xl border border-gray-100 overflow-hidden">
            {results.map(r => (
              <ResultRow key={r.id} result={r} onClick={handleResultClick} />
            ))}
            <Link
              href={`/cerca?q=${encodeURIComponent(query)}`}
              onClick={handleResultClick}
              className="block px-4 py-3 text-[13px] font-medium text-[#005667] hover:bg-gray-50 border-t border-gray-100 text-center"
            >
              Vedi tutti i risultati per &ldquo;{query}&rdquo; →
            </Link>
          </div>
        )}

        {/* No results — only after API has also responded */}
        {!loading && searched && apiFetched && results.length === 0 && query.length >= 1 && (
          <div className="mt-3 py-4 text-center">
            <p className="text-sm text-gray-500">
              Nessun vino trovato per &ldquo;{query}&rdquo;
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Prova con <button onClick={() => handleSuggestion('Rosso')} className="text-[#005667] underline">Rosso</button> o <button onClick={() => handleSuggestion('Barolo')} className="text-[#005667] underline">Barolo</button>
            </p>
          </div>
        )}
      </div>
      {/* Click outside to close */}
      <div className="fixed inset-0 -z-10" onClick={onClose} />
    </div>
  );
}

/* ── Sub-components ────────────────────────────────────── */

function ResultRow({ result, onClick }: { result: SearchResult; onClick: () => void }) {
  return (
    <Link
      href={`/prodotto/${result.slug}`}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
    >
      {/* Image */}
      <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-gray-100 shrink-0">
        {result.image && (
          <Image src={result.image} alt={decodeHtml(result.name)} fill className="object-cover" sizes="36px" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 line-clamp-1">{decodeHtml(result.name)}</p>
        {(result.vendor || result.region) && (
          <p className="text-[11px] text-[#888] line-clamp-1">
            {[result.vendor, result.region].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>

      {/* Price + badge */}
      <div className="shrink-0 text-right">
        <p className="text-sm font-medium text-[#005667]">{formatPrice(result.price)} €</p>
        {result.is_circuito && (
          <span className="inline-block mt-0.5 px-1.5 py-0.5 bg-[#d9c39a] text-[#5a4200] text-[9px] font-bold rounded">
            {result.circuito_badge || 'Sommelier'}
          </span>
        )}
      </div>
    </Link>
  );
}

function SkeletonResults() {
  return (
    <div className="mt-2 space-y-0">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-center gap-3 px-4 py-2.5 animate-pulse">
          <div className="w-9 h-9 rounded-lg bg-gray-200 shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 bg-gray-200 rounded w-3/4" />
            <div className="h-2.5 bg-gray-100 rounded w-1/2" />
          </div>
          <div className="h-3.5 bg-gray-200 rounded w-12 shrink-0" />
        </div>
      ))}
    </div>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}
