/** PayPal REST API v2 helper — server-side only */

function getPayPalConfig() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const mode = process.env.PAYPAL_MODE || 'sandbox';

  if (!clientId || !clientSecret) {
    throw new Error('Missing PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET');
  }

  const baseUrl = mode === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

  return { clientId, clientSecret, baseUrl };
}

/** Get OAuth2 access token from PayPal */
async function getAccessToken(): Promise<string> {
  const { clientId, clientSecret, baseUrl } = getPayPalConfig();

  const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal auth failed: ${res.status} ${err}`);
  }

  const data = await res.json();
  return data.access_token;
}

interface CreateOrderParams {
  totalAmount: string; // e.g. "13.30"
  currency?: string;
  description: string;
  returnUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

interface PayPalOrder {
  id: string;
  approvalUrl: string;
}

/** Create a PayPal order */
export async function createPayPalOrder(params: CreateOrderParams): Promise<PayPalOrder> {
  const { baseUrl } = getPayPalConfig();
  const token = await getAccessToken();

  const res = await fetch(`${baseUrl}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: params.currency || 'EUR',
          value: params.totalAmount,
        },
        description: params.description,
        custom_id: params.metadata ? JSON.stringify(params.metadata).slice(0, 127) : undefined,
      }],
      payment_source: {
        paypal: {
          experience_context: {
            return_url: params.returnUrl,
            cancel_url: params.cancelUrl,
            user_action: 'PAY_NOW',
            brand_name: 'Stappando',
            locale: 'it-IT',
            shipping_preference: 'NO_SHIPPING',
          },
        },
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal create order failed: ${res.status} ${err}`);
  }

  const order = await res.json();
  const approvalLink = order.links?.find((l: { rel: string; href: string }) => l.rel === 'payer-action');

  if (!approvalLink?.href) {
    throw new Error('PayPal order missing approval URL');
  }

  return { id: order.id, approvalUrl: approvalLink.href };
}

interface CaptureResult {
  id: string;
  status: string;
  captureId: string;
}

/** Capture a PayPal order after buyer approval */
export async function capturePayPalOrder(orderId: string): Promise<CaptureResult> {
  const { baseUrl } = getPayPalConfig();
  const token = await getAccessToken();

  const res = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal capture failed: ${res.status} ${err}`);
  }

  const data = await res.json();
  const capture = data.purchase_units?.[0]?.payments?.captures?.[0];

  return {
    id: data.id,
    status: data.status,
    captureId: capture?.id || data.id,
  };
}
