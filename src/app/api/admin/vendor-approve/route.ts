import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';
import { sendEmail } from '@/lib/mail/mandrill';
import { vendorApproved } from '@/lib/mail/templates';

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

    // Send celebration email using shared template
    const emailTemplate = vendorApproved(cantina);
    await sendEmail({
      to: [{ email, name: cantina }],
      subject: emailTemplate.subject,
      html: emailTemplate.html,
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
