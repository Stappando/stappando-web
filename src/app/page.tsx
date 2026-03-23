import Link from 'next/link';
import Image from 'next/image';
import { api, type WCProduct, type WCCategory, decodeHtml, formatPrice, getDiscount, getProduttore } from '@/lib/api';
import ProductCarousel from '@/components/ProductCarousel';

const TRENDING_IDS = [5202, 5203, 1397, 4448, 4447, 4449];
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
      {/* Hero */}
      <section className="relative mx-4 sm:mx-6 lg:mx-auto lg:max-w-7xl mt-4 rounded-2xl overflow-hidden h-56 sm:h-72 lg:h-80">
        {latestPost?._embedded?.['wp:featuredmedia']?.[0]?.source_url ? (
          <Image
            src={latestPost._embedded['wp:featuredmedia'][0].source_url}
            alt="Blog post"
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-brand-primary" />
        )}
        <div className="absolute inset-0 bg-brand-primary/75 flex flex-col justify-center p-6 sm:p-10 lg:p-14">
          <div className="inline-flex items-center gap-1.5 bg-white/20 rounded-md px-2.5 py-1 self-start mb-3">
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">Dal Blog</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white leading-tight max-w-2xl line-clamp-3">
            {latestPost ? decodeHtml(latestPost.title.rendered) : "Vini italiani d'eccellenza"}
          </h1>
          <Link
            href={latestPost ? `/blog/${latestPost.slug}` : '/blog'}
            className="inline-flex items-center gap-2 bg-white text-brand-primary font-bold text-sm px-5 py-2.5 rounded-full self-start mt-4 hover:shadow-lg transition-shadow"
          >
            LEGGI
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </Link>
        </div>
      </section>

      {/* Promo */}
      {promoProducts.length > 0 && (
        <section className="mt-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <span className="text-red-500 text-lg">&#128293;</span>
                <h2 className="text-xl font-bold text-brand-text">Promo</h2>
              </div>
              <Link href="/cerca?on_sale=true" className="text-sm font-semibold text-brand-primary hover:underline">
                Vedi tutte
              </Link>
            </div>
          </div>
          <ProductCarousel products={promoProducts} />
        </section>
      )}

      {/* Trending */}
      {trendingCategories.length > 0 && (
        <section className="mt-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-5">
            <svg className="w-5 h-5 text-brand-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            <h2 className="text-xl font-bold text-brand-text">Di tendenza</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {trendingCategories.map((cat) => (
              <Link key={cat.id} href={`/categoria/${cat.slug}`} className="flex flex-col items-center shrink-0 w-20">
                <div className="w-[72px] h-[72px] rounded-full border-2 border-brand-primary overflow-hidden bg-brand-bg">
                  {cat.image?.src ? (
                    <Image src={cat.image.src} alt={cat.name} width={72} height={72} className="object-cover w-full h-full" />
                  ) : (
                    <div className="w-full h-full bg-brand-primary flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                  )}
                </div>
                <span className="text-xs font-semibold text-brand-text text-center mt-1.5 leading-tight line-clamp-2">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* I consigliati */}
      {circuito.length > 0 && (
        <section className="mt-10 mx-4 sm:mx-6 lg:mx-auto lg:max-w-7xl">
          <div className="bg-[#faf8f2] rounded-2xl border-2 border-[#d4c89a] overflow-hidden">
            <div className="flex items-center justify-center gap-2 py-3 border-b border-[#e8dfc4]">
              <svg className="w-4 h-4 text-[#b8973f]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              <h2 className="text-base font-bold text-[#5c4f35] tracking-wide">I consigliati</h2>
            </div>
            <div className="grid grid-cols-2 divide-x divide-[#e8dfc4]">
              {circuito.slice(0, 2).map((product) => (
                <ConsigliatiCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Categories grid */}
      {gridCats.length > 0 && (
        <section className="mt-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-brand-text mb-5">Categorie</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {gridCats.map((cat) => (
              <Link key={cat.id} href={`/categoria/${cat.slug}`} className="group relative aspect-square rounded-2xl overflow-hidden bg-brand-bg">
                {cat.image?.src ? (
                  <Image src={cat.image.src} alt={cat.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-brand-bg">
                    <svg className="w-10 h-10 text-brand-primary/30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                )}
                <div className="absolute bottom-0 inset-x-0 bg-black/45 px-3 py-2.5">
                  <p className="text-sm font-bold text-white line-clamp-2">{cat.name}</p>
                  <p className="text-[10px] text-white/75">{cat.count} prodotti</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Best sellers */}
      {bestSellers.length > 0 && (
        <section className="mt-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-brand-text">I più venduti</h2>
              <Link href="/cerca" className="text-sm font-semibold text-brand-primary hover:underline">Vedi tutti</Link>
            </div>
          </div>
          <ProductCarousel products={bestSellers} />
        </section>
      )}

      {/* Trust */}
      <section className="mt-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl font-bold text-brand-text text-center mb-8">Perché scegliere Stappando</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {TRUST_ITEMS.map((item, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-brand-border text-center">
              <div className="w-12 h-12 rounded-full bg-brand-bg mx-auto mb-3 flex items-center justify-center">
                <svg className="w-6 h-6 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-brand-text mb-0.5">{item.title}</h3>
              <p className="text-xs text-brand-muted">{item.subtitle}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Blog CTA */}
      <section className="mt-10 mx-4 sm:mx-6 lg:mx-auto lg:max-w-7xl">
        <Link href="/blog" className="block relative rounded-2xl overflow-hidden h-[70px]">
          <Image
            src="https://stappando.it/wp-content/uploads/2021/07/vini-unsplash-scaled.jpg"
            alt="Blog"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-brand-primary/90 flex items-center px-6 gap-4">
            <svg className="w-6 h-6 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            <div className="flex-1">
              <p className="text-sm font-bold text-white">Il Blog di Stappando</p>
              <p className="text-xs text-white/70">Abbinamenti, consigli e novità dal mondo del vino</p>
            </div>
            <svg className="w-5 h-5 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </div>
        </Link>
      </section>

      <div className="h-10" />
    </div>
  );
}

function ConsigliatiCard({ product }: { product: WCProduct }) {
  const produttore = getProduttore(product);
  const discount = getDiscount(product);
  const vendorName = product._vendorName || product.store?.name;

  return (
    <div className="flex flex-col">
      <Link href={`/prodotto/${product.slug}`}>
        <div className="relative aspect-square bg-[#faf8f2]">
          {product.images[0]?.src && (
            <Image src={product.images[0].src} alt={product.name} fill className="object-cover" sizes="(max-width: 768px) 50vw, 300px" />
          )}
          {discount > 0 && (
            <div className="absolute bottom-2 left-2 w-9 h-9 rounded-full bg-brand-error flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">-{discount}%</span>
            </div>
          )}
        </div>
        <div className="p-2.5">
          {produttore && <p className="text-[9px] font-semibold text-[#8a7a52] uppercase tracking-wide">{produttore}</p>}
          <h3 className="text-xs font-bold text-[#3d3424] line-clamp-2 leading-tight mt-0.5">{product.name}</h3>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-sm font-extrabold text-brand-primary">{formatPrice(product.price)} &euro;</span>
            {product.on_sale && product.regular_price && (
              <span className="text-[10px] text-brand-muted line-through">{formatPrice(product.regular_price)} &euro;</span>
            )}
          </div>
          {vendorName && (
            <p className="text-[8px] text-[#8a7a52] mt-0.5">Venduto e spedito da {vendorName}</p>
          )}
        </div>
      </Link>
    </div>
  );
}
