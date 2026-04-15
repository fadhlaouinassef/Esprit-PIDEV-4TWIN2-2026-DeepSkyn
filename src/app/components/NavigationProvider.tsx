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
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const failSafeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const manualLoadingRef = useRef(false);

  const startLoading = () => {
    manualLoadingRef.current = true;
    setIsLoading(true);

    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    if (failSafeTimerRef.current) {
      clearTimeout(failSafeTimerRef.current);
    }

    // Failsafe: stop spinner if navigation does not complete for any reason.
    failSafeTimerRef.current = setTimeout(() => {
      setIsLoading(false);
      manualLoadingRef.current = false;
    }, 10000);
  };

  useEffect(() => {
    // Route changed/settled: hide loader quickly instead of enforcing an artificial delay.
    if (manualLoadingRef.current || isLoading) {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
      hideTimerRef.current = setTimeout(() => {
        setIsLoading(false);
        manualLoadingRef.current = false;
      }, 80);

      if (failSafeTimerRef.current) {
        clearTimeout(failSafeTimerRef.current);
        failSafeTimerRef.current = null;
      }
    }

    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
      if (failSafeTimerRef.current) {
        clearTimeout(failSafeTimerRef.current);
      }
    };
  }, [pathname, searchParams, isLoading]);

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
