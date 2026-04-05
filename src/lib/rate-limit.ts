/**
 * Simple in-memory rate limiter for serverless API routes.
 * Each limiter instance tracks requests by IP with a sliding window.
 */

const stores = new Map<string, Map<string, number[]>>();

export function rateLimit(opts: { key: string; limit: number; windowMs: number }) {
  if (!stores.has(opts.key)) stores.set(opts.key, new Map());
  const store = stores.get(opts.key)!;

  return {
    check(ip: string): { ok: boolean; remaining: number } {
      const now = Date.now();
      const hits = store.get(ip) || [];
      const valid = hits.filter((t) => t > now - opts.windowMs);

      if (valid.length >= opts.limit) {
        store.set(ip, valid);
        return { ok: false, remaining: 0 };
      }

      valid.push(now);
      store.set(ip, valid);

      // Cleanup old IPs every 1000 entries
      if (store.size > 1000) {
        for (const [k, v] of store) {
          const fresh = v.filter((t) => t > now - opts.windowMs);
          if (fresh.length === 0) store.delete(k);
          else store.set(k, fresh);
        }
      }

      return { ok: true, remaining: opts.limit - valid.length };
    },
  };
}

const limiters = {
  login: rateLimit({ key: 'login', limit: 5, windowMs: 60_000 }),
  register: rateLimit({ key: 'register', limit: 3, windowMs: 60_000 }),
  contact: rateLimit({ key: 'contact', limit: 3, windowMs: 60_000 }),
  reviews: rateLimit({ key: 'reviews', limit: 5, windowMs: 60_000 }),
  admin: rateLimit({ key: 'admin', limit: 5, windowMs: 60_000 }),
};

export default limiters;
