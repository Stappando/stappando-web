/**
 * Sub-order system — splits a parent WC order into vendor-specific sub-orders.
 *
 * Flow:
 * 1. Parent order created → webhook fires
 * 2. Fetch product → vendor mapping via /wp-json/stp-app/v1/product-vendors
 * 3. Group line items by vendor_id
 * 4. Create one WC sub-order per vendor with commission meta
 * 5. Tag parent order with _has_sub_orders + _sub_orders JSON
 * 6. Notify each vendor via Mandrill
 */
import { getWCSecrets } from '@/lib/config';
import { sendEmail } from '@/lib/mail/mandrill';
import { vendorSubOrder } from '@/lib/mail/templates';

/* ── Types ─────────────────────────────────────────────── */

interface WCLineItem {
  id: number;
  product_id: number;
  name: string;
  quantity: number;
  total: string;
  subtotal: string;
  price: number;
  image?: { src: string };
}

interface ParentOrder {
  id: number;
  number: string; // WC order number (used to derive display numbers like "10000-1")
  status: string;
  billing: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address_1: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  shipping: {
    first_name: string;
    last_name: string;
    address_1: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  line_items: WCLineItem[];
  shipping_total: string;
  total: string;
  payment_method: string;
  payment_method_title: string;
  transaction_id: string;
  meta_data: { key: string; value: string }[];
}

interface VendorGroup {
  vendorId: string;
  vendorName: string;
  items: WCLineItem[];
}

export interface SubOrderResult {
  subOrderId: number;
  vendorId: string;
  vendorName: string;
  total: string;
  displayNumber: string;
}

/* ── Constants ─────────────────────────────────────────── */

const VENDOR_COMMISSION_RATE = 0.85; // 85% to vendor
const PLATFORM_COMMISSION_RATE = 0.15; // 15% to Stappando
const IVA_DIVISOR = 1.22; // Italian VAT 22%

/* ── Main: split order into sub-orders ─────────────────── */

export async function splitOrderIntoSubOrders(parentOrder: ParentOrder): Promise<SubOrderResult[]> {
  // Skip if already split
  const alreadySplit = parentOrder.meta_data?.find(m => m.key === '_has_sub_orders')?.value;
  if (alreadySplit === 'true') {
    console.log(`Order #${parentOrder.id}: already split, skipping`);
    return [];
  }

  // Skip orders with no line items
  if (!parentOrder.line_items || parentOrder.line_items.length === 0) {
    console.log(`Order #${parentOrder.id}: no line items, skipping split`);
    return [];
  }

  // 1. Fetch vendor mapping for all products
  const productIds = parentOrder.line_items.map(li => li.product_id);
  const vendorMap = await fetchProductVendors(productIds);

  // 2. Group line items by vendor
  const groups = groupByVendor(parentOrder.line_items, vendorMap);

  console.log(`Order #${parentOrder.id}: splitting into ${groups.length} sub-order(s)`);

  // 3. Create sub-orders
  const parentNumber = parentOrder.number || String(parentOrder.id);
  const results: SubOrderResult[] = [];
  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    const displayNumber = `${parentNumber}-${i + 1}`;
    try {
      const result = await createSubOrder(parentOrder, group, displayNumber);
      results.push(result);
    } catch (err) {
      console.error(`Failed to create sub-order for vendor ${group.vendorId}:`, err);
    }
  }

  // 4. Tag parent order with sub-order references
  if (results.length > 0) {
    await tagParentOrder(parentOrder.id, results);
  }

  // 5. Notify vendors
  for (const result of results) {
    const group = groups.find(g => g.vendorId === result.vendorId);
    if (group) {
      await notifyVendor(parentOrder, group, result).catch(err =>
        console.error(`Failed to notify vendor ${result.vendorId}:`, err),
      );
    }
  }

  return results;
}

/* ── Fetch product → vendor mapping ────────────────────── */

