'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import { useAuthStore } from '@/store/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

/* ── Constants ─────────────────────────────────────────── */

const PRIMARY = '#005667';
const GOLD = '#d9c39a';

/* ── Types ─────────────────────────────────────────────── */

interface ProductData {
  nome: string;
  produttore: string;
  sku: string;
  prezzo: string;
  prezzoScontato: string;
  giacenza: string;
  categoria: string;
  annata: string;
  formato: string;
  denominazione: string;
  regione: string;
  nazione: string;
  uvaggio: string;
  gradazione: string;
  descBreve: string;
  descLunga: string;
  allaVista: string;
  alNaso: string;
  alPalato: string;
  abbinamenti: string;
  temperaturaServizio: string;
  momentoConsumo: string;
  vinificazione: string;
  affinamento: string;
  allergeni: string;
  terreno: string;
  altitudine: string;
  zonaProduzione: string;
  resa: string;
  bottiglieProdotte: string;
  raccolta: string;
  densitaImpianto: string;
  spumantizzazione: string;
  categoriaSpumanti: string;
  dosaggio: string;
  orientamentoVigne: string;
  tipoVigneto: string;
  periodoVendemmia: string;
  certificazioni: string;
  categoriaGoogle: string;
  gtin: string;
  esposizione: string;
}

const emptyProduct: ProductData = {
  nome: '',
  produttore: '',
  sku: '',
  prezzo: '',
  prezzoScontato: '',
  giacenza: '',
  categoria: '',
  annata: '',
  formato: '75 cl',
  denominazione: '',
  regione: '',
  nazione: 'Italia',
  uvaggio: '',
  gradazione: '',
  descBreve: '',
  descLunga: '',
  allaVista: '',
  alNaso: '',
  alPalato: '',
  abbinamenti: '',
  temperaturaServizio: '',
  momentoConsumo: '',
  vinificazione: '',
  affinamento: '',
  allergeni: 'Contiene solfiti',
  terreno: '',
  altitudine: '',
  zonaProduzione: '',
  resa: '',
  bottiglieProdotte: '',
  raccolta: '',
  densitaImpianto: '',
  spumantizzazione: '',
  categoriaSpumanti: '',
  dosaggio: '',
  orientamentoVigne: '',
  tipoVigneto: '',
  periodoVendemmia: '',
  certificazioni: '',
  categoriaGoogle: '',
  gtin: '',
  esposizione: '',
};

/* ── Spinner SVG ───────────────────────────────────────── */

