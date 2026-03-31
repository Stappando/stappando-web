import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname.replace(/\/+$/, '') || '/';

  // ── /shop/.../slug → /prodotto/slug ──────────────────
  if (pathname.startsWith('/shop/') || pathname === '/shop') {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length >= 2) {
      const slug = segments[segments.length - 1];
      return NextResponse.redirect(new URL(`/prodotto/${slug}`, request.url), 301);
    }
    return NextResponse.redirect(new URL('/cerca', request.url), 301);
  }

  // ── /product/slug → /prodotto/slug ───────────────────
  if (pathname.startsWith('/product/')) {
    const slug = pathname.replace('/product/', '');
    if (slug) return NextResponse.redirect(new URL(`/prodotto/${slug}`, request.url), 301);
  }

  // ── /produttore/slug → /cantina/slug ─────────────────
  if (pathname.startsWith('/produttore/')) {
    const slug = pathname.replace('/produttore/', '');
    if (slug) return NextResponse.redirect(new URL(`/cantina/${slug}`, request.url), 301);
  }

  // ── /vendor/slug → /cantine (only old WP vendor URLs, NOT our backend) ──
  const vendorBackendPaths = ['/vendor/dashboard', '/vendor/profilo', '/vendor/negozio', '/vendor/ordini', '/vendor/prodotti', '/vendor/recensioni', '/vendor/contratto'];
  if (pathname.startsWith('/vendor/') && !vendorBackendPaths.some(p => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL('/cantine', request.url), 301);
  }

  // ── /product-category/* → /cerca ─────────────────────
  if (pathname.startsWith('/product-category')) {
    return NextResponse.redirect(new URL('/cerca', request.url), 301);
  }

  // ── /product-tag/* → /cerca ──────────────────────────
  if (pathname.startsWith('/product-tag')) {
    return NextResponse.redirect(new URL('/cerca', request.url), 301);
  }

  // ── /confezione/* → /cerca ───────────────────────────
  if (pathname.startsWith('/confezione')) {
    return NextResponse.redirect(new URL('/cerca', request.url), 301);
  }

  // ── /filosofia/* → /cerca ────────────────────────────
  if (pathname.startsWith('/filosofia')) {
    return NextResponse.redirect(new URL('/cerca', request.url), 301);
  }

  // ── /category/* (blog categories) → /blog ────────────
  if (pathname.startsWith('/category/')) {
    return NextResponse.redirect(new URL('/blog', request.url), 301);
  }

  // ── /author/* → /blog ────────────────────────────────
  if (pathname.startsWith('/author/')) {
    return NextResponse.redirect(new URL('/blog', request.url), 301);
  }

  // ── Specific old pages ───────────────────────────────
  if (pathname === '/promo') {
    return NextResponse.redirect(new URL('/cerca?on_sale=true', request.url), 301);
  }

  if (pathname === '/raccolta-punti-pop-stappando') {
    return NextResponse.redirect(new URL('/punti-pop', request.url), 301);
  }

  if (pathname === '/about-factory') {
    return NextResponse.redirect(new URL('/chi-siamo', request.url), 301);
  }

  if (pathname === '/vinovia') {
    return NextResponse.redirect(new URL('/blog', request.url), 301);
  }

  // ── Old blog article slugs (no prefix, catch-all) ───
  // These are direct slug URLs like /etna-rosso-alle-pendici.../
  // They match blog posts on the old site → redirect to /blog
  const blogSlugs = [
    '/a-nemi-levento-borgo-divino-e-stato-palcoscenico-di-vini-buoni',
    '/a-zonzo-nel-chianti-a-bere-bolgheri-bianco',
    '/alla-scoperta-del-rum-santa-teresa-un-capolavoro-del-venezuela',
    '/etna-rosso-alle-pendici-del-palazzo-pitti',
    '/le-improvvisate-che-non-si-scordano-mai',
    '/pit-stop-culturale-montefalco-sagrantino-docg',
    '/primavera-delle-mie-brame-quale-vino-mettiamo-vicino-al-tegame',
    '/refosco-dal-peduncolo-rosso-vino-estivo',
    '/vino-timorasso-scoperta-viaggio',
  ];

  if (blogSlugs.includes(pathname)) {
    return NextResponse.redirect(new URL('/blog', request.url), 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/shop/:path*',
    '/product/:path*',
    '/product-category/:path*',
    '/product-tag/:path*',
    '/produttore/:path*',
    '/vendor/:path*',
    '/confezione/:path*',
    '/filosofia/:path*',
    '/category/:path*',
    '/author/:path*',
    '/promo',
    '/raccolta-punti-pop-stappando',
    '/about-factory',
    '/vinovia',
    '/a-nemi-levento-borgo-divino-e-stato-palcoscenico-di-vini-buoni',
    '/a-zonzo-nel-chianti-a-bere-bolgheri-bianco',
    '/alla-scoperta-del-rum-santa-teresa-un-capolavoro-del-venezuela',
    '/etna-rosso-alle-pendici-del-palazzo-pitti',
    '/le-improvvisate-che-non-si-scordano-mai',
    '/pit-stop-culturale-montefalco-sagrantino-docg',
    '/primavera-delle-mie-brame-quale-vino-mettiamo-vicino-al-tegame',
    '/refosco-dal-peduncolo-rosso-vino-estivo',
    '/vino-timorasso-scoperta-viaggio',
  ],
};
