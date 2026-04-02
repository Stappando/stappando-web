/**
 * Email HTML templates for Stappando transactional emails.
 * Premium design — brand palette: #005667, #d9c39a, #ffffff
 */

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://stappando.it';
const WP_ADMIN = 'https://stappando.it/wp-admin';

/* ── Base layout — premium header with logo ─────────── */

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
        <tr><td style="background:#1a1a1a;padding:24px 36px;text-align:center;">
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 12px;">
            <tr>
              <td style="padding:0 6px;"><a href="https://www.instagram.com/stappando.it" style="text-decoration:none;color:#888;font-size:11px;">Instagram</a></td>
              <td style="padding:0 6px;color:#555;">|</td>
              <td style="padding:0 6px;"><a href="https://www.facebook.com/stappandoenoteca/" style="text-decoration:none;color:#888;font-size:11px;">Facebook</a></td>
              <td style="padding:0 6px;color:#555;">|</td>
              <td style="padding:0 6px;"><a href="${SITE}" style="text-decoration:none;color:#d9c39a;font-size:11px;font-weight:600;">stappando.it</a></td>
            </tr>
          </table>
          <p style="margin:0;font-size:11px;color:#888;line-height:1.5;">
            &copy; 2026 Stappando Srl &mdash; P.IVA 15855161003<br>
            <a href="${SITE}/privacy" style="color:#888;text-decoration:underline;">Privacy</a> &middot; <a href="${SITE}/termini" style="color:#888;text-decoration:underline;">Termini</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/* ── Shared components ──────────────────────────────── */

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

function sectionLabel(text: string): string {
  return `<p style="margin:0 0 10px;font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:0.06em;">${text}</p>`;
}

function infoBox(content: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f6f1;border-radius:8px;margin:12px 0;">
    <tr><td style="padding:16px 20px;">${content}</td></tr>
  </table>`;
}

function infoCard(label: string, value: string): string {
  return `<td style="padding:10px 16px;">
    <p style="margin:0;font-size:10px;color:#888;text-transform:uppercase;letter-spacing:0.8px;font-weight:600;">${label}</p>
    <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#1a1a1a;">${value}</p>
  </td>`;
}

function couponBox(code: string): string {
  return `<div style="background:#f8f6f1;border:2px dashed #005667;border-radius:10px;padding:20px;text-align:center;margin:20px 0;">
    <span style="font-size:24px;font-weight:700;color:#005667;letter-spacing:3px;">${code}</span>
  </div>`;
}

/* ── Order item row ───────────────────────────────── */

interface OrderItem {
  name: string;
  quantity: number;
  total: string;
  image?: string;
  vendor?: string;
}

function orderItemsTable(items: OrderItem[], shipping: string, total: string, discount?: string, carrierName?: string, couponCode?: string): string {
  const rows = items.map(item => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #f0ece4;">
        ${item.image ? `<img src="${item.image}" width="48" height="48" style="border-radius:8px;object-fit:cover;vertical-align:middle;margin-right:12px;" />` : ''}
        <span style="font-size:14px;color:#333;font-weight:500;">${item.name}</span>
        ${item.vendor ? `<br><span style="font-size:11px;color:#999;">${item.vendor}</span>` : ''}
        <span style="font-size:12px;color:#999;"> x${item.quantity}</span>
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #f0ece4;text-align:right;font-size:14px;font-weight:600;color:#1a1a1a;">${item.total} &euro;</td>
    </tr>
  `).join('');

  const shippingLabel = carrierName ? `Spedizione via ${carrierName}` : 'Spedizione';

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
      ${rows}
      <tr>
        <td style="padding:10px 0;font-size:13px;color:#888;">${shippingLabel}</td>
        <td style="padding:10px 0;text-align:right;font-size:13px;color:#888;">${shipping}</td>
      </tr>
      ${discount ? `<tr>
        <td style="padding:6px 0;font-size:13px;color:#005667;font-weight:600;">Sconto${couponCode ? ` <span style="font-size:11px;background:#e8f5f0;border:1px solid #005667;border-radius:4px;padding:1px 6px;letter-spacing:0.5px;">${couponCode}</span>` : ''}</td>
        <td style="padding:6px 0;text-align:right;font-size:13px;color:#005667;font-weight:600;">-${discount} &euro;</td>
      </tr>` : ''}
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

/* ══════════════════════════════════════════════════════
   MAIL 1 — CLIENTE: Ordine confermato
   ══════════════════════════════════════════════════════ */

