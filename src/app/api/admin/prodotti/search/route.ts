import { NextRequest, NextResponse } from 'next/server';

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
  // Extra attributes
  terreno?: string;
  esposizione?: string;
  altitudine?: string;
  zonaProduzione?: string;
  resa?: string;
  vendemmia?: string;
  bottiglieProdotte?: string;
  certificazioni?: string;
  metodoSpumantizzazione?: string;
  dosaggio?: string;
  tags?: string;
}

/* ── Wine knowledge database ──────────────────────────── */

const DENOMINATION_MAP: Record<string, { type: string; region: string; grapes?: string; color?: string }> = {
  'barolo': { type: 'DOCG', region: 'Piemonte', grapes: 'Nebbiolo', color: 'rosso' },
  'barbaresco': { type: 'DOCG', region: 'Piemonte', grapes: 'Nebbiolo', color: 'rosso' },
  'brunello di montalcino': { type: 'DOCG', region: 'Toscana', grapes: 'Sangiovese', color: 'rosso' },
  'chianti': { type: 'DOCG', region: 'Toscana', grapes: 'Sangiovese', color: 'rosso' },
  'chianti classico': { type: 'DOCG', region: 'Toscana', grapes: 'Sangiovese', color: 'rosso' },
  'amarone': { type: 'DOCG', region: 'Veneto', grapes: 'Corvina, Corvinone, Rondinella', color: 'rosso' },
  'amarone della valpolicella': { type: 'DOCG', region: 'Veneto', grapes: 'Corvina, Corvinone, Rondinella', color: 'rosso' },
  'valpolicella': { type: 'DOC', region: 'Veneto', grapes: 'Corvina, Corvinone, Rondinella', color: 'rosso' },
  'prosecco': { type: 'DOC', region: 'Veneto', grapes: 'Glera', color: 'bollicine' },
  'prosecco superiore': { type: 'DOCG', region: 'Veneto', grapes: 'Glera', color: 'bollicine' },
  'franciacorta': { type: 'DOCG', region: 'Lombardia', grapes: 'Chardonnay, Pinot Nero', color: 'bollicine' },
  'trento': { type: 'DOC', region: 'Trentino-Alto Adige', grapes: 'Chardonnay, Pinot Nero', color: 'bollicine' },
  'soave': { type: 'DOC', region: 'Veneto', grapes: 'Garganega', color: 'bianco' },
  'lugana': { type: 'DOC', region: 'Lombardia', grapes: 'Turbiana (Trebbiano di Lugana)', color: 'bianco' },
  'verdicchio': { type: 'DOC', region: 'Marche', grapes: 'Verdicchio', color: 'bianco' },
  'verdicchio dei castelli di jesi': { type: 'DOC', region: 'Marche', grapes: 'Verdicchio', color: 'bianco' },
  'vermentino di sardegna': { type: 'DOC', region: 'Sardegna', grapes: 'Vermentino', color: 'bianco' },
  'vermentino di gallura': { type: 'DOCG', region: 'Sardegna', grapes: 'Vermentino', color: 'bianco' },
  'etna': { type: 'DOC', region: 'Sicilia', grapes: 'Nerello Mascalese, Carricante', color: 'rosso' },
  'nero d\'avola': { type: 'DOC', region: 'Sicilia', grapes: 'Nero d\'Avola', color: 'rosso' },
  'primitivo': { type: 'DOC', region: 'Puglia', grapes: 'Primitivo', color: 'rosso' },
  'primitivo di manduria': { type: 'DOC', region: 'Puglia', grapes: 'Primitivo', color: 'rosso' },
  'negroamaro': { type: 'DOC', region: 'Puglia', grapes: 'Negroamaro', color: 'rosso' },
  'salice salentino': { type: 'DOC', region: 'Puglia', grapes: 'Negroamaro', color: 'rosso' },
  'montepulciano d\'abruzzo': { type: 'DOC', region: 'Abruzzo', grapes: 'Montepulciano', color: 'rosso' },
  'trebbiano d\'abruzzo': { type: 'DOC', region: 'Abruzzo', grapes: 'Trebbiano', color: 'bianco' },
  'pecorino': { type: 'DOC', region: 'Abruzzo', grapes: 'Pecorino', color: 'bianco' },
  'falerio': { type: 'DOC', region: 'Marche', grapes: 'Pecorino, Passerina', color: 'bianco' },
  'lambrusco': { type: 'DOC', region: 'Emilia-Romagna', grapes: 'Lambrusco', color: 'rosso' },
  'pignoletto': { type: 'DOC', region: 'Emilia-Romagna', grapes: 'Pignoletto (Grechetto Gentile)', color: 'bianco' },
  'sangiovese': { type: 'DOC', region: 'Emilia-Romagna', grapes: 'Sangiovese', color: 'rosso' },
  'cannonau': { type: 'DOC', region: 'Sardegna', grapes: 'Cannonau (Grenache)', color: 'rosso' },
  'cannonau di sardegna': { type: 'DOC', region: 'Sardegna', grapes: 'Cannonau', color: 'rosso' },
  'gewurztraminer': { type: 'DOC', region: 'Trentino-Alto Adige', grapes: 'Gewürztraminer', color: 'bianco' },
  'muller thurgau': { type: 'DOC', region: 'Trentino-Alto Adige', grapes: 'Müller-Thurgau', color: 'bianco' },
  'lagrein': { type: 'DOC', region: 'Trentino-Alto Adige', grapes: 'Lagrein', color: 'rosso' },
  'pinot grigio': { type: 'DOC', region: 'Trentino-Alto Adige', grapes: 'Pinot Grigio', color: 'bianco' },
  'pinot nero': { type: 'DOC', region: 'Trentino-Alto Adige', grapes: 'Pinot Nero', color: 'rosso' },
  'ribolla gialla': { type: 'DOC', region: 'Friuli Venezia Giulia', grapes: 'Ribolla Gialla', color: 'bianco' },
  'friulano': { type: 'DOC', region: 'Friuli Venezia Giulia', grapes: 'Friulano (Tocai)', color: 'bianco' },
  'tocai': { type: 'DOC', region: 'Friuli Venezia Giulia', grapes: 'Friulano (Tocai)', color: 'bianco' },
  'lison': { type: 'DOC', region: 'Veneto', grapes: 'Tai (Friulano)', color: 'bianco' },
  'tai': { type: 'DOC', region: 'Veneto', grapes: 'Tai', color: 'bianco' },
  'aglianico': { type: 'DOC', region: 'Campania', grapes: 'Aglianico', color: 'rosso' },
  'taurasi': { type: 'DOCG', region: 'Campania', grapes: 'Aglianico', color: 'rosso' },
  'fiano': { type: 'DOC', region: 'Campania', grapes: 'Fiano', color: 'bianco' },
  'fiano di avellino': { type: 'DOCG', region: 'Campania', grapes: 'Fiano', color: 'bianco' },
  'greco di tufo': { type: 'DOCG', region: 'Campania', grapes: 'Greco', color: 'bianco' },
  'falanghina': { type: 'DOC', region: 'Campania', grapes: 'Falanghina', color: 'bianco' },
  'sagrantino': { type: 'DOCG', region: 'Umbria', grapes: 'Sagrantino', color: 'rosso' },
  'montefalco sagrantino': { type: 'DOCG', region: 'Umbria', grapes: 'Sagrantino', color: 'rosso' },
  'orvieto': { type: 'DOC', region: 'Umbria', grapes: 'Grechetto, Trebbiano', color: 'bianco' },
  'bolgheri': { type: 'DOC', region: 'Toscana', grapes: 'Cabernet Sauvignon, Merlot', color: 'rosso' },
  'nobile di montepulciano': { type: 'DOCG', region: 'Toscana', grapes: 'Sangiovese (Prugnolo Gentile)', color: 'rosso' },
  'vernaccia di san gimignano': { type: 'DOCG', region: 'Toscana', grapes: 'Vernaccia', color: 'bianco' },
  'morellino di scansano': { type: 'DOCG', region: 'Toscana', grapes: 'Sangiovese', color: 'rosso' },
  'rosso di montalcino': { type: 'DOC', region: 'Toscana', grapes: 'Sangiovese', color: 'rosso' },
  'gavi': { type: 'DOCG', region: 'Piemonte', grapes: 'Cortese', color: 'bianco' },
  'roero arneis': { type: 'DOCG', region: 'Piemonte', grapes: 'Arneis', color: 'bianco' },
  'arneis': { type: 'DOCG', region: 'Piemonte', grapes: 'Arneis', color: 'bianco' },
  'barbera d\'asti': { type: 'DOCG', region: 'Piemonte', grapes: 'Barbera', color: 'rosso' },
  'barbera d\'alba': { type: 'DOC', region: 'Piemonte', grapes: 'Barbera', color: 'rosso' },
  'dolcetto': { type: 'DOC', region: 'Piemonte', grapes: 'Dolcetto', color: 'rosso' },
  'nebbiolo': { type: 'DOC', region: 'Piemonte', grapes: 'Nebbiolo', color: 'rosso' },
  'langhe': { type: 'DOC', region: 'Piemonte', grapes: 'Nebbiolo, Barbera', color: 'rosso' },
  'moscato d\'asti': { type: 'DOCG', region: 'Piemonte', grapes: 'Moscato Bianco', color: 'bollicine' },
  'asti': { type: 'DOCG', region: 'Piemonte', grapes: 'Moscato Bianco', color: 'bollicine' },
  'breganze': { type: 'DOC', region: 'Veneto', grapes: 'Tai, Pinot Bianco, Vespaiola', color: 'bianco' },
  'torcolato': { type: 'DOC', region: 'Veneto', grapes: 'Vespaiola', color: 'bianco' },
  'passerina': { type: 'DOC', region: 'Marche', grapes: 'Passerina', color: 'bianco' },
  'cerasuolo d\'abruzzo': { type: 'DOC', region: 'Abruzzo', grapes: 'Montepulciano', color: 'rosato' },
  'cirò': { type: 'DOC', region: 'Calabria', grapes: 'Gaglioppo', color: 'rosso' },
  'aglianico del vulture': { type: 'DOC', region: 'Basilicata', grapes: 'Aglianico', color: 'rosso' },
};

