import { useCallback, useEffect, useState } from 'react';
import {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  type User,
  type GetUsersResponse,
} from '@/store/services/userApi';

/**
 * Hook for fetching users with caching and error handling
 */
export const useFetchUsers = (params?: { limit?: number; offset?: number }) => {
  const { data, isLoading, error, refetch } = useGetUsersQuery(params || {});

  return {
    users: data?.data || [],
    total: data?.pagination?.total || 0,
    isLoading,
    error,
    refetch,
  };
};

/**
 * Hook for fetching a single user by ID
 */
export const useFetchUserById = (userId: number, options?: { skip?: boolean }) => {
  const { data, isLoading, error, refetch } = useGetUserByIdQuery(userId, { skip: options?.skip });

  return {
    user: data?.data,
    isLoading,
    error,
    refetch,
  };
};

/**
 * Hook for creating a new user
 */
export const useCreateUserHandler = () => {
  const [createUser, { isLoading, error, isSuccess }] = useCreateUserMutation();
  const [user, setUser] = useState<User | null>(null);

  const handleCreate = useCallback(
    async (userData: any) => {
      try {
        const response = await createUser(userData).unwrap();
        setUser(response.data);
        return response.data;
      } catch (err) {
        console.error('Failed to create user:', err);
        throw err;
      }
    },
    [createUser]
  );

  return {
    handleCreate,
    user,
    isLoading,
    error,
    isSuccess,
  };
};

/**
 * Hook for updating user information
 */
export const useUpdateUserHandler = () => {
  const [updateUser, { isLoading, error, isSuccess }] = useUpdateUserMutation();
  const [user, setUser] = useState<User | null>(null);

  const handleUpdate = useCallback(
    async (userId: number, data: any) => {
      try {
        const response = await updateUser({ userId, data }).unwrap();
        setUser(response.data);
        return response.data;
      } catch (err) {
        console.error('Failed to update user:', err);
        throw err;
      }
    },
    [updateUser]
  );

  return {
    handleUpdate,
    user,
    isLoading,
    error,
    isSuccess,
  };
};

/**
 * Hook for deleting a user
 */
export const useDeleteUserHandler = () => {
  const [deleteUser, { isLoading, error, isSuccess }] = useDeleteUserMutation();

  const handleDelete = useCallback(
    async (userId: number) => {
      try {
        const response = await deleteUser(userId).unwrap();
        return response;
      } catch (err) {
        console.error('Failed to delete user:', err);
        throw err;
      }
    },
    [deleteUser]
  );

  return {
    handleDelete,
    isLoading,
    error,
    isSuccess,
  };
};

/**
 * Combined hook for managing multiple user operations
 */
export const useUserManagement = (userId?: number) => {
  const fetchAll = useFetchUsers();
  const fetchOne = useFetchUserById(userId ?? 0, { skip: !userId });
  const create = useCreateUserHandler();
  const update = useUpdateUserHandler();
  const deleteUser = useDeleteUserHandler();

  return {
    // Read operations
    users: fetchAll.users,
    total: fetchAll.total,
    isLoadingUsers: fetchAll.isLoading,
    user: userId ? fetchOne.user : undefined,
    isLoadingUser: userId ? fetchOne.isLoading : false,

    // Write operations
    create,
    update,
    deleteUser,

    // Refetch
    refetchUsers: fetchAll.refetch,
    refetchUser: userId ? fetchOne.refetch : undefined,
  };
};
