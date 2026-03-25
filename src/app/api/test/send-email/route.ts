import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/mail/mandrill';
import { welcomeTemplate } from '@/lib/mail/templates';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // Auth
  const pwd = req.headers.get('x-admin-password');
  if (!pwd || pwd !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const email = body?.email;
  const name = body?.name || 'Cliente';

  if (!email) {
    return NextResponse.json({ error: 'Email richiesta' }, { status: 400 });
  }

  try {
    const html = welcomeTemplate(name, 'BENVENUTO-ROBERTO-TEST', '24 aprile 2026');
    const result = await sendEmail({
      to: [{ email, name }],
      subject: `Test — Benvenuto ${name}! Ecco il tuo sconto del 5%`,
      html,
      tags: ['test', 'welcome-coupon'],
    });

    return NextResponse.json({ success: true, result });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
