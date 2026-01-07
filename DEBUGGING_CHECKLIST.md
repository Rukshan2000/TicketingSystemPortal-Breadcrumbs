# Authorization Debugging Checklist 🔍

Use this interactive checklist to diagnose authorization and middleware issues.

---

## 1️⃣ Is Redux State Populated?

### Check This in DevTools

**DevTools → Redux DevTools Extension** (if installed)

Look for the Redux state tree:
```json
{
  "auth": {
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",  ← Should NOT be empty
      "refreshToken": "...",
      "expiresAt": "2025-12-31T...",
      "tokenType": "Bearer"
    },
    "isAuthenticated": true,  ← Should be true
    "user": {
      "id": 1,
      "username": "admin",
      ...
    }
  }
}
```

### ✅ Passing
- `auth.tokens.accessToken` is a string starting with `eyJ`
- `auth.isAuthenticated` is `true`
- `auth.user` has data

### ❌ Failing
- `auth.tokens` is `null`
- `auth.isAuthenticated` is `false`
- `auth.user` is `null`

**Action**: Login to the application first

---

## 2️⃣ Is Token Persisted in localStorage?

### Check This in DevTools

**DevTools → Application → Storage → Local Storage**

Look for these keys:
```
accessToken     → eyJhbGciOiJIUzI1NiIs...
refreshToken    → ...
user            → {"id":1,"username":"admin",...}
```

### ✅ Passing
- All three keys exist
- `accessToken` value is a JWT (starts with `eyJ`)

### ❌ Failing
- Keys missing
- Values are empty or `null`

**Action**: Login again, or check localStorage clearing code

---

## 3️⃣ Is Authorization Header Sent?

### Check This in DevTools

**DevTools → Network tab**

1. Make any API call (e.g., click on Users page)
2. Look for the request in Network tab
3. Click on the request → **Headers** tab
4. Scroll to **Request Headers**

