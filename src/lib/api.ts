import { API_CONFIG, DEFAULT_VENDOR_NAME, getWCSecrets } from './config';

const { baseUrl } = API_CONFIG;

/* ── Types ─────────────────────────────────────────────── */

export interface WCProduct {
  id: number;
  name: string;
  slug: string;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  description: string;
  short_description: string;
  images: { id: number; src: string; alt: string }[];
  categories: { id: number; name: string; slug: string }[];
  attributes: { id: number; name: string; options: string[] }[];
  tags: { id: number; name: string; slug: string }[];
  meta_data?: { id?: number; key: string; value: string }[];
  stock_status: string;
  stock_quantity: number | null;
  average_rating: string;
  rating_count: number;
  store?: { id: number; name: string; url: string };
  _vendorId?: string;
  _vendorName?: string;
}

export interface WCCategory {
  id: number;
  name: string;
  slug: string;
  parent: number;
  count: number;
  image: { src: string; alt: string } | null;
}

export interface WPPost {
  id: number;
  slug: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
  date: string;
  link: string;
  _embedded?: { 'wp:featuredmedia'?: { source_url: string }[] };
}

interface VendorApiResponse {
  vendors: Record<string, { vendor_id: string | number; vendor_name: string; vendor_slug: string }>;
}

/* ── Helpers ────────────────────────────────────────────── */

function buildUrl(path: string, params?: Record<string, string | number>): string {
  const wc = getWCSecrets();
  const url = new URL(`/wp-json/wc/v3${path}`, wc.baseUrl);
  url.searchParams.set('consumer_key', wc.consumerKey);
  url.searchParams.set('consumer_secret', wc.consumerSecret);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, String(value));
    });
  }
  return url.toString();
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; params?: Record<string, string | number> } = {},
): Promise<T> {
  const { method = 'GET', body, params } = options;
  const url = buildUrl(path, params);
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    next: { revalidate: 300 },
  } as RequestInit);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  return response.json();
}

export function getProduttore(product: WCProduct): string | undefined {
  const attr = product.attributes?.find((a) => a.name.toLowerCase() === 'produttore');
  return attr?.options?.[0];
}

