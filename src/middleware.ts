import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect old WooCommerce product URLs: /shop/.../slug → /prodotto/slug
  if (pathname.startsWith('/shop/') || pathname === '/shop') {
    // Remove trailing slash and get last segment
    const clean = pathname.replace(/\/+$/, '');
    const segments = clean.split('/').filter(Boolean); // ['shop', 'cat1', 'cat2', 'slug']

    if (segments.length >= 2) {
      const slug = segments[segments.length - 1];
      return NextResponse.redirect(new URL(`/prodotto/${slug}`, request.url), 301);
    }

    // /shop alone → /cerca
    return NextResponse.redirect(new URL('/cerca', request.url), 301);
  }

  // Redirect /product/slug → /prodotto/slug (English URLs)
  if (pathname.startsWith('/product/')) {
    const slug = pathname.replace('/product/', '').replace(/\/+$/, '');
    if (slug) {
      return NextResponse.redirect(new URL(`/prodotto/${slug}`, request.url), 301);
    }
  }

  // Redirect /product-category/* → /cerca
  if (pathname.startsWith('/product-category')) {
    return NextResponse.redirect(new URL('/cerca', request.url), 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/shop/:path*', '/product/:path*', '/product-category/:path*'],
};
