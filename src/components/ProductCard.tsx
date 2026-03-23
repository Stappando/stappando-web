'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/store/cart';
import { type WCProduct, getProduttore, formatPrice, getDiscount } from '@/lib/api';

interface Props {
  product: WCProduct;
}

export default function ProductCard({ product }: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const discount = getDiscount(product);
  const produttore = getProduttore(product);
  const vendorName = product._vendorName || product.store?.name;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price),
      image: product.images[0]?.src || '',
      vendorId: product._vendorId || String(product.store?.id || 'default'),
      vendorName: product._vendorName || product.store?.name || 'Stappando',
    });
  };

  return (
    <div className="group bg-white rounded-2xl border border-brand-border overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
      <Link href={`/prodotto/${product.slug}`} className="flex flex-col h-full">
        {/* Image */}
        <div className="relative aspect-square bg-brand-bg overflow-hidden">
          {product.images[0]?.src ? (
            <Image
              src={product.images[0].src}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-brand-muted">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          {discount > 0 && (
            <div className="absolute top-2 left-2 w-10 h-10 rounded-full bg-brand-error flex items-center justify-center">
              <span className="text-white text-xs font-bold">-{discount}%</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 p-3 flex flex-col">
          {produttore && (
            <span className="text-[10px] font-semibold text-brand-accent uppercase tracking-wide mb-0.5">
              {produttore}
            </span>
          )}
          <h3 className="text-sm font-semibold text-brand-text line-clamp-2 mb-1 leading-tight">
            {product.name}
          </h3>
          <div className="flex items-baseline gap-2 mt-auto mb-1">
            <span className="text-base font-bold text-brand-primary">
              {formatPrice(product.price)} &euro;
            </span>
            {product.on_sale && product.regular_price && (
              <span className="text-xs text-brand-muted line-through">
                {formatPrice(product.regular_price)} &euro;
              </span>
            )}
          </div>
          {vendorName && (
            <p className="text-[10px] text-brand-muted truncate">
              Venduto da {vendorName}
            </p>
          )}
        </div>
      </Link>

      {/* Add to cart */}
      <button
        onClick={handleAdd}
        className="w-full py-2.5 border-t border-brand-border text-xs font-semibold uppercase tracking-wider text-brand-primary hover:bg-brand-primary hover:text-white transition-colors duration-200"
      >
        Aggiungi al carrello
      </button>
    </div>
  );
}
