/** Shared WooCommerce order creation — used by all payment provider webhooks/callbacks */
import { getWCSecrets } from '@/lib/config';
import { dispatchEmail } from '@/lib/mail/dispatcher';
import { splitOrderIntoSubOrders } from '@/lib/vendor/sub-orders';
import type { OrderCustomer, OrderLineItem, PaymentProvider } from './types';

const PROVIDER_TITLES: Record<PaymentProvider, string> = {
  stripe: 'Carta di credito (Stripe)',
  paypal: 'PayPal',
  cod: 'Contrassegno (Test)',
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

interface CreateWCOrderParams {
  provider: PaymentProvider;
  transactionId: string;
  customer: OrderCustomer;
  items: OrderLineItem[];
  shippingCost: number;
  preferences?: CustomerPreferences;
  couponCode?: string;
  couponDiscount?: number;
}

export async function createWCOrder(params: CreateWCOrderParams): Promise<{ id: number }> {
  const { provider, transactionId, customer, items, shippingCost } = params;
  const carrierId = params.preferences?.carrier || '';
  const carrierName = CARRIER_NAMES[carrierId] || carrierId || 'Corriere espresso';
  const deliveryEst = CARRIER_DELIVERY[carrierId] || '1-3 giorni lavorativi';

  const wc = getWCSecrets();
  const auth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;
  const url = `${wc.baseUrl}/wp-json/wc/v3/orders?${auth}`;

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
    meta_data: customer.needsInvoice ? [
      { key: '_needs_invoice', value: 'true' },
      { key: '_invoice_company', value: customer.ragioneSociale || '' },
      { key: '_invoice_vat', value: customer.piva || '' },
      { key: '_invoice_cf', value: customer.codFiscale || '' },
      { key: '_invoice_sdi', value: customer.sdi || '' },
    ] : [],
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

  // ── Computed values for emails ──
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const discount = params.couponDiscount || 0;
  const total = subtotal + shippingCost - discount;
  const popPoints = Math.round(total);
  const shippingAddr = `${customer.firstName} ${customer.lastName}, ${customer.address}, ${customer.zip} ${customer.city} (${customer.province})`;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://stappando.it';

  // ── MAIL 1: Send order confirmation email to customer ──
  dispatchEmail({
    type: 'order.confirmed',
    email: customer.email,
    name: `${customer.firstName} ${customer.lastName}`,
    data: {
      customerName: customer.firstName,
      orderNumber: String(order.id),
      items: items.map(i => ({
        name: i.name,
        quantity: i.quantity,
        total: `${(i.price * i.quantity).toFixed(2)}`,
      })),
      shipping: shippingCost > 0 ? `${shippingCost.toFixed(2)}` : 'Gratuita',
      total: `${total.toFixed(2)}`,
      orderUrl: `${siteUrl}/account`,
      shippingAddress: shippingAddr,
      carrierName,
      deliveryEstimate: deliveryEst,
      discount: discount > 0 ? discount.toFixed(2) : undefined,
      pointsEarned: popPoints,
      invoiceData: customer.needsInvoice ? {
        companyName: customer.ragioneSociale,
        vatNumber: customer.piva,
        pec: undefined,
        sdi: customer.sdi,
      } : undefined,
    },
  }).catch(err => console.error('Failed to send order confirmation email:', err));

  // ── MAIL 2: Send admin notification to ordini@stappando.it ──
  dispatchEmail({
    type: 'admin.new-order',
    email: 'ordini@stappando.it',
    name: 'Stappando Ordini',
    data: {
      orderNumber: String(order.id),
      customerName: `${customer.firstName} ${customer.lastName}`,
      customerEmail: customer.email,
      customerPhone: customer.phone || '',
      vendorGroups: [{ vendorName: 'Tutti i prodotti', items: items.map(i => ({ name: i.name, quantity: i.quantity, total: (i.price * i.quantity).toFixed(2) })), subtotal: subtotal.toFixed(2) }],
      carrierName,
      shippingAddress: shippingAddr,
      billingAddress: shippingAddr,
      paymentMethod: PROVIDER_TITLES[provider],
      transactionId,
      subtotal: subtotal.toFixed(2),
      shippingCost: shippingCost.toFixed(2),
      discount: discount > 0 ? discount.toFixed(2) : undefined,
      total: total.toFixed(2),
      customerNotes: customer.notes || undefined,
      carrierPreference: carrierName,
      invoiceData: customer.needsInvoice ? {
        companyName: customer.ragioneSociale,
        vatNumber: customer.piva,
        sdi: customer.sdi,
      } : undefined,
    },
  }).catch(err => console.error('Failed to send admin order email:', err));

  // ── Split into vendor sub-orders ──
  try {
    const parentOrderFull = await fetch(`${wc.baseUrl}/wp-json/wc/v3/orders/${order.id}?${auth}`).then(r => r.json());
    const subResults = await splitOrderIntoSubOrders(parentOrderFull);
    if (subResults.length > 0) {
      console.log(`Order #${order.id} split into ${subResults.length} sub-orders: ${subResults.map(r => `#${r.subOrderId}`).join(', ')}`);
    }
  } catch (err) {
    console.error(`Failed to split order #${order.id} into sub-orders:`, err);
  }

  return { id: order.id };
}
