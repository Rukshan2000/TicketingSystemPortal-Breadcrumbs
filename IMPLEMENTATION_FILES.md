# Middleware Implementation Files

Copy-paste ready implementations for all middleware fixes.

---

## File 1: Auth Error Handling Middleware

**Path**: `src/lib/auth-middleware.ts`

```typescript
import { isRejectedWithValue } from '@reduxjs/toolkit';
import type { Middleware, MiddlewareAPI } from '@reduxjs/toolkit';
import { logout } from '@/store/features/authSlice';

/**
 * Auth Error Logger Middleware
 * 
 * Handles API errors related to authentication:
 * - 401: Token expired or invalid → Log out user
 * - 403: Insufficient permissions → Show warning
 * - 503: Service unavailable → Log error
 */
const rtkQueryErrorLogger: Middleware =
  (api: MiddlewareAPI) => (next) => (action) => {
    if (isRejectedWithValue(action)) {
      const status = action.payload?.status;
      const message = action.payload?.data?.message;
      const errorMessage = action.payload?.data?.error;

      // Handle 401 Unauthorized (token expired/invalid)
      if (status === 401) {
        console.error('❌ Unauthorized: Token expired or invalid');
        api.dispatch(logout());
        
        // Redirect to login page
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return;
      }
      
      // Handle 403 Forbidden (insufficient permissions)
      if (status === 403) {
        console.warn('⚠️ Forbidden: You do not have permission to access this resource');
      }
      
      // Handle 503 Service Unavailable
      if (status === 503) {
        console.error(
          '⚠️ Service Unavailable: Backend is temporarily unavailable'
        );
      }
      
      // Log other errors
      console.error(
        `🔴 API Error [${status}]:`,
        message || errorMessage || action.payload?.data
      );
    }

    return next(action);
  };

export default rtkQueryErrorLogger;
```

**How to add to store**: See "Integration" section below.

---

## File 2: Token Expiry Hook

**Path**: `src/hooks/useTokenExpiry.ts`

```typescript
import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { logout } from '@/store/features/authSlice';

/**
 * Hook that monitors token expiry and logs out user if token expired.
 * 
 * Usage:
 * ```tsx
 * export default function DashboardPage() {
 *   useTokenExpiry();
 *   return <div>Dashboard</div>;
 * }
 * ```
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
        console.warn('🔐 Token expired. Logging out...');
        dispatch(logout());
      } else if (timeUntilExpiry < 5 * 60 * 1000) {
        // Token expires in less than 5 minutes - warn user
        const minutesLeft = Math.round(timeUntilExpiry / 1000 / 60);
        console.warn(
          `⏰ Token expires in ${minutesLeft} minute(s)`
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

---

## File 3: API Request Logger

**Path**: `src/lib/api-logger.ts`

```typescript
/**
 * API Request/Response Logger
 * 
 * Logs all API requests and responses for debugging.
 * Only logs in development environment.
 * 
 * Usage: Add to any API slice's prepareHeaders
 */
export const logApiRequest = (
  method: string,
  url: string,
  hasAuth: boolean
) => {
  if (process.env.NODE_ENV !== 'development') return;
  
  const authStatus = hasAuth ? '✅ Auth' : '❌ No Auth';
  console.log(`📡 ${method} ${url.substring(0, 40)} | ${authStatus}`);
};

export const logApiError = (
  method: string,
  url: string,
  status: number,
  error?: any
) => {
  if (process.env.NODE_ENV !== 'development') return;
  
  console.group(`🔴 API Error [${status}]`);
  console.log('Method:', method);
  console.log('URL:', url);
  console.log('Error:', error?.data || error?.message);
  console.groupEnd();
};

export const logApiSuccess = (
  method: string,
  url: string,
  status: number
) => {
  if (process.env.NODE_ENV !== 'development') return;
  
  console.log(`✅ ${method} ${url.substring(0, 40)} [${status}]`);
};
```

**How to use in API slice**:

```typescript
prepareHeaders: (headers, { getState }) => {
  const tokens = (getState() as RootState).auth.tokens;
  const hasToken = !!tokens?.accessToken;
  
  // Log the request
  logApiRequest('GET', API_BASE_URL + '/tickets', hasToken);
  
  if (tokens?.accessToken) {
    headers.set('authorization', `Bearer ${tokens.accessToken}`);
  }
  return headers;
},
```

---

## File 4: Base Query with Reauth

**Path**: `src/store/services/baseQuery.ts`

Use this if you want automatic token refresh on 401.

```typescript
import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { RootState } from '..';
import { setAccessToken, logout } from '../features/authSlice';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const tokens = (getState() as RootState).auth.tokens;
    if (tokens?.accessToken) {
      headers.set('authorization', `Bearer ${tokens.accessToken}`);
      if (process.env.NODE_ENV === 'development') {
        console.log('📡 Authorization header set');
      }
    }
    return headers;
  },
});

