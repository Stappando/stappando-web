import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body?.orderId) {
      return NextResponse.json({ error: 'Dati non validi' }, { status: 400 });
    }

    const wc = getWCSecrets();
    const auth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;

    // Add reso note to order
    await fetch(`${wc.baseUrl}/wp-json/wc/v3/orders/${body.orderId}/notes?${auth}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        note: `Richiesta reso — Motivo: ${body.reason} | Modalità: ${body.pickup === 'home' ? `Ritiro domicilio ${body.pickupDate} ${body.pickupSlot}` : 'Porto alle Poste'} | Prodotti: ${body.items?.length || 0} | Rimborso stimato: €${body.refundAmount}`,
        customer_note: true,
      }),
    });

    // Update order meta with reso status
    await fetch(`${wc.baseUrl}/wp-json/wc/v3/orders/${body.orderId}?${auth}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        meta_data: [
          { key: '_reso_requested', value: 'true' },
          { key: '_reso_date', value: new Date().toISOString() },
          { key: '_reso_reason', value: body.reason },
          { key: '_reso_pickup', value: body.pickup },
        ],
      }),
    });

    console.log(`Reso requested for order ${body.orderNumber}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Reso API error:', err);
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 });
  }
}
