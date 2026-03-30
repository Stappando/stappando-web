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
      id: 'review-request',
      title: '14. Richiesta recensione prodotto',
      html: reviewRequest({
        customerName: 'Roberto',
        orderNumber: '12847',
        items: MOCK_REVIEW_ITEMS,
      }).html,
    },
    {
      id: 'abandoned-cart',
      title: '15. Carrello abbandonato (prima)',
      html: abandonedCart({
        customerName: 'Roberto',
        items: MOCK_ITEMS,
        cartUrl: `${SITE}/checkout`,
        total: '93,90',
      }).html,
    },
    {
      id: 'abandoned-cart-reminder',
      title: '16. Carrello abbandonato (reminder 3h)',
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
      title: '17. Vendor approvato — negozio attivo',
      html: vendorApproved('Cantina Oddero').html,
    },
    {
      id: 'fiere-presentazione',
      title: '18. Presentazione fiere — Stappando/Vineis/Anbrekabol',
      html: buildFiereEmail(),
    },
  ];
}

function buildFiereEmail(): string {
  return `<!DOCTYPE html>
<html lang="it">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:20px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;width:100%;">
<tr><td style="background:#005667;padding:24px 30px;">
  <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">Stappando</h1>
  <p style="margin:4px 0 0;color:#d9c39a;font-size:13px;">Presentazione del Gruppo</p>
</td></tr>
<tr><td style="padding:30px;">
<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#333;">
Gentile <strong>Mario Rossi</strong>,
</p>
<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#333;">
Ci siamo conosciuti a <strong>Vinitaly 2026</strong>, come da accordi presi con <strong>Roberto</strong>, invio una presentazione del nostro gruppo.
</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border-left:4px solid #005667;">
<tr><td style="padding:12px 16px;background:#f8f9fa;border-radius:0 6px 6px 0;">
<p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#005667;">\uD83C\uDF77 Stappando.it &mdash; Marketplace</p>
<p style="margin:0;font-size:14px;line-height:1.6;color:#444;">
Piattaforma per la vendita online di vini al pubblico.<br>
<strong>Iscrizione gratuita &ndash; Commissione 15%.</strong><br>
Quando l&rsquo;ordine &egrave; pagato arriva a voi la mail con la lettera di vettura, preparate il pacco e lo consegnate al corriere, il ritiro lo predisponiamo noi.
</p>
</td></tr>
</table>
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border-left:4px solid #4a8c3f;">
<tr><td style="padding:12px 16px;background:#f8f9fa;border-radius:0 6px 6px 0;">
<p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#4a8c3f;">\uD83C\uDF3F Vineis.eu &mdash; Esperienze in cantina</p>
<p style="margin:0;font-size:14px;line-height:1.6;color:#444;">
Portale dedicato a visite, tour ed esperienze in cantina.<br>
<strong>Iscrizione gratuita &ndash; Commissione 15%.</strong><br>
Inseriamo noi le esperienze per voi, gestiamo prenotazioni e parte tecnica. Voi accogliete i clienti che hanno prenotato.
</p>
</td></tr>
</table>
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border-left:4px solid #c0792a;">
<tr><td style="padding:12px 16px;background:#f8f9fa;border-radius:0 6px 6px 0;">
<p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#c0792a;">\uD83D\uDCE6 Anbrekabol.com &mdash; Spedizioni sicure</p>
<p style="margin:0;font-size:14px;line-height:1.6;color:#444;">
Scatole per spedire bottiglie in sicurezza.<br>
Le spedizioni con Anbrekabol sono <strong>assicurate</strong>.<br>
Acquisto e maggiori info su <a href="https://anbrekabol.com" style="color:#c0792a;">anbrekabol.com</a>
</p>
</td></tr>
</table>
<hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0;">
<p style="margin:0 0 14px;font-size:15px;font-weight:700;color:#005667;">Come si parte?</p>
<p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#444;">
Registrazione a <a href="https://stappando.it" style="color:#005667;font-weight:600;">Stappando.it</a> e/o <a href="https://vineis.eu" style="color:#4a8c3f;font-weight:600;">Vineis.eu</a> andando sul link nel sito &laquo;Vendi con noi&raquo;, &laquo;Ospita con noi&raquo;.
</p>
<p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#444;">
Se non avete foto possiamo farle per voi.<br>
<strong>Invio prodotti a:</strong> Stappando Srl &ndash; Via Pomonte 67, Roma (Scarico 7&ndash;12)
</p>
<p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#444;">
Il sistema &egrave; tutto automatizzato, vi basta registrarvi.<br>
Se interessati potete procedere in autonomia o rispondere a questa mail.
</p>
<hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0;">
<p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#005667;">\uD83D\uDCCE Allegati</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
<tr><td style="padding:8px 12px;background:#f0f7f9;border-radius:6px;">
  <a href="https://stappando.it/wp-content/uploads/2026/03/Presentazione-Vendi-su-stappando.it-Vendor.pdf" style="color:#005667;font-size:13px;font-weight:600;text-decoration:none;">
    \uD83D\uDCC4 Presentazione Vendi su Stappando.it
  </a>
</td></tr>
<tr><td style="height:4px;"></td></tr>
<tr><td style="padding:8px 12px;background:#f0f9f2;border-radius:6px;">
  <a href="https://stappando.it/wp-content/uploads/2026/03/Presentazione-Ospita-con-Vineis.pdf" style="color:#4a8c3f;font-size:13px;font-weight:600;text-decoration:none;">
    \uD83D\uDCC4 Presentazione Ospita con Vineis
  </a>
</td></tr>
<tr><td style="height:4px;"></td></tr>
<tr><td style="padding:8px 12px;background:#fdf6ee;border-radius:6px;">
  <a href="https://stappando.it/wp-content/uploads/2026/03/Presentazione-Spedisci-con-Anbrekabol-non-rompere-piu-le-scatole.pdf" style="color:#c0792a;font-size:13px;font-weight:600;text-decoration:none;">
    \uD83D\uDCC4 Presentazione Spedisci con Anbrekabol
  </a>
</td></tr>
</table>
<p style="margin:0;font-size:15px;line-height:1.6;color:#333;">
Un saluto,<br>
<strong>Roberto</strong><br>
<span style="color:#005667;font-weight:600;">Stappando</span>
</p>
</td></tr>
<tr><td style="background:#f8f9fa;padding:16px 30px;border-top:1px solid #e5e5e5;">
<p style="margin:0;font-size:11px;color:#999;text-align:center;">
Stappando Srl &mdash; info@stappando.it
</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

export async function GET(req: NextRequest) {
  const previews = generatePreviews();
  return NextResponse.json({ previews });
}
