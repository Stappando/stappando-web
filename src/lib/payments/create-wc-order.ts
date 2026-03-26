/** Shared WooCommerce order creation — used by all payment provider webhooks/callbacks */
import { getWCSecrets } from '@/lib/config';
import type { OrderCustomer, OrderLineItem, PaymentProvider } from './types';

const PROVIDER_TITLES: Record<PaymentProvider, string> = {
  stripe: 'Carta di credito (Stripe)',
  paypal: 'PayPal',
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

  const wc = getWCSecrets();
  const url = `${wc.baseUrl}/wp-json/wc/v3/orders?consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;

  const orderData = {
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
      ? [{ method_id: 'flat_rate', method_title: 'Spedizione', total: String(shippingCost) }]
      : [],
    coupon_lines: params.couponCode ? [{ code: params.couponCode }] : [],
    customer_note: customer.notes || '',
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

  // Add customer preferences as internal order note
  if (params.preferences) {
    const { carrier, newsletter } = params.preferences;
    const carrierNames: Record<string, string> = { brt: 'BRT Corriere Espresso', fedex: 'FedEx / TNT', poste: 'Poste Italiane' };
    const noteParts = [
      carrier ? `Corriere: ${carrierNames[carrier] || carrier}` : null,
      newsletter !== undefined ? `Newsletter: ${newsletter ? 'Sì' : 'No'}` : null,
    ].filter(Boolean);

    if (noteParts.length > 0) {
      const noteUrl = `${wc.baseUrl}/wp-json/wc/v3/orders/${order.id}/notes?consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;
      fetch(noteUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: `Preferenze cliente: ${noteParts.join(' | ')}`, customer_note: false }),
      }).catch(err => console.error('Failed to add preferences note:', err));
    }
  }

  return { id: order.id };
}
