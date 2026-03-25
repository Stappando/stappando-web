'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { formatPrice } from '@/lib/api';
import AuthModal from '@/components/AuthModal';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY || '');

/* ── Types ────────────────────────────────────────────── */

interface ShippingForm {
  firstName: string; lastName: string; email: string;
  address: string; zip: string; city: string; phone: string;
  needsInvoice: boolean;
}

const STEPS = ['Carrello', 'Spedizione', 'Pagamento', 'Conferma'];

/* ── Main Modal ───────────────────────────────────────── */

export default function CheckoutModal() {
  const { checkoutOpen, checkoutStep, closeCheckout, setCheckoutStep } = useCartStore();

  useEffect(() => {
    if (checkoutOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [checkoutOpen]);

  if (!checkoutOpen) return null;

  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-black/40" onClick={checkoutStep < 4 ? closeCheckout : undefined} />
      <div className="absolute inset-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-[680px] sm:max-h-[92vh] sm:rounded-2xl bg-white flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0f0f0] shrink-0">
          <div className="flex items-center gap-2.5">
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
                  className={`px-3.5 py-2 rounded-full text-[12px] font-semibold transition-colors ${
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
            <button onClick={closeCheckout} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50">
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
        {/* Items */}
        <div className="px-6 py-4 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex gap-3.5">
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
          ))}
        </div>

        {/* Shipping progress */}
        <div className="mx-6 p-3 bg-[#f8f6f1] rounded-lg mb-5">
          <div className="flex items-center justify-between text-[12px] mb-2">
            <span className="text-[#666]">Spedizione gratuita da €{freeShippingThreshold}</span>
            {remaining > 0 ? (
              <span className="text-[#005667] font-semibold">−{formatPrice(remaining)} €</span>
            ) : (
              <span className="text-green-600 font-semibold">Gratuita!</span>
            )}
          </div>
          <div className="h-1 bg-[#ede9e0] rounded-full overflow-hidden">
            <div className="h-full bg-[#005667] rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* 2 columns: left = coupon/gift, right = summary */}
        <div className="px-6 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Left */}
          <div className="space-y-3.5">
            <div className="flex gap-2.5">
              <input
                type="text" value={coupon} onChange={e => setCoupon(e.target.value)}
                placeholder="Codice sconto"
                className="flex-1 h-10 px-3.5 text-[13px] border border-[#e5e5e5] rounded-lg focus:outline-none focus:border-[#005667]"
              />
              <button className="h-10 px-5 bg-[#1a1a1a] text-white text-[12px] font-semibold rounded-lg shrink-0 hover:bg-[#333]">Applica</button>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={giftBox} onChange={e => setGiftBox(e.target.checked)} className="w-[18px] h-[18px] rounded border-[1.5px] border-[#d0cdc8] text-[#005667] focus:ring-[#005667]" />
              <span className="text-[13px] text-[#444]">Scatola regalo</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={giftNote} onChange={e => setGiftNote(e.target.checked)} className="w-[18px] h-[18px] rounded border-[1.5px] border-[#d0cdc8] text-[#005667] focus:ring-[#005667]" />
              <span className="text-[13px] text-[#444]">Biglietto di auguri</span>
            </label>
            {giftNote && (
              <textarea
                value={giftMessage} onChange={e => setGiftMessage(e.target.value)}
                placeholder="Il tuo messaggio..."
                className="w-full h-20 px-3.5 py-2.5 text-[13px] border border-[#e5e5e5] rounded-lg resize-none focus:outline-none focus:border-[#005667]"
              />
            )}
          </div>

          {/* Right — summary desktop */}
          <div className="hidden sm:block space-y-2.5">
            <div className="flex justify-between text-[13px]"><span className="text-[#888]">Subtotale</span><span>{formatPrice(subtotal)} €</span></div>
            <div className="flex justify-between text-[13px]"><span className="text-[#888]">Spedizione · {vendorShipping.length} vendor</span><span>{totalShipping === 0 ? 'Gratuita' : `${formatPrice(totalShipping)} €`}</span></div>
            <div className="flex justify-between text-[16px] font-semibold text-[#005667] pt-2 border-t border-[#f0f0f0]"><span>Totale</span><span>{formatPrice(total)} €</span></div>
            <div className="flex items-center gap-2 bg-[#dff0f5] text-[#005667] rounded-full px-3.5 py-2 mt-3">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              <span className="text-[11px] font-medium">Guadagnerai {popPoints} Punti POP</span>
            </div>
            <button onClick={() => setCheckoutStep(2)} className="w-full py-3.5 bg-[#005667] text-white rounded-lg text-[14px] font-semibold mt-3 hover:bg-[#004555] transition-colors">
              Continua →
            </button>
          </div>
        </div>
      </div>

      {/* Mobile footer */}
      <div className="sm:hidden border-t border-[#f0f0f0] px-5 py-3 flex items-center gap-3 shrink-0 bg-white">
        <div className="flex items-center gap-1.5 bg-[#dff0f5] text-[#005667] rounded-full px-3 py-2 shrink-0">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          <span className="text-[10px] font-medium">+{popPoints} POP</span>
        </div>
        <button onClick={() => setCheckoutStep(2)} className="flex-1 py-3.5 bg-[#005667] text-white rounded-lg text-[14px] font-semibold hover:bg-[#004555] transition-colors">
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
  const { setCheckoutStep, getTotal, items, getTotalShipping, getSubtotal } = useCartStore();
  const { token, user } = useAuthStore();
  const isLogged = !!token && !!user;
  const [authOpen, setAuthOpen] = useState(false);

  const [form, setForm] = useState<ShippingForm>({
    firstName: '', lastName: '', email: '', address: '', zip: '', city: '', phone: '', needsInvoice: false,
  });
  const [prefilled, setPrefilled] = useState(false);

  // Pre-fill from logged user
  useEffect(() => {
    if (isLogged && user && !prefilled) {
      setForm(f => ({
        ...f,
        firstName: user.firstName || f.firstName,
        lastName: user.lastName || f.lastName,
        email: user.email || f.email,
      }));
      setPrefilled(true);
    }
  }, [isLogged, user, prefilled]);

  const total = getTotal();
  const popPoints = Math.round(total);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  };

  const isValid = form.firstName.trim() && form.lastName.trim() && form.email.includes('@') && form.address.trim() && form.zip.trim().length >= 4 && form.city.trim();

  const inputClass = "h-11 px-4 text-[14px] border border-[#e5e5e5] rounded-lg focus:outline-none focus:border-[#005667] focus:ring-1 focus:ring-[#005667]/20";

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-7">
          {/* Form */}
          <div className="space-y-3.5">
            {/* Logged user greeting */}
            {isLogged && (
              <div className="flex items-center justify-between bg-[#f8f6f1] rounded-lg px-4 py-2.5 mb-1">
                <span className="text-[13px] text-[#444]">Ciao <strong>{user?.firstName}</strong>, dati pre-compilati</span>
                <button onClick={() => setPrefilled(false)} className="text-[11px] text-[#005667] font-medium hover:underline">Modifica</button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3.5">
              <input name="firstName" value={form.firstName} onChange={handleChange} placeholder="Nome *" className={`${inputClass}`} />
              <input name="lastName" value={form.lastName} onChange={handleChange} placeholder="Cognome *" className={`${inputClass}`} />
            </div>
            <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="Email *" className={`w-full ${inputClass}`} />
            <input name="address" value={form.address} onChange={handleChange} placeholder="Indirizzo *" className={`w-full ${inputClass}`} />
            <div className="grid grid-cols-2 gap-3.5">
              <input name="zip" value={form.zip} onChange={handleChange} placeholder="CAP *" maxLength={5} className={`${inputClass}`} />
              <input name="city" value={form.city} onChange={handleChange} placeholder="Città *" className={`${inputClass}`} />
            </div>
            <input name="phone" value={form.phone} onChange={handleChange} placeholder="Telefono" type="tel" className={`w-full ${inputClass}`} />

            {/* Invoice checkbox */}
            <label className="flex items-start gap-3 cursor-pointer mt-1">
              <input type="checkbox" name="needsInvoice" checked={form.needsInvoice} onChange={handleChange} className="mt-0.5 w-[18px] h-[18px] rounded border-[1.5px] border-[#d0cdc8] text-[#005667] focus:ring-[#005667]" />
              <div>
                <span className="text-[13px] text-[#444]">Ho bisogno di fattura elettronica</span>
                <p className="text-[11px] text-[#aaa] mt-0.5">La fattura viene inviata via email, non è inclusa nel pacco</p>
              </div>
            </label>

            {/* Login link for guests */}
            {!isLogged && (
              <button onClick={() => setAuthOpen(true)} className="text-[12px] text-[#aaa] hover:text-[#005667] transition-colors mt-1">
                Accedi per salvare i dati →
              </button>
            )}
          </div>

          {/* Desktop sidebar */}
          <div className="hidden sm:block space-y-2.5">
            <p className="text-[12px] font-semibold text-[#888] uppercase tracking-wider mb-2.5">Riepilogo</p>
            <div className="flex justify-between text-[12px]"><span className="text-[#888]">{items.length} prodott{items.length === 1 ? 'o' : 'i'}</span><span>{formatPrice(getSubtotal())} €</span></div>
            <div className="flex justify-between text-[12px]"><span className="text-[#888]">Spedizione</span><span>{getTotalShipping() === 0 ? 'Gratuita' : `${formatPrice(getTotalShipping())} €`}</span></div>
            <div className="flex justify-between text-[15px] font-semibold text-[#005667] pt-2 border-t border-[#f0f0f0]"><span>Totale</span><span>{formatPrice(total)} €</span></div>
            <button onClick={() => isValid && setCheckoutStep(3)} disabled={!isValid} className="w-full py-3.5 bg-[#005667] text-white rounded-lg text-[14px] font-semibold mt-3 hover:bg-[#004555] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              Continua →
            </button>
            <button onClick={() => setCheckoutStep(1)} className="w-full text-center text-[12px] text-[#aaa] hover:text-[#666] mt-1.5">← Torna al carrello</button>
          </div>
        </div>
      </div>

      {/* Mobile footer */}
      <div className="sm:hidden border-t border-[#f0f0f0] px-5 py-3 shrink-0 bg-white">
        <button onClick={() => isValid && setCheckoutStep(3)} disabled={!isValid} className="w-full py-3.5 bg-[#005667] text-white rounded-lg text-[14px] font-semibold hover:bg-[#004555] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          Continua →
        </button>
      </div>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}

/* ═══════════════════════════════════════════════════════ */
/* STEP 3 — PAYMENT (Stripe only, automatic methods)      */
/* ═══════════════════════════════════════════════════════ */

function Step3Payment() {
  const { setCheckoutStep, getTotal, items, getSubtotal, getTotalShipping } = useCartStore();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const total = getTotal();
  const popPoints = Math.round(total);

  // Create payment intent on mount
  useEffect(() => {
    (async () => {
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
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-7">
          <div>
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-[#005667]/20 border-t-[#005667] rounded-full animate-spin" />
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-[13px] text-red-700 mb-4">{error}</div>
            )}

            {/* Stripe Elements — shows all automatic methods */}
            {clientSecret && (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: 'stripe',
                    variables: { colorPrimary: '#005667', borderRadius: '10px', fontFamily: 'system-ui, -apple-system, sans-serif' },
                  },
                  locale: 'it',
                }}
              >
                <StripeForm total={total} popPoints={popPoints} />
              </Elements>
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
            <button onClick={() => setCheckoutStep(2)} className="w-full text-center text-[12px] text-[#aaa] hover:text-[#666] mt-4">← Torna alla spedizione</button>
          </div>
        </div>
      </div>
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
      <PaymentElement options={{ layout: 'tabs', wallets: { applePay: 'auto', googlePay: 'auto' } }} />
      {error && <p className="mt-3 text-[13px] text-red-500">{error}</p>}

      {/* CTA — visible on both desktop and mobile */}
      <button type="submit" disabled={!stripe || paying} className="w-full mt-5 py-3.5 bg-[#005667] text-white rounded-lg text-[14px] font-semibold hover:bg-[#004555] transition-colors disabled:opacity-50">
        {paying ? 'Pagamento in corso...' : `Ordina ora · ${formatPrice(total)} €`}
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
    <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center px-8 py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-[#e8f4f1] flex items-center justify-center mb-6">
        <svg className="w-8 h-8 text-[#005667]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
      </div>

      <h2 className="text-[22px] font-semibold text-[#1a1a1a] mb-1.5">Ordine confermato</h2>
      <p className="text-[14px] text-[#999] mb-6">Conferma inviata via email</p>

      <div className="bg-[#f8f6f1] rounded-xl p-5 w-full max-w-sm mb-5">
        <p className="text-[13px] text-[#888]">Consegna stimata <strong className="text-[#1a1a1a]">24–48h</strong></p>
      </div>

      <div className="bg-[#f0f9f5] rounded-full px-5 py-2.5 mb-8">
        <span className="text-[13px] text-[#005667] font-medium">Punti POP accreditati al completamento</span>
      </div>

      <button onClick={closeCheckout} className="bg-[#005667] text-white rounded-lg px-10 py-3.5 text-[15px] font-semibold hover:bg-[#004555] transition-colors">
        Continua a esplorare
      </button>
    </div>
  );
}
