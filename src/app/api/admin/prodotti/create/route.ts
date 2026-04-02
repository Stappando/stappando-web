import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';
import { getGoogleAccessToken, sheetsAppend } from '@/lib/google-sheets';

/* ── Types ─────────────────────────────────────────────── */

interface ProductBody {
  nome: string;
  produttore: string;
  vendorId: string;
  sku: string;
  prezzo: string;
  prezzoScontato: string;
  giacenza: string;
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
  terreno: string;
  esposizione: string;
  altitudine: string;
  zonaProduzione: string;
  resa: string;
  vendemmia: string;
  bottiglieProdotte: string;
  certificazioni: string;
  raccolta: string;
  densitaImpianto: string;
  spumantizzazione: string;
  categoriaSpumanti: string;
  dosaggio: string;
  orientamentoVigne: string;
  tipoVigneto: string;
  periodoVendemmia: string;
  categoriaGoogle: string;
  gtin: string;
  menuOrder: string;
  tags: string;
}

/* ── Category to WC category mapping ───────────────────── */

const CATEGORY_MAP: Record<string, number> = {
  'Vini Rossi': 4447,
  'Vini Bianchi': 4448,
  'Vini Rosati': 4449,
  'Bollicine': 19461,
  'Spumanti': 19461,
  'Prosecco': 5202,
  'Champagne': 1397,
  'Distillati': 19488,
  'Liquori': 12855,
  'Birre': 1612,
  'Vini': 5347,
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

// Fallback hardcoded IDs (used only when WC fetch fails or returns fewer attributes)
const FALLBACK_ATTR_IDS: Record<string, number> = {
  'pa_produttore': 10,
  'pa_denominazione': 33,
  'pa_regione': 4,
  'pa_nazione': 5,
  'pa_uvaggio': 17,
  'pa_gradazione-alcolica': 24,
  'pa_annata': 11,
  'pa_formato': 6,
  'pa_abbinamenti': 7,
  'pa_temperatura-di-servizio': 41,
  'pa_momento-di-consumo': 93,
  'pa_allergeni': 87,
  'pa_terreno': 40,
  'pa_filosofia': 15,
  'pa_resa': 45,
  'pa_raccolta': 46,
  'pa_bottiglie-prodotte': 92,
  'pa_zona-di-produzione': 36,
  'pa_dosaggio': 29,
  'pa_categoria-google': 69,
  'pa_per-adulti': 75,
  'pa_metodo-produttivo': 38,
  'pa_spumantizzazione': 37,
  'pa_orientamento-delle-vigne': 47,
  'pa_altitudine-dei-vigneti': 49,
  'pa_tipo-di-vigneto': 44,
  'pa_identificazione-esistente': 73,
  'pa_ean': 57,
  'pa_densita-dimpianto': 94,
  'pa_periodo-vendemmia': 95,
};

function buildWCProduct(body: ProductBody, liveAttrIds: Record<string, number> = {}) {
  // Merge: live WC IDs take priority over fallback
  const ATTR_IDS = { ...FALLBACK_ATTR_IDS, ...liveAttrIds };

  // Build attributes array with IDs for proper WC mapping
  const attributes: {
    id?: number;
    name: string;
    slug?: string;
    visible: boolean;
    options: string[];
  }[] = [];

  const addAttr = (slug: string, name: string, options: string[]) => {
    const id = ATTR_IDS[slug];
    if (id) {
      attributes.push({ id, name, visible: true, options });
    } else {
      attributes.push({ name, slug, visible: true, options });
    }
  };

  if (body.produttore) addAttr('pa_produttore', 'Produttore', [body.produttore]);
  if (body.denominazione) addAttr('pa_denominazione', 'Denominazione', [body.denominazione]);
  if (body.regione) addAttr('pa_regione', 'Regione', [body.regione]);
  if (body.nazione) addAttr('pa_nazione', 'Nazione', [body.nazione]);
  if (body.uvaggio) addAttr('pa_uvaggio', 'Uvaggio', body.uvaggio.split(',').map(g => g.trim()).filter(Boolean));
  if (body.gradazione) addAttr('pa_gradazione-alcolica', 'Alcol', [body.gradazione]);
  if (body.annata) addAttr('pa_annata', 'Annata', [body.annata]);
  if (body.formato) addAttr('pa_formato', 'Formato', [body.formato]);
  if (body.abbinamenti) addAttr('pa_abbinamenti', 'Abbinamento', body.abbinamenti.split(',').map(p => p.trim()).filter(Boolean));
  if (body.temperaturaServizio) addAttr('pa_temperatura-di-servizio', 'Servire a', [body.temperaturaServizio]);
  if (body.momentoConsumo) addAttr('pa_momento-di-consumo', 'Momento di consumo', body.momentoConsumo.split(',').map(m => m.trim()).filter(Boolean));
  if (body.allergeni) addAttr('pa_allergeni', 'Allergeni', body.allergeni.split(',').map(a => a.trim()).filter(Boolean));
  if (body.terreno) addAttr('pa_terreno', 'Terreno', [body.terreno]);
  if (body.certificazioni) addAttr('pa_filosofia', 'Certificazioni', body.certificazioni.split(',').map(c => c.trim()).filter(Boolean));
  if (body.resa) addAttr('pa_resa', 'Resa', [body.resa]);
  if (body.raccolta) addAttr('pa_raccolta', 'Raccolta', [body.raccolta]);
  if (body.bottiglieProdotte) addAttr('pa_bottiglie-prodotte', 'Bottiglie prodotte', body.bottiglieProdotte.split(',').map(s => s.trim()).filter(Boolean));
  if (body.zonaProduzione) addAttr('pa_zona-di-produzione', 'Zona di produzione', [body.zonaProduzione]);
  if (body.spumantizzazione) addAttr('pa_metodo-produttivo', 'Spumantizzazione', [body.spumantizzazione]);
  if (body.categoriaSpumanti) addAttr('pa_spumantizzazione', 'Categoria spumanti', [body.categoriaSpumanti]);
  if (body.dosaggio) addAttr('pa_dosaggio', 'Dosaggio', [body.dosaggio]);
  if (body.orientamentoVigne) addAttr('pa_orientamento-delle-vigne', 'Orientamento delle vigne', [body.orientamentoVigne]);
  if (body.tipoVigneto) addAttr('pa_tipo-di-vigneto', 'Tipo di vigneto', [body.tipoVigneto]);
  if (body.periodoVendemmia) addAttr('pa_periodo-vendemmia', 'Periodo vendemmia', body.periodoVendemmia.split(',').map(v => v.trim()).filter(Boolean));
  if (body.altitudine) addAttr('pa_altitudine-dei-vigneti', 'Altitudine dei vigneti', [body.altitudine]);
  if (body.densitaImpianto) addAttr('pa_densita-dimpianto', "Densità d'impianto", [body.densitaImpianto]);
  if (body.esposizione) addAttr('pa_orientamento-delle-vigne', 'Orientamento delle vigne', [body.esposizione]);
  // Per adulti: sempre SI
  addAttr('pa_per-adulti', 'Per adulti', ['Sì']);
  // Categoria Google se presente
  if (body.categoriaGoogle) addAttr('pa_categoria-google', 'categoria Google', [body.categoriaGoogle]);
  // GTIN → anche come attributo EAN
  if (body.gtin) addAttr('pa_ean', 'EAN', [body.gtin]);
  // Identificazione esistente: SI se GTIN presente
  if (body.gtin) addAttr('pa_identificazione-esistente', 'Identificazione esistente', ['Sì']);

  // Build meta_data for ACF fields (tasting notes, vinification, etc.)
  const metaData: { key: string; value: string }[] = [];

  if (body.allaVista) metaData.push({ key: 'alla_vista', value: body.allaVista });
  if (body.alNaso) metaData.push({ key: 'al_naso', value: body.alNaso });
  if (body.alPalato) metaData.push({ key: 'al_palato', value: body.alPalato });
  if (body.vinificazione) metaData.push({ key: 'vinificazione', value: body.vinificazione });
  if (body.affinamento) metaData.push({ key: 'affinamento', value: body.affinamento });
  if (body.esposizione) metaData.push({ key: 'esposizione', value: body.esposizione });
  if (body.altitudine) metaData.push({ key: 'altitudine', value: body.altitudine });
  // zona_produzione, bottiglie_prodotte, terreno are saved as WC attributes, not meta
  if (body.gtin) {
    metaData.push({ key: '_wpm_gtin_code', value: body.gtin });
    metaData.push({ key: '_global_unique_id', value: body.gtin });
  }

  // Build categories array
  const categories: { id: number }[] = [];
  const catId = parseInt(body.categoria);
  if (catId > 0) {
    categories.push({ id: catId });
  } else if (body.categoria && CATEGORY_MAP[body.categoria]) {
    categories.push({ id: CATEGORY_MAP[body.categoria] });
  }

  // Add vendor meta if specified
  if (body.vendorId) {
    metaData.push({ key: '_vendor_id', value: body.vendorId });
  }

  // Build tags
  const tags: { name: string }[] = [];
  if (body.tags) {
    body.tags.split(',').map(t => t.trim()).filter(Boolean).forEach(t => tags.push({ name: t }));
  }

  return {
    name: body.nome,
    status: 'draft' as const,
    type: 'simple' as const,
    sku: body.sku || '',
    regular_price: body.prezzo || '',
    ...(body.prezzoScontato ? { sale_price: body.prezzoScontato } : {}),
    manage_stock: true,
    stock_quantity: parseInt(body.giacenza) || 0,
    menu_order: parseInt(body.menuOrder) || 0,
    short_description: (body.descBreve || '').replace(/<[^>]*>/g, '').trim(),
    description: (body.descLunga || '').replace(/<[^>]*>/g, '').trim(),
    categories,
    attributes,
    meta_data: metaData,
    ...(tags.length > 0 ? { tags } : {}),
  };
}

/* ── Ensure WC taxonomy term exists ───────────────────── */

async function ensureTermExists(baseUrl: string, auth: string, attrSlug: string, attrId: number, termName: string) {
  try {
    const searchRes = await fetch(
      `${baseUrl}/wp-json/wc/v3/products/attributes/${attrId}/terms?search=${encodeURIComponent(termName)}&${auth}`,
    );
    if (searchRes.ok) {
      const existing: { name: string }[] = await searchRes.json();
      if (existing.some(t => t.name.toLowerCase() === termName.toLowerCase())) return;
    }
    await fetch(`${baseUrl}/wp-json/wc/v3/products/attributes/${attrId}/terms?${auth}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: termName }),
    });
  } catch (err) {
    console.error(`ensureTermExists failed for ${attrSlug}:${termName}`, err);
  }
}

/* ── POST handler ──────────────────────────────────────── */

export async function POST(req: NextRequest) {
  let body: ProductBody & { updateId?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON non valido' }, { status: 400 });
  }

  if (!body.nome?.trim()) {
    return NextResponse.json({ error: 'Nome prodotto obbligatorio' }, { status: 400 });
  }

  const isUpdate = !!body.updateId;

  try {
    const wc = getWCSecrets();

    // Fetch live attribute IDs from WC (per_page=100 to get all, default is only 10)
    const liveAttrIds: Record<string, number> = {};
    try {
      const attrsRes = await fetch(
        `${wcUrl('/products/attributes', { per_page: 100 })}`,
      );
      if (attrsRes.ok) {
        const attrs: { id: number; slug: string }[] = await attrsRes.json();
        for (const a of attrs) {
          liveAttrIds[`pa_${a.slug}`] = a.id;
        }
      }
    } catch { /* use fallback hardcoded IDs */ }

    // Ensure free-text taxonomy terms exist before saving product
    const wcAuth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;
    if (body.zonaProduzione?.trim()) {
      const zonaAttrId = liveAttrIds['pa_zona-di-produzione'] || FALLBACK_ATTR_IDS['pa_zona-di-produzione'];
      if (zonaAttrId) {
        await ensureTermExists(wc.baseUrl, wcAuth, 'pa_zona-di-produzione', zonaAttrId, body.zonaProduzione.trim());
      }
    }

    const wcProduct = buildWCProduct(body, liveAttrIds);

    // If updating, use PUT; if creating, use POST
    const url = isUpdate ? wcUrl(`/products/${body.updateId}`) : wcUrl('/products');
    const method = isUpdate ? 'PUT' : 'POST';

    // For updates, don't change status
    if (isUpdate) {
      delete (wcProduct as Record<string, unknown>).status;
    }

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(wcProduct),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('WC create product error:', res.status, errorText);
      // Parse WC error for a user-friendly message
      let userMessage = `Errore WooCommerce (${res.status})`;
      try {
        const errJson = JSON.parse(errorText);
        const wcMsg: string = errJson.message || errJson.code || '';
        if (wcMsg.toLowerCase().includes('sku') || errJson.code === 'woocommerce_rest_product_sku_already_exists') {
          userMessage = `SKU già esistente: "${body.sku}" è già usato da un altro prodotto. Usa uno SKU diverso o lascia il campo vuoto.`;
        } else if (wcMsg) {
          userMessage = wcMsg;
        }
      } catch { /* errorText non è JSON, usa il messaggio generico */ }
      throw new Error(userMessage);
    }

    const product = await res.json();
    const productId = product.id as number;
    const editUrl = `${wc.baseUrl}/wp-admin/post.php?post=${productId}&action=edit`;

    // Set post_author to vendorId via WordPress REST API (required by WCFM to assign store)
    if (body.vendorId) {
      const wpUser = process.env.WP_USER;
      const wpAppPassword = process.env.WP_APP_PASSWORD;
      if (wpUser && wpAppPassword) {
        const wpAuth = Buffer.from(`${wpUser}:${wpAppPassword}`).toString('base64');
        try {
          await fetch(`${wc.baseUrl}/wp-json/wp/v2/product/${productId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Basic ${wpAuth}`,
            },
            body: JSON.stringify({ author: parseInt(body.vendorId) }),
          });
        } catch (authorErr) {
          console.error('Failed to set post_author:', authorErr);
          // Non-blocking
        }
      }
    }

    // Save to Google Sheets (elenco prodotti)
    try {
      const PRODUCTS_SHEET_ID = '1ZPjUqED0c4I7EPqa0h9bNFkCijBzXe3Y0XiiL0QNKxc';
      const accessToken = await getGoogleAccessToken();
      await sheetsAppend(accessToken, PRODUCTS_SHEET_ID, 'elenco prodotti!D:E', [
        [body.sku || '', body.nome.trim()],
      ]);
    } catch (sheetErr) {
      console.error('Google Sheets save error (non-blocking):', sheetErr);
      // Non-blocking — product is already created on WC
    }

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
