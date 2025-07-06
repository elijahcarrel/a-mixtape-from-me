# Authentication System

This app uses Stack Auth for authentication with a custom vintage, sepia theme that matches the app's aesthetic.

## Features

- **UserButton**: Located in the top-right corner of all pages, provides login/logout functionality
- **Custom Theme**: Vintage, sepia colors that match the app's nostalgic aesthetic
- **Auth Requirements**: Pages can require authentication with automatic redirects
- **Shared Logic**: Common authentication logic shared between components and API requests

## Components

### UserButton
The `UserButton` component is automatically included in the layout (`app/layout.tsx`) and appears in the top-right corner of all pages. It provides:
- User information display (name and email)
- Login/logout functionality
- Color mode toggle (if implemented)

### StackTheme
A custom theme is applied to all Stack Auth components with vintage, sepia colors:
- Primary: `#D4C4B0` (sepia)
- Background: `#F4EDE4` (light sepia)
- Text: `#2D2D2D` (dark brown)

## Authentication Hooks and Components

### useAuth Hook
Located in `app/hooks/useAuth.ts`, provides authentication state and automatic redirects:

```typescript
import { useAuth } from '../hooks/useAuth';

function MyComponent() {
  const { user, isAuthenticated, isLoading } = useAuth({ requireAuth: true });
  
  if (isLoading) return <LoadingDisplay />;
  if (!isAuthenticated) return null; // Will redirect automatically
  
  return <div>Hello, {user?.displayName}!</div>;
}
```

### RequireAuth Component
Located in `app/components/RequireAuth.tsx`, wraps pages that require authentication:

```typescript
import RequireAuth from '../components/RequireAuth';

export default function ProtectedPage() {
  return (
    <RequireAuth>
      <div>This content requires authentication</div>
    </RequireAuth>
  );
}
```

### getAuthHeaders Helper
Located in `app/hooks/useAuth.ts`, provides authentication headers for API requests:

```typescript
import { getAuthHeaders } from '../hooks/useAuth';

const headers = await getAuthHeaders(user);
```

## API Requests with Authentication

The `useApiRequest` hook (`app/hooks/useApiRequest.ts`) automatically handles authentication:
- Automatically includes auth headers when `requireAuth` is true
- Redirects to login on 401 responses
- Shares authentication logic with the `useAuth` hook

## Pages Requiring Authentication

### /account
- **File**: `app/account/page.tsx`
- **Auth**: Required
- **Purpose**: View existing mixtapes (boilerplate)
- **Implementation**: Uses `RequireAuth` component

## Redirect Flow

When a user tries to access a protected page without authentication:

1. User visits protected page (e.g., `/account`)
2. `useAuth` hook detects no authentication
3. Redirects to `/handler/signup?next=/account`
4. User completes sign-up/sign-in flow
5. User is redirected back to the original page (`/account`)

## Styling

The authentication components are styled to match the app's vintage aesthetic:
- Sepia color palette
- Rounded corners (`0.75rem` border radius)
- Consistent with the overall design system

## Examples

See `app/examples/AuthExample.tsx` for a complete example of using the `useAuth` hook directly in a component. 