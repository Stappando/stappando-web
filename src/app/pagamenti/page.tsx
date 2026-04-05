import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import { getFAQSchema } from '@/lib/seo/schema';

export const metadata: Metadata = {
  title: 'Metodi di Pagamento — Stappando',
  description:
    'Scopri tutti i metodi di pagamento accettati su Stappando: carte, PayPal, Klarna, Google Pay, Apple Pay, Satispay e molto altro. Transazioni sicure e protette.',
  openGraph: {
    title: 'Metodi di Pagamento — Stappando',
    description: 'Carte, PayPal, Klarna, Google Pay, Apple Pay, Satispay. Transazioni sicure e protette.',
    siteName: 'Stappando',
    locale: 'it_IT',
    type: 'website',
  },
};

const payments = [
  {
    name: 'Carte di Credito e Debito',
    description: 'Visa, Mastercard, American Express, Maestro. Pagamento istantaneo e sicuro con crittografia 3D Secure.',
    logo: (
      <div className="flex items-center gap-2">
        <div className="w-12 h-8 bg-white rounded-md flex items-center justify-center shadow-sm">
          <svg viewBox="0 0 48 32" className="w-10 h-6"><path fill="#1A1F71" d="M19.5 10.2l-3.8 11.6h-3.1l-1.9-9.3c-.1-.5-.3-.8-.7-1-.7-.4-1.8-.7-2.8-.9l.1-.4h5c.6 0 1.2.4 1.3 1.2l1.2 6.6 3.1-7.8h3.1zm12.3 7.8c0-3-4.2-3.2-4.2-4.6 0-.4.4-.8 1.3-.9.4-.1 1.6-.1 2.9.5l.5-2.4c-.7-.3-1.6-.5-2.8-.5-2.9 0-5 1.6-5 3.8 0 1.7 1.5 2.6 2.6 3.1 1.1.6 1.5.9 1.5 1.4 0 .8-.9 1.1-1.7 1.1-1.4 0-2.2-.4-2.9-.7l-.5 2.5c.7.3 1.9.6 3.1.6 3.1 0 5.1-1.5 5.2-3.9zm7.7 3.8h2.7l-2.4-11.6h-2.5c-.6 0-1 .3-1.2.8l-4.3 10.8h3.1l.6-1.7h3.7l.3 1.7zm-3.2-4l1.5-4.3.9 4.3h-2.4zm-12.4-7.6l-2.4 11.6h-2.9l2.4-11.6h2.9z"/></svg>
        </div>
        <div className="w-12 h-8 bg-white rounded-md flex items-center justify-center shadow-sm">
          <svg viewBox="0 0 48 32" className="w-10 h-6"><circle cx="18" cy="16" r="10" fill="#EB001B"/><circle cx="30" cy="16" r="10" fill="#F79E1B"/><path d="M24 8.5a10 10 0 010 15 10 10 0 000-15z" fill="#FF5F00"/></svg>
        </div>
        <div className="w-12 h-8 bg-white rounded-md flex items-center justify-center shadow-sm">
          <span className="text-[10px] font-bold text-[#006FCF]">AMEX</span>
        </div>
      </div>
    ),
  },
  {
    name: 'PayPal',
    description: 'Paga con il tuo account PayPal. Veloce, sicuro e senza condividere i dati della carta. Disponibile anche PayPal a rate: paga in 3 rate senza interessi.',
    logo: (
      <div className="flex items-center gap-2">
        <div className="w-12 h-8 bg-[#FFC439] rounded-md flex items-center justify-center shadow-sm">
          <svg viewBox="0 0 48 32" className="w-10 h-6"><path fill="#003087" d="M18.5 8h5.3c2.8 0 4.8 1.5 4.4 4.3-.5 3.5-3 5.2-6 5.2H20l-.8 5.5h-3.5l2.8-15zm3.2 7h1.8c1.5 0 2.7-.8 2.9-2.3.2-1.3-.6-2.2-2.1-2.2h-1.6l-1 4.5z"/><path fill="#0070E0" d="M30 8h5.3c2.8 0 4.8 1.5 4.4 4.3-.5 3.5-3 5.2-6 5.2h-2.2l-.8 5.5h-3.5L30 8zm3.2 7h1.8c1.5 0 2.7-.8 2.9-2.3.2-1.3-.6-2.2-2.1-2.2h-1.6l-1 4.5z"/></svg>
        </div>
        <span className="text-[11px] text-[#005667] font-medium bg-[#005667]/10 px-2 py-0.5 rounded-full">+ Paga in 3 rate</span>
      </div>
    ),
  },
  {
    name: 'Klarna',
    description: 'Paga in 3 rate senza interessi. Nessun costo aggiuntivo. Ricevi il tuo ordine subito e paga comodamente nel tempo.',
    logo: (
      <div className="w-12 h-8 bg-[#FFB3C7] rounded-md flex items-center justify-center shadow-sm">
        <span className="text-[11px] font-extrabold text-black">Klarna</span>
      </div>
    ),
  },
  {
    name: 'Apple Pay',
    description: 'Paga in un tap con Face ID o Touch ID. Il modo più veloce e sicuro per pagare dal tuo iPhone, iPad o Mac.',
    logo: (
      <div className="w-12 h-8 bg-black rounded-md flex items-center justify-center shadow-sm">
        <svg viewBox="0 0 48 32" className="w-8 h-5"><path fill="#fff" d="M14 11.5c-.6.7-1.5 1.2-2.4 1.1-.1-.9.3-1.9.9-2.5.6-.7 1.6-1.2 2.3-1.2.1 1-.3 1.9-.8 2.6zm.8 1.3c-1.3-.1-2.4.7-3 .7s-1.6-.7-2.6-.7c-1.3 0-2.6.8-3.3 2-.9 1.7-.8 4.8.7 7.5.5.9 1.3 1.9 2.2 1.9s1.2-.6 2.3-.6 1.4.6 2.4.6 1.5-.9 2.1-1.8c.4-.6.5-.9.7-1.5-1.6-.6-1.8-3-.2-3.9-.8-1-.2-2.5 1.2-2.9-.5-.6-1.2-1.2-2.5-1.3zM24 12v10.5h1.6v-3.9h2.2c2 0 3.5-1.4 3.5-3.3s-1.4-3.3-3.4-3.3H24zm1.6 1.4h1.8c1.4 0 2.1.7 2.1 2s-.8 2-2.1 2h-1.8v-4z"/></svg>
      </div>
    ),
  },
  {
    name: 'Google Pay',
    description: 'Paga velocemente con Google Pay. I tuoi dati sono protetti e non vengono mai condivisi con il venditore.',
    logo: (
      <div className="w-12 h-8 bg-white rounded-md flex items-center justify-center shadow-sm border border-gray-100">
        <span className="text-[10px] font-bold text-gray-700">G Pay</span>
      </div>
    ),
  },
  {
    name: 'Satispay',
    description: 'Paga con Satispay direttamente dal tuo smartphone. Semplice, immediato e con cashback automatico.',
    logo: (
      <div className="w-12 h-8 bg-[#f52727] rounded-md flex items-center justify-center shadow-sm">
        <span className="text-[9px] font-bold text-white">Satispay</span>
      </div>
    ),
  },
  {
    name: 'Link by Stripe',
    description: 'Salva i tuoi dati di pagamento e paga con un click su tutti i siti che usano Link. Checkout ultraveloce.',
    logo: (
      <div className="w-12 h-8 bg-[#00D924] rounded-md flex items-center justify-center shadow-sm">
        <span className="text-[10px] font-extrabold text-white">Link</span>
      </div>
    ),
  },
  {
    name: 'Revolut Pay',
    description: 'Paga direttamente dal tuo conto Revolut. Veloce, sicuro e senza commissioni aggiuntive.',
    logo: (
      <div className="w-12 h-8 bg-[#0075EB] rounded-md flex items-center justify-center shadow-sm">
        <span className="text-[8px] font-bold text-white">Revolut</span>
      </div>
    ),
  },
];

