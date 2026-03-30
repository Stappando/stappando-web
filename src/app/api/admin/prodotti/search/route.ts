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

/* ── POST handler ──────────────────────────────────────── */

export async function POST(req: NextRequest) {
  let body: { name: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON non valido' }, { status: 400 });
  }

  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'Nome prodotto obbligatorio' }, { status: 400 });
  }

  const result = searchWineInfo(body.name);

  return NextResponse.json(result);
}
