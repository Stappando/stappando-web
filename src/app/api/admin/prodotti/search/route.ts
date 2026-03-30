import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';

/* ── Types ─────────────────────────────────────────────── */

interface ProductData {
  nome?: string;
  produttore?: string;
  categoria?: string;
  annata?: string;
  formato?: string;
  denominazione?: string;
  regione?: string;
  nazione?: string;
  uvaggio?: string;
  gradazione?: string;
  descBreve?: string;
  descLunga?: string;
  allaVista?: string;
  alNaso?: string;
  alPalato?: string;
  abbinamenti?: string;
  temperaturaServizio?: string;
  momentoConsumo?: string;
  vinificazione?: string;
  affinamento?: string;
  allergeni?: string;
}

/* ── Known grape varieties for name parsing ────────────── */

const KNOWN_GRAPES = [
  'Nebbiolo', 'Sangiovese', 'Barbera', 'Dolcetto', 'Montepulciano',
  'Primitivo', 'Nero d\'Avola', 'Aglianico', 'Cannonau', 'Corvina',
  'Rondinella', 'Molinara', 'Nerello Mascalese', 'Nerello Cappuccio',
  'Lagrein', 'Teroldego', 'Refosco', 'Sagrantino', 'Cesanese',
  'Gaglioppo', 'Negroamaro', 'Susumaniello', 'Frappato', 'Perricone',
  'Chardonnay', 'Sauvignon Blanc', 'Pinot Grigio', 'Pinot Bianco',
  'Trebbiano', 'Verdicchio', 'Vermentino', 'Falanghina', 'Fiano',
  'Greco', 'Garganega', 'Arneis', 'Cortese', 'Timorasso', 'Ribolla Gialla',
  'Friulano', 'Glera', 'Moscato', 'Gewurztraminer', 'Muller Thurgau',
  'Malvasia', 'Pecorino', 'Passerina', 'Cococciola', 'Grillo',
  'Catarratto', 'Carricante', 'Zibibbo', 'Insolia', 'Nosiola',
  'Cabernet Sauvignon', 'Merlot', 'Pinot Nero', 'Syrah', 'Cabernet Franc',
  'Petit Verdot', 'Malbec', 'Grenache', 'Tempranillo', 'Riesling',
];

/* ── Denomination patterns ─────────────────────────────── */

const DENOMINATION_PATTERNS = [
  { pattern: /\bDOCG\b/i, value: 'DOCG' },
  { pattern: /\bDOC\b/i, value: 'DOC' },
  { pattern: /\bIGT\b/i, value: 'IGT' },
  { pattern: /\bIGP\b/i, value: 'IGP' },
  { pattern: /\bVino da Tavola\b/i, value: 'Vino da Tavola' },
];

/* ── Region mappings for known denominations ───────────── */

const DENOMINATION_REGIONS: Record<string, string> = {
  'barolo': 'Piemonte', 'barbaresco': 'Piemonte', 'brunello di montalcino': 'Toscana',
  'chianti': 'Toscana', 'chianti classico': 'Toscana', 'vino nobile di montepulciano': 'Toscana',
  'bolgheri': 'Toscana', 'amarone': 'Veneto', 'valpolicella': 'Veneto', 'soave': 'Veneto',
  'prosecco': 'Veneto', 'franciacorta': 'Lombardia', 'oltrepo pavese': 'Lombardia',
  'etna': 'Sicilia', 'cerasuolo di vittoria': 'Sicilia', 'taurasi': 'Campania',
  'fiano di avellino': 'Campania', 'greco di tufo': 'Campania', 'aglianico del vulture': 'Basilicata',
  'primitivo di manduria': 'Puglia', 'salice salentino': 'Puglia', 'verdicchio dei castelli di jesi': 'Marche',
  'vermentino di gallura': 'Sardegna', 'cannonau di sardegna': 'Sardegna',
  'montepulciano d\'abruzzo': 'Abruzzo', 'trebbiano d\'abruzzo': 'Abruzzo',
  'lambrusco': 'Emilia-Romagna', 'sagrantino di montefalco': 'Umbria',
  'montefalco': 'Umbria', 'orvieto': 'Umbria', 'frascati': 'Lazio',
  'alto adige': 'Trentino-Alto Adige', 'trentino': 'Trentino-Alto Adige',
  'collio': 'Friuli Venezia Giulia', 'friuli': 'Friuli Venezia Giulia',
  'gavi': 'Piemonte', 'roero': 'Piemonte', 'langhe': 'Piemonte', 'asti': 'Piemonte',
  'moscato d\'asti': 'Piemonte', 'verdicchio': 'Marche',
};

