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
    {
      id: 'followup-1',
      title: '19. Follow-up +5gg — 50.000 visite al mese',
      html: buildFollowUp1(),
    },
    {
      id: 'followup-2',
      title: '20. Follow-up +12gg — Enoturismo in crescita',
      html: buildFollowUp2(),
    },
    {
      id: 'followup-3',
      title: '21. Follow-up +20gg — I numeri parlano',
      html: buildFollowUp3(),
    },
    {
      id: 'followup-4',
      title: '22. Follow-up +28gg — Spedire vino senza pensieri',
      html: buildFollowUp4(),
    },
    {
      id: 'followup-5',
      title: '23. Follow-up +35gg — La vostra vetrina sempre attiva',
      html: buildFollowUp5(),
    },
    {
      id: 'followup-6',
      title: '24. Follow-up +42gg — Estate = enoturismo',
      html: buildFollowUp6(),
    },
    {
      id: 'followup-7',
      title: '25. Follow-up +50gg — Cosa si stanno perdendo',
      html: buildFollowUp7(),
    },
    {
      id: 'followup-8',
      title: '26. Follow-up +58gg — Porta sempre aperta',
      html: buildFollowUp8(),
    },
  ];
}

function buildFiereEmail(): string {
  return `<!DOCTYPE html>
<html lang="it">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Stappando</title></head>
<body style="margin:0;padding:0;background:#f5f3ee;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ee;">
<tr><td align="center" style="padding:32px 16px;">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e8e4dc;">
<tr><td style="padding:32px 32px 24px;text-align:center;border-bottom:1px solid #f0ece4;">
  <a href="https://shop.stappando.it" style="text-decoration:none;">
    <img src="https://stappando.it/wp-content/uploads/2022/11/logo-stappando-500W.png" alt="Stappando" width="150" style="display:inline-block;max-width:150px;height:auto;" />
  </a>
  <p style="margin:10px 0 0;font-size:11px;color:#999;">
    <span style="color:#d9c39a;letter-spacing:1px;">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
    <span style="color:#005667;font-weight:600;margin-left:4px;">4.6/5</span>
    <span style="color:#bbb;margin-left:2px;">&middot; 1000+ recensioni</span>
  </p>
</td></tr>
<tr><td style="padding:36px 36px 28px;">
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
  <a href="https://stappando.it/wp-content/uploads/2026/03/Presentazione-Prenota-su-vineis.eu-Partner.pdf" style="color:#4a8c3f;font-size:13px;font-weight:600;text-decoration:none;">
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
<tr><td style="background:#1a1a1a;padding:24px 36px;text-align:center;">
  <table cellpadding="0" cellspacing="0" style="margin:0 auto 12px;">
    <tr>
      <td style="padding:0 6px;"><a href="https://www.instagram.com/stappando.it" style="text-decoration:none;color:#888;font-size:11px;">Instagram</a></td>
      <td style="padding:0 6px;color:#555;">|</td>
      <td style="padding:0 6px;"><a href="https://www.facebook.com/stappandoenoteca/" style="text-decoration:none;color:#888;font-size:11px;">Facebook</a></td>
      <td style="padding:0 6px;color:#555;">|</td>
      <td style="padding:0 6px;"><a href="https://shop.stappando.it" style="text-decoration:none;color:#d9c39a;font-size:11px;font-weight:600;">stappando.it</a></td>
    </tr>
  </table>
  <p style="margin:0;font-size:10px;color:#666;">&copy; 2026 Stappando Srl &mdash; P.IVA 15855161003</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function followUpLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="it">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Stappando</title></head>
<body style="margin:0;padding:0;background:#f5f3ee;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ee;">
<tr><td align="center" style="padding:32px 16px;">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e8e4dc;">
<tr><td style="padding:32px 32px 24px;text-align:center;border-bottom:1px solid #f0ece4;">
  <a href="https://shop.stappando.it" style="text-decoration:none;">
    <img src="https://stappando.it/wp-content/uploads/2022/11/logo-stappando-500W.png" alt="Stappando" width="150" style="display:inline-block;max-width:150px;height:auto;" />
  </a>
  <p style="margin:10px 0 0;font-size:11px;color:#999;">
    <span style="color:#d9c39a;letter-spacing:1px;">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
    <span style="color:#005667;font-weight:600;margin-left:4px;">4.6/5</span>
    <span style="color:#bbb;margin-left:2px;">&middot; 1000+ recensioni</span>
  </p>
</td></tr>
<tr><td style="padding:36px 36px 28px;">
${content}
</td></tr>
<tr><td style="background:#1a1a1a;padding:24px 36px;text-align:center;">
  <table cellpadding="0" cellspacing="0" style="margin:0 auto 12px;">
    <tr>
      <td style="padding:0 6px;"><a href="https://www.instagram.com/stappando.it" style="text-decoration:none;color:#888;font-size:11px;">Instagram</a></td>
      <td style="padding:0 6px;color:#555;">|</td>
      <td style="padding:0 6px;"><a href="https://www.facebook.com/stappandoenoteca/" style="text-decoration:none;color:#888;font-size:11px;">Facebook</a></td>
      <td style="padding:0 6px;color:#555;">|</td>
      <td style="padding:0 6px;"><a href="https://shop.stappando.it" style="text-decoration:none;color:#d9c39a;font-size:11px;font-weight:600;">stappando.it</a></td>
    </tr>
  </table>
  <p style="margin:0;font-size:10px;color:#666;">&copy; 2026 Stappando Srl &mdash; P.IVA 15855161003</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

/* ── Follow-up 1  (+5 gg) — 50.000 visite al mese ───────────────────── */
function buildFollowUp1(): string {
  return followUpLayout(`
<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#333;">
Ciao <strong>Mario</strong>,
</p>
<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#333;">
Mi sono reso conto che nell&rsquo;ultima mail vi ho mandato tante informazioni tutte insieme. Volevo soffermarmi su un dato che forse &egrave; passato in secondo piano.
</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
<tr><td style="padding:24px;background:#f0f7f9;border-radius:12px;text-align:center;">
  <p style="margin:0 0 4px;font-size:36px;font-weight:800;color:#005667;">50.000</p>
  <p style="margin:0 0 10px;font-size:15px;font-weight:600;color:#005667;">visite al mese su Stappando.it</p>
  <p style="margin:0;font-size:13px;color:#666;">Persone che cercano vino di qualit&agrave;, pronte ad acquistare</p>
</td></tr>
</table>
<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#333;">
Sono wine lover da tutta Italia che ogni giorno navigano il nostro catalogo. Quando una cantina si registra, i suoi vini finiscono davanti a questo pubblico <strong>dal giorno stesso</strong>.
</p>
<p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#444;">
Nessun canone, nessun costo fisso. Pagate solo una commissione del 15% quando vendete. Il restante 85% &egrave; vostro, accreditato il 10 di ogni mese.
</p>
<table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
<tr><td style="background:#005667;border-radius:8px;">
  <a href="https://shop.stappando.it" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">Scopri come funziona &rarr;</a>
</td></tr>
</table>
<p style="margin:0;font-size:15px;line-height:1.6;color:#333;">
Buon lavoro,<br>
<strong>Roberto</strong><br>
<span style="color:#005667;">Stappando</span>
</p>
`);
}

/* ── Follow-up 2  (+12 gg) — Enoturismo in crescita ────────────────── */
function buildFollowUp2(): string {
  return followUpLayout(`
<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#333;">
Ciao <strong>Mario</strong>,
</p>
<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#333;">
Lo sapevate che l&rsquo;enoturismo in Italia &egrave; cresciuto del 18% nell&rsquo;ultimo anno? Sempre pi&ugrave; persone cercano esperienze autentiche in cantina &mdash; degustazioni, visite, pranzi tra i filari.
</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border-left:4px solid #4a8c3f;">
<tr><td style="padding:16px 20px;background:#f0f9f2;border-radius:0 8px 8px 0;">
<p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#4a8c3f;">Vineis.eu &mdash; il portale delle esperienze in cantina</p>
<p style="margin:0;font-size:14px;line-height:1.6;color:#444;">
Noi ci occupiamo di tutto: <strong>creiamo la vostra pagina</strong>, gestiamo le prenotazioni, i pagamenti e il supporto clienti. Voi fate quello che sapete fare meglio &mdash; accogliere chi viene a trovarvi.
</p>
</td></tr>
</table>
<p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#333;">Cosa ottiene la vostra cantina:</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
<tr><td style="padding:12px 16px;background:#f8f9fa;border-radius:8px;">
  <p style="margin:0;font-size:14px;line-height:1.8;color:#444;">
    &bull; Una pagina dedicata con foto, descrizioni e calendario disponibilit&agrave;<br>
    &bull; Prenotazioni automatiche &mdash; il cliente prenota e paga online<br>
    &bull; Visibilit&agrave; su Google e sui social tramite le nostre campagne<br>
    &bull; Iscrizione gratuita, commissione 15% solo sulle prenotazioni
  </p>
</td></tr>
</table>
<p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#444;">
Se vi interessa, la registrazione &egrave; su <a href="https://vineis.eu" style="color:#4a8c3f;font-weight:600;">vineis.eu</a> &rarr; &laquo;Ospita con noi&raquo;.
</p>
<p style="margin:0;font-size:15px;line-height:1.6;color:#333;">
A presto,<br>
<strong>Roberto</strong><br>
<span style="color:#005667;">Stappando</span>
</p>
`);
}

/* ── Follow-up 3  (+20 gg) — I numeri parlano ──────────────────────── */
function buildFollowUp3(): string {
  return followUpLayout(`
<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#333;">
Ciao <strong>Mario</strong>,
</p>
<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#333;">
Vi condivido qualche numero del gruppo Stappando. Penso che possano darvi un&rsquo;idea concreta di quello che stiamo costruendo.
</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
<tr>
<td width="33%" style="padding:16px 8px;text-align:center;background:#f0f7f9;border-radius:12px 0 0 12px;">
  <p style="margin:0;font-size:28px;font-weight:800;color:#005667;">50K</p>
  <p style="margin:4px 0 0;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:0.5px;">visite/mese</p>
</td>
<td width="34%" style="padding:16px 8px;text-align:center;background:#f0f7f9;">
  <p style="margin:0;font-size:28px;font-weight:800;color:#005667;">200+</p>
  <p style="margin:4px 0 0;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:0.5px;">cantine attive</p>
</td>
<td width="33%" style="padding:16px 8px;text-align:center;background:#f0f7f9;border-radius:0 12px 12px 0;">
  <p style="margin:0;font-size:28px;font-weight:800;color:#005667;">20</p>
  <p style="margin:4px 0 0;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:0.5px;">regioni coperte</p>
</td>
</tr>
</table>
<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#333;">
Ogni cantina che si aggiunge arricchisce il catalogo e attira nuovi clienti. &Egrave; un circolo virtuoso: pi&ugrave; vini, pi&ugrave; visitatori, pi&ugrave; ordini per tutti.
</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
<tr><td style="padding:14px 18px;background:#f8f9fa;border-left:4px solid #005667;border-radius:0 8px 8px 0;">
  <p style="margin:0;font-size:14px;line-height:1.6;color:#444;font-style:italic;">
    &ldquo;In tre mesi su Stappando abbiamo raggiunto clienti in regioni dove non avevamo mai venduto una bottiglia.&rdquo;
  </p>
</td></tr>
</table>
<p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#444;">
La registrazione &egrave; gratuita e richiede pochi minuti: <a href="https://shop.stappando.it" style="color:#005667;font-weight:600;">shop.stappando.it</a> &rarr; &laquo;Vendi con noi&raquo;
</p>
<p style="margin:0;font-size:15px;line-height:1.6;color:#333;">
Buona giornata,<br>
<strong>Roberto</strong><br>
<span style="color:#005667;">Stappando</span>
</p>
`);
}

/* ── Follow-up 4  (+28 gg) — Spedire vino senza pensieri ───────────── */
function buildFollowUp4(): string {
  return followUpLayout(`
<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#333;">
Ciao <strong>Mario</strong>,
</p>
<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#333;">
Un tema che torna spesso quando parliamo con le cantine: <strong>le bottiglie che si rompono durante la spedizione</strong>. &Egrave; un problema reale, costa soldi e fa perdere clienti.
</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border-left:4px solid #c0792a;">
<tr><td style="padding:16px 20px;background:#fdf6ee;border-radius:0 8px 8px 0;">
<p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#c0792a;">Anbrekabol.com &mdash; la soluzione definitiva</p>
<p style="margin:0;font-size:14px;line-height:1.6;color:#444;">
Scatole progettate apposta per le bottiglie di vino. Protezione totale, spedizioni <strong>assicurate</strong>. Se si rompe qualcosa (ma non succede), siete coperti.
</p>
</td></tr>
</table>
<p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#333;">Perch&eacute; le cantine le scelgono:</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
<tr><td style="padding:12px 16px;background:#f8f9fa;border-radius:8px;">
  <p style="margin:0;font-size:14px;line-height:1.8;color:#444;">
    &bull; Disponibili da 1 a 6 bottiglie<br>
    &bull; Spedizione assicurata inclusa<br>
    &bull; Design professionale &mdash; il cliente riceve un pacco curato<br>
    &bull; Acquisto diretto su <a href="https://anbrekabol.com" style="color:#c0792a;font-weight:600;">anbrekabol.com</a>
  </p>
</td></tr>
</table>
<p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#444;">
Potete usarle sia per le vostre spedizioni dirette che per gli ordini su Stappando.
</p>
<p style="margin:0;font-size:15px;line-height:1.6;color:#333;">
A presto,<br>
<strong>Roberto</strong><br>
<span style="color:#005667;">Stappando</span>
</p>
`);
}

/* ── Follow-up 5  (+35 gg) — La vostra vetrina sempre attiva ────────── */
function buildFollowUp5(): string {
  return followUpLayout(`
<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#333;">
Ciao <strong>Mario</strong>,
</p>
<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#333;">
Vi siete mai chiesti come appare una cantina su Stappando? Ve lo mostro.
</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border:1px solid #e8e4dc;border-radius:12px;overflow:hidden;">
<tr><td style="padding:20px 24px;background:#fafaf8;">
<p style="margin:0 0 6px;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1px;">La vostra pagina includerebbe</p>
<p style="margin:0 0 16px;font-size:14px;line-height:1.8;color:#444;">
  <strong style="color:#005667;">&#10003;</strong> Logo e copertina della cantina<br>
  <strong style="color:#005667;">&#10003;</strong> Descrizione della vostra storia e filosofia<br>
  <strong style="color:#005667;">&#10003;</strong> Catalogo completo con foto professionali<br>
  <strong style="color:#005667;">&#10003;</strong> Schede prodotto dettagliate (vitigno, annata, abbinamenti)<br>
  <strong style="color:#005667;">&#10003;</strong> Recensioni dei clienti che acquistano<br>
  <strong style="color:#005667;">&#10003;</strong> Posizionamento SEO su Google per i vostri vini
</p>
<p style="margin:0;font-size:13px;color:#888;font-style:italic;">
Tutto questo visibile 24 ore su 24, 365 giorni l&rsquo;anno, davanti a 50.000 visitatori al mese.
</p>
</td></tr>
</table>
<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#333;">
Non dovete fare quasi nulla: ci mandate le bottiglie e le foto le facciamo noi. In pochi giorni la vostra pagina &egrave; online.
</p>
<table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
<tr><td style="background:#005667;border-radius:8px;">
  <a href="https://shop.stappando.it" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">Registrati e crea la tua pagina &rarr;</a>
</td></tr>
</table>
<p style="margin:0;font-size:15px;line-height:1.6;color:#333;">
Un saluto,<br>
<strong>Roberto</strong><br>
<span style="color:#005667;">Stappando</span>
</p>
`);
}

/* ── Follow-up 6  (+42 gg) — Estate = enoturismo ───────────────────── */
function buildFollowUp6(): string {
  return followUpLayout(`
<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#333;">
Ciao <strong>Mario</strong>,
</p>
<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#333;">
Tra poco arriva l&rsquo;estate e le ricerche di esperienze in cantina esplodono. Vi condivido un dato che ci ha colpito:
</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
<tr><td style="padding:24px;background:linear-gradient(135deg,#4a8c3f,#5da04e);border-radius:12px;text-align:center;">
  <p style="margin:0 0 4px;font-size:11px;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:1px;">da giugno a settembre</p>
  <p style="margin:0 0 8px;font-size:30px;font-weight:800;color:#ffffff;">+40%</p>
  <p style="margin:0;font-size:14px;color:#ffffff;">di ricerche per &ldquo;visita cantina&rdquo; e &ldquo;degustazione vini&rdquo;</p>
</td></tr>
</table>
<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#333;">
Le cantine su <strong style="color:#4a8c3f;">Vineis.eu</strong> ricevono prenotazioni durante tutto l&rsquo;anno, ma in estate il volume cresce in modo significativo. Turisti italiani e stranieri che cercano dove andare e prenotano direttamente online.
</p>
<p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#444;">
Se volete essere visibili per la stagione estiva, il momento per registrarsi &egrave; adesso. Noi ci occupiamo di creare la pagina, voi dovete solo essere pronti ad accogliere.
</p>
<table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
<tr><td style="background:#4a8c3f;border-radius:8px;">
  <a href="https://vineis.eu" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">Registrati su Vineis &rarr;</a>
</td></tr>
</table>
<p style="margin:0;font-size:15px;line-height:1.6;color:#333;">
Buon lavoro,<br>
<strong>Roberto</strong><br>
<span style="color:#005667;">Stappando</span>
</p>
`);
}

/* ── Follow-up 7  (+50 gg) — Cosa si stanno perdendo ───────────────── */
function buildFollowUp7(): string {
  return followUpLayout(`
<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#333;">
Ciao <strong>Mario</strong>,
</p>
<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#333;">
Vi faccio un riepilogo veloce di quello che il gruppo Stappando offre alle cantine partner. A volte &egrave; utile avere tutto in un colpo d&rsquo;occhio.
</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 8px;">
<tr><td style="padding:14px 18px;background:#f0f7f9;border-radius:8px 8px 0 0;border-bottom:1px solid #e0edf0;">
  <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#005667;">Stappando.it &mdash; Vendita online</p>
  <p style="margin:0;font-size:13px;line-height:1.6;color:#444;">50.000 visite/mese, catalogo con foto professionali, logistica gestita, pagamenti automatici. Commissione 15%.</p>
</td></tr>
<tr><td style="padding:14px 18px;background:#f0f9f2;border-bottom:1px solid #dceede;">
  <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#4a8c3f;">Vineis.eu &mdash; Enoturismo</p>
  <p style="margin:0;font-size:13px;line-height:1.6;color:#444;">Pagina dedicata, prenotazioni online, gestione clienti. Visibilit&agrave; turisti italiani e internazionali. Commissione 15%.</p>
</td></tr>
<tr><td style="padding:14px 18px;background:#fdf6ee;border-radius:0 0 8px 8px;">
  <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#c0792a;">Anbrekabol.com &mdash; Spedizioni sicure</p>
  <p style="margin:0;font-size:13px;line-height:1.6;color:#444;">Scatole per bottiglie, spedizioni assicurate, zero rotture. Acquisto diretto online.</p>
</td></tr>
</table>
<p style="margin:16px 0 18px;font-size:13px;line-height:1.6;color:#888;text-align:center;">
Iscrizione gratuita a tutti i servizi &mdash; nessun costo fisso.
</p>
<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#333;">
Ogni settimana nuove cantine si registrano. Se volete far parte del network, i link sono sempre gli stessi:
</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
<tr>
<td width="50%" style="padding:0 4px 0 0;">
  <table width="100%" cellpadding="0" cellspacing="0">
  <tr><td style="background:#005667;border-radius:8px;text-align:center;">
    <a href="https://shop.stappando.it" style="display:inline-block;padding:12px 16px;color:#ffffff;font-size:13px;font-weight:700;text-decoration:none;">Vendi con noi</a>
  </td></tr>
  </table>
</td>
<td width="50%" style="padding:0 0 0 4px;">
  <table width="100%" cellpadding="0" cellspacing="0">
  <tr><td style="background:#4a8c3f;border-radius:8px;text-align:center;">
    <a href="https://vineis.eu" style="display:inline-block;padding:12px 16px;color:#ffffff;font-size:13px;font-weight:700;text-decoration:none;">Ospita con noi</a>
  </td></tr>
  </table>
</td>
</tr>
</table>
<p style="margin:0;font-size:15px;line-height:1.6;color:#333;">
Un saluto,<br>
<strong>Roberto</strong><br>
<span style="color:#005667;">Stappando</span>
</p>
`);
}

/* ── Follow-up 8  (+58 gg) — Porta sempre aperta ───────────────────── */
function buildFollowUp8(): string {
  return followUpLayout(`
<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#333;">
Ciao <strong>Mario</strong>,
</p>
<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#333;">
&Egrave; un po&rsquo; che non ci sentiamo. Questa &egrave; l&rsquo;ultima mail della serie, non voglio essere invadente.
</p>
<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#333;">
Volevo solo dirvi che <strong>la porta &egrave; sempre aperta</strong>. Se in futuro vorrete dare visibilit&agrave; ai vostri vini o alle esperienze in cantina, ci trovate qui.
</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
<tr><td style="padding:20px 24px;background:#f8f9fa;border-radius:12px;">
<p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#005667;">Per registrarvi, quando vorrete:</p>
<p style="margin:0;font-size:14px;line-height:1.8;color:#444;">
  Vendita vini online &rarr; <a href="https://shop.stappando.it" style="color:#005667;font-weight:600;">shop.stappando.it</a><br>
  Esperienze in cantina &rarr; <a href="https://vineis.eu" style="color:#4a8c3f;font-weight:600;">vineis.eu</a><br>
  Spedizioni sicure &rarr; <a href="https://anbrekabol.com" style="color:#c0792a;font-weight:600;">anbrekabol.com</a>
</p>
</td></tr>
</table>
<p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#444;">
Se avete domande su come funziona, rispondete pure a questa mail in qualsiasi momento.
</p>
<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#333;">
Vi auguro una splendida stagione e tanti brindisi.
</p>
<p style="margin:0;font-size:15px;line-height:1.6;color:#333;">
Un caro saluto,<br>
<strong>Roberto</strong><br>
<span style="color:#005667;">Stappando</span>
</p>
`);
}

export async function GET(req: NextRequest) {
  const previews = generatePreviews();
  return NextResponse.json({ previews });
}
