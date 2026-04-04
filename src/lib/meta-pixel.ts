'use client';

/**
 * Meta Pixel helper – Stappando
 * Pixel ID: 718140692390811
 *
 * Usage: import { trackFbEvent } from '@/lib/meta-pixel';
 *        trackFbEvent('AddToCart', { content_ids: ['123'], value: 12.5, currency: 'EUR' });
 */

const PIXEL_ID = '718140692390811';

declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
    _fbq: (...args: unknown[]) => void;
  }
}

let initialized = false;

/** Inject the Meta Pixel base code (idempotent). */
export function initPixel() {
  if (typeof window === 'undefined' || initialized) return;
  if (window.fbq) { initialized = true; return; }

  const n: any = (window.fbq = function (...args: unknown[]) {
    n.callMethod ? n.callMethod(...args) : n.queue.push(args);
  });
  if (!window._fbq) window._fbq = n;
  n.push = n;
  n.loaded = true;
  n.version = '2.0';
  n.queue = [] as unknown[][];

  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(s);

  window.fbq('init', PIXEL_ID);
  window.fbq('track', 'PageView');
  initialized = true;
}

/** Fire a standard or custom Meta Pixel event. */
export function trackFbEvent(eventName: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined' || !window.fbq) return;
  if (params) {
    window.fbq('track', eventName, params);
  } else {
    window.fbq('track', eventName);
  }
}

/** Track a page view (call on route change in SPA). */
export function trackFbPageView() {
  if (typeof window === 'undefined' || !window.fbq) return;
  window.fbq('track', 'PageView');
}
