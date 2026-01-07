import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '..';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// ============ Interfaces ============

// Workflow
export interface Workflow {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  nodes?: WorkflowNode[];
}

// Workflow Node
export interface WorkflowNode {
  id: number;
  workflow_id: number;
  name: string;
  node_order: number;
  approval_type: 'ALL' | 'ANY';
  description: string | null;
  created_at: string;
  updated_at: string;
  users?: WorkflowNodeUser[];
}

// Workflow Node User
export interface WorkflowNodeUser {
  id: number;
  node_id: number;
  user_id: number;
  created_at: string;
  // Joined user info
  user_name?: string;
  user_email?: string;
}

// Ticket Approval
export interface TicketApproval {
  id: number;
  ticket_id: number;
  node_id: number;
  user_id: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  comments: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined info
  node_name?: string;
  node_order?: number;
  user_name?: string;
}

// Pending Approval Item
export interface PendingApproval {
  ticket_id: number;
  trace_no: string;
  ticket_date: string;
  ticket_time: string;
  location: string;
  total_amount: number;
  node_id: number;
  node_name: string;
  node_order: number;
  approval_type: 'ALL' | 'ANY';
  workflow_name: string;
  created_by_name?: string;
  created_at: string;
}

// ============ Request Interfaces ============

export interface CreateWorkflowRequest {
  name: string;
  description?: string;
  is_active?: boolean;
}

export interface UpdateWorkflowRequest {
  name?: string;
  description?: string;
  is_active?: boolean;
}

export interface CreateNodeRequest {
  name: string;
  node_order: number;
  approval_type: 'ALL' | 'ANY';
  description?: string;
  user_ids?: number[];
}

export interface UpdateNodeRequest {
  name?: string;
  approval_type?: 'ALL' | 'ANY';
  description?: string;
}

export interface ReorderNodesRequest {
  node_orders: Array<{ id: number; node_order: number }>;
}

export interface SetNodeUsersRequest {
  user_ids: number[];
}

export interface InitializeWorkflowRequest {
  workflow_id: number;
}

export interface ApproveTicketRequest {
  user_id: number;
  action: 'APPROVE' | 'REJECT';
  comments?: string;
}

// ============ Response Interfaces ============

export interface GetWorkflowsResponse {
  success: boolean;
  data: Workflow[];
  pagination?: {
    limit: number;
    offset: number;
    total: number;
  };
}

export interface GetWorkflowResponse {
  success: boolean;
  data: Workflow;
}

export interface CreateWorkflowResponse {
  success: boolean;
  data: Workflow;
  message: string;
}

export interface UpdateWorkflowResponse {
  success: boolean;
  data: Workflow;
  message: string;
}

export interface DeleteWorkflowResponse {
  success: boolean;
  message: string;
}

export interface GetNodesResponse {
  success: boolean;
  data: WorkflowNode[];
}

export interface GetNodeResponse {
  success: boolean;
  data: WorkflowNode;
}

export interface CreateNodeResponse {
  success: boolean;
  data: WorkflowNode;
  message: string;
}

export interface UpdateNodeResponse {
  success: boolean;
  data: WorkflowNode;
  message: string;
}

export interface DeleteNodeResponse {
  success: boolean;
  message: string;
}

export interface ReorderNodesResponse {
  success: boolean;
  message: string;
}

export interface GetNodeUsersResponse {
  success: boolean;
  data: WorkflowNodeUser[];
}

export interface SetNodeUsersResponse {
  success: boolean;
  data: WorkflowNodeUser[];
  message: string;
}

export interface RemoveNodeUserResponse {
  success: boolean;
  message: string;
}

export interface InitializeWorkflowResponse {
  success: boolean;
  message: string;
  data: {
    ticket_id: number;
    workflow_id: number;
    current_node_order: number;
    approval_status: string;
  };
}

