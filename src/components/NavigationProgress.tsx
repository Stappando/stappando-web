'use client';

import { useEffect, useState, useCallback } from 'react';

/**
 * Slim progress bar at the top of the page during navigation.
 * Intercepts all <a> clicks and shows a loading indicator.
 * Uses the same color as the brand (#005667).
 */
export default function NavigationProgress() {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const start = useCallback(() => {
    setVisible(true);
    setProgress(15);
    // Animate progress gradually
    const t1 = setTimeout(() => setProgress(35), 100);
    const t2 = setTimeout(() => setProgress(55), 400);
    const t3 = setTimeout(() => setProgress(70), 800);
    const t4 = setTimeout(() => setProgress(82), 1500);
    setTimeoutId(t4);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  const done = useCallback(() => {
    setProgress(100);
    if (timeoutId) clearTimeout(timeoutId);
    setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 300);
  }, [timeoutId]);

  useEffect(() => {
    // Intercept client-side navigation clicks
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      if (anchor.target === '_blank') return;
      // It's an internal link — show progress
      start();
    };

    // Detect when navigation completes (URL change)
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
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[3px]">
      <div
        className="h-full bg-[#005667] transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
