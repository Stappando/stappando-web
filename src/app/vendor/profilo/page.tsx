'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';

const REGIONI = [
  'Abruzzo', 'Basilicata', 'Calabria', 'Campania', 'Emilia-Romagna',
  'Friuli Venezia Giulia', 'Lazio', 'Liguria', 'Lombardia', 'Marche',
  'Molise', 'Piemonte', 'Puglia', 'Sardegna', 'Sicilia',
  'Toscana', 'Trentino-Alto Adige', 'Umbria', "Valle d'Aosta", 'Veneto',
];

interface VendorProfile {
  // Anagrafica
  cantina: string;
  nome: string;
  cognome: string;
  telefono: string;
  email: string;
  // Azienda
  ragioneSociale: string;
  piva: string;
  codiceFiscale: string;
  pec: string;
  sdi: string;
  // Sede legale
  indirizzo: string;
  citta: string;
  provincia: string;
  cap: string;
  regione: string;
  // Indirizzo esperienze (opzionale)
  indirizzoEsperienze: string;
  // Bancari
  iban: string;
  intestazioneIban: string;
  // Extra
  sito: string;
}

const EMPTY_PROFILE: VendorProfile = {
  cantina: '', nome: '', cognome: '', telefono: '', email: '',
  ragioneSociale: '', piva: '', codiceFiscale: '', pec: '', sdi: '',
  indirizzo: '', citta: '', provincia: '', cap: '', regione: '',
  indirizzoEsperienze: '',
  iban: '', intestazioneIban: '',
  sito: '',
};

