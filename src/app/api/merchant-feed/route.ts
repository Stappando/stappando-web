import { NextResponse } from 'next/server';

const SITE_URL = 'https://shop.stappando.it';

export const revalidate = 3600;

interface WCProduct {
  id: number;
  slug: string;
  name: string;
  price: string;
  sale_price: string;
  regular_price: string;
  description: string;
  short_description: string;
  images: { src: string }[];
  stock_status: string;
  stock_quantity: number | null;
  categories: { name: string }[];
  attributes: { name: string; options: string[] }[];
  weight: string;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function escTsv(val: string): string {
  return val.replace(/\t/g, ' ').replace(/\n/g, ' ').replace(/\r/g, '');
}

/**
 * GET /api/merchant-feed
 * Full product feed for Google Merchant Center with correct shop.stappando.it URLs.
 */
export async function GET() {
  const wcBase = process.env.WC_BASE_URL || 'https://stappando.it';
  const ck = process.env.WC_CONSUMER_KEY || '';
  const cs = process.env.WC_CONSUMER_SECRET || '';
  const auth = `consumer_key=${ck}&consumer_secret=${cs}`;

  const products: WCProduct[] = [];
  let page = 1;

  while (true) {
    const res = await fetch(
      `${wcBase}/wp-json/wc/v3/products?status=publish&per_page=100&page=${page}&${auth}`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) break;
    const items: WCProduct[] = await res.json();
    if (items.length === 0) break;
    products.push(...items);
    if (items.length < 100) break;
    page++;
  }

  const header = [
    'id',
    'title',
    'description',
    'link',
    'image_link',
    'price',
    'sale_price',
    'availability',
    'condition',
    'brand',
    'product_type',
    'quantity',
    'unit_pricing_measure',
    'unit_pricing_base_measure',
  ].join('\t');

  const rows = products.map((p) => {
    const desc = escTsv(stripHtml(p.short_description || p.description || p.name));
    const availability = p.stock_status === 'instock' ? 'in_stock'
      : p.stock_status === 'onbackorder' ? 'preorder' : 'out_of_stock';
    const image = p.images?.[0]?.src || '';
    const price = p.price ? `${p.price} EUR` : '';
    const salePrice = p.sale_price ? `${p.sale_price} EUR` : '';
    const brand = p.attributes?.find((a) => a.name.toLowerCase() === 'produttore')?.options?.[0] || 'Stappando';
    const productType = p.categories?.map((c) => c.name).join(' > ') || 'Vini';

    // Detect bottle size from name or weight (default 750ml for wine)
    const nameLower = p.name.toLowerCase();
    let mlSize = 750;
    if (nameLower.includes('magnum') || nameLower.includes('1,5') || nameLower.includes('1.5')) mlSize = 1500;
    else if (nameLower.includes('375') || nameLower.includes('mezza')) mlSize = 375;
    else if (nameLower.includes('500 ml') || nameLower.includes('500ml')) mlSize = 500;
    else if (nameLower.includes('1 litro') || nameLower.includes('1000')) mlSize = 1000;

    const quantity = p.stock_quantity !== null && p.stock_quantity >= 0 ? String(p.stock_quantity) : '';

    return [
      `gla_${p.id}`,
      escTsv(p.name),
      desc.slice(0, 5000),
      `${SITE_URL}/prodotto/${p.slug}`,
      image,
      price,
      salePrice,
      availability,
      'new',
      escTsv(brand),
      escTsv(productType),
      quantity,
      `${mlSize} ml`,
      '100 cl',
    ].join('\t');
  });

  const tsv = [header, ...rows].join('\n');

  return new NextResponse(tsv, {
    headers: {
      'Content-Type': 'text/tab-separated-values; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800',
    },
  });
}
