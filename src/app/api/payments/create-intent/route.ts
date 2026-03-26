import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { isValidEmail, isNonEmptyString, sanitize } from '@/lib/validation';

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

    // Calculate total in cents (subtract coupon discount if any)
    const itemsTotal = body.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = typeof body.shipping === 'number' && body.shipping >= 0 ? body.shipping : 0;
    const couponDiscount = typeof body.couponDiscount === 'number' && body.couponDiscount > 0 ? body.couponDiscount : 0;
    const totalCents = Math.round(Math.max(0.5, itemsTotal + shipping - couponDiscount) * 100);

    if (totalCents < 50) {
      return NextResponse.json({ error: 'Importo minimo 0,50€' }, { status: 400 });
    }

    const stripe = getStripe();

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: 'eur',
      automatic_payment_methods: { enabled: true },
      metadata: {
        customer_email: sanitize(c.email, 254),
        customer_name: sanitize(`${c.firstName} ${c.lastName}`, 200),
        customer_phone: sanitize(c.phone || '', 30),
        shipping_address: sanitize(c.address, 500),
        shipping_city: sanitize(c.city, 100),
        shipping_province: sanitize(c.province, 5),
        shipping_zip: sanitize(c.zip, 10),
        order_notes: sanitize(c.notes || '', 500),
        items_json: JSON.stringify(
          body.items.map((i) => ({ id: i.id, qty: i.quantity, price: i.price })),
        ).slice(0, 500),
        shipping_cost: String(shipping),
        preferred_carrier: sanitize(body.carrier || '', 20),
        coupon_code: sanitize(body.couponCode || '', 50),
      },
      receipt_email: sanitize(c.email, 254),
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    const errStack = err instanceof Error ? err.stack : '';
    console.error('Stripe create-intent error:', errMsg);
    console.error('Stripe create-intent stack:', errStack);
    console.error('STRIPE_SECRET_KEY present:', !!process.env.STRIPE_SECRET_KEY);
    console.error('STRIPE_SECRET_KEY prefix:', process.env.STRIPE_SECRET_KEY?.slice(0, 7) || 'MISSING');
    return NextResponse.json(
      { error: `Errore pagamento: ${errMsg}` },
      { status: 500 },
    );
  }
}
