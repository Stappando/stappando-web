import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          // Internal areas
          '/api/',
          '/vendor/',
          '/account/',
          '/admin/',
          '/checkout/',
          '/homepage-v2',
          '/mockup-pdp',

          // Old WordPress/WooCommerce junk URLs — thousands of crawl-wasting pages
          '/shop/',
          '/product/',
          '/product-category/',
          '/product-tag/',
          '/produttore/',
          '/confezione/',
          '/filosofia/',

          // WooCommerce filter query strings (wildcard via path prefix)
          '/*?filter_uvaggio=',
          '/*?filter_denominazione=',
          '/*?filter_regione=',
          '/*?filter_produttore=',
          '/*?query_type_uvaggio=',
          '/*?query_type_denominazione=',
          '/*?woo_ajax=',
          '/*?add-to-cart=',
          '/*?orderby=',

          // WordPress internals
          '/wp-admin/',
          '/wp-includes/',
          '/wp-content/',
          '/wp-json/',
          '/wp-login.php',
          '/xmlrpc.php',
          '/wp-sitemap.xml',
          '/?s=',
          '/feed/',
          '/comments/feed/',
          '/trackback/',
          '/author/',
          '/category/',
          '/tag/',
          '/attachment/',
          '/?p=',
          '/?page_id=',
          '/?post_type=',

          // Pagination beyond page 1 (crawl budget optimization)
          '/*?page=2',
          '/*?page=3',
          '/*?page=4',
          '/*?page=5',
        ],
      },
    ],
    sitemap: 'https://shop.stappando.it/sitemap.xml',
  };
}
