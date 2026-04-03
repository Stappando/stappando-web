/**
 * Bulk update producer regions (and optionally addresses) via stp-app/v1/update-producer-meta.
 * Run with: node scripts/bulk-update-regions.mjs
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const WC_BASE_URL = process.env.WC_BASE_URL || 'https://stappando.it';
const WC_CK = process.env.WC_CONSUMER_KEY;
const WC_CS = process.env.WC_CONSUMER_SECRET;
const WP_USER = process.env.WP_ADMIN_USER || process.env.WP_USER;
const WP_PASS = process.env.WP_ADMIN_APP_PASSWORD || process.env.WP_APP_PASSWORD;

const wpAuth = Buffer.from(`${WP_USER}:${WP_PASS}`).toString('base64');
const wcAuth = `consumer_key=${WC_CK}&consumer_secret=${WC_CS}`;

// ── Producer data: slug → region ──
const PRODUCERS = [
  { slug: 'di-cicco', region: 'Abruzzo' },
  { slug: 'cantina-pietrantonj', region: 'Abruzzo' },
  { slug: 'scuppoz', region: 'Abruzzo' },
  { slug: 'castelsimoni-cantina-vini-montagna-abruzzo', region: 'Abruzzo' },
  { slug: 'cutina-liquori', region: 'Abruzzo' },
  { slug: 'masciarelli', region: 'Abruzzo' },
  { slug: 'camilla-montori', region: 'Abruzzo' },
  { slug: 'diubaldo', region: 'Abruzzo' },
  { slug: 'lidia-amato', region: 'Abruzzo' },
  { slug: 'cataldi-madonna-cantina-biologica-abruzzo', region: 'Abruzzo' },
  { slug: 'pasetti', region: 'Abruzzo' },
  { slug: 'zaccagnini', region: 'Abruzzo' },
  { slug: 'la-sastreria', region: 'Aragona' },
  { slug: 'cantina-del-notaio', region: 'Basilicata' },
  { slug: 'petracastalda', region: 'Basilicata' },
  { slug: 'amaro-lucano', region: 'Basilicata' },
  { slug: 'albert-pic', region: 'Borgogna' },
  { slug: 'caffo', region: 'Calabria' },
  { slug: 'statti', region: 'Calabria' },
  { slug: 'cantine-vincenzo-ippolito', region: 'Calabria' },
  { slug: 'casale-cappellieri', region: 'Calabria' },
  { slug: 'maddalona-del-casato', region: 'Calabria' },
  { slug: 'vecchio-magazzino-doganale', region: 'Calabria' },
  { slug: 'essentia-mediterranea', region: 'Calabria' },
  { slug: 'cantina-moio', region: 'Campania' },
  { slug: 'mastroberardino', region: 'Campania' },
  { slug: 'petra-marzia', region: 'Campania' },
  { slug: 'torricino', region: 'Campania' },
  { slug: 'amphoreus', region: 'Campania' },
  { slug: 'vinicola-del-sannio', region: 'Campania' },
  { slug: 'casa-dambra', region: 'Campania' },
  { slug: 'di-meo', region: 'Campania' },
  { slug: 'montevetrano', region: 'Campania' },
  { slug: 'tenuta-le-lune-del-vesuvio', region: 'Campania' },
  { slug: 'alberti', region: 'Campania' },
  { slug: 'veuve-cliquot', region: 'Champagne' },
  { slug: 'perrier-jouet', region: 'Champagne' },
  { slug: 'moet-chandon', region: 'Champagne' },
  { slug: 'ruinart', region: 'Champagne' },
  { slug: 'bollinger', region: 'Champagne' },
  { slug: 'veuve-pelletier', region: 'Champagne' },
  { slug: 'billecart-salmon', region: 'Champagne' },
  { slug: 'dalamotte', region: 'Champagne' },
  { slug: 'laurent-perrier', region: 'Champagne' },
  { slug: 'louis-roederer', region: 'Champagne' },
  { slug: 'tattinger', region: 'Champagne' },
  { slug: 'ayala', region: 'Champagne' },
  { slug: 'courvoisier', region: 'Charente' },
  { slug: 'francois-peyrot', region: 'Charente' },
  { slug: 'merlotta', region: 'Emilia-Romagna' },
  { slug: 'cantina-divinja', region: 'Emilia-Romagna' },
  { slug: 'gruppo-montenegro', region: 'Emilia-Romagna' },
  { slug: 'tenuta-forcirola', region: 'Emilia-Romagna' },
  { slug: 'biancosarti', region: 'Emilia-Romagna' },
  { slug: 'corte-della-contea', region: 'Friuli Venezia Giulia' },
  { slug: 'jermann', region: 'Friuli Venezia Giulia' },
  { slug: 'marco-felluga', region: 'Friuli Venezia Giulia' },
  { slug: 'livio-felluga', region: 'Friuli Venezia Giulia' },
  { slug: 'candolini', region: 'Friuli Venezia Giulia' },
  { slug: 'nonino', region: 'Friuli Venezia Giulia' },
  { slug: 'francois-montand', region: 'Jura' },
  { slug: 'jp-chenet', region: 'Languedoc-Roussillon' },
  { slug: 'villa-gianna', region: 'Lazio' },
  { slug: 'casale-del-giglio', region: 'Lazio' },
  { slug: 'pallini', region: 'Lazio' },
  { slug: 'poggio-le-volpi', region: 'Lazio' },
  { slug: 'antonella-pacchiarotti', region: 'Lazio' },
  { slug: 'casale-mattia', region: 'Lazio' },
  { slug: 'proietti', region: 'Lazio' },
  { slug: 'cantina-bacco', region: 'Lazio' },
  { slug: 'cantina-di-montefiascone', region: 'Lazio' },
  { slug: 'de-marco', region: 'Lazio' },
  { slug: 'federici', region: 'Lazio' },
  { slug: 'sergio-mottura', region: 'Lazio' },
  { slug: 'cincinnato', region: 'Lazio' },
  { slug: 'falesco', region: 'Lazio' },
  { slug: 'molinari', region: 'Lazio' },
  { slug: 'tarchna', region: 'Lazio' },
  { slug: 'distilleria-numa', region: 'Lazio' },
  { slug: 'famiglia-cotarella', region: 'Lazio' },
  { slug: 'gabriele-magno', region: 'Lazio' },
  { slug: 'lolivella', region: 'Lazio' },
  { slug: 'logindry', region: 'Lazio' },
  { slug: 'san-giovenale', region: 'Lazio' },
  { slug: 'stefanoni', region: 'Lazio' },
  { slug: 'tenuta-le-quinte', region: 'Lazio' },
  { slug: 'cinqueterre', region: 'Liguria' },
  { slug: 'terenzuola', region: 'Liguria' },
  { slug: 'bisson', region: 'Liguria' },
  { slug: 'portofino', region: 'Liguria' },
  { slug: 'dune-premium-cocktails', region: 'Lombardia' },
  { slug: 'castel-faglia', region: 'Lombardia' },
  { slug: 'barbalonga', region: 'Lombardia' },
  { slug: 'berlucchi', region: 'Lombardia' },
  { slug: 'campari', region: 'Lombardia' },
  { slug: 'bellavista', region: 'Lombardia' },
  { slug: 'fratelli-branca', region: 'Lombardia' },
  { slug: 'contadi-castaldi', region: 'Lombardia' },
  { slug: 'quaquarini-2', region: 'Lombardia' },
  { slug: 'bisleri', region: 'Lombardia' },
  { slug: 'la-poggiolo', region: 'Lombardia' },
  { slug: 'tumbler-srl', region: 'Lombardia' },
  { slug: 'piersanti', region: 'Marche' },
  { slug: 'umani-e-ronchi', region: 'Marche' },
  { slug: 'varnelli', region: 'Marche' },
  { slug: 'le-cime-basse-s-s', region: 'Marche' },
  { slug: 'belisario', region: 'Marche' },
  { slug: 'velenosi', region: 'Marche' },
  { slug: '120montebianco', region: 'Marche' },
  { slug: 'borghetti', region: 'Marche' },
  { slug: 'fazi-battaglia', region: 'Marche' },
  { slug: 'ottavio-piersanti', region: 'Marche' },
  { slug: 'tenute-polini', region: 'Marche' },
  { slug: 'chateau-du-breil', region: 'Normandia' },
  { slug: 'marolo', region: 'Piemonte' },
  { slug: 'balbi-soprani', region: 'Piemonte' },
  { slug: 'fratelli-giacosa', region: 'Piemonte' },
  { slug: 'berta', region: 'Piemonte' },
  { slug: 'ceretto-cantina-langhe-vini-biologici', region: 'Piemonte' },
  { slug: 'martini', region: 'Piemonte' },
  { slug: 'azienda-agricola-alciati-giancarlo', region: 'Piemonte' },
  { slug: 'bosca', region: 'Piemonte' },
  { slug: 'duchessa-lia', region: 'Piemonte' },
  { slug: 'claudio-alario', region: 'Piemonte' },
  { slug: 'distillerie-quaglia', region: 'Piemonte' },
  { slug: 'toselli', region: 'Piemonte' },
  { slug: 'antica-torino', region: 'Piemonte' },
  { slug: 'carpano', region: 'Piemonte' },
  { slug: 'engine', region: 'Piemonte' },
  { slug: 'travaglini', region: 'Piemonte' },
  { slug: 'vigne-marina-coppi', region: 'Piemonte' },
  { slug: 'villa-ascenti', region: 'Piemonte' },
  { slug: 'chateau-desclans', region: 'Provenza' },
  { slug: 'san-marzano', region: 'Puglia' },
  { slug: 'teanum', region: 'Puglia' },
  { slug: 'apollonio-1870', region: 'Puglia' },
  { slug: 'scarpello', region: 'Puglia' },
  { slug: 'marzodd', region: 'Puglia' },
  { slug: 'mottura', region: 'Puglia' },
  { slug: 'terre-aprica', region: 'Puglia' },
  { slug: 'conte-di-campiano', region: 'Puglia' },
  { slug: 'leone-de-castris', region: 'Puglia' },
  { slug: 'tormaresca', region: 'Puglia' },
  { slug: 'cantina-santa-maria-la-palma-alghero', region: 'Sardegna' },
  { slug: 'argiolas', region: 'Sardegna' },
  { slug: 'agricola-giacu', region: 'Sardegna' },
  { slug: 'cantina-li-seddi', region: 'Sardegna' },
  { slug: 'capichera', region: 'Sardegna' },
  { slug: 'piero-mancini', region: 'Sardegna' },
  { slug: 'sella-mosca', region: 'Sardegna' },
  { slug: 'zedda-piras', region: 'Sardegna' },
  { slug: 'ichnusa', region: 'Sardegna' },
  { slug: 'cantina-gallura', region: 'Sardegna' },
  { slug: 'contini', region: 'Sardegna' },
  { slug: 'tenute-centu-e-prusu', region: 'Sardegna' },
  { slug: 'azienda-vitivinicola-tola', region: 'Sicilia' },
  { slug: 'quattrocieli', region: 'Sicilia' },
  { slug: 'madaudo', region: 'Sicilia' },
  { slug: 'cusumano', region: 'Sicilia' },
  { slug: 'rossa', region: 'Sicilia' },
  { slug: 'tenuta-le-palme', region: 'Sicilia' },
  { slug: 'donnafugata', region: 'Sicilia' },
  { slug: 'terre-dellisola', region: 'Sicilia' },
  { slug: 'giovinco', region: 'Sicilia' },
  { slug: 'panarea', region: 'Sicilia' },
  { slug: 'tasca-dalmerita', region: 'Sicilia' },
  { slug: 'averna', region: 'Sicilia' },
  { slug: 'hauner', region: 'Sicilia' },
  { slug: 'palmento-costanzo', region: 'Sicilia' },
  { slug: 'planeta', region: 'Sicilia' },
  { slug: 'banfi', region: 'Toscana' },
  { slug: 'marchesi-antinori', region: 'Toscana' },
  { slug: 'carpineto', region: 'Toscana' },
  { slug: 'luteraia', region: 'Toscana' },
  { slug: 'sensi', region: 'Toscana' },
  { slug: 'cantina-di-pitigliano', region: 'Toscana' },
  { slug: 'barbanera', region: 'Toscana' },
  { slug: 'birrificio-san-quirico', region: 'Toscana' },
  { slug: 'casagrande-della-quercia', region: 'Toscana' },
  { slug: 'terre-del-marchesato', region: 'Toscana' },
  { slug: 'erik-banti', region: 'Toscana' },
  { slug: 'san-felice', region: 'Toscana' },
  { slug: 'tenuta-dellornellaia', region: 'Toscana' },
  { slug: 'tenuta-san-guido', region: 'Toscana' },
  { slug: 'borghi-fioriti', region: 'Toscana' },
  { slug: 'castelli-del-grevepesa', region: 'Toscana' },
  { slug: 'duca-di-saragnano', region: 'Toscana' },
  { slug: 'fattoria-di-calappiano', region: 'Toscana' },
  { slug: 'gualdo-del-re', region: 'Toscana' },
  { slug: 'il-puledro', region: 'Toscana' },
  { slug: 'san-zenone', region: 'Toscana' },
  { slug: 'colterenzio', region: 'Trentino-Alto Adige' },
  { slug: 'san-michele-appiano', region: 'Trentino-Alto Adige' },
  { slug: 'k-martini-sohn', region: 'Trentino-Alto Adige' },
  { slug: 'elena-walch', region: 'Trentino-Alto Adige' },
  { slug: 'ferrari', region: 'Trentino-Alto Adige' },
  { slug: 'altemasi', region: 'Trentino-Alto Adige' },
  { slug: 'lungarotti', region: 'Umbria' },
  { slug: 'pomario', region: 'Umbria' },
  { slug: 'azienda-agricola-il-poggiolo', region: 'Umbria' },
  { slug: 'favaroni', region: 'Umbria' },
  { slug: 'casale-triocco', region: 'Umbria' },
  { slug: 'leonucci', region: 'Umbria' },
  { slug: 'pizzogallo', region: 'Umbria' },
  { slug: 'cantina-dei-colli-amerini', region: 'Umbria' },
  { slug: 'crotta-de-vigneron', region: "Valle d'Aosta" },
  { slug: 'savio', region: "Valle d'Aosta" },
  { slug: 'cointreau', region: 'Valle della Loira' },
  { slug: 'montagner', region: 'Veneto' },
  { slug: 'mazzolada', region: 'Veneto' },
  { slug: 'casa-defra', region: 'Veneto' },
  { slug: 'distillerie-poli', region: 'Veneto' },
  { slug: 'cielo-e-terra', region: 'Veneto' },
  { slug: 'barbieri', region: 'Veneto' },
  { slug: 'borgo-antico', region: 'Veneto' },
  { slug: 'bonollo', region: 'Veneto' },
  { slug: 'luxardo', region: 'Veneto' },
  { slug: 'monte-tondo', region: 'Veneto' },
  { slug: 'contessa-carola', region: 'Veneto' },
  { slug: 'zenato', region: 'Veneto' },
  { slug: 'bonaventura-maschio', region: 'Veneto' },
  { slug: 'contri-spumanti', region: 'Veneto' },
  { slug: 'gambrinus', region: 'Veneto' },
];

async function getAllTerms() {
  const terms = [];
  let page = 1;
  while (true) {
    const res = await fetch(
      `${WC_BASE_URL}/wp-json/wc/v3/products/attributes/10/terms?per_page=100&page=${page}&${wcAuth}`
    );
    if (!res.ok) break;
    const batch = await res.json();
    terms.push(...batch);
    const totalPages = parseInt(res.headers.get('X-WP-TotalPages') || '1');
    if (page >= totalPages) break;
    page++;
  }
  return terms;
}

async function updateProducerMeta(termId, region, address = '') {
  const res = await fetch(`${WC_BASE_URL}/wp-json/stp-app/v1/update-producer-meta`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Basic ${wpAuth}` },
    body: JSON.stringify({ term_id: termId, region, address }),
  });
  return res.ok;
}

async function main() {
  console.log('Fetching all pa_produttore terms...');
  const terms = await getAllTerms();
  console.log(`Found ${terms.length} terms`);

  // Build slug → term_id map
  const slugMap = new Map();
  for (const t of terms) {
    slugMap.set(t.slug, t.id);
  }

  let updated = 0;
  let notFound = 0;
  let failed = 0;

  for (const p of PRODUCERS) {
    const termId = slugMap.get(p.slug);
    if (!termId) {
      console.log(`  SKIP (no term): ${p.slug}`);
      notFound++;
      continue;
    }

    const ok = await updateProducerMeta(termId, p.region, p.address || '');
    if (ok) {
      updated++;
      if (updated % 20 === 0) console.log(`  ... ${updated} updated`);
    } else {
      console.log(`  FAIL: ${p.slug} (term ${termId})`);
      failed++;
    }
  }

  console.log(`\nDone! Updated: ${updated}, Not found: ${notFound}, Failed: ${failed}`);
}

main().catch(console.error);
