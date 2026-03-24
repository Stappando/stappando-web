'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useCartStore } from '@/store/cart';
import { type WCProduct, formatPrice, decodeHtml } from '@/lib/api';

export default function ConsigliatiMini() {
  const [products, setProducts] = useState<WCProduct[]>([]);
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    // Fetch via our server-side proxy — NEVER expose WC credentials to client
    fetch('/api/products/recommended')
      .then(r => r.json())
      .then((data) => { if (Array.isArray(data)) setProducts(data); })
      .catch(() => {});
  }, []);

  if (products.length === 0) return null;

  return (
    <div className="flex gap-2">
      {products.map(p => (
        <div key={p.id} className="flex-1 flex items-center gap-2 bg-gray-50 rounded-lg p-2">
          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-white shrink-0">
            {p.images[0]?.src && <Image src={p.images[0].src} alt={decodeHtml(p.name)} fill className="object-contain p-0.5" sizes="40px" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-medium text-gray-800 line-clamp-1">{decodeHtml(p.name)}</p>
            <p className="text-[10px] font-bold text-[#055667]">{formatPrice(p.price)} €</p>
          </div>
          <button
            onClick={() => addItem({ id: p.id, name: p.name, price: parseFloat(p.price), image: p.images[0]?.src || '', vendorId: 'default', vendorName: 'Stappando' })}
            className="shrink-0 w-6 h-6 rounded-full bg-[#055667] text-white flex items-center justify-center hover:bg-[#044556]"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          </button>
        </div>
      ))}
    </div>
  );
}
