'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore, type VendorShipping } from '@/store/cart';
import { formatPrice } from '@/lib/api';

export default function CheckoutPage() {
  const { items, getSubtotal, getVendorShipping, getTotalShipping, getTotal } = useCartStore();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    zip: '',
    notes: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('cod');

  const subtotal = getSubtotal();
  const vendorShipping = getVendorShipping();
  const totalShipping = getTotalShipping();
  const total = getTotal();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

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

  // Group items by vendor
  const vendorGroups: Record<string, typeof items> = {};
  items.forEach((item) => {
    if (!vendorGroups[item.vendorId]) vendorGroups[item.vendorId] = [];
    vendorGroups[item.vendorId].push(item);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-brand-text mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping address */}
          <div className="bg-white rounded-2xl border border-brand-border p-6">
            <h2 className="text-lg font-bold text-brand-text mb-4">Indirizzo di spedizione</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-brand-text mb-1">Nome *</label>
                <input
                  type="text" name="firstName" value={form.firstName} onChange={handleChange} required
                  className="w-full h-11 px-4 rounded-xl border border-brand-border text-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-text mb-1">Cognome *</label>
                <input
                  type="text" name="lastName" value={form.lastName} onChange={handleChange} required
                  className="w-full h-11 px-4 rounded-xl border border-brand-border text-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-text mb-1">Email *</label>
                <input
                  type="email" name="email" value={form.email} onChange={handleChange} required
                  className="w-full h-11 px-4 rounded-xl border border-brand-border text-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-text mb-1">Telefono</label>
                <input
                  type="tel" name="phone" value={form.phone} onChange={handleChange}
                  className="w-full h-11 px-4 rounded-xl border border-brand-border text-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-brand-text mb-1">Indirizzo *</label>
                <input
                  type="text" name="address" value={form.address} onChange={handleChange} required
                  className="w-full h-11 px-4 rounded-xl border border-brand-border text-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-text mb-1">Città *</label>
                <input
                  type="text" name="city" value={form.city} onChange={handleChange} required
                  className="w-full h-11 px-4 rounded-xl border border-brand-border text-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-brand-text mb-1">Provincia *</label>
                  <input
                    type="text" name="province" value={form.province} onChange={handleChange} required maxLength={2}
                    className="w-full h-11 px-4 rounded-xl border border-brand-border text-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary uppercase"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-text mb-1">CAP *</label>
                  <input
                    type="text" name="zip" value={form.zip} onChange={handleChange} required maxLength={5}
                    className="w-full h-11 px-4 rounded-xl border border-brand-border text-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-brand-text mb-1">Note ordine</label>
                <textarea
                  name="notes" value={form.notes} onChange={handleChange} rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-brand-border text-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary resize-none"
                  placeholder="Eventuali note per la consegna..."
                />
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="bg-white rounded-2xl border border-brand-border p-6">
            <h2 className="text-lg font-bold text-brand-text mb-4">Metodo di pagamento</h2>
            <div className="space-y-3">
              {[
                { id: 'cod', label: 'Contrassegno', desc: 'Pagamento alla consegna' },
                { id: 'bacs', label: 'Bonifico bancario', desc: 'Pagamento tramite bonifico' },
              ].map((method) => (
                <label
                  key={method.id}
                  className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                    paymentMethod === method.id
                      ? 'border-brand-primary bg-brand-primary/5'
                      : 'border-brand-border hover:bg-brand-bg'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={method.id}
                    checked={paymentMethod === method.id}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-4 h-4 text-brand-primary"
                  />
                  <div>
                    <p className="text-sm font-semibold text-brand-text">{method.label}</p>
                    <p className="text-xs text-brand-muted">{method.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Order summary */}
        <div>
          <div className="bg-white rounded-2xl border border-brand-border p-6 sticky top-24">
            <h2 className="text-lg font-bold text-brand-text mb-4">Riepilogo ordine</h2>

            {/* Items by vendor */}
            {Object.entries(vendorGroups).map(([vendorId, vendorItems]) => {
              const vs = vendorShipping.find((v) => v.vendorId === vendorId);
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

            <button
              className="w-full mt-6 py-3.5 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-primary/90 transition-colors text-base"
            >
              Conferma ordine
            </button>

            <p className="text-[10px] text-brand-muted text-center mt-3">
              Confermando accetti i termini e le condizioni di vendita
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
