import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';
import { unstable_cache } from 'next/cache';

export const dynamic = 'force-dynamic';

const WC_FIELDS = 'id,slug,name,price,regular_price,sale_price,on_sale,images';

/** Fetch products by WC category slug, cached 15 minutes */
const getProductsByCategory = unstable_cache(
  async (categorySlug: string, limit: number) => {
    const wc = getWCSecrets();

    // First get category ID from slug
    const catRes = await fetch(
      `${wc.baseUrl}/wp-json/wc/v3/products/categories?consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}&slug=${encodeURIComponent(categorySlug)}&_fields=id`,
    );
    if (!catRes.ok) return [];
    const cats = await catRes.json();
    if (!cats.length) return [];
    const catId = cats[0].id;

    // Fetch products in that category
    const res = await fetch(
      `${wc.baseUrl}/wp-json/wc/v3/products?consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}&category=${catId}&per_page=${limit}&status=publish&_fields=${WC_FIELDS}`,
    );
    if (!res.ok) return [];
    const products = await res.json();

    return products.map((p: Record<string, unknown>) => {
      const images = (p.images || []) as { src: string }[];
      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        price: p.price,
        image: images[0]?.src || null,
      };
    });
  },
  ['products-by-category'],
  { revalidate: 900, tags: ['products'] },
);

export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get('category')?.trim();
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '8'), 20);

  if (!category) {
    return NextResponse.json([]);
  }

  const results = await getProductsByCategory(category, limit);
  return NextResponse.json(results);
}
