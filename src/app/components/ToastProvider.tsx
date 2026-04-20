'use client';

import { Toaster } from 'sonner';
import { useEffect } from 'react';

export function ToastProvider() {
  useEffect(() => {
    console.log('✅ ToastProvider mounted successfully');
  }, []);

  return (
    <Toaster
      position="bottom-right"
      offset={{ bottom: '32px', right: '20px', top: '16px', left: '16px' }}
      mobileOffset={{ bottom: '24px', right: '12px', left: '12px', top: '12px' }}
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
