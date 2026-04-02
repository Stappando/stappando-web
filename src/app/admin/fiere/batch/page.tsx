'use client';

import { useState, useRef, useCallback } from 'react';

/* ── Constants ─────────────────────────────────────────── */

const ADMIN_PASSWORD = 'stappando2026';
const PRIMARY = '#005667';
const GOLD = '#d9c39a';

/* ── Types ─────────────────────────────────────────────── */

interface CantinaParsed {
  azienda: string;
  email: string;
  regione: string;
  provincia: string;
  contatto: string;
}

interface DetailEntry {
  email: string;
  status: 'sent' | 'duplicate' | 'error';
  message?: string;
}

interface BatchResult {
  sent: number;
  duplicates: number;
  errors: number;
  details: DetailEntry[];
}

type PageState = 'idle' | 'loading' | 'done';

/* ── CSV Parser ─────────────────────────────────────────── */

function parseCSV(text: string): CantinaParsed[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''));

  const colIndex = (names: string[]): number => {
    for (const n of names) {
      const idx = headers.indexOf(n);
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const iAzienda   = colIndex(['nome', 'azienda', 'cantina', 'name']);
  const iEmail     = colIndex(['email', 'e-mail', 'mail']);
  const iRegione   = colIndex(['regione', 'region']);
  const iProvincia = colIndex(['provincia', 'prov', 'province']);
  const iContatto  = colIndex(['contatto', 'referente', 'contact']);

  const result: CantinaParsed[] = [];

  for (let i = 1; i < lines.length; i++) {
    const raw = lines[i];
    if (!raw.trim()) continue;

    // Simple CSV split (handles quoted fields with commas)
    const cols = splitCSVLine(raw);

    const get = (idx: number) => (idx >= 0 ? (cols[idx] || '').trim().replace(/^"|"$/g, '') : '');
    const email = get(iEmail);
    if (!email) continue;

    result.push({
      azienda:   get(iAzienda),
      email,
      regione:   get(iRegione),
      provincia: get(iProvincia),
      contatto:  get(iContatto),
    });
  }

  return result;
}

function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

/* ── Badge ──────────────────────────────────────────────── */

function StatusBadge({ status }: { status: 'sent' | 'duplicate' | 'error' }) {
  const map = {
    sent:      { bg: '#dcfce7', color: '#166534', label: 'Inviata' },
    duplicate: { bg: '#fef9c3', color: '#854d0e', label: 'Duplicata' },
    error:     { bg: '#fee2e2', color: '#991b1b', label: 'Errore' },
  };
  const s = map[status];
  return (
    <span
      style={{ backgroundColor: s.bg, color: s.color }}
      className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full"
    >
      {s.label}
    </span>
  );
}

/* ── Spinner ─────────────────────────────────────────────── */

function Spinner() {
  return (
    <svg
      className="animate-spin h-5 w-5 text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

/* ── Page ────────────────────────────────────────────────── */

export default function BatchPage() {
  const [conosciutoA, setConosciutoA]   = useState('');
  const [contattatoDa, setContattatoDa] = useState('');
  const [cantine, setCantine]           = useState<CantinaParsed[]>([]);
  const [pageState, setPageState]       = useState<PageState>('idle');
  const [result, setResult]             = useState<BatchResult | null>(null);
  const [fileLabel, setFileLabel]       = useState<string>('');
  const fileRef = useRef<HTMLInputElement>(null);

  const inputClass =
    'w-full h-[44px] px-3 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#005667] focus:border-transparent';
  const labelClass = 'block text-xs font-semibold text-gray-600 mb-1';

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileLabel(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);
      setCantine(parsed);
    };
    reader.readAsText(file, 'UTF-8');
  }, []);

  const handleSubmit = async () => {
    if (cantine.length === 0 || pageState === 'loading') return;
    setPageState('loading');
    setResult(null);

    try {
      const res = await fetch('/api/admin/fiere/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': ADMIN_PASSWORD,
        },
        body: JSON.stringify({ cantine, conosciutoA, contattatoDa }),
      });
      const data: BatchResult = await res.json();
      setResult(data);
    } catch (err) {
      setResult({
        sent: 0,
        duplicates: 0,
        errors: cantine.length,
        details: [{ email: '—', status: 'error', message: err instanceof Error ? err.message : 'Errore di rete' }],
      });
    } finally {
      setPageState('done');
    }
  };

  const handleReset = () => {
    setCantine([]);
    setResult(null);
    setPageState('idle');
    setFileLabel('');
    setConosciutoA('');
    setContattatoDa('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const total = cantine.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 shadow-sm" style={{ backgroundColor: PRIMARY }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-white font-bold text-base">Import Batch Cantine</h1>
          <span className="text-xs" style={{ color: GOLD }}>Stappando</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* ── Sezione Impostazioni campagna ── */}
        <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-bold text-gray-700">Impostazioni campagna</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Conosciuto a</label>
              <input
                type="text"
                value={conosciutoA}
                onChange={(e) => setConosciutoA(e.target.value)}
                placeholder="es. Vinitaly 2026"
                className={inputClass}
                disabled={pageState === 'loading'}
              />
            </div>
            <div>
              <label className={labelClass}>Contattato da</label>
              <input
                type="text"
                value={contattatoDa}
                onChange={(e) => setContattatoDa(e.target.value)}
                placeholder="es. Roberto"
                className={inputClass}
                disabled={pageState === 'loading'}
              />
            </div>
          </div>
        </section>

        {/* ── Sezione Import CSV ── */}
        <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-bold text-gray-700">Import CSV</h2>
          <p className="text-xs text-gray-500">
            CSV con colonne: <strong>Nome</strong>, <strong>Email</strong>, <strong>Regione</strong>, <strong>Provincia</strong>, <strong>Contatto</strong> (prima riga = intestazione)
          </p>

          <div>
            <label className={labelClass}>File CSV</label>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleFile}
              disabled={pageState === 'loading'}
              className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#005667] file:text-white hover:file:opacity-90 cursor-pointer"
            />
            {fileLabel && (
              <p className="mt-1 text-xs text-gray-500">{fileLabel}</p>
            )}
          </div>

          {cantine.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-[#005667] mb-2">
                {cantine.length} contatti caricati
              </p>
              <div className="overflow-auto rounded-lg border border-gray-200">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600">
                      <th className="px-3 py-2 text-left font-semibold">Nome</th>
                      <th className="px-3 py-2 text-left font-semibold">Email</th>
                      <th className="px-3 py-2 text-left font-semibold">Regione</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cantine.slice(0, 5).map((c, i) => (
                      <tr key={i} className="border-t border-gray-100">
                        <td className="px-3 py-2 text-gray-700">{c.azienda || '—'}</td>
                        <td className="px-3 py-2 text-gray-700">{c.email}</td>
                        <td className="px-3 py-2 text-gray-500">{c.regione || '—'}</td>
                      </tr>
                    ))}
                    {cantine.length > 5 && (
                      <tr className="border-t border-gray-100">
                        <td colSpan={3} className="px-3 py-2 text-gray-400 italic">
                          ... e altri {cantine.length - 5}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* ── Bottone avvio / loading ── */}
        {pageState !== 'done' && (
          <button
            onClick={handleSubmit}
            disabled={cantine.length === 0 || pageState === 'loading'}
            className="w-full h-[48px] text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ backgroundColor: PRIMARY }}
          >
            {pageState === 'loading' ? (
              <>
                <Spinner />
                Elaborazione in corso... (questo potrebbe richiedere qualche minuto)
              </>
            ) : (
              `Avvia campagna${total > 0 ? ` (${total} contatti)` : ''}`
            )}
          </button>
        )}

        {/* ── Progress bar durante invio ── */}
        {pageState === 'loading' && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-2">
            <p className="text-sm text-gray-600">
              Invio in corso — attendere il completamento...
            </p>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full animate-pulse"
                style={{ width: '100%', backgroundColor: PRIMARY }}
              />
            </div>
          </div>
        )}

        {/* ── Risultato finale ── */}
        {pageState === 'done' && result && (
          <section className="space-y-4">
            {/* Summary card */}
            <div
              className={`rounded-xl border p-5 ${
                result.errors > 0
                  ? 'bg-red-50 border-red-200'
                  : result.duplicates > 0
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-green-50 border-green-200'
              }`}
            >
              <h2 className={`text-sm font-bold mb-3 ${
                result.errors > 0 ? 'text-red-800' : result.duplicates > 0 ? 'text-yellow-800' : 'text-green-800'
              }`}>
                Campagna completata
              </h2>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white rounded-lg p-3 border border-green-200">
                  <div className="text-2xl font-bold text-green-700">{result.sent}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Inviate</div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-yellow-200">
                  <div className="text-2xl font-bold text-yellow-700">{result.duplicates}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Duplicate</div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-red-200">
                  <div className="text-2xl font-bold text-red-700">{result.errors}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Errori</div>
                </div>
              </div>
            </div>

            {/* Details table */}
            {result.details.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700">Dettagli</h3>
                </div>
                <div className="overflow-auto max-h-96">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 text-gray-600">
                        <th className="px-3 py-2 text-left font-semibold">Email</th>
                        <th className="px-3 py-2 text-left font-semibold">Stato</th>
                        <th className="px-3 py-2 text-left font-semibold">Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.details.map((d, i) => (
                        <tr key={i} className="border-t border-gray-100">
                          <td className="px-3 py-2 text-gray-700 font-mono">{d.email}</td>
                          <td className="px-3 py-2">
                            <StatusBadge status={d.status} />
                          </td>
                          <td className="px-3 py-2 text-gray-400">{d.message || ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Reset button */}
            <button
              onClick={handleReset}
              className="w-full h-[44px] rounded-lg font-semibold text-sm border-2 transition-colors"
              style={{ borderColor: PRIMARY, color: PRIMARY, backgroundColor: 'transparent' }}
            >
              Nuova campagna
            </button>
          </section>
        )}
      </main>
    </div>
  );
}
