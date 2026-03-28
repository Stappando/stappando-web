'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/* ── Types ─────────────────────────────────────────────── */

/** Date key in YYYY-MM-DD format */
type DateKey = string;

interface SearchAgg {
  term: string;
  count: number;
  zeroResults: number;
  lastSearched: number;
}

interface ProductAgg {
  id: number;
  name: string;
  views: number;
  cartAdds: number;
  sources: Record<string, number>; // search, category, homepage, etc.
}

interface DailyStats {
  date: DateKey;
  pageViews: number;
  searches: number;
  productViews: number;
  cartAdds: number;
  checkoutStarts: number;
  purchases: number;
  revenue: number;
  itemsSold: number;
}

interface PathStep {
  path: string;
  next: Record<string, number>; // next path -> count
}

interface AnalyticsData {
  /** Aggregated search terms: term -> SearchAgg */
  searches: Record<string, SearchAgg>;
  /** Aggregated product stats: productId -> ProductAgg */
  products: Record<string, ProductAgg>;
  /** Daily stats: YYYY-MM-DD -> DailyStats */
  daily: Record<DateKey, DailyStats>;
  /** Path flow: path -> PathStep (tracks transitions) */
  paths: Record<string, PathStep>;
  /** Last path visited (for tracking flow) */
  lastPath: string | null;
  /** Zero-result searches list (term + timestamp), capped at 200 */
  zeroResultSearches: { term: string; ts: number }[];
}

interface AnalyticsActions {
  trackSearch: (term: string, resultCount: number) => void;
  trackProductView: (productId: number, productName: string, source: string) => void;
  trackAddToCart: (productId: number, productName: string, price: number) => void;
  trackCheckoutStart: () => void;
  trackPurchase: (orderTotal: number, itemsCount: number) => void;
  trackPageView: (path: string, referrer?: string) => void;
  getData: () => AnalyticsData;
  clearData: () => void;
}

type AnalyticsState = AnalyticsData & AnalyticsActions;

/* ── Helpers ───────────────────────────────────────────── */

function todayKey(): DateKey {
  return new Date().toISOString().slice(0, 10);
}

function ensureDaily(daily: Record<DateKey, DailyStats>, date: DateKey): DailyStats {
  if (!daily[date]) {
    daily[date] = {
      date,
      pageViews: 0,
      searches: 0,
      productViews: 0,
      cartAdds: 0,
      checkoutStarts: 0,
      purchases: 0,
      revenue: 0,
      itemsSold: 0,
    };
  }
  return daily[date];
}

const EMPTY_DATA: AnalyticsData = {
  searches: {},
  products: {},
  daily: {},
  paths: {},
  lastPath: null,
  zeroResultSearches: [],
};

/* ── Store ─────────────────────────────────────────────── */

export const useAnalyticsStore = create<AnalyticsState>()(
  persist(
    (set, get) => ({
      ...EMPTY_DATA,

      trackSearch: (term: string, resultCount: number) => {
        const normalized = term.trim().toLowerCase();
        if (!normalized) return;
        set((state) => {
          const searches = { ...state.searches };
          const existing = searches[normalized] || { term: normalized, count: 0, zeroResults: 0, lastSearched: 0 };
          searches[normalized] = {
            ...existing,
            count: existing.count + 1,
            zeroResults: resultCount === 0 ? existing.zeroResults + 1 : existing.zeroResults,
            lastSearched: Date.now(),
          };

          const daily = { ...state.daily };
          const day = ensureDaily(daily, todayKey());
          day.searches += 1;

          const zeroResultSearches = resultCount === 0
            ? [{ term: normalized, ts: Date.now() }, ...state.zeroResultSearches].slice(0, 200)
            : state.zeroResultSearches;

          return { searches, daily, zeroResultSearches };
        });
      },

      trackProductView: (productId: number, productName: string, source: string) => {
        set((state) => {
          const products = { ...state.products };
          const key = String(productId);
          const existing = products[key] || { id: productId, name: productName, views: 0, cartAdds: 0, sources: {} };
          const sources = { ...existing.sources };
          sources[source] = (sources[source] || 0) + 1;
          products[key] = { ...existing, name: productName, views: existing.views + 1, sources };

          const daily = { ...state.daily };
          const day = ensureDaily(daily, todayKey());
          day.productViews += 1;

          return { products, daily };
        });
      },

      trackAddToCart: (productId: number, productName: string, _price: number) => {
        set((state) => {
          const products = { ...state.products };
          const key = String(productId);
          const existing = products[key] || { id: productId, name: productName, views: 0, cartAdds: 0, sources: {} };
          products[key] = { ...existing, name: productName, cartAdds: existing.cartAdds + 1 };

          const daily = { ...state.daily };
          const day = ensureDaily(daily, todayKey());
          day.cartAdds += 1;

          return { products, daily };
        });
      },

      trackCheckoutStart: () => {
        set((state) => {
          const daily = { ...state.daily };
          const day = ensureDaily(daily, todayKey());
          day.checkoutStarts += 1;
          return { daily };
        });
      },

      trackPurchase: (orderTotal: number, itemsCount: number) => {
        set((state) => {
          const daily = { ...state.daily };
          const day = ensureDaily(daily, todayKey());
          day.purchases += 1;
          day.revenue += orderTotal;
          day.itemsSold += itemsCount;
          return { daily };
        });
      },

      trackPageView: (path: string, _referrer?: string) => {
        set((state) => {
          const daily = { ...state.daily };
          const day = ensureDaily(daily, todayKey());
          day.pageViews += 1;

          // Track path flow
          const paths = { ...state.paths };
          const lastPath = state.lastPath;
          if (lastPath && lastPath !== path) {
            const step = paths[lastPath] || { path: lastPath, next: {} };
            const next = { ...step.next };
            next[path] = (next[path] || 0) + 1;
            paths[lastPath] = { ...step, next };
          }
          if (!paths[path]) {
            paths[path] = { path, next: {} };
          }

          return { daily, paths, lastPath: path };
        });
      },

      getData: () => {
        const s = get();
        return {
          searches: s.searches,
          products: s.products,
          daily: s.daily,
          paths: s.paths,
          lastPath: s.lastPath,
          zeroResultSearches: s.zeroResultSearches,
        };
      },

      clearData: () => set({ ...EMPTY_DATA }),
    }),
    {
      name: 'stappando-analytics',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        searches: state.searches,
        products: state.products,
        daily: state.daily,
        paths: state.paths,
        lastPath: state.lastPath,
        zeroResultSearches: state.zeroResultSearches,
      }),
    },
  ),
);
