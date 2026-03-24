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
  const badge = meta.find(m => m.key === '_circuito_badge')?.value || 'Selezionato dal Sommelier';
  const priority = parseInt(meta.find(m => m.key === '_circuito_priority')?.value || '99', 10);

  return { badge, priority };
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
      vendorName: product._vendorName || product.store?.name || DEFAULT_VENDOR_NAME,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className={`group rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full ${circuito ? 'bg-[#1a1a1a] border-2 border-[#d9c39a]' : 'bg-white border border-gray-100 hover:border-gray-200'}`}>
      <Link href={`/prodotto/${product.slug}`} className="flex flex-col flex-1">
        {/* Image */}
        <div className="relative aspect-square bg-gradient-to-b from-gray-50 to-white overflow-hidden">
          {product.images[0]?.src ? (
            <Image
              src={product.images[0].src}
              alt={decodeHtml(product.name)}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-contain p-3 group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          {/* Circuito badge — top left pill */}
          {circuito && (
            <div className="absolute top-2 left-2 inline-flex items-center gap-1 px-2.5 py-1 bg-[#d9c39a] rounded-full shadow-sm">
              <svg className="w-2.5 h-2.5 text-[#5a4200]" fill="currentColor" viewBox="0 0 24 24"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
              <span className="text-[10px] font-semibold text-[#5a4200] leading-none">Scelta dal sommelier</span>
            </div>
          )}
          {/* Quick add overlay on hover */}
          <div className="absolute inset-x-0 bottom-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="h-16 bg-gradient-to-t from-black/10 to-transparent" />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 px-4 pt-3 pb-2 flex flex-col">
          {produttore && (
            <a
              href={`/cerca?q=${encodeURIComponent(produttore)}`}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.location.href = `/cerca?q=${encodeURIComponent(produttore)}`; }}
              className="text-[11px] font-bold uppercase tracking-wider mb-1 text-[#d9c39a] hover:underline"
            >
              {produttore}
            </a>
          )}
          <h3 className={`text-sm font-semibold line-clamp-2 mb-2 leading-snug ${circuito ? 'text-white' : 'text-gray-900'}`}>
            {decodeHtml(product.name)}
          </h3>
          <div className="flex items-baseline gap-1.5 flex-wrap mt-auto">
            {product.on_sale && product.regular_price ? (
              <>
                <span className={`text-sm line-through ${circuito ? 'text-white/40' : 'text-gray-400'}`}>
                  {formatPrice(product.regular_price)} &euro;
                </span>
                {discount > 0 && (
                  <span className="bg-[#c0392b] text-white text-sm font-semibold px-1.5 py-0.5 rounded">
                    -{discount}%
                  </span>
                )}
                <span className={`text-lg font-bold ${circuito ? 'text-[#d9c39a]' : 'text-[#055667]'}`}>
                  {formatPrice(product.price)} &euro;
                </span>
              </>
            ) : (
              <span className={`text-lg font-bold ${circuito ? 'text-[#d9c39a]' : 'text-[#055667]'}`}>
                {formatPrice(product.price)} &euro;
              </span>
            )}
          </div>
          <p className={`text-[10px] mt-1.5 flex items-center gap-1 ${circuito ? 'text-white/50' : 'text-gray-400'}`}>
            <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.9 17.9 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
            Venduto e spedito da
          </p>
          <p className={`text-[10px] font-medium ${circuito ? 'text-white/60' : 'text-gray-500'}`}>{vendorName}</p>
        </div>
      </Link>

      {/* Add to cart */}
      <div className="px-4 pb-3 pt-1">
        <button
          onClick={handleAdd}
          className={`w-full py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
            added
              ? 'bg-green-500 text-white'
              : circuito
                ? 'bg-[#d9c39a] text-[#1a1a1a] hover:bg-[#c9b38a] active:scale-[0.98]'
                : 'bg-[#055667] text-white hover:bg-[#044556] active:scale-[0.98]'
          }`}
        >
          {added ? 'Aggiunto ✓' : 'Aggiungi al carrello'}
        </button>
      </div>
    </div>
  );
}
