'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useAnalyticsStore } from '@/store/analytics';

export default function PageViewTracker() {
  const pathname = usePathname();
  useEffect(() => {
    useAnalyticsStore.getState().trackPageView(pathname, typeof document !== 'undefined' ? document.referrer : '');
  }, [pathname]);
  return null;
}
