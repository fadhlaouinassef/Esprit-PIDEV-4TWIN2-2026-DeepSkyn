'use client';

import { Toaster } from 'sonner';
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
      toastOptions={{
        style: { zIndex: 9999 },
      }}
    />
  );
}
