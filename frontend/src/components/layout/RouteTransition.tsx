'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { isInitialDocumentLoad, markAppMounted } from '@/lib/appSession';

/**
 * Reliable App Router route transition.
 *
 * The root layout persists across navigations, so `usePathname` reports every
 * client route change even when the target route lives in a separate bundle.
 * The `key` restarts the CSS animation; the first document commit is left to
 * the preloader/page-enter path so the two never stack.
 *
 * The wrapper itself animates opacity only; the scale is applied to <main> by
 * CSS so fixed navbar/backdrop children keep their viewport containing block.
 */
export const RouteTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();

  // Read before the mount effect runs: false for the first document commit,
  // true for every later client navigation (including back to the home route).
  const animate = !isInitialDocumentLoad();

  useEffect(() => {
    markAppMounted();
  }, []);

  return (
    <div
      key={pathname}
      data-route-transition={animate ? 'active' : 'initial'}
      className={animate ? 'route-transition' : undefined}
    >
      {children}
    </div>
  );
};
