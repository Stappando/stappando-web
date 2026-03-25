'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCartStore } from '@/store/cart';
import { formatPrice } from '@/lib/api';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY || '');

/* ── Types ────────────────────────────────────────────── */

interface ShippingForm {
  firstName: string; lastName: string; address: string;
  zip: string; city: string; phone: string;
  saveAddress: boolean;
}

const STEPS = ['Carrello', 'Spedizione', 'Pagamento', 'Conferma'];

/* ── Main Modal ───────────────────────────────────────── */

export default function CheckoutModal() {
  const { checkoutOpen, checkoutStep, closeCheckout, setCheckoutStep, items } = useCartStore();

  useEffect(() => {
    if (checkoutOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [checkoutOpen]);

  if (!checkoutOpen) return null;

  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-black/40" onClick={checkoutStep < 4 ? closeCheckout : undefined} />
      <div className="absolute inset-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-[640px] sm:max-h-[90vh] sm:rounded-2xl bg-white flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#f0f0f0] shrink-0">
          <div className="flex items-center gap-2">
            {STEPS.map((label, i) => {
              const step = i + 1;
              const isActive = step === checkoutStep;
              const isCompleted = step < checkoutStep;
              const isFuture = step > checkoutStep;
              return (
                <button
                  key={step}
                  onClick={() => step < checkoutStep && setCheckoutStep(step)}
                  disabled={isFuture || step === 4}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors ${
                    isActive ? 'bg-[#005667] text-white' :
                    isCompleted ? 'bg-[#e8f4f1] text-[#005667] cursor-pointer' :
                    'bg-[#f5f5f5] text-[#bbb]'
                  }`}
                >
                  <span className="sm:hidden">{isActive ? `${step} · ${label}` : step}</span>
                  <span className="hidden sm:inline">{step} · {label}</span>
                </button>
              );
            })}
          </div>
          {checkoutStep < 4 && (
            <button onClick={closeCheckout} className="p-1.5 text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>

        {/* Content */}
        {checkoutStep === 1 && <Step1Cart />}
        {checkoutStep === 2 && <Step2Shipping />}
        {checkoutStep === 3 && <Step3Payment />}
        {checkoutStep === 4 && <Step4Confirmation />}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════ */
/* STEP 1 — CART                                          */
/* ═══════════════════════════════════════════════════════ */

function Step1Cart() {
  const { items, removeItem, updateQuantity, getSubtotal, getVendorShipping, getTotalShipping, getTotal, setCheckoutStep } = useCartStore();
  const [coupon, setCoupon] = useState('');
  const [giftBox, setGiftBox] = useState(false);
  const [giftNote, setGiftNote] = useState(false);
  const [giftMessage, setGiftMessage] = useState('');

  const subtotal = getSubtotal();
  const vendorShipping = getVendorShipping();
  const totalShipping = getTotalShipping();
  const total = getTotal();
  const popPoints = Math.round(total);
  const freeShippingThreshold = 69;
  const remaining = Math.max(0, freeShippingThreshold - subtotal);
  const progress = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-12 px-6 text-center">
        <svg className="w-16 h-16 text-gray-200 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
        <p className="text-sm text-gray-500 mb-4">Il carrello è vuoto</p>
        <button onClick={useCartStore.getState().closeCheckout} className="text-[13px] text-[#005667] font-semibold hover:underline">Continua lo shopping</button>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        {/* Items */}
        <div className="px-5 py-3 space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex gap-3">
              <div className="relative w-8 h-11 rounded-[5px] bg-[#f0ece4] overflow-hidden shrink-0">
                {item.image && <Image src={item.image} alt={item.name} fill className="object-cover" sizes="32px" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-[#1a1a1a] leading-[1.35]">{item.name}</p>
                <p className="text-[10px] text-[#bbb]">{item.vendorName}</p>
                <div className="flex items-center gap-[14px] mt-1.5">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="text-[16px] text-[#005667] leading-none">−</button>
                  <span className="text-[12px] font-medium min-w-[12px] text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="text-[16px] text-[#005667] leading-none">+</button>
                  <span className="text-[12px] font-semibold text-[#1a1a1a] ml-auto">{formatPrice(item.price * item.quantity)} €</span>
                </div>
              </div>
              <button onClick={() => removeItem(item.id)} className="self-start p-0.5 text-[#ddd] hover:text-[#999]">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          ))}
        </div>

        {/* Shipping progress */}
        <div className="mx-5 p-[10px] bg-[#f8f6f1] rounded-[7px] mb-4">
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className="text-[#666]">Spedizione gratuita da €{freeShippingThreshold}</span>
            {remaining > 0 ? (
              <span className="text-[#005667] font-medium">−{formatPrice(remaining)} €</span>
            ) : (
              <span className="text-green-600 font-medium">Gratuita!</span>
            )}
          </div>
          <div className="h-[3px] bg-[#ede9e0] rounded-full overflow-hidden">
            <div className="h-full bg-[#005667] rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* 2 columns: left = coupon/gift, right = summary */}
        <div className="px-5 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Left */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text" value={coupon} onChange={e => setCoupon(e.target.value)}
                placeholder="Codice sconto"
                className="flex-1 h-9 px-3 text-[12px] border-[0.5px] border-[#e5e5e5] rounded-lg focus:outline-none focus:border-[#005667]"
              />
              <button className="h-9 px-4 bg-[#1a1a1a] text-white text-[11px] font-semibold rounded-lg shrink-0">Applica</button>
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={giftBox} onChange={e => setGiftBox(e.target.checked)} className="w-4 h-4 rounded border-[1.5px] border-[#d0cdc8] text-[#005667] focus:ring-[#005667]" />
              <span className="text-[12px] text-[#444]">Scatola regalo</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={giftNote} onChange={e => setGiftNote(e.target.checked)} className="w-4 h-4 rounded border-[1.5px] border-[#d0cdc8] text-[#005667] focus:ring-[#005667]" />
              <span className="text-[12px] text-[#444]">Biglietto di auguri</span>
            </label>
            {giftNote && (
              <textarea
                value={giftMessage} onChange={e => setGiftMessage(e.target.value)}
                placeholder="Il tuo messaggio..."
                className="w-full h-16 px-3 py-2 text-[12px] border-[0.5px] border-[#e5e5e5] rounded-lg resize-none focus:outline-none focus:border-[#005667]"
              />
            )}
          </div>

          {/* Right — summary (hidden on mobile, shown in footer) */}
          <div className="hidden sm:block space-y-2">
            <div className="flex justify-between text-[12px]"><span className="text-[#888]">Subtotale</span><span>{formatPrice(subtotal)} €</span></div>
            <div className="flex justify-between text-[12px]"><span className="text-[#888]">Spedizione · {vendorShipping.length} vendor</span><span>{totalShipping === 0 ? 'Gratuita' : `${formatPrice(totalShipping)} €`}</span></div>
            <div className="flex justify-between text-[14px] font-semibold text-[#005667] pt-1 border-t border-[#f0f0f0]"><span>Totale</span><span>{formatPrice(total)} €</span></div>
            <div className="flex items-center gap-1.5 bg-[#dff0f5] text-[#005667] rounded-full px-3 py-1.5 mt-2">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              <span className="text-[10px] font-medium">Guadagnerai {popPoints} Punti POP</span>
            </div>
            <button onClick={() => setCheckoutStep(2)} className="w-full py-3 bg-[#005667] text-white rounded-lg text-[13px] font-semibold mt-2 hover:bg-[#004555] transition-colors">
              Continua →
            </button>
          </div>
        </div>
      </div>

      {/* Mobile footer — always visible */}
      <div className="sm:hidden border-t border-[#f0f0f0] px-4 py-2.5 flex items-center gap-2.5 shrink-0 bg-white">
        <div className="flex items-center gap-1 bg-[#dff0f5] text-[#005667] rounded-full px-2.5 py-1.5 shrink-0">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          <span className="text-[9px] font-medium">+{popPoints} POP</span>
        </div>
        <button onClick={() => setCheckoutStep(2)} className="flex-1 py-3 bg-[#005667] text-white rounded-lg text-[13px] font-semibold hover:bg-[#004555] transition-colors">
          {formatPrice(total)} € · Continua →
        </button>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════ */
/* STEP 2 — SHIPPING                                      */
/* ═══════════════════════════════════════════════════════ */

function Step2Shipping() {
  const { setCheckoutStep, getTotal, items, getVendorShipping, getTotalShipping, getSubtotal } = useCartStore();
  const [form, setForm] = useState<ShippingForm>({
    firstName: '', lastName: '', address: '', zip: '', city: '', phone: '', saveAddress: false,
  });

  const total = getTotal();
  const popPoints = Math.round(total);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  };

  const isValid = form.firstName.trim() && form.lastName.trim() && form.address.trim() && form.zip.trim().length >= 4 && form.city.trim();

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-[1fr_200px] gap-6">
          {/* Form */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input name="firstName" value={form.firstName} onChange={handleChange} placeholder="Nome *" className="h-10 px-3 text-[13px] border-[0.5px] border-[#e5e5e5] rounded-lg focus:outline-none focus:border-[#005667]" />
              <input name="lastName" value={form.lastName} onChange={handleChange} placeholder="Cognome *" className="h-10 px-3 text-[13px] border-[0.5px] border-[#e5e5e5] rounded-lg focus:outline-none focus:border-[#005667]" />
            </div>
            <input name="address" value={form.address} onChange={handleChange} placeholder="Indirizzo *" className="w-full h-10 px-3 text-[13px] border-[0.5px] border-[#e5e5e5] rounded-lg focus:outline-none focus:border-[#005667]" />
            <div className="grid grid-cols-2 gap-3">
              <input name="zip" value={form.zip} onChange={handleChange} placeholder="CAP *" maxLength={5} className="h-10 px-3 text-[13px] border-[0.5px] border-[#e5e5e5] rounded-lg focus:outline-none focus:border-[#005667]" />
              <input name="city" value={form.city} onChange={handleChange} placeholder="Città *" className="h-10 px-3 text-[13px] border-[0.5px] border-[#e5e5e5] rounded-lg focus:outline-none focus:border-[#005667]" />
            </div>
            <input name="phone" value={form.phone} onChange={handleChange} placeholder="Telefono" type="tel" className="w-full h-10 px-3 text-[13px] border-[0.5px] border-[#e5e5e5] rounded-lg focus:outline-none focus:border-[#005667]" />
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="saveAddress" checked={form.saveAddress} onChange={handleChange} className="w-4 h-4 rounded border-[1.5px] border-[#d0cdc8] text-[#005667] focus:ring-[#005667]" />
              <span className="text-[11px] text-[#888]">Salva per i prossimi ordini</span>
            </label>
          </div>

          {/* Desktop sidebar */}
          <div className="hidden sm:block space-y-2">
            <p className="text-[11px] font-semibold text-[#888] uppercase tracking-wider mb-2">Riepilogo</p>
            <div className="flex justify-between text-[11px]"><span className="text-[#888]">{items.length} prodott{items.length === 1 ? 'o' : 'i'}</span><span>{formatPrice(getSubtotal())} €</span></div>
            <div className="flex justify-between text-[11px]"><span className="text-[#888]">Spedizione</span><span>{getTotalShipping() === 0 ? 'Gratuita' : `${formatPrice(getTotalShipping())} €`}</span></div>
            <div className="flex justify-between text-[13px] font-semibold text-[#005667] pt-1 border-t border-[#f0f0f0]"><span>Totale</span><span>{formatPrice(total)} €</span></div>
            <button onClick={() => isValid && setCheckoutStep(3)} disabled={!isValid} className="w-full py-3 bg-[#005667] text-white rounded-lg text-[13px] font-semibold mt-3 hover:bg-[#004555] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              Continua →
            </button>
            <button onClick={() => setCheckoutStep(1)} className="w-full text-center text-[11px] text-[#aaa] hover:text-[#666] mt-1">← Torna al carrello</button>
          </div>
        </div>
      </div>

      {/* Mobile footer */}
      <div className="sm:hidden border-t border-[#f0f0f0] px-4 py-2.5 shrink-0 bg-white">
        <button onClick={() => isValid && setCheckoutStep(3)} disabled={!isValid} className="w-full py-3 bg-[#005667] text-white rounded-lg text-[13px] font-semibold hover:bg-[#004555] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          Continua →
        </button>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════ */
/* STEP 3 — PAYMENT                                       */
/* ═══════════════════════════════════════════════════════ */

function Step3Payment() {
  const { setCheckoutStep, getTotal, items, getSubtotal, getTotalShipping } = useCartStore();
  const [method, setMethod] = useState<'stripe' | 'paypal' | 'satispay' | 'klarna'>('stripe');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = getTotal();
  const popPoints = Math.round(total);

  // Create payment intent when stripe is selected
  const createIntent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
          shipping: getTotalShipping(),
          customer: { email: '', firstName: '', lastName: '', phone: '', address: '', city: '', province: '', zip: '', notes: '' },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setClientSecret(data.clientSecret);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore');
    } finally {
      setLoading(false);
    }
  }, [items, getTotalShipping]);

  useEffect(() => {
    if (method === 'stripe' && !clientSecret) createIntent();
  }, [method, clientSecret, createIntent]);

  const METHODS = [
    { id: 'stripe' as const, label: 'Carta di credito / debito', desc: 'Visa, Mastercard, Amex + Apple Pay, Google Pay' },
    { id: 'paypal' as const, label: 'PayPal', desc: 'Paga con il tuo account' },
    { id: 'satispay' as const, label: 'Satispay', desc: 'Pagamento istantaneo' },
    { id: 'klarna' as const, label: 'Klarna', desc: 'Paga in 3 rate senza interessi' },
  ];

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-[1fr_200px] gap-6">
          <div className="space-y-3">
            {METHODS.map(m => (
              <label key={m.id} className={`flex items-center gap-3 p-3 rounded-lg border-[0.5px] cursor-pointer transition-all ${method === m.id ? 'border-[#005667] bg-[#f5fafa]' : 'border-[#e5e5e5] hover:bg-[#fafafa]'}`}>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${method === m.id ? 'border-[#005667]' : 'border-[#ccc]'}`}>
                  {method === m.id && <div className="w-2 h-2 rounded-full bg-[#005667]" />}
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-[#1a1a1a]">{m.label}</p>
                  <p className="text-[10px] text-[#999]">{m.desc}</p>
                </div>
                <input type="radio" name="payment" value={m.id} checked={method === m.id} onChange={() => setMethod(m.id)} className="sr-only" />
              </label>
            ))}

            {/* Stripe Elements inline */}
            {method === 'stripe' && clientSecret && (
              <div className="mt-3">
                <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe', variables: { colorPrimary: '#005667', borderRadius: '8px' } }, locale: 'it' }}>
                  <StripeForm total={total} popPoints={popPoints} />
                </Elements>
              </div>
            )}

            {method !== 'stripe' && (
              <div className="hidden sm:block mt-4">
                <button onClick={() => {/* PayPal/Satispay/Klarna redirect */}} className="w-full py-3 bg-[#005667] text-white rounded-lg text-[13px] font-semibold hover:bg-[#004555] transition-colors">
                  Ordina ora · {formatPrice(total)} €
                </button>
              </div>
            )}

            {/* Security badge */}
            <div className="flex items-center gap-2 bg-[#f8f6f1] rounded-lg p-3 mt-3">
              <svg className="w-4 h-4 text-[#005667] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              <span className="text-[10px] text-[#666]">Pagamento sicuro · SSL 256-bit</span>
            </div>
          </div>

          {/* Desktop sidebar */}
          <div className="hidden sm:block space-y-2">
            <p className="text-[11px] font-semibold text-[#888] uppercase tracking-wider mb-2">Riepilogo</p>
            <div className="flex justify-between text-[11px]"><span className="text-[#888]">{items.length} prodott{items.length === 1 ? 'o' : 'i'}</span><span>{formatPrice(getSubtotal())} €</span></div>
            <div className="flex justify-between text-[11px]"><span className="text-[#888]">Spedizione</span><span>{getTotalShipping() === 0 ? 'Gratuita' : `${formatPrice(getTotalShipping())} €`}</span></div>
            <div className="flex justify-between text-[13px] font-semibold text-[#005667] pt-1 border-t border-[#f0f0f0]"><span>Totale</span><span>{formatPrice(total)} €</span></div>
            <div className="flex items-center gap-1 text-green-600 mt-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              <span className="text-[10px] font-medium">+{popPoints} Punti POP</span>
            </div>
            <button onClick={() => setCheckoutStep(2)} className="w-full text-center text-[11px] text-[#aaa] hover:text-[#666] mt-3">← Torna alla spedizione</button>
          </div>
        </div>
      </div>

      {/* Mobile footer for non-stripe */}
      {method !== 'stripe' && (
        <div className="sm:hidden border-t border-[#f0f0f0] px-4 py-2.5 shrink-0 bg-white">
          <button className="w-full py-3 bg-[#005667] text-white rounded-lg text-[13px] font-semibold hover:bg-[#004555] transition-colors">
            Ordina ora · {formatPrice(total)} €
          </button>
        </div>
      )}
    </>
  );
}

/* ── Stripe Form (inside Elements) ────────────────────── */

function StripeForm({ total, popPoints }: { total: number; popPoints: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setCheckoutStep, clearCart } = useCartStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setPaying(true);
    setError(null);

    const result = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (result.error) {
      setError(result.error.message || 'Errore pagamento');
      setPaying(false);
    } else if (result.paymentIntent?.status === 'succeeded') {
      clearCart();
      setCheckoutStep(4);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement options={{ layout: 'tabs' }} />
      {error && <p className="mt-2 text-[12px] text-red-500">{error}</p>}
      <button type="submit" disabled={!stripe || paying} className="w-full mt-4 py-3 bg-[#005667] text-white rounded-lg text-[13px] font-semibold hover:bg-[#004555] transition-colors disabled:opacity-50">
        {paying ? 'Pagamento...' : `Ordina ora · ${formatPrice(total)} €`}
      </button>
    </form>
  );
}

/* ═══════════════════════════════════════════════════════ */
/* STEP 4 — CONFIRMATION                                  */
/* ═══════════════════════════════════════════════════════ */

function Step4Confirmation() {
  const { closeCheckout } = useCartStore();

  return (
    <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center px-6 py-10 text-center">
      {/* Check icon */}
      <div className="w-14 h-14 rounded-full bg-[#e8f4f1] flex items-center justify-center mb-5">
        <svg className="w-7 h-7 text-[#005667]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
      </div>

      <h2 className="text-[20px] font-semibold text-[#1a1a1a] mb-1">Ordine confermato</h2>
      <p className="text-[13px] text-[#999] mb-5">Conferma inviata via email</p>

      {/* Summary box */}
      <div className="bg-[#f8f6f1] rounded-[10px] p-4 w-full max-w-sm mb-4">
        <p className="text-[12px] text-[#888]">Consegna stimata 24–48h</p>
      </div>

      {/* POP points pill */}
      <div className="bg-[#f0f9f5] rounded-full px-4 py-2 mb-6">
        <span className="text-[12px] text-[#005667] font-medium">Punti POP accreditati al completamento</span>
      </div>

      <button onClick={closeCheckout} className="bg-[#005667] text-white rounded-lg px-8 py-3 text-[14px] font-semibold hover:bg-[#004555] transition-colors">
        Continua a esplorare
      </button>
    </div>
  );
}
