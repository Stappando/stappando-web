'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/* ── Types ─────────────────────────────────────────── */

interface TaxTerm { id: number; name: string; slug: string }

interface ProductForm {
  // Step 1 — Base
  produttore: string;
  name: string;
  sku: string;
  regular_price: string;
  sale_price: string;
  stock_quantity: string;
  category: string;
  annata: string;
  short_description: string;
  description: string;
  // Step 2 — Classificazione
  nazione: string;
  regione: string;
  denominazione: string;
  uvaggio: string[];
  formato: string;
  gradazione: string;
  momento_consumo: string[];
  abbinamenti: string[];
  // Step 3 — Dettagli
  temperatura_servizio: string;
  metodo_produttivo: string;
  dosaggio: string;
  spumantizzazione: string;
  raccolta: string;
  tipo_vigneto: string;
  certificazioni: string[];
  alla_vista: string;
  al_naso: string;
  al_palato: string;
  vinificazione: string;
  affinamento: string;
  vendemmia: string;
  allergeni_solfiti: boolean;
  allergeni_uova: boolean;
  allergeni_latte: boolean;
  allergeni_pesce: boolean;
}

const EMPTY_FORM: ProductForm = {
  produttore: '', name: '', sku: '', regular_price: '', sale_price: '', stock_quantity: '',
  category: '', annata: '', short_description: '', description: '',
  nazione: '', regione: '', denominazione: '', uvaggio: [], formato: '', gradazione: '',
  momento_consumo: [], abbinamenti: [],
  temperatura_servizio: '', metodo_produttivo: '', dosaggio: '', spumantizzazione: '',
  raccolta: '', tipo_vigneto: '', certificazioni: [],
  alla_vista: '', al_naso: '', al_palato: '', vinificazione: '', affinamento: '', vendemmia: '',
  allergeni_solfiti: true, allergeni_uova: false, allergeni_latte: false, allergeni_pesce: false,
};

const STEPS = ['Essenziali', 'Classificazione', 'Dettagli', 'Anteprima'];

/* ── Taxonomy dropdowns ───────────────────────────── */

const TAX_SLUGS = [
  'product_cat', 'pa_annata', 'pa_nazione', 'pa_regione', 'pa_denominazione',
  'pa_uvaggio', 'pa_formato', 'pa_gradazione-alcolica', 'pa_momento-di-consumo',
  'pa_abbinamenti', 'pa_temperatura-di-servizio', 'pa_metodo-produttivo',
  'pa_dosaggio', 'pa_spumantizzazione', 'pa_raccolta', 'pa_tipo-di-vigneto',
  'pa_certificazioni',
];

/* ── Component ──────────────────────────────────────── */

