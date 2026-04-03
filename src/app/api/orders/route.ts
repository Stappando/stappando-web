import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';
import { isPositiveInt } from '@/lib/validation';

interface WCOrderMeta { key: string; value: string }

interface WCSubOrder {
  id: number;
  number: string;
  status: string;
  line_items: { id: number; product_id: number; name: string; quantity: number; price: string; total: string; image?: { src: string } }[];
  meta_data: WCOrderMeta[];
  shipping?: { postcode?: string };
  _vendor_name?: string;
}

interface WCOrder {
  id: number;
  number: string;
  status: string;
  total: string;
  date_created: string;
  meta_data: WCOrderMeta[];
  line_items: { id?: number; product_id: number; name: string; quantity: number; price?: string; total: string; image?: { src: string } }[];
  billing?: { first_name?: string; last_name?: string; address_1?: string; city?: string; state?: string; postcode?: string; email?: string; phone?: string };
  shipping?: { first_name?: string; last_name?: string; address_1?: string; city?: string; state?: string; postcode?: string };
  customer_note?: string;
  payment_method_title?: string;
  discount_total?: string;
  shipping_total?: string;
  coupon_lines?: { code: string; discount: string }[];
  _sub_orders?: WCSubOrder[];
  [key: string]: unknown;
}

/** GET /api/orders?customerId=123 — fetch orders for customer, resolving sub-orders */
export async function GET(req: NextRequest) {
  try {
    const customerIdParam = req.nextUrl.searchParams.get('customerId');
    if (!isPositiveInt(customerIdParam)) {
      return NextResponse.json({ message: 'Customer ID deve essere un numero positivo' }, { status: 400 });
    }

    const wc = getWCSecrets();
    const auth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;
    const url = `${wc.baseUrl}/wp-json/wc/v3/orders?customer=${customerIdParam}&per_page=50&orderby=date&order=desc&${auth}`;
    const res = await fetch(url);
    if (!res.ok) return NextResponse.json([], { status: 200 });

    const orders: WCOrder[] = await res.json();

    const result: WCOrder[] = [];

    for (const order of orders) {
      const hasSubs = order.meta_data?.find(m => m.key === '_has_sub_orders')?.value === 'true';
      const isSubOrder = order.meta_data?.find(m => m.key === '_is_sub_order')?.value === 'true';

      // Skip sub-orders that appear in the main list — they'll be embedded in the parent
      if (isSubOrder) continue;

      if (hasSubs) {
        try {
          const subUrl = `${wc.baseUrl}/wp-json/wc/v3/orders?parent=${order.id}&${auth}`;
          const subRes = await fetch(subUrl);
          if (subRes.ok) {
            const subOrders: WCSubOrder[] = await subRes.json();
            if (subOrders.length > 0) {
              // Embed sub-orders inside the parent — show ONE row per parent order
              result.push({
                ...order,
                _sub_orders: subOrders.map(sub => ({
                  ...sub,
                  _vendor_name: sub.meta_data?.find(m => m.key === '_vendor_name')?.value || 'Stappando Enoteca',
                  _display_number: sub.meta_data?.find(m => m.key === '_display_number')?.value || sub.number,
                })),
              });
              continue;
            }
          }
        } catch (err) {
          console.error(`Failed to fetch sub-orders for #${order.id}:`, err);
        }
      }

      // Regular order or parent with no sub-orders found — show as-is
      result.push(order);
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
