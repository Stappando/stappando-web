/**
 * Cached data fetchers — server-side only.
 * Uses unstable_cache for data that changes infrequently.
 * Import these in Server Components / Route Handlers, never in 'use client'.
 */
import { unstable_cache } from 'next/cache';
import { api, type WCProduct, type WCCategory, type WPPost, type WPCategory } from './api';

/* ── Categories (change very rarely) ────────────────────── */

/** All root categories — revalidate every 4 hours (categories rarely change) */
export const getCachedCategories = unstable_cache(
  async (params?: Record<string, string | number>) => {
    return api.getCategories(params);
  },
  ['wc-categories'],
  { revalidate: 14400, tags: ['categories'] },
);

/** Single category by slug — revalidate every 4 hours */
export const getCachedCategory = unstable_cache(
  async (slug: string) => {
    return api.getCategory(slug);
  },
  ['wc-category'],
  { revalidate: 14400, tags: ['categories'] },
);

/* ── Vendor map (change very rarely) ────────────────────── */

export const getCachedVendorMap = unstable_cache(
  async (ids: number[]) => {
    return api.getVendorMap(ids);
  },
  ['wc-vendor-map'],
  { revalidate: 3600, tags: ['vendors'] },
);

/* ── Products (moderate change frequency) ───────────────── */

/** Products by params — revalidate every 5 min */
export const getCachedProducts = unstable_cache(
  async (params?: Record<string, string | number>) => {
    return api.getProducts(params);
  },
  ['wc-products'],
  { revalidate: 300, tags: ['products'] },
);

/* ── Blog (change infrequently) ─────────────────────────── */

/** WP categories — revalidate every hour */
export const getCachedWPCategories = unstable_cache(
  async () => {
    return api.getWPCategories();
  },
  ['wp-categories'],
  { revalidate: 3600, tags: ['blog'] },
);

/** Blog posts — revalidate every 10 min */
export const getCachedPosts = unstable_cache(
  async (page: number = 1) => {
    return api.getPosts(page);
  },
  ['wp-posts'],
  { revalidate: 600, tags: ['blog'] },
);

/** Blog posts by category — revalidate every 10 min */
export const getCachedPostsByCategory = unstable_cache(
  async (categoryId: number, page: number = 1) => {
    return api.getPostsByCategory(categoryId, page);
  },
  ['wp-posts-by-cat'],
  { revalidate: 600, tags: ['blog'] },
);

/** Single blog post — revalidate every 10 min */
export const getCachedPost = unstable_cache(
  async (slug: string) => {
    return api.getPost(slug);
  },
  ['wp-post'],
  { revalidate: 600, tags: ['blog'] },
);

/** Latest blog post — revalidate every 10 min */
export const getCachedLatestPost = unstable_cache(
  async () => {
    return api.getLatestPost();
  },
  ['wp-latest-post'],
  { revalidate: 600, tags: ['blog'] },
);
