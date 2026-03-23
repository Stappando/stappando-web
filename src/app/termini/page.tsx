import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Termini e Condizioni — Stappando',
  description: 'Termini e condizioni di vendita di Stappando. Consulta le condizioni generali per gli acquisti online.',
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
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">Termini e Condizioni</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-brand-border text-center">
          <span className="text-4xl block mb-4">📋</span>
          <h2 className="text-xl font-semibold text-brand-primary mb-3">Condizioni Generali di Vendita</h2>
          <p className="text-brand-muted leading-relaxed mb-6">
            Le condizioni generali di vendita complete sono disponibili sul sito principale di Stappando.
            Il documento contiene tutte le informazioni relative ai termini contrattuali, diritti e obblighi
            delle parti.
          </p>
          <a
            href="https://stappando.it/termini-e-condizioni/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-brand-primary text-white font-semibold px-8 py-3 rounded-full hover:opacity-90 transition-opacity"
          >
            Leggi i Termini e Condizioni Completi
          </a>
        </div>
      </div>
    </div>
  );
}
