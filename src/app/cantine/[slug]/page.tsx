'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { DEFAULT_VENDOR_NAME } from '@/lib/config';
import ProductCard from '@/components/ProductCard';
import { type WCProduct } from '@/lib/api';

interface IndexEntry {
  i: number;
  s: string;
  n: string;
  N: string;
  p: string;
  r: string;
  l: string;
  o: boolean;
  v: string;
  g: string;
  t: string[];
  c: boolean;
  b: string;
  m: string;
}

interface CantinaData {
  name: string;
  regions: string[];
  productCount: number;
  heroImage: string | null;
}

export default function CantinaPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [cantina, setCantina] = useState<CantinaData | null>(null);
  const [products, setProducts] = useState<WCProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    // 1. Get cantina info from index
    fetch('/api/search/index')
      .then(r => r.json())
      .then((entries: IndexEntry[]) => {
        // Find all products from this vendor by matching slug
        const vendorEntries = entries.filter(e => {
          const v = e.v?.trim();
          if (!v || v === DEFAULT_VENDOR_NAME) return false;
          const vSlug = v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
          return vSlug === slug;
        });

        if (vendorEntries.length === 0) {
          setLoading(false);
          return;
        }

        const name = vendorEntries[0].v;
        const regions = [...new Set(vendorEntries.map(e => e.g).filter(Boolean))];
        const heroImage = vendorEntries.find(e => e.m)?.m || null;

        setCantina({ name, regions, productCount: vendorEntries.length, heroImage });

        // 2. Fetch full product data via search API
        fetch(`/api/search?q=${encodeURIComponent(name)}&limit=20`)
          .then(r => r.json())
          .then((results: { id: number; slug: string; name: string; price: string; regular_price: string; sale_price: string; image: string | null; vendor: string; region: string; on_sale: boolean; is_circuito: boolean; circuito_badge: string }[]) => {
            // Filter to only this vendor's products
            const vendorProducts = results.filter(r =>
              r.vendor.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') === slug,
            );

            // Map to WCProduct-like objects for ProductCard
            const mapped = vendorProducts.map(r => ({
              id: r.id,
              slug: r.slug,
              name: r.name,
              price: r.price,
              regular_price: r.regular_price,
              sale_price: r.sale_price,
              on_sale: r.on_sale,
              images: r.image ? [{ id: 0, src: r.image, alt: r.name }] : [],
              attributes: [
                ...(r.vendor ? [{ id: 0, name: 'Produttore', options: [r.vendor] }] : []),
                ...(r.region ? [{ id: 0, name: 'Regione', options: [r.region] }] : []),
              ],
              tags: r.is_circuito ? [{ id: 21993, name: 'circuito', slug: 'circuito' }] : [],
              meta_data: r.circuito_badge ? [{ key: '_circuito_badge', value: r.circuito_badge }] : [],
              _vendorName: r.vendor,
              _vendorId: 'vendor',
              store: { id: 0, name: r.vendor, url: '' },
              categories: [],
              description: '',
              short_description: '',
              status: 'publish',
            })) as unknown as WCProduct[];

            setProducts(mapped);
            setLoading(false);
          })
          .catch(() => setLoading(false));
      })
      .catch(() => setLoading(false));
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

  return (
    <div className="bg-[#f8f6f1] min-h-screen">
      {/* Hero */}
      <div className="relative h-48 sm:h-56 bg-gradient-to-br from-[#005667] to-[#003d4a] overflow-hidden">
        {cantina.heroImage && (
          <Image
            src={cantina.heroImage}
            alt={cantina.name}
            fill
            className="object-cover opacity-20"
            sizes="100vw"
          />
        )}
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            {/* Breadcrumb */}
            <nav className="text-[12px] text-white/60 mb-3">
              <Link href="/" className="hover:text-white/80">Home</Link>
              <span className="mx-1.5">/</span>
              <Link href="/cantine" className="hover:text-white/80">Cantine</Link>
              <span className="mx-1.5">/</span>
              <span className="text-white/90">{cantina.name}</span>
            </nav>

            {/* Logo placeholder + name */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-white shadow-lg flex items-center justify-center shrink-0">
                <span className="text-2xl sm:text-3xl font-bold text-[#005667]">{cantina.name.charAt(0)}</span>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">{cantina.name}</h1>
                <div className="flex items-center gap-3 mt-1">
                  {cantina.regions.length > 0 && (
                    <span className="text-[13px] text-[#d9c39a] font-medium">{cantina.regions.join(', ')}</span>
                  )}
                  <span className="text-[12px] text-white/60">{cantina.productCount} {cantina.productCount === 1 ? 'vino' : 'vini'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-[18px] font-semibold text-[#1a1a1a] mb-5">
          I vini di {cantina.name}
        </h2>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {products.map(p => (
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
