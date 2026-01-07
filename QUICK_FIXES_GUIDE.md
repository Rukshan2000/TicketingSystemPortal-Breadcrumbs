# Quick Fixes: Frontend Authorization & Middleware

## Problem Summary
✅ Your API **IS working correctly** now
❌ The 503 error happened because the Authorization header wasn't being sent

This guide provides quick, copy-paste fixes to prevent this from happening again.

---

## Fix #1: Add Auth Error Handling Middleware 🔄

**Status**: ⚠️ **MISSING** - Not currently implemented

### Why This Matters
When token expires or is invalid, your backend returns 401. Without this middleware, users see confusing errors instead of being logged out and redirected to login.

### Implementation

Create a new file: `src/lib/auth-middleware.ts`

```typescript
import { isRejectedWithValue } from '@reduxjs/toolkit';
import type { Middleware, MiddlewareAPI } from '@reduxjs/toolkit';
import { logout } from '@/store/features/authSlice';

/**
 * Log a warning and put the error to console as
 * well if it's available for debugging purposes.
 */
const rtkQueryErrorLogger: Middleware =
  (api: MiddlewareAPI) => (next) => (action) => {
    if (isRejectedWithValue(action)) {
      // Handle 401 Unauthorized (token expired/invalid)
      if (action.payload?.status === 401) {
        console.warn('Unauthorized: Token expired or invalid. Logging out...');
        api.dispatch(logout());
        
        // Redirect to login page
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
      
      // Handle 403 Forbidden (insufficient permissions)
      if (action.payload?.status === 403) {
        console.warn('Forbidden: You do not have permission to access this resource.');
      }
      
      // Handle 503 Service Unavailable
      if (action.payload?.status === 503) {
        console.error('Service Unavailable: Backend is temporarily unavailable.');
        // Maybe show a toast notification to user
      }
      
      // Log other errors
      console.error(
        'API Error:',
        action.payload?.status,
        action.payload?.data?.message
      );
    }

    return next(action);
  };

export default rtkQueryErrorLogger;
```

### Add to Redux Store: `src/store/index.ts`

Replace:
```typescript
export const store = configureStore({
  reducer: {
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
    // ... other reducers
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(authApi.middleware)
      .concat(userApi.middleware)
      // ... other middleware
});
```

With:
```typescript
import rtkQueryErrorLogger from '@/lib/auth-middleware';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
    // ... other reducers
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(rtkQueryErrorLogger)  // ← ADD THIS LINE
      .concat(authApi.middleware)
      .concat(userApi.middleware)
      // ... other middleware
});
```

---

## Fix #2: Clear Service Worker on Login 🧹

**Status**: ⚠️ **Partially implemented** - Tokens are cleared on logout, but service worker isn't

### Why This Matters
Service workers cache responses. If a 503 was cached, subsequent requests might still fail even with valid token.

### Implementation

Update: `src/app/login/page.tsx`

Find this section:
```typescript
const onSubmit = async (data: LoginFormValues) => {
  try {
    setError(null);
    
    // Call the API
    const response = await login(data).unwrap();
```

Add service worker clearing:
```typescript
const onSubmit = async (data: LoginFormValues) => {
  try {
    setError(null);
    
    // Clear service worker cache on login
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (let registration of registrations) {
          await registration.unregister();
        }
        console.log('Service workers unregistered');
      } catch (err) {
        console.warn('Failed to clear service workers:', err);
      }
    }
    
    // Call the API
    const response = await login(data).unwrap();
```

---

## Fix #3: Add Request/Response Logging 📊

**Status**: ⚠️ **Helpful for debugging**

### Why This Matters
Makes it easy to verify Authorization header is being sent and see actual response status codes.

### Implementation

Create: `src/lib/api-logger.ts`

```typescript
/**
 * Logs all API requests and responses for debugging
 * Remove or disable in production
 */
export const logApiCall = (
  method: string,
  url: string,
  headers: HeadersInit,
  status?: number,
  body?: any
) => {
  const isDev = process.env.NODE_ENV === 'development';
  
  if (!isDev) return;
  
  console.group(`📡 API ${method} ${url}`);
  console.log('Headers:', headers);
  if (body) console.log('Body:', body);
  if (status) console.log('Status:', status);
  console.groupEnd();
};
```

Add to each API slice's `prepareHeaders`:

```typescript
prepareHeaders: (headers, { getState }) => {
  const tokens = (getState() as RootState).auth.tokens;
  if (tokens?.accessToken) {
    headers.set('authorization', `Bearer ${tokens.accessToken}`);
  }
  
  // Log the request (development only)
  if (process.env.NODE_ENV === 'development') {
    console.log('📡 Request to:', API_BASE_URL);
    console.log('   Authorization:', headers.get('authorization') ? 'Set ✅' : 'Missing ❌');
  }
  
  return headers;
},
```

---

## Fix #4: Add Token Expiry Check ⏰

**Status**: ⚠️ **Not implemented** - Tokens can expire silently

### Why This Matters
If token expires but you're still on the app, API calls will fail with 401. Better to check proactively.

