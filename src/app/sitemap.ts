import type { MetadataRoute } from 'next';
import { getWCSecrets } from '@/lib/config';

const SITE_URL = 'https://stappando.it';

/** Fetch all published products, paginating through WC REST API. */
async function fetchAllProducts(): Promise<{ slug: string; modified: string }[]> {
  const wc = getWCSecrets();
  const products: { slug: string; modified: string }[] = [];
  let page = 1;

  while (true) {
    const url = new URL('/wp-json/wc/v3/products', wc.baseUrl);
    url.searchParams.set('consumer_key', wc.consumerKey);
    url.searchParams.set('consumer_secret', wc.consumerSecret);
    url.searchParams.set('per_page', '100');
    url.searchParams.set('status', 'publish');
    url.searchParams.set('page', String(page));

    const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
    if (!res.ok) break;

    const data: { slug: string; date_modified: string }[] = await res.json();
    if (data.length === 0) break;

    for (const p of data) {
      products.push({ slug: p.slug, modified: p.date_modified });
    }

    const totalPages = Number(res.headers.get('x-wp-totalpages') || '1');
    if (page >= totalPages) break;
    page++;
  }

  return products;
}

/** Fetch all producer/cantina slugs. */
async function fetchAllCantine(): Promise<{ slug: string }[]> {
  const wc = getWCSecrets();
  const res = await fetch(`${wc.baseUrl}/wp-json/stp-app/v1/producer-logos`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return [];
  const data: { name: string; slug: string }[] = await res.json();
  return data.map((c) => ({ slug: c.slug }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, cantine] = await Promise.all([
    fetchAllProducts(),
    fetchAllCantine(),
  ]);

  const now = new Date().toISOString();

  /* ── Static pages ─────────────────────────────────────── */
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE_URL}/cerca`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/cantine`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/chi-siamo`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/contatti`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/punti-pop`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/spedizioni`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/resi`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/pagamenti`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ];

  /* ── Product pages ────────────────────────────────────── */
  const productPages: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${SITE_URL}/prodotto/${p.slug}`,
    lastModified: p.modified,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  /* ── Cantina pages ────────────────────────────────────── */
  const cantinaPages: MetadataRoute.Sitemap = cantine.map((c) => ({
    url: `${SITE_URL}/cantina/${c.slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...productPages, ...cantinaPages];
}
