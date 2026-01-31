'use client';

import Link from 'next/link';
import { ComponentProps, useState } from 'react';

export function LoadingLink({ 
  children, 
  href, 
  ...props 
}: ComponentProps<typeof Link>) {
  const [isNavigating, setIsNavigating] = useState(false);

  const handleClick = () => {
    setIsNavigating(true);
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
