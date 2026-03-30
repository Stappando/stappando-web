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
  const [title, setTitle] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState<{ id: number; name: string; price: string; image: string }[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<{ id: number; name: string; price: string; image: string }[]>([]);
  const [searchingProducts, setSearchingProducts] = useState(false);
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
        body: JSON.stringify({ audience, template, provincia, subject, title, bannerUrl, body, products: selectedProducts.map(p => p.id) }),
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
  }, [audience, template, provincia, subject, title, bannerUrl, body, selectedProducts]);

  // Search products by name
  const searchProducts = useCallback(async (q: string) => {
    if (q.length < 2) { setProductResults([]); return; }
    setSearchingProducts(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&per_page=6`);
      if (res.ok) {
        const data = await res.json();
        setProductResults((data.products || []).map((p: { id: number; name: string; price: string; image: string | null }) => ({
          id: p.id, name: p.name, price: p.price, image: p.image || '',
        })));
      }
    } catch { /* */ }
    finally { setSearchingProducts(false); }
  }, []);

  const addProduct = useCallback((p: { id: number; name: string; price: string; image: string }) => {
    if (!selectedProducts.find(s => s.id === p.id)) {
      setSelectedProducts(prev => [...prev, p]);
    }
    setProductSearch('');
    setProductResults([]);
  }, [selectedProducts]);

  const removeProduct = useCallback((id: number) => {
    setSelectedProducts(prev => prev.filter(p => p.id !== id));
  }, []);

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

        {/* Title */}
        <div>
          <label className={labelClass}>Titolo nella mail (opzionale)</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="es. Le novità di primavera" className={inputClass} />
        </div>

        {/* Banner */}
        <div>
          <label className={labelClass}>Banner immagine URL (opzionale)</label>
          <input type="text" value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)} placeholder="https://stappando.it/wp-content/uploads/..." className={inputClass} />
          {bannerUrl && (
            <div className="mt-2 rounded-lg overflow-hidden border border-gray-200">
              <img src={bannerUrl} alt="Banner preview" className="w-full h-auto max-h-40 object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </div>
          )}
        </div>

        {/* Products search */}
        <div>
          <label className={labelClass}>Prodotti in evidenza (cerca per nome)</label>
          <div className="relative">
            <input
              type="text"
              value={productSearch}
              onChange={(e) => { setProductSearch(e.target.value); searchProducts(e.target.value); }}
              placeholder="Cerca un vino..."
              className={inputClass}
            />
            {searchingProducts && <div className="absolute right-3 top-3"><div className="w-4 h-4 border-2 border-[#005667]/20 border-t-[#005667] rounded-full animate-spin" /></div>}
            {productResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {productResults.map(p => (
                  <button key={p.id} onClick={() => addProduct(p)} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 text-left">
                    {p.image && <img src={p.image} alt="" className="w-10 h-10 rounded object-cover shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 truncate">{p.name}</p>
                      <p className="text-xs text-[#005667] font-semibold">{p.price} €</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Selected products */}
          {selectedProducts.length > 0 && (
            <div className="mt-2 space-y-1.5">
              {selectedProducts.map(p => (
                <div key={p.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                  {p.image && <img src={p.image} alt="" className="w-8 h-8 rounded object-cover shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 truncate">{p.name}</p>
                    <p className="text-[10px] text-[#005667] font-semibold">{p.price} €</p>
                  </div>
                  <button onClick={() => removeProduct(p.id)} className="text-gray-400 hover:text-red-500 text-xs">✕</button>
                </div>
              ))}
            </div>
          )}
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
            {/* Header logo + stars */}
            <div className="py-6 text-center border-b border-gray-100">
              <img src="https://stappando.it/wp-content/uploads/2022/11/logo-stappando-500W.png" alt="Stappando" className="inline-block h-8" />
              <p className="text-[11px] text-gray-400 mt-2">
                <span className="text-[#d9c39a] tracking-wider">★★★★★</span>
                <span className="text-[#005667] font-semibold ml-1">4.6/5</span>
                <span className="text-gray-400 ml-0.5">· 1000+ recensioni</span>
              </p>
            </div>
            {/* Banner */}
            {bannerUrl && (
              <div><img src={bannerUrl} alt="Banner" className="w-full h-auto" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /></div>
            )}
            <div className="px-6 py-5 text-sm text-gray-700 leading-relaxed">
              {/* Title */}
              {title && <h2 className="text-xl font-bold text-[#005667] mb-4">{title}</h2>}
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
              {/* Products */}
              {selectedProducts.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">Prodotti in evidenza</p>
                  <div className="space-y-2">
                    {selectedProducts.map(p => (
                      <div key={p.id} className="flex items-center gap-3 bg-gray-50 rounded-lg p-2">
                        {p.image && <img src={p.image} alt="" className="w-12 h-12 rounded object-cover shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-800 font-medium truncate">{p.name}</p>
                          <p className="text-sm text-[#005667] font-bold">{p.price} €</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {/* Footer */}
            <div className="bg-[#1a1a1a] px-6 py-4 text-center">
              <p className="text-[10px] text-gray-500">Instagram | Facebook | <span className="text-[#d9c39a] font-semibold">stappando.it</span></p>
              <p className="text-[9px] text-gray-600 mt-1">© 2026 Stappando Srl — P.IVA 15855161003</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
