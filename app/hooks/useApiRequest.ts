import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface UseApiRequestOptions<T = any> {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
  requireAuth?: boolean;
}

interface UseApiRequestReturn<T = any> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useApiRequest<T = any>({
  url,
  method = 'GET',
  body,
  headers = {},
  onSuccess,
  onError,
  requireAuth = true
}: UseApiRequestOptions<T>): UseApiRequestReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const makeRequest = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get Stack Auth access token if authentication is required
      let authHeaders = { ...headers };
      
      if (requireAuth) {
        // Try to get the access token from the Stack Auth user
        // This will work when the user is authenticated through Stack Auth
        const user = (window as any).__STACK_USER__;
        if (user && typeof user.getAuthJson === 'function') {
          try {
            const authJson = await user.getAuthJson();
            authHeaders['x-stack-access-token'] = authJson.accessToken;
          } catch (err) {
            console.warn('Failed to get access token:', err);
          }
        }
      }

      const requestOptions: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
      };

      if (body && method !== 'GET') {
        requestOptions.body = JSON.stringify(body);
      }

      const response = await fetch(url, requestOptions);

      if (response.status === 401) {
        // Redirect to login with current page as next parameter
        const currentPath = window.location.pathname + window.location.search;
        const loginUrl = `/auth/login?next=${encodeURIComponent(currentPath)}`;
        router.replace(loginUrl);
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      setData(responseData as T);
      onSuccess?.(responseData as T);
    } catch (err: any) {
      const errorMessage = err.message || 'An unknown error occurred';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    makeRequest();
  }, [url]); // Re-run when URL changes

  const refetch = () => {
    makeRequest();
  };

  return { data, loading, error, refetch };
} 