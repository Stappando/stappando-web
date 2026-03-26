import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createWCOrder } from '@/lib/payments/create-wc-order';
import type Stripe from 'stripe';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('Missing STRIPE_WEBHOOK_SECRET');
    return NextResponse.json({ error: 'Server config error' }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    const rawBody = await req.text();
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Firma non valida' }, { status: 400 });
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as Stripe.PaymentIntent;
    try {
      const meta = pi.metadata;
      if (!meta.customer_email || !meta.items_json) {
        console.error('Payment intent missing metadata:', pi.id);
      } else {
        const items = JSON.parse(meta.items_json);
        const [firstName, ...lastParts] = (meta.customer_name || '').split(' ');

        await createWCOrder({
          provider: 'stripe',
          transactionId: pi.id,
          customer: {
            email: meta.customer_email,
            firstName: firstName || '',
            lastName: lastParts.join(' ') || '',
            phone: meta.customer_phone || '',
            address: meta.shipping_address || '',
            city: meta.shipping_city || '',
            province: meta.shipping_province || '',
            zip: meta.shipping_zip || '',
            notes: meta.order_notes || '',
          },
          items: items.map((i: { id: number; qty: number; price: number }) => ({
            id: i.id, name: '', price: i.price, quantity: i.qty,
          })),
          shippingCost: parseFloat(meta.shipping_cost || '0'),
          preferences: meta.preferred_carrier ? { carrier: meta.preferred_carrier } : undefined,
        });
      }
    } catch (err) {
      console.error('Failed to create WC order from Stripe:', err);
    }
  }

  return NextResponse.json({ received: true });
}
