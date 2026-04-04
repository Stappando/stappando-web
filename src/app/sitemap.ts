import type { MetadataRoute } from 'next';

const SITE_URL = 'https://stappando.it';

/**
 * Fetch all paginated results from a WC/WP REST API endpoint.
 * Returns an array of items with at least a `slug` field.
 */
async function fetchAllSlugs(
  url: string,
): Promise<{ slug: string; modified?: string }[]> {
  const results: { slug: string; modified?: string }[] = [];
  let page = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const separator = url.includes('?') ? '&' : '?';
    const res = await fetch(`${url}${separator}per_page=100&page=${page}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) break;
    const items: { slug: string; modified?: string; date_modified?: string }[] =
      await res.json();
    if (items.length === 0) break;
    results.push(
      ...items.map((i) => ({
        slug: i.slug,
        modified: i.modified || i.date_modified,
      })),
    );
    if (items.length < 100) break;
    page++;
  }

  return results;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date().toISOString();

  /* ── Static pages ──────────────────────────────────────── */
  const staticEntries: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/cerca`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/cantine`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/cerca?tag=best-seller`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/cerca?on_sale=true`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/cerca?max_price=8`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${SITE_URL}/cerca?tag=regali`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/chi-siamo`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/contatti`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${SITE_URL}/punti-pop`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/spedizioni`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/pagamenti`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/resi`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/termini`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  /* ── Dynamic pages — fetch in parallel, fallback to static-only on error ─ */
  const wcBase = process.env.WC_BASE_URL || 'https://stappando.it';
  const ck = process.env.WC_CONSUMER_KEY || '';
  const cs = process.env.WC_CONSUMER_SECRET || '';
  const auth = `consumer_key=${ck}&consumer_secret=${cs}`;

  try {
    const [products, posts, categories, cantine] = await Promise.all([
      fetchAllSlugs(
        `${wcBase}/wp-json/wc/v3/products?status=publish&_fields=slug,date_modified&${auth}`,
      ).catch(() => []),
      fetchAllSlugs(
        `${wcBase}/wp-json/wp/v2/posts?_fields=slug,modified`,
      ).catch(() => []),
      fetchAllSlugs(
        `${wcBase}/wp-json/wc/v3/products/categories?hide_empty=1&_fields=slug&${auth}`,
      ).catch(() => []),
      fetchAllSlugs(
        `${wcBase}/wp-json/wc/v3/products/attributes/10/terms?_fields=slug&${auth}`,
      ).catch(() => []),
    ]);

    const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
      url: `${SITE_URL}/prodotto/${p.slug}`,
      lastModified: p.modified || now,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    const postEntries: MetadataRoute.Sitemap = posts.map((p) => ({
      url: `${SITE_URL}/blog/${p.slug}`,
      lastModified: p.modified || now,
      changeFrequency: 'monthly',
      priority: 0.6,
    }));

    const categoryEntries: MetadataRoute.Sitemap = categories
      .filter((c) => c.slug !== 'uncategorized')
      .map((c) => ({
        url: `${SITE_URL}/categoria/${c.slug}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.7,
      }));

    const cantineEntries: MetadataRoute.Sitemap = cantine.map((c) => ({
      url: `${SITE_URL}/cantine/${c.slug}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    }));

    return [
      ...staticEntries,
      ...productEntries,
      ...postEntries,
      ...categoryEntries,
      ...cantineEntries,
    ];
  } catch {
    // Fallback: return static sitemap if API calls fail
    return staticEntries;
  }
}
