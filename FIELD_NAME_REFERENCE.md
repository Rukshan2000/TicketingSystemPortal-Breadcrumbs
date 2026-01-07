# Quick Reference: Field Name Changes

## All Field Name Mappings for API Integration

### User Response Object (Backend → Frontend)

```typescript
// Backend sends:
{
  "id": 1,                          // number, not string
  "first_name": "John",             // NOT firstName
  "last_name": "Doe",               // NOT lastName
  "username": "johndoe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "role": "moderator",              // "user" | "moderator" | "admin"
  "status": "active",               // "active" | "inactive" | "suspended"
  "department": "Support",
  "is_verified": true,              // NOT isVerified
  "last_login": "2025-12-29T...",   // NOT lastLogin
  "created_at": "2025-12-29T...",   // NOT createdAt
  "updated_at": "2025-12-29T..."    // NOT updatedAt
}

// Frontend User Interface:
interface User {
  id: number;                       // Changed from _id: string
  first_name: string;               // Changed from firstName
  last_name: string;                // Changed from lastName
  username: string;
  email: string;
  phone?: string;
  role: 'user' | 'moderator' | 'admin';
  status: 'active' | 'inactive' | 'suspended';
  department?: string;
  is_verified: boolean;             // Changed from isVerified
  last_login?: string;              // Changed from lastLogin
  created_at: string;               // Changed from createdAt
  updated_at: string;               // Changed from updatedAt
}
```

### Create User Request

```typescript
// CORRECT (what the API expects):
{
  "first_name": "John",             // NOT firstName
  "last_name": "Doe",               // NOT lastName
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePassword123",
  "phone": "+1234567890",           // optional
  "role": "moderator",              // optional, default: "user"
  "department": "Support"           // optional
}

// WRONG (old format):
{
  "firstName": "John",              // ❌ Incorrect
  "lastName": "Doe",                // ❌ Incorrect
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

### Update User Request

```typescript
// CORRECT (what the API expects):
{
  "first_name": "Jonathan",         // NOT firstName
  "last_name": "Doe",               // NOT lastName
  "phone": "+1234567890",
  "role": "moderator",
  "status": "active",
  "department": "Management"
}

// Note: Fields like email, username, is_verified cannot be updated via PUT
// Only: first_name, last_name, phone, role, status, department
```

### Login Request

```typescript
// Option 1 - Email login:
{
  "email": "john@example.com",
  "password": "SecurePassword123"
}

// Option 2 - Username login:
{
  "username": "johndoe",
  "password": "SecurePassword123"
}
```

### Login Response

```typescript
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com",
      "first_name": "John",         // NOT firstName
      "last_name": "Doe",           // NOT lastName
      "role": "user",
      "status": "active",
      "phone": "+1234567890",
      "department": "Support",
      "is_verified": true,          // NOT isVerified
      "last_login": "2025-12-29T...",
      "created_at": "2025-12-29T...",
      "updated_at": "2025-12-29T..."
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresAt": "2025-12-29T14:30:00Z",
      "tokenType": "Bearer"
    }
  }
}
```

## Common Mistakes to Avoid

### ❌ Wrong Field Names
```typescript
// WRONG - Using camelCase
{
  firstName: "John",        // ❌
  lastName: "Doe",          // ❌
  isVerified: true,         // ❌
  lastLogin: "2025-...",    // ❌
  createdAt: "2025-...",    // ❌
  updatedAt: "2025-..."     // ❌
}

// CORRECT - Using snake_case
{
  first_name: "John",       // ✅
  last_name: "Doe",         // ✅
  is_verified: true,        // ✅
  last_login: "2025-...",   // ✅
  created_at: "2025-...",   // ✅
  updated_at: "2025-..."    // ✅
}
```

### ❌ Wrong User ID Format
```typescript
// WRONG - string
user._id = "123abc"           // ❌

// CORRECT - number
user.id = 123                 // ✅
```

### ❌ Wrong Pagination Format
```typescript
// WRONG - page-based
GET /users?page=1&limit=10    // ❌

// CORRECT - offset-based
GET /users?limit=10&offset=0  // ✅
```

### ❌ Wrong Role Values
```typescript
// WRONG - old format
role: "manager"               // ❌

// CORRECT - API standard
role: "moderator"             // ✅
```

## Type-Safe Usage

### React Hook Example
```typescript
// ✅ CORRECT
const [createUser] = useCreateUserMutation();

await createUser({
  first_name: "John",
  last_name: "Doe",
  username: "johndoe",
  email: "john@example.com",
  password: "secure123"
}).unwrap();

// ❌ WRONG
await createUser({
  firstName: "John",        // TypeScript error!
  lastName: "Doe"           // TypeScript error!
}).unwrap();
```

### Parameter Mapping Example
```typescript
// ✅ CORRECT
const [firstName, ...lastNameParts] = fullName.split(' ');
await createUser({
  first_name: firstName,
  last_name: lastNameParts.join(' '),
  username: email.split('@')[0],
  email: email,
  password: password,
  role: role === 'manager' ? 'moderator' : role
});

// ❌ WRONG
await createUser({
  firstName: firstName,           // ❌
  lastName: lastNameParts.join(),  // ❌
  username: email,
  email: email,
  password: password
});
```

## API Base URL

Make sure to set the environment variable:
```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

If not set, it defaults to `http://localhost:5000/api`

