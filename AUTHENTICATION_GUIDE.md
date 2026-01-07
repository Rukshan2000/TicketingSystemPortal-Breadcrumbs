# Authentication Implementation Guide

Complete guide for implementing authentication in your TMS frontend application.

## Table of Contents
1. [Login Flow](#login-flow)
2. [Token Management](#token-management)
3. [Protected Routes](#protected-routes)
4. [Error Handling](#error-handling)
5. [Logout Flow](#logout-flow)

---

## Login Flow

### Step 1: Create Login Page Component

```typescript
// src/app/login/page.tsx
'use client';

import { useState } from 'react';
import { useLoginMutation } from '@/store/services/authApi';
import { useAppDispatch } from '@/store';
import { setCredentials } from '@/store/features/authSlice';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useAppDispatch();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await login({ email, password }).unwrap();
      
      // Store credentials in Redux and localStorage
      dispatch(setCredentials({
        user: response.data.user,
        tokens: response.data.tokens
      }));

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.data?.error || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6">Login</h1>
        
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            className="w-full mb-4 p-2 border rounded"
          />
          
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            className="w-full mb-4 p-2 border rounded"
          />

          <button
            type="submit"
            disabled={isLoading}
            className="w-full p-2 bg-blue-600 text-white rounded disabled:bg-blue-400"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

### Step 2: Initialize Auth State on App Load

```typescript
// src/app/layout.tsx
'use client';

import { useEffect } from 'react';
import { useAppDispatch } from '@/store';
import { initializeFromStorage } from '@/store/features/authSlice';
import { Providers } from '@/components/providers';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Initialize auth state from localStorage on app load
    dispatch(initializeFromStorage());
  }, [dispatch]);

  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

---

## Token Management

### Step 1: Create Token Refresh Middleware

```typescript
// src/store/middleware/authMiddleware.ts
import { Middleware } from '@reduxjs/toolkit';
import { RootState, AppDispatch } from '..';
import { authApi } from '../services/authApi';
import { setAccessToken, logout } from '../features/authSlice';

let refreshPromise: Promise<any> | null = null;

export const tokenRefreshMiddleware: Middleware =
  (store) => (next) => (action) => {
    // Handle potential 401 errors and refresh token
    if (
      action.type === authApi.endpoints.refreshToken.fulfilled.type
    ) {
      const newToken = action.payload.data.accessToken;
      store.dispatch(setAccessToken(newToken));
    }

    if (
      action.type === authApi.endpoints.refreshToken.rejected.type
    ) {
      // If refresh fails, logout user
      store.dispatch(logout());
    }

    return next(action);
  };
```

### Step 2: Handle 401 Responses in Base Query

Create a custom base query that automatically handles token refresh:

```typescript
// src/store/services/baseQuery.ts
import { fetchBaseQuery, FetchArgs } from '@reduxjs/toolkit/query';
import { RootState } from '..';

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  prepareHeaders: (headers, { getState }) => {
    const tokens = (getState() as RootState).auth.tokens;
    if (tokens?.accessToken) {
      headers.set('authorization', `Bearer ${tokens.accessToken}`);
    }
    return headers;
  },
});

export const baseQueryWithReauth = async (
  args: string | FetchArgs,
  api: any,
  extraOptions: any
) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    // Try to refresh the token
    const state = api.getState() as RootState;
    if (state.auth.tokens?.refreshToken) {
      const refreshResult = await baseQuery(
        {
          url: '/auth/refresh-token',
          method: 'POST',
          body: {
            refreshToken: state.auth.tokens.refreshToken,
          },
        },
        api,
        extraOptions
      );

      if (refreshResult.data) {
        const { data } = refreshResult as any;
        api.dispatch(setAccessToken(data.data.accessToken));
        // Retry the original request
        result = await baseQuery(args, api, extraOptions);
      } else {
        // Refresh failed, logout user
        api.dispatch(logout());
      }
    }
  }

  return result;
};
```

Then update your APIs to use this:

```typescript
// src/store/services/authApi.ts
import { baseQueryWithReauth } from './baseQuery';

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: baseQueryWithReauth,  // Use custom base query
  endpoints: (builder) => ({
    // ... endpoints
  }),
});
```

---

## Protected Routes

### Step 1: Create Route Guard Component

```typescript
// src/components/ProtectedRoute.tsx
'use client';

import { ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { redirect } from 'next/navigation';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'user' | 'moderator' | 'admin';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useSelector(
    (state: RootState) => state.auth
  );

  if (!isAuthenticated) {
    redirect('/login');
  }

  if (requiredRole && user?.role !== requiredRole) {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
```

### Step 2: Use in Protected Pages

```typescript
// src/app/dashboard/layout.tsx
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      {/* Dashboard layout */}
      {children}
    </ProtectedRoute>
  );
}
```

---

## Error Handling

### Step 1: Create Error Handler Hook

```typescript
// src/hooks/useApiError.ts
import { SerializedError } from '@reduxjs/toolkit';
import { FetchBaseQueryError } from '@reduxjs/toolkit/query';

type ApiError = FetchBaseQueryError | SerializedError | undefined;

export function useApiError(error: ApiError): string {
  if (!error) return '';

  if ('status' in error) {
    // FetchBaseQueryError
    if ('data' in error) {
      const data = error.data as any;
      return data?.error || data?.message || 'An error occurred';
    }
    return `Error: ${error.status}`;
  }

  if ('message' in error) {
    // SerializedError
    return error.message || 'An unknown error occurred';
  }

  return 'An unexpected error occurred';
}
```

### Step 2: Use in Components

```typescript
// In your login component:
const [login, { isLoading, error }] = useLoginMutation();
const errorMessage = useApiError(error);

return (
  <>
    {errorMessage && (
      <div className="p-4 bg-red-100 text-red-700 rounded">
        {errorMessage}
      </div>
    )}
  </>
);
```

---

## Logout Flow

### Step 1: Implement Logout Handler

```typescript
// src/hooks/useLogout.ts
import { useLogoutMutation } from '@/store/services/authApi';
import { useAppDispatch, useAppSelector } from '@/store';
import { logout as logoutAction } from '@/store/features/authSlice';
import { useRouter } from 'next/navigation';

export function useLogout() {
  const [logoutMutation] = useLogoutMutation();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { tokens } = useAppSelector((state) => state.auth);

  const logout = async () => {
    try {
      // Call logout endpoint
      if (tokens?.accessToken) {
        await logoutMutation({
          accessToken: tokens.accessToken,
        }).unwrap();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear state and localStorage
      dispatch(logoutAction());
      // Redirect to login
      router.push('/login');
    }
  };

  return logout;
}
```

### Step 2: Use in Header/Navigation

```typescript
// src/components/Header.tsx
'use client';

import { useLogout } from '@/hooks/useLogout';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

export function Header() {
  const logout = useLogout();
  const { user } = useSelector((state: RootState) => state.auth);

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <h1>TMS Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            Welcome, {user?.first_name}!
          </span>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
```

---

## Complete Example: User Profile Update

Shows how to handle authentication with API requests:

```typescript
// src/app/profile/page.tsx
'use client';

import { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useUpdateUserMutation } from '@/store/services/userApi';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function ProfilePage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [updateUser, { isLoading, error }] = useUpdateUserMutation();
  
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    phone: user?.phone || '',
    department: user?.department || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateUser({
        userId: user?.id || 0,
        data: formData,
      }).unwrap();

      alert('Profile updated successfully!');
    } catch (err: any) {
      alert(`Update failed: ${err.data?.error || 'Unknown error'}`);
    }
  };

  if (!user) return null;

  return (
    <ProtectedRoute>
      <div className="max-w-2xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">My Profile</h1>

        {error && (
          <div className="p-4 bg-red-100 text-red-700 rounded mb-4">
            Error: {(error as any)?.data?.error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              First Name
            </label>
            <input
              type="text"
              value={formData.first_name}
              onChange={(e) =>
                setFormData({ ...formData, first_name: e.target.value })
              }
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Department
            </label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) =>
                setFormData({ ...formData, department: e.target.value })
              }
              className="w-full p-2 border rounded"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full p-2 bg-blue-600 text-white rounded disabled:bg-blue-400"
          >
            {isLoading ? 'Updating...' : 'Update Profile'}
          </button>
        </form>
      </div>
    </ProtectedRoute>
  );
}
```

---

## Summary

Key points for implementing authentication:

1. **Login**: Use `useLoginMutation()` from authApi
2. **Store**: Dispatch `setCredentials()` to save user and tokens
3. **Restore**: Call `initializeFromStorage()` on app load
4. **Protect**: Wrap routes with `<ProtectedRoute>`
5. **Refresh**: Implement auto-refresh for expired tokens
6. **Logout**: Dispatch `logout()` action and clear localStorage
7. **Errors**: Handle and display API errors properly

For production, ensure:
- Use HTTPS for all API calls
- Store tokens securely
- Implement proper token refresh timing
- Handle session expiration gracefully
- Show appropriate error messages to users