export default function VendorProfiloPage() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<VendorProfile>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveAlert, setSaveAlert] = useState<{ type: 'success' | 'progress'; message: string } | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => { setHydrated(true); }, []);

  useEffect(() => {
    if (!hydrated || !user?.id) return;
    fetch(`/api/vendor/profile?vendorId=${user.id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setProfile(prev => ({ ...prev, ...data }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [hydrated, user?.id]);

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    setSaveAlert(null);
    try {
      const res = await fetch('/api/vendor/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId: user.id, ...profile }),
      });
      if (res.ok) {
        if (missingFields.length === 0) {
          setSaveAlert({ type: 'success', message: 'Profilo completato al 100% — Sei LIVE!' });
        } else if (missingFields.length <= 3) {
          setSaveAlert({ type: 'progress', message: `Salvato! Ancora ${missingFields.length} camp${missingFields.length === 1 ? 'o' : 'i'} e sei live: ${missingFields.map(f => f.label).join(', ')}` });
        } else {
          setSaveAlert({ type: 'progress', message: `Salvato! Mancano ancora ${missingFields.length} campi obbligatori` });
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error('Profile save error:', res.status, errData);
        setSaveAlert({ type: 'progress', message: `Errore nel salvataggio (${res.status}). Riprova.` });
      }
    } catch (err) {
      console.error('Profile save network error:', err);
      setSaveAlert({ type: 'progress', message: 'Errore di rete. Riprova.' });
    }
    setSaving(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setSaveAlert(null), 8000);
  };

  if (!hydrated) return null;

  const set = (key: keyof VendorProfile) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setProfile({ ...profile, [key]: e.target.value });

  const inputClass = "h-11 px-4 text-[14px] border border-[#e5e5e5] rounded-lg focus:outline-none focus:border-[#005667] focus:ring-1 focus:ring-[#005667]/20 w-full bg-white";
  const labelClass = "block text-[12px] font-semibold text-[#888] uppercase tracking-wider mb-1.5";
  const requiredStar = <span className="text-red-400 ml-0.5">*</span>;

  const REQUIRED_FIELDS: { key: keyof VendorProfile; label: string; minLen?: number }[] = [
    { key: 'nome', label: 'Nome' },
    { key: 'cognome', label: 'Cognome' },
    { key: 'telefono', label: 'Telefono' },
    { key: 'email', label: 'Email' },
    { key: 'ragioneSociale', label: 'Ragione sociale' },
    { key: 'piva', label: 'P.IVA', minLen: 11 },
    { key: 'codiceFiscale', label: 'Codice fiscale' },
    { key: 'pec', label: 'PEC' },
    { key: 'sdi', label: 'Codice SDI' },
    { key: 'iban', label: 'IBAN' },
    { key: 'intestazioneIban', label: 'Intestazione IBAN' },
  ];

  const missingFields = REQUIRED_FIELDS.filter(f => {
    const val = String(profile[f.key] || '').trim();
    return f.minLen ? val.length < f.minLen : !val;
  });
  const isValid = missingFields.length === 0;
  const completionPercent = Math.round(((REQUIRED_FIELDS.length - missingFields.length) / REQUIRED_FIELDS.length) * 100);

  return (
    <div>
      {/* Header + progress bar + alert — always visible at top */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-[#1a1a1a]">Profilo cantina</h1>
            <p className="text-[13px] text-[#888] mt-0.5">Completa tutti i campi obbligatori per poter ricevere ordini e pagamenti</p>
          </div>
          <div className="text-right hidden sm:block">
            <span className={`text-[22px] font-bold ${completionPercent === 100 ? 'text-[#065f46]' : 'text-[#005667]'}`}>{completionPercent}%</span>
            <p className="text-[11px] text-[#888]">{completionPercent === 100 ? 'Completo' : `${missingFields.length} campi mancanti`}</p>
          </div>
        </div>
        <div className="h-2 bg-[#e8e4dc] rounded-full overflow-hidden mt-3">
          <div className={`h-full rounded-full transition-all duration-500 ${completionPercent === 100 ? 'bg-[#065f46]' : 'bg-[#005667]'}`} style={{ width: `${completionPercent}%` }} />
        </div>
        {!loading && missingFields.length > 0 && missingFields.length <= 4 && (
          <p className="text-[11px] text-[#888] mt-1.5">Mancano: {missingFields.map(f => f.label).join(', ')}</p>
        )}
      </div>

      {/* Alert dopo salvataggio */}
      {saveAlert && (
        <div className={`rounded-xl p-4 mb-6 border ${
          saveAlert.type === 'success'
            ? 'bg-[#065f46] border-[#065f46] text-white'
            : 'bg-[#fef3c7] border-[#f59e0b]/30 text-[#92400e]'
        }`}>
          <p className="text-[14px] font-semibold">{saveAlert.message}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#005667] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6 max-w-2xl">

          {/* ── Sezione 1: Anagrafica ── */}
          <div className="bg-white border border-[#e8e4dc] rounded-xl p-6">
            <p className="text-[11px] font-bold text-[#005667] uppercase tracking-wider mb-4">Anagrafica</p>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Nome cantina</label>
                <input value={profile.cantina} onChange={set('cantina')} className={inputClass} placeholder="Es. Cantina Merlotta" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Nome {requiredStar}</label>
                  <input value={profile.nome} onChange={set('nome')} className={inputClass} placeholder="Mario" />
                </div>
                <div>
                  <label className={labelClass}>Cognome {requiredStar}</label>
                  <input value={profile.cognome} onChange={set('cognome')} className={inputClass} placeholder="Rossi" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Telefono {requiredStar}</label>
                  <input value={profile.telefono} onChange={set('telefono')} type="tel" className={inputClass} placeholder="+39 312 345 6789" />
                </div>
                <div>
                  <label className={labelClass}>Email {requiredStar}</label>
                  <input value={profile.email} onChange={set('email')} type="email" className={inputClass} placeholder="info@cantina.it" />
                </div>
              </div>
            </div>
          </div>

          {/* ── Sezione 2: Dati aziendali ── */}
          <div className="bg-white border border-[#e8e4dc] rounded-xl p-6">
            <p className="text-[11px] font-bold text-[#005667] uppercase tracking-wider mb-4">Dati aziendali</p>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Ragione sociale {requiredStar}</label>
                <input value={profile.ragioneSociale} onChange={set('ragioneSociale')} className={inputClass} placeholder="Cantina Merlotta Srl" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Partita IVA {requiredStar}</label>
                  <input value={profile.piva} onChange={set('piva')} className={inputClass} maxLength={11} placeholder="12345678901" />
                </div>
                <div>
                  <label className={labelClass}>Codice fiscale {requiredStar}</label>
                  <input value={profile.codiceFiscale} onChange={set('codiceFiscale')} className={`${inputClass} uppercase`} maxLength={16} placeholder="RSSMRA80A01H501Z" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>PEC {requiredStar}</label>
                  <input value={profile.pec} onChange={set('pec')} type="email" className={inputClass} placeholder="cantina@pec.it" />
                </div>
                <div>
                  <label className={labelClass}>Codice SDI {requiredStar}</label>
                  <input value={profile.sdi} onChange={set('sdi')} className={`${inputClass} uppercase`} maxLength={7} placeholder="USAL8PV" />
                </div>
              </div>
            </div>
          </div>

          {/* ── Sezione 3: Sede legale ── */}
          <div className="bg-white border border-[#e8e4dc] rounded-xl p-6">
            <p className="text-[11px] font-bold text-[#005667] uppercase tracking-wider mb-4">Sede legale</p>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Indirizzo sede legale</label>
                <input value={profile.indirizzo} onChange={set('indirizzo')} className={inputClass} placeholder="Via Roma 42" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Città</label>
                  <input value={profile.citta} onChange={set('citta')} className={inputClass} placeholder="Bologna" />
                </div>
                <div>
                  <label className={labelClass}>Provincia</label>
                  <input value={profile.provincia} onChange={set('provincia')} className={inputClass} maxLength={2} placeholder="BO" style={{ textTransform: 'uppercase' }} />
                </div>
                <div>
                  <label className={labelClass}>CAP</label>
                  <input value={profile.cap} onChange={set('cap')} className={inputClass} maxLength={5} placeholder="40121" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Regione</label>
                <select value={profile.regione} onChange={set('regione')} className={inputClass}>
                  <option value="">— Seleziona regione —</option>
                  {REGIONI.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* ── Sezione 4: Dati bancari ── */}
          <div className="bg-white border border-[#e8e4dc] rounded-xl p-6">
            <p className="text-[11px] font-bold text-[#005667] uppercase tracking-wider mb-4">Dati bancari</p>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>IBAN {requiredStar}</label>
                <input value={profile.iban} onChange={set('iban')} className={`${inputClass} uppercase`} maxLength={27} placeholder="IT60X0542811101000000123456" />
              </div>
              <div>
                <label className={labelClass}>Intestazione IBAN {requiredStar}</label>
                <input value={profile.intestazioneIban} onChange={set('intestazioneIban')} className={inputClass} placeholder="Cantina Merlotta Srl" />
              </div>
            </div>
            <div className="mt-4 bg-[#fef3c7] rounded-lg px-4 py-3">
              <p className="text-[12px] text-[#92400e]">I dati bancari sono necessari per ricevere i pagamenti delle vendite. Verranno utilizzati esclusivamente per i trasferimenti delle commissioni.</p>
            </div>
          </div>

          {/* ── Save button sticky bottom ── */}
          <div className="sticky bottom-0 z-10 bg-[#f8f6f1]/95 backdrop-blur-sm pt-4 pb-6 border-t border-[#e8e4dc] mt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full sm:w-auto bg-[#005667] text-white rounded-lg px-8 py-3.5 text-[14px] font-semibold hover:bg-[#004555] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Salvataggio in corso...
                </>
              ) : 'Salva profilo'}
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
