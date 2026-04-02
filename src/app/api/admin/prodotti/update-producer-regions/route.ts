import { NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';

export const dynamic = 'force-dynamic';

/* slug → regione */
const PRODUCER_REGION: Record<string, string> = {
  'di-cicco': 'Abruzzo', 'cantina-pietrantonj': 'Abruzzo', 'scuppoz': 'Abruzzo',
  'castelsimoni-cantina-vini-montagna-abruzzo': 'Abruzzo', 'cutina-liquori': 'Abruzzo',
  'masciarelli': 'Abruzzo', 'camilla-montori': 'Abruzzo', 'diubaldo': 'Abruzzo',
  'lidia-amato': 'Abruzzo', 'cataldi-madonna-cantina-biologica-abruzzo': 'Abruzzo',
  'pasetti': 'Abruzzo', 'zaccagnini': 'Abruzzo',
  'la-sastreria': 'Aragona',
  'cantina-del-notaio': 'Basilicata', 'petracastalda': 'Basilicata', 'amaro-lucano': 'Basilicata',
  'albert-pic': 'Borgogna',
  'caffo': 'Calabria', 'statti': 'Calabria', 'cantine-vincenzo-ippolito': 'Calabria',
  'casale-cappellieri': 'Calabria', 'maddalona-del-casato': 'Calabria',
  'vecchio-magazzino-doganale': 'Calabria', 'essentia-mediterranea': 'Calabria',
  'cantina-moio': 'Campania', 'mastroberardino': 'Campania', 'petra-marzia': 'Campania',
  'torricino': 'Campania', 'amphoreus': 'Campania', 'vinicola-del-sannio': 'Campania',
  'casa-dambra': 'Campania', 'di-meo': 'Campania', 'montevetrano': 'Campania',
  'tenuta-le-lune-del-vesuvio': 'Campania', 'alberti': 'Campania',
  'veuve-cliquot': 'Champagne', 'perrier-jouet': 'Champagne', 'moet-chandon': 'Champagne',
  'ruinart': 'Champagne', 'bollinger': 'Champagne', 'veuve-pelletier': 'Champagne',
  'billecart-salmon': 'Champagne', 'dalamotte': 'Champagne', 'laurent-perrier': 'Champagne',
  'louis-roederer': 'Champagne', 'tattinger': 'Champagne', 'ayala': 'Champagne',
  'courvoisier': 'Charente', 'francois-peyrot': 'Charente',
  'merlotta': 'Emilia - Romagna', 'cantina-divinja': 'Emilia - Romagna',
  'gruppo-montenegro': 'Emilia - Romagna', 'tenuta-forcirola': 'Emilia - Romagna',
  'biancosarti': 'Emilia - Romagna',
  'corte-della-contea': 'Friuli Venezia Giulia', 'jermann': 'Friuli Venezia Giulia',
  'marco-felluga': 'Friuli Venezia Giulia', 'livio-felluga': 'Friuli Venezia Giulia',
  'candolini': 'Friuli Venezia Giulia', 'nonino': 'Friuli Venezia Giulia',
  'francois-montand': 'Jura',
  'jp-chenet': 'Languedoc - Roussillon',
  'villa-gianna': 'Lazio', 'casale-del-giglio': 'Lazio', 'pallini': 'Lazio',
  'poggio-le-volpi': 'Lazio', 'antonella-pacchiarotti': 'Lazio', 'casale-mattia': 'Lazio',
  'proietti': 'Lazio', 'cantina-bacco': 'Lazio', 'cantina-di-montefiascone': 'Lazio',
  'de-marco': 'Lazio', 'federici': 'Lazio', 'sergio-mottura': 'Lazio',
  'cincinnato': 'Lazio', 'falesco': 'Lazio', 'molinari': 'Lazio', 'tarchna': 'Lazio',
  'distilleria-numa': 'Lazio', 'famiglia-cotarella': 'Lazio', 'gabriele-magno': 'Lazio',
  'lolivella': 'Lazio', 'logindry': 'Lazio', 'san-giovenale': 'Lazio',
  'stefanoni': 'Lazio', 'tenuta-le-quinte': 'Lazio',
  'cinqueterre': 'Liguria', 'terenzuola': 'Liguria', 'bisson': 'Liguria', 'portofino': 'Liguria',
  'dune-premium-cocktails': 'Lombardia', 'castel-faglia': 'Lombardia', 'barbalonga': 'Lombardia',
  'berlucchi': 'Lombardia', 'campari': 'Lombardia', 'bellavista': 'Lombardia',
  'fratelli-branca': 'Lombardia', 'contadi-castaldi': 'Lombardia', 'quaquarini-2': 'Lombardia',
  'bisleri': 'Lombardia', 'la-poggiolo': 'Lombardia', 'tumbler-srl': 'Lombardia',
  'piersanti': 'Marche', 'umani-e-ronchi': 'Marche', 'varnelli': 'Marche',
  'le-cime-basse-s-s': 'Marche', 'belisario': 'Marche', 'velenosi': 'Marche',
  '120montebianco': 'Marche', 'borghetti': 'Marche', 'fazi-battaglia': 'Marche',
  'ottavio-piersanti': 'Marche', 'tenute-polini': 'Marche',
  'chateau-du-breil': 'Normandia',
  'marolo': 'Piemonte', 'balbi-soprani': 'Piemonte', 'fratelli-giacosa': 'Piemonte',
  'berta': 'Piemonte', 'ceretto-cantina-langhe-vini-biologici': 'Piemonte',
  'martini': 'Piemonte', 'azienda-agricola-alciati-giancarlo': 'Piemonte',
  'bosca': 'Piemonte', 'duchessa-lia': 'Piemonte', 'claudio-alario': 'Piemonte',
  'distillerie-quaglia': 'Piemonte', 'toselli': 'Piemonte', 'antica-torino': 'Piemonte',
  'carpano': 'Piemonte', 'engine': 'Piemonte', 'travaglini': 'Piemonte',
  'vigne-marina-coppi': 'Piemonte', 'villa-ascenti': 'Piemonte',
  'chateau-desclans': 'Provenza',
  'san-marzano': 'Puglia', 'teanum': 'Puglia', 'apollonio-1870': 'Puglia',
  'scarpello': 'Puglia', 'marzodd': 'Puglia', 'mottura': 'Puglia',
  'terre-aprica': 'Puglia', 'conte-di-campiano': 'Puglia', 'leone-de-castris': 'Puglia',
  'tormaresca': 'Puglia',
  'cantina-santa-maria-la-palma-alghero': 'Sardegna', 'argiolas': 'Sardegna',
  'agricola-giacu': 'Sardegna', 'cantina-li-seddi': 'Sardegna', 'capichera': 'Sardegna',
  'piero-mancini': 'Sardegna', 'sella-mosca': 'Sardegna', 'zedda-piras': 'Sardegna',
  'ichnusa': 'Sardegna', 'cantina-gallura': 'Sardegna', 'contini': 'Sardegna',
  'tenute-centu-e-prusu': 'Sardegna',
  'azienda-vitivinicola-tola': 'Sicilia', 'quattrocieli': 'Sicilia', 'madaudo': 'Sicilia',
  'cusumano': 'Sicilia', 'rossa': 'Sicilia', 'tenuta-le-palme': 'Sicilia',
  'donnafugata': 'Sicilia', 'terre-dellisola': 'Sicilia', 'giovinco': 'Sicilia',
  'panarea': 'Sicilia', 'tasca-dalmerita': 'Sicilia', 'averna': 'Sicilia',
  'hauner': 'Sicilia', 'palmento-costanzo': 'Sicilia', 'planeta': 'Sicilia',
  'banfi': 'Toscana', 'marchesi-antinori': 'Toscana', 'carpineto': 'Toscana',
  'luteraia': 'Toscana', 'sensi': 'Toscana', 'cantina-di-pitigliano': 'Toscana',
  'barbanera': 'Toscana', 'birrificio-san-quirico': 'Toscana',
  'casagrande-della-quercia': 'Toscana', 'terre-del-marchesato': 'Toscana',
  'erik-banti': 'Toscana', 'san-felice': 'Toscana', 'tenuta-dellornellaia': 'Toscana',
  'tenuta-san-guido': 'Toscana', 'borghi-fioriti': 'Toscana',
  'castelli-del-grevepesa': 'Toscana', 'duca-di-saragnano': 'Toscana',
  'fattoria-di-calappiano': 'Toscana', 'gualdo-del-re': 'Toscana',
  'il-puledro': 'Toscana', 'san-zenone': 'Toscana',
  'colterenzio': 'Trentino - Alto Adige', 'san-michele-appiano': 'Trentino - Alto Adige',
  'k-martini-sohn': 'Trentino - Alto Adige', 'elena-walch': 'Trentino - Alto Adige',
  'ferrari': 'Trentino - Alto Adige', 'altemasi': 'Trentino - Alto Adige',
  'lungarotti': 'Umbria', 'pomario': 'Umbria', 'azienda-agricola-il-poggiolo': 'Umbria',
  'favaroni': 'Umbria', 'casale-triocco': 'Umbria', 'leonucci': 'Umbria',
  'pizzogallo': 'Umbria', 'cantina-dei-colli-amerini': 'Umbria',
  'crotta-de-vigneron': "Valle d'Aosta", 'savio': "Valle d'Aosta",
  'cointreau': 'Valle della Loira',
  'montagner': 'Veneto', 'mazzolada': 'Veneto', 'casa-defra': 'Veneto',
  'distillerie-poli': 'Veneto', 'cielo-e-terra': 'Veneto', 'barbieri': 'Veneto',
  'borgo-antico': 'Veneto', 'bonollo': 'Veneto', 'luxardo': 'Veneto',
  'monte-tondo': 'Veneto', 'contessa-carola': 'Veneto', 'zenato': 'Veneto',
  'bonaventura-maschio': 'Veneto', 'contri-spumanti': 'Veneto', 'gambrinus': 'Veneto',
};

interface WCTerm { id: number; name: string; slug: string; description: string }

/**
 * POST /api/admin/prodotti/update-producer-regions
 * Updates the description of each pa_produttore term in WC with its region.
 */
export async function POST() {
  const wc = getWCSecrets();
  const auth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;

  try {
    // 1. Find pa_produttore attribute ID
    const attrsRes = await fetch(`${wc.baseUrl}/wp-json/wc/v3/products/attributes?per_page=100&${auth}`);
    if (!attrsRes.ok) return NextResponse.json({ error: 'Cannot fetch attributes' }, { status: 502 });
    const attrs: { id: number; slug: string }[] = await attrsRes.json();
    const produttoreAttr = attrs.find(a => a.slug === 'produttore' || a.slug === 'pa_produttore');
    if (!produttoreAttr) return NextResponse.json({ error: 'pa_produttore attribute not found' }, { status: 404 });

    const attrId = produttoreAttr.id;

    // 2. Fetch ALL terms (paginate)
    let allTerms: WCTerm[] = [];
    let page = 1;
    while (true) {
      const res = await fetch(`${wc.baseUrl}/wp-json/wc/v3/products/attributes/${attrId}/terms?per_page=100&page=${page}&${auth}`);
      if (!res.ok) break;
      const batch: WCTerm[] = await res.json();
      allTerms = [...allTerms, ...batch];
      if (batch.length < 100) break;
      page++;
    }

    const updated: string[] = [];
    const skipped: string[] = [];
    const notFound: string[] = [];

    // 3. For each term, check if we have a region and update description
    for (const term of allTerms) {
      const region = PRODUCER_REGION[term.slug];
      if (!region) {
        notFound.push(term.slug);
        continue;
      }
      if (term.description === region) {
        skipped.push(term.name);
        continue;
      }
      const patchRes = await fetch(
        `${wc.baseUrl}/wp-json/wc/v3/products/attributes/${attrId}/terms/${term.id}?${auth}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description: region }),
        },
      );
      if (patchRes.ok) {
        updated.push(`${term.name} → ${region}`);
      } else {
        notFound.push(`FAIL: ${term.name}`);
      }
    }

    return NextResponse.json({
      updated: updated.length,
      skipped: skipped.length,
      notFound: notFound.length,
      updatedList: updated,
      notFoundList: notFound,
    });
  } catch (err) {
    console.error('update-producer-regions error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
