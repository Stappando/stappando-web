import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';
import { isPositiveInt, isNonEmptyString, sanitize } from '@/lib/validation';
import { sendEmail } from '@/lib/mail/mandrill';

export const dynamic = 'force-dynamic';

interface WCProduct {
  id: number;
  name: string;
  status: string;
  date_created?: string;
  regular_price?: string;
  sale_price?: string;
  stock_quantity?: number | null;
  images?: { src: string }[];
  categories?: { name: string }[];
  meta_data?: { key: string; value: string }[];
}

function mapProduct(p: WCProduct) {
  return {
    id: p.id,
    name: p.name,
    status: p.status,
    price: p.regular_price || '',
    sale_price: p.sale_price || '',
    stock_quantity: p.stock_quantity,
    images: (p.images || []).slice(0, 1),
    categories: (p.categories || []).slice(0, 2),
  };
}

/** GET /api/vendor/products?vendorId=123 — fetch products for vendor (including drafts) */
export async function GET(req: NextRequest) {
  const vendorId = req.nextUrl.searchParams.get('vendorId');
  if (!isPositiveInt(vendorId)) {
    return NextResponse.json({ error: 'vendorId obbligatorio' }, { status: 400 });
  }

  const wc = getWCSecrets();
  const auth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;

  try {
    // Fetch draft + publish in parallel, filter by _vendor_id meta
    const [draftRes, pubRes] = await Promise.all([
      fetch(`${wc.baseUrl}/wp-json/wc/v3/products?status=draft&per_page=50&${auth}`),
      fetch(`${wc.baseUrl}/wp-json/wc/v3/products?status=publish&per_page=50&${auth}`),
    ]);

    const allProducts: WCProduct[] = [];
    if (draftRes.ok) allProducts.push(...(await draftRes.json()));
    if (pubRes.ok) allProducts.push(...(await pubRes.json()));

    // Filter strictly by _vendor_id
    const vendorProducts = allProducts.filter(p => {
      const vid = p.meta_data?.find(m => m.key === '_vendor_id');
      return vid?.value === vendorId;
    });

    // Sort by date desc
    vendorProducts.sort((a, b) => new Date(b.date_created || 0).getTime() - new Date(a.date_created || 0).getTime());

    return NextResponse.json(vendorProducts.map(mapProduct));
  } catch (err) {
    console.error('Vendor products fetch error:', err);
    return NextResponse.json([], { status: 200 });
  }
}

/* ── Helpers for POST ────────────────────────────────────── */

interface CreateProductBody {
  vendorId: number;
  draftId?: number; // If set, update existing draft instead of creating new
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
      const attrSlugNoPa = attr.slug.startsWith('pa_') ? attr.slug.slice(3) : attr.slug;
      const attrSlugWithPa = attr.slug.startsWith('pa_') ? attr.slug : `pa_${attr.slug}`;
      const wcAttr = allAttributes.find((a) => a.slug === attrSlugNoPa || a.slug === attrSlugWithPa || a.slug === attr.slug);

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

    // Create or update product
    const isUpdate = body.draftId && body.draftId > 0;

    // Images: for update use {id} to keep existing, for create use {src}
    const imagePayload = (body.images || [])
      .filter((img: { id?: number; src?: string }) => img.id || img.src)
      .map((img: { id?: number; src?: string }) => {
        if (isUpdate && img.id && img.id > 0) return { id: img.id };
        if (img.src) return { src: img.src };
        return null;
      })
      .filter(Boolean);

    // For updates: merge new attributes with existing ones (WC replaces all on PUT)
    let finalAttributes = wcAttributes;
    if (isUpdate) {
      try {
        const existingRes = await fetch(`${wc.baseUrl}/wp-json/wc/v3/products/${body.draftId}?${auth}`);
        if (existingRes.ok) {
          const existing = await existingRes.json();
          const existingAttrs = (existing.attributes || []) as { name: string; slug: string; options: string[]; visible: boolean }[];
          // Keep existing attributes that are NOT in the new payload
          const newSlugs = new Set(wcAttributes.map((a: { slug: string }) => a.slug.toLowerCase()));
          const kept = existingAttrs.filter(a => !newSlugs.has(a.slug.toLowerCase()) && !newSlugs.has(`pa_${a.slug}`.toLowerCase()) && !newSlugs.has(a.slug.replace(/^pa_/, '').toLowerCase()));
          finalAttributes = [...kept.map(a => ({ ...a, visible: true, variation: false })), ...wcAttributes];
        }
      } catch { /* proceed with new attributes only */ }
    }

    // Build payload — only include fields that have values (don't overwrite with empty)
    const productPayload: Record<string, unknown> = {
      name: sanitize(body.name, 500),
      status: 'draft',
      type: 'simple',
      manage_stock: true,
      attributes: finalAttributes,
      meta_data: metaData,
    };
    // Only set fields that have actual values
    if (body.regular_price) productPayload.regular_price = body.regular_price;
    if (body.sale_price) productPayload.sale_price = body.sale_price;
    if (body.sku) productPayload.sku = sanitize(body.sku, 100);
    if (body.short_description) productPayload.short_description = sanitize(body.short_description, 2000);
    if (body.description) productPayload.description = sanitize(body.description, 10000);
    if (body.stock_quantity != null) productPayload.stock_quantity = body.stock_quantity;
    if (body.categories?.length) {
      const validCats = body.categories.map((id: number | string) => parseInt(String(id))).filter((id: number) => !isNaN(id) && id > 0);
      if (validCats.length > 0) productPayload.categories = validCats.map((id: number) => ({ id }));
    }
    if (imagePayload.length) productPayload.images = imagePayload;
    const url = isUpdate
      ? `${wc.baseUrl}/wp-json/wc/v3/products/${body.draftId}?${auth}`
      : `${wc.baseUrl}/wp-json/wc/v3/products?${auth}`;

    const createRes = await fetch(url, {
      method: isUpdate ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productPayload),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      console.error('WC product save failed:', createRes.status, errText);
      console.error('Payload sent:', JSON.stringify(productPayload).slice(0, 500));
      return NextResponse.json(
        { error: `Errore WC (${createRes.status}): ${errText.slice(0, 200)}` },
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

    // Send notification email for new products AND final submissions
    try {
      const isNew = !isUpdate;
      if (isNew) {
        console.log(`Sending product review email for #${created.id} to ordini@stappando.it`);
        await sendEmail({
          to: [{ email: 'ordini@stappando.it', name: 'Stappando Ordini' }],
          subject: `📦 Nuovo prodotto da approvare: ${sanitize(body.name, 200)}`,
          html: `
            <h2>Nuovo prodotto in attesa di revisione</h2>
            <p><strong>Prodotto:</strong> ${sanitize(body.name, 200)}</p>
            <p><strong>Vendor ID:</strong> ${body.vendorId}</p>
            <p><strong>Prezzo:</strong> &euro;${body.regular_price}</p>
            <p><strong>SKU:</strong> ${body.sku || 'N/A'}</p>
            <p><strong>Product ID:</strong> ${created.id}</p>
            <p><a href="https://stappando.it/wp-admin/edit.php?post_type=product&post_status=draft">Vedi prodotti da approvare →</a></p>
          `,
          tags: ['vendor-product-review'],
        });
        console.log('Product review email sent');
      }
    } catch (emailErr) {
      console.error('Product review email failed:', emailErr);
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
