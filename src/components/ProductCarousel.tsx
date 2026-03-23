'use client';

import { type WCProduct } from '@/lib/api';
import ProductCard from './ProductCard';

interface Props {
  products: WCProduct[];
}

export default function ProductCarousel({ products }: Props) {
  return (
    <div className="overflow-x-auto no-scrollbar">
      <div className="flex gap-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-2">
        {products.map((product) => (
          <div key={product.id} className="w-[170px] sm:w-[200px] shrink-0">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  );
}
