'use client';

import { type WCProduct } from '@/lib/api';
import ProductCard from './ProductCard';

interface Props {
  products: WCProduct[];
}

export default function ProductCarousel({ products }: Props) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
        {products.map((product) => (
          <div key={product.id} className="w-[170px] sm:w-[195px] shrink-0">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  );
}
