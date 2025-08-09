import { useRouter } from 'next/navigation';
import { useUser } from '@stackframe/stack';
import { getAuthHeaders } from './useAuth';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

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

// Export the internal function for testing
export { makeAuthenticatedRequest };
