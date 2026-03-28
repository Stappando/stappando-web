import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';
import { isPositiveInt } from '@/lib/validation';

interface WCOrder {
  id: number;
  status: string;
  total: string;
  date_created: string;
  meta_data: { key: string; value: string }[];
  line_items: { product_id: number; name: string; quantity: number; total: string; image?: { src: string } }[];
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

    // For orders with sub-orders: fetch sub-orders and replace parent
    const result: WCOrder[] = [];

    for (const order of orders) {
      const hasSubs = order.meta_data?.find(m => m.key === '_has_sub_orders')?.value === 'true';
      const isSubOrder = order.meta_data?.find(m => m.key === '_is_sub_order')?.value === 'true';

      // Skip sub-orders that appear in the main list (they'll be fetched via parent)
      if (isSubOrder) continue;

      if (hasSubs) {
        // Fetch sub-orders for this parent
        try {
          const subUrl = `${wc.baseUrl}/wp-json/wc/v3/orders?parent=${order.id}&${auth}`;
          const subRes = await fetch(subUrl);
          if (subRes.ok) {
            const subOrders: WCOrder[] = await subRes.json();
            if (subOrders.length > 0) {
              // Add sub-orders with vendor info, don't show parent
              for (const sub of subOrders) {
                const vendorName = sub.meta_data?.find(m => m.key === '_vendor_name')?.value || 'Stappando Enoteca';
                result.push({
                  ...sub,
                  _vendor_name: vendorName,
                  _parent_order_id: order.id,
                  _is_sub_order: true,
                } as WCOrder & { _vendor_name: string; _parent_order_id: number; _is_sub_order: boolean });
              }
              continue; // Don't add parent to result
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
