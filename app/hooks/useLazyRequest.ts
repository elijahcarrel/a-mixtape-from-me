import { useRouter } from 'next/navigation';
import { useUser } from '@stackframe/stack';
import { makeApiRequest } from './makeApiRequest';

// useLazyRequest:
// - Returns a makeRequest function for one-off API calls
// - Used for imperative operations (like saving, claiming, searching)
// - Returns a Promise directly
// - Used in components that need to trigger API calls in response to user actions
export function useLazyRequest() {
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
    return makeApiRequest(url, options, user, router);
  };

  return { makeRequest };
}

// Export the internal function for testing
export { makeApiRequest };
