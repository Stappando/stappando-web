/** Shared WooCommerce order creation — used by all payment provider webhooks/callbacks */
import { getWCSecrets } from '@/lib/config';
import { dispatchEmail } from '@/lib/mail/dispatcher';
import { splitOrderIntoSubOrders } from '@/lib/vendor/sub-orders';
import type { OrderCustomer, OrderLineItem, PaymentProvider } from './types';

const PROVIDER_TITLES: Record<PaymentProvider, string> = {
  stripe: 'Carta di credito (Stripe)',
  paypal: 'PayPal',
  vivino: 'Vivino Marketplace',
};

const CARRIER_NAMES: Record<string, string> = {
  brt: 'BRT Corriere Espresso',
  fedex: 'FedEx / TNT',
  poste: 'Poste Italiane',
};

const CARRIER_DELIVERY: Record<string, string> = {
  brt: '24-48h lavorativi',
  fedex: '24-48h lavorativi',
  poste: '1-3 giorni lavorativi',
};

interface CustomerPreferences {
  carrier?: string;
  newsletter?: boolean;
}

interface InvoiceData {
  piva?: string;
  ragioneSociale?: string;
  codFiscale?: string;
  sdi?: string;
}

interface CreateWCOrderParams {
  provider: PaymentProvider;
  transactionId: string;
  customer: OrderCustomer;
  items: OrderLineItem[];
  shippingCost: number;
  preferences?: CustomerPreferences;
  couponCode?: string;
  couponDiscount?: number;
  needsInvoice?: boolean;
  invoiceData?: InvoiceData;
  extraMeta?: { key: string; value: string }[];
}

