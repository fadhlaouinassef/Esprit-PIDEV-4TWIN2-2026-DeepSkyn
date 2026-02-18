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
      theme="light"
      toastOptions={{
        unstyled: false,
        duration: 4000,
        classNames: {
          toast: 'sonner-toast bg-white border-2 shadow-lg',
          title: 'text-sm font-semibold text-gray-900',
          description: 'text-sm text-gray-600',
          actionButton: 'bg-blue-500 text-white',
          cancelButton: 'bg-gray-200 text-gray-900',
          closeButton: 'bg-white border-gray-200',
          success: 'toast-success',
          error: 'toast-error',
        },
      }}
    />
  );
}
