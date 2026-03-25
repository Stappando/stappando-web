'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/store/cart';
import { type WCProduct, getProduttore, formatPrice, getDiscount, decodeHtml } from '@/lib/api';
import { API_CONFIG, DEFAULT_VENDOR_NAME } from '@/lib/config';

interface Props {
  product: WCProduct;
}

function getCircuitoMeta(product: WCProduct) {
  const isCircuito = product.tags?.some(t => t.id === API_CONFIG.tags.circuito);
  if (!isCircuito) return null;
  const meta = product.meta_data || [];
  const badge = meta.find(m => m.key === '_circuito_badge')?.value || 'Scelta dal sommelier';
  return { badge };
}

export default function ProductCard({ product }: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);
  const discount = getDiscount(product);
  const produttore = getProduttore(product);
  const vendorName = product._vendorName || product.store?.name || DEFAULT_VENDOR_NAME;
  const circuito = getCircuitoMeta(product);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
  };

  return (
    <div
      className={`rounded-xl overflow-hidden flex flex-col h-[320px] ${
        circuito
          ? 'border-2 border-[#d9c39a] shadow-[0_2px_12px_rgba(217,195,154,0.25)]'
          : 'border-[0.5px] border-[#e8e4dc]'
      }`}
    >
      {/* Image — fixed 165px */}
      <Link href={`/prodotto/${product.slug}`} className="relative h-[165px] shrink-0 bg-gradient-to-br from-[#f5f1ea] to-[#e8e0d2] overflow-hidden">
        {product.images[0]?.src ? (
          <Image
            src={product.images[0].src}
            alt={decodeHtml(product.name)}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="object-contain p-2"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
        )}
        {circuito && (
          <span className="absolute top-2 left-2 inline-flex items-center gap-1 bg-[#d9c39a] text-[#5a4200] text-[9px] font-semibold px-[9px] py-[3px] rounded-full">
            <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 24 24"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
            {circuito.badge}
          </span>
        )}
      </Link>

      {/* Body */}
      <div className="p-3 flex flex-col flex-1 bg-white">
        {produttore && (
          <p className="text-[9px] font-semibold text-[#005667] uppercase tracking-[0.04em] mb-[3px] line-clamp-1">
            {produttore}
          </p>
        )}

        <Link href={`/prodotto/${product.slug}`}>
          <h3 className="text-[12px] font-semibold text-[#1a1a1a] leading-[1.35] line-clamp-2 flex-1 mb-2">
            {decodeHtml(product.name)}
          </h3>
        </Link>

        {/* Price — FIXED ORDER: strikethrough → badge → current */}
        <div className="flex items-baseline gap-1.5 flex-wrap mb-[5px]">
          {product.on_sale && product.regular_price ? (
            <>
              <span className="text-[10px] text-[#bbb] line-through">{formatPrice(product.regular_price)} €</span>
              {discount > 0 && (
                <span className="bg-[#c0392b] text-white text-[9px] font-semibold px-[5px] py-[2px] rounded">
                  -{discount}% SCONTO
                </span>
              )}
              <span className="text-[15px] font-bold text-[#005667]">{formatPrice(product.price)} €</span>
            </>
          ) : (
            <span className="text-[15px] font-bold text-[#005667]">{formatPrice(product.price)} €</span>
          )}
        </div>

        {/* Shipping */}
        <div className="flex items-center gap-1 mb-[10px]">
          <svg className="w-[10px] h-[10px] text-[#888] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.9 17.9 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
          </svg>
          <span className="text-[9px] text-[#888] truncate">Spedito da {vendorName}</span>
        </div>

        {/* CTA */}
        <button
          onClick={handleAdd}
          className={`w-full py-[9px] rounded-lg text-[11px] font-medium transition-all mt-auto ${
            added
              ? 'bg-green-500 text-white'
              : circuito
                ? 'bg-[#2C2C2A] text-white hover:bg-[#1a1a18]'
                : 'bg-[#005667] text-white hover:bg-[#004555]'
          }`}
        >
          {added ? 'Aggiunto ✓' : 'Aggiungi al carrello'}
        </button>
      </div>
    </div>
  );
}
