/**
 * Mandrill Inbound webhook — receives Vivino order notification emails,
 * auto-parses them, matches the product in WooCommerce, and creates the order.
 *
 * Setup:
 * 1. In Mandrill → Inbound → Add Route
 * 2. Set receiving domain (e.g. inbound.stappando.it)
 * 3. Route pattern: vivino@inbound.stappando.it (or wildcard)
 * 4. Webhook URL: https://shop.stappando.it/api/vivino/email-webhook
 * 5. Forward Vivino notification emails to vivino@inbound.stappando.it
 *
 * Alternatively: set up an email forwarding rule in your mailbox to auto-forward
 * Vivino emails to the inbound address.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createWCOrder } from '@/lib/payments/create-wc-order';
import { parseVivinoEmail } from '@/lib/vivino/parse-email';
import { getWCSecrets } from '@/lib/config';
import { sendEmail } from '@/lib/mail/mandrill';
import { sanitize } from '@/lib/validation';

/* ── Search WC product by name (server-side) ──────────── */

async function searchWCProduct(query: string): Promise<{ id: number; name: string; price: string } | null> {
  const wc = getWCSecrets();
  const auth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;

  // Try progressively shorter search terms until we find a match
  const words = query.split(/\s+/).filter(w => w.length > 2);
  const attempts = [
    words.slice(0, 4).join(' '), // "Pasetti Testarossa Montepulciano d'Abruzzo"
    words.slice(0, 3).join(' '), // "Pasetti Testarossa Montepulciano"
    words.slice(0, 2).join(' '), // "Pasetti Testarossa"
    words[0],                     // "Pasetti"
  ].filter(Boolean);

  for (const term of attempts) {
    try {
      const url = `${wc.baseUrl}/wp-json/wc/v3/products?${auth}&search=${encodeURIComponent(term)}&per_page=3&status=publish&_fields=id,name,price`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const products = await res.json();
      if (Array.isArray(products) && products.length > 0) {
        return { id: products[0].id, name: products[0].name, price: products[0].price };
      }
    } catch { /* try next */ }
  }
  return null;
}

/* ── Mandrill inbound HEAD (for webhook validation) ───── */

export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}

/* ── Mandrill inbound POST ────────────────────────────── */

export async function POST(req: NextRequest) {
  try {
    // Mandrill sends multipart form with mandrill_events JSON
    let emailText = '';

    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const eventsJson = formData.get('mandrill_events');
      if (typeof eventsJson === 'string') {
        const events = JSON.parse(eventsJson);
        // Take the first inbound event
        const msg = events?.[0]?.msg;
        if (msg) {
          emailText = msg.text || msg.html?.replace(/<[^>]+>/g, ' ') || '';
        }
      }
    } else {
      // Direct JSON post (for testing / alternative setups)
      const body = await req.json();
      emailText = body.text || body.emailText || '';
    }

    if (!emailText) {
      console.warn('[vivino/email-webhook] No email text found in payload');
      return NextResponse.json({ status: 'ignored', reason: 'no email text' });
    }

    // Only process Vivino order emails
    if (!emailText.includes('ordine') && !emailText.includes('Vivino')) {
      console.log('[vivino/email-webhook] Not a Vivino order email, skipping');
      return NextResponse.json({ status: 'ignored', reason: 'not a Vivino email' });
    }

    const parsed = parseVivinoEmail(emailText);
    if (!parsed) {
      console.error('[vivino/email-webhook] Failed to parse Vivino email');
      await notifyAdmin('Parsing fallito', 'Impossibile parsare l\'email Vivino. Controlla manualmente.', emailText);
      return NextResponse.json({ status: 'error', reason: 'parse failed' });
    }

    console.log(`[vivino/email-webhook] Parsed order ${parsed.vivinoOrderId}: ${parsed.productName} x${parsed.quantity}`);

    // Search for the product in WooCommerce
    const product = await searchWCProduct(parsed.productName);
    if (!product) {
      console.error(`[vivino/email-webhook] No WC product match for: ${parsed.productName}`);
      await notifyAdmin(
        `Prodotto non trovato — Vivino #${parsed.vivinoOrderId}`,
        `Ordine Vivino #${parsed.vivinoOrderId} ricevuto ma il prodotto "${parsed.productName}" non e stato trovato in WooCommerce. Crealo manualmente da /admin/vivino-order.`,
        emailText,
      );
      return NextResponse.json({ status: 'error', reason: 'product not found', vivinoOrderId: parsed.vivinoOrderId });
    }

    console.log(`[vivino/email-webhook] Matched product: ${product.name} (WC #${product.id})`);

    // Create WC order — Vivino order ID goes into customer_note so ShippyPro sees it
    const order = await createWCOrder({
      provider: 'vivino',
      transactionId: sanitize(parsed.vivinoOrderId),
      customer: {
        email: '', // Vivino doesn't share customer email
        firstName: sanitize(parsed.firstName),
        lastName: sanitize(parsed.lastName),
        phone: parsed.phone ? sanitize(parsed.phone) : undefined,
        address: sanitize(parsed.address),
        city: sanitize(parsed.city),
        province: sanitize(parsed.province),
        zip: sanitize(parsed.zip),
        notes: `Ordine Vivino #${parsed.vivinoOrderId}`,
      },
      items: [{
        id: product.id,
        name: product.name,
        price: parseFloat(product.price) || 0,
        quantity: parsed.quantity,
      }],
      shippingCost: 0,
      extraMeta: [
        { key: '_vivino_order_id', value: sanitize(parsed.vivinoOrderId) },
        { key: '_order_source', value: 'vivino' },
      ],
    });

    console.log(`[vivino/email-webhook] WC order #${order.id} created for Vivino #${parsed.vivinoOrderId}`);

    return NextResponse.json({ status: 'ok', wcOrderId: order.id, vivinoOrderId: parsed.vivinoOrderId });
  } catch (err) {
    console.error('[vivino/email-webhook] Error:', err);
    return NextResponse.json({ status: 'error', reason: String(err) }, { status: 500 });
  }
}

/* ── Notify admin of issues ───────────────────────────── */

async function notifyAdmin(subject: string, message: string, emailSnippet?: string) {
  try {
    const snippet = emailSnippet ? `<br><br><details><summary>Email originale</summary><pre style="font-size:11px;white-space:pre-wrap;">${emailSnippet.slice(0, 2000)}</pre></details>` : '';
    await sendEmail({
      to: [{ email: 'ordini@stappando.it', name: 'Stappando Ordini' }],
      subject: `[Vivino] ${subject}`,
      html: `<p>${message}</p>${snippet}`,
      tags: ['vivino.webhook-error'],
    });
  } catch (e) {
    console.error('[vivino/email-webhook] Failed to notify admin:', e);
  }
}
