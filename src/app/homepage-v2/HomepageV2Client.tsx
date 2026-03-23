'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '@/store/cart';
import { API_CONFIG } from '@/lib/config';

/* ── Types ─────────────────────────────── */
interface Product {
  id: number; name: string; slug: string; price: string;
  regular_price: string; sale_price: string; on_sale: boolean;
  images: { src: string }[]; categories: { id: number; name: string; slug: string }[];
  tags: { id: number; name: string }[]; stock_status: string;
  attributes: { name: string; options: string[] }[];
  _vendorName?: string; _vendorId?: string;
}

/* ── Helpers ────────────────────────────── */
const fmt = (p: string) => parseFloat(p || '0').toFixed(2).replace('.', ',');
const pct = (r: string, s: string) => {
  const rv = parseFloat(r), sv = parseFloat(s);
  return rv > 0 && sv > 0 ? Math.round((1 - sv / rv) * 100) : 0;
};

/* ── Product Card ──────────────────────── */
function ProductCard({ p }: { p: Product }) {
  const addItem = useCartStore(s => s.addItem);
  const [added, setAdded] = useState(false);
  const vendor = p._vendorName || 'Stappando Enoteca';
  const isStappando = vendor.toLowerCase().includes('stappando');
  const discount = p.on_sale ? pct(p.regular_price, p.sale_price) : 0;
  const img = p.images?.[0]?.src || '';

  const handleAdd = () => {
    addItem({ id: p.id, name: p.name, price: parseFloat(p.price), image: img, vendorId: p._vendorId || 'stappando', vendorName: vendor });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col">
      {/* Image */}
      <Link href={`/prodotto/${p.slug}`} className="relative aspect-square bg-gradient-to-b from-gray-50 to-white p-4 flex items-center justify-center overflow-hidden">
        {discount > 0 && (
          <span className="absolute top-3 left-3 z-10 bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">-{discount}%</span>
        )}
        {img && <img src={img} alt={p.name} className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500" loading="lazy" />}
      </Link>

      {/* Info */}
      <div className="p-3.5 pt-2 flex flex-col flex-1">
        {/* Badge spedizione */}
        <div className="flex items-center gap-1 mb-1.5">
          {isStappando ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>
              Spedito da Stappando
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
              🍇 Spedito dalla cantina
            </span>
          )}
        </div>

        {/* Name */}
        <Link href={`/prodotto/${p.slug}`} className="text-sm font-medium text-gray-900 leading-snug line-clamp-2 hover:text-[#055667] transition-colors mb-auto min-h-[2.5rem]">
          {p.name}
        </Link>

        {/* Price + CTA */}
        <div className="flex items-end justify-between mt-2.5 gap-2">
          <div>
            {p.on_sale && p.regular_price && (
              <span className="text-xs text-gray-400 line-through mr-1">{fmt(p.regular_price)}€</span>
            )}
            <span className="text-lg font-bold text-gray-900">{fmt(p.price)}<span className="text-sm">€</span></span>
          </div>
          <button
            onClick={handleAdd}
            className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
              added
                ? 'bg-emerald-500 text-white scale-95'
                : 'bg-[#055667] text-white hover:bg-[#044556] active:scale-95'
            }`}
          >
            {added ? '✓ Aggiunto' : 'Aggiungi'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Countdown Timer ───────────────────── */
function Countdown() {
  const [time, setTime] = useState({ h: 0, m: 0, s: 0 });
  useEffect(() => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const tick = () => {
      const diff = Math.max(0, end.getTime() - Date.now());
      setTime({ h: Math.floor(diff / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000) });
    };
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, []);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    <div className="flex items-center gap-1.5">
      {[time.h, time.m, time.s].map((v, i) => (
        <span key={i} className="flex items-center">
          <span className="bg-gray-900 text-white text-sm font-mono font-bold px-2 py-1 rounded-lg">{pad(v)}</span>
          {i < 2 && <span className="text-gray-400 font-bold mx-0.5">:</span>}
        </span>
      ))}
    </div>
  );
}

/* ── Main Homepage ─────────────────────── */
export default function HomepageV2Client() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/products.json')
      .then(r => r.json())
      .then((all: Product[]) => { setProducts(all); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  // Derive sections from products
  const bestsellers = products.filter(p => p.stock_status === 'instock').sort((a, b) => parseFloat(b.price) - parseFloat(a.price)).slice(0, 8);
  const offerte = products.filter(p => p.on_sale && p.stock_status === 'instock').slice(0, 6);
  const cantina = products.filter(p => !(p._vendorName || '').toLowerCase().includes('stappando') && p._vendorName).slice(0, 6);
  const sceltiPerTe = products.filter(p => p.tags?.some(t => t.id === API_CONFIG.tags.circuito)).slice(0, 6);

  // Occasions
  const occasions = [
    { label: 'Aperitivo', emoji: '🥂', color: 'from-amber-50 to-orange-50', border: 'border-amber-100', slug: 'aperitivi' },
    { label: 'Cena speciale', emoji: '🍷', color: 'from-red-50 to-rose-50', border: 'border-red-100', slug: 'vini-rossi' },
    { label: 'Idee regalo', emoji: '🎁', color: 'from-purple-50 to-pink-50', border: 'border-purple-100', slug: 'vuoi-fare-un-regalo' },
    { label: 'Sotto 15€', emoji: '💰', color: 'from-emerald-50 to-teal-50', border: 'border-emerald-100', slug: '' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* ── Announcement Bar ─────────────── */}
      <div className="bg-[#055667] text-white text-center py-2 text-xs sm:text-sm font-medium tracking-wide">
        Spedizione gratuita da €69 • Consegna veloce in tutta Italia
      </div>

      {/* ── Header ───────────────────────── */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          {/* Logo */}
          <Link href="/homepage-v2" className="shrink-0">
            <img src="/logo.png" alt="Stappando" className="h-8 sm:h-10 w-auto" />
          </Link>

          {/* Search */}
          <div className="flex-1 max-w-xl mx-auto">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <input
                type="text"
                placeholder="Cerca vini, cantine, vitigni..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#055667] focus:ring-1 focus:ring-[#055667]/20 transition-all"
              />
            </div>
          </div>

          {/* Nav — desktop */}
          <nav className="hidden lg:flex items-center gap-5">
            {['Rossi', 'Bianchi', 'Bollicine', 'Offerte', 'Regali'].map(item => (
              <Link key={item} href={`/cerca?cat=${item.toLowerCase()}`} className="text-sm font-medium text-gray-600 hover:text-[#055667] transition-colors whitespace-nowrap">
                {item}
              </Link>
            ))}
          </nav>

          {/* Icons */}
          <div className="flex items-center gap-3">
            <Link href="/account" className="text-gray-500 hover:text-[#055667] transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>
            </Link>
            <button className="text-gray-500 hover:text-[#055667] transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/></svg>
            </button>
            <Link href="/cerca" className="relative text-gray-500 hover:text-[#055667] transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/></svg>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────── */}
      <section className="relative bg-gradient-to-br from-[#f8f5f0] to-[#ebe5db] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:py-20 flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
          <div className="flex-1 text-center lg:text-left">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-4">
              Vini artigianali<br />
              <span className="text-[#055667]">dai produttori italiani</span><br />
              a casa tua
            </h1>
            <p className="text-base sm:text-lg text-gray-600 mb-8 max-w-lg mx-auto lg:mx-0">
              Selezionati da Stappando, spediti rapidamente da noi o direttamente dalle cantine.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link href="/cerca" className="inline-flex items-center justify-center gap-2 bg-[#055667] text-white px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-[#044556] transition-colors shadow-lg shadow-[#055667]/20">
                Scopri i vini
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
              </Link>
              <Link href="/cerca?cat=regali" className="inline-flex items-center justify-center gap-2 bg-white text-gray-700 px-8 py-3.5 rounded-xl font-bold text-sm border border-gray-200 hover:border-[#055667] hover:text-[#055667] transition-colors">
                🎁 Idee regalo
              </Link>
            </div>
          </div>
          <div className="flex-1 max-w-md lg:max-w-lg">
            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl">
              <img src="https://stappando.it/wp-content/uploads/2023/03/stappando-enocultura-vini.jpg" alt="Vini Stappando" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust Bar ────────────────────── */}
      <section className="border-b border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: '⭐', text: '+1000 clienti soddisfatti' },
            { icon: '🚚', text: 'Consegna in 24-48h' },
            { icon: '📦', text: 'Imballi anti-danno' },
            { icon: '🔒', text: 'Pagamenti sicuri' },
          ].map((t, i) => (
            <div key={i} className="flex items-center gap-2.5 justify-center text-center">
              <span className="text-xl">{t.icon}</span>
              <span className="text-xs sm:text-sm font-medium text-gray-700">{t.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bestsellers ──────────────────── */}
      {loaded && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">I più venduti</h2>
              <p className="text-sm text-gray-500 mt-1">I vini preferiti dai nostri clienti</p>
            </div>
            <Link href="/cerca?sort=popularity" className="text-sm font-semibold text-[#055667] hover:underline hidden sm:block">Vedi tutti →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {bestsellers.map(p => <ProductCard key={p.id} p={p} />)}
          </div>
        </section>
      )}

      {/* ── Occasion Shortcuts ───────────── */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Cosa cerchi?</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {occasions.map(o => (
            <Link key={o.label} href={o.slug ? `/cerca?cat=${o.slug}` : '/cerca?max=15'} className={`bg-gradient-to-br ${o.color} border ${o.border} rounded-2xl p-5 sm:p-6 text-center hover:shadow-md hover:scale-[1.02] transition-all duration-300`}>
              <span className="text-3xl sm:text-4xl block mb-2">{o.emoji}</span>
              <span className="text-sm sm:text-base font-bold text-gray-800">{o.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Dalle Cantine ────────────────── */}
      {cantina.length > 0 && loaded && (
        <section className="bg-[#faf8f5]">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Dalle cantine</h2>
                <p className="text-sm text-gray-500 mt-1">Vini unici spediti direttamente dai produttori</p>
              </div>
              <Link href="/cerca" className="text-sm font-semibold text-[#055667] hover:underline hidden sm:block">Scopri tutti →</Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {cantina.map(p => <ProductCard key={p.id} p={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── Offerte della settimana ──────── */}
      {offerte.length > 0 && loaded && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Offerte della settimana</h2>
              <p className="text-sm text-gray-500 mt-1">Approfittane prima che finiscano</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Termina tra</span>
              <Countdown />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {offerte.map(p => <ProductCard key={p.id} p={p} />)}
          </div>
        </section>
      )}

      {/* ── Scelti per te ────────────────── */}
      {sceltiPerTe.length > 0 && loaded && (
        <section className="bg-gradient-to-br from-[#055667] to-[#033d4a] text-white">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">★ Scelti per te</h2>
                <p className="text-sm text-white/70 mt-1">La nostra selezione esclusiva</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {sceltiPerTe.map(p => <ProductCard key={p.id} p={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── Brand Block ──────────────────── */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="bg-gradient-to-br from-[#f8f5f0] to-[#ebe5db] rounded-3xl p-8 sm:p-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Selezioniamo piccoli produttori italiani</h2>
          <p className="text-base text-gray-600 max-w-2xl mx-auto mb-6">
            Ogni bottiglia è selezionata dal nostro team per portarti vini autentici, dal territorio alla tua tavola. Supportiamo le piccole cantine italiane e ti garantiamo qualità e freschezza.
          </p>
          <Link href="/chi-siamo" className="inline-flex items-center gap-2 text-[#055667] font-bold text-sm hover:underline">
            Scopri la nostra storia
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────── */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold text-sm mb-4">Shop</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <Link href="/cerca" className="block hover:text-white transition-colors">Tutti i vini</Link>
                <Link href="/cerca?cat=offerte" className="block hover:text-white transition-colors">Offerte</Link>
                <Link href="/cerca?cat=regali" className="block hover:text-white transition-colors">Idee regalo</Link>
                <Link href="/cerca?sort=new" className="block hover:text-white transition-colors">Novità</Link>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-4">Informazioni</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <Link href="/chi-siamo" className="block hover:text-white transition-colors">Chi siamo</Link>
                <Link href="/spedizioni" className="block hover:text-white transition-colors">Spedizioni</Link>
                <Link href="/pagamenti" className="block hover:text-white transition-colors">Pagamenti</Link>
                <Link href="/resi-rimborsi" className="block hover:text-white transition-colors">Resi e rimborsi</Link>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-4">Supporto</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <Link href="/contatti" className="block hover:text-white transition-colors">Contattaci</Link>
                <Link href="/punti-pop" className="block hover:text-white transition-colors">Punti POP</Link>
                <Link href="/privacy-policy" className="block hover:text-white transition-colors">Privacy Policy</Link>
                <Link href="/termini-condizioni" className="block hover:text-white transition-colors">Termini e condizioni</Link>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-4">Seguici</h4>
              <div className="flex gap-3 mb-4">
                {['facebook', 'instagram', 'tiktok', 'youtube'].map(s => (
                  <a key={s} href={`https://${s}.com/stappando`} target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center text-gray-400 hover:bg-[#055667] hover:text-white transition-all text-xs font-bold uppercase">
                    {s[0].toUpperCase()}
                  </a>
                ))}
              </div>
              <p className="text-xs text-gray-500">Pagamenti sicuri</p>
              <div className="flex gap-2 mt-2">
                {['Visa', 'MC', 'Amex', 'PayPal'].map(m => (
                  <span key={m} className="bg-gray-800 text-gray-400 text-[9px] font-bold px-2 py-1 rounded">{m}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-xs text-gray-500">© {new Date().getFullYear()} Stappando S.r.l.s. — P.IVA 16712731001</p>
            <p className="text-[10px] text-gray-600">Vietata la vendita di alcolici ai minori di 18 anni</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
