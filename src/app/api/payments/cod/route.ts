import { NextRequest, NextResponse } from 'next/server';
import { createWCOrder } from '@/lib/payments/create-wc-order';

export const dynamic = 'force-dynamic';

/** POST: Cash on delivery — creates WC order with cod payment method (TEST ONLY) */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body?.customer || !body?.items) {
      return NextResponse.json({ error: 'Dati mancanti' }, { status: 400 });
    }

    const wcOrder = await createWCOrder({
      provider: 'cod',
      transactionId: `COD-${Date.now()}`,
      customer: body.customer,
      items: body.items,
      shippingCost: body.shipping || 0,
      preferences: body.carrier ? { carrier: body.carrier } : undefined,
      couponCode: body.couponCode || undefined,
    });

    return NextResponse.json({ success: true, orderId: wcOrder?.id || 'created' });
  } catch (err) {
    console.error('COD order error:', err);
    return NextResponse.json({ error: 'Errore creazione ordine contrassegno' }, { status: 500 });
  }
}
