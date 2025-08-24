import React from 'react';
import { Toaster } from 'react-hot-toast';

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 10000, // 10 seconds
          style: {
            background: 'rgb(217 119 6)', // amber-600
            color: 'white',
            fontSize: '14px',
            fontWeight: '500',
            padding: '12px 16px',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
            maxWidth: '400px',
          },
          success: {
            style: {
              background: 'rgb(34 197 94)', // green-500
            },
          },
          error: {
            style: {
              background: 'rgb(239 68 68)', // red-500
            },
          },
        }}
      />
    </>
  );
}
