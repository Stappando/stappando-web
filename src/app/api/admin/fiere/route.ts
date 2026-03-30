import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/mail/mandrill';

/* ── Config ────────────────────────────────────────────── */

const ADMIN_PASSWORD = 'stappando2026';
const SPREADSHEET_ID = '1sjxo95pOQz76jizopNgjMiHc3A0u1mnhbROuTxAQ948';
const SHEET_NAME = 'Foglio1';
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

/* ── Types ─────────────────────────────────────────────── */

interface FiereBody {
  nome: string;
  cognome: string;
  email: string;
  telefono: string;
  azienda: string;
  indirizzo: string;
  cap: string;
  citta: string;
  provincia: string;
  regione: string;
  partitaIva: string;
  conosciutoA: string;
  contattatoDa: string;
  note: string;
}

/* ── Google Sheets JWT Auth (no SDK) ───────────────────── */

function base64url(input: string): string {
  return btoa(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function createJWT(serviceAccount: { client_email: string; private_key: string }): Promise<string> {
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const claim = base64url(
    JSON.stringify({
      iss: serviceAccount.client_email,
      scope: SCOPES.join(' '),
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    }),
  );
  const unsignedToken = `${header}.${claim}`;

  // Import PEM private key for signing
  const pemBody = serviceAccount.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');
  const binaryKey = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(unsignedToken),
  );

  const sigBytes = new Uint8Array(signature);
  let sigStr = '';
  for (let i = 0; i < sigBytes.length; i++) {
    sigStr += String.fromCharCode(sigBytes[i]);
  }
  const sig = base64url(sigStr);
  return `${unsignedToken}.${sig}`;
}

async function getAccessToken(serviceAccount: { client_email: string; private_key: string }): Promise<string> {
  const jwt = await createJWT(serviceAccount);
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google OAuth failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.access_token;
}

/* ── Google Sheets helpers ─────────────────────────────── */

async function sheetsGet(accessToken: string, range: string): Promise<string[][]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sheets GET failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  return (data.values as string[][] | undefined) || [];
}

async function sheetsAppend(accessToken: string, range: string, values: string[][]): Promise<void> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sheets APPEND failed: ${res.status} ${text}`);
  }
}

/* ── Email HTML builder ────────────────────────────────── */

function buildEmailHtml(body: FiereBody): string {
  return `<!DOCTYPE html>
<html lang="it">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Stappando</title></head>
<body style="margin:0;padding:0;background:#f5f3ee;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ee;">
<tr><td align="center" style="padding:32px 16px;">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e8e4dc;">

<!-- Header — logo + stelline -->
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
Gentile <strong>${body.nome} ${body.cognome}</strong>,
</p>

<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#333;">
Ci siamo conosciuti a <strong>${body.conosciutoA}</strong>, come da accordi presi con <strong>${body.contattatoDa}</strong>, invio una presentazione del nostro gruppo.
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
  <a href="https://stappando.it/wp-content/uploads/2026/03/Presentazione-Ospita-con-Vineis.pdf" style="color:#4a8c3f;font-size:13px;font-weight:600;text-decoration:none;">
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
<strong>${body.contattatoDa}</strong><br>
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

/* ── POST handler ──────────────────────────────────────── */

