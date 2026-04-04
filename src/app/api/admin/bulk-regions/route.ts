/**
 * Bulk update producer regions/addresses via stp-app/v1/update-producer-meta.
 *
 * GET /api/admin/bulk-regions?password=XXX  → runs the update and returns results
 */
import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const P: { slug: string; region: string; address?: string }[] = [
  // ── Abruzzo ──
  { slug: 'di-cicco', region: 'Abruzzo' },
  { slug: 'cantina-pietrantonj', region: 'Abruzzo' },
  { slug: 'scuppoz', region: 'Abruzzo' },
  { slug: 'castelsimoni-cantina-vini-montagna-abruzzo', region: 'Abruzzo' },
  { slug: 'cutina-liquori', region: 'Abruzzo' },
  { slug: 'masciarelli', region: 'Abruzzo', address: 'Via Gamberale 2, 66010 San Martino sulla Marrucina (CH)' },
  { slug: 'camilla-montori', region: 'Abruzzo' },
  { slug: 'diubaldo', region: 'Abruzzo' },
  { slug: 'lidia-amato', region: 'Abruzzo' },
  { slug: 'cataldi-madonna-cantina-biologica-abruzzo', region: 'Abruzzo' },
  { slug: 'pasetti', region: 'Abruzzo' },
  { slug: 'zaccagnini', region: 'Abruzzo', address: 'Contrada Pozzo 4, 65020 Bolognano (PE)' },
  // ── Aragona ──
  { slug: 'la-sastreria', region: 'Aragona' },
  // ── Basilicata ──
  { slug: 'cantina-del-notaio', region: 'Basilicata', address: 'Via Roma 159, 85028 Rionero in Vulture (PZ)' },
  { slug: 'petracastalda', region: 'Basilicata' },
  { slug: 'amaro-lucano', region: 'Basilicata' },
  // ── Borgogna ──
  { slug: 'albert-pic', region: 'Borgogna' },
  // ── Calabria ──
  { slug: 'caffo', region: 'Calabria', address: 'Via Matteotti 11, 89844 Limbadi (VV)' },
  { slug: 'statti', region: 'Calabria', address: 'Contrada Lenti, 88046 Lamezia Terme (CZ)' },
  { slug: 'cantine-vincenzo-ippolito', region: 'Calabria' },
  { slug: 'casale-cappellieri', region: 'Calabria' },
  { slug: 'maddalona-del-casato', region: 'Calabria' },
  { slug: 'vecchio-magazzino-doganale', region: 'Calabria' },
  { slug: 'essentia-mediterranea', region: 'Calabria' },
  // ── Campania ──
  { slug: 'cantina-moio', region: 'Campania' },
  { slug: 'mastroberardino', region: 'Campania', address: 'Via Manfredi 75/81, 83042 Atripalda (AV)' },
  { slug: 'petra-marzia', region: 'Campania' },
  { slug: 'torricino', region: 'Campania' },
  { slug: 'amphoreus', region: 'Campania' },
  { slug: 'vinicola-del-sannio', region: 'Campania' },
  { slug: 'casa-dambra', region: 'Campania' },
  { slug: 'di-meo', region: 'Campania' },
  { slug: 'montevetrano', region: 'Campania' },
  { slug: 'tenuta-le-lune-del-vesuvio', region: 'Campania' },
  { slug: 'alberti', region: 'Campania' },
  // ── Champagne ──
  { slug: 'veuve-cliquot', region: 'Champagne', address: '12 Rue du Temple, 51100 Reims (France)' },
  { slug: 'perrier-jouet', region: 'Champagne' },
  { slug: 'moet-chandon', region: 'Champagne', address: '20 Avenue de Champagne, 51200 Épernay (France)' },
  { slug: 'ruinart', region: 'Champagne', address: '4 Rue des Crayères, 51100 Reims (France)' },
  { slug: 'bollinger', region: 'Champagne', address: '16 Rue Jules Lobet, 51160 Aÿ-Champagne (France)' },
  { slug: 'veuve-pelletier', region: 'Champagne' },
  { slug: 'billecart-salmon', region: 'Champagne' },
  { slug: 'dalamotte', region: 'Champagne' },
  { slug: 'laurent-perrier', region: 'Champagne', address: '32 Avenue de Champagne, 51150 Tours-sur-Marne (France)' },
  { slug: 'louis-roederer', region: 'Champagne', address: '21 Boulevard Lundy, 51100 Reims (France)' },
  { slug: 'tattinger', region: 'Champagne' },
  { slug: 'ayala', region: 'Champagne' },
  // ── Charente ──
  { slug: 'courvoisier', region: 'Charente' },
  { slug: 'francois-peyrot', region: 'Charente' },
  // ── Emilia-Romagna ──
  { slug: 'merlotta', region: 'Emilia-Romagna', address: 'Via Merlotta 1, 40026 Imola (BO)' },
  { slug: 'cantina-divinja', region: 'Emilia-Romagna' },
  { slug: 'gruppo-montenegro', region: 'Emilia-Romagna' },
  { slug: 'tenuta-forcirola', region: 'Emilia-Romagna' },
  { slug: 'biancosarti', region: 'Emilia-Romagna' },
  // ── Friuli Venezia Giulia ──
  { slug: 'corte-della-contea', region: 'Friuli Venezia Giulia' },
  { slug: 'jermann', region: 'Friuli Venezia Giulia', address: 'Località Trussio Ruttars 11A, 34070 Dolegna del Collio (GO)' },
  { slug: 'marco-felluga', region: 'Friuli Venezia Giulia', address: 'Via Gorizia 121, 34072 Gradisca d\'Isonzo (GO)' },
  { slug: 'livio-felluga', region: 'Friuli Venezia Giulia', address: 'Via Risorgimento 1, 34071 Brazzano di Cormons (GO)' },
  { slug: 'candolini', region: 'Friuli Venezia Giulia' },
  { slug: 'nonino', region: 'Friuli Venezia Giulia', address: 'Via Aquileia 104, 33050 Percoto, Pavia di Udine (UD)' },
  // ── Francia altre ──
  { slug: 'francois-montand', region: 'Jura' },
  { slug: 'jp-chenet', region: 'Languedoc-Roussillon' },
  { slug: 'chateau-du-breil', region: 'Normandia' },
  { slug: 'chateau-desclans', region: 'Provenza' },
  { slug: 'cointreau', region: 'Valle della Loira' },
  // ── Lazio ──
  { slug: 'villa-gianna', region: 'Lazio', address: 'Strada Maremmana, Borgo San Donato, 04016 Sabaudia (LT)' },
  { slug: 'casale-del-giglio', region: 'Lazio', address: 'Strada Cisterna-Nettuno km 13, 04100 Le Ferriere (LT)' },
  { slug: 'pallini', region: 'Lazio' },
  { slug: 'poggio-le-volpi', region: 'Lazio', address: 'Via Fontana Candida 3, 00078 Monte Porzio Catone (RM)' },
  { slug: 'antonella-pacchiarotti', region: 'Lazio' },
  { slug: 'casale-mattia', region: 'Lazio', address: 'Via XX Settembre 48, 00044 Frascati (RM)' },
  { slug: 'proietti', region: 'Lazio' },
  { slug: 'cantina-bacco', region: 'Lazio' },
  { slug: 'cantina-di-montefiascone', region: 'Lazio' },
  { slug: 'de-marco', region: 'Lazio' },
  { slug: 'federici', region: 'Lazio' },
  { slug: 'sergio-mottura', region: 'Lazio', address: 'Località Poggio della Costa 1, 01020 Civitella d\'Agliano (VT)' },
  { slug: 'cincinnato', region: 'Lazio', address: 'Via Cori-Cisterna Km 2, 04010 Cori (LT)' },
  { slug: 'falesco', region: 'Lazio', address: 'Loc. San Pietro snc, 05020 Montecchio (TR)' },
  { slug: 'molinari', region: 'Lazio' },
  { slug: 'tarchna', region: 'Lazio' },
  { slug: 'distilleria-numa', region: 'Lazio' },
  { slug: 'famiglia-cotarella', region: 'Lazio', address: 'Loc. San Pietro snc, 05020 Montecchio (TR)' },
  { slug: 'gabriele-magno', region: 'Lazio' },
  { slug: 'lolivella', region: 'Lazio' },
  { slug: 'logindry', region: 'Lazio' },
  { slug: 'san-giovenale', region: 'Lazio' },
  { slug: 'stefanoni', region: 'Lazio' },
  { slug: 'tenuta-le-quinte', region: 'Lazio' },
  // ── Liguria ──
  { slug: 'cinqueterre', region: 'Liguria' },
  { slug: 'terenzuola', region: 'Liguria' },
  { slug: 'bisson', region: 'Liguria' },
  { slug: 'portofino', region: 'Liguria' },
  // ── Lombardia ──
  { slug: 'dune-premium-cocktails', region: 'Lombardia' },
  { slug: 'castel-faglia', region: 'Lombardia' },
  { slug: 'barbalonga', region: 'Lombardia' },
  { slug: 'berlucchi', region: 'Lombardia', address: 'Piazza Duranti 4, 25040 Borgonato di Corte Franca (BS)' },
  { slug: 'campari', region: 'Lombardia', address: 'Via Franco Sacchetti 20, 20099 Sesto San Giovanni (MI)' },
  { slug: 'bellavista', region: 'Lombardia', address: 'Via Bellavista 5, 25030 Erbusco (BS)' },
  { slug: 'fratelli-branca', region: 'Lombardia', address: 'Via Resegone 2, 20159 Milano (MI)' },
  { slug: 'contadi-castaldi', region: 'Lombardia' },
  { slug: 'quaquarini-2', region: 'Lombardia' },
  { slug: 'bisleri', region: 'Lombardia' },
  { slug: 'la-poggiolo', region: 'Lombardia' },
  { slug: 'tumbler-srl', region: 'Lombardia' },
  // ── Marche ──
  { slug: 'piersanti', region: 'Marche' },
  { slug: 'umani-e-ronchi', region: 'Marche', address: 'Via Adriatica 12, 60027 Osimo (AN)' },
  { slug: 'varnelli', region: 'Marche' },
  { slug: 'le-cime-basse-s-s', region: 'Marche' },
  { slug: 'belisario', region: 'Marche' },
  { slug: 'velenosi', region: 'Marche', address: 'Via dei Biancospini 11, 63100 Ascoli Piceno (AP)' },
  { slug: '120montebianco', region: 'Marche' },
  { slug: 'borghetti', region: 'Marche' },
  { slug: 'fazi-battaglia', region: 'Marche', address: 'Via Roma 117, 60031 Castelplanio (AN)' },
  { slug: 'ottavio-piersanti', region: 'Marche' },
  { slug: 'tenute-polini', region: 'Marche' },
  { slug: 'bocca-di-gabbia', region: 'Marche' },
  // ── Piemonte ──
  { slug: 'marolo', region: 'Piemonte', address: 'Corso Canale 105/1, 12051 Alba (CN)' },
  { slug: 'balbi-soprani', region: 'Piemonte', address: 'Corso Piave 140, 12058 Santo Stefano Belbo (CN)' },
  { slug: 'fratelli-giacosa', region: 'Piemonte', address: 'Via XX Settembre 64, 12052 Neive (CN)' },
  { slug: 'berta', region: 'Piemonte', address: 'Via Guasti 34/36, Fraz. Casalotto, 14046 Mombaruzzo (AT)' },
  { slug: 'ceretto-cantina-langhe-vini-biologici', region: 'Piemonte', address: 'Località San Cassiano 34, 12051 Alba (CN)' },
  { slug: 'martini', region: 'Piemonte' },
  { slug: 'azienda-agricola-alciati-giancarlo', region: 'Piemonte' },
  { slug: 'bosca', region: 'Piemonte' },
  { slug: 'duchessa-lia', region: 'Piemonte', address: 'Corso Piave 140, 12058 Santo Stefano Belbo (CN)' },
  { slug: 'claudio-alario', region: 'Piemonte' },
  { slug: 'distillerie-quaglia', region: 'Piemonte' },
  { slug: 'toselli', region: 'Piemonte' },
  { slug: 'antica-torino', region: 'Piemonte' },
  { slug: 'carpano', region: 'Piemonte' },
  { slug: 'engine', region: 'Piemonte' },
  { slug: 'travaglini', region: 'Piemonte', address: 'Via delle Vigne 36, 13045 Gattinara (VC)' },
  { slug: 'vigne-marina-coppi', region: 'Piemonte' },
  { slug: 'villa-ascenti', region: 'Piemonte' },
  // ── Puglia ──
  { slug: 'san-marzano', region: 'Puglia', address: 'Via Monsignor Bello 9, 74020 San Marzano di San Giuseppe (TA)' },
  { slug: 'teanum', region: 'Puglia', address: 'Via Salvemini 1, 71010 San Paolo di Civitate (FG)' },
  { slug: 'apollonio-1870', region: 'Puglia', address: 'Via San Pietro in Lama 7, 73047 Monteroni di Lecce (LE)' },
  { slug: 'scarpello', region: 'Puglia' },
  { slug: 'marzodd', region: 'Puglia' },
  { slug: 'mottura', region: 'Puglia' },
  { slug: 'terre-aprica', region: 'Puglia' },
  { slug: 'conte-di-campiano', region: 'Puglia' },
  { slug: 'leone-de-castris', region: 'Puglia', address: 'Via Senatore De Castris 26, 73015 Salice Salentino (LE)' },
  { slug: 'tormaresca', region: 'Puglia', address: 'S.P. 86 per Torre San Gennaro Km 5, 72027 San Pietro Vernotico (BR)' },
  // ── Sardegna ──
  { slug: 'cantina-santa-maria-la-palma-alghero', region: 'Sardegna', address: 'Via Zirra snc, Loc. Santa Maria La Palma, 07041 Alghero (SS)' },
  { slug: 'argiolas', region: 'Sardegna', address: 'Via Roma 28/30, 09040 Serdiana (CA)' },
  { slug: 'agricola-giacu', region: 'Sardegna' },
  { slug: 'cantina-li-seddi', region: 'Sardegna' },
  { slug: 'capichera', region: 'Sardegna', address: 'Strada per S. Antonio di Gallura Km 4, 07021 Arzachena (SS)' },
  { slug: 'piero-mancini', region: 'Sardegna', address: 'Via Madagascar 17, Z.I. Sett. 1, 07026 Olbia (SS)' },
  { slug: 'sella-mosca', region: 'Sardegna', address: 'Località I Piani, 07041 Alghero (SS)' },
  { slug: 'zedda-piras', region: 'Sardegna' },
  { slug: 'ichnusa', region: 'Sardegna' },
  { slug: 'cantina-gallura', region: 'Sardegna' },
  { slug: 'contini', region: 'Sardegna' },
  { slug: 'tenute-centu-e-prusu', region: 'Sardegna' },
  // ── Sicilia ──
  { slug: 'azienda-vitivinicola-tola', region: 'Sicilia', address: 'Via Giacomo Matteotti 2, 90047 Partinico (PA)' },
  { slug: 'quattrocieli', region: 'Sicilia' },
  { slug: 'madaudo', region: 'Sicilia' },
  { slug: 'cusumano', region: 'Sicilia', address: 'Contrada San Carlo, Via Bisaccia SNC, 90047 Partinico (PA)' },
  { slug: 'rossa', region: 'Sicilia' },
  { slug: 'tenuta-le-palme', region: 'Sicilia' },
  { slug: 'donnafugata', region: 'Sicilia', address: 'Via Sebastiano Lipari 18, 91025 Marsala (TP)' },
  { slug: 'terre-dellisola', region: 'Sicilia' },
  { slug: 'giovinco', region: 'Sicilia' },
  { slug: 'panarea', region: 'Sicilia' },
  { slug: 'tasca-dalmerita', region: 'Sicilia', address: 'Via dei Fiori 13, 90129 Palermo (PA)' },
  { slug: 'averna', region: 'Sicilia' },
  { slug: 'hauner', region: 'Sicilia', address: 'Via Umberto I 1, 98050 Santa Marina Salina (ME)' },
  { slug: 'palmento-costanzo', region: 'Sicilia', address: 'Contrada Santo Spirito, 95012 Castiglione di Sicilia (CT)' },
  { slug: 'planeta', region: 'Sicilia', address: 'Contrada Dispensa, 92013 Menfi (AG)' },
  // ── Toscana ──
  { slug: 'banfi', region: 'Toscana', address: 'Castello di Poggio alle Mura, 53024 Montalcino (SI)' },
  { slug: 'marchesi-antinori', region: 'Toscana', address: 'Via Cassia per Siena 133, Loc. Bargino, 50026 San Casciano Val di Pesa (FI)' },
  { slug: 'carpineto', region: 'Toscana', address: 'Località Dudda 17/B, 50022 Greve in Chianti (FI)' },
  { slug: 'luteraia', region: 'Toscana' },
  { slug: 'sensi', region: 'Toscana', address: 'Via Cerbaia 107, 51035 Lamporecchio (PT)' },
  { slug: 'cantina-di-pitigliano', region: 'Toscana' },
  { slug: 'barbanera', region: 'Toscana' },
  { slug: 'birrificio-san-quirico', region: 'Toscana' },
  { slug: 'casagrande-della-quercia', region: 'Toscana' },
  { slug: 'terre-del-marchesato', region: 'Toscana' },
  { slug: 'erik-banti', region: 'Toscana' },
  { slug: 'san-felice', region: 'Toscana', address: 'Località San Felice, 53019 Castelnuovo Berardenga (SI)' },
  { slug: 'tenuta-dellornellaia', region: 'Toscana', address: 'Via Bolgherese 191, 57022 Castagneto Carducci (LI)' },
  { slug: 'tenuta-san-guido', region: 'Toscana', address: 'Loc. Capanne 27, 57022 Bolgheri (LI)' },
  { slug: 'borghi-fioriti', region: 'Toscana' },
  { slug: 'castelli-del-grevepesa', region: 'Toscana' },
  { slug: 'duca-di-saragnano', region: 'Toscana' },
  { slug: 'fattoria-di-calappiano', region: 'Toscana' },
  { slug: 'gualdo-del-re', region: 'Toscana' },
  { slug: 'il-puledro', region: 'Toscana' },
  { slug: 'san-zenone', region: 'Toscana' },
  // ── Trentino-Alto Adige ──
  { slug: 'colterenzio', region: 'Trentino-Alto Adige', address: 'Strada del Vino 8, 39057 Cornaiano (BZ)' },
  { slug: 'san-michele-appiano', region: 'Trentino-Alto Adige', address: 'Via Circonvallazione 17-19, 39057 Appiano sulla Strada del Vino (BZ)' },
  { slug: 'k-martini-sohn', region: 'Trentino-Alto Adige', address: 'Via Lamm 28, 39057 Cornaiano (BZ)' },
  { slug: 'elena-walch', region: 'Trentino-Alto Adige', address: 'Via A. Hofer 1, 39040 Termeno sulla Strada del Vino (BZ)' },
  { slug: 'ferrari', region: 'Trentino-Alto Adige', address: 'Via Ponte di Ravina 15, 38123 Trento (TN)' },
  { slug: 'altemasi', region: 'Trentino-Alto Adige' },
  { slug: 'thomas-dorfmann', region: 'Trentino-Alto Adige' },
  // ── Umbria ──
  { slug: 'lungarotti', region: 'Umbria', address: 'Viale Giorgio Lungarotti 2, 06089 Torgiano (PG)' },
  { slug: 'pomario', region: 'Umbria' },
  { slug: 'azienda-agricola-il-poggiolo', region: 'Umbria' },
  { slug: 'favaroni', region: 'Umbria' },
  { slug: 'casale-triocco', region: 'Umbria' },
  { slug: 'leonucci', region: 'Umbria' },
  { slug: 'pizzogallo', region: 'Umbria' },
  { slug: 'cantina-dei-colli-amerini', region: 'Umbria' },
  // ── Valle d'Aosta ──
  { slug: 'crotta-de-vigneron', region: "Valle d'Aosta" },
  { slug: 'savio', region: "Valle d'Aosta" },
  // ── Veneto ──
  { slug: 'montagner', region: 'Veneto', address: 'Via Callalta Capoluogo 3, 31045 Motta di Livenza (TV)' },
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
  { slug: 'zenato', region: 'Veneto', address: 'Via San Benedetto 8, 37019 Peschiera del Garda (VR)' },
  { slug: 'bonaventura-maschio', region: 'Veneto' },
  { slug: 'contri-spumanti', region: 'Veneto' },
  { slug: 'gambrinus', region: 'Veneto' },
  { slug: 'la-braghina', region: 'Veneto' },
  { slug: 'maculan', region: 'Veneto' },
];

