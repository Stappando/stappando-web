import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';
import { isValidEmail, isNonEmptyString, sanitize } from '@/lib/validation';
import { sendEmail } from '@/lib/mail/mandrill';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ message: 'Body non valido' }, { status: 400 });

    const email = sanitize(body.email, 254);
    const password = sanitize(body.password, 128);
    const firstName = sanitize(body.firstName || '', 100);
    const lastName = sanitize(body.lastName || '', 100);
    const cantina = sanitize(body.cantina || firstName || '', 200);
    const regione = sanitize(body.regione || '', 100);
    const piva = sanitize(body.piva || '', 20);
    const telefono = sanitize(body.telefono || '', 30);
    const sito = sanitize(body.sito || '', 300);

    if (!isValidEmail(email)) return NextResponse.json({ message: 'Email non valida' }, { status: 400 });
    if (!isNonEmptyString(password) || password.length < 6) return NextResponse.json({ message: 'Password minimo 6 caratteri' }, { status: 400 });

    const wc = getWCSecrets();
    const auth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;

    // Create WC customer with vendor role
    const res = await fetch(`${wc.baseUrl}/wp-json/wc/v3/customers?${auth}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        first_name: firstName || cantina,
        last_name: lastName || '',
        username: email,
        meta_data: [
          { key: '_is_vendor', value: 'true' },
          { key: '_vendor_cantina', value: cantina },
          { key: '_vendor_regione', value: regione },
          { key: '_vendor_piva', value: piva },
          { key: '_vendor_telefono', value: telefono },
          { key: '_vendor_sito', value: sito },
          { key: '_vendor_status', value: 'pending_contract' },
          { key: '_vendor_registered_at', value: new Date().toISOString() },
          { key: '_vendor_profile_json', value: JSON.stringify({ cantina, regione, piva, telefono: telefono }) },
          { key: '_vendor_shop_logo', value: '' },
          { key: '_vendor_shop_banner', value: '' },
          { key: '_vendor_shop_descrizione', value: '' },
        ],
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ message: data.message || 'Errore registrazione' }, { status: res.status });
    }

    // Send welcome email to vendor
    sendEmail({
      to: [{ email, name: cantina }],
      subject: `Benvenuto su Stappando, ${cantina}!`,
      html: `
        <div style="font-family:system-ui,-apple-system,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#fff;padding:32px 28px;text-align:center;">
            <img src="https://stappando.it/wp-content/uploads/2021/01/logo-stappando.png" alt="Stappando" style="height:32px;margin-bottom:24px;" />
            <h1 style="font-size:24px;color:#1a1a1a;margin:0 0 12px;">Benvenuto ${cantina}!</h1>
            <p style="font-size:15px;color:#666;line-height:1.6;margin:0 0 24px;">
              Il tuo account cantina su Stappando è stato creato.<br/>
              Per completare la registrazione, firma il contratto di adesione.
            </p>
            <a href="https://stappando-web.vercel.app/vendor/contratto" style="display:inline-block;background:#005667;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">
              Firma il contratto →
            </a>
          </div>
        </div>`,
      from_email: 'noreply@stappando.it',
      from_name: 'Stappando',
      tags: ['vendor-welcome'],
    }).catch(err => console.error('Vendor welcome email failed:', err));

    // Notify Stappando admin
    sendEmail({
      to: [{ email: 'assistenza@stappando.it', name: 'Stappando' }],
      subject: `Nuova cantina registrata: ${cantina}`,
      html: `<p>Nuova registrazione vendor:</p><ul><li>Cantina: ${cantina}</li><li>Email: ${email}</li><li>Regione: ${regione}</li><li>P.IVA: ${piva}</li><li>Tel: ${telefono}</li></ul>`,
      tags: ['vendor-new-registration'],
    }).catch(() => {});

    console.log(`Vendor registered: ${cantina} (${email})`);
    return NextResponse.json({ success: true, vendorId: data.id });
  } catch (err) {
    console.error('Vendor register error:', err);
    return NextResponse.json({ message: 'Errore del server' }, { status: 500 });
  }
}
