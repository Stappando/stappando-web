'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { type WCProduct, decodeHtml } from '@/lib/api';

interface Cantina {
  name: string;
  slug: string;
  productCount: number;
  image: string | null;
  regions: string[];
}

export default function CantineClient() {
  const [products, setProducts] = useState<WCProduct[]>([]);
  const [ready, setReady] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/products.json')
      .then(r => r.json())
      .then((data: WCProduct[]) => {
        setProducts(data);
        setReady(true);
      })
      .catch(() => setReady(true));
  }, []);

  const cantine = useMemo(() => {
    if (!ready) return [];

    const map = new Map<string, Cantina>();

    for (const p of products) {
      // Extract "Produttore" from attributes
      const produttoreAttr = p.attributes?.find(
        a => a.name === 'Produttore' || a.name === 'produttore' || a.name === 'Cantina',
      );
      if (!produttoreAttr?.options?.length) continue;

      for (const raw of produttoreAttr.options) {
        const name = decodeHtml(raw).trim();
        if (!name) continue;

        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const existing = map.get(slug);

        // Get region
        const regionAttr = p.attributes?.find(a => a.name === 'Regione');
        const region = regionAttr?.options?.[0] || '';

        if (existing) {
          existing.productCount++;
          if (!existing.image && p.images?.[0]?.src) {
            existing.image = p.images[0].src;
          }
          if (region && !existing.regions.includes(region)) {
            existing.regions.push(region);
          }
        } else {
          map.set(slug, {
            name,
            slug,
            productCount: 1,
            image: p.images?.[0]?.src || null,
            regions: region ? [region] : [],
          });
        }
      }
    }

    // Sort by product count descending, then alphabetically
    return Array.from(map.values()).sort((a, b) =>
      b.productCount - a.productCount || a.name.localeCompare(b.name),
    );
  }, [products, ready]);

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
        <h1 className="text-2xl sm:text-3xl font-bold text-[#005667]">Le nostre Cantine</h1>
        <p className="text-sm text-gray-500 mt-1">
          {ready ? `${cantine.length} cantine selezionate` : 'Caricamento...'}
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {filtered.map(cantina => (
            <Link
              key={cantina.slug}
              href={`/cerca?vendor=${encodeURIComponent(cantina.name)}`}
              className="group rounded-2xl border border-gray-200 bg-white overflow-hidden hover:border-[#d9c39a] hover:shadow-md transition-all"
            >
              {/* Image */}
              <div className="relative aspect-[4/3] bg-[#f8f7f5] overflow-hidden">
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
                    <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 7.5h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                    </svg>
                  </div>
                )}
                {/* Product count badge */}
                <div className="absolute top-2 right-2 bg-[#005667] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {cantina.productCount} {cantina.productCount === 1 ? 'vino' : 'vini'}
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                <h3 className="text-sm font-semibold text-gray-900 group-hover:text-[#005667] transition-colors line-clamp-1">
                  {cantina.name}
                </h3>
                {cantina.regions.length > 0 && (
                  <p className="text-[11px] text-[#d9c39a] font-medium mt-0.5 line-clamp-1">
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
          <svg className="w-10 h-10 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-sm font-semibold text-gray-700">Nessuna cantina trovata</p>
          <p className="text-xs text-gray-500 mt-1">Prova con un altro termine</p>
        </div>
      )}
    </div>
  );
}
