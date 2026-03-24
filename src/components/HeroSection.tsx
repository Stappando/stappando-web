'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { type WCProduct, decodeHtml, formatPrice, getDiscount, getProduttore } from '@/lib/api';
import { DEFAULT_VENDOR_NAME } from '@/lib/config';
import { useCartStore } from '@/store/cart';

interface Props {
  circuitoProducts: WCProduct[];
}

/* ── Occasion pills ─────────────────────────────────────── */

const OCCASIONS = [
  { label: 'Aperitivo', href: '/cerca?tag=occasione&q=aperitivo' },
  { label: 'Cena speciale', href: '/cerca?tag=occasione&q=cena' },
  { label: 'Idea regalo', href: '/cerca?tag=regali' },
  { label: 'Sotto 15€', href: '/cerca?max=15' },
  { label: 'Bollicine', href: '/cerca?q=bollicine' },
  { label: 'Best seller', href: '/cerca?sort=bestseller' },
];

/* ── Trust badges ───────────────────────────────────────── */

const TRUST_BADGES = [
  {
    label: 'Pagamento sicuro',
    icon: (
      <svg className="w-4 h-4 text-[#005667]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    label: 'Consegna 24–48h',
    icon: (
      <svg className="w-4 h-4 text-[#005667]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.9 17.9 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25m-3.75 0V5.625m0 12.75v-3.75m0 0h3.75m-3.75 0H7.5" />
      </svg>
    ),
  },
  {
    label: 'Selezionati da sommelier',
    icon: (
      <svg className="w-4 h-4 text-[#005667]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
  },
  {
    label: 'Reso gratuito',
    icon: (
      <svg className="w-4 h-4 text-[#005667]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
      </svg>
    ),
  },
];

/* ── Component ──────────────────────────────────────────── */

export default function HeroSection({ circuitoProducts }: Props) {
  return (
    <section className="bg-[#f8f6f1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 lg:py-11">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 lg:gap-12">
          {/* ── Left column ── */}
          <div>
            {/* Headline */}
            <h1 className="text-[26px] sm:text-[32px] lg:text-[36px] font-semibold text-[#1a1a1a] tracking-[-0.5px] leading-tight">
              Trova il vino perfetto
            </h1>
            <p className="text-[12px] sm:text-[14px] text-[#999] mt-1 mb-4 lg:mb-5">
              anche dai piccoli produttori locali
            </p>
            <p className="text-[13px] sm:text-[15px] text-[#666] leading-relaxed mb-5 lg:mb-6 max-w-lg">
              Selezionato dal nostro sommelier, consegnato a casa tua in 24–48h.
            </p>

            {/* Search bar — opens SearchOverlay on focus/click */}
            <Link
              href="/cerca"
              className="flex items-center gap-3 bg-white rounded-[10px] border-2 border-[#005667] shadow-[0_2px_12px_rgba(0,86,103,0.08)] px-4 py-3 lg:py-3.5 mb-5 lg:mb-6 max-w-lg group"
            >
              <svg className="w-5 h-5 text-[#005667] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="flex-1 text-[14px] text-[#999] truncate">Cerca vino, occasione o abbinamento…</span>
              <span className="shrink-0 bg-[#005667] text-white text-[12px] font-bold px-4 py-1.5 rounded-[7px] group-hover:bg-[#004555] transition-colors">
                Cerca
              </span>
            </Link>

            {/* Occasion pills */}
            <div className="flex flex-wrap gap-2 mb-5 lg:mb-6 overflow-x-auto no-scrollbar lg:overflow-visible">
              {OCCASIONS.map((o) => (
                <Link
                  key={o.label}
                  href={o.href}
                  className="shrink-0 px-3.5 py-1.5 rounded-full border-[1.5px] border-[#e5e5e5] text-[12px] text-[#666] hover:border-[#005667] hover:text-[#005667] transition-colors"
                >
                  {o.label}
                </Link>
              ))}
            </div>

            {/* Trust badges */}
            <div className="border-t border-[#e8e4dc] pt-4 lg:pt-5">
              {/* Desktop: horizontal row */}
              <div className="hidden sm:flex items-center gap-6">
                {TRUST_BADGES.map((b) => (
                  <div key={b.label} className="flex items-center gap-1.5">
                    {b.icon}
                    <span className="text-[11px] text-[#666]">{b.label}</span>
                  </div>
                ))}
              </div>
              {/* Mobile: 2x2 grid */}
              <div className="grid grid-cols-2 gap-3 sm:hidden">
                {TRUST_BADGES.map((b) => (
                  <div key={b.label} className="flex items-center gap-1.5">
                    {b.icon}
                    <span className="text-[12px] text-[#666]">{b.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right column — Circuito products ── */}
          <div className="lg:block">
            <p className="text-[11px] font-bold text-[#005667] uppercase tracking-[0.06em] mb-3">
              ★ Scelti dal Sommelier
            </p>

            <div className="space-y-3">
              {circuitoProducts.slice(0, 3).map((product) => (
                <CircuitoCard key={product.id} product={product} />
              ))}
              {/* Show only 2 on mobile */}
              <style>{`@media (max-width: 1023px) { .circuito-card:nth-child(n+3) { display: none; } }`}</style>
            </div>

            <Link
              href="/cerca"
              className="block text-center text-[12px] font-medium text-[#005667] hover:underline mt-4"
            >
              Vedi tutti i vini →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Circuito product card ──────────────────────────────── */

function CircuitoCard({ product }: { product: WCProduct }) {
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);

  const produttore = getProduttore(product);
  const discount = getDiscount(product);
  const region = product.attributes?.find(a => a.name === 'Regione')?.options?.[0] || '';
  const vendorName = product._vendorName || product.store?.name || DEFAULT_VENDOR_NAME;

  const handleAdd = useCallback(() => {
    addItem({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price),
      image: product.images[0]?.src || '',
      vendorId: product._vendorId || String(product.store?.id || 'default'),
      vendorName,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }, [addItem, product, vendorName]);

  return (
    <div className="circuito-card flex gap-3.5 p-3.5 rounded-xl border-[1.5px] border-[#d9c39a] bg-white">
      {/* Image */}
      <Link href={`/prodotto/${product.slug}`} className="relative w-14 h-20 shrink-0 rounded-lg overflow-hidden bg-[#f0ece4]">
        {product.images[0]?.src && (
          <Image
            src={product.images[0].src}
            alt={decodeHtml(product.name)}
            fill
            className="object-contain p-1"
            sizes="56px"
          />
        )}
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col">
        <Link href={`/prodotto/${product.slug}`} className="hover:text-[#005667] transition-colors">
          <p className="text-[13px] font-semibold text-[#1a1a1a] line-clamp-2 leading-tight">{decodeHtml(product.name)}</p>
        </Link>
        {(produttore || region) && (
          <p className="text-[11px] text-[#888] mt-0.5 line-clamp-1">
            {[produttore, region].filter(Boolean).join(' · ')}
          </p>
        )}
        <div className="flex items-center gap-2 mt-auto pt-1.5">
          <span className="text-[16px] font-bold text-[#005667]">{formatPrice(product.price)} €</span>
          {product.on_sale && product.regular_price && (
            <span className="text-[11px] text-[#bbb] line-through">{formatPrice(product.regular_price)} €</span>
          )}
        </div>
      </div>

      {/* Add button */}
      <div className="flex items-end shrink-0">
        <button
          onClick={handleAdd}
          className={`px-3.5 py-1.5 rounded-[7px] text-[12px] font-semibold transition-all ${
            added
              ? 'bg-green-500 text-white'
              : 'bg-[#005667] text-white hover:bg-[#004555]'
          }`}
        >
          {added ? '✓' : '+ Aggiungi'}
        </button>
      </div>
    </div>
  );
}
