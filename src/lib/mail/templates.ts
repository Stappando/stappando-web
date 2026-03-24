/**
 * Email HTML templates for Stappando transactional emails.
 * Brand palette: #005667 (petrolio), #d9c39a (sabbia/oro), #ffffff (bianco)
 */

/* ── Base layout wrapper ──────────────────────────────── */

function baseLayout(content: string, preheader?: string): string {
  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Stappando</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>` : ''}
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;">
    <tr><td align="center" style="padding:24px 16px;">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;">
        <!-- Header -->
        <tr><td style="background:#005667;padding:24px 32px;text-align:center;">
          <img src="https://stappando.it/wp-content/uploads/2021/06/logo-stappando-white.png" alt="Stappando" width="160" style="display:inline-block;max-width:160px;height:auto;" />
        </td></tr>
        <!-- Content -->
        <tr><td style="padding:32px;">
          ${content}
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f5f5f0;padding:24px 32px;text-align:center;">
          <p style="margin:0 0 8px;font-size:12px;color:#888;">
            <a href="https://stappando.it" style="color:#005667;text-decoration:none;font-weight:600;">stappando.it</a>
          </p>
          <p style="margin:0;font-size:11px;color:#aaa;">
            Stappando S.r.l. — Enocultura italiana<br>
            Ricevi questa email perché hai effettuato un ordine o sei iscritto a Stappando.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/* ── Shared components ────────────────────────────────── */

function heading(text: string): string {
  return `<h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#005667;line-height:1.3;">${text}</h1>`;
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;color:#333;line-height:1.6;">${text}</p>`;
}

function ctaButton(text: string, url: string): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr><td>
    <a href="${url}" style="display:inline-block;padding:14px 32px;background:#005667;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:12px;">
      ${text}
    </a>
  </td></tr></table>`;
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid #e8e4dc;margin:24px 0;" />`;
}

function goldBadge(text: string): string {
  return `<span style="display:inline-block;padding:4px 12px;background:#d9c39a;color:#1a1a1a;font-size:12px;font-weight:700;border-radius:8px;text-transform:uppercase;letter-spacing:0.5px;">${text}</span>`;
}

/* ── Order item row ───────────────────────────────────── */

interface OrderItem {
  name: string;
  quantity: number;
  total: string;
  image?: string;
}