async function runBulkUpdate(wc: { baseUrl: string; consumerKey: string; consumerSecret: string }) {
  const wcAuth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;

  const terms: { id: number; slug: string }[] = [];
  let page = 1;
  while (true) {
    const res = await fetch(
      `${wc.baseUrl}/wp-json/wc/v3/products/attributes/10/terms?per_page=100&page=${page}&${wcAuth}`,
    );
    if (!res.ok) break;
    const batch = await res.json();
    terms.push(...batch);
    const totalPages = parseInt(res.headers.get('X-WP-TotalPages') || '1');
    if (page >= totalPages) break;
    page++;
  }

  const slugMap = new Map(terms.map(t => [t.slug, t.id]));

  const wpUser = process.env.WP_ADMIN_USER || process.env.WP_USER;
  const wpPass = process.env.WP_ADMIN_APP_PASSWORD || process.env.WP_APP_PASSWORD;
  if (!wpUser || !wpPass) {
    return { error: 'WP_USER/WP_APP_PASSWORD not set', terms: terms.length };
  }
  const wpAuth = Buffer.from(`${wpUser}:${wpPass}`).toString('base64');

  let updated = 0, notFound = 0, failed = 0;
  const failures: string[] = [];

  for (const p of P) {
    const termId = slugMap.get(p.slug);
    if (!termId) { notFound++; continue; }

    try {
      const res = await fetch(`${wc.baseUrl}/wp-json/stp-app/v1/update-producer-meta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Basic ${wpAuth}` },
        body: JSON.stringify({ term_id: termId, region: p.region, address: p.address || '' }),
      });
      if (res.ok) updated++;
      else {
        failed++;
        if (failures.length < 10) failures.push(`${p.slug}:${res.status}`);
      }
    } catch { failed++; }
  }

  return { updated, notFound, failed, total: P.length, termsFound: terms.length, failures };
}

export async function GET(req: NextRequest) {
  const password = req.nextUrl.searchParams.get('password');
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword || password !== adminPassword) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const wc = getWCSecrets();
  const result = await runBulkUpdate(wc);
  return NextResponse.json(result);
}
