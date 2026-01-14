import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '..';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// =====================
// TYPE DEFINITIONS
// =====================

export interface Conversation {
  id: number;
  user_id: number;
  customer_id: number;
  ticket_id?: number | null;
  subject?: string;
  status: 'OPEN' | 'CLOSED' | 'ON_HOLD';
  assigned_to?: number | null;
  created_at: string;
  updated_at?: string;
  closed_at?: string | null;
  // Joined fields from user/customer
  first_name?: string;
  last_name?: string;
  unread_count?: number;
  last_message?: string;
  last_message_at?: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_name?: string;
  sender_type: 'USER' | 'ADMIN' | 'SYSTEM';
  message: string;
  is_read: boolean;
  created_at: string;
  updated_at?: string;
}

// =====================
// REQUEST INTERFACES
// =====================

export interface CreateConversationRequest {
  user_id: number;
  customer_id: number;
  ticket_id?: number;
  subject?: string;
}

export interface AddMessageRequest {
  sender_id: number;
  message: string;
  sender_type?: 'USER' | 'ADMIN' | 'SYSTEM';
}

export interface AssignConversationRequest {
  admin_id: number;
}

export interface GetConversationParams {
  conversationId: number;
  limit?: number;
  offset?: number;
}

export interface GetAdminConversationsParams {
  limit?: number;
  offset?: number;
}

export interface SearchMessagesParams {
  conversationId: number;
  query: string;
}

// =====================
// RESPONSE INTERFACES
// =====================

export interface CreateConversationResponse {
  success: boolean;
  data: Conversation;
}

export interface GetConversationResponse {
  success: boolean;
  data: {
    conversation: Conversation;
    messages: Message[];
    pagination: {
      limit: number;
      offset: number;
    };
  };
}

export interface GetUserConversationsResponse {
  success: boolean;
  data: Conversation[];
}

export interface GetAdminConversationsResponse {
  success: boolean;
  data: Conversation[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

export interface AddMessageResponse {
  success: boolean;
  data: Message;
}

export interface AssignConversationResponse {
  success: boolean;
  data: Conversation;
}

export interface CloseConversationResponse {
  success: boolean;
  data: Conversation;
}

export interface SearchMessagesResponse {
  success: boolean;
  data: Message[];
}

// =====================
// API DEFINITION
// =====================

export const chatApi = createApi({
  reducerPath: 'chatApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState;
      const token = state.auth?.tokens?.accessToken;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Conversations', 'Messages'],
  endpoints: (builder) => ({
    // Create a new conversation
    createConversation: builder.mutation<CreateConversationResponse, CreateConversationRequest>({
      query: (data) => ({
        url: '/conversations',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Conversations'],
    }),

    // Get conversation by ID with messages
    getConversation: builder.query<GetConversationResponse, GetConversationParams>({
      query: ({ conversationId, limit = 50, offset = 0 }) => ({
        url: `/conversations/${conversationId}`,
        params: { limit, offset },
      }),
      providesTags: (result, error, { conversationId }) => [
        { type: 'Conversations', id: conversationId },
        { type: 'Messages', id: conversationId },
      ],
    }),

    // Get user's conversations
    getUserConversations: builder.query<GetUserConversationsResponse, number>({
      query: (userId) => `/conversations/user/${userId}`,
      providesTags: ['Conversations'],
    }),

    // Get admin conversations (all conversations with pagination)
    getAdminConversations: builder.query<GetAdminConversationsResponse, GetAdminConversationsParams>({
      query: ({ limit = 50, offset = 0 }) => ({
        url: '/conversations/admin',
        params: { limit, offset },
      }),
      providesTags: ['Conversations'],
    }),

    // Add message to conversation
    addMessage: builder.mutation<AddMessageResponse, { conversationId: number; data: AddMessageRequest }>({
      query: ({ conversationId, data }) => ({
        url: `/conversations/${conversationId}/messages`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { conversationId }) => [
        { type: 'Messages', id: conversationId },
        'Conversations',
      ],
    }),

    // Assign conversation to admin
    assignConversation: builder.mutation<AssignConversationResponse, { conversationId: number; data: AssignConversationRequest }>({
      query: ({ conversationId, data }) => ({
        url: `/conversations/${conversationId}/assign`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { conversationId }) => [
        { type: 'Conversations', id: conversationId },
      ],
    }),

    // Close conversation
    closeConversation: builder.mutation<CloseConversationResponse, number>({
      query: (conversationId) => ({
        url: `/conversations/${conversationId}/close`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, conversationId) => [
        { type: 'Conversations', id: conversationId },
        'Conversations',
      ],
    }),

    // Search messages in conversation
    searchMessages: builder.query<SearchMessagesResponse, SearchMessagesParams>({
      query: ({ conversationId, query }) => ({
        url: `/conversations/${conversationId}/search`,
        params: { q: query },
      }),
    }),

    // Mark messages as read
    markMessagesAsRead: builder.mutation<{ success: boolean }, number>({
      query: (conversationId) => ({
        url: `/conversations/${conversationId}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, conversationId) => [
        { type: 'Messages', id: conversationId },
        'Conversations',
      ],
    }),
  }),
});

// Export hooks for usage in components
export const {
  useCreateConversationMutation,
  useGetConversationQuery,
  useGetUserConversationsQuery,
  useGetAdminConversationsQuery,
  useAddMessageMutation,
  useAssignConversationMutation,
  useCloseConversationMutation,
  useSearchMessagesQuery,
  useMarkMessagesAsReadMutation,
} = chatApi;
