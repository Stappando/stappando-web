import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { type WCProduct, type WCCategory, decodeHtml, formatPrice, getDiscount, getProduttore } from '@/lib/api';
import { API_CONFIG } from '@/lib/config';
import { getCachedProducts, getCachedCategories } from '@/lib/cached';
import ProductCarousel from '@/components/ProductCarousel';
import HeroSection from '@/components/HeroSection';

const TRENDING_IDS = [5202, 5203, 1397, 4448, 4447, 4449, 5204, 5205];
const EXCLUDED_IDS = new Set([...TRENDING_IDS, 18243, 5347, 19461]);

function filterGridCategories(cats: WCCategory[]): WCCategory[] {
  return cats.filter(
    (c) =>
      !EXCLUDED_IDS.has(c.id) &&
      c.slug !== 'uncategorized' &&
      c.slug !== 'altri-prodotti' &&
      !c.slug.includes('regalo') &&
      !c.slug.includes('scatol') &&
      !c.name.toLowerCase().includes('regalo') &&
      !c.name.toLowerCase().includes('scatol'),
  );
}

/* ── Skeleton components for streaming ────────────────── */

function CarouselSkeleton() {
  return (
    <div className="flex gap-3 overflow-hidden">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="w-[170px] sm:w-[195px] shrink-0">
          <div className="rounded-2xl bg-gray-100 animate-pulse aspect-square" />
          <div className="mt-2 h-3 bg-gray-100 rounded animate-pulse w-3/4" />
          <div className="mt-1.5 h-4 bg-gray-100 rounded animate-pulse w-1/2" />
        </div>
      ))}
    </div>
  );
}

function CategoriesSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i}>
          <div className="aspect-square rounded-xl bg-gray-100 animate-pulse" />
          <div className="mt-1.5 h-3 bg-gray-100 rounded animate-pulse w-2/3" />
        </div>
      ))}
    </div>
  );
}

/* ── Hero with circuito products (server component) ───── */

async function HeroWithData() {
  const circuito = await getCachedProducts({
    per_page: 6,
    tag: String(API_CONFIG.tags.circuito),
    orderby: 'popularity',
  }).catch(() => [] as WCProduct[]);

  return <HeroSection circuitoProducts={circuito} />;
}

/* ── Async section components (stream independently) ──── */

async function BestSellers() {
  const bestSellers = await getCachedProducts({ per_page: 10, orderby: 'popularity' }).catch(() => [] as WCProduct[]);
  if (bestSellers.length === 0) return null;

  return (
    <section className="mt-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2.5 mb-4">
        <svg className="w-5 h-5 text-[#b8973f]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
        <h2 className="text-xl font-extrabold text-gray-900">I più venduti</h2>
      </div>
      <ProductCarousel products={bestSellers} />
    </section>
  );
}

