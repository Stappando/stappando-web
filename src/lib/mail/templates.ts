/**
 * Email HTML templates for Stappando transactional emails.
 * Premium design — brand palette: #005667, #d9c39a, #ffffff
 */

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://stappando.it';

/* ── Base layout — premium white header with logo ─────── */

function baseLayout(content: string, preheader?: string): string {
  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Stappando</title>
</head>
<body style="margin:0;padding:0;background:#f5f3ee;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}</div>` : ''}
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ee;">
    <tr><td align="center" style="padding:32px 16px;">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e8e4dc;">
        <!-- Header — clean white, logo + rating -->
        <tr><td style="padding:32px 32px 24px;text-align:center;border-bottom:1px solid #f0ece4;">
          <a href="${SITE}" style="text-decoration:none;">
            <img src="https://stappando.it/wp-content/uploads/2022/11/logo-stappando-500W.png" alt="Stappando" width="150" style="display:inline-block;max-width:150px;height:auto;" />
          </a>
          <p style="margin:10px 0 0;font-size:11px;color:#999;">
            <span style="color:#d9c39a;letter-spacing:1px;">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
            <span style="color:#005667;font-weight:600;margin-left:4px;">4.6/5</span>
            <span style="color:#bbb;margin-left:2px;">&middot; 1000+ recensioni</span>
          </p>
        </td></tr>
        <!-- Content -->
        <tr><td style="padding:36px 36px 28px;">
          ${content}
        </td></tr>
        <!-- Footer -->
        <tr><td style="border-top:1px solid #f0ece4;padding:24px 36px;text-align:center;">
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 12px;">
            <tr>
              <td style="padding:0 6px;"><a href="https://www.instagram.com/stappando.it" style="text-decoration:none;color:#888;font-size:12px;">Instagram</a></td>
              <td style="padding:0 6px;color:#ccc;">|</td>
              <td style="padding:0 6px;"><a href="https://www.facebook.com/stappandoenoteca/" style="text-decoration:none;color:#888;font-size:12px;">Facebook</a></td>
              <td style="padding:0 6px;color:#ccc;">|</td>
              <td style="padding:0 6px;"><a href="${SITE}" style="text-decoration:none;color:#005667;font-size:12px;font-weight:600;">stappando.it</a></td>
            </tr>
          </table>
          <p style="margin:0;font-size:11px;color:#aaa;line-height:1.5;">
            Stappando S.r.l.s. — Enocultura italiana<br>
            <a href="${SITE}/privacy" style="color:#aaa;text-decoration:underline;">Privacy</a> · <a href="${SITE}/termini" style="color:#aaa;text-decoration:underline;">Termini</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/* ── Shared components — premium style ────────────────── */

function heading(text: string): string {
  return `<h1 style="margin:0 0 12px;font-size:26px;font-weight:700;color:#1a1a1a;line-height:1.25;letter-spacing:-0.3px;">${text}</h1>`;
}

function subheading(text: string): string {
  return `<p style="margin:0 0 20px;font-size:15px;color:#888;line-height:1.5;">${text}</p>`;
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.65;">${text}</p>`;
}

function ctaButton(text: string, url: string): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr><td>
    <a href="${url}" style="display:inline-block;padding:14px 36px;background:#005667;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;letter-spacing:0.2px;">
      ${text}
    </a>
  </td></tr></table>`;
}

function secondaryButton(text: string, url: string): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:16px 0;"><tr><td>
    <a href="${url}" style="display:inline-block;padding:12px 28px;background:#ffffff;color:#005667;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;border:1.5px solid #005667;">
      ${text}
    </a>
  </td></tr></table>`;
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid #f0ece4;margin:28px 0;" />`;
}

function goldBadge(text: string): string {
  return `<span style="display:inline-block;padding:5px 14px;background:#d9c39a;color:#5a4200;font-size:11px;font-weight:700;border-radius:20px;text-transform:uppercase;letter-spacing:0.6px;">${text}</span>`;
}

function couponBox(code: string): string {
  return `<div style="background:#f8f6f1;border:2px dashed #005667;border-radius:10px;padding:20px;text-align:center;margin:20px 0;">
    <span style="font-size:24px;font-weight:700;color:#005667;letter-spacing:3px;">${code}</span>
  </div>`;
}

