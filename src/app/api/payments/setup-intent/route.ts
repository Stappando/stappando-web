import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { getWCSecrets } from '@/lib/config';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body.customerId !== 'number') {
      return NextResponse.json({ error: 'customerId richiesto' }, { status: 400 });
    }

    const wc = getWCSecrets();
    const auth = Buffer.from(`${wc.consumerKey}:${wc.consumerSecret}`).toString('base64');

    // Fetch WC customer
    const wcRes = await fetch(`${wc.baseUrl}/wp-json/wc/v3/customers/${body.customerId}`, {
      headers: { Authorization: `Basic ${auth}` },
    });
    if (!wcRes.ok) {
      return NextResponse.json({ error: 'Cliente WooCommerce non trovato' }, { status: 404 });
    }
    const customer = await wcRes.json();

    const meta: { key: string; value: string }[] = customer.meta_data || [];
    let stripeCustomerId = meta.find((m) => m.key === '_stripe_customer_id')?.value || null;

    const stripe = getStripe();

    // Create Stripe customer if not present
    if (!stripeCustomerId) {
      const name = [customer.first_name, customer.last_name].filter(Boolean).join(' ').trim();
      const newCustomer = await stripe.customers.create({
        email: customer.email,
        ...(name ? { name } : {}),
      });
      stripeCustomerId = newCustomer.id;

      // Save back to WC customer meta
      await fetch(`${wc.baseUrl}/wp-json/wc/v3/customers/${body.customerId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meta_data: [{ key: '_stripe_customer_id', value: stripeCustomerId }],
        }),
      });
    }

    // Create SetupIntent
    const setupIntent = await stripe.setupIntents.create({
      customer: stripeCustomerId,
      usage: 'off_session',
    });

    return NextResponse.json({ clientSecret: setupIntent.client_secret });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('setup-intent POST error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
