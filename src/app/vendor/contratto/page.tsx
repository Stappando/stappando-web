'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuthStore, useStoreHydrated } from '@/store/auth';
import Link from 'next/link';
import Image from 'next/image';

export default function VendorContractPage() {
  const user = useAuthStore(s => s.user);
  const token = useAuthStore(s => s.token);
  const hydrated = useStoreHydrated();
  const [form, setForm] = useState({
    rappresentante: '',
    piva: '',
    indirizzo: '',
    telefono: '',
    firma: '',
  });
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [useCanvas, setUseCanvas] = useState(false);



  // Canvas drawing
  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsDrawing(true);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDraw = () => setIsDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accepted) { setError('Devi accettare i termini'); return; }
    if (!useCanvas && !form.firma.trim()) { setError('Inserisci la tua firma'); return; }
    if (useCanvas && !hasDrawn) { setError('Disegna la tua firma'); return; }

    setSubmitting(true);
    setError('');

    try {
      const firmaData = useCanvas ? canvasRef.current?.toDataURL('image/png') : '';

      const res = await fetch('/api/vendor/contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId: user?.id,
          cantina: user?.firstName || '',
          rappresentante: form.rappresentante,
          piva: form.piva,
          indirizzo: form.indirizzo,
          email: user?.email,
          telefono: form.telefono,
          firma: form.firma,
          firmaData,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Errore');
      }

      setDone(true);
      // Update store — no more WC calls needed
      useAuthStore.getState().setVendorStatus('pending_approval');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore imprevisto');
    } finally {
      setSubmitting(false);
    }
  };

  if (!hydrated) {
    return <div className="min-h-[60vh] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#005667] border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!token || !user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <h1 className="text-[22px] font-bold text-[#1a1a1a] mb-3">Accesso riservato</h1>
        <p className="text-[14px] text-[#888] mb-6">Devi effettuare il login per accedere a questa pagina.</p>
        <Link href="/" className="inline-block bg-[#005667] text-white rounded-lg px-6 py-3 text-[14px] font-semibold hover:bg-[#004555]">Torna alla homepage</Link>
      </div>
    );
  }

  // Success state
  if (done) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-[#e8f4f1] flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-[#005667]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          </div>
          <h1 className="text-[24px] font-bold text-[#1a1a1a] mb-3">Contratto firmato!</h1>
          <p className="text-[15px] text-[#666] mb-2">Una copia è stata inviata al tuo indirizzo email.</p>
          <Link href="/vendor/dashboard" className="inline-block mt-4 bg-[#005667] text-white rounded-xl px-8 py-3 text-[15px] font-semibold hover:bg-[#004555] transition-colors">Vai alla dashboard →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="text-center mb-8">
        <Image src="/logo.png" alt="Stappando" width={140} height={35} className="h-8 w-auto mx-auto mb-6" />
        <h1 className="text-[26px] font-bold text-[#1a1a1a] mb-2">Contratto di Adesione</h1>
        <p className="text-[14px] text-[#888]">Leggi e firma il contratto per attivare il tuo negozio su Stappando</p>
      </div>

      {/* Contract text */}
      <div className="bg-white border border-[#e8e4dc] rounded-2xl p-6 sm:p-8 mb-8 max-h-[500px] overflow-y-auto">
        <div className="prose prose-sm max-w-none text-[#444]" style={{ fontSize: '13px', lineHeight: '1.7' }}>
          <h2 className="text-[16px] font-bold text-[#1a1a1a] mb-4">CONTRATTO DI COLLABORAZIONE STAPPANDO — VENDOR</h2>

          <p><strong>Tra:</strong> Stappando s.r.l., Piazza Nicola Maria Nicolai 11 — Roma, P.IVA 15855661003<br/>
          <strong>E:</strong> Il Vendor (dati come specificati nel modulo sottostante)</p>

          <h3 className="text-[14px] font-bold text-[#005667] mt-6 mb-2">1. OGGETTO DEL CONTRATTO</h3>
          <p>Stappando concede ai Vendor l&apos;accesso alla propria piattaforma di vendita online su www.stappando.it per promuovere e vendere prodotti vinicoli alle condizioni specificate. I Vendor possono vendere esclusivamente prodotti del settore vinicolo nel rispetto delle normative vigenti sulla vendita di alcolici.</p>

          <h3 className="text-[14px] font-bold text-[#005667] mt-6 mb-2">2. REGISTRAZIONE E ACCETTAZIONE</h3>
          <p>La registrazione richiede il completamento del processo di iscrizione online. Stappando si riserva il diritto di accettare o rifiutare le candidature a propria discrezione. All&apos;approvazione, i Vendor accedono alla propria area riservata per la gestione dei prodotti e degli ordini.</p>

          <h3 className="text-[14px] font-bold text-[#005667] mt-6 mb-2">3. UTILIZZO DELLA PIATTAFORMA</h3>
          <p>I Vendor possono modificare o nascondere prodotti, gestire sconti e promozioni, monitorare ordini e gestire i dettagli dei prodotti attraverso la dashboard. I prodotti diventano acquistabili solo quando pubblicati.</p>

          <h3 className="text-[14px] font-bold text-[#005667] mt-6 mb-2">4. COMMISSIONI E TARIFFE</h3>
          <p>Stappando applica una commissione del <strong>15%</strong> sulle transazioni della piattaforma oltre alle commissioni del servizio di pagamento. I costi di spedizione di €6,50 (gratuiti per ordini superiori a €69) vengono addebitati ai clienti e accreditati ai Vendor al netto delle commissioni. Il pagamento avviene entro il 10 del mese successivo.</p>
          <div className="bg-[#f8f6f1] rounded-lg p-4 mt-3 mb-3">
            <p className="text-[12px] font-bold text-[#005667] mb-2">Allegato A — Condizioni economiche:</p>
            <ul className="text-[12px] text-[#666] space-y-1 list-disc ml-4">
              <li>Fee annuale visibilità vendor: €0</li>
              <li>Commissione vendite stappando.it: 15%</li>
              <li>Commissione vendite vivino.com (opzionale): 35%</li>
            </ul>
          </div>

          <h3 className="text-[14px] font-bold text-[#005667] mt-6 mb-2">5. RESPONSABILITÀ DEL VENDOR</h3>
          <p>I Vendor assumono piena responsabilità per tutti i contenuti pubblicati (immagini, descrizioni, testi). Garantiscono che i materiali non violino diritti di terzi e manlevano Stappando da qualsiasi responsabilità legale. La vendita si perfeziona tra cliente e Vendor, rendendo il Vendor responsabile dell&apos;emissione di fatture o ricevute.</p>

          <h3 className="text-[14px] font-bold text-[#005667] mt-6 mb-2">6. GESTIONE SPEDIZIONI</h3>
          <p>Stappando fornisce tariffe corriere negoziate con ritiro automatico. Ogni ordine genera un&apos;email con riepilogo ed etichetta di spedizione. La spedizione gratuita si applica agli ordini superiori a €69.</p>

          <h3 className="text-[14px] font-bold text-[#005667] mt-6 mb-2">7. OBBLIGHI DEL VENDOR</h3>
          <p>I Vendor devono fornire descrizioni accurate dei prodotti rispettando le normative sull&apos;etichettatura dei vini, garantire disponibilità e qualità dei prodotti, evadere gli ordini tempestivamente e fornire bottiglie aggiornate per la fotografia dei nuovi prodotti.</p>

          <h3 className="text-[14px] font-bold text-[#005667] mt-6 mb-2">8. DISCREPANZE PRODOTTO</h3>
          <p>In caso di difetti riconducibili al Vendor (annate errate, denominazioni non corrispondenti, formati diversi), Stappando gestisce la negoziazione con il cliente autonomamente e può concedere uno sconto fino al 25%. Dopo tre ordini difettosi in sei mesi, Stappando si riserva il diritto di sospendere la collaborazione.</p>

          <h3 className="text-[14px] font-bold text-[#005667] mt-6 mb-2">9. OBBLIGHI DI STAPPANDO</h3>
          <p>Stappando fornisce accesso alla piattaforma, strumenti di gestione, etichette di spedizione, gestione automatica delle spedizioni, elaborazione pagamenti, supporto tecnico e pagamento puntuale entro il 10 del mese successivo.</p>

          <h3 className="text-[14px] font-bold text-[#005667] mt-6 mb-2">10. DURATA E RISOLUZIONE</h3>
          <p>Il contratto ha durata annuale dalla data di accettazione, con rinnovo tacito anno per anno salvo disdetta con preavviso di 30 giorni via PEC a stappandosrls@pec.it. Stappando si riserva il diritto di risolvere immediatamente il contratto in caso di violazioni.</p>

          <h3 className="text-[14px] font-bold text-[#005667] mt-6 mb-2">11. LEGGE APPLICABILE E FORO COMPETENTE</h3>
          <p>Il contratto è regolato dalla legge italiana. Il Foro di Roma ha competenza esclusiva per le controversie.</p>
        </div>
      </div>

      {/* Signature form */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white border border-[#e8e4dc] rounded-2xl p-6 sm:p-8 mb-6">
          <h2 className="text-[18px] font-bold text-[#1a1a1a] mb-6">Dati del firmatario</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-[12px] font-semibold text-[#888] uppercase tracking-wider mb-1.5">Nome e Cognome del rappresentante *</label>
              <input type="text" required value={form.rappresentante} onChange={e => setForm({ ...form, rappresentante: e.target.value })}
                className="w-full h-12 px-4 rounded-xl border border-[#e8e4dc] text-[14px] focus:outline-none focus:border-[#005667] focus:ring-1 focus:ring-[#005667]" />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[#888] uppercase tracking-wider mb-1.5">P.IVA *</label>
              <input type="text" required value={form.piva} onChange={e => setForm({ ...form, piva: e.target.value })}
                className="w-full h-12 px-4 rounded-xl border border-[#e8e4dc] text-[14px] focus:outline-none focus:border-[#005667] focus:ring-1 focus:ring-[#005667]" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[12px] font-semibold text-[#888] uppercase tracking-wider mb-1.5">Indirizzo sede legale *</label>
              <input type="text" required value={form.indirizzo} onChange={e => setForm({ ...form, indirizzo: e.target.value })}
                className="w-full h-12 px-4 rounded-xl border border-[#e8e4dc] text-[14px] focus:outline-none focus:border-[#005667] focus:ring-1 focus:ring-[#005667]" />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[#888] uppercase tracking-wider mb-1.5">Telefono *</label>
              <input type="tel" required value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })}
                className="w-full h-12 px-4 rounded-xl border border-[#e8e4dc] text-[14px] focus:outline-none focus:border-[#005667] focus:ring-1 focus:ring-[#005667]" />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[#888] uppercase tracking-wider mb-1.5">Email</label>
              <input type="email" disabled value={user?.email || ''} className="w-full h-12 px-4 rounded-xl border border-[#e8e4dc] text-[14px] bg-[#f8f6f1] text-[#888]" />
            </div>
          </div>

          {/* Signature */}
          <h3 className="text-[16px] font-bold text-[#1a1a1a] mb-4">Firma</h3>

          <div className="flex gap-3 mb-4">
            <button type="button" onClick={() => setUseCanvas(false)} className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-colors ${!useCanvas ? 'bg-[#005667] text-white' : 'bg-[#f0f0f0] text-[#888]'}`}>
              Digita firma
            </button>
            <button type="button" onClick={() => setUseCanvas(true)} className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-colors ${useCanvas ? 'bg-[#005667] text-white' : 'bg-[#f0f0f0] text-[#888]'}`}>
              Disegna firma
            </button>
          </div>

          {!useCanvas ? (
            <div>
              <input type="text" value={form.firma} onChange={e => setForm({ ...form, firma: e.target.value })}
                placeholder="Scrivi il tuo nome e cognome come firma"
                className="w-full h-14 px-4 rounded-xl border border-[#e8e4dc] text-[18px] font-serif italic focus:outline-none focus:border-[#005667] focus:ring-1 focus:ring-[#005667]" />
              {form.firma && (
                <div className="mt-3 p-4 border border-dashed border-[#d9c39a] rounded-xl bg-[#faf8f3]">
                  <p className="text-[10px] text-[#888] uppercase tracking-wider mb-1">Anteprima firma:</p>
                  <p className="text-[24px] font-serif italic text-[#1a1a1a]">{form.firma}</p>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="border border-[#e8e4dc] rounded-xl overflow-hidden bg-white relative">
                <canvas
                  ref={canvasRef}
                  width={560}
                  height={120}
                  className="w-full cursor-crosshair touch-none"
                  onMouseDown={startDraw}
                  onMouseMove={draw}
                  onMouseUp={stopDraw}
                  onMouseLeave={stopDraw}
                  onTouchStart={startDraw}
                  onTouchMove={draw}
                  onTouchEnd={stopDraw}
                />
                <button type="button" onClick={clearCanvas} className="absolute top-2 right-2 text-[11px] text-[#888] hover:text-[#005667] bg-white/80 rounded px-2 py-1">
                  Cancella
                </button>
              </div>
              <p className="text-[11px] text-[#888] mt-2">Usa il mouse o il dito per firmare</p>
            </div>
          )}
        </div>

        {/* Accept + Submit */}
        <div className="bg-white border border-[#e8e4dc] rounded-2xl p-6 sm:p-8">
          <label className="flex items-start gap-3 cursor-pointer select-none mb-6">
            <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)}
              className="mt-0.5 w-5 h-5 rounded border-[#e8e4dc] text-[#005667] focus:ring-[#005667] shrink-0" />
            <span className="text-[13px] text-[#444] leading-relaxed">
              Dichiaro di aver letto e compreso il Contratto di Adesione ai Servizi di Stappando.it e di accettarne integralmente i termini e le condizioni. Confermo che le informazioni fornite sono veritiere e complete.
            </span>
          </label>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-[13px] text-red-700">{error}</div>
          )}

          <button
            type="submit"
            disabled={submitting || !accepted}
            className="w-full py-4 bg-[#005667] text-white rounded-xl text-[16px] font-bold hover:bg-[#004555] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                Invio in corso...
              </span>
            ) : (
              'Firma e invia il contratto'
            )}
          </button>

          <p className="text-[11px] text-[#888] text-center mt-4">
            Il contratto firmato verrà inviato alla tua email e al team Stappando.
          </p>
        </div>
      </form>
    </div>
  );
}