const COLOR_TO_CATEGORY: Record<string, string> = {
  'rosso': 'Vini Rossi',
  'bianco': 'Vini Bianchi',
  'rosato': 'Vini Rosati',
  'bollicine': 'Bollicine',
};

const GRAPE_REGIONS: Record<string, string> = {
  'nebbiolo': 'Piemonte', 'barbera': 'Piemonte', 'dolcetto': 'Piemonte', 'arneis': 'Piemonte', 'cortese': 'Piemonte',
  'sangiovese': 'Toscana', 'trebbiano': 'Toscana', 'vernaccia': 'Toscana',
  'corvina': 'Veneto', 'garganega': 'Veneto', 'glera': 'Veneto', 'tai': 'Veneto',
  'nero d\'avola': 'Sicilia', 'nerello mascalese': 'Sicilia', 'carricante': 'Sicilia', 'grillo': 'Sicilia', 'catarratto': 'Sicilia',
  'primitivo': 'Puglia', 'negroamaro': 'Puglia', 'bombino nero': 'Puglia',
  'montepulciano': 'Abruzzo', 'pecorino': 'Abruzzo', 'passerina': 'Marche',
  'aglianico': 'Campania', 'fiano': 'Campania', 'falanghina': 'Campania', 'greco': 'Campania',
  'cannonau': 'Sardegna', 'vermentino': 'Sardegna', 'carignano': 'Sardegna',
  'lagrein': 'Trentino-Alto Adige', 'gewurztraminer': 'Trentino-Alto Adige', 'muller thurgau': 'Trentino-Alto Adige',
  'friulano': 'Friuli Venezia Giulia', 'ribolla gialla': 'Friuli Venezia Giulia', 'picolit': 'Friuli Venezia Giulia',
  'sagrantino': 'Umbria', 'grechetto': 'Umbria',
  'lambrusco': 'Emilia-Romagna', 'pignoletto': 'Emilia-Romagna',
  'gaglioppo': 'Calabria',
  'chardonnay': '', 'pinot grigio': '', 'pinot nero': '', 'cabernet sauvignon': '', 'merlot': '', 'sauvignon blanc': '',
};

