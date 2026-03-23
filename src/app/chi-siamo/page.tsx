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
                icon: (<svg className="w-7 h-7 text-[#055667]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>),
                title: 'Pagamenti Sicuri',
                desc: 'Sistemi di protezione SSL avanzati per transazioni sicure e protette.',
              },
              {
                icon: (<svg className="w-7 h-7 text-[#055667]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>),
                title: 'Supporto Dedicato',
                desc: 'Assistenza telefonica dalle 9 alle 19, dal lunedì al venerdì.',
              },
              {
                icon: (<svg className="w-7 h-7 text-[#055667]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /></svg>),
                title: 'Resi Veloci',
                desc: 'Procedura di reso semplice con rimborsi elaborati in tempi rapidi.',
              },
              {
                icon: (<svg className="w-7 h-7 text-[#055667]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>),
                title: 'Spedizioni Express',
                desc: 'Consegna assicurata in 24-48 ore con imballo protettivo.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white rounded-xl p-6 shadow-sm border border-brand-border hover:shadow-md transition-shadow"
              >
                <span className="mb-3 block">{item.icon}</span>
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
