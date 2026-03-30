import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy — Stappando',
  description: 'Informativa sul trattamento dei dati personali ai sensi del Reg. UE 2016/679 (GDPR). Stappando Srl.',
};

export default function PrivacyPage() {
  return (
    <div className="bg-brand-bg min-h-screen">
      <div className="bg-brand-primary text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <nav className="text-sm text-white/60 mb-6">
            <Link href="/" className="hover:text-white">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-white/90">Privacy Policy</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-white/70 text-sm">IN-01 Informativa Utenti Sito Stappando — Rev. 00 del 14/06/2024</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-brand-border prose prose-sm max-w-none prose-headings:text-[#005667] prose-headings:font-bold prose-p:text-gray-700 prose-li:text-gray-700">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-6">Informativa sul trattamento di dati personali utenti sito — Art. 13 Reg. UE 2016/679</p>

          <h2>1. Titolare del trattamento</h2>
          <p>Ai sensi del Regolamento UE 2016/679 (&quot;GDPR&quot;) comunichiamo che il Titolare del trattamento dei dati è <strong>Stappando Srl</strong>, P.IVA/CF: 15855661003, con sede legale in Piazza Nicola Maria Nicolai 11 – Roma 00156, Italia.</p>
          <p>Email: <a href="mailto:assistenza@stappando.it" className="text-[#005667]">assistenza@stappando.it</a> — Tel. 0692915330</p>
          <p>La Stappando Srl nella sua veste di &quot;Titolare del trattamento&quot; la informa che i suoi dati personali raccolti saranno trattati nel rispetto della normativa citata, al fine di garantire i diritti, le libertà fondamentali, nonché la dignità delle persone fisiche, con particolare riferimento alla riservatezza e all&apos;identità personale.</p>

          <h2>2. Fonte dei dati personali</h2>
          <p>Ai sensi dell&apos;articolo 13 del Reg. UE 2016/679, informiamo che la Stappando Srl tratta dati personali degli interessati che tramite il presente sito web hanno volontariamente comunicato, compilando i vari form, inviando un&apos;e-mail o di persona nei nostri uffici i loro dati anagrafici.</p>
          <p>Tutti i dati personali comunicati dai soggetti interessati sono trattati per adempimenti connessi a:</p>
          <ul>
            <li>Pratiche amministrative ed adempimenti fiscali relativi ai prodotti della Stappando Srl</li>
            <li>Svolgimento dell&apos;attività al fine di consentire all&apos;interessato di fruire dei servizi</li>
            <li>Registrazione al Sito e acquisti online</li>
          </ul>
          <p>Le basi giuridiche del trattamento sono gli art. 6.1.b) e 6.1.c) del Regolamento, ovvero l&apos;esecuzione di un contratto o di misure precontrattuali e obblighi legali.</p>

          <h2>3. Finalità</h2>
          <p>Secondo la legge indicata, il Titolare del trattamento garantisce che il trattamento dei dati personali si svolga nel rispetto dei diritti e delle libertà fondamentali, nonché della dignità dell&apos;interessato, con particolare riferimento alla riservatezza, all&apos;identità personale e al diritto alla protezione dei dati personali.</p>

          <h2>4. Conferimento dei dati</h2>
          <p>Il conferimento dei dati è necessario per consentire l&apos;erogazione e la gestione del servizio. L&apos;eventuale rifiuto di conferire i dati comporterà l&apos;impossibilità di ottenere l&apos;utilizzo del servizio proposto dal Titolare.</p>
          <p>I dati personali potranno essere comunicati a:</p>
          <ul>
            <li>Soggetti cui la facoltà di accesso è riconosciuta in forza di provvedimenti normativi</li>
            <li>Collaboratori, dipendenti e fornitori nell&apos;ambito delle relative mansioni</li>
            <li>Uffici postali, spedizionieri e corrieri per l&apos;invio di documentazione e materiale</li>
            <li>Soggetti pubblici e privati qualora la comunicazione risulti necessaria</li>
            <li>Istituti bancari per la gestione d&apos;incassi e pagamenti</li>
          </ul>
          <p>I dati potranno essere comunicati a soggetti terzi nominati responsabili del trattamento ai sensi dell&apos;articolo 28 del GDPR.</p>

          <h2>5. Comunicazione e diffusione</h2>
          <p><strong>Nota per i minori:</strong> i minori di 18 anni non possono utilizzare i nostri servizi; pertanto non devono fornire alcun dato personale nel processo di registrazione.</p>

          <h2>6. Modalità</h2>
          <p>Il trattamento riguarda dati personali comuni identificativi. Il trattamento avviene utilizzando sia supporti cartacei che informatici con l&apos;osservanza di ogni misura cautelativa, al fine di garantire la sicurezza e la riservatezza.</p>

          <h2>7. Periodo di conservazione</h2>
          <p>Nel rispetto dei principi di liceità, limitazione delle finalità e minimizzazione dei dati, i dati personali verranno conservati per il periodo di tempo strettamente necessario al perseguimento delle specifiche finalità del trattamento, non oltre 10 anni dal momento della raccolta.</p>

          <h2>8. Diritti dell&apos;interessato</h2>
          <p>L&apos;interessato potrà, in qualsiasi momento, esercitare i seguenti diritti:</p>
          <ul>
            <li><strong>Diritto di accesso</strong> (art. 15) — ottenere la conferma dell&apos;esistenza del trattamento</li>
            <li><strong>Diritto di rettifica</strong> (art. 16) — ottenere la rettifica dei dati inesatti</li>
            <li><strong>Diritto all&apos;oblio</strong> (art. 17) — ottenere la cancellazione dei dati</li>
            <li><strong>Diritto alla limitazione</strong> (art. 18) — ottenere la limitazione del trattamento</li>
            <li><strong>Diritto alla portabilità</strong> (art. 20) — ricevere i dati in formato strutturato</li>
            <li><strong>Diritto di opposizione</strong> (art. 21) — opporsi al trattamento</li>
            <li><strong>Revoca del consenso</strong> — in qualsiasi momento (art. 7)</li>
          </ul>
          <p>È possibile proporre reclamo ai sensi dell&apos;art. 77 GDPR al <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer" className="text-[#005667]">Garante per la protezione dei dati personali</a>.</p>
          <p>Le richieste saranno evase entro 30 giorni dalla domanda, prorogabili di ulteriori 2 mesi in casi particolarmente complessi. Le domande possono essere inviate a <a href="mailto:assistenza@stappando.it" className="text-[#005667]">assistenza@stappando.it</a>.</p>
        </div>
      </div>
    </div>
  );
}
