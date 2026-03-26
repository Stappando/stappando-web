import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { dispatchEmail } from '@/lib/mail/dispatcher';
import { formatPrice } from '@/lib/api';
import { getWCSecrets } from '@/lib/config';
import { generateCoupon, markCouponUsed, orderUsedCouponPrefix, getCustomerCouponMeta } from '@/lib/coupons/generate';
import { sendEmail } from '@/lib/mail/mandrill';
import { secondOrderTemplate } from '@/lib/mail/templates';
import { splitOrderIntoSubOrders } from '@/lib/vendor/sub-orders';

export const dynamic = 'force-dynamic';

/** Verify WooCommerce webhook signature */
function verifySignature(body: string, signature: string | null): boolean {
  const secret = process.env.WC_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const hash = crypto.createHmac('sha256', secret).update(body).digest('base64');
  return hash === signature;
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-wc-webhook-signature');
  const topic = req.headers.get('x-wc-webhook-topic');
  const resource = req.headers.get('x-wc-webhook-resource');

  // Verify signature
  if (!verifySignature(rawBody, signature)) {
    console.error('WC webhook: invalid signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Handle ping (WooCommerce sends this when creating webhook)
  if (topic === 'action.woocommerce_webhook_test' || !topic) {
    return NextResponse.json({ received: true, type: 'ping' });
  }

  try {
    await handleWebhook(topic, resource || '', payload);
  } catch (err) {
    console.error(`WC webhook error (${topic}):`, err);
    // Return 200 to prevent retries
  }

  return NextResponse.json({ received: true });
}

async function handleWebhook(topic: string, resource: string, payload: Record<string, unknown>) {
  switch (topic) {
    case 'order.created':
      await handleOrderEvent(payload);
      // Split into vendor sub-orders on creation (only for paid orders)
      if ((payload.status === 'processing' || payload.set_paid) && payload.line_items) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const results = await splitOrderIntoSubOrders(payload as any);
          if (results.length > 0) {
            console.log(`Order #${payload.id}: split into ${results.length} sub-orders`);
          }
        } catch (err) {
          console.error(`Sub-order split failed for order #${payload.id}:`, err);
        }
      }
      break;
    case 'order.updated':
      await handleOrderEvent(payload);
      break;

    case 'customer.created':
      await handleNewCustomer(payload);
      break;

    default:
      // Check for custom action topics
      if (topic.startsWith('action.')) {
        await handleCustomAction(topic, payload);
      } else {
        console.log(`WC webhook: unhandled topic ${topic}`);
      }
  }
}

/* ── Order events ─────────────────────────────────────── */

async function handleOrderEvent(order: Record<string, unknown>) {
  const status = order.status as string;
  const billing = order.billing as Record<string, string> | undefined;
  if (!billing?.email) return;

  const customerName = `${billing.first_name || ''} ${billing.last_name || ''}`.trim() || 'Cliente';
  const orderNumber = String(order.number || order.id);
  const lineItems = (order.line_items || []) as Record<string, unknown>[];
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://stappando.it';
  const orderUrl = `${siteUrl}/account`;

  const items = lineItems.map((li) => ({
    name: String(li.name || ''),
    quantity: Number(li.quantity || 1),
    total: formatPrice(String(li.total || '0')),
    image: ((li.image as Record<string, string>)?.src) || undefined,
  }));

  const shippingTotal = String(order.shipping_total || '0');
  const orderTotal = formatPrice(String(order.total || '0'));

  switch (status) {
    case 'processing':
    case 'completed': {
      // Only send order confirmed once (on processing, not completed)
      if (status === 'processing') {
        await dispatchEmail({
          type: 'order.confirmed',
          email: billing.email,
          name: customerName,
          data: {
            customerName,
            orderNumber,
            items,
            shipping: parseFloat(shippingTotal) === 0 ? 'Gratuita' : `${formatPrice(shippingTotal)}`,
            total: orderTotal,
            orderUrl,
          },
        });
      }

      // Check for tracking data (order shipped)
      const meta = (order.meta_data || []) as { key: string; value: string }[];
      const trackingNumber = meta.find(m => m.key === '_tracking_number')?.value;
      const trackingUrl = meta.find(m => m.key === '_tracking_url')?.value;
      const carrier = meta.find(m => m.key === '_tracking_provider')?.value;

      if (trackingNumber && trackingUrl && status === 'completed') {
        await dispatchEmail({
          type: 'order.shipped',
          email: billing.email,
          name: customerName,
          data: {
            customerName,
            orderNumber,
            trackingNumber,
            trackingUrl,
            carrier: carrier || 'Corriere espresso',
          },
        });
      }

      // Schedule review email 3 days after completion
      if (status === 'completed') {
        const alreadySent = meta.find(m => m.key === '_review_email_sent')?.value;
        if (!alreadySent) {
          const sendAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
          await setOrderMeta(String(order.id), '_review_email_scheduled', sendAt);
        }

        // Coupon flow: check if welcome coupon was used → generate second coupon
        const customerId = order.customer_id as number;
        if (customerId) {
          await handleCouponFlow(customerId, order, billing);
        }
      }
      break;
    }

    case 'cancelled':
    case 'refunded':
      await dispatchEmail({
        type: 'order.cancelled',
        email: billing.email,
        name: customerName,
        data: { customerName, orderNumber },
      });
      break;
  }

  // Points update (check for YITH points meta)
  const meta = (order.meta_data || []) as { key: string; value: string }[];
  const pointsEarned = meta.find(m => m.key === '_ywpar_points_earned')?.value;
  const totalPoints = meta.find(m => m.key === '_ywpar_total_points')?.value;

  if (pointsEarned && parseInt(pointsEarned) > 0 && status === 'processing') {
    await dispatchEmail({
      type: 'points.update',
      email: billing.email,
      name: customerName,
      data: {
        customerName,
        pointsEarned: parseInt(pointsEarned),
        totalPoints: parseInt(totalPoints || '0'),
        orderNumber,
      },
    });
  }
}

