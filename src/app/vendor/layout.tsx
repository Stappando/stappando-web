'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';

const NAV_ITEMS = [
  { href: '/vendor/dashboard', label: 'Dashboard', icon: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z' },
  { href: '/vendor/ordini', label: 'Ordini', icon: 'M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-1.5 8.25h-11L5 14.5m14 0H5' },
  { href: '/vendor/prodotti', label: 'Prodotti', icon: 'M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z' },
  { href: '/vendor/negozio', label: 'Negozio', icon: 'M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z' },
  { href: '/vendor/recensioni', label: 'Recensioni', icon: 'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z' },
  { href: '/vendor/profilo', label: 'Profilo', icon: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z' },
];

const EXTERNAL_LINKS = [
  { href: 'https://app.vineis.eu', label: 'Esperienze', icon: 'M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418', color: '#005667' },
  { href: 'https://anbrekabol.com', label: 'Cartoni spedizione', icon: 'M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z', color: '#8B4513' },
];

// Required profile fields — vendor must complete these before accessing other pages
const REQUIRED_PROFILE_FIELDS = ['nome', 'cognome', 'telefono', 'email', 'ragioneSociale', 'piva', 'codiceFiscale', 'pec', 'sdi', 'iban', 'intestazioneIban'];

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isAuthenticated, isVendor } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null); // null = loading

  useEffect(() => { setHydrated(true); }, []);

  const checkProfile = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/vendor/profile?vendorId=${user.id}`);
      if (!res.ok) { setProfileComplete(false); return; }
      const data = await res.json();
      const complete = REQUIRED_PROFILE_FIELDS.every(k => data[k] && String(data[k]).trim().length > 0);
      setProfileComplete(complete);
    } catch {
      setProfileComplete(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (hydrated && user?.id) checkProfile();
  }, [hydrated, user?.id, checkProfile]);

  // Skip layout for contratto page
  if (pathname === '/vendor/contratto') {
    return <>{children}</>;
  }

  if (!hydrated) {
    return <div className="min-h-[60vh] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#005667] border-t-transparent rounded-full animate-spin" /></div>;
  }

  const isVendorCheck = isAuthenticated() && (isVendor() || (typeof window !== 'undefined' && localStorage.getItem('stappando-is-vendor') === 'true'));

  if (!isVendorCheck) {
    return <>{children}</>;
  }

  // Profile incomplete: block everything except /vendor/profilo
  const isProfilePage = pathname === '/vendor/profilo';
  const showBlockOverlay = profileComplete === false && !isProfilePage;

  return (
    <div className="min-h-screen bg-[#f8f6f1]">
      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* Sidebar */}
        <aside className="w-56 shrink-0 hidden md:block">
          <nav className="space-y-1">
            {NAV_ITEMS.map(item => {
              const active = pathname === item.href || (item.href !== '/vendor/dashboard' && pathname.startsWith(item.href));
              const disabled = profileComplete === false && item.href !== '/vendor/profilo';
              return (
                <Link
                  key={item.href}
                  href={disabled ? '/vendor/profilo' : item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${
                    active
                      ? 'bg-[#005667] text-white'
                      : disabled
                        ? 'text-[#ccc] cursor-not-allowed'
                        : 'text-[#444] hover:bg-white hover:text-[#005667]'
                  }`}
                >
                  <svg className="w-4.5 h-4.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                  {item.label}
                  {disabled && <svg className="w-3.5 h-3.5 ml-auto text-[#ddd]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>}
                </Link>
              );
            })}
          </nav>

          {/* External links */}
          <div className="mt-4 pt-4 border-t border-[#e8e4dc]">
            <p className="px-4 text-[10px] font-semibold text-[#aaa] uppercase tracking-wider mb-2">Servizi</p>
            {EXTERNAL_LINKS.map(link => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-2 rounded-lg text-[13px] font-medium text-[#444] hover:bg-white hover:text-[#005667] transition-colors"
              >
                <svg className="w-4.5 h-4.5 shrink-0" style={{ color: link.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
                </svg>
                {link.label}
                <svg className="w-3 h-3 ml-auto text-[#ccc]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
              </a>
            ))}
          </div>

          {/* Profile completion warning */}
          {profileComplete === false && (
            <div className="mt-4 bg-[#fef3c7] border border-[#f59e0b]/30 rounded-xl p-4">
              <p className="text-[12px] font-semibold text-[#92400e] mb-1">Profilo incompleto</p>
              <p className="text-[11px] text-[#b45309] leading-relaxed">Completa il profilo cantina per sbloccare tutte le funzionalità.</p>
              <Link href="/vendor/profilo" className="mt-2 inline-block text-[11px] font-semibold text-[#005667] hover:underline">Completa ora →</Link>
            </div>
          )}
        </aside>

        {/* Mobile nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#e8e4dc] z-40 flex">
          {NAV_ITEMS.map(item => {
            const active = pathname === item.href || (item.href !== '/vendor/dashboard' && pathname.startsWith(item.href));
            const disabled = profileComplete === false && item.href !== '/vendor/profilo';
            return (
              <Link
                key={item.href}
                href={disabled ? '/vendor/profilo' : item.href}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium ${
                  active ? 'text-[#005667]' : disabled ? 'text-[#ddd]' : 'text-[#888]'
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Main content */}
        <main className="flex-1 min-w-0 relative">
          {showBlockOverlay && (
            <div className="absolute inset-0 z-30 flex items-start justify-center pt-20">
              {/* Blurred background */}
              <div className="absolute inset-0 bg-white/70 backdrop-blur-sm rounded-xl" />
              {/* CTA card */}
              <div className="relative z-10 bg-white rounded-2xl shadow-xl border border-[#e8e4dc] max-w-sm w-full p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-[#fef3c7] flex items-center justify-center mx-auto mb-5">
                  <svg className="w-8 h-8 text-[#f59e0b]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                </div>
                <h2 className="text-[18px] font-bold text-[#1a1a1a] mb-2">Completa il tuo profilo</h2>
                <p className="text-[13px] text-[#888] leading-relaxed mb-6">
                  Per accedere a ordini, prodotti e negozio devi prima completare tutti i campi obbligatori del profilo cantina.
                </p>
                <Link href="/vendor/profilo" className="inline-block bg-[#005667] text-white rounded-lg px-8 py-3 text-[14px] font-semibold hover:bg-[#004555] transition-colors">
                  Completa il profilo →
                </Link>
              </div>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
