'use client';

import { useEffect, useState, useCallback } from 'react';

export default function NavigationProgress() {
  const [visible, setVisible] = useState(false);

  const start = useCallback(() => setVisible(true), []);
  const done = useCallback(() => setVisible(false), []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      if (anchor.target === '_blank') return;
      start();
    };

    let currentUrl = window.location.href;
    const observer = new MutationObserver(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        done();
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });

    document.addEventListener('click', handleClick, true);
    return () => {
      document.removeEventListener('click', handleClick, true);
      observer.disconnect();
    };
  }, [start, done]);

  if (!visible) return null;

  return (
    <>
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-[9999] h-[3px] overflow-hidden">
        <div className="h-full bg-[#005667] animate-[loading_1.5s_ease-in-out_infinite]" />
      </div>
      {/* Backdrop blur + spinner */}
      <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-white/40 backdrop-blur-[2px] transition-opacity duration-200">
        <div className="w-8 h-8 border-3 border-[#005667]/20 border-t-[#005667] rounded-full animate-spin" />
      </div>
      <style jsx>{`
        @keyframes loading {
          0% { width: 0%; margin-left: 0; }
          50% { width: 60%; margin-left: 20%; }
          100% { width: 0%; margin-left: 100%; }
        }
      `}</style>
    </>
  );
}
