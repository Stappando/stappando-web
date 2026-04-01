import { NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';

export async function GET() {
  const wc = getWCSecrets();
  const auth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;
  try {
    const res = await fetch(`${wc.baseUrl}/wp-json/wc/v3/products/tags?per_page=50&orderby=count&order=desc&${auth}`);
    if (!res.ok) return NextResponse.json([]);
    const tags: { name: string; slug: string; count: number }[] = await res.json();
    return NextResponse.json(tags.map(t => ({ name: t.name, slug: t.slug })));
  } catch {
    return NextResponse.json([]);
  }
}
