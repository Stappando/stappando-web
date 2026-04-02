const BASE = 'https://stappando.it/wp-content/uploads/2026/04/';

/** Maps each abbinamento name (lowercase) to its icon URL */
const ICONS: Record<string, string> = {
  'finger food':             `${BASE}finger-food.png`,
  'dessert':                 `${BASE}dessert.png`,
  'formaggi freschi':        `${BASE}formaggi-freschi.png`,
  'formaggi stagionati':     `${BASE}formaggi-stagionati.png`,
  'formaggi erborinati':     `${BASE}formaggi-erborinati.png`,
  'fritture':                `${BASE}fritture.png`,
  'funghi':                  `${BASE}funghi.png`,
  'insalate':                `${BASE}insalate.png`,
  'polpo':                   `${BASE}polpo.png`,
  'ostriche':                `${BASE}ostriche.png`,
  'risotti leggeri':         `${BASE}risotti-leggeri.png`,
  'risotti strutturati':     `${BASE}risotti-strutturati.png`,
  'pizza bianca o classica': `${BASE}pizza-bianca-o-classica.png`,
  'selvaggina':              `${BASE}selvaggina.png`,
  'uova':                    `${BASE}uova.png`,
  'sushi':                   `${BASE}sushi.png`,
  'verdure':                 `${BASE}verdure.png`,
  'affettati':               `${BASE}affettati.png`,
  'carni rosse':             `${BASE}carni-rosse.png`,
  'carni bianche':           `${BASE}carni-bianche.png`,
  'antipasti di carne':      `${BASE}antipasti-di-carne.png`,
  'arrosti':                 `${BASE}arrosti.png`,
  'salmone':                 `${BASE}salmone.png`,
  'cucina tipica':           `${BASE}cucina-tipica.png`,
  'pesce bianco':            `${BASE}pesce-bianco.png`,
  'crostacei':               `${BASE}crostacei.png`,
};

/** Returns the icon URL for an abbinamento name, or undefined if not found */
export function getAbbinamentoIcon(name: string): string | undefined {
  return ICONS[name.toLowerCase().trim()];
}
