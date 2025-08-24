'use client';

import { useAuth } from '../hooks/useAuth';
import LoadingDisplay from '../components/LoadingDisplay';

export default function AuthExample() {
  const { user, isAuthenticated, isLoading } = useAuth({ requireAuth: true });

  if (isLoading) {
    return <LoadingDisplay />;
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useAuth hook
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <h3 className="text-xl font-semibold">Auth Example (Hook Approach)</h3>
      <p>Hello, {user?.displayName || 'User'}!</p>
      <p className="text-sm text-gray-600">
        This component uses the useAuth hook directly.
      </p>
    </div>
  );
}
