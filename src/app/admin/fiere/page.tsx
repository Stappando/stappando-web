'use client';

import { useState, useCallback } from 'react';

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
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [loginError, setLoginError] = useState('');

  const [form, setForm] = useState<FormData>(initialForm);
  const [loading, setLoading] = useState(false);
  const [alertType, setAlertType] = useState<AlertType>(null);
  const [alertMsg, setAlertMsg] = useState('');

  /* ── Auth ─────────────────────────────────────────────── */

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthed(true);
      setLoginError('');
    } else {
      setLoginError('Password non valida');
    }
  };

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

      if (data.duplicate) {
        setAlertType('duplicate');
        setAlertMsg('Email già presente. Riga aggiunta con segnalazione duplicato.');
      } else {
        setAlertType('success');
        setAlertMsg(`Mail inviata a ${form.email} e contatto salvato!`);
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

  /* ── Login screen ────────────────────────────────────── */

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-white rounded-xl shadow p-8 w-full max-w-sm">
          <h1 className="text-lg font-bold mb-4" style={{ color: PRIMARY }}>
            CRM Fiere &mdash; Login
          </h1>
          {loginError && <p className="text-red-500 text-sm mb-3">{loginError}</p>}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password admin"
            className={inputClass + ' mb-3'}
          />
          <button
            type="submit"
            className="w-full py-2.5 text-white rounded-lg font-semibold text-sm"
            style={{ backgroundColor: PRIMARY }}
          >
            Accedi
          </button>
        </form>
      </div>
    );
  }

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
          {/* Row 1: Nome + Cognome */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Nome *</label>
              <input
                type="text"
                value={form.nome}
                onChange={updateField('nome')}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Cognome *</label>
              <input
                type="text"
                value={form.cognome}
                onChange={updateField('cognome')}
                required
                className={inputClass}
              />
            </div>
          </div>

          {/* Row 2: Email + Telefono */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={updateField('email')}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Telefono</label>
              <input
                type="tel"
                value={form.telefono}
                onChange={updateField('telefono')}
                className={inputClass}
              />
            </div>
          </div>

          {/* Row 3: Azienda/Cantina */}
          <div>
            <label className={labelClass}>Azienda / Cantina *</label>
            <input
              type="text"
              value={form.azienda}
              onChange={updateField('azienda')}
              required
              className={inputClass}
            />
          </div>

          {/* Row 4: Indirizzo + CAP */}
          <div className="grid grid-cols-[1fr_120px] gap-3">
            <div>
              <label className={labelClass}>Indirizzo</label>
              <input
                type="text"
                value={form.indirizzo}
                onChange={updateField('indirizzo')}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>CAP *</label>
              <input
                type="text"
                value={form.cap}
                onChange={updateField('cap')}
                required
                maxLength={5}
                inputMode="numeric"
                className={inputClass}
              />
            </div>
          </div>

          {/* Row 5: Citta + Provincia */}
          <div className="grid grid-cols-[1fr_100px] gap-3">
            <div>
              <label className={labelClass}>Città *</label>
              <input
                type="text"
                value={form.citta}
                onChange={updateField('citta')}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Provincia *</label>
              <input
                type="text"
                value={form.provincia}
                onChange={updateField('provincia')}
                required
                maxLength={2}
                placeholder="es. RM"
                className={inputClass + ' uppercase'}
              />
            </div>
          </div>

          {/* Row 6: Regione */}
          <div>
            <label className={labelClass}>Regione</label>
            <select
              value={form.regione}
              onChange={updateField('regione')}
              className={inputClass}
            >
              <option value="">-- Seleziona regione --</option>
              {REGIONI_ITALIANE.filter(Boolean).map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Row 7: Partita IVA */}
          <div>
            <label className={labelClass}>Partita IVA</label>
            <input
              type="text"
              value={form.partitaIva}
              onChange={updateField('partitaIva')}
              maxLength={11}
              inputMode="numeric"
              className={inputClass}
            />
          </div>

          {/* Row 8: Conosciuto a */}
          <div>
            <label className={labelClass}>Conosciuto a (evento) *</label>
            <input
              type="text"
              value={form.conosciutoA}
              onChange={updateField('conosciutoA')}
              required
              placeholder='es. Vinitaly 2026'
              className={inputClass}
            />
          </div>

          {/* Row 9: Contattato da */}
          <div>
            <label className={labelClass}>Contattato da *</label>
            <input
              type="text"
              value={form.contattatoDa}
              onChange={updateField('contattatoDa')}
              required
              placeholder='es. Roberto'
              className={inputClass}
            />
          </div>

          {/* Row 10: Note */}
          <div>
            <label className={labelClass}>Note</label>
            <textarea
              value={form.note}
              onChange={updateField('note')}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#005667] focus:border-transparent resize-none"
            />
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