/* ── New customer ─────────────────────────────────────── */

async function handleNewCustomer(customer: Record<string, unknown>) {
  const email = customer.email as string;
  if (!email) return;

  const firstName = (customer.first_name as string) || '';
  const customerName = firstName || 'Amico del vino';

  await dispatchEmail({
    type: 'welcome',
    email,
    name: customerName,
    data: { customerName },
  });
}

/* ── Custom actions (birthday, giftcard, abandoned cart) ─ */

async function handleCustomAction(topic: string, payload: Record<string, unknown>) {
  switch (topic) {
    case 'action.stappando_birthday': {
      const email = payload.email as string;
      const name = (payload.name as string) || 'Cliente';
      const couponCode = payload.coupon_code as string;
      if (!email || !couponCode) return;

      await dispatchEmail({
        type: 'birthday',
        email,
        name,
        data: {
          customerName: name,
          couponCode,
          expiresAt: 'domani alle 23:59',
        },
      });
      break;
    }

    case 'action.stappando_giftcard': {
      const recipientEmail = payload.recipient_email as string;
      const recipientName = (payload.recipient_name as string) || 'Amico';
      const senderName = (payload.sender_name as string) || 'Un amico';
      const amount = String(payload.amount || '0');
      const code = payload.code as string;
      const message = payload.message as string | undefined;
      if (!recipientEmail || !code) return;

      await dispatchEmail({
        type: 'giftcard.received',
        email: recipientEmail,
        name: recipientName,
        data: {
          recipientName,
          senderName,
          amount,
          code,
          message,
        },
      });
      break;
    }

    case 'action.stappando_abandoned_cart': {
      const email = payload.email as string;
      const name = (payload.name as string) || 'Cliente';
      const items = (payload.items || []) as { name: string; quantity: number; total: string; image?: string }[];
      const total = String(payload.total || '0');
      if (!email || items.length === 0) return;

      await dispatchEmail({
        type: 'cart.abandoned',
        email,
        name,
        data: {
          customerName: name,
          items,
          total,
          cartUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://stappando.it'}/checkout`,
        },
      });
      break;
    }

    default:
      console.log(`WC webhook: unhandled action ${topic}`);
  }
}

/* ── Coupon flow on order completion ────────────────────── */

async function handleCouponFlow(
  customerId: number,
  order: Record<string, unknown>,
  billing: Record<string, string>,
) {
  try {
    const couponMeta = await getCustomerCouponMeta(customerId);

    // Check if this order used the welcome coupon (BENVENUTO-*)
    if (orderUsedCouponPrefix(order as { coupon_lines?: { code: string }[] }, 'BENVENUTO')) {
      // Mark welcome coupon as used
      await markCouponUsed(customerId, 'welcome');

      // Generate second coupon only if not already generated
      if (!couponMeta._coupon2_code) {
        const firstName = billing.first_name || 'Cliente';
        const coupon = await generateCoupon({
          type: 'second',
          firstName,
          email: billing.email,
          customerId,
        });

        const expiresDate = new Date(coupon.expires).toLocaleDateString('it-IT', {
          day: 'numeric', month: 'long', year: 'numeric',
        });

        await sendEmail({
          to: [{ email: billing.email, name: firstName }],
          subject: `Grazie ${firstName}! Ecco un altro 5% per te`,
          html: secondOrderTemplate(firstName, coupon.code, expiresDate),
        });

        console.log(`Second coupon ${coupon.code} sent to ${billing.email}`);
      }
    }

    // Check if this order used the second coupon (GRAZIE-*)
    if (orderUsedCouponPrefix(order as { coupon_lines?: { code: string }[] }, 'GRAZIE')) {
      await markCouponUsed(customerId, 'second');
      console.log(`Customer ${customerId} completed coupon journey`);
    }
  } catch (err) {
    console.error(`Coupon flow error for customer ${customerId}:`, err);
  }
}

/* ── Helper: set order meta via WC REST API ────────────── */

async function setOrderMeta(orderId: string, key: string, value: string) {
  const wc = getWCSecrets();
  const url = `${wc.baseUrl}/wp-json/wc/v3/orders/${orderId}?consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;
  try {
    await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meta_data: [{ key, value }] }),
    });
  } catch (err) {
    console.error(`Failed to set order meta ${key} on #${orderId}:`, err);
  }
}
