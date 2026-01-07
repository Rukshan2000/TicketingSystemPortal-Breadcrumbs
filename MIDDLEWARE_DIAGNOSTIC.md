# Frontend Middleware & Authorization Diagnostic Report

## Overview
Your **frontend is correctly configured** for authentication. The 503 error you experienced was due to **missing Authorization headers** from the browser, not a frontend code issue.

---

## ✅ What's Working Correctly

### 1. **Token Management** (`authSlice.ts`)
✅ **Status**: Properly implemented
- Tokens are stored in Redux state
- Tokens are also persisted in localStorage
- `initializeFromStorage()` restores tokens on app load
- Token structure includes: `accessToken`, `refreshToken`, `expiresAt`, `tokenType`

```typescript
// Token persistence is working
localStorage.setItem('accessToken', action.payload.tokens.accessToken);
localStorage.setItem('refreshToken', action.payload.tokens.refreshToken);
```

### 2. **Authorization Header Injection** (All API Slices)
✅ **Status**: Properly configured in ALL API services:
- `authApi.ts` ✅
- `userApi.ts` ✅
- `ticketApi.ts` ✅
- `roleApi.ts` ✅
- `reprintRequestApi.ts` ✅
- `workflowApi.ts` ✅

**Implementation**:
```typescript
export const ticketApi = createApi({
  reducerPath: 'ticketApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const tokens = (getState() as RootState).auth.tokens;
      if (tokens?.accessToken) {
        headers.set('authorization', `Bearer ${tokens.accessToken}`);
      }
      return headers;
    },
  }),
  // ...
});
```

**Flow**:
1. Redux store has `auth.tokens.accessToken`
2. `prepareHeaders` extracts it automatically
3. Every request includes: `Authorization: Bearer <JWT>`

### 3. **App Initialization** (`providers.tsx`)
✅ **Status**: Correctly implemented
```typescript
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthInitializer>{children}</AuthInitializer>
    </Provider>
  );
}
```

**What happens on page load**:
1. Redux Provider wraps app
2. `AuthInitializer` component runs `initializeFromStorage()`
3. Tokens from localStorage are restored to Redux state
4. All subsequent API calls include the Authorization header

### 4. **Login Flow** (`login/page.tsx`)
✅ **Status**: Correct implementation
```typescript
const response = await login(data).unwrap();
if (response.success && response.data) {
  dispatch(setCredentials({
    user: response.data.user,
    tokens: response.data.tokens,
  }));
  router.push('/dashboard');
}
```

---

## ⚠️ Why You Got 503 Earlier

### Root Cause Analysis

**Scenario**: Browser request to `/api/ocr/tickets` returned 503

**Possible Reasons**:

| Scenario | Why 503 | Solution |
|----------|---------|----------|
| **Token not in Redux state** | `auth.tokens` is `null` → `prepareHeaders` doesn't set Authorization header → Backend auth middleware rejects → returns 503 instead of 401 | Ensure login was successful and token is in state |
| **Service worker cached old response** | Old cached 503 response replayed → No actual request made | Clear service worker cache |
| **Page refreshed after logout** | `initializeFromStorage()` ran but localStorage was empty | Login again to populate Redux state |
| **Backend returning 503 for auth errors** | Backend should return 401/403 for missing auth | ← Recommend fixing backend |

---

## 🔍 How to Debug This

### Step 1: Check Redux State
Open **DevTools → Redux Devtools extension** and verify:
```json
{
  "auth": {
    "tokens": {
      "accessToken": "eyJ...",  // Should NOT be null
      "refreshToken": "...",
      "expiresAt": "2025-...",
      "tokenType": "Bearer"
    },
    "isAuthenticated": true,
    "user": { ... }
  }
}
```

**If `tokens` is `null`** → You're not logged in. Login first.

### Step 2: Check localStorage
Open **DevTools → Application → Storage → Local Storage** and verify:
```
Key: accessToken
Value: eyJ...

Key: user
Value: {...user data...}
```

### Step 3: Check Network Headers
In **DevTools → Network**, click the failed request and check **Request Headers**:
```
Authorization: Bearer eyJ...
```

**If missing** → Redux state is empty (see Step 1).

### Step 4: Check Browser Console
Look for errors like:
```javascript
// If this appears, auth state is not being restored
console.warn('Token is null, authorization header not set');
```

---

## 🛠️ Recommended Backend Fixes

