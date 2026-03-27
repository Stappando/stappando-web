import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';
import { isPositiveInt, isNonEmptyString, sanitize } from '@/lib/validation';
import { sendEmail } from '@/lib/mail/mandrill';

export const dynamic = 'force-dynamic';

/** GET /api/vendor/products?vendorId=123 — fetch products authored by vendor */
export async function GET(req: NextRequest) {
  const vendorId = req.nextUrl.searchParams.get('vendorId');
  if (!isPositiveInt(vendorId)) {
    return NextResponse.json({ error: 'vendorId obbligatorio' }, { status: 400 });
  }

  const wc = getWCSecrets();
  const auth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;

  try {
    // WC REST API doesn't support filtering by author directly,
    // so we use the WordPress REST API to find products by author
    const wpRes = await fetch(
      `${wc.baseUrl}/wp-json/wp/v2/product?author=${vendorId}&per_page=50&status=any&_fields=id`,
    );

    if (!wpRes.ok) {
      // Fallback: fetch all recent products and filter by checking post_author
      // This is less efficient but works without WP REST for products
      const wcRes = await fetch(`${wc.baseUrl}/wp-json/wc/v3/products?per_page=50&${auth}`);
      if (!wcRes.ok) return NextResponse.json([], { status: 200 });
      const allProducts = await wcRes.json();
      // Can't filter by author with WC API, return empty for now
      return NextResponse.json(allProducts.slice(0, 0), { status: 200 });
    }

    const wpProducts: { id: number }[] = await wpRes.json();
    if (wpProducts.length === 0) return NextResponse.json([], { status: 200 });

    // Fetch full product data from WC API for each product
    const productIds = wpProducts.map(p => p.id);
    const includeParam = productIds.join(',');
    const wcRes = await fetch(
      `${wc.baseUrl}/wp-json/wc/v3/products?include=${includeParam}&per_page=50&${auth}`,
    );

    if (!wcRes.ok) return NextResponse.json([], { status: 200 });
    const products = await wcRes.json();

    return NextResponse.json(
      products.map((p: Record<string, unknown>) => ({
        id: p.id,
        name: p.name,
        status: p.status,
        price: (p as { regular_price?: string }).regular_price || '',
        sale_price: (p as { sale_price?: string }).sale_price || '',
        stock_quantity: (p as { stock_quantity?: number | null }).stock_quantity,
        images: ((p as { images?: { src: string }[] }).images || []).slice(0, 1),
        categories: ((p as { categories?: { name: string }[] }).categories || []).slice(0, 2),
      })),
    );
  } catch (err) {
    console.error('Vendor products fetch error:', err);
    return NextResponse.json([], { status: 200 });
  }
}

/* ── Helpers for POST ────────────────────────────────────── */

interface CreateProductBody {
  vendorId: number;
  name: string;
  sku?: string;
  regular_price: string;
  sale_price?: string;
  stock_quantity: number;
  short_description: string;
  description: string;
  categories: number[];
  images: { src: string }[];
  attributes: { slug: string; terms: string[] }[];
  acf: Record<string, string>;
}

/** Map pa_slug to a human-readable attribute name */
function attrDisplayName(slug: string): string {
  const map: Record<string, string> = {
    pa_regione: 'Regione',
    pa_denominazione: 'Denominazione',
    pa_uvaggio: 'Uvaggio',
    pa_tipologia: 'Tipologia',
    pa_formato: 'Formato',
    pa_produttore: 'Produttore',
    pa_annata: 'Annata',
  };
  return map[slug] || slug.replace(/^pa_/, '').replace(/_/g, ' ');
}

