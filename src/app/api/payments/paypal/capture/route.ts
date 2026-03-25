import { NextRequest, NextResponse } from 'next/server';
import { capturePayPalOrder } from '@/lib/payments/paypal';
import { createWCOrder } from '@/lib/payments/create-wc-order';
import type { OrderCustomer, OrderLineItem } from '@/lib/payments/types';

export const dynamic = 'force-dynamic';

/** POST: inline capture from PayPal JS SDK (modal checkout) */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body?.orderId || !body?.customer || !body?.items) {
      return NextResponse.json({ error: 'Dati mancanti' }, { status: 400 });
    }

    const capture = await capturePayPalOrder(body.orderId);

    if (capture.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'Pagamento non completato', status: capture.status }, { status: 400 });
    }

    await createWCOrder({
      provider: 'paypal',
      transactionId: capture.captureId,
      customer: body.customer,
      items: body.items,
      shippingCost: body.shipping || 0,
    });

    return NextResponse.json({ success: true, captureId: capture.captureId });
  } catch (err) {
    console.error('PayPal inline capture error:', err);
    return NextResponse.json({ error: 'Errore cattura pagamento PayPal' }, { status: 500 });
  }
}

/** GET: redirect capture after PayPal approval (legacy checkout page) */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const token = searchParams.get('token'); // PayPal order ID
  const orderDataB64 = searchParams.get('order_data');
  const origin = process.env.NEXT_PUBLIC_SITE_URL || '';

  if (!token) {
    return NextResponse.redirect(`${origin}/checkout?paypal=error&reason=missing_token`);
  }

  if (!orderDataB64) {
    return NextResponse.redirect(`${origin}/checkout?paypal=error&reason=missing_data`);
  }

  try {
    // Decode order data
    let orderData: { customer: OrderCustomer; items: OrderLineItem[]; shipping: number };
    try {
      orderData = JSON.parse(Buffer.from(orderDataB64, 'base64').toString('utf-8'));
    } catch {
      return NextResponse.redirect(`${origin}/checkout?paypal=error&reason=invalid_data`);
    }

    // Validate decoded data
    if (!orderData.customer?.email || !Array.isArray(orderData.items) || orderData.items.length === 0) {
      return NextResponse.redirect(`${origin}/checkout?paypal=error&reason=invalid_data`);
    }

    // Capture payment
    const capture = await capturePayPalOrder(token);

    if (capture.status !== 'COMPLETED') {
      console.error('PayPal capture not completed:', capture);
      return NextResponse.redirect(`${origin}/checkout/conferma?status=processing&provider=paypal`);
    }

    // Create WC order
    await createWCOrder({
      provider: 'paypal',
      transactionId: capture.captureId,
      customer: orderData.customer,
      items: orderData.items,
      shippingCost: orderData.shipping,
    });

    return NextResponse.redirect(`${origin}/checkout/conferma?status=succeeded&provider=paypal`);
  } catch (err) {
    console.error('PayPal capture error:', err);
    return NextResponse.redirect(`${origin}/checkout/conferma?status=failed&provider=paypal`);
  }
}
