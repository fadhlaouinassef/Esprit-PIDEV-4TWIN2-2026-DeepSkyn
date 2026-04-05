'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense, useRef, createContext, useContext } from 'react';

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
  const manualLoadingRef = useRef(false);

  const startLoading = () => {
    manualLoadingRef.current = true;
    setIsLoading(true);
  };

  useEffect(() => {
    // Détecte le changement de route
    if (pathname !== prevPathnameRef.current) {
      // Si le loader n'est pas déjà actif manuellement, l'activer maintenant
      if (!manualLoadingRef.current) {
        setIsLoading(true);
      }

      // Clear any existing timer
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }

      // Garde le loader visible pendant au moins 500ms pour une meilleure UX
      loadingTimerRef.current = setTimeout(() => {
        prevPathnameRef.current = pathname;
        setIsLoading(false);
        manualLoadingRef.current = false;
      }, 500);

      return () => {
        if (loadingTimerRef.current) {
          clearTimeout(loadingTimerRef.current);
        }
      };
    } else if (manualLoadingRef.current) {
      // Si on est sur la même page mais le loading manuel est actif, on l'arrête après un délai
      loadingTimerRef.current = setTimeout(() => {
        setIsLoading(false);
        manualLoadingRef.current = false;
      }, 500);
    }
  }, [pathname, searchParams]);

  return (
    <NavigationContext.Provider value={{ startLoading, isLoading }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <NavigationHandler>{children}</NavigationHandler>
    </Suspense>
  );
}