export async function POST(req: NextRequest) {
  // Auth check
  const pwd = req.headers.get('x-admin-password');
  if (pwd !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  let body: FiereBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON non valido' }, { status: 400 });
  }

  // Only email is required
  if (!body.email?.trim()) {
    return NextResponse.json({ error: 'Email obbligatoria' }, { status: 400 });
  }

  // Basic email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return NextResponse.json({ error: 'Email non valida' }, { status: 400 });
  }

  try {
    // 1. Fetch PDF attachments in parallel
    const pdfUrls = [
      { url: 'https://stappando.it/wp-content/uploads/2026/03/Presentazione-Vendi-su-stappando.it-Vendor.pdf', name: 'Presentazione Vendi su Stappando.pdf' },
      { url: 'https://stappando.it/wp-content/uploads/2026/03/Presentazione-Ospita-con-Vineis.pdf', name: 'Presentazione Ospita con Vineis.pdf' },
      { url: 'https://stappando.it/wp-content/uploads/2026/03/Presentazione-Spedisci-con-Anbrekabol-non-rompere-piu-le-scatole.pdf', name: 'Presentazione Spedisci con Anbrekabol.pdf' },
    ];

    const attachments: { type: string; name: string; content: string }[] = [];
    await Promise.all(pdfUrls.map(async (pdf) => {
      try {
        const res = await fetch(pdf.url);
        if (res.ok) {
          const buffer = await res.arrayBuffer();
          const base64 = Buffer.from(buffer).toString('base64');
          attachments.push({ type: 'application/pdf', name: pdf.name, content: base64 });
        }
      } catch { /* skip if PDF not reachable */ }
    }));

    // 2. Send email via Mandrill with attachments
    await sendEmail({
      to: [{ email: body.email, name: `${body.nome} ${body.cognome}` }, { email: 'info@stappando.it', name: 'Stappando', type: 'bcc' }],
      from_email: 'info@stappando.it',
      from_name: 'Stappando',
      subject: 'Presentazione Stappando, Vineis e Anbrekabol',
      html: buildEmailHtml(body),
      tags: ['fiere', 'crm'],
      ...(attachments.length > 0 ? { attachments } : {}),
    });

    // 2. Save to Google Sheets
    const saJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (!saJson) {
      throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_JSON env var');
    }
    const serviceAccount = JSON.parse(saJson);
    const accessToken = await getAccessToken(serviceAccount);

    // Check for duplicate email (column E)
    const existingRows = await sheetsGet(accessToken, `${SHEET_NAME}!E:E`);
    const emailLower = body.email.trim().toLowerCase();
    const isDuplicate = existingRows.some(
      (row) => row[0] && row[0].trim().toLowerCase() === emailLower,
    );

    // Format date DD/MM/YYYY HH:MM
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const dateStr = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

    // Map to spreadsheet columns:
    // A: FOLLOW | B: Azienda | C: Conosciuti a / Fonte | D: Contacting
    // E: Email | F: Sitoweb | G: Indirizzo | H: cap | I: città | J: provincia
    // K: regione | L: contatto | M: Telefono | N: P.Iva | O: CODICE FISCALE
    // P: CODICE UNIVOCO | Q: Annotazioni | R: shop on line | S: Closing
    // T: Ultimo contatto | U: Messaggio Direct | V: Iscrizione | W: Mail
    // X: Contratti firmati | Y: Campioni ricevuti | Z: Scatole spedite
    // AA: Schede pubblicate | AB: Altro
    const row = [
      isDuplicate ? 'DUPLICATO ⚠️' : '',           // A: FOLLOW
      body.azienda.trim(),                           // B: Azienda
      body.conosciutoA.trim(),                       // C: Conosciuti a / Fonte
      body.contattatoDa.trim(),                      // D: Contacting
      body.email.trim(),                             // E: Email
      '',                                            // F: Sitoweb
      body.indirizzo.trim(),                         // G: Indirizzo
      body.cap.trim(),                               // H: cap
      body.citta.trim(),                             // I: città
      body.provincia.trim().toUpperCase(),            // J: provincia
      body.regione,                                  // K: regione
      `${body.nome.trim()} ${body.cognome.trim()}`,  // L: contatto
      body.telefono.trim(),                          // M: Telefono
      body.partitaIva.trim(),                        // N: P.Iva
      '',                                            // O: CODICE FISCALE
      '',                                            // P: CODICE UNIVOCO
      body.note.trim(),                              // Q: Annotazioni
      '',                                            // R: shop on line
      '',                                            // S: Closing
      dateStr,                                       // T: Ultimo contatto
      '',                                            // U: Messaggio Direct
      '',                                            // V: Iscrizione
      'Inviata da CRM Fiere',                        // W: Mail
    ];

    await sheetsAppend(accessToken, `${SHEET_NAME}!A:W`, [row]);

    return NextResponse.json({ success: true, duplicate: isDuplicate });
  } catch (err) {
    console.error('Fiere API error:', err);
    const message = err instanceof Error ? err.message : 'Errore interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
