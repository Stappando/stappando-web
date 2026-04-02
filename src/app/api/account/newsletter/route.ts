import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function getMailchimpConfig() {
  const apiKey = process.env.MAILCHIMP_API_KEY;
  const listId = process.env.MAILCHIMP_LIST_ID;
  if (!apiKey || !listId) throw new Error('Missing Mailchimp config');
  const dc = apiKey.split('-').pop() || 'us21';
  return { apiKey, listId, baseUrl: `https://${dc}.api.mailchimp.com/3.0` };
}

function md5(email: string) {
  return crypto.createHash('md5').update(email.toLowerCase().trim()).digest('hex');
}

/**
 * GET /api/account/newsletter?email=...
 * Returns the current newsletter subscription status for the given email.
 */
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')?.toLowerCase().trim();
  if (!email) {
    return NextResponse.json({ subscribed: false });
  }

  try {
    const { apiKey, listId, baseUrl } = getMailchimpConfig();
    const res = await fetch(`${baseUrl}/lists/${listId}/members/${md5(email)}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      return NextResponse.json({ subscribed: false });
    }

    const data = await res.json();
    return NextResponse.json({ subscribed: data.status === 'subscribed' });
  } catch (err) {
    console.error('Newsletter GET error:', err);
    return NextResponse.json({ subscribed: false });
  }
}

/**
 * PUT /api/account/newsletter
 * Body: { email: string; subscribe: boolean; firstName?: string; lastName?: string }
 * Subscribes or unsubscribes the user from the newsletter.
 */
export async function PUT(req: NextRequest) {
  let body: { email?: string; subscribe?: boolean; firstName?: string; lastName?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON non valido' }, { status: 400 });
  }

  const email = body.email?.toLowerCase().trim();
  if (!email) {
    return NextResponse.json({ error: 'Email obbligatoria' }, { status: 400 });
  }

  try {
    const { apiKey, listId, baseUrl } = getMailchimpConfig();
    const hash = md5(email);
    const memberUrl = `${baseUrl}/lists/${listId}/members/${hash}`;

    if (body.subscribe) {
      // PUT upserts — creates or re-subscribes the member
      const res = await fetch(memberUrl, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email_address: email,
          status_if_new: 'subscribed',
          status: 'subscribed',
          merge_fields: {
            FNAME: body.firstName || '',
            LNAME: body.lastName || '',
          },
          tags: ['account-preferenze'],
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error('Mailchimp subscribe error:', err);
        return NextResponse.json({ error: err.title || 'Errore iscrizione' }, { status: 502 });
      }

      return NextResponse.json({ subscribed: true });
    } else {
      // PATCH to set status = unsubscribed
      const res = await fetch(memberUrl, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'unsubscribed' }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error('Mailchimp unsubscribe error:', err);
        return NextResponse.json({ error: err.title || 'Errore disiscrizione' }, { status: 502 });
      }

      return NextResponse.json({ subscribed: false });
    }
  } catch (err) {
    console.error('Newsletter PUT error:', err);
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 });
  }
}
