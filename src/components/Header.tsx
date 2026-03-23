'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import SearchModal from '@/components/SearchModal';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const toggleCart = useCartStore((s) => s.toggleCart);
  const itemCount = useCartStore((s) => s.getItemCount());
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const user = useAuthStore((s) => s.user);

  useEffect(() => setMounted(true), []);

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden p-2 -ml-2 text-gray-700 hover:text-[#055667] transition-colors"
              aria-label="Menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            {/* Logo */}
            <Link href="/" className="flex items-center shrink-0">
              <Image src="/logo.png" alt="Stappando" width={160} height={40} className="h-8 w-auto" priority />
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-6 ml-8">
              <Link href="/" className="text-sm font-medium text-gray-700 hover:text-[#055667] transition-colors">Home</Link>
              <Link href="/cerca" className="text-sm font-medium text-gray-700 hover:text-[#055667] transition-colors">Catalogo</Link>
              <Link href="/blog" className="text-sm font-medium text-gray-700 hover:text-[#055667] transition-colors">Blog</Link>
              <Link href="/chi-siamo" className="text-sm font-medium text-gray-700 hover:text-[#055667] transition-colors">Chi siamo</Link>
            </nav>

            {/* Desktop search */}
            <button
              onClick={() => setSearchModalOpen(true)}
              className="hidden lg:flex items-center flex-1 max-w-md mx-6 h-10 pl-10 pr-4 rounded-full bg-gray-50 border border-gray-200 text-sm text-gray-400 hover:border-[#055667]/40 transition-colors cursor-pointer relative"
            >
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Cerca vini, cantine...
            </button>

            {/* Right icons */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Search mobile */}
              <button
                onClick={() => setSearchModalOpen(true)}
                className="lg:hidden p-2 text-gray-700 hover:text-[#055667] transition-colors"
                aria-label="Cerca"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {/* Preferiti */}
              <Link href="/account" className="p-2 text-gray-700 hover:text-[#055667] transition-colors" aria-label="Preferiti">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </Link>

              {/* Account */}
              <Link
                href="/account"
                className="p-2 text-gray-700 hover:text-[#055667] transition-colors"
                aria-label="Account"
              >
                {mounted && isAuthenticated ? (
                  <div className="w-7 h-7 rounded-full bg-[#055667] text-white text-xs font-bold flex items-center justify-center">
                    {user?.firstName?.[0]?.toUpperCase() || 'U'}
                  </div>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
              </Link>

              {/* Cart */}
              <button
                onClick={toggleCart}
                className="relative p-2 text-gray-700 hover:text-[#055667] transition-colors"
                aria-label="Carrello"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {mounted && itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#b8973f] text-white text-[10px] font-bold flex items-center justify-center">
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <SearchModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)} />

      {/* Mobile menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-80 max-w-[85vw] bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <Image src="/logo.png" alt="Stappando" width={130} height={32} className="h-7 w-auto" />
              <button onClick={() => setMenuOpen(false)} className="p-1 text-gray-400 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-2">
              {[
                { href: '/', label: 'Home', icon: '🏠' },
                { href: '/cerca', label: 'Catalogo', icon: '🍷' },
                { href: '/blog', label: 'Blog', icon: '📰' },
                { href: '/chi-siamo', label: 'Chi siamo', icon: '👥' },
                { href: '/contatti', label: 'Contatti', icon: '📧' },
                { href: '/spedizioni', label: 'Spedizioni', icon: '🚚' },
                { href: '/pagamenti', label: 'Pagamenti', icon: '💳' },
                { href: '/account', label: mounted && isAuthenticated ? `Ciao ${user?.firstName || ''}` : 'Accedi / Registrati', icon: '👤' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-6 py-3.5 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-[#055667] transition-colors"
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="p-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 text-center">🔞 Vietata la vendita ai minori di 18 anni</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
