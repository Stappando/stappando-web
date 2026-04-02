'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCartStore, type VendorShipping } from '@/store/cart';
import { useAuthStore, fetchCustomer, type SavedAddress } from '@/store/auth';
import { formatPrice } from '@/lib/api';

/* ── Stripe singleton ─────────────────────────────────── */

const STRIPE_KEY = process.env.NEXT_PUBLIC_STRIPE_KEY || '';
const STRIPE_VALID = STRIPE_KEY.startsWith('pk_') && !STRIPE_KEY.includes('placeholder');
const stripePromise = STRIPE_VALID ? loadStripe(STRIPE_KEY) : null;

/* ── Types ────────────────────────────────────────────── */

type PaymentMethod = 'stripe' | 'paypal';

interface ShippingForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  zip: string;
  notes: string;
}

/* ── Checkout Page ────────────────────────────────────── */

interface SavedCard {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

export default function CheckoutPage() {
  const { items, getSubtotal, getVendorShipping, getTotalShipping, getTotal } = useCartStore();
  const { user } = useAuthStore();
  const [form, setForm] = useState<ShippingForm>({
    firstName: '', lastName: '', email: '', phone: '',
    address: '', city: '', province: '', zip: '', notes: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('stripe');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const prefillDone = useRef(false);

  // Saved cards state
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [cardsLoading, setCardsLoading] = useState(false);

  // Saved addresses state
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  // Pre-fill address from logged-in user account + load saved addresses
  useEffect(() => {
    if (!user?.id || prefillDone.current) return;
    prefillDone.current = true;
    fetchCustomer(user.id).then((customer) => {
      // Parse saved addresses from meta
      const meta = (customer as unknown as { meta_data?: { key: string; value: string }[] }).meta_data || [];
      const raw = meta.find(m => m.key === '_saved_addresses')?.value;
      let addrList: SavedAddress[] = [];
      if (raw) {
        try { addrList = JSON.parse(raw); } catch { addrList = []; }
      }
      if (addrList.length > 0) {
        setSavedAddresses(addrList);
        const def = addrList.find(a => a.isDefault) || addrList[0];
        setSelectedAddressId(def.id);
        setForm((prev) => ({
          ...prev,
          firstName: def.first_name || user.firstName || prev.firstName,
          lastName: def.last_name || user.lastName || prev.lastName,
          email: customer.billing?.email || user.email || prev.email,
          phone: def.phone || customer.billing?.phone || prev.phone,
          address: def.address_1,
          city: def.city,
          province: def.state,
          zip: def.postcode,
        }));
      } else {
        setForm((prev) => ({
          ...prev,
          firstName: customer.shipping?.first_name || customer.billing?.first_name || user.firstName || prev.firstName,
          lastName: customer.shipping?.last_name || customer.billing?.last_name || user.lastName || prev.lastName,
          email: customer.billing?.email || user.email || prev.email,
          phone: customer.billing?.phone || customer.shipping?.phone || prev.phone,
          address: customer.shipping?.address_1 || prev.address,
          city: customer.shipping?.city || prev.city,
          province: customer.shipping?.state || prev.province,
          zip: customer.shipping?.postcode || prev.zip,
        }));
      }
    }).catch(() => {
      // Non-fatal — pre-fill not available
    });
  }, [user]);

  // Load saved cards for logged-in user
  useEffect(() => {
    if (!user?.id) return;
    setCardsLoading(true);
    fetch(`/api/payments/saved-cards?customerId=${user.id}`)
      .then((r) => r.json())
      .then((data) => {
        setSavedCards(data.cards || []);
      })
      .catch(() => setSavedCards([]))
      .finally(() => setCardsLoading(false));
  }, [user?.id]);

  const subtotal = getSubtotal();
  const vendorShipping = getVendorShipping();
  const totalShipping = getTotalShipping();
  const total = getTotal();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const isFormValid = useCallback(() => {
    return (
      form.firstName.trim() &&
      form.lastName.trim() &&
      form.email.includes('@') &&
      form.address.trim() &&
      form.city.trim() &&
      form.zip.trim().length >= 4
    );
  }, [form]);

  /** Build the order payload shared by all providers */
  const buildPayload = useCallback(() => ({
    items: items.map((i) => ({
      id: i.id,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
    })),
    shipping: totalShipping,
    customer: {
      email: form.email.trim(),
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      province: form.province.trim().toUpperCase(),
      zip: form.zip.trim(),
      notes: form.notes.trim(),
    },
  }), [form, items, totalShipping]);

  /** Handle "Proceed to payment" click */
  const handleProceedToPayment = useCallback(async () => {
    if (!isFormValid()) {
      setPaymentError('Compila tutti i campi obbligatori');
      return;
    }
    setLoading(true);
    setPaymentError(null);

    try {
      const payload = buildPayload();

      if (paymentMethod === 'stripe') {
        const stripePayload = {
          ...payload,
          ...(selectedCardId ? { paymentMethodId: selectedCardId } : {}),
          ...(user?.id ? { customerId: user.id } : {}),
        };
        const res = await fetch('/api/payments/create-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(stripePayload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Errore server');
        setClientSecret(data.clientSecret);

      } else if (paymentMethod === 'paypal') {
        const res = await fetch('/api/payments/paypal/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Errore server');
        // Redirect to PayPal
        window.location.href = data.approvalUrl;
        return; // Don't setLoading(false) — navigating away

      }
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : 'Errore imprevisto');
    } finally {
      setLoading(false);
    }
  }, [form, items, totalShipping, paymentMethod, isFormValid, buildPayload, selectedCardId, user]);

  /* Empty cart */
  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <svg className="w-20 h-20 mx-auto mb-4 text-brand-muted/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        <h1 className="text-2xl font-bold text-brand-text mb-2">Carrello vuoto</h1>
        <p className="text-brand-muted mb-6">Aggiungi prodotti al carrello per procedere.</p>
        <Link href="/cerca" className="inline-flex items-center gap-2 px-6 py-3 bg-brand-primary text-white font-semibold rounded-xl hover:bg-brand-primary/90 transition-colors">
          Esplora il catalogo
        </Link>
      </div>
    );
  }

