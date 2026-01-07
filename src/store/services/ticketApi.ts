import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '..';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Ticket interface matching the Support Tickets API spec
export interface Ticket {
  id: number;
  customer_id: number;
  subject: string;
  description: string;
  category: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  product_id?: number | null;
  order_id?: string | null;
  attachments?: any[];
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  created_at: string;
  updated_at: string;
}

// Request interfaces
export interface CreateTicketRequest {
  customer_id: number;
  subject: string;
  description: string;
  category: string;
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  product_id?: number;
  order_id?: string;
  attachments?: any[];
  status?: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
}

export interface UpdateTicketRequest {
  subject?: string;
  description?: string;
  category?: string;
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  product_id?: number;
  order_id?: string;
  status?: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
}

// Response interfaces
export interface GetTicketsResponse {
  success: boolean;
  data: Ticket[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

export interface GetTicketResponse {
  success: boolean;
  data: Ticket;
}

export interface GetTicketCountResponse {
  success: boolean;
  data: {
    count: number;
  };
}

export interface GetTicketByTraceResponse {
  success: boolean;
  data: Ticket;
}

export interface CreateTicketResponse {
  success: boolean;
  data: Ticket;
}

export interface UpdateTicketResponse {
  success: boolean;
  data: Ticket;
}

export interface DeleteTicketResponse {
  success: boolean;
  message: string;
}

export interface SearchTicketsByDateRangeResponse {
  success: boolean;
  data: Ticket[];
  pagination?: {
    limit?: number;
    offset?: number;
    total?: number;
  };
}

export interface ReprintRequest {
  ticket_id: number;
  trace_no: string;
  reason: string;
  requested_copies?: number;
  notes?: string;
}

export interface ReprintResponse {
  success: boolean;
  message: string;
  data?: {
    request_id: string;
    status: string;
  };
}

// Helper function to normalize ticket data
const normalizeTicket = (ticket: any): Ticket => ({
  ...ticket,
  customer_id: ticket.customer_id,
  subject: ticket.subject,
  description: ticket.description,
  category: ticket.category,
  priority: ticket.priority || 'Medium',
  product_id: ticket.product_id,
  order_id: ticket.order_id,
  attachments: ticket.attachments || [],
  status: ticket.status || 'Open',
  created_at: ticket.created_at,
  updated_at: ticket.updated_at,
});

const normalizeTickets = (tickets: any[]): Ticket[] =>
  tickets.map(normalizeTicket);

export const ticketApi = createApi({
  reducerPath: 'ticketApi',
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
  tagTypes: ['Ticket'],
  endpoints: (builder) => ({
    // Get all tickets with pagination
    getTickets: builder.query<GetTicketsResponse, { limit?: number; offset?: number }>({
      query: ({ limit = 10, offset = 0 }) => `/tickets?limit=${limit}&offset=${offset}`,
      transformResponse: (response: GetTicketsResponse) => ({
        ...response,
        data: normalizeTickets(response.data),
      }),
      providesTags: ['Ticket'],
    }),

    // Get ticket count
    getTicketCount: builder.query<GetTicketCountResponse, void>({
      query: () => '/tickets/count',
      providesTags: ['Ticket'],
    }),

    // Get ticket by ID
    getTicketById: builder.query<GetTicketResponse, number>({
      query: (ticketId) => `/tickets/${ticketId}`,
      transformResponse: (response: GetTicketResponse) => ({
        ...response,
        data: normalizeTicket(response.data),
      }),
      providesTags: (result, error, id) => [{ type: 'Ticket', id }],
    }),

    // Search tickets by filters
    searchTickets: builder.query<
      GetTicketsResponse,
      { customer_id?: number; status?: string; category?: string; priority?: string; limit?: number; offset?: number }
    >({
      query: ({ customer_id, status, category, priority, limit = 10, offset = 0 }) => {
        const params = new URLSearchParams();
        if (customer_id) params.append('customer_id', customer_id.toString());
        if (status) params.append('status', status);
        if (category) params.append('category', category);
        if (priority) params.append('priority', priority);
        params.append('limit', limit.toString());
        params.append('offset', offset.toString());
        return `/tickets/search/filters?${params.toString()}`;
      },
      transformResponse: (response: GetTicketsResponse) => ({
        ...response,
        data: normalizeTickets(response.data),
      }),
      providesTags: ['Ticket'],
    }),

    // Get tickets by customer
    getTicketsByCustomer: builder.query<
      GetTicketsResponse,
      { customer_id: number; limit?: number; offset?: number }
    >({
      query: ({ customer_id, limit = 500, offset = 0 }) => `/tickets/by-customer/search?customer_id=${customer_id}&limit=${limit}&offset=${offset}`,
      transformResponse: (response: GetTicketsResponse) => ({
        ...response,
        data: normalizeTickets(response.data),
      }),
      providesTags: ['Ticket'],
    }),

    // Create ticket with FormData support
    createTicket: builder.mutation<CreateTicketResponse, FormData | CreateTicketRequest>({
      query: (ticketData) => {
        // Check if it's FormData
        if (ticketData instanceof FormData) {
          return {
            url: '/tickets',
            method: 'POST',
            body: ticketData,
            formData: true,
          };
        }
        // JSON payload
        return {
          url: '/tickets',
          method: 'POST',
          body: ticketData,
        };
      },
      transformResponse: (response: CreateTicketResponse) => ({
        ...response,
        data: normalizeTicket(response.data),
      }),
      invalidatesTags: ['Ticket'],
    }),

    // Update ticket
    updateTicket: builder.mutation<
      UpdateTicketResponse,
      { ticketId: number; data: UpdateTicketRequest }
    >({
      query: ({ ticketId, data }) => ({
        url: `/tickets/${ticketId}`,
        method: 'PUT',
        body: data,
      }),
      transformResponse: (response: UpdateTicketResponse) => ({
        ...response,
        data: normalizeTicket(response.data),
      }),
      invalidatesTags: (result, error, { ticketId }) => [
        { type: 'Ticket', id: ticketId },
        'Ticket',
      ],
    }),

    // Delete ticket
    deleteTicket: builder.mutation<DeleteTicketResponse, number>({
      query: (ticketId) => ({
        url: `/tickets/${ticketId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Ticket'],
    }),
  }),
});

export const {
  useGetTicketsQuery,
  useGetTicketCountQuery,
  useGetTicketByIdQuery,
  useSearchTicketsQuery,
  useGetTicketsByCustomerQuery,
  useCreateTicketMutation,
  useUpdateTicketMutation,
  useDeleteTicketMutation,
} = ticketApi;
