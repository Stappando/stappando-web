'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function NavigationProgressInner() {
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Hide when route changes
  useEffect(() => {
    setVisible(false);
  }, [pathname, searchParams]);

  const start = useCallback(() => setVisible(true), []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href) return;
      if (href.startsWith('http') && !href.includes('shop.stappando.it') && !href.startsWith(window.location.origin)) return;
      if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      if (anchor.target === '_blank') return;
      const currentFull = window.location.pathname + window.location.search;
      const hrefClean = href.replace(window.location.origin, '').replace('https://shop.stappando.it', '');
      if (currentFull === hrefClean) return;
      start();
    };

    document.addEventListener('click', handleClick, true);

    let timeout: ReturnType<typeof setTimeout>;
    if (visible) {
      timeout = setTimeout(() => setVisible(false), 8000);
    }

    return () => {
      document.removeEventListener('click', handleClick, true);
      if (timeout) clearTimeout(timeout);
    };
  }, [start, visible]);

  if (!visible) return null;

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-[9999] h-[3px] overflow-hidden">
        <div className="h-full bg-[#005667] animate-[navloading_1.5s_ease-in-out_infinite]" />
      </div>
      <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-[#f8f6f1]/60 backdrop-blur-[3px] transition-opacity duration-200">
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-full border-[3px] border-[#005667]/15" />
            <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-[#005667] animate-spin" />
          </div>
          <span className="text-[13px] font-medium text-[#005667]/70">Caricamento...</span>
        </div>
      </div>
      <style jsx>{`
        @keyframes navloading {
          0% { width: 0%; margin-left: 0; }
          50% { width: 60%; margin-left: 20%; }
          100% { width: 0%; margin-left: 100%; }
        }
      `}</style>
    </>
  );
}

export default function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressInner />
    </Suspense>
  );
}
