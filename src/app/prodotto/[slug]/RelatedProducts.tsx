import { unstable_cache } from 'next/cache';
import { api } from '@/lib/api';
import { API_CONFIG } from '@/lib/config';
import ProductCard from '@/components/ProductCard';

const getCachedRelated = unstable_cache(
  async (categorySlug: string, produttore: string) => {
    const [byCategory, bestSellers] = await Promise.all([
      categorySlug ? api.getProducts({ category: categorySlug, per_page: 10 }).catch(() => []) : Promise.resolve([]),
      api.getProducts({ tag: String(API_CONFIG.tags.bestSeller), per_page: 10 }).catch(() => []),
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
}

export default async function RelatedProducts({ productId, categorySlug, produttore }: Props) {
  const { byCategory, bestSellers } = await getCachedRelated(categorySlug, produttore);

  // Merge: same category/producer first, then best sellers to fill
  type Product = (typeof byCategory)[number];
  const seen = new Set<number>([productId]);
  const related: Product[] = [];

  // Priority: same producer
  for (const p of byCategory) {
    if (seen.has(p.id)) continue;
    const vendor = p._vendorName || p.store?.name || '';
    if (produttore && vendor.toLowerCase().includes(produttore.toLowerCase())) {
      related.push(p);
      seen.add(p.id);
    }
  }

  // Then same category
  for (const p of byCategory) {
    if (seen.has(p.id)) continue;
    related.push(p);
    seen.add(p.id);
  }

  // Fill with best sellers
  for (const p of bestSellers) {
    if (seen.has(p.id)) continue;
    related.push(p);
    seen.add(p.id);
  }

  const final = related.slice(0, 6);

  if (final.length === 0) return null;

  return (
    <div className="mt-12 mb-8">
      <h2 className="text-[18px] font-semibold text-[#1a1a1a] mb-5">Ti potrebbe piacere</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {final.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
