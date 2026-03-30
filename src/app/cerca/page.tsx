import { type WCCategory } from '@/lib/api';
import { getWCSecrets } from '@/lib/config';
import SearchClient from './SearchClient';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ q?: string; on_sale?: string; tag?: string; vendor?: string; max_price?: string; sort?: string }>;
}

export async function generateMetadata({ searchParams }: Props) {
  const { q, tag, vendor } = await searchParams;
  const label = tag || vendor || q;
  return { title: label ? `${label} — Shop Stappando` : 'Shop — Stappando' };
}

export default async function SearchPage({ searchParams }: Props) {
  const { q, on_sale, tag, vendor, max_price, sort } = await searchParams;

  const wc = getWCSecrets();
  let categories: WCCategory[] = [];
  try {
    const url = `${wc.baseUrl}/wp-json/wc/v3/products/categories?consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}&per_page=50&hide_empty=1&parent=5347`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (res.ok) categories = await res.json();
  } catch { /* */ }

  // Server-side initial fetch — results show immediately, no JS dependency
  let initialResults: unknown[] = [];
  let initialTotal = 0;
  let initialHasMore = false;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shop.stappando.it';
  try {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (tag) params.set('tag', tag);
    if (vendor) params.set('q', vendor);
    if (on_sale === 'true') params.set('on_sale', 'true');
    if (sort) params.set('sort', sort);
    if (max_price) params.set('max_price', max_price);
    params.set('per_page', '24');
    params.set('page', '1');

    // Use internal API URL for server-side fetch
    const apiUrl = `${siteUrl}/api/search?${params.toString()}`;
    const res = await fetch(apiUrl, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      initialResults = data.products || [];
      initialTotal = data.total || initialResults.length;
      initialHasMore = !!data.hasMore;
    }
  } catch (e) {
    console.error('[SearchPage] SSR fetch error:', e);
  }

  return (
    <SearchClient
      initialQuery={q || ''}
      initialOnSale={on_sale === 'true'}
      initialTag={tag || ''}
      initialVendor={vendor || ''}
      initialMaxPrice={max_price || ''}
      initialSort={sort || 'popularity'}
      initialResults={initialResults}
      initialTotal={initialTotal}
      initialHasMore={initialHasMore}
      categories={categories}
    />
  );
}
