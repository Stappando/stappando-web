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
  const [saved, setSaved] = useState(false);
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
    setSaved(false);
    try {
      const res = await fetch('/api/vendor/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId: user.id, ...profile }),
      });
      if (res.ok) setSaved(true);
    } catch { /* ignore */ }
    setSaving(false);
    setTimeout(() => setSaved(false), 3000);
  };

  if (!hydrated) return null;

  const set = (key: keyof VendorProfile) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setProfile({ ...profile, [key]: e.target.value });

  const inputClass = "h-11 px-4 text-[14px] border border-[#e5e5e5] rounded-lg focus:outline-none focus:border-[#005667] focus:ring-1 focus:ring-[#005667]/20 w-full bg-white";
  const labelClass = "block text-[12px] font-semibold text-[#888] uppercase tracking-wider mb-1.5";
  const requiredStar = <span className="text-red-400 ml-0.5">*</span>;

  const isValid = profile.nome.trim() && profile.cognome.trim() && profile.telefono.trim() && profile.email.trim() &&
    profile.ragioneSociale.trim() && profile.piva.trim().length >= 11 && profile.codiceFiscale.trim() &&
    profile.pec.trim() && profile.sdi.trim() && profile.iban.trim() && profile.intestazioneIban.trim();

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
              <div>
                <label className={labelClass}>Sito web</label>
                <input value={profile.sito} onChange={set('sito')} type="url" className={inputClass} placeholder="https://www.cantina.it" />
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
              <div>
                <label className={labelClass}>Indirizzo esperienze <span className="text-[#aaa] normal-case font-normal">(se diverso da sede legale)</span></label>
                <input value={profile.indirizzoEsperienze} onChange={set('indirizzoEsperienze')} className={inputClass} placeholder="Località Vigna Alta, 5 — 40050 Monte San Pietro (BO)" />
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

          {/* ── Save button ── */}
          <div className="flex items-center gap-3 pb-8">
            <button
              onClick={handleSave}
              disabled={saving || !isValid}
              className="bg-[#005667] text-white rounded-lg px-8 py-3 text-[14px] font-semibold hover:bg-[#004555] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Salvataggio...' : 'Salva profilo'}
            </button>
            {saved && (
              <span className="text-[13px] text-[#065f46] font-medium flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                Profilo salvato
              </span>
            )}
            {!isValid && !saving && (
              <span className="text-[12px] text-[#aaa]">Compila tutti i campi obbligatori (*) per salvare</span>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
