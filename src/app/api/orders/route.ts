import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';
import { isPositiveInt } from '@/lib/validation';

interface WCOrderMeta { key: string; value: string }

interface WCSubOrder {
  id: number;
  number: string;
  status: string;
  parent_id?: number;
  line_items: { id: number; product_id: number; name: string; quantity: number; price: string; total: string; image?: { src: string } }[];
  meta_data: WCOrderMeta[];
  shipping?: { postcode?: string };
  _vendor_name?: string;
  _display_number?: string;
}

interface WCOrder {
  id: number;
  number: string;
  status: string;
  total: string;
  date_created: string;
  parent_id?: number;
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

/** Cutover: orders created on or after this timestamp show sub-orders as
 *  standalone rows instead of embedding them inside the parent. */
const SUB_ORDER_CUTOVER = new Date('2026-04-03T11:00:00+02:00'); // 3 Apr 2026 11:00 CEST

/** Helper: check if an order is a sub-order (works with both old _stp_ and new _is_ meta) */
function isSubOrder(order: WCOrder): boolean {
  if (order.parent_id && order.parent_id > 0) return true;
  const meta = order.meta_data || [];
  return (
    meta.find(m => m.key === '_is_sub_order')?.value === 'true' ||
    meta.find(m => m.key === '_stp_is_suborder')?.value === '1'
  );
}

/** Helper: check if an order has sub-orders */
function hasSubOrders(order: WCOrder): boolean {
  const meta = order.meta_data || [];
  return (
    meta.find(m => m.key === '_has_sub_orders')?.value === 'true' ||
    meta.find(m => m.key === '_is_parent_only')?.value === 'true' ||
    meta.find(m => m.key === '_stp_has_suborders')?.value === '1'
  );
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
      // 1. Skip sub-orders from the main list — they get promoted via parent fetch
      if (isSubOrder(order)) continue;

      const orderDate = new Date(order.date_created);
      const isPostCutover = orderDate >= SUB_ORDER_CUTOVER;

      // 2. Parent orders with sub-orders — fetch and resolve them
      if (hasSubOrders(order)) {
        try {
          const subUrl = `${wc.baseUrl}/wp-json/wc/v3/orders?parent=${order.id}&per_page=20&${auth}`;
          const subRes = await fetch(subUrl);
          if (subRes.ok) {
            const subOrders: WCSubOrder[] = await subRes.json();
            if (subOrders.length > 0) {
              if (isPostCutover) {
                // Post-cutover: each sub-order becomes a standalone row
                for (const sub of subOrders) {
                  const displayNumber = sub.meta_data?.find(m => m.key === '_display_number')?.value || sub.number;
                  const vendorName = sub.meta_data?.find(m => m.key === '_vendor_name')?.value || 'Stappando Enoteca';
                  result.push({
                    ...order,
                    id: sub.id,
                    number: displayNumber,
                    status: sub.status,
                    line_items: sub.line_items,
                    total: sub.line_items.reduce((sum, li) => sum + parseFloat(li.total || '0'), 0).toFixed(2),
                    meta_data: sub.meta_data,
                    _sub_orders: undefined,
                    _vendor_name: vendorName,
                  } as WCOrder);
                }
              } else {
                // Pre-cutover: embed sub-orders inside the parent
                result.push({
                  ...order,
                  _sub_orders: subOrders.map(sub => ({
                    ...sub,
                    _vendor_name: sub.meta_data?.find(m => m.key === '_vendor_name')?.value || 'Stappando Enoteca',
                    _display_number: sub.meta_data?.find(m => m.key === '_display_number')?.value || sub.number,
                  })),
                });
              }
              continue; // Parent resolved — don't add it as a regular row
            }
          }
        } catch (err) {
          console.error(`Failed to fetch sub-orders for #${order.id}:`, err);
        }
        // If sub-order fetch failed but order is parent-only, hide it anyway
        continue;
      }

      // 3. Regular order (no parent, no sub-orders) — show as-is
      result.push(order);
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
