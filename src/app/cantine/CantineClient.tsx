'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

interface Cantina {
  name: string;
  slug: string;
  description: string;
  count: number;
  image: string | null;
  region: string;
}

export default function CantineClient() {
  const [cantine, setCantine] = useState<Cantina[]>([]);
  const [ready, setReady] = useState(false);
  const [regionFilter, setRegionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPage = async (p: number, append = false) => {
    if (append) setLoadingMore(true);
    try {
      const res = await fetch(`/api/cantine?page=${p}`);
      const data = await res.json();
      const newCantine = data.cantine || [];
      setCantine(prev => append ? [...prev, ...newCantine] : newCantine);
      setTotal(data.total || 0);
      setHasMore(!!data.hasMore);
    } catch { /* */ }
    setReady(true);
    setLoadingMore(false);
  };

  useEffect(() => { fetchPage(1); }, []);

  const regions = useMemo(() => {
    const set = new Set(cantine.map(c => c.region).filter(Boolean));
    return Array.from(set).sort();
  }, [cantine]);

  const displayed = useMemo(() => {
    if (!regionFilter) return cantine;
    return cantine.filter(c => c.region === regionFilter);
  }, [cantine, regionFilter]);

  if (!ready) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col items-center justify-center py-16 gap-2">
          <div className="w-6 h-6 border-2 border-[#005667]/20 border-t-[#005667] rounded-full animate-spin" />
          <p className="text-xs text-gray-400">Caricamento cantine...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1a1a1a]">Le nostre Cantine</h1>
        <p className="text-sm text-gray-500 mt-1">{total} produttori selezionati dal nostro sommelier</p>
      </div>

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
        <span className="text-[11px] text-gray-400 ml-auto">{displayed.length} cantine</span>
      </div>

      {displayed.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {displayed.map(cantina => (
              <Link
                key={cantina.slug}
                href={`/cantine/${cantina.slug}`}
                className="group rounded-xl border border-[#e8e4dc] bg-white overflow-hidden hover:border-[#d9c39a] hover:shadow-md transition-all"
              >
                <div className="aspect-square bg-white flex items-center justify-center p-6 border-b border-[#f0ece4]">
                  {cantina.image ? (
                    <img
                      src={cantina.image}
                      alt={cantina.name}
                      className="max-h-[80px] max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
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
                    {cantina.region ? (
                      <span className="text-[10px] text-[#005667] font-medium">{cantina.region}</span>
                    ) : <span />}
                    {cantina.count > 0 && (
                      <span className="text-[10px] text-[#888]">{cantina.count} {cantina.count === 1 ? 'vino' : 'vini'}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

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

      {displayed.length === 0 && (
        <div className="text-center py-16">
          <p className="text-sm font-semibold text-gray-700">Nessuna cantina trovata</p>
          <p className="text-xs text-gray-500 mt-1">Prova con un&apos;altra regione</p>
        </div>
      )}
    </div>
  );
}