async function fetchProductVendors(
  productIds: number[],
): Promise<Record<string, { vendor_id: string; vendor_name: string }>> {
  if (productIds.length === 0) return {};
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://stappando.it';
  try {
    const res = await fetch(
      `${siteUrl}/wp-json/stp-app/v1/product-vendors?ids=${productIds.join(',')}`,
    );
    if (!res.ok) {
      console.error(`product-vendors API failed: ${res.status}`);
      return {};
    }
    const data = await res.json();
    return data.vendors || {};
  } catch (err) {
    console.error('Failed to fetch product vendors:', err);
    return {};
  }
}

/* ── Group line items by vendor ────────────────────────── */

function groupByVendor(
  lineItems: WCLineItem[],
  vendorMap: Record<string, { vendor_id: string; vendor_name: string }>,
): VendorGroup[] {
  const groups = new Map<string, VendorGroup>();

  for (const item of lineItems) {
    const vendor = vendorMap[String(item.product_id)];
    const vendorId = vendor?.vendor_id ? String(vendor.vendor_id) : '0';
    const vendorName = vendor?.vendor_name || 'Stappando Enoteca';

    if (!groups.has(vendorId)) {
      groups.set(vendorId, { vendorId, vendorName, items: [] });
    }
    groups.get(vendorId)!.items.push(item);
  }

  return Array.from(groups.values());
}

/* ── Commission calculation ────────────────────────────── */

function calculateCommissions(grossTotal: number) {
  const netTotal = grossTotal / IVA_DIVISOR;
  const vendorAmount = Math.round(netTotal * VENDOR_COMMISSION_RATE * 100) / 100;
  const platformAmount = Math.round(netTotal * PLATFORM_COMMISSION_RATE * 100) / 100;

  return {
    gross: Math.round(grossTotal * 100) / 100,
    net: Math.round(netTotal * 100) / 100,
    vendorAmount,
    platformAmount,
    vendorRate: VENDOR_COMMISSION_RATE,
    platformRate: PLATFORM_COMMISSION_RATE,
  };
}

/* ── Create a single sub-order on WC ───────────────────── */

async function createSubOrder(
  parent: ParentOrder,
  group: VendorGroup,
  displayNumber: string,
): Promise<SubOrderResult> {
  const wc = getWCSecrets();
  const auth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;

  // Calculate gross total from line items
  const grossTotal = group.items.reduce((sum, li) => sum + parseFloat(li.total), 0);
  const commissions = calculateCommissions(grossTotal);

  // Proportional shipping: split by value ratio
  const parentTotal = parseFloat(parent.total) - parseFloat(parent.shipping_total);
  const shippingRatio = parentTotal > 0 ? grossTotal / parentTotal : 0;
  const subShipping = Math.round(parseFloat(parent.shipping_total) * shippingRatio * 100) / 100;

  const subTotal = grossTotal + subShipping;

  const orderData = {
    parent_id: parent.id,
    status: 'processing',
    billing: parent.billing,
    shipping: parent.shipping,
    line_items: group.items.map(li => ({
      product_id: li.product_id,
      name: li.name,
      quantity: li.quantity,
      total: li.total,
      subtotal: li.subtotal,
    })),
    shipping_lines: subShipping > 0
      ? [{ method_id: 'flat_rate', method_title: 'Spedizione', total: String(subShipping) }]
      : [],
    payment_method: parent.payment_method,
    payment_method_title: parent.payment_method_title,
    set_paid: true,
    meta_data: [
      { key: '_parent_order_id', value: String(parent.id) },
      { key: '_vendor_id', value: group.vendorId },
      { key: '_vendor_name', value: group.vendorName },
      { key: '_is_sub_order', value: 'true' },
      { key: '_commission_gross', value: String(commissions.gross) },
      { key: '_commission_net', value: String(commissions.net) },
      { key: '_commission_vendor', value: String(commissions.vendorAmount) },
      { key: '_commission_platform', value: String(commissions.platformAmount) },
      { key: '_commission_vendor_rate', value: String(commissions.vendorRate) },
      { key: '_commission_platform_rate', value: String(commissions.platformRate) },
      { key: '_display_number', value: displayNumber },
    ],
  };

  const res = await fetch(`${wc.baseUrl}/wp-json/wc/v3/orders?${auth}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Sub-order creation failed for vendor ${group.vendorId}: ${res.status} ${JSON.stringify(err)}`);
  }

  const subOrder = await res.json();
  console.log(`Sub-order #${subOrder.id} (${displayNumber}) created for vendor ${group.vendorName} (parent #${parent.id})`);

  return {
    subOrderId: subOrder.id,
    vendorId: group.vendorId,
    vendorName: group.vendorName,
    total: String(subTotal),
    displayNumber,
  };
}

