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
        orderUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://stappando.it'}/account`,
        shippingAddress: 'Via Roma 42, 00184 Roma (RM)',
        pointsEarned: 150,
        totalPoints: 820,
        circuitoProducts: [
          { name: 'Barolo DOCG 2019 — Marchesi', slug: 'barolo-docg-2019', price: '42,00', image: 'https://stappando.it/wp-content/uploads/2021/06/barolo.jpg' },
          { name: 'Brunello di Montalcino 2018', slug: 'brunello-montalcino-2018', price: '38,50', image: 'https://stappando.it/wp-content/uploads/2021/06/brunello.jpg' },
        ],
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
      title: '9. Carrello abbandonato (prima)',
      html: abandonedCart({
        customerName: 'Roberto',
        items: MOCK_ITEMS,
        cartUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://stappando.it'}/checkout`,
        total: '93,90',
      }).html,
    },
    {
      id: 'abandoned-cart-reminder',
      title: '10. Carrello abbandonato (reminder 3h)',
      html: abandonedCart({
        customerName: 'Roberto',
        items: MOCK_ITEMS,
        cartUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://stappando.it'}/checkout`,
        total: '93,90',
        isReminder: true,
      }).html,
    },
    {
      id: 'vendor-approved',
      title: '11. Vendor approvato — negozio attivo',
      html: vendorApprovedHtml('Cantina Oddero'),
    },
  ];
}

function vendorApprovedHtml(cantina: string): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://stappando-web.vercel.app';
  return `<div style="font-family:system-ui,-apple-system,sans-serif;max-width:600px;margin:0 auto;background:#fff;">
    <div style="background:#005667;padding:32px 28px;text-align:center;">
      <img src="https://stappando.it/wp-content/uploads/2021/01/logo-stappando.png" alt="Stappando" style="height:32px;filter:brightness(0) invert(1);margin-bottom:16px;" />
      <h1 style="font-size:28px;color:#fff;margin:0;font-weight:700;">Benvenuto nella famiglia!</h1>
    </div>
    <div style="padding:32px 28px;text-align:center;">
      <div style="width:72px;height:72px;border-radius:50%;background:#e8f4f1;display:inline-flex;align-items:center;justify-content:center;margin-bottom:20px;">
        <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="#005667" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
      </div>
      <h2 style="font-size:22px;color:#1a1a1a;margin:0 0 12px;font-weight:700;">${cantina}, il tuo negozio è live!</h2>
      <p style="font-size:16px;color:#666;line-height:1.6;margin:0 0 28px;">Il tuo profilo cantina è stato approvato.<br/>Da oggi puoi aggiungere i tuoi vini e iniziare a vendere su Stappando.</p>
      <a href="${siteUrl}/vendor/dashboard" style="display:inline-block;background:#005667;color:#fff;padding:16px 40px;border-radius:10px;text-decoration:none;font-weight:700;font-size:16px;margin-bottom:24px;">Accedi alla tua Dashboard</a>
      <div style="background:#f8f6f1;border-radius:12px;padding:24px;margin-top:28px;text-align:left;">
        <p style="font-size:13px;color:#005667;font-weight:700;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.05em;">I prossimi passi</p>
        <div style="margin-bottom:12px;">
          <div style="display:inline-block;width:28px;height:28px;border-radius:50%;background:#005667;color:#fff;text-align:center;line-height:28px;font-size:12px;font-weight:700;margin-right:10px;vertical-align:top;">1</div>
          <div style="display:inline-block;vertical-align:top;width:calc(100% - 44px);"><p style="font-size:14px;color:#1a1a1a;margin:0;font-weight:600;">Completa il profilo cantina</p><p style="font-size:12px;color:#888;margin:4px 0 0;">Aggiungi logo, descrizione e storia della tua cantina</p></div>
        </div>
        <div style="margin-bottom:12px;">
          <div style="display:inline-block;width:28px;height:28px;border-radius:50%;background:#005667;color:#fff;text-align:center;line-height:28px;font-size:12px;font-weight:700;margin-right:10px;vertical-align:top;">2</div>
          <div style="display:inline-block;vertical-align:top;width:calc(100% - 44px);"><p style="font-size:14px;color:#1a1a1a;margin:0;font-weight:600;">Aggiungi i tuoi vini</p><p style="font-size:12px;color:#888;margin:4px 0 0;">Carica foto, descrizioni e prezzi dei tuoi prodotti</p></div>
        </div>
        <div>
          <div style="display:inline-block;width:28px;height:28px;border-radius:50%;background:#005667;color:#fff;text-align:center;line-height:28px;font-size:12px;font-weight:700;margin-right:10px;vertical-align:top;">3</div>
          <div style="display:inline-block;vertical-align:top;width:calc(100% - 44px);"><p style="font-size:14px;color:#1a1a1a;margin:0;font-weight:600;">Inizia a vendere</p><p style="font-size:12px;color:#888;margin:4px 0 0;">I tuoi vini saranno visibili a migliaia di appassionati</p></div>
        </div>
      </div>
      <div style="margin-top:28px;padding-top:20px;border-top:1px solid #e8e4dc;">
        <p style="font-size:13px;color:#888;margin:0;">Hai bisogno di aiuto? Scrivici a <a href="mailto:assistenza@stappando.it" style="color:#005667;font-weight:600;">assistenza@stappando.it</a></p>
      </div>
    </div>
  </div>`;
}

export async function GET(req: NextRequest) {
  const pwd = req.headers.get('x-admin-password') || req.nextUrl.searchParams.get('pwd');
  if (!pwd || pwd !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const previews = generatePreviews();
  return NextResponse.json({ previews });
}
