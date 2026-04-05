/* ── Schema.org structured data helpers ─────────────────── */

const SITE_URL = 'https://shop.stappando.it';

export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Stappando',
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description:
      'Enoteca online di vini italiani d\'eccellenza. Marketplace con i migliori produttori italiani.',
    sameAs: [
      'https://www.instagram.com/stappando/',
      'https://www.facebook.com/stappando/',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: 'Italian',
    },
  };
}

export function getWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Stappando',
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/cerca?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

interface ProductSchemaInput {
  name: string;
  slug: string;
  description?: string;
  price: string;
  regular_price?: string;
  images?: { src: string; alt?: string }[];
  stock_status?: string;
  average_rating?: string;
  rating_count?: number;
  brand?: string;
  sku?: string;
}

export function getProductSchema(product: ProductSchemaInput) {
  const availability =
    product.stock_status === 'instock'
      ? 'https://schema.org/InStock'
      : product.stock_status === 'onbackorder'
        ? 'https://schema.org/PreOrder'
        : 'https://schema.org/OutOfStock';

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    url: `${SITE_URL}/prodotto/${product.slug}`,
    description: product.description?.replace(/<[^>]*>/g, '').slice(0, 500) || '',
    image: product.images?.map((img) => img.src) || [],
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/prodotto/${product.slug}`,
      priceCurrency: 'EUR',
      price: product.price,
      priceValidUntil: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      availability,
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: 'Stappando',
      },
    },
  };

  if (product.brand) {
    schema.brand = {
      '@type': 'Brand',
      name: product.brand,
    };
  }

  if (product.sku) {
    schema.sku = product.sku;
  }

  if (product.average_rating && Number(product.average_rating) > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: product.average_rating,
      reviewCount: product.rating_count || 1,
    };
  }

  return schema;
}

interface ArticleSchemaInput {
  title: string;
  slug: string;
  excerpt: string;
  date: string;
  featuredImage?: string;
}

export function getArticleSchema(post: ArticleSchemaInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    url: `${SITE_URL}/blog/${post.slug}`,
    description: post.excerpt.replace(/<[^>]*>/g, '').slice(0, 300),
    datePublished: post.date,
    dateModified: post.date,
    ...(post.featuredImage ? { image: post.featuredImage } : {}),
    author: {
      '@type': 'Organization',
      name: 'Stappando',
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Stappando',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/blog/${post.slug}`,
    },
  };
}

interface WinerySchemaInput {
  name: string;
  slug: string;
  description?: string;
  region?: string | null;
  address?: string | null;
  image?: string | null;
}

export function getWinerySchema(winery: WinerySchemaInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Winery',
    name: winery.name,
    url: `${SITE_URL}/cantine/${winery.slug}`,
    ...(winery.description ? { description: winery.description.replace(/<[^>]*>/g, '').slice(0, 500) } : {}),
    ...(winery.image ? { image: winery.image } : {}),
    ...(winery.address ? {
      address: {
        '@type': 'PostalAddress',
        streetAddress: winery.address,
        ...(winery.region ? { addressRegion: winery.region } : {}),
        addressCountry: 'IT',
      },
    } : winery.region ? {
      address: {
        '@type': 'PostalAddress',
        addressRegion: winery.region,
        addressCountry: 'IT',
      },
    } : {}),
  };
}

export function getFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

interface BreadcrumbItem {
  name: string;
  url?: string;
}

export function getBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.url ? { item: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}` } : {}),
    })),
  };
}
