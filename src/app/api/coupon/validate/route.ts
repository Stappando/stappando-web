import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body?.code) {
      return NextResponse.json({ valid: false, error: 'Inserisci un codice' }, { status: 400 });
    }

    const code = body.code.trim().toUpperCase();
    const cartTotal = parseFloat(body.cartTotal) || 0;
    const email = (body.email || '').toLowerCase().trim();

    const wc = getWCSecrets();
    const auth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;

    // Fetch coupon by code
    const res = await fetch(`${wc.baseUrl}/wp-json/wc/v3/coupons?${auth}&code=${encodeURIComponent(code)}`);
    if (!res.ok) {
      return NextResponse.json({ valid: false, error: 'Errore nella verifica del coupon' });
    }

    const coupons = await res.json();
    if (!Array.isArray(coupons) || coupons.length === 0) {
      return NextResponse.json({ valid: false, error: 'Coupon non trovato' });
    }

    const coupon = coupons[0];

    // Check expiry
    if (coupon.date_expires) {
      const expires = new Date(coupon.date_expires);
      if (expires < new Date()) {
        return NextResponse.json({ valid: false, error: 'Coupon scaduto' });
      }
    }

    // Check usage limit
    if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
      return NextResponse.json({ valid: false, error: 'Coupon già utilizzato' });
    }

    // Check per-user usage
    if (coupon.usage_limit_per_user && email) {
      const usedBy = (coupon.used_by || []) as string[];
      const userUsage = usedBy.filter((e: string) => e.toLowerCase() === email).length;
      if (userUsage >= coupon.usage_limit_per_user) {
        return NextResponse.json({ valid: false, error: 'Hai già utilizzato questo coupon' });
      }
    }

    // Check email restrictions
    const emailRestrictions = (coupon.email_restrictions || []) as string[];
    if (emailRestrictions.length > 0 && email) {
      const allowed = emailRestrictions.some((e: string) => e.toLowerCase() === email);
      if (!allowed) {
        return NextResponse.json({ valid: false, error: 'Coupon non valido per il tuo account' });
      }
    }

    // Check minimum amount
    const minAmount = parseFloat(coupon.minimum_amount || '0');
    if (minAmount > 0 && cartTotal < minAmount) {
      return NextResponse.json({ valid: false, error: `Importo minimo non raggiunto: ${minAmount.toFixed(2)}€` });
    }

    // Calculate discount
    const amount = parseFloat(coupon.amount || '0');
    let discount = 0;
    let description = '';

    switch (coupon.discount_type) {
      case 'percent':
        discount = cartTotal * (amount / 100);
        description = `${amount}% di sconto`;
        break;
      case 'fixed_cart':
        discount = Math.min(amount, cartTotal);
        description = `${amount.toFixed(2)}€ di sconto`;
        break;
      case 'fixed_product':
        // For fixed_product, apply per matching item
        discount = Math.min(amount, cartTotal);
        description = `${amount.toFixed(2)}€ di sconto per prodotto`;
        break;
      default:
        discount = Math.min(amount, cartTotal);
        description = `${amount.toFixed(2)}€ di sconto`;
    }

    discount = Math.round(discount * 100) / 100; // Round to 2 decimals

    return NextResponse.json({
      valid: true,
      discount,
      type: coupon.discount_type,
      code: coupon.code.toUpperCase(),
      description,
      freeShipping: coupon.free_shipping || false,
    });
  } catch (err) {
    console.error('Coupon validate error:', err);
    return NextResponse.json({ valid: false, error: 'Errore nella verifica' });
  }
}
