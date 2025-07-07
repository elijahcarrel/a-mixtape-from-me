import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@stackframe/stack';

interface UseAuthOptions {
  requireAuth?: boolean;
  redirectTo?: string;
}

export function useAuth({ requireAuth = false, redirectTo }: UseAuthOptions = {}) {
  const user = useUser();
  const router = useRouter();

  useEffect(() => {
    if (requireAuth && !user) {
      // Redirect to login with current page as next parameter
      const currentPath = window.location.pathname + window.location.search;
      const loginUrl = `/handler/signup?next=${encodeURIComponent(currentPath)}`;
      router.replace(loginUrl);
    }
  }, [requireAuth, user, router]);

  return {
    user,
    isAuthenticated: !!user,
    isLoading: user === undefined,
  };
}

// Helper function to get auth headers for API requests
export async function getAuthHeaders(user: any): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  
  if (user) {
    try {
      const authJson = await user.getAuthJson();
      if (authJson.accessToken) {
        headers['x-stack-access-token'] = authJson.accessToken;
      }
    } catch (err) {
      console.warn('Failed to get access token:', err);
    }
  }
  
  return headers;
} 