export interface GetPendingApprovalsResponse {
  success: boolean;
  data: PendingApproval[];
  pagination?: {
    limit: number;
    offset: number;
    total: number;
  };
}

export interface ApproveTicketResponse {
  success: boolean;
  message: string;
  data: {
    approval_recorded: boolean;
    node_status: {
      approved_count: number;
      total_required: number;
      approval_type: 'ALL' | 'ANY';
    };
    moved_to_next_node: boolean;
    next_node?: {
      id: number;
      name: string;
      node_order: number;
    };
    ticket_status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  };
}

export interface GetTicketApprovalsResponse {
  success: boolean;
  data: {
    ticket_id: number;
    workflow_id: number;
    workflow_name: string;
    current_node_order: number;
    approval_status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NOT_REQUIRED';
    current_node?: {
      id: number;
      name: string;
      approval_type: 'ALL' | 'ANY';
      approved_count: number;
      total_required: number;
    };
    approvals: TicketApproval[];
    history: Array<{
      node_name: string;
      node_order: number;
      user_name: string;
      status: string;
      comments: string | null;
      approved_at: string;
    }>;
  };
}

// ============ API Slice ============

export const workflowApi = createApi({
  reducerPath: 'workflowApi',
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
  tagTypes: ['Workflow', 'WorkflowNode', 'NodeUser', 'Approval', 'PendingApproval'],
  endpoints: (builder) => ({
    // ============ Workflow Endpoints ============

    // Get all workflows
    getWorkflows: builder.query<GetWorkflowsResponse, { active?: boolean; limit?: number; offset?: number } | void>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.active !== undefined) queryParams.append('active', String(params.active));
        if (params?.limit) queryParams.append('limit', String(params.limit));
        if (params?.offset) queryParams.append('offset', String(params.offset));
        const queryString = queryParams.toString();
        return `/workflows${queryString ? `?${queryString}` : ''}`;
      },
      providesTags: ['Workflow'],
    }),

    // Get workflow by ID (includes nodes & users)
    getWorkflowById: builder.query<GetWorkflowResponse, number>({
      query: (id) => `/workflows/${id}`,
      providesTags: (result, error, id) => [
        { type: 'Workflow', id },
        'WorkflowNode',
        'NodeUser',
      ],
    }),

    // Create workflow
    createWorkflow: builder.mutation<CreateWorkflowResponse, CreateWorkflowRequest>({
      query: (data) => ({
        url: '/workflows',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Workflow'],
    }),

    // Update workflow
    updateWorkflow: builder.mutation<UpdateWorkflowResponse, { id: number; data: UpdateWorkflowRequest }>({
      query: ({ id, data }) => ({
        url: `/workflows/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Workflow', id }, 'Workflow'],
    }),

    // Delete workflow
    deleteWorkflow: builder.mutation<DeleteWorkflowResponse, number>({
      query: (id) => ({
        url: `/workflows/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Workflow'],
    }),

    // ============ Workflow Node Endpoints ============

    // Get nodes for workflow
    getWorkflowNodes: builder.query<GetNodesResponse, number>({
      query: (workflowId) => `/workflows/${workflowId}/nodes`,
      providesTags: (result, error, workflowId) => [
        { type: 'WorkflowNode', id: workflowId },
        'WorkflowNode',
      ],
    }),

    // Add node to workflow
    createWorkflowNode: builder.mutation<CreateNodeResponse, { workflowId: number; data: CreateNodeRequest }>({
      query: ({ workflowId, data }) => ({
        url: `/workflows/${workflowId}/nodes`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { workflowId }) => [
        { type: 'Workflow', id: workflowId },
        'WorkflowNode',
      ],
    }),

    // Update node
    updateWorkflowNode: builder.mutation<UpdateNodeResponse, { workflowId: number; nodeId: number; data: UpdateNodeRequest }>({
      query: ({ workflowId, nodeId, data }) => ({
        url: `/workflows/${workflowId}/nodes/${nodeId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { workflowId }) => [
        { type: 'Workflow', id: workflowId },
        'WorkflowNode',
      ],
    }),

    // Delete node
    deleteWorkflowNode: builder.mutation<DeleteNodeResponse, { workflowId: number; nodeId: number }>({
      query: ({ workflowId, nodeId }) => ({
        url: `/workflows/${workflowId}/nodes/${nodeId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { workflowId }) => [
        { type: 'Workflow', id: workflowId },
        'WorkflowNode',
      ],
    }),

    // Reorder nodes
    reorderWorkflowNodes: builder.mutation<ReorderNodesResponse, { workflowId: number; data: ReorderNodesRequest }>({
      query: ({ workflowId, data }) => ({
        url: `/workflows/${workflowId}/nodes/reorder`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { workflowId }) => [
        { type: 'Workflow', id: workflowId },
        'WorkflowNode',
      ],
    }),

    // ============ Node Users Endpoints ============

    // Get users for node
    getNodeUsers: builder.query<GetNodeUsersResponse, number>({
      query: (nodeId) => `/nodes/${nodeId}/users`,
      providesTags: (result, error, nodeId) => [{ type: 'NodeUser', id: nodeId }],
    }),

    // Add users to node
    addNodeUsers: builder.mutation<SetNodeUsersResponse, { nodeId: number; data: SetNodeUsersRequest }>({
      query: ({ nodeId, data }) => ({
        url: `/nodes/${nodeId}/users`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { nodeId }) => [
        { type: 'NodeUser', id: nodeId },
        'WorkflowNode',
        'Workflow',
      ],
    }),

    // Set users for node (replace all)
    setNodeUsers: builder.mutation<SetNodeUsersResponse, { nodeId: number; data: SetNodeUsersRequest }>({
      query: ({ nodeId, data }) => ({
        url: `/nodes/${nodeId}/users`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { nodeId }) => [
        { type: 'NodeUser', id: nodeId },
        'WorkflowNode',
        'Workflow',
      ],
    }),

    // Remove user from node
    removeNodeUser: builder.mutation<RemoveNodeUserResponse, { nodeId: number; userId: number }>({
      query: ({ nodeId, userId }) => ({
        url: `/nodes/${nodeId}/users/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { nodeId }) => [
        { type: 'NodeUser', id: nodeId },
        'WorkflowNode',
        'Workflow',
      ],
    }),

    // ============ Approval Endpoints ============

    // Get pending approvals for user
    getPendingApprovals: builder.query<GetPendingApprovalsResponse, { userId: number; limit?: number; offset?: number }>({
      query: ({ userId, limit, offset }) => {
        const queryParams = new URLSearchParams();
        queryParams.append('userId', String(userId));
        if (limit) queryParams.append('limit', String(limit));
        if (offset) queryParams.append('offset', String(offset));
        return `/approvals/pending?${queryParams.toString()}`;
      },
      providesTags: ['PendingApproval'],
    }),

    // Get tickets pending approval (for dashboard)
    getTicketsPendingApproval: builder.query<GetPendingApprovalsResponse, { userId: number; limit?: number; offset?: number }>({
      query: ({ userId, limit, offset }) => {
        const queryParams = new URLSearchParams();
        queryParams.append('userId', String(userId));
        if (limit) queryParams.append('limit', String(limit));
        if (offset) queryParams.append('offset', String(offset));
        return `/approvals/tickets/pending?${queryParams.toString()}`;
      },
      providesTags: ['PendingApproval'],
    }),

    // Initialize workflow for ticket
    initializeTicketWorkflow: builder.mutation<InitializeWorkflowResponse, { ticketId: number; data: InitializeWorkflowRequest }>({
      query: ({ ticketId, data }) => ({
        url: `/tickets/${ticketId}/workflow`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Approval', 'PendingApproval'],
    }),

    // Approve/Reject ticket
    approveTicket: builder.mutation<ApproveTicketResponse, { ticketId: number; data: ApproveTicketRequest }>({
      query: ({ ticketId, data }) => ({
        url: `/tickets/${ticketId}/approve`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Approval', 'PendingApproval'],
    }),

    // Get ticket approval status & history
    getTicketApprovals: builder.query<GetTicketApprovalsResponse, number>({
      query: (ticketId) => `/tickets/${ticketId}/approvals`,
      providesTags: (result, error, ticketId) => [{ type: 'Approval', id: ticketId }],
    }),

    // ============ Reprint Request Approval Endpoints ============

    // Initialize workflow for reprint request
    initializeReprintWorkflow: builder.mutation<InitializeWorkflowResponse, { reprintId: number; data: InitializeWorkflowRequest }>({
      query: ({ reprintId, data }) => ({
        url: `/reprint-requests/${reprintId}/workflow`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Approval', 'PendingApproval'],
    }),

    // Approve/Reject reprint request
    approveReprintRequest: builder.mutation<ApproveTicketResponse, { reprintId: number; data: ApproveTicketRequest }>({
      query: ({ reprintId, data }) => ({
        url: `/reprint-requests/${reprintId}/approve`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Approval', 'PendingApproval'],
    }),

    // Get reprint request approval status & history
    getReprintApprovals: builder.query<GetTicketApprovalsResponse, number>({
      query: (reprintId) => `/reprint-requests/${reprintId}/approvals`,
      providesTags: (result, error, reprintId) => [{ type: 'Approval', id: `reprint-${reprintId}` }],
    }),

    // Get pending reprint approvals for user
    getPendingReprintApprovals: builder.query<GetPendingApprovalsResponse, { userId: number; limit?: number; offset?: number }>({
      query: ({ userId, limit, offset }) => {
        const queryParams = new URLSearchParams();
        queryParams.append('userId', String(userId));
        if (limit) queryParams.append('limit', String(limit));
        if (offset) queryParams.append('offset', String(offset));
        return `/approvals/reprint-requests/pending?${queryParams.toString()}`;
      },
      providesTags: ['PendingApproval'],
    }),

    // Get pending ticket approvals for user
    getPendingTicketApprovals: builder.query<GetPendingApprovalsResponse, { userId: number; limit?: number; offset?: number }>({
      query: ({ userId, limit, offset }) => {
        const queryParams = new URLSearchParams();
        queryParams.append('userId', String(userId));
        if (limit) queryParams.append('limit', String(limit));
        if (offset) queryParams.append('offset', String(offset));
        return `/approvals/tickets/pending?${queryParams.toString()}`;
      },
      providesTags: ['PendingApproval'],
    }),
  }),
});

export const {
  // Workflow hooks
  useGetWorkflowsQuery,
  useGetWorkflowByIdQuery,
  useCreateWorkflowMutation,
  useUpdateWorkflowMutation,
  useDeleteWorkflowMutation,
  // Node hooks
  useGetWorkflowNodesQuery,
  useCreateWorkflowNodeMutation,
  useUpdateWorkflowNodeMutation,
  useDeleteWorkflowNodeMutation,
  useReorderWorkflowNodesMutation,
  // Node user hooks
  useGetNodeUsersQuery,
  useAddNodeUsersMutation,
  useSetNodeUsersMutation,
  useRemoveNodeUserMutation,
  // Ticket approval hooks
  useGetPendingApprovalsQuery,
  useGetTicketsPendingApprovalQuery,
  useInitializeTicketWorkflowMutation,
  useApproveTicketMutation,
  useGetTicketApprovalsQuery,
  // Reprint approval hooks
  useInitializeReprintWorkflowMutation,
  useApproveReprintRequestMutation,
  useGetReprintApprovalsQuery,
  useGetPendingReprintApprovalsQuery,
  useGetPendingTicketApprovalsQuery,
} = workflowApi;
