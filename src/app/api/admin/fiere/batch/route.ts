/**
 * POST /api/admin/fiere/batch
 *
 * Invia la presentazione email a un array di cantine in batch.
 * Per ogni cantina: controlla duplicati nel foglio, invia email, salva riga.
 * Rate limit: max 10 email/secondo (delay 100ms tra ogni invio).
 *
 * Body: {
 *   cantine: Array<{ azienda: string; email: string; regione?: string; provincia?: string; contatto?: string }>;
 *   conosciutoA?: string;
 *   contattatoDa?: string;
 * }
 *
 * Auth: x-admin-password header
 *
 * Response: { sent, duplicates, errors, details: Array<{ email, status: 'sent'|'duplicate'|'error', message?: string }> }
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/mail/mandrill';
import {
  getGSheetsToken,
  sheetsGet,
  sheetsAppend,
  FIERE_SPREADSHEET_ID,
  FIERE_SHEET_NAME,
} from '@/lib/google-sheets';

const ADMIN_PASSWORD = 'stappando2026';

const PDF_URLS = [
  { url: 'https://stappando.it/wp-content/uploads/2026/03/Presentazione-Vendi-su-stappando.it-Vendor.pdf', name: 'Presentazione Vendi su Stappando.pdf' },
  { url: 'https://stappando.it/wp-content/uploads/2026/03/Presentazione-Prenota-su-vineis.eu-Partner.pdf', name: 'Presentazione Ospita con Vineis.pdf' },
  { url: 'https://stappando.it/wp-content/uploads/2026/03/Presentazione-Spedisci-con-Anbrekabol-non-rompere-piu-le-scatole.pdf', name: 'Presentazione Spedisci con Anbrekabol.pdf' },
];

interface CantinaBatch {
  azienda: string;
  email: string;
  regione?: string;
  provincia?: string;
  contatto?: string;
}

interface BatchBody {
  cantine: CantinaBatch[];
  conosciutoA?: string;
  contattatoDa?: string;
}

interface DetailEntry {
  email: string;
  status: 'sent' | 'duplicate' | 'error';
  message?: string;
}

/**
 * Builds the opening paragraph based on what fields are filled.
 *   both filled  → "Ci siamo conosciuti a X, come da accordi presi con Y, ..."
 *   only contatto → "Come da accordi presi, invio una presentazione..."
 *   both empty   → cold intro ("Sono Roberto di stappando.it...")
 */
function buildOpeningParagraph(conosciutoA: string, contattatoDa: string): string {
  if (conosciutoA && contattatoDa) {
    return `Ci siamo conosciuti a <strong>${conosciutoA}</strong>, come da accordi presi con <strong>${contattatoDa}</strong>, invio una presentazione del nostro gruppo.`;
  }
  if (contattatoDa) {
    return `Come da accordi presi, invio una presentazione del nostro gruppo.`;
  }
  return `Sono Roberto di stappando.it, un gruppo che lavora nel mondo del vino. Vorrei capire se può nascere una collaborazione con voi. Chi siamo?`;
}

