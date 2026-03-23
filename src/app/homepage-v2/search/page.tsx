'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import SearchV2 from '../SearchV2';

function SearchInner() {
  const params = useSearchParams();
  return <SearchV2 initialQuery={params.get('q') || ''} />;
}

export default function SearchV2Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-[#055667] border-t-transparent rounded-full" /></div>}>
      <SearchInner />
    </Suspense>
  );
}