  /* Group items by vendor */
  const vendorGroups: Record<string, typeof items> = {};
  items.forEach((item) => {
    if (!vendorGroups[item.vendorId]) vendorGroups[item.vendorId] = [];
    vendorGroups[item.vendorId].push(item);
  });

  /* Payment method options */
  const paymentMethods: { id: PaymentMethod; label: string; desc: string; icon: React.ReactNode }[] = [
    {
      id: 'stripe',
      label: 'Carta di credito',
      desc: 'Visa, Mastercard, Amex + Apple Pay, Google Pay',
      icon: <CreditCardIcon />,
    },
    {
      id: 'paypal',
      label: 'PayPal',
      desc: 'Paga con il tuo account PayPal',
      icon: <PayPalIcon />,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-brand-text mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column — Form + Payment */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping address */}
          <div className="bg-white rounded-2xl border border-brand-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-brand-text">Indirizzo di spedizione</h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 border border-green-200 text-xs font-semibold text-green-700">
                🇮🇹 Solo Italia
              </span>
            </div>
            {savedAddresses.length > 0 && (
              <div className="mb-4 space-y-2">
                <p className="text-sm font-semibold text-brand-text mb-2">I tuoi indirizzi salvati</p>
                {savedAddresses.map(addr => (
                  <label key={addr.id} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedAddressId === addr.id ? 'border-brand-primary bg-brand-primary/5' : 'border-brand-border hover:border-brand-primary/40'}`}>
                    <input type="radio" className="sr-only" checked={selectedAddressId === addr.id}
                      onChange={() => {
                        setSelectedAddressId(addr.id);
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
                    <div className={`w-4 h-4 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center ${selectedAddressId === addr.id ? 'border-brand-primary' : 'border-brand-border'}`}>
                      {selectedAddressId === addr.id && <div className="w-2 h-2 rounded-full bg-brand-primary" />}
                    </div>
                    <div className="text-sm min-w-0">
                      {addr.label && <p className="text-xs font-bold text-brand-muted uppercase mb-0.5">{addr.label}</p>}
                      <p className="font-medium text-brand-text">{addr.first_name} {addr.last_name}</p>
                      <p className="text-brand-muted">{addr.address_1}, {addr.postcode} {addr.city}{addr.state ? ` (${addr.state})` : ''}</p>
                    </div>
                    {addr.isDefault && <span className="ml-auto shrink-0 text-[10px] font-bold text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-full self-start">Default</span>}
                  </label>
                ))}
                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedAddressId === '__new__' || savedAddresses.length === 0 ? 'border-brand-primary bg-brand-primary/5' : 'border-brand-border hover:border-brand-primary/40'}`}>
                  <input type="radio" className="sr-only" checked={selectedAddressId === '__new__' || !selectedAddressId}
                    onChange={() => {
                      setSelectedAddressId('__new__');
                      setForm(f => ({ ...f, address: '', city: '', province: '', zip: '' }));
                    }}
                  />
                  <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${selectedAddressId === '__new__' || !selectedAddressId ? 'border-brand-primary' : 'border-brand-border'}`}>
                    {(selectedAddressId === '__new__' || !selectedAddressId) && <div className="w-2 h-2 rounded-full bg-brand-primary" />}
                  </div>
                  <span className="text-sm text-brand-muted">Inserisci nuovo indirizzo</span>
                </label>
                <hr className="border-brand-border my-2" />
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-brand-text mb-1">Nome *</label>
                <input
                  type="text" name="firstName" value={form.firstName} onChange={handleChange} required
                  className="w-full h-11 px-4 rounded-xl border border-brand-border text-base focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-text mb-1">Cognome *</label>
                <input
                  type="text" name="lastName" value={form.lastName} onChange={handleChange} required
                  className="w-full h-11 px-4 rounded-xl border border-brand-border text-base focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-text mb-1">Email *</label>
                <input
                  type="email" name="email" value={form.email} onChange={handleChange} required
                  className="w-full h-11 px-4 rounded-xl border border-brand-border text-base focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-text mb-1">Telefono</label>
                <input
                  type="tel" name="phone" value={form.phone} onChange={handleChange}
                  className="w-full h-11 px-4 rounded-xl border border-brand-border text-base focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-brand-text mb-1">Indirizzo *</label>
                <input
                  type="text" name="address" value={form.address} onChange={handleChange} required
                  readOnly={savedAddresses.length > 0 && selectedAddressId !== '__new__' && selectedAddressId !== null}
                  className={`w-full h-11 px-4 rounded-xl border border-brand-border text-base focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary${savedAddresses.length > 0 && selectedAddressId !== '__new__' && selectedAddressId !== null ? ' bg-gray-50' : ''}`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-text mb-1">Città *</label>
                <input
                  type="text" name="city" value={form.city} onChange={handleChange} required
                  readOnly={savedAddresses.length > 0 && selectedAddressId !== '__new__' && selectedAddressId !== null}
                  className={`w-full h-11 px-4 rounded-xl border border-brand-border text-base focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary${savedAddresses.length > 0 && selectedAddressId !== '__new__' && selectedAddressId !== null ? ' bg-gray-50' : ''}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-brand-text mb-1">Provincia *</label>
                  <input
                    type="text" name="province" value={form.province} onChange={handleChange} required maxLength={2}
                    readOnly={savedAddresses.length > 0 && selectedAddressId !== '__new__' && selectedAddressId !== null}
                    className={`w-full h-11 px-4 rounded-xl border border-brand-border text-base focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary uppercase${savedAddresses.length > 0 && selectedAddressId !== '__new__' && selectedAddressId !== null ? ' bg-gray-50' : ''}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-text mb-1">CAP *</label>
                  <input
                    type="text" name="zip" value={form.zip} onChange={handleChange} required maxLength={5}
                    readOnly={savedAddresses.length > 0 && selectedAddressId !== '__new__' && selectedAddressId !== null}
                    className={`w-full h-11 px-4 rounded-xl border border-brand-border text-base focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary${savedAddresses.length > 0 && selectedAddressId !== '__new__' && selectedAddressId !== null ? ' bg-gray-50' : ''}`}
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-brand-text mb-1">Note ordine</label>
                <textarea
                  name="notes" value={form.notes} onChange={handleChange} rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-brand-border text-base focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary resize-none"
                  placeholder="Eventuali note per la consegna..."
                />
              </div>
            </div>
          </div>

          {/* Payment section */}
          <div className="bg-white rounded-2xl border border-brand-border p-6">
            <h2 className="text-lg font-bold text-brand-text mb-4">Metodo di pagamento</h2>

            {!clientSecret ? (
              <>
                {/* Payment method selection */}
                <div className="space-y-3 mb-6">
                  {paymentMethods.map((method) => (
                    <label
                      key={method.id}
                      className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                        paymentMethod === method.id
                          ? 'border-brand-primary bg-brand-primary/5 ring-1 ring-brand-primary'
                          : 'border-brand-border hover:bg-brand-bg'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={method.id}
                        checked={paymentMethod === method.id}
                        onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                        paymentMethod === method.id ? 'border-brand-primary' : 'border-brand-border'
                      }`}>
                        {paymentMethod === method.id && (
                          <div className="w-2.5 h-2.5 rounded-full bg-brand-primary" />
                        )}
                      </div>
                      <div className="w-8 h-8 flex items-center justify-center shrink-0">
                        {method.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-brand-text">{method.label}</p>
                        <p className="text-xs text-brand-muted">{method.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Saved cards — shown when stripe is selected and user has saved cards */}
                {paymentMethod === 'stripe' && !cardsLoading && savedCards.length > 0 && (
                  <div className="mb-4 space-y-2">
                    <p className="text-sm font-semibold text-brand-text">Carte salvate</p>
                    {savedCards.map((card) => (
                      <label
                        key={card.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer ${
                          selectedCardId === card.id
                            ? 'border-brand-primary bg-brand-primary/5'
                            : 'border-brand-border'
                        }`}
                      >
                        <input
                          type="radio"
                          className="sr-only"
                          checked={selectedCardId === card.id}
                          onChange={() => setSelectedCardId(card.id)}
                        />
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            selectedCardId === card.id ? 'border-brand-primary' : 'border-brand-border'
                          }`}
                        >
                          {selectedCardId === card.id && (
                            <div className="w-2 h-2 rounded-full bg-brand-primary" />
                          )}
                        </div>
                        <span className="text-sm">
                          <span className="font-medium capitalize">{card.brand}</span>{' '}
                          •••• {card.last4} — scad. {String(card.expMonth).padStart(2, '0')}/{card.expYear}
                        </span>
                      </label>
                    ))}
                    <label
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer ${
                        selectedCardId === null
                          ? 'border-brand-primary bg-brand-primary/5'
                          : 'border-brand-border'
                      }`}
                    >
                      <input
                        type="radio"
                        className="sr-only"
                        checked={selectedCardId === null}
                        onChange={() => setSelectedCardId(null)}
                      />
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          selectedCardId === null ? 'border-brand-primary' : 'border-brand-border'
                        }`}
                      >
                        {selectedCardId === null && (
                          <div className="w-2 h-2 rounded-full bg-brand-primary" />
                        )}
                      </div>
                      <span className="text-sm text-brand-muted">Inserisci nuova carta</span>
                    </label>
                  </div>
                )}

                {/* Security badge */}
                <div className="flex items-center gap-3 p-3 rounded-xl border border-brand-border bg-brand-bg mb-4">
                  <svg className="w-4 h-4 text-brand-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <p className="text-xs text-brand-muted">Pagamento sicuro — i tuoi dati non passano mai dal nostro server</p>
                </div>

                {paymentError && (
                  <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
                    {paymentError}
                  </div>
                )}

                <button
                  onClick={handleProceedToPayment}
                  disabled={loading || !isFormValid()}
                  className="w-full py-3.5 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-primary/90 transition-colors text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      Preparazione pagamento...
                    </span>
                  ) : (
                    paymentMethod === 'paypal'
                      ? `Continua con PayPal — ${formatPrice(total)} €`
                      : `Procedi al pagamento — ${formatPrice(total)} €`
                  )}
                </button>
              </>
            ) : (
              /* Stripe Elements form */
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: 'stripe',
                    variables: {
                      colorPrimary: '#005667',
                      borderRadius: '12px',
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                    },
                  },
                  locale: 'it',
                }}
              >
                <StripePaymentForm
                  total={total}
                  onBack={() => setClientSecret(null)}
                  clientSecret={clientSecret}
                  savedCard={
                    selectedCardId
                      ? (savedCards.find((c) => c.id === selectedCardId) ?? null)
                      : null
                  }
                />
              </Elements>
            )}
          </div>
        </div>

        {/* Right column — Order summary */}
        <div>
          <div className="bg-white rounded-2xl border border-brand-border p-6 sticky top-24">
            <h2 className="text-lg font-bold text-brand-text mb-4">Riepilogo ordine</h2>

            {Object.entries(vendorGroups).map(([vendorId, vendorItems]) => {
              const vs = vendorShipping.find((v: VendorShipping) => v.vendorId === vendorId);
              return (
                <div key={vendorId} className="mb-4">
                  <p className="text-xs font-semibold text-brand-muted uppercase tracking-wide mb-2">
                    {vendorItems[0]?.vendorName}
                  </p>
                  {vendorItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 mb-2">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-brand-bg shrink-0">
                        {item.image && (
                          <Image src={item.image} alt={item.name} fill className="object-cover" sizes="48px" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-brand-text line-clamp-1">{item.name}</p>
                        <p className="text-xs text-brand-muted">x{item.quantity}</p>
                      </div>
                      <p className="text-sm font-semibold text-brand-text shrink-0">
                        {formatPrice(item.price * item.quantity)} &euro;
                      </p>
                    </div>
                  ))}
                  {vs && (
                    <div className="flex justify-between text-xs text-brand-muted mt-1 pb-3 border-b border-brand-border">
                      <span>Spedizione</span>
                      <span className={vs.isFree ? 'text-brand-success font-medium' : ''}>
                        {vs.isFree ? 'Gratuita' : `${formatPrice(vs.shippingCost)} \u20AC`}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}

            <div className="space-y-2 pt-2 border-t border-brand-border">
              <div className="flex justify-between text-sm">
                <span className="text-brand-muted">Subtotale</span>
                <span>{formatPrice(subtotal)} &euro;</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-brand-muted">Spedizione</span>
                <span>{totalShipping === 0 ? 'Gratuita' : `${formatPrice(totalShipping)} \u20AC`}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-brand-border">
                <span>Totale</span>
                <span className="text-brand-primary">{formatPrice(total)} &euro;</span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 pt-3 border-t border-brand-border">
              <span className="text-[10px] text-brand-muted">Pagamenti sicuri</span>
              {['Visa', 'Mastercard', 'PayPal', 'Satispay', 'Apple Pay'].map((brand) => (
                <div key={brand} className="h-6 px-2 bg-gray-100 rounded text-[9px] font-bold text-gray-500 flex items-center">
                  {brand}
                </div>
              ))}
            </div>

            <p className="text-[10px] text-brand-muted text-center mt-3">
              Confermando accetti i <Link href="/termini" className="underline">termini e condizioni</Link> di vendita
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Stripe Payment Form ──────────────────────────────── */

function StripePaymentForm({
  total,
  onBack,
  savedCard,
  clientSecret,
}: {
  total: number;
  onBack: () => void;
  savedCard?: { id: string; last4: string } | null;
  clientSecret?: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe) return;

    setPaying(true);
    setError(null);

    if (savedCard && clientSecret) {
      // PaymentIntent was created with payment_method already set — just confirm it
      const result = await stripe.confirmCardPayment(clientSecret);
      if (result.error) {
        setError(result.error.message || 'Errore durante il pagamento');
        setPaying(false);
      } else {
        window.location.href = `${window.location.origin}/checkout/conferma?provider=stripe`;
      }
      return;
    }

    // Standard flow with PaymentElement
    if (!elements) return;
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/conferma?provider=stripe`,
      },
    });

    if (result.error) {
      setError(result.error.message || 'Errore durante il pagamento');
    }
    setPaying(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1 text-sm text-brand-muted hover:text-brand-text mb-4 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Cambia metodo di pagamento
      </button>

      {savedCard ? (
        <div className="p-4 rounded-xl border border-brand-border bg-brand-bg mb-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-brand-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
          </svg>
          <p className="text-sm text-brand-text">
            Stai pagando con <span className="font-semibold">•••• {savedCard.last4}</span>
          </p>
        </div>
      ) : (
        <PaymentElement
          options={{
            layout: 'tabs',
            wallets: { applePay: 'auto', googlePay: 'auto' },
          }}
        />
      )}

      {error && (
        <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || paying}
        className="w-full mt-6 py-3.5 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-primary/90 transition-colors text-base disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {paying ? (
          <span className="inline-flex items-center gap-2">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            Pagamento in corso...
          </span>
        ) : (
          `Paga ${formatPrice(total)} €`
        )}
      </button>

      <div className="mt-3 flex items-center justify-center gap-1.5 text-brand-muted">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span className="text-[10px]">Connessione crittografata SSL 256-bit</span>
      </div>
    </form>
  );
}

/* ── Payment Method Icons ─────────────────────────────── */

function CreditCardIcon() {
  return (
    <svg className="w-6 h-6 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
    </svg>
  );
}

function PayPalIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
      <path d="M19.554 9.488c.121.563.106 1.246-.04 2.063-.582 2.816-2.574 4.26-5.544 4.26h-.543a.68.68 0 00-.672.577l-.03.16-.544 3.455-.024.13a.68.68 0 01-.672.577H9.37a.39.39 0 01-.387-.453l.02-.12.473-2.993.014-.094a.68.68 0 01.672-.577h1.103c2.736 0 4.88-1.113 5.509-4.334.262-1.347.126-2.473-.502-3.261a2.86 2.86 0 00-.718-.59z" fill="#179BD7"/>
      <path d="M18.451 9.067a5.97 5.97 0 00-.736-.188 9.36 9.36 0 00-1.49-.108h-4.455a.66.66 0 00-.653.558l-.955 6.048-.028.177a.68.68 0 01.672-.577h1.399c2.75 0 4.9-1.117 5.529-4.348.019-.096.034-.189.048-.28.181-.92.012-1.545-.33-2.082z" fill="#222D65"/>
      <path d="M11.117 9.329a.66.66 0 01.653-.558h4.455c.528 0 1.02.034 1.49.108a5.97 5.97 0 01.736.188c.186.063.362.14.53.227.198-1.266-.002-2.127-.683-2.907C17.553 5.5 16.127 5 14.247 5h-5.87a.68.68 0 00-.672.577L5.754 18.77a.41.41 0 00.405.473h2.95l.74-4.695 1.268-5.22z" fill="#253B80"/>
    </svg>
  );
}

