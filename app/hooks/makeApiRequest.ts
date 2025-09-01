import { getAuthHeaders } from './useAuth';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

export async function makeApiRequest<T = any>(
  url: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: any;
    headers?: Record<string, string>;
    signal?: AbortSignal;
  } = {},
  user: any,
  router: AppRouterInstance
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
