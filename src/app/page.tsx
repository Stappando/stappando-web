import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { type WCProduct, type WCCategory, decodeHtml } from '@/lib/api';
import { API_CONFIG, DEFAULT_VENDOR_NAME } from '@/lib/config';
import { getCachedProducts, getCachedCategories } from '@/lib/cached';
import ProductCard from '@/components/ProductCard';
import HeroSection from '@/components/HeroSection';

const EXCLUDED_SLUGS = new Set(['uncategorized', 'altri-prodotti']);

function filterCategories(cats: WCCategory[]): WCCategory[] {
  return cats.filter(
    (c) =>
      !EXCLUDED_SLUGS.has(c.slug) &&
      !c.slug.includes('regalo') &&
      !c.slug.includes('scatol') &&
      !c.name.toLowerCase().includes('regalo') &&
      !c.name.toLowerCase().includes('scatol') &&
      c.count > 0,
  );
}

/* ── Skeletons ────────────────────────────────────────── */

function GridSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <div className={`grid grid-cols-2 lg:grid-cols-${cols} gap-3`}>
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="h-[320px] rounded-xl bg-gray-100 animate-pulse" />
      ))}
    </div>
  );
}

function CatSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-[120px] rounded-[10px] bg-gray-100 animate-pulse" />
      ))}
    </div>
  );
}

/* ── Hero with circuito data ──────────────────────────── */

async function HeroWithData() {
  const circuito = await getCachedProducts({
    per_page: 6,
    tag: String(API_CONFIG.tags.circuito),
    orderby: 'popularity',
  }).catch(() => [] as WCProduct[]);

  return <HeroSection circuitoProducts={circuito} />;
}

/* ── 1. Best Sellers ──────────────────────────────────── */

