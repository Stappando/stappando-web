'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setStatus(data.success ? 'success' : 'error');
      if (data.success) setEmail('');
    } catch {
      setStatus('error');
    }
  };

  return (
    <footer className="bg-[#055667] text-white">
      {/* Newsletter */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-xl mx-auto text-center">
            <h3 className="text-lg font-bold mb-2">Iscriviti alla newsletter</h3>
            <p className="text-sm text-white/70 mb-4">Ricevi offerte esclusive e novità dal mondo del vino</p>
            <form onSubmit={handleNewsletter} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="La tua email"
                required
                className="flex-1 h-11 px-4 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 text-sm focus:outline-none focus:border-[#b8973f] focus:ring-1 focus:ring-[#b8973f]"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="h-11 px-6 rounded-lg bg-[#b8973f] text-white font-semibold text-sm hover:bg-[#a07f30] transition-colors disabled:opacity-50 shrink-0"
              >
                {status === 'loading' ? 'Invio...' : 'Iscriviti'}
              </button>
            </form>
            {status === 'success' && <p className="mt-2 text-sm text-green-300">Iscrizione completata!</p>}
            {status === 'error' && <p className="mt-2 text-sm text-red-300">Errore. Riprova.</p>}
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Logo + description */}
          <div className="col-span-2 md:col-span-1">
            <Image src="/logo-white.png" alt="Stappando" width={160} height={40} className="mb-4 brightness-0 invert" />
            <p className="text-sm text-white/60 leading-relaxed">
              Enocultura italiana. Vini d&apos;eccellenza direttamente dalle cantine a casa tua.
            </p>
            {/* Social */}
            <div className="flex gap-3 mt-5">
              <a href="https://www.instagram.com/stappando.it" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/25 transition-colors" aria-label="Instagram">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
              <a href="https://www.facebook.com/stappandoenoteca/" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/25 transition-colors" aria-label="Facebook">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="https://www.youtube.com/channel/UCjBumtuIO0NMee4aJEtSw7Q" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/25 transition-colors" aria-label="YouTube">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
              <a href="https://www.tiktok.com/@stappando" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/25 transition-colors" aria-label="TikTok">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
              </a>
              <a href="https://t.me/StappandoEnocultura" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/25 transition-colors" aria-label="Telegram">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              </a>
            </div>
          </div>

          {/* Catalogo */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider mb-4 text-[#b8973f]">Catalogo</h4>
            <ul className="space-y-2.5">
              <li><Link href="/cerca?q=Vini+Rossi" className="text-sm text-white/70 hover:text-white transition-colors">Vini Rossi</Link></li>
              <li><Link href="/cerca?q=Vini+Bianchi" className="text-sm text-white/70 hover:text-white transition-colors">Vini Bianchi</Link></li>
              <li><Link href="/cerca?q=Prosecco" className="text-sm text-white/70 hover:text-white transition-colors">Prosecco</Link></li>
              <li><Link href="/cerca?q=Champagne" className="text-sm text-white/70 hover:text-white transition-colors">Champagne</Link></li>
              <li><Link href="/cerca?q=Distillati" className="text-sm text-white/70 hover:text-white transition-colors">Distillati</Link></li>
              <li><Link href="/cerca?on_sale=true" className="text-sm text-white/70 hover:text-white transition-colors">Offerte</Link></li>
            </ul>
          </div>

          {/* Informazioni */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider mb-4 text-[#b8973f]">Informazioni</h4>
            <ul className="space-y-2.5">
              <li><Link href="/chi-siamo" className="text-sm text-white/70 hover:text-white transition-colors">Chi siamo</Link></li>
              <li><Link href="/contatti" className="text-sm text-white/70 hover:text-white transition-colors">Contatti</Link></li>
              <li><Link href="/blog" className="text-sm text-white/70 hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="/punti-pop" className="text-sm text-white/70 hover:text-white transition-colors">Raccolta Punti POP</Link></li>
              <li><a href="https://stappando.it/vendor-register/" target="_blank" rel="noopener noreferrer" className="text-sm text-white/70 hover:text-white transition-colors">Vendi su Stappando</a></li>
            </ul>
          </div>

          {/* Assistenza */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider mb-4 text-[#b8973f]">Assistenza</h4>
            <ul className="space-y-2.5">
              <li><Link href="/spedizioni" className="text-sm text-white/70 hover:text-white transition-colors">Costi di spedizione</Link></li>
              <li><Link href="/pagamenti" className="text-sm text-white/70 hover:text-white transition-colors">Metodi di pagamento</Link></li>
              <li><Link href="/resi" className="text-sm text-white/70 hover:text-white transition-colors">Resi e rimborsi</Link></li>
              <li><Link href="/contatti" className="text-sm text-white/70 hover:text-white transition-colors">Contattaci</Link></li>
            </ul>
          </div>

          {/* Legale */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider mb-4 text-[#b8973f]">Legale</h4>
            <ul className="space-y-2.5">
              <li><a href="https://stappando.it/privacy-policy-2/" target="_blank" rel="noopener noreferrer" className="text-sm text-white/70 hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="https://stappando.it/termini-e-condizioni/" target="_blank" rel="noopener noreferrer" className="text-sm text-white/70 hover:text-white transition-colors">Termini e condizioni</a></li>
            </ul>
            {/* Payment icons */}
            <div className="mt-6">
              <p className="text-xs text-white/40 mb-2">Pagamenti sicuri</p>
              <div className="flex flex-wrap gap-2">
                {/* Visa */}
                <div className="w-10 h-7 bg-white rounded flex items-center justify-center">
                  <svg viewBox="0 0 48 32" className="w-8 h-5"><path fill="#1A1F71" d="M19.5 10.2l-3.8 11.6h-3.1l-1.9-9.3c-.1-.5-.3-.8-.7-1-.7-.4-1.8-.7-2.8-.9l.1-.4h5c.6 0 1.2.4 1.3 1.2l1.2 6.6 3.1-7.8h3.1zm12.3 7.8c0-3-4.2-3.2-4.2-4.6 0-.4.4-.8 1.3-.9.4-.1 1.6-.1 2.9.5l.5-2.4c-.7-.3-1.6-.5-2.8-.5-2.9 0-5 1.6-5 3.8 0 1.7 1.5 2.6 2.6 3.1 1.1.6 1.5.9 1.5 1.4 0 .8-.9 1.1-1.7 1.1-1.4 0-2.2-.4-2.9-.7l-.5 2.5c.7.3 1.9.6 3.1.6 3.1 0 5.1-1.5 5.2-3.9zm7.7 3.8h2.7l-2.4-11.6h-2.5c-.6 0-1 .3-1.2.8l-4.3 10.8h3.1l.6-1.7h3.7l.3 1.7zm-3.2-4l1.5-4.3.9 4.3h-2.4zm-12.4-7.6l-2.4 11.6h-2.9l2.4-11.6h2.9z"/></svg>
                </div>
                {/* Mastercard */}
                <div className="w-10 h-7 bg-white rounded flex items-center justify-center">
                  <svg viewBox="0 0 48 32" className="w-8 h-5"><circle cx="18" cy="16" r="10" fill="#EB001B"/><circle cx="30" cy="16" r="10" fill="#F79E1B"/><path d="M24 8.5a10 10 0 010 15 10 10 0 000-15z" fill="#FF5F00"/></svg>
                </div>
                {/* PayPal */}
                <div className="w-10 h-7 bg-white rounded flex items-center justify-center">
                  <svg viewBox="0 0 48 32" className="w-8 h-5"><path fill="#003087" d="M18.5 8h5.3c2.8 0 4.8 1.5 4.4 4.3-.5 3.5-3 5.2-6 5.2H20l-.8 5.5h-3.5l2.8-15zm3.2 7h1.8c1.5 0 2.7-.8 2.9-2.3.2-1.3-.6-2.2-2.1-2.2h-1.6l-1 4.5z"/><path fill="#0070E0" d="M30 8h5.3c2.8 0 4.8 1.5 4.4 4.3-.5 3.5-3 5.2-6 5.2h-2.2l-.8 5.5h-3.5L30 8zm3.2 7h1.8c1.5 0 2.7-.8 2.9-2.3.2-1.3-.6-2.2-2.1-2.2h-1.6l-1 4.5z"/></svg>
                </div>
                {/* Apple Pay */}
                <div className="w-10 h-7 bg-white rounded flex items-center justify-center">
                  <svg viewBox="0 0 48 32" className="w-7 h-4"><path fill="#000" d="M14 11.5c-.6.7-1.5 1.2-2.4 1.1-.1-.9.3-1.9.9-2.5.6-.7 1.6-1.2 2.3-1.2.1 1-.3 1.9-.8 2.6zm.8 1.3c-1.3-.1-2.4.7-3 .7s-1.6-.7-2.6-.7c-1.3 0-2.6.8-3.3 2-.9 1.7-.8 4.8.7 7.5.5.9 1.3 1.9 2.2 1.9s1.2-.6 2.3-.6 1.4.6 2.4.6 1.5-.9 2.1-1.8c.4-.6.5-.9.7-1.5-1.6-.6-1.8-3-.2-3.9-.8-1-.2-2.5 1.2-2.9-.5-.6-1.2-1.2-2.5-1.3zM24 12v10.5h1.6v-3.9h2.2c2 0 3.5-1.4 3.5-3.3s-1.4-3.3-3.4-3.3H24zm1.6 1.4h1.8c1.4 0 2.1.7 2.1 2s-.8 2-2.1 2h-1.8v-4zm8.8 9.2c1 0 2-.5 2.4-1.4h0v1.3h1.5V17c0-1.5-1.2-2.5-3-2.5-1.7 0-2.9 1-3 2.4h1.4c.2-.7.8-1.1 1.6-1.1 1 0 1.5.5 1.5 1.3v.6l-2.1.1c-1.9.1-3 .9-3 2.3 0 1.4 1.1 2.4 2.7 2.4zm.4-1.2c-.9 0-1.4-.4-1.4-1.1 0-.7.6-1.1 1.6-1.2l1.8-.1v.6c0 1-.9 1.8-2 1.8zm6 3.6c1.5 0 2.2-.6 2.8-2.3l2.7-7.6h-1.6l-1.8 5.7h0l-1.8-5.7h-1.7l2.6 7.2-.1.5c-.3.8-.7 1-1.4 1-.1 0-.4 0-.5 0v1.2c.1 0 .5 0 .8 0z"/></svg>
                </div>
                {/* Google Pay */}
                <div className="w-10 h-7 bg-white rounded flex items-center justify-center">
                  <span className="text-[8px] font-bold text-gray-600">G Pay</span>
                </div>
                {/* Satispay */}
                <div className="w-10 h-7 bg-[#f52727] rounded flex items-center justify-center">
                  <span className="text-[7px] font-bold text-white">Satispay</span>
                </div>
                {/* Klarna */}
                <div className="w-10 h-7 bg-[#FFB3C7] rounded flex items-center justify-center">
                  <span className="text-[8px] font-bold text-black">Klarna</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/50">
            <p>&copy; {new Date().getFullYear()} Stappando Srl Semplificata — P.IVA 15855161003. Tutti i diritti riservati.</p>
            <p className="font-medium text-white/60">🔞 Vietata la vendita ai minori di 18 anni</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
