'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import AuthModal from '@/components/AuthModal';

/* ══════════════════════════════════════════
   NAV — per occasione, non per categoria
   ══════════════════════════════════════════ */
const NAV = [
  { label: 'Per occasione', href: '/cerca?cat=occasione' },
  { label: 'Best seller',   href: '/cerca?sort=bestseller' },
  { label: 'Regali',        href: '/cerca?cat=regali' },
  { label: 'Offerte',       href: '/cerca?filter=sale' },
  { label: 'Cantine',       href: '/cerca?filter=cantina' },
] as const;

/* ══════════════════════════════════════════
   TOP BAR
   Desktop: 4 USP + rating
   Mobile: 2 USP only
   Slide-up su scroll
   ══════════════════════════════════════════ */
function TopBar({ visible }: { visible: boolean }) {
  return (
    <div className={`bg-[#005667] transition-all duration-200 ease-out overflow-hidden ${visible ? 'h-9 sm:h-9' : 'h-0'}`}>
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-center h-9">
        {/* Desktop */}
        <p className="hidden sm:flex items-center gap-0 text-xs font-normal text-white">
          Selezionati da sommelier
          <span className="opacity-40 mx-2">•</span>
          Consegna 24–48h
          <span className="opacity-40 mx-2">•</span>
          Spedizione gratuita da 69€
          <span className="opacity-40 mx-2">•</span>
          <span className="text-[#d9c39a]">★★★★★</span>
          <span className="font-medium ml-1.5">4.6/5</span>
          <span className="opacity-70 text-[11px] ml-1">· 1000+ recensioni</span>
        </p>
        {/* Mobile */}
        <p className="sm:hidden text-[11px] font-normal text-white">
          Consegna 24–48h<span className="opacity-40 mx-2">•</span>Spedizione gratuita da 69€
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   SEARCH EXPANDED
   Overlay sotto header, autofocus, ESC chiude
   ══════════════════════════════════════════ */
function SearchExpanded({ onClose }: { onClose: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = inputRef.current?.value?.trim();
    if (v) { window.location.href = `/cerca?q=${encodeURIComponent(v)}`; onClose(); }
  };

  return (
    <div className="absolute inset-x-0 top-full bg-white border-b border-[#e5e5e5] shadow-lg z-50">
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-4">
        <form onSubmit={handleSubmit} className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#005667]/40 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Cerca vino, occasione o abbinamento…"
            className="w-full pl-12 pr-28 py-3.5 bg-white border-2 border-[#005667]/15 rounded-2xl text-base focus:outline-none focus:border-[#005667]/40 focus:shadow-[0_0_0_4px_rgba(0,86,103,0.06)] transition-all"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            <button type="submit" className="px-5 py-2 bg-[#005667] text-white rounded-xl text-xs font-bold hover:bg-[#004555] transition-colors shadow-sm">Cerca</button>
            <button type="button" onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </form>
      </div>
      <div className="fixed inset-0 -z-10" onClick={onClose} />
    </div>
  );
}

/* ══════════════════════════════════════════
   CART ICON — badge real-time, 44px touch
   ══════════════════════════════════════════ */
function CartIcon() {
  const [mounted, setMounted] = useState(false);
  const toggleCart = useCartStore(s => s.toggleCart);
  const count = useCartStore(s => s.items.reduce((sum, i) => sum + i.quantity, 0));
  useEffect(() => setMounted(true), []);

  return (
    <button onClick={toggleCart} className="relative flex items-center justify-center w-11 h-11 rounded-lg text-gray-600 hover:text-[#005667] hover:bg-gray-50 transition-colors" aria-label="Carrello">
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/>
      </svg>
      {mounted && count > 0 && (
        <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-[#005667] text-white text-[10px] font-bold rounded-full px-1 leading-none">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}

/* ══════════════════════════════════════════
   ACCOUNT ICON — badge punti POP, 44px touch
   ══════════════════════════════════════════ */
function AccountIcon({ onOpenAuth }: { onOpenAuth: () => void }) {
  const [mounted, setMounted] = useState(false);
  const isAuth = useAuthStore(s => s.isAuthenticated());
  const user = useAuthStore(s => s.user);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center w-11 h-11 rounded-lg text-gray-500">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>
      </div>
    );
  }

  if (isAuth) {
    return (
      <Link href="/account" className="relative flex items-center justify-center w-11 h-11 rounded-lg hover:bg-gray-50 transition-colors" aria-label="Account">
        <div className="w-7 h-7 rounded-full bg-[#005667] text-white text-[11px] font-bold flex items-center justify-center">
          {user?.firstName?.[0]?.toUpperCase() || 'U'}
        </div>
      </Link>
    );
  }

  return (
    <button onClick={onOpenAuth} className="flex items-center justify-center w-11 h-11 rounded-lg text-gray-500 hover:text-[#005667] hover:bg-gray-50 transition-colors" aria-label="Accedi">
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>
    </button>
  );
}

/* ══════════════════════════════════════════
   MOBILE DRAWER
   Search in cima, nav, account, punti POP
   ══════════════════════════════════════════ */
function MobileDrawer({ isOpen, onClose, onOpenAuth }: { isOpen: boolean; onClose: () => void; onOpenAuth: () => void }) {
  const isAuth = useAuthStore(s => s.isAuthenticated());
  const user = useAuthStore(s => s.user);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (isOpen) setTimeout(() => searchRef.current?.focus(), 150); }, [isOpen]);

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const v = searchRef.current?.value?.trim();
    if (v) { window.location.href = `/cerca?q=${encodeURIComponent(v)}`; onClose(); }
  };

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-y-0 left-0 w-80 max-w-[85vw] bg-white shadow-2xl flex flex-col">
        {/* Close */}
        <div className="flex items-center justify-between px-5 h-14 border-b border-gray-100">
          <Image src="/logo.png" alt="Stappando" width={120} height={30} className="h-6 w-auto" />
          <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-gray-700">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Search — priorità alta, autofocus */}
        <div className="px-4 py-3">
          <form onSubmit={handleSearch} className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input ref={searchRef} type="text" placeholder="Cerca vino, occasione o abbinamento…" className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-base focus:outline-none focus:border-[#005667] focus:ring-1 focus:ring-[#005667]/20" />
          </form>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100 mx-4" />

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2">
          {NAV.map(item => (
            <Link key={item.label} href={item.href} onClick={onClose}
              className="block px-6 py-3.5 text-base text-gray-700 hover:text-[#005667] hover:bg-gray-50 transition-colors">
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Divider */}
        <div className="h-px bg-gray-100 mx-4" />

        {/* Account + Punti POP */}
        <div className="p-4 space-y-2">
          <button
            onClick={() => { onClose(); isAuth ? (window.location.href = '/account') : onOpenAuth(); }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:border-[#005667] hover:text-[#005667] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>
            {isAuth ? `Ciao ${user?.firstName || ''}` : 'Accedi / Registrati'}
          </button>
          {isAuth && (
            <div className="text-center text-[11px] text-gray-500">
              <span className="text-[#005667] font-semibold">Punti POP</span> — verifica il tuo saldo
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   HEADER — componente principale
   Rating sotto logo (solo desktop)
   Sticky con riduzione altezza
   ══════════════════════════════════════════ */
export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [topBarVisible, setTopBarVisible] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    let lastY = 0;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 10);
      // Top bar: hide after 80px on desktop, 60px on mobile
      setTopBarVisible(y < 80);
      lastY = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      {/* ── Top Bar ── */}
      <TopBar visible={topBarVisible} />

      {/* ── Header ── */}
      <header className={`sticky top-0 z-50 bg-white border-b border-[#e5e5e5] transition-all duration-200`}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative">
          <div className={`flex items-center transition-all duration-200 ${scrolled ? 'h-14' : 'h-14 sm:h-16'}`}>

            {/* SINISTRA — Logo + rating desktop */}
            <div className="shrink-0 mr-4 lg:mr-8">
              <Link href="/" className="block">
                <Image src="/logo.png" alt="Stappando" width={150} height={38} className={`w-auto transition-all duration-200 ${scrolled ? 'h-6 sm:h-7' : 'h-7 sm:h-8'}`} priority />
              </Link>
              {/* Rating sotto logo — trust signal primario */}
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[10px] text-[#d9c39a] leading-none">★★★★★</span>
                <span className="text-[10px] font-medium text-[#005667] leading-none">4.6/5</span>
                <span className="sm:hidden text-[10px] text-[#999] leading-none">· 1K+ recensioni</span>
                <span className="hidden sm:inline text-[10px] text-[#999] leading-none">· 1000+ recensioni</span>
              </div>
            </div>

            {/* CENTRO — Nav desktop */}
            <nav className="hidden lg:flex items-center gap-1">
              {NAV.map(item => {
                const base = item.href.split('?')[0];
                const isActive = pathname === base || pathname === item.href;
                return (
                  <Link key={item.label} href={item.href}
                    className={`px-3 py-1.5 text-[14px] rounded-lg transition-colors whitespace-nowrap ${
                      isActive
                        ? 'text-[#005667] underline underline-offset-[6px] decoration-[#005667] decoration-[1.5px]'
                        : 'text-gray-700 hover:text-[#005667] hover:underline hover:underline-offset-[6px] hover:decoration-[#005667]/40 hover:decoration-[1.5px]'
                    }`}>
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Spacer */}
            <div className="flex-1" />

            {/* DESTRA — Azioni */}
            <div className="flex items-center">
              {/* Search */}
              <button onClick={() => setSearchOpen(!searchOpen)} className={`flex items-center justify-center w-11 h-11 rounded-lg transition-colors ${searchOpen ? 'text-[#005667] bg-gray-100' : 'text-gray-500 hover:text-[#005667] hover:bg-gray-50'}`} aria-label="Cerca">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              </button>

              {/* Account — hidden on mobile, visible on sm+ */}
              <div className="hidden sm:block">
                <AccountIcon onOpenAuth={() => setAuthModalOpen(true)} />
              </div>

              {/* Cart — sempre visibile */}
              <CartIcon />

              {/* Hamburger — mobile */}
              <button onClick={() => setMobileOpen(true)} className="lg:hidden flex items-center justify-center w-11 h-11 rounded-lg text-gray-600 hover:text-[#005667] hover:bg-gray-50 transition-colors" aria-label="Menu">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Search expanded */}
        {searchOpen && <SearchExpanded onClose={() => setSearchOpen(false)} />}
      </header>

      {/* Mobile drawer */}
      <MobileDrawer isOpen={mobileOpen} onClose={() => setMobileOpen(false)} onOpenAuth={() => setAuthModalOpen(true)} />

      {/* Auth modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
}