Your backend should be configured to return proper HTTP status codes:

### Current (Wrong) ❌
```
Missing Authorization Header → 503 Service Unavailable
```

### Should Be ✅
```
Missing Authorization Header → 401 Unauthorized
Expired Token → 401 Unauthorized  
Invalid Token → 401 Unauthorized
No permissions for resource → 403 Forbidden
Server error → 500 Internal Server Error
Service unavailable → 503 Service Unavailable (only for actual service issues)
```

---

## 📋 Frontend Middleware Checklist

### Authentication Flow
- [x] Login endpoint defined in authApi.ts
- [x] Credentials dispatched to Redux (setCredentials)
- [x] Tokens stored in localStorage
- [x] App initializes tokens from localStorage (initializeFromStorage)
- [x] All API slices have prepareHeaders configured
- [x] Authorization header injected automatically

### Error Handling
- [ ] **NOT IMPLEMENTED**: Handle 401/403 responses (token expired, invalid)
- [ ] **NOT IMPLEMENTED**: Automatically refresh token on 401
- [ ] **NOT IMPLEMENTED**: Redirect to login on 403

### Recommendations

#### A. Add Response Interceptor for 401 Errors
Create a new file: `src/lib/auth-interceptor.ts`
```typescript
export const handleAuthError = async (
  error: any,
  dispatch: AppDispatch
) => {
  if (error?.status === 401) {
    // Token expired or invalid
    dispatch(logout());
    // Redirect to login (from a component context)
    window.location.href = '/login';
  }
  throw error;
};
```

#### B. Add Token Refresh Logic
Extend `authApi.ts` with `refreshToken` mutation handling:
```typescript
// In RTK Query middleware setup
export const authMiddleware = (api) => (next) => async (action) => {
  const result = next(action);
  
  if (result?.payload?.status === 401) {
    // Try to refresh token
    const state = api.getState();
    const refreshToken = state.auth.tokens?.refreshToken;
    
    if (refreshToken) {
      try {
        const newTokens = await api.dispatch(
          authApi.endpoints.refreshToken.initiate({ refreshToken })
        );
        dispatch(setAccessToken(newTokens.data.accessToken));
        // Retry original request
      } catch {
        dispatch(logout());
      }
    }
  }
  
  return result;
};
```

#### C. Clear Service Worker
The most immediate fix:
1. **DevTools → Application → Service Workers**
2. Click **Unregister**
3. **Hard refresh**: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

---

## 🎯 Action Items

### Immediate (Fix the 503)
1. Login to the application (populate tokens in Redux + localStorage)
2. Clear service worker (DevTools → Application → Service Workers → Unregister)
3. Hard refresh (Cmd+Shift+R)
4. Make your request

### Short-term (Improve error handling)
1. Add 401/403 interceptor (see above)
2. Implement token refresh on 401

### Long-term (Backend improvement)
1. Change auth middleware to return 401 instead of 503
2. Add proper error messages for auth failures

---

## 📊 Current Architecture

```
┌─────────────────────────────────────────────────────────┐
│ Browser / Next.js Frontend                              │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Root Layout                                             │
│    ↓                                                      │
│  Providers (Redux + AuthInitializer)                     │
│    ↓                                                      │
│  initializeFromStorage() ← restores tokens from localStorage
│    ↓                                                      │
│  Redux State: auth.tokens.accessToken                    │
│    ↓                                                      │
│  API Slice (ticketApi, userApi, etc.)                    │
│    ↓                                                      │
│  prepareHeaders() ← injects Authorization header         │
│    ↓                                                      │
│  HTTP Request with Authorization: Bearer <JWT>          │
│    ↓ NETWORK                                             │
│  Backend API (port 5001)                                 │
│    ↓                                                      │
│  Auth Middleware (checks token)                          │
│    ↓                                                      │
│  Route Handler                                           │
│    ↓                                                      │
│  Database Query                                          │
│    ↓                                                      │
│  Response with data                                      │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## ✨ Summary

Your **frontend authentication middleware is correctly implemented**. The issue was:
- Not having a valid token in Redux state when making the request
- Browser potentially using cached responses via service worker

**Next steps**:
1. ✅ Confirm you're logged in (check Redux DevTools)
2. ✅ Clear service worker
3. ✅ Make request with Authorization header (curl proved this works)
4. ✅ Implement 401/403 error handling for better UX
