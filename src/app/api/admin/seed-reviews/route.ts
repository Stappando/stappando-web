import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';

/* ── Auth ─────────────────────────────────────────────── */

function isAuthorized(req: NextRequest): boolean {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  const auth = req.headers.get('authorization');
  if (!auth) return false;
  const token = auth.replace(/^Bearer\s+/i, '');
  return token === password;
}

/* ── Helpers ──────────────────────────────────────────── */

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomRating(): number {
  const r = Math.random();
  if (r < 0.45) return 5;
  if (r < 0.85) return 4;
  return 3;
}

/* ── Reviewers ────────────────────────────────────────── */

const REVIEWERS = [
  { name: 'moro61', email: 'moro61@gmail.com' },
  { name: 'Giulia R.', email: 'giuli.r94@libero.it' },
  { name: 'd.colombo78', email: 'd.colombo78@yahoo.it' },
  { name: 'Saretta', email: 'saretta.col@hotmail.it' },
  { name: 'Lore_85', email: 'lore85@gmail.com' },
  { name: 'SimoWine', email: 'simo.wine@yahoo.it' },
  { name: 'marti_co', email: 'marti.co92@libero.it' },
  { name: 'Ale_ferr', email: 'ale.ferr90@virgilio.it' },
  { name: 'francy.mo', email: 'francy.mo@me.com' },
  { name: 'DaveRom', email: 'dave.rom88@gmail.com' },
  { name: 'vale.p', email: 'vale.p93@hotmail.it' },
  { name: 'FedeBianc', email: 'fede.bianc@icloud.com' },
  { name: 'Tommy_r', email: 'tommy.r89@gmail.com' },
  { name: 'ele.font', email: 'ele.font@icloud.com' },
  { name: 'Andy86', email: 'andy86g@outlook.it' },
  { name: 'Chiara_B', email: 'chiara.b95@tiscali.it' },
  { name: 'm.rizzo', email: 'm.rizzo87@virgilio.it' },
  { name: 'Roby_L', email: 'roby.l82@libero.it' },
  { name: 'gaia.san', email: 'gaia.san91@gmail.com' },
  { name: 'Ste_march', email: 'ste.march@outlook.it' },
  { name: 'Nico_vino', email: 'nico.vino@gmail.com' },
  { name: 'LaVigna', email: 'lavigna82@libero.it' },
  { name: 'il_sommelier', email: 'marco.somm@outlook.it' },
  { name: 'Paola_M', email: 'paola.m84@alice.it' },
];

/* ── Wine type detection ─────────────────────────────── */

type WineType = 'rosso' | 'bianco' | 'bollicine' | 'champagne' | 'rosato' | 'altro';

interface WCProductMini {
  id: number;
  name: string;
  price: string;
  categories: { id: number; name: string; slug: string }[];
}

