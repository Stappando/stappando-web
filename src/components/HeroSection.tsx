'use client';

import Link from 'next/link';
import { type WCProduct } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import IncentiveBlock from '@/components/IncentiveBlock';

interface Props {
  circuitoProducts: WCProduct[];
}

/* ── Occasion pills with unique colors ──────────────────── */

const OCCASIONS_DESKTOP = [
  { label: 'Aperitivo', href: '/cerca?tag=occasione&q=aperitivo', bg: '#005667', color: '#fff' },
  { label: 'Tutti i giorni', href: '/cerca?max_price=8', bg: '#3D2B1A', color: '#e8ddd0' },
  { label: 'Scorta', href: '/cerca?tag=occasione&q=scorta', bg: '#2C2C2A', color: '#d3d1c7' },
  { label: 'Regalo', href: '/cerca?tag=regali', bg: '#5C3317', color: '#f0e0d0' },
  { label: 'Bollicine', href: '/cerca?q=bollicine', bg: '#d9c39a', color: '#3D2B1A' },
  { label: 'Sotto i 15€', href: '/cerca?max_price=15', bg: '#1C3A2A', color: '#c8e6d4' },
];

const OCCASIONS_MOBILE = [
  OCCASIONS_DESKTOP[0], // Aperitivo
  OCCASIONS_DESKTOP[1], // Tutti i giorni
  OCCASIONS_DESKTOP[3], // Regalo
  OCCASIONS_DESKTOP[4], // Bollicine
  OCCASIONS_DESKTOP[5], // Sotto i 15€
];

/* ── Trust badges ───────────────────────────────────────── */

const TRUST_BADGES = [
  {
    label: 'Pagamento sicuro',
    icon: <svg className="w-[13px] h-[13px] text-[#005667]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  },
  {
    label: 'Consegna 24–48h',
    icon: <svg className="w-[13px] h-[13px] text-[#005667]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.9 17.9 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25m-3.75 0V5.625m0 12.75v-3.75m0 0h3.75m-3.75 0H7.5" /></svg>,
  },
  {
    label: 'Selezione del sommelier',
    icon: <svg className="w-[13px] h-[13px] text-[#005667]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>,
  },
  {
    label: 'Reso gratuito',
    icon: <svg className="w-[13px] h-[13px] text-[#005667]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /></svg>,
  },
];

/* ── Hero Component ─────────────────────────────────────── */

export default function HeroSection({ circuitoProducts }: Props) {
  return (
    <section className="bg-[#f8f6f1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 lg:gap-10">

          {/* ── Left column ── */}
          <div>
            {/* Headline */}
            <h1 className="text-[26px] lg:text-[36px] font-semibold text-[#1a1a1a] tracking-[-0.5px] leading-tight mb-5 lg:mb-6">
              Da dove vuoi iniziare?
            </h1>

            {/* Desktop pills */}
            <div className="hidden sm:flex flex-wrap gap-2 mb-0">
              {OCCASIONS_DESKTOP.map((o) => (
                <Link
                  key={o.label}
                  href={o.href}
                  style={{ backgroundColor: o.bg, color: o.color }}
                  className="shrink-0 px-[18px] py-[9px] rounded-full text-[12px] font-medium hover:opacity-85 transition-opacity"
                >
                  {o.label}
                </Link>
              ))}
            </div>

            {/* Mobile pills — horizontal scroll */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar sm:hidden mb-0">
              {OCCASIONS_MOBILE.map((o) => (
                <Link
                  key={o.label}
                  href={o.href}
                  style={{ backgroundColor: o.bg, color: o.color }}
                  className="shrink-0 px-[14px] py-[8px] rounded-full text-[11px] font-medium hover:opacity-85 transition-opacity"
                >
                  {o.label}
                </Link>
              ))}
            </div>

            {/* Divider "oppure" */}
            <div className="flex items-center gap-3 my-3.5 lg:my-3">
              <div className="flex-1 h-px bg-[#e0dbd4]" />
              <span className="text-[11px] text-[#aaa]">oppure</span>
              <div className="flex-1 h-px bg-[#e0dbd4]" />
            </div>

            {/* Search bar */}
            <form
              onSubmit={(e) => { e.preventDefault(); const v = (e.currentTarget.elements.namedItem('q') as HTMLInputElement)?.value?.trim(); window.location.href = v ? `/cerca?q=${encodeURIComponent(v)}` : '/cerca'; }}
              className="flex items-center gap-3 bg-white rounded-[10px] border-2 border-[#005667] shadow-[0_2px_12px_rgba(0,86,103,0.08)] px-4 py-3 mb-6 group"
            >
              <svg className="w-5 h-5 text-[#005667] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input name="q" type="text" placeholder="Cerca vino, occasione o abbinamento…" className="flex-1 text-[14px] text-[#333] outline-none bg-transparent placeholder:text-[#999]" />
              <button type="submit" className="shrink-0 bg-[#005667] text-white text-[13px] font-bold px-[18px] py-[7px] rounded-[7px] hover:bg-[#004555] transition-colors">
                Cerca
              </button>
            </form>

            {/* Trust badges */}
            <div className="border-t border-[#e8e4dc] pt-[18px]">
              {/* Desktop */}
              <div className="hidden sm:flex items-center gap-[18px]">
                {TRUST_BADGES.map((b) => (
                  <div key={b.label} className="flex items-center gap-1.5">
                    {b.icon}
                    <span className="text-[11px] text-[#666]">{b.label}</span>
                  </div>
                ))}
              </div>
              {/* Mobile */}
              <div className="grid grid-cols-2 gap-3 sm:hidden">
                {TRUST_BADGES.map((b) => (
                  <div key={b.label} className="flex items-center gap-1.5">
                    {b.icon}
                    <span className="text-[12px] text-[#666]">{b.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Incentive block — compact, inside left column */}
            <div className="mt-5">
              <IncentiveBlock />
            </div>
          </div>

          {/* ── Right column — Circuito grid ── */}
          <div>
            <p className="text-[11px] font-bold text-[#005667] uppercase tracking-[0.06em] mb-3">
              ★ Scelti dal Sommelier
            </p>

            {/* 2 cards everywhere — desktop and mobile */}
            <div className="grid grid-cols-2 gap-3">
              {circuitoProducts.slice(0, 2).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            <Link
              href="/cerca"
              className="block text-center text-[12px] font-medium text-[#005667] hover:underline mt-2.5"
            >
              Vedi tutti i vini →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
