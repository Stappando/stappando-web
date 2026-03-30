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
  'Distillati',
  'Liquori',
  'Birre',
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
  const [searchName, setSearchName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<ProductData>(emptyProduct);
  const [foundFields, setFoundFields] = useState<string[]>([]);
  const [createResult, setCreateResult] = useState<CreateResult | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);

  // Fetch vendors on mount
  useEffect(() => {
    fetch('/api/vendor/products?listVendors=1')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (Array.isArray(data)) setVendors(data);
      })
      .catch(() => {});
    // Fallback: add Stappando Enoteca as default
    setVendors([{ id: 0, name: 'Stappando Enoteca (default)' }]);
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
    setSearchName('');
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
        body: JSON.stringify({ name: searchName.trim() }),
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
            <div className="text-center py-8">
              <h2 className="text-xl font-bold text-gray-800 mb-2">Cerca un vino</h2>
              <p className="text-sm text-gray-500">
                Inserisci il nome del vino e cercheremo automaticamente le informazioni
              </p>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Nome del vino..."
                autoFocus
                className="flex-1 h-[56px] px-4 rounded-xl border-2 border-[#005667] text-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#d9c39a] focus:border-[#005667]"
              />
              <button
                onClick={handleSearch}
                disabled={loading || !searchName.trim()}
                className="h-[56px] px-6 text-white rounded-xl font-semibold text-sm disabled:opacity-60 whitespace-nowrap"
                style={{ backgroundColor: PRIMARY }}
              >
                {loading ? <Spinner /> : '\uD83D\uDD0D Cerca info'}
              </button>
            </div>

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

              <div>
                <label className={labelClass}>Produttore {dot('produttore')}</label>
                <input type="text" value={form.produttore} onChange={updateField('produttore')} className={inputClass} />
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
                  <input type="text" value={form.formato} onChange={updateField('formato')} className={inputClass} />
                </div>
              </div>
            </div>

            {/* SEZIONE CLASSIFICAZIONE */}
            <div className={sectionClass}>
              <h3 className="text-sm font-bold text-[#005667] mb-2">Classificazione</h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Denominazione {dot('denominazione')}</label>
                  <input type="text" value={form.denominazione} onChange={updateField('denominazione')} placeholder="DOCG, DOC, IGT..." className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Gradazione alcolica {dot('gradazione')}</label>
                  <input type="text" value={form.gradazione} onChange={updateField('gradazione')} placeholder="es. 14%" className={inputClass} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Regione {dot('regione')}</label>
                  <input type="text" value={form.regione} onChange={updateField('regione')} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Nazione {dot('nazione')}</label>
                  <input type="text" value={form.nazione} onChange={updateField('nazione')} className={inputClass} />
                </div>
              </div>

              <div>
                <label className={labelClass}>Uvaggio {dot('uvaggio')}</label>
                <input type="text" value={form.uvaggio} onChange={updateField('uvaggio')} placeholder="Uve separate da virgola" className={inputClass} />
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
                <input type="text" value={form.abbinamenti} onChange={updateField('abbinamenti')} placeholder="Separati da virgola" className={inputClass} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Temperatura di servizio {dot('temperaturaServizio')}</label>
                  <input type="text" value={form.temperaturaServizio} onChange={updateField('temperaturaServizio')} placeholder="es. 16-18 C" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Momento di consumo {dot('momentoConsumo')}</label>
                  <input type="text" value={form.momentoConsumo} onChange={updateField('momentoConsumo')} className={inputClass} />
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
                <input type="text" value={form.allergeni} onChange={updateField('allergeni')} className={inputClass} />
              </div>
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
                  'Crea bozza su WooCommerce \u2192'
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
