'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore, useStoreHydrated } from '@/store/auth';

const NAV_ITEMS = [
  { href: '/vendor/dashboard', label: 'Dashboard', icon: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z', alwaysVisible: true },
  { href: '/vendor/profilo', label: 'Profilo', icon: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z', alwaysVisible: true },
  { href: '/vendor/negozio', label: 'Negozio', icon: 'M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z', alwaysVisible: true },
  { href: '/vendor/ordini', label: 'Ordini', icon: 'M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-1.5 8.25h-11L5 14.5m14 0H5', requiresSetup: true },
  { href: '/vendor/prodotti', label: 'Prodotti', icon: 'M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z', requiresSetup: true },
  { href: '/vendor/recensioni', label: 'Recensioni', icon: 'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z', requiresSetup: true },
  { href: '/vendor/ticket', label: 'Assistenza', icon: 'M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z', alwaysVisible: true },
];

const EXTERNAL_LINKS = [
  { href: 'https://app.vineis.eu', label: 'Esperienze', icon: 'M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418', color: '#005667' },
  { href: 'https://anbrekabol.com', label: 'Cartoni spedizione', icon: 'M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z', color: '#8B4513' },
];

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hydrated = useStoreHydrated();
  const token = useAuthStore(s => s.token);
  const user = useAuthStore(s => s.user);
  const role = useAuthStore(s => s.role);
  const vendorStatus = useAuthStore(s => s.vendorStatus);
  const [setupComplete, setSetupComplete] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);

  const isAuth = !!token && !!user;
  const isVendorRole = role === 'vendor' || role === 'wcfm_vendor' || role === 'dc_vendor';
  const isApproved = vendorStatus === 'approved';
  const isContrattoPage = pathname === '/vendor/contratto';

  // Check profile + shop completeness for approved vendors
  // NOTE: all hooks MUST be above any early return
  useEffect(() => {
    if (isContrattoPage || !hydrated || !isAuth || !isApproved || !user?.id) {
      setCheckingSetup(false);
      return;
    }

    let cancelled = false;
    Promise.all([
      fetch(`/api/vendor/profile?vendorId=${user.id}`).then(r => r.ok ? r.json() : null),
      fetch(`/api/vendor/shop?vendorId=${user.id}`).then(r => r.ok ? r.json() : null),
    ]).then(([profile, shop]) => {
      if (cancelled) return;

      // Profile required fields
      const profileFields = ['nome', 'cognome', 'telefono', 'email', 'ragioneSociale', 'piva', 'codiceFiscale', 'pec', 'sdi', 'iban', 'intestazioneIban'];
      const profileComplete = profile && profileFields.every((k: string) => String(profile[k] || '').trim().length > 0);

      // Shop required fields: descrizione + at least logo or banner
      const shopComplete = shop && !!shop.descrizione?.trim() && (!!shop.logo || !!shop.banner);

      setSetupComplete(!!profileComplete && !!shopComplete);
      setCheckingSetup(false);
    }).catch(() => {
      if (!cancelled) setCheckingSetup(false);
    });

    return () => { cancelled = true; };
  }, [isContrattoPage, hydrated, isAuth, isApproved, user?.id]);

  // Contratto page has its own full-page layout — skip vendor chrome
  if (isContrattoPage) {
    return <>{children}</>;
  }

  // SSR + hydration: spinner
  if (!hydrated || (isApproved && checkingSetup)) {
    return <div className="min-h-[60vh] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#005667] border-t-transparent rounded-full animate-spin" /></div>;
  }

  // Not authenticated
  if (!isAuth) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <h1 className="text-[22px] font-bold text-[#1a1a1a] mb-3">Accesso riservato</h1>
        <p className="text-[14px] text-[#888] mb-6">Questa area è riservata ai venditori registrati.</p>
        <Link href="/" className="inline-block bg-[#005667] text-white rounded-lg px-6 py-3 text-[14px] font-semibold hover:bg-[#004555]">Torna alla homepage</Link>
      </div>
    );
  }

  // Not a vendor
  if (!isVendorRole) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <h1 className="text-[22px] font-bold text-[#1a1a1a] mb-3">Area venditori</h1>
        <p className="text-[14px] text-[#888] mb-6">Il tuo account non è registrato come venditore.</p>
        <Link href="/account" className="inline-block bg-[#005667] text-white rounded-lg px-6 py-3 text-[14px] font-semibold hover:bg-[#004555]">Vai al tuo account</Link>
      </div>
    );
  }

  // Pending contract
  if (vendorStatus === 'pending_contract' || !vendorStatus) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-[#e8f4f1] flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-[#005667]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
          </div>
          <h1 className="text-[22px] font-bold text-[#1a1a1a] mb-3">Ancora un passo!</h1>
          <p className="text-[14px] text-[#888] mb-2">Per pubblicare i tuoi vini su Stappando, completa la firma del contratto di adesione.</p>
          <p className="text-[13px] text-[#aaa] mb-6">Ci vogliono solo 2 minuti.</p>
          <Link href="/vendor/contratto" className="inline-block bg-[#005667] text-white rounded-xl px-8 py-3 text-[15px] font-semibold hover:bg-[#004555] transition-colors">Firma il contratto →</Link>
        </div>
      </div>
    );
  }

  // Pending approval
  if (vendorStatus === 'pending_approval') {
    return (
      <div className="flex items-center justify-center px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl border border-[#e8e4dc] max-w-md w-full p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-[#1a1a1a] flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-[#d9c39a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-[22px] font-bold text-[#1a1a1a] mb-3">Stiamo lavorando al tuo negozio</h1>
          <p className="text-[15px] text-[#666] leading-relaxed mb-6">
            Grazie, <strong className="text-[#1a1a1a]">{user?.firstName || user?.email?.split('@')[0] || ''}</strong>!<br />
            Il tuo contratto è stato ricevuto.<br />
            Riceverai una <strong className="text-[#005667]">email di conferma</strong> appena il negozio sarà approvato.
          </p>
          <div className="bg-[#f8f6f1] rounded-xl p-5 mb-6 text-left">
            <p className="text-[10px] text-[#888] uppercase tracking-wider font-semibold mb-3">Cosa succede ora</p>
            {[
              { n: '1', text: 'Registrazione completata', done: true },
              { n: '2', text: 'Contratto firmato', done: true },
              { n: '3', text: 'Verifica e approvazione', done: false },
              { n: '4', text: 'Il tuo negozio è live!', done: false },
            ].map(step => (
              <div key={step.n} className="flex items-center gap-3 py-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold ${step.done ? 'bg-[#005667] text-white' : 'bg-[#e8e4dc] text-[#888]'}`}>
                  {step.done ? <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> : step.n}
                </div>
                <span className={`text-[13px] ${step.done ? 'text-[#005667] font-medium' : 'text-[#888]'}`}>{step.text}</span>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <Link href="/" className="block w-full py-3 bg-[#005667] text-white rounded-xl text-[15px] font-semibold hover:bg-[#004555] transition-colors text-center">Torna alla homepage</Link>
            <a href="mailto:assistenza@stappando.it" className="block text-[13px] text-[#888] hover:text-[#005667] transition-colors">Hai domande? Scrivici</a>
          </div>
        </div>
      </div>
    );
  }

  // Approved — show dashboard with conditional nav locking
  const visibleNav = NAV_ITEMS.filter(item => {
    if (item.alwaysVisible) return true;
    if (item.requiresSetup && !setupComplete) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#f8f6f1]">
      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* Sidebar */}
        <aside className="w-56 shrink-0 hidden md:block">
          <nav className="space-y-1">
            {visibleNav.map(item => {
              const active = pathname === item.href || (item.href !== '/vendor/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${
                    active
                      ? 'bg-[#005667] text-white'
                      : 'text-[#444] hover:bg-white hover:text-[#005667]'
                  }`}
                >
                  <svg className="w-4.5 h-4.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                  {item.label}
                </Link>
              );
            })}

            {/* Locked items hint */}
            {!setupComplete && (
              <div className="mt-3 px-4 py-3 bg-[#fef3c7] rounded-lg">
                <p className="text-[11px] text-[#92400e] font-medium leading-relaxed">
                  Completa Profilo e Negozio al 100% per sbloccare Ordini, Prodotti e Recensioni.
                </p>
              </div>
            )}
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

          {/* Torna al sito + Esci */}
          <div className="mt-4 pt-4 border-t border-[#e8e4dc] space-y-1">
            <Link href="/" className="flex items-center gap-2 px-3 py-2 text-[13px] text-[#888] hover:text-[#005667] transition-colors rounded-lg hover:bg-white">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
              Torna al sito
            </Link>
            <button onClick={() => { useAuthStore.getState().logout(); window.location.href = '/'; }} className="flex items-center gap-2 px-3 py-2 text-[13px] text-[#c0392b] hover:text-[#e74c3c] transition-colors rounded-lg hover:bg-red-50 w-full text-left">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
              Esci
            </button>
          </div>
        </aside>

        {/* Mobile nav — only show visible items */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#e8e4dc] z-40 flex">
          {visibleNav.slice(0, 5).map(item => {
            const active = pathname === item.href || (item.href !== '/vendor/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium ${
                  active ? 'text-[#005667]' : 'text-[#888]'
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
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
