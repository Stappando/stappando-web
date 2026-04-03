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
  address: string;
}

export default function CantineClient() {
  const [cantine, setCantine] = useState<Cantina[]>([]);
  const [allRegions, setAllRegions] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [regionFilter, setRegionFilter] = useState('');
  const [showRegions, setShowRegions] = useState(false);
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
      if (data.regions?.length) setAllRegions(data.regions);
    } catch { /* */ }
    setReady(true);
    setLoadingMore(false);
  };

  useEffect(() => { fetchPage(1); }, []);

  const displayed = useMemo(() => {
    if (!regionFilter) return cantine;
    return cantine.filter(c => c.region === regionFilter);
  }, [cantine, regionFilter]);

  const selectRegion = (region: string) => {
    setRegionFilter(region);
    setShowRegions(false);
  };

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1a1a1a]">Le nostre Cantine</h1>
          <p className="text-sm text-gray-500 mt-1">{total} produttori selezionati dal nostro sommelier</p>
        </div>
        {allRegions.length > 0 && (
          <button
            onClick={() => setShowRegions(!showRegions)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#005667]/20 text-[13px] text-[#005667] font-medium hover:bg-[#005667]/5 transition-colors shrink-0 mt-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Cerca per regione
            <svg className={`w-3.5 h-3.5 transition-transform ${showRegions ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>

      {/* Region filter pills */}
      {showRegions && allRegions.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5 p-4 bg-white rounded-xl border border-[#e8e4dc] shadow-sm">
          <button
            onClick={() => selectRegion('')}
            className={`text-[12px] px-3 py-1.5 rounded-full font-medium transition-colors ${
              !regionFilter
                ? 'bg-[#005667] text-white shadow-sm'
                : 'bg-[#f8f7f5] text-gray-600 hover:bg-[#005667]/5 hover:text-[#005667]'
            }`}
          >
            Tutte
          </button>
          {allRegions.map(r => (
            <button
              key={r}
              onClick={() => selectRegion(r)}
              className={`text-[12px] px-3 py-1.5 rounded-full font-medium transition-colors ${
                regionFilter === r
                  ? 'bg-[#005667] text-white shadow-sm'
                  : 'bg-[#f8f7f5] text-gray-600 hover:bg-[#005667]/5 hover:text-[#005667]'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      )}

      {/* Active filter + count */}
      <div className="flex items-center gap-2 mb-5">
        {regionFilter && (
          <button
            onClick={() => setRegionFilter('')}
            className="flex items-center gap-1 text-[12px] text-[#005667] bg-[#005667]/8 px-2.5 py-1 rounded-full font-medium hover:bg-[#005667]/15 transition-colors"
          >
            {regionFilter}
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        <span className="text-[11px] text-gray-400 ml-auto">{displayed.length} cantine</span>
      </div>

      {/* Grid */}
      {displayed.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {displayed.map(cantina => (
              <Link
                key={cantina.slug}
                href={`/cantine/${cantina.slug}`}
                className="group rounded-2xl bg-white border border-[#e8e4dc]/80 overflow-hidden hover:shadow-lg hover:border-[#d9c39a]/60 transition-all duration-300"
              >
                {/* Logo area — white bg */}
                <div className="aspect-[4/3] bg-white flex items-center justify-center p-6 sm:p-8 relative">
                  {cantina.image ? (
                    <img
                      src={cantina.image}
                      alt={cantina.name}
                      className="max-h-[100px] sm:max-h-[120px] max-w-[85%] object-contain group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-5xl sm:text-6xl font-bold text-[#005667]/8 select-none">{cantina.name.charAt(0)}</span>
                  )}
                  {/* Region pill overlay */}
                  {cantina.region && (
                    <span
                      className="absolute top-2.5 left-2.5 text-[10px] text-[#005667] font-semibold bg-[#005667]/8 backdrop-blur-sm px-2 py-0.5 rounded-full cursor-pointer hover:bg-[#005667]/15 transition-colors"
                      onClick={(e) => { e.preventDefault(); selectRegion(cantina.region); setShowRegions(true); }}
                    >
                      {cantina.region}
                    </span>
                  )}
                </div>

                {/* Info area */}
                <div className="p-3.5 pt-3 border-t border-[#f0ece4]/80">
                  <h3 className="text-[13px] sm:text-[14px] font-semibold text-[#1a1a1a] group-hover:text-[#005667] transition-colors line-clamp-1">
                    {cantina.name}
                  </h3>

                  <div className="flex items-center gap-2 mt-1.5">
                    {cantina.count > 0 && (
                      <span className="text-[10px] text-[#7a6e5d] font-medium flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        {cantina.count} {cantina.count === 1 ? 'vino' : 'vini'}
                      </span>
                    )}
                  </div>

                  {cantina.address && (
                    <p className="text-[10px] text-gray-400 mt-1.5 line-clamp-1 flex items-center gap-1">
                      <svg className="w-3 h-3 flex-shrink-0 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {cantina.address}
                    </p>
                  )}

                  {cantina.description && (
                    <p className="text-[11px] text-gray-500 leading-relaxed mt-2 line-clamp-2">{cantina.description}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center mt-8">
              <button
                onClick={() => { const next = page + 1; setPage(next); fetchPage(next, true); }}
                disabled={loadingMore}
                className="px-8 py-3 border border-[#005667] text-[#005667] rounded-xl text-[13px] font-semibold hover:bg-[#005667] hover:text-white transition-colors disabled:opacity-50"
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
