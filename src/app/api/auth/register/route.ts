import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';
import { isValidEmail, isNonEmptyString, sanitize } from '@/lib/validation';
import { subscribeToMailchimp } from '@/lib/mail/mailchimp';

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

    // Subscribe to Mailchimp ONLY if user explicitly opted in (GDPR)
    if (newsletter) {
      // Fire and forget — don't block registration if Mailchimp fails
      subscribeToMailchimp({
        email,
        firstName,
        lastName,
        tags: ['registrazione-web'],
      }).catch((err) => console.error('Mailchimp subscribe after register failed:', err));
    }

    return NextResponse.json({ success: true, customerId: data.id });
  } catch {
    return NextResponse.json({ message: 'Errore del server' }, { status: 500 });
  }
}
