'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { PageLoader } from './PageLoader';

function NavigationHandler({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [displayLocation, setDisplayLocation] = useState(pathname);

  useEffect(() => {
    // Détecte le changement de route
    if (pathname !== displayLocation) {
      setIsLoading(true);
      
      // Simule le temps de chargement du contenu
      const timer = setTimeout(() => {
        setDisplayLocation(pathname);
        setIsLoading(false);
      }, 600);

      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams, displayLocation]);

  return (
    <>
      {isLoading && <PageLoader />}
      <div style={{ display: isLoading ? 'none' : 'block' }}>
        {children}
      </div>
    </>
  );
}

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PageLoader />}>
      <NavigationHandler>{children}</NavigationHandler>
    </Suspense>
  );
}