Look for:
```
authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### ✅ Passing
```
authorization: Bearer eyJ...
```

### ❌ Failing (Missing Header)
- No `authorization` header appears
- Other headers like `content-type` are there but not `authorization`

### ❌ Failing (Wrong Format)
```
authorization: eyJ...          ← Missing "Bearer"
Authorization: Bearer [object] ← Token not a string
```

**Action**: 
1. Check Step 1 (Redux state) - if null, login first
2. If header is missing despite valid state, reload page
3. Check if all API slices have `prepareHeaders` configured

---

## 4️⃣ Is Response Status Code Correct?

### Check This in DevTools

**DevTools → Network tab → Click request**

Look at the **Status** column:
```
✅ 200 OK          - Request succeeded
✅ 201 Created     - Resource created
✅ 401 Unauthorized - Token invalid/expired (CORRECT response for auth error)
❌ 403 Forbidden   - No permission (but shouldn't happen if 401 is handled)
❌ 503 Service Unavailable - Usually means missing auth header
❌ 500 Internal Server Error - Backend error
```

### If You're Seeing 503
**This means**:
- Authorization header was missing OR
- Backend returned wrong status code for auth error

**Action**:
1. Verify Authorization header is present (Step 3)
2. If header is present, backend needs fixing (should return 401)
3. If header is missing, check Step 1 (Redux state)

---

## 5️⃣ Is Service Worker Caching Old Responses?

### Check This in DevTools

**DevTools → Application → Service Workers**

Look for any registered service workers:
```
Service Worker
├─ Scope: http://localhost:3000/
│  Status: activated and running
│  ├─ Clients: 1
│  └─ Update: Check for updates
```

### ✅ Passing
- No service workers (or all unregistered)

### ⚠️ Suspicious
- Service workers are registered
- You see a cached 503 error response
- Hard refresh (Cmd+Shift+R) fixes the issue

**Action**:
1. Click **Unregister** on each service worker
2. Do a hard refresh (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
3. Try the request again

---

## 6️⃣ Is Browser Cache Stale?

### Check This in Browser

**DevTools → Network tab → Settings (gear icon)**

Enable:
```
☑ Disable cache (while DevTools is open)
```

This prevents browser from serving cached responses.

### ✅ Passing
- Requests show actual responses (not from cache)
- Status shows `200` not `(from cache)`

### ⚠️ Suspicious
- Same request is showing `(from cache)` multiple times
- Hard refresh doesn't change behavior

**Action**:
1. Enable "Disable cache" setting in DevTools
2. Do a hard refresh (Cmd+Shift+R)
3. Try the request again

---

## 7️⃣ Is Token Actually Valid?

### Check This in JWT Debugger

1. Go to https://jwt.io
2. Paste your token (from localStorage or DevTools) into "Encoded" section
3. Look at the "Decoded" section

Should look like:
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "1",
    "name": "John Doe",
    "iat": 1516239022,
    "exp": 1735689022  ← Expiry timestamp (future = valid)
  }
}
```

### ✅ Passing
- `exp` (expiration) is a large number in the future
- `iat` (issued at) is in the past
- Token can be decoded without errors

### ❌ Failing
```
Invalid signature (unlikely if from your backend)
Token expired (exp is in the past)
Token malformed (can't be decoded)
```

**Action**:
1. If expired, login again
2. If malformed, check backend token generation
3. If signature invalid, check backend JWT secret

---

## 8️⃣ Are All API Slices Configured?

### Check This in Code

Open each file and look for `prepareHeaders`:

- [ ] `src/store/services/authApi.ts` - has `prepareHeaders`
- [ ] `src/store/services/userApi.ts` - has `prepareHeaders`
- [ ] `src/store/services/ticketApi.ts` - has `prepareHeaders`
- [ ] `src/store/services/roleApi.ts` - has `prepareHeaders`
- [ ] `src/store/services/reprintRequestApi.ts` - has `prepareHeaders`
- [ ] `src/store/services/workflowApi.ts` - has `prepareHeaders`

Each should have:
```typescript
prepareHeaders: (headers, { getState }) => {
  const tokens = (getState() as RootState).auth.tokens;
  if (tokens?.accessToken) {
    headers.set('authorization', `Bearer ${tokens.accessToken}`);
  }
  return headers;
},
```

### ✅ Passing
- All API slices have `prepareHeaders`
- Token is checked with `if (tokens?.accessToken)`
- Header is set with `Bearer ${tokens.accessToken}`

### ❌ Failing
- Some API slices missing `prepareHeaders`
- No Bearer prefix
- Wrong header name (should be `authorization` not `Authorization`)

**Action**: Add `prepareHeaders` to any missing API slices

---

## 🎯 Quick Diagnosis Flow

```
Q: Getting 503 error?
│
├─ YES → 
│  │
│  Q: Do you see "Authorization: Bearer" in Network headers?
│  │
│  ├─ NO → Check Step 1 (Redux state)
│  │        └─ Is auth.tokens.accessToken null? LOGIN FIRST
│  │
│  └─ YES → Backend issue
│          └─ Contact backend team: "Should return 401, not 503"
│
└─ NO → Check other status codes
       ├─ 401 → Token expired (Step 7)
       ├─ 403 → No permission
       └─ 500 → Server error
```

---

## 🧹 Nuclear Option: Clean Slate

If all else fails, reset everything:

1. **Clear localStorage**
   ```javascript
   // Paste in console:
   localStorage.clear();
   ```

2. **Unregister service workers**
   - DevTools → Application → Service Workers → Unregister all

3. **Clear cache**
   - DevTools → Network → Disable cache
   - Or: DevTools → Application → Storage → Clear site data

4. **Hard refresh**
   - Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

5. **Login again**
   - Enter credentials
   - Check Redux state (should be populated)

6. **Try request**
   - Should work now

---

## 📊 Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| "401 Unauthorized" in Network | Token expired | Login again |
| "503 Service Unavailable" in Network | Missing auth header | Check Step 1, 3 |
| "Authorization: Bearer [object]" | Token is object, not string | Check authSlice.setAccessToken() |
| Same request repeats after hard refresh | Service worker caching | Unregister service workers |
| Redux state shows null tokens | Not logged in OR page just loaded | Login, or wait for initializeFromStorage() |
| Network tab shows "(from cache)" | Browser cache | Enable "Disable cache" in DevTools |
| Token looks invalid in jwt.io | Malformed JWT | Check backend token generation |

---

## 💡 Pro Tips

### Tip 1: Log Token on Every Request
Add this to any `prepareHeaders`:
```typescript
prepareHeaders: (headers, { getState }) => {
  const tokens = (getState() as RootState).auth.tokens;
  const hasToken = !!tokens?.accessToken;
  console.log(`📡 API Request: Token present = ${hasToken}`);
  if (tokens?.accessToken) {
    headers.set('authorization', `Bearer ${tokens.accessToken}`);
  }
  return headers;
},
```

Then check console before making request.

### Tip 2: Monitor Redux Changes
Install [Redux DevTools Extension](https://chrome.google.com/webstore/detail/redux-devtools/lmjabakwijfacmfjiofddlemccf51466) and:
1. Open DevTools
2. Go to Redux tab
3. Make a request
4. See `BEFORE` and `AFTER` state

### Tip 3: Check Token Expiry
Paste in console:
```javascript
const token = localStorage.getItem('accessToken');
const decoded = JSON.parse(atob(token.split('.')[1]));
const expiry = new Date(decoded.exp * 1000);
console.log('Token expires at:', expiry);
console.log('Is expired?', expiry < new Date());
```

---

## ✅ Full Checklist

Use this when debugging 403/401/503 errors:

```
☐ Step 1: Redux state has tokens.accessToken (not null)?
☐ Step 2: localStorage has accessToken key?
☐ Step 3: Network request has "Authorization: Bearer" header?
☐ Step 4: Response status is correct for your scenario?
☐ Step 5: No service workers registered?
☐ Step 6: DevTools cache disabled?
☐ Step 7: JWT token not expired?
☐ Step 8: All API slices have prepareHeaders?

If all ☐, then:
☐ Issue is likely in backend
☐ Or third-party middleware (proxy, WAF, etc.)
☐ Contact backend team with Network request screenshot
```

