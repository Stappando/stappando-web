'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import { type WCProduct } from '@/lib/api';

interface CantinaDetail {
  name: string;
  slug: string;
  description: string;
  count: number;
  image: string | null;
  banner: string | null;
  region: string | null;
  address: string | null;
  products: WCProduct[];
}

export default function CantinaPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [cantina, setCantina] = useState<CantinaDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/cantine/${slug}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setCantina(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse">
          <div className="h-48 bg-gray-100 rounded-xl mb-8" />
          <div className="h-6 bg-gray-100 rounded w-1/3 mb-4" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="aspect-square bg-gray-100 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!cantina) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-xl font-bold text-[#1a1a1a] mb-2">Cantina non trovata</h1>
        <p className="text-sm text-gray-500 mb-6">La cantina che cerchi non è disponibile.</p>
        <Link href="/cantine" className="inline-flex items-center gap-2 px-6 py-3 bg-[#005667] text-white font-semibold rounded-xl hover:bg-[#004555] transition-colors">
          Vedi tutte le cantine
        </Link>
      </div>
    );
  }

  const hasProducts = cantina.products.length > 0;
  const heroImage = cantina.banner || cantina.products[0]?.images?.[0]?.src || null;

  return (
    <div className="bg-[#f8f6f1] min-h-screen">
      {/* Hero */}
      <div className="relative h-56 sm:h-64 bg-gradient-to-br from-[#005667] to-[#003d4a] overflow-hidden">
        {heroImage && (
          <Image src={heroImage} alt={cantina.name} fill className="object-cover opacity-30" sizes="100vw" />
        )}
        <div className="absolute inset-0 flex items-end pb-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <nav className="text-[12px] text-white/60 mb-3">
              <Link href="/" className="hover:text-white/80">Home</Link>
              <span className="mx-1.5">/</span>
              <Link href="/cantine" className="hover:text-white/80">Cantine</Link>
              <span className="mx-1.5">/</span>
              <span className="text-white/90">{cantina.name}</span>
            </nav>

            <div className="flex items-center gap-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-white shadow-lg flex items-center justify-center shrink-0 overflow-hidden">
                {cantina.image ? (
                  <Image src={cantina.image} alt={cantina.name} width={96} height={96} className="object-contain p-2" />
                ) : (
                  <span className="text-3xl sm:text-4xl font-bold text-[#005667]">{cantina.name.charAt(0)}</span>
                )}
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">{cantina.name}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {cantina.region && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-white/15 backdrop-blur rounded-full text-[12px] text-white font-medium">
                      📍 {cantina.region}
                    </span>
                  )}
                  <span className="text-[12px] text-white/60">{cantina.count} {cantina.count === 1 ? 'vino' : 'vini'}</span>
                </div>
                {cantina.address && (
                  <p className="text-[11px] text-white/50 mt-1">{cantina.address}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Description */}
        {cantina.description && (
          <div className="mb-8 max-w-3xl">
            <p className="text-[14px] text-[#666] leading-relaxed">{cantina.description}</p>
          </div>
        )}

        {/* Products */}
        <h2 className="text-[18px] font-semibold text-[#1a1a1a] mb-5">
          I vini di {cantina.name}
        </h2>

        {hasProducts ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {cantina.products.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500">I prodotti di questa cantina saranno disponibili a breve.</p>
            <Link href="/cantine" className="text-[13px] text-[#005667] font-medium hover:underline mt-3 inline-block">
              ← Torna alle cantine
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
