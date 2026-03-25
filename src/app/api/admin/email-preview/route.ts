import { NextRequest, NextResponse } from 'next/server';
import {
  orderConfirmed,
  orderCancelled,
  pointsUpdate,
  birthday,
  giftCardReceived,
  welcome,
  reviewRequest,
  abandonedCart,
  welcomeTemplate,
  secondOrderTemplate,
} from '@/lib/mail/templates';

export const dynamic = 'force-dynamic';

const MOCK_ITEMS = [
  { name: 'Barolo DOCG 2019 — Marchesi di Barolo', quantity: 2, total: '84,00' },
  { name: 'Vermentino di Sardegna DOC 2024', quantity: 1, total: '9,90' },
];

const MOCK_REVIEW_ITEMS = [
  { name: 'Barolo DOCG 2019 — Marchesi di Barolo', slug: 'barolo-docg-2019-marchesi', image: 'https://stappando.it/wp-content/uploads/2021/06/barolo.jpg' },
  { name: 'Vermentino di Sardegna DOC 2024', slug: 'vermentino-sardegna-2024', image: 'https://stappando.it/wp-content/uploads/2021/06/vermentino.jpg' },
];

function generatePreviews(): { id: string; title: string; html: string }[] {
  return [
    {
      id: 'welcome-coupon',
      title: '1. Benvenuto + coupon primo ordine',
      html: welcomeTemplate('Roberto', 'BENVENUTO-ROBERTO-X8K2', '24 aprile 2026'),
    },
    {
      id: 'second-coupon',
      title: '2. Secondo coupon dopo primo ordine',
      html: secondOrderTemplate('Roberto', 'GRAZIE-ROBERTO-Y3M7', '24 aprile 2026'),
    },
    {
      id: 'order-confirmed',
      title: '3. Ordine confermato',
      html: orderConfirmed({
        customerName: 'Roberto',
        orderNumber: '12847',
        items: MOCK_ITEMS,
        shipping: 'Gratuita',
        total: '93,90',
        orderUrl: 'https://stappando.it/mio-account/view-order/12847/',
      }).html,
    },
    {
      id: 'order-cancelled',
      title: '4. Ordine annullato',
      html: orderCancelled({
        customerName: 'Roberto',
        orderNumber: '12847',
      }).html,
    },
    {
      id: 'points-update',
      title: '5. Aggiornamento Punti POP',
      html: pointsUpdate({
        customerName: 'Roberto',
        pointsEarned: 150,
        totalPoints: 820,
        orderNumber: '12847',
      }).html,
    },
    {
      id: 'birthday',
      title: '6. Compleanno + coupon 20%',
      html: birthday({
        customerName: 'Roberto',
        couponCode: 'BUONCOMPLEANNO-ROBERTO',
        expiresAt: 'domani alle 23:59',
      }).html,
    },
    {
      id: 'giftcard',
      title: '7. Gift card ricevuta',
      html: giftCardReceived({
        recipientName: 'Marco',
        senderName: 'Roberto',
        amount: '50',
        code: 'GIFT-8KM3-XVBN',
        message: 'Buon compleanno! Scegli il vino che preferisci.',
      }).html,
    },
    {
      id: 'review-request',
      title: '8. Richiesta recensione prodotto',
      html: reviewRequest({
        customerName: 'Roberto',
        orderNumber: '12847',
        items: MOCK_REVIEW_ITEMS,
      }).html,
    },
    {
      id: 'abandoned-cart',
      title: '9. Carrello abbandonato',
      html: abandonedCart({
        customerName: 'Roberto',
        items: MOCK_ITEMS,
        cartUrl: 'https://stappando.it/carrello',
        total: '93,90',
      }).html,
    },
  ];
}

export async function GET(req: NextRequest) {
  const pwd = req.headers.get('x-admin-password') || req.nextUrl.searchParams.get('pwd');
  if (!pwd || pwd !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const previews = generatePreviews();
  return NextResponse.json({ previews });
}
