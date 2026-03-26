import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';

export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get('email');
    if (!email) {
      return NextResponse.json({ error: 'Email obbligatoria' }, { status: 400 });
    }

    const wc = getWCSecrets();
    const auth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;

    // Fetch coupons that include this email in restrictions
    const url = `${wc.baseUrl}/wp-json/wc/v3/coupons?${auth}&per_page=50&search=${encodeURIComponent(email)}`;
    const res = await fetch(url);

    if (!res.ok) {
      return NextResponse.json({ coupons: [] });
    }

    const allCoupons = await res.json();

    // Filter: only coupons where this email is in email_restrictions or no restrictions
    const userCoupons = allCoupons.filter((c: Record<string, unknown>) => {
      const restrictions = (c.email_restrictions || []) as string[];
      return restrictions.length === 0 || restrictions.some((e: string) => e.toLowerCase() === email.toLowerCase());
    });

    interface WCCoupon {
      id: number;
      code: string;
      description: string;
      discount_type: string;
      amount: string;
      date_expires: string | null;
      usage_count: number;
      usage_limit: number | null;
      usage_limit_per_user: number | null;
    }

    const mapped = userCoupons.map((c: WCCoupon) => {
      const isExpired = c.date_expires && new Date(c.date_expires) < new Date();
      const isUsedUp = c.usage_limit && c.usage_count >= c.usage_limit;

      return {
        id: c.id,
        code: c.code,
        description: c.description || '',
        type: c.discount_type,
        amount: c.amount,
        expires: c.date_expires,
        usageCount: c.usage_count,
        usageLimit: c.usage_limit,
        status: isUsedUp ? 'used' : isExpired ? 'expired' : 'active',
      };
    });

    return NextResponse.json({ coupons: mapped });
  } catch (err) {
    console.error('Coupons fetch error:', err);
    return NextResponse.json({ coupons: [] });
  }
}
