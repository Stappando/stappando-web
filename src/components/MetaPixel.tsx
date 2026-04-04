'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { initPixel, trackFbPageView } from '@/lib/meta-pixel';

/**
 * Meta Pixel initializer + SPA page-view tracker.
 * Mount once in RootLayout (already lazy-loaded via dynamic import).
 */
export default function MetaPixel() {
  const pathname = usePathname();

  // Initialize pixel on mount
  useEffect(() => {
    initPixel();
  }, []);

  // Track page views on route changes
  useEffect(() => {
    trackFbPageView();
  }, [pathname]);

  return null;
}
