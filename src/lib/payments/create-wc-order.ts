/** Shared WooCommerce order creation — used by all payment provider webhooks/callbacks */
import { getWCSecrets } from '@/lib/config';
import type { OrderCustomer, OrderLineItem, PaymentProvider } from './types';

const PROVIDER_TITLES: Record<PaymentProvider, string> = {
  stripe: 'Carta di credito (Stripe)',
  paypal: 'PayPal',
};

interface CreateWCOrderParams {
  provider: PaymentProvider;
  transactionId: string;
  customer: OrderCustomer;
  items: OrderLineItem[];
  shippingCost: number;
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
  return { id: order.id };
}
