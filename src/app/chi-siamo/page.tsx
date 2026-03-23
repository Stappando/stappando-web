import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Chi Siamo — Stappando',
  description:
    'Scopri la storia di Stappando: una realtà italiana dinamica e innovativa nel settore della vendita online di vini e liquori. Selezione curata, spedizioni rapide e assistenza dedicata.',
  openGraph: {
    title: 'Chi Siamo — Stappando',
    description: 'Scopri la storia di Stappando: una realtà italiana dinamica e innovativa nel settore della vendita online di vini e liquori.',
    siteName: 'Stappando',
    locale: 'it_IT',
    type: 'website',
  },
};

export default function ChiSiamoPage() {
  return (
    <div className="bg-brand-bg min-h-screen">
      {/* Hero */}
      <div className="bg-brand-primary text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <nav className="text-sm text-white/60 mb-6">
            <Link href="/" className="hover:text-white">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-white/90">Chi Siamo</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">Chi Siamo</h1>
          <p className="text-lg text-white/80 max-w-2xl">
            Una realtà italiana dinamica ed innovativa in forte crescita nel settore della vendita online di vini e liquori.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-12">
        {/* La Nostra Storia */}
        <section>
          <h2 className="text-2xl font-bold text-brand-primary mb-4">La Nostra Storia</h2>
          <div className="prose max-w-none space-y-4 text-brand-text leading-relaxed">
            <p>
              Stappando è una realtà italiana dinamica ed innovativa in forte crescita, nata dalla passione per il vino e
              dalla volontà di rendere accessibili a tutti le migliori etichette italiane e internazionali. Operiamo nel
              settore della vendita online di bevande alcoliche, distinguendoci per la collaborazione con sommelier
              esperti e un servizio clienti preparato e disponibile.
            </p>
            <p>
              La nostra impresa si dedica ad un lavoro incessante di selezione delle etichette italiane ed internazionali,
              per soddisfare una clientela variegata ed esigente. Ci affidiamo alla collaborazione dei più grandi centri
              logistici di bevande alcoliche su Roma e provincia, garantendo così una gestione efficiente e tempi di
              consegna rapidi.
            </p>
          </div>
        </section>

        {/* La Nostra Missione */}
        <section className="bg-white rounded-2xl p-8 shadow-sm border border-brand-border">
          <h2 className="text-2xl font-bold text-brand-primary mb-4">La Nostra Missione</h2>
          <div className="space-y-4 text-brand-text leading-relaxed">
            <p>
              Stappando è un&apos;azienda che punta sulla soddisfazione del cliente, garantendo tempistiche certe e
              qualità dei prodotti. Offriamo un servizio online attivo 24 ore su 24, 7 giorni su 7, perché crediamo che
              l&apos;esperienza di acquisto debba essere semplice e piacevole.
            </p>
            <p>
              Oltre alla vendita diretta, offriamo servizi di consulenza alle aziende per supportare nuove realtà
              emergenti nel mondo del vino e delle bevande, mettendo a disposizione la nostra esperienza e la nostra
              rete di contatti nel settore.
            </p>
          </div>
        </section>

        {/* I Nostri Valori */}
        <section>
          <h2 className="text-2xl font-bold text-brand-primary mb-6">I Nostri Valori</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                icon: '🔒',
                title: 'Pagamenti Sicuri',
                desc: 'Sistemi di protezione SSL avanzati per transazioni sicure e protette.',
              },
              {
                icon: '📞',
                title: 'Supporto Dedicato',
                desc: 'Assistenza telefonica dalle 9 alle 19, dal lunedì al venerdì.',
              },
              {
                icon: '↩️',
                title: 'Resi Veloci',
                desc: 'Procedura di reso semplice con rimborsi elaborati in tempi rapidi.',
              },
              {
                icon: '🚚',
                title: 'Spedizioni Express',
                desc: 'Consegna assicurata in 24-48 ore con imballo protettivo.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white rounded-xl p-6 shadow-sm border border-brand-border hover:shadow-md transition-shadow"
              >
                <span className="text-3xl mb-3 block">{item.icon}</span>
                <h3 className="font-semibold text-brand-primary text-lg mb-2">{item.title}</h3>
                <p className="text-brand-muted text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Confezionamento */}
        <section className="bg-brand-primary/5 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-brand-primary mb-4">Confezionamento Curato</h2>
          <p className="text-brand-text leading-relaxed">
            Ogni spedizione è confezionata con cura utilizzando scatole omologate per il trasporto di bottiglie,
            realizzate con materiali riciclati e produzione sostenibile. Scegliamo fornitori italiani perché crediamo
            nel valore della filiera corta e nella qualità del Made in Italy, anche nel packaging.
          </p>
        </section>

        {/* CTA */}
        <section className="text-center py-8">
          <h2 className="text-2xl font-bold text-brand-primary mb-3">Hai domande?</h2>
          <p className="text-brand-muted mb-6">Siamo qui per aiutarti. Contattaci per qualsiasi informazione.</p>
          <Link
            href="/contatti"
            className="inline-block bg-brand-accent text-white font-semibold px-8 py-3 rounded-full hover:opacity-90 transition-opacity"
          >
            Contattaci
          </Link>
        </section>
      </div>
    </div>
  );
}
