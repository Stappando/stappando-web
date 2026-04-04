/**
 * Upload a logo to WordPress media library and link it to a producer.
 * POST /api/admin/upload-logo
 * Body: { password, slug, imageUrl }
 *
 * Downloads the image from imageUrl, uploads to WP media, then updates
 * the producer term meta with the new logo URL.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets, getWPAdminAuth } from '@/lib/config';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Body non valido' }, { status: 400 });

    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword || body.password !== adminPassword) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { slug, imageUrl } = body;
    if (!slug || !imageUrl) {
      return NextResponse.json({ error: 'slug and imageUrl required' }, { status: 400 });
    }

    const wp = getWPAdminAuth();
    if (!wp) return NextResponse.json({ error: 'WP credentials not set' }, { status: 500 });

    const wc = getWCSecrets();
    const wcAuth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;

    // 1. Download the image
    const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(10000) });
    if (!imgRes.ok) return NextResponse.json({ error: `Failed to download: ${imgRes.status}` }, { status: 400 });
    const imgBuffer = Buffer.from(await imgRes.arrayBuffer());

    // Determine filename and content type
    const ext = imageUrl.match(/\.(png|jpg|jpeg|svg|webp)/i)?.[1] || 'png';
    const contentType = ext === 'svg' ? 'image/svg+xml' : ext === 'webp' ? 'image/webp' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
    const filename = `logo-${slug}.${ext}`;

    // 2. Upload to WP media library
    const uploadRes = await fetch(`${wp.baseUrl}/wp-json/wp/v2/media`, {
      method: 'POST',
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        Authorization: wp.authHeader,
      },
      body: imgBuffer,
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.text().catch(() => '');
      return NextResponse.json({ error: `WP upload failed: ${uploadRes.status}`, details: err.slice(0, 200) }, { status: 500 });
    }

    const media = await uploadRes.json();
    const logoUrl = media.source_url;

    // 3. Find the term ID
    const termsRes = await fetch(
      `${wc.baseUrl}/wp-json/wc/v3/products/attributes/10/terms?slug=${encodeURIComponent(slug)}&${wcAuth}`,
    );
    let termId: number | null = null;
    if (termsRes.ok) {
      const terms = await termsRes.json();
      termId = terms[0]?.id || null;
    }

    // 4. Update producer meta with new logo
    if (termId) {
      await fetch(`${wc.baseUrl}/wp-json/stp-app/v1/update-producer-meta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: wp.authHeader },
        body: JSON.stringify({ term_id: termId, logo: logoUrl }),
      });
    }

    return NextResponse.json({ success: true, logoUrl, termId, filename });
  } catch (err) {
    console.error('[upload-logo] Error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/**
 * Bulk upload logos.
 * GET /api/admin/upload-logo?password=X
 * Uploads all logos from the embedded list.
 */
const LOGOS: { slug: string; url: string }[] = [
  { slug: 'san-marzano', url: 'https://sanmarzano.wine/wp-content/uploads/2021/05/sanmarzano-logo.png' },
  { slug: 'umani-e-ronchi', url: 'https://www.umanironchi.com/wp-content/themes/umanironchi/images/logo/umani-ronchi.svg' },
  { slug: 'velenosi', url: 'https://velenosivini.com/wp-content/uploads/2020/03/logo-velenosi-vini-@2x.png' },
  { slug: 'pallini', url: 'https://pallini.com/wp-content/uploads/logo.svg' },
  { slug: 'fazi-battaglia', url: 'https://fazibattagliacom.cdn-immedia.net//sites/all/themes/immedia/img/share/logofazi.png' },
  { slug: 'palmento-costanzo', url: 'https://www.palmentocostanzo.com/wp-content/uploads/logo.svg' },
  { slug: 'teanum', url: 'https://teanum.com/wp-content/uploads/2025/07/Logo-Teanum-scaled.png' },
  { slug: 'pasetti', url: 'https://www.pasettivini.it/wp-content/uploads/2021/04/logo_2021.png' },
  { slug: 'perrier-jouet', url: 'https://www.perrier-jouet.com/themes/custom/pj/logo.png' },
  { slug: 'san-michele-appiano', url: 'https://www.stmichael.it/media/utilities/logo-st-michael.svg' },
  { slug: 'statti', url: 'https://storage1390.cdn-immedia.net/wp-content/themes/statti.com/assets/img/share/logo-statti-primary.svg' },
];

export async function GET(req: NextRequest) {
  const password = req.nextUrl.searchParams.get('password');
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword || password !== adminPassword) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const wp = getWPAdminAuth();
  if (!wp) return NextResponse.json({ error: 'WP credentials not set' }, { status: 500 });

  const wc = getWCSecrets();
  const wcAuth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;

  let uploaded = 0, failed = 0;
  const results: { slug: string; logoUrl?: string; error?: string }[] = [];

  for (const l of LOGOS) {
    try {
      // Download
      const imgRes = await fetch(l.url, { signal: AbortSignal.timeout(10000) });
      if (!imgRes.ok) { failed++; results.push({ slug: l.slug, error: `download ${imgRes.status}` }); continue; }
      const imgBuffer = Buffer.from(await imgRes.arrayBuffer());

      const ext = l.url.match(/\.(png|jpg|jpeg|svg|webp)/i)?.[1] || 'png';
      const contentType = ext === 'svg' ? 'image/svg+xml' : ext === 'webp' ? 'image/webp' : 'image/png';
      const filename = `logo-${l.slug}.${ext}`;

      // Upload to WP
      const uploadRes = await fetch(`${wp.baseUrl}/wp-json/wp/v2/media`, {
        method: 'POST',
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`,
          Authorization: wp.authHeader,
        },
        body: imgBuffer,
      });

      if (!uploadRes.ok) { failed++; results.push({ slug: l.slug, error: `upload ${uploadRes.status}` }); continue; }
      const media = await uploadRes.json();
      const logoUrl = media.source_url;

      // Find term and update meta
      const termsRes = await fetch(
        `${wc.baseUrl}/wp-json/wc/v3/products/attributes/10/terms?slug=${encodeURIComponent(l.slug)}&${wcAuth}`,
      );
      if (termsRes.ok) {
        const terms = await termsRes.json();
        if (terms[0]?.id) {
          await fetch(`${wc.baseUrl}/wp-json/stp-app/v1/update-producer-meta`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: wp.authHeader },
            body: JSON.stringify({ term_id: terms[0].id, logo: logoUrl }),
          });
        }
      }

      uploaded++;
      results.push({ slug: l.slug, logoUrl });
    } catch (e) {
      failed++;
      results.push({ slug: l.slug, error: String(e).slice(0, 100) });
    }
  }

  return NextResponse.json({ uploaded, failed, total: LOGOS.length, results });
}
