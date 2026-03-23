import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import CookieBanner from '@/components/CookieBanner';

export const metadata: Metadata = {
  title: 'Stappando — Vini Italiani d\'Eccellenza',
  description:
    'Scopri la selezione di vini italiani d\'eccellenza su Stappando. Spedizione rapida, pagamento sicuro e assistenza dedicata. Marketplace con i migliori produttori italiani.',
  keywords: 'vino italiano, ecommerce vino, vini online, vini italiani, wine marketplace',
  openGraph: {
    title: 'Stappando — Vini Italiani d\'Eccellenza',
    description: 'Scopri la selezione di vini italiani d\'eccellenza su Stappando.',
    siteName: 'Stappando',
    locale: 'it_IT',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <CartDrawer />
        <CookieBanner />
      </body>
    </html>
  );
}
