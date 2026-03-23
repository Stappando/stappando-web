import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Metodi di Pagamento — Stappando',
  description:
    'Scopri i metodi di pagamento accettati su Stappando: PayPal, carta di credito, bonifico bancario e contrassegno. Transazioni sicure con protocolli HTTPS e SSL.',
  openGraph: {
    title: 'Metodi di Pagamento — Stappando',
    description: 'PayPal, carta di credito, bonifico bancario e contrassegno. Transazioni sicure con protocolli HTTPS e SSL.',
    siteName: 'Stappando',
    locale: 'it_IT',
    type: 'website',
  },
};

const paymentMethods = [
  {
    name: 'PayPal',
    icon: '💳',
    description: 'Paga tranquillamente con il tuo account PayPal direttamente sul sito. Veloce, sicuro e senza condividere i dati della tua carta.',
    extra: null,
  },
  {
    name: 'Carta di Credito',
    icon: '💎',
    description: 'I tuoi dati sono al sicuro: utilizziamo 3 livelli di sicurezza crittografata per proteggere ogni transazione. Accettiamo Visa, Mastercard e le principali carte.',
    extra: null,
  },
  {
    name: 'Bonifico Bancario',
    icon: '🏦',
    description: 'Effettua il pagamento tramite bonifico bancario. Non appena sarà contabilizzato il pagamento, faremo partire la tua spedizione.',
    extra: null,
  },
  {
    name: 'Contrassegno',
    icon: '📦',
    description: 'Paga alla consegna direttamente al nostro corriere. Facile e comodo, ideale per chi preferisce pagare al momento della ricezione.',
    extra: 'Supplemento di 5,00\u20AC sull\u2019ordine. Si prega di preparare l\u2019importo esatto.',
  },
];

export default function PagamentiPage() {
  return (
    <div className="bg-brand-bg min-h-screen">
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
            Scegli il metodo di pagamento che preferisci. Tutte le transazioni sono protette e sicure.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
        {/* Payment Methods */}
        <section>
          <h2 className="text-2xl font-bold text-brand-primary mb-6">Come Pagare</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {paymentMethods.map((method) => (
              <div
                key={method.name}
                className="bg-white rounded-2xl p-6 shadow-sm border border-brand-border hover:shadow-md transition-shadow"
              >
                <span className="text-3xl mb-3 block">{method.icon}</span>
                <h3 className="text-xl font-semibold text-brand-primary mb-3">{method.name}</h3>
                <p className="text-brand-text text-sm leading-relaxed">{method.description}</p>
                {method.extra && (
                  <div className="mt-4 bg-brand-accent/10 border border-brand-accent/30 rounded-lg px-4 py-2">
                    <p className="text-sm text-brand-accent font-medium">{method.extra}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Sicurezza */}
        <section className="bg-white rounded-2xl p-8 shadow-sm border border-brand-border">
          <div className="flex items-start gap-4">
            <span className="text-4xl">🔒</span>
            <div>
              <h2 className="text-2xl font-bold text-brand-primary mb-3">Sicurezza Garantita</h2>
              <p className="text-brand-text leading-relaxed mb-4">
                Su Stappando utilizziamo i più moderni e sofisticati sistemi di protezione dei dati disponibili
                sul mercato. Tutte le transazioni sono protette da protocolli <strong>HTTPS</strong> e <strong>SSL</strong>,
                che garantiscono la massima sicurezza per i tuoi dati personali e finanziari.
              </p>
              <div className="flex flex-wrap gap-4">
                {['HTTPS', 'SSL', 'Crittografia 256-bit'].map((badge) => (
                  <span
                    key={badge}
                    className="inline-block bg-brand-primary/10 text-brand-primary text-xs font-semibold px-3 py-1 rounded-full"
                  >
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
                a: 'Il pagamento viene addebitato al momento della conferma dell\'ordine per carta di credito e PayPal. Per il bonifico bancario, la spedizione parte dopo la contabilizzazione.',
              },
              {
                q: 'Il contrassegno ha un costo aggiuntivo?',
                a: 'Sì, il pagamento in contrassegno prevede un supplemento di 5,00\u20AC sull\'ordine. Si prega di preparare l\'importo esatto al momento della consegna.',
              },
              {
                q: 'I miei dati sono al sicuro?',
                a: 'Assolutamente sì. Utilizziamo protocolli HTTPS e SSL con crittografia avanzata per proteggere tutte le transazioni e i dati personali.',
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