function buildBatchEmailHtml(
  cantina: CantinaBatch,
  conosciutoA: string,
  contattatoDa: string,
): string {
  const saluto = cantina.contatto || cantina.azienda || cantina.email;
  const openingParagraph = buildOpeningParagraph(conosciutoA, contattatoDa);
  const firma = contattatoDa || 'Roberto';
  return `<!DOCTYPE html>
<html lang="it">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Stappando</title></head>
<body style="margin:0;padding:0;background:#f5f3ee;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ee;">
<tr><td align="center" style="padding:32px 16px;">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e8e4dc;">

<!-- Header -->
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

<!-- Body -->
<tr><td style="padding:30px;">

<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#333;">
Gentile <strong>${saluto}</strong>,
</p>

<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#333;">
${openingParagraph}
</p>

<!-- Stappando -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border-left:4px solid #005667;padding-left:0;">
<tr><td style="padding:12px 16px;background:#f8f9fa;border-radius:0 6px 6px 0;">
<p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#005667;">\uD83C\uDF77 Stappando.it &mdash; Marketplace</p>
<p style="margin:0;font-size:14px;line-height:1.6;color:#444;">
Piattaforma per la vendita online di vini al pubblico.<br>
<strong>Iscrizione gratuita &ndash; Commissione 15%.</strong><br>
Quando l&rsquo;ordine &egrave; pagato arriva a voi la mail con la lettera di vettura, preparate il pacco e lo consegnate al corriere, il ritiro lo predisponiamo noi.
</p>
</td></tr>
</table>

<!-- Vineis -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border-left:4px solid #4a8c3f;padding-left:0;">
<tr><td style="padding:12px 16px;background:#f8f9fa;border-radius:0 6px 6px 0;">
<p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#4a8c3f;">\uD83C\uDF3F Vineis.eu &mdash; Esperienze in cantina</p>
<p style="margin:0;font-size:14px;line-height:1.6;color:#444;">
Portale dedicato a visite, tour ed esperienze in cantina.<br>
<strong>Iscrizione gratuita &ndash; Commissione 15%.</strong><br>
Inseriamo noi le esperienze per voi, gestiamo prenotazioni e parte tecnica. Voi accogliete i clienti che hanno prenotato.
</p>
</td></tr>
</table>

<!-- Anbrekabol -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border-left:4px solid #c0792a;padding-left:0;">
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

<p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#005667;">📎 Allegati</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
<tr><td style="padding:8px 12px;background:#f0f7f9;border-radius:6px;margin-bottom:6px;">
  <a href="https://stappando.it/wp-content/uploads/2026/03/Presentazione-Vendi-su-stappando.it-Vendor.pdf" style="color:#005667;font-size:13px;font-weight:600;text-decoration:none;">
    📄 Presentazione Vendi su Stappando.it
  </a>
</td></tr>
<tr><td style="height:4px;"></td></tr>
<tr><td style="padding:8px 12px;background:#f0f9f2;border-radius:6px;">
  <a href="https://stappando.it/wp-content/uploads/2026/03/Presentazione-Prenota-su-vineis.eu-Partner.pdf" style="color:#4a8c3f;font-size:13px;font-weight:600;text-decoration:none;">
    📄 Presentazione Ospita con Vineis
  </a>
</td></tr>
<tr><td style="height:4px;"></td></tr>
<tr><td style="padding:8px 12px;background:#fdf6ee;border-radius:6px;">
  <a href="https://stappando.it/wp-content/uploads/2026/03/Presentazione-Spedisci-con-Anbrekabol-non-rompere-piu-le-scatole.pdf" style="color:#c0792a;font-size:13px;font-weight:600;text-decoration:none;">
    📄 Presentazione Spedisci con Anbrekabol
  </a>
</td></tr>
</table>

<p style="margin:0;font-size:15px;line-height:1.6;color:#333;">
Un saluto,<br>
<strong>${firma}</strong><br>
<span style="color:#005667;font-weight:600;">Stappando</span>
</p>

</td></tr>

<!-- Footer -->
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

export async function POST(req: NextRequest) {
  // 1. Auth
  const pwd = req.headers.get('x-admin-password');
  if (pwd !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  // 2. Parse body
  let body: BatchBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON non valido' }, { status: 400 });
  }

  if (!Array.isArray(body.cantine) || body.cantine.length === 0) {
    return NextResponse.json({ error: 'cantine array obbligatorio e non vuoto' }, { status: 400 });
  }

  const conosciutoA = body.conosciutoA || '';
  const contattatoDa = body.contattatoDa || '';

  // 3. Get Google Sheets token
  const saJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!saJson) {
    return NextResponse.json({ error: 'Missing GOOGLE_SERVICE_ACCOUNT_JSON' }, { status: 500 });
  }
  let token: string;
  try {
    const serviceAccount = JSON.parse(saJson);
    token = await getGSheetsToken(serviceAccount);
  } catch (err) {
    return NextResponse.json({ error: `Google auth failed: ${err instanceof Error ? err.message : String(err)}` }, { status: 500 });
  }

  // 4. Read existing emails from column D (single read up front)
  const emailRows = await sheetsGet(token, FIERE_SPREADSHEET_ID, `${FIERE_SHEET_NAME}!D:D`);
  // Build mutable set of known emails (lowercase)
  const knownEmails = new Set<string>(
    emailRows.map((r) => (r[0] || '').trim().toLowerCase()).filter(Boolean),
  );

  // 5. Fetch PDFs once (reused for all emails)
  const attachments: { type: string; name: string; content: string }[] = [];
  await Promise.all(
    PDF_URLS.map(async (pdf) => {
      try {
        const res = await fetch(pdf.url);
        if (res.ok) {
          const buffer = await res.arrayBuffer();
          const base64 = Buffer.from(buffer).toString('base64');
          attachments.push({ type: 'application/pdf', name: pdf.name, content: base64 });
        }
      } catch { /* skip if not reachable */ }
    }),
  );

  // 6. Process each cantina
  let sent = 0;
  let duplicates = 0;
  let errors = 0;
  const details: DetailEntry[] = [];

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const dateStr = `${pad(now.getMonth() + 1)}/${pad(now.getDate())}/${now.getFullYear()}`;

  for (const cantina of body.cantine) {
    const email = (cantina.email || '').trim();

    // a. Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      details.push({ email: email || '(vuota)', status: 'error', message: 'Email non valida' });
      errors++;
      continue;
    }

    const emailLower = email.toLowerCase();

    // b. Duplicate check (case-insensitive)
    if (knownEmails.has(emailLower)) {
      details.push({ email, status: 'duplicate' });
      duplicates++;
      await new Promise<void>((r) => setTimeout(r, 100));
      continue;
    }

    // c. Send email
    try {
      const html = buildBatchEmailHtml(cantina, conosciutoA, contattatoDa);
      const recipientName = cantina.contatto || cantina.azienda || email;

      await sendEmail({
        to: [
          { email, name: recipientName, type: 'to' as const },
          { email: 'info@stappando.it', name: 'Stappando', type: 'bcc' as const },
        ],
        from_email: 'ordini@stappando.it',
        from_name: 'Stappando',
        subject: 'Presentazione Stappando, Vineis e Anbrekabol',
        html,
        tags: ['fiere', 'crm', 'batch'],
        ...(attachments.length > 0 ? { attachments } : {}),
      });

      // d. Build row and append to sheet
      const row = [
        (cantina.azienda || '').trim(),              // A: Azienda
        conosciutoA,                                  // B: Conosciuti a / Fonte
        contattatoDa,                                 // C: Contacting (Contattato da)
        email,                                        // D: Email
        '',                                           // E
        '',                                           // F
        '',                                           // G
        '',                                           // H
        (cantina.provincia || '').trim().toUpperCase(), // I: provincia
        (cantina.regione || '').trim(),               // J: regione
        (cantina.contatto || '').trim(),              // K: contatto
        '',                                           // L
        '',                                           // M
        '',                                           // N
        '',                                           // O
        '',                                           // P
        '',                                           // Q: shop online
        '',                                           // R: Closing
        '0',                                          // S: Presentazione
        dateStr,                                      // T: Ultimo contatto
        '',                                           // U: Duplicato
      ];
      await sheetsAppend(token, FIERE_SPREADSHEET_ID, `${FIERE_SHEET_NAME}!A:U`, [row]);

      // e. Add to local set for intra-batch dedup
      knownEmails.add(emailLower);

      details.push({ email, status: 'sent' });
      sent++;
      console.log(`[fiere-batch] Sent to ${email}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      details.push({ email, status: 'error', message });
      errors++;
      console.error(`[fiere-batch] Error for ${email}:`, err);
    }

    // f. Rate limit: max 10 email/sec
    await new Promise<void>((r) => setTimeout(r, 100));
  }

  return NextResponse.json({ sent, duplicates, errors, details });
}
