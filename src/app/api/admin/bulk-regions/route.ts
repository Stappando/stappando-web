/**
 * Bulk update producer regions/addresses via stp-app/v1/update-producer-meta.
 * GET /api/admin/bulk-regions?password=XXX
 */
import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const P: { slug: string; region: string; address?: string }[] = [
  // ── Abruzzo ──
  { slug: 'di-cicco', region: 'Abruzzo', address: 'Via Roma 73, 66047 Villa Santa Maria (CH)' },
  { slug: 'cantina-pietrantonj', region: 'Abruzzo', address: 'Via San Sebastiano 38, 67030 Vittorito (AQ)' },
  { slug: 'scuppoz', region: 'Abruzzo', address: 'SS 81 Piceno Aprutina 41, 64012 Campovalano di Campli (TE)' },
  { slug: 'castelsimoni-cantina-vini-montagna-abruzzo', region: 'Abruzzo', address: 'Via Amiternina 13, 67100 Cese di Preturo (AQ)' },
  { slug: 'cutina-liquori', region: 'Abruzzo', address: 'Contrada Sterpara snc, 65011 Catignano (PE)' },
  { slug: 'masciarelli', region: 'Abruzzo', address: 'Via Gamberale 2, 66010 San Martino sulla Marrucina (CH)' },
  { slug: 'camilla-montori', region: 'Abruzzo', address: 'Via Piane Tronto 82, 64010 Controguerra (TE)' },
  { slug: 'diubaldo', region: 'Abruzzo', address: 'Via dei Sabini 35, 64016 Sant\'Egidio alla Vibrata (TE)' },
  { slug: 'lidia-amato', region: 'Abruzzo', address: 'Contrada San Biagio 2, 64010 Controguerra (TE)' },
  { slug: 'cataldi-madonna-cantina-biologica-abruzzo', region: 'Abruzzo', address: 'Località Madonna del Piano, 67025 Ofena (AQ)' },
  { slug: 'pasetti', region: 'Abruzzo', address: 'Via San Paolo 21, 66023 Francavilla al Mare (CH)' },
  { slug: 'zaccagnini', region: 'Abruzzo', address: 'Contrada Pozzo 4, 65020 Bolognano (PE)' },
  // ── Aragona ──
  { slug: 'la-sastreria', region: 'Aragona' },
  // ── Basilicata ──
  { slug: 'cantina-del-notaio', region: 'Basilicata', address: 'Via Roma 159, 85028 Rionero in Vulture (PZ)' },
  { slug: 'petracastalda', region: 'Basilicata', address: 'Contrada Boscarelli, 85050 Sasso di Castalda (PZ)' },
  { slug: 'amaro-lucano', region: 'Basilicata', address: 'Viale Cav. Pasquale Vena snc, 75015 Pisticci Scalo (MT)' },
  // ── Borgogna ──
  { slug: 'albert-pic', region: 'Borgogna' },
  // ── Calabria ──
  { slug: 'caffo', region: 'Calabria', address: 'Via Matteotti 11, 89844 Limbadi (VV)' },
  { slug: 'statti', region: 'Calabria', address: 'Contrada Lenti, 88046 Lamezia Terme (CZ)' },
  { slug: 'cantine-vincenzo-ippolito', region: 'Calabria', address: 'Via Tirone 118, 88811 Cirò Marina (KR)' },
  { slug: 'casale-cappellieri', region: 'Calabria', address: 'Via De Martino Francesco, 88811 Cirò Marina (KR)' },
  { slug: 'maddalona-del-casato', region: 'Calabria', address: 'Via Mandorleto 25, 88811 Cirò Marina (KR)' },
  { slug: 'vecchio-magazzino-doganale', region: 'Calabria', address: 'Via Pianette Trav. A. Gotelli 6, 87046 Montalto Uffugo (CS)' },
  { slug: 'essentia-mediterranea', region: 'Calabria', address: 'Via C.L. Giacobini 133, 87042 Altomonte (CS)' },
  // ── Campania ──
  { slug: 'cantina-moio', region: 'Campania', address: 'Viale Margherita 6, 81034 Mondragone (CE)' },
  { slug: 'mastroberardino', region: 'Campania', address: 'Via Manfredi 75/81, 83042 Atripalda (AV)' },
  { slug: 'petra-marzia', region: 'Campania' },
  { slug: 'torricino', region: 'Campania', address: 'Località Torricino 5, 83010 Tufo (AV)' },
  { slug: 'amphoreus', region: 'Campania' },
  { slug: 'vinicola-del-sannio', region: 'Campania', address: 'Contrada San Rocco snc, 82030 Castelvenere (BN)' },
  { slug: 'casa-dambra', region: 'Campania', address: 'Via Mario d\'Ambra 16, 80075 Forio d\'Ischia (NA)' },
  { slug: 'di-meo', region: 'Campania', address: 'Contrada Coccovoni, 83050 Salza Irpina (AV)' },
  { slug: 'montevetrano', region: 'Campania', address: 'Via Montevetrano 3, 84099 San Cipriano Picentino (SA)' },
  { slug: 'tenuta-le-lune-del-vesuvio', region: 'Campania', address: 'Via Vicinale Lavarella 1, 80040 Terzigno (NA)' },
  { slug: 'alberti', region: 'Campania', address: 'Largo Giuseppe Alberti 14, 82100 Benevento (BN)' },
  // ── Champagne ──
  { slug: 'veuve-cliquot', region: 'Champagne', address: '12 Rue du Temple, 51100 Reims (France)' },
  { slug: 'perrier-jouet', region: 'Champagne', address: '28 Avenue de Champagne, 51200 Épernay (France)' },
  { slug: 'moet-chandon', region: 'Champagne', address: '20 Avenue de Champagne, 51200 Épernay (France)' },
  { slug: 'ruinart', region: 'Champagne', address: '4 Rue des Crayères, 51100 Reims (France)' },
  { slug: 'bollinger', region: 'Champagne', address: '16 Rue Jules Lobet, 51160 Aÿ-Champagne (France)' },
  { slug: 'veuve-pelletier', region: 'Champagne' },
  { slug: 'billecart-salmon', region: 'Champagne', address: '40 Rue Carnot, 51160 Mareuil-sur-Aÿ (France)' },
  { slug: 'dalamotte', region: 'Champagne', address: '5-7 Rue de la Brèche d\'Oger, 51190 Le Mesnil-sur-Oger (France)' },
  { slug: 'laurent-perrier', region: 'Champagne', address: '32 Avenue de Champagne, 51150 Tours-sur-Marne (France)' },
  { slug: 'louis-roederer', region: 'Champagne', address: '21 Boulevard Lundy, 51100 Reims (France)' },
  { slug: 'tattinger', region: 'Champagne', address: '9 Place Saint-Nicaise, 51100 Reims (France)' },
  { slug: 'ayala', region: 'Champagne', address: '1 Rue Edmond de Ayala, 51160 Aÿ-Champagne (France)' },
  // ── Charente ──
  { slug: 'courvoisier', region: 'Charente', address: '2 Place du Château, 16200 Jarnac (France)' },
  { slug: 'francois-peyrot', region: 'Charente' },
  // ── Emilia-Romagna ──
  { slug: 'merlotta', region: 'Emilia-Romagna', address: 'Via Merlotta 1, 40026 Imola (BO)' },
  { slug: 'cantina-divinja', region: 'Emilia-Romagna', address: 'Via Verdeta 1, 41030 Sorbara di Bomporto (MO)' },
  { slug: 'gruppo-montenegro', region: 'Emilia-Romagna', address: 'Via Enrico Fermi 4, 40069 Zola Predosa (BO)' },
  { slug: 'tenuta-forcirola', region: 'Emilia-Romagna', address: 'Via Nazionale 130, 41030 Bomporto (MO)' },
  { slug: 'biancosarti', region: 'Emilia-Romagna' },
  // ── Friuli Venezia Giulia ──
  { slug: 'corte-della-contea', region: 'Friuli Venezia Giulia', address: 'Via Gregorčič 28, 34170 Gorizia (GO)' },
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
  { slug: 'pallini', region: 'Lazio', address: 'Via Tiburtina 1314, 00131 Roma (RM)' },
  { slug: 'poggio-le-volpi', region: 'Lazio', address: 'Via Fontana Candida 3, 00078 Monte Porzio Catone (RM)' },
  { slug: 'antonella-pacchiarotti', region: 'Lazio', address: 'Via Roma 14, 01025 Grotte di Castro (VT)' },
  { slug: 'casale-mattia', region: 'Lazio', address: 'Via XX Settembre 48, 00044 Frascati (RM)' },
  { slug: 'proietti', region: 'Lazio', address: 'Via Maremmana Superiore Km 2,800, 00035 Olevano Romano (RM)' },
  { slug: 'cantina-bacco', region: 'Lazio', address: 'Via Eschieto 1, 00048 Nettuno (RM)' },
  { slug: 'cantina-di-montefiascone', region: 'Lazio', address: 'Via Grilli 2, 01027 Montefiascone (VT)' },
  { slug: 'de-marco', region: 'Lazio', address: 'Via Piazzolo 19, 00188 Roma (RM)' },
  { slug: 'federici', region: 'Lazio', address: 'Via Santa Apollaria Vecchia 30, 00039 Zagarolo (RM)' },
  { slug: 'sergio-mottura', region: 'Lazio', address: 'Località Poggio della Costa 1, 01020 Civitella d\'Agliano (VT)' },
  { slug: 'cincinnato', region: 'Lazio', address: 'Via Cori-Cisterna Km 2, 04010 Cori (LT)' },
  { slug: 'falesco', region: 'Lazio', address: 'Loc. San Pietro snc, 05020 Montecchio (TR)' },
  { slug: 'molinari', region: 'Lazio', address: 'Viale delle Milizie 12, 00192 Roma (RM)' },
  { slug: 'tarchna', region: 'Lazio' },
  { slug: 'distilleria-numa', region: 'Lazio', address: 'Via Cardinal Tiberio Crispi 8, 01016 Tarquinia (VT)' },
  { slug: 'famiglia-cotarella', region: 'Lazio', address: 'Loc. San Pietro snc, 05020 Montecchio (TR)' },
  { slug: 'gabriele-magno', region: 'Lazio', address: 'Via Valle Marciana 24, 00046 Grottaferrata (RM)' },
  { slug: 'lolivella', region: 'Lazio', address: 'Via Colle Pisano 5, 00044 Frascati (RM)' },
  { slug: 'logindry', region: 'Lazio' },
  { slug: 'san-giovenale', region: 'Lazio', address: 'Loc. La Macchia, 01010 Blera (VT)' },
  { slug: 'stefanoni', region: 'Lazio', address: 'Via Stefanoni 48, 01027 Montefiascone (VT)' },
  { slug: 'tenuta-le-quinte', region: 'Lazio', address: 'Via delle Marmorelle Nuova 91, 00040 Montecompatri (RM)' },
  // ── Liguria ──
  { slug: 'cinqueterre', region: 'Liguria', address: 'Località Groppo, 19017 Riomaggiore (SP)' },
  { slug: 'terenzuola', region: 'Liguria', address: 'Via Vercalda 14, 54035 Fosdinovo (MS)' },
  { slug: 'bisson', region: 'Liguria', address: 'Contrada Pestella 42, 16039 Sestri Levante (GE)' },
  { slug: 'portofino', region: 'Liguria' },
  // ── Lombardia ──
  { slug: 'dune-premium-cocktails', region: 'Lombardia' },
  { slug: 'castel-faglia', region: 'Lombardia', address: 'Via Boschi 3, 25046 Cazzago San Martino (BS)' },
  { slug: 'barbalonga', region: 'Lombardia', address: 'Via Monte Orfano 25, 25038 Rovato (BS)' },
  { slug: 'berlucchi', region: 'Lombardia', address: 'Piazza Duranti 4, 25040 Borgonato di Corte Franca (BS)' },
  { slug: 'campari', region: 'Lombardia', address: 'Via Franco Sacchetti 20, 20099 Sesto San Giovanni (MI)' },
  { slug: 'bellavista', region: 'Lombardia', address: 'Via Bellavista 5, 25030 Erbusco (BS)' },
  { slug: 'fratelli-branca', region: 'Lombardia', address: 'Via Resegone 2, 20159 Milano (MI)' },
  { slug: 'contadi-castaldi', region: 'Lombardia', address: 'Via Colzano 32, 25030 Adro (BS)' },
  { slug: 'quaquarini-2', region: 'Lombardia', address: 'Via Casa Zambianchi 26, 27044 Canneto Pavese (PV)' },
  { slug: 'bisleri', region: 'Lombardia' },
  { slug: 'la-poggiolo', region: 'Lombardia', address: 'Frazione Poggiolo 9 bis, 27040 Montù Beccaria (PV)' },
  { slug: 'tumbler-srl', region: 'Lombardia' },
  // ── Marche ──
  { slug: 'piersanti', region: 'Marche', address: 'Contrada Ponte Magno 28, 60034 Cupramontana (AN)' },
  { slug: 'umani-e-ronchi', region: 'Marche', address: 'Via Adriatica 12, 60027 Osimo (AN)' },
  { slug: 'varnelli', region: 'Marche', address: 'Via Girolamo Varnelli 10, 62034 Muccia (MC)' },
  { slug: 'le-cime-basse-s-s', region: 'Marche' },
  { slug: 'belisario', region: 'Marche', address: 'Via A. Merloni 12, 62024 Matelica (MC)' },
  { slug: 'velenosi', region: 'Marche', address: 'Via dei Biancospini 11, 63100 Ascoli Piceno (AP)' },
  { slug: '120montebianco', region: 'Marche', address: 'Strada di Montebianco 120, 60019 Senigallia (AN)' },
  { slug: 'borghetti', region: 'Marche' },
  { slug: 'fazi-battaglia', region: 'Marche', address: 'Via Roma 117, 60031 Castelplanio (AN)' },
  { slug: 'ottavio-piersanti', region: 'Marche', address: 'Via Borgo Santa Maria 60, 60038 San Paolo di Jesi (AN)' },
  { slug: 'tenute-polini', region: 'Marche', address: 'Via Menocchia 21, 63063 Carassai (AP)' },
  { slug: 'bocca-di-gabbia', region: 'Marche', address: 'Contrada Castelletta 56, 62012 Civitanova Marche (MC)' },
  // ── Piemonte ──
  { slug: 'marolo', region: 'Piemonte', address: 'Corso Canale 105/1, 12051 Alba (CN)' },
  { slug: 'balbi-soprani', region: 'Piemonte', address: 'Corso Piave 140, 12058 Santo Stefano Belbo (CN)' },
  { slug: 'fratelli-giacosa', region: 'Piemonte', address: 'Via XX Settembre 64, 12052 Neive (CN)' },
  { slug: 'berta', region: 'Piemonte', address: 'Via Guasti 34/36, Fraz. Casalotto, 14046 Mombaruzzo (AT)' },
  { slug: 'ceretto-cantina-langhe-vini-biologici', region: 'Piemonte', address: 'Località San Cassiano 34, 12051 Alba (CN)' },
  { slug: 'martini', region: 'Piemonte', address: 'Piazza Luigi Rossi 2, 10023 Pessione di Chieri (TO)' },
  { slug: 'azienda-agricola-alciati-giancarlo', region: 'Piemonte', address: 'Via Goretta 15, 14041 Agliano Terme (AT)' },
  { slug: 'bosca', region: 'Piemonte', address: 'Via Luigi Bosca 2, 14053 Canelli (AT)' },
  { slug: 'duchessa-lia', region: 'Piemonte', address: 'Corso Piave 140, 12058 Santo Stefano Belbo (CN)' },
  { slug: 'claudio-alario', region: 'Piemonte', address: 'Via Santa Croce 23, 12055 Diano d\'Alba (CN)' },
  { slug: 'distillerie-quaglia', region: 'Piemonte', address: 'Viale Europa 3, 14022 Castelnuovo Don Bosco (AT)' },
  { slug: 'toselli', region: 'Piemonte', address: 'Via Luigi Bosca 2, 14053 Canelli (AT)' },
  { slug: 'antica-torino', region: 'Piemonte', address: 'Piazza Vittorio Veneto 12, 10123 Torino (TO)' },
  { slug: 'carpano', region: 'Piemonte' },
  { slug: 'engine', region: 'Piemonte', address: 'Strada Giro della Valle 3, 12050 Barbaresco (CN)' },
  { slug: 'travaglini', region: 'Piemonte', address: 'Via delle Vigne 36, 13045 Gattinara (VC)' },
  { slug: 'vigne-marina-coppi', region: 'Piemonte', address: 'Via Sant\'Andrea 5, 15051 Castellania Coppi (AL)' },
  { slug: 'villa-ascenti', region: 'Piemonte', address: 'Via Statale 63, 12069 Santa Vittoria d\'Alba (CN)' },
  // ── Puglia ──
  { slug: 'san-marzano', region: 'Puglia', address: 'Via Monsignor Bello 9, 74020 San Marzano di San Giuseppe (TA)' },
  { slug: 'teanum', region: 'Puglia', address: 'Via Salvemini 1, 71010 San Paolo di Civitate (FG)' },
  { slug: 'apollonio-1870', region: 'Puglia', address: 'Via San Pietro in Lama 7, 73047 Monteroni di Lecce (LE)' },
  { slug: 'scarpello', region: 'Puglia', address: 'Via L. Galvani 24/A, 72026 San Pancrazio Salentino (BR)' },
  { slug: 'marzodd', region: 'Puglia', address: 'Via Giuseppe di Vittorio 11, 70015 Noci (BA)' },
  { slug: 'mottura', region: 'Puglia', address: 'Piazza Melica 4, 73058 Tuglie (LE)' },
  { slug: 'terre-aprica', region: 'Puglia' },
  { slug: 'conte-di-campiano', region: 'Puglia', address: 'Via Legnaghi Corradini 30/A, 37030 Cazzano di Tramigna (VR)' },
  { slug: 'leone-de-castris', region: 'Puglia', address: 'Via Senatore De Castris 26, 73015 Salice Salentino (LE)' },
  { slug: 'tormaresca', region: 'Puglia', address: 'S.P. 86 per Torre San Gennaro Km 5, 72027 San Pietro Vernotico (BR)' },
  // ── Sardegna ──
  { slug: 'cantina-santa-maria-la-palma-alghero', region: 'Sardegna', address: 'Via Zirra snc, Loc. Santa Maria La Palma, 07041 Alghero (SS)' },
  { slug: 'argiolas', region: 'Sardegna', address: 'Via Roma 28/30, 09040 Serdiana (CA)' },
  { slug: 'agricola-giacu', region: 'Sardegna', address: 'Via Veneto 20/A, 08038 Sorgono (NU)' },
  { slug: 'cantina-li-seddi', region: 'Sardegna', address: 'Via Mare 78, 07030 Badesi (SS)' },
  { slug: 'capichera', region: 'Sardegna', address: 'Strada per S. Antonio di Gallura Km 4, 07021 Arzachena (SS)' },
  { slug: 'piero-mancini', region: 'Sardegna', address: 'Via Madagascar 17, Z.I. Sett. 1, 07026 Olbia (SS)' },
  { slug: 'sella-mosca', region: 'Sardegna', address: 'Località I Piani, 07041 Alghero (SS)' },
  { slug: 'zedda-piras', region: 'Sardegna', address: 'Regione I Piani, 07041 Alghero (SS)' },
  { slug: 'ichnusa', region: 'Sardegna', address: 'Zona Industriale Macchiareddu, 09032 Assemini (CA)' },
  { slug: 'cantina-gallura', region: 'Sardegna', address: 'Via Val di Cossu 9, 07029 Tempio Pausania (SS)' },
  { slug: 'contini', region: 'Sardegna', address: 'Via Genova 48-50, 09072 Cabras (OR)' },
  { slug: 'tenute-centu-e-prusu', region: 'Sardegna' },
  // ── Sicilia ──
  { slug: 'azienda-vitivinicola-tola', region: 'Sicilia', address: 'Via Giacomo Matteotti 2, 90047 Partinico (PA)' },
  { slug: 'quattrocieli', region: 'Sicilia', address: 'Strada Statale 119 Km 3,3, 91011 Alcamo (TP)' },
  { slug: 'madaudo', region: 'Sicilia', address: 'Via Antonello da Messina, 98049 Villafranca Tirrena (ME)' },
  { slug: 'cusumano', region: 'Sicilia', address: 'Contrada San Carlo, Via Bisaccia SNC, 90047 Partinico (PA)' },
  { slug: 'rossa', region: 'Sicilia' },
  { slug: 'tenuta-le-palme', region: 'Sicilia' },
  { slug: 'donnafugata', region: 'Sicilia', address: 'Via Sebastiano Lipari 18, 91025 Marsala (TP)' },
  { slug: 'terre-dellisola', region: 'Sicilia' },
  { slug: 'giovinco', region: 'Sicilia', address: 'Via S. Lucia 19, 92017 Sambuca di Sicilia (AG)' },
  { slug: 'panarea', region: 'Sicilia' },
  { slug: 'tasca-dalmerita', region: 'Sicilia', address: 'Via dei Fiori 13, 90129 Palermo (PA)' },
  { slug: 'averna', region: 'Sicilia', address: 'Via Xiboli 345, 93100 Caltanissetta (CL)' },
  { slug: 'hauner', region: 'Sicilia', address: 'Via Umberto I 1, 98050 Santa Marina Salina (ME)' },
  { slug: 'palmento-costanzo', region: 'Sicilia', address: 'Contrada Santo Spirito, 95012 Castiglione di Sicilia (CT)' },
  { slug: 'planeta', region: 'Sicilia', address: 'Contrada Dispensa, 92013 Menfi (AG)' },
  // ── Toscana ──
  { slug: 'banfi', region: 'Toscana', address: 'Castello di Poggio alle Mura, 53024 Montalcino (SI)' },
  { slug: 'marchesi-antinori', region: 'Toscana', address: 'Via Cassia per Siena 133, Loc. Bargino, 50026 San Casciano Val di Pesa (FI)' },
  { slug: 'carpineto', region: 'Toscana', address: 'Località Dudda 17/B, 50022 Greve in Chianti (FI)' },
  { slug: 'luteraia', region: 'Toscana', address: 'Via Luteraia 4, 53045 Acquaviva di Montepulciano (SI)' },
  { slug: 'sensi', region: 'Toscana', address: 'Via Cerbaia 107, 51035 Lamporecchio (PT)' },
  { slug: 'cantina-di-pitigliano', region: 'Toscana', address: 'Via N. Ciacci 974, 58017 Pitigliano (GR)' },
  { slug: 'barbanera', region: 'Toscana', address: 'Via del Palazzone 4, Fraz. Piazze, 53040 Cetona (SI)' },
  { slug: 'birrificio-san-quirico', region: 'Toscana', address: 'Via Dante Alighieri 93a, 53027 San Quirico d\'Orcia (SI)' },
  { slug: 'casagrande-della-quercia', region: 'Toscana', address: 'Strada Comunale delle Masse 63/1, Loc. Quattro Vie, 53011 Castellina in Chianti (SI)' },
  { slug: 'terre-del-marchesato', region: 'Toscana', address: 'Località Sant\'Uberto 164, 57022 Castagneto Carducci (LI)' },
  { slug: 'erik-banti', region: 'Toscana', address: 'Località Fosso dei Molini, 58054 Scansano (GR)' },
  { slug: 'san-felice', region: 'Toscana', address: 'Località San Felice, 53019 Castelnuovo Berardenga (SI)' },
  { slug: 'tenuta-dellornellaia', region: 'Toscana', address: 'Via Bolgherese 191, 57022 Castagneto Carducci (LI)' },
  { slug: 'tenuta-san-guido', region: 'Toscana', address: 'Loc. Capanne 27, 57022 Bolgheri (LI)' },
  { slug: 'borghi-fioriti', region: 'Toscana', address: 'Via Empolese 32, 50018 Scandicci (FI)' },
  { slug: 'castelli-del-grevepesa', region: 'Toscana', address: 'Via Gabbiano 34, 50026 San Casciano Val di Pesa (FI)' },
  { slug: 'duca-di-saragnano', region: 'Toscana', address: 'Via del Palazzone 4, Fraz. Piazze, 53040 Cetona (SI)' },
  { slug: 'fattoria-di-calappiano', region: 'Toscana', address: 'Via di Calappiano 37, 50059 Vinci (FI)' },
  { slug: 'gualdo-del-re', region: 'Toscana', address: 'Località Notri 77, 57028 Suvereto (LI)' },
  { slug: 'il-puledro', region: 'Toscana' },
  { slug: 'san-zenone', region: 'Toscana', address: 'Via per Marco 12/B, 38068 Rovereto (TN)' },
  // ── Trentino-Alto Adige ──
  { slug: 'colterenzio', region: 'Trentino-Alto Adige', address: 'Strada del Vino 8, 39057 Cornaiano (BZ)' },
  { slug: 'san-michele-appiano', region: 'Trentino-Alto Adige', address: 'Via Circonvallazione 17-19, 39057 Appiano sulla Strada del Vino (BZ)' },
  { slug: 'k-martini-sohn', region: 'Trentino-Alto Adige', address: 'Via Lamm 28, 39057 Cornaiano (BZ)' },
  { slug: 'elena-walch', region: 'Trentino-Alto Adige', address: 'Via A. Hofer 1, 39040 Termeno sulla Strada del Vino (BZ)' },
  { slug: 'ferrari', region: 'Trentino-Alto Adige', address: 'Via Ponte di Ravina 15, 38123 Trento (TN)' },
  { slug: 'altemasi', region: 'Trentino-Alto Adige', address: 'Via del Ponte 33, 38123 Ravina (TN)' },
  { slug: 'thomas-dorfmann', region: 'Trentino-Alto Adige', address: 'Untrum 8, 39040 Velturno (BZ)' },
  // ── Umbria ──
  { slug: 'lungarotti', region: 'Umbria', address: 'Viale Giorgio Lungarotti 2, 06089 Torgiano (PG)' },
  { slug: 'pomario', region: 'Umbria', address: 'Località Pomario, 06066 Piegaro (PG)' },
  { slug: 'azienda-agricola-il-poggiolo', region: 'Umbria', address: 'Via Case Sparse 10/A, 06057 Monte Castello di Vibio (PG)' },
  { slug: 'favaroni', region: 'Umbria', address: 'Via dell\'Arte 8, 06030 Giano dell\'Umbria (PG)' },
  { slug: 'casale-triocco', region: 'Umbria', address: 'Località Petrognano 54, 06049 Spoleto (PG)' },
  { slug: 'leonucci', region: 'Umbria', address: 'Fraz. Montignano 43, 06056 Massa Martana (PG)' },
  { slug: 'pizzogallo', region: 'Umbria', address: 'S.P. Amelia-Orte Km 5,050, Loc. Pizzogallo, 05022 Amelia (TR)' },
  { slug: 'cantina-dei-colli-amerini', region: 'Umbria', address: 'Località Fornole, 05022 Amelia (TR)' },
  // ── Valle d'Aosta ──
  { slug: 'crotta-de-vigneron', region: "Valle d'Aosta" },
  { slug: 'savio', region: "Valle d'Aosta" },
  // ── Veneto ──
  { slug: 'montagner', region: 'Veneto', address: 'Via Callalta Capoluogo 3, 31045 Motta di Livenza (TV)' },
  { slug: 'mazzolada', region: 'Veneto', address: 'Via Triestina 21, Fraz. Mazzolada, 30026 Portogruaro (VE)' },
  { slug: 'casa-defra', region: 'Veneto', address: 'Via 4 Novembre, 36050 Montorso Vicentino (VI)' },
  { slug: 'distillerie-poli', region: 'Veneto', address: 'Via Marconi 46, 36060 Schiavon (VI)' },
  { slug: 'cielo-e-terra', region: 'Veneto', address: 'Via IV Novembre 39, 36050 Montorso Vicentino (VI)' },
  { slug: 'barbieri', region: 'Veneto' },
  { slug: 'borgo-antico', region: 'Veneto', address: 'Via Strada delle Spezie 39, 31015 Conegliano (TV)' },
  { slug: 'bonollo', region: 'Veneto', address: 'Via Galileo Galilei 6, 35035 Mestrino (PD)' },
  { slug: 'luxardo', region: 'Veneto', address: 'Via Romana 42, 35038 Torreglia (PD)' },
  { slug: 'monte-tondo', region: 'Veneto', address: 'Via San Lorenzo 89, 37038 Soave (VR)' },
  { slug: 'contessa-carola', region: 'Veneto', address: 'Via Cal di Sopra 8, 37030 Cazzano di Tramigna (VR)' },
  { slug: 'zenato', region: 'Veneto', address: 'Via San Benedetto 8, 37019 Peschiera del Garda (VR)' },
  { slug: 'bonaventura-maschio', region: 'Veneto', address: 'Via Vizza 6, 31018 Gaiarine (TV)' },
  { slug: 'contri-spumanti', region: 'Veneto', address: 'Via Legnaghi Corradini 30/A, 37030 Cazzano di Tramigna (VR)' },
  { slug: 'gambrinus', region: 'Veneto', address: 'Via Capitello 18, 31020 San Polo di Piave (TV)' },
  { slug: 'la-braghina', region: 'Veneto', address: 'Via Triestina 25, 30020 Lison di Portogruaro (VE)' },
  { slug: 'maculan', region: 'Veneto', address: 'Via Castelletto 3, 36042 Breganze (VI)' },
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
