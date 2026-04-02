import { NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/prodotti/cleanup-terms
 * Deletes non-numeric terms from pa_bottiglie-prodotte (WC attr ID 92)
 * that were accidentally created (e.g. place names like "Breganze").
 */
export async function POST() {
  const wc = getWCSecrets();
  const auth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;
  const ATTR_ID = 92; // pa_bottiglie-prodotte

  try {
    // Fetch all terms for this attribute
    let allTerms: { id: number; name: string }[] = [];
    let page = 1;
    while (true) {
      const res = await fetch(
        `${wc.baseUrl}/wp-json/wc/v3/products/attributes/${ATTR_ID}/terms?per_page=100&page=${page}&${auth}`,
      );
      if (!res.ok) break;
      const batch: { id: number; name: string }[] = await res.json();
      allTerms = [...allTerms, ...batch];
      if (batch.length < 100) break;
      page++;
    }

    // Valid terms are: numbers, -number, +number (e.g. "1500", "-1000", "+5000")
    const isValid = (name: string) => /^[+\-]?\d+$/.test(name.trim());

    const dirty = allTerms.filter((t) => !isValid(t.name));

    const deleted: string[] = [];
    const failed: string[] = [];

    for (const term of dirty) {
      const res = await fetch(
        `${wc.baseUrl}/wp-json/wc/v3/products/attributes/${ATTR_ID}/terms/${term.id}?force=true&${auth}`,
        { method: 'DELETE' },
      );
      if (res.ok) {
        deleted.push(term.name);
      } else {
        failed.push(term.name);
      }
    }

    return NextResponse.json({ deleted, failed, total: dirty.length });
  } catch (err) {
    console.error('cleanup-terms error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
