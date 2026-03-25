import { unstable_cache } from 'next/cache';
import { api } from '@/lib/api';
import { API_CONFIG } from '@/lib/config';
import RelatedCarousel from './RelatedCarousel';

const getCachedRelated = unstable_cache(
  async (categorySlug: string) => {
    const [byCategory, bestSellers] = await Promise.all([
      categorySlug ? api.getProducts({ category: categorySlug, per_page: 20 }).catch(() => []) : Promise.resolve([]),
      api.getProducts({ tag: String(API_CONFIG.tags.bestSeller), per_page: 12 }).catch(() => []),
    ]);
    return { byCategory, bestSellers };
  },
  ['related-products'],
  { revalidate: 600, tags: ['products'] },
);

interface Props {
  productId: number;
  categorySlug: string;
  produttore: string;
  uvaggio: string;
}

export default async function RelatedProducts({ productId, categorySlug, produttore, uvaggio }: Props) {
  const { byCategory, bestSellers } = await getCachedRelated(categorySlug);

  // Parse uvaggio grapes for matching
  const grapes = uvaggio ? uvaggio.split(',').map(g => g.trim().toLowerCase()).filter(Boolean) : [];

  type Product = (typeof byCategory)[number];
  const seen = new Set<number>([productId]);
  const related: Product[] = [];

  // Score products by relevance
  const score = (p: Product): number => {
    let s = 0;
    const vendor = (p._vendorName || p.store?.name || '').toLowerCase();
    if (produttore && vendor.includes(produttore.toLowerCase())) s += 10;

    // Match uvaggio
    if (grapes.length > 0) {
      const pAttr = p.attributes?.find((a: { name: string }) => a.name === 'Uvaggio');
      const pGrapes = pAttr?.options?.join(',').toLowerCase() || '';
      for (const g of grapes) {
        if (pGrapes.includes(g)) s += 5;
      }
    }
    return s;
  };

  // All candidates
  const allProducts = [...byCategory, ...bestSellers];
  const scored = allProducts
    .filter(p => { if (seen.has(p.id)) return false; seen.add(p.id); return true; })
    .map(p => ({ product: p, score: score(p) }))
    .sort((a, b) => b.score - a.score);

  for (const { product } of scored) {
    related.push(product);
    if (related.length >= 8) break;
  }

  if (related.length === 0) return null;

  return <RelatedCarousel products={related} />;
}
