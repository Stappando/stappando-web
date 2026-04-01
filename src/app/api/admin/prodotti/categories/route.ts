import { NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';

export async function GET() {
  const wc = getWCSecrets();
  const auth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;
  try {
    const res = await fetch(`${wc.baseUrl}/wp-json/wc/v3/products/categories?per_page=100&orderby=name&order=asc&${auth}`);
    if (!res.ok) return NextResponse.json([]);
    const cats: { id: number; name: string; slug: string; parent: number; count: number }[] = await res.json();

    // Build hierarchy: parent categories with their children
    const parents = cats.filter(c => c.parent === 0 && !c.slug.startsWith('slider')).sort((a, b) => a.name.localeCompare(b.name));
    const result: { id: number; name: string; children: { id: number; name: string }[] }[] = [];

    for (const p of parents) {
      const children = cats.filter(c => c.parent === p.id).sort((a, b) => a.name.localeCompare(b.name));
      result.push({ id: p.id, name: p.name, children: children.map(c => ({ id: c.id, name: c.name })) });
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json([]);
  }
}
