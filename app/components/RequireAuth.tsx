'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import LoadingDisplay from './layout/LoadingDisplay';

interface RequireAuthProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export default function RequireAuth({ children, fallback }: RequireAuthProps) {
  const { isAuthenticated, isLoading } = useAuth({ requireAuth: true });

  if (isLoading) {
    return <LoadingDisplay />;
  }

  if (!isAuthenticated) {
    return fallback || null; // Will redirect via useAuth hook
  }

  return <>{children}</>;
}
