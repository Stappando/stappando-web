import { NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';

export async function GET() {
  const wc = getWCSecrets();
  const auth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;

  try {
    // Fetch customers with wcfm_vendor role
    const res = await fetch(`${wc.baseUrl}/wp-json/wc/v3/customers?${auth}&per_page=100&role=wcfm_vendor`);
    if (!res.ok) {
      // Fallback: try all customers and filter
      const res2 = await fetch(`${wc.baseUrl}/wp-json/wc/v3/customers?${auth}&per_page=100`);
      if (!res2.ok) return NextResponse.json([]);
      const all = await res2.json();
      const vendors = all
        .filter((c: { role?: string; meta_data?: { key: string; value: string }[] }) =>
          c.role === 'wcfm_vendor' || (c.meta_data || []).some((m: { key: string; value: string }) => m.key === '_is_vendor' && m.value === 'true')
        )
        .map((c: { id: number; first_name: string; last_name: string; email: string }) => ({
          id: c.id,
          name: `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.email,
        }));
      return NextResponse.json(vendors);
    }

    const customers = await res.json();
    const vendors = customers.map((c: { id: number; first_name: string; last_name: string; email: string }) => ({
      id: c.id,
      name: `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.email,
    }));

    return NextResponse.json(vendors);
  } catch {
    return NextResponse.json([]);
  }
}
