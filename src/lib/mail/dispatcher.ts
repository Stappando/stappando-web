/**
 * Email dispatcher — maps events to Mandrill email sends.
 * Server-side only.
 */
import { sendEmail } from './mandrill';
import {
  orderConfirmed, orderShipped, orderCancelled,
  adminNewOrder, adminReturnRequest,
  returnRequestConfirmed,
  pointsUpdate, birthday, giftCardReceived,
  welcome, abandonedCart, reviewRequest,
  type OrderConfirmedData, type OrderShippedData, type OrderCancelledData,
  type AdminNewOrderData, type AdminReturnRequestData,
  type ReturnRequestData,
  type PointsUpdateData, type BirthdayData, type GiftCardData,
  type WelcomeData, type AbandonedCartData, type ReviewRequestData,
} from './templates';

type EmailEvent =
  | { type: 'order.confirmed'; email: string; name: string; data: OrderConfirmedData }
  | { type: 'order.shipped'; email: string; name: string; data: OrderShippedData }
  | { type: 'order.cancelled'; email: string; name: string; data: OrderCancelledData }
  | { type: 'admin.new-order'; email: string; name: string; data: AdminNewOrderData }
  | { type: 'admin.return-request'; email: string; name: string; data: AdminReturnRequestData }
  | { type: 'return.confirmed'; email: string; name: string; data: ReturnRequestData }
  | { type: 'points.update'; email: string; name: string; data: PointsUpdateData }
  | { type: 'birthday'; email: string; name: string; data: BirthdayData }
  | { type: 'giftcard.received'; email: string; name: string; data: GiftCardData }
  | { type: 'welcome'; email: string; name: string; data: WelcomeData }
  | { type: 'cart.abandoned'; email: string; name: string; data: AbandonedCartData }
  | { type: 'review.request'; email: string; name: string; data: ReviewRequestData };

const TEMPLATE_MAP = {
  'order.confirmed': orderConfirmed,
  'order.shipped': orderShipped,
  'order.cancelled': orderCancelled,
  'admin.new-order': adminNewOrder,
  'admin.return-request': adminReturnRequest,
  'return.confirmed': returnRequestConfirmed,
  'points.update': pointsUpdate,
  'birthday': birthday,
  'giftcard.received': giftCardReceived,
  'welcome': welcome,
  'cart.abandoned': abandonedCart,
  'review.request': reviewRequest,
} as const;

/** Dispatch an email event — generates template and sends via Mandrill */
export async function dispatchEmail(event: EmailEvent): Promise<void> {
  const templateFn = TEMPLATE_MAP[event.type];
  if (!templateFn) {
    console.error(`Unknown email event type: ${event.type}`);
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { subject, html } = (templateFn as (data: any) => { subject: string; html: string })(event.data);

  try {
    const results = await sendEmail({
      to: [{ email: event.email, name: event.name }],
      subject,
      html,
      tags: [event.type],
    });

    const result = results[0];
    if (result?.status === 'rejected') {
      console.error(`Email rejected for ${event.email}: ${result.reject_reason}`);
    } else {
      console.log(`Email sent: ${event.type} → ${event.email} (${result?.status})`);
    }
  } catch (err) {
    console.error(`Failed to send ${event.type} email to ${event.email}:`, err);
  }
}
