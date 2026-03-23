import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Raccolta Punti POP — Stappando',
  description:
    'Programma fedeltà gratuito di Stappando: accumula 1 Punto POP per ogni euro speso e convertili in sconti. 100 Punti POP = 1 euro di sconto. Senza scadenza.',
  openGraph: {
    title: 'Raccolta Punti POP — Stappando',
    description: 'Accumula 1 Punto POP per ogni euro speso e convertili in sconti. 100 Punti POP = 1 euro di sconto.',
    siteName: 'Stappando',
    locale: 'it_IT',
    type: 'website',
  },
};

export default function PuntiPopPage() {
  return (
    <div className="bg-brand-bg min-h-screen">
      {/* Hero */}
      <div className="bg-brand-primary text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <nav className="text-sm text-white/60 mb-6">
            <Link href="/" className="hover:text-white">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-white/90">Punti POP</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">Raccolta Punti POP</h1>
          <p className="text-lg text-white/80 max-w-2xl">
            Il programma fedeltà gratuito di Stappando. Accumula punti ad ogni acquisto e convertili in sconti.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
        {/* Key Numbers */}
        <section className="grid sm:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-border text-center">
            <p className="text-4xl font-bold text-brand-accent mb-2">1&euro;</p>
            <p className="text-brand-primary font-semibold mb-1">speso</p>
            <p className="text-brand-muted text-sm">= 1 Punto POP</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-border text-center">
            <p className="text-4xl font-bold text-brand-accent mb-2">100</p>
            <p className="text-brand-primary font-semibold mb-1">Punti POP</p>
            <p className="text-brand-muted text-sm">= 1&euro; di sconto</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-border text-center">
            <p className="text-4xl font-bold text-brand-accent mb-2">&infin;</p>
            <p className="text-brand-primary font-semibold mb-1">Nessuna scadenza</p>
            <p className="text-brand-muted text-sm">Usa i punti quando vuoi</p>
          </div>
        </section>

        {/* Come Funziona */}
        <section>
          <h2 className="text-2xl font-bold text-brand-primary mb-6">Come Funziona</h2>
          <div className="space-y-6">
            {[
              {
                step: '1',
                title: 'Registrati gratuitamente',
                desc: 'Crea un account gratuito su Stappando. L\'iscrizione al programma Punti POP è automatica e senza costi.',
              },
              {
                step: '2',
                title: 'Acquista da loggato',
                desc: 'Effettua i tuoi acquisti dopo aver fatto il login. I punti vengono accumulati automaticamente ad ogni ordine completato.',
              },
              {
                step: '3',
                title: 'Accumula punti',
                desc: 'Ogni euro speso equivale a 1 Punto POP. I punti non hanno scadenza, quindi puoi accumularne quanti ne vuoi.',
              },
              {
                step: '4',
                title: 'Converti in sconti',
                desc: 'Al momento del checkout, nella pagina Cassa, converti i tuoi Punti POP nello sconto corrispondente. 100 punti = 1 euro.',
              },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-5">
                <div className="shrink-0 w-10 h-10 bg-brand-accent text-white rounded-full flex items-center justify-center font-bold text-lg">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-semibold text-brand-text mb-1">{item.title}</h3>
                  <p className="text-brand-muted text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Vantaggi */}
        <section className="bg-white rounded-2xl p-8 shadow-sm border border-brand-border">
          <h2 className="text-2xl font-bold text-brand-primary mb-6">Vantaggi del Programma</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                icon: 'gift',
                title: 'Iscrizione Gratuita',
                desc: 'Basta creare un account su Stappando per partecipare al programma.',
              },
              {
                icon: 'infinity',
                title: 'Punti Senza Scadenza',
                desc: 'I tuoi punti non scadono mai. Deciditi tu quando utilizzarli.',
              },
              {
                icon: 'tag',
                title: 'Cumulabili con Sconti',
                desc: 'Gli sconti derivanti dai Punti POP sono cumulabili con altri codici sconto.',
              },
              {
                icon: 'cart',
                title: 'Validi su Tutto',
                desc: 'Puoi applicare lo sconto su tutti i prodotti, inclusi quelli già in promozione.',
              },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-4">
                <span className="shrink-0">
                  {item.icon === 'gift' && <svg className="w-6 h-6 text-[#055667]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>}
                  {item.icon === 'infinity' && <svg className="w-6 h-6 text-[#055667]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>}
                  {item.icon === 'tag' && <svg className="w-6 h-6 text-[#055667]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 6h.008v.008H6V6z" /></svg>}
                  {item.icon === 'cart' && <svg className="w-6 h-6 text-[#055667]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121 0 2.09-.773 2.34-1.872l1.403-6.172c.296-1.304-.678-2.558-2.01-2.558H6.106l-.383-1.437A1.125 1.125 0 004.636 3H2.25" /></svg>}
                </span>
                <div>
                  <h3 className="font-semibold text-brand-text mb-1">{item.title}</h3>
                  <p className="text-brand-muted text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Esempio */}
        <section className="bg-brand-accent/10 border border-brand-accent/30 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-brand-primary mb-4">Esempio Pratico</h2>
          <div className="space-y-3 text-brand-text leading-relaxed">
            <p>
              Se spendi <strong>150&euro;</strong> in un ordine, accumuli <strong>150 Punti POP</strong>.
            </p>
            <p>
              Al prossimo acquisto, puoi convertire <strong>100 Punti POP</strong> per ottenere <strong>1&euro; di sconto</strong>, mantenendo i restanti 50 punti per il futuro.
            </p>
            <p>
              Non c&apos;è limite temporale: accumula punti con calma e usali quando preferisci!
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-8">
          <h2 className="text-2xl font-bold text-brand-primary mb-3">Inizia ad Accumulare Punti</h2>
          <p className="text-brand-muted mb-6">Registrati gratuitamente e inizia a guadagnare con ogni acquisto.</p>
          <Link
            href="/account"
            className="inline-block bg-brand-accent text-white font-semibold px-8 py-3 rounded-full hover:opacity-90 transition-opacity"
          >
            Crea il tuo Account
          </Link>
        </section>
      </div>
    </div>
  );
}
