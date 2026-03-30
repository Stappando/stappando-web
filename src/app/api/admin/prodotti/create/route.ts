import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';

/* ── Types ─────────────────────────────────────────────── */

interface ProductBody {
  nome: string;
  produttore: string;
  vendorId: string;
  sku: string;
  categoria: string;
  annata: string;
  formato: string;
  denominazione: string;
  regione: string;
  nazione: string;
  uvaggio: string;
  gradazione: string;
  descBreve: string;
  descLunga: string;
  allaVista: string;
  alNaso: string;
  alPalato: string;
  abbinamenti: string;
  temperaturaServizio: string;
  momentoConsumo: string;
  vinificazione: string;
  affinamento: string;
  allergeni: string;
}

/* ── Category to WC category mapping ───────────────────── */

const CATEGORY_MAP: Record<string, number> = {
  'Vini Rossi': 49,
  'Vini Bianchi': 50,
  'Vini Rosati': 51,
  'Bollicine': 52,
  'Distillati': 53,
  'Liquori': 54,
  'Birre': 55,
};

/* ── WC API helper ─────────────────────────────────────── */

function wcUrl(path: string, params?: Record<string, string | number>): string {
  const wc = getWCSecrets();
  const url = new URL(`/wp-json/wc/v3${path}`, wc.baseUrl);
  url.searchParams.set('consumer_key', wc.consumerKey);
  url.searchParams.set('consumer_secret', wc.consumerSecret);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  }
  return url.toString();
}

/* ── Build WC product payload ──────────────────────────── */

function buildWCProduct(body: ProductBody) {
  // Build attributes array
  const attributes: {
    name: string;
    slug?: string;
    visible: boolean;
    options: string[];
  }[] = [];

  if (body.produttore) {
    attributes.push({ name: 'Produttore', slug: 'pa_produttore', visible: true, options: [body.produttore] });
  }
  if (body.denominazione) {
    attributes.push({ name: 'Denominazione', slug: 'pa_denominazione', visible: true, options: [body.denominazione] });
  }
  if (body.regione) {
    attributes.push({ name: 'Regione', slug: 'pa_regione', visible: true, options: [body.regione] });
  }
  if (body.nazione) {
    attributes.push({ name: 'Nazione', slug: 'pa_nazione', visible: true, options: [body.nazione] });
  }
  if (body.uvaggio) {
    const grapes = body.uvaggio.split(',').map((g) => g.trim()).filter(Boolean);
    attributes.push({ name: 'Uvaggio', slug: 'pa_uvaggio', visible: true, options: grapes });
  }
  if (body.gradazione) {
    attributes.push({ name: 'Gradazione alcolica', slug: 'pa_gradazione-alcolica', visible: true, options: [body.gradazione] });
  }
  if (body.annata) {
    attributes.push({ name: 'Annata', slug: 'pa_annata', visible: true, options: [body.annata] });
  }
  if (body.formato) {
    attributes.push({ name: 'Formato', slug: 'pa_formato', visible: true, options: [body.formato] });
  }
  if (body.abbinamenti) {
    const pairings = body.abbinamenti.split(',').map((p) => p.trim()).filter(Boolean);
    attributes.push({ name: 'Abbinamenti', slug: 'pa_abbinamenti', visible: true, options: pairings });
  }
  if (body.temperaturaServizio) {
    attributes.push({ name: 'Temperatura di servizio', slug: 'pa_temperatura-di-servizio', visible: true, options: [body.temperaturaServizio] });
  }
  if (body.momentoConsumo) {
    attributes.push({ name: 'Momento di consumo', slug: 'pa_momento-di-consumo', visible: true, options: [body.momentoConsumo] });
  }
  if (body.allergeni) {
    attributes.push({ name: 'Allergeni', slug: 'pa_allergeni', visible: true, options: [body.allergeni] });
  }

  // Build meta_data for ACF fields (tasting notes, vinification, etc.)
  const metaData: { key: string; value: string }[] = [];

  if (body.allaVista) metaData.push({ key: 'alla_vista', value: body.allaVista });
  if (body.alNaso) metaData.push({ key: 'al_naso', value: body.alNaso });
  if (body.alPalato) metaData.push({ key: 'al_palato', value: body.alPalato });
  if (body.vinificazione) metaData.push({ key: 'vinificazione', value: body.vinificazione });
  if (body.affinamento) metaData.push({ key: 'affinamento', value: body.affinamento });

  // Build categories array
  const categories: { id: number }[] = [];
  if (body.categoria && CATEGORY_MAP[body.categoria]) {
    categories.push({ id: CATEGORY_MAP[body.categoria] });
  }

  // Add vendor meta if specified
  if (body.vendorId) {
    metaData.push({ key: '_vendor_id', value: body.vendorId });
  }

  return {
    name: body.nome,
    status: 'draft' as const,
    type: 'simple' as const,
    sku: body.sku || '',
    short_description: body.descBreve || '',
    description: body.descLunga || '',
    categories,
    attributes,
    meta_data: metaData,
  };
}

/* ── POST handler ──────────────────────────────────────── */

export async function POST(req: NextRequest) {
  let body: ProductBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON non valido' }, { status: 400 });
  }

  if (!body.nome?.trim()) {
    return NextResponse.json({ error: 'Nome prodotto obbligatorio' }, { status: 400 });
  }

  try {
    const wcProduct = buildWCProduct(body);
    const wc = getWCSecrets();

    const res = await fetch(wcUrl('/products'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(wcProduct),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('WC create product error:', res.status, errorText);
      throw new Error(`Errore WooCommerce: ${res.status}`);
    }

    const product = await res.json();
    const productId = product.id as number;
    const editUrl = `${wc.baseUrl}/wp-admin/post.php?post=${productId}&action=edit`;

    return NextResponse.json({
      success: true,
      productId,
      editUrl,
    });
  } catch (err) {
    console.error('Create product error:', err);
    const message = err instanceof Error ? err.message : 'Errore interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
