import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contattaci — Stappando',
  description:
    'Contatta Stappando per informazioni, assistenza o consulenza. Telefono: 06 92915330, Email: assistenza@stappando.it. Rispondiamo entro 24 ore.',
  openGraph: {
    title: 'Contattaci — Stappando',
    description: 'Contatta Stappando per informazioni, assistenza o consulenza. Rispondiamo entro 24 ore.',
    siteName: 'Stappando',
    locale: 'it_IT',
    type: 'website',
  },
};

export default function ContattiLayout({ children }: { children: React.ReactNode }) {
  return children;
}
