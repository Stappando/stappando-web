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
    fetchPage(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      {/* Filter row — only region */}
      <div className="flex items-center gap-2 mb-6">
        {regions.length > 0 && (
          <select
            value={regionFilter}
            onChange={e => setRegionFilter(e.target.value)}
            className="h-9 px-3 rounded-lg border border-gray-200 text-[13px] text-gray-700 bg-white focus:outline-none focus:border-[#005667]"
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
        <span className="text-[11px] text-gray-400 ml-auto">{displayed.length} cantine</span>
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
                {/* Logo centered */}
                <div className="aspect-square bg-white flex items-center justify-center p-6 border-b border-[#f0ece4]">
                  {cantina.image ? (
                    <Image
                      src={cantina.image}
                      alt={cantina.name}
                      width={120}
                      height={120}
                      className="object-contain max-h-[80px] group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <span className="text-4xl font-bold text-[#005667]/10">{cantina.name.charAt(0)}</span>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="text-[13px] font-semibold text-[#1a1a1a] group-hover:text-[#005667] transition-colors line-clamp-1">
                    {cantina.name}
                  </h3>
                  <div className="flex items-center justify-between mt-1">
                    {cantina.region && (
                      <span className="text-[10px] text-[#005667] font-medium">{cantina.region}</span>
                    )}
                    <span className="text-[10px] text-[#888]">{cantina.count} {cantina.count === 1 ? 'vino' : 'vini'}</span>
                  </div>
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
