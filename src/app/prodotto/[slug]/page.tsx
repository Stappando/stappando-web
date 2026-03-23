import { notFound } from 'next/navigation';
import Image from 'next/image';
import { api, decodeHtml, formatPrice, getDiscount, getProduttore } from '@/lib/api';
import AddToCartButton from '@/components/AddToCartButton';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const product = await api.getProduct(slug);
  if (!product) return { title: 'Prodotto non trovato' };
  return {
    title: `${decodeHtml(product.name)} — Stappando`,
    description: decodeHtml(product.short_description).slice(0, 160),
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await api.getProduct(slug);
  if (!product) notFound();

  const discount = getDiscount(product);
  const produttore = getProduttore(product);
  const vendorName = product._vendorName || product.store?.name || 'Stappando';

  const galleryImages = product.images.length > 0 ? product.images : [{ id: 0, src: '', alt: product.name }];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-brand-muted mb-6">
        <a href="/" className="hover:text-brand-primary">Home</a>
        <span className="mx-2">/</span>
        {product.categories[0] && (
          <>
            <a href={`/categoria/${product.categories[0].slug}`} className="hover:text-brand-primary">
              {product.categories[0].name}
            </a>
            <span className="mx-2">/</span>
          </>
        )}
        <span className="text-brand-text">{decodeHtml(product.name)}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Gallery */}
        <div className="space-y-3">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-brand-bg">
            {galleryImages[0]?.src ? (
              <Image
                src={galleryImages[0].src}
                alt={product.name}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-brand-muted">
                <svg className="w-20 h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            {discount > 0 && (
              <div className="absolute top-4 left-4 w-14 h-14 rounded-full bg-brand-error flex items-center justify-center">
                <span className="text-white text-sm font-bold">-{discount}%</span>
              </div>
            )}
          </div>
          {galleryImages.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {galleryImages.slice(1, 5).map((img) => (
                <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden bg-brand-bg">
                  <Image src={img.src} alt={img.alt || product.name} fill className="object-cover" sizes="120px" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {produttore && (
            <p className="text-sm font-semibold text-brand-accent uppercase tracking-wide mb-1">{produttore}</p>
          )}
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-text mb-4">
            {decodeHtml(product.name)}
          </h1>

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-3xl font-extrabold text-brand-primary">
              {formatPrice(product.price)} &euro;
            </span>
            {product.on_sale && product.regular_price && (
              <span className="text-lg text-brand-muted line-through">
                {formatPrice(product.regular_price)} &euro;
              </span>
            )}
            {discount > 0 && (
              <span className="text-sm font-bold text-brand-error bg-red-50 px-2 py-0.5 rounded">
                -{discount}%
              </span>
            )}
          </div>

          {/* Stock */}
          <div className="flex items-center gap-2 mb-6">
            <div className={`w-2.5 h-2.5 rounded-full ${product.stock_status === 'instock' ? 'bg-brand-success' : 'bg-brand-error'}`} />
            <span className="text-sm text-brand-muted">
              {product.stock_status === 'instock' ? 'Disponibile' : 'Non disponibile'}
            </span>
          </div>

          {/* Add to cart */}
          {product.stock_status === 'instock' && (
            <AddToCartButton
              product={{
                id: product.id,
                name: product.name,
                price: parseFloat(product.price),
                image: product.images[0]?.src || '',
                vendorId: product._vendorId || String(product.store?.id || 'default'),
                vendorName: vendorName,
              }}
            />
          )}

          {/* Vendor */}
          <div className="mt-6 p-4 bg-brand-bg rounded-xl border border-brand-border">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-brand-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
              <span className="text-sm font-medium text-brand-text">Venduto e spedito da <strong>{vendorName}</strong></span>
            </div>
          </div>

          {/* Attributes table */}
          {product.attributes.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-bold text-brand-text uppercase tracking-wide mb-3">Caratteristiche</h3>
              <div className="border border-brand-border rounded-xl overflow-hidden">
                {product.attributes.map((attr, i) => (
                  <div key={attr.id} className={`flex ${i > 0 ? 'border-t border-brand-border' : ''}`}>
                    <div className="w-1/3 bg-brand-bg px-4 py-2.5 text-xs font-semibold text-brand-muted uppercase">
                      {attr.name}
                    </div>
                    <div className="w-2/3 px-4 py-2.5 text-sm text-brand-text">
                      {attr.options.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trust badges */}
          <div className="mt-6 grid grid-cols-3 gap-2">
            {[
              { icon: 'M13 10V3L4 14h7v7l9-11h-7z', label: 'Spedizione 24-48h' },
              { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', label: 'Pagamento sicuro' },
              { icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15', label: 'Reso facile' },
            ].map((badge, i) => (
              <div key={i} className="text-center p-3 bg-brand-bg rounded-xl">
                <svg className="w-5 h-5 mx-auto mb-1 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={badge.icon} />
                </svg>
                <p className="text-[10px] font-medium text-brand-muted">{badge.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Description */}
      {product.description && (
        <div className="mt-10 max-w-3xl">
          <h2 className="text-lg font-bold text-brand-text mb-4">Descrizione</h2>
          <div
            className="wp-content text-brand-text/80 text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        </div>
      )}
    </div>
  );
}
