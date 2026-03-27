'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Cantina {
  name: string;
  slug: string;
  description: string;
  count: number;
  image: string | null;
  region: string;
}

type SortBy = 'count' | 'name';

export default function CantineClient() {
  const [cantine, setCantine] = useState<Cantina[]>([]);
  const [ready, setReady] = useState(false);
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('count');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPage = async (p: number, append = false) => {
    if (append) setLoadingMore(true); else setReady(false);
    try {
      const params = new URLSearchParams({ page: String(p) });
      if (search) params.set('search', search);
      const res = await fetch(`/api/cantine?${params}`);
      const data = await res.json();
      setCantine(prev => append ? [...prev, ...(data.cantine || [])] : (data.cantine || []));
      setTotal(data.total || 0);
      setHasMore(!!data.hasMore);
    } catch { /* */ }
    setReady(true);
    setLoadingMore(false);
  };

  useEffect(() => {
    setPage(1);
    fetchPage(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Extract unique regions for filter
  const regions = useMemo(() => {
    const set = new Set(cantine.map(c => c.region).filter(Boolean));
    return Array.from(set).sort();
  }, [cantine]);

  // Filter + sort
  const displayed = useMemo(() => {
    let list = [...cantine];
    if (regionFilter) list = list.filter(c => c.region === regionFilter);
    if (sortBy === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    else list.sort((a, b) => b.count - a.count);
    return list;
  }, [cantine, regionFilter, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1a1a1a]">Le nostre Cantine</h1>
        <p className="text-sm text-gray-500 mt-1">
          {ready ? `${total} produttori selezionati dal nostro sommelier` : 'Caricamento...'}
        </p>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cerca cantina..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#005667]"
          />
        </div>

        {regions.length > 0 && (
          <select
            value={regionFilter}
            onChange={e => setRegionFilter(e.target.value)}
            className="h-9 px-3 rounded-lg border border-gray-200 text-[12px] text-gray-700 bg-white focus:outline-none focus:border-[#005667]"
          >
            <option value="">Tutte le regioni</option>
            {regions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        )}

        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as SortBy)}
          className="h-9 px-3 rounded-lg border border-gray-200 text-[12px] text-gray-700 bg-white focus:outline-none focus:border-[#005667]"
        >
          <option value="count">Più vini</option>
          <option value="name">A-Z</option>
        </select>

        <span className="text-[11px] text-gray-400">{displayed.length} cantine</span>
      </div>

      {/* Loading */}
      {!ready && (
        <div className="flex flex-col items-center justify-center py-16 gap-2">
          <div className="w-6 h-6 border-2 border-[#005667]/20 border-t-[#005667] rounded-full animate-spin" />
          <p className="text-xs text-gray-400">Caricamento cantine...</p>
        </div>
      )}

      {/* Grid */}
      {ready && displayed.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {displayed.map(cantina => (
              <Link
                key={cantina.slug}
                href={`/cantine/${cantina.slug}`}
                className="group rounded-xl border border-[#e8e4dc] bg-white overflow-hidden hover:border-[#d9c39a] hover:shadow-md transition-all"
              >
                <div className="relative aspect-[4/3] bg-gradient-to-br from-[#f5f1ea] to-[#e8e0d2] overflow-hidden flex items-center justify-center">
                  {cantina.image ? (
                    <Image
                      src={cantina.image}
                      alt={cantina.name}
                      fill
                      className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  ) : (
                    <span className="text-3xl font-bold text-[#005667]/15">{cantina.name.charAt(0)}</span>
                  )}
                  <div className="absolute top-2 right-2 bg-[#005667] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {cantina.count} {cantina.count === 1 ? 'vino' : 'vini'}
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="text-[13px] font-semibold text-[#1a1a1a] group-hover:text-[#005667] transition-colors line-clamp-1">
                    {cantina.name}
                  </h3>
                  {cantina.region && (
                    <p className="text-[11px] text-[#005667] font-medium mt-0.5">{cantina.region}</p>
                  )}
                  {cantina.description && (
                    <p className="text-[10px] text-[#888] mt-0.5 line-clamp-2">{cantina.description}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center mt-6">
              <button
                onClick={() => { const next = page + 1; setPage(next); fetchPage(next, true); }}
                disabled={loadingMore}
                className="px-8 py-3 border border-[#005667] text-[#005667] rounded-lg text-[13px] font-semibold hover:bg-[#005667] hover:text-white transition-colors disabled:opacity-50"
              >
                {loadingMore ? 'Caricamento...' : 'Carica altre cantine'}
              </button>
            </div>
          )}
        </>
      )}

      {/* Empty */}
      {ready && displayed.length === 0 && (
        <div className="text-center py-16">
          <p className="text-sm font-semibold text-gray-700">Nessuna cantina trovata</p>
          <p className="text-xs text-gray-500 mt-1">Prova con un altro termine</p>
        </div>
      )}
    </div>
  );
}
