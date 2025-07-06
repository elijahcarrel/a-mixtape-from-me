import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@stackframe/stack';
import { getAuthHeaders } from './useAuth';

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
  const user = useUser();

  const makeRequest = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get auth headers using shared logic
      const authHeaders = await getAuthHeaders(user);
      const requestHeaders = {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...headers,
      };

      const requestOptions: RequestInit = {
        method,
        headers: requestHeaders,
      };

      if (body && method !== 'GET') {
        requestOptions.body = JSON.stringify(body);
      }

      const response = await fetch(url, requestOptions);

      if (response.status === 401) {
        // Redirect to login with current page as next parameter
        const currentPath = window.location.pathname + window.location.search;
        const loginUrl = `/handler/signup?next=${encodeURIComponent(currentPath)}`;
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
  }, [url, user]); // Re-run when URL or user changes

  const refetch = () => {
    makeRequest();
  };

  return { data, loading, error, refetch };
} 