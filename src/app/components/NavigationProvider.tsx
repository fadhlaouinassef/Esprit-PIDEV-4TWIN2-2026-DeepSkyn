'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense, useRef, createContext, useContext } from 'react';
import { PageLoader } from './PageLoader';

// Contexte pour gérer l'état de chargement global
interface NavigationContextType {
  startLoading: () => void;
  isLoading: boolean;
}

const NavigationContext = createContext<NavigationContextType>({
  startLoading: () => { },
  isLoading: false,
});

export const useNavigation = () => useContext(NavigationContext);

function NavigationHandler({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const prevPathnameRef = useRef(pathname);
  const loadingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startLoading = () => {
    setIsLoading(true);
  };

  useEffect(() => {
    // Détecte le changement de route
    if (pathname !== prevPathnameRef.current) {
      setIsLoading(true);

      // Clear any existing timer
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }

      // Garde le loader visible pendant au moins 500ms pour une meilleure UX
      loadingTimerRef.current = setTimeout(() => {
        prevPathnameRef.current = pathname;
        setIsLoading(false);
      }, 500);

      return () => {
        if (loadingTimerRef.current) {
          clearTimeout(loadingTimerRef.current);
        }
      };
    } else {
      // Si on est déjà sur la bonne page, arrêter le chargement
      setIsLoading(false);
    }
  }, [pathname, searchParams]);

  return (
    <NavigationContext.Provider value={{ startLoading, isLoading }}>
      {isLoading && <PageLoader />}
      <div style={{ display: isLoading ? 'none' : 'block' }}>
        {children}
      </div>
    </NavigationContext.Provider>
  );
}

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PageLoader />}>
      <NavigationHandler>{children}</NavigationHandler>
    </Suspense>
  );
}
