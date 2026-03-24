import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Auth check
  const pwd = req.headers.get('x-admin-password');
  if (!pwd || pwd !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const filter = req.nextUrl.searchParams.get('filter') || 'all';
  const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
  const perPage = 50;

  const wc = getWCSecrets();
  const authParams = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;

  try {
    const res = await fetch(
      `${wc.baseUrl}/wp-json/wc/v3/customers?${authParams}&per_page=${perPage}&page=${page}&orderby=registered_date&order=desc`,
    );
    if (!res.ok) throw new Error(`WC API error: ${res.status}`);

    const customers = await res.json();

    const results = customers
      .map((c: Record<string, unknown>) => {
        const meta = (c.meta_data || []) as { key: string; value: string }[];
        const getMeta = (key: string) => meta.find(m => m.key === key)?.value || '';

        const c1Code = getMeta('_coupon1_code');
        const c1Expires = getMeta('_coupon1_expires');
        const c1Used = getMeta('_coupon1_used') === 'true';
        const c1UsedAt = getMeta('_coupon1_used_at');

        const c2Code = getMeta('_coupon2_code');
        const c2Expires = getMeta('_coupon2_expires');
        const c2Used = getMeta('_coupon2_used') === 'true';
        const c2UsedAt = getMeta('_coupon2_used_at');

        // Skip customers without any coupon
        if (!c1Code && !c2Code) return null;

        const now = Date.now();
        const c1Expired = c1Expires ? new Date(c1Expires).getTime() < now : false;
        const c2Expired = c2Expires ? new Date(c2Expires).getTime() < now : false;

        const c1Status = c1Used ? 'usato' : c1Expired ? 'scaduto' : c1Code ? 'attivo' : '';
        const c2Status = c2Used ? 'usato' : c2Expired ? 'scaduto' : c2Code ? 'attivo' : '';

        return {
          id: c.id,
          name: `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.username,
          email: c.email,
          registered: c.date_created,
          coupon1: { code: c1Code, status: c1Status, usedAt: c1UsedAt, expires: c1Expires },
          coupon2: { code: c2Code, status: c2Status, usedAt: c2UsedAt, expires: c2Expires },
        };
      })
      .filter(Boolean)
      .filter((c: Record<string, unknown>) => {
        if (filter === 'all') return true;
        const entry = c as { coupon1: { status: string }; coupon2: { status: string; code: string } };
        if (filter === 'c1-used-waiting') return entry.coupon1.status === 'usato' && !entry.coupon2.code;
        if (filter === 'c2-used') return entry.coupon2.status === 'usato';
        if (filter === 'expired') return entry.coupon1.status === 'scaduto' || entry.coupon2.status === 'scaduto';
        return true;
      });

    return NextResponse.json({ customers: results, page, perPage });
  } catch (err) {
    console.error('Admin coupon-status error:', err);
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 });
  }
}
