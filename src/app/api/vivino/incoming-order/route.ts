import { NextRequest, NextResponse } from 'next/server';
import { createWCOrder } from '@/lib/payments/create-wc-order';
import { sanitize } from '@/lib/validation';

const ADMIN_PASSWORD = 'stappando2026';

export async function POST(req: NextRequest) {
  const pwd = req.headers.get('x-admin-password');
  if (pwd !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { vivinoOrderId, customer, items, notes } = body;

    // Validate required fields
    if (!vivinoOrderId || typeof vivinoOrderId !== 'string') {
      return NextResponse.json({ error: 'ID ordine Vivino obbligatorio' }, { status: 400 });
    }
    if (!customer?.firstName || !customer?.lastName) {
      return NextResponse.json({ error: 'Dati cliente incompleti (nome, cognome)' }, { status: 400 });
    }
    if (!customer?.address || !customer?.city || !customer?.province || !customer?.zip) {
      return NextResponse.json({ error: 'Indirizzo di spedizione incompleto' }, { status: 400 });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Almeno un prodotto richiesto' }, { status: 400 });
    }
    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity < 1) {
        return NextResponse.json({ error: `Prodotto non valido: ${JSON.stringify(item)}` }, { status: 400 });
      }
    }

    const order = await createWCOrder({
      provider: 'vivino',
      transactionId: sanitize(vivinoOrderId),
      customer: {
        email: sanitize(customer.email),
        firstName: sanitize(customer.firstName),
        lastName: sanitize(customer.lastName),
        phone: customer.phone ? sanitize(customer.phone) : undefined,
        address: sanitize(customer.address),
        city: sanitize(customer.city),
        province: sanitize(customer.province),
        zip: sanitize(customer.zip),
        notes: notes ? sanitize(notes) : undefined,
      },
      items: items.map((item: { productId: number; quantity: number; name?: string; price?: number }) => ({
        id: item.productId,
        name: item.name || `Prodotto #${item.productId}`,
        price: item.price || 0,
        quantity: item.quantity,
      })),
      shippingCost: 0, // Vivino handles shipping cost on their side
      extraMeta: [
        { key: '_vivino_order_id', value: sanitize(vivinoOrderId) },
        { key: '_order_source', value: 'vivino' },
      ],
    });

    return NextResponse.json({ success: true, orderId: order.id });
  } catch (err) {
    console.error('Vivino incoming order error:', err);
    const message = err instanceof Error ? err.message : 'Errore sconosciuto';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
