import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

/** POST /api/vendor/media — upload image to WordPress Media Library */
export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: 'Invalid form data' },
      { status: 400 },
    );
  }

  const file = formData.get('file');
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json(
      { error: 'file field is required' },
      { status: 400 },
    );
  }

  // Validate file type
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: 'Invalid file type. Allowed: jpeg, png, webp' },
      { status: 400 },
    );
  }

  // Validate file size
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: 'File too large. Maximum 5MB allowed' },
      { status: 400 },
    );
  }

  const wpUser = process.env.WP_USER;
  const wpAppPassword = process.env.WP_APP_PASSWORD;
  const baseUrl = process.env.WC_BASE_URL;

  if (!baseUrl) {
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 },
    );
  }

  try {
    // Determine filename — sanitize to prevent path traversal
    const ext = file.type.split('/')[1] || 'jpg';
    let fileName = `upload-${Date.now()}.${ext}`;
    if (file instanceof File && file.name) {
      // Strip path separators, keep only alphanumeric, dash, underscore, dot
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.{2,}/g, '.');
      fileName = safe || fileName;
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Primary approach: WP REST API with Application Password
    if (wpUser && wpAppPassword) {
      const wpAuth = Buffer.from(`${wpUser}:${wpAppPassword}`).toString(
        'base64',
      );

      const wpRes = await fetch(`${baseUrl}/wp-json/wp/v2/media`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${wpAuth}`,
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Content-Type': file.type,
        },
        body: fileBuffer,
      });

      if (wpRes.ok) {
        const media: { id: number; source_url: string } = await wpRes.json();
        return NextResponse.json({ id: media.id, src: media.source_url });
      }

      console.error(
        'WP media upload failed:',
        wpRes.status,
        await wpRes.text(),
      );
    }

    // Fallback: upload via WC REST API (less common but works for some setups)
    const wcKey = process.env.WC_CONSUMER_KEY;
    const wcSecret = process.env.WC_CONSUMER_SECRET;

    if (wcKey && wcSecret) {
      // WC REST API doesn't have a direct media upload endpoint,
      // but we can try the WP REST API with WC OAuth query params
      const wpRes = await fetch(
        `${baseUrl}/wp-json/wp/v2/media?consumer_key=${wcKey}&consumer_secret=${wcSecret}`,
        {
          method: 'POST',
          headers: {
            'Content-Disposition': `attachment; filename="${fileName}"`,
            'Content-Type': file.type,
          },
          body: fileBuffer,
        },
      );

      if (wpRes.ok) {
        const media: { id: number; source_url: string } = await wpRes.json();
        return NextResponse.json({ id: media.id, src: media.source_url });
      }

      console.error(
        'WC fallback media upload failed:',
        wpRes.status,
        await wpRes.text(),
      );
    }

    return NextResponse.json(
      { error: 'Media upload failed. Check WP authentication credentials.' },
      { status: 502 },
    );
  } catch (err) {
    console.error('Media upload error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
