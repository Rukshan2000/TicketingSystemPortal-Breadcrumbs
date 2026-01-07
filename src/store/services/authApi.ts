import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '..';
import { setAccessToken } from '../features/authSlice';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface LoginRequest {
  email?: string;
  username?: string;
  password: string;
  type: 'app' | 'portal';
}

export interface RegisterRequest {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: number;
      username: string;
      email: string;
      first_name: string;
      last_name: string;
      role: string;
      status: string;
      phone?: string;
      department?: string;
      is_verified: boolean;
      last_login?: string;
      created_at: string;
      updated_at: string;
    };
    tokens: {
      accessToken: string;
      refreshToken: string;
      expiresAt: string;
      tokenType: string;
    };
  };
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    username: string;
    email: string;
  };
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    expiresAt: string;
    tokenType: string;
  };
}

export interface VerifyTokenRequest {
  accessToken: string;
}

export interface VerifyTokenResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: number;
      username: string;
      email: string;
      role: string;
    };
    tokenExpiry: string;
  };
}

export interface LogoutRequest {
  accessToken: string;
}

export interface LogoutResponse {
  success: boolean;
  message: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
}

export const authApi = createApi({
  reducerPath: 'authApi',
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
  endpoints: (builder) => ({
    // Login endpoint
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),

    // Register endpoint
    register: builder.mutation<RegisterResponse, RegisterRequest>({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
    }),

    // Refresh token endpoint
    refreshToken: builder.mutation<RefreshTokenResponse, RefreshTokenRequest>({
      query: (body) => ({
        url: '/auth/refresh-token',
        method: 'POST',
        body,
      }),
    }),

    // Verify token endpoint
    verifyToken: builder.mutation<VerifyTokenResponse, VerifyTokenRequest>({
      query: (body) => ({
        url: '/auth/verify-token',
        method: 'POST',
        body,
      }),
    }),

    // Logout endpoint
    logout: builder.mutation<LogoutResponse, LogoutRequest>({
      query: (body) => ({
        url: '/auth/logout',
        method: 'POST',
        body,
      }),
    }),

    // Change password endpoint
    changePassword: builder.mutation<
      ChangePasswordResponse,
      { userId: number; data: ChangePasswordRequest }
    >({
      query: ({ userId, data }) => ({
        url: `/auth/change-password/${userId}`,
        method: 'POST',
        body: data,
      }),
    }),

    // Logout all devices endpoint
    logoutAllDevices: builder.mutation<LogoutResponse, { userId: number }>({
      query: ({ userId }) => ({
        url: `/auth/logout-all/${userId}`,
        method: 'POST',
        body: { userId },
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useRefreshTokenMutation,
  useVerifyTokenMutation,
  useLogoutMutation,
  useChangePasswordMutation,
  useLogoutAllDevicesMutation,
} = authApi;
