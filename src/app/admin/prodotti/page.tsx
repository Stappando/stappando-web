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
  esposizione: string;
  altitudine: string;
  zonaProduzione: string;
  resa: string;
  vendemmia: string;
  bottiglieProdotte: string;
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
  esposizione: '',
  altitudine: '',
  zonaProduzione: '',
  resa: '',
  vendemmia: '',
  bottiglieProdotte: '',
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

/* ── Page Component ────────────────────────────────────── */

export default function ProdottiPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [editProductId, setEditProductId] = useState<number | null>(null);
  const [existingSearch, setExistingSearch] = useState('');
  const [existingResults, setExistingResults] = useState<{ id: number; name: string; price: string; image: string; status: string }[]>([]);
  const [searchingExisting, setSearchingExisting] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [techText, setTechText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<ProductData>(emptyProduct);
  const [foundFields, setFoundFields] = useState<string[]>([]);
  const [createResult, setCreateResult] = useState<CreateResult | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);

  const [producers, setProducers] = useState<{ name: string; slug: string }[]>([]);
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
      'pa_certificazioni',
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

  /* ── Search existing products ────────────────────────── */

  const searchExisting = useCallback(async (q: string) => {
    if (q.length < 2) { setExistingResults([]); return; }
    setSearchingExisting(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&per_page=8`);
      if (res.ok) {
        const data = await res.json();
        setExistingResults((data.products || []).map((p: { id: number; name: string; price: string; image: string | null; on_sale: boolean }) => ({
          id: p.id, name: p.name, price: p.price, image: p.image || '', status: p.on_sale ? 'In offerta' : 'Pubblicato',
        })));
      }
    } catch { /* */ }
    finally { setSearchingExisting(false); }
  }, []);

  const loadExistingProduct = useCallback(async (productId: number) => {
    setLoading(true);
    setError('');
    try {
      const wc = await fetch(`/api/admin/prodotti/load?id=${productId}`);
      if (wc.ok) {
        const data = await wc.json();
        setForm({ ...emptyProduct, ...data });
        setFoundFields(Object.keys(data).filter(k => data[k as keyof typeof data]));
        setEditProductId(productId);
        setMode('edit');
        setStep(2);
        setExistingResults([]);
        setExistingSearch('');
      } else {
        setError('Errore caricamento prodotto');
      }
    } catch { setError('Errore di rete'); }
    finally { setLoading(false); }
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
    setMode('create');
    setEditProductId(null);
    setSearchName('');
    setTechText('');
    setExistingSearch('');
    setExistingResults([]);
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
      const url = mode === 'edit' && editProductId
        ? '/api/admin/prodotti/create'
        : '/api/admin/prodotti/create';

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          ...(mode === 'edit' && editProductId ? { updateId: editProductId } : {}),
        }),
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
            {/* Search existing product */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="text-sm font-bold text-[#005667] mb-2">📝 Modifica prodotto esistente</h3>
              <div className="relative">
                <input
                  type="text"
                  value={existingSearch}
                  onChange={(e) => { setExistingSearch(e.target.value); searchExisting(e.target.value); }}
                  placeholder="Cerca per nome..."
                  className="w-full h-[44px] px-3 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#005667]"
                />
                {searchingExisting && <div className="absolute right-3 top-3"><div className="w-4 h-4 border-2 border-[#005667]/20 border-t-[#005667] rounded-full animate-spin" /></div>}
                {existingResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {existingResults.map(p => (
                      <button key={p.id} onClick={() => loadExistingProduct(p.id)} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 text-left border-b border-gray-50 last:border-0">
                        {p.image && <img src={p.image} alt="" className="w-10 h-10 rounded object-cover shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 truncate">{p.name}</p>
                          <p className="text-xs text-gray-400">#{p.id} · {p.price}€ · {p.status}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium">oppure crea nuovo</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

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
              {loading ? <Spinner /> : '🔍 Analizza e compila scheda'}
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

        {/* ── STEP 2: Preview & Edit ──────────────────── */}
        {step === 2 && (
          <div className="space-y-5">
            {/* SEZIONE BASE */}
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

              <div>
                <label className={labelClass}>Categoria</label>
                <select value={form.categoria} onChange={updateField('categoria')} className={inputClass}>
                  <option value="">-- Seleziona --</option>
                  {CATEGORIE.filter(Boolean).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Annata {dot('annata')}</label>
                  <input type="text" value={form.annata} onChange={updateField('annata')} placeholder="es. 2021" className={inputClass} />
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

            {/* SEZIONE CLASSIFICAZIONE */}
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
                  <input type="text" value={form.gradazione} onChange={updateField('gradazione')} placeholder="es. 14%" className={inputClass} />
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
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {(taxTerms['pa_uvaggio'] || []).map((t) => (
                    <button
                      key={t.slug}
                      type="button"
                      onClick={() => togglePill('uvaggio', t.name)}
                      className={`rounded-full px-3 py-1.5 text-[12px] border transition-colors ${
                        isPillSelected('uvaggio', t.name)
                          ? 'bg-[#005667] text-white border-[#005667]'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-[#005667]'
                      }`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    placeholder="Aggiungi uvaggio..."
                    className="flex-1 h-9 px-3 text-[12px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#005667]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = (e.target as HTMLInputElement).value.trim();
                        if (val && !isPillSelected('uvaggio', val)) {
                          togglePill('uvaggio', val);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                    }}
                  />
                  <button type="button" onClick={(e) => {
                    const input = (e.target as HTMLElement).previousElementSibling as HTMLInputElement;
                    const val = input?.value?.trim();
                    if (val && !isPillSelected('uvaggio', val)) {
                      togglePill('uvaggio', val);
                      if (input) input.value = '';
                    }
                  }} className="h-9 px-3 text-[11px] font-semibold bg-[#005667] text-white rounded-lg hover:bg-[#004555]">+ Aggiungi</button>
                </div>
              </div>
            </div>

            {/* SEZIONE DESCRIZIONI */}
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

            {/* SEZIONE DEGUSTAZIONE */}
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

            {/* SEZIONE DETTAGLI */}
            <div className={sectionClass}>
              <h3 className="text-sm font-bold text-[#005667] mb-2">Dettagli</h3>

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
                <label className={labelClass}>Vinificazione {dot('vinificazione')}</label>
                <textarea value={form.vinificazione} onChange={updateField('vinificazione')} rows={2} className={textareaClass} />
              </div>

              <div>
                <label className={labelClass}>Affinamento {dot('affinamento')}</label>
                <textarea value={form.affinamento} onChange={updateField('affinamento')} rows={2} className={textareaClass} />
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

            {/* SEZIONE VIGNETO */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
              <h3 className="text-sm font-bold text-[#005667] mb-2">Vigneto</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Terreno {dot('terreno')}</label>
                  <input type="text" value={form.terreno} onChange={updateField('terreno')} placeholder="es. Argilloso-calcareo" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Esposizione {dot('esposizione')}</label>
                  <input type="text" value={form.esposizione} onChange={updateField('esposizione')} placeholder="es. Sud-Est" className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Altitudine {dot('altitudine')}</label>
                  <input type="text" value={form.altitudine} onChange={updateField('altitudine')} placeholder="es. 350 m s.l.m." className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Zona di produzione {dot('zonaProduzione')}</label>
                  <input type="text" value={form.zonaProduzione} onChange={updateField('zonaProduzione')} placeholder="es. Contrada Montanello" className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Resa {dot('resa')}</label>
                  <input type="text" value={form.resa} onChange={updateField('resa')} placeholder="es. 60 ql/ha" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Vendemmia {dot('vendemmia')}</label>
                  <input type="text" value={form.vendemmia} onChange={updateField('vendemmia')} placeholder="es. Settembre, raccolta manuale" className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Bottiglie prodotte {dot('bottiglieProdotte')}</label>
                  <input type="text" value={form.bottiglieProdotte} onChange={updateField('bottiglieProdotte')} placeholder="es. 5.000" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Certificazioni {dot('certificazioni')}</label>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {(taxTerms['pa_certificazioni'] || []).map((t) => (
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

            {/* TAGS */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="text-sm font-bold text-[#005667] mb-2">Tag</h3>
              <label className={labelClass}>Tag {dot('tags')}</label>
              <input type="text" value={form.tags} onChange={updateField('tags')} placeholder="es. best-seller, occasione" className={inputClass} />
              <p className="text-[10px] text-gray-400 mt-1">Separati da virgola: best-seller, confezione-regalo, circuito, occasione, regali</p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={resetAll}
                className="flex-1 h-[48px] rounded-lg font-semibold text-sm border-2 text-gray-600 border-gray-300 bg-white"
              >
                &larr; Cerca un altro
              </button>
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
                  mode === 'edit' ? 'Aggiorna su WooCommerce \u2192' : 'Crea bozza su WooCommerce \u2192'
                )}
              </button>
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
