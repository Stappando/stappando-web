import { notFound } from 'next/navigation';
import { unstable_cache } from 'next/cache';
import { api, decodeHtml, formatPrice, getDiscount, getProduttore } from '@/lib/api';
import { DEFAULT_VENDOR_NAME, API_CONFIG } from '@/lib/config';
import PDPClient from './PDPClient';
import RelatedProducts from './RelatedProducts';

const getCachedProduct = unstable_cache(
  async (slug: string) => api.getProduct(slug),
  ['wc-product'],
  { revalidate: 300, tags: ['products'] },
);

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const product = await getCachedProduct(slug);
  if (!product) return { title: 'Prodotto non trovato' };
  return {
    title: `${decodeHtml(product.name)} — Stappando`,
    description: decodeHtml(product.short_description || '').replace(/<[^>]*>/g, '').slice(0, 160),
  };
}

/* Allowed attribute keys for the specs table */
const ALLOWED_ATTRS = new Set([
  'Regione', 'Denominazione', 'Annata', 'Formato', 'Alcol',
  'Allergeni', 'Momento di consumo', 'Uvaggio', 'Raccolta',
  'Zona di produzione', 'Abbinamento',
]);

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getCachedProduct(slug);
  if (!product) notFound();

  const discount = getDiscount(product);
  const produttore = getProduttore(product);
  const vendorName = product._vendorName || product.store?.name || DEFAULT_VENDOR_NAME;
  const isCircuito = product.tags?.some((t: { id: number }) => t.id === API_CONFIG.tags.circuito);
  const galleryImages = product.images?.length > 0 ? product.images : [{ id: 0, src: '', alt: product.name }];

  // Extract specific attributes
  const getAttr = (name: string) => {
    const attr = product.attributes?.find((a: { name: string; options: string[] }) =>
      a.name.toLowerCase() === name.toLowerCase()
    );
    return attr?.options?.join(', ') || '';
  };

  const alcol = getAttr('Alcol');
  const denominazione = getAttr('Denominazione');
  const abbinamenti = getAttr('Abbinamento')?.split(',').map((s: string) => s.trim()).filter(Boolean) || [];

  // Filter attributes for specs table
  const specs = (product.attributes || [])
    .filter((a: { name: string }) => ALLOWED_ATTRS.has(a.name) && a.name !== 'Abbinamento')
    .map((a: { name: string; options: string[] }) => ({ key: a.name, value: a.options.join(', ') }));

  // Get circuito badge text
  const circuitoBadge = product.meta_data?.find((m: { key: string; value: string }) => m.key === '_circuito_badge')?.value || 'Un vino che racconta il territorio con eleganza e carattere.';

  // Short description
  const shortDesc = product.short_description
    ? decodeHtml(product.short_description).replace(/<[^>]*>/g, '').slice(0, 300)
    : product.description
      ? decodeHtml(product.description).replace(/<[^>]*>/g, '').slice(0, 200)
      : '';

  // POP points
  const popPoints = Math.round(parseFloat(product.price));

  return (
    <div className="bg-[#f8f6f1] min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {/* Breadcrumb */}
        <nav className="text-[14px] text-[#999] mb-5">
          <a href="/" className="hover:text-[#005667]">Home</a>
          <span className="mx-1.5">/</span>
          {product.categories?.[0] && (
            <>
              <a href={`/categoria/${product.categories[0].slug}`} className="hover:text-[#005667]">
                {product.categories[0].name}
              </a>
              <span className="mx-1.5">/</span>
            </>
          )}
          <span className="text-[#666]">{decodeHtml(product.name)}</span>
        </nav>

        <PDPClient
          product={{
            id: product.id,
            slug: product.slug,
            name: decodeHtml(product.name),
            price: product.price,
            regularPrice: product.regular_price,
            onSale: product.on_sale,
            stockStatus: product.stock_status,
            stockQuantity: product.stock_quantity,
            vendorName,
            vendorId: product._vendorId || String(product.store?.id || 'default'),
            produttore: produttore || '',
            discount,
            isCircuito,
            circuitoBadge,
            alcol,
            denominazione,
            abbinamenti,
            shortDesc,
            description: product.description || '',
            specs,
            popPoints,
            galleryImages: galleryImages.map((img: { id: number; src: string; alt?: string }) => ({
              id: img.id,
              src: img.src,
              alt: img.alt || product.name,
            })),
            mainImage: galleryImages[0]?.src || '',
          }}
        />
        {/* Related products */}
        <RelatedProducts
          productId={product.id}
          categorySlug={product.categories?.[0]?.slug || ''}
          produttore={produttore || ''}
          uvaggio={getAttr('Uvaggio')}
        />
      </div>
    </div>
  );
}
