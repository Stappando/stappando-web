import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';
import { isValidEmail, isNonEmptyString, sanitize } from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Body non valido' }, { status: 400 });
    }

    const { productId, rating, review, reviewer, reviewerEmail } = body;

    if (!productId || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Dati non validi' }, { status: 400 });
    }
    if (!isNonEmptyString(reviewer)) {
      return NextResponse.json({ error: 'Nome obbligatorio' }, { status: 400 });
    }
    if (!isValidEmail(reviewerEmail)) {
      return NextResponse.json({ error: 'Email non valida' }, { status: 400 });
    }

    const wc = getWCSecrets();
    const url = `${wc.baseUrl}/wp-json/wc/v3/products/${productId}/reviews?consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        review: sanitize(review || '', 2000),
        reviewer: sanitize(reviewer, 200),
        reviewer_email: sanitize(reviewerEmail, 254),
        rating,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('WC review creation failed:', err);
      return NextResponse.json({ error: 'Errore nella creazione della recensione' }, { status: res.status });
    }

    const data = await res.json();
    console.log(`Review created for product ${productId}: ${data.id}`);

    // TODO: Add 100 POP points via YITH API when webhook confirms review publication

    return NextResponse.json({ success: true, reviewId: data.id });
  } catch (err) {
    console.error('Review API error:', err);
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 });
  }
}