export interface OrderConfirmedData {
  customerName: string;
  orderNumber: string;
  items: OrderItem[];
  shipping: string;
  total: string;
  orderUrl: string;
  shippingAddress?: string;
  carrierName?: string;
  deliveryEstimate?: string;
  discount?: string;
  couponCode?: string;
  pointsEarned?: number;
  totalPoints?: number;
  invoiceData?: { vatNumber?: string; companyName?: string; pec?: string; sdi?: string };
  circuitoProducts?: CircuitoProduct[];
}

export function orderConfirmed(data: OrderConfirmedData): { subject: string; html: string } {
  const carrierDisplay = data.carrierName || 'Corriere espresso';
  const deliveryEst = data.deliveryEstimate || '1-3 giorni lavorativi';

  return {
    subject: `Ordine #${data.orderNumber} confermato — grazie ${data.customerName}!`,
    html: baseLayout(`
      ${heading('Ordine confermato')}
      ${subheading(`Grazie ${data.customerName}, stiamo preparando il tuo pacco con cura.`)}
      ${goldBadge(`Ordine #${data.orderNumber}`)}
      ${orderItemsTable(data.items, data.shipping, data.total, data.discount, data.carrierName, data.couponCode)}

      ${data.carrierName ? `
      ${infoBox(`
        ${sectionLabel('Spedizione')}
        <p style="margin:0;font-size:14px;color:#1a1a1a;font-weight:600;">Spediremo con ${carrierDisplay}</p>
        <p style="margin:4px 0 0;font-size:13px;color:#888;">Consegna stimata: ${deliveryEst}</p>
      `)}` : ''}

      ${data.shippingAddress ? `
      ${infoBox(`
        ${sectionLabel('Indirizzo di consegna')}
        <p style="margin:0;font-size:14px;color:#1a1a1a;">${data.shippingAddress}</p>
      `)}` : ''}

      ${data.invoiceData ? `
      ${infoBox(`
        ${sectionLabel('Dati fatturazione')}
        ${data.invoiceData.companyName ? `<p style="margin:0 0 4px;font-size:14px;color:#1a1a1a;font-weight:600;">${data.invoiceData.companyName}</p>` : ''}
        ${data.invoiceData.vatNumber ? `<p style="margin:0 0 2px;font-size:13px;color:#444;">P.IVA / CF: ${data.invoiceData.vatNumber}</p>` : ''}
        ${data.invoiceData.pec ? `<p style="margin:0 0 2px;font-size:13px;color:#444;">PEC: ${data.invoiceData.pec}</p>` : ''}
        ${data.invoiceData.sdi ? `<p style="margin:0;font-size:13px;color:#444;">SDI: ${data.invoiceData.sdi}</p>` : ''}
      `)}` : ''}

      ${data.pointsEarned ? `
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#005667;border-radius:10px;margin:20px 0;">
        <tr><td style="padding:18px 24px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#d9c39a;text-transform:uppercase;letter-spacing:0.6px;font-weight:600;">Punti POP guadagnati</p>
          <p style="margin:4px 0 0;font-size:28px;font-weight:700;color:#ffffff;">+${data.pointsEarned}</p>
        </td></tr>
      </table>` : ''}

      ${paragraph(`Riceverai un'email con il tracking non appena il pacco sar&agrave; affidato al corriere.`)}
      ${ctaButton('Vedi il tuo ordine', data.orderUrl)}
      ${secondaryButton('Continua a fare shopping', `${SITE}/cerca`)}
      ${circuitoSuggestions(data.circuitoProducts || [])}

      ${infoBox(`
        <table cellpadding="0" cellspacing="0" width="100%"><tr>
          <td style="font-size:12px;color:#666;text-align:center;">
            Pagamento sicuro &middot; Reso gratuito entro 14gg &middot; Assistenza dedicata
          </td>
        </tr></table>
      `)}
    `, `Ordine #${data.orderNumber} confermato — grazie ${data.customerName}!`),
  };
}

/* ══════════════════════════════════════════════════════
   MAIL 2 — ADMIN: Nuovo ordine ricevuto
   ══════════════════════════════════════════════════════ */

export interface AdminNewOrderData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  vendorGroups: { vendorName: string; items: { name: string; quantity: number; total: string }[]; subtotal: string }[];
  carrierName: string;
  shippingAddress: string;
  billingAddress: string;
  invoiceData?: { vatNumber?: string; companyName?: string; pec?: string; sdi?: string };
  paymentMethod: string;
  transactionId: string;
  subtotal: string;
  shippingCost: string;
  discount?: string;
  couponCode?: string;
  total: string;
  customerNotes?: string;
  carrierPreference?: string;
  newsletter?: boolean;
}

