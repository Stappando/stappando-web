'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { DEFAULT_VENDOR_NAME } from '@/lib/config';

interface IndexEntry {
  i: number;
  s: string;
  n: string;
  N: string;
  p: string;
  r: string;
  l: string;
  o: boolean;
  v: string;  // vendor
  g: string;  // region
  t: string[];
  c: boolean;
  b: string;
  m: string;  // image
}

interface Cantina {
  name: string;
  slug: string;
  productCount: number;
  image: string | null;
  regions: string[];
}

export default function CantineClient() {
  const [cantine, setCantine] = useState<Cantina[]>([]);
  const [ready, setReady] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/search/index')
      .then(r => r.json())
      .then((entries: IndexEntry[]) => {
        const map = new Map<string, Cantina>();

        for (const entry of entries) {
          const vendor = entry.v?.trim();
          if (!vendor || vendor === DEFAULT_VENDOR_NAME) continue;

          const slug = vendor.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
          const existing = map.get(slug);
          const region = entry.g?.trim() || '';

          if (existing) {
            existing.productCount++;
            if (!existing.image && entry.m) existing.image = entry.m;
            if (region && !existing.regions.includes(region)) existing.regions.push(region);
          } else {
            map.set(slug, {
              name: vendor,
              slug,
              productCount: 1,
              image: entry.m || null,
              regions: region ? [region] : [],
            });
          }
        }

        const sorted = Array.from(map.values()).sort((a, b) =>
          b.productCount - a.productCount || a.name.localeCompare(b.name),
        );
        setCantine(sorted);
        setReady(true);
      })
      .catch(() => setReady(true));
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return cantine;
    const q = search.toLowerCase();
    return cantine.filter(c =>
      c.name.toLowerCase().includes(q) || c.regions.some(r => r.toLowerCase().includes(q)),
    );
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
            placeholder="Cerca cantina o regione..."
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {filtered.map(cantina => (
            <Link
              key={cantina.slug}
              href={`/cantine/${cantina.slug}`}
              className="group rounded-xl border border-[#e8e4dc] bg-white overflow-hidden hover:border-[#d9c39a] hover:shadow-md transition-all"
            >
              {/* Image */}
              <div className="relative aspect-[4/3] bg-gradient-to-br from-[#f5f1ea] to-[#e8e0d2] overflow-hidden">
                {cantina.image ? (
                  <Image
                    src={cantina.image}
                    alt={cantina.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-[#005667]/20">{cantina.name.charAt(0)}</span>
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-[#005667] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {cantina.productCount} {cantina.productCount === 1 ? 'vino' : 'vini'}
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                <h3 className="text-[13px] font-semibold text-[#1a1a1a] group-hover:text-[#005667] transition-colors line-clamp-1">
                  {cantina.name}
                </h3>
                {cantina.regions.length > 0 && (
                  <p className="text-[11px] text-[#888] mt-0.5 line-clamp-1">
                    {cantina.regions.join(', ')}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Empty state */}
      {ready && filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-sm font-semibold text-gray-700">Nessuna cantina trovata</p>
          <p className="text-xs text-gray-500 mt-1">Prova con un altro termine</p>
        </div>
      )}
    </div>
  );
}
