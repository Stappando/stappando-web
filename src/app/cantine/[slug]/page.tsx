'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import { type WCProduct, decodeHtml } from '@/lib/api';

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
      <div className="bg-[#f8f6f1] min-h-screen">
        <div className="animate-pulse">
          <div className="h-64 sm:h-80 bg-gradient-to-br from-[#005667] to-[#003d4a]" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="h-5 bg-gray-200 rounded w-1/4 mb-6" />
            <div className="h-16 bg-gray-100 rounded-xl mb-8" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="bg-white rounded-xl overflow-hidden">
                  <div className="aspect-square bg-gray-100" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-2/3" />
                    <div className="h-4 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!cantina) {
    return (
      <div className="bg-[#f8f6f1] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#005667]/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-[#005667]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-[#1a1a1a] mb-2">Cantina non trovata</h1>
          <p className="text-sm text-gray-500 mb-6">La cantina che cerchi non è disponibile.</p>
          <Link href="/cantine" className="inline-flex items-center gap-2 px-6 py-3 bg-[#005667] text-white font-semibold rounded-xl hover:bg-[#004555] transition-colors">
            ← Tutte le cantine
          </Link>
        </div>
      </div>
    );
  }

  const hasProducts = cantina.products.length > 0;
  const hasBanner = !!cantina.banner;
  const hasLogo = !!cantina.image;

  return (
    <div className="bg-[#f8f6f1] min-h-screen">
      {/* ── Hero ───────────────────────────────── */}
      <div className="relative overflow-hidden">
        {/* Banner image or gradient */}
        <div className={`relative ${hasBanner ? 'h-56 sm:h-72 lg:h-80' : 'h-48 sm:h-56'}`}>
          {hasBanner ? (
            <>
              <Image src={cantina.banner!} alt={cantina.name} fill className="object-cover" sizes="100vw" priority />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#005667] via-[#00768a] to-[#003d4a]">
              {/* Decorative pattern */}
              <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23fff\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'30\' cy=\'30\' r=\'2\'/%3E%3C/g%3E%3C/svg%3E")', backgroundSize: '30px 30px' }} />
            </div>
          )}

          {/* Content overlay */}
          <div className="absolute inset-0 flex items-end">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-6 sm:pb-8">
              {/* Breadcrumb */}
              <nav className="text-[12px] text-white/60 mb-4">
                <Link href="/" className="hover:text-white/80 transition-colors">Home</Link>
                <span className="mx-1.5">/</span>
                <Link href="/cantine" className="hover:text-white/80 transition-colors">Cantine</Link>
                <span className="mx-1.5">/</span>
                <span className="text-white/90 font-medium">{decodeHtml(cantina.name)}</span>
              </nav>

              <div className="flex items-end gap-4 sm:gap-5">
                {/* Logo */}
                <div className={`${hasLogo ? 'w-20 h-20 sm:w-28 sm:h-28' : 'w-16 h-16 sm:w-20 sm:h-20'} rounded-2xl bg-white shadow-xl flex items-center justify-center shrink-0 overflow-hidden ring-2 ring-white/20`}>
                  {hasLogo ? (
                    <Image src={cantina.image!} alt={cantina.name} width={112} height={112} className="object-contain p-2.5" />
                  ) : (
                    <span className="text-3xl sm:text-4xl font-bold text-[#005667]">{cantina.name.charAt(0)}</span>
                  )}
                </div>

                {/* Name + meta */}
                <div className="pb-0.5">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight drop-shadow-sm">
                    {decodeHtml(cantina.name)}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {cantina.region && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-sm rounded-full text-[12px] text-white font-semibold tracking-wide">
                        📍 {cantina.region}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-[12px] text-white/80">
                      🍷 {cantina.count} {cantina.count === 1 ? 'vino' : 'vini'}
                    </span>
                  </div>
                  {cantina.address && (
                    <p className="text-[12px] text-white/50 mt-2 flex items-center gap-1">
                      <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {cantina.address}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Description */}
        {cantina.description && (
          <div className="mb-6 max-w-3xl pt-6">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#005667] mb-2">La cantina</h2>
            <p className="text-[14px] text-[#555] leading-relaxed">{decodeHtml(cantina.description)}</p>
          </div>
        )}

        {/* Products section */}
        <div className="py-6 pb-16">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[18px] sm:text-[20px] font-bold text-[#1a1a1a]">
              I vini di {decodeHtml(cantina.name)}
            </h2>
            {hasProducts && (
              <span className="text-[12px] text-[#999] font-medium">
                {cantina.products.length} {cantina.products.length === 1 ? 'prodotto' : 'prodotti'}
              </span>
            )}
          </div>

          {hasProducts ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {cantina.products.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#005667]/5 flex items-center justify-center">
                <span className="text-2xl">🍷</span>
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">Prodotti in arrivo</p>
              <p className="text-[13px] text-gray-400 mb-5">I vini di questa cantina saranno disponibili a breve.</p>
              <Link href="/cantine" className="text-[13px] text-[#005667] font-semibold hover:underline">
                ← Esplora altre cantine
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
