import { unstable_cache } from 'next/cache';
import { getWCSecrets } from './config';
import type { WCProduct } from './api';

export interface CantinaDetail {
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

async function fetchCantina(slug: string): Promise<CantinaDetail | null> {
  const wc = getWCSecrets();
  const auth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;

  // 1. Fetch pa_produttore term by slug
  let term: {
    id: number; name: string; slug: string; description: string;
    count: number; image?: { src?: string };
  } | null = null;

  const termsRes = await fetch(
    `${wc.baseUrl}/wp-json/wc/v3/products/attributes/10/terms?slug=${encodeURIComponent(slug)}&${auth}`,
  );
  if (termsRes.ok) {
    const terms = await termsRes.json();
    term = terms[0] || null;
  }
  if (!term) {
    const fallbackRes = await fetch(
      `${wc.baseUrl}/wp-json/wc/v3/products/attributes/10/terms?per_page=100&search=${encodeURIComponent(slug.replace(/-/g, ' '))}&${auth}`,
    );
    if (fallbackRes.ok) {
      const all = await fallbackRes.json();
      term = all.find((t: { slug: string }) =>
        t.slug === slug || t.slug.startsWith(slug) || t.slug.includes(slug),
      ) || all[0] || null;
    }
  }
  if (!term) return null;

  // 2. Fetch data sources in parallel
  type LogoEntry = { name: string; slug: string; image?: string; region?: string; address?: string; banner?: string };

  const [logosResult, vendorsResult] = await Promise.allSettled([
    fetch(`${wc.baseUrl}/wp-json/stp-app/v1/producer-logos?nocache=1`, { cache: 'no-store' }),
    fetch(`${wc.baseUrl}/wp-json/wc/v3/customers?per_page=100&${auth}`),
  ]);

  let logosMeta: LogoEntry | null = null;
  if (logosResult.status === 'fulfilled' && logosResult.value.ok) {
    try {
      const logos: LogoEntry[] = await logosResult.value.json();
      logosMeta = logos.find(l => l.slug === term!.slug || l.name === term!.name) || null;
    } catch { /* */ }
  }

  let vendorShop: { logo: string; banner: string; descrizione: string; regione: string; indirizzo: string } | null = null;
  if (vendorsResult.status === 'fulfilled' && vendorsResult.value.ok) {
    try {
      const allCustomers: {
        first_name: string;
        shipping?: { company?: string };
        billing?: { address_2?: string };
        meta_data?: { key: string; value: string }[];
      }[] = await vendorsResult.value.json();

      const vendors = allCustomers.filter(c =>
        (c.meta_data || []).some(m => m.key === '_is_vendor' && m.value === 'true'),
      );

      const match = vendors.find(c => {
        try {
          const addr2 = c.billing?.address_2 || '';
          if (addr2.startsWith('{')) {
            const extra = JSON.parse(addr2) as Record<string, string>;
            if (extra._producer_term_id && parseInt(extra._producer_term_id) === term!.id) return true;
          }
        } catch { /* */ }
        const cantina = (c.meta_data || []).find(m => m.key === '_vendor_cantina')?.value || c.first_name || '';
        return cantina.toLowerCase() === term!.name.toLowerCase();
      });

      if (match) {
        const company = match.shipping?.company || '';
        if (company.startsWith('{')) {
          const s = JSON.parse(company);
          vendorShop = {
            logo: s.logo || '',
            banner: s.banner || '',
            descrizione: s.descrizione || '',
            regione: s.regione || '',
            indirizzo: s.indirizzo || '',
          };
        }
      }
    } catch { /* */ }
  }

  // 3. Merge
  const logo: string = term.image?.src || logosMeta?.image || vendorShop?.logo || '';
  const description: string = term.description || vendorShop?.descrizione || '';
  const banner = logosMeta?.banner || vendorShop?.banner || '';
  const region = logosMeta?.region || vendorShop?.regione || '';
  const address = logosMeta?.address || vendorShop?.indirizzo || '';

  // 4. Fetch products
  const productsRes = await fetch(
    `${wc.baseUrl}/wp-json/wc/v3/products?attribute=pa_produttore&attribute_term=${term.id}&per_page=50&status=publish&${auth}`,
  );
  let products: Record<string, unknown>[] = [];
  if (productsRes.ok) products = await productsRes.json();

  const firstProductImage =
    (products[0] as { images?: { src: string }[] } | undefined)?.images?.[0]?.src || null;

  const mappedProducts = products.map((p: Record<string, unknown>) => {
    const pi = p as {
      id: number; slug: string; name: string; price: string;
      regular_price: string; sale_price: string; on_sale: boolean;
      images: { id: number; src: string; alt: string }[];
      attributes: { id: number; name: string; options: string[] }[];
      tags: { id: number; name: string; slug: string }[];
      meta_data: { key: string; value: string }[];
      categories: { id: number; name: string; slug: string }[];
      description: string; short_description: string; status: string;
      stock_status: string; stock_quantity: number | null;
      average_rating: string; rating_count: number; date_created?: string;
    };
    return {
      id: pi.id, slug: pi.slug, name: pi.name, price: pi.price,
      regular_price: pi.regular_price, sale_price: pi.sale_price, on_sale: pi.on_sale,
      images: pi.images || [], attributes: pi.attributes || [], tags: pi.tags || [],
      meta_data: pi.meta_data || [], categories: pi.categories || [],
      description: pi.description || '', short_description: pi.short_description || '',
      stock_status: pi.stock_status || 'instock',
      stock_quantity: pi.stock_quantity ?? null,
      average_rating: pi.average_rating || '0',
      rating_count: pi.rating_count || 0,
      date_created: pi.date_created,
      _vendorName: term!.name,
      store: { id: 0, name: term!.name, url: '' },
    } as WCProduct;
  });

  return {
    name: term.name,
    slug: term.slug,
    description,
    count: term.count || products.length,
    image: logo || firstProductImage,
    banner: banner || null,
    region: region || null,
    address: address || null,
    products: mappedProducts,
  };
}

export const getCachedCantina = unstable_cache(
  fetchCantina,
  ['cantina-detail'],
  { revalidate: 300, tags: ['cantine'] },
);
