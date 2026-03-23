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

  // Fetch ALL products server-side in parallel for instant client filtering
  const allPages = await Promise.all([
    api.getProducts({ per_page: 100, page: 1, orderby: 'popularity' }).catch(() => []),
    api.getProducts({ per_page: 100, page: 2, orderby: 'popularity' }).catch(() => []),
    api.getProducts({ per_page: 100, page: 3, orderby: 'popularity' }).catch(() => []),
    api.getProducts({ per_page: 100, page: 4, orderby: 'popularity' }).catch(() => []),
    api.getProducts({ per_page: 100, page: 5, orderby: 'popularity' }).catch(() => []),
  ]);
  const initialProducts: WCProduct[] = allPages.flat();

  const categories = await api.getCategories({ parent: 5347, per_page: 50 }).catch(() => []);

  return <SearchClient initialProducts={initialProducts} initialQuery={q || ''} initialOnSale={on_sale === 'true'} categories={categories} />;
}
