'use client';

import { useState, useCallback, useEffect } from 'react';

/* ── Constants ─────────────────────────────────────────── */

const ADMIN_PASSWORD = 'stappando2026';
const PRIMARY = '#005667';
const GOLD = '#d9c39a';

const REGIONI_ITALIANE = [
  '', 'Abruzzo', 'Basilicata', 'Calabria', 'Campania', 'Emilia-Romagna',
  'Friuli Venezia Giulia', 'Lazio', 'Liguria', 'Lombardia', 'Marche',
  'Molise', 'Piemonte', 'Puglia', 'Sardegna', 'Sicilia', 'Toscana',
  'Trentino-Alto Adige', 'Umbria', "Valle d'Aosta", 'Veneto',
] as const;

interface FormData {
  nome: string;
  cognome: string;
  email: string;
  telefono: string;
  azienda: string;
  indirizzo: string;
  cap: string;
  citta: string;
  provincia: string;
  regione: string;
  partitaIva: string;
  conosciutoA: string;
  contattatoDa: string;
  note: string;
}

const initialForm: FormData = {
  nome: '',
  cognome: '',
  email: '',
  telefono: '',
  azienda: '',
  indirizzo: '',
  cap: '',
  citta: '',
  provincia: '',
  regione: '',
  partitaIva: '',
  conosciutoA: '',
  contattatoDa: '',
  note: '',
};

type AlertType = 'success' | 'duplicate' | 'error' | null;

/* ── Page Component ────────────────────────────────────── */

export default function FierePage() {
  const [authed] = useState(true);

  const [form, setForm] = useState<FormData>(initialForm);
  const [loading, setLoading] = useState(false);
  const [alertType, setAlertType] = useState<AlertType>(null);
  const [alertMsg, setAlertMsg] = useState('');

  /* ── Form helpers ────────────────────────────────────── */

  const updateField = useCallback(
    (field: keyof FormData) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
      },
    [],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertType(null);
    setAlertMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/fiere', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': ADMIN_PASSWORD,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setAlertType('error');
        setAlertMsg(data.error || 'Errore sconosciuto');
        return;
      }

      if (data.iscritto) {
        setAlertType('duplicate');
        setAlertMsg(`⛔ ${form.email} è già iscritto a Stappando. Mail NON inviata. Riga duplicato aggiunta.`);
      } else if (data.duplicate) {
        setAlertType('duplicate');
        setAlertMsg(`⚠️ Email già presente. Mail inviata e riga duplicato aggiunta.`);
      } else {
        setAlertType('success');
        setAlertMsg(`✓ Mail inviata a ${form.email} e contatto salvato!`);
      }

      // Reset form but keep conosciutoA and contattatoDa
      setForm((prev) => ({
        ...initialForm,
        conosciutoA: prev.conosciutoA,
        contattatoDa: prev.contattatoDa,
      }));
    } catch (err) {
      setAlertType('error');
      setAlertMsg(err instanceof Error ? err.message : 'Errore di rete');
    } finally {
      setLoading(false);
    }
  };

  /* ── Shared input styles ─────────────────────────────── */

  const inputClass =
    'w-full h-[44px] px-3 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#005667] focus:border-transparent';
  const labelClass = 'block text-xs font-semibold text-gray-600 mb-1';

  /* ── Main form ───────────────────────────────────────── */

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 shadow-sm" style={{ backgroundColor: PRIMARY }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-white font-bold text-base">CRM Fiere</h1>
          <span className="text-xs" style={{ color: GOLD }}>
            Stappando
          </span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Alert */}
        {alertType && (
          <div
            className={`mb-5 p-3 rounded-lg text-sm font-medium ${
              alertType === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : alertType === 'duplicate'
                  ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {alertType === 'success' && '\u2713 '}
            {alertType === 'duplicate' && '\u26A0\uFE0F '}
            {alertMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* EMAIL — big, prominent, first field */}
          <div>
            <label className="block text-sm font-bold text-[#005667] mb-1">Email produttore</label>
            <input
              type="email"
              value={form.email}
              onChange={updateField('email')}
              required
              autoFocus
              placeholder="email@cantina.it"
              className="w-full h-[56px] px-4 rounded-xl border-2 border-[#005667] text-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#d9c39a] focus:border-[#005667]"
            />
          </div>

          {/* Conosciuto a + Contattato da — pre-filled, sticky */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Conosciuto a</label>
              <input type="text" value={form.conosciutoA} onChange={updateField('conosciutoA')} placeholder="es. Vinitaly 2026" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Contattato da</label>
              <input type="text" value={form.contattatoDa} onChange={updateField('contattatoDa')} placeholder="es. Roberto" className={inputClass} />
            </div>
          </div>

          {/* Azienda + Contatto */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Azienda / Cantina</label>
              <input type="text" value={form.azienda} onChange={updateField('azienda')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Nome contatto</label>
              <input type="text" value={form.nome} onChange={updateField('nome')} placeholder="Nome Cognome" className={inputClass} />
            </div>
          </div>

          {/* Telefono */}
          <div>
            <label className={labelClass}>Telefono</label>
            <input type="tel" value={form.telefono} onChange={updateField('telefono')} className={inputClass} />
          </div>

          {/* Collapsible extra fields */}
          <details className="group">
            <summary className="cursor-pointer text-xs font-semibold text-[#005667] flex items-center gap-1">
              <span className="group-open:rotate-90 transition-transform">▶</span>
              Altri dati (opzionali)
            </summary>
            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-[1fr_100px] gap-3">
                <div>
                  <label className={labelClass}>Indirizzo</label>
                  <input type="text" value={form.indirizzo} onChange={updateField('indirizzo')} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>CAP</label>
                  <input type="text" value={form.cap} onChange={updateField('cap')} maxLength={5} inputMode="numeric" className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-[1fr_80px] gap-3">
                <div>
                  <label className={labelClass}>Città</label>
                  <input type="text" value={form.citta} onChange={updateField('citta')} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Prov.</label>
                  <input type="text" value={form.provincia} onChange={updateField('provincia')} maxLength={2} placeholder="RM" className={inputClass + ' uppercase'} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Regione</label>
                <select value={form.regione} onChange={updateField('regione')} className={inputClass}>
                  <option value="">-- Seleziona --</option>
                  {REGIONI_ITALIANE.filter(Boolean).map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Partita IVA</label>
                <input type="text" value={form.partitaIva} onChange={updateField('partitaIva')} maxLength={11} inputMode="numeric" className={inputClass} />
              </div>
            </div>
          </details>

          {/* Note */}
          <div>
            <label className={labelClass}>Note</label>
            <textarea value={form.note} onChange={updateField('note')} rows={2} placeholder="Appunti veloci..." className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#005667] focus:border-transparent resize-none" />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-[48px] text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ backgroundColor: PRIMARY }}
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Invio in corso...
              </>
            ) : (
              'Invia & Salva'
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
