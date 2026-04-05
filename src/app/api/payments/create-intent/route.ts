import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { getWCSecrets } from '@/lib/config';
import { isValidEmail, isNonEmptyString, sanitize } from '@/lib/validation';
import { validateStock } from '@/lib/payments/validate-stock';
import { buildItemsMetadata } from '@/lib/payments/items-meta';

interface LineItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

interface CreateIntentBody {
  items: LineItem[];
  shipping: number;
  carrier?: string;
  couponCode?: string;
  couponDiscount?: number;
  customerId?: number;
  paymentMethodId?: string;
  customer: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    address: string;
    city: string;
    province: string;
    zip: string;
    notes?: string;
    needsInvoice?: boolean;
    ragioneSociale?: string;
    piva?: string;
    codFiscale?: string;
    sdi?: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    const body: CreateIntentBody = await req.json().catch(() => null) as CreateIntentBody;
    if (!body) {
      return NextResponse.json({ error: 'Body JSON non valido' }, { status: 400 });
    }

    // Validate items
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: 'Carrello vuoto' }, { status: 400 });
    }

    for (const item of body.items) {
      if (!item.id || typeof item.price !== 'number' || item.price <= 0 || !item.quantity) {
        return NextResponse.json({ error: 'Dati prodotto non validi' }, { status: 400 });
      }
    }

    // Validate customer
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

    // Italy-only shipping — CAP italiano = esattamente 5 cifre numeriche
    const zipClean = c.zip.trim().replace(/\s/g, '');
    if (!/^\d{5}$/.test(zipClean)) {
      return NextResponse.json({
        error: 'Spediamo solo in Italia. Inserisci un CAP italiano valido (5 cifre).',
      }, { status: 400 });
    }

    // Stock validation — check availability before charging the card
    const stockCheck = await validateStock(
      body.items.map((i) => ({ id: i.id, name: i.name || '', quantity: i.quantity })),
    );
    if (!stockCheck.ok) {
      return NextResponse.json({ error: stockCheck.error }, { status: 409 });
    }

    // Price validation — verify client prices match WooCommerce
    const wc = getWCSecrets();
    const wcAuth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;
    const productIds = body.items.map((i) => i.id).join(',');
    const priceRes = await fetch(
      `${wc.baseUrl}/wp-json/wc/v3/products?include=${productIds}&_fields=id,price,sale_price&per_page=100&${wcAuth}`,
    );
    if (priceRes.ok) {
      const wcProducts: { id: number; price: string; sale_price: string }[] = await priceRes.json();
      const priceMap = new Map(wcProducts.map((p) => [p.id, parseFloat(p.price)]));
      for (const item of body.items) {
        const realPrice = priceMap.get(item.id);
        if (realPrice !== undefined && Math.abs(realPrice - item.price) > 0.01) {
          return NextResponse.json(
            { error: `Il prezzo di "${item.name}" è cambiato. Ricarica la pagina e riprova.` },
            { status: 409 },
          );
        }
      }
    }

    // Calculate total in cents (subtract coupon discount if any)
    const itemsTotal = body.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = typeof body.shipping === 'number' && body.shipping >= 0 ? body.shipping : 0;
    const couponDiscount = typeof body.couponDiscount === 'number' && body.couponDiscount > 0 ? body.couponDiscount : 0;
    const totalCents = Math.round(Math.max(0.5, itemsTotal + shipping - couponDiscount) * 100);

    if (totalCents < 50) {
      return NextResponse.json({ error: 'Importo minimo 0,50€' }, { status: 400 });
    }

    const stripe = getStripe();

    // Resolve Stripe customer + payment method if using saved card
    let stripeCustomerId: string | undefined;
    if (body.paymentMethodId && body.customerId) {
      try {
        const wc = getWCSecrets();
        const auth = Buffer.from(`${wc.consumerKey}:${wc.consumerSecret}`).toString('base64');
        const wcRes = await fetch(`${wc.baseUrl}/wp-json/wc/v3/customers/${body.customerId}`, {
          headers: { Authorization: `Basic ${auth}` },
        });
        if (wcRes.ok) {
          const wcCustomer = await wcRes.json();
          const meta: { key: string; value: string }[] = wcCustomer.meta_data || [];
          stripeCustomerId = meta.find((m) => m.key === '_stripe_customer_id')?.value || undefined;
        }
      } catch {
        // Non-fatal — proceed without customer attachment
      }
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: 'eur',
      ...(body.paymentMethodId
        ? {
            payment_method: body.paymentMethodId,
            ...(stripeCustomerId ? { customer: stripeCustomerId } : {}),
          }
        : { automatic_payment_methods: { enabled: true } }),
      metadata: {
        customer_email: sanitize(c.email, 254),
        customer_name: sanitize(`${c.firstName} ${c.lastName}`, 200),
        customer_phone: sanitize(c.phone || '', 30),
        shipping_address: sanitize(c.address, 200),
        shipping_city: sanitize(c.city, 100),
        shipping_province: sanitize(c.province, 5),
        shipping_zip: sanitize(c.zip, 10),
        order_notes: sanitize(c.notes || '', 200),
        shipping_cost: String(shipping),
        preferred_carrier: sanitize(body.carrier || '', 20),
        coupon_code: sanitize(body.couponCode || '', 50),
        coupon_discount: String(couponDiscount),
        needs_invoice: c.needsInvoice ? 'true' : '',
        invoice_piva: sanitize(c.piva || '', 20),
        invoice_ragione: sanitize(c.ragioneSociale || '', 100),
        invoice_cf: sanitize(c.codFiscale || '', 20),
        invoice_sdi: sanitize(c.sdi || '', 10),
        // Items stored in compact chunked format — each key ≤490 chars, never truncated
        ...buildItemsMetadata(body.items.map(i => ({ id: i.id, quantity: i.quantity, price: i.price }))),
      },
      receipt_email: sanitize(c.email, 254),
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    const errStack = err instanceof Error ? err.stack : '';
    console.error('Stripe create-intent error:', errMsg);
    return NextResponse.json(
      { error: `Errore pagamento: ${errMsg}` },
      { status: 500 },
    );
  }
}
