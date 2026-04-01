'use client';

import { useState, useCallback, useEffect } from 'react';

/* ── Constants ─────────────────────────────────────────── */

const PRIMARY = '#005667';
const GOLD = '#d9c39a';

const CATEGORIE = [
  '',
  'Vini Rossi',
  'Vini Bianchi',
  'Vini Rosati',
  'Bollicine',
  'Spumanti',
  'Prosecco',
  'Champagne',
  'Distillati',
  'Liquori',
  'Birre',
  'Vini',
] as const;

/* ── Types ─────────────────────────────────────────────── */

interface Vendor {
  id: number;
  name: string;
}

interface ProductData {
  nome: string;
  produttore: string;
  vendorId: string;
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
  vendemmia: string;
  bottiglieProdotte: string;
  raccolta: string;
  densitaImpianto: string;
  spumantizzazione: string;
  categoriaSpumanti: string;
  dosaggio: string;
  orientamentoVigne: string;
  tipoVigneto: string;
  periodoVendemmia: string;
  categoriaGoogle: string;
  gtin: string;
  menuOrder: string;
  certificazioni: string;
  tags: string;
}

interface SearchResult {
  data: Partial<ProductData>;
  foundFields: string[];
}

interface CreateResult {
  success: boolean;
  productId: number;
  editUrl: string;
}

