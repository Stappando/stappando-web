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

    // Look for _stripe_customer_id in meta_data AND in billing.address_2 JSON
    // (WC meta_data bug: new keys may not persist, so we also store in billing.address_2)
    const meta: { key: string; value: string }[] = customer.meta_data || [];
    let stripeCustomerId = meta.find((m) => m.key === '_stripe_customer_id')?.value || null;

    // Also check billing.address_2 JSON backup
    if (!stripeCustomerId) {
      try {
        const addr2 = customer.billing?.address_2 || '';
        if (addr2.startsWith('{')) {
          const extra = JSON.parse(addr2) as Record<string, string>;
          stripeCustomerId = extra._stripe_customer_id || null;
        }
      } catch { /* */ }
    }

    const stripe = getStripe();

    if (!stripeCustomerId) {
      const name = [customer.first_name, customer.last_name].filter(Boolean).join(' ').trim();
      const newCustomer = await stripe.customers.create({
        email: customer.email,
        ...(name ? { name } : {}),
        metadata: { wc_customer_id: String(body.customerId) },
      });
      stripeCustomerId = newCustomer.id;

      // Save to BOTH meta_data AND billing.address_2 JSON to survive WC meta bug
      // 1. Try meta_data (works if key already exists or on newer WC)
      const putMeta = fetch(`${wc.baseUrl}/wp-json/wc/v3/customers/${body.customerId}?${auth}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meta_data: [{ key: '_stripe_customer_id', value: stripeCustomerId }],
        }),
      }).then(r => {
        if (!r.ok) r.text().then(t => console.error(`setup-intent: meta PUT failed ${r.status}:`, t));
        else console.log(`setup-intent: saved _stripe_customer_id via meta for customer ${body.customerId}`);
      }).catch(e => console.error('setup-intent: meta PUT exception:', e));

      // 2. Save to billing.address_2 JSON (reliable, WC always saves billing fields)
      const addr2 = customer.billing?.address_2 || '';
      let extra: Record<string, string> = {};
      try { if (addr2.startsWith('{')) extra = JSON.parse(addr2); } catch { /* */ }
      extra._stripe_customer_id = stripeCustomerId;

      const putAddr = fetch(`${wc.baseUrl}/wp-json/wc/v3/customers/${body.customerId}?${auth}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billing: { address_2: JSON.stringify(extra) } }),
      }).then(r => {
        if (!r.ok) r.text().then(t => console.error(`setup-intent: addr2 PUT failed ${r.status}:`, t));
        else console.log(`setup-intent: saved _stripe_customer_id via billing.address_2 for customer ${body.customerId}`);
      }).catch(e => console.error('setup-intent: addr2 PUT exception:', e));

      // Fire both saves in parallel (non-blocking)
      await Promise.allSettled([putMeta, putAddr]);
    }

    // Create SetupIntent
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
