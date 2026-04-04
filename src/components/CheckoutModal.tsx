'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCartStore } from '@/store/cart';
import { useAuthStore, type SavedAddress } from '@/store/auth';
import { formatPrice } from '@/lib/api';
import { API_CONFIG } from '@/lib/config';
import AuthModal from '@/components/AuthModal';
import { useAnalyticsStore } from '@/store/analytics';
import { gtmBeginCheckout, gtmPurchase } from '@/lib/gtm';

const STRIPE_KEY = process.env.NEXT_PUBLIC_STRIPE_KEY || '';
const STRIPE_VALID = STRIPE_KEY.startsWith('pk_') && !STRIPE_KEY.includes('placeholder');
// Lazy singleton — loadStripe only called once, on first access
let _stripePromise: ReturnType<typeof loadStripe> | null = null;
function getStripePromise() {
  if (!_stripePromise && STRIPE_VALID) {
    _stripePromise = loadStripe(STRIPE_KEY);
  }
  return _stripePromise;
}

/* ── Types ────────────────────────────────────────────── */

interface ShippingForm {
  firstName: string; lastName: string; email: string;
  address: string; zip: string; city: string; province: string; phone: string;
  notes: string; needsInvoice: boolean;
  ragioneSociale: string; piva: string; codFiscale: string; sdi: string;
}

interface GiftProduct {
  id: number;
  name: string;
  price: string;
  image: string | null;
  slug: string;
}

const STEPS = ['Carrello', 'Spedizione', 'Corriere', 'Pagamento', 'Conferma'];

/* ── Main Modal ───────────────────────────────────────── */

