import type { Metadata, Viewport } from 'next';
import dynamic from 'next/dynamic';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

/* Lazy-load non-critical client components — code-split from main bundle */
const CartDrawer = dynamic(() => import('@/components/CartDrawer'));
const CheckoutModal = dynamic(() => import('@/components/CheckoutModal'));
const CookieBanner = dynamic(() => import('@/components/CookieBanner'));
const PageViewTracker = dynamic(() => import('@/components/PageViewTracker'));
const NavigationProgress = dynamic(() => import('@/components/NavigationProgress'));

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#005667',
};

export const metadata: Metadata = {
  title: {
    template: '%s | Stappando — Vini Italiani',
    default: 'Stappando — Vini Italiani d\'Eccellenza',
  },
  description:
    'Scopri la selezione di vini italiani d\'eccellenza su Stappando. Spedizione rapida, pagamento sicuro e assistenza dedicata. Marketplace con i migliori produttori italiani.',
  keywords: 'vino italiano, ecommerce vino, vini online, vini italiani, wine marketplace',
  metadataBase: new URL('https://stappando.it'),
  openGraph: {
    title: 'Stappando — Vini Italiani d\'Eccellenza',
    description: 'Scopri la selezione di vini italiani d\'eccellenza su Stappando.',
    siteName: 'Stappando',
    locale: 'it_IT',
    type: 'website',
    images: [
      {
        url: '/logo-og.png',
        width: 1200,
        height: 630,
        alt: 'Stappando — Vini Italiani d\'Eccellenza',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Stappando — Vini Italiani d\'Eccellenza',
    description: 'Scopri la selezione di vini italiani d\'eccellenza su Stappando.',
    images: ['/logo-og.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://stappando.it',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <head>
        {/* Preconnect to image CDN origins — eliminates DNS+TLS latency for LCP images */}
        <link rel="preconnect" href="https://stappando.it" />
        <link rel="preconnect" href="https://i0.wp.com" />
        <link rel="dns-prefetch" href="https://i1.wp.com" />
        <link rel="dns-prefetch" href="https://i2.wp.com" />
      </head>
      <body className="min-h-screen flex flex-col overflow-x-hidden">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <CartDrawer />
        <CheckoutModal />
        <CookieBanner />
        <PageViewTracker />
        <NavigationProgress />
      </body>
    </html>
  );
}