/* ── Search logic ──────────────────────────────────────── */

function searchWineInfo(name: string): { data: Partial<ProductData>; foundFields: string[] } {
  const lower = name.toLowerCase().trim();
  const data: Partial<ProductData> = { nome: name, nazione: 'Italia', formato: '75 cl', allergeni: 'Contiene solfiti' };
  const found: string[] = ['nome', 'nazione', 'formato', 'allergeni'];

  // Extract vintage year
  const yearMatch = lower.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    data.annata = yearMatch[0];
    found.push('annata');
  }

  // Extract denomination from name (longest match first)
  const sortedDenoms = Object.keys(DENOMINATION_MAP).sort((a, b) => b.length - a.length);
  for (const denom of sortedDenoms) {
    if (lower.includes(denom)) {
      const info = DENOMINATION_MAP[denom];
      data.denominazione = `${denom.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} ${info.type}`;
      found.push('denominazione');
      data.regione = info.region;
      found.push('regione');
      if (info.grapes) {
        data.uvaggio = info.grapes;
        found.push('uvaggio');
      }
      if (info.color && COLOR_TO_CATEGORY[info.color]) {
        data.categoria = COLOR_TO_CATEGORY[info.color];
        found.push('categoria');
      }
      break;
    }
  }

  // If no denomination found, try grape varieties
  if (!data.uvaggio) {
    const sortedGrapes = Object.keys(GRAPE_REGIONS).sort((a, b) => b.length - a.length);
    for (const grape of sortedGrapes) {
      if (lower.includes(grape)) {
        data.uvaggio = grape.charAt(0).toUpperCase() + grape.slice(1);
        found.push('uvaggio');
        if (!data.regione && GRAPE_REGIONS[grape]) {
          data.regione = GRAPE_REGIONS[grape];
          found.push('regione');
        }
        break;
      }
    }
  }

  // Detect color from keywords
  if (!data.categoria) {
    if (lower.includes('rosso') || lower.includes('riserva')) { data.categoria = 'Vini Rossi'; found.push('categoria'); }
    else if (lower.includes('bianco') || lower.includes('blanc')) { data.categoria = 'Vini Bianchi'; found.push('categoria'); }
    else if (lower.includes('rosato') || lower.includes('rosé') || lower.includes('cerasuolo')) { data.categoria = 'Vini Rosati'; found.push('categoria'); }
    else if (lower.includes('spumante') || lower.includes('brut') || lower.includes('frizzante') || lower.includes('metodo classico')) { data.categoria = 'Bollicine'; found.push('categoria'); }
  }

  // Detect IGT/DOC/DOCG in name if not found via denomination map
  if (!data.denominazione) {
    if (lower.includes('docg')) { data.denominazione = 'DOCG'; found.push('denominazione'); }
    else if (lower.includes('doc')) { data.denominazione = 'DOC'; found.push('denominazione'); }
    else if (lower.includes('igt')) { data.denominazione = 'IGT'; found.push('denominazione'); }
  }

  // Set default serving temp based on category
  if (data.categoria === 'Vini Rossi') {
    data.temperaturaServizio = '16-18°C';
    found.push('temperaturaServizio');
  } else if (data.categoria === 'Vini Bianchi' || data.categoria === 'Vini Rosati') {
    data.temperaturaServizio = '8-10°C';
    found.push('temperaturaServizio');
  } else if (data.categoria === 'Bollicine') {
    data.temperaturaServizio = '6-8°C';
    found.push('temperaturaServizio');
  }

  // Default desc
  const parts = [data.uvaggio, data.denominazione, data.regione].filter(Boolean);
  if (parts.length > 0) {
    data.descBreve = `${name} — ${parts.join(', ')}. Vino italiano di qualità.`;
    found.push('descBreve');
  }

  return { data, foundFields: [...new Set(found)] };
}

