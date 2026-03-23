'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/store/cart';
import SearchModal from '@/components/SearchModal';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const toggleCart = useCartStore((s) => s.toggleCart);
  const itemCount = useCartStore((s) => s.getItemCount());

  useEffect(() => setMounted(true), []);

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-brand-border">
        {/* Top bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden p-2 -ml-2 text-brand-text hover:text-brand-primary transition-colors"
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
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-brand-primary">
                STAPPANDO
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-8 ml-10">
              <Link href="/" className="text-sm font-medium text-brand-text hover:text-brand-primary transition-colors">
                Home
              </Link>
              <Link href="/cerca" className="text-sm font-medium text-brand-text hover:text-brand-primary transition-colors">
                Catalogo
              </Link>
              <Link href="/blog" className="text-sm font-medium text-brand-text hover:text-brand-primary transition-colors">
                Blog
              </Link>
            </nav>

            {/* Desktop search trigger */}
            <button
              onClick={() => setSearchModalOpen(true)}
              className="hidden lg:flex items-center flex-1 max-w-md mx-8 h-10 pl-10 pr-4 rounded-full bg-brand-bg border border-brand-border text-sm text-brand-muted hover:border-brand-primary/40 transition-colors cursor-pointer relative"
            >
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Cerca vini, cantine...
            </button>

            {/* Right icons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSearchModalOpen(true)}
                className="lg:hidden p-2 text-brand-text hover:text-brand-primary transition-colors"
                aria-label="Cerca"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              <button
                onClick={toggleCart}
                className="relative p-2 text-brand-text hover:text-brand-primary transition-colors"
                aria-label="Carrello"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {mounted && itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-brand-accent text-white text-[10px] font-bold flex items-center justify-center">
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

      </header>

      <SearchModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)} />

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-80 max-w-[85vw] bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-brand-border">
              <span className="text-xl font-extrabold text-brand-primary">STAPPANDO</span>
              <button onClick={() => setMenuOpen(false)} className="p-1 text-brand-muted hover:text-brand-text">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-4">
              {[
                { href: '/', label: 'Home' },
                { href: '/cerca', label: 'Catalogo' },
                { href: '/blog', label: 'Blog' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="block px-6 py-3 text-base font-medium text-brand-text hover:bg-brand-bg hover:text-brand-primary transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