export default function PagamentiPage() {
  return (
    <div className="bg-brand-bg min-h-screen">
      <JsonLd data={getFAQSchema([
        { question: 'Quando viene addebitato il pagamento?', answer: 'Il pagamento viene addebitato al momento della conferma dell\'ordine. Con PayPal a rate o Klarna, la prima rata viene addebitata subito e le successive automaticamente nelle scadenze indicate.' },
        { question: 'Posso pagare a rate?', answer: 'Sì! Con Klarna e PayPal puoi dividere il pagamento in 3 rate senza interessi e senza costi aggiuntivi.' },
        { question: 'I miei dati sono al sicuro?', answer: 'Assolutamente. I pagamenti sono processati da Stripe con crittografia end-to-end. I dati della tua carta non vengono mai memorizzati sui nostri server. Tutte le transazioni sono protette da autenticazione 3D Secure.' },
        { question: 'Posso usare Apple Pay o Google Pay?', answer: 'Sì, se hai configurato Apple Pay o Google Pay sul tuo dispositivo, li vedrai automaticamente come opzione di pagamento al checkout.' },
        { question: 'Come funziona il rimborso?', answer: 'In caso di reso, il rimborso viene accreditato sullo stesso metodo di pagamento utilizzato per l\'acquisto entro 5-7 giorni lavorativi dalla ricezione del reso.' },
      ])} />
      {/* Hero */}
      <div className="bg-brand-primary text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <nav className="text-sm text-white/60 mb-6">
            <Link href="/" className="hover:text-white">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-white/90">Pagamenti</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">Metodi di Pagamento</h1>
          <p className="text-lg text-white/80 max-w-2xl">
            Accettiamo tutti i principali metodi di pagamento. Ogni transazione è protetta e sicura.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
        {/* Payment Methods Grid */}
        <section>
          <div className="grid sm:grid-cols-2 gap-4">
            {payments.map((p) => (
              <div key={p.name} className="bg-white rounded-2xl p-5 shadow-sm border border-brand-border hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="text-lg font-semibold text-brand-primary">{p.name}</h3>
                  {p.logo}
                </div>
                <p className="text-brand-text text-sm leading-relaxed">{p.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Sicurezza */}
        <section className="bg-white rounded-2xl p-8 shadow-sm border border-brand-border">
          <div className="flex items-start gap-4">
            <svg className="w-8 h-8 text-[#055667] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
            <div>
              <h2 className="text-xl font-bold text-brand-primary mb-2">Sicurezza Garantita</h2>
              <p className="text-brand-text text-sm leading-relaxed mb-3">
                Tutti i pagamenti sono processati da <strong>Stripe</strong>, leader mondiale nei pagamenti online, utilizzato da Amazon, Google e Shopify. I tuoi dati della carta non passano mai dai nostri server.
              </p>
              <div className="flex flex-wrap gap-2">
                {['Stripe Verified', 'SSL 256-bit', '3D Secure', 'PCI DSS Level 1', 'Protezione acquisti'].map((badge) => (
                  <span key={badge} className="inline-block bg-brand-primary/10 text-brand-primary text-[11px] font-semibold px-2.5 py-1 rounded-full">
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-2xl font-bold text-brand-primary mb-6">Domande Frequenti</h2>
          <div className="space-y-4">
            {[
              {
                q: 'Quando viene addebitato il pagamento?',
                a: 'Il pagamento viene addebitato al momento della conferma dell\'ordine. Con PayPal a rate o Klarna, la prima rata viene addebitata subito e le successive automaticamente nelle scadenze indicate.',
              },
              {
                q: 'Posso pagare a rate?',
                a: 'Sì! Con Klarna e PayPal puoi dividere il pagamento in 3 rate senza interessi e senza costi aggiuntivi. Seleziona l\'opzione al momento del pagamento.',
              },
              {
                q: 'I miei dati sono al sicuro?',
                a: 'Assolutamente. I pagamenti sono processati da Stripe con crittografia end-to-end. I dati della tua carta non vengono mai memorizzati sui nostri server. Tutte le transazioni sono protette da autenticazione 3D Secure.',
              },
              {
                q: 'Posso usare Apple Pay o Google Pay?',
                a: 'Sì, se hai configurato Apple Pay o Google Pay sul tuo dispositivo, li vedrai automaticamente come opzione di pagamento al checkout. Il pagamento è istantaneo con un tap.',
              },
              {
                q: 'Come funziona il rimborso?',
                a: 'In caso di reso, il rimborso viene accreditato sullo stesso metodo di pagamento utilizzato per l\'acquisto entro 5-7 giorni lavorativi dalla ricezione del reso.',
              },
            ].map((faq) => (
              <div key={faq.q} className="bg-white rounded-xl p-5 shadow-sm border border-brand-border">
                <h3 className="font-semibold text-brand-text mb-2">{faq.q}</h3>
                <p className="text-brand-muted text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
