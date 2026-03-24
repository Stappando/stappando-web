import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';
import { isValidEmail, isNonEmptyString, sanitize } from '@/lib/validation';
import { subscribeToMailchimp } from '@/lib/mail/mailchimp';
import { generateCoupon } from '@/lib/coupons/generate';
import { sendEmail } from '@/lib/mail/mandrill';
import { welcomeTemplate } from '@/lib/mail/templates';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ message: 'Body JSON non valido' }, { status: 400 });
    }

    const email = sanitize(body.email, 254);
    const password = sanitize(body.password, 128);
    const firstName = sanitize(body.firstName, 100);
    const lastName = sanitize(body.lastName, 100);
    const newsletter = body.newsletter === true; // Explicit opt-in only (GDPR)

    if (!isValidEmail(email)) {
      return NextResponse.json({ message: 'Email non valida' }, { status: 400 });
    }
    if (!isNonEmptyString(password) || password.length < 6) {
      return NextResponse.json({ message: 'Password deve avere almeno 6 caratteri' }, { status: 400 });
    }

    const wc = getWCSecrets();
    const url = `${wc.baseUrl}/wp-json/wc/v3/customers?consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        username: email,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { message: data.message || 'Errore durante la registrazione' },
        { status: res.status },
      );
    }

    const customerId = data.id;

    // Fire-and-forget: coupon + mail + newsletter (don't block response)
    (async () => {
      try {
        // 1. Generate welcome coupon
        const coupon = await generateCoupon({
          type: 'welcome',
          firstName,
          email,
          customerId,
        });

        // 2. Send welcome email with coupon
        const expiresDate = new Date(coupon.expires).toLocaleDateString('it-IT', {
          day: 'numeric', month: 'long', year: 'numeric',
        });

        await sendEmail({
          to: [{ email, name: firstName }],
          subject: `Benvenuto ${firstName}! Ecco il tuo sconto del 5%`,
          html: welcomeTemplate(firstName, coupon.code, expiresDate),
        });

        console.log(`Welcome coupon ${coupon.code} sent to ${email}`);
      } catch (err) {
        console.error('Welcome coupon/mail failed:', err);
      }

      // 3. Mailchimp (GDPR)
      if (newsletter) {
        subscribeToMailchimp({
          email,
          firstName,
          lastName,
          tags: ['registrazione-web'],
        }).catch((err) => console.error('Mailchimp subscribe failed:', err));
      }
    })();

    return NextResponse.json({ success: true, customerId });
  } catch {
    return NextResponse.json({ message: 'Errore del server' }, { status: 500 });
  }
}
