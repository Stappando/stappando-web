'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import AuthModal from '@/components/AuthModal';
import SearchOverlay from '@/components/SearchOverlay';

/* ══════════════════════════════════════════════════════════
   NAV — 5 voci esatte, nessun link esterno
   ══════════════════════════════════════════════════════════ */
const NAV = [
  { label: 'Best seller',   href: '/cerca?tag=best-seller' },
  { label: 'Regalo',        href: '/cerca?tag=regali' },
  { label: 'Promo',         href: '/cerca?on_sale=true' },
  { label: 'Quotidiani',    href: '/cerca?max_price=8' },
  { label: 'Scorte',        href: '/cerca?q=Confezione+da+6' },
  { label: 'Degustazioni',  href: 'https://app.vineis.eu', external: true },
] as const;

/* ══════════════════════════════════════════════════════════
   TOP BAR
   Desktop: 36px — 4 USP + rating
   Mobile:  32px — 2 USP only
   Slide-up: desktop 80px, mobile 60px
   ══════════════════════════════════════════════════════════ */
function TopBar({ visible }: { visible: boolean }) {
  return (
    <div
      className={`bg-[#005667] overflow-hidden transition-all duration-200 ease-out ${
        visible ? 'h-[32px] sm:h-[36px]' : 'h-0'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-center h-[32px] sm:h-[36px]">
        {/* Desktop */}
        <p className="hidden sm:flex items-center text-[12px] text-white">
          Selezione del sommelier
          <span className="opacity-[0.35] mx-2">•</span>
          Consegna 24–48h
          <span className="opacity-[0.35] mx-2">•</span>
          Spedizione gratuita da 69€
          <span className="opacity-[0.35] mx-2">•</span>
          <span className="text-[#d9c39a]">★★★★★</span>
          <span className="font-medium ml-1.5">4.6/5</span>
          <span className="opacity-60 text-[11px] ml-1">· 1000+ recensioni</span>
        </p>
        {/* Mobile */}
        <p className="sm:hidden text-[11px] text-white">
          Consegna 24–48h
          <span className="opacity-[0.35] mx-2">•</span>
          Spedizione gratuita da 69€
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   CART ICON — badge #005667 9px, 44x44 touch
   ══════════════════════════════════════════════════════════ */
function CartIcon() {
  const [mounted, setMounted] = useState(false);
  const openCheckout = useCartStore(s => s.openCheckout);
  const count = useCartStore(s => s.items.reduce((sum, i) => sum + i.quantity, 0));
  useEffect(() => setMounted(true), []);

  return (
    <button onClick={() => openCheckout(1)} className="relative flex items-center justify-center w-11 h-11 rounded-lg text-gray-600 hover:text-[#005667] hover:bg-gray-50 transition-colors" aria-label="Carrello">
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
      {mounted && count > 0 && (
        <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-[#005667] text-white text-[9px] font-bold rounded-full px-1 leading-none">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}

/* ══════════════════════════════════════════════════════════
   ACCOUNT ICON — badge "POP" se loggato, 44x44
   ══════════════════════════════════════════════════════════ */
function AccountIcon({ onOpenAuth }: { onOpenAuth: () => void }) {
  const [mounted, setMounted] = useState(false);
  const isAuth = useAuthStore(s => s.isAuthenticated());
  const isVendorStore = useAuthStore(s => s.isVendor());
  const isVendorUser = isVendorStore || (typeof window !== 'undefined' && localStorage.getItem('stappando-is-vendor') === 'true');
  const user = useAuthStore(s => s.user);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center w-11 h-11 rounded-lg text-gray-500">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
      </div>
    );
  }

  if (isAuth) {
    const accountHref = isVendorUser ? '/vendor/dashboard' : '/account';
    return (
      <Link href={accountHref} className="relative flex items-center justify-center w-11 h-11 rounded-lg hover:bg-gray-50 transition-colors" aria-label="Account">
        <div className="w-7 h-7 rounded-full bg-[#005667] text-white text-[11px] font-bold flex items-center justify-center">
          {user?.firstName?.[0]?.toUpperCase() || 'U'}
        </div>
        <span className="absolute top-0.5 right-0 min-w-[22px] h-[14px] flex items-center justify-center bg-[#d9c39a] text-[#005667] text-[8px] font-bold rounded-full px-1 leading-none">
          {isVendorUser ? 'V' : 'POP'}
        </span>
      </Link>
    );
  }

  return (
    <button onClick={onOpenAuth} className="flex items-center justify-center w-11 h-11 rounded-lg text-gray-500 hover:text-[#005667] hover:bg-gray-50 transition-colors" aria-label="Accedi">
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
    </button>
  );
}

/* ══════════════════════════════════════════════════════════
   MOBILE DRAWER
   Slide da sinistra, overlay 0.4, search autofocus
   5 voci nav, account in fondo
   ══════════════════════════════════════════════════════════ */
function MobileDrawer({ isOpen, onClose, onOpenAuth, onOpenVendorAuth }: { isOpen: boolean; onClose: () => void; onOpenAuth: () => void; onOpenVendorAuth: () => void }) {
  const isAuth = useAuthStore(s => s.isAuthenticated());
  const user = useAuthStore(s => s.user);
  const pathname = usePathname();
  const searchRef = useRef<HTMLInputElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);

  useEffect(() => {
    if (isOpen) setTimeout(() => searchRef.current?.focus(), 150);
  }, [isOpen]);

  // Swipe right to close
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    if (dx < -80) onClose(); // Swipe right > 80px
  }, [onClose]);

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const v = searchRef.current?.value?.trim();
    if (v) { window.location.href = `/cerca?q=${encodeURIComponent(v)}`; onClose(); }
  };

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="absolute inset-y-0 left-0 w-80 max-w-[85vw] bg-white shadow-2xl flex flex-col animate-[slideInLeft_200ms_ease-out]"
      >
        {/* Header — logo + rating (match mobile header) + close */}
        <div className="flex items-center justify-between px-4 h-[60px] border-b border-gray-100">
          <div>
            <Image src="/logo.png" alt="Stappando" width={120} height={30} className="h-6 w-auto" />
            <div className="flex items-center gap-0.5 mt-0.5">
              <span className="text-[9px] text-[#d9c39a] leading-none">★★★★★</span>
              <span className="text-[9px] font-medium text-[#005667] leading-none ml-0.5">4.6/5</span>
              <span className="text-[9px] text-[#bbb] leading-none ml-0.5">· 1000+</span>
            </div>
          </div>
          <button onClick={onClose} className="flex items-center justify-center w-11 h-11 -mr-2 text-gray-400 hover:text-gray-700 transition-colors" aria-label="Chiudi">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Search — autofocus, top priority */}
        <div className="px-4 py-3">
          <form onSubmit={handleSearch} className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              ref={searchRef}
              type="text"
              placeholder="Cerca vino, occasione o abbinamento…"
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-base focus:outline-none focus:border-[#005667] focus:ring-1 focus:ring-[#005667]/20"
            />
          </form>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100 mx-4" />

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-1">
          {NAV.map((item) => {
            const isExternal = 'external' in item && item.external;
            const isActive = !isExternal && (pathname === item.href.split('?')[0] || pathname === item.href);
            if (isExternal) {
              return (
                <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" onClick={onClose}
                  className="block px-4 py-[14px] text-[15px] text-gray-700 hover:text-[#005667] hover:bg-gray-50 transition-colors">
                  {item.label} <span className="text-[11px] text-[#ccc]">↗</span>
                </a>
              );
            }
            return (
              <Link key={item.label} href={item.href} onClick={onClose}
                className={`block px-4 py-[14px] text-[15px] transition-colors ${
                  isActive ? 'text-[#005667] font-medium' : 'text-gray-700 hover:text-[#005667] hover:bg-gray-50'
                }`}>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Vendi con noi — only if not logged in */}
        {!isAuth && (
          <>
            <div className="h-px bg-gray-100 mx-4" />
            <div className="px-4 py-2">
              <button onClick={() => { onClose(); onOpenVendorAuth(); }} className="w-full text-left py-3 px-4 text-[13px] text-[#888] hover:text-[#005667] transition-colors">
                Vendi con noi
              </button>
            </div>
          </>
        )}

        {/* Divider */}
        <div className="h-px bg-gray-100 mx-4" />

        {/* Account — in fondo, font-size 13px */}
        <div className="p-4">
          <button
            onClick={() => { onClose(); isAuth ? (window.location.href = useAuthStore.getState().isVendor() ? '/vendor/dashboard' : '/account') : onOpenAuth(); }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 text-[13px] font-medium text-gray-700 hover:border-[#005667] hover:text-[#005667] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
            {isAuth ? `Ciao ${user?.firstName || ''}` : 'Accedi / Registrati'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   HEADER — componente principale definitivo
   Desktop: 64px → 56px scroll, nav centro, rating sotto logo
   Mobile:  60px, logo + rating, search + cart + hamburger
   ══════════════════════════════════════════════════════════ */
export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authVendorMode, setAuthVendorMode] = useState(false);
  const isAuth = useAuthStore(s => s.isAuthenticated());
  const [scrolled, setScrolled] = useState(false);
  const [topBarVisible, setTopBarVisible] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 10);
      // Mobile: hide after 60px, Desktop: hide after 80px
      const isMobile = window.innerWidth < 640;
      setTopBarVisible(y < (isMobile ? 60 : 80));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      {/* ── Sticky wrapper: TopBar + Header stick together on desktop ── */}
      <div className="lg:sticky lg:top-0 lg:z-50">
      {/* ── Top Bar ── */}
      <TopBar visible={topBarVisible} />

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 lg:static lg:z-auto bg-white border-b border-[#e5e5e5]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative">
          <div className={`flex items-center transition-all duration-200 ease-out ${
            scrolled ? 'h-[56px]' : 'h-[60px] sm:h-[64px]'
          }`}>

            {/* LEFT — Logo + rating */}
            <div className="shrink-0 mr-4 lg:mr-8">
              <Link href="/" className="block">
                <Image
                  src="/logo.png"
                  alt="Stappando"
                  width={150}
                  height={38}
                  className={`w-auto transition-all duration-200 ease-out ${
                    scrolled ? 'h-6 sm:h-7' : 'h-7 sm:h-8'
                  }`}
                  priority
                />
              </Link>
              {/* Rating sotto logo — mobile: 9px compact, desktop: 10px full */}
              <div className="flex items-center gap-0.5 mt-0.5">
                {/* Mobile rating */}
                <span className="sm:hidden text-[9px] text-[#d9c39a] leading-none">★★★★★</span>
                <span className="sm:hidden text-[9px] font-medium text-[#005667] leading-none ml-0.5">4.6/5</span>
                <span className="sm:hidden text-[9px] text-[#bbb] leading-none ml-0.5">· 1000+</span>
                {/* Desktop rating */}
                <span className="hidden sm:inline text-[10px] text-[#d9c39a] leading-none">★★★★★</span>
                <span className="hidden sm:inline text-[10px] font-medium text-[#005667] leading-none ml-0.5">4.6/5</span>
                <span className="hidden sm:inline text-[10px] text-[#aaa] leading-none ml-0.5">· 1000+ recensioni</span>
              </div>
            </div>

            {/* CENTER — Nav desktop */}
            <nav className="hidden lg:flex items-center gap-0.5">
              {NAV.map(item => {
                const isExternal = 'external' in item && item.external;
                const base = item.href.split('?')[0];
                const isActive = !isExternal && (pathname === base || pathname === item.href);
                if (isExternal) {
                  return (
                    <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer"
                      className="px-3 py-1.5 text-[13px] rounded-lg text-gray-700 hover:text-[#005667] transition-colors whitespace-nowrap">
                      {item.label}
                    </a>
                  );
                }
                return (
                  <Link key={item.label} href={item.href}
                    className={`px-3 py-1.5 text-[13px] rounded-lg transition-colors whitespace-nowrap ${
                      isActive ? 'text-[#005667] font-medium underline underline-offset-[3px] decoration-[#005667] decoration-[1.5px]' : 'text-gray-700 hover:text-[#005667]'
                    }`}>
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Spacer */}
            <div className="flex-1" />

            {/* RIGHT — Actions */}
            <div className="flex items-center gap-0 sm:gap-1 flex-1 lg:flex-none justify-end min-w-0">
              {/* Search pill — desktop: full width */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="hidden lg:flex items-center flex-1 min-w-[280px] xl:min-w-[360px] gap-3 pl-4 pr-1.5 py-1.5 rounded-full border border-[#e5e5e5] bg-white hover:border-[#005667] transition-all mr-1"
              >
                <svg className="w-4 h-4 text-[#888] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <span className="text-[13px] text-[#888] flex-1 text-left">Cosa vuoi cercare?</span>
                <span className="bg-[#005667] text-white text-[11px] font-semibold px-4 py-1.5 rounded-full">Cerca</span>
              </button>

              {/* Tablet search: compact pill */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="hidden sm:flex lg:hidden items-center gap-2 px-3 py-1.5 rounded-full border border-[#e5e5e5] bg-white hover:border-[#005667] transition-colors"
                aria-label="Cerca"
              >
                <svg className="w-4 h-4 text-[#888]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <span className="text-[12px] text-[#999]">Cerca</span>
              </button>

              {/* Mobile search: compact pill */}
              <button
                onClick={() => setMobileSearchOpen(true)}
                className="sm:hidden flex items-center gap-1 px-2 py-1.5 rounded-full border border-[#e5e5e5] bg-white active:border-[#005667] transition-colors shrink-0"
                aria-label="Cerca"
              >
                <svg className="w-4 h-4 text-[#005667] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <span className="text-[10px] font-bold text-[#005667]">Cerca</span>
              </button>

              {/* Account — always visible */}
              <div className="shrink-0 -ml-0.5">
                <AccountIcon onOpenAuth={() => setAuthModalOpen(true)} />
              </div>

              {/* Cart */}
              <div className="shrink-0 -ml-1">
                <CartIcon />
              </div>

              {/* Vendi con noi — lg+ only */}
              {!isAuth && (
                <button onClick={() => { setAuthVendorMode(true); setAuthModalOpen(true); }} className="hidden lg:flex items-center px-3.5 py-1.5 border border-[#005667] text-[#005667] text-[12px] font-semibold rounded-full hover:bg-[#005667] hover:text-white transition-colors whitespace-nowrap shrink-0">
                  Vendi con noi
                </button>
              )}

              {/* Hamburger — mobile/tablet */}
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 -mr-1 rounded-lg text-gray-600 hover:text-[#005667] hover:bg-gray-50 transition-colors"
                aria-label="Menu"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Search overlay */}
        {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
      </header>
      </div>{/* end sticky wrapper */}

      {/* Mobile drawer */}
      <MobileDrawer isOpen={mobileOpen} onClose={() => setMobileOpen(false)} onOpenAuth={() => setAuthModalOpen(true)} onOpenVendorAuth={() => { setAuthVendorMode(true); setAuthModalOpen(true); }} />

      {/* Auth modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => { setAuthModalOpen(false); setAuthVendorMode(false); }} vendorMode={authVendorMode} />

      {/* Mobile search — fullscreen overlay */}
      {mobileSearchOpen && <SearchOverlay onClose={() => setMobileSearchOpen(false)} isMobile />}
    </>
  );
}