function infoCard(label: string, value: string): string {
  return `<td style="padding:10px 16px;">
    <p style="margin:0;font-size:10px;color:#888;text-transform:uppercase;letter-spacing:0.8px;font-weight:600;">${label}</p>
    <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#1a1a1a;">${value}</p>
  </td>`;
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
      <td style="padding:12px 0;border-bottom:1px solid #f0ece4;">
        ${item.image ? `<img src="${item.image}" width="48" height="48" style="border-radius:8px;object-fit:cover;vertical-align:middle;margin-right:12px;" />` : ''}
        <span style="font-size:14px;color:#333;font-weight:500;">${item.name}</span>
        <span style="font-size:12px;color:#999;"> x${item.quantity}</span>
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #f0ece4;text-align:right;font-size:14px;font-weight:600;color:#1a1a1a;">${item.total} &euro;</td>
    </tr>
  `).join('');

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
      ${rows}
      <tr>
        <td style="padding:10px 0;font-size:13px;color:#888;">Spedizione</td>
        <td style="padding:10px 0;text-align:right;font-size:13px;color:#888;">${shipping}</td>
      </tr>
      <tr>
        <td style="padding:14px 0;font-size:20px;font-weight:700;color:#005667;border-top:2px solid #005667;">Totale</td>
        <td style="padding:14px 0;text-align:right;font-size:20px;font-weight:700;color:#005667;border-top:2px solid #005667;">${total} &euro;</td>
      </tr>
    </table>
  `;
}

/* ── Circuito product suggestion row ─────────────────── */

interface CircuitoProduct {
  name: string;
  slug: string;
  price: string;
  image?: string;
}

