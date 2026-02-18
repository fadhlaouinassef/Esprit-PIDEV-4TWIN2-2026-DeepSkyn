'use client';

import { Toaster, toast } from 'sonner';
import { useEffect } from 'react';

export function ToastProvider() {
  useEffect(() => {
    console.log('✅ ToastProvider mounted successfully');
  }, []);

  return (
    <Toaster
      position="top-center"
      richColors
      closeButton
      expand={true}
      visibleToasts={5}
    />
  );
}
