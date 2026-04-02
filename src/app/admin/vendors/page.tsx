'use client';

import { useState } from 'react';

const REGIONI = [
  '', 'Abruzzo', 'Basilicata', 'Calabria', 'Campania', 'Emilia-Romagna',
  'Friuli Venezia Giulia', 'Lazio', 'Liguria', 'Lombardia', 'Marche',
  'Molise', 'Piemonte', 'Puglia', 'Sardegna', 'Sicilia', 'Toscana',
  'Trentino-Alto Adige', 'Umbria', "Valle d'Aosta", 'Veneto',
];

interface ShopData {
  vendorId: number;
  cantinaName: string;
  email: string;
  logo: string;
  banner: string;
  descrizione: string;
  regione: string;
  indirizzo: string;
  termId: string | null;
}

export default function AdminVendorsPage() {
  const [password, setPassword] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [shop, setShop] = useState<ShopData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showAlert = (type: 'success' | 'error', msg: string) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 6000);
  };

  const load = async () => {
    if (!vendorId || !password) return;
    setLoading(true);
    setShop(null);
    try {
      const res = await fetch(`/api/admin/vendor/shop?vendorId=${vendorId}&adminPassword=${encodeURIComponent(password)}`);
      if (res.ok) {
        const data = await res.json();
        setShop(data);
      } else {
        const err = await res.json().catch(() => ({}));
        showAlert('error', err.error || `Errore ${res.status}`);
      }
    } catch {
      showAlert('error', 'Errore di rete');
    }
    setLoading(false);
  };

  const save = async () => {
    if (!shop) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/vendor/shop', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminPassword: password,
          vendorId: shop.vendorId,
          logo: shop.logo,
          banner: shop.banner,
          descrizione: shop.descrizione,
          regione: shop.regione,
          indirizzo: shop.indirizzo,
        }),
      });
      if (res.ok) {
        showAlert('success', `Negozio di ${shop.cantinaName} aggiornato! (term: ${shop.termId || 'N/A'})`);
      } else {
        const err = await res.json().catch(() => ({}));
        showAlert('error', err.error || `Errore ${res.status}`);
      }
    } catch {
      showAlert('error', 'Errore di rete');
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-[#f8f6f1] p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-[#1a1a1a] mb-6">Admin — Negozio Vendor</h1>

        {alert && (
          <div className={`rounded-xl p-4 mb-6 border text-sm font-medium ${
            alert.type === 'success'
              ? 'bg-[#065f46] border-[#065f46] text-white'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {alert.msg}
          </div>
        )}

        {/* Auth + vendor ID */}
        <div className="bg-white border border-[#e8e4dc] rounded-xl p-6 mb-6">
          <p className="text-[11px] font-bold text-[#005667] uppercase tracking-wider mb-4">Seleziona vendor</p>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[12px] font-semibold text-[#888] mb-1.5">Admin Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 px-4 text-[14px] border border-[#e5e5e5] rounded-lg focus:outline-none focus:border-[#005667] w-full"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[#888] mb-1.5">Vendor ID (WC customer ID)</label>
              <input
                type="number"
                value={vendorId}
                onChange={e => setVendorId(e.target.value)}
                placeholder="Es. 1234"
                className="h-11 px-4 text-[14px] border border-[#e5e5e5] rounded-lg focus:outline-none focus:border-[#005667] w-full"
              />
            </div>
          </div>
          <button
            onClick={load}
            disabled={loading || !vendorId || !password}
            className="bg-[#005667] text-white rounded-lg px-6 py-2.5 text-[14px] font-semibold hover:bg-[#004555] disabled:opacity-50"
          >
            {loading ? 'Caricamento...' : 'Carica dati vendor'}
          </button>
        </div>

        {/* Edit form */}
        {shop && (
          <div className="space-y-5">
            {/* Info */}
            <div className="bg-[#e8f4f6] border border-[#005667]/20 rounded-xl p-4 text-[13px] text-[#005667]">
              <strong>{shop.cantinaName}</strong> — {shop.email}
              {shop.termId && <span className="ml-2 text-[#888]">(term ID: {shop.termId})</span>}
            </div>

            {/* Logo */}
            <div className="bg-white border border-[#e8e4dc] rounded-xl p-6">
              <p className="text-[11px] font-bold text-[#005667] uppercase tracking-wider mb-3">Logo (URL)</p>
              <input
                type="url"
                value={shop.logo}
                onChange={e => setShop({ ...shop, logo: e.target.value })}
                placeholder="https://..."
                className="h-11 px-4 text-[13px] border border-[#e5e5e5] rounded-lg focus:outline-none focus:border-[#005667] w-full mb-3"
              />
              {shop.logo && (
                <img src={shop.logo} alt="Logo preview" className="w-20 h-20 object-contain rounded-lg border border-[#e8e4dc]" />
              )}
            </div>

            {/* Banner */}
            <div className="bg-white border border-[#e8e4dc] rounded-xl p-6">
              <p className="text-[11px] font-bold text-[#005667] uppercase tracking-wider mb-3">Banner (URL)</p>
              <input
                type="url"
                value={shop.banner}
                onChange={e => setShop({ ...shop, banner: e.target.value })}
                placeholder="https://..."
                className="h-11 px-4 text-[13px] border border-[#e5e5e5] rounded-lg focus:outline-none focus:border-[#005667] w-full mb-3"
              />
              {shop.banner && (
                <img src={shop.banner} alt="Banner preview" className="w-full max-h-32 object-cover rounded-lg border border-[#e8e4dc]" />
              )}
            </div>

            {/* Regione + Indirizzo */}
            <div className="bg-white border border-[#e8e4dc] rounded-xl p-6">
              <p className="text-[11px] font-bold text-[#005667] uppercase tracking-wider mb-4">Dove si trova</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-[#888] mb-1.5">Regione</label>
                  <select
                    value={shop.regione}
                    onChange={e => setShop({ ...shop, regione: e.target.value })}
                    className="h-11 px-4 text-[14px] border border-[#e5e5e5] rounded-lg focus:outline-none focus:border-[#005667] w-full bg-white"
                  >
                    <option value="">— Seleziona —</option>
                    {REGIONI.filter(Boolean).map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#888] mb-1.5">Indirizzo</label>
                  <input
                    type="text"
                    value={shop.indirizzo}
                    onChange={e => setShop({ ...shop, indirizzo: e.target.value })}
                    placeholder="Via, CAP Città"
                    className="h-11 px-4 text-[14px] border border-[#e5e5e5] rounded-lg focus:outline-none focus:border-[#005667] w-full"
                  />
                </div>
              </div>
            </div>

            {/* Descrizione */}
            <div className="bg-white border border-[#e8e4dc] rounded-xl p-6">
              <p className="text-[11px] font-bold text-[#005667] uppercase tracking-wider mb-3">Descrizione cantina</p>
              <textarea
                value={shop.descrizione}
                onChange={e => setShop({ ...shop, descrizione: e.target.value })}
                rows={5}
                maxLength={2000}
                placeholder="Storia, filosofia, valori..."
                className="w-full px-4 py-3 text-[14px] border border-[#e5e5e5] rounded-lg resize-none focus:outline-none focus:border-[#005667]"
              />
              <p className="text-[11px] text-[#aaa] mt-1 text-right">{shop.descrizione.length}/2000</p>
            </div>

            {/* Save */}
            <button
              onClick={save}
              disabled={saving}
              className="w-full bg-[#005667] text-white rounded-xl py-4 text-[15px] font-bold hover:bg-[#004555] disabled:opacity-50"
            >
              {saving ? 'Salvataggio...' : `Salva negozio di ${shop.cantinaName}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