function orderItemsTable(items: OrderItem[], shipping: string, total: string): string {
  const rows = items.map(item => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #f0ece4;">
        ${item.image ? `<img src="${item.image}" width="48" height="48" style="border-radius:8px;object-fit:cover;vertical-align:middle;margin-right:12px;" />` : ''}
        <span style="font-size:14px;color:#333;">${item.name}</span>
        <span style="font-size:12px;color:#888;"> x${item.quantity}</span>
      </td>
      <td style="padding:8px 0;border-bottom:1px solid #f0ece4;text-align:right;font-size:14px;font-weight:600;color:#333;">${item.total} &euro;</td>
    </tr>
  `).join('');

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
      ${rows}
      <tr>
        <td style="padding:8px 0;font-size:13px;color:#888;">Spedizione</td>
        <td style="padding:8px 0;text-align:right;font-size:13px;color:#888;">${shipping}</td>
      </tr>
      <tr>
        <td style="padding:12px 0;font-size:18px;font-weight:700;color:#005667;">Totale</td>
        <td style="padding:12px 0;text-align:right;font-size:18px;font-weight:700;color:#005667;">${total} &euro;</td>
      </tr>
    </table>
  `;
}

/* ── Template: Ordine confermato ──────────────────────── */

export interface OrderConfirmedData {
  customerName: string;
  orderNumber: string;
  items: OrderItem[];
  shipping: string;
  total: string;
  orderUrl: string;
}

export function orderConfirmed(data: OrderConfirmedData): { subject: string; html: string } {
  return {
    subject: `Ordine #${data.orderNumber} confermato — Stappando`,
    html: baseLayout(`
      ${heading('Ordine confermato! 🍷')}
      ${paragraph(`Ciao ${data.customerName}, grazie per il tuo ordine! Stiamo già preparando il tuo pacco con cura.`)}
      ${goldBadge(`Ordine #${data.orderNumber}`)}
      ${orderItemsTable(data.items, data.shipping, data.total)}
      ${paragraph('Riceverai una email con il tracking non appena il pacco sarà affidato al corriere.')}
      ${ctaButton('Vedi il tuo ordine', data.orderUrl)}
    `, `Il tuo ordine #${data.orderNumber} è confermato`),
  };
}

/* ── Template: Ordine spedito ─────────────────────────── */

export interface OrderShippedData {
  customerName: string;
  orderNumber: string;
  trackingUrl: string;
  trackingNumber: string;
  carrier: string;
}

export function orderShipped(data: OrderShippedData): { subject: string; html: string } {
  return {
    subject: `Il tuo ordine #${data.orderNumber} è in viaggio!`,
    html: baseLayout(`
      ${heading('Il tuo vino è in viaggio! 🚚')}
      ${paragraph(`Ciao ${data.customerName}, il tuo ordine #${data.orderNumber} è stato affidato al corriere.`)}
      ${divider()}
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;border-radius:12px;padding:16px;margin:16px 0;">
        <tr><td style="padding:8px 16px;">
          <p style="margin:0;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.5px;">Corriere</p>
          <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#333;">${data.carrier}</p>
        </td></tr>
        <tr><td style="padding:8px 16px;">
          <p style="margin:0;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.5px;">Tracking</p>
          <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#005667;">${data.trackingNumber}</p>
        </td></tr>
      </table>
      ${paragraph('La consegna è prevista in 24-48 ore lavorative.')}
      ${ctaButton('Traccia il pacco', data.trackingUrl)}
    `, `Ordine #${data.orderNumber} spedito — tracking disponibile`),
  };
}

/* ── Template: Ordine annullato ───────────────────────── */

export interface OrderCancelledData {
  customerName: string;
  orderNumber: string;
}

export function orderCancelled(data: OrderCancelledData): { subject: string; html: string } {
  return {
    subject: `Ordine #${data.orderNumber} annullato`,
    html: baseLayout(`
      ${heading('Ordine annullato')}
      ${paragraph(`Ciao ${data.customerName}, il tuo ordine #${data.orderNumber} è stato annullato.`)}
      ${paragraph('Se il pagamento era già stato effettuato, il rimborso verrà elaborato entro 5-10 giorni lavorativi.')}
      ${paragraph('Se hai bisogno di aiuto o vuoi effettuare un nuovo ordine, siamo qui per te.')}
      ${ctaButton('Torna allo shop', 'https://stappando.it')}
      ${divider()}
      ${paragraph('<span style="font-size:13px;color:#888;">Hai domande? Rispondi a questa email o scrivici su <a href="mailto:info@stappando.it" style="color:#005667;">info@stappando.it</a></span>')}
    `, `Ordine #${data.orderNumber} annullato`),
  };
}

/* ── Template: Aggiornamento Punti POP ────────────────── */

export interface PointsUpdateData {
  customerName: string;
  pointsEarned: number;
  totalPoints: number;
  orderNumber?: string;
}

export function pointsUpdate(data: PointsUpdateData): { subject: string; html: string } {
  return {
    subject: `Hai guadagnato ${data.pointsEarned} Punti POP! 🎉`,
    html: baseLayout(`
      ${heading('Nuovi Punti POP! 🎉')}
      ${paragraph(`Ciao ${data.customerName}, hai appena guadagnato <strong>${data.pointsEarned} Punti POP</strong>${data.orderNumber ? ` con l'ordine #${data.orderNumber}` : ''}!`)}
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#005667;border-radius:16px;margin:24px 0;">
        <tr><td style="padding:24px;text-align:center;">
          <p style="margin:0;font-size:14px;color:#d9c39a;text-transform:uppercase;letter-spacing:1px;">Il tuo saldo</p>
          <p style="margin:8px 0 0;font-size:42px;font-weight:800;color:#ffffff;">${data.totalPoints}</p>
          <p style="margin:4px 0 0;font-size:14px;color:#d9c39a;">Punti POP</p>
        </td></tr>
      </table>
      ${paragraph('Accumula punti ad ogni ordine e usali per ottenere sconti esclusivi!')}
      ${ctaButton('Scopri i tuoi premi', 'https://stappando.it/punti-pop')}
    `, `+${data.pointsEarned} Punti POP — saldo: ${data.totalPoints}`),
  };
}

/* ── Template: Compleanno ─────────────────────────────── */

export interface BirthdayData {
  customerName: string;
  couponCode: string;
  expiresAt: string; // e.g. "domani alle 23:59"
}

export function birthday(data: BirthdayData): { subject: string; html: string } {
  return {
    subject: `Buon compleanno ${data.customerName}! 🎂 Un regalo per te`,
    html: baseLayout(`
      ${heading('Buon compleanno! 🎂🍷')}
      ${paragraph(`Ciao ${data.customerName}, da tutto il team Stappando: tanti auguri!`)}
      ${paragraph('Per festeggiare, ecco un regalo speciale solo per te:')}
      <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#005667,#007a8a);border-radius:16px;margin:24px 0;">
        <tr><td style="padding:32px;text-align:center;">
          <p style="margin:0;font-size:48px;font-weight:800;color:#d9c39a;">-20%</p>
          <p style="margin:8px 0 16px;font-size:15px;color:#ffffff;">su tutto il catalogo</p>
          <div style="display:inline-block;padding:12px 24px;background:#ffffff;border-radius:8px;border:2px dashed #d9c39a;">
            <span style="font-size:20px;font-weight:800;color:#005667;letter-spacing:2px;">${data.couponCode}</span>
          </div>
          <p style="margin:12px 0 0;font-size:12px;color:#d9c39a;">Valido fino a ${data.expiresAt}</p>
        </td></tr>
      </table>
      ${ctaButton('Usa il tuo sconto', `https://stappando.it/cerca?coupon=${data.couponCode}`)}
    `, `${data.customerName}, -20% per il tuo compleanno!`),
  };
}

/* ── Template: Gift card ricevuta ─────────────────────── */

export interface GiftCardData {
  recipientName: string;
  senderName: string;
  amount: string;
  code: string;
  message?: string;
}

export function giftCardReceived(data: GiftCardData): { subject: string; html: string } {
  return {
    subject: `${data.senderName} ti ha inviato una Gift Card Stappando! 🎁`,
    html: baseLayout(`
      ${heading('Hai ricevuto un regalo! 🎁')}
      ${paragraph(`Ciao ${data.recipientName}, <strong>${data.senderName}</strong> ti ha inviato una Gift Card Stappando!`)}
      ${data.message ? `<div style="background:#f5f5f0;border-left:4px solid #d9c39a;padding:16px;border-radius:0 8px 8px 0;margin:16px 0;font-style:italic;color:#555;">"${data.message}"</div>` : ''}
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:16px;margin:24px 0;">
        <tr><td style="padding:32px;text-align:center;">
          ${goldBadge('Gift Card')}
          <p style="margin:16px 0 8px;font-size:42px;font-weight:800;color:#d9c39a;">${data.amount} &euro;</p>
          <div style="display:inline-block;padding:10px 20px;background:#333;border-radius:8px;margin-top:8px;">
            <span style="font-size:18px;font-weight:700;color:#ffffff;letter-spacing:2px;">${data.code}</span>
          </div>
        </td></tr>
      </table>
      ${paragraph('Usala su tutto il catalogo Stappando — vini, confezioni, esperienze.')}
      ${ctaButton('Usa la tua Gift Card', 'https://stappando.it/cerca')}
    `, `${data.senderName} ti ha inviato ${data.amount}€ su Stappando`),
  };
}

/* ── Template: Benvenuto ──────────────────────────────── */

export interface WelcomeData {
  customerName: string;
}

export function welcome(data: WelcomeData): { subject: string; html: string } {
  return {
    subject: `Benvenuto in Stappando, ${data.customerName}! 🍷`,
    html: baseLayout(`
      ${heading('Benvenuto in Stappando! 🍷')}
      ${paragraph(`Ciao ${data.customerName}, siamo felici di averti con noi!`)}
      ${paragraph('Stappando è il marketplace dei migliori vini italiani, selezionati direttamente dai produttori e spediti con cura fino a casa tua.')}
      ${divider()}
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:12px 0;">
            <strong style="color:#005667;">★ Selezionati da sommelier</strong><br>
            <span style="font-size:13px;color:#666;">Ogni vino è scelto per qualità e territorio</span>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 0;">
            <strong style="color:#005667;">🚚 Consegna in 24-48h</strong><br>
            <span style="font-size:13px;color:#666;">Spedizione gratuita da 69€</span>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 0;">
            <strong style="color:#005667;">🎯 Punti POP</strong><br>
            <span style="font-size:13px;color:#666;">Accumula punti ad ogni ordine e ottieni sconti</span>
          </td>
        </tr>
      </table>
      ${ctaButton('Esplora il catalogo', 'https://stappando.it/cerca')}
    `, `Benvenuto in Stappando — vini italiani d'eccellenza`),
  };
}

/* ── Template: Carrello abbandonato ───────────────────── */

export interface AbandonedCartData {
  customerName: string;
  items: OrderItem[];
  cartUrl: string;
  total: string;
}

export function abandonedCart(data: AbandonedCartData): { subject: string; html: string } {
  const itemsList = data.items.map(item => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #f0ece4;">
        ${item.image ? `<img src="${item.image}" width="48" height="48" style="border-radius:8px;object-fit:cover;vertical-align:middle;margin-right:12px;" />` : ''}
        <span style="font-size:14px;color:#333;">${item.name}</span>
        <span style="font-size:12px;color:#888;"> x${item.quantity}</span>
      </td>
      <td style="padding:8px 0;border-bottom:1px solid #f0ece4;text-align:right;font-size:14px;font-weight:600;color:#333;">${item.total} &euro;</td>
    </tr>
  `).join('');

  return {
    subject: `${data.customerName}, hai dimenticato qualcosa? 🍷`,
    html: baseLayout(`
      ${heading('Hai lasciato qualcosa nel carrello')}
      ${paragraph(`Ciao ${data.customerName}, abbiamo notato che hai lasciato alcuni prodotti nel carrello. Li teniamo da parte per te!`)}
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
        ${itemsList}
        <tr>
          <td style="padding:12px 0;font-size:16px;font-weight:700;color:#005667;">Totale</td>
          <td style="padding:12px 0;text-align:right;font-size:16px;font-weight:700;color:#005667;">${data.total} &euro;</td>
        </tr>
      </table>
      ${paragraph('Completa il tuo ordine prima che le scorte finiscano!')}
      ${ctaButton('Completa l\'ordine', data.cartUrl)}
      ${divider()}
      ${paragraph('<span style="font-size:13px;color:#888;">Spedizione gratuita da 69€ · Consegna in 24-48h · Pagamento sicuro</span>')}
    `, `Il tuo carrello ti aspetta — ${data.items.length} prodott${data.items.length === 1 ? 'o' : 'i'}`),
  };
}
