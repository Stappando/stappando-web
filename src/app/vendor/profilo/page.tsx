'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';

interface VendorProfile {
  cantina: string;
  regione: string;
  piva: string;
  telefono: string;
  sito: string;
  email: string;
}

export default function VendorProfiloPage() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<VendorProfile>({
    cantina: '', regione: '', piva: '', telefono: '', sito: '', email: '',
  });
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
        if (data) setProfile(data);
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

  const inputClass = "h-11 px-4 text-[14px] border border-[#e5e5e5] rounded-lg focus:outline-none focus:border-[#005667] focus:ring-1 focus:ring-[#005667]/20 w-full bg-white";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-[#1a1a1a]">Profilo cantina</h1>
        <p className="text-[13px] text-[#888] mt-0.5">Gestisci i dati della tua cantina visibili sul sito</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#005667] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white border border-[#e8e4dc] rounded-xl p-6 max-w-xl">
          <div className="space-y-4">
            <div>
              <label className="block text-[12px] font-semibold text-[#888] uppercase tracking-wider mb-1.5">Nome cantina</label>
              <input value={profile.cantina} onChange={e => setProfile({ ...profile, cantina: e.target.value })} className={inputClass} placeholder="Es. Cantina Merlotta" />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#888] uppercase tracking-wider mb-1.5">Email</label>
              <input value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} type="email" className={inputClass} placeholder="email@cantina.it" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-semibold text-[#888] uppercase tracking-wider mb-1.5">Regione</label>
                <input value={profile.regione} onChange={e => setProfile({ ...profile, regione: e.target.value })} className={inputClass} placeholder="Es. Emilia-Romagna" />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#888] uppercase tracking-wider mb-1.5">Telefono</label>
                <input value={profile.telefono} onChange={e => setProfile({ ...profile, telefono: e.target.value })} type="tel" className={inputClass} placeholder="+39 ..." />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#888] uppercase tracking-wider mb-1.5">P.IVA</label>
              <input value={profile.piva} onChange={e => setProfile({ ...profile, piva: e.target.value })} className={inputClass} maxLength={11} placeholder="12345678901" />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#888] uppercase tracking-wider mb-1.5">Sito web</label>
              <input value={profile.sito} onChange={e => setProfile({ ...profile, sito: e.target.value })} type="url" className={inputClass} placeholder="https://www.cantina.it" />
            </div>
          </div>

          <div className="flex items-center gap-3 mt-6 pt-4 border-t border-[#f0f0f0]">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#005667] text-white rounded-lg px-6 py-2.5 text-[14px] font-semibold hover:bg-[#004555] transition-colors disabled:opacity-50"
            >
              {saving ? 'Salvataggio...' : 'Salva modifiche'}
            </button>
            {saved && (
              <span className="text-[13px] text-[#065f46] font-medium flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                Salvato
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