/* ── Category guessing ─────────────────────────────────── */

const RED_GRAPES = [
  'nebbiolo', 'sangiovese', 'barbera', 'dolcetto', 'montepulciano', 'primitivo',
  'nero d\'avola', 'aglianico', 'cannonau', 'corvina', 'nerello mascalese',
  'lagrein', 'teroldego', 'refosco', 'sagrantino', 'negroamaro', 'cabernet sauvignon',
  'merlot', 'pinot nero', 'syrah', 'cabernet franc', 'petit verdot', 'frappato',
  'gaglioppo', 'susumaniello', 'cesanese',
];

const SPARKLING_KEYWORDS = ['prosecco', 'franciacorta', 'spumante', 'brut', 'trento doc', 'metodo classico', 'cava', 'champagne', 'bollicine', 'extra brut', 'pas dose', 'millesimato'];
const ROSE_KEYWORDS = ['rosato', 'rose', 'rosé', 'cerasuolo', 'chiaretto'];

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

/* ── Web scraping helpers ──────────────────────────────── */

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'it-IT,it;q=0.9,en;q=0.8',
};

function extractBetween(html: string, before: string, after: string): string {
  const startIdx = html.indexOf(before);
  if (startIdx === -1) return '';
  const contentStart = startIdx + before.length;
  const endIdx = html.indexOf(after, contentStart);
  if (endIdx === -1) return '';
  return html.substring(contentStart, endIdx).trim();
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim();
}

async function searchTannico(name: string): Promise<Partial<ProductData>> {
  const data: Partial<ProductData> = {};
  try {
    const searchUrl = `https://www.tannico.it/catalogsearch/result/?q=${encodeURIComponent(name)}`;
    const searchRes = await fetch(searchUrl, { headers: FETCH_HEADERS, signal: AbortSignal.timeout(8000) });
    if (!searchRes.ok) return data;
    const searchHtml = await searchRes.text();

    // Find first product link
    const productLinkMatch = searchHtml.match(/href="(https:\/\/www\.tannico\.it\/[^"]*\.html)"/);
    if (!productLinkMatch) return data;

    const productRes = await fetch(productLinkMatch[1], { headers: FETCH_HEADERS, signal: AbortSignal.timeout(8000) });
    if (!productRes.ok) return data;
    const html = productRes.text ? await productRes.text() : '';

    // Extract producer
    const producerMatch = html.match(/produttore[^>]*>([^<]+)</i) || html.match(/"brand"\s*:\s*"([^"]+)"/);
    if (producerMatch) data.produttore = stripHtml(producerMatch[1]);

    // Extract region
    const regionMatch = html.match(/regione[^>]*>([^<]+)</i);
    if (regionMatch) data.regione = stripHtml(regionMatch[1]);

    // Extract grapes
    const grapesMatch = html.match(/uvaggio[^>]*>([^<]+)</i) || html.match(/vitigno[^>]*>([^<]+)</i);
    if (grapesMatch) data.uvaggio = stripHtml(grapesMatch[1]);

    // Extract alcohol
    const alcoholMatch = html.match(/gradazione[^>]*>([^<]+)</i) || html.match(/alcol[^>]*>([^<]+)</i) || html.match(/(\d+[.,]\d*)\s*%\s*vol/i);
    if (alcoholMatch) data.gradazione = stripHtml(alcoholMatch[1]).replace(/vol\.?/i, '').trim();

    // Extract denomination
    const denomMatch = html.match(/denominazione[^>]*>([^<]+)</i);
    if (denomMatch) data.denominazione = stripHtml(denomMatch[1]);

    // Extract description
    const descMatch = html.match(/description[^>]*>([^<]{20,})</i);
    if (descMatch) data.descLunga = stripHtml(descMatch[1]).substring(0, 500);

    // Extract tasting notes
    const vistaMatch = html.match(/vista[^>]*>([^<]+)</i);
    if (vistaMatch) data.allaVista = stripHtml(vistaMatch[1]);

    const nasoMatch = html.match(/naso[^>]*>([^<]+)</i) || html.match(/profumo[^>]*>([^<]+)</i);
    if (nasoMatch) data.alNaso = stripHtml(nasoMatch[1]);

    const palatoMatch = html.match(/palato[^>]*>([^<]+)</i) || html.match(/gusto[^>]*>([^<]+)</i);
    if (palatoMatch) data.alPalato = stripHtml(palatoMatch[1]);

    // Extract pairings
    const pairingMatch = html.match(/abbinament[oi][^>]*>([^<]+)</i);
    if (pairingMatch) data.abbinamenti = stripHtml(pairingMatch[1]);

    // Extract serving temp
    const tempMatch = html.match(/temperatura[^>]*>([^<]+)</i) || html.match(/servire\s+(?:a|tra)\s+(\d+[\s\-°]*\d*\s*°?\s*C?)/i);
    if (tempMatch) data.temperaturaServizio = stripHtml(tempMatch[1]);

  } catch {
    // Silently fail, we'll try other sources
  }
  return data;
}

