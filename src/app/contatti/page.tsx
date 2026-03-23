'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';

export default function ContattiPage() {
  const [form, setForm] = useState({ nome: '', email: '', telefono: '', oggetto: '', messaggio: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('sending');

    try {
      const res = await fetch('/api/contatti', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setStatus('sent');
        setForm({ nome: '', email: '', telefono: '', oggetto: '', messaggio: '' });
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="bg-brand-bg min-h-screen">
      {/* Hero */}
      <div className="bg-brand-primary text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <nav className="text-sm text-white/60 mb-6">
            <Link href="/" className="hover:text-white">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-white/90">Contatti</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">Contattaci</h1>
          <p className="text-lg text-white/80 max-w-2xl">
            Siamo qui per aiutarti. Scrivici o chiamaci, risponderemo entro 24 ore.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
        {/* Contact Info Cards */}
        <section className="grid sm:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-border text-center">
            <span className="text-3xl block mb-3">📞</span>
            <h3 className="font-semibold text-brand-primary mb-1">Telefono</h3>
            <a href="tel:+390692915330" className="text-brand-text hover:text-brand-primary transition-colors">
              +39 06 92915330
            </a>
            <p className="text-brand-muted text-xs mt-1">Lun-Ven, 9:00-18:00</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-border text-center">
            <span className="text-3xl block mb-3">📧</span>
            <h3 className="font-semibold text-brand-primary mb-1">Email</h3>
            <a href="mailto:assistenza@stappando.it" className="text-brand-text hover:text-brand-primary transition-colors text-sm">
              assistenza@stappando.it
            </a>
            <p className="text-brand-muted text-xs mt-1">Risposta entro 24 ore</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-border text-center">
            <span className="text-3xl block mb-3">📍</span>
            <h3 className="font-semibold text-brand-primary mb-1">Ufficio</h3>
            <p className="text-brand-text text-sm">
              Piazza Nicola Maria Nicolai 11
            </p>
            <p className="text-brand-muted text-xs mt-1">00156 Roma (RM)</p>
          </div>
        </section>

        {/* Contact Form */}
        <section className="bg-white rounded-2xl p-8 shadow-sm border border-brand-border">
          <h2 className="text-2xl font-bold text-brand-primary mb-6">Inviaci un Messaggio</h2>

          {status === 'sent' ? (
            <div className="bg-brand-success/10 border border-brand-success/30 rounded-xl p-6 text-center">
              <span className="text-3xl block mb-2">&#10003;</span>
              <h3 className="text-lg font-semibold text-brand-success mb-1">Messaggio Inviato!</h3>
              <p className="text-brand-muted text-sm">
                Grazie per averci contattato. Ti risponderemo entro 24 ore.
              </p>
              <button
                onClick={() => setStatus('idle')}
                className="mt-4 text-brand-primary font-medium text-sm hover:underline"
              >
                Invia un altro messaggio
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="nome" className="block text-sm font-medium text-brand-text mb-1.5">
                    Nome e Cognome *
                  </label>
                  <input
                    id="nome"
                    type="text"
                    required
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    className="w-full rounded-lg border border-brand-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
                    placeholder="Mario Rossi"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-brand-text mb-1.5">
                    Email *
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full rounded-lg border border-brand-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
                    placeholder="mario@esempio.it"
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="telefono" className="block text-sm font-medium text-brand-text mb-1.5">
                    Telefono
                  </label>
                  <input
                    id="telefono"
                    type="tel"
                    value={form.telefono}
                    onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                    className="w-full rounded-lg border border-brand-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
                    placeholder="+39 333 1234567"
                  />
                </div>
                <div>
                  <label htmlFor="oggetto" className="block text-sm font-medium text-brand-text mb-1.5">
                    Oggetto *
                  </label>
                  <input
                    id="oggetto"
                    type="text"
                    required
                    value={form.oggetto}
                    onChange={(e) => setForm({ ...form, oggetto: e.target.value })}
                    className="w-full rounded-lg border border-brand-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
                    placeholder="Informazioni su un ordine"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="messaggio" className="block text-sm font-medium text-brand-text mb-1.5">
                  Messaggio *
                </label>
                <textarea
                  id="messaggio"
                  required
                  rows={5}
                  value={form.messaggio}
                  onChange={(e) => setForm({ ...form, messaggio: e.target.value })}
                  className="w-full rounded-lg border border-brand-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary resize-none"
                  placeholder="Scrivi il tuo messaggio..."
                />
              </div>

              {status === 'error' && (
                <div className="bg-brand-error/10 border border-brand-error/30 rounded-lg px-4 py-3">
                  <p className="text-sm text-brand-error">
                    Si è verificato un errore. Riprova o scrivici direttamente a assistenza@stappando.it
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'sending'}
                className="w-full sm:w-auto bg-brand-accent text-white font-semibold px-8 py-3 rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === 'sending' ? 'Invio in corso...' : 'Invia Messaggio'}
              </button>
            </form>
          )}
        </section>

        {/* Links utili */}
        <section>
          <h2 className="text-2xl font-bold text-brand-primary mb-6">Informazioni Utili</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { href: '/spedizioni', label: 'Spedizioni', desc: 'Costi e tempi di consegna' },
              { href: '/pagamenti', label: 'Pagamenti', desc: 'Metodi di pagamento accettati' },
              { href: '/resi', label: 'Resi e Rimborsi', desc: 'Politica resi e recesso' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="bg-white rounded-xl p-5 shadow-sm border border-brand-border hover:shadow-md transition-shadow block"
              >
                <h3 className="font-semibold text-brand-primary mb-1">{link.label}</h3>
                <p className="text-brand-muted text-sm">{link.desc}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
