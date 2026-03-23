'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '@/store/cart';
import { formatPrice } from '@/lib/api';
import { API_CONFIG } from '@/lib/config';
import ConsigliatiMini from './ConsigliatiMini';

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, getSubtotal, getVendorShipping, getTotalShipping, getTotal } = useCartStore();

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const vendorShipping = getVendorShipping();
  const subtotal = getSubtotal();
  const totalShipping = getTotalShipping();
  const total = getTotal();

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={closeCart} />

      {/* Drawer */}
      <div className="absolute inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border">
          <h2 className="text-lg font-bold text-brand-text">Carrello ({items.length})</h2>
          <button onClick={closeCart} className="p-1 text-brand-muted hover:text-brand-text">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-brand-muted">
              <svg className="w-16 h-16 mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <p className="text-sm">Il carrello è vuoto</p>
            </div>
          ) : (
            <div className="divide-y divide-brand-border">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 p-4">
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-brand-bg shrink-0">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} fill className="object-cover" sizes="80px" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-brand-muted">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-brand-text line-clamp-2">{item.name}</h4>
                    <p className="text-xs text-brand-muted mt-0.5">{item.vendorName}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-brand-border rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center text-brand-muted hover:text-brand-text text-sm"
                        >
                          -
                        </button>
                        <span className="w-7 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center text-brand-muted hover:text-brand-text text-sm"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-sm font-bold text-brand-primary">
                        {formatPrice(item.price * item.quantity)} &euro;
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="self-start p-1 text-brand-muted hover:text-brand-error"
                    aria-label="Rimuovi"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}

              {/* Vendor shipping bars */}
              {vendorShipping.length > 0 && (
                <div className="p-4 space-y-3">
                  {vendorShipping.map((vs) => (
                    <div key={vs.vendorId}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-brand-muted">{vs.vendorName}</span>
                        {vs.isFree ? (
                          <span className="text-brand-success font-medium">Spedizione gratuita</span>
                        ) : (
                          <span className="text-brand-muted">
                            Mancano {formatPrice(vs.remaining)} &euro; per la spedizione gratuita
                          </span>
                        )}
                      </div>
                      <div className="h-1.5 bg-brand-bg rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${vs.percentage}%`,
                            backgroundColor: vs.isFree ? '#16a34a' : '#b8973f',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Consigliati */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 p-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Potrebbe piacerti</p>
            <ConsigliatiMini />
          </div>
        )}

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-brand-border p-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-brand-muted">Subtotale</span>
              <span className="font-medium">{formatPrice(subtotal)} &euro;</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-brand-muted">Spedizione</span>
              <span className="font-medium">
                {totalShipping === 0 ? 'Gratuita' : `${formatPrice(totalShipping)} \u20AC`}
              </span>
            </div>
            <div className="flex justify-between text-base font-bold border-t border-brand-border pt-3">
              <span>Totale</span>
              <span className="text-brand-primary">{formatPrice(total)} &euro;</span>
            </div>
            <Link
              href="/checkout"
              onClick={closeCart}
              className="block w-full py-3 bg-brand-primary text-white text-center font-semibold rounded-xl hover:bg-brand-primary/90 transition-colors"
            >
              Procedi al checkout
            </Link>
            <button
              onClick={closeCart}
              className="block w-full py-2 text-sm text-brand-muted hover:text-brand-text text-center transition-colors"
            >
              Continua gli acquisti
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
