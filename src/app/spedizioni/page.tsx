import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Costi di Spedizione — Stappando',
  description:
    'Informazioni su costi di spedizione, tempi di consegna e confezionamento. Spedizione gratuita per ordini superiori a 69 euro. Consegna in 24/48 ore in tutta Italia.',
  openGraph: {
    title: 'Costi di Spedizione — Stappando',
    description: 'Spedizione gratuita per ordini superiori a 69 euro. Consegna in 24/48 ore in tutta Italia.',
    siteName: 'Stappando',
    locale: 'it_IT',
    type: 'website',
  },
};

export default function SpedizioniPage() {
  return (
    <div className="bg-brand-bg min-h-screen">
      {/* Hero */}
      <div className="bg-brand-primary text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <nav className="text-sm text-white/60 mb-6">
            <Link href="/" className="hover:text-white">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-white/90">Spedizioni</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">Costi di Spedizione</h1>
          <p className="text-lg text-white/80 max-w-2xl">
            Consegne rapide e sicure in tutta Italia. Spedizione gratuita per ordini superiori a 69&euro;.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
        {/* Tariffe */}
        <section>
          <h2 className="text-2xl font-bold text-brand-primary mb-6">Tariffe di Spedizione</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {/* Italia */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-border">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🇮🇹</span>
                <h3 className="text-xl font-semibold text-brand-primary">Italia</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-brand-border">
                  <span className="text-brand-muted text-sm">Ordini fino a 69&euro;</span>
                  <span className="font-semibold text-brand-text">6,50&euro;</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-brand-border">
                  <span className="text-brand-muted text-sm">Ordini oltre 69&euro;</span>
                  <span className="font-semibold text-brand-accent">Gratuita</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-brand-muted text-sm">Tempi di consegna</span>
                  <span className="font-semibold text-brand-text">24/48 ore</span>
                </div>
              </div>
            </div>

            {/* Isole */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-border">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🏝️</span>
                <h3 className="text-xl font-semibold text-brand-primary">Sicilia e Sardegna</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-brand-border">
                  <span className="text-brand-muted text-sm">Ordini fino a 69&euro;</span>
                  <span className="font-semibold text-brand-text">6,50&euro;</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-brand-border">
                  <span className="text-brand-muted text-sm">Ordini oltre 69&euro;</span>
                  <span className="font-semibold text-brand-accent">Gratuita</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-brand-muted text-sm">Tempi di consegna</span>
                  <span className="font-semibold text-brand-text">72/96 ore</span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-sm text-brand-muted mt-4 italic">
            * Le tariffe indicate valgono per ogni singolo venditore sulla piattaforma.
          </p>
        </section>

        {/* Free Shipping Banner */}
        <section className="bg-brand-accent/10 border border-brand-accent/30 rounded-2xl p-8 text-center">
          <p className="text-3xl font-bold text-brand-accent mb-2">Spedizione Gratuita</p>
          <p className="text-brand-text text-lg">per ordini superiori a <strong>69&euro;</strong></p>
        </section>

        {/* Confezionamento */}
        <section>
          <h2 className="text-2xl font-bold text-brand-primary mb-4">Confezionamento</h2>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-border space-y-4">
            <p className="text-brand-text leading-relaxed">
              I prodotti vengono spediti in scatole omologate per il trasporto di bottiglie, realizzate dall&apos;azienda
              italiana Anbrekabol. Questa scelta è motivata da considerazioni sia ambientali che di qualità:
            </p>
            <ul className="space-y-2">
              {[
                'Materiali riciclati e produzione sostenibile',
                'Massima protezione durante il trasporto',
                'Supporto alla produzione italiana',
                'Confezionamento elegante e curato',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="text-brand-accent font-bold mt-0.5">&#10003;</span>
                  <span className="text-brand-text">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Info aggiuntive */}
        <section className="bg-brand-primary/5 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-brand-primary mb-4">Informazioni Utili</h2>
          <div className="space-y-3 text-brand-text leading-relaxed">
            <p>
              Tutte le spedizioni sono assicurate e tracciabili. Riceverai un&apos;email con il codice di tracking
              non appena il tuo ordine verrà affidato al corriere.
            </p>
            <p>
              Per eventuali resi, la procedura è gestita direttamente dalla tua area personale. Consulta la nostra
              pagina <Link href="/resi" className="text-brand-primary font-medium hover:underline">Resi e Rimborsi</Link> per
              maggiori dettagli.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
