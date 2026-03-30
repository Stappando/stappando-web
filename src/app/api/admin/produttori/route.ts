import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';

export async function POST(req: NextRequest) {
  let body: { action: string; name?: string; description?: string; region?: string; termId?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON non valido' }, { status: 400 });
  }

  const wc = getWCSecrets();
  const auth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;

  // Find the pa_produttore attribute ID
  const PRODUTTORE_ATTR_ID = 10; // pa_produttore attribute ID in WC

  if (body.action === 'create') {
    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Nome obbligatorio' }, { status: 400 });
    }

    try {
      // Create term via WC REST API
      const res = await fetch(`${wc.baseUrl}/wp-json/wc/v3/products/attributes/${PRODUTTORE_ATTR_ID}/terms?${auth}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: body.name.trim(),
          description: body.description?.trim() || '',
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error('WC create term error:', res.status, err);
        if (err.includes('term_exists')) {
          return NextResponse.json({ error: 'Produttore già esistente' }, { status: 400 });
        }
        throw new Error(`WC error: ${res.status}`);
      }

      const term = await res.json();

      // Set region via WP REST API if provided
      if (body.region) {
        try {
          const wpUser = process.env.WP_USER;
          const wpPass = process.env.WP_APP_PASSWORD;
          if (wpUser && wpPass) {
            await fetch(`${wc.baseUrl}/wp-json/wp/v2/pa_produttore/${term.id}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${Buffer.from(`${wpUser}:${wpPass}`).toString('base64')}`,
              },
              body: JSON.stringify({ meta: { _producer_region: body.region } }),
            });
          }
        } catch { /* region is optional */ }
      }

      // Invalidate cache
      try {
        await fetch(`${wc.baseUrl}/wp-json/stp-app/v1/producer-logos?purge=1`);
      } catch { /* */ }

      return NextResponse.json({ success: true, termId: term.id, name: term.name });
    } catch (err) {
      console.error('Create producer error:', err);
      return NextResponse.json({ error: err instanceof Error ? err.message : 'Errore interno' }, { status: 500 });
    }
  }

  if (body.action === 'update') {
    if (!body.termId) {
      return NextResponse.json({ error: 'termId obbligatorio' }, { status: 400 });
    }

    try {
      // Update description via WC REST API
      if (body.description !== undefined) {
        await fetch(`${wc.baseUrl}/wp-json/wc/v3/products/attributes/${PRODUTTORE_ATTR_ID}/terms/${body.termId}?${auth}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description: body.description.trim() }),
        });
      }

      // Update region via WP REST API
      if (body.region !== undefined) {
        try {
          const wpUser = process.env.WP_USER;
          const wpPass = process.env.WP_APP_PASSWORD;
          if (wpUser && wpPass) {
            await fetch(`${wc.baseUrl}/wp-json/wp/v2/pa_produttore/${body.termId}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${Buffer.from(`${wpUser}:${wpPass}`).toString('base64')}`,
              },
              body: JSON.stringify({ meta: { _producer_region: body.region } }),
            });
          }
        } catch { /* */ }
      }

      // Invalidate cache
      try {
        await fetch(`${wc.baseUrl}/wp-json/stp-app/v1/producer-logos?purge=1`);
      } catch { /* */ }

      return NextResponse.json({ success: true });
    } catch (err) {
      console.error('Update producer error:', err);
      return NextResponse.json({ error: err instanceof Error ? err.message : 'Errore interno' }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Azione non valida' }, { status: 400 });
}
