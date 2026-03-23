'use client';

import { useState } from 'react';
import { useCartStore } from '@/store/cart';

interface Props {
  product: {
    id: number;
    name: string;
    price: number;
    image: string;
    vendorId: string;
    vendorName: string;
  };
}

export default function AddToCartButton({ product }: Props) {
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((s) => s.addItem);

  const handleAdd = () => {
    for (let i = 0; i < quantity; i++) {
      addItem(product);
    }
  };

  return (
    <div className="flex gap-3">
      <div className="flex items-center border border-brand-border rounded-xl overflow-hidden">
        <button
          onClick={() => setQuantity(Math.max(1, quantity - 1))}
          className="w-10 h-12 flex items-center justify-center text-brand-muted hover:text-brand-text hover:bg-brand-bg transition-colors text-lg"
        >
          -
        </button>
        <span className="w-10 text-center font-semibold text-brand-text">{quantity}</span>
        <button
          onClick={() => setQuantity(quantity + 1)}
          className="w-10 h-12 flex items-center justify-center text-brand-muted hover:text-brand-text hover:bg-brand-bg transition-colors text-lg"
        >
          +
        </button>
      </div>
      <button
        onClick={handleAdd}
        className="flex-1 h-12 bg-brand-primary text-white font-semibold rounded-xl hover:bg-brand-primary/90 transition-colors flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        Aggiungi al carrello
      </button>
    </div>
  );
}
