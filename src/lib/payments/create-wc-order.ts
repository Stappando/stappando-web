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
}

export async function createWCOrder(params: CreateWCOrderParams): Promise<{ id: number }> {
  const { provider, transactionId, customer, items, shippingCost } = params;
  const carrier = params.preferences?.carrier;

  const wc = getWCSecrets();
  const auth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;
  const url = `${wc.baseUrl}/wp-json/wc/v3/orders?${auth}`;

  // Build customer note with carrier preference
  const noteParts: string[] = [];
  if (customer.notes) noteParts.push(customer.notes);
  if (carrier) noteParts.push(`Corriere preferito: ${CARRIER_NAMES[carrier] || carrier}`);

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
      ? [{ method_id: 'flat_rate', method_title: carrier ? `Spedizione (${CARRIER_NAMES[carrier] || carrier})` : 'Spedizione', total: String(shippingCost) }]
      : [],
    coupon_lines: params.couponCode ? [{ code: params.couponCode }] : [],
    customer_note: noteParts.join(' — '),
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

  // ── Send order confirmation email to customer ──
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const total = subtotal + shippingCost;
  const popPoints = Math.round(total);

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
      orderUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://stappando.it'}/account`,
      shippingAddress: `${customer.firstName} ${customer.lastName}, ${customer.address}, ${customer.zip} ${customer.city} (${customer.province})`,
      pointsEarned: popPoints,
    },
  }).catch(err => console.error('Failed to send order confirmation email:', err));

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
