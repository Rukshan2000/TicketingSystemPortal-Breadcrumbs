# User Management API Integration Guide

This guide demonstrates how to use the User Management API with RTK Query in the Next.js application.

## Base Setup

The API is configured to use `http://localhost:5000/api` as the base URL (set in `.env.local`).

All requests automatically include the Bearer token from Redux auth state.

## Available Hooks

### 1. useFetchUsers
Fetch paginated list of users with filtering

```typescript
import { useFetchUsers } from '@/hooks/useUserManagement';

export function UsersList() {
  const { users, total, page, pages, isLoading, error, refetch } = useFetchUsers({
    page: 1,
    limit: 10,
    role: 'admin',
    status: 'active',
    search: 'john',
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <p>Total Users: {total} (Page {page} of {pages})</p>
      {users.map((user) => (
        <div key={user._id}>{user.fullName}</div>
      ))}
      <button onClick={() => refetch()}>Refresh</button>
    </div>
  );
}
```

### 2. useFetchUserById
Fetch a single user by ID

```typescript
import { useFetchUserById } from '@/hooks/useUserManagement';

export function UserDetail({ userId }: { userId: string }) {
  const { user, isLoading, error, refetch } = useFetchUserById(userId);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!user) return <div>User not found</div>;

  return (
    <div>
      <h1>{user.fullName}</h1>
      <p>Email: {user.email}</p>
      <p>Role: {user.role}</p>
      <p>Status: {user.status}</p>
      <button onClick={() => refetch()}>Refresh</button>
    </div>
  );
}
```

### 3. useCreateUserHandler
Create a new user

```typescript
import { useCreateUserHandler } from '@/hooks/useUserManagement';
import type { ICreateUserPayload } from '@/types/user';

export function CreateUserForm() {
  const { handleCreate, isLoading, error, isSuccess } = useCreateUserHandler();

  const onSubmit = async (formData: ICreateUserPayload) => {
    try {
      const newUser = await handleCreate(formData);
      console.log('User created:', newUser);
    } catch (err) {
      console.error('Failed:', err);
    }
  };

  return (
    <form>
      {/* Form fields here */}
      <button onClick={() => onSubmit({...})} disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create User'}
      </button>
      {error && <p>Error: {error.message}</p>}
      {isSuccess && <p>User created successfully!</p>}
    </form>
  );
}
```

### 4. useUpdateUserHandler
Update user information

```typescript
import { useUpdateUserHandler } from '@/hooks/useUserManagement';
import type { IUpdateUserPayload } from '@/types/user';

export function UpdateUserForm({ userId }: { userId: string }) {
  const { handleUpdate, isLoading, error, isSuccess } = useUpdateUserHandler();

  const onSubmit = async (updateData: IUpdateUserPayload) => {
    try {
      const updatedUser = await handleUpdate(userId, updateData);
      console.log('User updated:', updatedUser);
    } catch (err) {
      console.error('Failed:', err);
    }
  };

  return (
    <form>
      {/* Form fields here */}
      <button onClick={() => onSubmit({...})} disabled={isLoading}>
        {isLoading ? 'Updating...' : 'Update User'}
      </button>
      {error && <p>Error: {error.message}</p>}
      {isSuccess && <p>User updated successfully!</p>}
    </form>
  );
}
```

### 5. useUpdatePasswordHandler
Update user password

```typescript
import { useUpdatePasswordHandler } from '@/hooks/useUserManagement';

export function ChangePasswordForm({ userId }: { userId: string }) {
  const { handleUpdatePassword, isLoading, error, isSuccess } = useUpdatePasswordHandler();

  const onSubmit = async () => {
    try {
      await handleUpdatePassword(userId, {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword456',
      });
      console.log('Password updated');
    } catch (err) {
      console.error('Failed:', err);
    }
  };

  return (
    <form>
      {/* Password fields here */}
      <button onClick={onSubmit} disabled={isLoading}>
        {isLoading ? 'Updating...' : 'Change Password'}
      </button>
      {error && <p>Error: {error.message}</p>}
      {isSuccess && <p>Password changed successfully!</p>}
    </form>
  );
}
```

