import Link from 'next/link';
import Image from 'next/image';
import { api, type WCProduct, type WCCategory, decodeHtml, formatPrice, getDiscount, getProduttore } from '@/lib/api';
import ProductCarousel from '@/components/ProductCarousel';
import PlusBar from '@/components/PlusBar';

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

export default async function HomePage() {
  const [promoProducts, bestSellers, cats, subCats, latestPost, circuito] = await Promise.all([
    api.getProducts({ per_page: 10, on_sale: 'true', orderby: 'popularity' }).catch(() => [] as WCProduct[]),
    api.getProducts({ per_page: 10, orderby: 'popularity' }).catch(() => [] as WCProduct[]),
    api.getCategories({ per_page: 50, hide_empty: 1, parent: 0 }).catch(() => [] as WCCategory[]),
    api.getCategories({ per_page: 50, hide_empty: 1, parent: 5347 }).catch(() => [] as WCCategory[]),
    api.getLatestPost(),
    api.getProducts({ per_page: 2, include: '69890,69817' }).catch(() => [] as WCProduct[]),
  ]);

  const allCategories = [...(subCats.length > 0 ? subCats : []), ...cats.filter((c) => c.slug !== 'vini' && c.slug !== 'uncategorized' && c.slug !== 'altri-prodotti')];
  const trendingCategories = TRENDING_IDS.map((id) => allCategories.find((c) => c.id === id)).filter(Boolean) as WCCategory[];
  const gridCats = filterGridCategories(allCategories);

  return (
    <div>
      {/* ═══ ROW 1: BANNER + CONSIGLIATI ═══ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Banner blog — 3/5 */}
          <div className="lg:col-span-3 relative rounded-2xl overflow-hidden h-52 sm:h-64 lg:h-80">
            {latestPost?._embedded?.['wp:featuredmedia']?.[0]?.source_url ? (
              <Image src={latestPost._embedded['wp:featuredmedia'][0].source_url} alt="Blog" fill className="object-cover" priority />
            ) : (
              <div className="absolute inset-0 bg-[#055667]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent flex flex-col justify-end p-6 lg:p-8">
              <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider mb-2">Dal Blog</span>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-extrabold text-white leading-tight max-w-lg line-clamp-2">
                {latestPost ? decodeHtml(latestPost.title.rendered) : "Vini italiani d'eccellenza"}
              </h2>
              <Link href={latestPost ? `/blog/${latestPost.slug}` : '/blog'} className="inline-flex items-center gap-2 bg-white text-[#055667] font-bold text-xs px-4 py-2 rounded-full self-start mt-3 hover:shadow-lg transition-all">
                LEGGI
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </Link>
            </div>
          </div>

          {/* Consigliati — 2/5 con più risalto */}
          <div className="lg:col-span-2 rounded-2xl overflow-hidden bg-[#1a1a1a] flex flex-col">
            <div className="flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-[#b8973f] to-[#d4af5a]">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
              <span className="text-sm font-bold text-white tracking-wide">I Consigliati</span>
            </div>
            <div className="flex-1 flex flex-col divide-y divide-white/10">
              {circuito.slice(0, 2).map((product) => {
                const produttore = getProduttore(product);
                const discount = getDiscount(product);
                return (
                  <Link key={product.id} href={`/prodotto/${product.slug}`} className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors flex-1">
                    <div className="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-white">
                      {product.images[0]?.src && (
                        <Image src={product.images[0].src} alt={decodeHtml(product.name)} fill className="object-contain p-1.5" sizes="80px" />
                      )}
                      {discount > 0 && (
                        <div className="absolute top-0 right-0 bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-bl-lg">-{discount}%</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      {produttore && <p className="text-[10px] font-bold text-[#b8973f] uppercase tracking-wider">{produttore}</p>}
                      <p className="text-sm font-semibold text-white line-clamp-2 leading-tight mt-0.5">{decodeHtml(product.name)}</p>
                      <div className="flex items-baseline gap-2 mt-1.5">
                        <span className="text-lg font-extrabold text-[#b8973f]">{formatPrice(product.price)} &euro;</span>
                        {product.on_sale && product.regular_price && (
                          <span className="text-xs text-white/40 line-through">{formatPrice(product.regular_price)} &euro;</span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ PLUS — subito dopo banner ═══ */}
      <PlusBar />

      {/* ═══ I PIÙ VENDUTI ═══ */}
      {bestSellers.length > 0 && (
        <section className="mt-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5 mb-4">
            <svg className="w-5 h-5 text-[#b8973f]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
            <h2 className="text-xl font-extrabold text-gray-900">I più venduti</h2>
          </div>
          <ProductCarousel products={bestSellers} />
        </section>
      )}

      {/* ═══ DI TENDENZA — immagini grandi, full width ═══ */}
      {trendingCategories.length > 0 && (
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
                    <Image src={cat.image.src} alt={cat.name} width={300} height={300} className="object-cover w-full h-full" />
                  ) : (
                    <div className="w-full h-full bg-[#055667]" />
                  )}
                </div>
                <p className="text-xs font-semibold text-gray-800 mt-1.5 leading-tight line-clamp-1">{cat.name}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ═══ OFFERTE ═══ */}
      {promoProducts.length > 0 && (
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
      )}

      {/* ═══ CATEGORIE ═══ */}
      {gridCats.length > 0 && (
        <section className="mt-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5 mb-5">
            <svg className="w-5 h-5 text-[#055667]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            <h2 className="text-xl font-extrabold text-gray-900">Esplora per categoria</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {gridCats.map((cat) => (
              <Link key={cat.id} href={`/categoria/${cat.slug}`} className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100">
                {cat.image?.src ? (
                  <Image src={cat.image.src} alt={cat.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" />
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
      )}

      {/* ═══ SCARICA APP ═══ */}
      <section className="mt-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl overflow-hidden bg-[#055667]">
          <div className="flex items-center">
            {/* Testo */}
            <div className="flex-1 p-6 sm:p-8 lg:p-10">
              <p className="text-[#b8973f] text-xs font-bold uppercase tracking-widest mb-2">Scarica l&apos;app</p>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white mb-3">Stappando nel tuo telefono</h2>
              <ul className="space-y-2 mb-5">
                <li className="flex items-center gap-2 text-white/80 text-sm"><svg className="w-4 h-4 text-[#b8973f] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Tieni sotto controllo i tuoi ordini</li>
                <li className="flex items-center gap-2 text-white/80 text-sm"><svg className="w-4 h-4 text-[#b8973f] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Riordina i tuoi vini preferiti in un tap</li>
                <li className="flex items-center gap-2 text-white/80 text-sm"><svg className="w-4 h-4 text-[#b8973f] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Tracking consegna in tempo reale</li>
                <li className="flex items-center gap-2 text-white/80 text-sm"><svg className="w-4 h-4 text-[#b8973f] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Accumula Punti POP e molto altro</li>
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
            {/* iPhone mockup */}
            <div className="hidden md:flex items-end pr-8 lg:pr-12">
              <div className="relative w-44 lg:w-52">
                <div className="relative bg-black rounded-[2rem] p-2 shadow-2xl">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-b-2xl z-10" />
                  <div className="rounded-[1.5rem] overflow-hidden bg-white aspect-[9/19]">
                    <Image src="/logo.png" alt="Stappando App" width={200} height={50} className="w-3/4 mx-auto mt-16" />
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

      {/* ═══ VENDI CON NOI + BLOG — compact bars ═══ */}
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

      <div className="h-10" />
    </div>
  );
}
