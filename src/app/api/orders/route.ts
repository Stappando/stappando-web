import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';
import { isPositiveInt } from '@/lib/validation';

/** GET /api/orders?customerId=123 — fetch orders for customer */
export async function GET(req: NextRequest) {
  try {
    const customerIdParam = req.nextUrl.searchParams.get('customerId');
    if (!isPositiveInt(customerIdParam)) {
      return NextResponse.json({ message: 'Customer ID deve essere un numero positivo' }, { status: 400 });
    }

    const wc = getWCSecrets();
    const url = `${wc.baseUrl}/wp-json/wc/v3/orders?customer=${customerIdParam}&per_page=20&orderby=date&order=desc&consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;
    const res = await fetch(url);
    if (!res.ok) return NextResponse.json([], { status: 200 });

    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
