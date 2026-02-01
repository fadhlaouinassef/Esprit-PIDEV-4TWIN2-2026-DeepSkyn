'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ComponentProps } from 'react';
import { useNavigation } from './NavigationProvider';

export function LoadingLink({ 
  children, 
  href, 
  onClick,
  ...props 
}: ComponentProps<typeof Link>) {
  const router = useRouter();
  const { startLoading } = useNavigation();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Appeler le onClick personnalisé s'il existe
    if (onClick) {
      onClick(e);
    }
    
    // Si l'événement n'a pas été empêché, procéder à la navigation
    if (!e.defaultPrevented) {
      e.preventDefault();
      // Afficher le loader IMMÉDIATEMENT avant de naviguer
      startLoading();
      // Naviguer vers la nouvelle page
      router.push(href.toString());
    }
  };

  return (
    <Link 
      href={href} 
      onClick={handleClick}
      {...props}
    >
      {children}
    </Link>
  );
}
