'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';

const REGIONI = [
  '', 'Abruzzo', 'Basilicata', 'Calabria', 'Campania', 'Emilia-Romagna',
  'Friuli Venezia Giulia', 'Lazio', 'Liguria', 'Lombardia', 'Marche',
  'Molise', 'Piemonte', 'Puglia', 'Sardegna', 'Sicilia', 'Toscana',
  'Trentino-Alto Adige', 'Umbria', "Valle d'Aosta", 'Veneto',
];

interface ShopData {
  logo: string;
  banner: string;
  descrizione: string;
  regione: string;
  indirizzo: string;
}

export default function VendorNegozioPage() {
  const { user } = useAuthStore();
  const [shop, setShop] = useState<ShopData>({ logo: '', banner: '', descrizione: '', regione: '', indirizzo: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<'logo' | 'banner' | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => { setHydrated(true); }, []);

  useEffect(() => {
    if (!hydrated || !user?.id) return;
    fetch(`/api/vendor/shop?vendorId=${user.id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setShop(prev => ({ ...prev, ...data })); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [hydrated, user?.id]);

  const handleUpload = async (field: 'logo' | 'banner', file: File) => {
    if (!user?.id) return;
    setUploading(field);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/vendor/media', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        setShop(prev => ({ ...prev, [field]: data.src }));
      }
    } catch { /* ignore */ }
    setUploading(null);
  };

  const [saveAlert, setSaveAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    setSaveAlert(null);
    try {
      const res = await fetch('/api/vendor/shop', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId: user.id, ...shop }),
      });
      if (res.ok) {
        setSaveAlert({ type: 'success', message: 'Negozio salvato!' });
      } else {
        const err = await res.json().catch(() => ({}));
        console.error('Shop save error:', res.status, err);
        setSaveAlert({ type: 'error', message: `Errore nel salvataggio (${res.status})` });
      }
    } catch {
      setSaveAlert({ type: 'error', message: 'Errore di rete. Riprova.' });
    }
    setSaving(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setSaveAlert(null), 6000);
  };

  if (!hydrated) return null;

  const filledCount = [shop.logo, shop.banner, shop.descrizione, shop.regione, shop.indirizzo].filter(Boolean).length;
  const completionPercent = Math.round((filledCount / 5) * 100);

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-[#1a1a1a]">Il tuo negozio</h1>
            <p className="text-[13px] text-[#888] mt-0.5">Personalizza come appare la tua cantina su Stappando</p>
          </div>
          <div className="text-right hidden sm:block">
            <span className={`text-[22px] font-bold ${completionPercent === 100 ? 'text-[#065f46]' : 'text-[#005667]'}`}>{completionPercent}%</span>
            <p className="text-[11px] text-[#888]">{filledCount}/3 completati</p>
          </div>
        </div>
        <div className="h-2 bg-[#e8e4dc] rounded-full overflow-hidden mt-3">
          <div className={`h-full rounded-full transition-all duration-500 ${completionPercent === 100 ? 'bg-[#065f46]' : 'bg-[#005667]'}`} style={{ width: `${completionPercent}%` }} />
        </div>
      </div>

      {/* Alert */}
      {saveAlert && (
        <div className={`rounded-xl p-4 mb-6 border ${
          saveAlert.type === 'success'
            ? 'bg-[#065f46] border-[#065f46] text-white'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <p className="text-[14px] font-semibold">{saveAlert.message}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#005667] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6 max-w-2xl">

          {/* Banner */}
          <div className="bg-white border border-[#e8e4dc] rounded-xl p-6">
            <p className="text-[11px] font-bold text-[#005667] uppercase tracking-wider mb-4">Banner cantina</p>
            <p className="text-[12px] text-[#888] mb-3">Immagine di copertina — dimensione consigliata 1200×400px</p>

            <div className="relative w-full aspect-[3/1] bg-[#f8f6f1] rounded-xl overflow-hidden border-2 border-dashed border-[#e8e4dc] group">
              {shop.banner ? (
                <>
                  <img src={shop.banner} alt="Banner" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <label className="cursor-pointer bg-white text-[#005667] rounded-lg px-4 py-2 text-[13px] font-semibold">
                      Cambia banner
                      <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleUpload('banner', e.target.files[0])} />
                    </label>
                  </div>
                </>
              ) : (
                <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-[#f0ece4] transition-colors">
                  {uploading === 'banner' ? (
                    <div className="w-6 h-6 border-2 border-[#005667] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <svg className="w-8 h-8 text-[#ccc] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H3.75A2.25 2.25 0 001.5 6v12.75A2.25 2.25 0 003.75 21z" />
                      </svg>
                      <span className="text-[13px] text-[#888]">Carica banner</span>
                      <span className="text-[11px] text-[#aaa] mt-0.5">JPG o PNG, max 5MB</span>
                    </>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleUpload('banner', e.target.files[0])} />
                </label>
              )}
            </div>
          </div>

          {/* Logo */}
          <div className="bg-white border border-[#e8e4dc] rounded-xl p-6">
            <p className="text-[11px] font-bold text-[#005667] uppercase tracking-wider mb-4">Logo cantina</p>
            <p className="text-[12px] text-[#888] mb-3">Logo quadrato — dimensione consigliata 400×400px</p>

            <div className="flex items-start gap-5">
              <div className="relative w-28 h-28 bg-[#f8f6f1] rounded-xl overflow-hidden border-2 border-dashed border-[#e8e4dc] group shrink-0">
                {shop.logo ? (
                  <>
                    <img src={shop.logo} alt="Logo" className="w-full h-full object-contain p-2" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <label className="cursor-pointer text-white text-[11px] font-semibold">
                        Cambia
                        <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleUpload('logo', e.target.files[0])} />
                      </label>
                    </div>
                  </>
                ) : (
                  <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-[#f0ece4] transition-colors">
                    {uploading === 'logo' ? (
                      <div className="w-5 h-5 border-2 border-[#005667] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <svg className="w-6 h-6 text-[#ccc] mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        <span className="text-[10px] text-[#888]">Logo</span>
                      </>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleUpload('logo', e.target.files[0])} />
                  </label>
                )}
              </div>
              <div className="text-[12px] text-[#888] leading-relaxed">
                <p>Il logo appare nella pagina della tua cantina e accanto ai tuoi prodotti nel catalogo.</p>
                <p className="mt-1">Formati accettati: JPG, PNG, WebP. Max 5MB.</p>
              </div>
            </div>
          </div>

          {/* Regione + Indirizzo */}
          <div className="bg-white border border-[#e8e4dc] rounded-xl p-6">
            <p className="text-[11px] font-bold text-[#005667] uppercase tracking-wider mb-4">Dove ti trovi</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-semibold text-[#888] uppercase tracking-wider mb-1.5">Regione</label>
                <select
                  value={shop.regione}
                  onChange={e => setShop({ ...shop, regione: e.target.value })}
                  className="h-11 px-4 text-[14px] border border-[#e5e5e5] rounded-lg focus:outline-none focus:border-[#005667] focus:ring-1 focus:ring-[#005667]/20 w-full bg-white"
                >
                  <option value="">— Seleziona regione —</option>
                  {REGIONI.filter(Boolean).map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#888] uppercase tracking-wider mb-1.5">Indirizzo cantina</label>
                <input
                  type="text"
                  value={shop.indirizzo}
                  onChange={e => setShop({ ...shop, indirizzo: e.target.value })}
                  placeholder="Via/Località, CAP Città"
                  className="h-11 px-4 text-[14px] border border-[#e5e5e5] rounded-lg focus:outline-none focus:border-[#005667] focus:ring-1 focus:ring-[#005667]/20 w-full bg-white"
                />
              </div>
            </div>
          </div>

          {/* Descrizione */}
          <div className="bg-white border border-[#e8e4dc] rounded-xl p-6">
            <p className="text-[11px] font-bold text-[#005667] uppercase tracking-wider mb-4">La tua storia</p>
            <p className="text-[12px] text-[#888] mb-3">Racconta la storia della tua cantina ai clienti Stappando</p>

            <textarea
              value={shop.descrizione}
              onChange={e => setShop({ ...shop, descrizione: e.target.value })}
              rows={6}
              maxLength={2000}
              placeholder="Racconta la storia, la filosofia e i valori della tua cantina..."
              className="w-full px-4 py-3 text-[14px] border border-[#e5e5e5] rounded-lg resize-none focus:outline-none focus:border-[#005667] focus:ring-1 focus:ring-[#005667]/20"
            />
            <p className="text-[11px] text-[#aaa] mt-1 text-right">{shop.descrizione.length}/2000</p>
          </div>

          {/* Save sticky */}
          <div className="sticky bottom-0 z-10 bg-[#f8f6f1]/95 backdrop-blur-sm pt-4 pb-6 border-t border-[#e8e4dc] mt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full sm:w-auto bg-[#005667] text-white rounded-lg px-8 py-3.5 text-[14px] font-semibold hover:bg-[#004555] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Salvataggio in corso...
                </>
              ) : 'Salva negozio'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
