import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Resi e Rimborsi — Stappando',
  description:
    'Politica resi e rimborsi di Stappando. Diritto di recesso entro 14 giorni, rimborso garantito per merce danneggiata o non conforme. Procedura semplice e veloce.',
  openGraph: {
    title: 'Resi e Rimborsi — Stappando',
    description: 'Diritto di recesso entro 14 giorni, rimborso garantito per merce danneggiata o non conforme.',
    siteName: 'Stappando',
    locale: 'it_IT',
    type: 'website',
  },
};

export default function ResiPage() {
  return (
    <div className="bg-brand-bg min-h-screen">
      {/* Hero */}
      <div className="bg-brand-primary text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <nav className="text-sm text-white/60 mb-6">
            <Link href="/" className="hover:text-white">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-white/90">Resi e Rimborsi</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">Resi e Rimborsi</h1>
          <p className="text-lg text-white/80 max-w-2xl">
            La tua soddisfazione è la nostra priorità. Scopri la nostra politica di reso semplice e trasparente.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
        {/* Diritto di Recesso */}
        <section className="bg-white rounded-2xl p-8 shadow-sm border border-brand-border">
          <h2 className="text-2xl font-bold text-brand-primary mb-4">Diritto di Recesso</h2>
          <div className="space-y-4 text-brand-text leading-relaxed">
            <p>
              Puoi recedere dal contratto di acquisto entro <strong>14 giorni</strong> dalla conclusione
              dell&apos;accordo, senza dover fornire alcuna motivazione. Per esercitare il diritto di recesso,
              contatta Stappando s.r.l.s. attraverso uno dei seguenti canali:
            </p>
            <div className="grid sm:grid-cols-3 gap-4 mt-4">
              <div className="bg-brand-bg rounded-xl p-4 text-center">
                <span className="text-2xl block mb-2">📞</span>
                <p className="text-sm font-medium text-brand-primary">Telefono</p>
                <p className="text-sm text-brand-muted">06 92915330</p>
              </div>
              <div className="bg-brand-bg rounded-xl p-4 text-center">
                <span className="text-2xl block mb-2">📧</span>
                <p className="text-sm font-medium text-brand-primary">Email</p>
                <p className="text-sm text-brand-muted">info@stappando.it</p>
              </div>
              <div className="bg-brand-bg rounded-xl p-4 text-center">
                <span className="text-2xl block mb-2">📮</span>
                <p className="text-sm font-medium text-brand-primary">Posta</p>
                <p className="text-sm text-brand-muted">Via al Sesto Miglio 80, Roma</p>
              </div>
            </div>
          </div>
        </section>

        {/* Rimborso Garantito */}
        <section>
          <h2 className="text-2xl font-bold text-brand-primary mb-6">Quando hai Diritto al Rimborso</h2>
          <div className="space-y-4">
            {[
              {
                icon: '📷',
                title: 'Formato o etichetta differenti',
                desc: 'Il prodotto ricevuto presenta formato o etichetta differenti rispetto alle foto pubblicate sul sito.',
              },
              {
                icon: '🏷️',
                title: 'Nomenclatura errata',
                desc: 'Il nome del prodotto o la denominazione non corrispondono a quanto ordinato.',
              },
              {
                icon: '⚠️',
                title: 'Merce avariata o danneggiata',
                desc: 'Il prodotto è arrivato danneggiato, avariato o presenta difetti evidenti.',
              },
              {
                icon: '📦',
                title: 'Consegna non avvenuta',
                desc: 'La consegna non è avvenuta entro 14 giorni lavorativi dalla data dell\'ordine.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white rounded-xl p-5 shadow-sm border border-brand-border flex items-start gap-4"
              >
                <span className="text-2xl shrink-0">{item.icon}</span>
                <div>
                  <h3 className="font-semibold text-brand-text mb-1">{item.title}</h3>
                  <p className="text-brand-muted text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Tempistiche */}
        <section className="bg-brand-accent/10 border border-brand-accent/30 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-brand-primary mb-4">Tempistiche di Rimborso</h2>
          <p className="text-brand-text leading-relaxed">
            I rimborsi vengono elaborati entro <strong>14 giorni</strong> dal ricevimento della comunicazione di
            recesso e accreditati mediante lo stesso metodo di pagamento utilizzato per l&apos;acquisto originale.
          </p>
        </section>

        {/* Procedura Reso */}
        <section>
          <h2 className="text-2xl font-bold text-brand-primary mb-6">Come Effettuare un Reso</h2>
          <div className="space-y-6">
            {[
              {
                step: '1',
                title: 'Contatta l\'assistenza',
                desc: 'Avvisa tempestivamente il nostro servizio clienti scrivendo a assistenza@stappando.it, specificando il motivo del reso.',
              },
              {
                step: '2',
                title: 'Ricevi la bolla di reso',
                desc: 'Ti invieremo una bolla per la riconsegna della merce, con tutte le istruzioni necessarie per la spedizione.',
              },
              {
                step: '3',
                title: 'Spedisci entro 7 giorni',
                desc: 'Rispedisci la merce entro 7 giorni utilizzando la bolla fornita. Assicurati che il pacco sia sigillato correttamente.',
              },
              {
                step: '4',
                title: 'Rimborso',
                desc: 'Una volta ricevuta e verificata la merce, procederemo con il rimborso tramite lo stesso metodo di pagamento utilizzato.',
              },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-5">
                <div className="shrink-0 w-10 h-10 bg-brand-primary text-white rounded-full flex items-center justify-center font-bold text-lg">
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

        {/* Nota */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-brand-border">
          <p className="text-sm text-brand-muted leading-relaxed">
            <strong className="text-brand-text">Nota importante:</strong> Per resi dovuti a problemi di qualità o
            alterazioni organolettiche, il cliente deve avvisare tempestivamente l&apos;assistenza. La responsabilità
            dell&apos;integrità della merce durante la riconsegna rimane a carico del consumatore. Si raccomanda
            di utilizzare un imballo adeguato per proteggere le bottiglie durante il trasporto.
          </p>
        </section>
      </div>
    </div>
  );
}
