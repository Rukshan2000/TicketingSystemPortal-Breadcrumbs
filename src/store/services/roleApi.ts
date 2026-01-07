import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '..';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Role interface matching the API spec
export interface Role {
  id: number;
  name: string;
  description: string;
  permissions: Permission[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Permission interface matching the API spec
export interface Permission {
  id: number;
  name: string;
  description: string;
}

export interface CreateRoleRequest {
  name: string;
  description: string;
  permissions: number[];
  is_active?: boolean;
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  permissions?: number[];
  is_active?: boolean;
}

// Role Responses
export interface CreateRoleResponse {
  success: boolean;
  data: Role;
}

export interface GetRolesResponse {
  success: boolean;
  data: Role[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

export interface GetRoleResponse {
  success: boolean;
  data: Role;
}

export interface GetRoleCountResponse {
  success: boolean;
  data: {
    count: number;
  };
}

export interface UpdateRoleResponse {
  success: boolean;
  data: Role;
}

export interface DeleteRoleResponse {
  success: boolean;
  message: string;
}

// Permission Responses
export interface GetPermissionsResponse {
  success: boolean;
  data: Permission[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

export interface GetPermissionResponse {
  success: boolean;
  data: Permission;
}

export interface GetPermissionCountResponse {
  success: boolean;
  data: {
    count: number;
  };
}

export interface SearchPermissionsResponse {
  success: boolean;
  data: Permission[];
  pagination: {
    limit: number;
    offset: number;
    search_query: string;
  };
}

// Permission Management Responses
export interface AddPermissionResponse {
  success: boolean;
  message: string;
  data: Role;
}

export interface RemovePermissionResponse {
  success: boolean;
  message: string;
  data: Role;
}

export interface CheckPermissionResponse {
  success: boolean;
  role_id: number;
  permission_id: number;
  has_permission: boolean;
}

export const roleApi = createApi({
  reducerPath: 'roleApi',
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
  tagTypes: ['Role', 'Permission'],
  endpoints: (builder) => ({
    // ============ ROLES ENDPOINTS ============

    // Get all roles with pagination
    getRoles: builder.query<GetRolesResponse, { limit?: number; offset?: number }>({
      query: ({ limit = 10, offset = 0 }) => `/roles?limit=${limit}&offset=${offset}`,
      providesTags: ['Role'],
    }),

    // Get only active roles
    getActiveRoles: builder.query<GetRolesResponse, { limit?: number; offset?: number }>({
      query: ({ limit = 10, offset = 0 }) => `/roles/active?limit=${limit}&offset=${offset}`,
      providesTags: ['Role'],
    }),

    // Get role count
    getRoleCount: builder.query<GetRoleCountResponse, void>({
      query: () => '/roles/count',
      providesTags: ['Role'],
    }),

    // Get role by ID
    getRoleById: builder.query<GetRoleResponse, number>({
      query: (roleId) => `/roles/id/${roleId}`,
      providesTags: (result, error, id) => [{ type: 'Role', id }],
    }),

    // Get role by name
    getRoleByName: builder.query<GetRoleResponse, string>({
      query: (roleName) => `/roles/name/${roleName}`,
      providesTags: (result, error, name) => [{ type: 'Role', id: name }],
    }),

    // Create new role
    createRole: builder.mutation<CreateRoleResponse, CreateRoleRequest>({
      query: (roleData) => ({
        url: '/roles',
        method: 'POST',
        body: roleData,
      }),
      invalidatesTags: ['Role'],
    }),

    // Update role
    updateRole: builder.mutation<
      UpdateRoleResponse,
      { roleId: number; data: UpdateRoleRequest }
    >({
      query: ({ roleId, data }) => ({
        url: `/roles/${roleId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { roleId }) => [
        { type: 'Role', id: roleId },
        'Role',
      ],
    }),

    // Delete role
    deleteRole: builder.mutation<DeleteRoleResponse, number>({
      query: (roleId) => ({
        url: `/roles/${roleId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Role'],
    }),

    // ============ PERMISSIONS ENDPOINTS ============

    // Get all permissions with pagination
    getPermissions: builder.query<GetPermissionsResponse, { limit?: number; offset?: number }>({
      query: ({ limit = 100, offset = 0 }) => `/permissions?limit=${limit}&offset=${offset}`,
      providesTags: ['Permission'],
    }),

    // Get permission by ID
    getPermissionById: builder.query<GetPermissionResponse, number>({
      query: (permissionId) => `/permissions/id/${permissionId}`,
      providesTags: (result, error, id) => [{ type: 'Permission', id }],
    }),

    // Get permission by name
    getPermissionByName: builder.query<GetPermissionResponse, string>({
      query: (permissionName) => `/permissions/name/${permissionName}`,
      providesTags: (result, error, name) => [{ type: 'Permission', id: name }],
    }),

    // Get permission count
    getPermissionCount: builder.query<GetPermissionCountResponse, void>({
      query: () => '/permissions/count',
      providesTags: ['Permission'],
    }),

    // Search permissions
    searchPermissions: builder.query<
      SearchPermissionsResponse,
      { q: string; limit?: number; offset?: number }
    >({
      query: ({ q, limit = 10, offset = 0 }) =>
        `/permissions/search?q=${encodeURIComponent(q)}&limit=${limit}&offset=${offset}`,
      providesTags: ['Permission'],
    }),

    // ============ PERMISSION MANAGEMENT ENDPOINTS ============

    // Add permission to role
    addPermission: builder.mutation<
      AddPermissionResponse,
      { roleId: number; permissionId: number }
    >({
      query: ({ roleId, permissionId }) => ({
        url: `/roles/${roleId}/permissions`,
        method: 'POST',
        body: { permissionId },
      }),
      invalidatesTags: (result, error, { roleId }) => [
        { type: 'Role', id: roleId },
        'Role',
      ],
    }),

    // Remove permission from role
    removePermission: builder.mutation<
      RemovePermissionResponse,
      { roleId: number; permissionId: number }
    >({
      query: ({ roleId, permissionId }) => ({
        url: `/roles/${roleId}/permissions/${permissionId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { roleId }) => [
        { type: 'Role', id: roleId },
        'Role',
      ],
    }),

    // Check if role has permission
    checkPermission: builder.mutation<
      CheckPermissionResponse,
      { roleId: number; permissionId: number }
    >({
      query: ({ roleId, permissionId }) => ({
        url: `/roles/${roleId}/check-permission`,
        method: 'POST',
        body: { permissionId },
      }),
    }),
  }),
});

export const {
  // Role queries
  useGetRolesQuery,
  useGetActiveRolesQuery,
  useGetRoleCountQuery,
  useGetRoleByIdQuery,
  useGetRoleByNameQuery,

  // Role mutations
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,

  // Permission queries
  useGetPermissionsQuery,
  useGetPermissionByIdQuery,
  useGetPermissionByNameQuery,
  useGetPermissionCountQuery,
  useSearchPermissionsQuery,

  // Permission management mutations
  useAddPermissionMutation,
  useRemovePermissionMutation,
  useCheckPermissionMutation,
} = roleApi;