export function decodeHtml(html: string): string {
  return html
    .replace(/&#8211;/g, '\u2013')
    .replace(/&#8217;/g, '\u2019')
    .replace(/&#8220;/g, '\u201C')
    .replace(/&#8221;/g, '\u201D')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/<[^>]+>/g, '');
}

export function formatPrice(price: string | number): string {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num)) return '0,00';
  return num.toFixed(2).replace('.', ',');
}

export function getDiscount(product: WCProduct): number {
  if (!product.on_sale || !product.regular_price) return 0;
  const regular = parseFloat(product.regular_price);
  const sale = parseFloat(product.price);
  if (!regular || !sale) return 0;
  return Math.round((1 - sale / regular) * 100);
}

/* ── Vendor enrichment ──────────────────────────────────── */

async function getVendorMap(
  ids: number[],
): Promise<Record<string, { vendor_id: string | number; vendor_name: string }>> {
  if (ids.length === 0) return {};
  try {
    const url = `${baseUrl}/wp-json/stp-app/v1/product-vendors?ids=${ids.join(',')}`;
    const response = await fetch(url, { next: { revalidate: 600 } } as RequestInit);
    if (!response.ok) return {};
    const data: VendorApiResponse = await response.json();
    return data.vendors || {};
  } catch {
    return {};
  }
}

async function enrichProductsWithVendors(products: WCProduct[]): Promise<WCProduct[]> {
  const idsToEnrich = products.filter((p) => !p._vendorId).map((p) => p.id);
  if (idsToEnrich.length === 0) return products;
  try {
    const vendorMap = await getVendorMap(idsToEnrich);
    return products.map((p) => {
      if (p._vendorId) return p;
      const vendor = vendorMap[String(p.id)];
      if (vendor) {
        return {
          ...p,
          _vendorId: String(vendor.vendor_id),
          _vendorName: vendor.vendor_name,
          store: { id: 0, name: vendor.vendor_name, url: '' },
        };
      }
      if (p.store?.id) {
        return { ...p, _vendorId: String(p.store.id), _vendorName: p.store.name };
      }
      return { ...p, _vendorId: 'stappando', _vendorName: DEFAULT_VENDOR_NAME };
    });
  } catch {
    return products;
  }
}

/* ── Newsletter ─────────────────────────────────────────── */

async function subscribeNewsletter(email: string): Promise<{ success: boolean; message?: string }> {
  const url = `${baseUrl}/wp-json/stp-app/v1/newsletter`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return response.json();
}

/* ── Blog ───────────────────────────────────────────────── */

async function getPosts(page: number = 1): Promise<WPPost[]> {
  const url = `${baseUrl}/wp-json/wp/v2/posts?per_page=12&page=${page}&_embed`;
  const response = await fetch(url, { next: { revalidate: 600 } } as RequestInit);
  if (!response.ok) return [];
  return response.json();
}

export interface WPCategory {
  id: number;
  name: string;
  slug: string;
  count: number;
}

async function getWPCategories(): Promise<WPCategory[]> {
  const url = `${baseUrl}/wp-json/wp/v2/categories?per_page=50&hide_empty=true`;
  const response = await fetch(url, { next: { revalidate: 600 } } as RequestInit);
  if (!response.ok) return [];
  return response.json();
}

async function getPostsByCategory(categoryId: number, page: number = 1): Promise<WPPost[]> {
  const url = `${baseUrl}/wp-json/wp/v2/posts?per_page=12&page=${page}&categories=${categoryId}&_embed`;
  const response = await fetch(url, { next: { revalidate: 600 } } as RequestInit);
  if (!response.ok) return [];
  return response.json();
}

async function getPost(slug: string): Promise<WPPost | null> {
  const url = `${baseUrl}/wp-json/wp/v2/posts?slug=${slug}&_embed`;
  const response = await fetch(url, { next: { revalidate: 600 } } as RequestInit);
  if (!response.ok) return null;
  const posts: WPPost[] = await response.json();
  return posts[0] || null;
}

/* ── Public API ─────────────────────────────────────────── */

export const api = {
  getProducts: async (params?: Record<string, string | number>) => {
    const products = await request<WCProduct[]>('/products', {
      params: { per_page: 20, status: 'publish', ...params },
    });
    return enrichProductsWithVendors(products);
  },

  getProduct: async (idOrSlug: number | string) => {
    if (typeof idOrSlug === 'string' && isNaN(Number(idOrSlug))) {
      const products = await request<WCProduct[]>('/products', {
        params: { slug: idOrSlug, status: 'publish' },
      });
      if (products.length > 0) {
        const enriched = await enrichProductsWithVendors(products);
        return enriched[0];
      }
      return null;
    }
    const product = await request<WCProduct>(`/products/${idOrSlug}`);
    if (!product.store?.id) {
      const enriched = await enrichProductsWithVendors([product]);
      return enriched[0];
    }
    return product;
  },

  searchProducts: async (query: string, params?: Record<string, string | number>) => {
    const products = await request<WCProduct[]>('/products', {
      params: { search: query, per_page: 20, status: 'publish', ...params },
    });
    return enrichProductsWithVendors(products);
  },

  getCategories: (params?: Record<string, string | number>) =>
    request<WCCategory[]>('/products/categories', {
      params: { per_page: 100, hide_empty: 1, ...params },
    }),

  getCategory: async (slug: string) => {
    const cats = await request<WCCategory[]>('/products/categories', {
      params: { slug, hide_empty: 0 },
    });
    return cats[0] || null;
  },

  getLatestPost: async (): Promise<WPPost | null> => {
    try {
      const url = `${baseUrl}/wp-json/wp/v2/posts?per_page=1&_embed`;
      const response = await fetch(url, { next: { revalidate: 600 } } as RequestInit);
      if (!response.ok) return null;
      const posts: WPPost[] = await response.json();
      return posts[0] || null;
    } catch {
      return null;
    }
  },

  getVendorMap,
  enrichProductsWithVendors,
  subscribeNewsletter,
  getPosts,
  getPost,
  getWPCategories,
  getPostsByCategory,

  createOrder: async (orderData: unknown) => {
    return request('/orders', { method: 'POST', body: orderData });
  },
};