/* ── Tag parent order with sub-order references ────────── */

async function tagParentOrder(parentId: number, results: SubOrderResult[]) {
  const wc = getWCSecrets();
  const auth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;

  const subOrderIds = results.map(r => r.subOrderId);

  try {
    await fetch(`${wc.baseUrl}/wp-json/wc/v3/orders/${parentId}?${auth}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'on-hold',
        meta_data: [
          { key: '_has_sub_orders', value: 'true' },
          { key: '_is_parent_only', value: 'true' },
          { key: '_sub_orders', value: JSON.stringify(subOrderIds) },
        ],
      }),
    });

    // Add note to parent order
    await fetch(`${wc.baseUrl}/wp-json/wc/v3/orders/${parentId}/notes?${auth}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        note: `Ordine suddiviso in ${results.length} sub-ordini: ${results.map(r => `#${r.subOrderId} (${r.vendorName})`).join(', ')}. Gestito tramite sub-ordini — non evadere direttamente.`,
        customer_note: false,
      }),
    });

    console.log(`Parent order #${parentId} → on-hold, tagged with ${subOrderIds.length} sub-order(s)`);
  } catch (err) {
    console.error(`Failed to tag parent order #${parentId}:`, err);
  }
}

/* ── Notify vendor via Mandrill ────────────────────────── */

async function notifyVendor(
  parent: ParentOrder,
  group: VendorGroup,
  result: SubOrderResult,
) {
  // Get vendor email from WC customer
  const vendorEmail = await getVendorEmail(group.vendorId);
  if (!vendorEmail) {
    console.warn(`No email found for vendor ${group.vendorId}, skipping notification`);
    return;
  }

  const grossTotal = group.items.reduce((sum, li) => sum + parseFloat(li.total), 0);
  const commissions = calculateCommissions(grossTotal);

  const items = group.items.map(li => ({
    name: li.name,
    quantity: li.quantity,
    total: li.total,
  }));

  // Extract carrier from customer note or shipping line
  const shippingLine = (parent as unknown as { shipping_lines?: { method_title?: string }[] }).shipping_lines?.[0];
  const carrierFromShipping = shippingLine?.method_title || '';

  const { subject, html } = vendorSubOrder({
    vendorName: group.vendorName,
    subOrderNumber: result.displayNumber,
    parentOrderNumber: String(parent.number || parent.id),
    items,
    grossTotal: String(commissions.gross),
    netTotal: String(commissions.net),
    vendorAmount: String(commissions.vendorAmount),
    platformAmount: String(commissions.platformAmount),
    shippingAddress: `${parent.shipping.first_name} ${parent.shipping.last_name}, ${parent.shipping.address_1}, ${parent.shipping.postcode} ${parent.shipping.city} (${parent.shipping.state})`,
    customerName: `${parent.billing.first_name} ${parent.billing.last_name}`,
    customerPhone: parent.billing.phone || undefined,
    customerNotes: (parent as unknown as { customer_note?: string }).customer_note || undefined,
    carrierName: carrierFromShipping || undefined,
  });

  await sendEmail({
    to: [{ email: vendorEmail, name: group.vendorName }],
    subject,
    html,
    tags: ['vendor.sub-order'],
  });

  console.log(`Vendor notification sent to ${vendorEmail} for sub-order #${result.subOrderId}`);
}

/* ── Get vendor email from WC customer ─────────────────── */

async function getVendorEmail(vendorId: string): Promise<string | null> {
  if (vendorId === '0') return null; // Stappando's own products
  const wc = getWCSecrets();
  const auth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;
  try {
    const res = await fetch(`${wc.baseUrl}/wp-json/wc/v3/customers/${vendorId}?${auth}`);
    if (!res.ok) return null;
    const customer = await res.json();
    return customer.email || null;
  } catch {
    return null;
  }
}