### 6. useUpdateStatusHandler
Change user status

```typescript
import { useUpdateStatusHandler } from '@/hooks/useUserManagement';

export function UserStatusToggle({ userId }: { userId: string }) {
  const { handleUpdateStatus, isLoading } = useUpdateStatusHandler();

  const onStatusChange = async (status: 'active' | 'inactive' | 'suspended') => {
    try {
      await handleUpdateStatus(userId, status);
      console.log('Status updated');
    } catch (err) {
      console.error('Failed:', err);
    }
  };

  return (
    <div>
      <button onClick={() => onStatusChange('active')} disabled={isLoading}>
        Activate
      </button>
      <button onClick={() => onStatusChange('suspended')} disabled={isLoading}>
        Suspend
      </button>
    </div>
  );
}
```

### 7. useDeleteUserHandler
Delete a user

```typescript
import { useDeleteUserHandler } from '@/hooks/useUserManagement';

export function DeleteUserButton({ userId }: { userId: string }) {
  const { handleDelete, isLoading, error } = useDeleteUserHandler();

  const onDelete = async () => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await handleDelete(userId);
        console.log('User deleted');
      } catch (err) {
        console.error('Failed:', err);
      }
    }
  };

  return (
    <div>
      <button onClick={onDelete} disabled={isLoading}>
        {isLoading ? 'Deleting...' : 'Delete User'}
      </button>
      {error && <p>Error: {error.message}</p>}
    </div>
  );
}
```

### 8. useUserManagement
Combined hook for all operations

```typescript
import { useUserManagement } from '@/hooks/useUserManagement';

export function UserDashboard({ userId }: { userId: string }) {
  const {
    // Read
    users,
    total,
    isLoadingUsers,
    user,
    isLoadingUser,
    
    // Write
    create,
    update,
    updatePassword,
    updateStatus,
    deleteUser,
    
    // Refetch
    refetchUsers,
    refetchUser,
  } = useUserManagement(userId);

  return (
    <div>
      <h1>User Dashboard</h1>
      {/* Use all operations */}
    </div>
  );
}
```

## Types Available

Import from `@/types/user`:

```typescript
import type {
  IUser,
  IUserListQuery,
  ICreateUserPayload,
  IUpdateUserPayload,
  IUpdatePasswordPayload,
  UserRole,
  UserStatus,
} from '@/types/user';

import {
  USER_ROLES,
  USER_STATUSES,
  ROLE_DISPLAY_NAMES,
  STATUS_DISPLAY_NAMES,
} from '@/types/user';
```

## Error Handling

All hooks include error states that match RTK Query's `FetchBaseQueryError` interface:

```typescript
const { error } = useFetchUsers();

if (error) {
  if ('status' in error) {
    console.log(error.status, error.data);
  } else {
    console.log(error.message);
  }
}
```

## Direct API Usage (if needed)

If you need to use the API directly without hooks:

```typescript
import { userApi } from '@/store/services/userApi';

// These are the available endpoints:
const endpoints = {
  getUsers,        // Query
  getUserById,     // Query
  createUser,      // Mutation
  updateUser,      // Mutation
  updatePassword,  // Mutation
  updateStatus,    // Mutation
  updateLastLogin, // Mutation
  deleteUser,      // Mutation
};
```

## Setup Checklist

✅ `.env.local` - API endpoint configured (http://localhost:5000/api)
✅ `/src/store/services/userApi.ts` - All 8 endpoints implemented
✅ `/src/types/user.ts` - User types and constants
✅ `/src/hooks/useUserManagement.ts` - React hooks for all operations
✅ Redux store - Configured with userApi middleware and reducer