/* ── Parse structured text — direct field matching ─────── */

function parseText(text: string, data: Partial<ProductData>, found: string[]): void {

  // Direct field matchers: "Label: value" or "Label:\nvalue"
  const fieldPatterns: { field: keyof ProductData; patterns: RegExp[] }[] = [
    { field: 'produttore', patterns: [/(?:produttore|cantina|azienda)[:\s]+([^\n]+)/i] },
    { field: 'categoria', patterns: [/(?:categoria|tipologia)[:\s]+([^\n]+)/i] },
    { field: 'denominazione', patterns: [/(?:denominazione|doc|docg)[:\s]+([^\n]+)/i] },
    { field: 'regione', patterns: [/(?:regione)[:\s]+([^\n]+)/i] },
    { field: 'nazione', patterns: [/(?:nazione|paese)[:\s]+([^\n]+)/i] },
    { field: 'uvaggio', patterns: [/(?:uvaggio|uva|vitigno|vitigni)[:\s]+([^\n]+)/i] },
    { field: 'gradazione', patterns: [/(?:gradazione|alcol|gradazione alcolica)[:\s]+([^\n]+)/i] },
    { field: 'annata', patterns: [/(?:annata)[:\s]+([^\n]+)/i] },
    { field: 'formato', patterns: [/(?:formato|bottiglia)[:\s]+([^\n]+)/i] },
    { field: 'descBreve', patterns: [/(?:descrizione breve)[:\s]*\n?([^\n]+)/i] },
    { field: 'descLunga', patterns: [/(?:descrizione lunga)[:\s]*\n?([\s\S]+?)(?=\n(?:alla vista|al naso|al palato|abbinamenti|temperatura|momento|vinificazione|affinamento|terreno|esposizione|altitudine|zona|resa|vendemmia|bottiglie|certificazioni|allergeni|tag)[:\s]|\n\n|$)/i] },
    { field: 'allaVista', patterns: [/(?:alla vista)[:\s]*\n?([^\n]+(?:\n(?![A-Z])[^\n]+)*)/i] },
    { field: 'alNaso', patterns: [/(?:al naso)[:\s]*\n?([^\n]+(?:\n(?![A-Z])[^\n]+)*)/i] },
    { field: 'alPalato', patterns: [/(?:al palato)[:\s]*\n?([^\n]+(?:\n(?![A-Z])[^\n]+)*)/i] },
    { field: 'abbinamenti', patterns: [/(?:abbinamenti|abbinamento)[:\s]*\n?([^\n]+)/i] },
    { field: 'temperaturaServizio', patterns: [/(?:temperatura(?:\s+di)?\s*servizio|temperatura\s*servizio|temperatura)[:\s]+([^\n]+)/i] },
    { field: 'momentoConsumo', patterns: [/(?:momento(?:\s+di)?\s*consumo|beva|quando bere)[:\s]+([^\n]+)/i] },
    { field: 'vinificazione', patterns: [/(?:vinificazione|vinicazione)[:\s]*\n?([\s\S]+?)(?=\n(?:affinamento|terreno|esposizione|altitudine|zona|resa|vendemmia|bottiglie|certificazioni|allergeni|tag|alla vista|al naso|al palato|abbinamenti|temperatura|momento)[:\s]|\n\n|$)/i] },
    { field: 'affinamento', patterns: [/(?:affinamento|invecchiamento|maturazione)[:\s]*\n?([^\n]+(?:\n(?![A-Z])[^\n]+)*)/i] },
    { field: 'terreno', patterns: [/(?:terreno|suolo|tipo di terreno)[:\s]+([^\n]+)/i] },
    { field: 'esposizione', patterns: [/(?:esposizione)[:\s]+([^\n]+)/i] },
    { field: 'altitudine', patterns: [/(?:altitudine|quota)[:\s]+([^\n]+)/i] },
    { field: 'zonaProduzione', patterns: [/(?:zona di produzione|zona|localit[àa])[:\s]+([^\n]+)/i] },
    { field: 'resa', patterns: [/(?:resa)[:\s]+([^\n]+)/i] },
    { field: 'vendemmia', patterns: [/(?:vendemmia|raccolta)[:\s]+([^\n]+)/i] },
    { field: 'bottiglieProdotte', patterns: [/(?:bottiglie(?:\s+prodotte)?|produzione)[:\s]+([^\n]+)/i] },
    { field: 'certificazioni', patterns: [/(?:certificazioni|certificazione|bio|biodinamico)[:\s]+([^\n]+)/i] },
    { field: 'allergeni', patterns: [/(?:allergeni)[:\s]+([^\n]+)/i] },
    { field: 'tags', patterns: [/(?:tag|tags)[:\s]+([^\n]+)/i] },
  ];

  for (const { field, patterns } of fieldPatterns) {
    if (data[field]) continue; // Don't overwrite existing
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const value = match[1].trim().replace(/\s+/g, ' ');
        if (value && value.toLowerCase() !== 'n/d' && value !== '-' && value !== '') {
          (data as Record<string, string>)[field] = value;
          if (!found.includes(field)) found.push(field);
        }
        break;
      }
    }
  }

  // Fallback: extract alcohol from anywhere in text
  if (!data.gradazione) {
    const alcMatch = text.match(/(\d{1,2}[.,]\d{1,2})\s*%\s*(?:vol)?/i);
    if (alcMatch) { data.gradazione = alcMatch[1].replace(',', '.') + '% vol'; found.push('gradazione'); }
  }

  // Fallback: extract region from known names in text
  if (!data.regione) {
    const regions = ['Piemonte','Toscana','Veneto','Lombardia','Sicilia','Puglia','Campania','Abruzzo','Marche','Emilia-Romagna','Sardegna','Calabria','Umbria','Friuli Venezia Giulia','Trentino-Alto Adige','Liguria','Lazio','Basilicata','Molise'];
    const lower = text.toLowerCase();
    for (const r of regions) { if (lower.includes(r.toLowerCase())) { data.regione = r; found.push('regione'); break; } }
  }

  // Fallback: description from Caratteristiche
  if (!data.descLunga) {
    const charMatch = text.match(/(?:caratteristiche|descrizione)[:\s]+([^\n]+(?:\n[^\n]+){0,5})/i);
    if (charMatch) { data.descLunga = charMatch[1].trim().replace(/\n/g, ' ').replace(/\s+/g, ' '); found.push('descLunga'); }
  }

  // Vendemmia
  if (!data.momentoConsumo) {
    const vendMatch = text.match(/(?:vendemmia)[:\s]+([^\n;]+)/i);
    if (vendMatch) { data.momentoConsumo = vendMatch[1].trim(); }
  }
}

