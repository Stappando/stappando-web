/**
 * POST /api/admin/recover-order
 *
 * Manually recreates a WooCommerce order from a Stripe Payment Intent.
 * Use when a payment succeeded on Stripe but the WC order was never created
 * (e.g. due to a webhook failure or truncated items_json metadata).
 *
 * Body:
 *   { paymentIntentId: string; secret: string; items?: {id,quantity,price}[] }
 *
 * The optional `items` array overrides what's in the Stripe metadata — useful
 * when metadata is corrupt/truncated.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createWCOrder } from '@/lib/payments/create-wc-order';
import { parseItemsFromMeta } from '@/lib/payments/items-meta';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let body: {
    paymentIntentId?: string;
    secret?: string;
    items?: { id: number; quantity: number; price: number; name?: string }[];
  };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'JSON non valido' }, { status: 400 }); }

  // Simple admin secret check
  const adminSecret = process.env.ADMIN_RECOVERY_SECRET;
  if (!adminSecret || body.secret !== adminSecret) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  if (!body.paymentIntentId) {
    return NextResponse.json({ error: 'paymentIntentId obbligatorio' }, { status: 400 });
  }

  const stripe = getStripe();

  // Fetch the Payment Intent from Stripe
  let pi: Awaited<ReturnType<typeof stripe.paymentIntents.retrieve>>;
  try {
    pi = await stripe.paymentIntents.retrieve(body.paymentIntentId);
  } catch (err) {
    return NextResponse.json({ error: `Stripe error: ${err instanceof Error ? err.message : String(err)}` }, { status: 502 });
  }

  if (pi.status !== 'succeeded') {
    return NextResponse.json({ error: `Payment intent status is '${pi.status}' — only 'succeeded' PIs can be recovered` }, { status: 400 });
  }

  const meta = (pi.metadata || {}) as Record<string, string>;

  // Check if a WC order already exists for this PI (idempotency)
  const { getWCSecrets } = await import('@/lib/config');
  const wc = getWCSecrets();
  const auth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;
  try {
    const existingRes = await fetch(
      `${wc.baseUrl}/wp-json/wc/v3/orders?${auth}&transaction_id=${pi.id}&per_page=1&_fields=id,transaction_id`,
    );
    if (existingRes.ok) {
      const existing = await existingRes.json();
      if (Array.isArray(existing) && existing.length > 0) {
        return NextResponse.json({
          error: `Ordine WC già esistente: #${existing[0].id}`,
          orderId: existing[0].id,
        }, { status: 409 });
      }
    }
  } catch { /* proceed */ }

  // Resolve items: prefer manual override, fallback to metadata parse
  let items = body.items && body.items.length > 0
    ? body.items.map(i => ({ id: i.id, name: i.name || '', price: i.price, quantity: i.quantity }))
    : parseItemsFromMeta(meta);

  if (items.length === 0) {
    // Return metadata debug info so the caller knows what's available
    return NextResponse.json({
      error: 'Nessun item trovato nei metadata Stripe. Passa items[] manualmente nel body.',
      metadata: {
        items_json: meta.items_json,
        customer_email: meta.customer_email,
        customer_name: meta.customer_name,
        shipping_cost: meta.shipping_cost,
        coupon_code: meta.coupon_code,
        coupon_discount: meta.coupon_discount,
        amount: pi.amount / 100,
      },
    }, { status: 422 });
  }

  const [firstName, ...lastParts] = (meta.customer_name || '').split(' ');

  try {
    const order = await createWCOrder({
      provider: 'stripe',
      transactionId: pi.id,
      customer: {
        email: meta.customer_email || '',
        firstName: firstName || '',
        lastName: lastParts.join(' ') || '',
        phone: meta.customer_phone || '',
        address: meta.shipping_address || '',
        city: meta.shipping_city || '',
        province: meta.shipping_province || '',
        zip: meta.shipping_zip || '',
        notes: meta.order_notes || '',
      },
      items,
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

    return NextResponse.json({
      success: true,
      orderId: order.id,
      itemsCount: items.length,
      note: items.length < 6 ? '⚠️ Verifica che tutti i prodotti siano presenti — il metadata potrebbe essere stato troncato' : undefined,
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Creazione ordine WC fallita: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 },
    );
  }
}
