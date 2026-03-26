import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

function getMailchimpConfig() {
  const apiKey = process.env.MAILCHIMP_API_KEY;
  const listId = process.env.MAILCHIMP_LIST_ID;
  if (!apiKey || !listId) throw new Error('Missing Mailchimp config');
  const dc = apiKey.split('-').pop() || 'us21';
  return { apiKey, listId, baseUrl: `https://${dc}.api.mailchimp.com/3.0` };
}

export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get('email')?.toLowerCase().trim();
    if (!email) return NextResponse.json({ status: 'not_found', subscribed: false, tags: [] });

    const { apiKey, listId, baseUrl } = getMailchimpConfig();
    const hash = crypto.createHash('md5').update(email).digest('hex');

    const res = await fetch(`${baseUrl}/lists/${listId}/members/${hash}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      return NextResponse.json({ status: 'not_found', subscribed: false, tags: [] });
    }

    const data = await res.json();
    const tags = (data.tags || []).map((t: { name: string }) => t.name);

    return NextResponse.json({
      status: data.status,
      subscribed: data.status === 'subscribed',
      tags,
    });
  } catch {
    return NextResponse.json({ status: 'not_found', subscribed: false, tags: [] });
  }
}

/** PATCH to subscribe/unsubscribe or update tags */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body?.email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

    const email = body.email.toLowerCase().trim();
    const { apiKey, listId, baseUrl } = getMailchimpConfig();
    const hash = crypto.createHash('md5').update(email).digest('hex');

    // Update subscription status
    if (body.status) {
      await fetch(`${baseUrl}/lists/${listId}/members/${hash}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: body.status }),
      });
    }

    // Update tags
    if (body.tags && Array.isArray(body.tags)) {
      await fetch(`${baseUrl}/lists/${listId}/members/${hash}/tags`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: body.tags }),
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Mailchimp PATCH error:', err);
    return NextResponse.json({ error: 'Errore server' }, { status: 500 });
  }
}
