export const API_CONFIG = {
  baseUrl: 'https://stappando.it',
  wc: {
    endpoint: '/wp-json/wc/v3',
    consumerKey: 'ck_e28bb3c3e86e007bad35911cffb20258a1343b53',
    consumerSecret: 'cs_9494a1fed3d4ed450ff53df9166078abb2388e44',
  },
  freeShippingThreshold: 69,
  defaultShippingCost: 6.5,
  tags: { circuito: 21993, confezioniDa6: 21807, bestSeller: 21806 },
} as const;
