'use client';

import { useState, useCallback } from 'react';

const PRIMARY = '#005667';

type Audience = 'clienti' | 'vendor' | 'clienti-provincia';
type TemplateType = 'libera' | 'upsell-vineis' | 'riordina';

const PROVINCES = [
  'AG','AL','AN','AO','AP','AQ','AR','AT','AV','BA','BG','BI','BL','BN','BO','BR','BS','BT','BZ',
  'CA','CB','CE','CH','CL','CN','CO','CR','CS','CT','CZ','EN','FC','FE','FG','FI','FM','FR','GE',
  'GO','GR','IM','IS','KR','LC','LE','LI','LO','LT','LU','MB','MC','ME','MI','MN','MO','MS','MT',
  'NA','NO','NU','OG','OR','OT','PA','PC','PD','PE','PG','PI','PN','PO','PR','PT','PU','PV','PZ',
  'RA','RC','RE','RG','RI','RM','RN','RO','SA','SI','SO','SP','SR','SS','SU','SV','TA','TE','TN',
  'TO','TP','TR','TS','TV','UD','VA','VB','VC','VE','VI','VR','VT','VV',
];

export default function NewsletterPage() {
  const [audience, setAudience] = useState<Audience>('clienti');
  const [template, setTemplate] = useState<TemplateType>('libera');
  const [provincia, setProvincia] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [products, setProducts] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [preview, setPreview] = useState(false);

  const handleSend = useCallback(async () => {
    if (!subject.trim()) { setResult({ type: 'error', msg: 'Oggetto obbligatorio' }); return; }
    if (template === 'libera' && !body.trim()) { setResult({ type: 'error', msg: 'Testo obbligatorio' }); return; }
    if (audience === 'clienti-provincia' && !provincia) { setResult({ type: 'error', msg: 'Seleziona una provincia' }); return; }

    setSending(true);
    setResult(null);
    try {
      const res = await fetch('/api/admin/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audience, template, provincia, subject, body, products: products.split(',').map(s => s.trim()).filter(Boolean) }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ type: 'success', msg: `✓ Mail inviata a ${data.count || 0} destinatari` });
      } else {
        setResult({ type: 'error', msg: data.error || 'Errore invio' });
      }
    } catch (e) {
      setResult({ type: 'error', msg: 'Errore di rete' });
    } finally {
      setSending(false);
    }
  }, [audience, template, provincia, subject, body, products]);

  const inputClass = 'w-full h-[44px] px-3 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#005667] focus:border-transparent';
  const labelClass = 'block text-xs font-semibold text-gray-600 mb-1';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 shadow-sm" style={{ backgroundColor: PRIMARY }}>
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-white font-bold text-base">📬 Newsletter & Campagne</h1>
          <span className="text-xs text-white/60">Stappando</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* Result */}
        {result && (
          <div className={`p-3 rounded-lg text-sm font-medium ${result.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {result.msg}
          </div>
        )}

        {/* Audience */}
        <div>
          <label className={labelClass}>Destinatari</label>
          <div className="flex gap-2 flex-wrap">
            {[
              { id: 'clienti' as Audience, label: '👥 Tutti i clienti' },
              { id: 'vendor' as Audience, label: '🏪 Vendor / Cantine' },
              { id: 'clienti-provincia' as Audience, label: '📍 Clienti per provincia' },
            ].map(a => (
              <button
                key={a.id}
                onClick={() => setAudience(a.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${audience === a.id ? 'bg-[#005667] text-white' : 'bg-white border border-gray-200 text-gray-700 hover:border-[#005667]'}`}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* Provincia filter */}
        {audience === 'clienti-provincia' && (
          <div>
            <label className={labelClass}>Provincia</label>
            <select value={provincia} onChange={(e) => setProvincia(e.target.value)} className={inputClass}>
              <option value="">-- Seleziona provincia --</option>
              {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        )}

        {/* Template */}
        <div>
          <label className={labelClass}>Tipo campagna</label>
          <div className="flex gap-2 flex-wrap">
            {[
              { id: 'libera' as TemplateType, label: '✏️ Testo libero' },
              { id: 'upsell-vineis' as TemplateType, label: '🌿 Up-sell Vineis', disabled: audience === 'clienti' || audience === 'clienti-provincia' },
              { id: 'riordina' as TemplateType, label: '🔄 Riordina', disabled: audience === 'vendor' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => !t.disabled && setTemplate(t.id)}
                disabled={t.disabled}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${template === t.id ? 'bg-[#005667] text-white' : t.disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-200 text-gray-700 hover:border-[#005667]'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Subject */}
        <div>
          <label className={labelClass}>Oggetto email *</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={template === 'upsell-vineis' ? 'Porta i tuoi clienti in cantina con Vineis' : template === 'riordina' ? 'Hai già provato i nostri nuovi vini?' : 'Oggetto della mail...'}
            className={inputClass}
          />
        </div>

        {/* Body */}
        {template === 'libera' && (
          <div>
            <label className={labelClass}>Testo della mail *</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              placeholder="Scrivi il contenuto della mail. Puoi usare {nome} per il nome del destinatario."
              className="w-full px-3 py-3 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#005667] focus:border-transparent resize-y"
            />
          </div>
        )}

        {/* Pre-built messages */}
        {template === 'upsell-vineis' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800 font-medium mb-1">Messaggio pre-configurato</p>
            <p className="text-xs text-green-700 leading-relaxed">
              Invita i vendor a registrarsi su Vineis.eu per offrire esperienze in cantina. Iscrizione gratuita, commissione 15%, gestione prenotazioni inclusa.
            </p>
          </div>
        )}
        {template === 'riordina' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 font-medium mb-1">Messaggio pre-configurato</p>
            <p className="text-xs text-blue-700 leading-relaxed">
              Invita i clienti a tornare su Stappando. Evidenzia la facilità di utilizzo, la vastità del catalogo e le spedizioni rapide 24-48h.
            </p>
          </div>
        )}

        {/* Products to feature */}
        <div>
          <label className={labelClass}>Prodotti in evidenza (ID separati da virgola, opzionale)</label>
          <input
            type="text"
            value={products}
            onChange={(e) => setProducts(e.target.value)}
            placeholder="es. 69890, 69817, 12345"
            className={inputClass}
          />
          <p className="text-[10px] text-gray-400 mt-1">I prodotti verranno mostrati con immagine, nome e prezzo nella mail</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => setPreview(!preview)}
            className="flex-1 h-[48px] rounded-lg border-2 border-[#005667] text-[#005667] font-semibold text-sm hover:bg-[#005667]/5 transition-colors"
          >
            {preview ? 'Nascondi anteprima' : '👁 Anteprima'}
          </button>
          <button
            onClick={handleSend}
            disabled={sending}
            className="flex-1 h-[48px] rounded-lg text-white font-semibold text-sm disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ backgroundColor: PRIMARY }}
          >
            {sending ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                Invio in corso...
              </>
            ) : (
              `🚀 Invia a ${audience === 'vendor' ? 'vendor' : audience === 'clienti-provincia' ? `clienti ${provincia || '...'}` : 'tutti i clienti'}`
            )}
          </button>
        </div>

        {/* Preview */}
        {preview && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-[#005667] px-6 py-4">
              <p className="text-white font-bold">Stappando</p>
              <p className="text-white/70 text-xs mt-0.5">{subject || 'Oggetto...'}</p>
            </div>
            <div className="px-6 py-5 text-sm text-gray-700 leading-relaxed">
              <p className="mb-3">Gentile {'{'} nome {'}'},</p>
              {template === 'libera' && <p className="whitespace-pre-wrap">{body || 'Il testo della tua mail apparirà qui...'}</p>}
              {template === 'upsell-vineis' && (
                <div>
                  <p className="mb-3">Ti scrivo per presentarti <strong>Vineis.eu</strong>, il nostro portale dedicato alle esperienze in cantina.</p>
                  <p className="mb-3">Puoi offrire visite, degustazioni e tour direttamente ai nostri clienti. <strong>Iscrizione gratuita</strong>, commissione del 15%.</p>
                  <p className="mb-3">Gestiamo noi prenotazioni e parte tecnica. Tu accogli i clienti che hanno prenotato.</p>
                  <p>Registrati su <strong>vineis.eu</strong> → &quot;Ospita con noi&quot;</p>
                </div>
              )}
              {template === 'riordina' && (
                <div>
                  <p className="mb-3">Sono arrivati nuovi vini su Stappando! Oltre 1000 etichette selezionate dal nostro sommelier.</p>
                  <p className="mb-3">Spedizione rapida 24-48h, pagamento sicuro e reso gratuito.</p>
                  <p>Scopri le novità → <strong>shop.stappando.it</strong></p>
                </div>
              )}
              {products && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 mb-2">PRODOTTI IN EVIDENZA</p>
                  <p className="text-xs text-gray-400">ID: {products}</p>
                </div>
              )}
            </div>
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-100">
              <p className="text-[10px] text-gray-400 text-center">Stappando Srl — info@stappando.it</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
