import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
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
    const getAttrMulti = (name: string) => attrs.find(a => a.name.toLowerCase() === name.toLowerCase())?.options?.join(', ') || '';
    const getMeta = (key: string) => meta.find(m => m.key === key)?.value || '';

    const data = {
      nome: p.name || '',
      produttore: getAttr('Produttore'),
      vendorId: getMeta('_vendor_id'),
      sku: p.sku || '',
      categoria: (p.categories || [])[0]?.name || '',
      annata: getAttr('Annata'),
      formato: getAttr('Formato') || '75 cl',
      denominazione: getAttr('Denominazione'),
      regione: getAttr('Regione'),
      nazione: getAttr('Nazione') || 'Italia',
      uvaggio: getAttrMulti('Uvaggio'),
      gradazione: getAttr('Alcol') || getAttr('Gradazione alcolica'),
      descBreve: p.short_description?.replace(/<[^>]*>/g, '') || '',
      descLunga: p.description?.replace(/<[^>]*>/g, '') || '',
      allaVista: getMeta('alla_vista'),
      alNaso: getMeta('al_naso'),
      alPalato: getMeta('al_palato'),
      abbinamenti: getAttrMulti('Abbinamenti'),
      temperaturaServizio: getAttr('Temperatura di servizio'),
      momentoConsumo: getAttr('Momento di consumo'),
      vinificazione: getMeta('vinificazione'),
      affinamento: getMeta('affinamento'),
      allergeni: getAttr('Allergeni') || 'Contiene solfiti',
      terreno: getAttr('Terreno') || getMeta('terreno'),
      esposizione: getMeta('esposizione'),
      altitudine: getMeta('altitudine'),
      zonaProduzione: getMeta('zona_produzione'),
      resa: getAttr('Resa'),
      vendemmia: getMeta('vendemmia'),
      bottiglieProdotte: getMeta('bottiglie_prodotte'),
      certificazioni: getAttrMulti('Certificazioni'),
      tags: (p.tags || []).map((t: { name: string }) => t.name).join(', '),
    };

    return NextResponse.json(data);
  } catch (err) {
    console.error('Load product error:', err);
    return NextResponse.json({ error: 'Errore caricamento' }, { status: 500 });
  }
}
