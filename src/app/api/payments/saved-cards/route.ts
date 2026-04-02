import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { getWCSecrets } from '@/lib/config';

async function getStripeCustomerId(customerId: string): Promise<string | null> {
  const wc = getWCSecrets();
  const auth = Buffer.from(`${wc.consumerKey}:${wc.consumerSecret}`).toString('base64');
  const res = await fetch(`${wc.baseUrl}/wp-json/wc/v3/customers/${customerId}`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  if (!res.ok) return null;
  const customer = await res.json();
  const meta: { key: string; value: string }[] = customer.meta_data || [];
  return meta.find((m) => m.key === '_stripe_customer_id')?.value || null;
}

export async function GET(req: NextRequest) {
  try {
    const customerId = req.nextUrl.searchParams.get('customerId');
    if (!customerId) {
      return NextResponse.json({ error: 'customerId richiesto' }, { status: 400 });
    }

    const stripeCustomerId = await getStripeCustomerId(customerId);
    if (!stripeCustomerId) {
      return NextResponse.json({ cards: [] });
    }

    const stripe = getStripe();
    const paymentMethods = await stripe.paymentMethods.list({
      customer: stripeCustomerId,
      type: 'card',
    });

    const cards = paymentMethods.data.map((pm) => ({
      id: pm.id,
      brand: pm.card?.brand || 'unknown',
      last4: pm.card?.last4 || '????',
      expMonth: pm.card?.exp_month || 0,
      expYear: pm.card?.exp_year || 0,
      isDefault: false,
    }));

    return NextResponse.json({ cards });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('saved-cards GET error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const paymentMethodId = req.nextUrl.searchParams.get('paymentMethodId');
    if (!paymentMethodId) {
      return NextResponse.json({ error: 'paymentMethodId richiesto' }, { status: 400 });
    }

    const stripe = getStripe();
    await stripe.paymentMethods.detach(paymentMethodId);

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('saved-cards DELETE error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
