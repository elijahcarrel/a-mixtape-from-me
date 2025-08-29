// Example of how to use the standardized API request system
// This file is for documentation purposes and can be deleted

import React from 'react';
import { useApiRequest } from '@/app/hooks/useApiRequest';
import LoadingDisplay from '../components/layout/LoadingDisplay';
import ErrorDisplay from '../components/layout/ErrorDisplay';

// Example 1: Simple GET request
export function ExampleGetRequest() {
  const { data, loading, error } = useApiRequest<{
    name: string;
    email: string;
  }>({
    url: '/api/account/me',
  });

  if (loading) return <LoadingDisplay message="Loading user info..." />;
  if (error) return <ErrorDisplay message={error} showLoginLink={true} />;

  return (
    <div>
      <h1>Welcome, {data?.name}!</h1>
      <p>Email: {data?.email}</p>
    </div>
  );
}

// Example 2: POST request with body
export function ExamplePostRequest() {
  const { data, loading, error, refetch } = useApiRequest<{ success: boolean }>(
    {
      url: '/api/account/create-playlist',
      method: 'POST',
      body: { name: 'My New Playlist', description: 'Created via API' },
      onSuccess: data => {
        console.log('Playlist created successfully:', data);
      },
      onError: error => {
        console.error('Failed to create playlist:', error);
      },
    }
  );

  if (loading) return <LoadingDisplay message="Creating playlist..." />;
  if (error) return <ErrorDisplay message={error} showLoginLink={true} />;

  return (
    <div>
      <h1>Playlist Created!</h1>
      <button onClick={refetch}>Create Another</button>
    </div>
  );
}

// Example 3: Custom headers
export function ExampleWithHeaders() {
  const { data, loading, error } = useApiRequest<{ items: any[] }>({
    url: '/api/account/playlists',
    headers: {
      'X-Custom-Header': 'custom-value',
    },
  });

  if (loading) return <LoadingDisplay message="Loading playlists..." />;
  if (error) return <ErrorDisplay message={error} showLoginLink={true} />;

  return (
    <div>
      <h1>Your Playlists</h1>
      <ul>
        {data?.items.map((playlist, index) => (
          <li key={index}>{playlist.name}</li>
        ))}
      </ul>
    </div>
  );
}

/*
Key Features of the useApiRequest hook:

1. Automatic 401 Handling: If any request returns 401, it automatically redirects to login
2. Type Safety: Supports TypeScript generics for type-safe responses
3. Loading States: Automatically manages loading state
4. Error Handling: Provides error messages and optional error callbacks
5. Refetch: Allows manual refetching of data
6. Success Callbacks: Optional onSuccess callback for side effects
7. Flexible: Supports GET, POST, PUT, DELETE with custom headers and bodies

Usage Pattern:
```typescript
const { data, loading, error, refetch } = useApiRequest<ResponseType>({
  url: "/api/endpoint",
  method: "GET", // optional, defaults to GET
  body: {}, // optional, for POST/PUT requests
  headers: {}, // optional, custom headers
  onSuccess: (data) => {}, // optional callback
  onError: (error) => {} // optional callback
});
```
*/
