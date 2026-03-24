import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';
import { dispatchEmail } from '@/lib/mail/dispatcher';
import { formatPrice } from '@/lib/api';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60s for processing multiple orders

/**
 * Cron job: runs daily, finds completed orders with _review_email_scheduled
 * whose timestamp has passed, sends the review request email, and marks as sent.
 *
 * Vercel Cron calls this endpoint daily at 10:00 AM CET.
 */
export async function GET(req: NextRequest) {
  // Verify cron secret (Vercel sets this header for cron jobs)
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const wc = getWCSecrets();
  const now = new Date();
  let sent = 0;
  let checked = 0;

  try {
    // Fetch completed orders from the last 10 days
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
    const after = tenDaysAgo.toISOString();
    const url = `${wc.baseUrl}/wp-json/wc/v3/orders?consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}&status=completed&after=${after}&per_page=50&orderby=date&order=desc`;

    const res = await fetch(url);
    if (!res.ok) {
      console.error('Review cron: failed to fetch orders', res.status);
      return NextResponse.json({ error: 'WC API error' }, { status: 500 });
    }

    const orders = await res.json();
    checked = orders.length;

    for (const order of orders) {
      const meta = (order.meta_data || []) as { key: string; value: string }[];

      // Skip if already sent
      if (meta.find(m => m.key === '_review_email_sent')?.value) continue;

      // Check if scheduled and due
      const scheduled = meta.find(m => m.key === '_review_email_scheduled')?.value;
      if (!scheduled) continue;

      const scheduledDate = new Date(scheduled);
      if (scheduledDate > now) continue; // Not due yet

      // Build email data
      const billing = order.billing || {};
      const email = billing.email;
      if (!email) continue;

      const customerName = `${billing.first_name || ''} ${billing.last_name || ''}`.trim() || 'Cliente';
      const orderNumber = String(order.number || order.id);
      const lineItems = (order.line_items || []) as Record<string, unknown>[];

      const items = lineItems.map((li) => {
        const productId = li.product_id as number;
        const name = String(li.name || '');
        // Generate slug from product name
        const slug = name.toLowerCase()
          .replace(/[àáâãäå]/g, 'a').replace(/[èéêë]/g, 'e')
          .replace(/[ìíîï]/g, 'i').replace(/[òóôõö]/g, 'o').replace(/[ùúûü]/g, 'u')
          .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const image = ((li.image as Record<string, string>)?.src) || undefined;
        return { name, slug, image };
      });

      if (items.length === 0) continue;

      // Send review request email
      await dispatchEmail({
        type: 'review.request',
        email,
        name: customerName,
        data: { customerName, orderNumber, items },
      });

      // Mark as sent to prevent duplicates
      const updateUrl = `${wc.baseUrl}/wp-json/wc/v3/orders/${order.id}?consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;
      await fetch(updateUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meta_data: [{ key: '_review_email_sent', value: 'true' }] }),
      });

      sent++;
      console.log(`Review email sent for order #${orderNumber} to ${email}`);
    }
  } catch (err) {
    console.error('Review cron error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }

  return NextResponse.json({ checked, sent, timestamp: now.toISOString() });
}