async function searchVivino(name: string): Promise<Partial<ProductData>> {
  const data: Partial<ProductData> = {};
  try {
    const searchUrl = `https://www.vivino.com/search/wines?q=${encodeURIComponent(name)}`;
    const res = await fetch(searchUrl, { headers: FETCH_HEADERS, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return data;
    const html = await res.text();

    // Try to extract structured data from Vivino
    const ldJsonMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
    if (ldJsonMatch) {
      try {
        const ld = JSON.parse(ldJsonMatch[1]);
        if (ld.name) data.nome = ld.name;
        if (ld.brand?.name) data.produttore = ld.brand.name;
        if (ld.countryOfOrigin?.name) data.nazione = ld.countryOfOrigin.name;
        if (ld.description) data.descLunga = ld.description.substring(0, 500);
      } catch {
        // Invalid JSON, skip
      }
    }

    // Extract region from Vivino
    const regionVivMatch = html.match(/wine-region[^>]*>([^<]+)</i);
    if (regionVivMatch) data.regione = stripHtml(regionVivMatch[1]);

    // Extract grapes
    const grapeVivMatch = html.match(/grape[^>]*>([^<]+)</i);
    if (grapeVivMatch) data.uvaggio = stripHtml(grapeVivMatch[1]);

  } catch {
    // Silently fail
  }
  return data;
}

/* ── Name-based parsing (fallback) ─────────────────────── */

function parseFromName(name: string): { data: Partial<ProductData>; foundFields: string[] } {
  const data: Partial<ProductData> = { nome: name };
  const foundFields: string[] = ['nome'];
  const nameLower = name.toLowerCase();

  // Extract vintage year
  const yearMatch = name.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    data.annata = yearMatch[0];
    foundFields.push('annata');
  }

  // Extract denomination
  for (const { pattern, value } of DENOMINATION_PATTERNS) {
    if (pattern.test(name)) {
      data.denominazione = value;
      foundFields.push('denominazione');
      break;
    }
  }

  // Extract known grape varieties
  const foundGrapes: string[] = [];
  for (const grape of KNOWN_GRAPES) {
    if (nameLower.includes(grape.toLowerCase())) {
      foundGrapes.push(grape);
    }
  }
  if (foundGrapes.length > 0) {
    data.uvaggio = foundGrapes.join(', ');
    foundFields.push('uvaggio');
  }

  // Map known denomination names to regions
  for (const [denom, region] of Object.entries(DENOMINATION_REGIONS)) {
    if (nameLower.includes(denom)) {
      data.regione = region;
      foundFields.push('regione');
      break;
    }
  }

  // Guess category
  const isSparkling = SPARKLING_KEYWORDS.some((k) => nameLower.includes(k));
  const isRose = ROSE_KEYWORDS.some((k) => nameLower.includes(k));
  const isRed = foundGrapes.some((g) => RED_GRAPES.includes(g.toLowerCase()));

  if (isSparkling) {
    data.categoria = 'Bollicine';
    foundFields.push('categoria');
  } else if (isRose) {
    data.categoria = 'Vini Rosati';
    foundFields.push('categoria');
  } else if (isRed) {
    data.categoria = 'Vini Rossi';
    foundFields.push('categoria');
  }

  // Default nation
  data.nazione = 'Italia';
  foundFields.push('nazione');

  return { data, foundFields };
}

/* ── WC taxonomy check ─────────────────────────────────── */

interface WCTaxonomyResult {
  existingTerms: Record<string, boolean>;
}

// Known WC attribute IDs — adjust these to your actual WooCommerce setup
const WC_ATTRIBUTE_IDS: Record<string, number> = {
  pa_produttore: 1,
  pa_denominazione: 2,
  pa_regione: 3,
  pa_uvaggio: 4,
};

async function checkWCTaxonomies(data: Partial<ProductData>): Promise<WCTaxonomyResult> {
  const existingTerms: Record<string, boolean> = {};

  const checks: { attr: string; value: string | undefined }[] = [
    { attr: 'pa_produttore', value: data.produttore },
    { attr: 'pa_denominazione', value: data.denominazione },
    { attr: 'pa_regione', value: data.regione },
    { attr: 'pa_uvaggio', value: data.uvaggio },
  ];

  await Promise.all(
    checks
      .filter((c) => c.value)
      .map(async (check) => {
        const attrId = WC_ATTRIBUTE_IDS[check.attr];
        if (!attrId) return;
        try {
          const url = wcUrl(`/products/attributes/${attrId}/terms`, { search: check.value! });
          const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
          if (res.ok) {
            const terms = await res.json();
            existingTerms[check.attr] = Array.isArray(terms) && terms.length > 0;
          }
        } catch {
          // WC check failed, not critical
        }
      }),
  );

  return { existingTerms };
}

/* ── POST handler ──────────────────────────────────────── */

export async function POST(req: NextRequest) {
  let body: { name: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON non valido' }, { status: 400 });
  }

  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'Nome vino obbligatorio' }, { status: 400 });
  }

  const wineName = body.name.trim();

  // 1. Parse what we can from the name itself
  const { data: nameData, foundFields } = parseFromName(wineName);
  const mergedData: Partial<ProductData> = { ...nameData };

  // 2. Try to scrape wine info from web sources
  const [tannicoData, vivinoData] = await Promise.allSettled([
    searchTannico(wineName),
    searchVivino(wineName),
  ]);

  // Merge web data (Tannico preferred, then Vivino, then name parsing)
  const webSources: Partial<ProductData>[] = [];
  if (tannicoData.status === 'fulfilled') webSources.push(tannicoData.value);
  if (vivinoData.status === 'fulfilled') webSources.push(vivinoData.value);

  for (const source of webSources) {
    for (const [key, value] of Object.entries(source)) {
      if (value && !mergedData[key as keyof ProductData]) {
        mergedData[key as keyof ProductData] = value;
        if (!foundFields.includes(key)) {
          foundFields.push(key);
        }
      }
    }
  }

  // 3. Check WC taxonomies in parallel
  try {
    await checkWCTaxonomies(mergedData);
  } catch {
    // Non-critical, continue without taxonomy check
  }

  return NextResponse.json({
    data: mergedData,
    foundFields,
  });
}