function circuitoSuggestions(products: CircuitoProduct[]): string {
  if (products.length === 0) return '';
  const cards = products.map(p => `
    <td width="50%" style="padding:6px;vertical-align:top;">
      <table cellpadding="0" cellspacing="0" width="100%" style="border:1.5px solid #d9c39a;border-radius:10px;overflow:hidden;">
        <tr><td style="background:linear-gradient(160deg,#f5f1ea,#e8e0d2);padding:12px;text-align:center;height:80px;">
          ${p.image ? `<img src="${p.image}" width="60" height="70" style="object-fit:contain;" />` : ''}
        </td></tr>
        <tr><td style="padding:10px 12px;">
          <p style="margin:0 0 2px;font-size:11px;font-weight:600;color:#1a1a1a;line-height:1.3;">${p.name}</p>
          <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#005667;">${p.price} &euro;</p>
          <a href="${SITE}/prodotto/${p.slug}" style="display:block;text-align:center;padding:8px;background:#005667;color:#fff;font-size:11px;font-weight:600;text-decoration:none;border-radius:6px;">Scopri</a>
        </td></tr>
      </table>
    </td>
  `).join('');

  return `
    ${divider()}
    <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#005667;text-transform:uppercase;letter-spacing:0.6px;">Scelti dal Sommelier per te</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr>${cards}</tr></table>
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
  shippingAddress?: string;
  pointsEarned?: number;
  totalPoints?: number;
  circuitoProducts?: CircuitoProduct[];
}

export function orderConfirmed(data: OrderConfirmedData): { subject: string; html: string } {
  return {
    subject: `Ordine #${data.orderNumber} confermato`,
    html: baseLayout(`
      ${heading('Ordine confermato')}
      ${subheading(`Grazie ${data.customerName}, stiamo preparando il tuo pacco con cura.`)}
      ${goldBadge(`Ordine #${data.orderNumber}`)}
      ${orderItemsTable(data.items, data.shipping, data.total)}

      ${data.shippingAddress ? `
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f6f1;border-radius:10px;margin:20px 0;">
        <tr>${infoCard('Spedizione a', data.shippingAddress)}</tr>
      </table>
      ` : ''}

      ${data.pointsEarned ? `
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#005667;border-radius:10px;margin:20px 0;">
        <tr>
          <td style="padding:18px 24px;">
            <table cellpadding="0" cellspacing="0" width="100%"><tr>
              <td>
                <p style="margin:0;font-size:11px;color:#d9c39a;text-transform:uppercase;letter-spacing:0.6px;font-weight:600;">Punti POP guadagnati</p>
                <p style="margin:4px 0 0;font-size:24px;font-weight:700;color:#ffffff;">+${data.pointsEarned}</p>
              </td>
              <td style="text-align:right;">
                <p style="margin:0;font-size:11px;color:#d9c39a;text-transform:uppercase;letter-spacing:0.6px;font-weight:600;">Saldo totale</p>
                <p style="margin:4px 0 0;font-size:24px;font-weight:700;color:#d9c39a;">${data.totalPoints || 0}</p>
              </td>
            </tr></table>
          </td>
        </tr>
      </table>
      ` : ''}

      ${paragraph('Riceverai un\'email con il tracking non appena il pacco sar&agrave; affidato al corriere.')}
      ${ctaButton('Segui il tuo ordine', data.orderUrl)}
      ${circuitoSuggestions(data.circuitoProducts || [])}
    `, `Ordine #${data.orderNumber} confermato`),
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
    subject: `Il tuo ordine #${data.orderNumber} è in viaggio`,
    html: baseLayout(`
      ${heading('Il tuo vino è in viaggio')}
      ${subheading(`${data.customerName}, il tuo ordine #${data.orderNumber} è stato affidato al corriere.`)}
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f6f1;border-radius:10px;margin:20px 0;">
        <tr>
          ${infoCard('Corriere', data.carrier)}
          ${infoCard('Tracking', data.trackingNumber)}
        </tr>
      </table>
      ${paragraph('La consegna è prevista in <strong>24-48 ore lavorative</strong>.')}
      ${ctaButton('Traccia il pacco', data.trackingUrl)}
    `, `Ordine #${data.orderNumber} spedito`),
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
      ${subheading(`${data.customerName}, il tuo ordine #${data.orderNumber} è stato annullato.`)}
      ${paragraph('Se il pagamento era già stato effettuato, il rimborso verrà elaborato entro 5-10 giorni lavorativi.')}
      ${paragraph('Hai bisogno di aiuto? Rispondi a questa email o scrivici su <a href="mailto:info@stappando.it" style="color:#005667;font-weight:600;">info@stappando.it</a>')}
      ${ctaButton('Torna allo shop', SITE)}
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
    subject: `+${data.pointsEarned} Punti POP guadagnati`,
    html: baseLayout(`
      ${heading('Nuovi Punti POP')}
      ${subheading(`${data.customerName}, hai guadagnato <strong style="color:#005667;">${data.pointsEarned} punti</strong>${data.orderNumber ? ` con l'ordine #${data.orderNumber}` : ''}.`)}
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#005667;border-radius:12px;margin:24px 0;">
        <tr><td style="padding:28px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#d9c39a;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Il tuo saldo</p>
          <p style="margin:10px 0 0;font-size:48px;font-weight:800;color:#ffffff;letter-spacing:-1px;">${data.totalPoints}</p>
          <p style="margin:4px 0 0;font-size:13px;color:#d9c39a;">Punti POP</p>
        </td></tr>
      </table>
      ${paragraph('Usa i tuoi punti per ottenere sconti esclusivi sul prossimo ordine.')}
      ${ctaButton('Scopri i tuoi premi', `${SITE}/punti-pop`)}
    `, `+${data.pointsEarned} Punti POP`),
  };
}

/* ── Template: Compleanno ─────────────────────────────── */

export interface BirthdayData {
  customerName: string;
  couponCode: string;
  expiresAt: string;
}

export function birthday(data: BirthdayData): { subject: string; html: string } {
  return {
    subject: `Buon compleanno ${data.customerName} — un regalo per te`,
    html: baseLayout(`
      ${heading('Tanti auguri!')}
      ${subheading(`${data.customerName}, da tutto il team Stappando: buon compleanno.`)}
      ${paragraph('Per festeggiare, ecco un regalo speciale solo per te:')}
      <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#005667,#007a8a);border-radius:12px;margin:24px 0;">
        <tr><td style="padding:36px;text-align:center;">
          <p style="margin:0;font-size:52px;font-weight:800;color:#d9c39a;letter-spacing:-1px;">-20%</p>
          <p style="margin:8px 0 20px;font-size:15px;color:#ffffff;">su tutto il catalogo</p>
          <div style="display:inline-block;padding:14px 28px;background:#ffffff;border-radius:10px;border:2px dashed #d9c39a;">
            <span style="font-size:22px;font-weight:800;color:#005667;letter-spacing:3px;">${data.couponCode}</span>
          </div>
          <p style="margin:14px 0 0;font-size:12px;color:#d9c39a;">Valido fino a ${data.expiresAt}</p>
        </td></tr>
      </table>
      ${ctaButton('Festeggia con un buon vino', `${SITE}/cerca?coupon=${data.couponCode}`)}
    `, `${data.customerName}, -20% per il tuo compleanno`),
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
    subject: `${data.senderName} ti ha inviato una Gift Card Stappando`,
    html: baseLayout(`
      ${heading('Hai ricevuto un regalo')}
      ${subheading(`${data.recipientName}, <strong>${data.senderName}</strong> ti ha inviato una Gift Card.`)}
      ${data.message ? `<div style="background:#f8f6f1;border-left:3px solid #d9c39a;padding:16px 20px;border-radius:0 8px 8px 0;margin:20px 0;font-size:14px;font-style:italic;color:#555;line-height:1.5;">"${data.message}"</div>` : ''}
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:12px;margin:24px 0;">
        <tr><td style="padding:36px;text-align:center;">
          ${goldBadge('Gift Card')}
          <p style="margin:18px 0 10px;font-size:48px;font-weight:800;color:#d9c39a;letter-spacing:-1px;">${data.amount} &euro;</p>
          <div style="display:inline-block;padding:12px 24px;background:#333;border-radius:8px;margin-top:8px;">
            <span style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:3px;">${data.code}</span>
          </div>
        </td></tr>
      </table>
      ${paragraph('Usala su tutto il catalogo: vini, confezioni, esperienze.')}
      ${ctaButton('Scegli il tuo vino', `${SITE}/cerca`)}
    `, `${data.senderName} ti ha inviato ${data.amount}€`),
  };
}

/* ── Template: Benvenuto ──────────────────────────────── */

export interface WelcomeData {
  customerName: string;
}

export function welcome(data: WelcomeData): { subject: string; html: string } {
  return {
    subject: `Benvenuto in Stappando, ${data.customerName}`,
    html: baseLayout(`
      ${heading(`Benvenuto, ${data.customerName}`)}
      ${subheading('Siamo felici di averti con noi.')}
      ${paragraph('Stappando è il marketplace dei migliori vini italiani, selezionati direttamente dai produttori e spediti con cura fino a casa tua.')}
      ${divider()}
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:10px 0;font-size:14px;color:#444;"><strong style="color:#005667;">Selezionati da sommelier</strong> — Qualità e territorio garantiti</td></tr>
        <tr><td style="padding:10px 0;font-size:14px;color:#444;"><strong style="color:#005667;">Consegna 24-48h</strong> — Spedizione gratuita da 69€</td></tr>
        <tr><td style="padding:10px 0;font-size:14px;color:#444;"><strong style="color:#005667;">Punti POP</strong> — Accumula punti ad ogni ordine</td></tr>
      </table>
      ${ctaButton('Esplora il catalogo', `${SITE}/cerca`)}
    `, `Benvenuto in Stappando`),
  };
}

/* ── Template: Benvenuto con coupon ────────────────────── */

export function welcomeTemplate(firstName: string, couponCode: string, expiresDate: string): string {
  return baseLayout(`
    ${heading(`Benvenuto, ${firstName}`)}
    ${subheading('Siamo felici di averti con noi. Ecco un regalo per iniziare.')}
    ${paragraph('<strong style="color:#005667;">Il tuo codice sconto di benvenuto:</strong>')}
    ${couponBox(couponCode)}
    ${paragraph('Valido <strong>5% su tutto il catalogo</strong>.')}
    ${paragraph(`Scade il <strong>${expiresDate}</strong>.`)}
    ${ctaButton('Usa il codice ora', `${SITE}/cerca`)}
    ${divider()}
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:8px 0;font-size:13px;color:#666;"><strong style="color:#005667;">Selezionati da sommelier</strong> — Qualità garantita</td></tr>
      <tr><td style="padding:8px 0;font-size:13px;color:#666;"><strong style="color:#005667;">Consegna 24-48h</strong> — Gratuita da 69€</td></tr>
      <tr><td style="padding:8px 0;font-size:13px;color:#666;"><strong style="color:#005667;">Punti POP</strong> — Accumula punti ad ogni ordine</td></tr>
    </table>
  `, `Benvenuto! Ecco il tuo sconto del 5%: ${couponCode}`);
}

/* ── Template: Secondo ordine con coupon ──────────────── */

export function secondOrderTemplate(firstName: string, couponCode: string, expiresDate: string): string {
  return baseLayout(`
    ${heading('Grazie per il tuo primo ordine')}
    ${subheading(`${firstName}, ecco un regalo per ringraziarti.`)}
    ${paragraph('<strong style="color:#005667;">Il tuo secondo sconto:</strong>')}
    ${couponBox(couponCode)}
    ${paragraph('<strong>5% sul prossimo ordine.</strong>')}
    ${paragraph(`Scade il <strong>${expiresDate}</strong>.`)}
    ${ctaButton('Ordina di nuovo', `${SITE}/cerca`)}
  `, `Grazie! Ecco il tuo secondo sconto: ${couponCode}`);
}

/* ── Template: Carrello abbandonato ───────────────────── */

export interface AbandonedCartData {
  customerName: string;
  items: OrderItem[];
  cartUrl: string;
  total: string;
  isReminder?: boolean; // true = second email after 3h
}

export function abandonedCart(data: AbandonedCartData): { subject: string; html: string } {
  const itemsList = data.items.map(item => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #f0ece4;">
        ${item.image ? `<img src="${item.image}" width="52" height="52" style="border-radius:8px;object-fit:cover;vertical-align:middle;margin-right:14px;" />` : ''}
        <span style="font-size:14px;color:#1a1a1a;font-weight:500;">${item.name}</span>
        <span style="font-size:12px;color:#999;"> x${item.quantity}</span>
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #f0ece4;text-align:right;font-size:15px;font-weight:600;color:#1a1a1a;">${item.total} &euro;</td>
    </tr>
  `).join('');

  const isReminder = data.isReminder;

  return {
    subject: isReminder
      ? `${data.customerName}, i tuoi vini stanno per finire`
      : `${data.customerName}, hai dimenticato qualcosa?`,
    html: baseLayout(`
      ${heading(isReminder ? 'Le scorte si stanno esaurendo' : 'Il tuo carrello ti aspetta')}
      ${subheading(isReminder
        ? `${data.customerName}, i prodotti nel tuo carrello hanno disponibilità limitata. Non vorremmo che li perdessi.`
        : `${data.customerName}, hai lasciato qualcosa nel carrello. Lo teniamo da parte per te.`
      )}
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
        ${itemsList}
        <tr>
          <td style="padding:16px 0;font-size:20px;font-weight:700;color:#005667;border-top:2px solid #005667;">Totale</td>
          <td style="padding:16px 0;text-align:right;font-size:20px;font-weight:700;color:#005667;border-top:2px solid #005667;">${data.total} &euro;</td>
        </tr>
      </table>
      ${ctaButton('Completa l\'ordine', data.cartUrl)}
      ${divider()}
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f6f1;border-radius:10px;">
        <tr>
          <td style="padding:14px 20px;font-size:12px;color:#666;text-align:center;">
            Spedizione gratuita da 69€ &middot; Consegna 24-48h &middot; Pagamento 100% sicuro
          </td>
        </tr>
      </table>
    `, isReminder
      ? `Ultima chance — i tuoi vini stanno per finire`
      : `Il tuo carrello ti aspetta: ${data.items.length} prodott${data.items.length === 1 ? 'o' : 'i'}`
    ),
  };
}

/* ── Template: Recensisci il tuo ordine ──────────────── */

export interface ReviewRequestData {
  customerName: string;
  orderNumber: string;
  items: { name: string; slug: string; image?: string }[];
}

export function reviewRequest(data: ReviewRequestData): { subject: string; html: string } {
  const productRows = data.items.map(item => `
    <tr>
      <td style="padding:14px 0;border-bottom:1px solid #f0ece4;">
        <table cellpadding="0" cellspacing="0" width="100%"><tr>
          <td style="width:64px;vertical-align:top;">
            ${item.image ? `<img src="${item.image}" width="56" height="56" style="border-radius:10px;object-fit:cover;display:block;" />` : `<div style="width:56px;height:56px;background:#f5f5f0;border-radius:10px;"></div>`}
          </td>
          <td style="padding-left:14px;vertical-align:middle;">
            <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#1a1a1a;">${item.name}</p>
            <p style="margin:0 0 8px;font-size:16px;color:#d9c39a;letter-spacing:2px;">&#9733;&#9733;&#9733;&#9733;&#9733;</p>
            <a href="${SITE}/prodotto/${item.slug}#recensioni" style="display:inline-block;padding:8px 20px;background:#d9c39a;color:#5a4200;font-size:12px;font-weight:700;text-decoration:none;border-radius:6px;">
              Lascia una recensione &rarr; +100 POP
            </a>
          </td>
        </tr></table>
      </td>
    </tr>
  `).join('');

  return {
    subject: 'Come è andata? Guadagna 100 Punti POP',
    html: baseLayout(`
      ${heading('Tutto ok con il tuo ordine?')}
      ${subheading(`${data.customerName}, speriamo che i vini dell'ordine #${data.orderNumber} ti stiano piacendo.`)}
      ${paragraph('Lascia una recensione per ogni prodotto e guadagna <strong>100 Punti POP</strong> per ciascuna:')}
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
        ${productRows}
      </table>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#005667;border-radius:10px;margin:20px 0;">
        <tr><td style="padding:16px 24px;text-align:center;">
          <p style="margin:0;font-size:13px;color:#d9c39a;font-weight:600;">Ogni recensione = 100 Punti POP accreditati entro 24h</p>
        </td></tr>
      </table>
    `, `Recensisci i prodotti dell'ordine #${data.orderNumber}`),
  };
}
