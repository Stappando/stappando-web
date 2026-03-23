import { api, type WCProduct, type WCCategory } from '@/lib/api';

export const dynamic = 'force-dynamic';
import SearchClient from './SearchClient';

interface Props {
  searchParams: Promise<{ q?: string; on_sale?: string }>;
}

export async function generateMetadata({ searchParams }: Props) {
  const { q } = await searchParams;
  return {
    title: q ? `${q} — Shop Stappando` : 'Shop — Stappando',
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const { q, on_sale } = await searchParams;

  // Fetch initial products — non-blocking for speed
  let initialProducts: WCProduct[] = [];
  try {
    if (q) {
      initialProducts = await api.searchProducts(q, { per_page: 40 });
    } else if (on_sale === 'true') {
      initialProducts = await api.getProducts({ on_sale: 'true', per_page: 40, orderby: 'popularity' });
    } else {
      initialProducts = await api.getProducts({ per_page: 40, orderby: 'popularity' });
    }
  } catch { initialProducts = []; }

  const categories = await api.getCategories({ parent: 5347, per_page: 50 }).catch(() => []);

  return <SearchClient initialProducts={initialProducts} initialQuery={q || ''} initialOnSale={on_sale === 'true'} categories={categories} />;
}
