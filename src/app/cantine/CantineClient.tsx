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
}

export default function CantineClient() {
  const [cantine, setCantine] = useState<Cantina[]>([]);
  const [ready, setReady] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/cantine')
      .then(r => r.json())
      .then((data: Cantina[]) => {
        setCantine(data);
        setReady(true);
      })
      .catch(() => setReady(true));
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return cantine;
    const q = search.toLowerCase();
    return cantine.filter(c => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
  }, [cantine, search]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1a1a1a]">Le nostre Cantine</h1>
        <p className="text-sm text-gray-500 mt-1">
          {ready ? `${cantine.length} produttori selezionati dal nostro sommelier` : 'Caricamento...'}
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cerca cantina..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-base focus:outline-none focus:border-[#005667] focus:ring-1 focus:ring-[#005667]/20"
          />
        </div>
      </div>

      {/* Loading */}
      {!ready && (
        <div className="flex flex-col items-center justify-center py-16 gap-2">
          <div className="w-6 h-6 border-2 border-[#005667]/20 border-t-[#005667] rounded-full animate-spin" />
          <p className="text-xs text-gray-400">Caricamento cantine...</p>
        </div>
      )}

      {/* Grid */}
      {ready && filtered.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map(cantina => (
            <Link
              key={cantina.slug}
              href={`/cantine/${cantina.slug}`}
              className="group rounded-xl border border-[#e8e4dc] bg-white overflow-hidden hover:border-[#d9c39a] hover:shadow-md transition-all"
            >
              {/* Image / Logo */}
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

              {/* Info */}
              <div className="p-3">
                <h3 className="text-[13px] font-semibold text-[#1a1a1a] group-hover:text-[#005667] transition-colors line-clamp-1">
                  {cantina.name}
                </h3>
                {cantina.description && (
                  <p className="text-[11px] text-[#888] mt-0.5 line-clamp-2">{cantina.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Empty */}
      {ready && filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-sm font-semibold text-gray-700">Nessuna cantina trovata</p>
          <p className="text-xs text-gray-500 mt-1">Prova con un altro termine</p>
        </div>
      )}
    </div>
  );
}