export default function NuovoProdottoPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [taxes, setTaxes] = useState<Record<string, TaxTerm[]>>({});
  const [images, setImages] = useState<{ id: number; src: string }[]>([]);
  const [gallery, setGallery] = useState<{ id: number; src: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftId, setDraftId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [saveMsg, setSaveMsg] = useState('');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => { setHydrated(true); }, []);

  // Pre-fill produttore from profile cantina name (cached in localStorage for speed)
  useEffect(() => {
    if (!hydrated || !user?.id || form.produttore) return;
    // Try localStorage first (instant)
    const cached = typeof window !== 'undefined' ? localStorage.getItem('stappando-vendor-cantina') : null;
    if (cached) {
      setForm(f => ({ ...f, produttore: f.produttore || cached }));
      return;
    }
    // Fallback: fetch from API
    fetch(`/api/vendor/profile?vendorId=${user.id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.cantina) {
          setForm(f => ({ ...f, produttore: f.produttore || data.cantina }));
          localStorage.setItem('stappando-vendor-cantina', data.cantina);
        }
      })
      .catch(() => {});
  }, [hydrated, user?.id, form.produttore]);

  // Fetch all taxonomies
  const fetchTaxonomies = useCallback(async () => {
    const results: Record<string, TaxTerm[]> = {};
    await Promise.all(
      TAX_SLUGS.map(async slug => {
        try {
          const res = await fetch(`/api/vendor/taxonomies?slug=${slug}`);
          if (res.ok) results[slug] = await res.json();
        } catch { /* ignore */ }
      }),
    );
    setTaxes(results);
  }, []);

  useEffect(() => {
    if (hydrated) fetchTaxonomies();
  }, [hydrated, fetchTaxonomies]);

  // Upload image
  const handleImageUpload = async (file: File, target: 'main' | 'gallery') => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/vendor/media', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        if (target === 'main') setImages([{ id: data.id, src: data.src }]);
        else setGallery(prev => [...prev, { id: data.id, src: data.src }]);
      }
    } catch { /* ignore */ }
    setUploading(false);
  };

  // Form helpers
  const set = (key: keyof ProductForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const val = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setForm(f => ({ ...f, [key]: val }));
  };

  const toggleMulti = (key: 'uvaggio' | 'momento_consumo' | 'abbinamenti' | 'certificazioni', value: string) => {
    setForm(f => {
      const arr = f[key] as string[];
      return { ...f, [key]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] };
    });
  };

  // Price validation: only dots, no commas
  const handlePrice = (key: 'regular_price' | 'sale_price') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(',', '.');
    if (/^[0-9]*\.?[0-9]{0,2}$/.test(val) || val === '') {
      setForm(f => ({ ...f, [key]: val }));
    }
  };

  // Build API payload from current form state
  const buildPayload = () => {
    const allImages = [...images, ...gallery];
    const attributes: { slug: string; terms: string[] }[] = [];

    if (form.produttore) attributes.push({ slug: 'pa_produttore', terms: [form.produttore] });
    if (form.annata) attributes.push({ slug: 'pa_annata', terms: [form.annata] });
    if (form.nazione) attributes.push({ slug: 'pa_nazione', terms: [form.nazione] });
    if (form.regione) attributes.push({ slug: 'pa_regione', terms: [form.regione] });
    if (form.denominazione) attributes.push({ slug: 'pa_denominazione', terms: [form.denominazione] });
    if (form.uvaggio.length) attributes.push({ slug: 'pa_uvaggio', terms: form.uvaggio });
    if (form.formato) attributes.push({ slug: 'pa_formato', terms: [form.formato] });
    if (form.gradazione) attributes.push({ slug: 'pa_gradazione-alcolica', terms: [form.gradazione] });
    if (form.momento_consumo.length) attributes.push({ slug: 'pa_momento-di-consumo', terms: form.momento_consumo });
    if (form.abbinamenti.length) attributes.push({ slug: 'pa_abbinamenti', terms: form.abbinamenti });
    if (form.temperatura_servizio) attributes.push({ slug: 'pa_temperatura-di-servizio', terms: [form.temperatura_servizio] });
    if (form.metodo_produttivo) attributes.push({ slug: 'pa_metodo-produttivo', terms: [form.metodo_produttivo] });
    if (form.dosaggio) attributes.push({ slug: 'pa_dosaggio', terms: [form.dosaggio] });
    if (form.spumantizzazione) attributes.push({ slug: 'pa_spumantizzazione', terms: [form.spumantizzazione] });
    if (form.raccolta) attributes.push({ slug: 'pa_raccolta', terms: [form.raccolta] });
    if (form.tipo_vigneto) attributes.push({ slug: 'pa_tipo-di-vigneto', terms: [form.tipo_vigneto] });
    if (form.certificazioni.length) attributes.push({ slug: 'pa_certificazioni', terms: form.certificazioni });

    const allergeni: string[] = ['Contiene solfiti'];
    if (form.allergeni_uova) allergeni.push('Uova');
    if (form.allergeni_latte) allergeni.push('Latte');
    if (form.allergeni_pesce) allergeni.push('Pesce');

    return {
      vendorId: user!.id,
      name: form.name || 'Bozza senza nome',
      sku: form.sku || undefined,
      regular_price: form.regular_price || '0',
      sale_price: form.sale_price || undefined,
      stock_quantity: parseInt(form.stock_quantity) || 0,
      short_description: form.short_description,
      description: form.description || form.short_description,
      categories: form.category ? [parseInt(form.category)] : [],
      images: allImages.map(img => ({ id: img.id, src: img.src })),
      attributes,
      acf: {
        alla_vista: form.alla_vista,
        al_naso: form.al_naso,
        al_palato: form.al_palato,
        vinificazione: form.vinificazione,
        affinamento: form.affinamento,
        vendemmia: form.vendemmia,
        allergeni: allergeni.join(', '),
      },
      ...(draftId ? { draftId } : {}),
    };
  };

  // Save draft at any point
  const handleSaveDraft = async () => {
    if (!user?.id) return;
    setSavingDraft(true);
    setSaveMsg('');
    setError('');
    try {
      const res = await fetch('/api/vendor/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.productId && !draftId) setDraftId(data.productId);
        setSaveMsg('Bozza salvata!');
        setTimeout(() => setSaveMsg(''), 4000);
      } else {
        const data = await res.json();
        setError(data.error || 'Errore nel salvataggio bozza');
      }
    } catch {
      setError('Errore di rete. Riprova.');
    }
    setSavingDraft(false);
  };

  // Final submit
  const handleSubmit = async () => {
    if (!user?.id) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/vendor/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Errore nella creazione del prodotto');
        return;
      }

      router.push('/vendor/prodotti?created=1');
    } catch (err) {
      setError('Errore di rete. Riprova.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!hydrated) return null;

  const inputClass = "h-11 px-4 text-[14px] border border-[#e5e5e5] rounded-lg focus:outline-none focus:border-[#005667] focus:ring-1 focus:ring-[#005667]/20 w-full bg-white";
  const labelClass = "block text-[12px] font-semibold text-[#888] uppercase tracking-wider mb-1.5";
  const star = <span className="text-red-400 ml-0.5">*</span>;
  const taxMissing = (slug: string) => (
    <span className="text-[10px] text-[#aaa] ml-1">
      Non trovi? <a href="mailto:assistenza@stappando.it?subject=Taxonomy mancante: {slug}" className="text-[#005667] underline">Scrivi ad assistenza</a>
    </span>
  );

  const renderDropdown = (label: string, taxSlug: string, formKey: keyof ProductForm, required = true) => {
    const terms = taxes[taxSlug] || [];
    return (
      <div>
        <label className={labelClass}>{label} {required && star}</label>
        <select value={form[formKey] as string} onChange={set(formKey)} className={inputClass}>
          <option value="">— Seleziona —</option>
          {terms.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
        </select>
        {taxMissing(taxSlug)}
      </div>
    );
  };

  const renderMultiCheck = (label: string, taxSlug: string, formKey: 'uvaggio' | 'momento_consumo' | 'abbinamenti' | 'certificazioni', required = true) => {
    const terms = taxes[taxSlug] || [];
    const selected = form[formKey] as string[];
    return (
      <div>
        <label className={labelClass}>{label} {required && star}</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {terms.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => toggleMulti(formKey, t.name)}
              className={`px-3 py-1.5 rounded-full text-[12px] font-medium border transition-colors ${
                selected.includes(t.name)
                  ? 'bg-[#005667] text-white border-[#005667]'
                  : 'bg-white text-[#666] border-[#e5e5e5] hover:border-[#005667]'
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
        {taxMissing(taxSlug)}
      </div>
    );
  };

  // Step validation
  const step1Valid = form.produttore.trim() && form.name.trim() && form.regular_price && form.stock_quantity && form.category && form.annata && form.short_description.trim() && images.length > 0;
  const step2Valid = form.nazione && form.regione && form.denominazione && form.uvaggio.length > 0 && form.formato && form.gradazione && form.momento_consumo.length > 0 && form.abbinamenti.length > 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-[#1a1a1a]">Aggiungi un vino</h1>
          <p className="text-[13px] text-[#888] mt-0.5">Step {step + 1} di {STEPS.length} — {STEPS[step]}</p>
        </div>
        <Link href="/vendor/prodotti" className="text-[13px] text-[#888] hover:text-[#005667]">← Annulla</Link>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1.5 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex-1 flex flex-col items-center gap-1">
            <div className={`h-1.5 w-full rounded-full ${i <= step ? 'bg-[#005667]' : 'bg-[#e8e4dc]'}`} />
            <span className={`text-[10px] font-medium ${i <= step ? 'text-[#005667]' : 'text-[#ccc]'}`}>{s}</span>
          </div>
        ))}
      </div>

      {/* ═══ STEP 1 — Essenziali ═══ */}
      {step === 0 && (
        <div className="space-y-6 max-w-2xl">
          <div className="bg-white border border-[#e8e4dc] rounded-xl p-6 space-y-4">
            <p className="text-[11px] font-bold text-[#005667] uppercase tracking-wider mb-2">Informazioni base</p>

            <div>
              <label className={labelClass}>Produttore / Cantina {star}</label>
              <input value={form.produttore} onChange={set('produttore')} className={inputClass} placeholder="Es. Cantina Merlotta" />
              <p className="text-[10px] text-[#aaa] mt-1">Questo nome apparirà su ogni prodotto — se non presente verrà creato automaticamente</p>
            </div>

            <div>
              <label className={labelClass}>Nome prodotto {star}</label>
              <input value={form.name} onChange={set('name')} className={inputClass} placeholder="Es. Sangiovese 'Vigna Alta' Romagna DOC Riserva 2019" />
              <p className="text-[10px] text-[#aaa] mt-1">Formato: Vitigno &apos;Nome fantasia&apos; Denominazione Annata — verrà aggiunto il produttore in automatico</p>
            </div>

            <div>
              <label className={labelClass}>SKU</label>
              <input value={form.sku} onChange={set('sku')} className={inputClass} placeholder="Codice univoco (opzionale)" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Prezzo € {star}</label>
                <input value={form.regular_price} onChange={handlePrice('regular_price')} className={inputClass} placeholder="8.90" inputMode="decimal" />
              </div>
              <div>
                <label className={labelClass}>Prezzo scontato €</label>
                <input value={form.sale_price} onChange={handlePrice('sale_price')} className={inputClass} placeholder="6.50" inputMode="decimal" />
              </div>
            </div>

            <div>
              <label className={labelClass}>Giacenza (bottiglie) {star}</label>
              <input value={form.stock_quantity} onChange={set('stock_quantity')} type="number" min="0" className={inputClass} placeholder="100" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {renderDropdown('Categoria', 'product_cat', 'category', true)}
              {renderDropdown('Annata', 'pa_annata', 'annata', true)}
            </div>
          </div>

          {/* Immagini */}
          <div className="bg-white border border-[#e8e4dc] rounded-xl p-6 space-y-4">
            <p className="text-[11px] font-bold text-[#005667] uppercase tracking-wider mb-2">Immagini</p>

            <div>
              <label className={labelClass}>Immagine principale {star}</label>
              <div className="flex items-start gap-4">
                <div className="w-28 h-36 bg-[#f8f6f1] rounded-xl border-2 border-dashed border-[#e8e4dc] flex items-center justify-center overflow-hidden shrink-0">
                  {images[0] ? (
                    <img src={images[0].src} alt="Main" className="w-full h-full object-contain" />
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center p-2 text-center">
                      {uploading ? (
                        <div className="w-5 h-5 border-2 border-[#005667] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <svg className="w-6 h-6 text-[#ccc] mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                          <span className="text-[10px] text-[#888]">Carica foto</span>
                        </>
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'main')} />
                    </label>
                  )}
                </div>
                <p className="text-[12px] text-[#888]">Bottiglia su sfondo bianco o neutro. JPG/PNG, max 5MB. L&apos;immagine verrà ottimizzata automaticamente.</p>
              </div>
            </div>

            <div>
              <label className={labelClass}>Galleria</label>
              <div className="flex gap-3 flex-wrap">
                {gallery.map((img, i) => (
                  <div key={i} className="w-20 h-20 rounded-lg overflow-hidden border border-[#e8e4dc] relative group">
                    <img src={img.src} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => setGallery(g => g.filter((_, j) => j !== i))} className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/50 rounded-full text-white text-[10px] opacity-0 group-hover:opacity-100">×</button>
                  </div>
                ))}
                <label className="w-20 h-20 rounded-lg border-2 border-dashed border-[#e8e4dc] flex items-center justify-center cursor-pointer hover:bg-[#f8f6f1]">
                  <svg className="w-5 h-5 text-[#ccc]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                  <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'gallery')} />
                </label>
              </div>
            </div>
          </div>

          {/* Descrizioni */}
          <div className="bg-white border border-[#e8e4dc] rounded-xl p-6 space-y-4">
            <p className="text-[11px] font-bold text-[#005667] uppercase tracking-wider mb-2">Descrizioni</p>

            <div>
              <label className={labelClass}>Descrizione breve {star}</label>
              <textarea value={form.short_description} onChange={set('short_description')} rows={2} maxLength={160} className={`${inputClass} h-auto py-3 resize-none`} placeholder="Max 160 caratteri" />
              <p className="text-[10px] text-[#aaa] mt-0.5 text-right">{form.short_description.length}/160</p>
            </div>

            <div>
              <label className={labelClass}>Descrizione lunga</label>
              <textarea value={form.description} onChange={set('description')} rows={5} className={`${inputClass} h-auto py-3 resize-none`} placeholder="Fino a 500 parole — se vuota verrà usata la breve" />
            </div>
          </div>
        </div>
      )}

      {/* ═══ STEP 2 — Classificazione ═══ */}
      {step === 1 && (
        <div className="space-y-6 max-w-2xl">
          <div className="bg-white border border-[#e8e4dc] rounded-xl p-6 space-y-4">
            <p className="text-[11px] font-bold text-[#005667] uppercase tracking-wider mb-2">Origine</p>
            <div className="grid grid-cols-2 gap-4">
              {renderDropdown('Nazione', 'pa_nazione', 'nazione')}
              {renderDropdown('Regione', 'pa_regione', 'regione')}
            </div>
            {renderDropdown('Denominazione', 'pa_denominazione', 'denominazione')}
          </div>

          <div className="bg-white border border-[#e8e4dc] rounded-xl p-6 space-y-4">
            <p className="text-[11px] font-bold text-[#005667] uppercase tracking-wider mb-2">Caratteristiche</p>
            {renderMultiCheck('Uvaggio', 'pa_uvaggio', 'uvaggio')}
            <div className="grid grid-cols-2 gap-4">
              {renderDropdown('Formato', 'pa_formato', 'formato')}
              {renderDropdown('Gradazione alcolica', 'pa_gradazione-alcolica', 'gradazione')}
            </div>
          </div>

          <div className="bg-white border border-[#e8e4dc] rounded-xl p-6 space-y-4">
            <p className="text-[11px] font-bold text-[#005667] uppercase tracking-wider mb-2">Consumo</p>
            {renderMultiCheck('Momento di consumo', 'pa_momento-di-consumo', 'momento_consumo')}
            {renderMultiCheck('Abbinamenti', 'pa_abbinamenti', 'abbinamenti')}
          </div>
        </div>
      )}

      {/* ═══ STEP 3 — Dettagli avanzati ═══ */}
      {step === 2 && (
        <div className="space-y-6 max-w-2xl">
          <div className="bg-white border border-[#e8e4dc] rounded-xl p-6 space-y-4">
            <p className="text-[11px] font-bold text-[#005667] uppercase tracking-wider mb-2">Opzionali</p>
            <div className="grid grid-cols-2 gap-4">
              {renderDropdown('Temperatura di servizio', 'pa_temperatura-di-servizio', 'temperatura_servizio', false)}
              {renderDropdown('Raccolta', 'pa_raccolta', 'raccolta', false)}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {renderDropdown('Tipo di vigneto', 'pa_tipo-di-vigneto', 'tipo_vigneto', false)}
              {renderMultiCheck('Certificazioni', 'pa_certificazioni', 'certificazioni', false)}
            </div>
          </div>

          <div className="bg-white border border-[#e8e4dc] rounded-xl p-6 space-y-4">
            <p className="text-[11px] font-bold text-[#005667] uppercase tracking-wider mb-2">Solo spumanti</p>
            <div className="grid grid-cols-3 gap-4">
              {renderDropdown('Metodo produttivo', 'pa_metodo-produttivo', 'metodo_produttivo', false)}
              {renderDropdown('Dosaggio', 'pa_dosaggio', 'dosaggio', false)}
              {renderDropdown('Spumantizzazione', 'pa_spumantizzazione', 'spumantizzazione', false)}
            </div>
          </div>

          <div className="bg-white border border-[#e8e4dc] rounded-xl p-6 space-y-4">
            <p className="text-[11px] font-bold text-[#005667] uppercase tracking-wider mb-2">Note di degustazione</p>
            <div>
              <label className={labelClass}>Alla vista</label>
              <input value={form.alla_vista} onChange={set('alla_vista')} className={inputClass} placeholder="Es. Rosso rubino intenso con riflessi violacei" />
            </div>
            <div>
              <label className={labelClass}>Al naso</label>
              <input value={form.al_naso} onChange={set('al_naso')} className={inputClass} placeholder="Es. Frutti rossi maturi, spezie e vaniglia" />
            </div>
            <div>
              <label className={labelClass}>Al palato</label>
              <input value={form.al_palato} onChange={set('al_palato')} className={inputClass} placeholder="Es. Morbido, tannini setosi, finale lungo" />
            </div>
          </div>

          <div className="bg-white border border-[#e8e4dc] rounded-xl p-6 space-y-4">
            <p className="text-[11px] font-bold text-[#005667] uppercase tracking-wider mb-2">Produzione</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Vinificazione</label>
                <input value={form.vinificazione} onChange={set('vinificazione')} className={inputClass} placeholder="Es. Fermentazione in acciaio" />
              </div>
              <div>
                <label className={labelClass}>Affinamento</label>
                <input value={form.affinamento} onChange={set('affinamento')} className={inputClass} placeholder="Es. 12 mesi in barrique" />
              </div>
            </div>
            <div>
              <label className={labelClass}>Vendemmia</label>
              <input value={form.vendemmia} onChange={set('vendemmia')} className={inputClass} placeholder="Es. Seconda settimana di settembre" />
            </div>
          </div>

          <div className="bg-white border border-[#e8e4dc] rounded-xl p-6 space-y-3">
            <p className="text-[11px] font-bold text-[#005667] uppercase tracking-wider mb-2">Allergeni {star}</p>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.allergeni_solfiti} onChange={set('allergeni_solfiti')} disabled className="w-4 h-4 text-[#005667] rounded" />
              <span className="text-[13px] text-[#444]">Contiene solfiti <span className="text-[11px] text-[#888]">(obbligatorio per legge)</span></span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.allergeni_uova} onChange={set('allergeni_uova')} className="w-4 h-4 text-[#005667] rounded" />
              <span className="text-[13px] text-[#444]">Uova</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.allergeni_latte} onChange={set('allergeni_latte')} className="w-4 h-4 text-[#005667] rounded" />
              <span className="text-[13px] text-[#444]">Latte</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.allergeni_pesce} onChange={set('allergeni_pesce')} className="w-4 h-4 text-[#005667] rounded" />
              <span className="text-[13px] text-[#444]">Pesce</span>
            </label>
          </div>
        </div>
      )}

      {/* ═══ STEP 4 — Anteprima ═══ */}
      {step === 3 && (
        <div className="space-y-6 max-w-2xl">
          <div className="bg-white border border-[#e8e4dc] rounded-xl p-6">
            <p className="text-[11px] font-bold text-[#005667] uppercase tracking-wider mb-4">Anteprima prodotto</p>

            <div className="flex gap-6">
              {/* Image */}
              <div className="w-32 h-44 rounded-xl bg-[#f8f6f1] overflow-hidden shrink-0">
                {images[0] && <img src={images[0].src} alt="" className="w-full h-full object-contain" />}
              </div>

              {/* Info */}
              <div className="flex-1">
                {form.produttore && <p className="text-[11px] text-[#888] uppercase tracking-wider mb-1">{form.produttore}</p>}
                <h2 className="text-[18px] font-bold text-[#1a1a1a] mb-2">{form.name || 'Nome prodotto'}</h2>

                <div className="flex items-baseline gap-2 mb-3">
                  {form.sale_price ? (
                    <>
                      <span className="text-[11px] text-[#aaa] line-through">{form.regular_price} €</span>
                      <span className="text-[20px] font-bold text-[#005667]">{form.sale_price} €</span>
                    </>
                  ) : (
                    <span className="text-[20px] font-bold text-[#005667]">{form.regular_price || '0.00'} €</span>
                  )}
                </div>

                <p className="text-[13px] text-[#666] mb-3">{form.short_description}</p>

                <div className="flex flex-wrap gap-1.5">
                  {form.denominazione && <span className="px-2 py-0.5 bg-[#f8f6f1] rounded text-[11px] text-[#888]">{form.denominazione}</span>}
                  {form.regione && <span className="px-2 py-0.5 bg-[#f8f6f1] rounded text-[11px] text-[#888]">{form.regione}</span>}
                  {form.annata && <span className="px-2 py-0.5 bg-[#f8f6f1] rounded text-[11px] text-[#888]">{form.annata}</span>}
                  {form.formato && <span className="px-2 py-0.5 bg-[#f8f6f1] rounded text-[11px] text-[#888]">{form.formato}</span>}
                  {form.gradazione && <span className="px-2 py-0.5 bg-[#f8f6f1] rounded text-[11px] text-[#888]">{form.gradazione}</span>}
                </div>
              </div>
            </div>

            {/* Degustazione preview */}
            {(form.alla_vista || form.al_naso || form.al_palato) && (
              <div className="mt-6 pt-4 border-t border-[#f0ece4]">
                <p className="text-[11px] font-bold text-[#888] uppercase tracking-wider mb-3">Note di degustazione</p>
                <div className="grid grid-cols-3 gap-4">
                  {form.alla_vista && <div><p className="text-[10px] text-[#005667] font-semibold mb-0.5">Alla vista</p><p className="text-[12px] text-[#666]">{form.alla_vista}</p></div>}
                  {form.al_naso && <div><p className="text-[10px] text-[#005667] font-semibold mb-0.5">Al naso</p><p className="text-[12px] text-[#666]">{form.al_naso}</p></div>}
                  {form.al_palato && <div><p className="text-[10px] text-[#005667] font-semibold mb-0.5">Al palato</p><p className="text-[12px] text-[#666]">{form.al_palato}</p></div>}
                </div>
              </div>
            )}
          </div>

          {/* Submit info */}
          <div className="bg-[#f0f7f5] border border-[#005667]/20 rounded-xl p-5">
            <p className="text-[13px] text-[#005667] font-semibold mb-1">Cosa succede dopo?</p>
            <p className="text-[12px] text-[#666] leading-relaxed">
              Il prodotto verrà inviato in <strong>revisione</strong> al team Stappando.
              Riceverai una notifica quando sarà approvato e visibile nel catalogo.
              Tempo medio di approvazione: 24-48 ore lavorative.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-[13px] text-red-700">{error}</div>
          )}
        </div>
      )}

      {/* ═══ Save message ═══ */}
      {saveMsg && (
        <div className="max-w-2xl mt-4 rounded-xl p-3 bg-[#065f46] text-white text-[13px] font-semibold text-center">{saveMsg}</div>
      )}

      {/* ═══ Navigation buttons ═══ */}
      <div className="sticky bottom-0 z-10 bg-[#f8f6f1]/95 backdrop-blur-sm pt-4 pb-6 border-t border-[#e8e4dc] mt-6 max-w-2xl">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
            className="text-[13px] text-[#888] hover:text-[#005667] disabled:invisible"
          >
            ← Indietro
          </button>

          <div className="flex items-center gap-3">
            {/* Save draft — always available */}
            <button
              onClick={handleSaveDraft}
              disabled={savingDraft || !form.name.trim()}
              className="border border-[#005667] text-[#005667] rounded-lg px-5 py-2.5 text-[13px] font-semibold hover:bg-[#005667]/5 transition-colors disabled:opacity-40 flex items-center gap-2"
            >
              {savingDraft ? (
                <><div className="w-3.5 h-3.5 border-2 border-[#005667] border-t-transparent rounded-full animate-spin" /> Salvataggio...</>
              ) : (
                <>{draftId ? 'Aggiorna bozza' : 'Salva bozza'}</>
              )}
            </button>

            {step < 3 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={(step === 0 && !step1Valid) || (step === 1 && !step2Valid)}
                className="bg-[#005667] text-white rounded-lg px-6 py-2.5 text-[13px] font-semibold hover:bg-[#004555] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continua →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-[#005667] text-white rounded-lg px-6 py-2.5 text-[13px] font-semibold hover:bg-[#004555] transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Invio...</>
                ) : 'Invia per approvazione'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
