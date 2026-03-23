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
                <span className="block mb-2"><svg className="w-6 h-6 text-[#055667] mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg></span>
                <p className="text-sm font-medium text-brand-primary">Telefono</p>
                <p className="text-sm text-brand-muted">06 92915330</p>
              </div>
              <div className="bg-brand-bg rounded-xl p-4 text-center">
                <span className="block mb-2"><svg className="w-6 h-6 text-[#055667] mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg></span>
                <p className="text-sm font-medium text-brand-primary">Email</p>
                <p className="text-sm text-brand-muted">info@stappando.it</p>
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
                icon: 'camera',
                title: 'Formato o etichetta differenti',
                desc: 'Il prodotto ricevuto presenta formato o etichetta differenti rispetto alle foto pubblicate sul sito.',
              },
              {
                icon: 'tag',
                title: 'Nomenclatura errata',
                desc: 'Il nome del prodotto o la denominazione non corrispondono a quanto ordinato.',
              },
              {
                icon: 'warning',
                title: 'Merce avariata o danneggiata',
                desc: 'Il prodotto è arrivato danneggiato, avariato o presenta difetti evidenti.',
              },
              {
                icon: 'box',
                title: 'Consegna non avvenuta',
                desc: 'La consegna non è avvenuta entro 14 giorni lavorativi dalla data dell\'ordine.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white rounded-xl p-5 shadow-sm border border-brand-border flex items-start gap-4"
              >
                <span className="shrink-0">
                  {item.icon === 'camera' && <svg className="w-6 h-6 text-[#055667]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" /></svg>}
                  {item.icon === 'tag' && <svg className="w-6 h-6 text-[#055667]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 6h.008v.008H6V6z" /></svg>}
                  {item.icon === 'warning' && <svg className="w-6 h-6 text-[#055667]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>}
                  {item.icon === 'box' && <svg className="w-6 h-6 text-[#055667]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
                </span>
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