const emptyProduct: ProductData = {
  nome: '',
  produttore: '',
  vendorId: '',
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
  vendemmia: '',
  bottiglieProdotte: '',
  raccolta: '',
  densitaImpianto: '',
  spumantizzazione: '',
  categoriaSpumanti: '',
  dosaggio: '',
  orientamentoVigne: '',
  tipoVigneto: '',
  periodoVendemmia: '',
  categoriaGoogle: '',
  gtin: '',
  menuOrder: '',
  certificazioni: '',
  tags: '',
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

/* ── Page Component ────────────────────────────────────── */

export default function ProdottiPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [subStep, setSubStep] = useState<SubStep>(1);
  const [searchName, setSearchName] = useState('');
  const [techText, setTechText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<ProductData>(emptyProduct);
  const [foundFields, setFoundFields] = useState<string[]>([]);
  const [createResult, setCreateResult] = useState<CreateResult | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);

  const [producers, setProducers] = useState<{ name: string; slug: string }[]>([]);
  const [newUvaggio, setNewUvaggio] = useState('');
  const [wcTags, setWcTags] = useState<{ name: string; slug: string }[]>([]);
  const [wcCategories, setWcCategories] = useState<{ id: number; name: string; children: { id: number; name: string }[] }[]>([]);
  const [producerSearch, setProducerSearch] = useState('');
  const [producerOpen, setProducerOpen] = useState(false);

  // Taxonomy terms state
  const [taxTerms, setTaxTerms] = useState<Record<string, { name: string; slug: string }[]>>({});

  // Fetch vendors + producers on mount
  useEffect(() => {
    // Fetch all vendors from WCFM
    setVendors([{ id: 0, name: 'Stappando Enoteca (default)' }]);
    fetch('/api/admin/prodotti/vendors')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setVendors([{ id: 0, name: 'Stappando Enoteca (default)' }, ...data]);
        }
      })
      .catch(() => {});

    // Fetch ALL producers (including empty ones) from WC API via our proxy
    fetch('/api/vendor/taxonomies?slug=pa_produttore&per_page=200')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setProducers(list.map((p: { name: string; slug: string }) => ({ name: p.name, slug: p.slug })).sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name)));
      })
      .catch(() => {
        // Fallback to producer-logos endpoint
        fetch('https://stappando.it/wp-json/stp-app/v1/producer-logos')
          .then(r => r.ok ? r.json() : [])
          .then(data => {
            const list = Array.isArray(data) ? data : [];
            setProducers(list.map((p: { name: string; slug: string }) => ({ name: p.name, slug: p.slug })).sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name)));
          })
          .catch(() => {});
      });
  }, []);

  // Fetch WC product tags + categories
  useEffect(() => {
    fetch('/api/admin/prodotti/tags')
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setWcTags(data); })
      .catch(() => {});
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
      'pa_categoria-google',
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

  const isFound = (field: string) => foundFields.includes(field);

  const resetAll = () => {
    setStep(1);
    setSubStep(1);
    setSearchName('');
    setTechText('');
    setForm(emptyProduct);
    setFoundFields([]);
    setCreateResult(null);
    setError('');
  };

  /* ── Step 1: Search ─────────────────────────────────── */

  const handleSearch = async () => {
    if (!searchName.trim()) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/prodotti/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: searchName.trim(), text: techText.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Errore sconosciuto' }));
        throw new Error(data.error || `Errore ${res.status}`);
      }

      const result: SearchResult = await res.json();
      const merged = { ...emptyProduct, ...result.data, nome: result.data.nome || searchName.trim() };
      setForm(merged);
      setFoundFields(result.foundFields || []);
      setSubStep(1);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore di rete');
    } finally {
      setLoading(false);
    }
  };

  /* ── Step 3: Create ─────────────────────────────────── */

  const handleCreate = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/prodotti/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Errore sconosciuto' }));
        throw new Error(data.error || `Errore ${res.status}`);
      }

      const result: CreateResult = await res.json();
      setCreateResult(result);
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore di rete');
    } finally {
      setLoading(false);
    }
  };

  /* ── Taxonomy helpers ───────────────────────────────── */

  // Toggle a value in a comma-separated form field
  const togglePill = (field: keyof ProductData, value: string) => {
    setForm((prev) => {
      const current = prev[field]
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [field]: next.join(', ') };
    });
  };

  const isPillSelected = (field: keyof ProductData, value: string) => {
    return form[field]
      .split(',')
      .map((s) => s.trim())
      .includes(value);
  };

  /* ── Styles ─────────────────────────────────────────── */

  const inputClass =
    'w-full h-[44px] px-3 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#005667] focus:border-transparent';
  const textareaClass =
    'w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#005667] focus:border-transparent resize-none';
  const labelClass = 'block text-xs font-semibold text-gray-600 mb-1';
  const sectionClass = 'bg-white rounded-xl border border-gray-200 p-4 space-y-3';

  const dot = (field: string) => (
    <span className={`inline-block w-2 h-2 rounded-full ml-1 ${isFound(field) ? 'bg-green-500' : 'bg-gray-300'}`} />
  );

  /* ── Render ─────────────────────────────────────────── */

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 shadow-sm" style={{ backgroundColor: PRIMARY }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-white font-bold text-base">Crea Prodotto</h1>
          <span className="text-xs" style={{ color: GOLD }}>
            Stappando
          </span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Error banner */}
        {error && (
          <div className="mb-5 p-3 rounded-lg text-sm font-medium bg-red-50 text-red-800 border border-red-200">
            {error}
          </div>
        )}

        {/* ── STEP 1: Search ──────────────────────────── */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Nome del vino *</label>
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="es. Le Grane Colli Maceratesi Ribona DOC 2022"
                autoFocus
                className="w-full h-[52px] px-4 rounded-xl border-2 border-[#005667] text-base bg-white focus:outline-none focus:ring-2 focus:ring-[#d9c39a]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Scheda tecnica / descrizione (opzionale)</label>
              <textarea
                value={techText}
                onChange={(e) => setTechText(e.target.value)}
                rows={6}
                placeholder="Incolla qui la scheda tecnica, il testo dal sito del produttore, o qualsiasi info sul vino..."
                className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#005667] resize-y"
              />
              <p className="text-[10px] text-gray-400 mt-1">Più info incolli, più campi verranno compilati automaticamente</p>
            </div>

            <button
              onClick={handleSearch}
              disabled={loading || !searchName.trim()}
              className="w-full h-[52px] text-white rounded-xl font-semibold text-sm disabled:opacity-60"
              style={{ backgroundColor: PRIMARY }}
            >
              {loading ? <Spinner /> : 'Analizza e compila scheda'}
            </button>

            {loading && (
              <div className="text-center py-4">
                <div className="inline-flex items-center gap-2 text-sm text-gray-600">
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Cercando informazioni su &ldquo;{searchName}&rdquo;...
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2: 4-step Wizard ──────────────────── */}
        {step === 2 && (
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

            {/* ── Sub-step 2A: Base ──────────────────── */}
            {subStep === 1 && (
              <div className={sectionClass}>
                <h3 className="text-sm font-bold text-[#005667] mb-2">Base</h3>

                <div>
                  <label className={labelClass}>Nome prodotto {dot('nome')}</label>
                  <input type="text" value={form.nome} onChange={updateField('nome')} className={inputClass} />
                </div>

                <div className="relative">
                  <label className={labelClass}>Produttore {dot('produttore')}</label>
                  <input
                    type="text"
                    value={form.produttore}
                    onChange={(e) => {
                      setForm((prev) => ({ ...prev, produttore: e.target.value }));
                      setProducerSearch(e.target.value);
                      setProducerOpen(true);
                    }}
                    onFocus={() => setProducerOpen(true)}
                    placeholder="Cerca o seleziona produttore..."
                    className={inputClass}
                  />
                  {producerOpen && (() => {
                    const q = (producerSearch || form.produttore).toLowerCase();
                    const filtered = q.length > 0
                      ? producers.filter((p) => p.name.toLowerCase().includes(q))
                      : producers;
                    if (filtered.length === 0) return null;
                    return (
                      <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filtered.map((p) => (
                          <button
                            key={p.slug}
                            type="button"
                            onClick={() => {
                              setForm((prev) => ({ ...prev, produttore: p.name }));
                              setProducerSearch('');
                              setProducerOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-50 last:border-0"
                          >
                            {p.name}
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                <div>
                  <label className={labelClass}>Vendor / Negozio</label>
                  <select value={form.vendorId} onChange={updateField('vendorId')} className={inputClass}>
                    <option value="">Stappando Enoteca (default)</option>
                    {vendors.filter(v => v.id > 0).map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>SKU</label>
                  <input type="text" value={form.sku} onChange={updateField('sku')} placeholder="Codice prodotto" className={inputClass} />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={labelClass}>Prezzo &euro; *</label>
                    <input type="text" value={form.prezzo} onChange={updateField('prezzo')} placeholder="es. 12.50" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Prezzo scontato &euro;</label>
                    <input type="text" value={form.prezzoScontato} onChange={updateField('prezzoScontato')} placeholder="es. 9.90" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Giacenza *</label>
                    <input type="number" value={form.giacenza} onChange={updateField('giacenza')} placeholder="es. 100" className={inputClass} />
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
                    <label className={labelClass}>Annata {dot('annata')}</label>
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

            {/* ── Sub-step 2B: Classificazione ──────── */}
            {subStep === 2 && (
              <div className={sectionClass}>
                <h3 className="text-sm font-bold text-[#005667] mb-2">Classificazione</h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Denominazione {dot('denominazione')}</label>
                    <select value={form.denominazione} onChange={updateField('denominazione')} className={inputClass}>
                      <option value="">-- Seleziona --</option>
                      {(taxTerms['pa_denominazione'] || []).map((t) => (
                        <option key={t.slug} value={t.name}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Gradazione alcolica {dot('gradazione')}</label>
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
                    <label className={labelClass}>Regione {dot('regione')}</label>
                    <select value={form.regione} onChange={updateField('regione')} className={inputClass}>
                      <option value="">-- Seleziona --</option>
                      {(taxTerms['pa_regione'] || []).map((t) => (
                        <option key={t.slug} value={t.name}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Nazione {dot('nazione')}</label>
                    <input type="text" value={form.nazione} onChange={updateField('nazione')} className={inputClass} />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Uvaggio {dot('uvaggio')}</label>
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
                  <label className={labelClass}>Abbinamenti {dot('abbinamenti')}</label>
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
                    <label className={labelClass}>Temperatura di servizio {dot('temperaturaServizio')}</label>
                    <select value={form.temperaturaServizio} onChange={updateField('temperaturaServizio')} className={inputClass}>
                      <option value="">-- Seleziona --</option>
                      {(taxTerms['pa_temperatura-di-servizio'] || []).map((t) => (
                        <option key={t.slug} value={t.name}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Momento di consumo {dot('momentoConsumo')}</label>
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

            {/* ── Sub-step 2C: Territorio & Vigneto ─── */}
            {subStep === 3 && (
              <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
                <h3 className="text-sm font-bold text-[#005667] mb-2">Territorio &amp; Vigneto</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className={labelClass}>Terreno {dot('terreno')}</label>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {(taxTerms['pa_terreno'] || []).map((t) => (
                        <button key={t.slug} type="button" onClick={() => togglePill('terreno', t.name)}
                          className={`rounded-full px-3 py-1.5 text-[12px] border transition-colors ${isPillSelected('terreno', t.name) ? 'bg-[#005667] text-white border-[#005667]' : 'bg-white border-gray-200 text-gray-700 hover:border-[#005667]'}`}>
                          {t.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Altitudine {dot('altitudine')}</label>
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
                    <label className={labelClass}>Zona di produzione {dot('zonaProduzione')}</label>
                    <input type="text" value={form.zonaProduzione} onChange={updateField('zonaProduzione')} placeholder="es. Contrada Montanello" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Resa {dot('resa')}</label>
                    <select value={form.resa} onChange={updateField('resa')} className={inputClass}>
                      <option value="">-- Seleziona --</option>
                      {(taxTerms['pa_resa'] || []).map((t) => (
                        <option key={t.slug} value={t.name}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Raccolta {dot('raccolta')}</label>
                  <select value={form.raccolta} onChange={updateField('raccolta')} className={inputClass}>
                    <option value="">-- Seleziona --</option>
                    {(taxTerms['pa_raccolta'] || []).map((t) => (
                      <option key={t.slug} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
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
                    <label className={labelClass}>Bottiglie prodotte {dot('bottiglieProdotte')}</label>
                    <select value={form.bottiglieProdotte} onChange={updateField('bottiglieProdotte')} className={inputClass}>
                      <option value="">-- Seleziona --</option>
                      {(taxTerms['pa_bottiglie-prodotte'] || []).map((t) => (
                        <option key={t.slug} value={t.name}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Certificazioni {dot('certificazioni')}</label>
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
              </div>
            )}

            {/* ── Sub-step 2D: Testi & Degustazione ─── */}
            {subStep === 4 && (
              <div className="space-y-5">
                {/* Descrizioni */}
                <div className={sectionClass}>
                  <h3 className="text-sm font-bold text-[#005667] mb-2">Descrizioni</h3>

                  <div>
                    <label className={labelClass}>
                      Descrizione breve {dot('descBreve')}
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
                    <label className={labelClass}>Descrizione lunga {dot('descLunga')}</label>
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
                    <label className={labelClass}>Alla vista {dot('allaVista')}</label>
                    <textarea value={form.allaVista} onChange={updateField('allaVista')} rows={2} className={textareaClass} />
                  </div>

                  <div>
                    <label className={labelClass}>Al naso {dot('alNaso')}</label>
                    <textarea value={form.alNaso} onChange={updateField('alNaso')} rows={2} className={textareaClass} />
                  </div>

                  <div>
                    <label className={labelClass}>Al palato {dot('alPalato')}</label>
                    <textarea value={form.alPalato} onChange={updateField('alPalato')} rows={2} className={textareaClass} />
                  </div>
                </div>

                {/* Vinificazione & Affinamento */}
                <div className={sectionClass}>
                  <h3 className="text-sm font-bold text-[#005667] mb-2">Produzione</h3>

                  <div>
                    <label className={labelClass}>Vinificazione {dot('vinificazione')}</label>
                    <textarea value={form.vinificazione} onChange={updateField('vinificazione')} rows={2} className={textareaClass} />
                  </div>

                  <div>
                    <label className={labelClass}>Affinamento {dot('affinamento')}</label>
                    <textarea value={form.affinamento} onChange={updateField('affinamento')} rows={2} className={textareaClass} />
                  </div>
                </div>

                {/* Tags */}
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                  <h3 className="text-sm font-bold text-[#005667] mb-2">Tag</h3>
                  <label className={labelClass}>Tag {dot('tags')}</label>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {wcTags.map((t) => (
                      <button
                        key={t.slug}
                        type="button"
                        onClick={() => togglePill('tags', t.name)}
                        className={`rounded-full px-3 py-1.5 text-[12px] border transition-colors ${
                          isPillSelected('tags', t.name)
                            ? 'bg-[#005667] text-white border-[#005667]'
                            : 'bg-white border-gray-200 text-gray-700 hover:border-[#005667]'
                        }`}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Google & Codici + Spumanti */}
                <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
                  <h3 className="text-sm font-bold text-[#005667] mb-2">Google, Codici &amp; Spumanti</h3>
                  <div className="grid grid-cols-2 gap-3">
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
                  <div>
                    <label className={labelClass}>Ordine menu</label>
                    <input type="number" value={form.menuOrder} onChange={updateField('menuOrder')} placeholder="0" className={inputClass} />
                  </div>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex gap-3">
              {subStep === 1 ? (
                <button
                  onClick={resetAll}
                  className="flex-1 h-[48px] rounded-lg font-semibold text-sm border-2 text-gray-600 border-gray-300 bg-white"
                >
                  &larr; Cerca un altro
                </button>
              ) : (
                <button
                  onClick={() => setSubStep((subStep - 1) as SubStep)}
                  className="flex-1 h-[48px] rounded-lg font-semibold text-sm border-2 text-gray-600 border-gray-300 bg-white"
                >
                  &larr; Indietro
                </button>
              )}

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
                  onClick={handleCreate}
                  disabled={loading}
                  className="flex-1 h-[48px] text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ backgroundColor: PRIMARY }}
                >
                  {loading ? (
                    <>
                      <Spinner /> Creando...
                    </>
                  ) : (
                    'Crea bozza su WooCommerce \u2192'
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 3: Confirm ─────────────────────────── */}
        {step === 3 && createResult && (
          <div className="space-y-6 py-8">
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center gap-2 text-sm text-gray-600">
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creando prodotto su WooCommerce...
                </div>
              </div>
            ) : (
              <>
                <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center space-y-3">
                  <div className="text-3xl">&#10003;</div>
                  <h2 className="text-lg font-bold text-green-800">Prodotto creato!</h2>
                  <p className="text-sm text-green-700 font-medium">{form.nome}</p>
                  <a
                    href={createResult.editUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 px-4 py-2 text-sm font-semibold text-white rounded-lg"
                    style={{ backgroundColor: PRIMARY }}
                  >
                    Apri su WooCommerce &rarr;
                  </a>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
                  <p className="text-sm text-yellow-800 font-medium">
                    Ricorda di aggiungere: <strong>prezzo</strong>, <strong>quantit&agrave;</strong> e{' '}
                    <strong>foto</strong>
                  </p>
                </div>

                <button
                  onClick={resetAll}
                  className="w-full h-[48px] text-white rounded-lg font-semibold text-sm"
                  style={{ backgroundColor: PRIMARY }}
                >
                  Crea un altro prodotto
                </button>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
