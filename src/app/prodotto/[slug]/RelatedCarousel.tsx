'use client';

import { useRef } from 'react';
import ProductCard from '@/components/ProductCard';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface Props {
  products: any[];
}

export default function RelatedCarousel({ products }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const cardWidth = scrollRef.current.firstElementChild?.clientWidth || 260;
    const amount = cardWidth + 12; // card + gap
    scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  return (
    <div className="mt-12 mb-8">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-[20px] font-semibold text-[#1a1a1a]">Ti potrebbe piacere</h2>
        <div className="flex gap-2">
          <button onClick={() => scroll('left')} className="w-9 h-9 bg-white border border-[#e5e5e5] rounded-full flex items-center justify-center hover:border-[#005667] transition-colors">
            <svg className="w-4 h-4 text-[#666]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button onClick={() => scroll('right')} className="w-9 h-9 bg-white border border-[#e5e5e5] rounded-full flex items-center justify-center hover:border-[#005667] transition-colors">
            <svg className="w-4 h-4 text-[#666]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
      <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-2" style={{ scrollSnapType: 'x mandatory' }}>
        {products.map((p) => (
          <div key={p.id as number} className="w-[calc(50%-6px)] sm:w-[calc(25%-9px)] shrink-0" style={{ scrollSnapAlign: 'start' }}>
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </div>
  );
}
