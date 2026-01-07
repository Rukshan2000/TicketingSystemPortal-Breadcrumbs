# Roles API Update - Complete Implementation

## Summary of Changes

The `roleApi.ts` file has been completely updated to match the latest TMS Roles & Permissions API specification with permission ID-based system.

---

## Key Updates

### 1. **Permission Type System**
- Changed from string-based permissions to **ID-based permissions (numbers)**
- Added new `Permission` interface

```typescript
// Old: permissions: string[]
// New: permissions: number[]

export interface Permission {
  id: number;
  name: string;
  description: string;
}
```

### 2. **New Interfaces Added**

#### Permission Response Interfaces
- `GetPermissionsResponse` - Get all permissions
- `GetPermissionResponse` - Get single permission
- `GetPermissionCountResponse` - Get permission count
- `SearchPermissionsResponse` - Search permissions

#### Updated Request/Response Interfaces
- `UpdateRoleRequest` - Now includes `name` as optional field
- `CheckPermissionResponse` - Updated to use `permission_id` (number)

---

## API Endpoints

### Roles Endpoints (8 total)
| Method | Endpoint | Hook Name |
|--------|----------|-----------|
| POST | `/roles` | `useCreateRoleMutation` |
| GET | `/roles` | `useGetRolesQuery` |
| GET | `/roles/active` | `useGetActiveRolesQuery` |
| GET | `/roles/id/:roleId` | `useGetRoleByIdQuery` |
| GET | `/roles/name/:roleName` | `useGetRoleByNameQuery` |
| GET | `/roles/count` | `useGetRoleCountQuery` |
| PUT | `/roles/:roleId` | `useUpdateRoleMutation` |
| DELETE | `/roles/:roleId` | `useDeleteRoleMutation` |

### Permissions Endpoints (5 total)
| Method | Endpoint | Hook Name |
|--------|----------|-----------|
| GET | `/permissions` | `useGetPermissionsQuery` |
| GET | `/permissions/id/:permissionId` | `useGetPermissionByIdQuery` |
| GET | `/permissions/name/:permissionName` | `useGetPermissionByNameQuery` |
| GET | `/permissions/count` | `useGetPermissionCountQuery` |
| GET | `/permissions/search` | `useSearchPermissionsQuery` |

### Permission Management Endpoints (3 total)
| Method | Endpoint | Hook Name |
|--------|----------|-----------|
| POST | `/roles/:roleId/permission` | `useAddPermissionMutation` |
| POST | `/roles/:roleId/permission/remove` | `useRemovePermissionMutation` |
| POST | `/roles/:roleId/permission/check` | `useCheckPermissionMutation` |

---

## Updated Mutation Parameters

### Add Permission
```typescript
// Old
useAddPermissionMutation()
// Usage: { roleId: 1, permission: "manage_users" }

// New
useAddPermissionMutation()
// Usage: { roleId: 1, permissionId: 5 }
```

### Remove Permission
```typescript
// Old
useRemovePermissionMutation()
// Usage: { roleId: 1, permission: "manage_users" }

// New
useRemovePermissionMutation()
// Usage: { roleId: 1, permissionId: 5 }
```

### Check Permission
```typescript
// Old
useCheckPermissionMutation()
// Usage: { roleId: 1, permission: "manage_users" }

// New
useCheckPermissionMutation()
// Usage: { roleId: 1, permissionId: 5 }
```

---

## Component Updates

### role-view-dialog.tsx
- Fixed: Removed non-existent `userCount` property
- Updated: Display role creation date instead

### user-form-dialog.tsx
- Fixed: Added required empty object parameter to `useGetRolesQuery({})`

---

## Available Permissions Reference

| ID | Permission Name | Description |
|---|---|---|
| 1 | create | Create new content or resources |
| 2 | read | View content or resources |
| 3 | update | Edit existing content or resources |
| 4 | delete | Remove content or resources |
| 5 | manage_users | Manage user accounts and profiles |
| 6 | manage_roles | Create, update, and delete roles |
| 7 | manage_settings | Access system settings |
| 8 | manage_permissions | Manage role permissions |
| 9 | view_reports | Access analytics and reports |
| 10 | export_data | Export data from the system |
| 11 | manage_tickets | Manage ticket system and operations |
| 12 | view_analytics | View system analytics and statistics |
| 13 | approve_requests | Approve pending requests |
| 14 | reject_requests | Reject pending requests |
| 15 | audit_logs | Access and view audit logs |

---

## Default Roles

| ID | Name | Permissions |
|---|---|---|
| 1 | admin | [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15] |
| 2 | moderator | [1,2,3,4,11,12] |
| 3 | user | [2,1] |

---

## Usage Examples

### Get All Roles
```typescript
const { data: rolesData, isLoading } = useGetRolesQuery({ limit: 10, offset: 0 });
```

### Get All Permissions
```typescript
const { data: permissionsData } = useGetPermissionsQuery({ limit: 100, offset: 0 });
```

### Add Permission to Role (using IDs)
```typescript
const [addPermission] = useAddPermissionMutation();

await addPermission({
  roleId: 4,
  permissionId: 7  // manage_settings
}).unwrap();
```

### Check if Role Has Permission
```typescript
const [checkPermission] = useCheckPermissionMutation();

const response = await checkPermission({
  roleId: 1,
  permissionId: 5  // manage_users
}).unwrap();

console.log(response.has_permission); // true or false
```

### Search Permissions
```typescript
const { data: results } = useSearchPermissionsQuery({
  q: 'manage',
  limit: 10,
  offset: 0
});
```

---

## File Changes

- **src/store/services/roleApi.ts** - Complete rewrite with new interfaces and endpoints
- **src/components/users/role-view-dialog.tsx** - Fixed userCount reference
- **src/components/users/user-form-dialog.tsx** - Fixed useGetRolesQuery parameters

---

## Backend Requirements

Ensure your backend API implements all endpoints as documented:
- ✅ All role CRUD operations support permission IDs
- ✅ New permission endpoints available
- ✅ Permission management returns role_id and permission_id in responses

---

## TypeScript Validation

All TypeScript compilation errors have been resolved. Run validation:

```bash
npx tsc --noEmit
```

---

## Next Steps

1. Update backend API to use permission IDs (numeric)
2. Test all role and permission endpoints
3. Update any components using old permission string format
4. Verify permission checks work with new ID system

