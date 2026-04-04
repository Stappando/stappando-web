'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '@/store/cart';
import { formatPrice } from '@/lib/api';
import { useAnalyticsStore } from '@/store/analytics';
import { getAbbinamentoIcon } from '@/lib/abbinamenti-icons';
import { gtmViewItem, gtmAddToCart } from '@/lib/gtm';
import { trackFbEvent } from '@/lib/meta-pixel';

interface GalleryImage { id: number; src: string; alt: string; }
interface Spec { key: string; value: string; }

interface PDPProduct {
  id: number;
  slug: string;
  name: string;
  price: string;
  regularPrice: string;
  onSale: boolean;
  stockStatus: string;
  stockQuantity: number | null;
  vendorName: string;
  vendorId: string;
  produttore: string;
  discount: number;
  isCircuito: boolean;
  circuitoBadge: string;
  alcol: string;
  denominazione: string;
  abbinamenti: string[];
  shortDesc: string;
  description: string;
  specs: Spec[];
  allaVista: string;
  alNaso: string;
  alPalato: string;
  vinificazione: string;
  affinamento: string;
  popPoints: number;
  galleryImages: GalleryImage[];
  mainImage: string;
  dateCreated: string;
}

export default function PDPClient({ product: p }: { product: PDPProduct }) {
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const openCheckout = useCartStore((s) => s.openCheckout);
  const trackView = useCartStore((s) => s.trackView);

  // Track product view
  useEffect(() => {
    trackView(p.id, p.slug);
    useAnalyticsStore.getState().trackProductView(p.id, p.name, 'direct');
    gtmViewItem({ item_id: p.id, item_name: p.name, price: parseFloat(p.price), item_brand: p.produttore });
    trackFbEvent('ViewContent', { content_name: p.name, content_ids: [String(p.id)], content_type: 'product', value: parseFloat(p.price), currency: 'EUR' });
  }, [p.id, p.slug, p.name, p.price, p.produttore, trackView]);

  // Close lightbox on ESC
  const closeLightbox = useCallback(() => setLightboxOpen(false), []);
  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') setActiveImg(i => (i - 1 + p.galleryImages.length) % p.galleryImages.length);
      if (e.key === 'ArrowRight') setActiveImg(i => (i + 1) % p.galleryImages.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxOpen, closeLightbox, p.galleryImages.length]);

  const handleAdd = () => {
    for (let i = 0; i < qty; i++) {
      addItem({ id: p.id, name: p.name, price: parseFloat(p.price), image: p.mainImage, vendorId: p.vendorId, vendorName: p.vendorName });
    }
    gtmAddToCart({ item_id: p.id, item_name: p.name, price: parseFloat(p.price), quantity: qty, item_brand: p.produttore });
    trackFbEvent('AddToCart', { content_name: p.name, content_ids: [String(p.id)], content_type: 'product', value: parseFloat(p.price) * qty, currency: 'EUR' });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    handleAdd();
    setTimeout(() => openCheckout(), 100);
  };

  const prevImg = () => setActiveImg(i => (i - 1 + p.galleryImages.length) % p.galleryImages.length);
  const nextImg = () => setActiveImg(i => (i + 1) % p.galleryImages.length);

  const inStock = p.stockStatus === 'instock';
  const maxQty = p.stockQuantity !== null && p.stockQuantity > 0 ? p.stockQuantity : 99;
  const lowStock = p.stockQuantity !== null && p.stockQuantity > 0 && p.stockQuantity <= 3;

  const isNew = (() => {
    if (!p.dateCreated) return false;
    const created = new Date(p.dateCreated).getTime();
    return !isNaN(created) && Date.now() - created < 14 * 24 * 60 * 60 * 1000;
  })();

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
        {/* ═══ LEFT COLUMN ═══ */}
        <div className="space-y-4">
          {/* Gallery */}
          <div className="relative bg-white border border-[#e8e4dc] rounded-2xl p-5 overflow-hidden" style={{ height: 'clamp(320px, 45vw, 460px)' }}>
            {p.galleryImages[activeImg]?.src ? (
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                className="absolute inset-0 w-full h-full cursor-zoom-in focus:outline-none group"
                aria-label="Ingrandisci immagine"
              >
                <Image src={p.galleryImages[activeImg].src} alt={p.galleryImages[activeImg].alt} fill className="object-contain p-2" priority sizes="(max-width: 1024px) 100vw, 50vw" />
                {/* Zoom hint */}
                <span className="absolute bottom-3 right-3 w-7 h-7 bg-white/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  <svg className="w-4 h-4 text-[#666]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0zm-3-1H8m3-3v6" /></svg>
                </span>
              </button>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#ccc]">
                <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
            )}

            {/* Pills top-left */}
            <div className="absolute top-4 left-4 flex flex-wrap gap-1.5 z-10">
              {p.isCircuito && (
                <span className="bg-[#d9c39a] text-[#1a1a1a] text-[14px] font-bold px-2.5 py-1 rounded-full">★ Sommelier</span>
              )}
              {p.alcol && (
                <span className="bg-white/95 border border-[#e0dbd4] text-[14px] font-semibold text-[#666] px-2.5 py-1 rounded-full">{p.alcol}</span>
              )}
              {p.denominazione && (
                <span className="bg-white/95 border border-[#e0dbd4] text-[14px] font-semibold text-[#666] px-2.5 py-1 rounded-full">{p.denominazione}</span>
              )}
            </div>

            {/* Arrows */}
            {p.galleryImages.length > 1 && (
              <>
                <button onClick={prevImg} className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white border border-[#e5e5e5] rounded-full flex items-center justify-center hover:border-[#005667] transition-colors z-10">
                  <svg className="w-4 h-4 text-[#666]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button onClick={nextImg} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white border border-[#e5e5e5] rounded-full flex items-center justify-center hover:border-[#005667] transition-colors z-10">
                  <svg className="w-4 h-4 text-[#666]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {p.galleryImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {p.galleryImages.map((img, i) => (
                <button key={img.id} onClick={() => setActiveImg(i)} className={`relative w-[52px] h-[52px] shrink-0 rounded-lg overflow-hidden border-[1.5px] transition-colors ${i === activeImg ? 'border-[#005667]' : 'border-[#e8e4dc]'}`}>
                  {img.src && <Image src={img.src} alt={img.alt} fill className="object-contain p-1" sizes="52px" />}
                </button>
              ))}
            </div>
          )}

          {/* Sommelier box — desktop only */}
          {p.isCircuito && (
            <div className="hidden lg:block bg-[#1a1a1a] border-[1.5px] border-[#d9c39a] rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-[#d9c39a] flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-[#1a1a1a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <div>
                  <p className="text-[11px] text-[#d9c39a] font-bold uppercase tracking-widest mb-1">★ Scelta del Sommelier</p>
                  <p className="text-[15px] text-[#ccc] leading-relaxed italic">&ldquo;{p.circuitoBadge}&rdquo;</p>
                </div>
              </div>
            </div>
          )}

          {/* Abbinamenti — desktop only */}
          {p.abbinamenti.length > 0 && (
            <div className="hidden lg:block mb-6">
              <p className="text-[14px] text-[#888] font-semibold uppercase tracking-wider mb-2">Abbinamenti</p>
              <div className="flex flex-wrap gap-2">
                {p.abbinamenti.map((a, i) => {
                  const icon = getAbbinamentoIcon(a);
                  return (
                    <span key={i} className="inline-flex items-center gap-1.5 bg-[#f0f7f5] text-[#005667] border border-[#005667]/30 rounded-full pl-1.5 pr-3 py-1 text-[13px] font-medium">
                      {icon && <img src={icon} alt="" aria-hidden="true" className="w-5 h-5 object-contain rounded-full shrink-0" />}
                      {a}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Note degustazione — sotto abbinamenti, unica posizione */}
          {(p.allaVista || p.alNaso || p.alPalato) && (
            <div className="mb-6 mt-2">
              <h3 className="text-[14px] text-[#888] font-semibold uppercase tracking-wider mb-3">Note di degustazione</h3>
              <div className="space-y-3">
                {p.allaVista && (
                  <div className="flex items-start gap-3">
                    <img src="https://stappando.it/wp-content/uploads/2026/04/vista.png" alt="Vista" className="w-7 h-7 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-bold text-[#b8973f] uppercase tracking-wider">Alla vista</p>
                      <p className="text-[13px] text-[#555] leading-relaxed">{p.allaVista}</p>
                    </div>
                  </div>
                )}
                {p.alNaso && (
                  <div className="flex items-start gap-3">
                    <img src="https://stappando.it/wp-content/uploads/2026/04/naso.png" alt="Naso" className="w-7 h-7 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-bold text-[#7b5ea7] uppercase tracking-wider">Al naso</p>
                      <p className="text-[13px] text-[#555] leading-relaxed">{p.alNaso}</p>
                    </div>
                  </div>
                )}
                {p.alPalato && (
                  <div className="flex items-start gap-3">
                    <img src="https://stappando.it/wp-content/uploads/2026/04/gusto.png" alt="Gusto" className="w-7 h-7 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-bold text-[#005667] uppercase tracking-wider">Al palato</p>
                      <p className="text-[13px] text-[#555] leading-relaxed">{p.alPalato}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Produzione — sotto note degustazione */}
          {(p.vinificazione || p.affinamento) && (
            <div className="mb-6">
              <h3 className="text-[14px] text-[#888] font-semibold uppercase tracking-wider mb-3">Produzione</h3>
              <div className="space-y-2.5">
                {p.vinificazione && (
                  <div>
                    <p className="text-[11px] font-bold text-[#888] uppercase tracking-wider mb-0.5">Vinificazione</p>
                    <p className="text-[13px] text-[#444] leading-relaxed">{p.vinificazione}</p>
                  </div>
                )}
                {p.affinamento && (
                  <div>
                    <p className="text-[11px] font-bold text-[#888] uppercase tracking-wider mb-0.5">Affinamento</p>
                    <p className="text-[13px] text-[#444] leading-relaxed">{p.affinamento}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ═══ RIGHT COLUMN ═══ */}
        <div>
          {/* Produttore — cliccabile */}
          {p.produttore && (
            <Link href={`/cantine/${encodeURIComponent(p.produttore.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))}`} className="text-[15px] text-[#d9c39a] font-bold uppercase tracking-wide mb-1.5 block hover:text-[#005667] transition-colors">
              {p.produttore}
            </Link>
          )}

          {/* Title */}
          <div className="flex items-start gap-2 mb-4">
            <h1 className="text-[24px] font-bold text-[#1a1a1a] leading-[1.3]">{p.name}</h1>
            {isNew && (
              <span className="shrink-0 mt-1 bg-[#00b341] text-white text-[11px] font-bold px-2 py-0.5 rounded-md tracking-wide uppercase">Novità</span>
            )}
          </div>

          {/* Price */}
          <div className="flex items-center flex-wrap gap-2 mb-2">
            {p.onSale && p.regularPrice && (
              <>
                <span className="text-[14px] text-[#bbb] line-through">{formatPrice(p.regularPrice)}€</span>
                <span className="bg-[#c0392b] text-white text-[14px] font-bold px-2 py-0.5 rounded">-{p.discount}% SCONTO</span>
              </>
            )}
            <span className="text-[30px] font-bold text-[#005667]">{formatPrice(p.price)}€</span>
          </div>

          {/* POP points */}
          <div className="flex items-center gap-1.5 mb-5">
            <svg className="w-3.5 h-3.5 text-[#005667]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="text-[15px] text-[#888]">+{p.popPoints} Punti POP con questo acquisto</span>
          </div>

          {/* Low stock warning */}
          {lowStock && (
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c0392b] animate-pulse" />
              <span className="text-[15px] text-[#c0392b] font-semibold">Ultime {p.stockQuantity} bottiglie</span>
            </div>
          )}

          {/* Qty + Add to cart */}
          {inStock ? (
            <div className="space-y-3 mb-4">
              <div className="flex gap-3">
                <div className="flex items-center border-[1.5px] border-[#e5e5e5] rounded-lg overflow-hidden">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-10 h-11 flex items-center justify-center text-[#888] hover:text-[#1a1a1a] hover:bg-[#f5f5f5] transition-colors text-lg">−</button>
                  <span className="w-9 text-center font-semibold text-[#1a1a1a] text-[14px]">{qty}</span>
                  <button onClick={() => setQty(Math.min(maxQty, qty + 1))} disabled={qty >= maxQty} className="w-10 h-11 flex items-center justify-center text-[#888] hover:text-[#1a1a1a] hover:bg-[#f5f5f5] transition-colors text-lg disabled:opacity-30 disabled:cursor-not-allowed">+</button>
                </div>
                <button onClick={handleAdd} className="flex-1 h-11 bg-[#005667] text-white font-semibold text-[15px] rounded-lg hover:bg-[#004555] transition-colors flex items-center justify-center gap-2">
                  {added ? (
                    <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Aggiunto!</>
                  ) : (
                    <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>Aggiungi al carrello</>
                  )}
                </button>
              </div>
              <button onClick={handleBuyNow} className="w-full h-11 bg-[#1a1a1a] text-[#d9c39a] font-semibold text-[15px] rounded-lg hover:bg-[#2a2a2a] transition-colors">
                Acquista ora
              </button>
            </div>
          ) : (
            <div className="mb-4 py-3 px-4 bg-[#f0f0f0] rounded-lg text-center text-[15px] text-[#999] font-medium">
              Non disponibile
            </div>
          )}

          {/* Trust box */}
          <div className="bg-[#f8f6f1] rounded-xl p-3.5 space-y-2.5 mb-5">
            {[
              { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', text: 'Pagamento sicuro' },
              { icon: 'M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0', text: `Venduto e spedito da ${p.vendorName} · 24–48h` },
              { icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15', text: 'Reso gratuito entro 30 giorni' },
            ].map((row, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <svg className="w-4 h-4 text-[#005667] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d={row.icon} /></svg>
                <span className="text-[14px] text-[#666]">{row.text}</span>
              </div>
            ))}
          </div>

          {/* Short description */}
          {p.shortDesc && (
            <div className="bg-[#f8f6f1] border-l-[3px] border-[#e8e4dc] rounded-lg p-3.5 mb-5">
              <p className="text-[15px] text-[#444] leading-[1.7]">{p.shortDesc}</p>
            </div>
          )}

          {/* Specs table */}
          {p.specs.length > 0 && (
            <div className="mb-5">
              <h3 className="text-[14px] text-[#888] font-semibold uppercase tracking-wider mb-3">Caratteristiche</h3>
              <div>
                {p.specs.map((spec, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-[#f0f0f0] last:border-0">
                    <span className="text-[14px] text-[#888] uppercase tracking-wide">{spec.key}</span>
                    <span className="text-[14px] text-[#1a1a1a] font-medium text-right">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Abbinamenti — mobile */}
          {p.abbinamenti.length > 0 && (
            <div className="lg:hidden mb-5">
              <p className="text-[14px] text-[#888] font-semibold uppercase tracking-wider mb-2">Abbinamenti</p>
              <div className="flex flex-wrap gap-2">
                {p.abbinamenti.map((a, i) => {
                  const icon = getAbbinamentoIcon(a);
                  return (
                    <span key={i} className="inline-flex items-center gap-1.5 bg-[#f0f7f5] text-[#005667] border border-[#005667]/30 rounded-full pl-1.5 pr-3 py-1 text-[13px] font-medium">
                      {icon && <img src={icon} alt="" aria-hidden="true" className="w-5 h-5 object-contain rounded-full shrink-0" />}
                      {a}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sommelier box — mobile */}
          {p.isCircuito && (
            <div className="lg:hidden bg-[#1a1a1a] border-[1.5px] border-[#d9c39a] rounded-xl p-4 mb-5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-[#d9c39a] flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-[#1a1a1a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <div>
                  <p className="text-[11px] text-[#d9c39a] font-bold uppercase tracking-widest mb-1">★ Scelta del Sommelier</p>
                  <p className="text-[15px] text-[#ccc] leading-relaxed italic">&ldquo;{p.circuitoBadge}&rdquo;</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full description */}
      {p.description && (
        <div className="mt-10 max-w-3xl">
          <h2 className="text-[16px] font-bold text-[#1a1a1a] mb-4">Descrizione</h2>
          <div className="text-[15px] text-[#444] leading-[1.7] wp-content" dangerouslySetInnerHTML={{ __html: p.description }} />
        </div>
      )}

      {/* ═══ REVIEWS SECTION ═══ */}
      <ProductReviews productId={p.id} productName={p.name} />

      {/* ═══ MOBILE STICKY BAR ═══ */}
      {inStock && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#005667] px-4 py-3 flex items-center gap-3 z-50">
          <div className="flex items-center border-[1.5px] border-white/30 rounded-lg overflow-hidden">
            <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-9 h-11 flex items-center justify-center text-white text-lg">−</button>
            <span className="w-7 text-center text-white font-semibold text-[14px]">{qty}</span>
            <button onClick={() => setQty(Math.min(maxQty, qty + 1))} disabled={qty >= maxQty} className="w-9 h-11 flex items-center justify-center text-white text-lg disabled:opacity-30 disabled:cursor-not-allowed">+</button>
          </div>
          <button onClick={handleBuyNow} className="flex-1 h-11 bg-transparent border-2 border-white/60 text-white font-bold text-[14px] rounded-lg tracking-wide uppercase">
            Acquista ora
          </button>
        </div>
      )}
      {/* Spacer for sticky bar on mobile */}
      {inStock && <div className="lg:hidden h-16" />}

      {/* ═══ LIGHTBOX ═══ */}
      {lightboxOpen && p.galleryImages[activeImg]?.src && (
        <div
          className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Image container — stop propagation so clicking image doesn't close */}
          <div
            className="relative w-full h-full max-w-4xl max-h-[90vh] m-auto flex items-center justify-center p-4"
            onClick={e => e.stopPropagation()}
          >
            <Image
              src={p.galleryImages[activeImg].src}
              alt={p.galleryImages[activeImg].alt}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>

          {/* Close */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10"
            aria-label="Chiudi"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>

          {/* Counter */}
          {p.galleryImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-[13px] font-medium tabular-nums z-10">
              {activeImg + 1} / {p.galleryImages.length}
            </div>
          )}

          {/* Prev / Next */}
          {p.galleryImages.length > 1 && (
            <>
              <button
                onClick={e => { e.stopPropagation(); setActiveImg(i => (i - 1 + p.galleryImages.length) % p.galleryImages.length); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10"
                aria-label="Precedente"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button
                onClick={e => { e.stopPropagation(); setActiveImg(i => (i + 1) % p.galleryImages.length); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10"
                aria-label="Successiva"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}

/* ═══ Product Reviews ═══════════════════════════════════ */

function ProductReviews({ productId, productName }: { productId: number; productName: string }) {
  const [reviews, setReviews] = useState<{ id: number; reviewer: string; rating: number; review: string; date_created: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/reviews/product?productId=${productId}`)
      .then(r => r.ok ? r.json() : { reviews: [] })
      .then(d => { setReviews(d.reviews || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [productId]);

  if (loading) {
    return (
      <div id="recensioni" className="mt-10 max-w-3xl">
        <h2 className="text-[18px] font-bold text-[#1a1a1a] mb-5">Recensioni</h2>
        <div className="space-y-4">
          {[1, 2].map(i => <div key={i} className="h-24 bg-[#f0f0f0] rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <div id="recensioni" className="mt-10 max-w-3xl">
      <h2 className="text-[18px] font-bold text-[#1a1a1a] mb-1">Recensioni</h2>

      {reviews.length > 0 ? (
        <>
          {/* Average */}
          <div className="flex items-center gap-2 mb-6">
            <div className="flex">
              {[1, 2, 3, 4, 5].map(s => (
                <svg key={s} className={`w-5 h-5 ${s <= Math.round(avgRating) ? 'text-[#d9c39a]' : 'text-[#ddd]'}`} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
              ))}
            </div>
            <span className="text-[14px] font-semibold text-[#1a1a1a]">{avgRating.toFixed(1)}</span>
            <span className="text-[13px] text-[#888]">· {reviews.length} recension{reviews.length === 1 ? 'e' : 'i'}</span>
          </div>

          {/* Reviews list */}
          <div className="space-y-0">
            {reviews.map(r => (
              <div key={r.id} className="py-5 border-b border-[#f0f0f0] last:border-0">
                <div className="flex items-center gap-3 mb-2.5">
                  <div className="w-9 h-9 rounded-full bg-[#1a1a1a] flex items-center justify-center text-[#d9c39a] text-[13px] font-bold shrink-0">
                    {(r.reviewer?.[0] || '?').toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-[#1a1a1a]">{r.reviewer}</p>
                    <p className="text-[11px] text-[#bbb]">{(() => { const d = new Date(r.date_created); return !isNaN(d.getTime()) ? d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' }) : ''; })()}</p>
                  </div>
                </div>
                <div className="flex mb-2">
                  {[1, 2, 3, 4, 5].map(s => (
                    <svg key={s} className={`w-4 h-4 ${s <= r.rating ? 'text-[#d9c39a]' : 'text-[#ddd]'}`} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                  ))}
                </div>
                {r.review && <p className="text-[14px] text-[#444] leading-relaxed" dangerouslySetInnerHTML={{ __html: r.review }} />}
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="bg-[#f8f6f1] rounded-xl p-6 text-center mt-4">
          <p className="text-[14px] text-[#888] mb-1">Nessuna recensione ancora per {productName}.</p>
          <p className="text-[12px] text-[#aaa]">Acquista questo vino e lascia la prima recensione → +100 Punti POP</p>
        </div>
      )}
    </div>
  );
}
