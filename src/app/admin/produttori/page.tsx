'use client';

import { useState, useEffect, useCallback } from 'react';

const PRIMARY = '#005667';

interface Producer {
  id: number;
  name: string;
  slug: string;
  description: string;
  count: number;
  image: string;
  region: string;
}

interface ProducerForm {
  name: string;
  description: string;
  region: string;
  indirizzo: string;
  logoFile: File | null;
  bannerFile: File | null;
  logoPreview: string;
  bannerPreview: string;
}

const REGIONI = [
  '', 'Abruzzo', 'Basilicata', 'Calabria', 'Campania', 'Emilia-Romagna',
  'Friuli Venezia Giulia', 'Lazio', 'Liguria', 'Lombardia', 'Marche',
  'Molise', 'Piemonte', 'Puglia', 'Sardegna', 'Sicilia', 'Toscana',
  'Trentino-Alto Adige', 'Umbria', "Valle d'Aosta", 'Veneto',
];

const inputClass = 'w-full h-[44px] px-3 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#005667] focus:border-transparent';
const labelClass = 'block text-xs font-semibold text-gray-600 mb-1';

export default function ProduttoriPage() {
  const [producers, setProducers] = useState<Producer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [form, setForm] = useState<ProducerForm>({ name: '', description: '', region: '', indirizzo: '', logoFile: null, bannerFile: null, logoPreview: '', bannerPreview: '' });
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Fetch producers
  const fetchProducers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('https://stappando.it/wp-json/stp-app/v1/producer-logos');
      if (res.ok) {
        const data = await res.json();
        const list: Producer[] = Array.isArray(data) ? data.map((p: Producer, i: number) => ({ ...p, id: p.id || i })) : [];
        setProducers(list.sort((a, b) => a.name.localeCompare(b.name)));
      }
    } catch { /* */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProducers(); }, [fetchProducers]);

  const updateField = useCallback((field: keyof ProducerForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  }, []);

  // Upload image to WP Media
  const uploadImage = async (file: File): Promise<{ id: number; url: string } | null> => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/vendor/media', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        return { id: data.id, url: data.src };
      }
    } catch { /* */ }
    return null;
  };

  const handleCreate = async () => {
    if (!form.name.trim()) { setResult({ type: 'error', msg: 'Nome obbligatorio' }); return; }
    setSaving(true);
    setResult(null);
    try {
      // Upload logo if provided
      let logoUrl = '';
      let logoId = 0;
      if (form.logoFile) {
        const uploaded = await uploadImage(form.logoFile);
        if (uploaded) { logoUrl = uploaded.url; logoId = uploaded.id; }
      }
      let bannerUrl = '';
      let bannerId = 0;
      if (form.bannerFile) {
        const uploaded = await uploadImage(form.bannerFile);
        if (uploaded) { bannerUrl = uploaded.url; bannerId = uploaded.id; }
      }

      const res = await fetch('/api/admin/produttori', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', name: form.name, description: form.description, region: form.region, indirizzo: form.indirizzo, logoId, logoUrl, bannerId, bannerUrl }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ type: 'success', msg: `✓ Produttore "${form.name}" creato!` });
        setForm({ name: '', description: '', region: '', indirizzo: '', logoFile: null, bannerFile: null, logoPreview: '', bannerPreview: '' });
        setMode('list');
        fetchProducers();
      } else {
        setResult({ type: 'error', msg: data.error || 'Errore' });
      }
    } catch { setResult({ type: 'error', msg: 'Errore di rete' }); }
    finally { setSaving(false); }
  };

  const handleEdit = async () => {
    if (!editId) return;
    setSaving(true);
    setResult(null);
    try {
      let logoUrl = '';
      let logoId = 0;
      if (form.logoFile) {
        const uploaded = await uploadImage(form.logoFile);
        if (uploaded) { logoUrl = uploaded.url; logoId = uploaded.id; }
      }
      let bannerUrl = '';
      let bannerId = 0;
      if (form.bannerFile) {
        const uploaded = await uploadImage(form.bannerFile);
        if (uploaded) { bannerUrl = uploaded.url; bannerId = uploaded.id; }
      }

      const res = await fetch('/api/admin/produttori', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', termId: editId, description: form.description, region: form.region, indirizzo: form.indirizzo, logoId, logoUrl, bannerId, bannerUrl }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ type: 'success', msg: `✓ Produttore aggiornato!` });
        setMode('list');
        fetchProducers();
      } else {
        setResult({ type: 'error', msg: data.error || 'Errore' });
      }
    } catch { setResult({ type: 'error', msg: 'Errore di rete' }); }
    finally { setSaving(false); }
  };

  const startEdit = (p: Producer) => {
    setForm({ name: p.name, description: p.description || '', region: p.region || '', indirizzo: '', logoFile: null, bannerFile: null, logoPreview: p.image || '', bannerPreview: '' });
    setEditId(p.id);
    setMode('edit');
    setResult(null);
  };

  const filtered = search ? producers.filter(p => p.name.toLowerCase().includes(search.toLowerCase())) : producers;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 shadow-sm" style={{ backgroundColor: PRIMARY }}>
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-white font-bold text-base">🏭 Produttori / Cantine</h1>
          <span className="text-xs text-white/60">{producers.length} produttori</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Result */}
        {result && (
          <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${result.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {result.msg}
          </div>
        )}

        {/* LIST MODE */}
        {mode === 'list' && (
          <>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cerca produttore..."
                className="flex-1 h-[44px] px-3 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#005667]"
              />
              <button
                onClick={() => { setForm({ name: '', description: '', region: '', indirizzo: '', logoFile: null, bannerFile: null, logoPreview: '', bannerPreview: '' }); setMode('create'); setResult(null); }}
                className="h-[44px] px-5 rounded-lg text-white font-semibold text-sm shrink-0"
                style={{ backgroundColor: PRIMARY }}
              >
                + Nuovo
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-2 border-[#005667]/20 border-t-[#005667] rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map(p => (
                  <button
                    key={p.id || p.slug}
                    onClick={() => startEdit(p)}
                    className="w-full flex items-center gap-3 bg-white rounded-lg border border-gray-100 p-3 hover:border-[#005667]/30 transition-colors text-left"
                  >
                    {p.image ? (
                      <img src={p.image} alt="" className="w-10 h-10 rounded object-contain bg-gray-50 shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center shrink-0">
                        <span className="text-gray-400 text-xs font-bold">{p.name[0]}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
                      <p className="text-[11px] text-gray-400">{p.region || '—'} · {p.count} vini</p>
                    </div>
                    <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                ))}
                {filtered.length === 0 && <p className="text-center text-sm text-gray-400 py-8">Nessun produttore trovato</p>}
              </div>
            )}
          </>
        )}

        {/* CREATE / EDIT MODE */}
        {(mode === 'create' || mode === 'edit') && (
          <div className="space-y-4">
            <button onClick={() => { setMode('list'); setResult(null); }} className="text-sm text-[#005667] font-medium hover:underline">
              ← Torna alla lista
            </button>

            <h2 className="text-lg font-bold text-[#005667]">
              {mode === 'create' ? 'Nuovo produttore' : `Modifica: ${form.name}`}
            </h2>

            <div>
              <label className={labelClass}>Nome produttore *</label>
              <input type="text" value={form.name} onChange={updateField('name')} placeholder="es. Cantina Oddero" className={inputClass} readOnly={mode === 'edit'} />
              {mode === 'edit' && <p className="text-[10px] text-gray-400 mt-1">Il nome non è modificabile da qui. Modificalo da WP Admin → Attributi → Produttore.</p>}
            </div>

            <div>
              <label className={labelClass}>Regione</label>
              <select value={form.region} onChange={updateField('region')} className={inputClass}>
                <option value="">-- Seleziona regione --</option>
                {REGIONI.filter(Boolean).map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div>
              <label className={labelClass}>Indirizzo cantina</label>
              <input type="text" value={form.indirizzo} onChange={updateField('indirizzo')} placeholder="es. Loc. San Pietro, 12060 Barolo (CN)" className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Descrizione</label>
              <textarea
                value={form.description}
                onChange={updateField('description')}
                rows={4}
                placeholder="Descrizione della cantina..."
                className="w-full px-3 py-3 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#005667] focus:border-transparent resize-y"
              />
            </div>

            {/* Logo upload */}
            <div>
              <label className={labelClass}>Logo cantina</label>
              <div className="flex items-center gap-3">
                {(form.logoPreview || form.logoFile) && (
                  <img src={form.logoFile ? URL.createObjectURL(form.logoFile) : form.logoPreview} alt="Logo" className="w-16 h-16 rounded-lg object-contain bg-gray-50 border border-gray-200" />
                )}
                <label className="cursor-pointer px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:border-[#005667] transition-colors">
                  {form.logoFile ? '✓ Logo selezionato' : 'Carica logo'}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setForm(prev => ({ ...prev, logoFile: file, logoPreview: URL.createObjectURL(file) }));
                  }} />
                </label>
              </div>
            </div>

            {/* Banner upload */}
            <div>
              <label className={labelClass}>Banner cantina (opzionale)</label>
              {(form.bannerPreview || form.bannerFile) && (
                <img src={form.bannerFile ? URL.createObjectURL(form.bannerFile) : form.bannerPreview} alt="Banner" className="w-full h-24 rounded-lg object-cover mb-2 border border-gray-200" />
              )}
              <label className="cursor-pointer px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:border-[#005667] transition-colors inline-block">
                {form.bannerFile ? '✓ Banner selezionato' : 'Carica banner'}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setForm(prev => ({ ...prev, bannerFile: file, bannerPreview: URL.createObjectURL(file) }));
                }} />
              </label>
            </div>

            <button
              onClick={mode === 'create' ? handleCreate : handleEdit}
              disabled={saving}
              className="w-full h-[48px] rounded-lg text-white font-semibold text-sm disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ backgroundColor: PRIMARY }}
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Salvataggio...
                </>
              ) : mode === 'create' ? '+ Crea produttore' : '💾 Salva modifiche'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
