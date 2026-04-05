'use client';

import { useState, useEffect } from 'react';

/* ─── MOCKUP V2: Scheda Prodotto CRO + SEO ─── */
/* Layout ottimizzato — meno rosso, più fiducia, note degustazione incluse */

export default function MockupPDP() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [countdown, setCountdown] = useState('');
  const [showCountdown, setShowCountdown] = useState(false);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const rome = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Rome' }));
      const day = rome.getDay();
      const hours = rome.getHours();
      const minutes = rome.getMinutes();
      if (day >= 1 && day <= 5 && hours < 14) {
        const remaining = (14 - hours - 1) * 60 + (60 - minutes);
        const h = Math.floor(remaining / 60);
        const m = remaining % 60;
        setCountdown(`${h}h ${m.toString().padStart(2, '0')}m`);
        setShowCountdown(true);
      } else {
        setShowCountdown(false);
      }
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, []);

  const faqs = [
    { q: 'A che temperatura servire questo vino?', a: 'Si consiglia di servire a 16-18°C. Aprire la bottiglia almeno 30 minuti prima per favorire l\'ossigenazione degli aromi.' },
    { q: 'Quanto si conserva dopo l\'apertura?', a: 'Una volta aperto, si conserva per 3-5 giorni in frigorifero con tappo. I tannini si ammorbidiranno leggermente col passare delle ore.' },
    { q: 'Va decantato?', a: 'Per vini rossi strutturati come questo, si consiglia una decantazione di circa 1 ora per esaltare gli aromi e ammorbidire i tannini.' },
    { q: 'Come viene spedito?', a: 'Ogni bottiglia viene imballata in scatole anti-urto con protezioni in polistirolo. In estate utilizziamo imballaggi isotermici per proteggere il vino dal calore.' },
  ];

  return (
    <div className="bg-[#f8f6f1] min-h-screen">
      {/* Header banner mockup */}
      <div className="bg-[#005667] text-center py-2 px-4 text-[11px] text-[#d9c39a] font-medium tracking-wide">
        MOCKUP V2 — Scheda Prodotto CRO + SEO ottimizzata
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {/* Breadcrumb */}
        <nav className="text-[13px] text-[#999] mb-5">
          <span className="hover:text-[#005667] cursor-pointer">Home</span>
          <span className="mx-1.5">/</span>
          <span className="hover:text-[#005667] cursor-pointer">Vini Rossi</span>
          <span className="mx-1.5">/</span>
          <span className="text-[#666]">Brunello di Montalcino DOCG 2019 - Casanova di Neri</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
          {/* ═══ LEFT COLUMN ═══ */}
          <div className="space-y-4">
            {/* Gallery mockup */}
            <div className="relative bg-white border border-[#e8e4dc] rounded-2xl p-5 overflow-hidden" style={{ height: 'clamp(320px, 45vw, 460px)' }}>
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-48 bg-gradient-to-b from-[#5a1a1a] to-[#8b3a3a] rounded-t-lg mx-auto mb-1" />
                  <div className="w-28 h-6 bg-[#f5f0e8] border border-[#ddd] mx-auto rounded-sm flex items-center justify-center">
                    <span className="text-[8px] text-[#999]">BRUNELLO 2019</span>
                  </div>
                  <div className="w-20 h-20 bg-gradient-to-b from-[#8b3a3a] to-[#3a1a1a] mx-auto rounded-b-2xl" />
                </div>
              </div>

              {/* Pills top-left */}
              <div className="absolute top-4 left-4 flex flex-wrap gap-1.5 z-10">
                <span className="bg-[#d9c39a] text-[#1a1a1a] text-[14px] font-bold px-2.5 py-1 rounded-full">★ Sommelier</span>
                <span className="bg-white/95 border border-[#e0dbd4] text-[14px] font-semibold text-[#666] px-2.5 py-1 rounded-full">14.5%</span>
                <span className="bg-white/95 border border-[#e0dbd4] text-[14px] font-semibold text-[#666] px-2.5 py-1 rounded-full">DOCG</span>
              </div>

              {/* Novità badge */}
              <span className="absolute top-4 right-4 bg-[#00b341] text-white text-[11px] font-bold px-2.5 py-1 rounded-md tracking-wide uppercase z-10">
                Novità
              </span>
            </div>

            {/* Thumbnails */}
            <div className="flex gap-2 pb-1">
              {[1, 2, 3, 4].map((i) => (
                <button key={i} className={`relative w-[52px] h-[52px] shrink-0 rounded-lg overflow-hidden border-[1.5px] transition-colors ${i === 1 ? 'border-[#005667]' : 'border-[#e8e4dc]'}`}>
                  <div className="w-full h-full bg-[#f5f0e8] flex items-center justify-center">
                    <div className="w-3 h-8 bg-[#8b3a3a] rounded-t-sm" />
                  </div>
                </button>
              ))}
            </div>

            {/* Sommelier box */}
            <div className="bg-[#1a1a1a] border-[1.5px] border-[#d9c39a] rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-[#d9c39a] flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-[#1a1a1a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <div>
                  <p className="text-[11px] text-[#d9c39a] font-bold uppercase tracking-widest mb-1">★ Scelta del Sommelier</p>
                  <p className="text-[15px] text-[#ccc] leading-relaxed italic">&ldquo;Un Brunello che racconta Montalcino con eleganza rara. Tannini setosi, finale lunghissimo.&rdquo;</p>
                </div>
              </div>
            </div>

            {/* Abbinamenti */}
            <div>
              <p className="text-[14px] text-[#888] font-semibold uppercase tracking-wider mb-2">Abbinamenti</p>
              <div className="flex flex-wrap gap-2">
                {['Bistecca fiorentina', 'Formaggi stagionati', 'Cinghiale', 'Tartufo'].map((a) => (
                  <span key={a} className="inline-flex items-center gap-1.5 bg-[#f0f7f5] text-[#005667] border border-[#005667]/30 rounded-full px-3 py-1 text-[13px] font-medium">
                    {a}
                  </span>
                ))}
              </div>
            </div>

            {/* ✅ NOTE DI DEGUSTAZIONE — nella colonna sinistra sotto foto */}
            <div>
              <h3 className="text-[14px] text-[#888] font-semibold uppercase tracking-wider mb-3">Note di degustazione</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#f5e6c8] flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-3.5 h-3.5 text-[#b8973f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-[#b8973f] uppercase tracking-wider">Alla vista</p>
                    <p className="text-[13px] text-[#555] leading-relaxed">Rosso rubino intenso con riflessi granato. Limpido e di buona consistenza.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#ede4f5] flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-3.5 h-3.5 text-[#7b5ea7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-[#7b5ea7] uppercase tracking-wider">Al naso</p>
                    <p className="text-[13px] text-[#555] leading-relaxed">Note di ciliegia matura, tabacco, cuoio e spezie dolci. Sottofondo di vaniglia e cacao.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#e0f0f2] flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-3.5 h-3.5 text-[#005667]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-[#005667] uppercase tracking-wider">Al palato</p>
                    <p className="text-[13px] text-[#555] leading-relaxed">Pieno e avvolgente, tannini vellutati e ben integrati. Finale lungo e persistente con note di frutta secca.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ✅ PRODUZIONE — vinificazione + affinamento */}
            <div>
              <h3 className="text-[14px] text-[#888] font-semibold uppercase tracking-wider mb-3">Produzione</h3>
              <div className="space-y-2.5">
                <div>
                  <p className="text-[11px] font-bold text-[#888] uppercase tracking-wider mb-0.5">Vinificazione</p>
                  <p className="text-[13px] text-[#444] leading-relaxed">Macerazione di 25 giorni a temperatura controllata in vasche d&apos;acciaio inox. Fermentazione malolattica spontanea.</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-[#888] uppercase tracking-wider mb-0.5">Affinamento</p>
                  <p className="text-[13px] text-[#444] leading-relaxed">24 mesi in botti di rovere di Slavonia da 30 hl, seguiti da 12 mesi di affinamento in bottiglia.</p>
                </div>
              </div>
            </div>
          </div>

          {/* ═══ RIGHT COLUMN ═══ */}
          <div>
            {/* Produttore */}
            <span className="text-[15px] text-[#d9c39a] font-bold uppercase tracking-wide mb-1.5 block cursor-pointer hover:text-[#005667] transition-colors">
              CASANOVA DI NERI
            </span>

            {/* Title + badges */}
            <div className="flex items-start gap-2 mb-3 flex-wrap">
              <h1 className="text-[24px] font-bold text-[#1a1a1a] leading-[1.3]">Brunello di Montalcino DOCG 2019 - Casanova di Neri</h1>
              <span className="shrink-0 mt-1 bg-[#00b341] text-white text-[11px] font-bold px-2 py-0.5 rounded-md tracking-wide uppercase">Novità</span>
              <span className="shrink-0 mt-1 bg-[#005667] text-white text-[11px] font-bold px-2 py-0.5 rounded-md tracking-wide uppercase">Best seller</span>
            </div>

            {/* Stelline + recensioni */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[#d9c39a] text-[14px]">★★★★★</span>
              <span className="text-[13px] text-[#888]">4.7/5 · 23 recensioni</span>
            </div>

            {/* Price — sconto badge più morbido */}
            <div className="flex items-center flex-wrap gap-2 mb-2">
              {/* Prezzo originale barrato */}
              <span className="text-[14px] text-[#bbb] line-through">45,00€</span>
              {/* Badge sconto — arancione morbido, non rosso aggressivo */}
              <span className="bg-[#e8840c] text-white text-[13px] font-bold px-2 py-0.5 rounded">-20%</span>
              <span className="text-[30px] font-bold text-[#005667]">36,00€</span>
            </div>

            {/* POP points */}
            <div className="flex items-center gap-1.5 mb-4">
              <svg className="w-3.5 h-3.5 text-[#005667]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span className="text-[14px] text-[#888]">+36 Punti POP con questo acquisto</span>
            </div>

            {/* ✅ Countdown ordine — verde, non rosso */}
            {showCountdown ? (
              <div className="flex items-center gap-2 mb-3 bg-[#f0faf4] border border-[#00b341]/20 rounded-lg px-3 py-2">
                <svg className="w-4 h-4 text-[#00b341] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="text-[13px] text-[#1a1a1a]">Ordina entro le <strong>14:00</strong> per riceverlo domani — <strong className="text-[#00b341]">{countdown}</strong></span>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-3 bg-[#f8f6f1] rounded-lg px-3 py-2">
                <svg className="w-4 h-4 text-[#888] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="text-[13px] text-[#666]">Ordina oggi, spedizione il prossimo giorno lavorativo</span>
              </div>
            )}

            {/* ✅ Social proof vendite — tono caldo, non aggressivo */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[13px]">📦</span>
              <span className="text-[13px] text-[#666]">Vendute <strong className="text-[#1a1a1a]">24 bottiglie</strong> negli ultimi 2 giorni</span>
            </div>

            {/* ✅ Disponibilità con numero pezzi — colore sobrio */}
            <div className="flex items-center gap-2 mb-5 bg-[#fef9f0] border border-[#e8840c]/20 rounded-lg px-3 py-2">
              <span className="w-2 h-2 rounded-full bg-[#e8840c] animate-pulse shrink-0" />
              <span className="text-[14px] text-[#1a1a1a]">Disponibilità: <strong className="text-[#e8840c]">3 pezzi</strong> rimasti</span>
            </div>

            {/* Quantity + CTA */}
            <div className="space-y-2.5 mb-4">
              {/* Quantity selector */}
              <div className="flex items-center gap-2">
                <button className="w-10 h-10 border border-[#ddd] rounded-lg flex items-center justify-center text-[#666] hover:border-[#005667] transition-colors">−</button>
                <input className="w-14 h-10 text-center border border-[#ddd] rounded-lg text-[16px] font-bold" value="1" readOnly />
                <button className="w-10 h-10 border border-[#ddd] rounded-lg flex items-center justify-center text-[#666] hover:border-[#005667] transition-colors">+</button>
              </div>

              {/* Suggerimento quantità */}
              <p className="text-[13px] text-[#005667] flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Prendi 6 bottiglie — spedizione gratuita!
              </p>

              {/* CTA Primario */}
              <button className="w-full h-12 bg-[#005667] text-white font-semibold text-[15px] rounded-lg hover:bg-[#004555] transition-colors flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                Aggiungi al carrello
              </button>

              {/* CTA Secondario — outlined */}
              <button className="w-full h-11 bg-transparent border-2 border-[#005667] text-[#005667] font-semibold text-[14px] rounded-lg hover:bg-[#005667] hover:text-white transition-colors">
                Acquista subito — Consegna in 24-48h
              </button>
            </div>

            {/* ✅ Blocco garanzie 2x2 */}
            <div className="grid grid-cols-2 gap-2 mb-5">
              <div className="flex items-center gap-2 bg-[#f8f6f1] rounded-lg p-2.5">
                <svg className="w-4 h-4 text-[#005667] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                <span className="text-[12px] text-[#555] leading-tight">Pagamento sicuro</span>
              </div>
              <div className="flex items-center gap-2 bg-[#f8f6f1] rounded-lg p-2.5">
                <svg className="w-4 h-4 text-[#005667] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></svg>
                <span className="text-[12px] text-[#555] leading-tight">Consegna 24-48h</span>
              </div>
              <div className="flex items-center gap-2 bg-[#f8f6f1] rounded-lg p-2.5">
                <svg className="w-4 h-4 text-[#005667] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                <span className="text-[12px] text-[#555] leading-tight">Spedizione gratuita da 69€</span>
              </div>
              <div className="flex items-center gap-2 bg-[#f8f6f1] rounded-lg p-2.5">
                <svg className="w-4 h-4 text-[#005667] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                <span className="text-[12px] text-[#555] leading-tight">Reso gratuito 30gg</span>
              </div>
            </div>

            {/* Short description */}
            <div className="bg-[#faf8f5] rounded-lg p-4 border-l-4 border-[#d9c39a] mb-5">
              <p className="text-[14px] text-[#555] leading-relaxed">
                Un Brunello classico di straordinaria eleganza. Note di ciliegia matura, tabacco e spezie dolci si fondono in un palato pieno e avvolgente, con tannini vellutati e un finale persistente.
              </p>
            </div>

            {/* Specs table */}
            <div className="mb-5">
              <h3 className="text-[14px] text-[#888] font-semibold uppercase tracking-wider mb-2">Caratteristiche</h3>
              <div className="bg-white rounded-lg border border-[#eae6e0]">
                {[
                  ['Annata', '2019'],
                  ['Alcol', '14.5%'],
                  ['Denominazione', 'DOCG'],
                  ['Regione', 'Toscana'],
                  ['Uvaggio', 'Sangiovese Grosso 100%'],
                  ['Formato', '750ml'],
                  ['Certificazioni', 'Biologico'],
                ].map(([key, value], i) => (
                  <div key={key} className={`flex items-center justify-between py-2.5 px-4 ${i < 6 ? 'border-b border-[#f0f0f0]' : ''}`}>
                    <span className="text-[13px] text-[#888] uppercase tracking-wide">{key}</span>
                    <span className="text-[13px] text-[#1a1a1a] font-medium text-right">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ═══ FULL WIDTH SECTIONS ═══ */}

        {/* Descrizione */}
        <div className="mt-10 max-w-3xl">
          <h2 className="text-[18px] font-bold text-[#1a1a1a] mb-3">Descrizione</h2>
          <div className="text-[14px] text-[#555] leading-relaxed space-y-3">
            <p>Il Brunello di Montalcino DOCG 2019 di Casanova di Neri è il frutto di una vendemmia eccezionale. Le uve Sangiovese Grosso provengono da vigneti situati a 350 metri di altitudine, su terreni argilloso-calcarei.</p>
            <p>Dopo una macerazione di 25 giorni, il vino affina per 24 mesi in botti di rovere di Slavonia e altri 12 mesi in bottiglia prima della commercializzazione.</p>
          </div>
        </div>

        {/* Recensioni */}
        <div className="mt-10 max-w-3xl">
          <h2 className="text-[18px] font-bold text-[#1a1a1a] mb-4">Recensioni</h2>
          <div className="flex items-center gap-3 mb-5">
            <span className="text-[#d9c39a] text-lg">★★★★★</span>
            <span className="text-[15px] text-[#666]">4.7/5 · 23 recensioni</span>
          </div>
          <div className="space-y-3">
            {[
              { name: 'Marco R.', rating: 5, text: 'Eccezionale. Un Brunello che vale ogni centesimo. Perfetto con la bistecca fiorentina.', date: '15 Mar 2026' },
              { name: 'Laura S.', rating: 4, text: 'Ottimo vino, elegante e complesso. Avrebbe bisogno di qualche anno in più per raggiungere il massimo potenziale.', date: '2 Mar 2026' },
            ].map((r, i) => (
              <div key={i} className="bg-white rounded-xl p-4 border border-[#eae6e0]">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-[#005667] text-white flex items-center justify-center text-[13px] font-bold">{r.name[0]}</div>
                  <div>
                    <p className="text-[14px] font-semibold text-[#333]">{r.name}</p>
                    <p className="text-[11px] text-[#bbb]">{r.date}</p>
                  </div>
                  <span className="ml-auto text-[#d9c39a] text-[13px]">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                </div>
                <p className="text-[13px] text-[#555]">{r.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ✅ FAQ accordion */}
        <div className="mt-10 max-w-3xl mb-8">
          <h2 className="text-[18px] font-bold text-[#1a1a1a] mb-4">Domande frequenti</h2>
          <div className="bg-white rounded-xl border border-[#eae6e0] divide-y divide-[#f0f0f0]">
            {faqs.map((faq, i) => (
              <div key={i}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-[#faf8f5] transition-colors"
                >
                  <span className="text-[15px] font-medium text-[#1a1a1a] pr-4">{faq.q}</span>
                  <svg className={`w-4 h-4 text-[#999] shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 text-[14px] text-[#555] leading-relaxed">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ✅ Related products con "Stesso produttore" */}
        <div className="mt-12 mb-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[20px] font-bold text-[#1a1a1a]">Ti potrebbe piacere</h2>
            <div className="flex gap-2">
              <button className="w-8 h-8 border border-[#ddd] rounded-full flex items-center justify-center hover:border-[#005667]">
                <svg className="w-4 h-4 text-[#666]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button className="w-8 h-8 border border-[#ddd] rounded-full flex items-center justify-center hover:border-[#005667]">
                <svg className="w-4 h-4 text-[#666]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollSnapType: 'x mandatory' }}>
            {[
              { name: 'Rosso di Montalcino DOC 2021', producer: 'CASANOVA DI NERI', price: '22,00€', same: true },
              { name: 'Chianti Classico Riserva DOCG 2020', producer: 'FÈLSINA', price: '28,50€', same: false },
              { name: 'Brunello Riserva DOCG 2017', producer: 'CASANOVA DI NERI', price: '65,00€', same: true },
              { name: 'Vino Nobile Montepulciano 2020', producer: 'AVIGNONESI', price: '24,00€', same: false },
            ].map((p, i) => (
              <div key={i} className="w-[calc(50%-6px)] sm:w-[calc(25%-9px)] shrink-0" style={{ scrollSnapAlign: 'start' }}>
                {p.same && (
                  <span className="inline-block text-[11px] font-semibold text-[#005667] bg-[#f0f7f5] border border-[#005667]/20 rounded-full px-2 py-0.5 mb-1">
                    Stesso produttore
                  </span>
                )}
                {!p.same && <div className="h-[22px] mb-1" />}
                <div className="rounded-2xl overflow-hidden border border-[#eae6e0] bg-white">
                  <div className="aspect-[3/4] bg-white flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-8 h-20 bg-gradient-to-b from-[#5a1a1a] to-[#8b3a3a] rounded-t-sm mx-auto" />
                      <div className="w-10 h-2 bg-[#f5f0e8] border border-[#ddd] mx-auto" />
                      <div className="w-8 h-8 bg-gradient-to-b from-[#8b3a3a] to-[#3a1a1a] mx-auto rounded-b-lg" />
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.05em] mb-1 text-[#d9c39a]">{p.producer}</p>
                    <p className="text-[13px] font-semibold text-[#1a1a1a] leading-tight mb-2 line-clamp-2">{p.name}</p>
                    <p className="text-[16px] font-bold text-[#005667]">{p.price}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ✅ Sticky mobile bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#005667] px-4 py-2.5 flex items-center gap-3 z-50">
        <div className="flex items-center border-[1.5px] border-white/30 rounded-lg overflow-hidden">
          <button className="w-8 h-9 flex items-center justify-center text-white text-[14px]">−</button>
          <span className="w-6 text-center text-white font-semibold text-[14px]">1</span>
          <button className="w-8 h-9 flex items-center justify-center text-white text-[14px]">+</button>
        </div>
        <span className="text-white font-bold text-[16px] shrink-0">36,00€</span>
        <button className="flex-1 h-10 bg-white text-[#005667] font-bold text-[14px] rounded-lg">
          Acquista ora
        </button>
      </div>
      <div className="lg:hidden h-14" />
    </div>
  );
}
