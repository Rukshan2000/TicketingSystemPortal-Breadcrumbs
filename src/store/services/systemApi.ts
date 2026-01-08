import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '..';
import type {
  System,
  CreateSystemRequest,
  UpdateSystemRequest,
  GetSystemsResponse,
  GetSystemResponse,
  CreateSystemResponse,
  UpdateSystemResponse,
  DeleteSystemResponse,
} from '@/types/system';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const systemApi = createApi({
  reducerPath: 'systemApi',
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
  tagTypes: ['System'],
  endpoints: (builder) => ({
    // Get all systems
    getSystems: builder.query<GetSystemsResponse, void>({
      query: () => '/systems',
      providesTags: ['System'],
    }),

    // Get system by ID
    getSystem: builder.query<GetSystemResponse, number>({
      query: (id) => `/systems/${id}`,
      providesTags: (result, error, id) => [{ type: 'System', id }],
    }),

    // Create new system
    createSystem: builder.mutation<CreateSystemResponse, CreateSystemRequest>({
      query: (systemData) => {
        return {
          url: '/systems',
          method: 'POST',
          body: systemData,
        };
      },
      invalidatesTags: ['System'],
    }),

    // Update system
    updateSystem: builder.mutation<UpdateSystemResponse, { id: number; data: UpdateSystemRequest }>({
      query: ({ id, data }) => {
        return {
          url: `/systems/${id}`,
          method: 'PUT',
          body: data,
        };
      },
      invalidatesTags: (result, error, { id }) => [{ type: 'System', id }, 'System'],
    }),

    // Delete system
    deleteSystem: builder.mutation<DeleteSystemResponse, number>({
      query: (id) => ({
        url: `/systems/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['System'],
    }),
  }),
});

export const {
  useGetSystemsQuery,
  useGetSystemQuery,
  useCreateSystemMutation,
  useUpdateSystemMutation,
  useDeleteSystemMutation,
} = systemApi;