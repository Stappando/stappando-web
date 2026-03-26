import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';
import { isValidEmail, isNonEmptyString, sanitize } from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Body non valido' }, { status: 400 });
    }

    const { productId, rating, review, reviewer, reviewerEmail, customerId, productName } = body;

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
    const auth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;

    // Step 1: Create review on WC
    const res = await fetch(`${wc.baseUrl}/wp-json/wc/v3/products/${productId}/reviews?${auth}`, {
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

    // Step 2: Add 100 POP points via YITH API (fire and forget)
    if (customerId) {
      (async () => {
        try {
          // Try YITH API first
          const yithRes = await fetch(`${wc.baseUrl}/wp-json/yith-ywpar/v1/points/add?${auth}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customer_id: customerId,
              points: 100,
              description: `Recensione: ${sanitize(productName || `Prodotto #${productId}`, 200)}`,
            }),
          });

          if (!yithRes.ok) {
            // Fallback: update customer meta directly
            console.warn('YITH points add failed, trying meta fallback');
            const custRes = await fetch(`${wc.baseUrl}/wp-json/wc/v3/customers/${customerId}?${auth}`);
            if (custRes.ok) {
              const cust = await custRes.json();
              const meta = (cust.meta_data || []) as { key: string; value: string }[];
              const currentPoints = parseInt(meta.find(m => m.key === '_ywpar_user_total_points')?.value || '0');
              await fetch(`${wc.baseUrl}/wp-json/wc/v3/customers/${customerId}?${auth}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  meta_data: [{ key: '_ywpar_user_total_points', value: String(currentPoints + 100) }],
                }),
              });
            }
          }

          console.log(`+100 POP points added to customer ${customerId} for review on product ${productId}`);
        } catch (err) {
          console.error('Failed to add review POP points:', err);
        }
      })();
    }

    return NextResponse.json({ success: true, reviewId: data.id });
  } catch (err) {
    console.error('Review API error:', err);
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 });
  }
}
