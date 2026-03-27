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
  const badge = meta.find(m => m.key === '_circuito_badge')?.value || 'Top sommelier';
  return { badge };
}

export default function ProductCard({ product }: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);
  const discount = getDiscount(product);
  const produttore = getProduttore(product);
  const vendorName = product._vendorName || product.store?.name || DEFAULT_VENDOR_NAME;
  const circuito = getCircuitoMeta(product);

  const stockQty = product.stock_quantity;
  const isOutOfStock = product.stock_status === 'outofstock' || stockQty === 0;
  const isLowStock = stockQty !== null && stockQty > 0 && stockQty <= 3;

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
      className={`rounded-2xl overflow-hidden flex flex-col bg-white ${
        circuito
          ? 'border-2 border-[#d9c39a] shadow-[0_2px_16px_rgba(217,195,154,0.2)]'
          : 'border border-[#eae6e0]'
      }`}
    >
      {/* Image — white bg, bigger bottle (less padding) */}
      <Link
        href={`/prodotto/${product.slug}`}
        className="relative aspect-[3/4] bg-white overflow-hidden"
      >
        {product.images[0]?.src ? (
          <Image
            src={product.images[0].src}
            alt={decodeHtml(product.name)}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="object-contain p-1"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <svg className="w-14 h-14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
        )}

        {/* Circuito banner — gold pill top-left */}
        {circuito && (
          <span className="absolute top-2 left-2 inline-flex items-center gap-1 bg-[#d9c39a]/90 backdrop-blur-sm text-[#5a4200] text-[9px] font-semibold px-2 py-1 rounded-md">
            <span className="text-[#d4a017]">★</span> {circuito.badge}
          </span>
        )}
      </Link>

      {/* Body — dark bg for circuito, white for normal */}
      <div className={`p-4 flex flex-col flex-1 ${circuito ? 'bg-[#1a1a1a]' : 'bg-white'}`}>
        {/* Vendor/Cantina — crema always */}
        {produttore && (
          <Link href={`/cantine/${produttore.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`} className="text-[11px] font-bold uppercase tracking-[0.05em] mb-1.5 line-clamp-1 text-[#d9c39a] hover:text-[#005667] transition-colors block">
            {produttore}
          </Link>
        )}

        {/* Product name */}
        <Link href={`/prodotto/${product.slug}`}>
          <h3 className={`text-[14px] font-semibold leading-snug line-clamp-2 mb-2.5 ${circuito ? 'text-white' : 'text-[#1a1a1a]'}`}>
            {decodeHtml(product.name)}
          </h3>
        </Link>

        {/* Price: barrato → -XX% SCONTO (rosso pill) → prezzo attuale */}
        <div className="flex items-baseline gap-2 flex-wrap mb-2.5">
          {product.on_sale && product.regular_price ? (
            <>
              <span className={`text-[13px] line-through ${circuito ? 'text-[#888]' : 'text-[#bbb]'}`}>{formatPrice(product.regular_price)}&euro;</span>
              {discount > 0 && (
                <span className="text-[11px] font-bold text-white bg-[#c0392b] px-2.5 py-0.5 rounded-full">-{discount}% SCONTO</span>
              )}
              <span className={`text-[20px] font-bold ${circuito ? 'text-white' : 'text-[#005667]'}`}>{formatPrice(product.price)}&euro;</span>
            </>
          ) : (
            <span className={`text-[20px] font-bold ${circuito ? 'text-white' : 'text-[#005667]'}`}>{formatPrice(product.price)}&euro;</span>
          )}
        </div>

        {/* Vendor shipping */}
        <div className="flex items-center gap-2 mb-3.5">
          <svg className={`w-3.5 h-3.5 shrink-0 ${circuito ? 'text-[#777]' : 'text-[#999]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.9 17.9 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
          </svg>
          <span className={`text-[11px] ${circuito ? 'text-[#777]' : 'text-[#999]'}`}>Venduto e spedito da {vendorName}</span>
        </div>

        {/* Low stock */}
        {isLowStock && (
          <div className="flex items-center gap-2 mb-2.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c0392b] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#c0392b]" />
            </span>
            <span className="text-[10px] font-semibold text-[#c0392b]">{stockQty === 1 ? 'Ultima disponibile' : `Ultime ${stockQty} disponibili`}</span>
          </div>
        )}

        {/* CTA */}
        {isOutOfStock ? (
          <button
            disabled
            className="w-full py-3 rounded-lg text-[13px] font-semibold bg-[#e8e8e8] text-[#aaa] cursor-not-allowed mt-auto"
          >
            Non disponibile
          </button>
        ) : (
          <button
            onClick={handleAdd}
            className={`w-full py-3 rounded-lg text-[13px] font-semibold transition-all mt-auto ${
              added
                ? 'bg-green-500 text-white'
                : circuito
                  ? 'bg-[#d9c39a] text-[#3d2b1a] hover:bg-[#cdb58a]'
                  : 'bg-[#005667] text-white hover:bg-[#004555]'
            }`}
          >
            {added ? 'Aggiunto ✓' : 'Aggiungi al carrello'}
          </button>
        )}
      </div>
    </div>
  );
}