function detectWineType(product: WCProductMini): WineType {
  const name = product.name.toLowerCase();
  const cats = product.categories.map((c) => c.name.toLowerCase()).join(' ');
  const slugs = product.categories.map((c) => c.slug.toLowerCase()).join(' ');
  const all = `${name} ${cats} ${slugs}`;

  if (all.includes('champagne')) return 'champagne';
  if (all.includes('franciacorta') || all.includes('prosecco') || all.includes('spumant') || all.includes('bollicine') || all.includes('brut') || all.includes('trento doc')) return 'bollicine';
  if (all.includes('rosato') || all.includes('rosati')) return 'rosato';
  if (all.includes('bianco') || all.includes('bianchi')) return 'bianco';
  if (all.includes('rosso') || all.includes('rossi')) return 'rosso';
  // Default: try to guess from name keywords
  if (/nebbiolo|barbera|sangiovese|primitivo|nero d'avola|montepulciano|chianti|barolo|brunello|amarone|valpolicella|etna rosso|aglianico|cannonau|merlot|cabernet|syrah|pinot nero/.test(name)) return 'rosso';
  if (/vermentino|gavi|pecorino|falanghina|fiano|greco|trebbiano|chardonnay|sauvignon|pinot grigio|gewurztraminer|riesling|etna bianco|soave|lugana/.test(name)) return 'bianco';
  return 'altro';
}

/* ── Reviews per category ────────────────────────────── */

// ---------- ROSSI ----------

const ROSSI_5: string[] = [
  'Fresco e beverino, si beve che è un piacere. Per il prezzo è un affare.',
  'L\'ho preso per curiosità e l\'ho già riordinato. Scorrevole, note di mora e ribes.',
  'Me l\'ha fatto assaggiare un collega e l\'ho comprato subito. Sapore pieno, un po\' di frutti rossi. Top.',
  'Provato con una parmigiana di melanzane, abbinamento azzeccato. Buona acidità che sgrassava bene.',
  'Un amico me l\'ha consigliato, ha questo sapore di more e ribes che è proprio bello. Strutturato e pieno.',
  'L\'ho aperto a cena con degli amici e tutti hanno chiesto che vino fosse. Dice tutto.',
  'L\'ho conosciuto a una degustazione e l\'ho cercato online. Naso di mora, cacao, spezie dolci. Bellissimo.',
  'Lo avevo assaggiato da un\'amica e me ne sono innamorata. Pieno, avvolgente, profumo incredibile.',
  'L\'ho provato con un brasato e sembrava fatto apposta. Intenso, setoso, tannini fini. Da riprendere.',
  'Complesso e avvolgente. Note di tabacco, vaniglia e frutta matura. Finale lunghissimo. Gran bel vino.',
  'Ci ho fatto un roast beef della domenica, il pinot nero ci stava perfettamente. Elegante e delicato.',
  'Bevuto con lo spezzatino della nonna, abbinamento da manuale. Caldo, avvolgente, tannini presenti ma non aggressivi.',
  'L\'ho abbinato a una pasta alla siciliana con olive capperi e alici, il vino reggeva tutto senza sovrastare. Ottimo equilibrio.',
  'Preso per una cena con costata alla brace. Il vino teneva il piatto senza problemi, anzi lo esaltava.',
  'Aperto con delle pappardelle al ragù di cinghiale. Il tannino del vino puliva la bocca ad ogni boccone, perfetto.',
];

const ROSSI_4: string[] = [
  'Buono! L\'ho provato con un tagliere di salumi e ci stava a pennello. Leggero ma saporito.',
  'Soddisfatto dell\'acquisto, ottima bocca piena. Note di frutta matura, un po\' di pepe. Lo riprendo.',
  'Buono, forse un filo giovane. Però al naso è già interessante, frutta rossa con un accenno di vaniglia.',
  'Buona struttura, leggermente tannico ma si ammorbidisce nel bicchiere. Merita un po\' di tempo per aprirsi.',
  'Elegante, ben bilanciato tra acidità e morbidezza. Ha ancora margine di evoluzione, lo lascerei riposare.',
  'Bel vino. Strutturato ma non pesante, si sente il legno ma non copre il frutto. Buon equilibrio.',
  'Molto buono. Ci ho abbinato un filetto al pepe verde, gran coppia. Persistente e morbido.',
  'Bevuto con un agnello al forno, ci stava bene. Il vino ha buona struttura, tannini rotondi.',
  'L\'ho provato con una polenta e funghi porcini, se la cavava bene. Forse gli manca un po\' di lunghezza ma è onesto.',
];

const ROSSI_3: string[] = [
  'Naso di ciliegia matura, in bocca è semplice ma pulito. Per quello che costa ci sta tutto.',
  'Niente di complicato ma è proprio buono. Lo bevo volentieri.',
  'Discreto, al naso sentori di prugna ma in bocca manca un po\' di profondità. Comunque bevibile.',
];

const ROSSI_FANATICO: string[] = [
  'Allora, premessa: sotto i 10 euro di solito non mi aspetto nulla. Questo mi ha smentito. Al naso è pulito, mora e un leggero sottobosco. In bocca entra morbido, acidità giusta che lo rende beverino senza essere banale. Ho provato a lasciarlo mezz\'ora nel bicchiere e migliora pure. Per un vino da tutti i giorni è esattamente quello che cerco: zero difetti, buona beva, prezzo onesto. Ne ho presi sei bottiglie.',
  'Ho stappato la bottiglia e già dal colore si capiva che era roba seria: rubino profondo, quasi impenetrabile. Al naso primo impatto di mora e mirtillo, poi esce fuori una nota balsamica e un tocco di pepe nero che gli dà carattere. In bocca è pieno, i tannini ci sono ma sono rotondi, levigati. Il finale è lungo con un ritorno di frutta scura e un accenno di cacao. L\'ho abbinato a un ragù di cinghiale che avevo preparato domenica e si sono sposati perfettamente, il vino reggeva il piatto senza sovrastarlo. Per la fascia di prezzo è notevole, onestamente pensavo costasse di più.',
  'Devo spendere due parole in più su questo vino perché se lo merita. Già alla vista si presenta con un rubino concentrato con riflessi granato che promette bene. Al naso è una esplosione: prima ondata di amarena e prugna matura, poi si apre su note terziarie di cuoio, tabacco dolce, un po\' di liquirizia. Lasciandolo ossigenare esce anche una sfumatura di cioccolato fondente. Al palato è sontuoso, l\'attacco è caldo ma non alcolico, tannini fitti e vellutati, acidità perfetta che gli dà freschezza senza stonare. Il finale dura una eternità, chiude su spezie e un ricordo di frutta sotto spirito. L\'ho bevuto con una tagliata di chianina con rucola e scaglie di parmigiano e il vino teneva il piatto senza problemi. Uno di quei vini che quando finisce la bottiglia rimani lì a guardare il bicchiere vuoto. Complimenti alla cantina.',
];

// ---------- BIANCHI ----------

const BIANCHI_5: string[] = [
  'Freschissimo, profumo di pesca bianca e agrumi. Perfetto per l\'estate.',
  'L\'ho provato con un\'insalata di polpo e patate, abbinamento da favola. Minerale e agrumato.',
  'Me l\'hanno consigliato con il sushi e avevano ragione. Secco, minerale, pulisce la bocca perfettamente.',
  'Aperto con un piatto di linguine allo spada, il vino aveva la struttura giusta per reggere il pesce. Ottimo.',
  'Naso di fiori bianchi e mela verde, in bocca è sapido e lungo. Bevuto con gamberi alla griglia, sposalizio perfetto.',
  'L\'ho portato a una cena di pesce, ostriche e crudi vari. Il vino ci stava da dio, fresco e minerale.',
  'Provato con una pasta al pesto di pistacchi, l\'abbinamento funzionava benissimo. Il vino non copriva il piatto.',
  'Ci ho abbinato un pad thai e devo dire che con la cucina orientale ci sta molto bene. Fresco e aromatico.',
  'Preso per un aperitivo con antipasti di mare, tartine e gamberi. Tutti contenti, bottiglia finita subito.',
];

const BIANCHI_4: string[] = [
  'Buono, naso di agrumi e un po\' di erbe aromatiche. In bocca è fresco, acidità giusta.',
  'Piacevole con una frittura di paranza, lo sgrassava bene. Un po\' semplice ma onesto.',
  'L\'ho bevuto con un pollo arrosto, ci stava. Profumo di pesca, bocca sapida. Buon rapporto qualità prezzo.',
  'Soddisfatta, note di mela golden e un filo minerale. Servito freddo è una goduria.',
  'Bevuto con delle verdure grigliate e formaggi freschi. Piacevole, non troppo complesso ma ben fatto.',
  'Provato con un piatto di spaghetti alle vongole. Il vino era all\'altezza, fresco e sapido.',
];

const BIANCHI_3: string[] = [
  'Discreto, abbastanza fresco. Niente di memorabile ma per il prezzo va bene.',
  'Un po\' anonimo al naso, in bocca è corretto. Lo ribevo senza problemi ma non mi ha entusiasmato.',
];

const BIANCHI_FANATICO: string[] = [
  'Questo bianco mi ha sorpreso. Al naso partono subito note di pesca bianca e cedro, poi arriva un soffio di salvia e pietra focaia che gli dà complessità. In bocca ha una sapidità bella decisa, quasi salina, che ti invoglia al sorso successivo. L\'acidità è ben calibrata, il finale è lungo con un ritorno agrumato. L\'ho bevuto con un crudo di gamberi rossi e una tartare di tonno, e il vino esaltava la dolcezza del pesce senza coprirla. Per chi cerca un bianco con personalità e non il solito vinello da aperitivo, questo è una scelta sicura.',
  'Colore giallo paglierino brillante, al naso si apre su fiori bianchi, acacia, poi mela verde e un fondo minerale. In bocca è cremoso ma fresco, c\'è una bella tensione tra morbidezza e acidità. Finale persistente con un ricordo di mandorla. L\'ho abbinato a un risotto ai frutti di mare e reggeva la complessità del piatto. Vino serio, fatto bene. Da provare anche con piatti di cucina giapponese.',
];

// ---------- BOLLICINE / PROSECCO / FRANCIACORTA ----------

const BOLLICINE_5: string[] = [
  'Bollicine fini e persistenti, naso di mela verde e crosta di pane. Perfetto per brindare.',
  'Preso per un aperitivo tra amici. Fresco, perlage cremoso, è finito in un attimo. Lo riprendo.',
  'L\'ho aperto per un compleanno, tutti entusiasti. Profumo di fiori bianchi e agrumi, bollicina finissima.',
  'Ci ho fatto un aperitivo con dei crostini di mare e tartine. Abbinamento perfetto, fresco e elegante.',
  'L\'ho servito con delle ostriche, il perlage e la mineralità pulivano il palato ad ogni sorso. Gran bella beva.',
  'Aperto per un brindisi di capodanno, ma è buono tutto l\'anno. Agrumato, perlage fine, naso di lievito delicato.',
];

const BOLLICINE_4: string[] = [
  'Buono per un aperitivo, bollicina piacevole. Forse un filo dolce per i miei gusti ma ben fatto.',
  'Perlage discreto, naso di mela e fiori bianchi. Ci sta per un brindisi o con antipasti leggeri.',
  'L\'ho bevuto come aperitivo con un tagliere. Fresco e piacevole, niente di troppo complesso.',
  'Buone bollicine, naso di crosta di pane e agrumi. Per il prezzo ci sta, lo riprendo per le feste.',
];

const BOLLICINE_3: string[] = [
  'Onesto, bollicina abbastanza fine. Non entusiasmante ma per un aperitivo veloce va bene.',
];

const BOLLICINE_FANATICO: string[] = [
  'Al naso si apre con una nota netta di crosta di pane e lievito, poi arrivano mela verde e un accenno di fiori di acacia. Il perlage è finissimo, cremoso, quasi setoso in bocca. L\'attacco è fresco, agrumato, poi si allarga su una sapidità minerale che gli dà profondità. Finale lungo con un ritorno di mandorla e agrumi canditi. L\'ho servito con un crudo di pesce e crostacei, e le bollicine nettavano il palato perfettamente tra un boccone e l\'altro. Per un aperitivo di livello o una cena di pesce importante, è una scelta azzeccata.',
];

// ---------- CHAMPAGNE ----------

const CHAMPAGNE_5: string[] = [
  'Elegantissimo. Naso di brioche, agrumi canditi e un fondo di frutta secca. Perlage finissimo. Vale il prezzo.',
  'L\'ho aperto per un anniversario. Bollicine cremose, note di tostatura e miele d\'acacia. Momento speciale.',
  'Servito con ostriche e tartare di gamberi. Lo champagne puliva il palato perfettamente. Classe pura.',
];

const CHAMPAGNE_4: string[] = [
  'Molto buono, perlage elegante. Note di brioche e agrumi. Forse per il prezzo mi aspettavo un po\' più di complessità al finale.',
  'Bello, naso tostato con sentori di frutta secca e zenzero. In bocca è fine, bollicina persistente.',
];

const CHAMPAGNE_FANATICO: string[] = [
  'Questo champagne merita una recensione seria. Al naso è stratificato: prima la brioche e il lievito, poi agrumi canditi, un tocco di zenzero e frutta secca. In bocca il perlage è di una finezza rara, quasi impalpabile. L\'attacco è cremoso ma l\'acidità lo sostiene alla grande, dando freschezza e tensione. Il finale è lungo, chiude su note tostate e un ricordo di miele d\'acacia. L\'ho bevuto con un astice alla catalana e l\'abbinamento era da standing ovation. Non è un vino da tutti i giorni, ma per un\'occasione importante non sbaglia.',
];

// ---------- ROSATI ----------

const ROSATI_5: string[] = [
  'Freschissimo! Profumo di fragola e melograno. L\'ho bevuto con un pinzimonio, perfetto.',
  'Preso per un aperitivo estivo, è andato a ruba. Rosa tenue, naso di lampone, bocca fresca e sapida.',
  'L\'ho provato con una grigliata di pesce e funzionava benissimo. Leggero ma saporito.',
];

const ROSATI_4: string[] = [
  'Piacevole, note di ciliegia fresca e pompelmo rosa. Buono con bruschette e antipasti.',
  'Fresco e beverino. Un po\' semplice ma per l\'estate è quello che cerco.',
];

const ROSATI_FANATICO: string[] = [
  'Bel rosato, non il solito anonimo. Al naso fragola, lampone e un tocco di petali di rosa. In bocca è fresco con una sapidità minerale che lo rende interessante. L\'ho abbinato a un couscous di verdure e gamberi e si completavano a vicenda. Per chi pensa che i rosati siano vini da poco, questo fa cambiare idea.',
];

// ---------- ALTRO (spirits, birre, etc.) ----------

const ALTRO_5: string[] = [
  'Molto buono, soddisfatto dell\'acquisto. Lo riprendo sicuramente.',
  'Piacevole sorpresa, qualità ottima. Consigliato.',
  'L\'ho provato per curiosità e mi è piaciuto molto. Spedizione veloce.',
];

const ALTRO_4: string[] = [
  'Buono, niente di eccezionale ma onesto. Per il prezzo ci sta.',
  'Soddisfatto. Buon prodotto, consegna rapida.',
];

/* ── Review picker by wine type ──────────────────────── */

function getReview(type: WineType, rating: number, useFanatico: boolean): string {
  if (useFanatico) {
    switch (type) {
      case 'rosso': return pickRandom(ROSSI_FANATICO);
      case 'bianco': return pickRandom(BIANCHI_FANATICO);
      case 'bollicine': return pickRandom(BOLLICINE_FANATICO);
      case 'champagne': return pickRandom(CHAMPAGNE_FANATICO);
      case 'rosato': return pickRandom(ROSATI_FANATICO);
      default: return pickRandom(ALTRO_5);
    }
  }

  const pools: Record<WineType, { s5: string[]; s4: string[]; s3: string[] }> = {
    rosso: { s5: ROSSI_5, s4: ROSSI_4, s3: ROSSI_3 },
    bianco: { s5: BIANCHI_5, s4: BIANCHI_4, s3: BIANCHI_3 },
    bollicine: { s5: BOLLICINE_5, s4: BOLLICINE_4, s3: BOLLICINE_3 },
    champagne: { s5: CHAMPAGNE_5, s4: CHAMPAGNE_4, s3: CHAMPAGNE_5 },
    rosato: { s5: ROSATI_5, s4: ROSATI_4, s3: ROSATI_5 },
    altro: { s5: ALTRO_5, s4: ALTRO_4, s3: ALTRO_4 },
  };

  const pool = pools[type];
  if (rating >= 5) return pickRandom(pool.s5);
  if (rating >= 4) return pickRandom(pool.s4);
  return pickRandom(pool.s3);
}

/* ── Number of reviews by price ──────────────────────── */

function reviewCountByPrice(price: number): number {
  if (price < 10) return randomInt(10, 12);
  if (price <= 15) return randomInt(6, 7);
  return randomInt(2, 3);
}

/* ── Main handler ─────────────────────────────────────── */

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const {
    productIds,        // number[] — specific product IDs (optional)
    reviewsPerProduct, // number — override (ignores price logic)
    dryRun,            // boolean — if true, return plan without creating
  } = body as {
    productIds?: number[];
    reviewsPerProduct?: number;
    dryRun?: boolean;
  };

  const wc = getWCSecrets();
  const auth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;

  // Fetch products with categories and price
  let products: WCProductMini[] = [];

  if (productIds && productIds.length > 0) {
    // Fetch specific products
    const batchSize = 20;
    for (let i = 0; i < productIds.length; i += batchSize) {
      const batch = productIds.slice(i, i + batchSize);
      const url = `${wc.baseUrl}/wp-json/wc/v3/products?${auth}&include=${batch.join(',')}&per_page=${batchSize}&_fields=id,name,price,categories`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        products.push(...data);
      }
    }
  } else {
    // Fetch all published products (paginated)
    let page = 1;
    while (true) {
      const url = `${wc.baseUrl}/wp-json/wc/v3/products?${auth}&status=publish&per_page=100&page=${page}&_fields=id,name,price,categories`;
      const res = await fetch(url);
      if (!res.ok) break;
      const data = (await res.json()) as WCProductMini[];
      if (data.length === 0) break;
      products.push(...data);
      if (data.length < 100) break;
      page++;
    }
  }

  if (products.length === 0) {
    return NextResponse.json({ error: 'Nessun prodotto trovato' }, { status: 404 });
  }

  // Build review plan
  const plan: {
    productId: number;
    productName: string;
    wineType: WineType;
    price: number;
    reviewer: string;
    reviewerEmail: string;
    rating: number;
    review: string;
  }[] = [];

  for (const product of products) {
    const price = parseFloat(product.price) || 0;
    const type = detectWineType(product);
    const count = reviewsPerProduct ?? reviewCountByPrice(price);
    const usedReviewers = new Set<string>();
    const usedTexts = new Set<string>();

    // ~20% chance of one fanatico review per product (if enough reviews)
    const fanaticoIndex = count >= 4 ? randomInt(0, count - 1) : -1;
    const hasFanatico = count >= 4 && Math.random() < 0.2;

    for (let i = 0; i < count; i++) {
      // Pick unique reviewer
      let reviewer = pickRandom(REVIEWERS);
      let attempts = 0;
      while (usedReviewers.has(reviewer.email) && attempts < 30) {
        reviewer = pickRandom(REVIEWERS);
        attempts++;
      }
      usedReviewers.add(reviewer.email);

      const isFanatico = hasFanatico && i === fanaticoIndex;
      const rating = isFanatico ? 5 : randomRating();

      // Pick unique review text
      let text = getReview(type, rating, isFanatico);
      let textAttempts = 0;
      while (usedTexts.has(text) && textAttempts < 10) {
        text = getReview(type, rating, isFanatico);
        textAttempts++;
      }
      usedTexts.add(text);

      plan.push({
        productId: product.id,
        productName: product.name,
        wineType: type,
        price,
        reviewer: reviewer.name,
        reviewerEmail: reviewer.email,
        rating,
        review: text,
      });
    }
  }

  if (dryRun) {
    return NextResponse.json({
      dryRun: true,
      totalReviews: plan.length,
      products: products.length,
      breakdown: {
        under10: products.filter((p) => parseFloat(p.price) < 10).length,
        from10to15: products.filter((p) => { const pr = parseFloat(p.price); return pr >= 10 && pr <= 15; }).length,
        over15: products.filter((p) => parseFloat(p.price) > 15).length,
      },
      plan,
    });
  }

  // Create reviews via WC REST API
  const results: { productId: number; reviewId?: number; error?: string }[] = [];
  for (const item of plan) {
    try {
      const res = await fetch(
        `${wc.baseUrl}/wp-json/wc/v3/products/reviews?${auth}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            product_id: item.productId,
            review: item.review,
            reviewer: item.reviewer,
            reviewer_email: item.reviewerEmail,
            rating: item.rating,
          }),
        },
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        results.push({ productId: item.productId, error: JSON.stringify(err) });
      } else {
        const data = await res.json();
        results.push({ productId: item.productId, reviewId: data.id });
      }

      // Small delay to avoid hammering the API
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (err) {
      results.push({ productId: item.productId, error: String(err) });
    }
  }

  const created = results.filter((r) => r.reviewId).length;
  const failed = results.filter((r) => r.error).length;

  return NextResponse.json({
    success: true,
    totalReviews: plan.length,
    created,
    failed,
    results,
  });
}