function Spinner() {
  return (
    <svg
      className="animate-spin h-5 w-5 text-white inline-block"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

/* ── Sub-step labels ──────────────────────────────────── */

const SUB_STEP_LABELS = ['Base', 'Classificazione', 'Territorio', 'Testi'] as const;
type SubStep = 1 | 2 | 3 | 4;

/* ── Inner Component (needs useSearchParams) ──────────── */

function NuovoProdottoInner() {
  const { user } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editDraftId = searchParams.get('draft');

  const [subStep, setSubStep] = useState<SubStep>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<ProductData>(emptyProduct);
  const [saveMsg, setSaveMsg] = useState('');
  const [draftId, setDraftId] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(false);

  const [newUvaggio, setNewUvaggio] = useState('');
  const [wcCategories, setWcCategories] = useState<{ id: number; name: string; children: { id: number; name: string }[] }[]>([]);

  // Taxonomy terms state
  const [taxTerms, setTaxTerms] = useState<Record<string, { name: string; slug: string }[]>>({});

  useEffect(() => { setHydrated(true); }, []);

  // Load existing draft if ?draft=ID
  useEffect(() => {
    if (!hydrated || !editDraftId) return;
    setLoadingDraft(true);
    setDraftId(parseInt(editDraftId));
    fetch(`/api/vendor/products/${editDraftId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        setForm(f => ({
          ...f,
          produttore: data.produttore || f.produttore,
          nome: data.name || data.nome || '',
          sku: data.sku || '',
          prezzo: data.regular_price || data.prezzo || '',
          prezzoScontato: data.sale_price || data.prezzoScontato || '',
          giacenza: data.stock_quantity != null ? String(data.stock_quantity) : (data.giacenza || ''),
          categoria: data.category_id ? String(data.category_id) : (data.categoria || ''),
          annata: data.annata || '',
          formato: data.formato || '75 cl',
          denominazione: data.denominazione || '',
          regione: data.regione || '',
          nazione: data.nazione || 'Italia',
          uvaggio: Array.isArray(data.uvaggio) ? data.uvaggio.join(', ') : (data.uvaggio || ''),
          gradazione: data.gradazione || '',
          descBreve: data.short_description || data.descBreve || '',
          descLunga: data.description || data.descLunga || '',
          allaVista: data.alla_vista || data.allaVista || '',
          alNaso: data.al_naso || data.alNaso || '',
          alPalato: data.al_palato || data.alPalato || '',
          abbinamenti: Array.isArray(data.abbinamenti) ? data.abbinamenti.join(', ') : (data.abbinamenti || ''),
          temperaturaServizio: data.temperatura_servizio || data.temperaturaServizio || '',
          momentoConsumo: Array.isArray(data.momento_consumo) ? data.momento_consumo.join(', ') : (data.momentoConsumo || ''),
          vinificazione: data.vinificazione || '',
          affinamento: data.affinamento || '',
          allergeni: data.allergeni || 'Contiene solfiti',
          terreno: data.terreno || '',
          altitudine: data.altitudine || '',
          zonaProduzione: data.zonaProduzione || data.zona_produzione || '',
          resa: data.resa || '',
          bottiglieProdotte: data.bottiglieProdotte || data.bottiglie_prodotte || '',
          raccolta: data.raccolta || '',
          densitaImpianto: data.densitaImpianto || data.densita_impianto || '',
          spumantizzazione: data.spumantizzazione || '',
          categoriaSpumanti: data.categoriaSpumanti || data.categoria_spumanti || '',
          dosaggio: data.dosaggio || '',
          orientamentoVigne: data.orientamentoVigne || data.orientamento_vigne || '',
          tipoVigneto: data.tipoVigneto || data.tipo_vigneto || '',
          periodoVendemmia: Array.isArray(data.periodoVendemmia) ? data.periodoVendemmia.join(', ') : (data.periodoVendemmia || data.periodo_vendemmia || ''),
          certificazioni: Array.isArray(data.certificazioni) ? data.certificazioni.join(', ') : (data.certificazioni || ''),
          categoriaGoogle: data.categoriaGoogle || '',
          gtin: data.gtin || '',
        }));
      })
      .catch(() => {})
      .finally(() => setLoadingDraft(false));
  }, [hydrated, editDraftId]);

  // Pre-fill produttore from profile cantina name
  useEffect(() => {
    if (!hydrated || !user?.id || form.produttore) return;
    const cached = typeof window !== 'undefined' ? localStorage.getItem('stappando-vendor-cantina') : null;
    if (cached) {
      setForm(f => ({ ...f, produttore: f.produttore || cached }));
      return;
    }
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

  // Fetch WC categories
  useEffect(() => {
    fetch('/api/admin/prodotti/categories')
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setWcCategories(data); })
      .catch(() => {});
  }, []);

  // Fetch all taxonomy terms on mount
  useEffect(() => {
    const slugs = [
      'pa_abbinamenti',
      'pa_denominazione',
      'pa_regione',
      'pa_uvaggio',
      'pa_formato',
      'pa_momento-di-consumo',
      'pa_temperatura-di-servizio',
      'pa_allergeni',
      'pa_filosofia',
      'pa_raccolta',
      'pa_gradazione-alcolica',
      'pa_altitudine-dei-vigneti',
      'pa_resa',
      'pa_bottiglie-prodotte',
      'pa_metodo-produttivo',
      'pa_spumantizzazione',
      'pa_dosaggio',
      'pa_orientamento-delle-vigne',
      'pa_terreno',
      'pa_densita-dimpianto',
      'pa_tipo-di-vigneto',
      'pa_annata',
      'pa_periodo-vendemmia',
      'pa_nazione',
      'pa_categoria-google',
    ];
    slugs.forEach((slug) => {
      fetch(`/api/vendor/taxonomies?slug=${slug}&per_page=200`)
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => {
          const list = Array.isArray(data) ? data : [];
          setTaxTerms((prev) => ({
            ...prev,
            [slug]: list
              .map((t: { name: string; slug: string }) => ({ name: t.name, slug: t.slug }))
              .sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name)),
          }));
        })
        .catch(() => {});
    });
  }, []);

  /* ── Helpers ────────────────────────────────────────── */

  const updateField = useCallback(
    (field: keyof ProductData) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
      },
    [],
  );

  const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '');

  // Toggle a value in a comma-separated form field
  const togglePill = (field: keyof ProductData, value: string) => {
    setForm((prev) => {
      const raw = prev[field] || '';
      const current = String(raw).split(',').map((s) => s.trim()).filter(Boolean);
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [field]: next.join(', ') };
    });
  };

  const isPillSelected = (field: keyof ProductData, value: string) => {
    const raw = form[field] || '';
    return String(raw).split(',').map((s) => s.trim()).includes(value);
  };

  /* ── Save / Submit ────────────────────────────────────── */

  const buildPayload = () => {
    return {
      vendorId: user!.id,
      name: form.nome || 'Bozza senza nome',
      sku: form.sku || undefined,
      regular_price: form.prezzo || '0',
      sale_price: form.prezzoScontato || undefined,
      stock_quantity: parseInt(form.giacenza) || 0,
      short_description: stripHtml(form.descBreve),
      description: stripHtml(form.descLunga) || stripHtml(form.descBreve),
      categories: form.categoria ? [parseInt(form.categoria)] : [],
      images: [],
      attributes: (() => {
        // Safe split helper — handles undefined, arrays, and strings
        const st = (v: string | undefined) => String(v || '').split(',').map(s => s.trim()).filter(Boolean);
        return [
          form.produttore && { slug: 'pa_produttore', terms: [form.produttore] },
          form.annata && { slug: 'pa_annata', terms: [form.annata] },
          form.formato && { slug: 'pa_formato', terms: [form.formato] },
          form.denominazione && { slug: 'pa_denominazione', terms: [form.denominazione] },
          form.gradazione && { slug: 'pa_gradazione-alcolica', terms: [form.gradazione] },
          form.regione && { slug: 'pa_regione', terms: [form.regione] },
          form.nazione && { slug: 'pa_nazione', terms: [form.nazione] },
          form.uvaggio && { slug: 'pa_uvaggio', terms: st(form.uvaggio) },
          form.abbinamenti && { slug: 'pa_abbinamenti', terms: st(form.abbinamenti) },
          form.temperaturaServizio && { slug: 'pa_temperatura-di-servizio', terms: [form.temperaturaServizio] },
          form.momentoConsumo && { slug: 'pa_momento-di-consumo', terms: st(form.momentoConsumo) },
          form.allergeni && { slug: 'pa_allergeni', terms: st(form.allergeni) },
          form.terreno && { slug: 'pa_terreno', terms: st(form.terreno) },
          form.altitudine && { slug: 'pa_altitudine-dei-vigneti', terms: [form.altitudine] },
          form.densitaImpianto && { slug: 'pa_densita-dimpianto', terms: [form.densitaImpianto] },
          form.zonaProduzione && { slug: 'pa_zona-di-produzione', terms: [form.zonaProduzione] },
          form.resa && { slug: 'pa_resa', terms: [form.resa] },
          form.raccolta && { slug: 'pa_raccolta', terms: [form.raccolta] },
          form.bottiglieProdotte && { slug: 'pa_bottiglie-prodotte', terms: [form.bottiglieProdotte] },
          form.orientamentoVigne && { slug: 'pa_orientamento-delle-vigne', terms: [form.orientamentoVigne] },
          form.tipoVigneto && { slug: 'pa_tipo-di-vigneto', terms: [form.tipoVigneto] },
          form.periodoVendemmia && { slug: 'pa_periodo-vendemmia', terms: st(form.periodoVendemmia) },
          form.certificazioni && { slug: 'pa_filosofia', terms: st(form.certificazioni) },
          form.spumantizzazione && { slug: 'pa_metodo-produttivo', terms: [form.spumantizzazione] },
          form.categoriaSpumanti && { slug: 'pa_spumantizzazione', terms: [form.categoriaSpumanti] },
          form.dosaggio && { slug: 'pa_dosaggio', terms: [form.dosaggio] },
          form.categoriaGoogle && { slug: 'pa_categoria-google', terms: [form.categoriaGoogle] },
          form.gtin && { slug: 'pa_ean', terms: [form.gtin] },
          form.gtin && { slug: 'pa_identificazione-esistente', terms: ['Sì'] },
        ].filter(Boolean) as { slug: string; terms: string[] }[];
      })(),
      acf: {
        alla_vista: form.allaVista,
        al_naso: form.alNaso,
        al_palato: form.alPalato,
        vinificazione: stripHtml(form.vinificazione),
        affinamento: stripHtml(form.affinamento),
        allergeni: form.allergeni,
        zona_produzione: form.zonaProduzione,
      },
      ...(draftId ? { draftId } : {}),
    };
  };

  const handleSaveDraft = async () => {
    if (!user?.id) {
      setError('Errore: utente non autenticato. Ricarica la pagina.');
      return;
    }
    setLoading(true);
    setSaveMsg('');
    setError('');
    try {
      const payload = buildPayload();
      const res = await fetch('/api/vendor/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.productId) {
          setDraftId(data.productId);
          const url = new URL(window.location.href);
          url.searchParams.set('draft', String(data.productId));
          window.history.replaceState({}, '', url.toString());
        }
        setSaveMsg('Bozza salvata!');
        setTimeout(() => setSaveMsg(''), 4000);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || `Errore salvataggio (${res.status})`);
      }
    } catch {
      setError('Errore di rete. Riprova.');
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError('');
    setSaveMsg('');
    try {
      const payload = buildPayload();
      console.log('[Vendor] Submitting product:', JSON.stringify(payload).slice(0, 500));
      const res = await fetch('/api/vendor/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error('[Vendor] Submit error:', res.status, data);
        setError(data.error || `Errore (${res.status})`);
        return;
      }
      if (data.productId && !draftId) setDraftId(data.productId);
      setSaveMsg('Prodotto inviato per approvazione!');
      setTimeout(() => router.push('/vendor/prodotti?created=1'), 2000);
    } catch (err) {
      console.error('[Vendor] Network error:', err);
      setError('Errore di rete. Riprova.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Styles ─────────────────────────────────────────── */

  const inputClass =
    'w-full h-[44px] px-3 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#005667] focus:border-transparent';
  const textareaClass =
    'w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#005667] focus:border-transparent resize-none';
  const labelClass = 'block text-xs font-semibold text-gray-600 mb-1';
  const sectionClass = 'bg-white rounded-xl border border-gray-200 p-4 space-y-3';

  /* ── Loading state ─────────────────────────────────── */

  if (!hydrated || loadingDraft) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-8 h-8 border-2 border-[#005667] border-t-transparent rounded-full animate-spin" />
        <p className="text-[13px] text-[#888]">{loadingDraft ? 'Caricamento prodotto...' : 'Preparazione wizard...'}</p>
      </div>
    );
  }

  /* ── Render ─────────────────────────────────────────── */

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 shadow-sm" style={{ backgroundColor: PRIMARY }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-white font-bold text-base">Nuovo Prodotto</h1>
          <Link href="/vendor/prodotti" className="text-xs hover:underline" style={{ color: GOLD }}>
            &larr; Annulla
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Error banner */}
        {error && (
          <div className="mb-5 p-3 rounded-lg text-sm font-medium bg-red-50 text-red-800 border border-red-200">
            {error}
          </div>
        )}

        {/* Save message */}
        {saveMsg && (
          <div className="mb-5 rounded-xl p-3 bg-[#065f46] text-white text-[13px] font-semibold text-center">
            {saveMsg}
          </div>
        )}

        <div className="space-y-5">
          {/* Sub-step indicator */}
          <div className="flex items-center gap-1 bg-white rounded-xl border border-gray-200 p-3">
            {SUB_STEP_LABELS.map((label, i) => {
              const num = (i + 1) as SubStep;
              const isActive = subStep === num;
              const isCompleted = subStep > num;
              return (
                <div key={label} className="flex items-center flex-1">
                  <button
                    type="button"
                    onClick={() => setSubStep(num)}
                    className={`flex items-center gap-1.5 text-xs font-semibold transition-colors w-full justify-center py-1.5 rounded-lg ${
                      isActive
                        ? 'text-white'
                        : isCompleted
                          ? 'text-[#005667]'
                          : 'text-gray-400'
                    }`}
                    style={isActive ? { backgroundColor: PRIMARY } : undefined}
                  >
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : isCompleted
                          ? 'bg-[#005667]/10 text-[#005667]'
                          : 'bg-gray-100 text-gray-400'
                    }`}>
                      {isCompleted ? '\u2713' : num}
                    </span>
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                  {i < SUB_STEP_LABELS.length - 1 && (
                    <div className={`w-4 h-px shrink-0 ${isCompleted ? 'bg-[#005667]' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Step 1: Base ──────────────────────────── */}
          {subStep === 1 && (
            <div className={sectionClass}>
              <h3 className="text-sm font-bold text-[#005667] mb-2">Base</h3>

              <div>
                <label className={labelClass}>Produttore / Cantina</label>
                <input
                  type="text"
                  value={form.produttore}
                  onChange={updateField('produttore')}
                  placeholder="Pre-compilato dal tuo profilo"
                  className={`${inputClass} bg-gray-50`}
                  readOnly
                />
              </div>

              <div>
                <label className={labelClass}>Nome prodotto *</label>
                <input type="text" value={form.nome} onChange={updateField('nome')} placeholder="es. Sangiovese Riserva DOC 2019" className={inputClass} autoFocus />
              </div>

              <div>
                <label className={labelClass}>SKU</label>
                <input type="text" value={form.sku} onChange={updateField('sku')} placeholder="Codice prodotto (opzionale)" className={inputClass} />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Prezzo &euro; *</label>
                  <input type="text" value={form.prezzo} onChange={updateField('prezzo')} placeholder="es. 12.50" className={inputClass} inputMode="decimal" />
                </div>
                <div>
                  <label className={labelClass}>Prezzo scontato &euro;</label>
                  <input type="text" value={form.prezzoScontato} onChange={updateField('prezzoScontato')} placeholder="es. 9.90" className={inputClass} inputMode="decimal" />
                </div>
                <div>
                  <label className={labelClass}>Giacenza *</label>
                  <input type="number" value={form.giacenza} onChange={updateField('giacenza')} placeholder="es. 100" min="0" className={inputClass} />
                </div>
              </div>

              <div>
                <label className={labelClass}>Categoria</label>
                <select value={form.categoria} onChange={updateField('categoria')} className={inputClass}>
                  <option value="">-- Seleziona --</option>
                  {wcCategories.map((parent) => (
                    <optgroup key={parent.id} label={parent.name}>
                      <option value={String(parent.id)}>{parent.name}</option>
                      {parent.children.map((child) => (
                        <option key={child.id} value={String(child.id)}>  {child.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Annata</label>
                  <select value={form.annata} onChange={updateField('annata')} className={inputClass}>
                    <option value="">-- Seleziona --</option>
                    {(taxTerms['pa_annata'] || []).map((t) => (
                      <option key={t.slug} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Formato</label>
                  <select value={form.formato} onChange={updateField('formato')} className={inputClass}>
                    <option value="">-- Seleziona --</option>
                    {(taxTerms['pa_formato'] || []).map((t) => (
                      <option key={t.slug} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Classificazione ──────────────── */}
          {subStep === 2 && (
            <div className={sectionClass}>
              <h3 className="text-sm font-bold text-[#005667] mb-2">Classificazione</h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Denominazione</label>
                  <select value={form.denominazione} onChange={updateField('denominazione')} className={inputClass}>
                    <option value="">-- Seleziona --</option>
                    {(taxTerms['pa_denominazione'] || []).map((t) => (
                      <option key={t.slug} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Gradazione alcolica</label>
                  <select value={form.gradazione} onChange={updateField('gradazione')} className={inputClass}>
                    <option value="">-- Seleziona --</option>
                    {(taxTerms['pa_gradazione-alcolica'] || []).map((t) => (
                      <option key={t.slug} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Regione</label>
                  <select value={form.regione} onChange={updateField('regione')} className={inputClass}>
                    <option value="">-- Seleziona --</option>
                    {(taxTerms['pa_regione'] || []).map((t) => (
                      <option key={t.slug} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Nazione</label>
                  <select value={form.nazione} onChange={updateField('nazione')} className={inputClass}>
                    <option value="">-- Seleziona --</option>
                    {(taxTerms['pa_nazione'] || []).map((t) => (
                      <option key={t.slug} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass}>Uvaggio</label>
                {/* Selected pills */}
                {form.uvaggio && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {form.uvaggio.split(',').map(u => u.trim()).filter(Boolean).map(u => (
                      <span key={u} className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] bg-[#005667] text-white border border-[#005667]">
                        {u}
                        <button type="button" onClick={() => togglePill('uvaggio', u)} className="ml-0.5 hover:text-red-200">&times;</button>
                      </span>
                    ))}
                  </div>
                )}
                {/* Search input */}
                <div className="relative">
                  <input
                    type="text"
                    value={newUvaggio}
                    onChange={(e) => setNewUvaggio(e.target.value)}
                    placeholder="Cerca uvaggio..."
                    className="w-full h-9 px-3 text-[12px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#005667]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newUvaggio.trim() && !isPillSelected('uvaggio', newUvaggio.trim())) {
                          togglePill('uvaggio', newUvaggio.trim());
                        }
                        setNewUvaggio('');
                      }
                    }}
                  />
                  {newUvaggio.length >= 1 && (() => {
                    const q = newUvaggio.toLowerCase();
                    const filtered = (taxTerms['pa_uvaggio'] || []).filter(t => t.name.toLowerCase().includes(q) && !isPillSelected('uvaggio', t.name));
                    return (
                      <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {filtered.slice(0, 15).map(t => (
                          <button key={t.slug} type="button" onClick={() => { togglePill('uvaggio', t.name); setNewUvaggio(''); }}
                            className="w-full text-left px-3 py-2 text-[12px] hover:bg-gray-50 border-b border-gray-50 last:border-0">{t.name}</button>
                        ))}
                        {filtered.length === 0 && (
                          <button type="button" onClick={() => { togglePill('uvaggio', newUvaggio.trim()); setNewUvaggio(''); }}
                            className="w-full text-left px-3 py-2 text-[12px] text-[#005667] font-semibold hover:bg-gray-50">
                            + Aggiungi &quot;{newUvaggio.trim()}&quot;
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div>
                <label className={labelClass}>Abbinamenti</label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {(taxTerms['pa_abbinamenti'] || []).map((t) => (
                    <button
                      key={t.slug}
                      type="button"
                      onClick={() => togglePill('abbinamenti', t.name)}
                      className={`rounded-full px-3 py-1.5 text-[12px] border transition-colors ${
                        isPillSelected('abbinamenti', t.name)
                          ? 'bg-[#005667] text-white border-[#005667]'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-[#005667]'
                      }`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Temperatura di servizio</label>
                  <select value={form.temperaturaServizio} onChange={updateField('temperaturaServizio')} className={inputClass}>
                    <option value="">-- Seleziona --</option>
                    {(taxTerms['pa_temperatura-di-servizio'] || []).map((t) => (
                      <option key={t.slug} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Momento di consumo</label>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {(taxTerms['pa_momento-di-consumo'] || []).map((t) => (
                      <button
                        key={t.slug}
                        type="button"
                        onClick={() => togglePill('momentoConsumo', t.name)}
                        className={`rounded-full px-3 py-1.5 text-[12px] border transition-colors ${
                          isPillSelected('momentoConsumo', t.name)
                            ? 'bg-[#005667] text-white border-[#005667]'
                            : 'bg-white border-gray-200 text-gray-700 hover:border-[#005667]'
                        }`}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className={labelClass}>Allergeni</label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {(taxTerms['pa_allergeni'] || []).map((t) => (
                    <button
                      key={t.slug}
                      type="button"
                      onClick={() => togglePill('allergeni', t.name)}
                      className={`rounded-full px-3 py-1.5 text-[12px] border transition-colors ${
                        isPillSelected('allergeni', t.name)
                          ? 'bg-[#005667] text-white border-[#005667]'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-[#005667]'
                      }`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Territorio & Vigneto ──────────── */}
          {subStep === 3 && (
            <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
              <h3 className="text-sm font-bold text-[#005667] mb-2">Territorio &amp; Vigneto</h3>

              <div>
                <label className={labelClass}>Terreno</label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {(taxTerms['pa_terreno'] || []).map((t) => (
                    <button key={t.slug} type="button" onClick={() => togglePill('terreno', t.name)}
                      className={`rounded-full px-3 py-1.5 text-[12px] border transition-colors ${isPillSelected('terreno', t.name) ? 'bg-[#005667] text-white border-[#005667]' : 'bg-white border-gray-200 text-gray-700 hover:border-[#005667]'}`}>
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Altitudine</label>
                  <select value={form.altitudine} onChange={updateField('altitudine')} className={inputClass}>
                    <option value="">-- Seleziona --</option>
                    {(taxTerms['pa_altitudine-dei-vigneti'] || []).map((t) => (
                      <option key={t.slug} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Densit&agrave; d&apos;impianto</label>
                  <select value={form.densitaImpianto} onChange={updateField('densitaImpianto')} className={inputClass}>
                    <option value="">-- Seleziona --</option>
                    {(taxTerms['pa_densita-dimpianto'] || []).map((t) => (
                      <option key={t.slug} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Zona di produzione</label>
                  <input type="text" value={form.zonaProduzione} onChange={updateField('zonaProduzione')} placeholder="es. Contrada Montanello" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Resa</label>
                  <select value={form.resa} onChange={updateField('resa')} className={inputClass}>
                    <option value="">-- Seleziona --</option>
                    {(taxTerms['pa_resa'] || []).map((t) => (
                      <option key={t.slug} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass}>Raccolta</label>
                <select value={form.raccolta} onChange={updateField('raccolta')} className={inputClass}>
                  <option value="">-- Seleziona --</option>
                  {(taxTerms['pa_raccolta'] || []).map((t) => (
                    <option key={t.slug} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Periodo vendemmia</label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {(taxTerms['pa_periodo-vendemmia'] || []).map((t) => (
                    <button key={t.slug} type="button" onClick={() => togglePill('periodoVendemmia', t.name)}
                      className={`rounded-full px-3 py-1.5 text-[12px] border transition-colors ${isPillSelected('periodoVendemmia', t.name) ? 'bg-[#005667] text-white border-[#005667]' : 'bg-white border-gray-200 text-gray-700 hover:border-[#005667]'}`}>
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Orientamento delle vigne</label>
                  <select value={form.orientamentoVigne} onChange={updateField('orientamentoVigne')} className={inputClass}>
                    <option value="">-- Seleziona --</option>
                    {(taxTerms['pa_orientamento-delle-vigne'] || []).map((t) => (
                      <option key={t.slug} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Tipo di vigneto</label>
                  <select value={form.tipoVigneto} onChange={updateField('tipoVigneto')} className={inputClass}>
                    <option value="">-- Seleziona --</option>
                    {(taxTerms['pa_tipo-di-vigneto'] || []).map((t) => (
                      <option key={t.slug} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Bottiglie prodotte</label>
                  <select value={form.bottiglieProdotte} onChange={updateField('bottiglieProdotte')} className={inputClass}>
                    <option value="">-- Seleziona --</option>
                    {(taxTerms['pa_bottiglie-prodotte'] || []).map((t) => (
                      <option key={t.slug} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Certificazioni</label>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {(taxTerms['pa_filosofia'] || []).map((t) => (
                      <button
                        key={t.slug}
                        type="button"
                        onClick={() => togglePill('certificazioni', t.name)}
                        className={`rounded-full px-3 py-1.5 text-[12px] border transition-colors ${
                          isPillSelected('certificazioni', t.name)
                            ? 'bg-[#005667] text-white border-[#005667]'
                            : 'bg-white border-gray-200 text-gray-700 hover:border-[#005667]'
                        }`}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Spumanti section */}
              <div className="pt-3 border-t border-gray-100">
                <h4 className="text-xs font-bold text-gray-500 mb-2">Spumanti</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={labelClass}>Spumantizzazione</label>
                    <select value={form.spumantizzazione} onChange={updateField('spumantizzazione')} className={inputClass}>
                      <option value="">-- Seleziona --</option>
                      {(taxTerms['pa_metodo-produttivo'] || []).map((t) => (
                        <option key={t.slug} value={t.name}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Categoria spumanti</label>
                    <select value={form.categoriaSpumanti} onChange={updateField('categoriaSpumanti')} className={inputClass}>
                      <option value="">-- Seleziona --</option>
                      {(taxTerms['pa_spumantizzazione'] || []).map((t) => (
                        <option key={t.slug} value={t.name}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Dosaggio</label>
                    <select value={form.dosaggio} onChange={updateField('dosaggio')} className={inputClass}>
                      <option value="">-- Seleziona --</option>
                      {(taxTerms['pa_dosaggio'] || []).map((t) => (
                        <option key={t.slug} value={t.name}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 4: Testi & Degustazione ──────────── */}
          {subStep === 4 && (
            <div className="space-y-5">
              {/* Descrizioni */}
              <div className={sectionClass}>
                <h3 className="text-sm font-bold text-[#005667] mb-2">Descrizioni</h3>

                <div>
                  <label className={labelClass}>
                    Descrizione breve
                    <span className="ml-2 text-gray-400 font-normal">
                      {form.descBreve.length}/160
                    </span>
                  </label>
                  <textarea
                    value={form.descBreve}
                    onChange={updateField('descBreve')}
                    maxLength={160}
                    rows={2}
                    className={textareaClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Descrizione lunga</label>
                  <textarea
                    value={form.descLunga}
                    onChange={updateField('descLunga')}
                    rows={4}
                    className={textareaClass}
                  />
                </div>
              </div>

              {/* Degustazione */}
              <div className={sectionClass}>
                <h3 className="text-sm font-bold text-[#005667] mb-2">Degustazione</h3>

                <div>
                  <label className={labelClass}>Alla vista</label>
                  <textarea value={form.allaVista} onChange={updateField('allaVista')} rows={2} className={textareaClass} placeholder="Es. Rosso rubino intenso con riflessi violacei" />
                </div>

                <div>
                  <label className={labelClass}>Al naso</label>
                  <textarea value={form.alNaso} onChange={updateField('alNaso')} rows={2} className={textareaClass} placeholder="Es. Frutti rossi maturi, spezie e vaniglia" />
                </div>

                <div>
                  <label className={labelClass}>Al palato</label>
                  <textarea value={form.alPalato} onChange={updateField('alPalato')} rows={2} className={textareaClass} placeholder="Es. Morbido, tannini setosi, finale lungo" />
                </div>
              </div>

              {/* Produzione */}
              <div className={sectionClass}>
                <h3 className="text-sm font-bold text-[#005667] mb-2">Produzione</h3>

                <div>
                  <label className={labelClass}>Vinificazione</label>
                  <textarea value={form.vinificazione} onChange={updateField('vinificazione')} rows={2} className={textareaClass} placeholder="Es. Fermentazione in acciaio inox a temperatura controllata" />
                </div>

                <div>
                  <label className={labelClass}>Affinamento</label>
                  <textarea value={form.affinamento} onChange={updateField('affinamento')} rows={2} className={textareaClass} placeholder="Es. 12 mesi in barrique di rovere francese" />
                </div>
              </div>

              {/* Google & GTIN */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div>
                  <label className={labelClass}>Categoria Google</label>
                  <select value={form.categoriaGoogle} onChange={updateField('categoriaGoogle')} className={inputClass}>
                    <option value="">-- Seleziona --</option>
                    {(taxTerms['pa_categoria-google'] || []).map((t) => (
                      <option key={t.slug} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>GTIN / EAN</label>
                  <input type="text" value={form.gtin} onChange={updateField('gtin')} placeholder="es. 8001234567890" className={inputClass} />
                </div>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-3">
            {subStep === 1 ? (
              <Link
                href="/vendor/prodotti"
                className="flex-1 h-[48px] rounded-lg font-semibold text-sm border-2 text-gray-600 border-gray-300 bg-white flex items-center justify-center"
              >
                &larr; Annulla
              </Link>
            ) : (
              <button
                onClick={() => setSubStep((subStep - 1) as SubStep)}
                className="flex-1 h-[48px] rounded-lg font-semibold text-sm border-2 text-gray-600 border-gray-300 bg-white"
              >
                &larr; Indietro
              </button>
            )}

            <button
              onClick={handleSaveDraft}
              disabled={loading || !form.nome.trim()}
              className="h-[48px] px-5 rounded-lg font-semibold text-sm border-2 border-[#005667] text-[#005667] bg-white disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {loading ? <Spinner /> : (draftId ? 'Aggiorna bozza' : 'Salva bozza')}
            </button>

            {subStep < 4 ? (
              <button
                onClick={() => setSubStep((subStep + 1) as SubStep)}
                className="flex-1 h-[48px] text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2"
                style={{ backgroundColor: PRIMARY }}
              >
                Continua &rarr;
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 h-[48px] text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ backgroundColor: PRIMARY }}
              >
                {loading ? (
                  <>
                    <Spinner /> Invio...
                  </>
                ) : (
                  draftId ? 'Invia \u2192' : 'Invia per approvazione \u2192'
                )}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

/* ── Page Component (Suspense wrapper) ────────────────── */

export default function NuovoProdottoPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-8 h-8 border-2 border-[#005667] border-t-transparent rounded-full animate-spin" />
        <p className="text-[13px] text-[#888]">Preparazione wizard...</p>
      </div>
    }>
      <NuovoProdottoInner />
    </Suspense>
  );
}
