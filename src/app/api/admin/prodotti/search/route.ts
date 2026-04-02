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
  raccolta?: string;
  periodoVendemmia?: string;
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

/* Produttore slug → regione — usato per auto-compilare la regione */
const PRODUCER_REGION: Record<string, string> = {
  // Abruzzo
  'di-cicco': 'Abruzzo', 'cantina-pietrantonj': 'Abruzzo', 'scuppoz': 'Abruzzo',
  'castelsimoni-cantina-vini-montagna-abruzzo': 'Abruzzo', 'cutina-liquori': 'Abruzzo',
  'masciarelli': 'Abruzzo', 'camilla-montori': 'Abruzzo', 'diubaldo': 'Abruzzo',
  'lidia-amato': 'Abruzzo', 'cataldi-madonna-cantina-biologica-abruzzo': 'Abruzzo',
  'pasetti': 'Abruzzo', 'zaccagnini': 'Abruzzo',
  // Aragona
  'la-sastreria': 'Aragona',
  // Basilicata
  'cantina-del-notaio': 'Basilicata', 'petracastalda': 'Basilicata', 'amaro-lucano': 'Basilicata',
  // Borgogna
  'albert-pic': 'Borgogna',
  // Calabria
  'caffo': 'Calabria', 'statti': 'Calabria', 'cantine-vincenzo-ippolito': 'Calabria',
  'casale-cappellieri': 'Calabria', 'maddalona-del-casato': 'Calabria',
  'vecchio-magazzino-doganale': 'Calabria', 'essentia-mediterranea': 'Calabria',
  // Campania
  'cantina-moio': 'Campania', 'mastroberardino': 'Campania', 'petra-marzia': 'Campania',
  'torricino': 'Campania', 'amphoreus': 'Campania', 'vinicola-del-sannio': 'Campania',
  'casa-dambra': 'Campania', 'di-meo': 'Campania', 'montevetrano': 'Campania',
  'tenuta-le-lune-del-vesuvio': 'Campania', 'alberti': 'Campania',
  // Champagne
  'veuve-cliquot': 'Champagne', 'perrier-jouet': 'Champagne', 'moet-chandon': 'Champagne',
  'ruinart': 'Champagne', 'bollinger': 'Champagne', 'veuve-pelletier': 'Champagne',
  'billecart-salmon': 'Champagne', 'dalamotte': 'Champagne', 'laurent-perrier': 'Champagne',
  'louis-roederer': 'Champagne', 'tattinger': 'Champagne', 'ayala': 'Champagne',
  // Charente
  'courvoisier': 'Charente', 'francois-peyrot': 'Charente',
  // Emilia-Romagna
  'merlotta': 'Emilia - Romagna', 'cantina-divinja': 'Emilia - Romagna',
  'gruppo-montenegro': 'Emilia - Romagna', 'tenuta-forcirola': 'Emilia - Romagna',
  'biancosarti': 'Emilia - Romagna',
  // Friuli Venezia Giulia
  'corte-della-contea': 'Friuli Venezia Giulia', 'jermann': 'Friuli Venezia Giulia',
  'marco-felluga': 'Friuli Venezia Giulia', 'livio-felluga': 'Friuli Venezia Giulia',
  'candolini': 'Friuli Venezia Giulia', 'nonino': 'Friuli Venezia Giulia',
  // Jura
  'francois-montand': 'Jura',
  // Languedoc-Roussillon
  'jp-chenet': 'Languedoc - Roussillon',
  // Lazio
  'villa-gianna': 'Lazio', 'casale-del-giglio': 'Lazio', 'pallini': 'Lazio',
  'poggio-le-volpi': 'Lazio', 'antonella-pacchiarotti': 'Lazio', 'casale-mattia': 'Lazio',
  'proietti': 'Lazio', 'cantina-bacco': 'Lazio', 'cantina-di-montefiascone': 'Lazio',
  'de-marco': 'Lazio', 'federici': 'Lazio', 'sergio-mottura': 'Lazio',
  'cincinnato': 'Lazio', 'falesco': 'Lazio', 'molinari': 'Lazio', 'tarchna': 'Lazio',
  'distilleria-numa': 'Lazio', 'famiglia-cotarella': 'Lazio', 'gabriele-magno': 'Lazio',
  'lolivella': 'Lazio', 'logindry': 'Lazio', 'san-giovenale': 'Lazio',
  'stefanoni': 'Lazio', 'tenuta-le-quinte': 'Lazio',
  // Liguria
  'cinqueterre': 'Liguria', 'terenzuola': 'Liguria', 'bisson': 'Liguria', 'portofino': 'Liguria',
  // Lombardia
  'dune-premium-cocktails': 'Lombardia', 'castel-faglia': 'Lombardia', 'barbalonga': 'Lombardia',
  'berlucchi': 'Lombardia', 'campari': 'Lombardia', 'bellavista': 'Lombardia',
  'fratelli-branca': 'Lombardia', 'contadi-castaldi': 'Lombardia', 'quaquarini-2': 'Lombardia',
  'bisleri': 'Lombardia', 'la-poggiolo': 'Lombardia', 'tumbler-srl': 'Lombardia',
  // Marche
  'piersanti': 'Marche', 'umani-e-ronchi': 'Marche', 'varnelli': 'Marche',
  'le-cime-basse-s-s': 'Marche', 'belisario': 'Marche', 'velenosi': 'Marche',
  '120montebianco': 'Marche', 'borghetti': 'Marche', 'fazi-battaglia': 'Marche',
  'ottavio-piersanti': 'Marche', 'tenute-polini': 'Marche',
  // Normandia
  'chateau-du-breil': 'Normandia',
  // Piemonte
  'marolo': 'Piemonte', 'balbi-soprani': 'Piemonte', 'fratelli-giacosa': 'Piemonte',
  'berta': 'Piemonte', 'ceretto-cantina-langhe-vini-biologici': 'Piemonte',
  'martini': 'Piemonte', 'azienda-agricola-alciati-giancarlo': 'Piemonte',
  'bosca': 'Piemonte', 'duchessa-lia': 'Piemonte', 'claudio-alario': 'Piemonte',
  'distillerie-quaglia': 'Piemonte', 'toselli': 'Piemonte', 'antica-torino': 'Piemonte',
  'carpano': 'Piemonte', 'engine': 'Piemonte', 'travaglini': 'Piemonte',
  'vigne-marina-coppi': 'Piemonte', 'villa-ascenti': 'Piemonte',
  // Provenza
  'chateau-desclans': 'Provenza',
  // Puglia
  'san-marzano': 'Puglia', 'teanum': 'Puglia', 'apollonio-1870': 'Puglia',
  'scarpello': 'Puglia', 'marzodd': 'Puglia', 'mottura': 'Puglia',
  'terre-aprica': 'Puglia', 'conte-di-campiano': 'Puglia', 'leone-de-castris': 'Puglia',
  'tormaresca': 'Puglia',
  // Sardegna
  'cantina-santa-maria-la-palma-alghero': 'Sardegna', 'argiolas': 'Sardegna',
  'agricola-giacu': 'Sardegna', 'cantina-li-seddi': 'Sardegna', 'capichera': 'Sardegna',
  'piero-mancini': 'Sardegna', 'sella-mosca': 'Sardegna', 'zedda-piras': 'Sardegna',
  'ichnusa': 'Sardegna', 'cantina-gallura': 'Sardegna', 'contini': 'Sardegna',
  'tenute-centu-e-prusu': 'Sardegna',
  // Sicilia
  'azienda-vitivinicola-tola': 'Sicilia', 'quattrocieli': 'Sicilia', 'madaudo': 'Sicilia',
  'cusumano': 'Sicilia', 'rossa': 'Sicilia', 'tenuta-le-palme': 'Sicilia',
  'donnafugata': 'Sicilia', 'terre-dellisola': 'Sicilia', 'giovinco': 'Sicilia',
  'panarea': 'Sicilia', 'tasca-dalmerita': 'Sicilia', 'averna': 'Sicilia',
  'hauner': 'Sicilia', 'palmento-costanzo': 'Sicilia', 'planeta': 'Sicilia',
  // Toscana
  'banfi': 'Toscana', 'marchesi-antinori': 'Toscana', 'carpineto': 'Toscana',
  'luteraia': 'Toscana', 'sensi': 'Toscana', 'cantina-di-pitigliano': 'Toscana',
  'barbanera': 'Toscana', 'birrificio-san-quirico': 'Toscana',
  'casagrande-della-quercia': 'Toscana', 'terre-del-marchesato': 'Toscana',
  'erik-banti': 'Toscana', 'san-felice': 'Toscana', 'tenuta-dellornellaia': 'Toscana',
  'tenuta-san-guido': 'Toscana', 'borghi-fioriti': 'Toscana',
  'castelli-del-grevepesa': 'Toscana', 'duca-di-saragnano': 'Toscana',
  'fattoria-di-calappiano': 'Toscana', 'gualdo-del-re': 'Toscana',
  'il-puledro': 'Toscana', 'san-zenone': 'Toscana',
  // Trentino-Alto Adige
  'colterenzio': 'Trentino - Alto Adige', 'san-michele-appiano': 'Trentino - Alto Adige',
  'k-martini-sohn': 'Trentino - Alto Adige', 'elena-walch': 'Trentino - Alto Adige',
  'ferrari': 'Trentino - Alto Adige', 'altemasi': 'Trentino - Alto Adige',
  // Umbria
  'lungarotti': 'Umbria', 'pomario': 'Umbria', 'azienda-agricola-il-poggiolo': 'Umbria',
  'favaroni': 'Umbria', 'casale-triocco': 'Umbria', 'leonucci': 'Umbria',
  'pizzogallo': 'Umbria', 'cantina-dei-colli-amerini': 'Umbria',
  // Valle d'Aosta
  'crotta-de-vigneron': "Valle d'Aosta", 'savio': "Valle d'Aosta",
  // Valle della Loira
  'cointreau': 'Valle della Loira',
  // Veneto
  'montagner': 'Veneto', 'mazzolada': 'Veneto', 'casa-defra': 'Veneto',
  'distillerie-poli': 'Veneto', 'cielo-e-terra': 'Veneto', 'barbieri': 'Veneto',
  'borgo-antico': 'Veneto', 'bonollo': 'Veneto', 'luxardo': 'Veneto',
  'monte-tondo': 'Veneto', 'contessa-carola': 'Veneto', 'zenato': 'Veneto',
  'bonaventura-maschio': 'Veneto', 'contri-spumanti': 'Veneto', 'gambrinus': 'Veneto',
};

