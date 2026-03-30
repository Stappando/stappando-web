import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Termini e Condizioni — Stappando',
  description: 'Condizioni generali di vendita di Stappando Srl. Ordini, pagamenti, spedizioni, resi e rimborsi.',
};

export default function TerminiPage() {
  return (
    <div className="bg-brand-bg min-h-screen">
      <div className="bg-brand-primary text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <nav className="text-sm text-white/60 mb-6">
            <Link href="/" className="hover:text-white">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-white/90">Termini e Condizioni</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Termini e Condizioni</h1>
          <p className="text-white/70 text-sm">Condizioni Generali di Vendita</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-brand-border prose prose-sm max-w-none prose-headings:text-[#005667] prose-headings:font-bold prose-p:text-gray-700 prose-li:text-gray-700">

          <p className="text-sm text-gray-500 mb-6">L&apos;accesso e l&apos;uso di questo sito web, così come l&apos;acquisto dei prodotti, presuppongono la lettura, la conoscenza e l&apos;accettazione di queste Condizioni Generali di Vendita.</p>

          <h2>I. Ambito di applicazione</h2>
          <p>Le presenti Condizioni Generali di Vendita disciplinano la vendita di prodotti tramite il Sito e costituiscono parte integrante di ogni Contratto concluso tra:</p>
          <p><strong>Il Venditore:</strong> Stappando Srl — P.IVA/CF 15855661003 — REA RM-1455146 — Piazza Nicola Maria Nicolai 11, 00156 Roma (RM)</p>
          <p><strong>Il Cliente:</strong> qualsiasi soggetto che acquisti prodotti sul sito www.stappando.it</p>
          <p>La Stappando Srl si riserva il diritto di modificare le presenti Condizioni in qualsiasi momento. Le Condizioni applicabili sono quelle vigenti al momento dell&apos;Ordine.</p>

          <h2>II. Ordini</h2>
          <p>Il Cliente si impegna, prima di procedere alla conferma dell&apos;Ordine, a prendere visione delle presenti Condizioni. Effettuando un Ordine, il Cliente garantisce di avere compiuto 18 anni e la capacità di concludere contratti vincolanti.</p>
          <p>Il Cliente può acquistare solo i prodotti presenti nel catalogo al momento dell&apos;inoltro dell&apos;Ordine. Gli Ordini possono essere soggetti a limitazioni di quantità.</p>
          <p>Il Venditore è responsabile solo della presentazione della merce. Un prodotto aperto che risulta alterato nel gusto e/o sapore non potrà essere direttamente imputabile al venditore. In tale scenario non verranno concessi rimborsi.</p>
          <p>La ricezione dell&apos;Ordine costituisce accettazione della proposta contrattuale. La conferma via e-mail è generata automaticamente e non è di per sé accettazione dell&apos;Ordine. L&apos;elaborazione nello stato &quot;in elaborazione&quot; con generazione della mail è la conferma di accettazione.</p>
          <p>Una volta inoltrata la Ricevuta di accettazione, non sarà più possibile modificare o annullare l&apos;Ordine, fatto salvo il diritto di recesso.</p>
          <p><strong>Controversie:</strong> per aprire una controversia, inviare mail a <a href="mailto:assistenza@stappando.it" className="text-[#005667]">assistenza@stappando.it</a>. Risposta entro 24h.</p>

          <h2>III. Pagamenti</h2>
          <p>Il prezzo dei prodotti è quello in vigore il giorno dell&apos;Ordine. I costi di spedizione non sono compresi nel prezzo e sono indicati al momento della conclusione dell&apos;Ordine. Tutti i prezzi sono comprensivi di IVA.</p>
          <p>Metodi di pagamento accettati: Carta di credito/debito (Visa, Mastercard, American Express), PayPal, PayPal a rate, Klarna, Apple Pay, Google Pay, Satispay, Revolut Pay, Link by Stripe.</p>
          <p>Le informazioni finanziarie sono gestite esclusivamente dai circuiti di pagamento (Stripe, PayPal). I dati della carta non transitano mai dai server di Stappando.</p>
          <p>Con Klarna o PayPal a rate ricevi il tuo ordine subito e paghi in 3 rate senza interessi.</p>

          <h2>IV. Spedizione e consegna</h2>
          <p>Gli ordini vengono elaborati dalle 14:00 (giorno A) alle 14:00 (giorno B), dal lunedì al venerdì. Gli ordini dopo le 14:00 di venerdì saranno elaborati il lunedì successivo.</p>
          <p>La spedizione avviene in 2 giorni lavorativi (sabato e domenica esclusi) dall&apos;accettazione dell&apos;Ordine. L&apos;ordine non è mai garantito in 24/48h per possibili cause di forza maggiore.</p>
          <p>Se l&apos;ordine non viene consegnato entro 14 giorni lavorativi dalla partenza, la spedizione sarà identificata come smarrita. Il Cliente potrà scegliere di rimettere l&apos;ordine in lavorazione o farsi accreditare l&apos;importo. Il rimborso sarà emesso entro 14 giorni lavorativi.</p>
          <p>Eventuali danni all&apos;imballo devono essere immediatamente contestati al corriere e segnalati a Stappando entro 8 giorni dalla consegna.</p>
          <p><strong>Annate dei prodotti:</strong> le annate sono costantemente monitorate. In caso di discrepanza tra annata ricevuta e dichiarata sul sito, sarà possibile procedere al reso con emissione di un voucher.</p>

          <h2>V. Politiche delle spedizioni</h2>
          <p>Il corriere effettua un doppio tentativo di consegna. Dopo il secondo tentativo, la merce risulterà in giacenza per 7 giorni. La giacenza ha un costo di €5,00.</p>
          <p>Il terzo tentativo di consegna ha un costo aggiuntivo di €3,00.</p>
          <p><strong>Annullamento ordini:</strong> gli ordini pagati con PayPal non ancora spediti possono essere annullati con una tariffa del 5% del totale. L&apos;annullamento è gratuito per gli altri metodi di pagamento.</p>
          <p><strong>Resi per ripensamento:</strong> il costo di ritiro e consegna al mittente è di €5,00, addebitabile sullo stesso metodo di pagamento utilizzato. Il reso è gratuito solo in caso di inequivocabile responsabilità del Venditore.</p>
          <p>Dopo il secondo reso per difetti del prodotto nell&apos;arco di 6 mesi, le spese di spedizione e gestione saranno a carico del cliente (€5,00 detratti dal rimborso).</p>

          <h2>VI. Fatturazione</h2>
          <p>La fattura viene emessa per ciascun Cliente che l&apos;abbia richiesta inserendo codice fiscale e partita IVA nel Modulo d&apos;Ordine. Nessuna fattura potrà essere emessa dopo l&apos;inoltro dell&apos;Ordine se non richiesta al momento dell&apos;acquisto.</p>

          <h2>VII. Vendita proibita ai minori</h2>
          <p>La vendita di alcolici ai minori di 18 anni è vietata per legge. Il Venditore si impegna a verificare l&apos;età dell&apos;acquirente attraverso una procedura di controllo dell&apos;identità.</p>

          <h2>VIII. Norme applicabili e foro competente</h2>
          <p>Le presenti Condizioni sono regolate dalla legge italiana. Ogni controversia sarà sottoposta alla giurisdizione del giudice italiano.</p>
        </div>
      </div>
    </div>
  );
}
