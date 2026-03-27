import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';

export const dynamic = 'force-dynamic';

/** GET /api/vendor/products/[id] — fetch single product with all details for editing */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id || isNaN(Number(id))) {
    return NextResponse.json({ error: 'ID prodotto non valido' }, { status: 400 });
  }

  const wc = getWCSecrets();
  const auth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;

  try {
    const res = await fetch(`${wc.baseUrl}/wp-json/wc/v3/products/${id}?${auth}`);
    if (!res.ok) return NextResponse.json({ error: 'Prodotto non trovato' }, { status: 404 });

    const p = await res.json();
    const meta = (p.meta_data || []) as { key: string; value: string }[];
    const getMeta = (key: string) => meta.find(m => m.key === key)?.value || '';

    // Extract attribute values
    const attrs = (p.attributes || []) as { slug: string; options: string[] }[];
    const getAttr = (slug: string): string => {
      const a = attrs.find(a => a.slug === slug);
      return a?.options?.[0] || '';
    };
    const getAttrMulti = (slug: string): string[] => {
      const a = attrs.find(a => a.slug === slug);
      return a?.options || [];
    };

    return NextResponse.json({
      id: p.id,
      name: p.name || '',
      sku: p.sku || '',
      regular_price: p.regular_price || '',
      sale_price: p.sale_price || '',
      stock_quantity: p.stock_quantity,
      short_description: p.short_description || '',
      description: p.description || '',
      status: p.status,
      category_id: p.categories?.[0]?.id || null,
      images: (p.images || []).map((img: { id: number; src: string }) => ({ id: img.id, src: img.src })),
      // Attributes
      produttore: getAttr('pa_produttore'),
      annata: getAttr('pa_annata'),
      nazione: getAttr('pa_nazione'),
      regione: getAttr('pa_regione'),
      denominazione: getAttr('pa_denominazione'),
      uvaggio: getAttrMulti('pa_uvaggio'),
      formato: getAttr('pa_formato'),
      gradazione: getAttr('pa_gradazione-alcolica'),
      momento_consumo: getAttrMulti('pa_momento-di-consumo'),
      abbinamenti: getAttrMulti('pa_abbinamenti'),
      temperatura_servizio: getAttr('pa_temperatura-di-servizio'),
      metodo_produttivo: getAttr('pa_metodo-produttivo'),
      dosaggio: getAttr('pa_dosaggio'),
      spumantizzazione: getAttr('pa_spumantizzazione'),
      raccolta: getAttr('pa_raccolta'),
      tipo_vigneto: getAttr('pa_tipo-di-vigneto'),
      certificazioni: getAttrMulti('pa_certificazioni'),
      // ACF / meta
      alla_vista: getMeta('alla_vista'),
      al_naso: getMeta('al_naso'),
      al_palato: getMeta('al_palato'),
      vinificazione: getMeta('vinificazione'),
      affinamento: getMeta('affinamento'),
      vendemmia: getMeta('vendemmia'),
      allergeni: getMeta('allergeni'),
    });
  } catch (err) {
    console.error('Product fetch error:', err);
    return NextResponse.json({ error: 'Errore server' }, { status: 500 });
  }
}
