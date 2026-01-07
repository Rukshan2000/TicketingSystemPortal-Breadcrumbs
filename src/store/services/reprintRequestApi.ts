import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '..';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Reprint Request interface matching the API spec
export interface ReprintRequest {
  id: number;
  ticket_id: number;
  trace_no: string;
  reason: string;
  requested_copies: number;
  notes: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  requested_by: number;
  approved_by: number | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields from ticket
  ticket_date?: string;
  ticket_time?: string;
  terminal_id?: string;
  location?: string;
  total_amount?: number;
  no_tickets?: number;
  // Joined fields from user
  requested_by_name?: string;
  approved_by_name?: string;
}

// Request interfaces
export interface CreateReprintRequestInput {
  ticket_id: number;
  trace_no: string;
  reason: string;
  requested_copies?: number;
  notes?: string;
}

export interface UpdateReprintRequestInput {
  reason?: string;
  requested_copies?: number;
  notes?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'completed';
}

export interface UpdateStatusInput {
  status: 'pending' | 'approved' | 'rejected' | 'completed';
}

// Response interfaces
export interface GetReprintRequestsResponse {
  success: boolean;
  data: ReprintRequest[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

export interface GetReprintRequestResponse {
  success: boolean;
  data: ReprintRequest;
}

export interface GetReprintRequestCountResponse {
  success: boolean;
  data: {
    count: number;
  };
}

export interface CreateReprintRequestResponse {
  success: boolean;
  data: ReprintRequest;
  message: string;
}

export interface UpdateReprintRequestResponse {
  success: boolean;
  data: ReprintRequest;
  message: string;
}

export interface DeleteReprintRequestResponse {
  success: boolean;
  message: string;
}

// Helper function to normalize reprint request data
const normalizeReprintRequest = (request: any): ReprintRequest => ({
  ...request,
  total_amount: typeof request.total_amount === 'string' ? parseFloat(request.total_amount) : request.total_amount,
  requested_copies: typeof request.requested_copies === 'string' ? parseInt(request.requested_copies, 10) : request.requested_copies,
});

const normalizeReprintRequests = (requests: any[]): ReprintRequest[] =>
  requests.map(normalizeReprintRequest);

export const reprintRequestApi = createApi({
  reducerPath: 'reprintRequestApi',
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
  tagTypes: ['ReprintRequest'],
  endpoints: (builder) => ({
    // Get all reprint requests with pagination
    getReprintRequests: builder.query<GetReprintRequestsResponse, { limit?: number; offset?: number }>({
      query: ({ limit = 10, offset = 0 }) => `/reprint-requests?limit=${limit}&offset=${offset}`,
      transformResponse: (response: GetReprintRequestsResponse) => ({
        ...response,
        data: normalizeReprintRequests(response.data),
      }),
      providesTags: ['ReprintRequest'],
    }),

    // Get reprint request count
    getReprintRequestCount: builder.query<GetReprintRequestCountResponse, void>({
      query: () => '/reprint-requests/count',
      providesTags: ['ReprintRequest'],
    }),

    // Get reprint request by ID
    getReprintRequestById: builder.query<GetReprintRequestResponse, number>({
      query: (id) => `/reprint-requests/${id}`,
      transformResponse: (response: GetReprintRequestResponse) => ({
        ...response,
        data: normalizeReprintRequest(response.data),
      }),
      providesTags: (result, error, id) => [{ type: 'ReprintRequest', id }],
    }),

    // Get reprint requests by status
    getReprintRequestsByStatus: builder.query<GetReprintRequestsResponse, { status: string; limit?: number; offset?: number }>({
      query: ({ status, limit = 10, offset = 0 }) => `/reprint-requests/status/${status}?limit=${limit}&offset=${offset}`,
      transformResponse: (response: GetReprintRequestsResponse) => ({
        ...response,
        data: normalizeReprintRequests(response.data),
      }),
      providesTags: ['ReprintRequest'],
    }),

    // Get reprint requests by trace number
    getReprintRequestsByTraceNo: builder.query<GetReprintRequestsResponse, string>({
      query: (traceNo) => `/reprint-requests/trace/${traceNo}`,
      transformResponse: (response: GetReprintRequestsResponse) => ({
        ...response,
        data: normalizeReprintRequests(response.data),
      }),
      providesTags: ['ReprintRequest'],
    }),

    // Get reprint requests by ticket ID
    getReprintRequestsByTicketId: builder.query<GetReprintRequestsResponse, number>({
      query: (ticketId) => `/reprint-requests/ticket/${ticketId}`,
      transformResponse: (response: GetReprintRequestsResponse) => ({
        ...response,
        data: normalizeReprintRequests(response.data),
      }),
      providesTags: ['ReprintRequest'],
    }),

    // Create reprint request
    createReprintRequest: builder.mutation<CreateReprintRequestResponse, CreateReprintRequestInput>({
      query: (requestData) => ({
        url: '/reprint-requests',
        method: 'POST',
        body: requestData,
      }),
      invalidatesTags: ['ReprintRequest'],
    }),

    // Update reprint request
    updateReprintRequest: builder.mutation<
      UpdateReprintRequestResponse,
      { id: number; data: UpdateReprintRequestInput }
    >({
      query: ({ id, data }) => ({
        url: `/reprint-requests/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'ReprintRequest', id },
        'ReprintRequest',
      ],
    }),

    // Update reprint request status
    updateReprintRequestStatus: builder.mutation<
      UpdateReprintRequestResponse,
      { id: number; status: 'pending' | 'approved' | 'rejected' | 'completed' }
    >({
      query: ({ id, status }) => ({
        url: `/reprint-requests/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'ReprintRequest', id },
        'ReprintRequest',
      ],
    }),

    // Delete reprint request
    deleteReprintRequest: builder.mutation<DeleteReprintRequestResponse, number>({
      query: (id) => ({
        url: `/reprint-requests/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ReprintRequest'],
    }),
  }),
});

export const {
  useGetReprintRequestsQuery,
  useGetReprintRequestCountQuery,
  useGetReprintRequestByIdQuery,
  useGetReprintRequestsByStatusQuery,
  useGetReprintRequestsByTraceNoQuery,
  useGetReprintRequestsByTicketIdQuery,
  useCreateReprintRequestMutation,
  useUpdateReprintRequestMutation,
  useUpdateReprintRequestStatusMutation,
  useDeleteReprintRequestMutation,
} = reprintRequestApi;
