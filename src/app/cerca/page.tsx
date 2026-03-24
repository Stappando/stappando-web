import { type WCCategory } from '@/lib/api';
import { getWCSecrets } from '@/lib/config';
import SearchClient from './SearchClient';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ q?: string; on_sale?: string }>;
}

export async function generateMetadata({ searchParams }: Props) {
  const { q } = await searchParams;
  return { title: q ? `${q} — Shop Stappando` : 'Shop — Stappando' };
}

export default async function SearchPage({ searchParams }: Props) {
  const { q, on_sale } = await searchParams;

  // Only fetch categories server-side (lightweight)
  const wc = getWCSecrets();
  let categories: WCCategory[] = [];
  try {
    const url = `${wc.baseUrl}/wp-json/wc/v3/products/categories?consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}&per_page=50&hide_empty=1&parent=5347`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (res.ok) categories = await res.json();
  } catch { /* */ }

  return <SearchClient initialQuery={q || ''} initialOnSale={on_sale === 'true'} categories={categories} />;
}