export async function createWCOrder(params: CreateWCOrderParams): Promise<{ id: number }> {
  const { provider, transactionId, customer, items, shippingCost } = params;
  const carrierId = params.preferences?.carrier || '';
  const carrierName = CARRIER_NAMES[carrierId] || carrierId || 'Corriere espresso';
  const deliveryEst = CARRIER_DELIVERY[carrierId] || '1-3 giorni lavorativi';

  const wc = getWCSecrets();
  const auth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;
  const url = `${wc.baseUrl}/wp-json/wc/v3/orders?${auth}`;

  // ── Idempotency guard: skip if an order with this transaction_id already exists ──
  try {
    const since = new Date(Date.now() - 48 * 3600000).toISOString(); // last 48h
    const checkUrl = `${wc.baseUrl}/wp-json/wc/v3/orders?${auth}&after=${encodeURIComponent(since)}&per_page=20&_fields=id,transaction_id&status=processing,on-hold,completed`;
    const checkRes = await fetch(checkUrl);
    if (checkRes.ok) {
      const recent: { id: number; transaction_id: string }[] = await checkRes.json();
      const existing = recent.find(o => o.transaction_id === transactionId);
      if (existing) {
        console.log(`[createWCOrder] Order #${existing.id} already exists for tx ${transactionId} (${provider}) — skipping duplicate`);
        return { id: existing.id };
      }
    }
  } catch (err) {
    // Fail-open: if check fails, proceed with order creation
    console.error('[createWCOrder] Idempotency check failed, proceeding:', err);
  }

  // Build customer note with carrier preference
  const noteParts: string[] = [];
  if (customer.notes) noteParts.push(customer.notes);
  if (carrierId) noteParts.push(`Corriere preferito: ${carrierName}`);

  const shippingTitle = carrierId ? `Spedizione via ${carrierName}` : 'Spedizione';

  const orderData = {
    status: 'processing',
    payment_method: provider,
    payment_method_title: PROVIDER_TITLES[provider],
    set_paid: true,
    transaction_id: transactionId,
    billing: {
      first_name: customer.firstName,
      last_name: customer.lastName,
      email: customer.email,
      phone: customer.phone || '',
      address_1: customer.address,
      city: customer.city,
      state: customer.province,
      postcode: customer.zip,
      country: 'IT',
    },
    shipping: {
      first_name: customer.firstName,
      last_name: customer.lastName,
      address_1: customer.address,
      city: customer.city,
      state: customer.province,
      postcode: customer.zip,
      country: 'IT',
    },
    line_items: items.map((item) => ({
      product_id: item.id,
      quantity: item.quantity,
    })),
    shipping_lines: shippingCost > 0
      ? [{ method_id: 'flat_rate', method_title: shippingTitle, total: String(shippingCost) }]
      : [],
    coupon_lines: params.couponCode ? [{ code: params.couponCode }] : [],
    customer_note: noteParts.join(' — '),
    meta_data: [
      ...((params.needsInvoice || customer.needsInvoice) ? [
        { key: '_needs_invoice', value: 'true' },
        { key: '_invoice_company', value: params.invoiceData?.ragioneSociale || customer.ragioneSociale || '' },
        { key: '_invoice_vat', value: params.invoiceData?.piva || customer.piva || '' },
        { key: '_invoice_cf', value: params.invoiceData?.codFiscale || customer.codFiscale || '' },
        { key: '_invoice_sdi', value: params.invoiceData?.sdi || customer.sdi || '' },
      ] : []),
      ...(params.extraMeta || []),
    ],
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`WC order creation failed (${provider}): ${res.status} ${JSON.stringify(err)}`);
  }

  const order = await res.json();
  console.log(`WC order #${order.id} created via ${provider} — tx: ${transactionId}`);

  // Add internal note with preferences
  if (params.preferences) {
    const { carrier: c, newsletter } = params.preferences;
    const internalParts = [
      c ? `Corriere: ${CARRIER_NAMES[c] || c}` : null,
      newsletter !== undefined ? `Newsletter: ${newsletter ? 'Sì' : 'No'}` : null,
    ].filter(Boolean);

    if (internalParts.length > 0) {
      await fetch(`${wc.baseUrl}/wp-json/wc/v3/orders/${order.id}/notes?${auth}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: `Preferenze cliente: ${internalParts.join(' | ')}`, customer_note: false }),
      }).catch(err => console.error('Failed to add preferences note:', err));
    }
  }

  // ── Fetch full WC order to get real product names from catalogue ──
  // Stripe metadata compact format ({i,q,p}) doesn't include product names;
  // the WC order line_items have the real names from the product catalogue.
  let parentOrderFull: {
    line_items?: { name: string; quantity: number; total: string; price?: string | number; image?: { src: string }; meta_data?: { key: string; value: string }[] }[];
  } = {};
  try {
    parentOrderFull = await fetch(`${wc.baseUrl}/wp-json/wc/v3/orders/${order.id}?${auth}`).then(r => r.json());
  } catch (err) {
    console.error(`Failed to fetch full order #${order.id}:`, err);
  }

  // Build email items: prefer real names from WC line_items, fall back to metadata names
  const wcLineItems = parentOrderFull.line_items || [];
  const emailItems = wcLineItems.length > 0
    ? wcLineItems.map(li => ({
        name: li.name,
        quantity: li.quantity,
        total: parseFloat(li.total || '0').toFixed(2),
        image: li.image?.src,
      }))
    : items.map(i => ({
        name: i.name || `Prodotto #${i.id}`,
        quantity: i.quantity,
        total: (i.price * i.quantity).toFixed(2),
      }));

  // ── Computed values for emails ──
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const discount = params.couponDiscount || 0;
  const total = subtotal + shippingCost - discount;
  const popPoints = Math.round(total);
  const shippingAddr = `${customer.firstName} ${customer.lastName}, ${customer.address}, ${customer.zip} ${customer.city} (${customer.province})`;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://stappando.it';

  // ── Split into vendor sub-orders FIRST (so we can use display numbers in emails) ──
  let subResults: { subOrderId: number; vendorId: string; vendorName: string; total: string; displayNumber: string }[] = [];
  try {
    subResults = await splitOrderIntoSubOrders(parentOrderFull as Parameters<typeof splitOrderIntoSubOrders>[0]);
    if (subResults.length > 0) {
      console.log(`Order #${order.id} split into ${subResults.length} sub-orders: ${subResults.map(r => `#${r.displayNumber}`).join(', ')}`);
    }
  } catch (err) {
    console.error(`Failed to split order #${order.id} into sub-orders:`, err);
  }

  // Use first sub-order display number for customer email (e.g. "78397-1")
  // If split produced results, show sub-order number(s); otherwise fall back to parent
  const customerOrderNumber = subResults.length === 1
    ? subResults[0].displayNumber
    : subResults.length > 1
      ? subResults.map(r => r.displayNumber).join(', ')
      : String(order.number || order.id);

  // For admin email, always reference the parent for internal tracking
  const adminOrderNumber = String(order.number || order.id);

  // ── MAIL 1: Send order confirmation email to customer ──
  dispatchEmail({
    type: 'order.confirmed',
    email: customer.email,
    name: `${customer.firstName} ${customer.lastName}`,
    data: {
      customerName: customer.firstName,
      orderNumber: customerOrderNumber,
      items: emailItems,
      shipping: shippingCost > 0 ? `${shippingCost.toFixed(2)}` : 'Gratuita',
      total: `${total.toFixed(2)}`,
      orderUrl: `${siteUrl}/account`,
      shippingAddress: shippingAddr,
      carrierName,
      deliveryEstimate: deliveryEst,
      discount: discount > 0 ? discount.toFixed(2) : undefined,
      couponCode: discount > 0 && params.couponCode ? params.couponCode.toUpperCase() : undefined,
      pointsEarned: popPoints,
      invoiceData: (params.needsInvoice || customer.needsInvoice) ? {
        companyName: params.invoiceData?.ragioneSociale || customer.ragioneSociale,
        vatNumber: params.invoiceData?.piva || customer.piva,
        codFiscale: params.invoiceData?.codFiscale || customer.codFiscale,
        pec: undefined,
        sdi: params.invoiceData?.sdi || customer.sdi,
      } : undefined,
    },
  }).catch(err => console.error('Failed to send order confirmation email:', err));

  // ── MAIL 2: Send admin notification to ordini@stappando.it ──
  dispatchEmail({
    type: 'admin.new-order',
    email: 'ordini@stappando.it',
    name: 'Stappando Ordini',
    data: {
      orderNumber: adminOrderNumber,
      customerName: `${customer.firstName} ${customer.lastName}`,
      customerEmail: customer.email,
      customerPhone: customer.phone || '',
      vendorGroups: subResults.length > 0
        ? subResults.map(r => ({
            vendorName: r.vendorName,
            items: emailItems.filter(() => true), // TODO: group items by vendor when needed
            subtotal: r.total,
          }))
        : [{ vendorName: 'Tutti i prodotti', items: emailItems.map(i => ({ name: i.name, quantity: i.quantity, total: i.total })), subtotal: subtotal.toFixed(2) }],
      carrierName,
      shippingAddress: shippingAddr,
      billingAddress: shippingAddr,
      paymentMethod: PROVIDER_TITLES[provider],
      transactionId,
      subtotal: subtotal.toFixed(2),
      shippingCost: shippingCost.toFixed(2),
      discount: discount > 0 ? discount.toFixed(2) : undefined,
      couponCode: discount > 0 && params.couponCode ? params.couponCode.toUpperCase() : undefined,
      total: total.toFixed(2),
      customerNotes: customer.notes || undefined,
      carrierPreference: carrierName,
      invoiceData: (params.needsInvoice || customer.needsInvoice) ? {
        companyName: params.invoiceData?.ragioneSociale || customer.ragioneSociale,
        vatNumber: params.invoiceData?.piva || customer.piva,
        codFiscale: params.invoiceData?.codFiscale || customer.codFiscale,
        sdi: params.invoiceData?.sdi || customer.sdi,
      } : undefined,
    },
  }).catch(err => console.error('Failed to send admin order email:', err));

  return { id: order.id };
}
