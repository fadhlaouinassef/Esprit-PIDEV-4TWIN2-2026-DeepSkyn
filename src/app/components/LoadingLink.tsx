'use client';

import Link from 'next/link';
import { ComponentProps } from 'react';
import { useNavigation } from './NavigationProvider';

export function LoadingLink({ 
  children, 
  href,
  onClick,
  ...props 
}: ComponentProps<typeof Link>) {
  const { startLoading } = useNavigation();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) {
      onClick(e);
    }

    // Let Next.js handle navigation to avoid full refresh/double-routing flicker.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
      return;
    }

    if (!e.defaultPrevented) {
      startLoading();
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
