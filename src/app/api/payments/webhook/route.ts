import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createWCOrder } from '@/lib/payments/create-wc-order';
import type Stripe from 'stripe';

export const dynamic = 'force-dynamic';

// In-memory set to track processed payment intents (survives within same serverless instance)
const processedPIs = new Set<string>();
// Also use a timestamp map to clean up old entries (prevent memory leak)
const processedTimestamps = new Map<string, number>();
function cleanupOldEntries() {
  const oneHourAgo = Date.now() - 3600000;
  for (const [key, ts] of processedTimestamps) {
    if (ts < oneHourAgo) { processedPIs.delete(key); processedTimestamps.delete(key); }
  }
}

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
        // Idempotency check 1: in-memory set (catches rapid retries on same instance)
        cleanupOldEntries();
        if (processedPIs.has(pi.id)) {
          console.log(`[Stripe webhook] PI ${pi.id} already processed (in-memory), skipping`);
          return NextResponse.json({ received: true, skipped: true });
        }
        // Mark as processing immediately
        processedPIs.add(pi.id);
        processedTimestamps.set(pi.id, Date.now());

        // Idempotency check 2: search WC orders by email + total amount in last hour
        const { getWCSecrets } = await import('@/lib/config');
        const wc = getWCSecrets();
        const auth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;
        const after = new Date(Date.now() - 300000).toISOString(); // last 5 minutes
        const checkUrl = `${wc.baseUrl}/wp-json/wc/v3/orders?${auth}&after=${after}&per_page=10&_fields=id,transaction_id&status=processing`;
        try {
          const checkRes = await fetch(checkUrl);
          if (checkRes.ok) {
            const recent = await checkRes.json();
            const duplicate = recent.find((o: { transaction_id: string }) => o.transaction_id === pi.id);
            if (duplicate) {
              console.log(`[Stripe webhook] Order #${duplicate.id} already exists for PI ${pi.id}, skipping`);
              return NextResponse.json({ received: true, skipped: true });
            }
          }
        } catch { /* proceed if check fails */ }
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
          items: items.map((i: { id: number; qty: number; price: number; name?: string }) => ({
            id: i.id, name: i.name || '', price: i.price, quantity: i.qty,
          })),
          shippingCost: parseFloat(meta.shipping_cost || '0'),
          preferences: meta.preferred_carrier ? { carrier: meta.preferred_carrier } : undefined,
          couponCode: meta.coupon_code || undefined,
          couponDiscount: parseFloat(meta.coupon_discount || '0'),
          needsInvoice: meta.needs_invoice === 'true',
          invoiceData: meta.needs_invoice === 'true' ? {
            piva: meta.invoice_piva || '',
            ragioneSociale: meta.invoice_ragione || '',
            codFiscale: meta.invoice_cf || '',
            sdi: meta.invoice_sdi || '',
          } : undefined,
        });
      }
    } catch (err) {
      console.error('Failed to create WC order from Stripe:', err);
    }
  }

  return NextResponse.json({ received: true });
}
