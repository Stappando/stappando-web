import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';
import { sanitize } from '@/lib/validation';
import { sendEmail } from '@/lib/mail/mandrill';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ message: 'Body non valido' }, { status: 400 });

    const vendorId = body.vendorId;
    const cantina = sanitize(body.cantina || '', 200);
    const rappresentante = sanitize(body.rappresentante || '', 200);
    const piva = sanitize(body.piva || '', 20);
    const indirizzo = sanitize(body.indirizzo || '', 500);
    const email = sanitize(body.email || '', 254);
    const telefono = sanitize(body.telefono || '', 30);
    const firma = sanitize(body.firma || '', 200); // Text signature
    const firmaData = body.firmaData || ''; // Base64 canvas signature
    const dataFirma = new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });

    if (!vendorId || !email || !firma) {
      return NextResponse.json({ message: 'Dati mancanti' }, { status: 400 });
    }

    const wc = getWCSecrets();
    const auth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;

    // Update vendor status to pending_approval
    await fetch(`${wc.baseUrl}/wp-json/wc/v3/customers/${vendorId}?${auth}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        meta_data: [
          { key: '_vendor_status', value: 'pending_approval' },
          { key: '_vendor_contract_signed', value: 'true' },
          { key: '_vendor_contract_date', value: new Date().toISOString() },
          { key: '_vendor_rappresentante', value: rappresentante },
          { key: '_vendor_indirizzo', value: indirizzo },
        ],
      }),
    });

    // Build contract email HTML
    const contractHtml = `
      <div style="font-family:system-ui,-apple-system,sans-serif;max-width:700px;margin:0 auto;background:#fff;">
        <div style="background:#005667;padding:24px 28px;text-align:center;">
          <img src="https://stappando.it/wp-content/uploads/2021/01/logo-stappando.png" alt="Stappando" style="height:28px;filter:brightness(0) invert(1);" />
        </div>
        <div style="padding:28px;">
          <h1 style="font-size:20px;color:#1a1a1a;margin:0 0 8px;">Contratto di Adesione Firmato</h1>
          <p style="font-size:13px;color:#888;margin:0 0 24px;">Data firma: ${dataFirma}</p>

          <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px;">
            <tr><td style="padding:8px 0;color:#888;width:140px;">Cantina</td><td style="padding:8px 0;font-weight:600;">${cantina}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Rappresentante</td><td style="padding:8px 0;font-weight:600;">${rappresentante}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">P.IVA</td><td style="padding:8px 0;font-weight:600;">${piva}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Indirizzo</td><td style="padding:8px 0;">${indirizzo}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Email</td><td style="padding:8px 0;">${email}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Telefono</td><td style="padding:8px 0;">${telefono}</td></tr>
          </table>

          <div style="border-top:1px solid #e8e4dc;padding-top:20px;margin-top:20px;">
            <p style="font-size:12px;color:#888;margin:0 0 8px;">Firma digitale:</p>
            ${firmaData
              ? `<img src="${firmaData}" alt="Firma" style="max-width:300px;height:80px;object-fit:contain;" />`
              : `<p style="font-size:18px;font-style:italic;color:#1a1a1a;font-family:cursive;">${firma}</p>`
            }
            <p style="font-size:11px;color:#888;margin-top:8px;">Firmato da: ${rappresentante} — ${dataFirma}</p>
          </div>

          <div style="background:#f8f6f1;border-radius:8px;padding:16px;margin-top:24px;">
            <p style="font-size:12px;color:#005667;font-weight:600;margin:0 0 4px;">Prossimi passi</p>
            <p style="font-size:12px;color:#666;margin:0;">Il team Stappando verificherà i dati e attiverà il negozio entro 24-48 ore lavorative.</p>
          </div>
        </div>
      </div>`;

    // Send to Stappando admin
    await sendEmail({
      to: [
        { email: 'maria@stappando.it', name: 'Maria Stappando' },
        { email: 'info@stappando.it', name: 'Stappando' },
      ],
      subject: `Contratto firmato: ${cantina} — ${rappresentante}`,
      html: contractHtml,
      from_email: 'noreply@stappando.it',
      from_name: 'Stappando Vendor System',
      tags: ['vendor-contract'],
    });

    // Send copy to vendor
    await sendEmail({
      to: [{ email, name: cantina }],
      subject: `Copia del tuo contratto di adesione — Stappando`,
      html: contractHtml + `
        <div style="padding:0 28px 28px;font-family:system-ui,-apple-system,sans-serif;max-width:700px;margin:0 auto;">
          <p style="font-size:13px;color:#888;margin-top:16px;">
            Questa è una copia del contratto che hai firmato. Conservala per i tuoi archivi.<br/>
            Per qualsiasi domanda: <a href="mailto:assistenza@stappando.it" style="color:#005667;">assistenza@stappando.it</a>
          </p>
        </div>`,
      from_email: 'noreply@stappando.it',
      from_name: 'Stappando',
      tags: ['vendor-contract-copy'],
    });

    console.log(`Vendor contract signed: ${cantina} (${email})`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Vendor contract submit error:', err);
    return NextResponse.json({ message: 'Errore del server' }, { status: 500 });
  }
}
