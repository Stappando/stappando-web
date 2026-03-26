import { NextRequest, NextResponse } from 'next/server';
import {
  orderConfirmed,
  orderShipped,
  orderCancelled,
  adminNewOrder,
  returnRequestConfirmed,
  adminReturnRequest,
  pointsUpdate,
  birthday,
  giftCardReceived,
  welcome,
  reviewRequest,
  abandonedCart,
  welcomeTemplate,
  secondOrderTemplate,
  vendorApproved,
  vendorSubOrder,
} from '@/lib/mail/templates';

export const dynamic = 'force-dynamic';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://stappando.it';

const MOCK_ITEMS = [
  { name: 'Barolo DOCG 2019 — Marchesi di Barolo', quantity: 2, total: '84,00', vendor: 'Cantina Oddero' },
  { name: 'Vermentino di Sardegna DOC 2024', quantity: 1, total: '9,90', vendor: 'Stappando Enoteca' },
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
      title: '3. Ordine confermato (cliente)',
      html: orderConfirmed({
        customerName: 'Roberto',
        orderNumber: '12847',
        items: MOCK_ITEMS,
        shipping: 'Gratuita',
        total: '93,90',
        orderUrl: `${SITE}/account`,
        shippingAddress: 'Roberto Bianchi, Via Roma 42, 00184 Roma (RM)',
        carrierName: 'BRT Corriere Espresso',
        deliveryEstimate: '24-48h lavorativi',
        pointsEarned: 94,
        invoiceData: {
          companyName: 'Bianchi Srl',
          vatNumber: 'IT12345678901',
          pec: 'bianchi@pec.it',
          sdi: 'USAL8PV',
        },
        circuitoProducts: [
          { name: 'Brunello di Montalcino 2018', slug: 'brunello-montalcino-2018', price: '38,50', image: 'https://stappando.it/wp-content/uploads/2021/06/brunello.jpg' },
          { name: 'Amarone della Valpolicella 2017', slug: 'amarone-2017', price: '45,00' },
        ],
      }).html,
    },
    {
      id: 'order-confirmed-no-invoice',
      title: '4. Ordine confermato (senza fattura)',
      html: orderConfirmed({
        customerName: 'Marco',
        orderNumber: '12848',
        items: [{ name: 'Pignoletto Frizzante Trideo — Merlotta', quantity: 1, total: '8,90' }],
        shipping: '6,50',
        total: '15,40',
        discount: '5,00',
        orderUrl: `${SITE}/account`,
        shippingAddress: 'Marco Rossi, Via Garibaldi 15, 20121 Milano (MI)',
        carrierName: 'FedEx / TNT',
        deliveryEstimate: '24-48h lavorativi',
        pointsEarned: 15,
      }).html,
    },
    {
      id: 'admin-new-order',
      title: '5. Admin — Nuovo ordine ricevuto',
      html: adminNewOrder({
        orderNumber: '12847',
        customerName: 'Roberto Bianchi',
        customerEmail: 'roberto@email.com',
        customerPhone: '+39 333 1234567',
        vendorGroups: [
          {
            vendorName: 'Cantina Oddero',
            items: [{ name: 'Barolo DOCG 2019 — Marchesi di Barolo', quantity: 2, total: '84,00' }],
            subtotal: '84,00',
          },
          {
            vendorName: 'Stappando Enoteca',
            items: [{ name: 'Vermentino di Sardegna DOC 2024', quantity: 1, total: '9,90' }],
            subtotal: '9,90',
          },
        ],
        carrierName: 'BRT Corriere Espresso',
        shippingAddress: 'Via Roma 42, 00184 Roma (RM) — Tel: +39 333 1234567',
        billingAddress: 'Via Roma 42, 00184 Roma (RM)',
        invoiceData: {
          companyName: 'Bianchi Srl',
          vatNumber: 'IT12345678901',
          pec: 'bianchi@pec.it',
          sdi: 'USAL8PV',
        },
        paymentMethod: 'Carta di credito (Stripe)',
        transactionId: 'pi_3PkGx2FHPp1UJx500tX8Kv4m',
        subtotal: '93,90',
        shippingCost: '0,00',
        total: '93,90',
        customerNotes: 'Suonate il campanello del secondo piano, grazie!',
        carrierPreference: 'BRT Corriere Espresso',
        newsletter: true,
      }).html,
    },
    {
      id: 'order-shipped',
      title: '6. Ordine spedito (cliente)',
      html: orderShipped({
        customerName: 'Roberto',
        orderNumber: '12847',
        trackingUrl: 'https://tracking.shippypro.com/xyz123',
        trackingNumber: 'BRT-2026-XYZ123',
        carrier: 'BRT Corriere Espresso',
        items: MOCK_ITEMS,
        shippingAddress: 'Roberto Bianchi, Via Roma 42, 00184 Roma (RM)',
        deliveryEstimate: '24-48h lavorativi',
      }).html,
    },
    {
      id: 'order-cancelled',
      title: '7. Ordine annullato (cliente)',
      html: orderCancelled({
        customerName: 'Roberto',
        orderNumber: '12847',
        items: MOCK_ITEMS,
        refundAmount: '93,90',
        paymentMethod: 'Carta di credito',
      }).html,
    },
    {
      id: 'return-confirmed',
      title: '8. Reso ricevuto (cliente)',
      html: returnRequestConfirmed({
        customerName: 'Roberto',
        orderNumber: '12847',
        items: [
          { name: 'Barolo DOCG 2019 — Marchesi di Barolo', quantity: 1, reason: 'Bottiglia danneggiata' },
        ],
        pickupMethod: 'domicilio',
        pickupDate: '28 marzo 2026',
        pickupTimeSlot: '09:00 – 13:00',
        pickupAddress: 'Via Roma 42, 00184 Roma (RM)',
        refundEstimate: '42,00',
      }).html,
    },
    {
      id: 'admin-return',
      title: '9. Admin — Richiesta reso',
      html: adminReturnRequest({
        orderNumber: '12847',
        customerName: 'Roberto Bianchi',
        customerEmail: 'roberto@email.com',
        customerPhone: '+39 333 1234567',
        items: [
          { name: 'Barolo DOCG 2019 — Marchesi di Barolo', quantity: 1, reason: 'Bottiglia danneggiata' },
        ],
        pickupMethod: 'domicilio',
        pickupDate: '28 marzo 2026',
        pickupTimeSlot: '09:00 – 13:00',
        pickupAddress: 'Via Roma 42, 00184 Roma (RM)',
        refundEstimate: '42,00',
      }).html,
    },
    {
      id: 'vendor-sub-order',
      title: '10. Vendor — Sub-ordine ricevuto',
      html: vendorSubOrder({
        vendorName: 'Cantina Oddero',
        subOrderNumber: '12850',
        parentOrderNumber: '12847',
        items: [{ name: 'Barolo DOCG 2019 — Marchesi di Barolo', quantity: 2, total: '84,00' }],
        grossTotal: '84,00',
        netTotal: '68,85',
        vendorAmount: '58,52',
        platformAmount: '10,33',
        shippingAddress: 'Via Roma 42, 00184 Roma (RM)',
        customerName: 'Roberto Bianchi',
        customerPhone: '+39 333 1234567',
        customerNotes: 'Suonate il campanello del secondo piano',
        carrierName: 'BRT Corriere Espresso',
      }).html,
    },
    {
      id: 'points-update',
      title: '11. Aggiornamento Punti POP',
      html: pointsUpdate({
        customerName: 'Roberto',
        pointsEarned: 94,
        totalPoints: 820,
        orderNumber: '12847',
      }).html,
    },
    {
      id: 'birthday',
      title: '12. Compleanno + coupon 20%',
      html: birthday({
        customerName: 'Roberto',
        couponCode: 'BUONCOMPLEANNO-ROBERTO',
        expiresAt: 'domani alle 23:59',
      }).html,
    },
    {
      id: 'giftcard',
      title: '13. Gift card ricevuta',
      html: giftCardReceived({
        recipientName: 'Marco',
        senderName: 'Roberto',
        amount: '50',
        code: 'GIFT-8KM3-XVBN',
        message: 'Buon compleanno! Scegli il vino che preferisci.',
      }).html,
    },
    {
      id: 'welcome',
      title: '14. Benvenuto (base)',
      html: welcome({ customerName: 'Roberto' }).html,
    },
    {
      id: 'review-request',
      title: '15. Richiesta recensione prodotto',
      html: reviewRequest({
        customerName: 'Roberto',
        orderNumber: '12847',
        items: MOCK_REVIEW_ITEMS,
      }).html,
    },
    {
      id: 'abandoned-cart',
      title: '16. Carrello abbandonato (prima)',
      html: abandonedCart({
        customerName: 'Roberto',
        items: MOCK_ITEMS,
        cartUrl: `${SITE}/checkout`,
        total: '93,90',
      }).html,
    },
    {
      id: 'abandoned-cart-reminder',
      title: '17. Carrello abbandonato (reminder 3h)',
      html: abandonedCart({
        customerName: 'Roberto',
        items: MOCK_ITEMS,
        cartUrl: `${SITE}/checkout`,
        total: '93,90',
        isReminder: true,
      }).html,
    },
    {
      id: 'vendor-approved',
      title: '18. Vendor approvato — negozio attivo',
      html: vendorApproved('Cantina Oddero').html,
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