### Implementation

Create: `src/hooks/useTokenExpiry.ts`

```typescript
import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { logout } from '@/store/features/authSlice';

/**
 * Hook that monitors token expiry and logs out user if token expired
 */
export const useTokenExpiry = () => {
  const dispatch = useDispatch();
  const tokens = useSelector((state: RootState) => state.auth.tokens);
  
  useEffect(() => {
    if (!tokens?.expiresAt) return;
    
    const checkExpiry = () => {
      const expiryTime = new Date(tokens.expiresAt).getTime();
      const currentTime = new Date().getTime();
      const timeUntilExpiry = expiryTime - currentTime;
      
      if (timeUntilExpiry <= 0) {
        // Token expired
        console.warn('Token expired. Logging out...');
        dispatch(logout());
      } else if (timeUntilExpiry < 5 * 60 * 1000) {
        // Token expires in less than 5 minutes
        console.warn(
          `Token expires in ${Math.round(timeUntilExpiry / 1000)} seconds`
        );
      }
    };
    
    // Check immediately
    checkExpiry();
    
    // Check every minute
    const interval = setInterval(checkExpiry, 60 * 1000);
    
    return () => clearInterval(interval);
  }, [tokens, dispatch]);
};
```

Use in your dashboard:

```typescript
// src/app/dashboard/page.tsx
import { useTokenExpiry } from '@/hooks/useTokenExpiry';

export default function DashboardPage() {
  useTokenExpiry(); // Monitor token expiry
  
  return (
    // ... dashboard content
  );
}
```

---

## Fix #5: Add Token Refresh on 401 ♻️

**Status**: ⚠️ **Advanced** - Not currently implemented

### Why This Matters
Instead of immediately logging out when token expires, try to refresh it automatically.

### Implementation

This is more complex. Here's the pattern using RTK Query's `baseQuery` chaining:

Create: `src/store/services/baseQuery.ts`

```typescript
import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { RootState } from '..';
import { setAccessToken, logout } from '../features/authSlice';

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

/**
 * Custom base query that handles token refresh on 401
 */
export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    console.log('Received 401, attempting to refresh token...');
    
    const refreshToken = (api.getState() as RootState).auth.tokens?.refreshToken;
    
    if (refreshToken) {
      try {
        // Try to refresh token
        const refreshResult = await baseQuery(
          {
            url: '/auth/refresh-token',
            method: 'POST',
            body: { refreshToken },
          },
          api,
          extraOptions
        );

        if (refreshResult.data) {
          // Update token in store
          const newToken = (refreshResult.data as any).data?.accessToken;
          api.dispatch(setAccessToken(newToken));
          console.log('Token refreshed successfully');
          
          // Retry original request
          result = await baseQuery(args, api, extraOptions);
        } else {
          // Refresh failed, logout
          api.dispatch(logout());
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
        api.dispatch(logout());
      }
    } else {
      // No refresh token, logout
      api.dispatch(logout());
    }
  }

  return result;
};
```

Then use in each API slice:

```typescript
// OLD:
export const ticketApi = createApi({
  reducerPath: 'ticketApi',
  baseQuery: fetchBaseQuery({ ... }),
  // ...
});

// NEW:
import { baseQueryWithReauth } from './baseQuery';

export const ticketApi = createApi({
  reducerPath: 'ticketApi',
  baseQuery: baseQueryWithReauth,  // ← Use custom base query
  // ...
});
```

---

## 🚀 Quick Implementation Roadmap

### Phase 1: Immediate (Do This Now)
- [x] Verify tokens are in Redux state (DevTools)
- [x] Clear service worker (DevTools → Application)
- [x] Hard refresh browser (Cmd+Shift+R)
- [ ] Implement Fix #2 (Clear service worker on login)

### Phase 2: Short-term (Next 30 mins)
- [ ] Implement Fix #1 (Auth error handling middleware)
- [ ] Add Fix #3 (API logging) for debugging

### Phase 3: Long-term (Next week)
- [ ] Implement Fix #4 (Token expiry check)
- [ ] Implement Fix #5 (Automatic token refresh)
- [ ] Talk to backend team about returning 401 instead of 503

---

## 🧪 Testing

After implementing Fix #1, test with:

```bash
# Make token invalid
1. Open DevTools → Application → LocalStorage
2. Delete 'accessToken'
3. Make any API call (e.g., go to /dashboard/users)
4. Expected: Automatically logged out and redirected to /login
```

After implementing Fix #4, test with:

```bash
# Simulate token expiry
1. In Redux DevTools, find auth.tokens.expiresAt
2. Manually edit it to current time or earlier
3. Wait for next check (within 1 minute)
4. Expected: Console warning about expiry
```

---

## 📞 Questions?

- **"Why did I get 503?"** - Missing Authorization header from browser
- **"Why did curl work?"** - Curl request had explicit header, no service worker cache
- **"How do I check if Authorization header is set?"** - DevTools Network tab, Request Headers section
- **"Should backend return 503 for auth errors?"** - No, should be 401/403 (recommend fixing backend)