/* ── POST handler ──────────────────────────────────────── */

export async function POST(req: NextRequest) {
  let body: { name: string; text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON non valido' }, { status: 400 });
  }

  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'Nome prodotto obbligatorio' }, { status: 400 });
  }

  // First parse the name
  const result = searchWineInfo(body.name);

  // Then enrich with technical text if provided
  if (body.text?.trim()) {
    parseText(body.text, result.data, result.foundFields);
    // Also try parsing the name + text combined
    const combined = `${body.name} ${body.text}`;
    const combinedLower = combined.toLowerCase();
    // Re-check denominations in combined text
    if (!result.data.denominazione) {
      const sortedDenoms = Object.keys(DENOMINATION_MAP).sort((a, b) => b.length - a.length);
      for (const denom of sortedDenoms) {
        if (combinedLower.includes(denom)) {
          const info = DENOMINATION_MAP[denom];
          result.data.denominazione = `${denom.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} ${info.type}`;
          if (!result.foundFields.includes('denominazione')) result.foundFields.push('denominazione');
          if (!result.data.regione && info.region) { result.data.regione = info.region; if (!result.foundFields.includes('regione')) result.foundFields.push('regione'); }
          if (!result.data.uvaggio && info.grapes) { result.data.uvaggio = info.grapes; if (!result.foundFields.includes('uvaggio')) result.foundFields.push('uvaggio'); }
          if (!result.data.categoria && info.color && COLOR_TO_CATEGORY[info.color]) { result.data.categoria = COLOR_TO_CATEGORY[info.color]; if (!result.foundFields.includes('categoria')) result.foundFields.push('categoria'); }
          break;
        }
      }
    }
    // Generate short desc if missing
    if (!result.data.descBreve) {
      const parts = [result.data.uvaggio, result.data.denominazione, result.data.regione].filter(Boolean);
      if (parts.length > 0) {
        result.data.descBreve = `${body.name} — ${parts.join(', ')}. Vino italiano di qualità.`;
        if (!result.foundFields.includes('descBreve')) result.foundFields.push('descBreve');
      }
    }
    result.foundFields = [...new Set(result.foundFields)];
  }

  // Enhance with Claude AI for premium descriptions
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    try {
      const existingInfo = Object.entries(result.data)
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n');

      const prompt = `Sei un sommelier esperto e copywriter per un e-commerce di vini italiani premium.
Ti do le informazioni su un vino. Genera testi accattivanti, SEO-oriented, in italiano elegante.

VINO: ${body.name}
${body.text ? `SCHEDA TECNICA:\n${body.text}` : ''}
${existingInfo ? `INFO GIÀ ESTRATTE:\n${existingInfo}` : ''}

Rispondi SOLO in JSON valido con questi campi (lascia vuoto "" se non hai info sufficienti, compila il più possibile):
{
  "produttore": "nome del produttore/cantina",
  "categoria": "Vini Rossi|Vini Bianchi|Vini Rosati|Bollicine|Distillati",
  "annata": "anno es. 2022",
  "denominazione": "es. Colli Maceratesi DOC",
  "regione": "regione italiana",
  "uvaggio": "vitigni separati da virgola",
  "gradazione": "es. 13.5%",
  "formato": "es. 75 cl, 1.5 L",
  "descBreve": "max 155 caratteri, accattivante, SEO. Menziona vitigno e territorio. Stile enoteca premium.",
  "descLunga": "3-4 frasi eleganti. Racconta il vino, il territorio, il carattere. Usa parole sensoriali evocative. Stile da sommelier.",
  "allaVista": "1 frase poetica e tecnica sul colore e la limpidezza",
  "alNaso": "1 frase evocativa e dettagliata sui profumi primari, secondari e terziari",
  "alPalato": "1 frase sulla struttura, tannini, acidità, persistenza",
  "abbinamenti": "4-5 abbinamenti gastronomici specifici separati da virgola",
  "temperaturaServizio": "es. 8-10°C",
  "momentoConsumo": "es. Pronto, ottimo nei prossimi 3-5 anni",
  "vinificazione": "descrizione del processo di vinificazione",
  "affinamento": "descrizione dell'affinamento (botti, barrique, acciaio, mesi)",
  "terreno": "tipo di terreno (argilloso, calcareo, sabbioso, vulcanico...)",
  "esposizione": "esposizione del vigneto (sud, sud-est...)",
  "altitudine": "altitudine del vigneto in metri s.l.m.",
  "zonaProduzione": "zona specifica di produzione",
  "resa": "resa per ettaro es. 60-70 ql/ha",
  "vendemmia": "periodo e modalità di vendemmia",
  "bottiglieProdotte": "numero bottiglie prodotte se noto",
  "certificazioni": "Bio, Biodinamico, Vegan, SQNPI se applicabile",
  "allergeni": "Contiene solfiti (obbligatorio) + eventuali altri",
  "tags": "tag separati da virgola tra: best-seller, confezione-regalo, circuito, occasione, regali. Lascia vuoto se non applicabile"
}`;

      const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-20250414',
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (claudeRes.ok) {
        const claudeData = await claudeRes.json();
        const text = claudeData.content?.[0]?.text || '';
        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const ai: Record<string, string> = JSON.parse(jsonMatch[0]);
          // Capitalize first letter of each value
          const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
          // Only fill fields that are empty
          const fieldMap: (keyof ProductData)[] = ['produttore', 'categoria', 'annata', 'denominazione', 'regione', 'uvaggio', 'gradazione', 'formato', 'descBreve', 'descLunga', 'allaVista', 'alNaso', 'alPalato', 'abbinamenti', 'temperaturaServizio', 'momentoConsumo', 'vinificazione', 'affinamento', 'terreno', 'esposizione', 'altitudine', 'zonaProduzione', 'resa', 'vendemmia', 'bottiglieProdotte', 'certificazioni', 'allergeni', 'tags'];
          for (const field of fieldMap) {
            if (ai[field] && !result.data[field]) {
              result.data[field] = capitalize(ai[field]);
              if (!result.foundFields.includes(field)) result.foundFields.push(field);
            }
            // Override generic descriptions with AI ones
            if (ai[field] && (field === 'descBreve' || field === 'descLunga' || field === 'allaVista' || field === 'alNaso' || field === 'alPalato')) {
              result.data[field] = capitalize(ai[field]);
              if (!result.foundFields.includes(field)) result.foundFields.push(field);
            }
          }
        }
      }
    } catch (aiErr) {
      console.error('Claude AI enrichment failed (non-blocking):', aiErr);
    }
  }

  // Capitalize first letter of all text fields
  const textFields: (keyof ProductData)[] = ['descBreve', 'descLunga', 'allaVista', 'alNaso', 'alPalato', 'vinificazione', 'affinamento', 'abbinamenti', 'terreno', 'esposizione', 'zonaProduzione', 'vendemmia'];
  for (const f of textFields) {
    if (result.data[f]) {
      result.data[f] = result.data[f]!.charAt(0).toUpperCase() + result.data[f]!.slice(1);
    }
  }

  result.foundFields = [...new Set(result.foundFields)];
  return NextResponse.json(result);
}
