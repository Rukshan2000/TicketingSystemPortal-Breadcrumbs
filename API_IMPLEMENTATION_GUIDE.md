# API Implementation Guide

This document summarizes the API integration changes made to match the TMS backend API specification.

## Changes Made

### 1. **Auth Slice** (`src/store/features/authSlice.ts`)
Updated the authentication state management to properly handle tokens and user data.

**Key Changes:**
- Updated `User` interface to match API spec (snake_case field names)
- Added `AuthTokens` interface with `accessToken`, `refreshToken`, `expiresAt`, and `tokenType`
- Modified state to include both `tokens` and `user`
- Added `setAccessToken`, `setLoading`, `setError` actions for better token management
- Added `initializeFromStorage` action to restore auth state on app startup
- Token storage now uses separate `accessToken` and `refreshToken` in localStorage

**Field Mapping:**
```
Backend Response → Frontend State
id → id (number)
first_name → first_name
last_name → last_name
username → username
email → email
role → role (user | moderator | admin)
status → status (active | inactive | suspended)
is_verified → is_verified
created_at → created_at
updated_at → updated_at
```

### 2. **Auth API** (`src/store/services/authApi.ts`)
Completely restructured authentication endpoints to match the TMS API specification.

**Endpoints Implemented:**
- `POST /auth/login` - Login with email or username
- `POST /auth/register` - Register new user
- `POST /auth/refresh-token` - Get new access token
- `POST /auth/verify-token` - Verify token validity
- `POST /auth/logout` - Logout current session
- `POST /auth/logout-all/:userId` - Logout from all devices
- `POST /auth/change-password/:userId` - Change password

**Response Format:**
All endpoints follow the API specification with `success`, `message`, and `data` fields.

### 3. **User API** (`src/store/services/userApi.ts`)
Completely rewritten to match the actual TMS API endpoints and field names.

**User Interface:**
```typescript
export interface User {
  id: number;                              // Changed from _id (string)
  first_name: string;                      // Changed from firstName
  last_name: string;                       // Changed from lastName
  username: string;
  email: string;
  phone?: string;
  role: 'user' | 'moderator' | 'admin';
  status: 'active' | 'inactive' | 'suspended';
  department?: string;
  is_verified: boolean;                    // Changed from isVerified
  last_login?: string;                     // Changed from lastLogin
  created_at: string;                      // Changed from createdAt
  updated_at: string;                      // Changed from updatedAt
}
```

**Endpoints Implemented:**
- `GET /users?limit=10&offset=0` - Get all users with pagination
- `GET /users/count` - Get total user count
- `GET /users/id/:userId` - Get user by ID
- `GET /users/username/:username` - Get user by username
- `GET /users/email/:email` - Get user by email
- `GET /users/role/:role` - Get users by role
- `GET /users/status/:status` - Get users by status
- `POST /users` - Create new user
- `PUT /users/:userId` - Update user
- `DELETE /users/:userId` - Delete user

**Request Body Changes:**

Create User Request:
```typescript
{
  first_name: string;        // Changed from firstName
  last_name: string;         // Changed from lastName
  username: string;
  email: string;
  password: string;
  phone?: string;
  role?: 'user' | 'moderator' | 'admin';
  department?: string;
}
```

Update User Request:
```typescript
{
  first_name?: string;       // Changed from firstName
  last_name?: string;        // Changed from lastName
  phone?: string;
  role?: 'user' | 'moderator' | 'admin';
  status?: 'active' | 'inactive' | 'suspended';
  department?: string;
}
```

### 4. **Users List Component** (`src/components/users/users-list.tsx`)
Updated to use the new API field names and parameter structure.

**Key Changes:**
- Updated `useGetUsersQuery` to use `limit` and `offset` instead of `page` and `limit`
- Modified `handleSaveUser` to:
  - Convert `first_name` and `last_name` parameters
  - Convert user role 'manager' to API role 'moderator'
  - Use `userId` as number instead of string
- Updated user data mapping to handle API response format
- Fixed delete operation to use numeric user IDs

**Field Mapping in handleSaveUser:**
```typescript
// Frontend → API
{
  name: "John Doe" → first_name: "John", last_name: "Doe"
  role: "manager" → role: "moderator"
  role: "admin" → role: "admin"
  role: "user" → role: "user"
}
```

## Base URL Configuration

The API base URL can be configured via environment variable:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

If not provided, it defaults to `http://localhost:5000/api`

## Authorization

All API requests automatically include the Bearer token in the Authorization header:
```
Authorization: Bearer {accessToken}
```

The token is extracted from the Redux auth state (`auth.tokens.accessToken`).

## Error Handling

Errors follow the API specification format:
```json
{
  "error": "Error message describing what went wrong"
}
```

HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid credentials or token)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (duplicate email/username)
- `500` - Server Error

## Token Management

### Initial Load
Call `initializeFromStorage()` when the app loads to restore auth state from localStorage.

### Token Refresh
When receiving a 401 response, use the refresh token to get a new access token:
```typescript
const [refreshToken] = useRefreshTokenMutation();
const newTokenData = await refreshToken({
  refreshToken: state.auth.tokens?.refreshToken
}).unwrap();
```

### Logout
Clear tokens and call the logout endpoint:
```typescript
await logout({ accessToken: tokens.accessToken }).unwrap();
// Then dispatch logout() action to clear state and localStorage
```

## Usage Examples

### Login
```typescript
const [login] = useLoginMutation();
const response = await login({
  email: 'user@example.com',
  password: 'password123'
}).unwrap();

// Response contains user and tokens
dispatch(setCredentials({
  user: response.data.user,
  tokens: response.data.tokens
}));
```

### Create User
```typescript
const [createUser] = useCreateUserMutation();
await createUser({
  first_name: 'John',
  last_name: 'Doe',
  username: 'johndoe',
  email: 'john@example.com',
  password: 'secure123',
  role: 'moderator',
  department: 'Support'
}).unwrap();
```

### Update User
```typescript
const [updateUser] = useUpdateUserMutation();
await updateUser({
  userId: 1,
  data: {
    first_name: 'Jonathan',
    phone: '+1234567890',
    status: 'active'
  }
}).unwrap();
```

### Delete User
```typescript
const [deleteUser] = useDeleteUserMutation();
await deleteUser(userId).unwrap();
```

## Migration Checklist

- [x] Updated authSlice to use proper token structure
- [x] Updated authApi endpoints to match backend
- [x] Updated userApi with correct field names
- [x] Updated users-list component to use new API
- [x] Fixed field name mappings (camelCase → snake_case)
- [x] Fixed user ID type (string → number)
- [x] Fixed pagination (page-based → offset-based)
- [ ] Test login functionality
- [ ] Test user creation
- [ ] Test user update
- [ ] Test user deletion
- [ ] Test token refresh flow
- [ ] Test logout functionality

## Next Steps

1. **Implement login page** - Use the new authApi endpoints
2. **Add token refresh middleware** - Handle 401 responses automatically
3. **Implement role management** - Connect roleApi endpoints
4. **Add error notifications** - Display API errors to users
5. **Test all endpoints** - Verify integration with backend