export function adminNewOrder(data: AdminNewOrderData): { subject: string; html: string } {
  const vendorSections = data.vendorGroups.map(vg => {
    const rows = vg.items.map(i => `
      <tr>
        <td style="padding:6px 0;border-bottom:1px solid #f0ece4;font-size:13px;color:#333;">${i.name} <span style="color:#999;">x${i.quantity}</span></td>
        <td style="padding:6px 0;border-bottom:1px solid #f0ece4;text-align:right;font-size:13px;font-weight:600;">${i.total} &euro;</td>
      </tr>
    `).join('');
    return `
      <div style="margin-bottom:16px;">
        <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#005667;text-transform:uppercase;">${vg.vendorName}</p>
        <table width="100%" cellpadding="0" cellspacing="0">${rows}</table>
        <p style="margin:6px 0 0;text-align:right;font-size:12px;color:#888;">Subtotale: ${vg.subtotal} &euro;</p>
      </div>
    `;
  }).join('');

  return {
    subject: `🛒 Nuovo ordine #${data.orderNumber} — ${data.customerName} — ${data.total}€`,
    html: baseLayout(`
      ${heading(`Nuovo ordine #${data.orderNumber}`)}

      ${infoBox(`
        ${sectionLabel('Cliente')}
        <p style="margin:0;font-size:14px;color:#1a1a1a;font-weight:600;">${data.customerName}</p>
        <p style="margin:4px 0 0;font-size:13px;color:#444;">${data.customerEmail} &middot; ${data.customerPhone || 'N/A'}</p>
      `)}

      ${sectionLabel('Prodotti per vendor')}
      ${vendorSections}

      ${infoBox(`
        ${sectionLabel('Spedizione')}
        <p style="margin:0 0 4px;font-size:13px;color:#444;"><strong>Corriere:</strong> ${data.carrierName}</p>
        <p style="margin:0;font-size:13px;color:#444;"><strong>Indirizzo:</strong> ${data.shippingAddress}</p>
      `)}

      ${data.invoiceData ? `${infoBox(`
        ${sectionLabel('Fatturazione')}
        ${data.invoiceData.companyName ? `<p style="margin:0 0 2px;font-size:13px;color:#444;"><strong>Ragione sociale:</strong> ${data.invoiceData.companyName}</p>` : ''}
        ${data.invoiceData.vatNumber ? `<p style="margin:0 0 2px;font-size:13px;color:#444;"><strong>P.IVA / CF:</strong> ${data.invoiceData.vatNumber}</p>` : ''}
        ${data.invoiceData.pec ? `<p style="margin:0 0 2px;font-size:13px;color:#444;"><strong>PEC:</strong> ${data.invoiceData.pec}</p>` : ''}
        ${data.invoiceData.sdi ? `<p style="margin:0;font-size:13px;color:#444;"><strong>SDI:</strong> ${data.invoiceData.sdi}</p>` : ''}
      `)}` : ''}

      ${infoBox(`
        ${sectionLabel('Pagamento')}
        <p style="margin:0 0 2px;font-size:13px;color:#444;"><strong>Metodo:</strong> ${data.paymentMethod}</p>
        <p style="margin:0;font-size:13px;color:#444;"><strong>Transaction ID:</strong> ${data.transactionId}</p>
      `)}

      ${infoBox(`
        ${sectionLabel('Totali')}
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="font-size:13px;color:#444;padding:3px 0;">Subtotale prodotti</td><td style="text-align:right;font-size:13px;font-weight:600;">${data.subtotal} &euro;</td></tr>
          <tr><td style="font-size:13px;color:#444;padding:3px 0;">Spedizione</td><td style="text-align:right;font-size:13px;font-weight:600;">${data.shippingCost} &euro;</td></tr>
          ${data.discount ? `<tr><td style="font-size:13px;color:#005667;padding:3px 0;font-weight:600;">Sconto${data.couponCode ? ` <span style="font-size:11px;background:#e8f5f0;border:1px solid #005667;border-radius:4px;padding:1px 5px;letter-spacing:0.5px;">${data.couponCode}</span>` : ''}</td><td style="text-align:right;font-size:13px;color:#005667;font-weight:600;">-${data.discount} &euro;</td></tr>` : ''}
          <tr><td style="font-size:16px;color:#005667;font-weight:700;padding:8px 0;border-top:2px solid #005667;">Totale</td><td style="text-align:right;font-size:16px;color:#005667;font-weight:700;padding:8px 0;border-top:2px solid #005667;">${data.total} &euro;</td></tr>
        </table>
      `)}

      ${data.customerNotes ? `${infoBox(`
        ${sectionLabel('Note cliente')}
        <p style="margin:0;font-size:13px;color:#444;">${data.customerNotes}</p>
      `)}` : ''}

      ${data.carrierPreference ? `${infoBox(`
        ${sectionLabel('Preferenze')}
        <p style="margin:0 0 2px;font-size:13px;color:#444;">Corriere preferito: ${data.carrierPreference}</p>
        ${data.newsletter !== undefined ? `<p style="margin:0;font-size:13px;color:#444;">Newsletter: ${data.newsletter ? 'S&igrave;' : 'No'}</p>` : ''}
      `)}` : ''}

      ${ctaButton('Apri ordine su WooCommerce', `${WP_ADMIN}/post.php?post=${data.orderNumber}&action=edit`)}
    `, `Nuovo ordine #${data.orderNumber} — ${data.total}€`),
  };
}

/* ══════════════════════════════════════════════════════
   MAIL 3 — VENDOR: Sub-ordine ricevuto
   ══════════════════════════════════════════════════════ */

export interface VendorSubOrderData {
  vendorName: string;
  subOrderNumber: string;
  parentOrderNumber: string;
  items: { name: string; quantity: number; total: string }[];
  grossTotal: string;
  netTotal: string;
  vendorAmount: string;
  platformAmount: string;
  shippingAddress: string;
  customerName: string;
  customerPhone?: string;
  customerNotes?: string;
  carrierName?: string;
}

export function vendorSubOrder(data: VendorSubOrderData): { subject: string; html: string } {
  const itemRows = data.items.map(item => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f0ece4;font-size:14px;color:#333;">${item.name} <span style="color:#999;">x${item.quantity}</span></td>
      <td style="padding:10px 0;border-bottom:1px solid #f0ece4;text-align:right;font-size:14px;font-weight:600;color:#1a1a1a;">${item.total} &euro;</td>
    </tr>
  `).join('');

  return {
    subject: `📦 Nuovo ordine #${data.subOrderNumber} da preparare`,
    html: baseLayout(`
      ${heading('Nuovo ordine da preparare')}
      ${subheading(`Ciao ${data.vendorName}, hai un nuovo ordine!`)}
      ${goldBadge(`Ordine #${data.subOrderNumber}`)}
      <p style="margin:8px 0 20px;font-size:12px;color:#999;">Ordine cliente #${data.parentOrderNumber}</p>

      ${sectionLabel('I tuoi prodotti da spedire')}
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
        ${itemRows}
      </table>

      ${infoBox(`
        ${sectionLabel('Spedisci a')}
        <p style="margin:0 0 4px;font-size:14px;color:#1a1a1a;font-weight:600;">${data.customerName}</p>
        <p style="margin:0 0 4px;font-size:13px;color:#444;">${data.shippingAddress}</p>
        ${data.customerPhone ? `<p style="margin:0 0 4px;font-size:13px;color:#444;">Tel: ${data.customerPhone}</p>` : ''}
        ${data.customerNotes ? `<p style="margin:4px 0 0;font-size:12px;color:#888;font-style:italic;">Note: ${data.customerNotes}</p>` : ''}
      `)}

      ${data.carrierName ? `${infoBox(`
        ${sectionLabel('Corriere scelto dal cliente')}
        <p style="margin:0;font-size:14px;color:#005667;font-weight:600;">${data.carrierName}</p>
      `)}` : ''}

      ${infoBox(`
        ${sectionLabel('Il tuo incasso')}
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="font-size:13px;color:#444;padding:3px 0;">Lordo</td><td style="text-align:right;font-size:13px;font-weight:600;">${data.grossTotal} &euro;</td></tr>
          <tr><td style="font-size:13px;color:#444;padding:3px 0;">IVA (22%)</td><td style="text-align:right;font-size:13px;color:#999;">- inclusa</td></tr>
          <tr><td style="font-size:13px;color:#444;padding:3px 0;">Netto</td><td style="text-align:right;font-size:13px;font-weight:600;">${data.netTotal} &euro;</td></tr>
          <tr><td style="font-size:15px;color:#005667;font-weight:700;padding:8px 0;border-top:2px solid #005667;">La tua quota (85%)</td><td style="text-align:right;font-size:15px;color:#005667;font-weight:700;padding:8px 0;border-top:2px solid #005667;">${data.vendorAmount} &euro;</td></tr>
        </table>
      `)}

      ${paragraph('Prepara il pacco e attendi il ritiro del corriere. Il cliente ricever&agrave; automaticamente la notifica di spedizione.')}
      ${ctaButton('Vai alla Dashboard', `${SITE}/vendor/dashboard`)}
    `, `Nuovo ordine #${data.subOrderNumber} per ${data.vendorName}`),
  };
}

/* ══════════════════════════════════════════════════════
   MAIL 4 — CLIENTE: Ordine spedito
   ══════════════════════════════════════════════════════ */

export interface OrderShippedData {
  customerName: string;
  orderNumber: string;
  trackingUrl: string;
  trackingNumber: string;
  carrier: string;
  items?: OrderItem[];
  shippingAddress?: string;
  deliveryEstimate?: string;
}

export function orderShipped(data: OrderShippedData): { subject: string; html: string } {
  const itemRows = data.items?.map(item => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #f0ece4;font-size:13px;color:#333;">${item.name} <span style="color:#999;">x${item.quantity}</span></td>
      <td style="padding:8px 0;border-bottom:1px solid #f0ece4;text-align:right;font-size:13px;font-weight:600;">${item.total} &euro;</td>
    </tr>
  `).join('') || '';

  return {
    subject: `🚚 Il tuo ordine #${data.orderNumber} è in viaggio!`,
    html: baseLayout(`
      ${heading('Il tuo vino è in viaggio!')}
      ${subheading(`${data.customerName}, il tuo ordine #${data.orderNumber} è stato spedito.`)}

      ${itemRows ? `
        ${sectionLabel('Prodotti spediti')}
        <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">${itemRows}</table>
      ` : ''}

      ${infoBox(`
        ${sectionLabel('Tracking')}
        <p style="margin:0 0 4px;font-size:13px;color:#444;"><strong>Corriere:</strong> ${data.carrier}</p>
        <p style="margin:0;font-size:13px;color:#444;"><strong>Numero tracking:</strong> ${data.trackingNumber}</p>
      `)}

      ${data.shippingAddress ? `${infoBox(`
        ${sectionLabel('Indirizzo consegna')}
        <p style="margin:0;font-size:13px;color:#444;">${data.shippingAddress}</p>
      `)}` : ''}

      ${paragraph(`Consegna prevista in <strong>${data.deliveryEstimate || '1-3 giorni lavorativi'}</strong>.`)}
      ${ctaButton('Traccia il tuo pacco', data.trackingUrl)}
      ${secondaryButton('I miei ordini', `${SITE}/account`)}
    `, `Ordine #${data.orderNumber} spedito — traccia il pacco`),
  };
}

/* ══════════════════════════════════════════════════════
   MAIL 5 — CLIENTE: Ordine annullato
   ══════════════════════════════════════════════════════ */

export interface OrderCancelledData {
  customerName: string;
  orderNumber: string;
  items?: OrderItem[];
  refundAmount?: string;
  paymentMethod?: string;
}

export function orderCancelled(data: OrderCancelledData): { subject: string; html: string } {
  const itemRows = data.items?.map(item => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #f0ece4;font-size:13px;color:#333;">${item.name} <span style="color:#999;">x${item.quantity}</span></td>
      <td style="padding:8px 0;border-bottom:1px solid #f0ece4;text-align:right;font-size:13px;font-weight:600;">${item.total} &euro;</td>
    </tr>
  `).join('') || '';

  return {
    subject: `Ordine #${data.orderNumber} annullato`,
    html: baseLayout(`
      ${heading('Ordine annullato')}
      ${subheading(`${data.customerName}, il tuo ordine #${data.orderNumber} è stato annullato.`)}

      ${itemRows ? `
        ${sectionLabel('Prodotti annullati')}
        <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">${itemRows}</table>
      ` : ''}

      ${data.refundAmount ? `${infoBox(`
        ${sectionLabel('Rimborso')}
        <p style="margin:0;font-size:14px;color:#1a1a1a;">Il rimborso di <strong style="color:#005667;">${data.refundAmount} &euro;</strong> sar&agrave; accreditato entro 5-7 giorni lavorativi${data.paymentMethod ? ` sul metodo di pagamento usato (${data.paymentMethod})` : ''}.</p>
      `)}` : `${paragraph('Se il pagamento era gi&agrave; stato effettuato, il rimborso verr&agrave; elaborato entro 5-7 giorni lavorativi.')}`}

      ${paragraph('Hai bisogno di aiuto? Rispondi a questa email o scrivici su <a href="mailto:info@stappando.it" style="color:#005667;font-weight:600;">info@stappando.it</a>')}
      ${ctaButton('Contattaci', `${SITE}/contatti`)}
      ${secondaryButton('Continua a fare shopping', `${SITE}/cerca`)}
    `, `Ordine #${data.orderNumber} annullato`),
  };
}

/* ══════════════════════════════════════════════════════
   MAIL 6 — CLIENTE: Richiesta reso ricevuta
   ══════════════════════════════════════════════════════ */

export interface ReturnRequestData {
  customerName: string;
  orderNumber: string;
  items: { name: string; quantity: number; reason?: string }[];
  pickupMethod: string;
  pickupDate?: string;
  pickupTimeSlot?: string;
  pickupAddress?: string;
  refundEstimate: string;
}

export function returnRequestConfirmed(data: ReturnRequestData): { subject: string; html: string } {
  const itemRows = data.items.map(item => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #f0ece4;">
        <span style="font-size:13px;color:#333;">${item.name} <span style="color:#999;">x${item.quantity}</span></span>
        ${item.reason ? `<br><span style="font-size:11px;color:#888;">Motivo: ${item.reason}</span>` : ''}
      </td>
    </tr>
  `).join('');

  return {
    subject: `Richiesta reso #${data.orderNumber} ricevuta`,
    html: baseLayout(`
      ${heading('Reso ricevuto')}
      ${subheading(`${data.customerName}, abbiamo ricevuto la tua richiesta di reso per l'ordine #${data.orderNumber}.`)}

      ${sectionLabel('Prodotti in reso')}
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">${itemRows}</table>

      ${infoBox(`
        ${sectionLabel('Modalit&agrave; ritiro')}
        <p style="margin:0 0 4px;font-size:14px;color:#1a1a1a;font-weight:600;">${data.pickupMethod === 'domicilio' ? 'Ritiro a domicilio' : 'Spedizione tramite ufficio postale'}</p>
        ${data.pickupMethod === 'domicilio' && data.pickupDate ? `<p style="margin:0 0 2px;font-size:13px;color:#444;">Data: ${data.pickupDate}${data.pickupTimeSlot ? ` — ${data.pickupTimeSlot}` : ''}</p>` : ''}
        ${data.pickupAddress ? `<p style="margin:0;font-size:13px;color:#444;">Indirizzo: ${data.pickupAddress}</p>` : ''}
      `)}

      ${infoBox(`
        ${sectionLabel('Rimborso stimato')}
        <p style="margin:0;font-size:18px;color:#005667;font-weight:700;">${data.refundEstimate} &euro;</p>
        <p style="margin:4px 0 0;font-size:12px;color:#888;">Elaboreremo la richiesta entro 2-3 giorni lavorativi</p>
      `)}

      <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbe6;border-radius:8px;margin:16px 0;border:1px solid #f0e68c;">
        <tr><td style="padding:14px 20px;font-size:13px;color:#8a6d00;">
          <strong>Ricorda:</strong> imballa correttamente i prodotti nella confezione originale per garantire un reso rapido.
        </td></tr>
      </table>

      ${ctaButton('Vedi stato reso', `${SITE}/account`)}
    `, `Richiesta reso #${data.orderNumber} ricevuta`),
  };
}

/* ══════════════════════════════════════════════════════
   MAIL 7 — ADMIN: Richiesta reso
   ══════════════════════════════════════════════════════ */

export interface AdminReturnRequestData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  items: { name: string; quantity: number; reason?: string }[];
  pickupMethod: string;
  pickupDate?: string;
  pickupTimeSlot?: string;
  pickupAddress?: string;
  refundEstimate: string;
}

export function adminReturnRequest(data: AdminReturnRequestData): { subject: string; html: string } {
  const itemRows = data.items.map(item => `
    <tr>
      <td style="padding:6px 0;border-bottom:1px solid #f0ece4;font-size:13px;color:#333;">${item.name} x${item.quantity}</td>
      <td style="padding:6px 0;border-bottom:1px solid #f0ece4;font-size:12px;color:#888;">${item.reason || 'N/A'}</td>
    </tr>
  `).join('');

  return {
    subject: `↩️ Reso #${data.orderNumber} — ${data.customerName} — ${data.items.map(i => i.name).join(', ')}`,
    html: baseLayout(`
      ${heading(`Reso #${data.orderNumber}`)}

      ${infoBox(`
        ${sectionLabel('Cliente')}
        <p style="margin:0;font-size:14px;color:#1a1a1a;font-weight:600;">${data.customerName}</p>
        <p style="margin:4px 0 0;font-size:13px;color:#444;">${data.customerEmail}${data.customerPhone ? ` &middot; ${data.customerPhone}` : ''}</p>
      `)}

      ${sectionLabel('Prodotti da rendere')}
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
        <tr><td style="font-size:11px;color:#888;font-weight:600;padding:4px 0;">Prodotto</td><td style="font-size:11px;color:#888;font-weight:600;padding:4px 0;">Motivo</td></tr>
        ${itemRows}
      </table>

      ${infoBox(`
        ${sectionLabel('Ritiro')}
        <p style="margin:0 0 4px;font-size:13px;color:#444;"><strong>Modalit&agrave;:</strong> ${data.pickupMethod === 'domicilio' ? 'Ritiro a domicilio' : 'Ufficio postale'}</p>
        ${data.pickupMethod === 'domicilio' ? `
          ${data.pickupAddress ? `<p style="margin:0 0 2px;font-size:13px;color:#444;"><strong>Indirizzo:</strong> ${data.pickupAddress}</p>` : ''}
          ${data.pickupDate ? `<p style="margin:0;font-size:13px;color:#444;"><strong>Data:</strong> ${data.pickupDate}${data.pickupTimeSlot ? ` — ${data.pickupTimeSlot}` : ''}</p>` : ''}
        ` : ''}
      `)}

      ${infoBox(`
        ${sectionLabel('Rimborso stimato')}
        <p style="margin:0;font-size:18px;color:#005667;font-weight:700;">${data.refundEstimate} &euro;</p>
      `)}

      ${ctaButton('Gestisci reso su WooCommerce', `${WP_ADMIN}/post.php?post=${data.orderNumber}&action=edit`)}
    `, `Reso #${data.orderNumber} — ${data.customerName}`),
  };
}

/* ══════════════════════════════════════════════════════
   Template: Aggiornamento Punti POP
   ══════════════════════════════════════════════════════ */

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
        <tr><td style="padding:10px 0;font-size:14px;color:#444;"><strong style="color:#005667;">Selezionati da sommelier</strong> — Qualit&agrave; e territorio garantiti</td></tr>
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
      <tr><td style="padding:8px 0;font-size:13px;color:#666;"><strong style="color:#005667;">Selezionati da sommelier</strong> — Qualit&agrave; garantita</td></tr>
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
  isReminder?: boolean;
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
        ? `${data.customerName}, i prodotti nel tuo carrello hanno disponibilit&agrave; limitata. Non vorremmo che li perdessi.`
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
      ${infoBox(`
        <table cellpadding="0" cellspacing="0" width="100%"><tr>
          <td style="font-size:12px;color:#666;text-align:center;">
            Spedizione gratuita da 69€ &middot; Consegna 24-48h &middot; Pagamento 100% sicuro
          </td>
        </tr></table>
      `)}
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

/* ── Vendor Approved ─────────────────────────────────── */

export function vendorApproved(cantina: string): { subject: string; html: string } {
  return {
    subject: `Il tuo negozio su Stappando è attivo!`,
    html: baseLayout(`
      <div style="text-align:center;margin-bottom:28px;">
        <div style="width:72px;height:72px;border-radius:50%;background:#e8f4f1;display:inline-flex;align-items:center;justify-content:center;margin-bottom:20px;">
          <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="#005667" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
        </div>
        <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#1a1a1a;">${cantina}, il tuo negozio è live!</h1>
        <p style="margin:0 0 28px;font-size:15px;color:#666;line-height:1.6;">Il tuo profilo cantina è stato approvato.<br/>Da oggi puoi aggiungere i tuoi vini e iniziare a vendere su Stappando.</p>
        <a href="${SITE}/vendor/dashboard" style="display:inline-block;background:#005667;color:#fff;padding:16px 40px;border-radius:10px;text-decoration:none;font-weight:700;font-size:16px;">Accedi alla tua Dashboard</a>
      </div>

      <div style="background:#f8f6f1;border-radius:10px;padding:24px;margin-top:8px;">
        <p style="font-size:12px;color:#005667;font-weight:700;margin:0 0 14px;text-transform:uppercase;letter-spacing:0.05em;">I prossimi passi</p>
        <table cellpadding="0" cellspacing="0" width="100%">
          <tr><td style="vertical-align:top;width:36px;padding-bottom:14px;">
            <div style="width:28px;height:28px;border-radius:50%;background:#005667;color:#fff;text-align:center;line-height:28px;font-size:12px;font-weight:700;">1</div>
          </td><td style="padding-bottom:14px;">
            <p style="font-size:14px;color:#1a1a1a;margin:0;font-weight:600;">Completa il profilo cantina</p>
            <p style="font-size:12px;color:#888;margin:4px 0 0;">Aggiungi logo, descrizione e storia della tua cantina</p>
          </td></tr>
          <tr><td style="vertical-align:top;width:36px;padding-bottom:14px;">
            <div style="width:28px;height:28px;border-radius:50%;background:#005667;color:#fff;text-align:center;line-height:28px;font-size:12px;font-weight:700;">2</div>
          </td><td style="padding-bottom:14px;">
            <p style="font-size:14px;color:#1a1a1a;margin:0;font-weight:600;">Aggiungi i tuoi vini</p>
            <p style="font-size:12px;color:#888;margin:4px 0 0;">Carica foto, descrizioni e prezzi dei tuoi prodotti</p>
          </td></tr>
          <tr><td style="vertical-align:top;width:36px;">
            <div style="width:28px;height:28px;border-radius:50%;background:#005667;color:#fff;text-align:center;line-height:28px;font-size:12px;font-weight:700;">3</div>
          </td><td>
            <p style="font-size:14px;color:#1a1a1a;margin:0;font-weight:600;">Inizia a vendere</p>
            <p style="font-size:12px;color:#888;margin:4px 0 0;">I tuoi vini saranno visibili a migliaia di appassionati</p>
          </td></tr>
        </table>
      </div>
    `, `${cantina}, il tuo negozio su Stappando è attivo!`),
  };
}

/* ══════════════════════════════════════════════════════
   FIERE FOLLOW-UP SEQUENCE (emails 1–8)
   ══════════════════════════════════════════════════════ */

function fiereFollowUpLayout(content: string): string {
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

export function fiereFollowUp1(name: string): { subject: string; html: string } {
  return {
    subject: 'Una cosa che ci tenevo a dirvi',
    html: fiereFollowUpLayout(`
<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#333;">
Ciao <strong>${name}</strong>,
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
`),
  };
}

export function fiereFollowUp2(name: string): { subject: string; html: string } {
  return {
    subject: "L'enoturismo sta cambiando",
    html: fiereFollowUpLayout(`
<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#333;">
Ciao <strong>${name}</strong>,
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
`),
  };
}

export function fiereFollowUp3(name: string): { subject: string; html: string } {
  return {
    subject: 'Qualche numero su Stappando',
    html: fiereFollowUpLayout(`
<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#333;">
Ciao <strong>${name}</strong>,
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
`),
  };
}

export function fiereFollowUp4(name: string): { subject: string; html: string } {
  return {
    subject: 'Il problema delle bottiglie rotte',
    html: fiereFollowUpLayout(`
<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#333;">
Ciao <strong>${name}</strong>,
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
`),
  };
}

export function fiereFollowUp5(name: string): { subject: string; html: string } {
  return {
    subject: 'Come appare una cantina su Stappando',
    html: fiereFollowUpLayout(`
<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#333;">
Ciao <strong>${name}</strong>,
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
`),
  };
}

export function fiereFollowUp6(name: string): { subject: string; html: string } {
  return {
    subject: 'Estate e ricerche in crescita',
    html: fiereFollowUpLayout(`
<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#333;">
Ciao <strong>${name}</strong>,
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
`),
  };
}

export function fiereFollowUp7(name: string): { subject: string; html: string } {
  return {
    subject: 'Un riepilogo veloce',
    html: fiereFollowUpLayout(`
<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#333;">
Ciao <strong>${name}</strong>,
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
`),
  };
}

export function fiereFollowUp8(name: string): { subject: string; html: string } {
  return {
    subject: 'Vi auguro una splendida stagione',
    html: fiereFollowUpLayout(`
<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#333;">
Ciao <strong>${name}</strong>,
</p>
<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#333;">
&Egrave; un po&rsquo; che non ci sentiamo. Non voglio essere invadente.
</p>
<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#333;">
Se volete dare visibilit&agrave; gratuita ai vostri vini o alle esperienze in cantina, ci trovate qui.
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
`),
  };
}
