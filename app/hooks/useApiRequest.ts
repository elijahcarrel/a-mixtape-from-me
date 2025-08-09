import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@stackframe/stack';
import { getAuthHeaders } from './useAuth';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

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

async function makeAuthenticatedRequest<T = any>(
  url: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: any;
    headers?: Record<string, string>;
    signal?: AbortSignal;
  } = {},
  user: any,
  router: AppRouterInstance,
): Promise<T> {
  const { method = 'GET', body, headers = {}, signal } = options;
  
  // Get auth headers
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

  if (signal) {
    requestOptions.signal = signal;
  }

  const response = await fetch(url, requestOptions);

  if (response.status === 401) {
    // Redirect to login with current page as next parameter
    const currentPath = window.location.pathname + window.location.search;
    const loginUrl = `/handler/signup?next=${encodeURIComponent(currentPath)}`;
    router.replace(loginUrl);
    throw new Error('Authentication required');
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// useAuthenticatedRequest:
// - Returns a makeRequest function for one-off API calls
// - Used for imperative operations (like saving, claiming, searching)
// - Returns a Promise directly
// - Used in components that need to trigger API calls in response to user actions
export function useAuthenticatedRequest() {
  const user = useUser();
  const router = useRouter();

  const makeRequest = async <T = any>(
    url: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      body?: any;
      headers?: Record<string, string>;
      signal?: AbortSignal;
    } = {}
  ): Promise<T> => {
    return makeAuthenticatedRequest(url, options, user, router);
  };

  return { makeRequest };
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