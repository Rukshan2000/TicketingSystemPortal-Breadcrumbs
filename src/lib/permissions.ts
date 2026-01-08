/**
 * Permission utility functions for checking user permissions
 */

export interface Permission {
  id: number;
  name: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  type: string;
  permissions: Permission[];
}

/**
 * Get user from local storage
 */
export const getStoredUser = (): User | null => {
  if (typeof window === 'undefined') return null;

  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

/**
 * Check if user has a specific permission
 * @param permissionName - The permission name to check (e.g., "create ticket")
 * @returns boolean
 */
export const hasPermission = (permissionName: string): boolean => {
  const user = getStoredUser();

  if (!user || !user.permissions) {
    return false;
  }

  return user.permissions.some(
    permission => permission.name.toLowerCase() === permissionName.toLowerCase()
  );
};

/**
 * Check if user has multiple permissions (all required)
 * @param permissionNames - Array of permission names
 * @returns boolean
 */
export const hasAllPermissions = (permissionNames: string[]): boolean => {
  return permissionNames.every(permission => hasPermission(permission));
};

/**
 * Check if user has at least one permission
 * @param permissionNames - Array of permission names
 * @returns boolean
 */
export const hasAnyPermission = (permissionNames: string[]): boolean => {
  return permissionNames.some(permission => hasPermission(permission));
};

/**
 * Check if user has admin role
 * @returns boolean
 */
export const isAdmin = (): boolean => {
  const user = getStoredUser();
  return user?.role === 'admin';
};

/**
 * Check if user has specific role
 * @param role - The role to check
 * @returns boolean
 */
export const hasRole = (role: string): boolean => {
  const user = getStoredUser();
  return user?.role === role;
};