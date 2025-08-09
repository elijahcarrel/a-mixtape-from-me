import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@stackframe/stack';
import { makeAuthenticatedRequest } from './useAuthenticatedRequest';

interface UseApiRequestOptions<T = any> {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
}

interface UseApiRequestReturn<T = any> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// useApiRequest:
// - Returns state (data, loading, error, refetch) for reactive data fetching
// - Used for declarative data fetching that automatically runs on mount
// - Manages loading/error states internally
// - Used in pages/components that need to display data from the API
export function useApiRequest<T = any>({
  url,
  method = 'GET',
  body,
  headers = {},
  onSuccess,
  onError,
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
      const responseData = await makeAuthenticatedRequest(url, { method, body, headers }, user, router);
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