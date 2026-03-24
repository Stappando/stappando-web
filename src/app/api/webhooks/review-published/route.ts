import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getWCSecrets } from '@/lib/config';
import { dispatchEmail } from '@/lib/mail/dispatcher';

export const dynamic = 'force-dynamic';

const POINTS_PER_REVIEW = 100;

/**
 * Webhook: called by WordPress when a product review is approved.
 * Hook: comment_approved (filtered to product reviews)
 *
 * Payload: { comment_id, comment_author_email, product_id, product_name, customer_id }
 * Adds 100 POP points via YITH Points & Rewards API.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // Verify signature
  const signature = req.headers.get('x-wc-webhook-signature');
  const secret = process.env.WC_WEBHOOK_SECRET;
  if (secret && signature) {
    const hash = crypto.createHmac('sha256', secret).update(rawBody).digest('base64');
    if (hash !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const customerId = payload.customer_id as number;
  const customerEmail = payload.comment_author_email as string;
  const productName = payload.product_name as string;

  if (!customerId || !customerEmail) {
    return NextResponse.json({ error: 'Missing customer data' }, { status: 400 });
  }

  const wc = getWCSecrets();

  try {
    // Add points via YITH Points & Rewards REST API
    const pointsUrl = `${wc.baseUrl}/wp-json/yith-ywpar/v1/points/add?consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;

    const pointsRes = await fetch(pointsUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_id: customerId,
        points: POINTS_PER_REVIEW,
        description: `Recensione: ${productName || 'prodotto'}`,
      }),
    });

    if (!pointsRes.ok) {
      // Fallback: try WP user meta direct approach
      const altUrl = `${wc.baseUrl}/wp-json/wc/v3/customers/${customerId}?consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;
      const customerRes = await fetch(altUrl);
      if (customerRes.ok) {
        const customer = await customerRes.json();
        const currentPoints = parseInt(
          (customer.meta_data || []).find((m: { key: string; value: string }) => m.key === '_ywpar_user_total_points')?.value || '0',
        );
        const newPoints = currentPoints + POINTS_PER_REVIEW;

        await fetch(altUrl, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            meta_data: [
              { key: '_ywpar_user_total_points', value: String(newPoints) },
            ],
          }),
        });

        console.log(`Review POP: added ${POINTS_PER_REVIEW} points to customer #${customerId} (fallback, total: ${newPoints})`);
      }
    } else {
      console.log(`Review POP: added ${POINTS_PER_REVIEW} points to customer #${customerId} via YITH API`);
    }

    // Get updated total points for email
    const customerUrl = `${wc.baseUrl}/wp-json/wc/v3/customers/${customerId}?consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;
    const custRes = await fetch(customerUrl);
    let totalPoints = POINTS_PER_REVIEW;
    let customerName = 'Cliente';

    if (custRes.ok) {
      const custData = await custRes.json();
      customerName = `${custData.first_name || ''} ${custData.last_name || ''}`.trim() || 'Cliente';
      totalPoints = parseInt(
        (custData.meta_data || []).find((m: { key: string; value: string }) => m.key === '_ywpar_user_total_points')?.value || String(POINTS_PER_REVIEW),
      );
    }

    // Send points notification email
    await dispatchEmail({
      type: 'points.update',
      email: customerEmail,
      name: customerName,
      data: {
        customerName,
        pointsEarned: POINTS_PER_REVIEW,
        totalPoints,
      },
    });
  } catch (err) {
    console.error('Review POP webhook error:', err);
  }

  return NextResponse.json({ received: true, points: POINTS_PER_REVIEW });
}