/**
 * Base Query with Automatic Token Refresh
 * 
 * If a request returns 401, this will:
 * 1. Try to refresh the token using the refresh token
 * 2. If refresh succeeds, retry the original request
 * 3. If refresh fails, log out the user
 */
export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  // First attempt
  let result = await baseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    console.log('🔄 Received 401, attempting to refresh token...');
    
    const refreshToken = (api.getState() as RootState).auth.tokens?.refreshToken;
    
    if (refreshToken) {
      try {
        // Attempt token refresh
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
          // Extract new access token
          const newToken = (refreshResult.data as any).data?.accessToken;
          
          if (newToken) {
            // Update token in Redux
            api.dispatch(setAccessToken(newToken));
            console.log('✅ Token refreshed successfully');
            
            // Retry original request with new token
            result = await baseQuery(args, api, extraOptions);
          } else {
            // No token in refresh response
            console.error('🔴 Refresh response missing accessToken');
            api.dispatch(logout());
          }
        } else {
          // Refresh failed
          console.error('🔴 Token refresh failed');
          api.dispatch(logout());
        }
      } catch (error) {
        console.error('🔴 Token refresh error:', error);
        api.dispatch(logout());
      }
    } else {
      // No refresh token available
      console.error('🔴 No refresh token available');
      api.dispatch(logout());
    }
  }

  return result;
};
```

**How to use**: Replace `fetchBaseQuery` with `baseQueryWithReauth` in each API slice:

```typescript
import { baseQueryWithReauth } from './baseQuery';

export const ticketApi = createApi({
  reducerPath: 'ticketApi',
  baseQuery: baseQueryWithReauth,  // ← Use this instead of fetchBaseQuery
  endpoints: (builder) => ({
    // ... endpoints
  }),
});
```

---

## Integration: Update store/index.ts

Add the error logger middleware to your Redux store.

**Find this in `src/store/index.ts`**:

```typescript
export const store = configureStore({
  reducer: {
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [roleApi.reducerPath]: roleApi.reducer,
    [ticketApi.reducerPath]: ticketApi.reducer,
    [reprintRequestApi.reducerPath]: reprintRequestApi.reducer,
    [workflowApi.reducerPath]: workflowApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(authApi.middleware)
      .concat(userApi.middleware)
      .concat(roleApi.middleware)
      .concat(ticketApi.middleware)
      .concat(reprintRequestApi.middleware)
      .concat(workflowApi.middleware),
});
```

**Replace with this**:

```typescript
import rtkQueryErrorLogger from '@/lib/auth-middleware';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [roleApi.reducerPath]: roleApi.reducer,
    [ticketApi.reducerPath]: ticketApi.reducer,
    [reprintRequestApi.reducerPath]: reprintRequestApi.reducer,
    [workflowApi.reducerPath]: workflowApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(rtkQueryErrorLogger)  // ← ADD THIS
      .concat(authApi.middleware)
      .concat(userApi.middleware)
      .concat(roleApi.middleware)
      .concat(ticketApi.middleware)
      .concat(reprintRequestApi.middleware)
      .concat(workflowApi.middleware),
});
```

---

## Update: Add to Dashboard

**Add this to `src/app/dashboard/page.tsx`**:

```typescript
'use client';

import { useTokenExpiry } from '@/hooks/useTokenExpiry';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

export default function DashboardPage() {
  // Monitor token expiry
  useTokenExpiry();
  
  const router = useRouter();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div>
      {/* Your dashboard content */}
    </div>
  );
}
```

---

## Testing

### Test 1: Auth Error Handling

1. Manually delete `accessToken` from localStorage (DevTools → Application → Storage)
2. Try to navigate to dashboard
3. **Expected**: Automatically redirected to login page with message "Unauthorized"

### Test 2: Token Expiry

1. Edit `auth.tokens.expiresAt` in Redux to `new Date()` (current time)
2. Wait for the next expiry check (within 1 minute)
3. **Expected**: Console warning about expiry, then auto-logout

### Test 3: Service Worker Clearing

1. Login successfully
2. Check DevTools → Application → Service Workers → Unregister
3. Open browser console and run:
   ```javascript
   navigator.serviceWorker.getRegistrations().then(regs => {
     console.log('Service workers:', regs.length);
   });
   ```
4. **Expected**: 0 service workers after unregister

---

## Checklist

- [ ] Create `src/lib/auth-middleware.ts`
- [ ] Create `src/hooks/useTokenExpiry.ts`
- [ ] Create `src/lib/api-logger.ts`
- [ ] Update `src/store/index.ts` with error logger
- [ ] Add `useTokenExpiry()` to dashboard page
- [ ] Test auth error handling
- [ ] Test token expiry check
- [ ] Verify all tests pass