export default function CheckoutModal() {
  const { checkoutOpen, checkoutStep, closeCheckout, setCheckoutStep } = useCartStore();

  useEffect(() => {
    if (checkoutOpen) {
      document.body.style.overflow = 'hidden';
      useAnalyticsStore.getState().trackCheckoutStart();
      const cartItems = useCartStore.getState().items;
      const total = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
      gtmBeginCheckout(
        cartItems.map(i => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: i.qty })),
        total,
      );
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [checkoutOpen]);

  if (!checkoutOpen) return null;

  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-black/40" onClick={checkoutStep < 5 ? closeCheckout : undefined} />
      <div className="absolute inset-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-[680px] sm:min-h-[70vh] sm:max-h-[92vh] sm:rounded-2xl bg-white flex flex-col overflow-hidden">
        {/* Header with step indicator */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#f0f0f0] shrink-0">
          <div className="flex items-center gap-1">
            {STEPS.map((label, i) => {
              const step = i + 1;
              const isActive = step === checkoutStep;
              const isCompleted = step < checkoutStep;
              const isFuture = step > checkoutStep;
              return (
                <div key={step} className="flex items-center">
                  <button
                    onClick={() => step < checkoutStep && setCheckoutStep(step)}
                    disabled={isFuture || step === 5}
                    className={`w-7 h-7 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 rounded-full text-[11px] font-semibold transition-colors flex items-center justify-center gap-1 ${
                      isActive ? 'bg-[#005667] text-white' :
                      isCompleted ? 'bg-[#005667] text-white cursor-pointer' :
                      'bg-[#f0f0f0] text-[#888]'
                    }`}
                  >
                    {isCompleted ? (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    ) : (
                      <span className="sm:hidden">{step}</span>
                    )}
                    <span className="hidden sm:inline">{isCompleted ? '' : `${step} · `}{label}</span>
                  </button>
                  {i < STEPS.length - 1 && (
                    <div className={`w-3 sm:w-5 h-0.5 mx-0.5 ${step < checkoutStep ? 'bg-[#005667]' : 'bg-[#e8e4dc]'}`} />
                  )}
                </div>
              );
            })}
          </div>
          {checkoutStep < 5 && (
            <button onClick={closeCheckout} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>

        {/* Content */}
        {checkoutStep === 1 && <Step1Cart />}
        {checkoutStep === 2 && <Step2Shipping />}
        {checkoutStep === 3 && <Step3Carrier />}
        {checkoutStep === 4 && <Step3Payment />}
        {checkoutStep === 5 && <Step4Confirmation />}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════ */
/* STEP 1 — CART                                          */
/* ═══════════════════════════════════════════════════════ */

function Step1Cart() {
  const { items, removeItem, updateQuantity, getSubtotal, getVendorShipping, getTotalShipping, getTotal, setCheckoutStep, addItem, appliedCoupon, applyCoupon, removeCoupon } = useCartStore();
  const { user } = useAuthStore();
  const hasStappandoProducts = items.some(i => !i.vendorId || i.vendorId === 'default' || i.vendorName === 'Stappando Enoteca');
  const [tab, setTab] = useState<'cart' | 'gifts'>('cart');
  const [coupon, setCoupon] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  const handleApplyCoupon = async () => {
    if (!coupon.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const res = await fetch('/api/coupon/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: coupon.trim(), cartTotal: subtotal, email: user?.email || '' }),
      });
      const data = await res.json();
      if (data.valid) {
        applyCoupon({ code: data.code, discount: data.discount, type: data.type, description: data.description });
        setCoupon('');
      } else {
        setCouponError(data.error || 'Coupon non valido');
      }
    } catch {
      setCouponError('Errore nella verifica');
    }
    setCouponLoading(false);
  };
  const [giftMessage, setGiftMessageRaw] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('stappando_dedica') || '';
    return '';
  });
  const setGiftMessage = (msg: string) => {
    setGiftMessageRaw(msg);
    if (typeof window !== 'undefined') localStorage.setItem('stappando_dedica', msg);
  };
  const [selectedCard, setSelectedCard] = useState<GiftProduct | null>(null);
  const [giftProducts, setGiftProducts] = useState<GiftProduct[]>([]);
  const [giftCards, setGiftCards] = useState<GiftProduct[]>([]);
  const [loadingGifts, setLoadingGifts] = useState(false);

  const subtotal = getSubtotal();
  const vendorShipping = getVendorShipping();
  const totalShipping = getTotalShipping();
  const total = getTotal();
  const popPoints = Math.round(total);
  const freeShippingThreshold = API_CONFIG.freeShippingThreshold;

  // Fetch gift products when switching to gifts tab
  useEffect(() => {
    if (tab === 'gifts' && giftProducts.length === 0 && !loadingGifts) {
      setLoadingGifts(true);
      Promise.all([
        fetch('/api/products?category=scatole-regalo&limit=8').then(r => r.ok ? r.json() : []).catch(() => []),
        fetch('/api/products?category=Biglietti&limit=4').then(r => r.ok ? r.json() : []).catch(() => []),
      ])
        .then(([boxes, cards]) => {
          const cardIds = new Set(cards.map((p: { id: number }) => p.id));
          setGiftProducts(boxes
            .filter((p: { id: number }) => !cardIds.has(p.id)) // exclude cards that WC cache may still return here
            .map((p: { id: number; slug: string; name: string; price: string; image: string | null }) => ({
              id: p.id, name: p.name, price: p.price, image: p.image, slug: p.slug,
            })));
          setGiftCards(cards.map((p: { id: number; slug: string; name: string; price: string; image: string | null }) => ({
            id: p.id, name: p.name, price: p.price, image: p.image, slug: p.slug,
          })));
        })
        .catch(() => {})
        .finally(() => setLoadingGifts(false));
    }
  }, [tab, giftProducts.length, loadingGifts]);

  // Count gift items already in cart
  const giftItemsInCart = items.filter(i => (i.vendorId === 'default' && giftProducts.some(g => g.id === i.id)) || i.vendorId === 'giftcard').length;
  const cardsInCart = items.filter(i => i.vendorId === 'giftcard').reduce((sum, i) => sum + i.quantity, 0);
  const needsDedica = cardsInCart >= 1;
  const dedicaValid = !needsDedica || giftMessage.trim().length > 0;
  const [dedicaError, setDedicaError] = useState(false);

  const handleContinue = () => {
    if (!dedicaValid) {
      setTab('gifts');
      setDedicaError(true);
      return;
    }
    setDedicaError(false);
    setCheckoutStep(2);
  };

  const handleAddGift = (p: GiftProduct) => {
    addItem({
      id: p.id,
      name: p.name,
      price: parseFloat(p.price),
      image: p.image || '',
      vendorId: 'default',
      vendorName: 'Stappando Enoteca',
    });
  };

  const handleAddCard = (p: GiftProduct) => {
    addItem({
      id: p.id,
      name: p.name,
      price: parseFloat(p.price),
      image: p.image || '',
      vendorId: 'giftcard',
      vendorName: 'Stappando Enoteca',
    });
  };

  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-16 px-8 text-center">
        <svg className="w-20 h-20 text-gray-200 mb-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
        <p className="text-[15px] text-gray-500 mb-5">Il carrello è vuoto</p>
        <button onClick={useCartStore.getState().closeCheckout} className="text-[14px] text-[#005667] font-semibold hover:underline">Continua lo shopping</button>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        {/* Tab bar: Carrello / Regali — gift tab styled prominently */}
        <div className="flex border-b border-[#f0f0f0] px-6">
          <button
            onClick={() => setTab('cart')}
            className={`px-5 py-3 text-[13px] font-semibold border-b-2 transition-colors ${tab === 'cart' ? 'border-[#005667] text-[#005667]' : 'border-transparent text-[#aaa] hover:text-[#666]'}`}
          >
            Carrello ({items.length})
          </button>
          {hasStappandoProducts && (
            <button
              onClick={() => setTab('gifts')}
              className={`px-5 py-3 text-[13px] font-semibold border-b-2 transition-colors ${tab === 'gifts' ? 'border-[#8b6914] text-[#8b6914] bg-[#fdf8f0]' : 'border-transparent text-[#8b6914] bg-[#fdf8f0]/60 hover:bg-[#fdf8f0]'} rounded-t-lg`}
            >
              <span className="inline-flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
                Regali
                {dedicaError && !dedicaValid ? (
                  <span className="w-2 h-2 rounded-full bg-[#c0392b] animate-pulse" />
                ) : giftItemsInCart > 0 ? (
                  <span className="text-[10px] font-bold text-white bg-[#8b6914] w-4 h-4 rounded-full flex items-center justify-center">{giftItemsInCart}</span>
                ) : null}
              </span>
            </button>
          )}
        </div>

        {/* TAB: CART */}
        {tab === 'cart' && (
          <>
            {/* Items */}
            <div className="px-6 py-4 space-y-4">
              {items.map((item) => (
                <div key={item.id}>
                  <div className="flex gap-3.5">
                    <div className="relative w-9 h-[50px] rounded-md bg-[#f0ece4] overflow-hidden shrink-0">
                      {item.image && <Image src={item.image} alt={item.name} fill className="object-cover" sizes="36px" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-[#1a1a1a] leading-[1.4]">{item.name}</p>
                      <p className="text-[11px] text-[#bbb] mt-0.5">{item.vendorName}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="text-[18px] text-[#005667] leading-none font-light">−</button>
                        <span className="text-[13px] font-medium min-w-[14px] text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="text-[18px] text-[#005667] leading-none font-light">+</button>
                        <span className="text-[13px] font-semibold text-[#1a1a1a] ml-auto">{formatPrice(item.price * item.quantity)} €</span>
                      </div>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="self-start p-1 text-[#ddd] hover:text-[#999]">
                      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                  {/* Editable dedication under greeting card items */}
                  {item.vendorId === 'giftcard' && (
                    <div className="ml-[52px] mt-2">
                      <label className="text-[10px] font-semibold text-[#8b6914] uppercase tracking-wider block mb-1">Dedica</label>
                      <textarea
                        value={giftMessage}
                        onChange={e => { setGiftMessage(e.target.value); if (e.target.value.trim()) setDedicaError(false); }}
                        placeholder="Scrivi la tua dedica..."
                        rows={2}
                        maxLength={200}
                        className={`w-full px-3 py-2 text-[12px] border rounded-lg resize-none focus:outline-none focus:border-[#005667] focus:ring-1 focus:ring-[#005667]/20 bg-[#fdf8f0] ${dedicaError && !giftMessage.trim() ? 'border-[#c0392b]' : 'border-[#e8dcc8]'}`}
                      />
                      {dedicaError && !giftMessage.trim() && (
                        <p className="text-[10px] text-[#c0392b] mt-0.5">Obbligatoria con il biglietto</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Shipping progress */}
            <div className="mx-6 p-3 bg-[#f8f6f1] rounded-lg mb-5 space-y-3">
              {vendorShipping.map((vs) => (
                <div key={vs.vendorId}>
                  <div className="flex items-center justify-between text-[12px] mb-1.5">
                    <span className="text-[#666]">Spedizione gratuita da €{freeShippingThreshold}{vendorShipping.length > 1 ? <span className="text-[#999]"> · {vs.vendorName}</span> : ''}</span>
                    {vs.isFree ? (
                      <span className="text-green-600 font-semibold">Gratuita!</span>
                    ) : (
                      <span className="text-[#005667] font-semibold">−{formatPrice(vs.remaining)} €</span>
                    )}
                  </div>
                  <div className="h-1 bg-[#ede9e0] rounded-full overflow-hidden">
                    <div className="h-full bg-[#005667] rounded-full transition-all" style={{ width: `${vs.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Coupon */}
            <div className="px-6 mb-4">
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-[#f0f7f5] border border-[#005667] rounded-lg px-3.5 py-2.5">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#005667]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    <span className="text-[13px] font-semibold text-[#005667]">{appliedCoupon.code}</span>
                    <span className="text-[12px] text-[#888]">{appliedCoupon.description}</span>
                  </div>
                  <button onClick={() => { removeCoupon(); setCoupon(''); setCouponError(''); }} className="p-1 text-[#888] hover:text-[#c0392b] transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex gap-2.5">
                    <input
                      type="text" value={coupon} onChange={e => { setCoupon(e.target.value); setCouponError(''); }}
                      placeholder="Codice sconto"
                      className={`flex-1 h-10 px-3.5 text-[13px] border rounded-lg focus:outline-none focus:border-[#005667] ${couponError ? 'border-[#c0392b]' : 'border-[#e5e5e5]'}`}
                      onKeyDown={e => e.key === 'Enter' && coupon.trim() && handleApplyCoupon()}
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !coupon.trim()}
                      className="h-10 px-5 bg-[#1a1a1a] text-white text-[12px] font-semibold rounded-lg shrink-0 hover:bg-[#333] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {couponLoading ? '...' : 'Applica'}
                    </button>
                  </div>
                  {couponError && <p className="text-[12px] text-[#c0392b] mt-1.5">{couponError}</p>}
                </>
              )}
            </div>

            {/* POP points */}
            <div className="mx-6 flex items-center gap-2 bg-[#dff0f5] text-[#005667] rounded-lg px-3.5 py-2.5 mb-5">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              <span className="text-[12px] font-medium">Guadagnerai {popPoints} Punti POP con questo ordine</span>
            </div>

            {/* Summary */}
            <div className="px-6 pb-5">
              <div className="space-y-2.5">
                <div className="flex justify-between text-[13px]"><span className="text-[#888]">Subtotale</span><span>{formatPrice(subtotal)} €</span></div>
                {vendorShipping.map(vs => (
                  <div key={vs.vendorId} className="flex justify-between text-[13px]"><span className="text-[#888]">Spedizione · {vs.vendorName}</span><span>{vs.isFree ? 'Gratuita' : `${formatPrice(vs.shippingCost)} €`}</span></div>
                ))}
                {appliedCoupon && (
                  <div className="flex justify-between text-[13px] text-[#005667]"><span className="font-medium">Sconto {appliedCoupon.code}</span><span className="font-semibold">-{formatPrice(appliedCoupon.discount)} €</span></div>
                )}
                <div className="flex justify-between text-[16px] font-semibold text-[#005667] pt-2 border-t border-[#f0f0f0]"><span>Totale</span><span>{formatPrice(total)} €</span></div>
              </div>
              <button onClick={handleContinue} className="w-full py-3.5 bg-[#005667] text-white rounded-lg text-[14px] font-semibold mt-4 hover:bg-[#004555] transition-colors hidden sm:block">
                Continua →
              </button>
            </div>
          </>
        )}

        {/* TAB: GIFTS — two columns layout */}
        {tab === 'gifts' && (
          <div className="px-6 py-5">
            {loadingGifts ? (
              <div className="py-8 text-center text-[13px] text-[#888]">Caricamento regali...</div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Left column: Scatole regalo */}
                  <div>
                    <p className="text-[11px] font-semibold text-[#888] uppercase tracking-wider mb-3">Scatole regalo</p>
                    {giftProducts.length > 0 ? (
                      <div className="space-y-2">
                        {giftProducts.map(p => (
                          <div key={p.id} className="flex items-center gap-3 bg-[#fdf8f0] border border-[#e8dcc8] rounded-lg p-2.5">
                            {p.image && <div className="relative w-10 h-10 bg-white rounded shrink-0"><Image src={p.image} alt={p.name} fill className="object-contain" sizes="40px" /></div>}
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] font-medium text-[#1a1a1a] line-clamp-1">{p.name}</p>
                              <p className="text-[13px] font-bold text-[#005667]">{formatPrice(p.price)} €</p>
                            </div>
                            <button onClick={() => handleAddGift(p)} className="shrink-0 text-[11px] font-semibold text-white bg-[#005667] px-3 py-1.5 rounded-lg hover:bg-[#004555] transition-colors">+</button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[12px] text-[#888] py-3">Scatole regalo in arrivo</p>
                    )}
                  </div>

                  {/* Right column: Biglietti auguri */}
                  <div>
                    <p className="text-[11px] font-semibold text-[#888] uppercase tracking-wider mb-3">Biglietti di auguri</p>
                    {giftCards.length > 0 ? (
                      <div className="space-y-2">
                        {giftCards.map(p => {
                          const isSelected = selectedCard?.id === p.id;
                          const isInCart = items.some(i => i.id === p.id && i.vendorId === 'giftcard');
                          return (
                            <div key={p.id}>
                              <button
                                onClick={() => setSelectedCard(isSelected ? null : p)}
                                className={`w-full flex items-center gap-3 rounded-lg p-2.5 text-left transition-all ${isSelected ? 'bg-[#005667]/10 border-[1.5px] border-[#005667]' : isInCart ? 'bg-[#e8f4f1] border border-[#005667]/30' : 'bg-[#fdf8f0] border border-[#e8dcc8] hover:border-[#005667]/30'}`}
                              >
                                {p.image && <div className="relative w-10 h-10 bg-white rounded shrink-0"><Image src={p.image} alt={p.name} fill className="object-contain" sizes="40px" /></div>}
                                <div className="flex-1 min-w-0">
                                  <p className="text-[12px] font-medium text-[#1a1a1a] line-clamp-1">{p.name}</p>
                                  <p className="text-[13px] font-bold text-[#005667]">{formatPrice(p.price)} €</p>
                                  {/* Show dedication preview when card is in cart and not editing */}
                                  {isInCart && giftMessage.trim() && !isSelected && (
                                    <p className="text-[11px] text-[#888] mt-1 italic line-clamp-1">&ldquo;{giftMessage}&rdquo;</p>
                                  )}
                                </div>
                                {isInCart && !isSelected ? (
                                  <span className="text-[10px] font-semibold text-[#005667] shrink-0">Modifica</span>
                                ) : isSelected ? (
                                  <svg className="w-4 h-4 text-[#005667] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                ) : null}
                              </button>

                              {/* Dedica + add to cart — appears when card is selected */}
                              {isSelected && (
                                <div className="mt-2 p-3 bg-[#fdf8f0] border border-[#e8dcc8] rounded-lg space-y-2.5">
                                  <div>
                                    <label className="text-[11px] font-semibold text-[#888] uppercase tracking-wider block mb-1">
                                      Dedica <span className="text-[#c0392b]">*</span>
                                    </label>
                                    <textarea
                                      value={giftMessage}
                                      onChange={e => { setGiftMessage(e.target.value); if (e.target.value.trim()) setDedicaError(false); }}
                                      placeholder="Scrivi la tua dedica..."
                                      rows={2}
                                      maxLength={200}
                                      autoFocus
                                      className={`w-full px-3 py-2 text-[13px] border rounded-lg resize-none focus:outline-none focus:border-[#005667] focus:ring-1 focus:ring-[#005667]/20 bg-white ${dedicaError && !giftMessage.trim() ? 'border-[#c0392b]' : 'border-[#e5e5e5]'}`}
                                    />
                                    <p className="text-[10px] text-[#aaa] mt-0.5 text-right">{giftMessage.length}/200</p>
                                  </div>
                                  {!isInCart ? (
                                    <button
                                      onClick={() => { handleAddCard(p); setSelectedCard(null); }}
                                      disabled={!giftMessage.trim()}
                                      className="w-full py-2.5 bg-[#005667] text-white rounded-lg text-[12px] font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#004555]"
                                    >
                                      Aggiungi biglietto al carrello
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => setSelectedCard(null)}
                                      className="w-full py-2.5 bg-[#005667] text-white rounded-lg text-[12px] font-semibold hover:bg-[#004555] transition-colors"
                                    >
                                      Salva dedica
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[12px] text-[#888] py-3">Biglietti in arrivo</p>
                    )}
                  </div>
                </div>

                {/* Dedica reminder if cards already in cart but no message */}
                {needsDedica && !giftMessage.trim() && !selectedCard && (
                  <div className={`mt-4 border rounded-xl p-3.5 ${dedicaError ? 'border-[#c0392b] bg-red-50/50' : 'border-[#e8dcc8] bg-[#fdf8f0]'}`}>
                    <p className="text-[12px] text-[#c0392b] font-medium">Scrivi una dedica per il biglietto di auguri per continuare</p>
                    <textarea
                      value={giftMessage}
                      onChange={e => { setGiftMessage(e.target.value); if (e.target.value.trim()) setDedicaError(false); }}
                      placeholder="Scrivi la tua dedica..."
                      rows={2}
                      maxLength={200}
                      autoFocus
                      className="w-full mt-2 px-3 py-2 text-[13px] border border-[#c0392b]/30 rounded-lg resize-none focus:outline-none focus:border-[#005667] focus:ring-1 focus:ring-[#005667]/20 bg-white"
                    />
                    <p className="text-[10px] text-[#aaa] mt-0.5 text-right">{giftMessage.length}/200</p>
                  </div>
                )}

                <button onClick={() => setTab('cart')} className="w-full text-center text-[13px] text-[#005667] font-medium hover:underline mt-4">
                  ← Torna al carrello
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Mobile footer */}
      <div className="sm:hidden border-t border-[#f0f0f0] px-5 py-3 shrink-0 bg-white">
        <button onClick={() => tab === 'gifts' ? setTab('cart') : handleContinue()} className="w-full py-3.5 bg-[#005667] text-white rounded-lg text-[14px] font-semibold hover:bg-[#004555] transition-colors">
          {tab === 'gifts' ? '← Torna al carrello' : `${formatPrice(total)} € · Continua →`}
        </button>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════ */
/* STEP 2 — SHIPPING                                      */
/* ═══════════════════════════════════════════════════════ */

function Step2Shipping() {
  const { setCheckoutStep, setShippingData, getTotal, items, getTotalShipping, getSubtotal } = useCartStore();
  const { token, user } = useAuthStore();
  const isLogged = !!token && !!user;
  const [authOpen, setAuthOpen] = useState(false);

  const savedShipping = useCartStore(s => s.shippingData);
  const [form, setForm] = useState<ShippingForm>(() => ({
    firstName: savedShipping?.firstName || '', lastName: savedShipping?.lastName || '',
    email: savedShipping?.email || '', address: savedShipping?.address || '',
    zip: savedShipping?.zip || '', city: savedShipping?.city || '',
    province: savedShipping?.province || '',
    phone: savedShipping?.phone || '', notes: savedShipping?.notes || '',
    needsInvoice: false, ragioneSociale: '', piva: '', codFiscale: '', sdi: '',
  }));
  const [prefilled, setPrefilled] = useState(!!savedShipping);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [addressOpen, setAddressOpen] = useState(true); // open by default, closed when addresses load

  // Pre-fill from logged user + WC customer address
  useEffect(() => {
    if (isLogged && user && !prefilled) {
      setForm(f => ({
        ...f,
        firstName: f.firstName || user.firstName || '',
        lastName: f.lastName || user.lastName || '',
        email: f.email || user.email || '',
      }));
      setPrefilled(true);
      // Fetch full customer data for address + saved addresses
      if (user.id) {
        // Fetch saved addresses from dedicated endpoint + WC billing fallback in parallel
        Promise.all([
          fetch(`/api/customers/addresses?customerId=${user.id}`).then(r => r.ok ? r.json() : { addresses: [] }),
          fetch(`/api/customers?id=${user.id}`).then(r => r.ok ? r.json() : null),
        ]).then(([addrData, wcData]) => {
          const addrList: SavedAddress[] = addrData.addresses || [];
          if (addrList.length > 0) {
            setSavedAddresses(addrList);
            setAddressOpen(false); // close accordion — default address pre-selected
            const def = addrList.find(a => a.isDefault) || addrList[0];
            setSelectedAddressId(def.id);
            setForm(f => ({
              ...f,
              firstName: def.first_name || user.firstName || f.firstName,
              lastName: def.last_name || user.lastName || f.lastName,
              email: f.email || wcData?.billing?.email || user.email || '',
              phone: def.phone || wcData?.billing?.phone || f.phone || '',
              address: def.address_1,
              zip: def.postcode,
              city: def.city,
              province: def.state,
            }));
          } else if (wcData) {
            const b = wcData.billing || wcData.shipping || {};
            setForm(f => ({
              ...f,
              firstName: f.firstName || b.first_name || user.firstName || '',
              lastName: f.lastName || b.last_name || user.lastName || '',
              email: f.email || b.email || user.email || '',
              phone: f.phone || b.phone || '',
              address: f.address || b.address_1 || '',
              zip: f.zip || b.postcode || '',
              city: f.city || b.city || '',
              province: f.province || b.state || '',
            }));
          }
        }).catch(() => {});
      }
    }
  }, [isLogged, user, prefilled]);

  const total = getTotal();
  const popPoints = Math.round(total);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  };

  const invoiceValid = !form.needsInvoice || (form.ragioneSociale.trim() && form.piva.trim().length >= 11);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
  const isValid = form.firstName.trim() && form.lastName.trim() && emailValid && form.address.trim() && form.zip.trim().length >= 4 && form.city.trim() && form.phone.trim().length >= 6 && invoiceValid;

  const inputClass = "h-11 px-4 text-[14px] border border-[#e5e5e5] rounded-lg focus:outline-none focus:border-[#005667] focus:ring-1 focus:ring-[#005667]/20";

  const selectedAddr = savedAddresses.find(a => a.id === selectedAddressId);
  const isReadOnly = savedAddresses.length > 0 && selectedAddressId !== '__new__' && selectedAddressId !== null;

  const handleSubmit = () => {
    if (!isValid) return;
    setShippingData({ firstName: form.firstName, lastName: form.lastName, email: form.email, address: form.address, zip: form.zip, city: form.city, province: form.province, phone: form.phone, notes: form.notes || '', needsInvoice: form.needsInvoice, ragioneSociale: form.ragioneSociale, piva: form.piva, codFiscale: form.codFiscale, sdi: form.sdi });
    setCheckoutStep(3);
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-7">
          {/* Form */}
          <div className="space-y-3.5">
            {/* Guest: login prompt */}
            {!isLogged && (
              <div className="flex items-center justify-between border-2 border-[#005667]/20 bg-[#f5fafa] rounded-xl px-5 py-3.5 mb-3">
                <span className="text-[14px] text-[#333]">Hai già un account?</span>
                <button onClick={() => setAuthOpen(true)} className="text-[14px] text-white bg-[#005667] font-semibold px-5 py-2 rounded-lg hover:bg-[#004555] transition-colors">
                  Accedi
                </button>
              </div>
            )}

            {/* Logged user greeting */}
            {isLogged && (
              <div className="bg-[#f8f6f1] rounded-lg px-4 py-2.5 mb-1">
                <span className="text-[13px] text-[#444]">Ciao <strong>{user?.firstName}</strong>, ecco i tuoi dati</span>
              </div>
            )}

            {/* Italy-only notice */}
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
              <span className="text-base">🇮🇹</span>
              <span className="text-[12px] font-semibold text-green-700">Spediamo solo in Italia</span>
            </div>

            {/* === ADDRESS ACCORDION === */}
            {/* Closed state: show selected address summary */}
            {savedAddresses.length > 0 && !addressOpen && selectedAddr && (
              <div className="border border-[#e8e4dc] rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-[#005667] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                    <div className="text-[13px]">
                      <p className="font-semibold text-[#333]">{selectedAddr.first_name} {selectedAddr.last_name}</p>
                      <p className="text-[#888]">{selectedAddr.address_1}, {selectedAddr.postcode} {selectedAddr.city}{selectedAddr.state ? ` (${selectedAddr.state})` : ''}</p>
                    </div>
                  </div>
                  {selectedAddr.isDefault && <span className="shrink-0 text-[10px] font-bold text-[#005667] bg-[#005667]/10 px-2 py-0.5 rounded-full">Default</span>}
                </div>
                <button onClick={() => setAddressOpen(true)} className="mt-3 text-[12px] text-[#005667] font-semibold hover:underline">
                  Cambia indirizzo →
                </button>
              </div>
            )}

            {/* Open state: address list + form */}
            {addressOpen && (
              <>
                {savedAddresses.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[13px] font-semibold text-[#333] mb-1">I tuoi indirizzi salvati</p>
                    {savedAddresses.map(addr => (
                      <label key={addr.id} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedAddressId === addr.id ? 'border-[#005667] bg-[#005667]/5' : 'border-[#e5e5e5] hover:border-[#005667]/40'}`}>
                        <input type="radio" className="sr-only" checked={selectedAddressId === addr.id}
                          onChange={() => {
                            setSelectedAddressId(addr.id);
                            setAddressOpen(false);
                            setForm(f => ({
                              ...f,
                              firstName: addr.first_name || f.firstName,
                              lastName: addr.last_name || f.lastName,
                              address: addr.address_1,
                              city: addr.city,
                              province: addr.state,
                              zip: addr.postcode,
                              phone: addr.phone || f.phone,
                            }));
                          }}
                        />
                        <div className={`w-4 h-4 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center ${selectedAddressId === addr.id ? 'border-[#005667]' : 'border-[#ccc]'}`}>
                          {selectedAddressId === addr.id && <div className="w-2 h-2 rounded-full bg-[#005667]" />}
                        </div>
                        <div className="text-[13px] min-w-0">
                          {addr.label && <p className="text-[11px] font-bold text-[#888] uppercase mb-0.5">{addr.label}</p>}
                          <p className="font-medium text-[#333]">{addr.first_name} {addr.last_name}</p>
                          <p className="text-[#888]">{addr.address_1}, {addr.postcode} {addr.city}{addr.state ? ` (${addr.state})` : ''}</p>
                        </div>
                        {addr.isDefault && <span className="ml-auto shrink-0 text-[10px] font-bold text-[#005667] bg-[#005667]/10 px-2 py-0.5 rounded-full self-start">Default</span>}
                      </label>
                    ))}
                    <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedAddressId === '__new__' ? 'border-[#005667] bg-[#005667]/5' : 'border-[#e5e5e5] hover:border-[#005667]/40'}`}>
                      <input type="radio" className="sr-only" checked={selectedAddressId === '__new__'}
                        onChange={() => {
                          setSelectedAddressId('__new__');
                          setForm(f => ({ ...f, address: '', city: '', province: '', zip: '' }));
                        }}
                      />
                      <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${selectedAddressId === '__new__' ? 'border-[#005667]' : 'border-[#ccc]'}`}>
                        {selectedAddressId === '__new__' && <div className="w-2 h-2 rounded-full bg-[#005667]" />}
                      </div>
                      <span className="text-[13px] text-[#888]">Inserisci nuovo indirizzo</span>
                    </label>
                    <hr className="border-[#e5e5e5] my-1" />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3.5">
                  <input name="firstName" value={form.firstName} onChange={handleChange} placeholder="Nome *" className={`${inputClass}`} />
                  <input name="lastName" value={form.lastName} onChange={handleChange} placeholder="Cognome *" className={`${inputClass}`} />
                </div>
                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="Email *" className={`w-full ${inputClass}`} />
                <input name="address" value={form.address} onChange={handleChange} placeholder="Indirizzo *" readOnly={isReadOnly} className={`w-full ${inputClass}${isReadOnly ? ' bg-gray-50' : ''}`} />
                <div className="grid grid-cols-[90px_1fr_80px] gap-3.5">
                  <input name="zip" value={form.zip} onChange={handleChange} placeholder="CAP *" maxLength={5} readOnly={isReadOnly} className={`${inputClass}${isReadOnly ? ' bg-gray-50' : ''}`} />
                  <input name="city" value={form.city} onChange={handleChange} placeholder="Città *" readOnly={isReadOnly} className={`${inputClass}${isReadOnly ? ' bg-gray-50' : ''}`} />
                  <input name="province" value={form.province} onChange={e => setForm({ ...form, province: e.target.value.toUpperCase().slice(0, 2) })} placeholder="Prov." maxLength={2} readOnly={isReadOnly} className={`${inputClass} text-center uppercase${isReadOnly ? ' bg-gray-50' : ''}`} />
                </div>
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="Telefono *" type="tel" className={`w-full ${inputClass}`} />
              </>
            )}

            {/* Notes — single line input */}
            <input
              name="notes" value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="Note per l'ordine (opzionale)"
              className={`w-full ${inputClass}`}
            />
          </div>

          {/* Desktop sidebar */}
          <div className="hidden sm:block">
            <div className="space-y-2.5">
              <p className="text-[12px] font-semibold text-[#888] uppercase tracking-wider mb-2.5">Riepilogo</p>
              <div className="flex justify-between text-[12px]"><span className="text-[#888]">{items.length} prodott{items.length === 1 ? 'o' : 'i'}</span><span>{formatPrice(getSubtotal())} €</span></div>
              <div className="flex justify-between text-[12px]"><span className="text-[#888]">Spedizione</span><span>{getTotalShipping() === 0 ? 'Gratuita' : `${formatPrice(getTotalShipping())} €`}</span></div>
              <div className="flex justify-between text-[15px] font-semibold text-[#005667] pt-2 border-t border-[#f0f0f0]"><span>Totale</span><span>{formatPrice(total)} €</span></div>
            </div>

            {/* Desktop invoice toggle */}
            <div className="mt-4 border border-[#e8e4dc] bg-[#fafaf8] rounded-xl p-3.5 space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-[13px] font-semibold text-[#333]">Fattura elettronica</span>
                <button type="button" role="switch" aria-checked={form.needsInvoice} onClick={() => setForm({ ...form, needsInvoice: !form.needsInvoice })}
                  className={`relative w-10 h-[22px] rounded-full transition-colors ${form.needsInvoice ? 'bg-[#005667]' : 'bg-[#d0cdc8]'}`}>
                  <span className={`absolute top-[2px] left-[2px] w-[18px] h-[18px] bg-white rounded-full shadow transition-transform ${form.needsInvoice ? 'translate-x-[18px]' : ''}`} />
                </button>
              </label>
              {form.needsInvoice && (
                <div className="space-y-3 pt-3 border-t border-[#e8e4dc]">
                  <input name="ragioneSociale" value={form.ragioneSociale} onChange={handleChange} placeholder="Ragione sociale *" required className={`w-full ${inputClass} !h-9 text-[12px]`} />
                  <input name="piva" value={form.piva} onChange={handleChange} placeholder="P.IVA *" required maxLength={11} className={`w-full ${inputClass} !h-9 text-[12px]`} />
                  <input name="codFiscale" value={form.codFiscale} onChange={handleChange} placeholder="Cod. Fiscale *" required maxLength={16} className={`w-full ${inputClass} !h-9 text-[12px] uppercase`} />
                  <input name="sdi" value={form.sdi} onChange={handleChange} placeholder="SDI (7 car.)" maxLength={7} className={`w-full ${inputClass} !h-9 text-[12px] uppercase`} />
                </div>
              )}
            </div>

            <button onClick={handleSubmit} disabled={!isValid} className="w-full py-3.5 bg-[#005667] text-white rounded-lg text-[14px] font-semibold mt-3 hover:bg-[#004555] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              Continua →
            </button>
            <button onClick={() => setCheckoutStep(1)} className="w-full text-center text-[12px] text-[#aaa] hover:text-[#666] mt-1.5">← Torna al carrello</button>
          </div>
        </div>
      </div>

      {/* Mobile footer — fixed bottom with invoice toggle */}
      <div className="sm:hidden border-t border-[#f0f0f0] shrink-0 bg-white">
        {/* Invoice toggle row */}
        <div className="px-5 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-[#333]">Fattura elettronica?</span>
            <button type="button" role="switch" aria-checked={form.needsInvoice} onClick={() => setForm({ ...form, needsInvoice: !form.needsInvoice })}
              className={`relative w-10 h-[22px] rounded-full transition-colors ${form.needsInvoice ? 'bg-[#005667]' : 'bg-[#d0cdc8]'}`}>
              <span className={`absolute top-[2px] left-[2px] w-[18px] h-[18px] bg-white rounded-full shadow transition-transform ${form.needsInvoice ? 'translate-x-[18px]' : ''}`} />
            </button>
          </div>
          {form.needsInvoice && (
            <div className="space-y-2.5 mt-3 pb-1">
              <input name="ragioneSociale" value={form.ragioneSociale} onChange={handleChange} placeholder="Ragione sociale *" required className={`w-full ${inputClass} !h-9 text-[13px]`} />
              <div className="grid grid-cols-2 gap-2.5">
                <input name="piva" value={form.piva} onChange={handleChange} placeholder="P.IVA *" required maxLength={11} className={`${inputClass} !h-9 text-[13px]`} />
                <input name="codFiscale" value={form.codFiscale} onChange={handleChange} placeholder="Cod. Fiscale *" required maxLength={16} className={`${inputClass} !h-9 text-[13px] uppercase`} />
              </div>
              <input name="sdi" value={form.sdi} onChange={handleChange} placeholder="Codice SDI (7 caratteri)" maxLength={7} className={`w-full ${inputClass} !h-9 text-[13px] uppercase`} />
            </div>
          )}
        </div>
        {/* Continue button */}
        <div className="px-5 py-3">
          <button onClick={handleSubmit} disabled={!isValid} className="w-full py-3.5 bg-[#005667] text-white rounded-lg text-[14px] font-semibold hover:bg-[#004555] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            Continua →
          </button>
        </div>
      </div>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}

/* ═══════════════════════════════════════════════════════ */
/* STEP 3 — CARRIER SELECTION                              */
/* ═══════════════════════════════════════════════════════ */

function Step3Carrier() {
  const { setCheckoutStep, getTotal, items, getSubtotal, getTotalShipping } = useCartStore();
  const [carrier, setCarrier] = useState<string>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('stappando_carrier') || 'none';
    return 'none';
  });

  const total = getTotal();
  const popPoints = Math.round(total);

  const carriers = [
    { id: 'none', name: 'Nessuna preferenza', time: 'Sceglieremo il migliore per te', color: '#666', abbr: '—', desc: 'Lasceremo noi scegliere il corriere più adatto in base alla tua zona' },
    { id: 'brt', name: 'BRT Corriere Espresso', time: '24-48h lavorativi', color: '#8B0000', abbr: 'BRT', desc: '' },
    { id: 'fedex', name: 'FedEx / TNT', time: '24-48h lavorativi', color: '#4D148C', abbr: 'FedEx', desc: '' },
    { id: 'poste', name: 'Poste Italiane', time: '1-3 giorni lavorativi', color: '#003087', abbr: 'Poste', desc: '' },
  ];

  const handleSelect = (id: string) => {
    setCarrier(id);
    if (typeof window !== 'undefined') localStorage.setItem('stappando_carrier', id);
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-6 grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-7">
          <div>
            <h3 className="text-[16px] font-bold text-[#1a1a1a] mb-1">Scegli il tuo corriere</h3>
            <p className="text-[13px] text-[#888] mb-5">Tutti i corrieri includono tracking e assicurazione</p>

            <div className="space-y-2">
              {carriers.map(c => (
                <label key={c.id} onClick={() => handleSelect(c.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border-[1.5px] cursor-pointer transition-all ${
                    carrier === c.id ? 'border-[#005667] bg-[#f0f7f5]' : 'border-[#e8e4dc] hover:border-[#005667]/30'
                  }`}>
                  <input type="radio" name="carrier" checked={carrier === c.id} readOnly className="w-4 h-4 text-[#005667] focus:ring-[#005667] shrink-0" />
                  <div className="w-9 h-6 rounded flex items-center justify-center shrink-0" style={{ backgroundColor: c.color }}>
                    <span className="text-white text-[9px] font-bold">{c.abbr}</span>
                  </div>
                  <span className="text-[13px] font-medium text-[#1a1a1a] flex-1">{c.name}</span>
                  <span className="text-[11px] text-[#005667] font-semibold bg-[#e8f4f1] px-2 py-0.5 rounded-full shrink-0">{c.time.replace('Consegna ', '')}</span>
                </label>
              ))}
            </div>

            {/* Info box */}
            <div className="flex items-center gap-2.5 bg-[#f8f6f1] rounded-lg px-3.5 py-3 mt-4">
              <svg className="w-4 h-4 text-[#005667] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>
              <span className="text-[12px] text-[#666]">Imballaggio protettivo incluso per ogni bottiglia</span>
            </div>
          </div>

          {/* Desktop sidebar */}
          <div className="hidden sm:block space-y-2.5">
            <p className="text-[12px] font-semibold text-[#888] uppercase tracking-wider mb-2.5">Riepilogo</p>
            <div className="flex justify-between text-[12px]"><span className="text-[#888]">{items.length} prodott{items.length === 1 ? 'o' : 'i'}</span><span>{formatPrice(getSubtotal())} €</span></div>
            <div className="flex justify-between text-[12px]"><span className="text-[#888]">Spedizione</span><span>{getTotalShipping() === 0 ? 'Gratuita' : `${formatPrice(getTotalShipping())} €`}</span></div>
            <div className="flex justify-between text-[15px] font-semibold text-[#005667] pt-2 border-t border-[#f0f0f0]"><span>Totale</span><span>{formatPrice(total)} €</span></div>
            <div className="flex items-center gap-1.5 text-[#005667] mt-2">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              <span className="text-[11px] font-medium">+{popPoints} Punti POP</span>
            </div>
            <button onClick={() => setCheckoutStep(4)} className="w-full py-3.5 bg-[#005667] text-white rounded-lg text-[14px] font-semibold mt-3 hover:bg-[#004555] transition-colors">
              Continua al pagamento →
            </button>
            <button onClick={() => setCheckoutStep(2)} className="w-full text-center text-[12px] text-[#aaa] hover:text-[#666] mt-1.5">← Torna alla spedizione</button>
          </div>
        </div>
      </div>

      {/* Mobile footer */}
      <div className="sm:hidden border-t border-[#f0f0f0] px-5 py-3 shrink-0 bg-white">
        <button onClick={() => setCheckoutStep(4)} className="w-full py-3.5 bg-[#005667] text-white rounded-lg text-[14px] font-semibold hover:bg-[#004555] transition-colors">
          Continua al pagamento →
        </button>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════ */
/* STEP 4 — PAYMENT (PayPal Smart Buttons + Stripe)       */
/* ═══════════════════════════════════════════════════════ */

function Step3Payment() {
  const { setCheckoutStep, getTotal, items, getSubtotal, getTotalShipping, shippingData, completeOrder } = useCartStore();
  const { user } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [paypalReady, setPaypalReady] = useState(false);
  const paypalContainerRef = useCallback((node: HTMLDivElement | null) => { if (node) initPayPal(node); }, []);

  const total = getTotal();
  const popPoints = Math.round(total);
  const savedCarrier = typeof window !== 'undefined' ? localStorage.getItem('stappando_carrier') || '' : '';

  const getCustomerData = useCallback(() => {
    const sd = shippingData;
    const dedica = typeof window !== 'undefined' ? localStorage.getItem('stappando_dedica') || '' : '';
    const baseNotes = sd?.notes || '';
    const notes = dedica.trim()
      ? [baseNotes, `DEDICA BIGLIETTO: ${dedica.trim()}`].filter(Boolean).join(' — ')
      : baseNotes;
    return {
      email: sd?.email || user?.email || '',
      firstName: sd?.firstName || user?.firstName || '',
      lastName: sd?.lastName || user?.lastName || '',
      phone: sd?.phone || '',
      address: sd?.address || '',
      city: sd?.city || '',
      province: sd?.province || '',
      zip: sd?.zip || '',
      notes,
      needsInvoice: sd?.needsInvoice || false,
      ragioneSociale: sd?.ragioneSociale || '',
      piva: sd?.piva || '',
      codFiscale: sd?.codFiscale || '',
      sdi: sd?.sdi || '',
    };
  }, [shippingData, user]);

  const initPayPal = useCallback(async (container: HTMLDivElement) => {
    if (paypalReady) return;

    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    if (!clientId) {
      setError('PayPal non configurato');
      return;
    }

    // Load PayPal JS SDK
    const existingScript = document.getElementById('paypal-sdk');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'paypal-sdk';
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=EUR&locale=it_IT&intent=capture`;
      script.async = true;
      script.onload = () => renderButtons(container);
      script.onerror = () => setError('Errore caricamento PayPal');
      document.head.appendChild(script);
    } else {
      renderButtons(container);
    }
  }, [paypalReady]);

  const renderButtons = useCallback((container: HTMLDivElement) => {
    const pp = (window as unknown as Record<string, unknown>).paypal as Record<string, unknown> | undefined;
    if (!pp?.Buttons) {
      setError('PayPal SDK non disponibile');
      return;
    }

    container.innerHTML = '';

    const Buttons = pp.Buttons as (config: Record<string, unknown>) => { render: (el: HTMLElement) => void };
    Buttons({
      style: {
        layout: 'vertical',
        color: 'gold',
        shape: 'rect',
        label: 'pay',
        height: 48,
      },
      createOrder: async () => {
        setError(null);
        setPaying(true);
        const customer = getCustomerData();

        const res = await fetch('/api/payments/paypal/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: items.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
            shipping: getTotalShipping(),
            customer,
            carrier: savedCarrier,
            couponCode: useCartStore.getState().appliedCoupon?.code || '',
            couponDiscount: useCartStore.getState().appliedCoupon?.discount || 0,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Errore creazione ordine');
          setPaying(false);
          throw new Error(data.error);
        }
        return data.orderId;
      },
      onApprove: async (data: { orderID: string }) => {
        try {
          const customer = getCustomerData();
          const res = await fetch('/api/payments/paypal/capture', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: data.orderID,
              customer,
              items: items.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
              shipping: getTotalShipping(),
              carrier: savedCarrier,
              couponCode: useCartStore.getState().appliedCoupon?.code || '',
              couponDiscount: useCartStore.getState().appliedCoupon?.discount || 0,
            }),
          });

          const result = await res.json();
          if (!res.ok) {
            throw new Error(result.error || 'Errore cattura pagamento');
          }

          completeOrder();
          useAnalyticsStore.getState().trackPurchase(total, items.length);
          gtmPurchase(
            data.orderID || `pp-${Date.now()}`,
            total,
            items.map(i => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: i.quantity })),
            getTotalShipping(),
            useCartStore.getState().appliedCoupon?.code,
          );
          setCheckoutStep(5);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Errore pagamento');
          setPaying(false);
        }
      },
      onCancel: () => {
        setPaying(false);
      },
      onError: (err: Error) => {
        console.error('PayPal button error:', err);
        setError('Errore PayPal. Riprova.');
        setPaying(false);
      },
    }).render(container);

    setPaypalReady(true);
  }, [items, getTotalShipping, getCustomerData, completeOrder, setCheckoutStep]);

  // Also try Stripe as secondary option
  const [stripeSecret, setStripeSecret] = useState<string | null>(null);
  const [stripeLoading, setStripeLoading] = useState(false);

  const loadStripeIntent = useCallback(async () => {
    if (!STRIPE_VALID || stripeSecret) return;
    setStripeLoading(true);
    try {
      const customer = getCustomerData();
      const res = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
          shipping: getTotalShipping(),
          customer,
          carrier: savedCarrier,
          couponCode: useCartStore.getState().appliedCoupon?.code || '',
          couponDiscount: useCartStore.getState().appliedCoupon?.discount || 0,
        }),
      });
      const data = await res.json();
      if (res.ok) setStripeSecret(data.clientSecret);
    } catch { /* ignore stripe errors */ }
    setStripeLoading(false);
  }, [items, getTotalShipping, getCustomerData, stripeSecret]);

  useEffect(() => {
    loadStripeIntent();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-7">
          <div>
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
                <p className="text-[13px] text-red-700">{error}</p>
              </div>
            )}

            {paying && (
              <div className="fixed inset-0 z-[9999] bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center">
                <div className="w-10 h-10 border-3 border-[#005667]/20 border-t-[#005667] rounded-full animate-spin mb-4" />
                <p className="text-[16px] font-semibold text-[#005667] mb-2">Pagamento in corso...</p>
                <p className="text-[13px] text-[#888]">Non chiudere questa pagina</p>
                <div className="w-48 h-1.5 bg-[#e8e4dd] rounded-full mt-4 overflow-hidden">
                  <div className="h-full bg-[#005667] rounded-full animate-pulse" style={{ width: '60%' }} />
                </div>
              </div>
            )}

            {/* PayPal Smart Buttons — primary */}
            <div className="mb-5">
              <p className="text-[12px] font-semibold text-[#888] uppercase tracking-wider mb-3">Paga con PayPal</p>
              <div ref={paypalContainerRef} className="min-h-[50px]" />
            </div>

            {/* Stripe — shown immediately, no click required */}
            {STRIPE_VALID && (
              <div className="border-t border-[#f0f0f0] pt-5 mt-1">
                <p className="text-[12px] font-semibold text-[#888] uppercase tracking-wider mb-3">Carta di credito</p>
                {stripeLoading && (
                  <div className="flex items-center justify-center py-6">
                    <div className="w-5 h-5 border-2 border-[#005667]/20 border-t-[#005667] rounded-full animate-spin" />
                    <span className="ml-3 text-[13px] text-[#888]">Caricamento metodi di pagamento...</span>
                  </div>
                )}
                {stripeSecret && (
                  <Elements
                    stripe={getStripePromise()}
                    options={{
                      clientSecret: stripeSecret,
                      appearance: { theme: 'stripe', variables: { colorPrimary: '#005667', borderRadius: '10px' } },
                      locale: 'it',
                    }}
                  >
                    <StripeForm total={total} popPoints={popPoints} clientSecret={stripeSecret} />
                  </Elements>
                )}
              </div>
            )}

            {/* Security badge */}
            <div className="flex items-center gap-2.5 bg-[#f8f6f1] rounded-lg p-3.5 mt-5">
              <svg className="w-[18px] h-[18px] text-[#005667] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              <span className="text-[12px] text-[#666]">Pagamento sicuro · Crittografia SSL 256-bit</span>
            </div>
          </div>

          {/* Desktop sidebar */}
          <div className="hidden sm:block space-y-2.5">
            <p className="text-[12px] font-semibold text-[#888] uppercase tracking-wider mb-2.5">Riepilogo</p>
            <div className="flex justify-between text-[12px]"><span className="text-[#888]">{items.length} prodott{items.length === 1 ? 'o' : 'i'}</span><span>{formatPrice(getSubtotal())} €</span></div>
            <div className="flex justify-between text-[12px]"><span className="text-[#888]">Spedizione</span><span>{getTotalShipping() === 0 ? 'Gratuita' : `${formatPrice(getTotalShipping())} €`}</span></div>
            <div className="flex justify-between text-[15px] font-semibold text-[#005667] pt-2 border-t border-[#f0f0f0]"><span>Totale</span><span>{formatPrice(total)} €</span></div>
            <div className="flex items-center gap-1.5 text-green-600 mt-2">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              <span className="text-[11px] font-medium">+{popPoints} Punti POP</span>
            </div>
            <button onClick={() => setCheckoutStep(3)} className="w-full text-center text-[12px] text-[#aaa] hover:text-[#666] mt-4">← Torna al corriere</button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Stripe Form (inside Elements) ────────────────────── */

function StripeForm({ total, popPoints, clientSecret }: { total: number; popPoints: number; clientSecret: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [useCardFallback, setUseCardFallback] = useState(false);
  const { setCheckoutStep, completeOrder } = useCartStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setPaying(true);
    setError(null);

    if (useCardFallback) {
      // CardElement fallback
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) { setPaying(false); return; }
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement },
      });
      if (result.error) {
        setError(result.error.message || 'Errore pagamento');
        setPaying(false);
      } else if (result.paymentIntent?.status === 'succeeded') {
        completeOrder();
        const cartState = useCartStore.getState();
        useAnalyticsStore.getState().trackPurchase(total, cartState.items.length);
        gtmPurchase(
          result.paymentIntent.id,
          total,
          cartState.items.map(i => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: i.qty })),
          cartState.getTotalShipping(),
          cartState.appliedCoupon?.code,
        );
        setCheckoutStep(5);
      }
    } else {
      // PaymentElement
      const result = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });
      if (result.error) {
        setError(result.error.message || 'Errore pagamento');
        setPaying(false);
      } else if (result.paymentIntent?.status === 'succeeded') {
        completeOrder();
        const cartState = useCartStore.getState();
        useAnalyticsStore.getState().trackPurchase(total, cartState.items.length);
        gtmPurchase(
          result.paymentIntent.id,
          total,
          cartState.items.map(i => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: i.qty })),
          cartState.getTotalShipping(),
          cartState.appliedCoupon?.code,
        );
        setCheckoutStep(5);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {!useCardFallback ? (
        <>
          <PaymentElement
            onReady={() => setReady(true)}
            onLoadError={() => {
              console.warn('PaymentElement failed, falling back to CardElement');
              setUseCardFallback(true);
              setReady(false);
            }}
            options={{ layout: 'tabs', wallets: { applePay: 'auto', googlePay: 'auto' } }}
          />
          {!ready && (
            <div className="flex items-center justify-center py-6">
              <div className="w-4 h-4 border-2 border-[#005667]/20 border-t-[#005667] rounded-full animate-spin" />
              <span className="ml-2 text-[12px] text-[#888]">Caricamento metodi...</span>
            </div>
          )}
        </>
      ) : (
        <div className="p-4 border border-[#e5e5e5] rounded-xl bg-white">
          <CardElement
            onReady={() => setReady(true)}
            options={{
              style: {
                base: { fontSize: '15px', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1a1a1a', '::placeholder': { color: '#aaa' } },
                invalid: { color: '#c0392b' },
              },
              hidePostalCode: true,
            }}
          />
        </div>
      )}

      {error && <p className="mt-3 text-[13px] text-red-500">{error}</p>}

      {ready && (
        <button type="submit" disabled={!stripe || paying} className="w-full mt-4 py-3.5 bg-[#005667] text-white rounded-lg text-[14px] font-semibold hover:bg-[#004555] transition-colors disabled:opacity-50">
          {paying ? 'Pagamento in corso...' : `Paga con carta · ${formatPrice(total)} €`}
        </button>
      )}

      {useCardFallback && (
        <div className="flex items-center justify-center gap-3 mt-3">
          {/* Visa */}
          <svg className="h-6" viewBox="0 0 48 32" fill="none"><rect width="48" height="32" rx="4" fill="#fff" stroke="#e5e5e5" strokeWidth="1"/><path d="M19.5 10.2l-3.8 11.6h-3.1l-1.9-9.3c-.1-.5-.3-.8-.7-1-.7-.4-1.8-.7-2.8-.9l.1-.4h5c.6 0 1.2.4 1.3 1.2l1.2 6.6 3.1-7.8h3.1zm12.3 7.8c0-3-4.2-3.2-4.2-4.6 0-.4.4-.8 1.3-.9.4-.1 1.6-.1 2.9.5l.5-2.4c-.7-.3-1.6-.5-2.8-.5-2.9 0-5 1.6-5 3.8 0 1.7 1.5 2.6 2.6 3.1 1.1.6 1.5.9 1.5 1.4 0 .8-.9 1.1-1.7 1.1-1.4 0-2.2-.4-2.9-.7l-.5 2.5c.7.3 1.9.6 3.1.6 3.1 0 5.1-1.5 5.2-3.9zm7.7 3.8h2.7l-2.4-11.6h-2.5c-.6 0-1 .3-1.2.8l-4.3 10.8h3.1l.6-1.7h3.7l.3 1.7zm-3.2-4l1.5-4.3.9 4.3h-2.4zm-12.4-7.6l-2.4 11.6h-2.9l2.4-11.6h2.9z" fill="#1A1F71"/></svg>
          {/* Mastercard */}
          <svg className="h-6" viewBox="0 0 48 32" fill="none"><rect width="48" height="32" rx="4" fill="#fff" stroke="#e5e5e5" strokeWidth="1"/><circle cx="18" cy="16" r="8" fill="#EB001B"/><circle cx="30" cy="16" r="8" fill="#F79E1B"/><path d="M24 10a8 8 0 010 12 8 8 0 000-12z" fill="#FF5F00"/></svg>
          {/* Amex */}
          <svg className="h-6" viewBox="0 0 48 32" fill="none"><rect width="48" height="32" rx="4" fill="#006FCF"/><path d="M7 15.5h2.4l1.2-2.8 1.2 2.8H14l-2-2.5 2-2.5h-2.3l-1.2 2.7-1.2-2.7H7l2 2.5-2 2.5zm8.5 0h5.8v-1.3h-4.2v-1h4.1v-1.2h-4.1v-.8h4.2v-1.2h-5.8v5.5zm6.7 0h1.7l1.8-4.2v4.2h1.6v-5.5h-2.5l-1.5 3.5-1.5-3.5h-2.5v5.5h1.6v-4.2l1.8 4.2zm8 0h1.6v-2h1.4l1.5 2h1.9l-1.7-2.2c.8-.3 1.3-1 1.3-1.8 0-1.2-.9-1.9-2.3-1.9h-3.7v5.9zm1.6-3.2v-1.2h1.9c.5 0 .8.2.8.6s-.3.6-.8.6h-1.9zM7 22h2.1l.5-1.2h3l.5 1.2h2.2l-2.9-6h-2.4L7 22zm3.4-2.5l.7-1.8.7 1.8h-1.4zM15.8 22h1.5v-3.6l2.3 3.6h1.8v-6h-1.5v3.5l-2.2-3.5h-1.9v6z" fill="#fff"/></svg>
        </div>
      )}
    </form>
  );
}

/* ═══════════════════════════════════════════════════════ */
/* STEP 4 — CONFIRMATION                                  */
/* ═══════════════════════════════════════════════════════ */

function Step4Confirmation() {
  const { closeCheckout, lastOrder, shippingData } = useCartStore();
  const { user } = useAuthStore();

  const order = lastOrder;
  const sd = shippingData || order?.shippingData;
  const email = sd?.email || user?.email || '';
  const firstName = sd?.firstName || user?.firstName || '';
  const popPoints = order?.popPoints || 0;

  // Delivery estimate
  const now = new Date();
  const d1 = new Date(now); d1.setDate(d1.getDate() + 1);
  const d2 = new Date(now); d2.setDate(d2.getDate() + 2);
  const fmt = (d: Date) => d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' });
  const deliveryEst = `${fmt(d1)} – ${fmt(d2)}`;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-6 py-6 max-w-lg mx-auto">

        {/* Hero */}
        <div className="text-center mb-6">
          <div className="w-[72px] h-[72px] rounded-full bg-[#e8f4f1] flex items-center justify-center mx-auto mb-5">
            <svg className="w-9 h-9 text-[#005667]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-[24px] font-bold text-[#1a1a1a] mb-1.5">Ordine confermato!</h2>
          <p className="text-[13px] text-[#999]">Conferma inviata a {email || 'la tua email'}</p>
        </div>

        {/* POP Box */}
        {popPoints > 0 && (
          <div className="bg-[#1a1a1a] border-[1.5px] border-[#d9c39a] rounded-[14px] p-5 mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] text-[#d9c39a] font-bold uppercase tracking-widest mb-1">Punti POP guadagnati</p>
              <p className="text-[22px] font-bold text-white">+<span className="text-[#d9c39a]">{popPoints}</span> Punti POP</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-[#666]">vale <strong className="text-[#d9c39a]">{formatPrice(popPoints / 100)} &euro;</strong> di sconto</p>
            </div>
          </div>
        )}

        {/* Order summary */}
        {order && order.items.length > 0 && (
          <div className="bg-white border border-[#e8e4dc] rounded-[14px] p-5 mb-5">
            <h3 className="text-[13px] font-bold text-[#1a1a1a] uppercase tracking-wide mb-4">Riepilogo ordine</h3>
            {order.items.map((item) => (
              <div key={item.id} className="flex gap-3 py-3 border-b border-[#f0f0f0] last:border-0">
                <div className="w-12 h-16 rounded-lg bg-gradient-to-br from-[#f5f1ea] to-[#e8e0d2] flex items-center justify-center shrink-0 overflow-hidden">
                  {item.image && <Image src={item.image} alt={item.name} width={48} height={64} className="object-contain" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold leading-tight">{item.name}</p>
                  <p className="text-[11px] text-[#999] mt-0.5">{item.vendorName}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[11px] text-[#999]">x{item.quantity}</p>
                  <p className="text-[14px] font-bold text-[#005667]">{formatPrice(item.price * item.quantity)} &euro;</p>
                </div>
              </div>
            ))}
            <div className="pt-3 mt-2 border-t border-[#f0f0f0] space-y-1.5">
              <div className="flex justify-between text-[13px]"><span className="text-[#888]">Subtotale</span><span>{formatPrice(order.subtotal)} &euro;</span></div>
              <div className="flex justify-between text-[13px]"><span className="text-[#888]">Spedizione</span><span className={order.shipping === 0 ? 'text-[#005667] font-semibold' : ''}>{order.shipping === 0 ? 'Gratuita' : `${formatPrice(order.shipping)} \u20AC`}</span></div>
              <div className="flex justify-between text-[17px] font-bold text-[#005667] pt-2 border-t border-[#f0f0f0] mt-2"><span>Totale pagato</span><span>{formatPrice(order.total)} &euro;</span></div>
            </div>
          </div>
        )}

        {/* Shipping info */}
        {sd && (
          <div className="bg-white border border-[#e8e4dc] rounded-[14px] p-5 mb-5">
            <h3 className="text-[13px] font-bold text-[#1a1a1a] uppercase tracking-wide mb-3">Spedizione</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-[#888] uppercase tracking-wider mb-1">Indirizzo</p>
                <p className="text-[13px] text-[#444] leading-relaxed">{firstName} {sd.lastName}<br/>{sd.address}<br/>{sd.zip} {sd.city}</p>
              </div>
              <div>
                <p className="text-[10px] text-[#888] uppercase tracking-wider mb-1">Consegna stimata</p>
                <p className="text-[13px] text-[#444] leading-relaxed"><strong>{deliveryEst}</strong><br/>{(() => { const c = typeof window !== 'undefined' ? localStorage.getItem('stappando_carrier') || 'brt' : 'brt'; const names: Record<string, string> = { brt: 'BRT Corriere Espresso', fedex: 'FedEx / TNT', poste: 'Poste Italiane' }; return `Spedizione via ${names[c] || c}`; })()}<br/>Tracking via email</p>
              </div>
            </div>
          </div>
        )}

        {/* Steps */}
        <div className="bg-white border border-[#e8e4dc] rounded-[14px] p-5 mb-6">
          <h3 className="text-[13px] font-bold text-[#1a1a1a] uppercase tracking-wide mb-4">Cosa succede ora</h3>
          {[
            { n: '1', title: 'Ordine ricevuto', desc: 'Il tuo ordine è stato confermato e pagato', active: true },
            { n: '2', title: 'Preparazione', desc: 'Il vino viene preparato e imballato con cura', active: false },
            { n: '3', title: 'Spedizione', desc: 'Riceverai il tracking via email entro 24h', active: false },
            { n: '4', title: 'Consegnato', desc: 'Lascia una recensione e guadagna 100 Punti POP', active: false },
          ].map((step) => (
            <div key={step.n} className="flex gap-3.5 items-start py-2.5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[13px] font-bold ${step.active ? 'bg-[#005667] text-white' : 'bg-[#e8f4f1] text-[#005667]'}`}>{step.n}</div>
              <div>
                <p className="text-[13px] font-semibold">{step.title}</p>
                <p className="text-[12px] text-[#888]">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="space-y-3 text-center">
          <button onClick={closeCheckout} className="w-full bg-[#005667] text-white rounded-xl py-3.5 text-[15px] font-bold hover:bg-[#004555] transition-colors">
            Continua a esplorare
          </button>
          <a href="/account" onClick={closeCheckout} className="block w-full border-[1.5px] border-[#e5e5e5] text-[#1a1a1a] rounded-xl py-3 text-[13px] font-semibold hover:bg-[#f8f6f1] transition-colors">
            I miei ordini
          </a>
        </div>

      </div>
    </div>
  );
}
