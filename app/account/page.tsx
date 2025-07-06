'use client';

import { useUser } from '@stackframe/stack';
import RequireAuth from '../components/RequireAuth';

export default function AccountPage() {
  return (
    <RequireAuth>
      <AccountContent />
    </RequireAuth>
  );
}

function AccountContent() {
  const user = useUser();

  return (
    <div className="flex flex-col items-center gap-6">
      <h2 className="text-2xl font-bold">Your Account</h2>
      <div className="bg-white/50 p-6 rounded-lg shadow-sm">
        <p className="text-lg">
          Welcome, <span className="font-semibold">{user?.displayName || 'User'}</span>!
        </p>
        <p className="text-sm text-gray-600 mt-2">
          This page requires authentication. You can see your full name above.
        </p>
      </div>
      <div className="text-center">
        <p className="text-sm text-gray-600">
          This is a boilerplate page for viewing existing mixtapes.
        </p>
        <p className="text-sm text-gray-600 mt-1">
          Future functionality will be added here.
        </p>
      </div>
    </div>
  );
} 