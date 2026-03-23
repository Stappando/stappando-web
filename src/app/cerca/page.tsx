import { api, type WCProduct } from '@/lib/api';
import SearchClient from './SearchClient';

interface Props {
  searchParams: Promise<{ q?: string; on_sale?: string }>;
}

export async function generateMetadata({ searchParams }: Props) {
  const { q } = await searchParams;
  return {
    title: q ? `Risultati per "${q}" — Stappando` : 'Cerca vini — Stappando',
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const { q, on_sale } = await searchParams;

  let initialProducts: WCProduct[] = [];
  if (q) {
    initialProducts = await api.searchProducts(q).catch(() => []);
  } else if (on_sale === 'true') {
    initialProducts = await api.getProducts({ on_sale: 'true', per_page: 40, orderby: 'popularity' }).catch(() => []);
  }

  return <SearchClient initialProducts={initialProducts} initialQuery={q || ''} initialOnSale={on_sale === 'true'} />;
}
