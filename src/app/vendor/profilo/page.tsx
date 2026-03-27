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
          setSaveAlert({ type: 'success', message: 'Profilo completato al 100% — Sei LIVE! 🎉' });
        } else if (missingFields.length <= 3) {
          setSaveAlert({ type: 'progress', message: `Salvato! Ancora ${missingFields.length} camp${missingFields.length === 1 ? 'o' : 'i'} e sei live: ${missingFields.map(f => f.label).join(', ')}` });
        } else {
          setSaveAlert({ type: 'progress', message: `Salvato! Mancano ancora ${missingFields.length} campi obbligatori` });
        }
      }
    } catch { /* ignore */ }
    setSaving(false);
    setTimeout(() => setSaveAlert(null), 6000);
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
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-[#1a1a1a]">Profilo cantina</h1>
        <p className="text-[13px] text-[#888] mt-0.5">Completa tutti i campi obbligatori per poter ricevere ordini e pagamenti</p>
      </div>

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

          {/* ── Sezione 5: Servizi partner ── */}
          <div className="bg-white border border-[#e8e4dc] rounded-xl p-6">
            <p className="text-[11px] font-bold text-[#005667] uppercase tracking-wider mb-4">Servizi per la tua cantina</p>
            <div className="space-y-3">
              <a
                href="https://app.vineis.eu"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 rounded-xl border border-[#e8e4dc] hover:border-[#005667]/40 hover:bg-[#f8fafa] transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-[#005667] flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.115 5.19l.319 1.913A6 6 0 008.11 10.36L9.75 12l-.387.775c-.217.433-.132.956.21 1.298l1.348 1.348c.21.21.329.497.329.795v1.089c0 .426.24.815.622 1.006l.153.076c.433.217.956.132 1.298-.21l.723-.723a8.7 8.7 0 002.288-4.042 1.087 1.087 0 00-.358-1.099l-1.33-1.108c-.251-.21-.582-.299-.905-.245l-1.17.195a1.125 1.125 0 01-.98-.314l-.295-.295a1.125 1.125 0 010-1.591l.13-.132a1.125 1.125 0 011.3-.21l.603.302a.809.809 0 001.086-1.086L14.25 7.5l1.256-.837a4.5 4.5 0 001.528-1.732l.146-.292M6.115 5.19A9 9 0 1017.18 4.64M6.115 5.19A8.965 8.965 0 0112 3c1.929 0 3.716.607 5.18 1.64" /></svg>
                </div>
                <div className="flex-1">
                  <p className="text-[14px] font-semibold text-[#1a1a1a]">Pubblica esperienze</p>
                  <p className="text-[12px] text-[#888]">Crea degustazioni e visite in cantina su Vineis</p>
                </div>
                <svg className="w-4 h-4 text-[#ccc] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
              </a>

              <a
                href="https://anbrekabol.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 rounded-xl border border-[#e8e4dc] hover:border-[#005667]/40 hover:bg-[#f8fafa] transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-[#8B4513] flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
                </div>
                <div className="flex-1">
                  <p className="text-[14px] font-semibold text-[#1a1a1a]">Acquista cartoni da spedizione</p>
                  <p className="text-[12px] text-[#888]">Cartoni e imballaggi per bottiglie su Anbrekabol</p>
                </div>
                <svg className="w-4 h-4 text-[#ccc] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
              </a>
            </div>
          </div>

          {/* ── Progress bar ── */}
          <div className="bg-white border border-[#e8e4dc] rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] font-semibold text-[#444]">Completamento profilo</span>
              <span className={`text-[13px] font-bold ${completionPercent === 100 ? 'text-[#065f46]' : 'text-[#005667]'}`}>{completionPercent}%</span>
            </div>
            <div className="h-2 bg-[#e8e4dc] rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${completionPercent === 100 ? 'bg-[#065f46]' : 'bg-[#005667]'}`} style={{ width: `${completionPercent}%` }} />
            </div>
            {missingFields.length > 0 && missingFields.length <= 3 && (
              <p className="text-[11px] text-[#888] mt-2">Mancano: {missingFields.map(f => f.label).join(', ')}</p>
            )}
          </div>

          {/* ── Alert dopo salvataggio ── */}
          {saveAlert && (
            <div className={`rounded-xl p-5 border ${
              saveAlert.type === 'success'
                ? 'bg-[#065f46] border-[#065f46] text-white'
                : 'bg-[#fef3c7] border-[#f59e0b]/30 text-[#92400e]'
            }`}>
              <div className="flex items-center gap-3">
                {saveAlert.type === 'success' ? (
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#f59e0b]/20 flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                  </div>
                )}
                <p className={`text-[14px] font-semibold ${saveAlert.type === 'success' ? '' : ''}`}>{saveAlert.message}</p>
              </div>
            </div>
          )}

          {/* ── Save button ── */}
          <div className="flex items-center gap-3 pb-8">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#005667] text-white rounded-lg px-8 py-3 text-[14px] font-semibold hover:bg-[#004555] transition-colors disabled:opacity-50"
            >
              {saving ? 'Salvataggio...' : 'Salva profilo'}
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
