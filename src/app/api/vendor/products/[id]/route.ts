import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'ID obbligatorio' }, { status: 400 });

  const wc = getWCSecrets();
  const auth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;

  try {
    const res = await fetch(`${wc.baseUrl}/wp-json/wc/v3/products/${id}?${auth}`);
    if (!res.ok) return NextResponse.json({ error: 'Prodotto non trovato' }, { status: 404 });

    const p = await res.json();
    const attrs = (p.attributes || []) as { name: string; options: string[] }[];
    const meta = (p.meta_data || []) as { key: string; value: string }[];

    const getAttr = (name: string) => attrs.find(a => a.name.toLowerCase() === name.toLowerCase())?.options?.[0] || '';
    const getAttrMulti = (name: string) => attrs.find(a => a.name.toLowerCase() === name.toLowerCase())?.options || [];
    const getMeta = (key: string) => meta.find(m => m.key === key)?.value || '';

    return NextResponse.json({
      id: p.id,
      name: p.name || '',
      sku: p.sku || '',
      regular_price: p.regular_price || '',
      sale_price: p.sale_price || '',
      stock_quantity: p.stock_quantity,
      status: p.status,
      category_id: (p.categories || [])[0]?.id || 0,
      produttore: getAttr('Produttore'),
      annata: getAttr('Annata'),
      formato: getAttr('Formato') || '75 cl',
      denominazione: getAttr('Denominazione'),
      regione: getAttr('Regione'),
      nazione: getAttr('Nazione') || 'Italia',
      uvaggio: getAttrMulti('Uvaggio'),
      gradazione: getAttr('Alcol') || getAttr('Gradazione alcolica'),
      short_description: (p.short_description || '').replace(/<[^>]*>/g, ''),
      description: (p.description || '').replace(/<[^>]*>/g, ''),
      alla_vista: getMeta('alla_vista'),
      al_naso: getMeta('al_naso'),
      al_palato: getMeta('al_palato'),
      abbinamenti: getAttrMulti('Abbinamento'),
      temperatura_servizio: getAttr('Servire a') || getAttr('Temperatura di servizio'),
      momento_consumo: getAttrMulti('Momento di consumo'),
      vinificazione: getMeta('vinificazione'),
      affinamento: getMeta('affinamento'),
      allergeni: getAttr('Allergeni') || 'Contiene solfiti',
      terreno: getAttrMulti('Terreno'),
      altitudine: getAttr('Altitudine dei vigneti'),
      zona_produzione: getAttr('Zona di produzione'),
      resa: getAttr('Resa'),
      bottiglie_prodotte: getAttr('Bottiglie prodotte'),
      raccolta: getAttr('Raccolta'),
      densita_impianto: getAttr("Densit\u00e0 d'impianto"),
      spumantizzazione: getAttr('Spumantizzazione'),
      categoria_spumanti: getAttr('Categoria spumanti'),
      dosaggio: getAttr('Dosaggio'),
      orientamento_vigne: getAttr('Orientamento delle vigne'),
      tipo_vigneto: getAttr('Tipo di vigneto'),
      periodo_vendemmia: getAttrMulti('Periodo vendemmia'),
      certificazioni: getAttrMulti('Certificazioni'),
      categoriaGoogle: getAttr('categoria Google'),
      gtin: getMeta('_wpm_gtin_code') || getAttr('EAN'),
      esposizione: getMeta('esposizione'),
      vendemmia: getMeta('vendemmia'),
      images: (p.images || []).map((i: { id: number; src: string }) => ({ id: i.id, src: i.src })),
    });
  } catch (err) {
    console.error('Load product error:', err);
    return NextResponse.json({ error: 'Errore caricamento' }, { status: 500 });
  }
}