async function TrendingCategories() {
  const [cats, subCats] = await Promise.all([
    getCachedCategories({ per_page: 50, hide_empty: 1, parent: 0 }).catch(() => [] as WCCategory[]),
    getCachedCategories({ per_page: 50, hide_empty: 1, parent: 5347 }).catch(() => [] as WCCategory[]),
  ]);

  const allCategories = [...(subCats.length > 0 ? subCats : []), ...cats.filter((c) => c.slug !== 'vini' && c.slug !== 'uncategorized' && c.slug !== 'altri-prodotti')];
  const trendingCategories = TRENDING_IDS.map((id) => allCategories.find((c) => c.id === id)).filter(Boolean) as WCCategory[];

  if (trendingCategories.length === 0) return null;

  return (
    <section className="mt-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2.5 mb-5">
        <svg className="w-5 h-5 text-[#055667]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
        <h2 className="text-xl font-extrabold text-gray-900">Di tendenza</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {trendingCategories.map((cat) => (
          <Link key={cat.id} href={`/categoria/${cat.slug}`} className="group">
            <div className="aspect-square rounded-xl overflow-hidden bg-gray-100">
              {cat.image?.src ? (
                <Image src={cat.image.src} alt={cat.name} width={300} height={300} className="object-cover w-full h-full" loading="lazy" />
              ) : (
                <div className="w-full h-full bg-[#055667]" />
              )}
            </div>
            <p className="text-xs font-semibold text-gray-800 mt-1.5 leading-tight line-clamp-1">{cat.name}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

async function Offerte() {
  const promoProducts = await getCachedProducts({ per_page: 10, on_sale: 'true', orderby: 'popularity' }).catch(() => [] as WCProduct[]);
  if (promoProducts.length === 0) return null;

  return (
    <section className="mt-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /></svg>
          <h2 className="text-xl font-extrabold text-gray-900">Offerte</h2>
        </div>
        <Link href="/cerca?on_sale=true" className="text-xs font-bold text-[#055667] hover:underline">Vedi tutte →</Link>
      </div>
      <ProductCarousel products={promoProducts} />
    </section>
  );
}

async function CategoryGrid() {
  const [cats, subCats] = await Promise.all([
    getCachedCategories({ per_page: 50, hide_empty: 1, parent: 0 }).catch(() => [] as WCCategory[]),
    getCachedCategories({ per_page: 50, hide_empty: 1, parent: 5347 }).catch(() => [] as WCCategory[]),
  ]);

  const allCategories = [...(subCats.length > 0 ? subCats : []), ...cats.filter((c) => c.slug !== 'vini' && c.slug !== 'uncategorized' && c.slug !== 'altri-prodotti')];
  const gridCats = filterGridCategories(allCategories);

  if (gridCats.length === 0) return null;

  return (
    <section className="mt-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2.5 mb-5">
        <svg className="w-5 h-5 text-[#055667]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
        <h2 className="text-xl font-extrabold text-gray-900">Esplora per categoria</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {gridCats.map((cat) => (
          <Link key={cat.id} href={`/categoria/${cat.slug}`} className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100">
            {cat.image?.src ? (
              <Image src={cat.image.src} alt={cat.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" loading="lazy" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" /></svg>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 inset-x-0 p-3">
              <p className="text-sm font-bold text-white">{cat.name}</p>
              <p className="text-[10px] text-white/70">{cat.count} prodotti</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ── Static sections ──────────────────────────────────── */

function AppBanner() {
  return (
    <section className="mt-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="rounded-2xl overflow-hidden bg-[#055667]">
        <div className="flex items-center">
          <div className="flex-1 p-6 sm:p-8 lg:p-10">
            <p className="text-[#b8973f] text-xs font-bold uppercase tracking-widest mb-2">Scarica l&apos;app</p>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white mb-3">Stappando nel tuo telefono</h2>
            <ul className="space-y-2 mb-5">
              {['Tieni sotto controllo i tuoi ordini', 'Riordina i tuoi vini preferiti in un tap', 'Tracking consegna in tempo reale', 'Accumula Punti POP e molto altro'].map((text) => (
                <li key={text} className="flex items-center gap-2 text-white/80 text-sm">
                  <svg className="w-4 h-4 text-[#b8973f] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  {text}
                </li>
              ))}
            </ul>
            <div className="flex gap-3">
              <a href="https://apps.apple.com/it/app/stappando/id1553885938" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2.5 bg-black text-white px-4 py-2.5 rounded-xl hover:bg-gray-900 transition-colors">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                <div className="text-left"><p className="text-[8px] leading-none">Scarica su</p><p className="text-xs font-bold leading-tight">App Store</p></div>
              </a>
              <a href="https://play.google.com/store/apps/details?id=it.stappando.enocultura" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2.5 bg-black text-white px-4 py-2.5 rounded-xl hover:bg-gray-900 transition-colors">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.302 2.302a1 1 0 010 1.38l-2.302 2.302L15.396 13l2.302-2.492zM5.864 2.658L16.8 8.99l-2.302 2.302L5.864 2.658z"/></svg>
                <div className="text-left"><p className="text-[8px] leading-none">Disponibile su</p><p className="text-xs font-bold leading-tight">Google Play</p></div>
              </a>
            </div>
          </div>
          <div className="hidden md:flex items-end pr-8 lg:pr-12">
            <div className="relative w-44 lg:w-52">
              <div className="relative bg-black rounded-[2rem] p-2 shadow-2xl">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-b-2xl z-10" />
                <div className="rounded-[1.5rem] overflow-hidden bg-white aspect-[9/19]">
                  <Image src="/logo.png" alt="Stappando App" width={200} height={50} className="w-3/4 mx-auto mt-16" loading="lazy" />
                  <div className="px-4 mt-6 space-y-2">
                    <div className="h-3 bg-gray-100 rounded-full w-full" />
                    <div className="h-3 bg-gray-100 rounded-full w-3/4" />
                    <div className="h-16 bg-[#055667]/10 rounded-xl mt-3" />
                    <div className="h-16 bg-[#b8973f]/10 rounded-xl" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function BottomBars() {
  return (
    <section className="mt-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
      <a href="https://stappando.it/vendor-register/" target="_blank" rel="noopener noreferrer" className="block bg-[#b8973f] rounded-xl p-4 hover:shadow-lg transition-shadow">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72" /></svg>
          <div className="flex-1">
            <p className="text-sm font-bold text-white">Vendi i tuoi vini su Stappando</p>
            <p className="text-[11px] text-white/70">Zero costi di attivazione, massima visibilità</p>
          </div>
          <svg className="w-4 h-4 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </div>
      </a>
      <Link href="/blog" className="block bg-[#055667] rounded-xl p-4 hover:shadow-lg transition-shadow">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          <div className="flex-1">
            <p className="text-sm font-bold text-white">Il Blog di Stappando</p>
            <p className="text-[11px] text-white/60">Abbinamenti, consigli e novità</p>
          </div>
          <svg className="w-4 h-4 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </div>
      </Link>
    </section>
  );
}

/* ── Main Page ────────────────────────────────────────── */

export default function HomePage() {
  return (
    <div>
      {/* Hero — above the fold */}
      <Suspense fallback={<div className="bg-[#f8f6f1]"><div className="max-w-7xl mx-auto px-4 sm:px-10 py-11"><div className="h-64 lg:h-80 animate-pulse rounded-xl bg-[#efe9dc]" /></div></div>}>
        <HeroWithData />
      </Suspense>

      {/* Best sellers */}
      <Suspense fallback={<div className="mt-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><CarouselSkeleton /></div>}>
        <BestSellers />
      </Suspense>

      {/* Trending categories */}
      <Suspense fallback={<div className="mt-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><CategoriesSkeleton /></div>}>
        <TrendingCategories />
      </Suspense>

      {/* Offerte */}
      <Suspense fallback={<div className="mt-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><CarouselSkeleton /></div>}>
        <Offerte />
      </Suspense>

      {/* Category grid */}
      <Suspense fallback={<div className="mt-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><CategoriesSkeleton /></div>}>
        <CategoryGrid />
      </Suspense>

      {/* Static sections */}
      <AppBanner />
      <BottomBars />

      <div className="h-10" />
    </div>
  );
}
