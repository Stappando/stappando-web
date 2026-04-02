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
    const auth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;

    // Fetch WC customer
    const wcRes = await fetch(`${wc.baseUrl}/wp-json/wc/v3/customers/${body.customerId}?${auth}`);
    if (!wcRes.ok) {
      const errText = await wcRes.text().catch(() => '');
      console.error(`setup-intent: WC customer fetch failed ${wcRes.status}:`, errText);
      return NextResponse.json({ error: 'Cliente WooCommerce non trovato' }, { status: 404 });
    }
    const customer = await wcRes.json();

    const meta: { key: string; value: string }[] = customer.meta_data || [];
    let stripeCustomerId = meta.find((m) => m.key === '_stripe_customer_id')?.value || null;

    const stripe = getStripe();

    // Create Stripe customer if not present, then save ID to WC
    if (!stripeCustomerId) {
      const name = [customer.first_name, customer.last_name].filter(Boolean).join(' ').trim();
      const newCustomer = await stripe.customers.create({
        email: customer.email,
        ...(name ? { name } : {}),
        metadata: { wc_customer_id: String(body.customerId) },
      });
      stripeCustomerId = newCustomer.id;

      // Persist Stripe customer ID to WC meta (query-param auth, consistent with rest of codebase)
      const putRes = await fetch(`${wc.baseUrl}/wp-json/wc/v3/customers/${body.customerId}?${auth}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meta_data: [{ key: '_stripe_customer_id', value: stripeCustomerId }],
        }),
      });
      if (!putRes.ok) {
        const putErr = await putRes.text().catch(() => '');
        console.error(`setup-intent: failed to save _stripe_customer_id to WC (${putRes.status}):`, putErr);
        // Non-fatal: continue — SetupIntent will still work for this session
      } else {
        console.log(`setup-intent: saved Stripe customer ${stripeCustomerId} to WC #${body.customerId}`);
      }
    }

    // Create SetupIntent — card-only, no redirects (compatible with legacy CardElement)
    const setupIntent = await stripe.setupIntents.create({
      customer: stripeCustomerId,
      usage: 'off_session',
      payment_method_types: ['card'],
    });

    return NextResponse.json({ clientSecret: setupIntent.client_secret });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('setup-intent POST error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
