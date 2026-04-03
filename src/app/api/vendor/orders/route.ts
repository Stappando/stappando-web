import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';

interface WCMetaData {
  id: number;
  key: string;
  value: string;
}

interface WCLineItem {
  id: number;
  product_id: number;
  name: string;
  quantity: number;
  price: string;
  total: string;
  image: { src: string };
}

interface WCOrderRaw {
  id: number;
  parent_id: number;
  number: string;
  status: string;
  date_created: string;
  total: string;
  currency: string;
  line_items: WCLineItem[];
  billing: { first_name: string; last_name: string; email: string; phone: string };
  shipping: { first_name: string; last_name: string; address_1: string; address_2: string; city: string; state: string; postcode: string; country: string };
  meta_data: WCMetaData[];
}

export async function GET(req: NextRequest) {
  try {
    const vendorId = req.nextUrl.searchParams.get('vendorId');
    if (!vendorId) {
      return NextResponse.json({ message: 'vendorId obbligatorio' }, { status: 400 });
    }

    const wc = getWCSecrets();
    const authParams = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;

    // Fetch recent sub-orders (parent > 0) — WC doesn't support meta filtering via REST
    // We fetch the last 50 orders and filter by _vendor_id in code
    const url = `${wc.baseUrl}/wp-json/wc/v3/orders?${authParams}&per_page=50&orderby=date&order=desc&status=any`;
    const res = await fetch(url, { next: { revalidate: 0 } });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error('[vendor/orders] WC error:', res.status, errText);
      return NextResponse.json({ message: 'Errore nel recupero ordini' }, { status: 502 });
    }

    const allOrders: WCOrderRaw[] = await res.json();

    // Filter: sub-orders only (parent_id > 0) that belong to this vendor
    const vendorOrders = allOrders.filter((o) => {
      if (o.parent_id === 0) return false;
      const vendorMeta = o.meta_data?.find((m) => m.key === '_vendor_id');
      return vendorMeta?.value === String(vendorId);
    });

    // Map to a clean response shape
    const orders = vendorOrders.map((o) => {
      const gross = parseFloat(o.total) || 0;
      const commissionRate = 0.15; // platform takes 15%, vendor gets 85%
      const commission = gross * commissionRate;
      const net = gross - commission;

      const vendorNameMeta = o.meta_data?.find((m) => m.key === '_vendor_name');
      const displayNumberMeta = o.meta_data?.find((m) => m.key === '_display_number');

      return {
        id: o.id,
        display_number: displayNumberMeta?.value || o.number,
        parent_order_id: o.parent_id,
        status: o.status,
        date_created: o.date_created,
        total: o.total,
        currency: o.currency || 'EUR',
        customer_name: `${o.billing.first_name} ${o.billing.last_name}`.trim(),
        customer_email: o.billing.email,
        shipping: o.shipping,
        vendor_name: vendorNameMeta?.value || '',
        items: o.line_items.map((li) => ({
          id: li.id,
          product_id: li.product_id,
          name: li.name,
          quantity: li.quantity,
          price: li.price,
          total: li.total,
          image: li.image?.src || '',
        })),
        commission: {
          gross: gross.toFixed(2),
          platform_fee: commission.toFixed(2),
          net: net.toFixed(2),
          vendor_rate: '85%',
        },
      };
    });

    return NextResponse.json(orders);
  } catch (err) {
    console.error('[vendor/orders] Error:', err);
    return NextResponse.json({ message: 'Errore del server' }, { status: 500 });
  }
}
