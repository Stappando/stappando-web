import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';
import { sanitize } from '@/lib/validation';

export const dynamic = 'force-dynamic';

interface WCTerm {
  id: number;
  name: string;
  slug: string;
}

interface WCAttribute {
  id: number;
  name: string;
  slug: string;
}

/** GET /api/vendor/taxonomies?slug=pa_regione — fetch WC product attribute terms */
export async function GET(req: NextRequest) {
  const rawSlug = req.nextUrl.searchParams.get('slug');
  const slug = sanitize(rawSlug, 100);

  if (!slug) {
    return NextResponse.json(
      { error: 'slug parameter is required' },
      { status: 400 },
    );
  }

  const wc = getWCSecrets();
  const auth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;

  try {
    // Special case: product categories
    if (slug === 'product_cat') {
      const res = await fetch(
        `${wc.baseUrl}/wp-json/wc/v3/products/categories?per_page=100&${auth}`,
      );
      if (!res.ok) {
        return NextResponse.json(
          { error: 'Failed to fetch categories' },
          { status: 502 },
        );
      }
      const categories: WCTerm[] = await res.json();
      return NextResponse.json(
        categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug })),
        {
          headers: {
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          },
        },
      );
    }

    // Product attributes: try matching slug with and without pa_ prefix
    const attrSlugNoPa = slug.startsWith('pa_') ? slug.slice(3) : slug;
    const attrSlugWithPa = slug.startsWith('pa_') ? slug : `pa_${slug}`;

    // Step 1: find the attribute ID
    const attrsRes = await fetch(
      `${wc.baseUrl}/wp-json/wc/v3/products/attributes?${auth}`,
    );
    if (!attrsRes.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch attributes' },
        { status: 502 },
      );
    }
    const attributes: WCAttribute[] = await attrsRes.json();
    const attribute = attributes.find((a) => a.slug === attrSlugNoPa || a.slug === attrSlugWithPa || a.slug === slug);

    if (!attribute) {
      return NextResponse.json(
        { error: `Attribute "${slug}" not found` },
        { status: 404 },
      );
    }

    // Step 2: fetch terms for this attribute
    const termsRes = await fetch(
      `${wc.baseUrl}/wp-json/wc/v3/products/attributes/${attribute.id}/terms?per_page=100&${auth}`,
    );
    if (!termsRes.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch attribute terms' },
        { status: 502 },
      );
    }
    const terms: WCTerm[] = await termsRes.json();

    return NextResponse.json(
      terms.map((t) => ({ id: t.id, name: t.name, slug: t.slug })),
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      },
    );
  } catch (err) {
    console.error('Taxonomies fetch error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
