import { NextRequest, NextResponse } from 'next/server';
import { createPayPalOrder } from '@/lib/payments/paypal';
import { isValidEmail, isNonEmptyString, sanitize } from '@/lib/validation';
import { validateStock } from '@/lib/payments/validate-stock';
import type { OrderPayload } from '@/lib/payments/types';

export async function POST(req: NextRequest) {
  try {
    const body: OrderPayload = await req.json().catch(() => null) as OrderPayload;
    if (!body) {
      return NextResponse.json({ error: 'Body JSON non valido' }, { status: 400 });
    }

    // Validate
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: 'Carrello vuoto' }, { status: 400 });
    }
    for (const item of body.items) {
      if (!item.id || typeof item.price !== 'number' || item.price <= 0 || !item.quantity) {
        return NextResponse.json({ error: 'Dati prodotto non validi' }, { status: 400 });
      }
    }

    const c = body.customer;
    if (!c || !isValidEmail(c.email)) {
      return NextResponse.json({ error: 'Email non valida' }, { status: 400 });
    }
    if (!isNonEmptyString(c.firstName) || !isNonEmptyString(c.lastName)) {
      return NextResponse.json({ error: 'Nome e cognome obbligatori' }, { status: 400 });
    }
    if (!isNonEmptyString(c.address) || !isNonEmptyString(c.city) || !isNonEmptyString(c.zip)) {
      return NextResponse.json({ error: 'Indirizzo completo obbligatorio' }, { status: 400 });
    }

    // Stock validation — check availability before opening PayPal
    const stockCheck = await validateStock(
      body.items.map((i) => ({ id: i.id, name: i.name || '', quantity: i.quantity })),
    );
    if (!stockCheck.ok) {
      return NextResponse.json({ error: stockCheck.error }, { status: 409 });
    }

    // Calculate total (subtract coupon discount if any)
    const itemsTotal = body.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = typeof body.shipping === 'number' && body.shipping >= 0 ? body.shipping : 0;
    const couponDiscount = typeof body.couponDiscount === 'number' && body.couponDiscount > 0 ? body.couponDiscount : 0;
    const total = Math.max(0.5, itemsTotal + shipping - couponDiscount);

    if (total < 0.5) {
      return NextResponse.json({ error: 'Importo minimo 0,50€' }, { status: 400 });
    }

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || '';

    // Store order data in metadata for capture callback
    const metadata = {
      e: sanitize(c.email, 100),
      n: sanitize(`${c.firstName} ${c.lastName}`, 80),
      s: shipping.toString(),
      i: JSON.stringify(body.items.map((i) => ({ id: i.id, q: i.quantity, p: i.price }))).slice(0, 127),
    };

    const order = await createPayPalOrder({
      totalAmount: total.toFixed(2),
      description: `Ordine Stappando — ${body.items.length} prodott${body.items.length === 1 ? 'o' : 'i'}`,
      returnUrl: `${origin}/api/payments/paypal/capture?order_data=${encodeURIComponent(
        Buffer.from(JSON.stringify({ customer: c, items: body.items, shipping })).toString('base64')
      )}`,
      cancelUrl: `${origin}/checkout?paypal=cancelled`,
      metadata,
    });

    return NextResponse.json({ approvalUrl: order.approvalUrl, orderId: order.id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('PayPal create-order error:', msg);
    console.error('PayPal create-order stack:', err instanceof Error ? err.stack : '');
    return NextResponse.json(
      { error: `Errore PayPal: ${msg}` },
      { status: 500 },
    );
  }
}