/* Also build a name→slug map for matching producer names from text */
const PRODUCER_NAME_TO_SLUG: Record<string, string> = {
  'di cicco': 'di-cicco', 'pietrantonj': 'cantina-pietrantonj', 'scuppoz': 'scuppoz',
  'masciarelli': 'masciarelli', 'camilla montori': 'camilla-montori', 'diubaldo': 'diubaldo',
  'lidia amato': 'lidia-amato', 'cataldi madonna': 'cataldi-madonna-cantina-biologica-abruzzo',
  'pasetti': 'pasetti', 'zaccagnini': 'zaccagnini', 'cantina del notaio': 'cantina-del-notaio',
  'mastroberardino': 'mastroberardino', 'moio': 'cantina-moio', 'montevetrano': 'montevetrano',
  'veuve cliquot': 'veuve-cliquot', 'perrier jouet': 'perrier-jouet',
  'moet chandon': 'moet-chandon', 'moet & chandon': 'moet-chandon',
  'ruinart': 'ruinart', 'bollinger': 'bollinger', 'billecart salmon': 'billecart-salmon',
  'laurent perrier': 'laurent-perrier', 'louis roederer': 'louis-roederer',
  'taittinger': 'tattinger', 'ayala': 'ayala', 'courvoisier': 'courvoisier',
  'jermann': 'jermann', 'marco felluga': 'marco-felluga', 'livio felluga': 'livio-felluga',
  'nonino': 'nonino', 'casale del giglio': 'casale-del-giglio', 'pallini': 'pallini',
  'poggio le volpi': 'poggio-le-volpi', 'cincinnato': 'cincinnato', 'falesco': 'falesco',
  'molinari': 'molinari', 'terenzuola': 'terenzuola', 'berlucchi': 'berlucchi',
  'campari': 'campari', 'bellavista': 'bellavista', 'contadi castaldi': 'contadi-castaldi',
  'umani ronchi': 'umani-e-ronchi', 'varnelli': 'varnelli', 'velenosi': 'velenosi',
  'fazi battaglia': 'fazi-battaglia', 'ceretto': 'ceretto-cantina-langhe-vini-biologici',
  'martini': 'martini', 'travaglini': 'travaglini', 'banfi': 'banfi',
  'antinori': 'marchesi-antinori', 'marchesi antinori': 'marchesi-antinori',
  'carpineto': 'carpineto', 'san felice': 'san-felice', 'ornellaia': 'tenuta-dellornellaia',
  'san guido': 'tenuta-san-guido', 'colterenzio': 'colterenzio',
  'san michele appiano': 'san-michele-appiano', 'elena walch': 'elena-walch',
  'ferrari': 'ferrari', 'lungarotti': 'lungarotti', 'argiolas': 'argiolas',
  'capichera': 'capichera', 'sella mosca': 'sella-mosca', 'sella & mosca': 'sella-mosca',
  'donnafugata': 'donnafugata', 'tasca dalmerita': 'tasca-dalmerita',
  'tasca d\'almerita': 'tasca-dalmerita', 'planeta': 'planeta', 'cusumano': 'cusumano',
  'san marzano': 'san-marzano', 'leone de castris': 'leone-de-castris',
  'tormaresca': 'tormaresca', 'zenato': 'zenato', 'luxardo': 'luxardo',
  'distillerie poli': 'distillerie-poli', 'cielo e terra': 'cielo-e-terra',
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

/* ── Producer → regione lookup ─────────────────────────── */

/** Given a producer name (free text), return { slug, regione } if found in map */
function lookupProducer(name: string): { slug: string; regione: string } | null {
  if (!name) return null;
  const lower = name.toLowerCase().trim();
  // Try name→slug map first
  const slug = PRODUCER_NAME_TO_SLUG[lower];
  if (slug && PRODUCER_REGION[slug]) return { slug, regione: PRODUCER_REGION[slug] };
  // Partial match on name
  for (const [n, s] of Object.entries(PRODUCER_NAME_TO_SLUG)) {
    if (lower.includes(n) || n.includes(lower)) {
      if (PRODUCER_REGION[s]) return { slug: s, regione: PRODUCER_REGION[s] };
    }
  }
  // Direct slug match
  const slugified = lower.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (PRODUCER_REGION[slugified]) return { slug: slugified, regione: PRODUCER_REGION[slugified] };
  return null;
}

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

  // Try to identify producer from product name → auto-fill regione
  if (!data.regione) {
    const producer = lookupProducer(lower);
    if (producer) {
      data.regione = producer.regione;
      found.push('regione');
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

  // Normalize helpers
  const normalizeCategoria = (raw: string): string => {
    const l = raw.toLowerCase().trim();
    if (/rosso|rossi|red/.test(l)) return 'Vini Rossi';
    if (/bianco|bianchi|white/.test(l)) return 'Vini Bianchi';
    if (/rosato|rosé|rose/.test(l)) return 'Vini Rosati';
    if (/bollicin|spumant|frizzant|brut|metodo classico|charmat|champagne|prosecco|franciacorta/.test(l)) return 'Bollicine';
    if (/distillat|grappa|whisky|rum|gin|vodka/.test(l)) return 'Distillati';
    if (/liquor/.test(l)) return 'Liquori';
    if (/birr/.test(l)) return 'Birre';
    return raw.trim();
  };

  const normalizeGradazione = (raw: string): string => {
    // Extract number with optional comma/dot decimal
    const m = raw.match(/(\d{1,2}[,.]?\d{0,2})\s*%/);
    if (m) {
      const num = m[1].replace('.', ',');
      return `${num}%`;
    }
    return raw.trim();
  };

  // Direct field matchers: "Label: value" or "Label:\nvalue"
  const fieldPatterns: { field: keyof ProductData; patterns: RegExp[]; normalize?: (v: string) => string }[] = [
    { field: 'produttore', patterns: [/(?:produttore|cantina|azienda(?:\s+agricola)?)[:\s]+([^\n]+)/i] },
    { field: 'categoria', patterns: [/(?:categoria|tipologia|tipo di vino|tipo vino)[:\s]+([^\n]+)/i], normalize: normalizeCategoria },
    { field: 'denominazione', patterns: [/(?:denominazione(?:\s+di\s+origine)?|doc(?:g)?|igt)[:\s]+([^\n,]+)/i] },
    { field: 'regione', patterns: [/(?:regione)[:\s]+([^\n]+)/i] },
    { field: 'nazione', patterns: [/(?:nazione|paese|country)[:\s]+([^\n]+)/i] },
    { field: 'uvaggio', patterns: [/(?:uvaggio|uve|vitigno(?:i)?|uva(?:\s+utilizzata)?)[:\s]+([^\n]+)/i] },
    { field: 'gradazione', patterns: [/(?:gradazione\s*alcolica|alcol(?:icità)?|alcohol)[:\s]+([^\n]+)/i], normalize: normalizeGradazione },
    { field: 'annata', patterns: [/(?:annata|vendemmia\s+\d{4}|vintage)[:\s]+([^\n]+)/i] },
    { field: 'formato', patterns: [/(?:formato|capacità|bottiglia|volume)[:\s]+([^\n]+)/i] },
    { field: 'descBreve', patterns: [/(?:descrizione breve)[:\s]*\n?([^\n]+)/i] },
    { field: 'descLunga', patterns: [/(?:descrizione(?:\s+lunga)?|note)[:\s]*\n?([\s\S]+?)(?=\n(?:alla vista|al naso|al palato|abbinamenti|temperatura|momento|vinificazione|affinamento|terreno|esposizione|altitudine|zona|resa|vendemmia|bottiglie|certificazioni|allergeni|tag)[:\s]|\n\n|$)/i] },
    { field: 'allaVista', patterns: [/(?:alla vista|visiva)[:\s]*\n?([^\n]+(?:\n(?![A-Z])[^\n]+)*)/i] },
    { field: 'alNaso', patterns: [/(?:al naso|olfattiva)[:\s]*\n?([^\n]+(?:\n(?![A-Z])[^\n]+)*)/i] },
    { field: 'alPalato', patterns: [/(?:al palato|gustativa)[:\s]*\n?([^\n]+(?:\n(?![A-Z])[^\n]+)*)/i] },
    { field: 'abbinamenti', patterns: [/(?:abbinamenti|abbinamento)[:\s]*\n?([^\n]+)/i] },
    { field: 'temperaturaServizio', patterns: [/(?:temperatura(?:\s+di)?\s*servizio|servire\s+a|temp[.\s]+servizio)[:\s]+([^\n]+)/i] },
    { field: 'momentoConsumo', patterns: [/(?:momento(?:\s+di)?\s*consumo|pronto|beva|quando bere|potenziale)[:\s]+([^\n]+)/i] },
    { field: 'vinificazione', patterns: [/(?:vinificazione|metodo(?:\s+di)?\s*vinificazione)[:\s]*\n?([\s\S]+?)(?=\n(?:affinamento|terreno|esposizione|altitudine|zona|resa|raccolta|bottiglie|certificazioni|allergeni|tag|alla vista|al naso|al palato|abbinamenti|temperatura|momento)[:\s]|\n\n|$)/i] },
    { field: 'affinamento', patterns: [/(?:affinamento|invecchiamento|maturazione|élevage)[:\s]*\n?([^\n]+(?:\n(?![A-Z])[^\n]+)*)/i] },
    { field: 'terreno', patterns: [/(?:terreno|suolo|tipo\s+di\s+terreno|composizione\s+(?:del\s+)?suolo)[:\s]+([^\n]+)/i] },
    { field: 'esposizione', patterns: [/(?:esposizione)[:\s]+([^\n]+)/i] },
    { field: 'altitudine', patterns: [/(?:altitudine|quota|alt\.)[:\s]+([^\n]+)/i] },
    { field: 'zonaProduzione', patterns: [/(?:zona\s+di\s+produzione|zona|localit[àa]|contrada|cru)[:\s]+([^\n]+)/i] },
    { field: 'resa', patterns: [/(?:resa(?:\s+per\s+ettaro)?)[:\s]+([^\n]+)/i] },
    { field: 'raccolta', patterns: [/(?:raccolta|tipo\s+di\s+raccolta|vendemmia(?:\s+manuale|\s+meccanica|\s+selettiva)?)\s*[:\s]+([^\n]+)/i] },
    { field: 'periodoVendemmia', patterns: [/(?:periodo\s+(?:di\s+)?vendemmia|periodo\s+di\s+raccolta|epoca\s+(?:di\s+)?raccolta)[:\s]+([^\n]+)/i] },
    { field: 'bottiglieProdotte', patterns: [/(?:bottiglie\s+prodotte|n[°º]\s*bottiglie|produzione\s+annua)[:\s]+([^\n]+)/i] },
    { field: 'certificazioni', patterns: [/(?:certificazioni?|filosofia|metodo\s+produttivo|biodinamico|biologico)[:\s]+([^\n]+)/i] },
    { field: 'allergeni', patterns: [/(?:allergeni|contiene)[:\s]+([^\n]+)/i] },
    { field: 'tags', patterns: [/(?:tag|tags)[:\s]+([^\n]+)/i] },
  ];

  for (const { field, patterns, normalize } of fieldPatterns) {
    if (data[field]) continue; // Don't overwrite existing
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        let value = match[1].trim().replace(/\s+/g, ' ');
        if (normalize) value = normalize(value);
        if (value && value.toLowerCase() !== 'n/d' && value !== '-' && value !== '') {
          (data as Record<string, string>)[field] = value;
          if (!found.includes(field)) found.push(field);
        }
        break;
      }
    }
  }

  // Auto-fill regione from produttore lookup
  if (data.produttore && !data.regione) {
    const producer = lookupProducer(data.produttore);
    if (producer) {
      data.regione = producer.regione;
      if (!found.includes('regione')) found.push('regione');
    }
  }

  // Fallback: extract alcohol from anywhere in text
  if (!data.gradazione) {
    const alcMatch = text.match(/(\d{1,2}[.,]\d{0,2})\s*%\s*(?:vol(?:\s*alc)?)?/i);
    if (alcMatch) { data.gradazione = normalizeGradazione(alcMatch[0]); found.push('gradazione'); }
  }

  // Fallback: detect allergeni (solfiti) anywhere if not explicitly labeled
  if (!data.allergeni) {
    const lower = text.toLowerCase();
    if (lower.includes('solfiti') || lower.includes('so2') || lower.includes('contiene solfiti')) {
      data.allergeni = 'Contiene solfiti';
      found.push('allergeni');
    }
  }

  // Fallback: detect raccolta type from keywords
  if (!data.raccolta) {
    const lower = text.toLowerCase();
    if (lower.includes('vendemmia manuale') || lower.includes('raccolta manuale') || lower.includes('raccolta a mano')) {
      data.raccolta = 'Manuale';
      found.push('raccolta');
    } else if (lower.includes('vendemmia meccanica') || lower.includes('raccolta meccanica')) {
      data.raccolta = 'Meccanica';
      found.push('raccolta');
    }
  }

  // Fallback: detect periodo vendemmia from harvest month mentions
  if (!data.periodoVendemmia) {
    const mesiMatch = text.match(/(?:fine|inizio|metà)\s+(?:agosto|settembre|ottobre|novembre)/i);
    if (mesiMatch) {
      const val = mesiMatch[0].trim();
      data.periodoVendemmia = val.charAt(0).toUpperCase() + val.slice(1);
      found.push('periodoVendemmia');
    }
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

  // Do not use vendemmia fallback for momentoConsumo — they are different fields
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
  "gradazione": "solo numero e %, es. 13,5%",
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
  "raccolta": "Manuale|Meccanica|Selettiva — solo una di queste parole",
  "periodoVendemmia": "es. Inizio ottobre, Fine settembre, Metà ottobre",
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
          const fieldMap: (keyof ProductData)[] = ['produttore', 'categoria', 'annata', 'denominazione', 'regione', 'uvaggio', 'gradazione', 'formato', 'descBreve', 'descLunga', 'allaVista', 'alNaso', 'alPalato', 'abbinamenti', 'temperaturaServizio', 'momentoConsumo', 'vinificazione', 'affinamento', 'terreno', 'esposizione', 'altitudine', 'zonaProduzione', 'resa', 'raccolta', 'periodoVendemmia', 'bottiglieProdotte', 'certificazioni', 'allergeni', 'tags'];
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

  // Final pass: if produttore is known but regione still missing, look it up
  if (result.data.produttore && !result.data.regione) {
    const producer = lookupProducer(result.data.produttore);
    if (producer) {
      result.data.regione = producer.regione;
      if (!result.foundFields.includes('regione')) result.foundFields.push('regione');
    }
  }

  // Capitalize first letter of all text fields
  const textFields: (keyof ProductData)[] = ['descBreve', 'descLunga', 'allaVista', 'alNaso', 'alPalato', 'vinificazione', 'affinamento', 'abbinamenti', 'terreno', 'esposizione', 'zonaProduzione', 'periodoVendemmia', 'raccolta'];
  for (const f of textFields) {
    if (result.data[f]) {
      result.data[f] = result.data[f]!.charAt(0).toUpperCase() + result.data[f]!.slice(1);
    }
  }

  result.foundFields = [...new Set(result.foundFields)];
  return NextResponse.json(result);
}
