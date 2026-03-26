import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';
import { sendEmail } from '@/lib/mail/mandrill';

/**
 * Admin endpoint: approve a vendor and send celebration email.
 * POST /api/admin/vendor-approve
 * Body: { vendorId: number, password: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ message: 'Body non valido' }, { status: 400 });

    const adminPw = process.env.ADMIN_PASSWORD;
    if (!adminPw || body.password !== adminPw) {
      return NextResponse.json({ message: 'Non autorizzato' }, { status: 401 });
    }

    const vendorId = body.vendorId;
    if (!vendorId) return NextResponse.json({ message: 'vendorId obbligatorio' }, { status: 400 });

    const wc = getWCSecrets();
    const auth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;

    // Fetch vendor data
    const custRes = await fetch(`${wc.baseUrl}/wp-json/wc/v3/customers/${vendorId}?${auth}`);
    if (!custRes.ok) return NextResponse.json({ message: 'Vendor non trovato' }, { status: 404 });
    const customer = await custRes.json();

    const email = customer.email;
    const name = customer.first_name || email.split('@')[0];
    const cantina = customer.meta_data?.find((m: { key: string }) => m.key === '_vendor_cantina')?.value || name;

    // Update meta to approved
    await fetch(`${wc.baseUrl}/wp-json/wc/v3/customers/${vendorId}?${auth}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        meta_data: [
          { key: '_vendor_status', value: 'approved' },
          { key: '_vendor_approved_at', value: new Date().toISOString() },
        ],
      }),
    });

    // Send celebration email
    await sendEmail({
      to: [{ email, name: cantina }],
      subject: `Il tuo negozio su Stappando è attivo!`,
      html: `
        <div style="font-family:system-ui,-apple-system,sans-serif;max-width:600px;margin:0 auto;background:#fff;">
          <div style="background:#005667;padding:32px 28px;text-align:center;">
            <img src="https://stappando.it/wp-content/uploads/2021/01/logo-stappando.png" alt="Stappando" style="height:32px;filter:brightness(0) invert(1);margin-bottom:16px;" />
            <h1 style="font-size:28px;color:#fff;margin:0;font-weight:700;">Benvenuto nella famiglia!</h1>
          </div>

          <div style="padding:32px 28px;text-align:center;">
            <div style="width:72px;height:72px;border-radius:50%;background:#e8f4f1;display:inline-flex;align-items:center;justify-content:center;margin-bottom:20px;">
              <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="#005667" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
            </div>

            <h2 style="font-size:22px;color:#1a1a1a;margin:0 0 12px;font-weight:700;">
              ${cantina}, il tuo negozio è live!
            </h2>

            <p style="font-size:16px;color:#666;line-height:1.6;margin:0 0 28px;">
              Il tuo profilo cantina è stato approvato.<br/>
              Da oggi puoi aggiungere i tuoi vini e iniziare a vendere su Stappando.
            </p>

            <a href="https://stappando-web.vercel.app/vendor/dashboard" style="display:inline-block;background:#005667;color:#fff;padding:16px 40px;border-radius:10px;text-decoration:none;font-weight:700;font-size:16px;margin-bottom:24px;">
              Accedi alla tua Dashboard
            </a>

            <div style="background:#f8f6f1;border-radius:12px;padding:24px;margin-top:28px;text-align:left;">
              <p style="font-size:13px;color:#005667;font-weight:700;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.05em;">I prossimi passi</p>

              <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:12px;">
                <div style="width:28px;height:28px;border-radius:50%;background:#005667;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;">1</div>
                <div>
                  <p style="font-size:14px;color:#1a1a1a;margin:0;font-weight:600;">Completa il profilo cantina</p>
                  <p style="font-size:12px;color:#888;margin:4px 0 0;">Aggiungi logo, descrizione e storia della tua cantina</p>
                </div>
              </div>

              <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:12px;">
                <div style="width:28px;height:28px;border-radius:50%;background:#005667;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;">2</div>
                <div>
                  <p style="font-size:14px;color:#1a1a1a;margin:0;font-weight:600;">Aggiungi i tuoi vini</p>
                  <p style="font-size:12px;color:#888;margin:4px 0 0;">Carica foto, descrizioni e prezzi dei tuoi prodotti</p>
                </div>
              </div>

              <div style="display:flex;align-items:flex-start;gap:12px;">
                <div style="width:28px;height:28px;border-radius:50%;background:#005667;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;">3</div>
                <div>
                  <p style="font-size:14px;color:#1a1a1a;margin:0;font-weight:600;">Inizia a vendere</p>
                  <p style="font-size:12px;color:#888;margin:4px 0 0;">I tuoi vini saranno visibili a migliaia di appassionati</p>
                </div>
              </div>
            </div>

            <div style="margin-top:28px;padding-top:20px;border-top:1px solid #e8e4dc;">
              <p style="font-size:13px;color:#888;margin:0;">
                Hai bisogno di aiuto? Scrivici a
                <a href="mailto:assistenza@stappando.it" style="color:#005667;font-weight:600;">assistenza@stappando.it</a>
              </p>
            </div>
          </div>
        </div>`,
      from_email: 'noreply@stappando.it',
      from_name: 'Stappando',
      tags: ['vendor-approved'],
    });

    console.log(`Vendor approved: ${cantina} (${email}) — ID ${vendorId}`);
    return NextResponse.json({ success: true, email, cantina });
  } catch (err) {
    console.error('Vendor approve error:', err);
    return NextResponse.json({ message: 'Errore del server' }, { status: 500 });
  }
}
