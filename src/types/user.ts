// User Roles
export type UserRole = 'user' | 'moderator' | 'admin';

// User Status
export type UserStatus = 'active' | 'inactive' | 'suspended';

// User Metadata
export interface UserMetadata {
  bio?: string;
  profileImage?: string;
  address?: string;
  city?: string;
  country?: string;
}

// Main User Interface
export interface IUser {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  department?: string;
  isVerified: boolean;
  lastLogin?: string | null;
  fullName: string;
  metadata?: UserMetadata;
  createdAt: string;
  updatedAt: string;
}

// API Request/Response Types
export interface IUserListQuery {
  page?: number;
  limit?: number;
  role?: UserRole;
  status?: UserStatus;
  search?: string;
}

export interface IUserListResponse {
  success: boolean;
  total: number;
  page: number;
  limit: number;
  pages: number;
  data: IUser[];
}

export interface IUserDetailResponse {
  success: boolean;
  data: IUser;
}

export interface ICreateUserPayload {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  phone?: string;
  role?: UserRole;
  department?: string;
  metadata?: UserMetadata;
}

export interface IUpdateUserPayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role?: UserRole;
  status?: UserStatus;
  department?: string;
  isVerified?: boolean;
  metadata?: UserMetadata;
}

export interface IUpdatePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

// Form validation schemas
export const USER_ROLES: UserRole[] = ['user', 'moderator', 'admin'];
export const USER_STATUSES: UserStatus[] = ['active', 'inactive', 'suspended'];

export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  user: 'User',
  moderator: 'Moderator',
  admin: 'Administrator',
};

export const STATUS_DISPLAY_NAMES: Record<UserStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  suspended: 'Suspended',
};
