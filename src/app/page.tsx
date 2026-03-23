import Link from 'next/link';
import Image from 'next/image';
import { api, type WCProduct, type WCCategory, decodeHtml, formatPrice, getDiscount, getProduttore } from '@/lib/api';
import ProductCarousel from '@/components/ProductCarousel';

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

const TRUST_ITEMS = [
  { icon: 'M13 10V3L4 14h7v7l9-11h-7z', title: 'Spedizione 24-48h', subtitle: 'Consegna rapida in tutta Italia' },
  { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', title: 'Pagamento sicuro', subtitle: '100% protetto e garantito' },
  { icon: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z', title: 'Assistenza dedicata', subtitle: 'Sempre disponibili per te' },
  { icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z', title: '4.6/5 Recensioni', subtitle: 'Clienti soddisfatti' },
];

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
      {/* ═══ HERO — Blog post ═══ */}
      <section className="relative mx-4 sm:mx-6 lg:mx-auto lg:max-w-7xl mt-4 rounded-2xl overflow-hidden h-56 sm:h-72 lg:h-96">
        {latestPost?._embedded?.['wp:featuredmedia']?.[0]?.source_url ? (
          <Image src={latestPost._embedded['wp:featuredmedia'][0].source_url} alt="Blog" fill className="object-cover" priority />
        ) : (
          <div className="absolute inset-0 bg-[#055667]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent flex flex-col justify-end p-6 sm:p-10 lg:p-14">
          <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 self-start mb-3">
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">📰 Dal Blog</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-4xl font-extrabold text-white leading-tight max-w-2xl line-clamp-3">
            {latestPost ? decodeHtml(latestPost.title.rendered) : "Vini italiani d'eccellenza"}
          </h1>
          <Link
            href={latestPost ? `/blog/${latestPost.slug}` : '/blog'}
            className="inline-flex items-center gap-2 bg-white text-[#055667] font-bold text-sm px-6 py-3 rounded-full self-start mt-5 hover:shadow-xl transition-all hover:scale-105"
          >
            LEGGI L&apos;ARTICOLO
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </Link>
        </div>
      </section>

      {/* ═══ I CONSIGLIATI — subito dopo hero ═══ */}
      {circuito.length > 0 && (
        <section className="mt-8 mx-4 sm:mx-6 lg:mx-auto lg:max-w-7xl">
          <div className="bg-gradient-to-br from-[#faf8f2] to-[#f5f0e3] rounded-2xl border border-[#d4c89a] overflow-hidden shadow-sm">
            <div className="flex items-center justify-center gap-3 py-4 border-b border-[#e8dfc4]">
              <span className="text-[#b8973f] text-xl">★</span>
              <h2 className="text-lg sm:text-xl font-bold text-[#5c4f35] tracking-wide">I Consigliati da Stappando</h2>
              <span className="text-[#b8973f] text-xl">★</span>
            </div>
            <div className="grid grid-cols-2 divide-x divide-[#e8dfc4]">
              {circuito.slice(0, 2).map((product) => (
                <ConsigliatiCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ DI TENDENZA — grande e visibile ═══ */}
      {trendingCategories.length > 0 && (
        <section className="mt-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-[#055667] flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Di tendenza</h2>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-4">
            {trendingCategories.map((cat) => (
              <Link key={cat.id} href={`/categoria/${cat.slug}`} className="group flex flex-col items-center">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-3 border-[#055667] overflow-hidden bg-gray-50 group-hover:border-[#b8973f] group-hover:shadow-lg transition-all">
                  {cat.image?.src ? (
                    <Image src={cat.image.src} alt={cat.name} width={96} height={96} className="object-cover w-full h-full group-hover:scale-110 transition-transform" />
                  ) : (
                    <div className="w-full h-full bg-[#055667] flex items-center justify-center">
                      <span className="text-white text-2xl">🍷</span>
                    </div>
                  )}
                </div>
                <span className="text-xs sm:text-sm font-bold text-gray-800 text-center mt-2 leading-tight line-clamp-2">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ═══ I PIÙ VENDUTI — sopra categorie ═══ */}
      {bestSellers.length > 0 && (
        <section className="mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#b8973f] flex items-center justify-center">
                  <span className="text-white text-lg">🏆</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">I più venduti</h2>
              </div>
              <Link href="/cerca" className="text-sm font-bold text-[#055667] hover:underline">Vedi tutti →</Link>
            </div>
          </div>
          <ProductCarousel products={bestSellers} />
        </section>
      )}

      {/* ═══ PROMO ═══ */}
      {promoProducts.length > 0 && (
        <section className="mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                  <span className="text-white text-lg">🔥</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Offerte</h2>
              </div>
              <Link href="/cerca?on_sale=true" className="text-sm font-bold text-[#055667] hover:underline">Vedi tutte →</Link>
            </div>
          </div>
          <ProductCarousel products={promoProducts} />
        </section>
      )}

      {/* ═══ CATEGORIE ═══ */}
      {gridCats.length > 0 && (
        <section className="mt-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-6">Esplora per categoria</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {gridCats.map((cat) => (
              <Link key={cat.id} href={`/categoria/${cat.slug}`} className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100">
                {cat.image?.src ? (
                  <Image src={cat.image.src} alt={cat.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <span className="text-4xl">🍷</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 inset-x-0 p-4">
                  <p className="text-base font-bold text-white">{cat.name}</p>
                  <p className="text-xs text-white/70">{cat.count} prodotti</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ═══ DIVENTA HOST / VENDI CON NOI ═══ */}
      <section className="mt-12 mx-4 sm:mx-6 lg:mx-auto lg:max-w-7xl">
        <div className="relative rounded-2xl overflow-hidden">
          <Image
            src="https://stappando.it/wp-content/uploads/2021/07/vini-unsplash-scaled.jpg"
            alt="Vendi con noi"
            width={1200}
            height={400}
            className="w-full h-48 sm:h-56 lg:h-64 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#055667]/95 to-[#055667]/70 flex items-center">
            <div className="px-8 sm:px-12 lg:px-16 max-w-2xl">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">Vendi i tuoi vini su Stappando</h2>
              <p className="text-white/80 text-sm sm:text-base mb-5">Raggiungi migliaia di appassionati di vino. Unisciti al marketplace di enocultura italiano.</p>
              <a
                href="https://stappando.it/vendor-register/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#b8973f] text-white font-bold text-sm px-6 py-3 rounded-full hover:bg-[#a07f30] transition-colors"
              >
                DIVENTA VENDITORE
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ TRUST ═══ */}
      <section className="mt-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {TRUST_ITEMS.map((item, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 text-center hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-full bg-[#055667]/10 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-7 h-7 text-[#055667]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">{item.title}</h3>
              <p className="text-xs text-gray-500">{item.subtitle}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ SCARICA L'APP ═══ */}
      <section className="mt-12 mx-4 sm:mx-6 lg:mx-auto lg:max-w-7xl">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 sm:p-10 lg:p-12 flex flex-col sm:flex-row items-center gap-6">
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">Stappando nel tuo telefono</h2>
            <p className="text-white/70 text-sm sm:text-base mb-6">Ordina i migliori vini italiani ovunque tu sia. Scarica l&apos;app gratuita.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center sm:justify-start">
              <a href="https://apps.apple.com/it/app/stappando/id1553885938" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 bg-white text-gray-900 px-6 py-3 rounded-xl font-bold text-sm hover:shadow-lg transition-all hover:scale-105">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                App Store
              </a>
              <a href="https://play.google.com/store/apps/details?id=it.stappando.enocultura" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 bg-white text-gray-900 px-6 py-3 rounded-xl font-bold text-sm hover:shadow-lg transition-all hover:scale-105">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.302 2.302a1 1 0 010 1.38l-2.302 2.302L15.396 13l2.302-2.492zM5.864 2.658L16.8 8.99l-2.302 2.302L5.864 2.658z"/></svg>
                Google Play
              </a>
            </div>
          </div>
          <div className="shrink-0 hidden lg:block">
            <div className="w-32 h-56 bg-gray-700 rounded-3xl border-4 border-gray-600 flex items-center justify-center">
              <Image src="/logo.png" alt="Stappando App" width={80} height={20} className="opacity-80" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ BLOG CTA ═══ */}
      <section className="mt-10 mx-4 sm:mx-6 lg:mx-auto lg:max-w-7xl">
        <Link href="/blog" className="block bg-[#055667] rounded-2xl p-5 sm:p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center shrink-0">
              <span className="text-2xl">📰</span>
            </div>
            <div className="flex-1">
              <p className="text-base font-bold text-white">Il Blog di Stappando</p>
              <p className="text-sm text-white/70">Abbinamenti, consigli e novità dal mondo del vino</p>
            </div>
            <svg className="w-6 h-6 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </div>
        </Link>
      </section>

      <div className="h-12" />
    </div>
  );
}

function ConsigliatiCard({ product }: { product: WCProduct }) {
  const produttore = getProduttore(product);
  const discount = getDiscount(product);
  const vendorName = product._vendorName || product.store?.name;

  return (
    <Link href={`/prodotto/${product.slug}`} className="group flex flex-col hover:bg-[#f5f0e3] transition-colors">
      <div className="relative aspect-square bg-gradient-to-b from-[#faf8f2] to-white overflow-hidden">
        {product.images[0]?.src && (
          <Image src={product.images[0].src} alt={decodeHtml(product.name)} fill className="object-contain p-4 group-hover:scale-110 transition-transform duration-500" sizes="(max-width: 768px) 50vw, 300px" />
        )}
        {discount > 0 && (
          <div className="absolute top-3 left-3 w-10 h-10 rounded-full bg-red-500 flex items-center justify-center shadow-md">
            <span className="text-white text-[10px] font-bold">-{discount}%</span>
          </div>
        )}
      </div>
      <div className="p-4">
        {produttore && <p className="text-[10px] font-bold text-[#b8973f] uppercase tracking-wider">{produttore}</p>}
        <h3 className="text-sm font-bold text-[#3d3424] line-clamp-2 leading-snug mt-1">{decodeHtml(product.name)}</h3>
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-lg font-extrabold text-[#055667]">{formatPrice(product.price)} &euro;</span>
          {product.on_sale && product.regular_price && (
            <span className="text-xs text-gray-400 line-through">{formatPrice(product.regular_price)} &euro;</span>
          )}
        </div>
        {vendorName && (
          <p className="text-[10px] text-[#8a7a52] mt-1">Venduto e spedito da {vendorName}</p>
        )}
      </div>
    </Link>
  );
}