/** Ensure a term exists for an attribute; create it if missing. Returns the term name. */
async function ensureTermExists(
  baseUrl: string,
  auth: string,
  attributeId: number,
  termName: string,
): Promise<string> {
  // Check if term already exists
  const termsRes = await fetch(
    `${baseUrl}/wp-json/wc/v3/products/attributes/${attributeId}/terms?search=${encodeURIComponent(termName)}&${auth}`,
  );
  if (termsRes.ok) {
    const existing: { name: string }[] = await termsRes.json();
    const match = existing.find(
      (t) => t.name.toLowerCase() === termName.toLowerCase(),
    );
    if (match) return match.name;
  }

  // Create the term
  const createRes = await fetch(
    `${baseUrl}/wp-json/wc/v3/products/attributes/${attributeId}/terms?${auth}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: termName }),
    },
  );
  if (!createRes.ok) {
    console.error('Failed to create term:', await createRes.text());
    // Fall back to using the original name even if creation failed
  }
  return termName;
}

/** POST /api/vendor/products — create a new WC product as draft */
export async function POST(req: NextRequest) {
  let body: CreateProductBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Validate required fields
  if (!isPositiveInt(body.vendorId)) {
    return NextResponse.json({ error: 'vendorId is required' }, { status: 400 });
  }
  if (!isNonEmptyString(body.name)) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }
  if (!isNonEmptyString(body.regular_price)) {
    return NextResponse.json({ error: 'regular_price is required' }, { status: 400 });
  }

  const wc = getWCSecrets();
  const auth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;

  try {
    // Fetch all attributes to resolve IDs for produttore term creation
    const attrsRes = await fetch(
      `${wc.baseUrl}/wp-json/wc/v3/products/attributes?${auth}`,
    );
    const allAttributes: { id: number; slug: string }[] = attrsRes.ok
      ? await attrsRes.json()
      : [];

    // Map attributes to WC format
    const wcAttributes = [];
    for (const attr of body.attributes || []) {
      const attrSlug = attr.slug.startsWith('pa_') ? attr.slug.slice(3) : attr.slug;
      const wcAttr = allAttributes.find((a) => a.slug === attrSlug);

      // For produttore: ensure term exists
      if (attr.slug === 'pa_produttore' && wcAttr && attr.terms.length > 0) {
        for (const term of attr.terms) {
          await ensureTermExists(wc.baseUrl, auth, wcAttr.id, term);
        }
      }

      wcAttributes.push({
        name: attrDisplayName(attr.slug),
        slug: attr.slug,
        options: attr.terms,
        visible: true,
        variation: false,
      });
    }

    // Build meta_data from ACF fields + vendor metadata
    const metaData: { key: string; value: string | boolean }[] = [
      { key: '_vendor_id', value: String(body.vendorId) },
      { key: '_vendor_pending_review', value: true },
    ];
    if (body.acf) {
      for (const [key, value] of Object.entries(body.acf)) {
        metaData.push({ key, value: sanitize(value, 5000) });
      }
    }

    // Create product via WC REST API
    const productPayload = {
      name: sanitize(body.name, 500),
      status: 'draft',
      type: 'simple',
      regular_price: body.regular_price,
      ...(body.sale_price ? { sale_price: body.sale_price } : {}),
      ...(body.sku ? { sku: sanitize(body.sku, 100) } : {}),
      short_description: sanitize(body.short_description, 2000),
      description: sanitize(body.description, 10000),
      manage_stock: true,
      stock_quantity: body.stock_quantity ?? 0,
      categories: (body.categories || []).map((id) => ({ id })),
      images: (body.images || []).map((img) => ({ src: img.src })),
      attributes: wcAttributes,
      meta_data: metaData,
    };

    const createRes = await fetch(
      `${wc.baseUrl}/wp-json/wc/v3/products?${auth}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productPayload),
      },
    );

    if (!createRes.ok) {
      const errText = await createRes.text();
      console.error('WC product creation failed:', errText);
      return NextResponse.json(
        { error: 'Failed to create product' },
        { status: 502 },
      );
    }

    const created: { id: number; name: string } = await createRes.json();

    // Set post_author to vendorId via WordPress REST API
    const wpUser = process.env.WP_USER;
    const wpAppPassword = process.env.WP_APP_PASSWORD;
    if (wpUser && wpAppPassword) {
      const wpAuth = Buffer.from(`${wpUser}:${wpAppPassword}`).toString('base64');
      await fetch(`${wc.baseUrl}/wp-json/wp/v2/product/${created.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${wpAuth}`,
        },
        body: JSON.stringify({ author: body.vendorId }),
      });
    }

    // Send notification email about new product pending review
    try {
      await sendEmail({
        to: [{ email: 'assistenza@stappando.it', name: 'Stappando' }],
        subject: `Nuovo prodotto da approvare: ${sanitize(body.name, 200)}`,
        html: `
          <h2>Nuovo prodotto in attesa di revisione</h2>
          <p><strong>Prodotto:</strong> ${sanitize(body.name, 200)}</p>
          <p><strong>Vendor ID:</strong> ${body.vendorId}</p>
          <p><strong>Prezzo:</strong> &euro;${body.regular_price}</p>
          <p><strong>SKU:</strong> ${body.sku || 'N/A'}</p>
          <p><strong>Product ID:</strong> ${created.id}</p>
          <p>Accedi al pannello di amministrazione per approvare o rifiutare il prodotto.</p>
        `,
        tags: ['vendor-product-review'],
      });
    } catch (emailErr) {
      // Don't fail the request if email fails
      console.error('Notification email failed:', emailErr);
    }

    return NextResponse.json({ success: true, productId: created.id });
  } catch (err) {
    console.error('Product creation error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