async function BestSellers() {
  const products = await getCachedProducts({
    per_page: 8,
    tag: String(API_CONFIG.tags.bestSeller),
    orderby: 'popularity',
  }).catch(() => [] as WCProduct[]);

  if (products.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-[20px] font-semibold text-[#1a1a1a]">I più venduti</h2>
        <Link href="/cerca?sort=bestseller" className="text-[12px] font-medium text-[#005667] hover:underline">
          Vedi tutti →
        </Link>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {products.slice(0, 8).map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

/* ── 2. Dai piccoli produttori ─────────────────────────── */

async function PiccoliProduttori() {
  const [bestSellers, allRecent] = await Promise.all([
    getCachedProducts({
      per_page: 8,
      tag: String(API_CONFIG.tags.bestSeller),
      orderby: 'popularity',
    }).catch(() => [] as WCProduct[]),
    getCachedProducts({
      per_page: 30,
      orderby: 'date',
      order: 'desc',
    }).catch(() => [] as WCProduct[]),
  ]);

  const bestSellerIds = new Set(bestSellers.map(p => p.id));

  const products = allRecent
    .filter(p => {
      const vendor = p._vendorName || p.store?.name || DEFAULT_VENDOR_NAME;
      return vendor !== DEFAULT_VENDOR_NAME && !bestSellerIds.has(p.id);
    })
    .slice(0, 8);

  if (products.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-[20px] font-semibold text-[#1a1a1a]">Dai piccoli produttori</h2>
        <Link href="/cantine" className="text-[12px] font-medium text-[#005667] hover:underline">
          Scopri tutte le cantine →
        </Link>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

/* ── 3. Esplora per categoria ─────────────────────────── */

async function CategoryGrid() {
  const [cats, subCats] = await Promise.all([
    getCachedCategories({ per_page: 50, hide_empty: 1, parent: 0 }).catch(() => [] as WCCategory[]),
    getCachedCategories({ per_page: 50, hide_empty: 1, parent: 5347 }).catch(() => [] as WCCategory[]),
  ]);

  const allCats = [...(subCats.length > 0 ? subCats : []), ...cats.filter((c) => c.slug !== 'vini')];
  const gridCats = filterCategories(allCats).slice(0, 8);

  if (gridCats.length === 0) return null;

  return (
    <section>
      <h2 className="text-[20px] font-semibold text-[#1a1a1a] mb-5">Esplora per categoria</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {gridCats.map((cat) => (
          <Link
            key={cat.id}
            href={`/categoria/${cat.slug}`}
            className="group relative h-[120px] rounded-[10px] overflow-hidden bg-gray-100"
          >
            {cat.image?.src ? (
              <Image
                src={cat.image.src}
                alt={cat.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 640px) 50vw, 25vw"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-[#005667]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 inset-x-0 p-3">
              <p className="text-[13px] font-bold text-white">{cat.name}</p>
              <p className="text-[10px] text-white/70">{cat.count} prodotti</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ── 4. App Banner ────────────────────────────────────── */

function AppBanner() {
  return (
    <section>
      <div className="rounded-xl bg-[#005667] overflow-hidden">
        <div className="flex items-center">
          <div className="flex-1 p-6 sm:p-8">
            <p className="text-[#d9c39a] text-[11px] font-bold uppercase tracking-widest mb-2">Scarica l&apos;app</p>
            <h2 className="text-[22px] font-semibold text-white mb-2">Stappando nel tuo telefono</h2>
            <p className="text-[13px] text-white/70 mb-5">
              Riordina in un tap · Tracking live · Punti POP
            </p>
            <div className="flex gap-3">
              <a href="https://apps.apple.com/it/app/stappando/id1553885938" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2.5 bg-black text-white px-4 py-2.5 rounded-lg hover:bg-gray-900 transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                <div className="text-left"><p className="text-[8px] leading-none">Scarica su</p><p className="text-[11px] font-bold leading-tight">App Store</p></div>
              </a>
              <a href="https://play.google.com/store/apps/details?id=it.stappando.enocultura" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2.5 bg-black text-white px-4 py-2.5 rounded-lg hover:bg-gray-900 transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.302 2.302a1 1 0 010 1.38l-2.302 2.302L15.396 13l2.302-2.492zM5.864 2.658L16.8 8.99l-2.302 2.302L5.864 2.658z"/></svg>
                <div className="text-left"><p className="text-[8px] leading-none">Disponibile su</p><p className="text-[11px] font-bold leading-tight">Google Play</p></div>
              </a>
            </div>
          </div>
          {/* Phone icon — desktop only */}
          <div className="hidden md:flex items-center justify-center pr-8">
            <svg className="w-20 h-20 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── 5. Blog link ─────────────────────────────────────── */

function BlogLink() {
  return (
    <section>
      <Link href="/blog" className="flex items-center justify-between bg-[#f0ece4] rounded-[10px] px-5 py-[14px] hover:bg-[#e8e2d8] transition-colors group">
        <div>
          <p className="text-[13px] font-semibold text-[#1a1a1a]">Il Blog di Stappando</p>
          <p className="text-[11px] text-[#888]">Abbinamenti, consigli e novità</p>
        </div>
        <svg className="w-5 h-5 text-[#005667] shrink-0 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </section>
  );
}

/* ── Main Page ────────────────────────────────────────── */

export default function HomePage() {
  return (
    <div className="bg-[#f8f6f1]">
      {/* Hero */}
      <Suspense fallback={<div className="bg-[#f8f6f1]"><div className="max-w-7xl mx-auto px-4 sm:px-10 py-10"><div className="h-64 lg:h-80 animate-pulse rounded-xl bg-[#efe9dc]" /></div></div>}>
        <HeroWithData />
      </Suspense>

      {/* Below the fold — consistent padding and spacing */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 space-y-10 pb-10">
        {/* 1. Best Sellers */}
        <Suspense fallback={<GridSkeleton />}>
          <BestSellers />
        </Suspense>

        {/* 2. Dai piccoli produttori */}
        <Suspense fallback={<GridSkeleton />}>
          <PiccoliProduttori />
        </Suspense>

        {/* 3. Category Grid */}
        <Suspense fallback={<CatSkeleton />}>
          <CategoryGrid />
        </Suspense>

        {/* 4. App Banner */}
        <AppBanner />

        {/* 5. Blog */}
        <BlogLink />
      </div>
    </div>
  );
}
