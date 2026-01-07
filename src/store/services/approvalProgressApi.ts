import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '..';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// ============ Interfaces ============

export interface WorkflowProgressItem {
  stage_name: string;
  status: 'complete' | 'pending' | 'rejected';
}

export interface ApprovalProgressSummary {
  id: number;
  reprint_request_id?: number;
  ticket_id?: number;
  trace_no: string;
  workflow_name: string;
  workflow_id: number;
  node_id: number;
  node_name: string;
  node_order: number;
  approval_type: 'ALL' | 'ANY';
  current_node_order: number;
  status: 'PENDING' | 'COMPLETED' | 'REJECTED' | 'IN_PROGRESS' | 'PARTIALLY_COMPLETED';
  approval_status: string;
  reason?: string;
  requested_copies?: number;
  comments: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  workflow_progress?: WorkflowProgressItem[];
}

export interface Approval {
  user_id: number;
  user_name: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  comments: string | null;
  action_at: string | null;
  created_at: string;
}

export interface ApprovalStep {
  node_id: number;
  node_name: string;
  node_order: number;
  description?: string;
  approval_type: 'ALL' | 'ANY';
  status: 'IN_PROGRESS' | 'PENDING' | 'COMPLETED' | 'PARTIALLY_COMPLETED';
  statistics?: {
    total_approvers: number;
    approved: number;
    rejected: number;
    pending: number;
    approval_percentage: number;
  };
  approvals: Approval[];
}

export interface TicketApprovalProgress {
  ticket_id: number;
  trace_no?: string;
  ticket_date?: string;
  location?: string;
  workflow_name: string;
  workflow_status?: 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
  overall_status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
  current_step?: number;
  current_node_order?: number;
  total_steps?: number;
  created_at?: string;
  steps?: ApprovalStep[];
  nodes?: ApprovalStep[];
  completion_percentage?: number;
  overall_progress_percentage?: number;
  workflow_progress?: WorkflowProgressItem[];
}

export interface ReprintRequestApprovalProgress {
  item_id: number;
  item_type: string;
  item_title: string;
  workflow_id: number;
  workflow_name: string;
  overall_status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
  current_node_order: number;
  nodes: ApprovalStep[];
  overall_progress_percentage: number;
  workflow_progress?: WorkflowProgressItem[];
  created_at: string;
  updated_at: string;
}

export interface ApprovalProgressResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

// ============ API ============

export const approvalProgressApi = createApi({
  reducerPath: 'approvalProgressApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState;
      const tokens = state.auth.tokens;
      if (tokens) {
        headers.set('Authorization', `Bearer ${tokens.accessToken}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    // Get approval progress for a specific ticket
    getTicketApprovalProgress: builder.query<
      ApprovalProgressResponse<TicketApprovalProgress>,
      number
    >({
      query: (ticketId) => `/approvals/progress/ticket/${ticketId}`,
    }),

    // Get approval progress for a specific reprint request
    getReprintRequestApprovalProgress: builder.query<
      ApprovalProgressResponse<ReprintRequestApprovalProgress>,
      number
    >({
      query: (reprintRequestId) => `/approvals/progress/reprint-request/${reprintRequestId}`,
    }),

    // Get approval progress summary for all items
    getApprovalProgressSummary: builder.query<
      ApprovalProgressResponse<ApprovalProgressSummary[]>,
      {
        type?: 'ticket' | 'reprint_request';
        limit?: number;
        offset?: number;
      }
    >({
      query: ({ type = 'ticket', limit = 10, offset = 0 }) => {
        const params = new URLSearchParams();
        if (type) params.append('type', type);
        if (limit) params.append('limit', limit.toString());
        if (offset) params.append('offset', offset.toString());
        return `/approvals/progress/summary?${params.toString()}`;
      },
    }),

    // Get approval progress summary with pagination support
    getApprovalProgressList: builder.query<
      ApprovalProgressResponse<ApprovalProgressSummary[]>,
      {
        type: 'ticket' | 'reprint_request';
        page?: number;
        pageSize?: number;
      }
    >({
      query: ({ type, page = 1, pageSize = 10 }) => {
        const offset = (page - 1) * pageSize;
        const endpoint = type === 'reprint_request' 
          ? `/approvals/progress/reprint-request?limit=${pageSize}&offset=${offset}`
          : `/approvals/progress/ticket?limit=${pageSize}&offset=${offset}`;
        console.log('📡 Fetching approval progress from:', `${API_BASE_URL}${endpoint}`);
        return endpoint;
      },
    }),

    // Get approval progress summary filtered by customer_id
    getApprovalProgressSummaryByCustomer: builder.query<
      ApprovalProgressResponse<ApprovalProgressSummary[]>,
      {
        customer_id: number;
        type?: 'ticket' | 'reprint_request';
        limit?: number;
        offset?: number;
      }
    >({
      query: ({ customer_id, type = 'ticket', limit = 100, offset = 0 }) => {
        const params = new URLSearchParams();
        params.append('type', type);
        params.append('customer_id', customer_id.toString());
        params.append('limit', limit.toString());
        params.append('offset', offset.toString());
        return `/approvals/progress/summary?${params.toString()}`;
      },
    }),
  }),
});

export const {
  useGetTicketApprovalProgressQuery,
  useGetReprintRequestApprovalProgressQuery,
  useGetApprovalProgressSummaryQuery,
  useGetApprovalProgressListQuery,
  useGetApprovalProgressSummaryByCustomerQuery,
} = approvalProgressApi;
